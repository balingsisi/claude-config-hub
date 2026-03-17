# PocketBase 模板

## 技术栈
- **PocketBase** - Go 语言编写的开源后端即服务 (BaaS)
- **SQLite** - 内置数据库
- **实时订阅** - WebSocket 实时数据同步
- **认证系统** - 邮箱/密码、OAuth2
- **文件存储** - 内置文件上传管理
- **Admin UI** - 可视化管理界面

## 项目结构
```
pocketbase-project/
├── pb_data/              # 数据目录（自动生成）
│   ├── data.db           # SQLite 数据库
│   ├── logs.db           # 日志数据库
│   └── storage/          # 文件存储
├── pb_migrations/        # 数据库迁移文件
│   └── 1703123456_create_users.js
├── pb_hooks/             # JavaScript 钩子
│   └── main.pb.js
├── public/               # 静态文件
│   └── index.html
├── main.go               # 自定义扩展入口（可选）
├── pocketbase            # PocketBase 可执行文件
└── Dockerfile
```

## 代码模式

### 集合定义（迁移文件）
```javascript
// pb_migrations/1703123456_create_posts.js
migrate((db) => {
  const dao = new Dao(db);
  const collection = new Collection({
    name: "posts",
    type: "base",
    system: false,
    schema: [
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "content",
        type: "editor",
        required: false,
      },
      {
        name: "author",
        type: "relation",
        required: true,
        options: {
          collectionId: "USERS_COLLECTION_ID",
          cascadeDelete: true,
        },
      },
    ],
    indexes: ["CREATE INDEX idx_author ON posts (author)"],
  });
  
  return dao.saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("posts");
  return dao.deleteCollection(collection);
});
```

### JavaScript SDK 使用
```typescript
// src/lib/pocketbase.ts
import PocketBase from 'pocketbase';

const pb = new PocketBase(import.meta.env.VITE_PB_URL);

// 认证
export async function login(email: string, password: string) {
  const authData = await pb.collection('users').authWithPassword(email, password);
  return authData;
}

// 登出
export function logout() {
  pb.authStore.clear();
}

// 获取当前用户
export function getCurrentUser() {
  return pb.authStore.model;
}

// CRUD 操作
export async function createPost(data: { title: string; content: string }) {
  return await pb.collection('posts').create({
    ...data,
    author: pb.authStore.model?.id,
  });
}

export async function getPosts(page = 1, perPage = 20) {
  return await pb.collection('posts').getList(page, perPage, {
    sort: '-created',
    expand: 'author',
  });
}

export async function updatePost(id: string, data: Partial<Post>) {
  return await pb.collection('posts').update(id, data);
}

export async function deletePost(id: string) {
  return await pb.collection('posts').delete(id);
}

// 实时订阅
export function subscribeToPosts(callback: (data: any) => void) {
  return pb.collection('posts').subscribe('*', function (e) {
    callback(e);
  });
}

// 文件上传
export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);
  
  return await pb.collection('users').update(pb.authStore.model?.id, formData);
}

export default pb;
```

### React 集成
```tsx
// src/hooks/usePocketBase.ts
import { useEffect, useState } from 'react';
import pb, { getCurrentUser } from '@/lib/pocketbase';

export function useAuth() {
  const [user, setUser] = useState(getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 监听认证状态变化
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, isLoading, isAuthenticated: !!user };
}

// src/hooks/useRealtime.ts
import { useEffect, useState } from 'react';
import pb from '@/lib/pocketbase';

export function useRealtime<T>(collection: string) {
  const [records, setRecords] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 初始加载
    pb.collection(collection).getFullList<T>().then((data) => {
      setRecords(data);
      setIsLoading(false);
    });

    // 实时订阅
    pb.collection(collection).subscribe('*', (e) => {
      if (e.action === 'create') {
        setRecords((prev) => [...prev, e.record]);
      } else if (e.action === 'update') {
        setRecords((prev) =>
          prev.map((r) => (r.id === e.record.id ? e.record : r))
        );
      } else if (e.action === 'delete') {
        setRecords((prev) => prev.filter((r) => r.id !== e.record.id));
      }
    });

    return () => {
      pb.collection(collection).unsubscribe();
    };
  }, [collection]);

  return { records, isLoading };
}
```

