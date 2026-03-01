# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Node.js Express API
**Type**: RESTful API Backend
**Tech Stack**: Node.js 20 + Express + TypeScript
**Goal**: Production-ready REST API with authentication, validation, and testing

---

## Tech Stack

### Core
- **Runtime**: Node.js 20+ (LTS)
- **Framework**: Express 4.18+
- **Language**: TypeScript 5.9+

### Database & ORM
- **Database**: PostgreSQL 15+ / MongoDB
- **ORM**: Prisma (PostgreSQL) / Mongoose (MongoDB)
- **Migrations**: Prisma Migrate

### Authentication & Security
- **Auth**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Zod
- **Security**: helmet, cors, express-rate-limit

### Development
- **Package Manager**: pnpm
- **Testing**: Vitest + supertest
- **Linting**: ESLint + Prettier
- **API Docs**: Swagger/OpenAPI

---

## Project Structure

```
project/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── swagger.ts
│   ├── controllers/      # Route controllers
│   ├── middlewares/      # Custom middlewares
│   ├── models/           # Database models (if using Mongoose)
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── prisma/               # Prisma schema (if using Prisma)
├── tests/                # Test files
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Application Setup

### Express App Configuration
```typescript
// src/app.ts
import express, { type Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './middlewares/errorHandler'
import { routes } from './routes'

export function createApp(): Express {
  const app = express()

  // Security middleware
  app.use(helmet())
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }))

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
  })
  app.use('/api', limiter)

  // Body parsing
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // Routes
  app.use('/api', routes)

  // Error handling (must be last)
  app.use(errorHandler)

  return app
}
```

### Server Entry Point
```typescript
// src/server.ts
import { createApp } from './app'
import { config } from './config/env'

const app = createApp()

app.listen(config.PORT, () => {
  console.log(`🚀 Server running on port ${config.PORT}`)
  console.log(`📚 Environment: ${config.NODE_ENV}`)
})
```

---

## Routing Best Practices

### Route Organization
```typescript
// src/routes/index.ts
import { Router } from 'express'
import { authRoutes } from './auth.routes'
import { userRoutes } from './user.routes'
import { postRoutes } from './post.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/posts', postRoutes)

export { router as routes }
```

### Individual Routes
```typescript
// src/routes/post.routes.ts
import { Router } from 'express'
import { PostController } from '../controllers/post.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validation.middleware'
import { postSchema, createPostSchema } from '../schemas/post.schema'

const router = Router()
const controller = new PostController()

// Public routes
router.get('/', controller.getAll)
router.get('/:id', controller.getById)

// Protected routes
router.post(
  '/',
  authMiddleware,
  validate(createPostSchema),
  controller.create
)

router.put(
  '/:id',
  authMiddleware,
  validate(postSchema),
  controller.update
)

router.delete(
  '/:id',
  authMiddleware,
  controller.delete
)

export { router as postRoutes }
```

---

## Controllers

### Controller Pattern
```typescript
// src/controllers/post.controller.ts
import { Request, Response, NextFunction } from 'express'
import { PostService } from '../services/post.service'
import { AsyncHandler } from '../utils/asyncHandler'

export class PostController {
  private service: PostService

  constructor() {
    this.service = new PostService()
  }

  getAll: AsyncHandler = async (req, res, next) => {
    const { page = 1, limit = 10 } = req.query
    const posts = await this.service.getAll({
      page: Number(page),
      limit: Number(limit),
    })
    res.json(posts)
  }

  getById: AsyncHandler = async (req, res, next) => {
    const { id } = req.params
    const post = await this.service.getById(id)
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }
    res.json(post)
  }

  create: AsyncHandler = async (req, res, next) => {
    const userId = req.user!.id // From auth middleware
    const post = await this.service.create(req.body, userId)
    res.status(201).json(post)
  }

  update: AsyncHandler = async (req, res, next) => {
    const { id } = req.params
    const userId = req.user!.id
    const post = await this.service.update(id, req.body, userId)
    res.json(post)
  }

  delete: AsyncHandler = async (req, res, next) => {
    const { id } = req.params
    const userId = req.user!.id
    await this.service.delete(id, userId)
    res.status(204).send()
  }
}
```

### Async Handler Utility
```typescript
// src/utils/asyncHandler.ts
import { Request, Response, NextFunction } from 'express'

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>

export function asyncHandler(fn: AsyncHandler): AsyncHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
```

---

## Middleware

### Authentication Middleware
```typescript
// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/env'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.substring(7)

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as {
      id: string
      email: string
    }
    req.user = payload
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
```

### Validation Middleware
```typescript
// src/middlewares/validation.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { AnyZodObject, ZodError } from 'zod'

