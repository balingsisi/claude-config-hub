# Prisma ORM 模板

## 技术栈

- **ORM**: Prisma 5.x
- **数据库**: PostgreSQL / MySQL / SQLite / MongoDB
- **运行时**: Node.js 20+
- **框架**: Express / Fastify / NestJS / Next.js
- **迁移**: Prisma Migrate
- **客户端**: Prisma Client
- **工具**: Prisma Studio
- **测试**: Vitest / Jest

## 项目结构

```
prisma-orm/
├── prisma/                    # Prisma 配置目录
│   ├── schema.prisma         # 数据模型定义
│   ├── migrations/           # 数据库迁移
│   │   ├── 20240101000000_init/
│   │   └── migration_lock.toml
│   └── seeds/                # 种子数据
│       ├── users.ts
│       └── products.ts
├── src/
│   ├── modules/              # 功能模块
│   │   ├── users/
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.dto.ts
│   │   │   └── user.test.ts
│   │   ├── posts/
│   │   ├── comments/
│   │   └── auth/
│   ├── lib/                  # 共享库
│   │   ├── prisma.ts        # Prisma 客户端实例
│   │   ├── logger.ts
│   │   └── validators.ts
│   ├── middleware/           # 中间件
│   │   ├── errorHandler.ts
│   │   ├── auth.ts
│   │   └── rateLimiter.ts
│   ├── types/               # 类型定义
│   │   └── index.ts
│   └── app.ts               # 应用入口
├── tests/                   # 测试
│   ├── setup.ts
│   ├── integration/
│   └── e2e/
├── .env                    # 环境变量
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## 代码模式

### Prisma Schema 定义

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 枚举类型
enum Role {
  USER
  ADMIN
  MODERATOR
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

// 用户模型
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String    @unique @db.VarChar(50)
  name          String?
  avatar        String?
  bio           String?   @db.Text
  role          Role      @default(USER)
  emailVerified DateTime?
  
  // 关系
  posts         Post[]
  comments      Comment[]
  likes         Like[]
  followers     Follow[]  @relation("UserFollowers")
  following     Follow[]  @relation("UserFollowing")
  notifications Notification[]
  
  // 时间戳
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // 索引
  @@index([email])
  @@index([username])
  @@map("users")
}

// 文章模型
model Post {
  id          String      @id @default(cuid())
  title       String      @db.VarChar(200)
  slug        String      @unique @db.VarChar(250)
  content     String      @db.Text
  excerpt     String?     @db.VarChar(500)
  coverImage  String?
  status      PostStatus  @default(DRAFT)
  viewCount   Int         @default(0)
  
  // 关系
  authorId    String
  author      User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  category    Category?   @relation(fields: [categoryId], references: [id])
  categoryId  String?
  tags        Tag[]
  comments    Comment[]
  likes       Like[]
  
  // 全文索引
  @@index([title])
  @@index([slug])
  @@index([authorId])
  @@index([categoryId])
  @@fulltext([title, content])
  @@map("posts")
}

// 分类模型
model Category {
  id          String   @id @default(cuid())
  name        String   @unique @db.VarChar(50)
  slug        String   @unique
  description String?  @db.Text
  
  posts       Post[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("categories")
}

// 标签模型（多对多）
model Tag {
  id    String   @id @default(cuid())
  name  String   @unique @db.VarChar(30)
  slug  String   @unique
  
  posts Post[]
  
  @@map("tags")
}

// 评论模型
model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  
  // 关系
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  parentId  String?
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([postId])
  @@index([authorId])
  @@map("comments")
}

// 点赞模型
model Like {
  id        String   @id @default(cuid())
  
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  
  @@unique([userId, postId])
  @@map("likes")
}

// 关注关系
model Follow {
  followerId  String
  follower    User    @relation("UserFollowers", fields: [followerId], references: [id], onDelete: Cascade)
  followingId String
  following   User    @relation("UserFollowing", fields: [followingId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  
  @@id([followerId, followingId])
  @@map("follows")
}

// 通知模型
model Notification {
  id          String   @id @default(cuid())
  type        String   @db.VarChar(50)
  title       String   @db.VarChar(200)
  content     String?  @db.Text
  isRead      Boolean  @default(false)
  
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  
  @@index([userId, isRead])
  @@map("notifications")
}
```

