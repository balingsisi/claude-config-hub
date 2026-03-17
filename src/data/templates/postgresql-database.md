# PostgreSQL 数据库模板

## 技术栈

- **数据库**: PostgreSQL 16.x
- **ORM**: Prisma / TypeORM / Drizzle / Sequelize
- **查询构建器**: Kysely / Slonik / pg
- **迁移工具**: Prisma Migrate / Flyway / db-migrate
- **连接池**: pg-pool / PgBouncer
- **监控**: pgAdmin / Grafana / Prometheus
- **备份**: pg_dump / WAL-E / Barman
- **扩展**: PostGIS / pg_stat_statements / pg_hint_plan

## 项目结构

```
postgresql-project/
├── src/
│   ├── db/
│   │   ├── client.ts            # 数据库客户端
│   │   ├── pool.ts              # 连接池配置
│   │   ├── migrations/          # 迁移文件
│   │   │   ├── 001_init.up.sql
│   │   │   └── 001_init.down.sql
│   │   ├── seeds/               # 种子数据
│   │   │   └── users.seed.ts
│   │   └── types/               # 类型定义
│   │       └── database.ts
│   ├── models/                  # 数据模型
│   │   ├── User.ts
│   │   ├── Post.ts
│   │   └── index.ts
│   ├── repositories/            # 数据仓库
│   │   ├── UserRepository.ts
│   │   ├── PostRepository.ts
│   │   └── BaseRepository.ts
│   ├── services/                # 业务逻辑
│   │   └── UserService.ts
│   └── utils/
│       └── pagination.ts
├── prisma/
│   ├── schema.prisma            # Prisma schema
│   └── migrations/              # Prisma 迁移
├── scripts/
│   ├── backup.sh                # 备份脚本
│   ├── restore.sh               # 恢复脚本
│   └── analyze.sql              # 分析脚本
├── docker-compose.yml
├── .env.example
└── package.json
```

## 代码模式

### 数据库连接

```typescript
// src/db/client.ts
import { Pool, PoolClient, QueryResult } from 'pg';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;              // 最大连接数
  min?: number;              // 最小连接数
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

const defaultConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mydb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

class DatabaseClient {
  private pool: Pool;
  private static instance: DatabaseClient;

  private constructor(config: Partial<DatabaseConfig> = {}) {
    const finalConfig = { ...defaultConfig, ...config };
    
    this.pool = new Pool({
      ...finalConfig,
      // SSL 配置（生产环境）
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    });

    this.setupEventHandlers();
  }

  static getInstance(config?: Partial<DatabaseConfig>): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient(config);
    }
    return DatabaseClient.instance;
  }

  private setupEventHandlers() {
    this.pool.on('connect', (client) => {
      console.log('New client connected to PostgreSQL');
    });

    this.pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client:', err);
    });

    this.pool.on('remove', (client) => {
      console.log('Client removed from pool');
    });
  }

  /**
   * 执行查询
   */
  async query<T = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    const result = await this.pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    console.log('Executed query', {
      text: text.substring(0, 100),
      duration,
      rows: result.rowCount,
    });

    return result;
  }

  /**
   * 获取连接客户端
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * 事务
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * 关闭连接池
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * 获取连接池统计
   */
  getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }
}

export const db = DatabaseClient.getInstance();

// src/db/pool.ts - 高级连接池配置
import { Pool } from 'pg';

export function createOptimizedPool(config: DatabaseConfig): Pool {
  return new Pool({
    ...config,
    
    // 连接池大小
    max: 20,
    min: 2,
    
    // 超时设置
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    
    // 语句超时
    statement_timeout: 30000,
    query_timeout: 30000,
    
    // 应用名称（用于监控）
    application_name: 'myapp',
    
    // Keep-alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    
    // SSL
    ssl: process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false,
          ca: process.env.DB_SSL_CA,
          cert: process.env.DB_SSL_CERT,
          key: process.env.DB_SSL_KEY,
        }
      : false,
  });
}
```

### Prisma 配置

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}

