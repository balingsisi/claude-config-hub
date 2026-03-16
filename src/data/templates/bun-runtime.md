# Bun Runtime Application Template

## Project Overview

Modern full-stack application built with Bun - the fast all-in-one JavaScript runtime, bundler, test runner, and package manager.

## Tech Stack

- **Runtime**: Bun v1
- **Framework**: Hono or Elysia
- **Language**: TypeScript 5
- **Database**: Bun SQLite / PostgreSQL with Drizzle ORM
- **Testing**: Bun Test (built-in)
- **Package Manager**: Bun (built-in)

## Project Structure

```
src/
├── index.ts              # Entry point
├── routes/               # API routes
│   ├── users.ts
│   ├── auth.ts
│   └── api.ts
├── middleware/           # Middleware
│   ├── auth.ts
│   ├── cors.ts
│   └── logger.ts
├── lib/                  # Utilities
│   ├── db.ts
│   ├── jwt.ts
│   └── validators.ts
├── models/               # Data models
├── services/             # Business logic
└── tests/                # Test files
    ├── index.test.ts
    └── setup.ts
```

## Key Patterns

### 1. Server Setup with Hono

```typescript
// src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { authMiddleware } from './middleware/auth'
import userRoutes from './routes/users'
import authRoutes from './routes/auth'

const app = new Hono()

// Global middleware
app.use('*', cors())
app.use('*', logger())
app.use('*', prettyJSON())

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// Routes
app.route('/auth', authRoutes)
app.route('/users', authMiddleware, userRoutes)

// Error handler
app.onError((err, c) => {
  console.error('Server Error:', err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

// Start server
const port = process.env.PORT || 3000
console.log(`🦊 Server running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
```

### 2. Database with Bun SQLite

```typescript
// src/lib/db.ts
import { Database } from 'bun:sqlite'

const db = new Database('app.db')

// Enable WAL mode for better performance
db.run('PRAGMA journal_mode = WAL')

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// Prepared statements (Bun's superpower)
export const queries = {
  getUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
  getUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  createUser: db.prepare(`
    INSERT INTO users (email, password_hash, name)
    VALUES ($email, $password_hash, $name)
    RETURNING *
  `),
}

export default db
```

### 3. Password Hashing with Bun

```typescript
// src/lib/password.ts
import { Buffer } from 'buffer'

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  
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

### 4. JWT Authentication

```typescript
// src/lib/jwt.ts
import { sign, verify } from 'hono/jwt'

const SECRET = process.env.JWT_SECRET!

export async function createToken(payload: object): Promise<string> {
  return await sign({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, SECRET)
}

export async function verifyToken(token: string): Promise<object | null> {
  try {
    return await verify(token, SECRET)
  } catch {
    return null
  }
}
```

### 5. Route Handler Example

```typescript
// src/routes/users.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { queries } from '../lib/db'

const app = new Hono()

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
})

app.get('/:id', (c) => {
  const id = c.req.param('id')
  const user = queries.getUserById.get(id)
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }
  
  // Remove password hash from response
  const { password_hash, ...safeUser } = user
  return c.json(safeUser)
})

app.patch('/:id', zValidator('json', updateUserSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  
  // Update user...
  return c.json({ success: true })
})

export default app
```

### 6. Testing with Bun

```typescript
// src/tests/index.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import app from '../index'

describe('Health Check', () => {
  test('should return ok status', async () => {
    const req = new Request('http://localhost/health')
    const res = await app.fetch(req)
    const data = await res.json()
    
    expect(data.status).toBe('ok')
  })
})

describe('User API', () => {
  test('should create user', async () => {
    const req = new Request('http://localhost/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }),
    })
    
    const res = await app.fetch(req)
    expect(res.status).toBe(201)
  })
})
```

## Best Practices

1. **Use Prepared Statements**: Bun's SQLite is optimized for prepared statements
2. **Leverage Built-in Tools**: Use Bun's test runner, bundler, and package manager
3. **Type-Safe APIs**: Use Zod for runtime validation
4. **Edge Compatibility**: Design for edge deployment
5. **Hot Reload**: Use `bun --hot` for development

## Common Commands

```bash
# Install dependencies
bun install

# Development with hot reload
bun --hot src/index.ts

# Run tests
bun test

# Run tests with coverage
bun test --coverage

# Build for production
bun build src/index.ts --compile --outfile app

# Type checking
bunx tsc --noEmit
```

## Performance Tips

1. **Use Native APIs**: Bun's `fetch`, `WebSocket`, `SQLite` are native and fast
2. **Prepared Statements**: Cache prepared statements for repeated queries
3. **Streaming**: Use `ReadableStream` for large responses
4. **Worker Threads**: Offload CPU-intensive work to workers
5. **Binary Compilation**: Compile to single binary for deployment

## Deployment Options

### Fly.io

```toml
# fly.toml
app = "your-app-name"

[build]
  builtin = "bun"

[env]
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80
```

### Docker

```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
```

## Security Considerations

1. Use environment variables for secrets
2. Validate all user input with Zod
3. Implement rate limiting
4. Use HTTPS in production
5. Hash passwords with strong algorithms (consider argon2)

## Bun vs Node.js

| Feature | Bun | Node.js |
|---------|-----|---------|
| Startup time | ~2ms | ~200ms |
| Test runner | Built-in | Requires Jest/Vitest |
| Package manager | Built-in | npm/yarn/pnpm |
| Bundler | Built-in | Requires webpack/vite |
| SQLite | Built-in | Requires better-sqlite3 |

## Resources

- [Bun Documentation](https://bun.sh/docs)
- [Hono Framework](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
