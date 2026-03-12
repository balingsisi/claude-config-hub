# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Deno Backend Service
**Type**: Modern Backend API
**Tech Stack**: Deno + TypeScript + Oak/Fresh
**Goal**: Secure, modern backend with first-class TypeScript support and zero configuration

---

## Tech Stack

### Core
- **Runtime**: Deno 1.41+
- **Language**: TypeScript (built-in)
- **Framework**: Oak (Express-like) or Fresh (fullstack)
- **Architecture**: Modular, ESM-first

### Database
- **Database**: PostgreSQL or MongoDB
- **ORM**: DenoDB or Prisma (with Deno adapter)
- **Validation**: Zod

### Security & Auth
- **Authentication**: JWT + djwt
- **Validation**: Zod schemas
- **Security**: Built-in Deno permissions

### Development
- **Package Manager**: None (Deno uses URLs)
- **Testing**: Deno Test (built-in)
- **Formatting**: Deno fmt (built-in)
- **Linting**: Deno lint (built-in)
- **Bundling**: Deno bundle (built-in)

---

## Code Standards

### TypeScript Rules
- Use strict mode by default
- Deno enforces type safety
- Prefer `deno.land/x` modules
- Use ES modules exclusively

```typescript
// ✅ Good
interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

export async function getUser(id: string): Promise<User | null> {
  const user = await db.users.find(id)
  return user
}

// ❌ Bad
export async function getUser(id: any): any {
  return await db.users.find(id)
}
```

### Naming Conventions
- **Files**: kebab-case (`user-handler.ts`)
- **Functions**: camelCase (`getUser`, `createUser`)
- **Classes**: PascalCase (`UserController`)
- **Constants**: UPPER_SNAKE_CASE (`DATABASE_URL`)
- **Types/Interfaces**: PascalCase (`User`, `UserResponse`)

### File Organization
```
src/
├── controllers/      # Request handlers
│   ├── user.controller.ts
│   └── auth.controller.ts
├── services/         # Business logic
│   ├── user.service.ts
│   └── auth.service.ts
├── models/          # Data models
│   └── user.model.ts
├── middleware/      # Custom middleware
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── routes/          # Route definitions
│   ├── user.routes.ts
│   └── index.ts
├── utils/           # Utility functions
│   ├── response.ts
│   └── validation.ts
├── types/           # TypeScript types
│   └── index.ts
├── config/          # Configuration
│   └── index.ts
└── main.ts         # Application entry point
```

---

## Architecture Patterns

### Oak Framework (Express-like)
- Middleware-based request handling
- Router for route organization
- Context object for request/response

```typescript
// main.ts
import { Application, Router } from 'https://deno.land/x/oak@v12.6.1/mod.ts'
import { authMiddleware } from './middleware/auth.middleware.ts'
import userRoutes from './routes/user.routes.ts'

const app = new Application()
const router = new Router()

// Global middleware
app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  console.log(`${ctx.request.method} ${ctx.request.url} - ${ms}ms`)
})

// Protected routes
router.use('/api/users', authMiddleware, userRoutes.routes())

app.use(router.routes())
app.use(router.allowedMethods())

await app.listen({ port: 8000 })
```

### Controller Pattern
- Keep controllers focused
- Delegate logic to services
- Return proper HTTP responses

```typescript
// controllers/user.controller.ts
import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts'
import { UserService } from '../services/user.service.ts'
import { validateBody } from '../utils/validation.ts'
import { CreateUserSchema } from '../types/index.ts'

const userService = new UserService()

export async function getUsers(ctx: Context) {
  const users = await userService.findAll()
  ctx.response.body = {
    success: true,
    data: users
  }
}

export async function getUser(ctx: Context) {
  const id = ctx.params.id
  const user = await userService.findById(id)
  
  if (!user) {
    ctx.throw(404, 'User not found')
  }
  
  ctx.response.body = {
    success: true,
    data: user
  }
}

export async function createUser(ctx: Context) {
  const body = await ctx.request.body().value
  const validatedData = await validateBody(body, CreateUserSchema)
  
  const user = await userService.create(validatedData)
  
  ctx.response.status = 201
  ctx.response.body = {
    success: true,
    data: user
  }
}
```

### Service Layer
- Business logic belongs here
- Database operations
- External API calls

