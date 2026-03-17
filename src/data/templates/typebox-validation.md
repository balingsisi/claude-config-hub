# TypeBox Template

## Project Overview

TypeBox is a JSON Schema Type Builder with Static Type Resolution for TypeScript. It allows you to create schema objects that can be used for both runtime validation and static type checking, eliminating the need to maintain separate type definitions and validation schemas.

## Tech Stack

- **Core**: TypeBox 0.31+
- **Language**: TypeScript
- **Runtime Validation**: TypeBox Compiler / Ajv
- **Framework**: Express / Fastify / Hono
- **Testing**: Vitest
- **Build**: tsup / esbuild

## Project Structure

```
├── src/
│   ├── schemas/                  # TypeBox schemas
│   │   ├── user.schema.ts
│   │   ├── post.schema.ts
│   │   ├── auth.schema.ts
│   │   └── index.ts
│   ├── types/                    # Extracted types
│   │   ├── user.types.ts
│   │   ├── post.types.ts
│   │   └── index.ts
│   ├── validators/               # Validation utilities
│   │   ├── compiler.ts
│   │   ├── middleware.ts
│   │   └── index.ts
│   ├── routes/                   # API routes
│   │   ├── user.routes.ts
│   │   ├── post.routes.ts
│   │   └── auth.routes.ts
│   ├── services/                 # Business logic
│   │   ├── user.service.ts
│   │   └── post.service.ts
│   ├── utils/
│   │   ├── response.ts
│   │   └── errors.ts
│   └── index.ts
├── tests/
│   ├── schemas/
│   │   └── user.schema.test.ts
│   ├── validators/
│   │   └── compiler.test.ts
│   └── routes/
│       └── user.routes.test.ts
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

## Key Patterns

### 1. Basic Schema Definition

```typescript
// src/schemas/user.schema.ts
import { Type, Static } from '@sinclair/typebox'

// User schema
export const UserSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email: Type.String({ format: 'email' }),
  name: Type.String({ minLength: 2, maxLength: 100 }),
  age: Type.Optional(Type.Number({ minimum: 0, maximum: 150 })),
  role: Type.Union([Type.Literal('admin'), Type.Literal('user'), Type.Literal('moderator')]),
  isActive: Type.Boolean({ default: true }),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
})

// Create user schema (without id and timestamps)
export const CreateUserSchema = Type.Omit(UserSchema, ['id', 'createdAt', 'updatedAt'])

// Update user schema (all fields optional except id)
export const UpdateUserSchema = Type.Partial(
  Type.Omit(UserSchema, ['id', 'createdAt', 'updatedAt'])
)

// User query parameters
export const UserQuerySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 10 })),
  search: Type.Optional(Type.String({ maxLength: 100 })),
  role: Type.Optional(Type.Union([Type.Literal('admin'), Type.Literal('user'), Type.Literal('moderator')])),
  isActive: Type.Optional(Type.Boolean()),
})

// User response schema
export const UserResponseSchema = Type.Object({
  success: Type.Boolean(),
  data: UserSchema,
})

// User list response schema
export const UserListResponseSchema = Type.Object({
  success: Type.Boolean(),
  data: Type.Array(UserSchema),
  pagination: Type.Object({
    page: Type.Number(),
    limit: Type.Number(),
    total: Type.Number(),
    totalPages: Type.Number(),
  }),
})
```

### 2. Extract Static Types

```typescript
// src/types/user.types.ts
import { Static } from '@sinclair/typebox'
import {
  UserSchema,
  CreateUserSchema,
  UpdateUserSchema,
  UserQuerySchema,
} from '@/schemas/user.schema'

// Extract types from schemas
export type User = Static<typeof UserSchema>
export type CreateUser = Static<typeof CreateUserSchema>
export type UpdateUser = Static<typeof UpdateUserSchema>
export type UserQuery = Static<typeof UserQuerySchema>
```

### 3. Advanced Schema Patterns

```typescript
// src/schemas/post.schema.ts
import { Type, Static } from '@sinclair/typebox'

// Nested object schema
export const AddressSchema = Type.Object({
  street: Type.String(),
  city: Type.String(),
  state: Type.String(),
  zipCode: Type.String({ pattern: '^\\d{5}(-\\d{4})?$' }),
  country: Type.String(),
})

// Array schema with constraints
export const TagsSchema = Type.Array(Type.String({ minLength: 1, maxLength: 50 }), {
  minItems: 1,
  maxItems: 10,
  uniqueItems: true,
})

// Record schema
export const MetadataSchema = Type.Record(
  Type.String(),
  Type.Union([Type.String(), Type.Number(), Type.Boolean()])
)

// Post schema with references
export const PostSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  title: Type.String({ minLength: 5, maxLength: 200 }),
  content: Type.String({ minLength: 10 }),
  excerpt: Type.Optional(Type.String({ maxLength: 300 })),
  authorId: Type.String({ format: 'uuid' }),
  tags: TagsSchema,
  metadata: Type.Optional(MetadataSchema),
  status: Type.Union([
    Type.Literal('draft'),
    Type.Literal('published'),
    Type.Literal('archived'),
  ]),
  publishedAt: Type.Optional(Type.String({ format: 'date-time' })),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
})

