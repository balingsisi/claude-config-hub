# Neon - Serverless PostgreSQL

无服务器 PostgreSQL 数据库平台，支持自动扩展、分支和即时克隆，专为现代云原生应用设计。

## 技术栈

- **数据库**: Neon PostgreSQL 16
- **连接**: @neondatabase/serverless
- **ORM**: Drizzle ORM / Prisma / Kysely
- **连接池**: Neon Serverless Driver
- **语言**: TypeScript / JavaScript
- **运行时**: Node.js / Edge Runtime / Serverless

## 项目结构

```
neon-project/
├── src/
│   ├── lib/
│   │   ├── db.ts              # 数据库连接
│   │   ├── schema.ts          # Drizzle schema
│   │   └── seed.ts            # 种子数据
│   ├── models/                # 数据模型
│   │   ├── user.ts
│   │   ├── post.ts
│   │   └── comment.ts
│   ├── repositories/          # 数据访问层
│   │   ├── user.repo.ts
│   │   ├── post.repo.ts
│   │   └── comment.repo.ts
│   ├── services/              # 业务逻辑层
│   │   ├── user.service.ts
│   │   ├── post.service.ts
│   │   └── auth.service.ts
│   ├── api/                   # API 路由
│   │   ├── users/
│   │   │   └── route.ts
│   │   ├── posts/
│   │   │   └── route.ts
│   │   └── auth/
│   │       └── route.ts
│   └── utils/                 # 工具函数
│       ├── validators.ts
│       └── helpers.ts
├── drizzle/                   # Drizzle 迁移
│   ├── 0000_create_users.sql
│   ├── 0001_create_posts.sql
│   └── meta/
├── tests/                     # 测试文件
│   ├── integration/
│   └── unit/
├── .env
├── .env.example
├── drizzle.config.ts          # Drizzle 配置
├── package.json
├── tsconfig.json
└── README.md
```

## 核心代码模式

### 1. 数据库连接 (src/lib/db.ts)

```typescript
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './schema';

// WebSocket 配置（用于本地开发）
neonConfig.webSocketConstructor = ws;

// 连接字符串
const connectionString = process.env.DATABASE_URL!;

// HTTP 连接（适用于 Serverless/Edge）
export const sql = neon(connectionString);

// Drizzle ORM 客户端
export const db = drizzle(sql, { schema });

// 连接池（适用于长连接场景）
export const pool = new Pool({ connectionString });
export const dbPool = drizzle(pool, { schema });

// 查询辅助函数
export async function query<T>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  const result = await sql(strings, ...values);
  return result as T[];
}

// 单行查询
export async function queryOne<T>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T | null> {
  const result = await sql(strings, ...values);
  return (result[0] as T) || null;
}

// 事务支持
export async function transaction<T>(
  callback: (tx: Omit<typeof db, 'transaction'>) => Promise<T>
): Promise<T> {
  return await db.transaction(callback);
}
```

### 2. Drizzle Schema (src/lib/schema.ts)

```typescript
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  serial,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 枚举定义
export const statusEnum = pgEnum('status', ['draft', 'published', 'archived']);

// 用户表
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatar: text('avatar'),
  bio: text('bio'),
  isVerified: boolean('is_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  createdAtIdx: index('users_created_at_idx').on(table.createdAt),
}));

// 文章表
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  slug: text('slug').notNull().unique(),
  status: statusEnum('status').default('draft').notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  publishedAt: timestamp('published_at'),
  authorId: integer('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('posts_slug_idx').on(table.slug),
  statusIdx: index('posts_status_idx').on(table.status),
  authorIdx: index('posts_author_idx').on(table.authorId),
  publishedIdx: index('posts_published_idx').on(table.status, table.publishedAt),
}));

// 评论表
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  postIdx: index('comments_post_idx').on(table.postId),
  authorIdx: index('comments_author_idx').on(table.authorId),
}));

// 标签表
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: uniqueIndex('tags_name_idx').on(table.name),
  slugIdx: uniqueIndex('tags_slug_idx').on(table.slug),
}));

// 文章标签关联表
export const postsToTags = pgTable('posts_to_tags', {
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.tagId] }),
}));

// 关系定义
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  tags: many(postsToTags),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  posts: many(postsToTags),
}));

export const postsToTagsRelations = relations(postsToTags, ({ one }) => ({
  post: one(posts, {
    fields: [postsToTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postsToTags.tagId],
    references: [tags.id],
  }),
}));

// 类型导出
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
```

