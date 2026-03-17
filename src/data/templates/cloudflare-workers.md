# Cloudflare Workers 项目模板

## 技术栈

- **运行时**: Cloudflare Workers (V8 Isolates)
- **框架**: Hono / itty-router / Remix / Next.js
- **语言**: TypeScript
- **包管理器**: pnpm / npm / yarn
- **部署**: Wrangler CLI
- **存储**: KV / D1 / R2 / Durable Objects
- **开发工具**: Miniflare (本地模拟器)

## 项目结构

```
cloudflare-workers-project/
├── src/
│   ├── index.ts              # Worker 入口
│   ├── routes/               # 路由处理
│   │   ├── index.ts
│   │   ├── users.ts
│   │   └── api.ts
│   ├── middleware/           # 中间件
│   │   ├── auth.ts
│   │   ├── cors.ts
│   │   └── logger.ts
│   ├── services/             # 业务逻辑
│   │   ├── user.service.ts
│   │   └── cache.service.ts
│   ├── utils/                # 工具函数
│   │   ├── response.ts
│   │   ├── validator.ts
│   │   └── jwt.ts
│   ├── types/                # 类型定义
│   │   ├── env.d.ts
│   │   └── user.ts
│   └── storage/              # 存储操作
│       ├── kv.ts
│       ├── d1.ts
│       └── r2.ts
├── tests/
│   ├── index.test.ts
│   └── setup.ts
├── wrangler.toml             # Wrangler 配置
├── package.json
├── tsconfig.json
└── .dev.vars                 # 本地环境变量
```

## 代码模式

### 基础 Worker

```typescript
// src/index.ts
export interface Env {
  MY_KV: KVNamespace;
  MY_D1: D1Database;
  MY_R2: R2Bucket;
  SECRET_KEY: string;
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // 路由处理
    if (url.pathname === '/') {
      return new Response('Hello from Cloudflare Workers!');
    }
    
    if (url.pathname === '/api/users') {
      return handleUsers(request, env);
    }
    
    return new Response('Not Found', { status: 404 });
  },
  
  // 定时任务
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Cron triggered at:', new Date(event.scheduledTime));
    await performScheduledTask(env);
  },
  
  // 队列消费者
  async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      await processMessage(message.body, env);
    }
  },
};

async function handleUsers(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    const users = await env.MY_D1.prepare('SELECT * FROM users').all();
    return Response.json(users.results);
  }
  
  if (request.method === 'POST') {
    const body = await request.json();
    const result = await env.MY_D1.prepare(
      'INSERT INTO users (name, email) VALUES (?, ?)'
    ).bind(body.name, body.email).run();
    
    return Response.json({ id: result.meta.last_row_id }, { status: 201 });
  }
  
  return new Response('Method Not Allowed', { status: 405 });
}
```

### Hono 框架

```typescript
// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { compress } from 'hono/compress';
import { jwt } from 'hono/jwt';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

type Bindings = {
  MY_KV: KVNamespace;
  MY_D1: D1Database;
  SECRET_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// 全局中间件
app.use('*', logger());
app.use('*', cors());
app.use('*', prettyJSON());
app.use('*', compress());

// 健康检查
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 公开路由
app.get('/', (c) => {
  return c.json({ message: 'Welcome to Cloudflare Workers API' });
});

// 用户路由
const userRoutes = new Hono<{ Bindings: Bindings }>();

// 验证 schema
const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
});

userRoutes.get('/', async (c) => {
  const db = c.env.MY_D1;
  const users = await db.prepare('SELECT * FROM users').all();
  return c.json(users.results);
});

userRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const db = c.env.MY_D1;
  
  const user = await db.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first();
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json(user);
});

userRoutes.post('/', zValidator('json', createUserSchema), async (c) => {
  const data = c.req.valid('json');
  const db = c.env.MY_D1;
  
  const result = await db.prepare(
    'INSERT INTO users (name, email, age) VALUES (?, ?, ?)'
  ).bind(data.name, data.email, data.age || null).run();
  
  return c.json({
    id: result.meta.last_row_id,
    ...data,
  }, 201);
});

userRoutes.put('/:id', zValidator('json', createUserSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const db = c.env.MY_D1;
  
  await db.prepare(
    'UPDATE users SET name = ?, email = ?, age = ? WHERE id = ?'
  ).bind(data.name, data.email, data.age || null, id).run();
  
  return c.json({ id, ...data });
});

userRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const db = c.env.MY_D1;
  
  await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
  
  return c.json({ message: 'User deleted' });
});

// 受保护的路由
app.use('/api/*', jwt({ secret: c => c.env.SECRET_KEY }));
app.route('/api/users', userRoutes);

// 404 处理
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('Error:', err);
  
  if (err instanceof z.ZodError) {
    return c.json({ error: 'Validation Error', details: err.errors }, 400);
  }
  
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
```

