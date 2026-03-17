# Cloudflare Pages 部署模板

## 技术栈

- **部署平台**: Cloudflare Pages
- **函数**: Cloudflare Workers
- **存储**: Cloudflare R2 / KV / D1
- **前端框架**: Next.js / React / Vue / Astro
- **构建工具**: Vite / Webpack
- **CDN**: Cloudflare 全球 CDN
- **DNS**: Cloudflare DNS

## 项目结构

```
cloudflare-pages/
├── src/
│   ├── pages/                   # 页面组件
│   │   ├── index.tsx
│   │   ├── about.tsx
│   │   └── _app.tsx
│   ├── components/
│   │   ├── Layout.tsx
│   │   └── Header.tsx
│   ├── functions/               # Cloudflare Functions
│   │   ├── api/
│   │   │   ├── users.ts        # /api/users
│   │   │   └── posts.ts        # /api/posts
│   │   └── _middleware.ts      # 全局中间件
│   ├── lib/
│   │   ├── kv.ts               # KV 存储
│   │   ├── r2.ts               # R2 存储
│   │   ├── d1.ts               # D1 数据库
│   │   └── analytics.ts        # Analytics
│   └── utils/
│       ├── cache.ts
│       └── helpers.ts
├── public/
│   ├── favicon.ico
│   └── images/
├── wrangler.toml               # Cloudflare 配置
├── _worker.js                  # 自定义 Worker（可选）
├── next.config.js              # Next.js 配置
├── package.json
└── tsconfig.json
```

## 代码模式

### Cloudflare 配置

```toml
# wrangler.toml
name = "my-cloudflare-pages"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".next"

# KV 命名空间
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

# R2 存储桶
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "my-bucket"

# D1 数据库
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "your-database-id"

# 环境变量
[vars]
ENVIRONMENT = "production"

# 生产环境
[env.production]
name = "my-app-prod"
vars = { ENVIRONMENT = "production" }

# 预览环境
[env.preview]
name = "my-app-preview"
vars = { ENVIRONMENT = "preview" }

# 路由规则
[[routes]]
pattern = "api.example.com/*"
custom_domain = true

# 构建配置
[build]
command = "npm run build"
watch_dir = "src"
```

### Cloudflare Functions

```typescript
// src/functions/api/users.ts
import { EventContext } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  STORAGE: R2Bucket;
}

// GET /api/users
export async function onRequestGet(context: EventContext<Env, any, any>) {
  const { env, request } = context;

  try {
    // 检查缓存
    const cacheKey = new URL(request.url).pathname;
    const cached = await env.CACHE.get(cacheKey, 'json');
    
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // 从数据库查询
    const result = await env.DB.prepare(
      'SELECT id, name, email FROM users LIMIT 100'
    ).all();

    // 缓存结果
    await env.CACHE.put(cacheKey, JSON.stringify(result.results), {
      expirationTtl: 3600,
    });

    return new Response(JSON.stringify(result.results), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}

// POST /api/users
export async function onRequestPost(context: EventContext<Env, any, any>) {
  const { env, request } = context;

  try {
    const body = await request.json();
    const { name, email } = body as any;

    // 验证
    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'Name and email are required' }),
        { status: 400 }
      );
    }

    // 插入数据库
    const result = await env.DB.prepare(
      'INSERT INTO users (name, email) VALUES (?, ?) RETURNING *'
    )
      .bind(name, email)
      .first();

    // 清除缓存
    await env.CACHE.delete('/api/users');

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to create user' }),
      { status: 500 }
    );
  }
}

// PUT /api/users/:id
export async function onRequestPut(context: EventContext<Env, any, any>) {
  const { env, request, params } = context;
  const id = params.id;

  try {
    const body = await request.json();
    const { name, email } = body as any;

    const result = await env.DB.prepare(
      'UPDATE users SET name = ?, email = ? WHERE id = ? RETURNING *'
    )
      .bind(name, email, id)
      .first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      });
    }

    // 清除缓存
    await env.CACHE.delete('/api/users');
    await env.CACHE.delete(`/api/users/${id}`);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to update user' }),
      { status: 500 }
    );
  }
}

// DELETE /api/users/:id
export async function onRequestDelete(context: EventContext<Env, any, any>) {
  const { env, params } = context;
  const id = params.id;

  try {
    const result = await env.DB.prepare(
      'DELETE FROM users WHERE id = ? RETURNING id'
    )
      .bind(id)
      .first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      });
    }

    // 清除缓存
    await env.CACHE.delete('/api/users');
    await env.CACHE.delete(`/api/users/${id}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to delete user' }),
      { status: 500 }
    );
  }
}
```

### 中间件

```typescript
// src/functions/_middleware.ts
import { EventContext } from '@cloudflare/workers-types';

