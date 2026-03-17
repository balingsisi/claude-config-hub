# Drizzle ORM 开发模板

## 技术栈

- **ORM**: Drizzle ORM 0.30+
- **数据库**: PostgreSQL / MySQL / SQLite / Turso
- **运行时**: Node.js / Bun / Deno
- **验证**: Zod (集成 Drizzle)
- **迁移**: Drizzle Kit
- **驱动**: postgres-js / pg / better-sqlite3 / libsql

## 项目结构

```
drizzle-project/
├── src/
│   ├── db/
│   │   ├── schema/
│   │   │   ├── users.ts
│   │   │   ├── posts.ts
│   │   │   ├── comments.ts
│   │   │   └── index.ts
│   │   ├── migrations/
│   │   │   ├── 0000_add_users.sql
│   │   │   └── meta/
│   │   ├── index.ts           # 数据库连接
│   │   └── seed.ts            # 种子数据
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   └── post.repository.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── post.service.ts
│   └── index.ts
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### 数据库配置

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

export const db = drizzle(pool, { schema });

// Bun + postgres-js
// import { drizzle } from 'drizzle-orm/postgres-js';
// import postgres from 'postgres';
// const client = postgres(process.env.DATABASE_URL!);
// export const db = drizzle(client, { schema });

// SQLite
// import { drizzle } from 'drizzle-orm/better-sqlite3';
// import Database from 'better-sqlite3';
// const sqlite = Database('sqlite.db');
// export const db = drizzle(sqlite, { schema });

// Turso
// import { drizzle } from 'drizzle-orm/libsql';
// import { createClient } from '@libsql/client';
// const client = createClient({ url: process.env.TURSO_URL!, authToken: process.env.TURSO_TOKEN });
// export const db = drizzle(client, { schema });
```

### Schema 定义

```typescript
// src/db/schema/users.ts
import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  role: text('role', { enum: ['user', 'admin'] }).default('user').notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  followerCount: integer('follower_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email.email(),
  username: (schema) => schema.username.min(3).max(30),
}).omit({ passwordHash: true, createdAt: true, updatedAt: true });

export const selectUserSchema = createSelectSchema(users).omit({
  passwordHash: true,
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// src/db/schema/posts.ts
import { pgTable, uuid, text, timestamp, integer, boolean, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content'),
  excerpt: text('excerpt'),
  coverImage: text('cover_image'),
  status: text('status', { enum: ['draft', 'published', 'archived'] }).default('draft').notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  likeCount: integer('like_count').default(0).notNull(),
  commentCount: integer('comment_count').default(0).notNull(),
  tags: json('tags').$type<string[]>().default([]),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  comments: many(comments),
}));

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

// src/db/schema/comments.ts
import { pgTable, uuid, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { posts } from './posts';

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'),
  content: text('content').notNull(),
  likeCount: integer('like_count').default(0).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'replies',
  }),
  replies: many(comments, { relationName: 'replies' }),
}));

// src/db/schema/index.ts
export * from './users';
export * from './posts';
export * from './comments';
```

### 查询操作

```typescript
// src/repositories/user.repository.ts
import { eq, and, or, desc, asc, like, ilike, sql, count } from 'drizzle-orm';
import { db } from '@/db';
import { users, posts, User, NewUser } from '@/db/schema';

export class UserRepository {
  // 创建
  async create(data: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  // 批量创建
  async createMany(data: NewUser[]): Promise<User[]> {
    return await db.insert(users).values(data).returning();
  }

  // 根据 ID 查询
  async findById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // 根据邮箱查询
  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // 分页查询
  async findMany(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) {
    const { page = 1, limit = 10, search, role } = options;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(users.username, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      );
    }
    if (role) {
      conditions.push(eq(users.role, role));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
      db
        .select()
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(users)
        .where(whereClause),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // 更新
  async update(id: string, data: Partial<NewUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // 删除
  async delete(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // 统计
  async countByRole() {
    return await db
      .select({
        role: users.role,
        count: count(),
      })
      .from(users)
      .groupBy(users.role);
  }
}
```

### 关联查询