### itty-router 框架

```typescript
// src/index.ts
import { AutoRouter, error, json, status } from 'itty-router';

interface Env {
  MY_KV: KVNamespace;
  MY_D1: D1Database;
}

const router = AutoRouter();

router
  .get('/', () => json({ message: 'Hello World' }))
  
  .get('/api/users', async (request: Request, env: Env) => {
    const users = await env.MY_D1.prepare('SELECT * FROM users').all();
    return json(users.results);
  })
  
  .get('/api/users/:id', async ({ params }: any, env: Env) => {
    const user = await env.MY_D1.prepare('SELECT * FROM users WHERE id = ?')
      .bind(params.id)
      .first();
    
    if (!user) return error(404, 'User not found');
    return json(user);
  })
  
  .post('/api/users', async (request: Request, env: Env) => {
    const body = await request.json();
    
    const result = await env.MY_D1.prepare(
      'INSERT INTO users (name, email) VALUES (?, ?)'
    ).bind(body.name, body.email).run();
    
    return status(201).json({ id: result.meta.last_row_id, ...body });
  })
  
  .all('*', () => error(404));

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) =>
    router.fetch(request, env, ctx),
};
```

### KV 存储操作

```typescript
// src/storage/kv.ts
export class KVStorage {
  constructor(private kv: KVNamespace) {}

  // 基础操作
  async get<T = any>(key: string): Promise<T | null> {
    const value = await this.kv.get(key, 'json');
    return value as T | null;
  }

  async set(key: string, value: any, options?: KVNamespacePutOptions): Promise<void> {
    await this.kv.put(key, JSON.stringify(value), options);
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }

  // 带过期时间的存储
  async setWithExpiry(key: string, value: any, ttlSeconds: number): Promise<void> {
    await this.set(key, value, { expirationTtl: ttlSeconds });
  }

  // 列出键
  async list(prefix?: string): Promise<KVNamespaceListResult<unknown>> {
    return this.kv.list({ prefix });
  }

  // 批量操作
  async getMultiple<T = any>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    await Promise.all(
      keys.map(async (key) => {
        const value = await this.get<T>(key);
        results.set(key, value);
      })
    );
    return results;
  }

  // 缓存装饰器
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await fn();
    await this.set(key, value, ttlSeconds ? { expirationTtl: ttlSeconds } : undefined);
    return value;
  }
}

// 使用示例
export async function getCachedData(env: Env, key: string) {
  const storage = new KVStorage(env.MY_KV);
  
  return storage.getOrSet(
    `data:${key}`,
    async () => {
      // 从数据库获取数据
      const result = await env.MY_D1.prepare('SELECT * FROM data WHERE key = ?')
        .bind(key)
        .first();
      return result;
    },
    3600  // 缓存 1 小时
  );
}
```

### D1 数据库操作

```typescript
// src/storage/d1.ts
export class D1Database {
  constructor(private db: D1Database) {}

  // 查询
  async query<T = any>(sql: string, ...params: any[]): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    const result = await stmt.bind(...params).all();
    return result.results as T[];
  }

  // 单条查询
  async queryOne<T = any>(sql: string, ...params: any[]): Promise<T | null> {
    const stmt = this.db.prepare(sql);
    return stmt.bind(...params).first() as Promise<T | null>;
  }

  // 执行
  async execute(sql: string, ...params: any[]): Promise<D1Result> {
    const stmt = this.db.prepare(sql);
    return stmt.bind(...params).run();
  }

  // 批量操作
  async batch(statements: D1PreparedStatement[]): Promise<D1Result[]> {
    return this.db.batch(statements);
  }

  // 事务（模拟）
  async transaction<T>(fn: (db: D1Database) => Promise<T>): Promise<T> {
    // D1 目前不支持事务，使用批量操作模拟
    return fn(this);
  }
}

// Repository 模式
export class UserRepository {
  constructor(private db: D1Database) {}

  async findAll(limit = 100, offset = 0) {
    return this.db.query<User>(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      limit,
      offset
    );
  }

  async findById(id: number) {
    return this.db.queryOne<User>('SELECT * FROM users WHERE id = ?', id);
  }

  async findByEmail(email: string) {
    return this.db.queryOne<User>('SELECT * FROM users WHERE email = ?', email);
  }

  async create(data: CreateUserInput) {
    const result = await this.db.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      data.name,
      data.email,
      data.passwordHash
    );
    
    return { id: result.meta.last_row_id, ...data };
  }

  async update(id: number, data: UpdateUserInput) {
    const fields = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    
    await this.db.execute(
      `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      ...Object.values(data),
      id
    );
    
    return this.findById(id);
  }

  async delete(id: number) {
    await this.db.execute('DELETE FROM users WHERE id = ?', id);
  }
}
```

### R2 存储操作

```typescript
// src/storage/r2.ts
export class R2Storage {
  constructor(private bucket: R2Bucket) {}

