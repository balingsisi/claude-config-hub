# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Next.js SaaS Starter
**Type**: Full-stack SaaS Application
**Tech Stack**: Next.js 15 + TypeScript + Supabase
**Goal**: Production-ready SaaS application with authentication, database, and payment

---

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.9+
- **Styling**: Tailwind CSS 4.0
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: React Server Components + Server Actions
- **Form Handling**: React Hook Form + Zod validation

### Backend
- **API**: Next.js API Routes + Server Actions
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma (or Supabase Client)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Payments**: Stripe

### Development
- **Package Manager**: pnpm
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged

---

## Code Standards

### TypeScript Rules
- Use strict mode - no `any` types
- Prefer explicit return types for public functions
- Use `interface` for object shapes, `type` for unions
- Enable `noUncheckedIndexedAccess`

```typescript
// ✅ Good
interface User {
  id: string
  name: string
  email: string
}

async function getUser(id: string): Promise<User | null> {
  // ...
}

// ❌ Bad
async function getUser(id: any): any {
  // ...
}
```

### Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Functions**: camelCase (`fetchUserData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`UserData`)
- **Files**: kebab-case (`user-profile.tsx`)

### File Organization
```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   └── features/    # Feature-specific components
├── lib/             # Utility functions
├── hooks/           # Custom React hooks
├── types/           # TypeScript types
└── styles/          # Global styles
```

---

## Architecture Patterns

### App Router Structure
- Use Server Components by default
- Use Client Components (`'use client'`) only when needed (interactivity)
- Keep data fetching in Server Components
- Use Server Actions for mutations

```typescript
// app/page.tsx - Server Component
export default async function HomePage() {
  const data = await fetchData()
  return <PageClient data={data} />
}

// components/PageClient.tsx - Client Component
'use client'
export function PageClient({ data }: { data: Data }) {
  const [state, setState] = useState(data)
  // ...
}
```

### Data Fetching
- Use Server Components for data fetching
- Implement proper error handling
- Add loading states with `Suspense`
- Use `revalidatePath` for cache invalidation

```typescript
// ✅ Good - Server Component
export default async function Page() {
  const users = await db.user.findMany()
  return <UserList users={users} />
}

// ❌ Bad - Client fetching when not needed
'use client'
export function Page() {
  const [users, setUsers] = useState([])
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers)
  }, [])
  return <UserList users={users} />
}
```

### Server Actions
- Use for mutations (create, update, delete)
- Implement proper revalidation
- Add error handling with `try-catch`
- Use `redirect` for navigation after mutations

```typescript
'use server'

export async function createUser(formData: FormData) {
  const { data, error } = await supabase
    .from('users')
    .insert({ name: formData.get('name') })
    .select()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/users')
  redirect('/users')
}
```

---

## Key Constraints

### Security
- ✅ All API routes must validate input with Zod
- ✅ Use Supabase RLS (Row Level Security) for data access
- ✅ Never expose sensitive data in client components
- ✅ Use environment variables for secrets
- ❌ No hardcoded API keys or secrets
- ❌ No client-side database queries without RLS

### Performance
- ✅ Use Server Components by default
- ✅ Implement proper caching with `revalidate`
- ✅ Optimize images with `next/image`
- ✅ Lazy load components with `dynamic()`
- ❌ Avoid large client bundles
- ❌ No unnecessary `useEffect` calls

### Database
- ✅ Always use parameterized queries (Prisma/Supabase)
- ✅ Implement proper indexes for frequently queried fields
- ✅ Use transactions for multi-step operations
- ❌ No raw SQL queries unless absolutely necessary
- ❌ No N+1 query problems

---

## Common Commands

### Development
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
```

### Database
```bash
pnpm db:push      # Push schema changes to database
pnpm db:studio    # Open Prisma Studio
pnpm db:seed      # Seed database with sample data
```

### Testing
```bash
pnpm test         # Run unit tests
pnpm test:e2e     # Run E2E tests
pnpm test:watch   # Watch mode
```

---

## Important Prohibitions

### ❌ Never Do
- Don't use `any` type - use proper TypeScript types
- Don't fetch data in Client Components if Server Components can do it
- Don't use `useEffect` for data fetching on initial load
- Don't hardcode configuration values - use environment variables
- Don't commit `.env.local` files
- Don't ignore TypeScript errors
- Don't disable ESLint rules without good reason
- Don't use inline styles - use Tailwind classes
- Don't create components larger than 300 lines - split them up
- Don't use `console.log` in production - use proper logging

### ⚠️ Use with Caution
- `useEffect` - only for side effects, not data fetching
- Client Components - only when interactivity is needed
- `'use server'` - only for mutations, not data fetching
- Dynamic imports - only when code splitting is beneficial

---

## Best Practices

### Component Design
- Keep components small and focused (< 200 lines)
- Use composition over inheritance
- Extract reusable logic into custom hooks
- Use proper prop types with TypeScript

```typescript
// ✅ Good
interface ButtonProps {
  variant: 'primary' | 'secondary'
  size: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
}

export function Button({ variant, size, children, onClick }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }))} onClick={onClick}>
      {children}
    </button>
  )
}
```

### Error Handling
- Always handle errors in Server Actions
- Use error boundaries for client components
- Provide meaningful error messages
- Log errors for debugging

```typescript
// ✅ Good
export async function deleteUser(id: string) {
  try {
    await db.user.delete({ where: { id } })
    revalidatePath('/users')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete user:', error)
    return { error: 'Failed to delete user' }
  }
}
```

### Accessibility
- Use semantic HTML elements
- Add proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers

---

## Compact Instructions

When using `/compact`, preserve:
- Architecture decisions and API changes
- Test commands and results
- Modified files list and critical diffs

Discard:
- Verbose log output
- Exploratory search dead ends
- Redundant confirmation messages

---

## Quick Reference

### File Locations
- Pages: `src/app/**/page.tsx`
- Server Actions: `src/app/**/actions.ts`
- API Routes: `src/app/api/**/route.ts`
- Components: `src/components/**`
- Utilities: `src/lib/**`
- Types: `src/types/**`

### Environment Variables
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

---

**Last Updated**: 2026-03-01
