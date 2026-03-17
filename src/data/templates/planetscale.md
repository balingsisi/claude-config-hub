# PlanetScale 模板

无服务器 MySQL 兼容数据库平台，支持分支、自动扩展和零停机迁移。

## 技术栈

- **数据库**: PlanetScale (MySQL 8.0 兼容)
- **ORM**: Prisma / Drizzle ORM / Kysely
- **查询构建器**: Kysely / Zapatos
- **迁移工具**: PlanetScale CLI / Prisma Migrate
- **连接**: Connect-HTTP (无连接池)
- **语言**: TypeScript / JavaScript

## 项目结构

```
planetscale-project/
├── src/
│   ├── lib/
│   │   ├── db.ts              # 数据库连接
│   │   ├── planetscale.ts     # PlanetScale 客户端
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
│   │   ├── users.ts
│   │   ├── posts.ts
│   │   └── auth.ts
│   └── utils/                 # 工具函数
│       ├── validators.ts
│       └── helpers.ts
├── prisma/                    # Prisma 配置（可选）
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── db/                        # SQL 迁移文件
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/
│       ├── 001_create_users.sql
│       ├── 002_create_posts.sql
│       └── 003_create_comments.sql
├── tests/                     # 测试文件
│   ├── integration/
│   └── unit/
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── planetscale.yml            # PlanetScale 配置
└── README.md
```

## 核心代码模式

### 1. 数据库连接 (src/lib/planetscale.ts)

```typescript
import { connect } from '@planetscale/database';
import { fetch } from 'undici';

// PlanetScale 连接配置
const config = {
  host: process.env.DATABASE_HOST!,
  username: process.env.DATABASE_USERNAME!,
  password: process.env.DATABASE_PASSWORD!,
  fetch: fetch // Node.js 环境需要提供 fetch
};

// 创建连接
export const db = connect(config);

// 查询辅助函数
export async function query<T = any>(
  sql: string,
  args: any[] = []
): Promise<T[]> {
  const result = await db.execute(sql, args);
  return result.rows as T[];
}

// 单行查询
export async function queryOne<T = any>(
  sql: string,
  args: any[] = []
): Promise<T | null> {
  const result = await db.execute(sql, args);
  return (result.rows[0] as T) || null;
}

// 执行语句
export async function execute(
  sql: string,
  args: any[] = []
): Promise<{ affectedRows: number; insertId: number }> {
  const result = await db.execute(sql, args);
  return {
    affectedRows: result.rowsAffected || 0,
    insertId: Number(result.insertId) || 0
  };
}

// 事务支持（PlanetScale 使用分支）
export async function transaction<T>(
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  // PlanetScale 自动处理事务
  // 对于复杂事务，建议使用分支
  return await callback(db);
}
```

### 2. Prisma 集成 (prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["referentialIntegrity"]
}

datasource db {
  provider          = "mysql"
  url               = env("DATABASE_URL")
  relationMode      = "prisma"
  referentialIntegrity = "prisma"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatar    String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  posts     Post[]
  comments  Comment[]
  
  @@map("users")
}

model Post {
  id          String    @id @default(cuid())
  title       String
  content     String    @db.Text
  published   Boolean   @default(false)
  authorId    String    @map("author_id")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  
  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments    Comment[]
  
  @@index([authorId])
  @@index([published])
  @@map("posts")
}

model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  postId    String   @map("post_id")
  authorId  String   @map("author_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  @@index([postId])
  @@index([authorId])
  @@map("comments")
}
```

### 3. Prisma 客户端 (src/lib/db.ts)

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

### 4. 数据仓库层 (src/repositories/user.repo.ts)

```typescript
import { query, queryOne, execute } from '../lib/planetscale';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  name?: string;
  avatar?: string;
}

export interface UpdateUserInput {
  name?: string;
  avatar?: string;
}

export class UserRepository {
  // 查找所有用户
  static async findAll(limit = 20, offset = 0): Promise<User[]> {
    return query<User>(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  }

  // 根据 ID 查找
  static async findById(id: string): Promise<User | null> {
    return queryOne<User>('SELECT * FROM users WHERE id = ?', [id]);
  }

  // 根据邮箱查找
  static async findByEmail(email: string): Promise<User | null> {
    return queryOne<User>('SELECT * FROM users WHERE email = ?', [email]);
  }

  // 创建用户
  static async create(data: CreateUserInput): Promise<string> {
    const result = await execute(
      'INSERT INTO users (id, email, name, avatar, created_at, updated_at) VALUES (UUID(), ?, ?, ?, NOW(), NOW())',
      [data.email, data.name || null, data.avatar || null]
    );
    return String(result.insertId);
  }

  // 更新用户
  static async update(id: string, data: UpdateUserInput): Promise<boolean> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }

    if (data.avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(data.avatar);
    }

    if (updates.length === 0) {
      return false;
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const result = await execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  // 删除用户
  static async delete(id: string): Promise<boolean> {
    const result = await execute('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // 统计用户数量
  static async count(): Promise<number> {
    const result = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM users'
    );
    return result?.count || 0;
  }

  // 搜索用户
  static async search(query: string): Promise<User[]> {
    return query<User>(
      'SELECT * FROM users WHERE name LIKE ? OR email LIKE ? ORDER BY created_at DESC LIMIT 10',
      [`%${query}%`, `%${query}%`]
    );
  }
}
```

### 5. 业务服务层 (src/services/user.service.ts)

```typescript
import { UserRepository, User, CreateUserInput, UpdateUserInput } from '../repositories/user.repo';

export interface UserDTO {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  // 获取所有用户
  static async getAll(page = 1, limit = 20): Promise<{
    users: UserDTO[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    const [users, total] = await Promise.all([
      UserRepository.findAll(limit, offset),
      UserRepository.count()
    ]);

    return {
      users: users.map(this.toDTO),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 根据 ID 获取用户
  static async getById(id: string): Promise<UserDTO | null> {
    const user = await UserRepository.findById(id);
    return user ? this.toDTO(user) : null;
  }

  // 创建用户
  static async create(data: CreateUserInput): Promise<UserDTO> {
    // 检查邮箱是否已存在
    const existing = await UserRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('邮箱已被注册');
    }

    const id = await UserRepository.create(data);
    const user = await UserRepository.findById(id);
    
    if (!user) {
      throw new Error('创建用户失败');
    }

    return this.toDTO(user);
  }

  // 更新用户
  static async update(id: string, data: UpdateUserInput): Promise<UserDTO> {
    const existing = await UserRepository.findById(id);
    if (!existing) {
      throw new Error('用户不存在');
    }

    const success = await UserRepository.update(id, data);
    if (!success) {
      throw new Error('更新用户失败');
    }

    const updated = await UserRepository.findById(id);
    if (!updated) {
      throw new Error('获取更新后的用户失败');
    }

    return this.toDTO(updated);
  }

  // 删除用户
  static async delete(id: string): Promise<void> {
    const existing = await UserRepository.findById(id);
    if (!existing) {
      throw new Error('用户不存在');
    }

    const success = await UserRepository.delete(id);
    if (!success) {
      throw new Error('删除用户失败');
    }
  }

  // 搜索用户
  static async search(query: string): Promise<UserDTO[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const users = await UserRepository.search(query.trim());
    return users.map(this.toDTO);
  }

  // 转换为 DTO
  private static toDTO(user: User): UserDTO {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }
}
```

### 6. API 路由 (src/api/users.ts)

```typescript
import { UserService } from '../services/user.service';
import { validate } from '../utils/validators';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const result = await UserService.getAll(page, limit);

    return Response.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 验证输入
    validate(body, {
      email: { required: true, type: 'email' },
      name: { required: false, type: 'string', minLength: 2 }
    });

    const user = await UserService.create({
      email: body.email,
      name: body.name,
      avatar: body.avatar
    });

    return Response.json(
      { success: true, data: user },
      { status: 201 }
    );
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// 单个用户操作
export async function getUser(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await UserService.getById(params.id);
    
    if (!user) {
      return Response.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: user });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const user = await UserService.update(params.id, body);
    
    return Response.json({ success: true, data: user });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await UserService.delete(params.id);
    
    return Response.json(
      { success: true, message: '用户已删除' },
      { status: 204 }
    );
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

### 7. SQL 迁移文件 (db/migrations/001_create_users.sql)

```sql
-- 创建用户表
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100),
  avatar VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建文章表
CREATE TABLE posts (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  author_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_author (author_id),
  INDEX idx_published (published),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建评论表
CREATE TABLE comments (
  id VARCHAR(36) PRIMARY KEY,
  content TEXT NOT NULL,
  post_id VARCHAR(36) NOT NULL,
  author_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_post (post_id),
  INDEX idx_author (author_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 最佳实践

### 1. 使用分支进行开发

```bash
# 创建开发分支
pscale branch create my-app dev-branch

# 在开发分支上执行迁移
pscale shell my-app dev-branch < migrations/001_create_users.sql

# 测试通过后，创建部署请求
pscale deploy-request create my-app dev-branch

# 自动合并到主分支
pscale deploy-request deploy my-app dev-branch 1
```

### 2. 使用连接池

```typescript
// 使用 @planetscale/database-js 的连接池
import { connect } from '@planetscale/database';

const db = connect({
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
});

// 或使用 Prisma 连接池
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});
```

### 3. 优化查询性能

```typescript
// 使用索引
CREATE INDEX idx_posts_author_published ON posts(author_id, published);

// 避免 SELECT *
const users = await query('SELECT id, email, name FROM users');

// 使用分页
const posts = await query(
  'SELECT * FROM posts WHERE published = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
  [true, limit, offset]
);

// 批量插入
await execute(
  'INSERT INTO posts (id, title, content, author_id) VALUES ?',
  [posts.map(p => [p.id, p.title, p.content, p.author_id])]
);
```

### 4. 使用 ORM 避免 SQL 注入

```typescript
// 使用 Prisma
const user = await prisma.user.findUnique({
  where: { email }
});

// 使用参数化查询
const user = await queryOne(
  'SELECT * FROM users WHERE email = ?',
  [email]
);

// ❌ 避免：字符串拼接
const unsafeQuery = `SELECT * FROM users WHERE email = '${email}'`;
```

### 5. 数据库监控

```typescript
// 监控查询性能
export async function monitoredQuery<T>(
  sql: string,
  args: any[] = []
): Promise<T[]> {
  const start = Date.now();
  
  try {
    const result = await query<T>(sql, args);
    const duration = Date.now() - start;
    
    // 记录慢查询
    if (duration > 1000) {
      console.warn('Slow query:', { sql, duration, args });
    }
    
    return result;
  } catch (error) {
    console.error('Query error:', { sql, error });
    throw error;
  }
}
```

### 6. 错误处理

```typescript
import { DatabaseError } from '@planetscale/database';

export async function safeQuery<T>(
  sql: string,
  args: any[] = []
): Promise<T[] | null> {
  try {
    return await query<T>(sql, args);
  } catch (error) {
    if (error instanceof DatabaseError) {
      console.error('Database error:', {
        code: error.code,
        message: error.message
      });
    }
    return null;
  }
}
```

## 常用命令

### PlanetScale CLI

```bash
# 安装 CLI
brew install planetscale/tap/pscale
# 或
npm install -g pscale

# 登录
pscale auth login

# 创建数据库
pscale database create my-app --region ap-southeast

# 创建分支
pscale branch create my-app dev-branch

# 连接到分支
pscale shell my-app dev-branch

# 执行 SQL 文件
pscale shell my-app dev-branch < schema.sql

# 查看分支状态
pscale branch list my-app

# 创建部署请求
pscale deploy-request create my-app dev-branch

# 部署
pscale deploy-request deploy my-app dev-branch 1

# 回滚
pscale branch promote my-app restore-from-backup

# 导入数据
pscale database restore-diff my-app --branch main --base backup-branch

# 导出数据
pscale database dump my-app main --output ./dump

# 查看数据库状态
pscale database show my-app
```

### Prisma 命令

```bash
# 生成 Prisma 客户端
npx prisma generate

# 创建迁移
npx prisma migrate dev --name init

# 应用迁移
npx prisma migrate deploy

# 重置数据库
npx prisma migrate reset

# 打开 Prisma Studio
npx prisma studio

# 格式化 schema
npx prisma format

# 验证 schema
npx prisma validate

# 生成种子数据
npx prisma db seed
```

### 本地开发

```bash
# 启动本地代理（连接到 PlanetScale）
pscale connect my-app main --port 3306

# 运行开发服务器
npm run dev

# 运行测试
npm test

# 构建生产版本
npm run build
```

## 部署配置

### Vercel 集成

```typescript
// next.config.js
module.exports = {
  env: {
    DATABASE_HOST: process.env.DATABASE_HOST,
    DATABASE_USERNAME: process.env.DATABASE_USERNAME,
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
  },
};
```

### 环境变量 (.env)

```env
# PlanetScale 连接信息
DATABASE_HOST=xxxxxxxx.us-east-1.psdb.cloud
DATABASE_USERNAME=xxxxxxxx
DATABASE_PASSWORD=pscale_pw_xxxxxxxx

# 或使用 Prisma
DATABASE_URL=mysql://xxxxxxxx:pscale_pw_xxxxxxxx@xxxxxxxx.us-east-1.psdb.cloud/my-app?sslaccept=strict

# 应用配置
NODE_ENV=production
PORT=3000
```

### PlanetScale 配置 (planetscale.yml)

```yaml
name: my-app
region: ap-southeast
database: my-app

branches:
  - name: main
    production: true
  
  - name: development
    production: false

schema:
  - path: ./db/schema.sql
    branch: development
```

### GitHub Actions CI/CD

```yaml
name: Deploy Database

on:
  push:
    branches: [ main ]
    paths:
      - 'db/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install PlanetScale CLI
        run: |
          brew install planetscale/tap/pscale
      
      - name: Login to PlanetScale
        run: |
          pscale auth login --token ${{ secrets.PLANETSCALE_TOKEN }}
      
      - name: Create migration branch
        run: |
          pscale branch create my-app migration-$(date +%s) --from main
      
      - name: Run migrations
        run: |
          for file in db/migrations/*.sql; do
            echo "Running $file"
            pscale shell my-app migration-branch < "$file"
          done
      
      - name: Create deploy request
        run: |
          pscale deploy-request create my-app migration-branch
```

### Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# 使用 PlanetScale 代理
RUN apk add --no-cache curl && \
    curl -fsSL https://github.com/planetscale/cli/releases/latest/download/pscale_linux_amd64.tar.gz | tar xz && \
    mv pscale /usr/local/bin/

EXPOSE 3000

CMD ["npm", "start"]
```

## 性能优化

### 1. 连接优化

```typescript
// 使用 HTTP 连接（推荐）
import { connect } from '@planetscale/database';

const db = connect({
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  fetch: fetch
});

// 连接池大小
const MAX_CONNECTIONS = 10;
```

### 2. 查询优化

```sql
-- 使用覆盖索引
CREATE INDEX idx_posts_covering ON posts(author_id, published, created_at);

-- 优化 JOIN
SELECT p.*, u.name as author_name
FROM posts p
INNER JOIN users u ON p.author_id = u.id
WHERE p.published = true
ORDER BY p.created_at DESC
LIMIT 20;

-- 使用 EXPLAIN 分析查询
EXPLAIN SELECT * FROM posts WHERE published = true;
```

### 3. 缓存策略

```typescript
import { cache } from 'react';

// 缓存查询结果
export const getUser = cache(async (id: string) => {
  return await UserRepository.findById(id);
});

// 使用 Redis 缓存
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN
});

export async function getCachedUser(id: string) {
  const cached = await redis.get(`user:${id}`);
  if (cached) return cached;

  const user = await UserRepository.findById(id);
  if (user) {
    await redis.set(`user:${id}`, user, { ex: 3600 });
  }
  return user;
}
```

## 数据迁移

### 从其他数据库迁移

```bash
# 导出数据
mysqldump -h old-host -u user -p database > dump.sql

# 导入到 PlanetScale
pscale database import my-app --dir ./dump

# 或使用数据导入服务
pscale database import-sql my-app main < dump.sql
```

### 零停机迁移

```typescript
// 使用双写策略
async function migrateWithZeroDowntime() {
  // 1. 从旧数据库读取
  const users = await oldDb.query('SELECT * FROM users');
  
  // 2. 写入新数据库
  for (const user of users) {
    await UserRepository.create({
      email: user.email,
      name: user.name
    });
  }
  
  // 3. 验证数据一致性
  const newUsers = await UserRepository.findAll();
  console.log(`Migrated ${newUsers.length} users`);
}
```

## 参考资料

- [PlanetScale 官方文档](https://planetscale.com/docs)
- [PlanetScale CLI 参考](https://planetscale.com/docs/reference/cli)
- [Prisma PlanetScale 集成](https://www.prisma.io/docs/concepts/database-connectors/planetscale)
- [MySQL 8.0 文档](https://dev.mysql.com/doc/refman/8.0/en/)
- [数据库分支最佳实践](https://planetscale.com/docs/concepts/branching)