// 用户模型
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String    @unique @db.VarChar(50)
  password      String    @db.VarChar(255)
  name          String?   @db.VarChar(100)
  avatar        String?   @db.Text
  bio           String?   @db.Text
  role          Role      @default(USER)
  status        Status    @default(ACTIVE)
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?

  // 关系
  posts         Post[]
  comments      Comment[]
  likes         Like[]
  followers     Follow[]   @relation("UserFollowers")
  following     Follow[]   @relation("UserFollowing")
  sessions      Session[]
  notifications Notification[]

  @@index([email])
  @@index([username])
  @@index([createdAt])
  @@map("users")
}

// 文章模型
model Post {
  id          String      @id @default(cuid())
  title       String      @db.VarChar(255)
  slug        String      @unique @db.VarChar(255)
  content     String      @db.Text
  excerpt     String?     @db.VarChar(500)
  coverImage  String?     @db.Text
  status      PostStatus  @default(DRAFT)
  viewCount   Int         @default(0)
  likeCount   Int         @default(0)
  commentCount Int        @default(0)
  publishedAt DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // 关系
  authorId    String
  author      User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  categoryId  String?
  category    Category?   @relation(fields: [categoryId], references: [id])
  tags        Tag[]
  comments    Comment[]
  likes       Like[]

  // 全文搜索索引
  @@index([authorId])
  @@index([categoryId])
  @@index([status, publishedAt])
  @@fulltext([title, content])
  @@map("posts")
}

// 评论模型
model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 关系
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parentId  String?
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")

  @@index([postId])
  @@index([authorId])
  @@map("comments")
}

// 分类模型
model Category {
  id          String   @id @default(cuid())
  name        String   @unique @db.VarChar(50)
  slug        String   @unique @db.VarChar(50)
  description String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  posts       Post[]

  @@map("categories")
}

// 标签模型
model Tag {
  id        String   @id @default(cuid())
  name      String   @unique @db.VarChar(30)
  slug      String   @unique @db.VarChar(30)
  createdAt DateTime @default(now())

  posts     Post[]

  @@map("tags")
}

// 点赞模型
model Like {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@map("likes")
}

// 关注模型
model Follow {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())

  followerId  String
  follower    User     @relation("UserFollowers", fields: [followerId], references: [id], onDelete: Cascade)
  followingId String
  following   User     @relation("UserFollowing", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@map("follows")
}

// 会话模型
model Session {
  id           String   @id @default(cuid())
  token        String   @unique @db.VarChar(255)
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userAgent    String?  @db.Text
  ipAddress    String?  @db.VarChar(45)
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  @@index([token])
  @@index([userId])
  @@map("sessions")
}

// 通知模型
model Notification {
  id          String           @id @default(cuid())
  type        NotificationType
  title       String           @db.VarChar(255)
  content     String           @db.Text
  isRead      Boolean          @default(false)
  createdAt   DateTime         @default(now())

  userId      String
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@map("notifications")
}

// 枚举
enum Role {
  USER
  ADMIN
  MODERATOR
}

enum Status {
  ACTIVE
  INACTIVE
  BANNED
  SUSPENDED
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum NotificationType {
  COMMENT
  LIKE
  FOLLOW
  SYSTEM
}
```

### 数据仓库模式

```typescript
// src/repositories/BaseRepository.ts
import { PoolClient } from 'pg';
import { db } from '../db/client';

export interface FindOptions {
  where?: Record<string, any>;
  orderBy?: string;
  limit?: number;
  offset?: number;
  select?: string[];
}

export abstract class BaseRepository<T> {
  constructor(
    protected tableName: string,
    protected primaryKey: string = 'id'
  ) {}

  /**
   * 查找所有记录
   */
  async findAll(options?: FindOptions): Promise<T[]> {
    let query = `SELECT ${options?.select?.join(', ') || '*'} FROM ${this.tableName}`;
    const params: any[] = [];
    let paramIndex = 1;

    if (options?.where) {
      const conditions = Object.entries(options.where)
        .map(([key, value]) => {
          if (value === null) {
            return `${key} IS NULL`;
          }
          params.push(value);
          return `${key} = $${paramIndex++}`;
        })
        .join(' AND ');
      query += ` WHERE ${conditions}`;
    }

    if (options?.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
    }

    if (options?.limit) {
      params.push(options.limit);
      query += ` LIMIT $${paramIndex++}`;
    }

    if (options?.offset) {
      params.push(options.offset);
      query += ` OFFSET $${paramIndex++}`;
    }

    const result = await db.query<T>(query, params);
    return result.rows;
  }