// Conditional schema using Transform
export const PostWithAuthorSchema = Type.Composite([
  PostSchema,
  Type.Object({
    author: Type.Object({
      id: Type.String(),
      name: Type.String(),
      email: Type.String(),
    }),
  }),
])
```

### 4. TypeBox Compiler for Validation

```typescript
// src/validators/compiler.ts
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { ValueError } from '@sinclair/typebox/errors'
import { UserSchema, CreateUserSchema } from '@/schemas/user.schema'

// Compile schemas for fast validation
export const userValidator = TypeCompiler.Compile(UserSchema)
export const createUserValidator = TypeCompiler.Compile(CreateUserSchema)

// Validation function with detailed errors
export function validate<T>(validator: TypeCompiler<T>, value: unknown): T {
  if (!validator.Check(value)) {
    const errors = [...validator.Errors(value)]
    throw new ValidationError('Validation failed', errors)
  }
  return value as T
}

// Custom validation error class
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: ValueError[]
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}
```

### 5. Express Middleware for Validation

```typescript
// src/validators/middleware.ts
import { Request, Response, NextFunction } from 'express'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { validate } from './compiler'

export function validateBody<T>(validator: TypeCompiler<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = validate(validator, req.body)
      next()
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            path: e.path,
            message: e.message,
            value: e.value,
          })),
        })
      } else {
        next(error)
      }
    }
  }
}

export function validateQuery<T>(validator: TypeCompiler<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Convert query params to proper types
      const query = convertQueryParams(req.query)
      req.query = validate(validator, query) as any
      next()
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            path: e.path,
            message: e.message,
            value: e.value,
          })),
        })
      } else {
        next(error)
      }
    }
  }
}

// Helper to convert string query params to proper types
function convertQueryParams(query: any): any {
  const result: any = {}
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') {
      // Try to parse as number
      const num = Number(value)
      if (!isNaN(num) && value !== '') {
        result[key] = num
        continue
      }
      // Try to parse as boolean
      if (value === 'true') {
        result[key] = true
        continue
      }
      if (value === 'false') {
        result[key] = false
        continue
      }
    }
    result[key] = value
  }
  return result
}
```

### 6. User Routes with Validation

```typescript
// src/routes/user.routes.ts
import { Router } from 'express'
import { validateBody, validateQuery } from '@/validators/middleware'
import { createUserValidator, userValidator } from '@/validators/compiler'
import { UserQuerySchema } from '@/schemas/user.schema'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import * as userService from '@/services/user.service'

const router = Router()
const queryValidator = TypeCompiler.Compile(UserQuerySchema)

// GET /users - List users
router.get('/', validateQuery(queryValidator), async (req, res) => {
  const query = req.query as any
  const result = await userService.getUsers(query)
  res.json(result)
})

// GET /users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  const user = await userService.getUserById(req.params.id)
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' })
  }
  res.json({ success: true, data: user })
})

// POST /users - Create user
router.post('/', validateBody(createUserValidator), async (req, res) => {
  const user = await userService.createUser(req.body)
  res.status(201).json({ success: true, data: user })
})

// PUT /users/:id - Update user
router.put('/:id', validateBody(createUserValidator), async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body)
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' })
  }
  res.json({ success: true, data: user })
})

// DELETE /users/:id - Delete user
router.delete('/:id', async (req, res) => {
  await userService.deleteUser(req.params.id)
  res.status(204).send()
})

export default router
```

### 7. Schema Composition and Reuse

```typescript
// src/schemas/auth.schema.ts
import { Type, Static } from '@sinclair/typebox'
import { UserSchema } from './user.schema'

// Login credentials
export const LoginSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8 }),
})

// Register schema (extends CreateUser)
export const RegisterSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8, maxLength: 100 }),
  confirmPassword: Type.String({ minLength: 8 }),
  name: Type.String({ minLength: 2, maxLength: 100 }),
})

// Auth response
export const AuthResponseSchema = Type.Object({
  success: Type.Boolean(),
  data: Type.Object({
    user: UserSchema,
    token: Type.String(),
    refreshToken: Type.String(),
  }),
})

// Refresh token
export const RefreshTokenSchema = Type.Object({
  refreshToken: Type.String(),
})

// Extract types
export type Login = Static<typeof LoginSchema>
export type Register = Static<typeof RegisterSchema>
export type AuthResponse = Static<typeof AuthResponseSchema>
```

### 8. Custom Formats and Patterns

```typescript
// src/schemas/custom.schema.ts
import { Type, FormatRegistry } from '@sinclair/typebox'

// Register custom format for phone numbers
FormatRegistry.Set('phone', (value) => {
  return /^\+?[\d\s-()]+$/.test(value)
})

