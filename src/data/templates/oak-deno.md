# Oak Deno 后端框架模板

## 技术栈

- **Deno**: 现代化的 JavaScript/TypeScript 运行时
- **Oak**: 受 Koa 启发的中间件框架
- **TypeScript**: 类型支持
- **PostgreSQL**: 数据库
- **JWT**: 身份认证
- **Zod**: 数据验证

## 项目结构

```
oak-api/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   └── post.controller.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── logger.ts
│   │   ├── error.ts
│   │   └── rateLimit.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   └── post.model.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   └── post.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   └── post.service.ts
│   ├── utils/
│   │   ├── response.ts
│   │   ├── validation.ts
│   │   └── db.ts
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   └── user.validator.ts
│   ├── types/
│   │   └── index.ts
│   ├── config/
│   │   └── index.ts
│   └── app.ts              # 应用入口
├── tests/
│   ├── auth.test.ts
│   └── user.test.ts
├── deno.json
├── import_map.json
└── .env
```

## 代码模式

### 应用入口

```typescript
// src/app.ts
import { Application, Router } from 'oak';
import { oakCors } from 'cors';
import { config } from 'dotenv';
import { logger } from './middleware/logger.ts';
import { errorHandler } from './middleware/error.ts';
import { rateLimiter } from './middleware/rateLimit.ts';
import routes from './routes/index.ts';

// 加载环境变量
config({ export: true });

const app = new Application();
const router = new Router();

// 全局中间件
app.use(logger);
app.use(errorHandler);
app.use(oakCors({
  origin: Deno.env.get('CORS_ORIGIN') || '*',
  credentials: true,
}));
app.use(rateLimiter);

// 健康检查
router.get('/health', (ctx) => {
  ctx.response.body = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    deno: Deno.version.deno,
  };
});

// 路由
app.use(router.routes());
app.use(router.allowedMethods());
app.use(routes.routes());
app.use(routes.allowedMethods());

// 404 处理
app.use((ctx) => {
  ctx.response.status = 404;
  ctx.response.body = {
    success: false,
    error: 'Not Found',
  };
});

// 启动服务器
const PORT = parseInt(Deno.env.get('PORT') || '3000');
console.log(`🦕 Oak server running on http://localhost:${PORT}`);

await app.listen({ port: PORT });
```

### 配置文件

```json
// deno.json
{
  "tasks": {
    "dev": "deno run --allow-all --watch src/app.ts",
    "start": "deno run --allow-all src/app.ts",
    "test": "deno test --allow-all",
    "cache": "deno cache src/app.ts"
  },
  "compilerOptions": {
    "allowJs": true,
    "lib": ["deno.window"],
    "strict": true
  },
  "imports": {
    "oak": "https://deno.land/x/oak@v12.6.1/mod.ts",
    "cors": "https://deno.land/x/cors@v1.2.2/mod.ts",
    "dotenv": "https://deno.land/std@0.208.0/dotenv/mod.ts",
    "djwt": "https://deno.land/x/djwt@v2.8/mod.ts",
    "bcrypt": "https://deno.land/x/bcrypt@v0.4.1/mod.ts",
    "zod": "https://deno.land/x/zod@v3.22.4/mod.ts",
    "postgres": "https://deno.land/x/postgres@v0.17.0/mod.ts"
  },
  "fmt": {
    "useTabs": false,
    "lineWidth": 100,
    "indentWidth": 2,
    "semiColons": true,
    "singleQuote": true
  },
  "lint": {
    "include": ["src/"],
    "rules": {
      "tags": ["recommended"]
    }
  }
}
```

### JWT 认证中间件

```typescript
// src/middleware/auth.ts
import { Context, Next } from 'oak';
import { verify } from 'djwt';
import { crypto } from 'std/crypto/mod.ts';

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-secret-key';

// 将密钥转换为 CryptoKey
const cryptoKey = await crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(JWT_SECRET),
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign', 'verify']
);

export interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

declare module 'oak' {
  interface Context {
    state: {
      user?: UserPayload;
    };
  }
}

export async function authMiddleware(ctx: Context, next: Next) {
  const authHeader = ctx.request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    ctx.response.status = 401;
    ctx.response.body = {
      success: false,
      error: '未提供认证令牌',
    };
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = await verify(token, cryptoKey);
    ctx.state.user = {
      userId: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
    };
    await next();
  } catch (err) {
    ctx.response.status = 401;
    ctx.response.body = {
      success: false,
      error: '无效的令牌',
    };
  }
}

