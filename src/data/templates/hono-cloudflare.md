# Hono + Cloudflare Workers Template

## Project Overview

Edge-first API framework with Hono and Cloudflare Workers, featuring ultra-fast response times, global distribution, TypeScript support, and serverless deployment.

## Tech Stack

- **Framework**: Hono 4.x
- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Database**: D1 / Durable Objects / KV
- **Deployment**: Cloudflare Workers
- **Package Manager**: npm / pnpm

## Project Structure

```
project/
├── src/
│   ├── index.ts              # Main entry point
│   ├── routes/               # API routes
│   │   ├── users.ts
│   │   ├── posts.ts
│   │   └── auth.ts
│   ├── middleware/           # Custom middleware
│   │   ├── auth.ts
│   │   ├── logger.ts
│   │   └── cors.ts
│   ├── services/             # Business logic
│   │   ├── userService.ts
│   │   └── emailService.ts
│   ├── models/               # Data models
│   │   └── user.ts
│   ├── utils/                # Helper functions
│   │   ├── validators.ts
│   │   └── responses.ts
│   └── types/                # TypeScript types
│       └── index.ts
├── migrations/               # Database migrations
│   └── 0001_create_users.sql
├── wrangler.toml             # Cloudflare Workers config
├── package.json
├── tsconfig.json
└── vite.config.ts            # For testing
```

## Key Patterns

### 1. Cloudflare Workers Configuration

```toml
# wrangler.toml
name = "my-hono-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# Account ID
account_id = "your-account-id"

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "your-database-id"

# KV Namespace
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-id"

# Durable Objects
[[durable_objects.bindings]]
name = "COUNTER"
class_name = "Counter"

# Environment variables
[vars]
ENVIRONMENT = "production"
API_VERSION = "1.0.0"

# Secrets (use wrangler secret put)
# JWT_SECRET
# DATABASE_URL

# Build configuration
[build]
command = "npm run build"

# Development settings
[dev]
port = 8787
local_protocol = "http"
```

### 2. Main Application

```typescript
// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { compress } from 'hono/compress';

import { authMiddleware } from './middleware/auth';
import userRoutes from './routes/users';
import postRoutes from './routes/posts';
import authRoutes from './routes/auth';

export type Env = {
  DB: D1Database;
  CACHE: KVNamespace;
  COUNTER: DurableObjectNamespace;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', cors());
app.use('*', secureHeaders());
app.use('*', prettyJSON());
app.use('*', compress());

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.route('/auth', authRoutes);

// Protected routes
app.use('/api/*', authMiddleware);
app.route('/api/users', userRoutes);
app.route('/api/posts', postRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server Error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;

// Export Durable Object
export { Counter } from './durable-objects/Counter';
```

### 3. Route Handler

```typescript
// src/routes/users.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { Env } from '../index';
import { UserService } from '../services/userService';

const app = new Hono<{ Bindings: Env }>();
const userService = new UserService();

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  age: z.number().int().min(0).max(150).optional(),
});

// GET /api/users
app.get('/', async (c) => {
  const users = await userService.getAll(c.env.DB);
  return c.json({ users });
});

// GET /api/users/:id
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = await userService.getById(c.env.DB, id);
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json({ user });
});

// POST /api/users
app.post('/', zValidator('json', createUserSchema), async (c) => {
  const data = c.req.valid('json');
  const user = await userService.create(c.env.DB, data);
  
  return c.json({ user }, 201);
});

// PUT /api/users/:id
app.put('/:id', zValidator('json', updateUserSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  
  const user = await userService.update(c.env.DB, id, data);
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json({ user });
});

// DELETE /api/users/:id
app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await userService.delete(c.env.DB, id);
  
  return c.json({ success: true });
});

export default app;
```

### 4. Service Layer