### Prisma 客户端配置

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // 避免开发环境热重载时创建多个实例
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// 优雅关闭
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// 扩展 Prisma 客户端
export const extendedPrisma = prisma.$extends({
  model: {
    user: {
      // 自定义方法
      async findByEmail(email: string) {
        return prisma.user.findUnique({
          where: { email },
          include: {
            _count: {
              select: { posts: true, followers: true },
            },
          },
        });
      },
    },
  },
  result: {
    user: {
      // 计算字段
      fullName: {
        needs: { name: true },
        compute(user) {
          return user.name || 'Anonymous';
        },
      },
    },
  },
  query: {
    user: {
      // 查询钩子
      async findMany({ model, operation, args, query }) {
        // 软删除过滤
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
});
```

### Service 层模式

```typescript
// src/modules/users/user.service.ts
import { prisma } from '@/lib/prisma';
import { Prisma, User } from '@prisma/client';
import { hash, compare } from 'bcrypt';
import { AppError } from '@/lib/errors';

export class UserService {
  // 创建用户
  async create(data: Prisma.UserCreateInput): Promise<User> {
    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(400, 'Email already exists');
    }

    // 加密密码
    const hashedPassword = await hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  // 分页查询
  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) {
    const { page = 1, limit = 10, search, role } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        role ? { role: role as any } : {},
      ],
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 根据ID查询（包含关联）
  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        posts: {
          where: { status: 'PUBLISHED' },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            category: true,
            tags: true,
            _count: {
              select: { likes: true, comments: true },
            },
          },
        },
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }

  // 更新用户
  async update(id: string, data: Prisma.UserUpdateInput) {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
      },
    });

    return user;
  }

  // 删除用户
  async delete(id: string) {
    // 级联删除会自动处理关联数据
    await prisma.user.delete({
      where: { id },
    });
  }

  // 关注/取消关注
  async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new AppError(400, 'Cannot follow yourself');
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existing) {
      // 取消关注
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
      return { isFollowing: false };
    } else {
      // 关注
      await prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      // 创建通知
      await prisma.notification.create({
        data: {
          userId: followingId,
          type: 'FOLLOW',
          title: 'New Follower',
          content: `User ${followerId} started following you`,
        },
      });

      return { isFollowing: true };
    }
  }

  // 事务示例
  async createPostWithTags(
    authorId: string,
    postData: Prisma.PostCreateWithoutAuthorInput,
    tagIds: string[]
  ) {
    const post = await prisma.$transaction(async (tx) => {
      // 创建文章
      const newPost = await tx.post.create({
        data: {
          ...postData,
          authorId,
          tags: {
            connect: tagIds.map((id) => ({ id })),
          },
        },
        include: {
          tags: true,
        },
      });

      // 更新用户文章计数
      await tx.user.update({
        where: { id: authorId },
        data: { postCount: { increment: 1 } },
      });

      return newPost;
    });

    return post;
  }
}

export const userService = new UserService();
```

### Controller 层

```typescript
// src/modules/users/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { validate } from '@/lib/validators';
import { userSchemas } from './user.dto';

export class UserController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = validate(userSchemas.create, req.body);
      const user = await userService.create(data);
      
      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, role } = req.query;
      
      const result = await userService.findAll({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        role: role as string,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.findById(id);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = validate(userSchemas.update, req.body);
      
      const user = await userService.update(id, data);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await userService.delete(id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async toggleFollow(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user!.id;
      
      const result = await userService.toggleFollow(currentUserId, userId);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
```

### DTO 验证

```typescript
// src/modules/users/user.dto.ts
import Joi from 'joi';

export const userSchemas = {
  create: Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().alphanum().min(3).max(50).required(),
    password: Joi.string().min(8).pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    ).required(),
    name: Joi.string().min(2).max(100).required(),
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100),
    bio: Joi.string().max(500),
    avatar: Joi.string().uri(),
  }).min(1),
};

// TypeScript DTO
export interface CreateUserDTO {
  email: string;
  username: string;
  password: string;
  name: string;
}

export interface UpdateUserDTO {
  name?: string;
  bio?: string;
  avatar?: string;
}
```

## 最佳实践

### 1. 查询优化

```typescript
// ✅ 使用 select 减少数据传输
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
  },
});

// ✅ 使用 include 加载关联
const posts = await prisma.post.findMany({
  include: {
    author: {
      select: { id: true, name: true },
    },
    tags: true,
    _count: {
      select: { comments: true, likes: true },
    },
  },
});

// ✅ 批量查询
const [users, posts] = await prisma.$transaction([
  prisma.user.findMany(),
  prisma.post.findMany(),
]);

// ✅ 使用 cursor 分页（大数据集）
const posts = await prisma.post.findMany({
  take: 10,
  cursor: { id: lastId },
  orderBy: { createdAt: 'desc' },
});

// ✅ 原始 SQL（复杂查询）
const result = await prisma.$queryRaw`
  SELECT u.name, COUNT(p.id) as post_count
  FROM users u
  LEFT JOIN posts p ON u.id = p."authorId"
  GROUP BY u.id
  ORDER BY post_count DESC
  LIMIT 10
`;
```

### 2. 错误处理

```typescript
// src/lib/errors.ts
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
  }
}

// 处理 Prisma 错误
export const handlePrismaError = (error: any): AppError => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // 唯一约束冲突
        const field = error.meta?.target as string[];
        return new AppError(409, `${field[0]} already exists`);
      
      case 'P2025':
        // 记录不存在
        return new AppError(404, 'Record not found');
      
      case 'P2003':
        // 外键约束失败
        return new AppError(400, 'Invalid reference');
      
      case 'P2014':
        // 关系约束
        return new AppError(400, 'Relation constraint violation');
      
      default:
        return new AppError(500, 'Database error');
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new AppError(400, 'Validation error');
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new AppError(500, 'Database connection failed');
  }

  return new AppError(500, 'Internal server error');
};

