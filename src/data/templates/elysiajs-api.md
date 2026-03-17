# ElysiaJS API 开发模板

## 技术栈

- **Bun**: JavaScript 运行时
- **ElysiaJS**: 高性能 Web 框架
- **TypeScript**: 类型支持
- **Prisma**: ORM
- **JWT**: 身份认证
- **Swagger**: API 文档

## 项目结构

```
elysiajs-api/
├── prisma/
│   ├── schema.prisma      # 数据库模型
│   ├── migrations/        # 迁移文件
│   └── seed.ts            # 种子数据
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   └── post.controller.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── logger.ts
│   │   └── error.ts
│   ├── models/
│   │   └── user.model.ts
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
│   │   └── validation.ts
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   └── user.validator.ts
│   ├── types/
│   │   └── index.ts
│   ├── config/
│   │   └── index.ts
│   └── index.ts           # 应用入口
├── tests/
│   └── auth.test.ts
├── bunfig.toml
├── package.json
└── tsconfig.json
```

## 代码模式

### 应用入口

```ts
// src/index.ts
import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { helmet } from 'elysiajs-helmet';
import { staticPlugin } from '@elysiajs/static';
import { compress } from '@elysiajs/compress';
import { logger } from '@grotto/logging';
import { PrismaClient } from '@prisma/client';
import routes from './routes';
import { errorHandler } from './middleware/error';

const prisma = new PrismaClient();

const app = new Elysia()
  // 插件
  .use(swagger({
    documentation: {
      info: {
        title: 'ElysiaJS API',
        version: '1.0.0'
      }
    }
  }))
  .use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  }))
  .use(helmet())
  .use(compress())
  .use(logger())

  // 全局状态
  .state('prisma', prisma)

  // 错误处理
  .onError(errorHandler)

  // 路由
  .use(routes)

  // 启动服务器
  .listen(process.env.PORT || 3000);

console.log(`🦊 Elysia is running at http://localhost:${app.server?.port}`);
console.log(`📚 Swagger docs at http://localhost:${app.server?.port}/swagger`);

export default app;
```

### 认证中间件

```ts
// src/middleware/auth.ts
import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { User } from '@prisma/client';

declare module 'elysia' {
  interface ElysiaOnContext {
    user?: User;
  }
}

export const authMiddleware = new Elysia({ name: 'auth' })
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET!
  }))
  .derive(async ({ jwt, headers, error }) => {
    const token = headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return error(401, '未提供认证令牌');
    }

    const payload = await jwt.verify(token);
    if (!payload) {
      return error(401, '无效的令牌');
    }

    return { userId: payload.sub };
  });

export const requireAuth = new Elysia()
  .use(authMiddleware)
  .resolve(async ({ userId, prisma, error }) => {
    const user = await prisma.user.findUnique({
      where: { id: userId as string }
    });

    if (!user) {
      return error(401, '用户不存在');
    }

    return { user };
  });
```

### 验证器

```ts
// src/validators/auth.validator.ts
import { t } from 'elysia';

export const authValidator = {
  register: t.Object({
    email: t.String({ format: 'email', error: '邮箱格式不正确' }),
    password: t.String({ minLength: 6, error: '密码至少6位' }),
    name: t.String({ minLength: 2, error: '姓名至少2个字符' })
  }),

  login: t.Object({
    email: t.String({ format: 'email', error: '邮箱格式不正确' }),
    password: t.String({ minLength: 1, error: '密码必填' })
  }),

  update: t.Partial(
    t.Object({
      name: t.String({ minLength: 2 }),
      email: t.String({ format: 'email' }),
      avatar: t.String()
    })
  )
};
```

### 控制器

```ts
// src/controllers/auth.controller.ts
import { Elysia, t } from 'elysia';
import { hash, verify } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authValidator } from '../validators/auth.validator';

const prisma = new PrismaClient();

