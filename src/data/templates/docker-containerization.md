# Docker 容器化模板

## 技术栈

- **容器运行时**: Docker 24.x / Docker Engine
- **编排工具**: Docker Compose / Kubernetes (可选)
- **基础镜像**: Alpine Linux / Distroless
- **构建工具**: BuildKit / Multi-stage builds
- **镜像仓库**: Docker Hub / GHCR / AWS ECR
- **CI/CD**: GitHub Actions / GitLab CI
- **监控**: Prometheus / Grafana
- **日志**: ELK Stack / Loki

## 项目结构

```
docker-project/
├── src/                       # 应用源代码
├── docker/                    # Docker 相关文件
│   ├── nginx/               # Nginx 配置
│   │   ├── nginx.conf
│   │   └── default.conf
│   ├── php/                 # PHP 配置（示例）
│   │   └── php.ini
│   └── scripts/             # 脚本文件
│       ├── entrypoint.sh
│       └── healthcheck.sh
├── docker-compose.yml         # 开发环境编排
├── docker-compose.prod.yml    # 生产环境编排
├── Dockerfile                 # 生产环境镜像
├── Dockerfile.dev            # 开发环境镜像
├── .dockerignore             # Docker 忽略文件
├── Makefile                  # 常用命令
├── .env.example              # 环境变量示例
└── README.md
```

## 代码模式

### Dockerfile 最佳实践

```dockerfile
# ============================================
# 多阶段构建示例 - Node.js 应用
# ============================================

# 阶段 1: 依赖安装
FROM node:20-alpine AS deps
WORKDIR /app

# 安装依赖所需的系统包
RUN apk add --no-cache libc6-compat

# 复制 package 文件
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm ci --only=production && \
    npm cache clean --force

# 阶段 2: 构建应用
FROM node:20-alpine AS builder
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建应用
ENV NODE_ENV=production
RUN npm run build

# 阶段 3: 运行环境
FROM node:20-alpine AS runner
WORKDIR /app

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 设置环境变量
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切换用户
USER nextjs

# 暴露端口
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node healthcheck.js || exit 1

# 启动应用
CMD ["node", "server.js"]

# ============================================
# Python 应用示例
# ============================================

# 基础镜像
FROM python:3.11-slim AS base

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 安装系统依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --user -r requirements.txt

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app
USER appuser

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# 启动命令
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# ============================================
# Go 应用示例
# ============================================

# 构建阶段
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 安装依赖
RUN apk add --no-cache git

# 复制 go mod 文件
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建二进制文件
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# 运行阶段 - 使用 distroless
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app

# 从构建阶段复制二进制文件
COPY --from=builder /app/main .

# 使用非 root 用户
USER nonroot:nonroot

# 暴露端口
EXPOSE 8080

# 启动应用
CMD ["./main"]

# ============================================
# Nginx 示例
# ============================================

FROM nginx:1.25-alpine

# 删除默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义配置
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/

# 复制静态文件
COPY dist/ /usr/share/nginx/html/

# 创建缓存目录
RUN mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose 配置

```yaml
# docker-compose.yml - 开发环境
version: '3.9'

services:
  # 前端应用
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.dev
      target: development
    container_name: app-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://api:8000
    volumes:
      - ./src:/app/src
      - ./public:/app/public
      - /app/node_modules
      - /app/.next
    depends_on:
      - api
      - db
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # API 服务
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: app-api
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:password@db:5432/mydb
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-secret-key
    volumes:
      - ./api/src:/app/src
      - /app/node_modules
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL 数据库
  db:
    image: postgres:15-alpine
    container_name: app-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mydb
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: app-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Nginx 反向代理
  nginx:
    image: nginx:1.25-alpine
    container_name: app-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - frontend
      - api
    networks:
      - app-network

  # 管理工具（可选）
  adminer:
    image: adminer
    container_name: app-adminer
    restart: unless-stopped
    ports:
      - "8080:8080"
    depends_on:
      - db
    networks:
      - app-network

volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local

networks:
  app-network:
    driver: bridge

---
# docker-compose.prod.yml - 生产环境
version: '3.9'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
      args:
        - NODE_ENV=production
    restart: always
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
      target: production
    restart: always
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.25'
          memory: 256M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  db:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_USER_FILE=/run/secrets/db_user
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
      - POSTGRES_DB=mydb
    secrets:
      - db_user
      - db_password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$(cat /run/secrets/db_user) -d mydb"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: >
      redis-server
      --appendonly yes
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

secrets:
  db_user:
    file: ./secrets/db_user.txt
  db_password:
    file: ./secrets/db_password.txt

volumes:
  postgres-data:
  redis-data:

networks:
  app-network:
