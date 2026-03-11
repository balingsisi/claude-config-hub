# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: SvelteKit Fullstack Application
**Type**: Modern Fullstack Web Application
**Tech Stack**: SvelteKit + TypeScript + Prisma + SQLite
**Goal**: Production-ready fullstack application with SSR, type safety, and modern DX

---

## Tech Stack

### Frontend
- **Framework**: SvelteKit 2.0+
- **Language**: TypeScript 5.3+
- **Styling**: Tailwind CSS 3.4+
- **UI Components**: shadcn-svelte (optional)
- **Forms**: Superforms + Zod validation
- **Animations**: Svelte transitions

### Backend
- **Runtime**: Node.js / Vercel Edge / Cloudflare Workers
- **ORM**: Prisma 5.8+
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Authentication**: Lucia Auth / @auth/sveltekit
- **Validation**: Zod

### Development
- **Package Manager**: pnpm
- **Testing**: Vitest + Playwright
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged

---

## Code Standards

### TypeScript Rules
- Enable strict mode in `tsconfig.json`
- No `any` types - use `unknown` with type guards
- Prefer `interface` for object shapes
- Use `satisfies` operator for type checking

```typescript
// ✅ Good
interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

async function getUser(id: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { id } })
  return user
}

const config = {
  apiUrl: '/api',
  timeout: 5000
} satisfies AppConfig

// ❌ Bad
async function getUser(id: any): any {
  return prisma.user.findUnique({ where: { id } })
}
```

### Naming Conventions
- **Components**: PascalCase (`UserProfile.svelte`)
- **Routes**: kebab-case (`/user-profile`)
- **Server files**: +page.server.ts, +layout.server.ts
- **Stores**: camelCase with `$` usage (`$userStore`)
- **Types**: PascalCase (`User`, `Product`)
- **Files**: kebab-case (`user-profile.svelte`)

### SvelteKit Best Practices

#### Use Load Functions
```typescript
// ✅ Good - Server-side data loading
// src/routes/users/+page.server.ts
import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ locals, params }) => {
  const users = await prisma.user.findMany()
  
  if (!users) {
    throw error(404, 'Users not found')
  }
  
  return { users }
}

// src/routes/users/+page.svelte
<script lang="ts">
  import type { PageData } from './$types'
  
  export let data: PageData
</script>

{#each data.users as user (user.id)}
  <div>{user.name}</div>
{/each}
```

#### Server Actions
```typescript
// ✅ Good - Form actions
// src/routes/users/+page.server.ts
import type { Actions } from './$types'
import { fail, redirect } from '@sveltejs/kit'

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    
    if (!name || !email) {
      return fail(400, { error: 'Name and email are required' })
    }
    
    await prisma.user.create({
      data: { name, email }
    })
    
    throw redirect(303, '/users')
  }
}
```

---

## Directory Structure

```
src/
├── routes/                    # SvelteKit routes
│   ├── (auth)/               # Auth group routes
│   │   ├── login/
│   │   │   ├── +page.svelte
│   │   │   └── +page.server.ts
│   │   ├── register/
│   │   └── +layout.svelte
│   │
│   ├── (app)/                # App group routes
│   │   ├── dashboard/
│   │   │   ├── +page.svelte
│   │   │   └── +page.server.ts
│   │   ├── users/
│   │   │   ├── [id]/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   ├── +page.svelte
│   │   │   └── +page.server.ts
│   │   └── +layout.svelte
│   │
│   ├── api/                  # API routes
│   │   ├── users/
│   │   │   ├── [id]/
│   │   │   │   └── +server.ts
│   │   │   └── +server.ts
│   │   └── health/
│   │       └── +server.ts
│   │
│   ├── +layout.svelte        # Root layout
│   ├── +layout.server.ts     # Root server layout
│   ├── +page.svelte          # Home page
│   └── +error.svelte         # Error page
│
├── lib/                      # Shared code
│   ├── server/              # Server-only code
│   │   ├── db.ts            # Prisma client
│   │   ├── auth.ts          # Auth utilities
│   │   └── api.ts           # API helpers
│   │
│   ├── components/          # Reusable components
│   │   ├── ui/             # UI components
│   │   │   ├── Button.svelte
│   │   │   ├── Input.svelte
│   │   │   └── Modal.svelte
│   │   ├── forms/          # Form components
│   │   │   ├── UserForm.svelte
│   │   │   └── SearchForm.svelte
│   │   └── layout/         # Layout components
│   │       ├── Header.svelte
│   │       ├── Sidebar.svelte
│   │       └── Footer.svelte
│   │
│   ├── stores/             # Svelte stores
│   │   ├── user.ts
│   │   ├── toast.ts
│   │   └── theme.ts
│   │
│   ├── utils/              # Utility functions
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── api.ts
│   │
│   └── types/              # TypeScript types
│       ├── user.ts
│       ├── api.ts
│       └── env.d.ts
│
├── params/                 # Custom param matchers
│   └── id.ts
│
├── prisma/                 # Database schema
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── static/                 # Static assets
│   ├── favicon.png
│   └── images/
│
├── app.html               # App template
├── app.d.ts               # App type declarations
└── hooks.server.ts        # Server hooks
```

