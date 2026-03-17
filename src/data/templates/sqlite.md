# SQLite 项目模板

## 技术栈

- **数据库**: SQLite 3
- **ORM**: Prisma / Drizzle ORM / better-sqlite3
- **查询构建器**: Kysely / sqlite3
- **迁移工具**: Prisma Migrate / Drizzle Kit
- **开发工具**: DB Browser for SQLite, SQLite Studio
- **运行时**: Node.js / Bun / Deno

## 项目结构

```
sqlite-project/
├── prisma/                  # Prisma ORM
│   ├── schema.prisma       # 数据模型
│   ├── migrations/         # 迁移文件
│   └── seed.ts             # 种子数据
├── src/
│   ├── database/
│   │   ├── client.ts       # 数据库连接
│   │   ├── migrations/     # 手动迁移
│   │   └── seeds/          # 种子数据
│   ├── models/             # 数据模型层
│   │   ├── user.ts
│   │   ├── post.ts
│   │   └── index.ts
│   ├── repositories/       # 数据访问层
│   │   ├── user.repo.ts
│   │   └── post.repo.ts
│   ├── services/           # 业务逻辑层
│   ├── routes/             # API 路由
│   └── utils/
│       ├── migrate.ts      # 迁移工具
│       └── backup.ts       # 备份工具
├── tests/
│   ├── setup.ts            # 测试数据库设置
│   └── integration/
├── data/
│   ├── dev.db              # 开发数据库
│   └── test.db             # 测试数据库
├── migrations/             # SQL 迁移文件
│   ├── 001_init.sql
│   └── 002_add_users.sql
├── package.json
├── tsconfig.json
└── .env
```

## 代码模式