  /**
   * 根据 ID 查找
   */
  async findById(id: string | number): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1`;
    const result = await db.query<T>(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * 查找单条记录
   */
  async findOne(where: Record<string, any>): Promise<T | null> {
    const conditions = Object.entries(where)
      .map(([key, _], index) => `${key} = $${index + 1}`)
      .join(' AND ');
    
    const query = `SELECT * FROM ${this.tableName} WHERE ${conditions} LIMIT 1`;
    const result = await db.query<T>(query, Object.values(where));
    return result.rows[0] || null;
  }

  /**
   * 创建记录
   */
  async create(data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await db.query<T>(query, values);
    return result.rows[0];
  }

  /**
   * 批量创建
   */
  async createMany(data: Partial<T>[]): Promise<T[]> {
    if (data.length === 0) return [];

    const keys = Object.keys(data[0]);
    const values: any[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    data.forEach(item => {
      const itemPlaceholders = keys.map(key => {
        values.push((item as any)[key]);
        return `$${paramIndex++}`;
      });
      placeholders.push(`(${itemPlaceholders.join(', ')})`);
    });

    const query = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    const result = await db.query<T>(query, values);
    return result.rows;
  }

  /**
   * 更新记录
   */
  async update(id: string | number, data: Partial<T>): Promise<T | null> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    
    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE ${this.primaryKey} = $${keys.length + 1}
      RETURNING *
    `;
    
    const result = await db.query<T>(query, [...values, id]);
    return result.rows[0] || null;
  }

  /**
   * 删除记录
   */
  async delete(id: string | number): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = $1`;
    const result = await db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 批量删除
   */
  async deleteMany(where: Record<string, any>): Promise<number> {
    const conditions = Object.entries(where)
      .map(([key, _], index) => `${key} = $${index + 1}`)
      .join(' AND ');
    
    const query = `DELETE FROM ${this.tableName} WHERE ${conditions}`;
    const result = await db.query(query, Object.values(where));
    return result.rowCount ?? 0;
  }

  /**
   * 计数
   */
  async count(where?: Record<string, any>): Promise<number> {
    let query = `SELECT COUNT(*) FROM ${this.tableName}`;
    const params: any[] = [];

    if (where) {
      const conditions = Object.entries(where)
        .map(([key, value], index) => {
          params.push(value);
          return `${key} = $${index + 1}`;
        })
        .join(' AND ');
      query += ` WHERE ${conditions}`;
    }

    const result = await db.query<{ count: string }>(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * 检查是否存在
   */
  async exists(where: Record<string, any>): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * 分页
   */
  async paginate(
    page: number = 1,
    pageSize: number = 20,
    options?: Omit<FindOptions, 'limit' | 'offset'>
  ): Promise<{ data: T[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const offset = (page - 1) * pageSize;
    
    const [data, total] = await Promise.all([
      this.findAll({ ...options, limit: pageSize, offset }),
      this.count(options?.where),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };
  }
}

// src/repositories/UserRepository.ts
import { BaseRepository } from './BaseRepository';
import { User } from '../models/User';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  /**
   * 根据邮箱查找
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  /**
   * 根据用户名查找
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.findOne({ username });
  }

  /**
   * 搜索用户
   */
  async search(query: string, limit: number = 10): Promise<User[]> {
    const sql = `
      SELECT * FROM users
      WHERE 
        username ILIKE $1 OR
        name ILIKE $1 OR
        email ILIKE $1
      ORDER BY 
        CASE 
          WHEN username ILIKE $2 THEN 0
          WHEN name ILIKE $2 THEN 1
          ELSE 2
        END
      LIMIT $3
    `;
    
    const result = await this.query<User>(sql, [`%${query}%`, query, limit]);
    return result.rows;
  }

  /**
   * 更新最后登录时间
   */
  async updateLastLogin(userId: string): Promise<void> {
    const sql = `
      UPDATE users
      SET last_login_at = NOW()
      WHERE id = $1
    `;
    
    await this.query(sql, [userId]);
  }

  /**
   * 获取用户统计
   */
  async getUserStats(userId: string): Promise<{
    postsCount: number;
    followersCount: number;
    followingCount: number;
  }> {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM posts WHERE author_id = $1) as posts_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = $1) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = $1) as following_count
    `;
    