export async function onRequest(context: EventContext<any, any, any>) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // CORS 处理
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 添加 CORS 头
  const response = await next();
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 认证检查（受保护路由）
  if (url.pathname.startsWith('/api/protected')) {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 验证 token（示例）
    try {
      // 在实际应用中，使用 JWT 验证
      const userId = await verifyToken(token, env.JWT_SECRET);
      
      // 将用户信息添加到上下文
      context.data = { ...context.data, userId };
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // 速率限制
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimitKey = `rate-limit:${ip}`;
  const requests = (await env.CACHE.get(rateLimitKey)) || '0';
  const requestCount = parseInt(requests);

  if (requestCount > 100) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await env.CACHE.put(rateLimitKey, String(requestCount + 1), {
    expirationTtl: 60,
  });

  // 记录请求
  console.log(`[${new Date().toISOString()}] ${request.method} ${url.pathname}`);

  return response;
}

async function verifyToken(token: string, secret: string): Promise<string> {
  // 简化的 token 验证（实际应使用 JWT 库）
  return 'user-id';
}
```

### KV 存储工具

```typescript
// src/lib/kv.ts
import { KVNamespace } from '@cloudflare/workers-types';

export class KVStore {
  constructor(private kv: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.kv.get(key, 'json');
    return value as T | null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const options: KVNamespacePutOptions = {};
    if (ttl) {
      options.expirationTtl = ttl;
    }
    await this.kv.put(key, JSON.stringify(value), options);
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }

  async list(prefix: string): Promise<KVNamespaceListResult<unknown>> {
    return await this.kv.list({ prefix });
  }

  // 缓存装饰器
  async cache<T>(key: string, fn: () => Promise<T>, ttl = 3600): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;

    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }
}
```

### R2 存储工具

```typescript
// src/lib/r2.ts
import { R2Bucket } from '@cloudflare/workers-types';

export class R2Storage {
  constructor(private bucket: R2Bucket) {}

  async upload(key: string, file: File | ArrayBuffer | ReadableStream): Promise<string> {
    await this.bucket.put(key, file);
    return key;
  }

  async download(key: string): Promise<R2ObjectBody | null> {
    return await this.bucket.get(key);
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }

  async list(prefix?: string): Promise<R2Objects> {
    return await this.bucket.list({ prefix });
  }

  async getMetadata(key: string): Promise<R2Object | null> {
    return await this.bucket.head(key);
  }

  // 生成公开 URL（需要配置公开访问）
  getPublicUrl(key: string, domain: string): string {
    return `https://${domain}/${key}`;
  }
}
```

### D1 数据库工具

```typescript
// src/lib/d1.ts
import { D1Database } from '@cloudflare/workers-types';

export class D1Client {
  constructor(private db: D1Database) {}

  async query<T>(sql: string, ...params: any[]): Promise<T[]> {
    const result = await this.db
      .prepare(sql)
      .bind(...params)
      .all<T>();
    return result.results;
  }

  async queryOne<T>(sql: string, ...params: any[]): Promise<T | null> {
    return await this.db
      .prepare(sql)
      .bind(...params)
      .first<T>();
  }

  async execute(sql: string, ...params: any[]): Promise<D1Result> {
    return await this.db
      .prepare(sql)
      .bind(...params)
      .run();
  }

  async batch(statements: D1PreparedStatement[]): Promise<D1Result[]> {
    return await this.db.batch(statements);
  }

  // 事务
  async transaction<T>(fn: (db: D1Database) => Promise<T>): Promise<T> {
    // D1 目前不支持事务，使用批量操作代替
    return await fn(this.db);
  }
}

// 使用示例
export async function getUserWithPosts(db: D1Database, userId: string) {
  const client = new D1Client(db);

  const user = await client.queryOne<any>(
    'SELECT * FROM users WHERE id = ?',
    userId
  );

  const posts = await client.query<any>(
    'SELECT * FROM posts WHERE author_id = ? ORDER BY created_at DESC LIMIT 10',
    userId
  );

  return { ...user, posts };
}
```

### 文件上传 API

```typescript
// src/functions/api/upload.ts
import { EventContext } from '@cloudflare/workers-types';

interface Env {
  STORAGE: R2Bucket;
  CACHE: KVNamespace;
}

export async function onRequestPost(context: EventContext<Env, any, any>) {
  const { env, request } = context;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
      });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Invalid file type' }), {
        status: 400,
      });
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File too large' }), {
        status: 400,
      });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const key = `uploads/${timestamp}-${randomString}.${extension}`;

    // 上传到 R2
    await env.STORAGE.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // 返回公开 URL
    const publicUrl = `${new URL(request.url).origin}/api/file/${key}`;

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        key,
        size: file.size,
        type: file.type,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to upload file' }),
      { status: 500 }
    );
  }
}

// GET /api/file/:key - 获取文件
export async function onRequestGet(context: EventContext<Env, any, any>) {
  const { env, params } = context;
  const key = params.key;

  try {
    const object = await env.STORAGE.get(key);

    if (!object) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
      });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000');

    return new Response(object.body, { headers });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to get file' }),
      { status: 500 }
    );
  }
}
```

### 边缘缓存策略

```typescript
// src/lib/cache.ts
import { EventContext } from '@cloudflare/workers-types';

export class CacheManager {
  // 缓存静态资源
  static async cacheStatic(request: Request): Promise<Response | null> {
    const cache = caches.default;
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return null;
  }