```typescript
// services/user.service.ts
import { db } from '../config/database.ts'
import { User, CreateUserInput } from '../types/index.ts'

export class UserService {
  async findAll(): Promise<User[]> {
    return await db.query<User[]>('SELECT * FROM users ORDER BY created_at DESC')
  }
  
  async findById(id: string): Promise<User | null> {
    const result = await db.query<User[]>(
      'SELECT * FROM users WHERE id = $id',
      { id }
    )
    return result[0] || null
  }
  
  async create(data: CreateUserInput): Promise<User> {
    const result = await db.query<User>(
      'INSERT INTO users (email, name) VALUES ($email, $name) RETURNING *',
      data
    )
    return result[0]
  }
  
  async update(id: string, data: Partial<User>): Promise<User | null> {
    const user = await this.findById(id)
    if (!user) return null
    
    const result = await db.query<User>(
      'UPDATE users SET name = $name WHERE id = $id RETURNING *',
      { id, ...data }
    )
    return result[0]
  }
  
  async delete(id: string): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM users WHERE id = $id',
      { id }
    )
    return result.rowCount > 0
  }
}
```

### Middleware Pattern
- Authentication
- Logging
- Error handling
- CORS

```typescript
// middleware/auth.middleware.ts
import { Context, Next } from 'https://deno.land/x/oak@v12.6.1/mod.ts'
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts'
import { cryptoKey } from '../config/index.ts'

export async function authMiddleware(ctx: Context, next: Next) {
  const authHeader = ctx.request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ctx.throw(401, 'Missing or invalid authorization header')
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  try {
    const payload = await verify(token, cryptoKey)
    ctx.state.user = payload
    await next()
  } catch (error) {
    ctx.throw(401, 'Invalid or expired token')
  }
}

// middleware/error.middleware.ts
import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts'

export async function errorMiddleware(ctx: Context, next: Next) {
  try {
    await next()
  } catch (err) {
    console.error('Error:', err)
    
    ctx.response.status = err.status || 500
    ctx.response.body = {
      success: false,
      error: err.message || 'Internal server error'
    }
  }
}
```

### Validation with Zod
- Define schemas for input validation
- Use Zod for runtime validation
- Provide clear error messages

```typescript
// types/index.ts
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number().int().positive().optional()
})

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  age: z.number().int().positive().optional()
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>

export interface User {
  id: string
  email: string
  name: string
  age?: number
  createdAt: Date
  updatedAt: Date
}

// utils/validation.ts
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

export async function validateBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      throw new Error(`Validation failed: ${messages.join(', ')}`)
    }
    throw error
  }
}
```

---

## Key Constraints

### Security
- ✅ Use Deno's permission system
- ✅ Validate all inputs with Zod
- ✅ Implement proper authentication
- ✅ Use environment variables for secrets
- ❌ Don't grant unnecessary permissions
- ❌ Don't hardcode secrets
- ❌ Don't skip input validation

### Performance
- ✅ Use async/await properly
- ✅ Implement proper caching
- ✅ Optimize database queries
- ✅ Use connection pooling
- ❌ Don't block the event loop
- ❌ Don't create memory leaks

### Code Quality
- ✅ Use Deno's built-in formatter and linter
- ✅ Write tests with Deno Test
- ✅ Document your code
- ❌ Don't disable linting rules without reason
- ❌ Don't skip error handling

---

## Common Commands

### Development
```bash
deno run --allow-net --allow-env src/main.ts    # Run with permissions
deno run --allow-all src/main.ts                 # Run with all permissions
deno run --watch src/main.ts                     # Watch mode
```

### Testing
```bash
deno test                                        # Run all tests
deno test --allow-all src/tests/                 # Run tests with permissions
deno test --coverage src/tests/                  # Run with coverage
deno test --watch src/tests/                     # Watch mode
```

### Code Quality
```bash
deno fmt                                         # Format code
deno fmt --check                                 # Check formatting
deno lint                                        # Lint code
deno check src/main.ts                           # Type check
```

### Dependencies
```bash
deno cache src/deps.ts                           # Cache dependencies
deno info https://deno.land/x/oak@v12.6.1/mod.ts # View dependency info
```

### Other
```bash
deno compile --allow-net src/main.ts             # Compile to executable
deno bundle src/main.ts out.bundle.js            # Bundle code
```

---

## Important Prohibitions

