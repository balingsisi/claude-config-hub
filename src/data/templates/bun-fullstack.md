# Bun 全栈应用模板

## 项目概述

基于 Bun 运行时的现代全栈应用模板，整合 Hono (Web框架) + Drizzle ORM + Bun SQLite，提供极致性能和开发体验。

## 技术栈

- **运行时**: Bun 1.1+
- **Web框架**: Hono 4.0+
- **ORM**: Drizzle ORM 0.30+
- **数据库**: Bun SQLite / PostgreSQL
- **验证**: Zod 3.22+
- **认证**: @hono/jwt + bcrypt
- **UI**: React / Vue / Svelte (可选)
- **构建**: Bun (内置)
- **测试**: Bun Test (内置)

## 项目结构

```
bun-fullstack-app/
├── src/
│   ├── index.ts                # 应用入口
│   ├── app.ts                  # Hono 应用配置
│   ├── db/
│   │   ├── index.ts           # 数据库连接
│   │   ├── schema.ts          # Drizzle Schema
│   │   ├── migrations/        # 迁移文件
│   │   └── seed.ts            # 种子数据
│   ├── routes/
│   │   ├── index.ts           # 路由聚合
│   │   ├── auth.ts            # 认证路由
│   │   ├── users.ts           # 用户路由
│   │   ├── posts.ts           # 文章路由
│   │   └── api.ts             # API 路由
│   ├── middleware/
│   │   ├── auth.ts            # JWT 认证
│   │   ├── cors.ts            # CORS 配置
│   │   ├── rateLimit.ts       # 速率限制
│   │   └── errorHandler.ts    # 错误处理
│   ├── services/
│   │   ├── UserService.ts
│   │   ├── AuthService.ts
│   │   ├── EmailService.ts
│   │   └── FileService.ts
│   ├── models/
│   │   ├── User.ts
│   │   └── Post.ts
│   ├── validators/
│   │   ├── auth.ts
│   │   └── user.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── response.ts
│   ├── types/
│   │   └── index.ts
│   └── frontend/              # 前端代码（可选）
│       ├── index.html
│       ├── main.tsx
│       └── App.tsx
├── tests/
│   ├── auth.test.ts
│   └── users.test.ts
├── drizzle.config.ts
├── bunfig.toml
├── package.json
└── tsconfig.json
```

## 核心配置

### 1. 应用入口

```typescript
// src/index.ts
import { serve } from 'bun'
import app from './app'

const port = process.env.PORT || 3000

serve({
  fetch: app.fetch,
  port,
})

console.log(`🦊 Bun server running at http://localhost:${port}`)
```

```typescript
// src/app.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { compress } from 'hono/compress'
import { secureHeaders } from 'hono/secure-headers'
import { timeout } from 'hono/timeout'

import routes from './routes'
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimit'

const app = new Hono()

// 全局中间件
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', compress())
app.use('*', secureHeaders())
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://myapp.com'],
  credentials: true,
}))
app.use('*', timeout(30000))

// 速率限制
app.use('/api/*', rateLimiter)

// 健康检查
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// API 路由
app.route('/api', routes)

// 错误处理
app.onError(errorHandler)

// 404 处理
app.notFound((c) => c.json({ error: 'Not Found' }, 404))

export default app
```

### 2. 数据库配置

```typescript
// src/db/index.ts
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import * as schema from './schema'