  // 上传文件
  async upload(key: string, body: ReadableStream | ArrayBuffer | string, options?: R2PutOptions) {
    return this.bucket.put(key, body, options);
  }

  // 下载文件
  async download(key: string): Promise<R2ObjectBody | null> {
    return this.bucket.get(key);
  }

  // 获取文件元数据
  async getMetadata(key: string): Promise<R2Object | null> {
    return this.bucket.head(key);
  }

  // 删除文件
  async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }

  // 列出文件
  async list(options?: R2ListOptions): Promise<R2Objects> {
    return this.bucket.list(options);
  }

  // 创建预签名 URL（需要 R2 公开访问或 Workers 代理）
  async createSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    // 使用 Workers 路由实现签名 URL
    const signature = await generateSignature(key, expiresIn);
    return `https://your-worker.workers.dev/file/${key}?signature=${signature}&expires=${Date.now() + expiresIn * 1000}`;
  }
}

// 文件上传 API
app.post('/upload', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    return c.json({ error: 'No file provided' }, 400);
  }
  
  const key = `uploads/${Date.now()}-${file.name}`;
  const storage = new R2Storage(c.env.MY_R2);
  
  await storage.upload(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type,
    },
    customMetadata: {
      originalName: file.name,
      size: file.size.toString(),
    },
  });
  
  return c.json({ key, url: `/file/${key}` }, 201);
});

// 文件下载 API
app.get('/file/:key', async (c) => {
  const key = c.req.param('key');
  const storage = new R2Storage(c.env.MY_R2);
  
  const object = await storage.download(key);
  
  if (!object) {
    return c.json({ error: 'File not found' }, 404);
  }
  
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Length': object.size.toString(),
      'ETag': object.etag,
    },
  });
});
```

### 中间件

```typescript
// src/middleware/auth.ts
import { Context, Next } from 'hono';
import { verify } from 'jsonwebtoken';

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.slice(7);
  
  try {
    const decoded = verify(token, c.env.SECRET_KEY);
    c.set('user', decoded);
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}

// src/middleware/rateLimit.ts
export function rateLimit(options: {
  windowMs: number;
  max: number;
  keyGenerator?: (c: Context) => string;
}) {
  return async (c: Context, next: Next) => {
    const key = options.keyGenerator?.(c) || c.req.header('CF-Connecting-IP') || 'unknown';
    const cacheKey = `rate-limit:${key}`;
    
    const kv = c.env.MY_KV;
    const current = await kv.get(cacheKey);
    const count = current ? parseInt(current) : 0;
    
    if (count >= options.max) {
      return c.json({ error: 'Too many requests' }, 429);
    }
    
    await kv.put(cacheKey, (count + 1).toString(), {
      expirationTtl: Math.floor(options.windowMs / 1000),
    });
    
    await next();
  };
}

// src/middleware/cors.ts
export function customCors() {
  return async (c: Context, next: Next) => {
    await next();
    
    c.res.headers.set('Access-Control-Allow-Origin', '*');
    c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    c.res.headers.set('Access-Control-Max-Age', '86400');
  };
}
```

### 定时任务

```typescript
// src/index.ts
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const cron = event.cron;  // 例如: "0 * * * *"
    
    switch (cron) {
      case '0 * * * *':
        await hourlyTask(env);
        break;
      case '0 0 * * *':
        await dailyTask(env);
        break;
      default:
        console.log('Unknown cron pattern:', cron);
    }
  },
};