---

## Routing Patterns

### Dynamic Routes
```typescript
// src/routes/users/[id]/+page.server.ts
import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params }) => {
  const user = await prisma.user.findUnique({
    where: { id: params.id }
  })
  
  if (!user) {
    throw error(404, 'User not found')
  }
  
  return { user }
}
```

### Layout Groups
```svelte
<!-- src/routes/(app)/+layout.svelte -->
<script lang="ts">
  import Header from '$lib/components/layout/Header.svelte'
  import Sidebar from '$lib/components/layout/Sidebar.svelte'
  
  export let data
</script>

<div class="app-layout">
  <Header user={data.user} />
  <div class="content">
    <Sidebar />
    <main>
      <slot />
    </main>
  </div>
</div>
```

### API Routes
```typescript
// src/routes/api/users/+server.ts
import type { RequestHandler } from './$types'
import { json, error } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ url }) => {
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '10')
  
  const users = await prisma.user.findMany({
    skip: (page - 1) * limit,
    take: limit
  })
  
  return json(users)
}

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json()
  
  const user = await prisma.user.create({
    data: body
  })
  
  return json(user, { status: 201 })
}

// src/routes/api/users/[id]/+server.ts
import type { RequestHandler } from './$types'
import { json, error } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ params }) => {
  const user = await prisma.user.findUnique({
    where: { id: params.id }
  })
  
  if (!user) {
    throw error(404, 'User not found')
  }
  
  return json(user)
}

export const PUT: RequestHandler = async ({ params, request }) => {
  const body = await request.json()
  
  const user = await prisma.user.update({
    where: { id: params.id },
    data: body
  })
  
  return json(user)
}

export const DELETE: RequestHandler = async ({ params }) => {
  await prisma.user.delete({
    where: { id: params.id }
  })
  
  return json({ success: true })
}
```

---

## Prisma Integration

### Schema
```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("posts")
}

enum Role {
  USER
  ADMIN
}
```

### Client Setup
```typescript
// src/lib/server/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## Forms & Validation

### Superforms Setup
```typescript
// src/lib/schemas/user.ts
import { z } from 'zod'

export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['USER', 'ADMIN']).default('USER')
})

export type UserSchema = typeof userSchema

// src/routes/users/create/+page.server.ts
import type { PageServerLoad, Actions } from './$types'
import { superValidate } from 'sveltekit-superforms/server'
import { userSchema } from '$lib/schemas/user'
import { fail, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async () => {
  const form = await superValidate(userSchema)
  return { form }
}

export const actions: Actions = {
  default: async ({ request }) => {
    const form = await superValidate(request, userSchema)
    
    if (!form.valid) {
      return fail(400, { form })
    }
    
    await prisma.user.create({
      data: form.data
    })
    
    throw redirect(303, '/users')
  }
}
```

### Form Component
```svelte
<!-- src/routes/users/create/+page.svelte -->
<script lang="ts">
  import SuperForm from 'sveltekit-superforms'
  import { userSchema } from '$lib/schemas/user'
  
  export let data
</script>

<SuperForm
  {data.form}
  schema={userSchema}
  let:form
  let:errors
  let:constraints
>
  <form method="POST">
    <div>
      <label for="name">Name</label>
      <input
        type="text"
        name="name"
        bind:value={$form.name}
        {...constraints.name}
      />
      {#if errors.name}
        <span class="error">{errors.name}</span>
      {/if}
    </div>

    <div>
      <label for="email">Email</label>
      <input
        type="email"
        name="email"
        bind:value={$form.email}
        {...constraints.email}
      />
      {#if errors.email}
        <span class="error">{errors.email}</span>
      {/if}
    </div>

    <button type="submit">Create User</button>
  </form>
</SuperForm>
```

---

## Authentication

### Lucia Auth Setup
```typescript
// src/lib/server/auth.ts
import { Lucia } from 'lucia'
import { PrismaAdapter } from '@lucia-auth/adapter-prisma'
import { prisma } from './db'

const adapter = new PrismaAdapter(prisma.session, prisma.user)

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production'
    }
  }
})

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: {
      name: string
      email: string
      role: string
    }
  }
}

// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit'
import { lucia } from '$lib/server/auth'

export const handle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get(lucia.sessionCookieName)
  
  if (!sessionId) {
    event.locals.user = null
    event.locals.session = null
    return resolve(event)
  }

  const { session, user } = await lucia.validateSession(sessionId)
  
  if (session && session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id)
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes
    })
  }

  if (!session) {
    const sessionCookie = lucia.createBlankSessionCookie()
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes
    })
  }

  event.locals.user = user
  event.locals.session = session
  return resolve(event)
}
```

### Auth Guard
```typescript
// src/routes/(app)/+layout.server.ts
import type { LayoutServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login')
  }
  
  return {
    user: locals.user
  }
}
```

---

## State Management

### Svelte Stores
```typescript
// src/lib/stores/user.ts
import { writable } from 'svelte/store'
import type { User } from '@prisma/client'

