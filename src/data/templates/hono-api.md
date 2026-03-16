# Hono API Template

## Project Overview

Ultra-fast, lightweight web API built with Hono - the small, simple, and ultrafast web framework for Cloudflare Workers, Bun, Deno, and Node.js.

## Tech Stack

- **Framework**: Hono 4
- **Runtime**: Cloudflare Workers / Bun / Deno / Node.js
- **Language**: TypeScript
- **Validation**: Zod
- **ORM**: Drizzle (optional)
- **Testing**: Vitest

## Project Structure

```
src/
├── index.ts                # Entry point
├── routes/                 # Route handlers
│   ├── users.ts
│   ├── auth.ts
│   └── api.ts
├── middleware/             # Custom middleware
│   ├── auth.ts
│   ├── logger.ts
│   └── cors.ts
├── services/               # Business logic
│   ├── user.service.ts
│   └── auth.service.ts
├── schemas/                # Zod schemas
│   └── user.schema.ts
├── lib/                    # Utilities
│   ├── db.ts
│   └── jwt.ts
└── types/                  # TypeScript types
```

## Key Patterns

### 1. Basic Server Setup

```typescript
// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { compress } from 'hono/compress';

import userRoutes from './routes/users';
import authRoutes from './routes/auth';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors());
app.use('*', secureHeaders());
app.use('*', compress());

// Health check
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.route('/auth', authRoutes);
app.route('/users', userRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server Error:', err);
  return c.json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  }, 500);
});

export default app;
```

### 2. Route with Validation

```typescript
// src/routes/users.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as userService from '../services/user.service';
import { authMiddleware } from '../middleware/auth';

const app = new Hono();

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

// GET /users
app.get('/', authMiddleware, async (c) => {
  const users = await userService.getAll();
  return c.json(users);
});

// GET /users/:id
app.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = await userService.getById(id);
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json(user);
});

// POST /users
app.post('/', zValidator('json', createUserSchema), async (c) => {
  const data = c.req.valid('json');
  const user = await userService.create(data);
  
  return c.json(user, 201);
});

// PATCH /users/:id
app.patch('/:id', 
  authMiddleware, 
  zValidator('json', updateUserSchema), 
  async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    
    const user = await userService.update(id, data);
    return c.json(user);
  }
);

export default app;
```

### 3. JWT Authentication

```typescript
// src/middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.slice(7);
  
  try {
    const payload = await verify(token, process.env.JWT_SECRET!);
    c.set('userId', payload.sub as string);
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});
```

### 4. Context Variables

```typescript
// src/types.ts
type Variables = {
  userId: string;
};

// Use in routes
const app = new Hono<{ Variables: Variables }>();

// Access in handler
app.get('/profile', authMiddleware, (c) => {
  const userId = c.get('userId');
  // ...
});
```

### 5. File Upload

```typescript
// src/routes/upload.ts
import { Hono } from 'hono';

const app = new Hono();

app.post('/upload', async (c) => {
  const body = await c.req.parseBody();
  const file = body['file'] as File;
  
  if (!file) {
    return c.json({ error: 'No file uploaded' }, 400);
  }
  
  // Process file...
  const arrayBuffer = await file.arrayBuffer();
  
  return c.json({
    filename: file.name,
    size: file.size,
    type: file.type,
  });
});

export default app;
```

### 6. Streaming Response

```typescript
app.get('/stream', (c) => {
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(`data: ${JSON.stringify({ count: i })}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      controller.close();
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
    },
  });
});
```

## Deployment

### Cloudflare Workers

```bash
# Install Wrangler
pnpm add -D wrangler

# Deploy
pnpm wrangler deploy
```

```toml
# wrangler.toml
name = "my-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "production"
```

### Bun

```bash
# Development
bun --hot src/index.ts

# Production
bun build src/index.ts --compile --outfile app
./app
```

### Node.js

```typescript
// src/index.ts (add at end)
import { serve } from '@hono/node-server';

const port = 3000;
serve({
  fetch: app.fetch,
  port,
});
```

## Testing

```typescript
// test/index.test.ts
import { describe, test, expect } from 'vitest';
import app from '../src/index';

describe('API', () => {
  test('GET /health', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.status).toBe('ok');
  });
  
  test('POST /users', async () => {
    const res = await app.request('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      }),
    });
    
    expect(res.status).toBe(201);
  });
});
```

## Performance Tips

1. **Use Edge Runtime**: Deploy to Cloudflare Workers for global latency
2. **Enable Compression**: Use `compress()` middleware
3. **Cache Responses**: Use `cache()` middleware for static data
4. **Stream Large Responses**: Use ReadableStream for large data
5. **Minimize Middleware**: Only use what you need

## Middleware Ecosystem

| Middleware | Purpose |
|------------|---------|
| `cors` | CORS handling |
| `logger` | Request logging |
| `compress` | Gzip compression |
| `secure-headers` | Security headers |
| `rate-limiter` | Rate limiting |
| `csrf` | CSRF protection |
| `etag` | ETag caching |
| `jwt` | JWT verification |

## Resources

- [Hono Documentation](https://hono.dev/)
- [Hono GitHub](https://github.com/honojs/hono)
- [Cloudflare Workers](https://workers.cloudflare.com/)