async function hourlyTask(env: Env) {
  // 清理过期数据
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  await env.MY_D1.prepare('DELETE FROM sessions WHERE expires_at < ?')
    .bind(cutoff)
    .run();
  
  console.log('Hourly cleanup completed');
}

async function dailyTask(env: Env) {
  // 生成每日报告
  const stats = await env.MY_D1.prepare(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN created_at > DATE('now', '-1 day') THEN 1 END) as new_users
    FROM users
  `).first();
  
  await env.MY_KV.put('daily-stats', JSON.stringify(stats), {
    expirationTtl: 7 * 24 * 60 * 60,  // 7 天
  });
  
  console.log('Daily report generated:', stats);
}
```

## 最佳实践

### 环境变量管理

```typescript
// .dev.vars (本地开发)
SECRET_KEY=your-secret-key
DATABASE_URL=your-database-url

// wrangler.toml
[vars]
ENVIRONMENT = "development"

[[kv_namespaces]]
binding = "MY_KV"
id = "your-kv-id"
preview_id = "your-preview-kv-id"

[[d1_databases]]
binding = "MY_D1"
database_name = "my-database"
database_id = "your-database-id"

// src/types/env.d.ts
interface Env {
  SECRET_KEY: string;
  ENVIRONMENT: string;
  MY_KV: KVNamespace;
  MY_D1: D1Database;
  MY_R2: R2Bucket;
}
```

### 错误处理

```typescript
// src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

// 全局错误处理
app.onError((err, c) => {
  console.error('Error:', err);
  
  if (err instanceof AppError) {
    return c.json({
      error: {
        message: err.message,
        code: err.code,
      },
    }, err.statusCode);
  }
  
  return c.json({
    error: {
      message: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
    },
  }, 500);
});
```

### 响应格式化

```typescript
// src/utils/response.ts
export const ApiResponse = {
  success<T>(data: T, status = 200) {
    return Response.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    }, { status });
  },

  error(message: string, status = 400, code?: string) {
    return Response.json({
      success: false,
      error: {
        message,
        code,
      },
      timestamp: new Date().toISOString(),
    }, { status });
  },

  paginated<T>(data: T[], total: number, page: number, limit: number) {
    return Response.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    });
  },
};
```

### 缓存策略

```typescript
// 使用 KV 作为缓存层
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  env: Env,
  ttl = 3600
): Promise<T> {
  // 尝试从缓存获取
  const cached = await env.MY_KV.get(key, 'json');
  if (cached) return cached as T;

  // 获取数据并缓存
  const data = await fetcher();
  await env.MY_KV.put(key, JSON.stringify(data), {
    expirationTtl: ttl,
  });

  return data;
}

// 使用 Cache API
export async function fetchWithCacheAPI(request: Request): Promise<Response> {
  const cache = caches.default;
  
  // 检查缓存
  let response = await cache.match(request);
  if (response) return response;
  
  // 获取数据
  response = await fetch(request);
  
  // 缓存响应
  if (response.ok) {
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'max-age=3600');
    
    const cachedResponse = new Response(response.body, {
      status: response.status,
      headers,
    });
    
    await cache.put(request, cachedResponse);
  }
  
  return response;
}
```

## 常用命令

### Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 初始化项目
wrangler init my-worker

# 本地开发
wrangler dev

# 指定端口
wrangler dev --port 8787

# 远程开发
wrangler dev --remote

# 部署
wrangler deploy

# 部署到特定环境
wrangler deploy --env production

# 查看部署日志
wrangler tail

# 查看环境变量
wrangler secret list

# 设置环境变量
wrangler secret put SECRET_KEY

# D1 数据库
wrangler d1 create my-database
wrangler d1 list
wrangler d1 execute my-database --file=./schema.sql
wrangler d1 query my-database "SELECT * FROM users"

# KV 命名空间
wrangler kv:namespace create MY_KV
wrangler kv:key list --binding=MY_KV
wrangler kv:key get "key" --binding=MY_KV
wrangler kv:key put "key" "value" --binding=MY_KV

# R2 存储桶
wrangler r2 bucket create my-bucket
wrangler r2 object put my-bucket/file.txt --file ./local-file.txt
wrangler r2 object get my-bucket/file.txt --file ./downloaded-file.txt

# 发布 Workers
wrangler versions list
wrangler rollback
```

### 本地开发

```bash
# 启动开发服务器
npm run dev
# 或
wrangler dev

# 运行测试
npm test

# 类型检查
npm run type-check

# 构建（如需要）
npm run build
```

## 部署配置

### wrangler.toml

```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# 开发配置
[dev]
port = 8787
local_protocol = "http"

# 生产环境变量
[vars]
ENVIRONMENT = "production"

# KV 命名空间
[[kv_namespaces]]
binding = "MY_KV"
id = "your-kv-id"
preview_id = "your-preview-kv-id"

# D1 数据库
[[d1_databases]]
binding = "MY_D1"
database_name = "my-database"
database_id = "your-database-id"
preview_database_id = "your-preview-database-id"

# R2 存储桶
[[r2_buckets]]
binding = "MY_R2"
bucket_name = "my-bucket"
preview_bucket_name = "my-preview-bucket"

# 定时任务
[triggers]
crons = ["0 * * * *", "0 0 * * *"]

# 路由（自定义域名）
[[routes]]
pattern = "api.example.com/*"
custom_domain = true

# 生产环境
[env.production]
name = "my-worker-production"
vars = { ENVIRONMENT = "production" }

[[env.production.kv_namespaces]]
binding = "MY_KV"
id = "production-kv-id"

[[env.production.d1_databases]]
binding = "MY_D1"
database_name = "production-database"
database_id = "production-database-id"

# 预发布环境
[env.staging]
name = "my-worker-staging"
vars = { ENVIRONMENT = "staging" }

# 静态资源
[site]
bucket = "./public"

# Durable Objects
[[durable_objects.bindings]]
name = "MY_DO"
class_name = "MyDurableObject"

[[migrations]]
tag = "v1"
new_classes = ["MyDurableObject"]
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          environment: production
```

## 测试策略

```typescript
// tests/index.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import app from '../src/index';

describe('Worker API', () => {
  it('should return health check', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data).toHaveProperty('status', 'ok');
  });

  it('should create a user', async () => {
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
      }),
    });
    
    expect(res.status).toBe(201);
    
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('Test User');
  });

  it('should validate input', async () => {
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '',
        email: 'invalid-email',
      }),
    });
    
    expect(res.status).toBe(400);
  });
});

