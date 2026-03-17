# Koa API 开发模板

## 技术栈

- **Koa**: Node.js 轻量级 Web 框架
- **MongoDB/PostgreSQL**: 数据库
- **TypeScript**: 类型支持
- **Koa Router**: 路由管理
- **Koa Bodyparser**: 请求体解析
- **JWT**: 身份认证
- **Zod**: 数据验证
- **Prisma/Mongoose**: ORM/ODM

## 项目结构

```
koa-api/
├── src/
│   ├── config/
│   │   ├── index.ts           # 配置聚合
│   │   ├── database.ts        # 数据库配置
│   │   └── env.ts             # 环境变量
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   └── post.controller.ts
│   ├── middleware/
│   │   ├── auth.ts            # JWT 验证
│   │   ├── errorHandler.ts    # 错误处理
│   │   ├── validator.ts       # 请求验证
│   │   ├── ratelimit.ts       # 限流
│   │   ├── logger.ts          # 日志记录
│   │   └── cors.ts            # CORS 配置
│   ├── models/
│   │   ├── User.ts
│   │   ├── Post.ts
│   │   └── index.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   └── post.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── user.service.ts
│   ├── utils/
│   │   ├── response.ts
│   │   ├── hash.ts
│   │   ├── jwt.ts
│   │   └── logger.ts
│   ├── validations/
│   │   ├── auth.validation.ts
│   │   └── user.validation.ts
│   ├── types/
│   │   ├── index.d.ts
│   │   └── context.ts
│   └── app.ts
├── prisma/
│   └── schema.prisma
├── tests/
│   ├── auth.test.ts
│   └── setup.ts
├── .env.example
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## 代码模式

### 应用入口

```typescript
// src/app.ts
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import helmet from 'koa-helmet';
import compress from 'koa-compress';
import { scopePerRequest } from 'awilix-koa';
import { createContainer, asClass } from 'awilix';

import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { rateLimiter } from './middleware/ratelimit';
import router from './routes';
import config from './config';
import logger from './utils/logger';
import { connectDB } from './config/database';

const app = new Koa();

// 依赖注入容器
const container = createContainer();
container.loadModules(['services/*.ts'], {
  formatName: 'camelCase',
  registrationOptions: {
    lifetime: Lifetime.SCOPED
  }
});
app.use(scopePerRequest(container));

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization']
}));
app.use(compress());
app.use(bodyParser({
  jsonLimit: '10mb',
  formLimit: '10mb'
}));

// 请求日志
app.use(requestLogger);

// 限流
if (config.rateLimit.enabled) {
  app.use(rateLimiter);
}

// 错误处理
app.use(errorHandler);

// 路由
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务器
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(config.port, () => {
      logger.info(`🚀 服务器运行在 http://localhost:${config.port}`);
      logger.info(`环境: ${config.env}`);
    });
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();

export default app;
```

### 配置管理

```typescript
// src/config/env.ts
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'koa_api',
    url: process.env.DATABASE_URL || ''
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*'
  },
  
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
```

```typescript
// src/config/database.ts
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import config from './env';

let prisma: PrismaClient;

export const connectDB = async () => {
  try {
    prisma = new PrismaClient({
      log: config.env === 'development' ? ['query', 'error', 'warn'] : ['error']
    });
    
    await prisma.$connect();
    logger.info('数据库连接成功');
  } catch (error) {
    logger.error('数据库连接失败:', error);
    throw error;
  }
};

export const getDB = () => {
  if (!prisma) {
    throw new Error('数据库未连接');
  }
  return prisma;
};