### 钩子扩展
```javascript
// pb_hooks/main.pb.js
// 记录钩子
onRecordAfterCreateRequest((e) => {
  console.log(`New ${e.collection.name} created:`, e.record.id);
}, "posts");

onRecordBeforeDeleteRequest((e) => {
  // 验证删除权限
  if (e.record.author !== e.auth.id) {
    throw new BadRequestError("You can only delete your own posts");
  }
}, "posts");

// API 路由扩展
routerAdd("GET", "/api/custom/stats", (c) => {
  const dao = $app.dao();
  
  const totalUsers = dao.count("users");
  const totalPosts = dao.count("posts");
  
  return c.json(200, {
    users: totalUsers,
    posts: totalPosts,
  });
});

// 定时任务
cronAdd("cleanup", "0 0 * * *", () => {
  console.log("Running daily cleanup...");
  // 清理逻辑
});
```

### Go 扩展
```go
// main.go
package main

import (
    "log"
    "github.com/pocketbase/pocketbase"
    "github.com/pocketbase/pocketbase/core"
    "github.com/pocketbase/pocketbase/plugins/migratecmd"
)

func main() {
    app := pocketbase.New()

    // 注册迁移命令
    migratecmd.MustRegister(app, app.RootCmd, &migratecmd.Options{
        Automigrate: true,
    })

    // 自定义路由
    app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
        e.Router.GET("/api/hello", func(c *core.RequestEvent) error {
            return c.JSON(200, map[string]string{
                "message": "Hello from PocketBase!",
            })
        })
        return nil
    })

    // 记录钩子
    app.OnRecordAfterCreate("posts").Add(func(e *core.RecordEvent) error {
        log.Printf("New post created: %s", e.Record.Id)
        return nil
    })

    if err := app.Start(); err != nil {
        log.Fatal(err)
    }
}
```

## 最佳实践

### 1. 安全配置
```yaml
# 设置环境变量
PB_ADMIN_EMAIL=admin@example.com
PB_ADMIN_PASSWORD=your-secure-password
PB_SMTP_HOST=smtp.gmail.com
PB_SMTP_PORT=587
PB_SMTP_USERNAME=your-email@gmail.com
PB_SMTP_PASSWORD=your-app-password
```

### 2. API 规则
```javascript
// 在 Admin UI 中设置集合规则
// posts 集合规则示例：
// List/View: "" (公开)
// Create: "author = @request.auth.id" (登录用户）
// Update: "author = @request.auth.id" (仅作者）
// Delete: "author = @request.auth.id" (仅作者）
```

### 3. 迁移最佳实践
```bash
# 自动生成迁移
./pocketbase migrate create

# 应用迁移
./pocketbase migrate up

# 回滚迁移
./pocketbase migrate down

# 查看迁移状态
./pocketbase migrate history
```

### 4. 性能优化
```javascript
// 使用索引
// 在集合设置中添加索引
CREATE INDEX idx_created ON posts (created DESC);
CREATE INDEX idx_author_created ON posts (author, created DESC);

// 分页查询
const result = await pb.collection('posts').getList(1, 20, {
  filter: 'created >= "2024-01-01"',
  sort: '-created',
  expand: 'author',
  fields: 'id,title,created,author.name', // 仅返回需要的字段
});
```

### 5. 错误处理
```typescript
// src/lib/errors.ts
import { ClientResponseError } from 'pocketbase';

export function handlePBError(error: unknown): string {
  if (error instanceof ClientResponseError) {
    switch (error.status) {
      case 400:
        return '请求参数错误';
      case 401:
        return '未授权，请先登录';
      case 403:
        return '没有权限执行此操作';
      case 404:
        return '资源不存在';
      case 409:
        return '数据冲突，可能已存在';
      case 429:
        return '请求过于频繁，请稍后再试';
      default:
        return error.message || '服务器错误';
    }
  }
  return '未知错误';
}
```