// 错误处理中间件
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', error);

  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else {
    appError = handlePrismaError(error);
  }

  res.status(appError.statusCode).json({
    success: false,
    error: appError.message,
    details: appError.details,
  });
};
```

### 3. 迁移管理

```typescript
// prisma/migrations/migration-script.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 数据迁移脚本
async function migrate() {
  console.log('Starting migration...');

  // 批量更新数据
  await prisma.$transaction(async (tx) => {
    // 1. 更新所有草稿文章的状态
    const drafts = await tx.post.findMany({
      where: { status: 'DRAFT' },
    });

    for (const draft of drafts) {
      await tx.post.update({
        where: { id: draft.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });
    }

    // 2. 创建缺失的分类
    const categories = ['Tech', 'Lifestyle', 'Business'];
    for (const name of categories) {
      await tx.category.upsert({
        where: { name },
        create: { name, slug: name.toLowerCase() },
        update: {},
      });
    }
  });

  console.log('Migration completed!');
}

migrate()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 4. 种子数据

```typescript
// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 清理现有数据
  await prisma.notification.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();

  // 创建分类
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: 'Technology', slug: 'technology' },
    }),
    prisma.category.create({
      data: { name: 'Lifestyle', slug: 'lifestyle' },
    }),
    prisma.category.create({
      data: { name: 'Business', slug: 'business' },
    }),
  ]);

  // 创建标签
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'JavaScript', slug: 'javascript' } }),
    prisma.tag.create({ data: { name: 'TypeScript', slug: 'typescript' } }),
    prisma.tag.create({ data: { name: 'React', slug: 'react' } }),
    prisma.tag.create({ data: { name: 'Node.js', slug: 'nodejs' } }),
  ]);

  // 创建管理员
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      username: 'admin',
      password: await hash('Admin123!@#', 10),
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });

  // 创建测试用户
  const users = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      prisma.user.create({
        data: {
          email: `user${i + 1}@example.com`,
          username: `user${i + 1}`,
          password: await hash('Password123!', 10),
          name: `User ${i + 1}`,
        },
      })
    )
  );

  // 创建文章
  for (const user of users.slice(0, 5)) {
    await prisma.post.create({
      data: {
        title: `Post by ${user.name}`,
        slug: `post-by-${user.username}-${Date.now()}`,
        content: 'Lorem ipsum dolor sit amet...',
        status: 'PUBLISHED',
        authorId: user.id,
        categoryId: categories[0].id,
        tags: {
          connect: [tags[0].id, tags[1].id].map((id) => ({ id })),
        },
      },
    });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## 常用命令

```bash
# Prisma CLI 命令

# 初始化 Prisma
npx prisma init

# 生成客户端
npx prisma generate

# 创建迁移
npx prisma migrate dev --name init

# 应用迁移到生产环境
npx prisma migrate deploy

# 重置数据库（开发环境）
npx prisma migrate reset

# 查看迁移状态
npx prisma migrate status

# 运行种子脚本
npx prisma db seed

# 打开 Prisma Studio
npx prisma studio

# 格式化 schema
npx prisma format

# 验证 schema
npx prisma validate

# 从现有数据库生成 schema
npx prisma db pull

# 推送 schema 变更（不创建迁移）
npx prisma db push

# 查看数据库数据
npx prisma db execute --stdin < query.sql
```

## 部署配置

### 环境变量

```bash
# .env.example
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"

# 连接池配置（生产环境）
DIRECT_URL="postgresql://user:password@localhost:5432/mydb?pgbouncer=true&connect_timeout=60"

# 其他配置
NODE_ENV=production
PORT=3000
```

### Prisma Schema 生产配置

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider        = "prisma-client-js"
  binaryTargets   = ["native", "rhel-openssl-3.0.x"]  # 支持 Vercel/Render
}
```

### Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# 运行迁移
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

### Vercel 部署

```json
// vercel.json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "DATABASE_URL": "@database_url"
  }
}
```

## 测试策略

```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  // 使用测试数据库
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  
  // 运行迁移
  execSync('npx prisma migrate deploy');
});

afterAll(async () => {
  // 清理测试数据
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tablenames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
  }

  await prisma.$disconnect();
});

// tests/integration/user.test.ts
import { describe, it, expect } from 'vitest';
import { userService } from '@/modules/users/user.service';
import { prisma } from '@/lib/prisma';

describe('UserService', () => {
  it('should create a user', async () => {
    const data = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123!',
      name: 'Test User',
    };

    const user = await userService.create(data);

    expect(user.email).toBe(data.email);
    expect(user.username).toBe(data.username);
    expect(user.name).toBe(data.name);
  });

  it('should not create duplicate email', async () => {
    const data = {
      email: 'existing@example.com',
      username: 'existing',
      password: 'Password123!',
      name: 'Existing User',
    };

    await userService.create(data);

    await expect(userService.create(data)).rejects.toThrow('Email already exists');
  });
});
```

## 参考资源

- [Prisma 官方文档](https://www.prisma.io/docs)
- [Prisma GitHub](https://github.com/prisma/prisma)
- [Prisma 最佳实践](https://www.prisma.io/docs/guides/database/best-practices)
- [Prisma Migrate 指南](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