```typescript
// src/services/userService.ts
import { Env } from '../index';

interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  created_at: string;
  updated_at: string;
}

interface CreateUserData {
  name: string;
  email: string;
  age?: number;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  age?: number;
}

export class UserService {
  async getAll(db: Env['DB']): Promise<User[]> {
    const result = await db.prepare(
      'SELECT id, name, email, age, created_at, updated_at FROM users ORDER BY created_at DESC'
    ).all<User>();
    
    return result.results;
  }

  async getById(db: Env['DB'], id: string): Promise<User | null> {
    const result = await db.prepare(
      'SELECT id, name, email, age, created_at, updated_at FROM users WHERE id = ?'
    ).bind(id).first<User>();
    
    return result;
  }

  async create(db: Env['DB'], data: CreateUserData): Promise<User> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await db.prepare(
      'INSERT INTO users (id, name, email, age, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, data.name, data.email, data.age || null, now, now).run();
    
    const user = await this.getById(db, id);
    return user!;
  }

  async update(db: Env['DB'], id: string, data: UpdateUserData): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.age !== undefined) {
      fields.push('age = ?');
      values.push(data.age);
    }
    
    if (fields.length === 0) {
      return this.getById(db, id);
    }
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    await db.prepare(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`
    ).bind(...values).run();
    
    return this.getById(db, id);
  }

  async delete(db: Env['DB'], id: string): Promise<void> {
    await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
  }
}
```

### 5. Authentication Middleware

```typescript
// src/middleware/auth.ts
import { Context, Next } from 'hono';
import { Env } from '../index';
import { verify } from 'jsonwebtoken';

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = verify(token, c.env.JWT_SECRET) as { userId: string };
    c.set('userId', decoded.userId);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}
```

### 6. D1 Database

```typescript
// migrations/0001_create_users.sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  age INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

```bash
# Run migrations locally
wrangler d1 migrations apply my-database --local

# Run migrations in production
wrangler d1 migrations apply my-database --remote
```

### 7. KV Namespace

```typescript
// src/services/cacheService.ts
import { Env } from '../index';

export class CacheService {
  constructor(private kv: Env['CACHE']) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.kv.get(key, 'json');
    return value as T | null;
  }

  async set(key: string, value: any, expirationTtl?: number): Promise<void> {
    await this.kv.put(key, JSON.stringify(value), {
      expirationTtl: expirationTtl || 3600, // Default 1 hour
    });
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }

  async getWithMetadata<T>(key: string): Promise<{ value: T | null; metadata: any }> {
    const result = await this.kv.getWithMetadata<T>(key, 'json');
    return { value: result.value, metadata: result.metadata };
  }
}
```

```typescript
// src/routes/posts.ts
import { Hono } from 'hono';
import { Env } from '../index';
import { CacheService } from '../services/cacheService';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  const cache = new CacheService(c.env.CACHE);
  
  // Try to get from cache
  const cached = await cache.get<any[]>('posts:all');
  if (cached) {
    return c.json({ posts: cached, cached: true });
  }
  
  // Fetch from database
  const result = await c.env.DB.prepare(
    'SELECT id, title, content, author_id, created_at FROM posts ORDER BY created_at DESC'
  ).all();
  
  // Cache for 5 minutes
  await cache.set('posts:all', result.results, 300);
  
  return c.json({ posts: result.results, cached: false });
});

export default app;
```

### 8. Durable Objects

```typescript
// src/durable-objects/Counter.ts
import { DurableObject } from 'cloudflare:workers';

export class Counter extends DurableObject {
  private value: number = 0;

  constructor(state: DurableObjectState) {
    super(state);
    
    // Restore state from storage
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<number>('value');
      this.value = stored || 0;
    });
  }

  async increment(amount: number = 1): Promise<number> {
    this.value += amount;
    await this.state.storage.put('value', this.value);
    return this.value;
  }

  async decrement(amount: number = 1): Promise<number> {
    this.value -= amount;
    await this.state.storage.put('value', this.value);
    return this.value;
  }

  async getValue(): Promise<number> {
    return this.value;
  }

  async reset(): Promise<number> {
    this.value = 0;
    await this.state.storage.put('value', this.value);
    return this.value;
  }
}
```

```typescript
// src/routes/counter.ts
import { Hono } from 'hono';
import { Env } from '../index';
import { Counter } from '../durable-objects/Counter';

const app = new Hono<{ Bindings: Env }>();

app.post('/:id/increment', async (c) => {
  const id = c.req.param('id');
  const amount = await c.req.json().amount || 1;
  
  // Get Durable Object stub
  const objectId = c.env.COUNTER.idFromName(id);
  const stub = c.env.COUNTER.get(objectId);
  
  // Call method on Durable Object
  const response = await stub.fetch('http://do/increment', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  
  const result = await response.json();
  return c.json(result);
});

export default app;
```