export function validate(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        })
      }
      next(error)
    }
  }
}
```

### Error Handler
```typescript
// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err.stack)

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
    })
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message,
    })
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
}
```

---

## Services & Business Logic

### Service Layer
```typescript
// src/services/post.service.ts
import { PrismaClient } from '@prisma/client'
import { NotFoundError } from '../utils/errors'

const prisma = new PrismaClient()

export class PostService {
  async getAll(params: { page: number; limit: number }) {
    const { page, limit } = params
    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { author: true },
      }),
      prisma.post.count(),
    ])

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getById(id: string) {
    const post = await prisma.post.findUnique({
      where: { id },
      include: { author: true },
    })

    if (!post) {
      throw new NotFoundError('Post not found')
    }

    return post
  }

  async create(data: any, authorId: string) {
    return prisma.post.create({
      data: {
        ...data,
        authorId,
      },
      include: { author: true },
    })
  }

  async update(id: string, data: any, userId: string) {
    const post = await this.getById(id)

    if (post.authorId !== userId) {
      throw new Error('Unauthorized')
    }

    return prisma.post.update({
      where: { id },
      data,
      include: { author: true },
    })
  }

  async delete(id: string, userId: string) {
    const post = await this.getById(id)

    if (post.authorId !== userId) {
      throw new Error('Unauthorized')
    }

    await prisma.post.delete({ where: { id } })
  }
}
```

---

## Validation with Zod

### Schema Definitions
```typescript
// src/schemas/post.schema.ts
import { z } from 'zod'

export const postSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  published: z.boolean().optional(),
})

export const createPostSchema = postSchema

export const updatePostSchema = postSchema.partial()

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})
```

---

## Testing

### Controller Tests
```typescript
// tests/controllers/post.controller.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app'
import { PostController } from '../../src/controllers/post.controller'

describe('Post Controller', () => {
  let app: Express

  beforeEach(() => {
    app = createApp()
    // Setup test database, mocks, etc.
  })

  it('should get all posts', async () => {
    const response = await request(app)
      .get('/api/posts')
      .expect(200)

    expect(response.body).toHaveProperty('data')
    expect(response.body).toHaveProperty('meta')
  })

  it('should create a post', async () => {
    const newPost = {
      title: 'Test Post',
      content: 'Test content',
    }

    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send(newPost)
      .expect(201)

    expect(response.body).toHaveProperty('id')
    expect(response.body.title).toBe(newPost.title)
  })
})
```

---

## Common Commands

### Development
```bash
pnpm dev          # Start dev server with hot reload
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
```

### Database (Prisma)
```bash
pnpm prisma dev          # Watch schema changes
pnpm prisma studio       # Open Prisma Studio
pnpm prisma push         # Push schema to DB
pnpm prisma migrate dev  # Create and apply migration
pnpm prisma generate     # Generate client
```

### Testing
```bash
pnpm test         # Run tests
pnpm test:watch   # Watch mode
pnpm test:cover   # Coverage report
```

---

## Important Prohibitions

### ❌ Never Do
- Don't use `any` type - use proper TypeScript
- Don't ignore TypeScript errors
- Don't forget to validate input with Zod
- Don't expose sensitive data in responses
- Don't hardcode configuration - use environment variables
- Don't commit `.env` files
- Don't forget error handling in async functions
- Don't use synchronous functions (except in bootstrap)

### ⚠️ Use with Caution
- `any` type - only when absolutely necessary
- `console.log` in production - use proper logging
- Callback hell - use async/await
- Global variables - avoid them

---

## Best Practices

### Error Handling
```typescript
// ✅ Good - Proper error handling
async function getPost(id: string) {
  try {
    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) {
      throw new NotFoundError('Post not found')
    }
    return post
  } catch (error) {
    // Log error for debugging
    console.error('Failed to get post:', error)
    throw error
  }
}

// ❌ Bad - No error handling
async function getPost(id: string) {
  return await prisma.post.findUnique({ where: { id } })
}
```

### Environment Configuration
```typescript
// ✅ Good - Use environment variables
const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
}

// ❌ Bad - Hardcoded values
const config = {
  PORT: 3000,
  DATABASE_URL: 'postgresql://localhost/mydb',
  JWT_SECRET: 'secret123',
}
```

---

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\"",
    "test": "vitest",
    "test:cover": "vitest --coverage",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:studio": "prisma studio"
  }
}
```

---

**Last Updated**: 2026-03-01
