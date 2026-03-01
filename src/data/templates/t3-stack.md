# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: T3 Stack Application
**Type**: Full-stack TypeScript Application
**Tech Stack**: Next.js + tRPC + Prisma + Tailwind
**Goal**: Type-safe full-stack development with end-to-end type safety

---

## The T3 Stack

The T3 Stack is a modern full-stack TypeScript framework focused on simplicity, type-safety, and developer experience.

### Stack Components

**T3 - The Three T's**:
1. **TypeScript** - End-to-end type safety
2. **tRPC** - End-to-end API types
3. **Tailwind** - Utility-first styling

**Plus**:
- **Next.js** - React framework with App Router
- **Prisma** - Type-safe ORM
- **NextAuth** - Authentication

---

## Architecture

### Folder Structure
```
src/
├── app/               # Next.js App Router
│   ├── api/          # API routes (if needed)
│   └── trpc/         # tRPC router (optional)
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── server/           # Backend code
│   ├── trpc/        # tRPC routers
│   ├── prisma/      # Prisma client
│   └── auth/        # NextAuth configuration
├── lib/             # Utility functions
├── prisma/          # Prisma schema
│   └── schema.prisma
└── types/           # Shared TypeScript types
```

### Data Flow

```
Client Component
    ↓ (tRPC call)
tRPC Router (Server)
    ↓ (Prisma call)
Database
    ↓
Response (with types)
    ↓
Client Component (fully typed)
```

---

## tRPC Best Practices

### Router Definition
```typescript
// server/trpc/routers/user.ts
import { z } from 'zod'
import { router, publicProcedure } from '../trpc'

export const userRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
      })
      return user
    }),

  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.create({
        data: input,
      })
      return user
    }),
})
```

### Client Usage
```typescript
// components/UserList.tsx
import { api } from '@/lib/trpc'

export function UserList() {
  const { data: users, isLoading } = api.user.getAll.useQuery()

  if (isLoading) return <div>Loading...</div>

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

### Type Safety
- **100% type safe** - No need for API response types
- **Autocomplete** - Full IDE support
- **Refactoring** - Changes propagate automatically

```typescript
// Types are automatically inferred!
const { data } = api.user.getById.useQuery({ id: '123' })
// data is of type: User | null

// No need for this:
interface User {
  id: string
  name: string
}
```

---

## Prisma Best Practices

### Schema Design
```prisma
// prisma/schema.prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}
```

### Client Usage
```typescript
// server/trpc/context.ts
import { prisma } from './prisma'

export const createContext = async () => {
  return {
    prisma,
    // Add other context (session, etc.)
  }
}

// Usage in router
export const appRouter = router({
  users: router({
    all: publicProcedure.query(async ({ ctx }) => {
      return ctx.prisma.user.findMany()
    }),
  }),
})
```

### Migration Workflow
```bash
pnpm prisma dev      # Start Prisma Studio (watch mode)
pnpm prisma studio   # Open Prisma Studio UI
pnpm prisma push     # Push schema changes to DB
pnpm prisma migrate  # Create and run migration
```

---

## TypeScript Configuration

### Strict Mode Setup
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["*.ts", "*.tsx"],
  "exclude": ["node_modules"]
}
```

### Shared Types
```typescript
// types/router.ts
import type { inferRouterOutputs, inferRouterInputs } from '../server/trpc'

export type RouterOutput = inferRouterOutputs<AppRouter>
export type RouterInput = inferRouterInputs<AppRouter>

// Usage
type UserOutput = RouterOutput['user']['getById']
type UserInput = RouterInput['user']['create']
```

---

## Authentication with NextAuth

### Setup
```typescript
// server/auth.ts
import { NextAuthOptions } from 'next-auth'
import Discord from 'next-auth/providers/discord'

export const authOptions: NextAuthOptions = {
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      return session
    },
  },
}
```

### tRPC Integration
```typescript
// server/trpc/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server'
import { CreateNextContextOptions } from '@trpc/server/adapters/next'
import { getServerSession } from 'next-auth'

export const createContext = async (opts: CreateNextContextOptions) => {
  const session = await getServerSession(authOptions)

  return {
    session,
    prisma,
  }
}

type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create()

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})
```

---

## Common Commands

### Development
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test         # Run tests
```

### Database
```bash
pnpm prisma dev          # Watch schema changes
pnpm prisma studio       # Open Prisma Studio
pnpm prisma push         # Push schema to DB
pnpm prisma migrate dev   # Create migration
pnpm prisma migrate deploy # Deploy migration
pnpm prisma generate      # Generate client
```

### tRPC
```bash
pnpm trpc:generate # Generate tRPC types (if needed)
```

---

## Important Prohibitions

### ❌ Never Do
- Don't bypass tRPC type safety with `any`
- Don't use raw SQL - use Prisma
- Don't forget to run migrations in production
- Don't commit `.env` files
- Don't use client-side secrets
- Don't ignore TypeScript errors
- Don't create circular dependencies in routers
- Don't forget to use `protectedProcedure` for auth routes

### ⚠️ Use with Caution
- `publicProcedure` - only for non-authenticated routes
- Prisma raw queries - only if absolutely necessary
- tRPC middlewares - can add complexity

---

## Best Practices

### Error Handling
```typescript
// ✅ Good - Use TRPCError
export const userRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      return user
    }),
})
```

### Validation with Zod
```typescript
// ✅ Always validate input
const createUserInput = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().min(18).optional(),
})

export const userRouter = router({
  create: publicProcedure
    .input(createUserInput)
    .mutation(async ({ ctx, input }) => {
      // input is fully typed!
      return ctx.prisma.user.create({ data: input })
    }),
})
```

### Code Organization
```typescript
// server/trpc/index.ts
import { router } from './trpc'
import { userRouter } from './routers/user'
import { postRouter } from './routers/post'

export const appRouter = router({
  user: userRouter,
  post: postRouter,
})

export type AppRouter = typeof appRouter
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Discord OAuth
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret

# App
NODE_ENV=development
```

---

## Compact Instructions

When using `/compact`, preserve:
- Router architecture changes
- Database schema modifications
- Type definitions
- Error handling patterns

Discard:
- Routine operations
- Development logs
- Verbose console output

---

**Last Updated**: 2026-03-01