### ❌ Never Do
- Don't use `any` type - use proper TypeScript types
- Don't grant unnecessary permissions
- Don't hardcode secrets or API keys
- Don't skip input validation
- Don't ignore TypeScript errors
- Don't disable linting rules without reason
- Don't use `console.log` in production - use proper logging
- Don't forget to handle errors
- Don't create circular dependencies
- Don't skip tests

### ⚠️ Use with Caution
- `--allow-all` flag - be specific with permissions
- Unstable APIs - check stability guarantees
- External modules - verify trustworthiness
- Dynamic imports - ensure proper validation

---

## Best Practices

### Dependency Management
- Use a deps.ts file to centralize dependencies
- Lock versions for production
- Use semantic versioning

```typescript
// deps.ts
export { Application, Router, Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts'
export * as z from 'https://deno.land/x/zod@v3.22.4/mod.ts'
export { verify, create } from 'https://deno.land/x/djwt@v2.8/mod.ts'

// Import from deps.ts
import { Application, Router } from './deps.ts'
```

### Environment Variables
- Use Deno's built-in environment support
- Validate on startup
- Provide defaults

```typescript
// config/index.ts
import { load } from 'https://deno.land/std@0.208.0/dotenv/mod.ts'

await load({ export: true })

export const config = {
  port: parseInt(Deno.env.get('PORT') || '8000'),
  dbUrl: Deno.env.get('DATABASE_URL') || 'postgres://localhost/mydb',
  jwtSecret: Deno.env.get('JWT_SECRET') || (() => {
    throw new Error('JWT_SECRET is required')
  })()
}
```

### Error Handling
- Use proper HTTP status codes
- Provide meaningful error messages
- Log errors appropriately

```typescript
// ✅ Good
export async function getUser(ctx: Context) {
  try {
    const id = ctx.params.id
    
    if (!id) {
      ctx.throw(400, 'User ID is required')
    }
    
    const user = await userService.findById(id)
    
    if (!user) {
      ctx.throw(404, 'User not found')
    }
    
    ctx.response.body = {
      success: true,
      data: user
    }
  } catch (error) {
    if (error.status) throw error
    console.error('Failed to get user:', error)
    ctx.throw(500, 'Internal server error')
  }
}
```

### Testing
- Use Deno's built-in test framework
- Test all endpoints and functions
- Mock external dependencies

```typescript
// tests/user.test.ts
import { assertEquals } from 'https://deno.land/std@0.208.0/testing/asserts.ts'
import { UserService } from '../services/user.service.ts'

Deno.test('UserService - findAll should return all users', async () => {
  const userService = new UserService()
  const users = await userService.findAll()
  
  assertEquals(Array.isArray(users), true)
  assertEquals(users.length > 0, true)
})

Deno.test('UserService - findById should return null for non-existent user', async () => {
  const userService = new UserService()
  const user = await userService.findById('non-existent-id')
  
  assertEquals(user, null)
})

Deno.test({
  name: 'UserController - createUser should create a new user',
  async fn() {
    // Test implementation
  },
  permissions: { net: true, env: true }
})
```

---

## Compact Instructions

When using `/compact`, preserve:
- Architecture decisions and API changes
- Permission requirements
- Database schema changes
- Test commands and results

Discard:
- Verbose log output
- Exploratory search dead ends
- Redundant confirmation messages

---

## Quick Reference

### File Locations
- Controllers: `src/controllers/**/*.ts`
- Services: `src/services/**/*.ts`
- Middleware: `src/middleware/**/*.ts`
- Routes: `src/routes/**/*.ts`
- Types: `src/types/**/*.ts`
- Config: `src/config/**/*.ts`

### Permission Flags
```bash
--allow-net          # Network access
--allow-read         # File system read
--allow-write        # File system write
--allow-env          # Environment variables
--allow-run          # Run subprocesses
--allow-ffi          # FFI access
--allow-hrtime       # High-resolution time
--allow-all          # All permissions
```

### Environment Variables
```env
PORT=8000
DATABASE_URL=postgres://user:password@localhost:5432/mydb
JWT_SECRET=your-secret-key
DENO_DIR=.deno
```

### Common Imports
```typescript
// Standard library
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { assertEquals } from 'https://deno.land/std@0.208.0/testing/asserts.ts'

// Oak framework
import { Application, Router, Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts'

// Utilities
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { verify, create } from 'https://deno.land/x/djwt@v2.8/mod.ts'
```

---

**Last Updated**: 2026-03-12