    const result = await this.query<{
      posts_count: string;
      followers_count: string;
      following_count: string;
    }>(sql, [userId]);

    return {
      postsCount: parseInt(result.rows[0].posts_count),
      followersCount: parseInt(result.rows[0].followers_count),
      followingCount: parseInt(result.rows[0].following_count),
    };
  }
}

export const userRepository = new UserRepository();

// src/repositories/PostRepository.ts
import { BaseRepository } from './BaseRepository';
import { Post } from '../models/Post';

export interface PostFilter {
  status?: string;
  authorId?: string;
  categoryId?: string;
  tagId?: string;
  search?: string;
}

export class PostRepository extends BaseRepository<Post> {
  constructor() {
    super('posts');
  }

  /**
   * 获取文章详情（包含作者和分类）
   */
  async findByIdWithDetails(id: string): Promise<any | null> {
    const sql = `
      SELECT 
        p.*,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'name', u.name,
          'avatar', u.avatar
        ) as author,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug
        ) as category,
        (
          SELECT json_agg(json_build_object(
            'id', t.id,
            'name', t.name,
            'slug', t.slug
          ))
          FROM tags t
          INNER JOIN post_tags pt ON t.id = pt.tag_id
          WHERE pt.post_id = p.id
        ) as tags
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `;
    
    const result = await this.query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * 获取文章列表（带过滤和分页）
   */
  async findAllWithFilters(
    filter: PostFilter = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ data: any[]; total: number }> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filter.status) {
      conditions.push(`p.status = $${paramIndex++}`);
      params.push(filter.status);
    }

    if (filter.authorId) {
      conditions.push(`p.author_id = $${paramIndex++}`);
      params.push(filter.authorId);
    }

    if (filter.categoryId) {
      conditions.push(`p.category_id = $${paramIndex++}`);
      params.push(filter.categoryId);
    }

    if (filter.tagId) {
      conditions.push(`EXISTS (
        SELECT 1 FROM post_tags pt
        WHERE pt.post_id = p.id AND pt.tag_id = $${paramIndex++}
      )`);
      params.push(filter.tagId);
    }

    if (filter.search) {
      conditions.push(`(
        p.title ILIKE $${paramIndex} OR
        p.content ILIKE $${paramIndex}
      )`);
      params.push(`%${filter.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // 查询总数
    const countSql = `SELECT COUNT(*) FROM posts p ${whereClause}`;
    const countResult = await this.query<{ count: string }>(
      countSql,
      params.slice(0, paramIndex - 1)
    );
    const total = parseInt(countResult.rows[0].count);

    // 查询数据
    const offset = (page - 1) * pageSize;
    const dataSql = `
      SELECT 
        p.*,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'name', u.name
        ) as author,
        json_build_object(
          'id', c.id,
          'name', c.name
        ) as category
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    params.push(pageSize, offset);
    const dataResult = await this.query(dataSql, params);

    return {
      data: dataResult.rows,
      total,
    };
  }

  /**
   * 增加浏览量
   */
  async incrementViewCount(id: string): Promise<void> {
    const sql = `
      UPDATE posts
      SET view_count = view_count + 1
      WHERE id = $1
    `;
    
    await this.query(sql, [id]);
  }

  /**
   * 增加点赞数
   */
  async incrementLikeCount(id: string): Promise<void> {
    const sql = `
      UPDATE posts
      SET like_count = like_count + 1
      WHERE id = $1
    `;
    
    await this.query(sql, [id]);
  }

  /**
   * 获取热门文章
   */
  async getPopular(limit: number = 10): Promise<Post[]> {
    const sql = `
      SELECT * FROM posts
      WHERE status = 'PUBLISHED'
      ORDER BY view_count DESC, like_count DESC
      LIMIT $1
    `;
    
    const result = await this.query<Post>(sql, [limit]);
    return result.rows;
  }