### 3. Repository 层 (src/repositories/user.repo.ts)

```typescript
import { eq, and, desc, sql as drizzleSql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, type User, type NewUser } from '@/lib/schema';

export class UserRepository {
  // 创建用户
  async create(data: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  // 根据 ID 查找
  async findById(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  // 根据邮箱查找
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  // 获取所有用户（分页）
  async findAll(page = 1, limit = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);
  }

  // 更新用户
  async update(id: number, data: Partial<NewUser>): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || null;
  }

  // 删除用户
  async delete(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // 搜索用户
  async search(query: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        drizzleSql`${users.name} ILIKE ${`%${query}%`} OR ${users.email} ILIKE ${`%${query}%`}`
      );
  }

  // 统计用户数
  async count(): Promise<number> {
    const [result] = await db
      .select({ count: drizzleSql`count(*)::int` })
      .from(users);
    return result?.count || 0;
  }
}

export const userRepository = new UserRepository();
```

### 4. Service 层 (src/services/post.service.ts)

```typescript
import { eq, and, desc, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { posts, users, comments, tags, postsToTags, type Post, type NewPost } from '@/lib/schema';

export class PostService {
  // 创建文章
  async create(data: NewPost, tagIds?: number[]): Promise<Post> {
    return await db.transaction(async (tx) => {
      // 创建文章
      const [post] = await tx.insert(posts).values(data).returning();

      // 关联标签
      if (tagIds && tagIds.length > 0) {
        await tx.insert(postsToTags).values(
          tagIds.map((tagId) => ({
            postId: post.id,
            tagId,
          }))
        );
      }

      return post;
    });
  }

  // 获取文章详情（含关联数据）
  async findById(id: number) {
    const result = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: {
        author: true,
        comments: {
          with: {
            author: true,
          },
          orderBy: (comments, { desc }) => [desc(comments.createdAt)],
        },
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    if (!result) return null;

    return {
      ...result,
      tags: result.tags.map((t) => t.tag),
    };
  }

  // 获取已发布的文章列表
  async getPublished(page = 1, limit = 10) {
    return await db.query.posts.findMany({
      where: eq(posts.status, 'published'),
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        tags: {
          with: {
            tag: true,
          },
        },
      },
      orderBy: (posts, { desc }) => [desc(posts.publishedAt)],
      limit,
      offset: (page - 1) * limit,
    });
  }

  // 更新文章
  async update(id: number, data: Partial<NewPost>): Promise<Post | null> {
    const [post] = await db
      .update(posts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return post || null;
  }

  // 发布文章
  async publish(id: number): Promise<Post | null> {
    return await this.update(id, {
      status: 'published',
      publishedAt: new Date(),
    });
  }

  // 增加浏览数
  async incrementViewCount(id: number): Promise<void> {
    await db
      .update(posts)
      .set({
        viewCount: sql`${posts.viewCount} + 1`,
      })
      .where(eq(posts.id, id));
  }

  // 删除文章
  async delete(id: number): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id)).returning();
    return result.length > 0;
  }
}

export const postService = new PostService();
```

### 5. API 路由 (src/api/posts/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { postService } from '@/services/post.service';
import { z } from 'zod';

// 验证 schema
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  authorId: z.number(),
  tagIds: z.array(z.number()).optional(),
});

// GET /api/posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const posts = await postService.getPublished(page, limit);

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('获取文章失败:', error);
    return NextResponse.json(
      { success: false, error: '获取文章失败' },
      { status: 500 }
    );
  }
}

// POST /api/posts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createPostSchema.parse(body);

    const post = await postService.create(
      {
        title: validated.title,
        content: validated.content,
        excerpt: validated.excerpt,
        authorId: validated.authorId,
        slug: validated.title.toLowerCase().replace(/\s+/g, '-'),
      },
      validated.tagIds
    );

    return NextResponse.json(
      { success: true, data: post },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }
    console.error('创建文章失败:', error);
    return NextResponse.json(
      { success: false, error: '创建文章失败' },
      { status: 500 }
    );
  }
}
```

### 6. Edge Runtime 支持 (src/api/edge/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Edge Runtime 配置
export const runtime = 'edge';

// GET /api/edge/stats
export async function GET(request: NextRequest) {
  // Neon 原生支持 Edge Runtime
  const stats = await sql`
    SELECT
      (SELECT count(*) FROM users) as user_count,
      (SELECT count(*) FROM posts WHERE status = 'published') as post_count,
      (SELECT count(*) FROM comments) as comment_count
  `;

  return NextResponse.json({
    success: true,
    data: stats[0],
    timestamp: new Date().toISOString(),
    runtime: 'edge',
  });
}
```

