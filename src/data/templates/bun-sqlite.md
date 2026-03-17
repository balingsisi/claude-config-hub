# Bun SQLite 模板

## 技术栈

- **运行时**: Bun 1.x
- **数据库**: SQLite (内置)
- **ORM/查询**: Bun 原生 API / Drizzle ORM (可选)
- **验证**: Zod
- **类型**: TypeScript

## 项目结构

```
bun-sqlite-project/
├── src/
│   ├── db/
│   │   ├── index.ts          # 数据库连接
│   │   ├── schema.sql        # SQL schema
│   │   ├── migrations/       # 迁移文件
│   │   └── seeds.ts          # 种子数据
│   ├── repositories/         # 数据访问层
│   │   ├── user.repo.ts
│   │   └── post.repo.ts
│   ├── services/             # 业务逻辑层
│   │   └── user.service.ts
│   ├── routes/               # API 路由
│   │   └── users.ts
│   └── index.ts              # 入口文件
├── tests/
│   └── db.test.ts
├── bunfig.toml               # Bun 配置
├── package.json
└── tsconfig.json
```

## 代码模式

### 数据库连接

```typescript
// src/db/index.ts
import { Database } from "bun:sqlite";

const db = new Database("./data.db");

// 启用 WAL 模式提升性能
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA synchronous = NORMAL");

// 创建连接池 (Bun 1.1+)
export const dbPool = Database.open("./data.db", { readonly: false });

export default db;
```

### 创建表

```typescript
// src/db/schema.sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_published ON posts(published);
```

### Repository 模式

```typescript
// src/repositories/user.repo.ts
import db from "../db";

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
}

export const UserRepository = {
  findAll: (): User[] => {
    const query = db.query<User, []>(`
      SELECT * FROM users ORDER BY created_at DESC
    `);
    return query.all();
  },

  findById: (id: number): User | null => {
    const query = db.query<User, [number]>(`
      SELECT * FROM users WHERE id = ?
    `);
    return query.get(id);
  },

  findByEmail: (email: string): User | null => {
    const query = db.query<User, [string]>(`
      SELECT * FROM users WHERE email = ?
    `);
    return query.get(email);
  },

  create: (input: CreateUserInput): User => {
    const stmt = db.prepare(`
      INSERT INTO users (email, name)
      VALUES ($email, $name)
      RETURNING *
    `);
    return stmt.get(input) as User;
  },

  update: (id: number, data: Partial<User>): User | null => {
    const fields = Object.keys(data)
      .map((key) => `${key} = $${key}`)
      .join(", ");
    
    const stmt = db.prepare(`
      UPDATE users 
      SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $id
      RETURNING *
    `);
    return stmt.get({ ...data, id }) as User | null;
  },

  delete: (id: number): boolean => {
    const stmt = db.prepare("DELETE FROM users WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  },
};
```

### 事务处理

```typescript
// src/repositories/post.repo.ts
import db from "../db";

export const PostRepository = {
  createWithTags: (postData: any, tags: string[]) => {
    return db.transaction(() => {
      // 创建文章
      const postStmt = db.prepare(`
        INSERT INTO posts (user_id, title, content)
        VALUES ($userId, $title, $content)
        RETURNING *
      `);
      const post = postStmt.get(postData);

      // 批量插入标签
      const tagStmt = db.prepare(`
        INSERT INTO post_tags (post_id, name)
        VALUES ($postId, $name)
      `);
      
      for (const tag of tags) {
        tagStmt.run({ postId: post.id, name: tag });
      }

      return post;
    })();
  },
};
```

### 使用 Typed SQL

```typescript
// 类型安全的查询
import db from "../db";

interface UserStats {
  user_id: number;
  user_name: string;
  post_count: number;
  latest_post: string | null;
}

const getUserStats = db.query<UserStats, [number]>(`
  SELECT 
    u.id as user_id,
    u.name as user_name,
    COUNT(p.id) as post_count,
    MAX(p.created_at) as latest_post
  FROM users u
  LEFT JOIN posts p ON u.id = p.user_id
  WHERE u.id = ?
  GROUP BY u.id
`);

const stats = getUserStats.all(1);
```

### Bun 服务器集成

```typescript
// src/index.ts
import db from "./db";
import { UserRepository } from "./repositories/user.repo";

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/api/users" && req.method === "GET") {
      const users = UserRepository.findAll();
      return Response.json(users);
    }

    if (url.pathname === "/api/users" && req.method === "POST") {
      const body = await req.json();
      const user = UserRepository.create(body);
      return Response.json(user, { status: 201 });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
```