### Prisma + SQLite

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  avatar    String?
  posts     Post[]
  comments  Comment[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

model Post {
  id          Int       @id @default(autoincrement())
  title       String
  content     String?
  published   Boolean   @default(false)
  viewCount   Int       @default(0)
  authorId    Int
  author      User      @relation(fields: [authorId], references: [id])
  comments    Comment[]
  tags        Tag[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([authorId])
  @@index([published])
}

model Comment {
  id        Int      @id @default(autoincrement())
  content   String
  postId    Int
  post      Post     @relation(fields: [postId], references: [id])
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())

  @@index([postId])
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}
```

```typescript
// src/database/client.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

### better-sqlite3 原生用法

```typescript
// src/database/client.ts
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/dev.db');

export const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
});

// 启用外键约束
db.pragma('journal_mode = WAL');  // 写前日志模式，提升并发
db.pragma('foreign_keys = ON');

// 优化配置
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 5000');
db.pragma('temp_store = MEMORY');

export default db;
```

```typescript
// src/models/user.ts
import db from '../database/client';
import type { User, NewUser } from '../types';

export const UserModel = {
  // 查询所有
  findAll(): User[] {
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all() as User[];
  },

  // 根据 ID 查询
  findById(id: number): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  },

  // 根据邮箱查询
  findByEmail(email: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | undefined;
  },

  // 分页查询
  findPaginated(page: number, limit: number): { users: User[]; total: number } {
    const offset = (page - 1) * limit;
    
    const countStmt = db.prepare('SELECT COUNT(*) as total FROM users');
    const { total } = countStmt.get() as { total: number };
    
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?');
    const users = stmt.all(limit, offset) as User[];
    
    return { users, total };
  },

  // 创建
  create(data: NewUser): User {
    const stmt = db.prepare(`
      INSERT INTO users (email, name, avatar)
      VALUES (@email, @name, @avatar)
    `);
    const result = stmt.run(data);
    return this.findById(result.lastInsertRowid as number)!;
  },

  // 批量创建
  createMany(users: NewUser[]): number {
    const stmt = db.prepare(`
      INSERT INTO users (email, name, avatar)
      VALUES (@email, @name, @avatar)
    `);
    
    const insertMany = db.transaction((items: NewUser[]) => {
      for (const item of items) stmt.run(item);
    });
    
    insertMany(users);
    return users.length;
  },

  // 更新
  update(id: number, data: Partial<NewUser>): User | undefined {
    const fields = Object.keys(data)
      .map(key => `${key} = @${key}`)
      .join(', ');
    
    const stmt = db.prepare(`UPDATE users SET ${fields} WHERE id = @id`);
    stmt.run({ ...data, id });
    
    return this.findById(id);
  },

  // 删除
  delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  // 计数
  count(): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    return (stmt.get() as { count: number }).count;
  },

  // 存在检查
  exists(id: number): boolean {
    const stmt = db.prepare('SELECT 1 FROM users WHERE id = ?');
    return !!stmt.get(id);
  },
};
```

### Drizzle ORM 用法

```typescript
// src/database/schema.ts
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatar: text('avatar'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
}));

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content'),
  published: integer('published', { mode: 'boolean' }).default(false),
  viewCount: integer('view_count').default(0),
  authorId: integer('author_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  authorIdx: index('author_idx').on(table.authorId),
}));

export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(),
  postId: integer('post_id').notNull().references(() => posts.id),
  authorId: integer('author_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

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
```

```typescript
// src/database/client.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const sqlite = new Database('data/dev.db');
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

export type DB = typeof db;
```

```typescript
// src/repositories/user.repo.ts
import { eq, and, or, like, desc, sql } from 'drizzle-orm';
import { db } from '../database/client';
import { users, posts } from '../database/schema';
import type { NewUser, User } from '../types';

export const UserRepository = {
  async findAll(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  },

  async findById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  async create(data: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  },

  async update(id: number, data: Partial<NewUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  },

  // 关联查询
  async findWithPosts(id: number) {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        posts: {
          orderBy: desc(posts.createdAt),
          limit: 10,
        },
      },
    });
    return result;
  },

  // 搜索
  async search(query: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(or(like(users.name, `%${query}%`), like(users.email, `%${query}%`)));
  },

  // 统计
  async count(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result.count;
  },
};
```

### 迁移管理

```typescript
// src/utils/migrate.ts
import fs from 'fs';
import path from 'path';
import db from '../database/client';

const migrationsDir = path.join(__dirname, '../../migrations');

export async function runMigrations() {
  // 创建迁移表
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      run_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 获取已执行的迁移
  const executed = db.prepare('SELECT name FROM migrations').all() as { name: string }[];
  const executedNames = new Set(executed.map(m => m.name));

  // 读取迁移文件
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  // 执行未执行的迁移
  for (const file of files) {
    if (executedNames.has(file)) continue;

    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

    try {
      db.exec(sql);
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
      console.log(`✓ Migration ${file} completed`);
    } catch (error) {
      console.error(`✗ Migration ${file} failed:`, error);
      throw error;
    }
  }
}

// 回滚迁移
export async function rollbackMigration(steps = 1) {
  const executed = db.prepare(`
    SELECT name FROM migrations ORDER BY id DESC LIMIT ?
  `).all(steps) as { name: string }[];

  for (const { name } of executed) {
    const rollbackFile = name.replace('.sql', '.rollback.sql');
    const rollbackPath = path.join(migrationsDir, rollbackFile);

    if (fs.existsSync(rollbackPath)) {
      console.log(`Rolling back: ${name}`);
      const sql = fs.readFileSync(rollbackPath, 'utf-8');
      db.exec(sql);
      db.prepare('DELETE FROM migrations WHERE name = ?').run(name);
      console.log(`✓ Rollback ${name} completed`);
    } else {
      console.log(`⚠ No rollback file for ${name}`);
    }
  }
}
```

```sql
-- migrations/001_init.sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  published INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  author_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
```

### 数据库备份

```typescript
// src/utils/backup.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const backupDir = path.join(__dirname, '../../backups');

export async function backupDatabase(dbPath: string): Promise<string> {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}.db`);

  // 使用 SQLite 的备份 API
  execSync(`sqlite3 "${dbPath}" ".backup '${backupPath}'"`);

  console.log(`Backup created: ${backupPath}`);
  return backupPath;
}

// 导出为 SQL
export async function exportToSql(dbPath: string): Promise<string> {
  const sql = execSync(`sqlite3 "${dbPath}" .dump`).toString();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportPath = path.join(backupDir, `export-${timestamp}.sql`);
  
  fs.writeFileSync(exportPath, sql);
  console.log(`SQL export created: ${exportPath}`);
  
  return exportPath;
}

// 从 SQL 导入
export async function importFromSql(dbPath: string, sqlPath: string): Promise<void> {
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  execSync(`sqlite3 "${dbPath}"`, { input: sql });
  console.log(`SQL imported from: ${sqlPath}`);
}

// 压缩数据库
export async function vacuumDatabase(dbPath: string): Promise<void> {
  execSync(`sqlite3 "${dbPath}" "VACUUM;"`);
  console.log(`Database vacuumed: ${dbPath}`);
}

// 清理旧备份
export async function cleanupOldBackups(daysToKeep = 30): Promise<number> {
  const files = fs.readdirSync(backupDir);
  const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
  let deleted = 0;

  for (const file of files) {
    const filePath = path.join(backupDir, file);
    const stat = fs.statSync(filePath);

    if (stat.mtimeMs < cutoff) {
      fs.unlinkSync(filePath);
      deleted++;
    }
  }

  console.log(`Cleaned up ${deleted} old backups`);
  return deleted;
}
```

## 最佳实践

### 连接管理

```typescript
// 单例模式
class DatabaseConnection {
  private static instance: Database.Database | null = null;