export const authController = new Elysia({ prefix: '/auth' })
  .post('/register', async ({ body, error }) => {
    const { email, password, name } = body;

    // 检查邮箱是否存在
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return error(400, '邮箱已被注册');
    }

    // 创建用户
    const hashedPassword = await hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
      select: { id: true, email: true, name: true, role: true }
    });

    // 生成 JWT
    const token = sign({ sub: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '7d'
    });

    return {
      success: true,
      data: { user, token },
      message: '注册成功'
    };
  }, {
    body: authValidator.register,
    detail: {
      tags: ['认证'],
      summary: '用户注册'
    }
  })

  .post('/login', async ({ body, error }) => {
    const { email, password } = body;

    // 查找用户
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return error(401, '邮箱或密码错误');
    }

    // 验证密码
    const isValid = await verify(password, user.password);
    if (!isValid) {
      return error(401, '邮箱或密码错误');
    }

    // 生成 JWT
    const token = sign({ sub: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '7d'
    });

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      },
      message: '登录成功'
    };
  }, {
    body: authValidator.login,
    detail: {
      tags: ['认证'],
      summary: '用户登录'
    }
  });
```

### 用户控制器

```ts
// src/controllers/user.controller.ts
import { Elysia } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { userValidator } from '../validators/user.validator';

const prisma = new PrismaClient();

export const userController = new Elysia({ prefix: '/users' })
  .use(requireAuth)

  .get('/me', async ({ user }) => {
    return {
      success: true,
      data: user
    };
  }, {
    detail: {
      tags: ['用户'],
      summary: '获取当前用户',
      security: [{ bearerAuth: [] }]
    }
  })

  .get('/:id', async ({ params, error }) => {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true
      }
    });

    if (!user) {
      return error(404, '用户不存在');
    }

    return { success: true, data: user };
  }, {
    params: t.Object({ id: t.String() }),
    detail: {
      tags: ['用户'],
      summary: '获取用户信息'
    }
  })

  .patch('/me', async ({ user, body, error }) => {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: body,
      select: { id: true, email: true, name: true, avatar: true }
    });

    return {
      success: true,
      data: updatedUser,
      message: '更新成功'
    };
  }, {
    body: userValidator.update,
    detail: {
      tags: ['用户'],
      summary: '更新用户信息',
      security: [{ bearerAuth: [] }]
    }
  })

  .delete('/me', async ({ user }) => {
    await prisma.user.delete({ where: { id: user.id } });
    
    return {
      success: true,
      message: '账户已删除'
    };
  }, {
    detail: {
      tags: ['用户'],
      summary: '删除账户',
      security: [{ bearerAuth: [] }]
    }
  });
```

### 文章控制器

```ts
// src/controllers/post.controller.ts
import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const prisma = new PrismaClient();

export const postController = new Elysia({ prefix: '/posts' })
  .get('/', async ({ query }) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        include: {
          author: { select: { id: true, name: true, avatar: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.post.count()
    ]);

    return {
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String())
    }),
    detail: {
      tags: ['文章'],
      summary: '获取文章列表'
    }
  })

  .get('/:id', async ({ params, error }) => {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { id: true, name: true, avatar: true } }
      }
    });

    if (!post) {
      return error(404, '文章不存在');
    }

    return { success: true, data: post };
  }, {
    params: t.Object({ id: t.String() }),
    detail: {
      tags: ['文章'],
      summary: '获取文章详情'
    }
  })

  .use(requireAuth)
  .post('/', async ({ user, body, error }) => {
    const post = await prisma.post.create({
      data: {
        ...body,
        authorId: user.id
      },
      include: {
        author: { select: { id: true, name: true } }
      }
    });

    return {
      success: true,
      data: post,
      message: '创建成功'
    };
  }, {
    body: t.Object({
      title: t.String({ minLength: 1, maxLength: 200 }),
      content: t.String({ minLength: 1 }),
      tags: t.Optional(t.Array(t.String())),
      isPublished: t.Optional(t.Boolean())
    }),
    detail: {
      tags: ['文章'],
      summary: '创建文章',
      security: [{ bearerAuth: [] }]
    }
  })

  .delete('/:id', async ({ user, params, error }) => {
    const post = await prisma.post.findUnique({
      where: { id: params.id }
    });

    if (!post) {
      return error(404, '文章不存在');
    }

    if (post.authorId !== user.id) {
      return error(403, '没有权限删除此文章');
    }

    await prisma.post.delete({ where: { id: params.id } });

    return {
      success: true,
      message: '删除成功'
    };
  }, {
    params: t.Object({ id: t.String() }),
    detail: {
      tags: ['文章'],
      summary: '删除文章',
      security: [{ bearerAuth: [] }]
    }
  });