export const disconnectDB = async () => {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('数据库连接已关闭');
  }
};
```

### 控制器

```typescript
// src/controllers/auth.controller.ts
import { Context } from 'koa';
import { AuthService } from '../services/auth.service';
import { success, error } from '../utils/response';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (ctx: Context) => {
    try {
      const { email, password, name } = ctx.request.body as any;
      
      const result = await this.authService.register({
        email,
        password,
        name
      });

      ctx.status = 201;
      ctx.body = success(result, '注册成功');
    } catch (err: any) {
      ctx.status = err.status || 400;
      ctx.body = error(err.message);
    }
  };

  login = async (ctx: Context) => {
    try {
      const { email, password } = ctx.request.body as any;
      
      const result = await this.authService.login({
        email,
        password
      });

      ctx.body = success(result, '登录成功');
    } catch (err: any) {
      ctx.status = err.status || 401;
      ctx.body = error(err.message);
    }
  };

  getMe = async (ctx: Context) => {
    try {
      const userId = ctx.state.user.id;
      const user = await this.authService.getMe(userId);
      
      ctx.body = success(user);
    } catch (err: any) {
      ctx.status = err.status || 404;
      ctx.body = error(err.message);
    }
  };
}
```

```typescript
// src/controllers/user.controller.ts
import { Context } from 'koa';
import { UserService } from '../services/user.service';
import { success, error, paginated } from '../utils/response';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getAll = async (ctx: Context) => {
    try {
      const page = parseInt(ctx.query.page as string) || 1;
      const limit = parseInt(ctx.query.limit as string) || 10;
      
      const result = await this.userService.getAll(page, limit);
      
      ctx.body = paginated(result.data, result.pagination);
    } catch (err: any) {
      ctx.status = err.status || 500;
      ctx.body = error(err.message);
    }
  };

  getById = async (ctx: Context) => {
    try {
      const { id } = ctx.params;
      const user = await this.userService.getById(id);
      
      ctx.body = success(user);
    } catch (err: any) {
      ctx.status = err.status || 404;
      ctx.body = error(err.message);
    }
  };

  update = async (ctx: Context) => {
    try {
      const { id } = ctx.params;
      const data = ctx.request.body as any;
      
      const user = await this.userService.update(id, data);
      
      ctx.body = success(user, '更新成功');
    } catch (err: any) {
      ctx.status = err.status || 400;
      ctx.body = error(err.message);
    }
  };

  delete = async (ctx: Context) => {
    try {
      const { id } = ctx.params;
      await this.userService.delete(id);
      
      ctx.body = success(null, '删除成功');
    } catch (err: any) {
      ctx.status = err.status || 400;
      ctx.body = error(err.message);
    }
  };
}
```

### 服务层

```typescript
// src/services/auth.service.ts
import { getDB } from '../config/database';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { ApiError } from '../utils/error';

export class AuthService {
  async register(data: { email: string; password: string; name: string }) {
    const db = getDB();

    // 检查邮箱是否已存在
    const existingUser = await db.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new ApiError(400, '邮箱已被注册');
    }

    // 加密密码
    const hashedPassword = await hashPassword(data.password);

    // 创建用户
    const user = await db.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    // 生成 token
    const token = generateToken({ userId: user.id });

    return {
      user,
      token
    };
  }

  async login(data: { email: string; password: string }) {
    const db = getDB();

    // 查找用户
    const user = await db.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      throw new ApiError(401, '邮箱或密码错误');
    }

    // 验证密码
    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, '邮箱或密码错误');
    }

    // 生成 token
    const token = generateToken({ userId: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    };
  }

  async getMe(userId: string) {
    const db = getDB();

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new ApiError(404, '用户不存在');
    }

    return user;
  }
}
```

```typescript
// src/services/user.service.ts
import { getDB } from '../config/database';
import { ApiError } from '../utils/error';

export class UserService {
  async getAll(page: number, limit: number) {
    const db = getDB();
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      db.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      db.user.count()
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id: string) {
    const db = getDB();

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
        posts: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      throw new ApiError(404, '用户不存在');
    }

    return user;
  }

  async update(id: string, data: any) {
    const db = getDB();

    const user = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true
      }
    });

    return user;
  }

  async delete(id: string) {
    const db = getDB();

    await db.user.delete({
      where: { id }
    });
  }
}
```

### 路由

```typescript
// src/routes/auth.routes.ts
import Router from '@koa/router';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validator';
import { authValidation } from '../validations/auth.validation';
import { auth } from '../middleware/auth';

const router = new Router({ prefix: '/api/v1/auth' });
const authController = new AuthController();

router.post(
  '/register',
  validate(authValidation.register),
  authController.register
);

router.post(
  '/login',
  validate(authValidation.login),
  authController.login
);

router.get('/me', auth, authController.getMe);

export default router;
```

```typescript
// src/routes/user.routes.ts
import Router from '@koa/router';
import { UserController } from '../controllers/user.controller';
import { auth } from '../middleware/auth';

const router = new Router({ prefix: '/api/v1/users' });
const userController = new UserController();

router.get('/', auth, userController.getAll);
router.get('/:id', auth, userController.getById);
router.put('/:id', auth, userController.update);
router.delete('/:id', auth, userController.delete);

export default router;
```

```typescript
// src/routes/index.ts
import Router from '@koa/router';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import postRoutes from './post.routes';

const router = new Router();