// tests/setup.ts
import { unstable_dev } from 'wrangler';
import type { UnstableDevWorker } from 'wrangler';

let worker: UnstableDevWorker;

export async function setup() {
  worker = await unstable_dev('src/index.ts', {
    experimental: { disableExperimentalWarning: true },
  });
  return worker;
}

export async function teardown() {
  await worker.stop();
}
```

## 常见问题

### 1. CPU 时间限制

```typescript
// Workers 有 CPU 时间限制（免费: 10ms, 付费: 50ms）
// 对于长时间运行的任务，使用 Durable Objects 或 Queues

// 使用 Queues 处理长时间任务
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 发送消息到队列
    await env.MY_QUEUE.send({
      task: 'process-data',
      data: await request.json(),
    });
    
    return Response.json({ status: 'queued' });
  },
  
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      // 处理消息（有更长的 CPU 时间限制）
      await processTask(message.body);
    }
  },
};
```

### 2. 内存限制

```typescript
// Workers 有 128MB 内存限制
// 对于大文件，使用流式处理

app.post('/upload', async (c) => {
  const contentLength = parseInt(c.req.header('Content-Length') || '0');
  
  if (contentLength > 100 * 1024 * 1024) {  // 100MB
    return c.json({ error: 'File too large' }, 413);
  }
  
  // 使用流式上传到 R2
  await c.env.MY_R2.put('large-file', c.req.raw.body);
  
  return c.json({ status: 'uploaded' });
});
```

### 3. 冷启动

```typescript
// Workers 冷启动通常 < 5ms
// 使用 Durable Objects 保持状态

export class MyDurableObject {
  private state: DurableObjectState;
  private data: Map<string, any>;
  
  constructor(state: DurableObjectState) {
    this.state = state;
    this.data = new Map();
  }
  
  async fetch(request: Request): Promise<Response> {
    // 处理请求，保持状态
    return new Response('OK');
  }
}
```

## 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Hono 框架](https://hono.dev/)
- [itty-router](https://itty.dev/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [D1 数据库](https://developers.cloudflare.com/d1/)
- [KV 存储](https://developers.cloudflare.com/kv/)
- [R2 存储](https://developers.cloudflare.com/r2/)