const sqlite = new Database('app.db')
sqlite.run('PRAGMA journal_mode = WAL')
sqlite.run('PRAGMA synchronous = NORMAL')
sqlite.run('PRAGMA cache_size = -64000') // 64MB cache
sqlite.run('PRAGMA foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

// 自动迁移
if (process.env.NODE_ENV !== 'test') {
  migrate(db, { migrationsFolder: './src/db/migrations' })
}

export type DbType = typeof db
```

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
}))

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
  authorId: text('author_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  authorIdx: index('author_idx').on(table.authorId),
  publishedIdx: index('published_idx').on(table.published),
}))

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
})

// 关系
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  sessions: many(sessions),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))
```

### 3. 认证中间件

```typescript
// src/middleware/auth.ts
import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { verify } from 'hono/jwt'
import { db } from '../db'
import { sessions, users } from '../db/schema'
import { eq, and, gt } from 'drizzle-orm'

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing authorization header' })
  }
  
  const token = authHeader.substring(7)
  
  try {
    // 验证 JWT
    const payload = await verify(token, process.env.JWT_SECRET!)
    
    // 查询会话
    const session = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, payload.sessionId as string),
          gt(sessions.expiresAt, new Date())
        )
      )
      .get()
    
    if (!session) {
      throw new HTTPException(401, { message: 'Session expired' })
    }
    
    // 查询用户
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .get()
    
    if (!user) {
      throw new HTTPException(401, { message: 'User not found' })
    }
    
    // 设置用户信息到上下文
    c.set('user', user)
    c.set('sessionId', session.id)
    
    await next()
  } catch (error) {
    throw new HTTPException(401, { message: 'Invalid token' })
  }
}

// 可选认证（不强制要求登录）
export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    await next()
    return
  }
  
  return authMiddleware(c, next)
}

// 角色检查
export function requireRole(role: 'user' | 'admin') {
  return async (c: Context, next: Next) => {
    const user = c.get('user')
    
    if (!user || user.role !== role) {
      throw new HTTPException(403, { message: 'Insufficient permissions' })
    }
    
    await next()
  }
}
```

### 4. 服务层

```typescript
// src/services/AuthService.ts
import { db } from '../db'
import { users, sessions } from '../db/schema'
import { eq } from 'drizzle-orm'
import { sign } from 'hono/jwt'
import { hashPassword, verifyPassword } from '../utils/password'
import { generateId } from '../utils/helpers'

export class AuthService {
  async register(email: string, password: string, name: string) {
    // 检查邮箱是否已存在
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get()
    
    if (existingUser) {
      throw new Error('Email already registered')
    }
    
    // 创建用户
    const userId = generateId()
    const passwordHash = await hashPassword(password)
    
    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      name,
      role: 'user',
      emailVerified: false,
    })
    
    // 创建会话
    const session = await this.createSession(userId)
    
    return {
      user: { id: userId, email, name },
      session,
    }
  }
  
  async login(email: string, password: string) {
    // 查询用户
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get()
    
    if (!user) {
      throw new Error('Invalid credentials')
    }
    
    // 验证密码
    const valid = await verifyPassword(password, user.passwordHash)
    
    if (!valid) {
      throw new Error('Invalid credentials')
    }
    
    // 创建会话
    const session = await this.createSession(user.id)
    
    return {
      user: { id: user.id, email: user.email, name: user.name },
      session,
    }
  }
  
  private async createSession(userId: string) {
    const sessionId = generateId()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    
    await db.insert(sessions).values({
      id: sessionId,
      userId,
      expiresAt,
    })
    
    // 生成 JWT
    const token = await sign(
      {
        sessionId,
        userId,
        exp: Math.floor(expiresAt.getTime() / 1000),
      },
      process.env.JWT_SECRET!
    )
    
    return { token, expiresAt }
  }
  
  async logout(sessionId: string) {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
  }
}

export const authService = new AuthService()
```

```typescript
// src/services/UserService.ts
import { db } from '../db'
import { users, posts } from '../db/schema'
import { eq, desc } from 'drizzle-orm'

export class UserService {
  async getUserById(id: string) {
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .get()
    
    return user
  }
  
  async getUserWithPosts(id: string) {
    const user = await this.getUserById(id)
    
    if (!user) {
      return null
    }
    
    const userPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.authorId, id))
      .orderBy(desc(posts.createdAt))
      .limit(10)
    
    return {
      ...user,
      posts: userPosts,
    }
  }
  
  async updateUser(id: string, data: { name?: string; avatar?: string }) {
    await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
    
    return this.getUserById(id)
  }
}

export const userService = new UserService()
```

### 5. 路由

```typescript
// src/routes/auth.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authService } from '../services/AuthService'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

app.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, name } = c.req.valid('json')
  
  const result = await authService.register(email, password, name)
  
  return c.json({
    success: true,
    data: result,
  }, 201)
})

app.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  
  const result = await authService.login(email, password)
  
  return c.json({
    success: true,
    data: result,
  })
})

app.post('/logout', authMiddleware, async (c) => {
  const sessionId = c.get('sessionId')
  
  await authService.logout(sessionId)
  
  return c.json({
    success: true,
    message: 'Logged out successfully',
  })
})

app.get('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  
  return c.json({
    success: true,
    data: user,
  })
})

export default app
```

```typescript
// src/routes/users.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { userService } from '../services/UserService'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const user = await userService.getUserWithPosts(id)
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }
  
  return c.json({ success: true, data: user })
})

app.patch('/:id', authMiddleware, zValidator('json', z.object({
  name: z.string().optional(),
  avatar: z.string().url().optional(),
})), async (c) => {
  const id = c.req.param('id')
  const currentUser = c.get('user')
  const data = c.req.valid('json')
  
  // 只能更新自己的信息
  if (currentUser.id !== id) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  
  const user = await userService.updateUser(id, data)
  
  return c.json({ success: true, data: user })
})

export default app
```

```typescript
// src/routes/index.ts
import { Hono } from 'hono'
import authRoutes from './auth'
import usersRoutes from './users'
import postsRoutes from './posts'

const app = new Hono()

app.route('/auth', authRoutes)
app.route('/users', usersRoutes)
app.route('/posts', postsRoutes)

export default app
```

### 6. 工具函数

```typescript
// src/utils/password.ts
import { Buffer } from 'buffer'

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + process.env.PASSWORD_SALT)
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}
```

```typescript
// src/utils/helpers.ts
export function generateId(): string {
  return crypto.randomUUID()
}

export function formatDate(date: Date): string {
  return date.toISOString()
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
}
```

### 7. 错误处理

```typescript
// src/middleware/errorHandler.ts
import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'

export async function errorHandler(err: Error, c: Context) {
  console.error('Error:', err)
  
  // HTTP 异常
  if (err instanceof HTTPException) {
    return c.json({
      success: false,
      error: err.message,
    }, err.status)
  }
  
  // Zod 验证错误
  if (err instanceof ZodError) {
    return c.json({
      success: false,
      error: 'Validation error',
      details: err.errors,
    }, 400)
  }
  
  // 默认错误
  return c.json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  }, 500)
}
```

### 8. 速率限制

```typescript
// src/middleware/rateLimit.ts
import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'

const requests = new Map<string, { count: number; resetTime: number }>()

export async function rateLimiter(c: Context, next: Next) {
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 100
  
  const record = requests.get(ip)
  
  if (!record || now > record.resetTime) {
    requests.set(ip, { count: 1, resetTime: now + windowMs })
  } else if (record.count >= maxRequests) {
    throw new HTTPException(429, { message: 'Too many requests' })
  } else {
    record.count++
  }
  
  await next()
  
  // 清理过期记录
  if (Math.random() < 0.01) { // 1% 概率清理
    for (const [key, value] of requests.entries()) {
      if (now > value.resetTime) {
        requests.delete(key)
      }
    }
  }
}
```

### 9. 测试

```typescript
// tests/auth.test.ts
import { describe, test, expect, beforeAll } from 'bun:test'
import app from '../src/app'

describe('Auth API', () => {
  test('POST /api/auth/register', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }),
    })
    
    const res = await app.fetch(req)
    const data = await res.json()
    
    expect(res.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.user.email).toBe('test@example.com')
  })
  
  test('POST /api/auth/login', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    })
    
    const res = await app.fetch(req)
    const data = await res.json()
    
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.session.token).toBeDefined()
  })
})
```

## 最佳实践

### 1. 性能优化

```typescript
// 使用 prepared statements
const preparedQueries = {
  getUserById: db.select().from(users).where(eq(users.id, placeholder('id'))).prepare(),
}

const user = await preparedQueries.getUserById.execute({ id: '123' })

// 批量操作
await db.insert(users).values([
  { id: '1', email: 'user1@example.com', /* ... */ },
  { id: '2', email: 'user2@example.com', /* ... */ },
])

// 使用事务
await db.transaction(async (tx) => {
  await tx.insert(users).values({ /* ... */ })
  await tx.insert(posts).values({ /* ... */ })
})
```

### 2. 安全

```bash
# .env
JWT_SECRET=your-super-secret-key
PASSWORD_SALT=your-password-salt
DATABASE_URL=file:app.db
```

```typescript
// 输入验证
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[0-9])/),
})
```

### 3. 日志

```typescript
// 结构化日志
app.use('*', async (c, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start
  
  console.log(JSON.stringify({
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration,
    timestamp: new Date().toISOString(),
  }))
})
```

## 常用命令

```bash
# 安装依赖
bun install

# 开发模式
bun --hot src/index.ts

# 测试
bun test

# 测试覆盖率
bun test --coverage

# 生成迁移
bunx drizzle-kit generate

# 运行迁移
bunx drizzle-kit migrate

# 打开 Drizzle Studio
bunx drizzle-kit studio

# 构建
bun build src/index.ts --compile --outfile app

# 类型检查
bunx tsc --noEmit
```

## 部署配置

### Docker

```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

COPY . .

RUN bunx drizzle-kit migrate

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
```

### Fly.io

```toml
# fly.toml
app = "my-bun-app"

[build]
  builtin = "bun"

[env]
  PORT = "8080"
  NODE_ENV = "production"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

### Vercel

```json
// vercel.json
{
  "buildCommand": "bun run build",
  "outputDirectory": "dist",
  "framework": "bun"
}
```

## 资源

- [Bun 官方文档](https://bun.sh/docs)
- [Hono 框架](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Bun Discord](https://discord.gg/bun)