## 常用命令

### 基础命令
```bash
# 启动开发服务器
./pocketbase serve

# 指定端口和监听地址
./pocketbase serve --http=0.0.0.0:8090

# 生产模式（禁用 Admin UI）
./pocketbase serve --http=0.0.0.0:8090 --hide=false

# 迁移相关
./pocketbase migrate up          # 应用所有迁移
./pocketbase migrate down        # 回滚最后迁移
./pocketbase migrate history     # 查看迁移历史
./pocketbase migrate create      # 创建新迁移

# 用户管理
./pocketbase admin create admin@example.com password123
./pocketbase admin update admin@example.com newpassword123

# 备份恢复
./pocketbase backup
./pocketbase restore /path/to/backup.zip
```

### Docker 命令
```bash
# 构建
docker build -t my-pocketbase .

# 运行
docker run -d \
  -p 8090:8090 \
  -v /path/to/pb_data:/pb_data \
  -e PB_ADMIN_EMAIL=admin@example.com \
  -e PB_ADMIN_PASSWORD=password123 \
  my-pocketbase
```

## 部署配置

### Dockerfile
```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 下载 PocketBase
RUN apk add --no-cache wget unzip && \
    wget -O pocketbase.zip https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip && \
    unzip pocketbase.zip && \
    rm pocketbase.zip

FROM alpine:latest

WORKDIR /app

# 复制可执行文件
COPY --from=builder /app/pocketbase /app/pocketbase

# 复制迁移和钩子
COPY pb_migrations /app/pb_migrations
COPY pb_hooks /app/pb_hooks

# 创建数据目录
RUN mkdir /app/pb_data

EXPOSE 8090

CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:8090"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  pocketbase:
    build: .
    ports:
      - "8090:8090"
    volumes:
      - pb_data:/app/pb_data
    environment:
      - PB_ADMIN_EMAIL=${PB_ADMIN_EMAIL}
      - PB_ADMIN_PASSWORD=${PB_ADMIN_PASSWORD}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8090/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  pb_data:
```

### Caddy 反向代理
```
# Caddyfile
api.example.com {
    reverse_proxy localhost:8090
    
    # WebSocket 支持
    header_up Host {host}
    header_up X-Real-IP {remote_host}
    header_up X-Forwarded-Proto {scheme}
}
```

### Nginx 反向代理
```nginx
server {
    listen 80;
    server_name api.example.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Systemd 服务
```ini
# /etc/systemd/system/pocketbase.service
[Unit]
Description=PocketBase Service
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/pocketbase
ExecStart=/opt/pocketbase/pocketbase serve --http=0.0.0.0:8090
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

### Fly.io 部署
```toml
# fly.toml
app = "my-pocketbase"

[build]
  Dockerfile = "Dockerfile"

[mount]
  source = "pb_data"
  destination = "/app/pb_data"

[env]
  PORT = "8090"

[[services]]
  internal_port = 8090
  protocol = "tcp"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

### 环境变量
```bash
# .env
PB_ADMIN_EMAIL=admin@example.com
PB_ADMIN_PASSWORD=your-secure-password

# SMTP 配置
PB_SMTP_HOST=smtp.gmail.com
PB_SMTP_PORT=587
PB_SMTP_USERNAME=your-email@gmail.com
PB_SMTP_PASSWORD=your-app-password

# 加密密钥（用于数据加密）
PB_ENCRYPTION_KEY=your-32-byte-encryption-key

# OAuth 配置
PB_GITHUB_CLIENT_ID=your-github-client-id
PB_GITHUB_CLIENT_SECRET=your-github-client-secret
PB_GOOGLE_CLIENT_ID=your-google-client-id
PB_GOOGLE_CLIENT_SECRET=your-google-client-secret
```