// Register custom format for usernames
FormatRegistry.Set('username', (value) => {
  return /^[a-zA-Z0-9_]{3,30}$/.test(value)
})

// Custom schema with registered format
export const ProfileSchema = Type.Object({
  username: Type.String({ format: 'username' }),
  phone: Type.Optional(Type.String({ format: 'phone' })),
  website: Type.Optional(Type.String({ format: 'uri' })),
  bio: Type.Optional(Type.String({ maxLength: 500 })),
  avatar: Type.Optional(Type.String({ format: 'uri' })),
})
```

### 9. Transform and Encode/Decode

```typescript
// src/schemas/transform.schema.ts
import { Type, Transform } from '@sinclair/typebox'

// Transform string to Date
export const DateSchema = Transform(
  Type.String({ format: 'date-time' }),
  (schema) => ({
    decode: (value) => new Date(value),
    encode: (value) => value.toISOString(),
  })
)

// Transform string to number
export const NumericIdSchema = Transform(
  Type.String({ pattern: '^\\d+$' }),
  (schema) => ({
    decode: (value) => parseInt(value, 10),
    encode: (value) => value.toString(),
  })
)

// Transform comma-separated string to array
export const StringArraySchema = Transform(
  Type.String(),
  (schema) => ({
    decode: (value) => value.split(',').map((s) => s.trim()),
    encode: (value) => value.join(','),
  })
)
```

### 10. Testing Schemas

```typescript
// tests/schemas/user.schema.test.ts
import { describe, it, expect } from 'vitest'
import { UserSchema, CreateUserSchema } from '@/schemas/user.schema'
import { TypeCompiler } from '@sinclair/typebox/compiler'

describe('UserSchema', () => {
  const validator = TypeCompiler.Compile(UserSchema)

  it('should validate a valid user', () => {
    const validUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      name: 'John Doe',
      age: 30,
      role: 'user',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    expect(validator.Check(validUser)).toBe(true)
  })

  it('should reject invalid email', () => {
    const invalidUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'invalid-email',
      name: 'John Doe',
      role: 'user',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    expect(validator.Check(invalidUser)).toBe(false)
    const errors = [...validator.Errors(invalidUser)]
    expect(errors.some((e) => e.path === '/email')).toBe(true)
  })

  it('should reject invalid role', () => {
    const invalidUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      name: 'John Doe',
      role: 'invalid-role',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    expect(validator.Check(invalidUser)).toBe(false)
  })
})

describe('CreateUserSchema', () => {
  const validator = TypeCompiler.Compile(CreateUserSchema)

  it('should validate create user input', () => {
    const validInput = {
      email: 'newuser@example.com',
      name: 'Jane Doe',
      role: 'user',
      isActive: true,
    }

    expect(validator.Check(validInput)).toBe(true)
  })

  it('should allow optional fields to be omitted', () => {
    const validInput = {
      email: 'newuser@example.com',
      name: 'Jane Doe',
      role: 'user',
      isActive: true,
    }

    expect(validator.Check(validInput)).toBe(true)
  })
})
```

## Best Practices

1. **Single Source of Truth**: Define schemas once, extract types with `Static`
2. **Compile for Performance**: Use `TypeCompiler` for runtime validation
3. **Modular Schemas**: Organize schemas by domain
4. **Reuse Schemas**: Use `Type.Partial`, `Type.Pick`, `Type.Omit` to derive schemas
5. **Custom Formats**: Register custom formats for domain-specific validation
6. **Detailed Errors**: Capture and format validation errors for API responses
7. **Type Safety**: Always use `Static<typeof Schema>` for TypeScript types
8. **Testing**: Test schemas independently to ensure validation logic is correct

## Common Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Build for production
pnpm test                   # Run tests
pnpm test:watch             # Watch mode

# Type checking
pnpm type-check             # TypeScript check

# Linting
pnpm lint                   # Run ESLint
pnpm lint:fix               # Fix issues
```

## Performance Optimization

```typescript
// Use TypeCompiler for repeated validation
import { TypeCompiler } from '@sinclair/typebox/compiler'

// Compile once, use many times
const compiledValidator = TypeCompiler.Compile(MySchema)

// Fast validation
if (compiledValidator.Check(data)) {
  // data is valid
}
```

## Integration Examples

### Fastify Integration

```typescript
import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'

const fastify = Fastify().withTypeProvider<TypeBoxTypeProvider>()

fastify.post(
  '/users',
  {
    schema: {
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        name: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String(),
            email: Type.String(),
            name: Type.String(),
          }),
        }),
      },
    },
  },
  async (request, reply) => {
    // request.body is fully typed
    const { email, name } = request.body
    // ...
    return { success: true, data: { id: '1', email, name } }
  }
)
```

## Resources

- [TypeBox Documentation](https://github.com/sinclairzx81/typebox)
- [TypeBox Playground](https://typebox-playground.vercel.app/)
- [Fastify Type Provider](https://github.com/fastify/fastify-type-provider-typebox)
- [JSON Schema Specification](https://json-schema.org/)
