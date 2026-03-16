# Remix Full-Stack Application Template

## Project Overview

This is a full-stack web application built with Remix, featuring server-side rendering, optimized loading, and modern React patterns.

## Tech Stack

- **Framework**: Remix v2
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS
- **Database**: Prisma + PostgreSQL
- **Authentication**: Remix Auth
- **Validation**: Zod
- **Testing**: Vitest + Playwright

## Project Structure

```
app/
├── routes/              # File-based routing
│   ├── _index.tsx       # Home page
│   ├── auth._index.tsx  # Auth routes (layout)
│   ├── auth.login.tsx   # Login page
│   ├── auth.register.tsx# Register page
│   ├── dashboard._index.tsx
│   ├── api._index.tsx   # API routes (layout)
│   └── api.users.ts     # API endpoint
├── components/          # Reusable components
│   ├── ui/              # UI primitives
│   └── forms/           # Form components
├── lib/                 # Utility functions
│   ├── db.server.ts     # Database client
│   ├── auth.server.ts   # Auth configuration
│   └── validators.ts    # Zod schemas
├── models/              # Data models
├── styles/              # Global styles
└── root.tsx             # Root layout
```

## Key Patterns

### 1. Server-Side Data Loading

```typescript
// app/routes/dashboard._index.tsx
import type { LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { requireUserId } from '~/lib/auth.server'
import { getDashboardData } from '~/models/dashboard.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request)
  const data = await getDashboardData(userId)
  return json(data)
}

export default function Dashboard() {
  const data = useLoaderData<typeof loader>()
  return <DashboardView data={data} />
}
```

### 2. Form Handling with Validation

```typescript
// app/routes/auth.register.tsx
import type { ActionFunctionArgs } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const result = registerSchema.safeParse(Object.fromEntries(formData))
  
  if (!result.success) {
    return json({ errors: result.error.flatten() }, { status: 400 })
  }
  
  // Create user...
  return redirect('/dashboard')
}
```

### 3. Optimistic UI Updates

```typescript
// app/components/TodoItem.tsx
import { useFetcher } from '@remix-run/react'

export function TodoItem({ todo }: { todo: Todo }) {
  const fetcher = useFetcher()
  
  const isCompleted = fetcher.formData
    ? fetcher.formData.get('completed') === 'true'
    : todo.completed
  
  return (
    <fetcher.Form method="post" action="/api/toggle-todo">
      <input type="hidden" name="id" value={todo.id} />
      <input 
        type="hidden" 
        name="completed" 
        value={String(!isCompleted)} 
      />
      <button type="submit">
        {isCompleted ? '✓' : '○'} {todo.title}
      </button>
    </fetcher.Form>
  )
}
```

### 4. Error Boundaries

```typescript
// app/routes/dashboard._index.tsx
export function ErrorBoundary() {
  const error = useRouteError()
  
  if (isRouteErrorResponse(error)) {
    return <ServerError error={error} />
  }
  
  return <GenericError error={error} />
}
```

### 5. Session Management

```typescript
// app/lib/auth.server.ts
import { createCookieSessionStorage } from '@remix-run/node'

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__session',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === 'production',
  },
})

export async function requireUserId(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get('Cookie')
  )
  const userId = session.get('userId')
  if (!userId) {
    throw redirect('/auth/login')
  }
  return userId
}
```

## Best Practices

1. **Use Loader for Data Fetching**: All data should be fetched in loaders, not in components
2. **Validate on Server**: Always validate user input on the server side
3. **Use Nested Routes**: Leverage Remix's nested routing for layout composition
4. **Optimize Assets**: Use Remix's built-in asset optimization
5. **Handle Errors Gracefully**: Implement error boundaries at route level
6. **Use Progressive Enhancement**: Forms should work without JavaScript

## Common Tasks

### Adding a New Route

1. Create file in `app/routes/`
2. Export `loader` for data fetching
3. Export `action` for mutations
4. Export default component for UI
5. Export `ErrorBoundary` for error handling

### Database Migrations

```bash
npx prisma migrate dev --name describe_change
```

### Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Type checking
pnpm type-check
```

## Performance Tips

1. Use `useLoaderData` instead of `useEffect` + fetch
2. Implement route-based code splitting (automatic in Remix)
3. Use `clientLoader` for client-side caching
4. Leverage `Cache-Control` headers in loaders
5. Preload critical resources in `root.tsx`

## Security Considerations

1. Always validate CSRF tokens for mutations
2. Use `helmet` for security headers
3. Implement rate limiting on auth routes
4. Sanitize user input before rendering
5. Use `httpOnly` cookies for sessions

## Deployment

The application is optimized for deployment on:
- **Vercel** (recommended)
- **Fly.io**
- **Cloudflare Pages**
- **Node.js server**

Build command: `pnpm build`
Start command: `pnpm start`