```typescript
// src/repositories/post.repository.ts
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '@/db';
import { posts, users, comments, Post, NewPost } from '@/db/schema';

export class PostRepository {
  // 查询文章及作者
  async findByIdWithAuthor(id: string) {
    const [result] = await db
      .select()
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, id));

    return {
      post: result.posts,
      author: result.users,
    };
  }

  // 使用关系查询 (更简洁)
  async findByIdWithAuthorRelations(id: string) {
    const [result] = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: {
        author: {
          columns: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    return result;
  }

  // 查询文章及评论和回复
  async findByIdWithComments(postId: string) {
    const result = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      with: {
        author: {
          columns: { id: true, username: true, avatarUrl: true },
        },
        comments: {
          where: (comments, { isNull }) => isNull(comments.parentId),
          with: {
            author: {
              columns: { id: true, username: true, avatarUrl: true },
            },
            replies: {
              with: {
                author: {
                  columns: { id: true, username: true, avatarUrl: true },
                },
              },
            },
          },
          orderBy: (comments, { desc }) => [desc(comments.createdAt)],
        },
      },
    });

    return result;
  }

  // 分页查询已发布文章
  async findPublished(options: { page?: number; limit?: number; tag?: string }) {
    const { page = 1, limit = 10, tag } = options;
    const offset = (page - 1) * limit;

    const conditions = [eq(posts.status, 'published')];
    if (tag) {
      conditions.push(sql`${posts.tags} @> ${JSON.stringify([tag])}`);
    }

    return await db.query.posts.findMany({
      where: and(...conditions),
      with: {
        author: {
          columns: { id: true, username: true, avatarUrl: true },
        },
      },
      orderBy: (posts, { desc }) => [desc(posts.publishedAt)],
      limit,
      offset,
    });
  }
}
```

### 事务处理

```typescript
// src/services/post.service.ts
import { db } from '@/db';
import { posts, comments, notifications } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export class PostService {
  // 创建文章并发送通知
  async createPostWithNotification(
    userId: string,
    data: NewPost,
    followerIds: string[]
  ) {
    return await db.transaction(async (tx) => {
      // 创建文章
      const [post] = await tx
        .insert(posts)
        .values({ ...data, userId })
        .returning();

      // 创建通知
      if (followerIds.length > 0) {
        await tx.insert(notifications).values(
          followerIds.map((followerId) => ({
            userId: followerId,
            type: 'new_post',
            title: '新文章发布',
            data: { postId: post.id },
          }))
        );
      }

      return post;
    });
  }

  // 点赞文章 (使用事务和原子更新)
  async likePost(postId: string, userId: string) {
    return await db.transaction(async (tx) => {
      // 检查是否已点赞
      const [existing] = await tx
        .select()
        .from(postLikes)
        .where(
          and(eq(postLikes.postId, postId), eq(postLikes.userId, userId))
        );

      if (existing) {
        throw new Error('Already liked');
      }

      // 添加点赞记录
      await tx.insert(postLikes).values({ postId, userId });

      // 更新点赞计数
      const [post] = await tx
        .update(posts)
        .set({
          likeCount: sql`${posts.likeCount} + 1`,
        })
        .where(eq(posts.id, postId))
        .returning();

      return post;
    });
  }

  // 批量操作
  async archiveOldPosts(beforeDate: Date) {
    return await db.transaction(async (tx) => {
      const result = await tx
        .update(posts)
        .set({ status: 'archived' })
        .where(
          and(
            eq(posts.status, 'published'),
            sql`${posts.publishedAt} < ${beforeDate}`
          )
        )
        .returning({ id: posts.id });

      // 记录日志
      await tx.insert(auditLogs).values({
        action: 'archive_posts',
        count: result.length,
      });

      return result;
    });
  }
}
```

### 原始 SQL

```typescript
// 复杂查询使用原始 SQL
import { sql } from 'drizzle-orm';

// 全文搜索
async function searchPosts(query: string) {
  return await db.execute(sql`
    SELECT p.*, u.username
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.status = 'published'
    AND to_tsvector('english', p.title || ' ' || COALESCE(p.content, '')) 
        @@ plainto_tsquery('english', ${query})
    ORDER BY ts_rank(
      to_tsvector('english', p.title || ' ' || COALESCE(p.content, '')),
      plainto_tsquery('english', ${query})
    ) DESC
    LIMIT 20
  `);
}

// 批量更新
async function incrementViewCounts(postIds: string[]) {
  await db.execute(sql`
    UPDATE posts
    SET view_count = view_count + 1
    WHERE id = ANY(${postIds}::uuid[])
  `);
}
```

## 最佳实践

### 1. 迁移管理

```bash
# 生成迁移文件
npx drizzle-kit generate

# 应用迁移
npx drizzle-kit push

# 查看 SQL (不执行)
npx drizzle-kit generate --name=add_tags_table --dry-run

# 从数据库反向生成 schema
npx drizzle-kit introspect

# 验证迁移
npx drizzle-kit check
```

```typescript
// 程序化迁移
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './db';

await migrate(db, { migrationsFolder: './src/db/migrations' });
```

### 2. 类型安全