## 最佳实践

### 1. 预编译查询

```typescript
// 预编译提升性能
const preparedQueries = {
  getUser: db.query("SELECT * FROM users WHERE id = ?"),
  getUserPosts: db.query("SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT ?"),
};

export const getQuickUser = (id: number) => preparedQueries.getUser.get(id);
```

### 2. 连接配置

```typescript
// 生产环境配置
const db = new Database("./data.db", {
  readonly: false,
  create: true,
  readwrite: true,
});

// 性能优化 PRAGMA
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA synchronous = NORMAL");
db.run("PRAGMA cache_size = -64000"); // 64MB cache
db.run("PRAGMA temp_store = MEMORY");
```

### 3. 错误处理

```typescript
import { SQLiteError } from "bun:sqlite";

export const safeCreate = (input: CreateUserInput) => {
  try {
    return { success: true, data: UserRepository.create(input) };
  } catch (error) {
    if (error instanceof SQLiteError) {
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return { success: false, error: "Email already exists" };
      }
    }
    throw error;
  }
};
```

### 4. 批量操作

```typescript
// 批量插入优化
export const bulkInsert = (users: CreateUserInput[]) => {
  const stmt = db.prepare("INSERT INTO users (email, name) VALUES ($email, $name)");
  
  const insertMany = db.transaction((users) => {
    for (const user of users) {
      stmt.run(user);
    }
  });

  return insertMany(users);
};
```

### 5. 迁移管理

```typescript
// src/db/migrate.ts
import db from "./index";
import { readFileSync, readdirSync } from "fs";

const MIGRATIONS_DIR = "./src/db/migrations";

export const runMigrations = () => {
  // 创建迁移表
  db.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const appliedMigrations = db
    .query<{ name: string }, []>("SELECT name FROM migrations")
    .all()
    .map((m) => m.name);

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (appliedMigrations.includes(file)) continue;

    const sql = readFileSync(`${MIGRATIONS_DIR}/${file}`, "utf-8");
    db.transaction(() => {
      db.run(sql);
      db.run("INSERT INTO migrations (name) VALUES (?)", [file]);
    })();

    console.log(`Applied migration: ${file}`);
  }
};
```

## 常用命令

```bash
# 初始化项目
bun init

# 安装依赖
bun add zod
bun add -d @types/bun

# 运行开发服务器
bun run src/index.ts

# 热重载
bun --hot run src/index.ts

# 运行迁移
bun run src/db/migrate.ts

# 执行 SQL
bun run -e "import db from './src/db'; console.log(db.query('SELECT 1').get())"

# 测试
bun test

# 构建
bun build ./src/index.ts --outdir ./dist

# 查看数据库
sqlite3 data.db ".tables"
sqlite3 data.db ".schema users"
sqlite3 data.db "SELECT * FROM users LIMIT 10"
```

## 部署配置

### Docker

```dockerfile
# Dockerfile
FROM oven/bun:1 AS base

WORKDIR /app

# 安装 sqlite3 工具（可选）
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# 复制源代码
COPY src/ ./src/
COPY src/db/schema.sql ./src/db/

# 创建数据目录
RUN mkdir -p /app/data

# 运行迁移并启动
CMD ["sh", "-c", "bun run src/db/migrate.ts && bun run src/index.ts"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - sqlite-data:/app/data
    environment:
      - NODE_ENV=production
      - DB_PATH=/app/data/data.db
    restart: unless-stopped

volumes:
  sqlite-data:
```

### Bunfig 配置

```toml
# bunfig.toml
[run]
# 预加载环境变量
preload = [".env"]

[install]
# 生产环境安装
production = true

[test]
# 测试配置
coverage = true
coverageThreshold = 0.8
```

### Systemd 服务

```ini
# /etc/systemd/system/bun-sqlite-app.service
[Unit]
Description=Bun SQLite Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/bun-sqlite-app
ExecStart=/usr/local/bin/bun run src/index.ts
Restart=on-failure
Environment=NODE_ENV=production
Environment=DB_PATH=/var/lib/bun-sqlite-app/data.db

[Install]
WantedBy=multi-user.target
```

### 备份策略

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups/sqlite"
DB_PATH="/app/data/data.db"
DATE=$(date +%Y%m%d_%H%M%S)

# 在线备份（不锁定数据库）
sqlite3 $DB_PATH ".backup '${BACKUP_DIR}/backup_${DATE}.db'"

# 保留最近 7 天的备份
find $BACKUP_DIR -name "backup_*.db" -mtime +7 -delete

echo "Backup completed: backup_${DATE}.db"
```