  static getInstance(): Database.Database {
    if (!this.instance) {
      this.instance = new Database('data/dev.db', { verbose: console.log });
      this.instance.pragma('journal_mode = WAL');
    }
    return this.instance;
  }

  static close(): void {
    if (this.instance) {
      this.instance.close();
      this.instance = null;
    }
  }
}

// 使用连接池（只读）
const readDb = new Database('data/dev.db', { readonly: true, fileMustExist: true });
const writeDb = new Database('data/dev.db');
```

### 事务处理

```typescript
// 自动事务
const insertUserAndPost = db.transaction((user, post) => {
  const userStmt = db.prepare('INSERT INTO users (email, name) VALUES (?, ?)');
  const info = userStmt.run(user.email, user.name);

  const postStmt = db.prepare('INSERT INTO posts (title, author_id) VALUES (?, ?)');
  postStmt.run(post.title, info.lastInsertRowid);

  return info.lastInsertRowid;
});

// 手动控制
const transferPoints = db.transaction((fromId: number, toId: number, amount: number) => {
  // 检查余额
  const from = db.prepare('SELECT points FROM users WHERE id = ?').get(fromId) as { points: number };
  if (from.points < amount) throw new Error('Insufficient points');

  // 扣减
  db.prepare('UPDATE users SET points = points - ? WHERE id = ?').run(amount, fromId);
  // 增加
  db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(amount, toId);
});

// 保存点
const complexTransaction = db.transaction(() => {
  try {
    db.exec('SAVEPOINT step1');
    // 操作 1
    db.exec('RELEASE SAVEPOINT step1');
  } catch (error) {
    db.exec('ROLLBACK TO SAVEPOINT step1');
  }
});
```

### 性能优化

```sql
-- 索引优化
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_author_date ON posts(author_id, created_at DESC);
CREATE INDEX idx_posts_search ON posts(title COLLATE NOCASE);

-- 部分索引
CREATE INDEX idx_posts_published ON posts(created_at) WHERE published = 1;

-- 表达式索引
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- 分析查询计划
EXPLAIN QUERY PLAN SELECT * FROM posts WHERE author_id = 1;

-- 查看统计信息
ANALYZE;
SELECT * FROM sqlite_stat1;
```

```typescript
// 批量操作优化
const batchInsert = db.transaction((items) => {
  const stmt = db.prepare('INSERT INTO items (name, value) VALUES (@name, @value)');
  for (const item of items) {
    stmt.run(item);
  }
});

// 预编译语句复用
const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
for (let i = 1; i <= 100; i++) {
  stmt.get(i);
}

// 使用 WAL 模式
db.pragma('journal_mode = WAL');
db.pragma('wal_autocheckpoint = 1000');
```

### 数据完整性

```sql
-- 外键约束
PRAGMA foreign_keys = ON;

-- 检查约束
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL CHECK(price > 0),
  stock INTEGER DEFAULT 0 CHECK(stock >= 0)
);

-- 唯一约束
CREATE TABLE emails (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  UNIQUE(user_id, is_primary) WHERE is_primary = 1
);

-- 触发器
CREATE TRIGGER update_timestamp
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER prevent_orphan_posts
BEFORE DELETE ON users
BEGIN
  SELECT RAISE(ABORT, 'Cannot delete user with posts')
  WHERE EXISTS (SELECT 1 FROM posts WHERE author_id = OLD.id);
END;
```

## 常用命令

### SQLite CLI

```bash
# 打开数据库
sqlite3 data/dev.db

# 内置命令
.tables              # 列出所有表
.schema users        # 查看表结构
.indexes             # 列出所有索引
.databases           # 列出数据库
.dump                # 导出 SQL
.read file.sql       # 执行 SQL 文件
.output file.sql     # 输出到文件
.import file.csv tablename  # 导入 CSV

# 格式化输出
.mode column
.headers on
.width 10 20 30

# 查看配置
.show
pragma_list

# 性能分析
.explain on
.timer on
```

### 数据库管理

```bash
# 创建数据库
sqlite3 new.db

# 导出数据库
sqlite3 dev.db .dump > backup.sql

# 导入数据库
sqlite3 new.db < backup.sql

# 压缩数据库
sqlite3 dev.db "VACUUM;"

# 检查完整性
sqlite3 dev.db "PRAGMA integrity_check;"

# 查看数据库信息
sqlite3 dev.db "PRAGMA database_list;"
sqlite3 dev.db "PRAGMA table_info(users);"