```typescript
// 使用 $inferSelect 和 $inferInsert 自动推断类型
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// 部分选择
export type UserPublic = Pick<User, 'id' | 'username' | 'avatarUrl'>;

// 使用 Zod 验证
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

const insertUserSchema = createInsertSchema(users, {
  email: (s) => s.email.email('Invalid email'),
  username: (s) => s.username.min(3).max(30),
}).omit({ passwordHash: true });

const validatedData = insertUserSchema.parse(input);
```

### 3. 性能优化

```typescript
// 只选择需要的列
const users = await db
  .select({ id: users.id, username: users.username })
  .from(users);

// 使用索引
// SQL: CREATE INDEX idx_posts_status_published ON posts(status, published_at DESC) WHERE status = 'published';

// 批量插入
await db.insert(posts).values(postsArray).returning();

// 流式处理大量数据
const stream = await db.select().from(posts).stream();
for await (const row of stream) {
  await processRow(row);
}

// 使用 cursor 分页代替 offset
async function getPostsCursor(cursor?: string, limit = 10) {
  const query = db
    .select()
    .from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(limit + 1);

  if (cursor) {
    query.where(sql`${posts.id} < ${cursor}::uuid`);
  }

  const results = await query;
  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, -1) : results;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, nextCursor, hasMore };
}
```

### 4. 错误处理

```typescript
import { DrizzleError } from 'drizzle-orm';

try {
  await db.insert(users).values({ email: 'existing@email.com', ... });
} catch (error) {
  if (error instanceof DrizzleError) {
    if (error.message.includes('unique constraint')) {
      throw new ConflictError('Email already exists');
    }
  }
  throw error;
}

// 自定义错误类
class DatabaseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
  }
}
```

### 5. 测试

```typescript
// tests/repositories/user.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { users } from '@/db/schema';
import { UserRepository } from '@/repositories/user.repository';

describe('UserRepository', () => {
  const userRepo = new UserRepository();

  beforeEach(async () => {
    // 清理测试数据
    await db.delete(users);
  });

  it('should create user', async () => {
    const user = await userRepo.create({
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: 'hash',
    });

    expect(user.email).toBe('test@example.com');
    expect(user.id).toBeDefined();
  });

  it('should find user by email', async () => {
    await userRepo.create({
      email: 'find@example.com',
      username: 'finduser',
      passwordHash: 'hash',
    });

    const user = await userRepo.findByEmail('find@example.com');
    expect(user?.username).toBe('finduser');
  });
});
```

## 常用命令

```bash
# 安装
npm install drizzle-orm
npm install -D drizzle-kit

# 驱动安装 (选择一个)
npm install pg              # PostgreSQL (pg)
npm install postgres        # PostgreSQL (postgres-js)
npm install better-sqlite3  # SQLite
npm install @libsql/client  # Turso/LibSQL

# 生成迁移
npx drizzle-kit generate

# 应用迁移
npx drizzle-kit push

# 打开 Studio (GUI)
npx drizzle-kit studio

# 从数据库拉取 schema
npx drizzle-kit introspect

# 验证迁移
npx drizzle-kit check

# 生成 Zod schemas
npm install drizzle-zod
```

## 部署配置

### drizzle.config.ts

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/*.ts',
  out: './src/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

### 环境变量

```bash
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# 生产环境
DATABASE_URL=postgresql://user:password@prod-db:5432/mydb?sslmode=require
```

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    environment:
      DATABASE_URL: postgresql://user:password@postgres:5432/mydb
    depends_on:
      - postgres
    command: sh -c "npx drizzle-kit push && npm start"

volumes:
  postgres_data:
```

### CI/CD (GitHub Actions)

```yaml
name: CI

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate migrations
        run: npx drizzle-kit generate
      
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy migrations
        run: npx drizzle-kit push
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
```

## 常见问题

1. **迁移冲突** → 使用 `drizzle-kit check` 验证，手动解决冲突
2. **N+1 查询问题** → 使用 `with` 关系查询，避免循环中查询
3. **类型推断失败** → 确保使用 `$inferSelect` 和 `$inferInsert`
4. **事务超时** → 设置合适的 `statement_timeout`
5. **连接池耗尽** → 调整 `max` 连接数，确保正确释放连接

## 扩展资源

- [Drizzle ORM 官方文档](https://orm.drizzle.team/docs/overview)
- [Drizzle Kit CLI](https://orm.drizzle.team/kit-docs/overview)
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)
- [Drizzle Zod](https://orm.drizzle.team/docs/zod)
- [示例项目](https://github.com/drizzle-team/drizzle-orm/tree/main/examples)
