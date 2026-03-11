# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: SvelteKit Fullstack Application
**Type**: Modern Fullstack Web Application
**Tech Stack**: SvelteKit + TypeScript + Prisma + SQLite/PostgreSQL
**Goal**: Type-safe, performant fullstack application with SSR and edge deployment

---

## Tech Stack

### Core
- **Framework**: SvelteKit 2.x
- **Language**: TypeScript 5.x
- **Runtime**: Node.js 20+ / Edge Runtime
- **Build**: Vite 5.x

### Data Layer
- **ORM**: Prisma 5.x
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Validation**: Zod

### UI
- **Styling**: Tailwind CSS 3.x
- **Components**: shadcn-svelte
- **Icons**: lucide-svelte

### Development
- **Package Manager**: pnpm
- **Linting**: ESLint + Prettier
- **Testing**: Vitest + Playwright

---

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/              # shadcn-svelte components
│   │   └── shared/          # Shared components
│   ├── server/
│   │   ├── db.ts            # Prisma client
│   │   ├── auth.ts          # Authentication
│   │   └── api.ts           # API utilities
│   ├── utils/
│   │   ├── format.ts
│   │   └── validation.ts
│   ├── types/
│   │   └── index.ts
│   └── stores/
│       └── user.ts
├── routes/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   └── settings/
│   ├── api/
│   │   ├── users/
│   │   └── posts/
│   ├── +layout.svelte
│   ├── +layout.server.ts
│   ├── +page.svelte
│   └── +page.server.ts
├── app.html
├── app.d.ts
└── hooks.server.ts
```

---

## Coding Rules

### 1. Server-Side Data Loading

**Use +page.server.ts for data fetching:**

```typescript
// src/routes/posts/+page.server.ts
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 20;

  const [posts, total] = await Promise.all([
    db.post.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    db.post.count()
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
```

### 2. Form Actions

**Handle form submissions with actions:**

```typescript
// src/routes/posts/+page.server.ts
import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';

const createPostSchema = z.object({
  title: z.string().min(5).max(100),
  content: z.string().min(10),
  tags: z.array(z.string()).optional()
});

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const result = createPostSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
      return fail(400, { 
        errors: result.error.flatten().fieldErrors,
        values: Object.fromEntries(formData)
      });
    }

    const post = await db.post.create({
      data: {
        ...result.data,
        authorId: locals.user.id
      }
    });

    throw redirect(303, `/posts/${post.id}`);
  }
};
```

### 3. Client-Side State

**Use Svelte stores for client state:**

```typescript
// src/lib/stores/user.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { User } from '$lib/types';

function createUserStore() {
  const { subscribe, set } = writable<User | null>(null);

  return {
    subscribe,
    set,
    logout: async () => {
      if (browser) {
        await fetch('/api/auth/logout', { method: 'POST' });
      }
      set(null);
    }
  };
}

export const user = createUserStore();
```

### 4. API Routes

**Create type-safe API endpoints:**

```typescript
// src/routes/api/posts/+server.ts
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ url, locals }) => {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 20;

  const posts = await db.post.findMany({
    skip: (page - 1) * limit,
    take: limit,
    where: locals.user?.role === 'admin' ? {} : { published: true }
  });

  return json({ posts });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  const post = await db.post.create({
    data: { ...data, authorId: locals.user.id }
  });

  return json(post, { status: 201 });
};
```

### 5. Server Hooks

**Handle authentication globally:**

```typescript
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { verifyToken } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('auth_token');

  if (token) {
    try {
      const userId = await verifyToken(token);
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, role: true }
      });

      if (user) {
        event.locals.user = user;
      }
    } catch (error) {
      // Token invalid, clear cookie
      event.cookies.delete('auth_token', { path: '/' });
    }
  }

  return resolve(event);
};
```

---

## Form Handling

### Enhanced Form Component

```svelte
<!-- src/lib/components/Form.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  
  export let action: string | undefined = undefined;
  
  let loading = false;
  let errors: Record<string, string> = {};
  
  function handleSubmit({ data, cancel }: SubmitFunction) {
    loading = true;
    errors = {};
    
    return async ({ result, update }) => {
      loading = false;
      
      if (result.type === 'failure' && result.data?.errors) {
        errors = result.data.errors;
        cancel();
      }
      
      await update({ reset: false });
    };
  }
</script>

<form 
  {action}
  method="POST"
  use:enhance={handleSubmit}
  class="space-y-4"
>
  <slot {loading} {errors} />
</form>
```

---

## Validation with Zod

```typescript
// src/lib/utils/validation.ts
import { z } from 'zod';

export const schemas = {
  register: z.object({
    email: z.string().email('Invalid email'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase letter')
      .regex(/[0-9]/, 'Must contain number'),
    name: z.string().min(2).max(50)
  }),

  createPost: z.object({
    title: z.string().min(5).max(100),
    content: z.string().min(10),
    tags: z.array(z.string()).max(5).optional()
  })
};

export type RegisterInput = z.infer<typeof schemas.register>;
export type CreatePostInput = z.infer<typeof schemas.createPost>;
```

---

## Prisma Best Practices

```typescript
// src/lib/server/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Type-safe includes
export function includeUser<T extends { select?: object }>(options?: T) {
  return {
    ...options,
    include: {
      ...options?.include,
      user: {
        select: { id: true, name: true, avatar: true }
      }
    }
  };
}
```

---

## Testing

### Vitest Unit Tests

```typescript
// src/lib/utils/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, slugify } from './format';

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('January 15, 2024');
  });
});

describe('slugify', () => {
  it('creates URL-safe slugs', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
  });
});
```

### Playwright E2E Tests

```typescript
// tests/login.spec.ts
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
});
```

---

## Deployment

### Vercel Configuration

```json
// vercel.json
{
  "framework": "sveltekit",
  "regions": ["iad1", "sfo1"],
  "env": {
    "DATABASE_URL": "@database_url",
    "AUTH_SECRET": "@auth_secret"
  }
}
```

### Environment Variables

```bash
# .env.example
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"
AUTH_SECRET="your-secret-key"
PUBLIC_APP_URL="https://myapp.com"
```

---

## Common Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Preview production build
pnpm preview

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Type check
pnpm check

# Lint
pnpm lint

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Open Prisma Studio
pnpm prisma studio
```

---

## SEO Best Practices

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    children: Snippet;
    title?: string;
    description?: string;
  }
  
  let { children, title = 'My App', description = 'Description' }: Props = $props();
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
</svelte:head>

{@render children()}
```

---

## Performance Tips

1. **Use SSR for content pages** - Better SEO and initial load
2. **Use CSR for interactive dashboards** - Smoother UX
3. **Implement caching** - Use `@sveltejs/adapter-vercel` edge caching
4. **Optimize images** - Use `@sveltejs/image` or CDN
5. **Code splitting** - Automatic with SvelteKit

---

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Validate all input with Zod
- [ ] Sanitize user-generated content
- [ ] Use CSRF protection (built-in with SvelteKit)
- [ ] Rate limit API endpoints
- [ ] Store secrets in environment variables
- [ ] Use httpOnly cookies for auth