# 加密（需要 SEE 扩展）
sqlite3 encrypted.db "ATTACH DATABASE 'plaintext.db' AS plaintext KEY ''; SELECT sqlcipher_export('main'); DETACH DATABASE plaintext;"
```

### Prisma 命令

```bash
# 初始化 Prisma
npx prisma init --datasource-provider sqlite

# 生成客户端
npx prisma generate

# 创建迁移
npx prisma migrate dev --name init

# 应用迁移
npx prisma migrate deploy

# 重置数据库
npx prisma migrate reset

# 打开 Prisma Studio
npx prisma studio

# 种子数据
npx prisma db seed

# 格式化 schema
npx prisma format
```

### Drizzle Kit 命令

```bash
# 生成迁移
npx drizzle-kit generate

# 推送 schema
npx drizzle-kit push

# 打开 Studio
npx drizzle-kit studio

# 检查迁移
npx drizzle-kit check

# 导出数据
npx drizzle-kit export
```

## 部署配置

### 环境配置

```bash
# .env
DATABASE_URL="file:./data/dev.db"
DATABASE_PATH="./data/dev.db"

# 生产环境
NODE_ENV=production
DATABASE_URL="file:./data/prod.db"
```

### Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate

# 确保 data 目录存在
RUN mkdir -p data

VOLUME ["/app/data"]

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - sqlite-data:/app/data
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./data/prod.db

volumes:
  sqlite-data:
```

### PM2 部署

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'sqlite-api',
    script: 'dist/index.js',
    instances: 1,  // SQLite 不支持多进程并发写入
    exec_mode: 'fork',
    env_production: {
      NODE_ENV: 'production',
      DATABASE_URL: 'file:./data/prod.db',
    },
  }],
};
```

### 定时备份

```bash
# crontab -e
# 每天凌晨 3 点备份
0 3 * * * /usr/bin/sqlite3 /app/data/prod.db ".backup '/backups/backup-$(date +\%Y\%m\%d).db'"

# 每周压缩数据库
0 4 * * 0 /usr/bin/sqlite3 /app/data/prod.db "VACUUM;"
```

## 测试策略

```typescript
// tests/setup.ts
import Database from 'better-sqlite3';
import { runMigrations } from '../src/utils/migrate';

let db: Database.Database;

export async function setupTestDatabase() {
  db = new Database(':memory:');  // 内存数据库
  await runMigrations();
  return db;
}

export async function teardownTestDatabase() {
  db.close();
}

// tests/integration/user.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from '../setup';
import { UserRepository } from '../../src/repositories/user.repo';

describe('UserRepository', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  it('should create a user', async () => {
    const user = await UserRepository.create({
      email: 'test@example.com',
      name: 'Test User',
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });

  it('should find user by email', async () => {
    await UserRepository.create({
      email: 'find@example.com',
      name: 'Find User',
    });

    const user = await UserRepository.findByEmail('find@example.com');
    expect(user).toBeDefined();
    expect(user?.name).toBe('Find User');
  });
});
```

## 常见问题

### 1. 并发写入问题

```typescript
// SQLite 只支持单写入者，使用队列或互斥锁
import { Mutex } from 'async-mutex';

const writeMutex = new Mutex();

async function safeWrite(operation: () => Promise<void>) {
  const release = await writeMutex.acquire();
  try {
    await operation();
  } finally {
    release();
  }
}
```

### 2. 数据库锁定

```typescript
// 使用 WAL 模式减少锁定
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');  // 等待 5 秒

// 重试逻辑
async function withRetry<T>(fn: () => T, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return fn();
    } catch (error: any) {
      if (error.code === 'SQLITE_BUSY' && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 3. 大文件处理

```typescript
// 使用流式查询
const stmt = db.prepare('SELECT * FROM large_table');
const iterator = stmt.iterate();

for (const row of iterator) {
  // 逐行处理
  processRow(row);
}

// 批量处理
const batchSize = 1000;
let offset = 0;

while (true) {
  const rows = db.prepare('SELECT * FROM large_table LIMIT ? OFFSET ?')
    .all(batchSize, offset);
  
  if (rows.length === 0) break;
  
  processBatch(rows);
  offset += batchSize;
}
```

## 相关资源

- [SQLite 官方文档](https://www.sqlite.org/docs.html)
- [better-sqlite3 文档](https://github.com/WiseLibs/better-sqlite3)
- [Prisma SQLite](https://www.prisma.io/docs/concepts/database-connectors/sqlite)
- [Drizzle ORM](https://orm.drizzle.team/docs/get-started-sqlite)
- [SQLite 语法参考](https://www.sqlite.org/lang.html)