export async function requireRole(role: string) {
  return async (ctx: Context, next: Next) => {
    if (!ctx.state.user || ctx.state.user.role !== role) {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        error: '权限不足',
      };
      return;
    }
    await next();
  };
}
```

### 日志中间件

```typescript
// src/middleware/logger.ts
import { Context, Next } from 'oak';

export async function logger(ctx: Context, next: Next) {
  const start = Date.now();
  const method = ctx.request.method;
  const url = ctx.request.url.pathname;

  console.log(`→ ${method} ${url}`);

  await next();

  const duration = Date.now() - start;
  const status = ctx.response.status;

  console.log(`← ${method} ${url} ${status} ${duration}ms`);
}
```

### 错误处理中间件

```typescript
// src/middleware/error.ts
import { Context, Next } from 'oak';

export async function errorHandler(ctx: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    console.error('Error:', err);

    const status = err.status || 500;
    const message = err.message || '服务器错误';

    ctx.response.status = status;
    ctx.response.body = {
      success: false,
      error: message,
      ...(Deno.env.get('NODE_ENV') === 'development' && {
        stack: err.stack,
      }),
    };
  }
}
```

### 限流中间件

```typescript
// src/middleware/rateLimit.ts
import { Context, Next } from 'oak';

const requests = new Map<string, { count: number; resetTime: number }>();
const LIMIT = 100;
const WINDOW_MS = 60000; // 1 minute

export async function rateLimiter(ctx: Context, next: Next) {
  const ip = ctx.request.headers.get('x-forwarded-for') ||
             ctx.request.headers.get('x-real-ip') ||
             'unknown';
  
  const now = Date.now();
  const record = requests.get(ip);

  if (!record || now > record.resetTime) {
    requests.set(ip, { count: 1, resetTime: now + WINDOW_MS });
  } else if (record.count >= LIMIT) {
    ctx.response.status = 429;
    ctx.response.body = {
      success: false,
      error: '请求过于频繁，请稍后再试',
    };
    return;
  } else {
    record.count++;
  }

  await next();
}
```

### Zod 验证

```typescript
// src/validators/auth.validator.ts
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位'),
  name: z.string().min(2, '姓名至少2个字符'),
});

export const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码必填'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
});
```

### 控制器

```typescript
// src/controllers/auth.controller.ts
import { Context } from 'oak';
import { hash, compare } from 'bcrypt';
import { create } from 'djwt';
import { crypto } from 'std/crypto/mod.ts';
import { registerSchema, loginSchema } from '../validators/auth.validator.ts';
import { createUser, findUserByEmail } from '../services/user.service.ts';

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-secret-key';
const cryptoKey = await crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(JWT_SECRET),
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign', 'verify']
);

export async function register(ctx: Context) {
  try {
    const body = await ctx.request.body({ type: 'json' }).value;
    const validated = registerSchema.parse(body);
    const { email, password, name } = validated;

    // 检查邮箱是否存在
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: '邮箱已被注册',
      };
      return;
    }

    // 创建用户
    const hashedPassword = await hash(password);
    const user = await createUser({
      email,
      password: hashedPassword,
      name,
    });

    // 生成 JWT
    const token = await create(
      { alg: 'HS256', typ: 'JWT' },
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      },
      cryptoKey
    );

    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
      message: '注册成功',
    };
  } catch (err) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: err.message,
    };
  }
}

export async function login(ctx: Context) {
  try {
    const body = await ctx.request.body({ type: 'json' }).value;
    const validated = loginSchema.parse(body);
    const { email, password } = validated;

    // 查找用户
    const user = await findUserByEmail(email);
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: '邮箱或密码错误',
      };
      return;
    }

    // 验证密码
    const isValid = await compare(password, user.password);
    if (!isValid) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: '邮箱或密码错误',
      };
      return;
    }

    // 生成 JWT
    const token = await create(
      { alg: 'HS256', typ: 'JWT' },
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      },
      cryptoKey
    );

    ctx.response.body = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
      message: '登录成功',
    };
  } catch (err) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: err.message,
    };
  }
}
```

### 数据库连接

```typescript
// src/utils/db.ts
import { Pool } from 'postgres';

const DATABASE_URL = Deno.env.get('DATABASE_URL') ||
  'postgres://user:password@localhost:5432/mydb';

const pool = new Pool(DATABASE_URL, 10);