## Best Practices

1. **Edge-First**: Design for edge execution
2. **Stateless**: Use external state (KV, D1, Durable Objects)
3. **Validation**: Validate all input with Zod
4. **Error Handling**: Consistent error responses
5. **Caching**: Use KV for frequently accessed data

## Common Commands

```bash
# Development
npm run dev

# Build
npm run build

# Deploy to Cloudflare Workers
npm run deploy

# Local development with wrangler
wrangler dev

# Create D1 database
wrangler d1 create my-database

# Run migrations locally
wrangler d1 migrations apply my-database --local

# Run migrations in production
wrangler d1 migrations apply my-database --remote

# View D1 data
wrangler d1 execute my-database --command "SELECT * FROM users"

# Create KV namespace
wrangler kv:namespace create CACHE

# Put value in KV
wrangler kv:key put "test-key" "test-value" --namespace-id=your-kv-id

# Get value from KV
wrangler kv:key get "test-key" --namespace-id=your-kv-id

# View logs
wrangler tail

# Set secret
wrangler secret put JWT_SECRET
```

## Validation with Zod

```typescript
// src/utils/validators.ts
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['asc', 'desc']).default('desc'),
});

export const uuidSchema = z.string().uuid();

export const emailSchema = z.string().email().toLowerCase();

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');
```

## Rate Limiting

```typescript
// src/middleware/rateLimit.ts
import { Context, Next } from 'hono';
import { Env } from '../index';

export async function rateLimit(c: Context<{ Bindings: Env }>, next: Next) {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const key = `rate-limit:${ip}`;
  
  // Get current count
  const count = await c.env.CACHE.get(key);
  const currentCount = count ? parseInt(count) : 0;
  
  // Check limit (100 requests per minute)
  if (currentCount >= 100) {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }
  
  // Increment count
  await c.env.CACHE.put(key, String(currentCount + 1), {
    expirationTtl: 60,
  });
  
  await next();
}
```

## CORS Configuration

```typescript
// src/index.ts
app.use('*', cors({
  origin: ['https://example.com', 'https://app.example.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-Total-Count'],
  maxAge: 86400,
  credentials: true,
}));
```

## Testing

```typescript
// src/index.test.ts
import { describe, it, expect } from 'vitest';
import app from './index';

describe('API Tests', () => {
  it('should return health status', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.status).toBe('ok');
  });

  it('should create a user', async () => {
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
      }),
    });
    
    expect(res.status).toBe(201);
    
    const data = await res.json();
    expect(data.user.name).toBe('John Doe');
    expect(data.user.email).toBe('john@example.com');
  });
});
```

## Deployment

### Development

```bash
# Local development
wrangler dev

# Test with production data
wrangler dev --remote
```

### Production

```bash
# Deploy to production
wrangler deploy

# View deployment status
wrangler deployments list

# Rollback
wrangler rollback
```

### Custom Domain

```toml
# wrangler.toml
routes = [
  { pattern = "api.example.com/*", zone_name = "example.com" }
]
```

## Monitoring

```typescript
// src/middleware/analytics.ts
import { Context, Next } from 'hono';

export async function analytics(c: Context, next: Next) {
  const start = Date.now();
  
  await next();
  
  const duration = Date.now() - start;
  
  // Send to analytics service
  c.executionCtx.waitUntil(
    fetch('https://analytics.example.com/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: c.req.path,
        method: c.req.method,
        status: c.res.status,
        duration,
        timestamp: new Date().toISOString(),
        country: c.req.header('CF-IPCountry'),
        userAgent: c.req.header('User-Agent'),
      }),
    })
  );
}
```

## Performance Optimization

1. **Edge Caching**: Cache responses at the edge
2. **KV Caching**: Use KV for frequently accessed data
3. **D1 Optimization**: Use indexes and prepared statements
4. **Bundle Size**: Minimize dependencies
5. **Lazy Loading**: Load resources on demand

## Resources

- [Hono Documentation](https://hono.dev/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [KV Namespace](https://developers.cloudflare.com/kv/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