// 健康检查
router.get('/health', (ctx) => {
  ctx.body = { status: 'ok', timestamp: new Date().toISOString() };
});

// 路由注册
router.use(authRoutes.routes());
router.use(userRoutes.routes());
router.use(postRoutes.routes());

export default router;
```

### 中间件

```typescript
// src/middleware/auth.ts
import { Context, Next } from 'koa';
import { verify } from 'jsonwebtoken';
import config from '../config/env';
import { error } from '../utils/response';

export interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

export const auth = async (ctx: Context, next: Next) => {
  try {
    // 获取 token
    const authorization = ctx.headers.authorization;
    if (!authorization) {
      ctx.status = 401;
      ctx.body = error('请先登录');
      return;
    }

    const token = authorization.replace('Bearer ', '');

    // 验证 token
    const decoded = verify(token, config.jwt.secret) as JwtPayload;

    // 将用户信息存储到上下文
    ctx.state.user = { id: decoded.userId };

    await next();
  } catch (err) {
    ctx.status = 401;
    ctx.body = error('认证失败');
  }
};

export const authorize = (...roles: string[]) => {
  return async (ctx: Context, next: Next) => {
    const user = ctx.state.user;
    
    if (!user || !roles.includes(user.role)) {
      ctx.status = 403;
      ctx.body = error('没有权限执行此操作');
      return;
    }

    await next();
  };
};
```

```typescript
// src/middleware/errorHandler.ts
import { Context, Next } from 'koa';
import { ApiError } from '../utils/error';
import logger from '../utils/logger';

export const errorHandler = async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (err: any) {
    logger.error('错误:', err);

    // 处理 API 错误
    if (err instanceof ApiError) {
      ctx.status = err.status;
      ctx.body = {
        success: false,
        message: err.message
      };
      return;
    }

    // 处理 Prisma 错误
    if (err.code === 'P2002') {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: '数据已存在'
      };
      return;
    }

    // 处理验证错误
    if (err.name === 'ValidationError') {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: err.message
      };
      return;
    }

    // 默认服务器错误
    ctx.status = err.status || 500;
    ctx.body = {
      success: false,
      message: process.env.NODE_ENV === 'production' 
        ? '服务器错误' 
        : err.message
    };
  }
};
```

```typescript
// src/middleware/validator.ts
import { Context, Next } from 'koa';
import { AnyZodObject } from 'zod';
import { error } from '../utils/response';

export const validate = (schema: AnyZodObject) => {
  return async (ctx: Context, next: Next) => {
    try {
      await schema.parseAsync({
        body: ctx.request.body,
        query: ctx.query,
        params: ctx.params
      });
      await next();
    } catch (err: any) {
      const messages = err.errors.map((e: any) => e.message);
      ctx.status = 400;
      ctx.body = error(messages.join(', '));
    }
  };
};
```

```typescript
// src/middleware/ratelimit.ts
import { Context, Next } from 'koa';
import RateLimit from 'koa-ratelimit';
import config from '../config/env';

export const rateLimiter = RateLimit({
  db: new Map(),
  duration: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  id: (ctx) => ctx.ip,
  errorMessage: '请求过于频繁，请稍后再试',
  disableHeader: false,
  headers: {
    remaining: 'X-RateLimit-Remaining',
    reset: 'X-RateLimit-Reset',
    total: 'X-RateLimit-Total'
  }
});
```

```typescript
// src/middleware/logger.ts
import { Context, Next } from 'koa';
import logger from '../utils/logger';

export const requestLogger = async (ctx: Context, next: Next) => {
  const start = Date.now();

  await next();

  const ms = Date.now() - start;

  logger.info(`${ctx.method} ${ctx.url} ${ctx.status} - ${ms}ms`);
};
```

### 验证

```typescript
// src/validations/auth.validation.ts
import { z } from 'zod';

export const authValidation = {
  register: z.object({
    body: z.object({
      email: z.string().email('邮箱格式不正确'),
      password: z.string().min(6, '密码至少6位'),
      name: z.string().min(2, '姓名至少2个字符')
    })
  }),

  login: z.object({
    body: z.object({
      email: z.string().email('邮箱格式不正确'),
      password: z.string().min(1, '密码必填')
    })
  })
};
```

### 工具函数

```typescript
// src/utils/response.ts
export const success = (data: any, message = '操作成功') => {
  return {
    success: true,
    message,
    data
  };
};

export const error = (message = '操作失败', errors?: any) => {
  return {
    success: false,
    message,
    errors
  };
};