### 7. 数据库分支管理 (scripts/branch.ts)

```typescript
import { NeonApiClient } from '@neondatabase/api-client';

const client = new NeonApiClient({
  apiKey: process.env.NEON_API_KEY!,
});

// 创建开发分支
async function createDevBranch(projectId: string, branchName: string) {
  const branch = await client.createBranch({
    projectId,
    branch: {
      name: branchName,
    },
  });

  console.log(`分支创建成功: ${branch.branch.name}`);
  console.log(`连接字符串: ${branch.connection_uri}`);
  
  return branch;
}

// 合并分支
async function mergeBranch(
  projectId: string,
  sourceBranchId: string,
  targetBranchId: string
) {
  const result = await client.mergeBranch({
    projectId,
    branchId: sourceBranchId,
    mergeBranch: {
      sourceBranchId,
      targetBranchId,
    },
  });

  console.log('分支合并成功');
  return result;
}

// 重置分支（即时回滚）
async function resetBranch(projectId: string, branchId: string) {
  const result = await client.resetBranch({
    projectId,
    branchId,
  });

  console.log('分支已重置到初始状态');
  return result;
}
```

### 8. Drizzle 配置 (drizzle.config.ts)

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

### 9. 迁移脚本 (package.json)

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/lib/seed.ts",
    "db:branch:create": "tsx scripts/branch.ts create",
    "db:branch:merge": "tsx scripts/branch.ts merge"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.9.0",
    "drizzle-orm": "^0.33.0",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.24.0",
    "tsx": "^4.19.0"
  }
}
```

### 10. 环境变量 (.env.example)

```env
# Neon 数据库连接
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# 直接连接（用于迁移）
DIRECT_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Neon API（用于分支管理）
NEON_API_KEY=nkey_xxx

# 环境标识
NODE_ENV=development
```

## Neon 特色功能

### 1. 数据库分支
```bash
# 创建分支
neon branch create feature-auth --project my-project

# 切换分支
neon branch switch feature-auth

# 合并分支
neon branch merge feature-auth --into main
```

### 2. 即时克隆
```typescript
// 克隆生产数据到开发环境
const clone = await client.createBranch({
  projectId: 'my-project',
  branch: {
    name: 'dev-from-prod',
    parentId: 'br-prod-xxx', // 从生产分支创建
  },
});
```

### 3. 自动暂停
- 免费项目自动暂停（5分钟无活动）
- 访问时自动唤醒
- 节省资源和成本

### 4. 底层存储
- 写入时复制（Copy-on-Write）
- 分支间共享数据页
- 即时分支创建

## 最佳实践

1. **连接管理**
   - 使用 HTTP 连接用于 Serverless
   - 使用连接池用于长期运行服务
   - Edge Runtime 使用 WebSocket

2. **分支策略**
   - main: 生产环境
   - preview/*: PR 预览
   - dev/*: 开发环境

3. **迁移管理**
   - 使用 Drizzle Kit 管理迁移
   - 分支上测试迁移
   - 合并前检查兼容性

4. **性能优化**
   - 创建必要的索引
   - 使用查询分析工具
   - 监控慢查询

5. **安全配置**
   - 使用 SSL 连接
   - 定期轮换密码
   - 使用 IAM 认证（如支持）

## 常用命令

```bash
# 安装依赖
npm install @neondatabase/serverless drizzle-orm

# 安装 CLI
npm install -g neonctl

# 登录
neon auth

# 创建项目
neon project create my-project

# 查看连接字符串
neon connection-string

# 创建分支
neon branch create feature-xxx

# 查看所有分支
neon branch list
```

## 参考资源

- [Neon 官方文档](https://neon.tech/docs)
- [Drizzle ORM 文档](https://orm.drizzle.team)
- [Neon JavaScript SDK](https://github.com/neondatabase/serverless)
- [Neon API 参考](https://neon.tech/api-reference)