function createUserStore() {
  const { subscribe, set, update } = writable<User | null>(null)

  return {
    subscribe,
    setUser: (user: User) => set(user),
    clearUser: () => set(null),
    updateUser: (data: Partial<User>) => update(user => 
      user ? { ...user, ...data } : null
    )
  }
}

export const userStore = createUserStore()

// src/lib/stores/toast.ts
import { writable } from 'svelte/store'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([])

  function add(type: Toast['type'], message: string) {
    const id = crypto.randomUUID()
    update(toasts => [...toasts, { id, type, message }])
    
    setTimeout(() => {
      update(toasts => toasts.filter(t => t.id !== id))
    }, 3000)
  }

  return {
    subscribe,
    success: (message: string) => add('success', message),
    error: (message: string) => add('error', message),
    info: (message: string) => add('info', message),
    remove: (id: string) => update(toasts => toasts.filter(t => t.id !== id))
  }
}

export const toastStore = createToastStore()
```

---

## Testing

### Unit Tests with Vitest
```typescript
// src/lib/utils/format.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate } from './format'

describe('formatCurrency', () => {
  it('should format USD currency', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56')
  })

  it('should handle zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00')
  })
})

describe('formatDate', () => {
  it('should format date in default format', () => {
    const date = new Date('2024-01-15')
    expect(formatDate(date)).toBe('January 15, 2024')
  })
})
```

### Component Tests
```typescript
// src/lib/components/ui/Button.test.ts
import { render, fireEvent } from '@testing-library/svelte'
import { describe, it, expect } from 'vitest'
import Button from './Button.svelte'

describe('Button', () => {
  it('should render with text', () => {
    const { getByText } = render(Button, { props: { text: 'Click me' } })
    expect(getByText('Click me')).toBeTruthy()
  })

  it('should handle click events', async () => {
    const { getByRole, component } = render(Button, { 
      props: { text: 'Click me' } 
    })
    
    const mock = vi.fn()
    component.$on('click', mock)
    
    await fireEvent.click(getByRole('button'))
    expect(mock).toHaveBeenCalled()
  })

  it('should be disabled when loading', () => {
    const { getByRole } = render(Button, { 
      props: { text: 'Submit', loading: true } 
    })
    expect(getByRole('button')).toBeDisabled()
  })
})
```

### E2E Tests with Playwright
```typescript
// tests/users.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Users Page', () => {
  test('should display users list', async ({ page }) => {
    await page.goto('/users')
    
    await expect(page.locator('h1')).toHaveText('Users')
    await expect(page.locator('.user-item')).toHaveCount(10)
  })

  test('should create new user', async ({ page }) => {
    await page.goto('/users/create')
    
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/users')
    await expect(page.locator('.toast')).toHaveText('User created successfully')
  })
})
```

---

## Performance Optimization

### SSR Best Practices
- Use `load` functions for server-side data fetching
- Cache data with `cache` option in `load`
- Use `prerender` for static pages

```typescript
// +page.server.ts
export const load: PageServerLoad = async ({ setHeaders }) => {
  const users = await prisma.user.findMany()
  
  // Cache for 5 minutes
  setHeaders({
    'cache-control': 'public, max-age=300'
  })
  
  return { users }
}

// +layout.ts
export const prerender = true
export const ssr = true
```

### Client-side Optimization
```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  
  // Lazy load heavy components
  let HeavyComponent
  onMount(async () => {
    HeavyComponent = (await import('./HeavyComponent.svelte')).default
  })
</script>

{#if HeavyComponent}
  <svelte:component this={HeavyComponent} />
{/if}
```

---

## Environment Variables

```typescript
// src/lib/types/env.d.ts
namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string
    SESSION_SECRET: string
    PUBLIC_API_URL: string
    NODE_ENV: 'development' | 'production' | 'test'
  }
}

// .env.example
DATABASE_URL="file:./dev.db"
SESSION_SECRET="your-secret-key"
PUBLIC_API_URL="http://localhost:5173/api"
```

---

## Best Practices Summary

1. **Use Load Functions** - Server-side data fetching with type safety
2. **Server Actions** - Form submissions and mutations
3. **Prisma ORM** - Type-safe database queries
4. **Zod Validation** - Schema validation with Superforms
5. **Layout Groups** - Organize routes with shared layouts
6. **Svelte Stores** - Client-side state management
7. **Lucia Auth** - Simple, secure authentication
8. **Testing** - Vitest for unit, Playwright for E2E
9. **SSR** - Server-side rendering for SEO and performance
10. **Type Safety** - Full TypeScript integration end-to-end