export const paginated = (
  data: any[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
) => {
  return {
    success: true,
    data,
    pagination
  };
};
```

```typescript
// src/utils/error.ts
export class ApiError extends Error {
  status: number;
  isOperational: boolean;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

```typescript
// src/utils/hash.ts
import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};
```

```typescript
// src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import config from '../config/env';

export interface TokenPayload {
  userId: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};
```

```typescript
// src/utils/logger.ts
import pino from 'pino';
import config from '../config/env';

const logger = pino({
  level: config.logging.level,
  transport:
    config.env === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname'
          }
        }
      : undefined
});

export default logger;
```

### Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      String   @default("user")
  avatar    String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

model Post {
  id          String   @id @default(cuid())
  title       String
  content     String
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  tags        String[]
  likes       Int      @default(0)
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([authorId])
  @@index([createdAt])
}
```

## 最佳实践

### 1. 上下文扩展

```typescript
// src/types/context.ts
import { DefaultState, DefaultContext } from 'koa';

export interface CustomState extends DefaultState {
  user?: {
    id: string;
    role?: string;
  };
}

export interface CustomContext extends DefaultContext {
  state: CustomState;
}

// 在 tsconfig.json 中添加
// "types": ["./src/types/context.ts"]
```

### 2. 中间件组合

```typescript
// src/middleware/compose.ts
import { Middleware } from 'koa';

export const compose = (...middlewares: Middleware[]) => {
  return async (ctx, next) => {
    let index = -1;

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      index = i;

      const middleware = middlewares[i];
      if (!middleware) {
        return next();
      }

      await middleware(ctx, () => dispatch(i + 1));
    };

    return dispatch(0);
  };
};
```

### 3. 请求上下文

```typescript
// src/middleware/requestContext.ts
import { Context, Next } from 'koa';
import { AsyncLocalStorage } from 'async_hooks';

const requestContext = new AsyncLocalStorage<Context>();

export const requestContextMiddleware = async (
  ctx: Context,
  next: Next
) => {
  return requestContext.run(ctx, next);
};

export const getRequestContext = (): Context | undefined => {
  return requestContext.getStore();
};
```

## 常用命令

### 开发

```bash
# 安装依赖
npm install koa @koa/router koa-bodyparser @koa/cors koa-helmet koa-compress
npm install @prisma/client zod bcryptjs jsonwebtoken pino
npm install -D @types/koa @types/koa-router @types/bcryptjs @types/jsonwebtoken
npm install -D typescript ts-node nodemon prisma

# 初始化 Prisma
npx prisma init

# 生成客户端
npx prisma generate

# 运行迁移
npx prisma migrate dev --name init

# 开发模式
npm run dev

# 构建
npm run build

# 生产运行
npm start
```

### 数据库

```bash
# 创建迁移
npx prisma migrate dev --name add_user_table

# 重置数据库
npx prisma migrate reset

# 查看数据库
npx prisma studio

# 生成客户端
npx prisma generate
```

## 部署配置

### package.json

```json
{
  "name": "koa-api",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy"
  },
  "dependencies": {
    "@koa/cors": "^5.0.0",
    "@koa/router": "^12.0.0",
    "@prisma/client": "^5.7.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "koa": "^2.15.0",
    "koa-bodyparser": "^4.4.0",
    "koa-compress": "^5.1.0",
    "koa-helmet": "^7.0.0",
    "koa-ratelimit": "^5.1.0",
    "pino": "^8.17.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/koa": "^2.14.0",
    "@types/koa-bodyparser": "^4.3.12",
    "@types/koa-router": "^7.4.8",
    "@types/node": "^20.10.0",
    "nodemon": "^3.0.2",
    "prisma": "^5.7.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.0"
  }
}
```

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装 OpenSSL（Prisma 需要）
RUN apk add --no-cache openssl

# 复制依赖文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖
RUN npm ci --only=production
RUN npx prisma generate

# 复制源代码
COPY dist ./dist

EXPOSE 3000

CMD ["npm", "start"]
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
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/koa_api
      - JWT_SECRET=your-jwt-secret-key
      - CORS_ORIGIN=http://localhost:3000
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=koa_api
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### 环境变量

```env
# .env.example
NODE_ENV=development
PORT=3000

DATABASE_URL="postgresql://postgres:password@localhost:5432/koa_api?schema=public"

JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000,http://localhost:5173

RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

LOG_LEVEL=debug
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "types": ["node"],
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```