  // 缓存 API 响应
  static async cacheAPI(
    request: Request,
    context: EventContext<any, any, any>,
    ttl: number = 3600
  ): Promise<Response> {
    const cacheKey = new URL(request.url).pathname;
    const cached = await context.env.CACHE.get(cacheKey, 'json');

    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${ttl}`,
          'CF-Cache-Status': 'HIT',
        },
      });
    }

    const response = await context.next();
    const data = await response.json();

    await context.env.CACHE.put(cacheKey, JSON.stringify(data), {
      expirationTtl: ttl,
    });

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${ttl}`,
        'CF-Cache-Status': 'MISS',
      },
    });
  }

  // 清除缓存
  static async purgeCache(context: EventContext<any, any, any>, pattern: string): Promise<void> {
    const list = await context.env.CACHE.list({ prefix: pattern });
    
    for (const key of list.keys) {
      await context.env.CACHE.delete(key.name);
    }
  }
}
```

### Next.js 配置

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 输出模式（Cloudflare Pages）
  output: 'export',
  
  // 图片优化（使用 Cloudflare Images）
  images: {
    unoptimized: true, // 禁用 Next.js 图片优化，使用 Cloudflare
  },

  // 环境变量
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // 重定向
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true,
      },
    ];
  },

  // 重写（API 路由）
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },

  // 自定义 Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 自定义 Worker

```javascript
// _worker.js
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

addEventListener('fetch', (event) => {
  event.respondWith(handleEvent(event));
});

async function handleEvent(event) {
  const { request } = event;
  const url = new URL(request.url);

  try {
    // 静态资源
    if (isStaticAsset(url.pathname)) {
      return await getAssetFromKV(event);
    }

    // API 路由
    if (url.pathname.startsWith('/api/')) {
      return await handleAPI(event);
    }

    // 页面请求
    return await getAssetFromKV(event, {
      mapRequestToAsset: (req) => {
        // SPA 路由回退
        return new Request(`${new URL(req.url).origin}/index.html`, req);
      },
    });
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 });
  }
}

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/.test(pathname);
}

async function handleAPI(event) {
  const { request } = event;
  const url = new URL(request.url);

  // API 处理逻辑
  if (url.pathname === '/api/health') {
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Not Found', { status: 404 });
}
```

## 最佳实践

### 1. 性能优化

```typescript
// 使用 Cloudflare Analytics
export function trackPageView(url: string) {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.analytics?.track('page_view', { url });
  }
}

// 预加载资源
export function preloadResources() {
  if (typeof window !== 'undefined') {
    // 预加载关键资源
    const criticalResources = [
      '/api/users',
      '/api/posts',
    ];

    criticalResources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }
}
```

### 2. 错误处理

```typescript
// 统一错误处理
export function handleAPIError(error: any): Response {
  console.error('API Error:', error);

  if (error instanceof Response) {
    return error;
  }

  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';

  return new Response(
    JSON.stringify({
      error: message,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

### 3. 环境变量管理

```typescript
// src/lib/env.ts
export function getEnv() {
  return {
    // 公开变量（客户端可见）
    public: {
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
    },
    // 私有变量（仅服务端）
    private: {
      jwtSecret: process.env.JWT_SECRET,
      dbUrl: process.env.DATABASE_URL,
    },
  };
}
```

### 4. 日志记录

```typescript
// src/lib/logger.ts
export class Logger {
  static log(level: string, message: string, data?: any) {
    const logEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };

    // 发送到日志服务
    console.log(JSON.stringify(logEntry));

    // 在生产环境，可以发送到 Cloudflare Analytics 或其他服务
  }

  static info(message: string, data?: any) {
    this.log('info', message, data);
  }

  static error(message: string, data?: any) {
    this.log('error', message, data);
  }

  static warn(message: string, data?: any) {
    this.log('warn', message, data);
  }
}
```

## 常用命令

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 构建
npm run build

# 部署到 Cloudflare Pages
npm run deploy

# 本地预览
npm run preview

# Wrangler CLI 命令
npx wrangler pages dev ./dist
npx wrangler pages deploy ./dist
npx wrangler pages project list
npx wrangler tail  # 实时日志

# KV 操作
npx wrangler kv:key list --binding CACHE
npx wrangler kv:key put "my-key" "my-value" --binding CACHE
npx wrangler kv:key get "my-key" --binding CACHE

# D1 操作
npx wrangler d1 execute my-database --command="SELECT * FROM users"
npx wrangler d1 time-series my-database

# R2 操作
npx wrangler r2 bucket list
npx wrangler r2 object put my-bucket/my-file.txt --path=./file.txt
```

## 部署配置

### package.json

```json
{
  "name": "cloudflare-pages-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "deploy": "wrangler pages deploy .next",
    "preview": "wrangler pages dev .next",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0",
    "wrangler": "^3.0.0"
  }
}
```

### CI/CD 配置

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
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

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: my-project
          directory: .next
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

## 参考资源

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare KV 文档](https://developers.cloudflare.com/kv/)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