```

### Nginx 配置

```nginx
# docker/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    multi_accept on;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/atom+xml image/svg+xml;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 限制请求大小
    client_max_body_size 100M;

    # 包含站点配置
    include /etc/nginx/conf.d/*.conf;
}

# docker/nginx/default.conf
# 上游服务
upstream frontend {
    server frontend:3000;
    keepalive 32;
}

upstream api {
    server api:8000;
    keepalive 32;
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name example.com www.example.com;
    
    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    # SSL 配置
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 前端
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # API
    location /api {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 速率限制
        limit_req zone=api_limit burst=20 nodelay;
    }

    # WebSocket
    location /ws {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Entrypoint 脚本

```bash
#!/bin/bash
# docker/scripts/entrypoint.sh
set -e

# 等待依赖服务
wait_for_service() {
    local host=$1
    local port=$2
    local service=$3
    local max_attempts=30
    local attempt=0

    echo "Waiting for $service..."
    while ! nc -z $host $port; do
        attempt=$((attempt + 1))
        if [ $attempt -ge $max_attempts ]; then
            echo "Error: $service not available after $max_attempts attempts"
            exit 1
        fi
        echo "Waiting for $service... ($attempt/$max_attempts)"
        sleep 2
    done
    echo "$service is available!"
}

# 等待数据库
if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
    wait_for_service $DB_HOST $DB_PORT "Database"
fi

# 等待 Redis
if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ]; then
    wait_for_service $REDIS_HOST $REDIS_PORT "Redis"
fi

# 运行数据库迁移
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    npm run migrate
fi

# 执行传入的命令
exec "$@"

#!/bin/bash
# docker/scripts/healthcheck.sh
set -e

# 检查应用健康状态
HEALTH_URL="http://localhost:${PORT:-3000}/health"

response=$(curl -f -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $response -eq 200 ]; then
    echo "Healthy"
    exit 0
else
    echo "Unhealthy: HTTP $response"
    exit 1
fi
```

### .dockerignore

```
# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
.next
out
build
dist

# Development files
.git
.gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.idea
.vscode
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Docker
Dockerfile*
docker-compose*
.docker

# Tests
coverage
.nyc_output
**/*.test.ts
**/*.test.tsx
**/*.spec.ts
**/*.spec.tsx

# Documentation
README.md
CHANGELOG.md
LICENSE
docs/

# Logs
logs
*.log

# Temporary files
tmp
temp
```

## 最佳实践

### 1. 镜像优化

```dockerfile
# ❌ 不好的做法
FROM node:20
COPY . .
RUN npm install
CMD ["npm", "start"]

# ✅ 好的做法
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER node
CMD ["node", "server.js"]

# 使用 distroless 镜像（最小化攻击面）
FROM gcr.io/distroless/nodejs20-debian12
COPY --from=builder /app /app
CMD ["server.js"]
```

### 2. 安全最佳实践

```dockerfile
# 1. 使用特定版本，不要用 latest
FROM node:20.11.0-alpine

# 2. 不要用 root 用户运行
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup
USER appuser

# 3. 最小化层数
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# 4. 不要在镜像中存储秘密
# ❌ 错误
ENV API_KEY=secret123

# ✅ 正确 - 使用运行时环境变量或 secrets
# docker-compose.yml
# secrets:
#   api_key:
#     file: ./secrets/api_key.txt

# 5. 扫描镜像漏洞
# docker scan myimage:latest

# 6. 使用 COPY 而不是 ADD（除非需要解压）
COPY . .
# ADD archive.tar.gz /app/
```

### 3. 缓存优化

```dockerfile
# 利用 Docker 缓存层
# 依赖层（不常变化）
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 构建层（经常变化）
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 运行层
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/server.js"]
```

### 4. 日志管理

```yaml
# docker-compose.yml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"      # 单个日志文件最大 10MB
        max-file: "3"        # 最多保留 3 个文件
        labels: "service,environment"
        tag: "{{.ImageName}}/{{.Name}}/{{.ID}}"
```

### 5. 资源限制

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.5'        # 最多使用 1.5 个 CPU
          memory: 1G         # 最多使用 1GB 内存
        reservations:
          cpus: '0.5'        # 预留 0.5 个 CPU
          memory: 512M       # 预留 512MB 内存
```

## 常用命令

```bash
# 构建相关
docker build -t myapp:latest .                    # 构建镜像
docker build --no-cache -t myapp:latest .         # 不使用缓存构建
docker build --target builder -t myapp:builder .  # 构建到特定阶段
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest .  # 多平台构建

# 运行相关
docker run -d -p 3000:3000 --name myapp myapp:latest    # 后台运行
docker run -it --rm myapp:latest sh                     # 交互式运行
docker run --env-file .env myapp:latest                 # 使用环境变量文件
docker run -v $(pwd)/data:/app/data myapp:latest        # 挂载卷

# Compose 相关
docker-compose up -d                               # 启动所有服务
docker-compose up -d --build                       # 重新构建并启动
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d  # 使用多个配置文件
docker-compose down                                # 停止并删除容器
docker-compose down -v                             # 同时删除卷
docker-compose logs -f [service]                   # 查看日志
docker-compose exec [service] sh                   # 进入容器
docker-compose ps                                  # 查看服务状态
docker-compose top                                 # 查看进程

# 镜像管理
docker images                                      # 列出镜像
docker rmi myapp:latest                            # 删除镜像
docker image prune                                 # 删除未使用的镜像
docker tag myapp:latest myapp:v1.0.0              # 打标签
docker push myrepo/myapp:latest                    # 推送镜像
docker pull myrepo/myapp:latest                    # 拉取镜像

# 容器管理
docker ps                                          # 列出运行中的容器
docker ps -a                                       # 列出所有容器
docker stop [container]                            # 停止容器
docker start [container]                           # 启动容器
docker rm [container]                              # 删除容器
docker container prune                             # 删除所有停止的容器
docker exec -it [container] sh                     # 进入容器
docker logs -f [container]                         # 查看日志
docker stats                                       # 查看资源使用情况
docker inspect [container]                         # 查看容器详情

# 清理命令
docker system prune                                # 清理未使用的资源
docker system prune -a                             # 清理所有未使用的资源（包括镜像）
docker volume prune                                # 清理未使用的卷
docker network prune                               # 清理未使用的网络

# 调试命令
docker cp [container]:/app/file.txt ./             # 从容器复制文件
docker cp ./local.txt [container]:/app/            # 复制文件到容器
docker commit [container] myapp:debug              # 创建镜像
docker diff [container]                            # 查看文件系统变化
docker events                                      # 实时事件
docker top [container]                             # 查看容器进程

# 网络相关
docker network ls                                  # 列出网络
docker network create mynetwork                    # 创建网络
docker network connect mynetwork [container]       # 连接网络
docker network disconnect mynetwork [container]    # 断开网络

# 卷相关
docker volume ls                                   # 列出卷
docker volume create myvolume                      # 创建卷
docker volume rm myvolume                          # 删除卷
```

## 部署配置

### GitHub Actions CI/CD

```yaml
# .github/workflows/docker.yml
name: Docker Build and Push

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata for Docker
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64

      - name: Scan image for vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: 'table'
          exit-code: '1'
          severity: 'CRITICAL,HIGH'
```

### Makefile

```makefile
# Makefile - Docker 常用命令
.PHONY: help build up down logs clean

# 变量
IMAGE_NAME := myapp
VERSION := $(shell git describe --tags --always --dirty)
REGISTRY := ghcr.io/myorg

help: ## 显示帮助信息
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

build: ## 构建镜像
	docker build -t $(IMAGE_NAME):$(VERSION) -t $(IMAGE_NAME):latest .

build-prod: ## 构建生产镜像
	docker build -f Dockerfile.prod -t $(IMAGE_NAME):$(VERSION) .

up: ## 启动开发环境
	docker-compose up -d

up-prod: ## 启动生产环境
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

down: ## 停止所有容器
	docker-compose down

logs: ## 查看日志
	docker-compose logs -f

clean: ## 清理未使用的资源
	docker system prune -af --volumes

push: ## 推送镜像到仓库
	docker tag $(IMAGE_NAME):$(VERSION) $(REGISTRY)/$(IMAGE_NAME):$(VERSION)
	docker push $(REGISTRY)/$(IMAGE_NAME):$(VERSION)

deploy: ## 部署到生产
	docker-compose -f docker-compose.prod.yml pull
	docker-compose -f docker-compose.prod.yml up -d --no-deps --build

migrate: ## 运行数据库迁移
	docker-compose exec api npm run migrate

shell: ## 进入容器
	docker-compose exec app sh

test: ## 运行测试
	docker-compose -f docker-compose.test.yml up --abort-on-container-exit

ps: ## 查看服务状态
	docker-compose ps
```

### 监控配置

```yaml
# docker-compose.monitoring.yml
version: '3.9'

services:
  prometheus:
    image: prom/prometheus:v2.48.0
    container_name: prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'

  grafana:
    image: grafana/grafana:10.2.0
    container_name: grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_INSTALL_PLUGINS=
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./grafana/datasources:/etc/grafana/provisioning/datasources:ro
    depends_on:
      - prometheus

  node-exporter:
    image: prom/node-exporter:v1.7.0
    container_name: node-exporter
    restart: unless-stopped
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.47.2
    container_name: cadvisor
    restart: unless-stopped
    ports:
      - "8081:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro

volumes:
  prometheus-data:
  grafana-data:
```

## 参考资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Docker Hub](https://hub.docker.com/)
- [Dockerfile 最佳实践](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Docker 安全最佳实践](https://docs.docker.com/engine/security/)
- [BuildKit 文档](https://docs.docker.com/build/buildkit/)