export async function query<T>(sql: string, args: unknown[] = []) {
  const client = await pool.connect();
  try {
    const result = await client.queryObject<T>(sql, args);
    return result.rows;
  } finally {
    client.release();
  }
}

export { pool };
```

### 路由

```typescript
// src/routes/auth.routes.ts
import { Router } from 'oak';
import { register, login } from '../controllers/auth.controller.ts';

const router = new Router({
  prefix: '/auth',
});

router
  .post('/register', register)
  .post('/login', login);

export default router;
```

```typescript
// src/routes/user.routes.ts
import { Router } from 'oak';
import { getProfile, updateProfile, deleteAccount } from '../controllers/user.controller.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = new Router({
  prefix: '/users',
});

router
  .get('/me', authMiddleware, getProfile)
  .patch('/me', authMiddleware, updateProfile)
  .delete('/me', authMiddleware, deleteAccount);

export default router;
```

```typescript
// src/routes/index.ts
import { Router } from 'oak';
import authRoutes from './auth.routes.ts';
import userRoutes from './user.routes.ts';
import postRoutes from './post.routes.ts';

const router = new Router();

router
  .use(authRoutes.routes())
  .use(userRoutes.routes())
  .use(postRoutes.routes());

export default router;
```

## 最佳实践

### 1. 响应格式统一

```typescript
// src/utils/response.ts
export const success = <T>(data: T, message = '操作成功') => ({
  success: true,
  data,
  message,
});

export const error = (message: string) => ({
  success: false,
  error: message,
});

export const paginate = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) => ({
  success: true,
  data,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  },
});
```

### 2. 环境变量管理

```env
# .env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/mydb
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=http://localhost:5173
```

### 3. 文件上传

```typescript
// src/controllers/upload.controller.ts
import { Context } from 'oak';

export async function uploadFile(ctx: Context) {
  try {
    const body = ctx.request.body({ type: 'form-data' });
    const formData = await body.value;
    const file = formData.get('file') as File;

    if (!file) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: '未上传文件' };
      return;
    }

    // 保存文件
    const filename = `${Date.now()}-${file.name}`;
    const filepath = `./uploads/${filename}`;
    const arrayBuffer = await file.arrayBuffer();
    
    await Deno.writeFile(filepath, new Uint8Array(arrayBuffer));

    ctx.response.body = {
      success: true,
      data: { filename, path: filepath },
    };
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: '文件上传失败',
    };
  }
}
```

### 4. WebSocket 支持

```typescript
// src/app.ts (添加 WebSocket)
import { WebSocket } from 'ws';

const connectedClients = new Set<WebSocket>();

app.get('/ws', async (ctx) => {
  const socket = ctx.upgrade();
  
  socket.onopen = () => {
    connectedClients.add(socket);
    console.log('Client connected');
  };
  
  socket.onmessage = (event) => {
    // 广播给所有客户端
    for (const client of connectedClients) {
      client.send(event.data);
    }
  };
  
  socket.onclose = () => {
    connectedClients.delete(socket);
    console.log('Client disconnected');
  };
});
```

## 常用命令

```bash
# 安装 Deno
curl -fsSL https://deno.land/install.sh | sh

# 运行开发服务器
deno task dev

# 运行生产服务器
deno task start

# 运行测试
deno task test

# 格式化代码
deno fmt

# 检查代码
deno lint

# 缓存依赖
deno task cache

# 编译为可执行文件
deno compile --allow-all src/app.ts

# 生成文档
deno doc src/app.ts
```

## 部署配置

### Docker

```dockerfile
# Dockerfile
FROM denoland/deno:1.40.0

WORKDIR /app

COPY . .

# 缓存依赖
RUN deno cache src/app.ts

# 创建非 root 用户
RUN useradd -m deno
USER deno

EXPOSE 3000

CMD ["run", "--allow-all", "src/app.ts"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:pass@postgres:5432/mydb
      - JWT_SECRET=your-jwt-secret-key
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Deploy to Deno Deploy

```typescript
// src/app.ts (适配 Deno Deploy)
import { Application } from 'oak';

const app = new Application();

// ... 中间件和路由

// Deno Deploy 会自动处理端口
addEventListener('fetch', app.fetchEventHandler());
```

## 资源

- [Oak 官方文档](https://oakserver.github.io/oak/)
- [Deno 手册](https://deno.land/manual)
- [Deno 标准库](https://deno.land/std)
- [Deno 第三方模块](https://deno.land/x)
