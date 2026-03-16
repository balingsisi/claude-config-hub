# tRPC Full-Stack Template

## Project Overview

End-to-end typesafe API layer built with tRPC, enabling seamless communication between TypeScript frontend and backend with automatic type inference.

## Tech Stack

- **API**: tRPC v11
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Validation**: Zod
- **Database**: Prisma + PostgreSQL
- **Auth**: NextAuth.js

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   └── trpc/
│   │       └── [trpc]/
│   │           └── route.ts    # tRPC handler
│   ├── layout.tsx
│   └── page.tsx
├── server/                 # Backend code
│   ├── routers/            # tRPC routers
│   │   ├── _app.ts         # Root router
│   │   ├── user.ts
│   │   ├── post.ts
│   │   └── auth.ts
│   ├── context.ts          # tRPC context
│   ├── trpc.ts             # tRPC setup
│   └── db.ts               # Prisma client
├── trpc/                   # Frontend tRPC
│   ├── client.ts           # tRPC client
│   ├── Provider.tsx        # tRPC Provider
│   └── react.tsx           # React hooks
├── lib/                    # Utilities
└── types/                  # TypeScript types
```

## Key Patterns

### 1. tRPC Router Setup

```typescript
// src/server/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure (requires auth)
export const protectedProcedure = t.procedure.use(
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({
      ctx: {
        session: ctx.session,
      },
    });
  })
);
```

### 2. Context Setup

```typescript
// src/server/context.ts
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from './db';

export async function createContext(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  return {
    req,
    session,
    prisma,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

### 3. Router Definition

```typescript
// src/server/routers/post.ts
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';

export const postRouter = router({
  // Get all posts
  list: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional(),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const posts = await ctx.prisma.post.findMany({
        take: input.limit ?? 10,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: { author: true },
      });
      
      return {
        posts,
        nextCursor: posts.length > 0 ? posts[posts.length - 1].id : undefined,
      };
    }),
  
  // Get single post
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.post.findUnique({
        where: { id: input.id },
        include: { author: true, comments: true },
      });
    }),
  
  // Create post (protected)
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.post.create({
        data: {
          title: input.title,
          content: input.content,
          authorId: ctx.session.user.id,
        },
      });
    }),
  
  // Update post (protected)
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      content: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      return ctx.prisma.post.update({
        where: { id },
        data,
      });
    }),
  
  // Delete post (protected)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.post.delete({
        where: { id: input.id },
      });
    }),
});
```

### 4. Root Router

```typescript
// src/server/routers/_app.ts
import { router } from '../trpc';
import { postRouter } from './post';
import { userRouter } from './user';
import { authRouter } from './auth';

export const appRouter = router({
  post: postRouter,
  user: userRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
```

### 5. API Route Handler

```typescript
// src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/_app';
import { createContext } from '@/server/context';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
```

### 6. Client Setup

```typescript
// src/trpc/client.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/routers/_app';

export const trpc = createTRPCReact<AppRouter>();
```

```tsx
// src/trpc/Provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './client';
import { useState } from 'react';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    })
  );
  
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### 7. Usage in Components

```tsx
// src/app/page.tsx
'use client';

import { trpc } from '@/trpc/client';

export default function HomePage() {
  const postsQuery = trpc.post.list.useQuery({ limit: 10 });
  const createPost = trpc.post.create.useMutation();
  
  const handleCreate = async () => {
    await createPost.mutateAsync({
      title: 'New Post',
      content: 'Content here',
    });
    postsQuery.refetch();
  };
  
  if (postsQuery.isLoading) return <div>Loading...</div>;
  if (postsQuery.error) return <div>Error: {postsQuery.error.message}</div>;
  
  return (
    <div>
      <button onClick={handleCreate}>Create Post</button>
      <ul>
        {postsQuery.data?.posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Best Practices

1. **Colocate Types**: Export types from routers, use in frontend
2. **Input Validation**: Always validate with Zod
3. **Error Handling**: Use TRPCError for consistent errors
4. **Middleware**: Create reusable middleware for auth, logging
5. **Batching**: Enable HTTP batching for performance

## Common Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Database migration
pnpm prisma migrate dev

# Type generation
pnpm prisma generate
```

## Deployment

Deploy like any Next.js app:
- Vercel (recommended)
- Docker
- Node.js server

## Resources

- [tRPC Documentation](https://trpc.io/)
- [tRPC with Next.js](https://trpc.io/docs/nextjs)
- [Awesome tRPC](https://github.com/trpc/awesome-trpc)