```

### 路由聚合

```ts
// src/routes/index.ts
import { Elysia } from 'elysia';
import { authController } from '../controllers/auth.controller';
import { userController } from '../controllers/user.controller';
import { postController } from '../controllers/post.controller';

export default new Elysia()
  .use(authController)
  .use(userController)
  .use(postController);
```

### 错误处理

```ts
// src/middleware/error.ts
import { Elysia } from 'elysia';

export const errorHandler = ({ code, error, set }) => {
  const status = code === 'NOT_FOUND' ? 404 : 
                 code === 'VALIDATION' ? 400 : 
                 code === 'PARSE' ? 400 : 500;

  set.status = status;

  return {
    success: false,
    error: error.message || '服务器错误',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      code 
    })
  };
};
```

## 最佳实践

### 1. 响应格式统一

```ts
// src/utils/response.ts
export const success = <T>(data: T, message = '操作成功') => ({
  success: true,
  data,
  message
});

export const error = (message: string, statusCode = 400) => ({
  success: false,
  error: message,
  statusCode
});

export const paginate = <T>(data: T[], total: number, page: number, limit: number) => ({
  success: true,
  data,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
});
```

### 2. 使用插件组织代码

```ts
// 插件化开发
export const databasePlugin = new Elysia({ name: 'database' })
  .state('prisma', new PrismaClient())
  .onStop(({ store }) => store.prisma.$disconnect());

// 使用插件
app.use(databasePlugin);
```

### 3. 类型安全的推导

```ts
// 利用 Elysia 的类型推导
const app = new Elysia()
  .state('version', '1.0.0')
  .derive(({ store }) => ({
    getVersion: () => store.version
  }));

// 自动推导类型
type App = typeof app;
type Store = App['store']; // { version: string }
```

### 4. 文件上传

```ts
import { multipart } from '@grotto/multipart';

app.use(multipart())
  .post('/upload', async ({ body }) => {
    const file = body.file;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await Bun.write(`./uploads/${file.name}`, buffer);
    
    return { success: true, filename: file.name };
  });
```

### 5. WebSocket 支持

```ts
app.ws('/ws', {
  open(ws) {
    console.log('WebSocket 连接打开');
  },
  message(ws, message) {
    ws.send(`收到: ${message}`);
  },
  close(ws) {
    console.log('WebSocket 连接关闭');
  }
});
```

## 常用命令

### 开发

```bash
# 安装 Bun
curl -fsSL https://bun.sh/install | bash

# 创建项目
bun create elysia my-api

# 安装依赖
bun install

# 开发模式
bun run dev

# 构建
bun run build

# 生产运行
bun run start
```

### Prisma

```bash
# 初始化 Prisma
bunx prisma init

# 生成客户端
bunx prisma generate

# 创建迁移
bunx prisma migrate dev --name init

# 查看数据库
bunx prisma studio

# 重置数据库
bunx prisma migrate reset
```

## 部署配置

### package.json

```json
{
  "name": "elysiajs-api",
  "version": "1.0.0",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist --target bun",
    "start": "bun run dist/index.js",
    "test": "bun test"
  },
  "dependencies": {
    "elysia": "^1.0.0",
    "@elysiajs/cors": "^1.0.0",
    "@elysiajs/swagger": "^1.0.0",
    "@elysiajs/jwt": "^1.0.0",
    "@prisma/client": "^5.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext"],
    "types": ["bun-types"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

### Dockerfile

```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

COPY prisma ./prisma
RUN bunx prisma generate

COPY dist ./dist

EXPOSE 3000

CMD ["bun", "run", "dist/index.js"]
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
      - DATABASE_URL=postgresql://user:pass@postgres:5432/mydb
      - JWT_SECRET=your-secret-key
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

### 环境变量

```env
# .env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=http://localhost:3000
```

### 性能优化

```ts
// 启用 JIT 编译
Bun.enableJIT();

// 使用连接池
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// 压缩响应
app.use(compress({
  threshold: 1024 // 大于 1KB 才压缩
}));
```