  /**
   * 获取相关文章
   */
  async getRelated(postId: string, limit: number = 5): Promise<Post[]> {
    const sql = `
      SELECT DISTINCT p.*
      FROM posts p
      INNER JOIN post_tags pt1 ON p.id = pt1.post_id
      INNER JOIN post_tags pt2 ON pt1.tag_id = pt2.tag_id
      WHERE pt2.post_id = $1
        AND p.id != $1
        AND p.status = 'PUBLISHED'
      ORDER BY p.view_count DESC
      LIMIT $2
    `;
    
    const result = await this.query<Post>(sql, [postId, limit]);
    return result.rows;
  }
}

export const postRepository = new PostRepository();
```

### 高级查询

```typescript
// src/utils/pagination.ts
export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function paginate<T>(
  query: string,
  countQuery: string,
  params: any[],
  page: number = 1,
  pageSize: number = 20
): Promise<PaginationResult<T>> {
  const offset = (page - 1) * pageSize;
  
  // 获取总数
  const countResult = await db.query<{ count: string }>(
    countQuery,
    params
  );
  const total = parseInt(countResult.rows[0].count);
  
  // 获取数据
  const dataResult = await db.query<T>(
    `${query} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, pageSize, offset]
  );
  
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    data: dataResult.rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// 全文搜索
export async function fullTextSearch(
  table: string,
  columns: string[],
  query: string,
  options?: {
    limit?: number;
    offset?: number;
    orderBy?: 'rank' | 'date';
  }
): Promise<any[]> {
  const searchVector = columns.map(col => `to_tsvector('english', ${col})`).join(' || ');
  const searchQuery = `plainto_tsquery('english', $1)`;
  
  const sql = `
    SELECT *,
      ts_rank(${searchVector}, ${searchQuery}) as rank
    FROM ${table}
    WHERE ${searchVector} @@ ${searchQuery}
    ORDER BY ${
      options?.orderBy === 'date' ? 'created_at DESC' : 'rank DESC'
    }
    LIMIT $2 OFFSET $3
  `;
  
  const result = await db.query(
    sql,
    [query, options?.limit || 20, options?.offset || 0]
  );
  
  return result.rows;
}

// 聚合查询
export async function getAggregates(table: string, groupBy: string) {
  const sql = `
    SELECT 
      ${groupBy},
      COUNT(*) as count,
      AVG(created_at::date - NOW()::date) as avg_age_days
    FROM ${table}
    GROUP BY ${groupBy}
    ORDER BY count DESC
  `;
  
  const result = await db.query(sql);
  return result.rows;
}

// 递归查询（树形结构）
export async function getCommentTree(postId: string, maxDepth: number = 5) {
  const sql = `
    WITH RECURSIVE comment_tree AS (
      -- 基础查询：顶级评论
      SELECT 
        id,
        content,
        author_id,
        post_id,
        parent_id,
        created_at,
        0 as depth,
        ARRAY[id] as path
      FROM comments
      WHERE post_id = $1 AND parent_id IS NULL
      
      UNION ALL
      
      -- 递归查询：子评论
      SELECT 
        c.id,
        c.content,
        c.author_id,
        c.post_id,
        c.parent_id,
        c.created_at,
        ct.depth + 1,
        ct.path || c.id
      FROM comments c
      INNER JOIN comment_tree ct ON c.parent_id = ct.id
      WHERE ct.depth < $2
    )
    SELECT 
      ct.*,
      json_build_object(
        'id', u.id,
        'username', u.username,
        'avatar', u.avatar
      ) as author
    FROM comment_tree ct
    LEFT JOIN users u ON ct.author_id = u.id
    ORDER BY ct.path, ct.created_at
  `;
  
  const result = await db.query(sql, [postId, maxDepth]);
  
  // 构建树形结构
  return buildTree(result.rows);
}

function buildTree(comments: any[]): any[] {
  const map = new Map();
  const roots: any[] = [];

  comments.forEach(comment => {
    map.set(comment.id, { ...comment, replies: [] });
  });

  comments.forEach(comment => {
    if (comment.parent_id) {
      const parent = map.get(comment.parent_id);
      if (parent) {
        parent.replies.push(map.get(comment.id));
      }
    } else {
      roots.push(map.get(comment.id));
    }
  });

  return roots;
}
```

### 迁移文件

```sql
-- src/db/migrations/001_init.up.sql
-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- 用于模糊搜索

-- 创建枚举类型
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'MODERATOR');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED', 'SUSPENDED');
CREATE TYPE post_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE notification_type AS ENUM ('COMMENT', 'LIKE', 'FOLLOW', 'SYSTEM');

-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  avatar TEXT,
  bio TEXT,
  role user_role NOT NULL DEFAULT 'USER',
  status user_status NOT NULL DEFAULT 'ACTIVE',
  email_verified TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 文章表
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt VARCHAR(500),
  cover_image TEXT,
  status post_status NOT NULL DEFAULT 'DRAFT',
  view_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id)
);

CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_status_published_at ON posts(status, published_at);

-- 全文搜索索引
CREATE INDEX idx_posts_search ON posts USING gin(
  to_tsvector('english', title || ' ' || content)
);

-- 分类表
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 标签表
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(30) UNIQUE NOT NULL,
  slug VARCHAR(30) UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 文章标签关联表
CREATE TABLE post_tags (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- 评论表
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);

-- 点赞表
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  UNIQUE(user_id, post_id)
);

-- 关注表
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);

-- 会话表
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_agent TEXT,
  ip_address VARCHAR(45),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- 通知表
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id_is_read ON notifications(user_id, is_read);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- src/db/migrations/001_init.down.sql
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS post_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS post_status CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

## 最佳实践

### 1. 索引优化

```sql
-- 单列索引
CREATE INDEX idx_posts_created_at ON posts(created_at);

-- 复合索引（注意列顺序）
CREATE INDEX idx_posts_status_created_at ON posts(status, created_at DESC);

-- 部分索引（只索引部分数据）
CREATE INDEX idx_posts_published ON posts(created_at DESC)
WHERE status = 'PUBLISHED';

-- 表达式索引
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- 全文搜索索引
CREATE INDEX idx_posts_fulltext ON posts USING gin(
  to_tsvector('english', title || ' ' || content)
);

-- 查看索引使用情况
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 查看未使用的索引
SELECT
  schemaname || '.' || relname AS table,
  indexrelname AS index,
  pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
  idx_scan as index_scans
FROM pg_stat_user_indexes ui
JOIN pg_index i ON ui.indexrelid = i.indexrelid
WHERE NOT indisunique 
  AND idx_scan < 50 
  AND pg_relation_size(relid) > 5 * 8192
ORDER BY pg_relation_size(i.indexrelid) DESC;
```

### 2. 查询优化

```sql
-- 使用 EXPLAIN ANALYZE 分析查询
EXPLAIN ANALYZE
SELECT * FROM posts WHERE status = 'PUBLISHED' ORDER BY created_at DESC;

-- 避免 SELECT *
-- ❌ 不好
SELECT * FROM posts;

-- ✅ 好
SELECT id, title, created_at FROM posts;

-- 使用 LIMIT
SELECT * FROM posts LIMIT 20;

-- 避免 N+1 查询
-- ❌ 不好：多次查询
SELECT * FROM posts;
SELECT * FROM users WHERE id = ?;

-- ✅ 好：使用 JOIN
SELECT p.*, u.*
FROM posts p
JOIN users u ON p.author_id = u.id;

-- 批量插入
-- ❌ 不好：多次插入
INSERT INTO posts (title) VALUES ('Post 1');
INSERT INTO posts (title) VALUES ('Post 2');

-- ✅ 好：批量插入
INSERT INTO posts (title) VALUES ('Post 1'), ('Post 2');

-- 使用事务
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

### 3. 连接池最佳实践

```typescript
// 生产环境推荐配置
const poolConfig = {
  // 最大连接数 = ((核心数 * 2) + 有效磁盘数)
  max: 20,
  
  // 最小连接数
  min: 2,
  
  // 空闲连接超时
  idleTimeoutMillis: 30000,
  
  // 连接超时
  connectionTimeoutMillis: 10000,
  
  // 语句超时
  statement_timeout: 30000,
  
  // 使用 PgBouncer 时
  // max: 1, // 每个进程一个连接
};

// 使用连接池监控
setInterval(() => {
  const stats = db.getPoolStats();
  console.log('Pool stats:', stats);
  
  // 告警
  if (stats.waitingCount > 10) {
    console.error('Too many waiting connections!');
  }
}, 60000);
```

### 4. 事务隔离级别

```typescript
// 读未提交（最低）
await client.query('SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED');

// 读已提交（默认）
await client.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');

// 可重复读
await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');

// 可串行化（最高）
await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');

// 使用示例
await db.transaction(async (client) => {
  // 设置隔离级别
  await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
  
  // 执行操作
  await client.query('UPDATE accounts SET balance = balance - 100 WHERE id = $1', [1]);
  await client.query('UPDATE accounts SET balance = balance + 100 WHERE id = $1', [2]);
});
```

## 常用命令

```bash
# 连接数据库
psql -h host -p port -U user -d database

# 备份数据库
pg_dump -h host -U user -d database > backup.sql
pg_dump -h host -U user -d database -F c -f backup.dump  # 压缩格式

# 恢复数据库
psql -h host -U user -d database < backup.sql
pg_restore -h host -U user -d database backup.dump

# 仅备份结构
pg_dump -h host -U user -d database --schema-only > schema.sql

# 仅备份数据
pg_dump -h host -U user -d database --data-only > data.sql

# 导出查询结果
psql -h host -U user -d database -c "SELECT * FROM users" -o users.csv

# 查看数据库大小
SELECT pg_size_pretty(pg_database_size('mydb'));

# 查看表大小
SELECT pg_size_pretty(pg_total_relation_size('users'));

# 查看连接数
SELECT count(*) FROM pg_stat_activity;

# 终止连接
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'mydb';

# 查看慢查询
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

# 重新分析表
ANALYZE users;

# 重建索引
REINDEX INDEX idx_users_email;

# 清理表
VACUUM ANALYZE users;

# 查看表结构
\d+ users

# 查看索引
\di

# 查看函数
\df
```

## 部署配置

### Docker Compose

```yaml
# docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=your-strong-password
      - POSTGRES_DB=mydb
      - PGDATA=/var/lib/postgresql/data/pgdata
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
    command: >
      postgres
      -c max_connections=200
      -c shared_buffers=256MB
      -c effective_cache_size=1GB
      -c maintenance_work_mem=64MB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100
      -c random_page_cost=1.1
      -c effective_io_concurrency=200
      -c work_mem=2621kB
      -c min_wal_size=1GB
      -c max_wal_size=4GB
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pgadmin
    restart: unless-stopped
    ports:
      - "5050:80"
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@example.com
      - PGADMIN_DEFAULT_PASSWORD=admin
      - PGADMIN_LISTEN_PORT=80
    volumes:
      - pgadmin-data:/var/lib/pgadmin
    depends_on:
      - postgres

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres-exporter
    restart: unless-stopped
    ports:
      - "9187:9187")
    environment:
      - DATA_SOURCE_NAME=postgresql://postgres:your-strong-password@postgres:5432/mydb?sslmode=disable
    depends_on:
      - postgres

volumes:
  postgres-data:
  pgadmin-data:
```

### PostgreSQL 配置

```conf
# postgresql.conf

# 连接设置
listen_addresses = '*'
port = 5432
max_connections = 200

# 内存设置
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 2621kB

# WAL 设置
wal_buffers = 16MB
checkpoint_completion_target = 0.9
min_wal_size = 1GB
max_wal_size = 4GB

# 查询优化
random_page_cost = 1.1
effective_io_concurrency = 200
default_statistics_target = 100

# 日志设置
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'ddl'
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# 慢查询
log_min_duration_statement = 500

# 并发
max_worker_processes = 4
max_parallel_workers_per_gather = 2
max_parallel_workers = 4
```

## 参考资源

- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [Prisma 文档](https://www.prisma.io/docs/)
- [pg (node-postgres) 文档](https://node-postgres.com/)
- [PostgreSQL 性能优化](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [PostgreSQL 索引](https://www.postgresql.org/docs/current/indexes.html)
- [PostgreSQL 查询优化](https://www.postgresql.org/docs/current/performance-tips.html)
