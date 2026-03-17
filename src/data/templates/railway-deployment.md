# Railway 部署平台模板

## 技术栈

- **平台**: Railway.app
- **部署方式**: Git Push / CLI / Docker
- **数据库**: PostgreSQL, MySQL, Redis, MongoDB
- **环境管理**: Railway Variables
- **监控**: Railway Metrics & Logs
- **CI/CD**: GitHub Actions / GitLab CI

## 项目结构

```
project/
├── src/
│   ├── index.ts              # 入口文件
│   ├── app.ts                # 应用逻辑
│   └── config/
│       └── database.ts       # 数据库配置
├── prisma/
│   └── schema.prisma         # 数据库 Schema
├── railway/
│   ├── railway.toml          # Railway 配置
│   └── Dockerfile            # Docker 配置（可选）
├── .github/
│   └── workflows/
│       └── railway.yml       # CI/CD 配置
├── .env.example              # 环境变量示例
├── package.json
└── railway.json              # Railway 项目配置
```

## 代码模式

### 1. Railway 配置文件

```toml
# railway.toml
[build]
builder = "nixpacks"  # 或 "heroku", "dockerfile"

[build.nixpacks]
# Nixpacks 配置
aptPkgs = ["postgresql-client"]

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

# 环境变量
[variables]
NODE_ENV = "production"
PORT = "3000"

# 自定义域名
[[domains]]
name = "myapp.example.com"
```

### 2. 项目配置

```json
// railway.json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "restartPolicyType": "on_failure",
    "restartPolicyMaxRetries": 3
  }
}
```

### 3. 健康检查端点

```typescript
// src/routes/health.ts
import { Router } from 'express';
import { prisma } from '@/config/database';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed',
    });
  }
});

export default router;
```

### 4. 数据库配置

```typescript
// src/config/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Railway 自动重连
prisma.$on('error', (e) => {
  console.error('Prisma Client Error:', e);
});

export { prisma };

// src/config/redis.ts
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis connection failed after 10 retries');
        return new Error('Redis connection failed');
      }
      // 指数退避
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis connected'));

await redisClient.connect();

export { redisClient };
```

### 5. 环境变量管理

```typescript
// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Node 环境
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  
  // 数据库
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  
  // 认证
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // 第三方服务
  SENDGRID_API_KEY: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  
  // Railway 特定
  RAILWAY_STATIC_URL: z.string().optional(),
  RAILWAY_PUBLIC_DOMAIN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  
  return parsed.data;
}

export const env = validateEnv();
```

### 6. Dockerfile（可选）

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# 安装依赖
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# 生产阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 express

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER express

EXPOSE 3000

ENV PORT=3000

CMD ["npm", "start"]
```

### 7. CI/CD 配置

```yaml
# .github/workflows/railway.yml
name: Railway Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Type check
        run: npm run type-check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Railway CLI
        run: npm i -g @railway/cli
      
      - name: Deploy to Railway
        run: railway up --service ${{ secrets.RAILWAY_SERVICE_ID }}
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 8. 多服务架构

```yaml
# railway-compose.yaml
services:
  # Web 应用
  web:
    source: .
    build:
      builder: nixpacks
    deploy:
      startCommand: npm start
      healthcheckPath: /health
    variables:
      NODE_ENV: production
    domains:
      - myapp.example.com

  # 后台任务
  worker:
    source: .
    build:
      builder: nixpacks
    deploy:
      startCommand: npm run worker
    variables:
      NODE_ENV: production

  # 定时任务
  cron:
    source: .
    build:
      builder: nixpacks
    deploy:
      startCommand: npm run cron
      schedule: "0 */6 * * *"  # 每6小时运行一次
    variables:
      NODE_ENV: production

  # 数据库
  database:
    source: postgresql
    variables:
      POSTGRES_DB: myapp
      POSTGRES_USER: myapp

  # 缓存
  redis:
    source: redis
```

### 9. 监控与日志

```typescript
// src/utils/logger.ts
import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// 结构化日志
export function logWithContext(
  level: string,
  message: string,
  context: Record<string, any> = {}
) {
  logger.log(level, message, {
    ...context,
    service: process.env.RAILWAY_SERVICE_NAME,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}

// 使用示例
logWithContext('info', 'User logged in', {
  userId: '123',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0',
});
```

### 10. 自动扩展配置

```typescript
// src/app.ts
import express from 'express';
import cluster from 'cluster';
import os from 'os';

const numCPUs = os.cpus().length;

if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
  console.log(`Master ${process.pid} is running`);
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  const app = express();
  
  // 中间件
  app.use(express.json());
  
  // 路由
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', pid: process.pid });
  });
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} listening on port ${PORT}`);
  });
}
```

## 最佳实践

### 1. 环境变量管理

```bash
# ✅ 使用 Railway CLI 设置
railway variables set JWT_SECRET=my-secret-key

# ✅ 从 .env 文件导入
railway variables import .env

# ✅ 引用其他服务的变量
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}

# ❌ 避免硬编码敏感信息
DATABASE_URL=postgres://user:password@host:5432/db
```

### 2. 数据库迁移

```json
// package.json
{
  "scripts": {
    "build": "prisma generate && tsc",
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "prestart": "npm run db:migrate",
    "start": "node dist/index.js"
  }
}
```

### 3. 健康检查

```typescript
// ✅ 全面的健康检查
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  };
  
  const isHealthy = Object.values(checks).every(c => c.status === 'ok');
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  });
});
```

### 4. 日志管理

```typescript
// ✅ 结构化日志
console.log(JSON.stringify({
  level: 'info',
  message: 'Request received',
  method: req.method,
  path: req.path,
  userId: req.user?.id,
  timestamp: new Date().toISOString(),
}));

// ✅ 错误日志
console.error(JSON.stringify({
  level: 'error',
  message: 'Database error',
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString(),
}));
```

### 5. 资源管理

```typescript
// ✅ 优雅关闭
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing server gracefully...');
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  
  // 关闭数据库连接
  await prisma.$disconnect();
  await redisClient.quit();
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
```

## 常用命令

```bash
# 安装 CLI
npm i -g @railway/cli

# 登录
railway login

# 初始化项目
railway init

# 链接现有项目
railway link

# 本地开发（使用 Railway 环境变量）
railway run npm run dev

# 部署
railway up

# 查看日志
railway logs

# 查看变量
railway variables

# 设置变量
railway variables set KEY=value

# 打开数据库 CLI
railway connect postgres

# 状态检查
railway status

# 打开 Railway Dashboard
railway open
```

## 部署配置

### 环境变量模板

```bash
# .env.example
# Node 环境
NODE_ENV=production
PORT=3000

# 数据库
DATABASE_URL=postgresql://user:password@host:5432/db
REDIS_URL=redis://host:6379

# 认证
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# 第三方服务
SENDGRID_API_KEY=sg.xxx
AWS_ACCESS_KEY_ID=AKIAxxx
AWS_SECRET_ACCESS_KEY=xxx

# 监控
SENTRY_DSN=https://xxx@sentry.io/xxx
LOG_LEVEL=info

# Railway 特定
RAILWAY_STATIC_URL=https://xxx.railway.app
RAILWAY_PUBLIC_DOMAIN=myapp.example.com
```

### 部署检查清单

- [ ] 设置所有必需的环境变量
- [ ] 配置健康检查端点
- [ ] 数据库迁移脚本
- [ ] 日志格式配置
- [ ] 错误监控（Sentry）
- [ ] 性能监控
- [ ] 自定义域名配置
- [ ] SSL 证书（自动）
- [ ] 自动重启策略
- [ ] 备份策略

## 监控配置

### Railway Metrics

```typescript
// Railway 自动提供以下指标：
// - CPU 使用率
// - 内存使用率
// - 网络流量
// - 响应时间
// - 错误率

// 自定义指标
import { collectDefaultMetrics, Registry, Counter } from 'prom-client';

const register = new Registry();
collectDefaultMetrics({ register });

const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

// 暴露指标端点
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## 扩展资源

- [Railway 官方文档](https://docs.railway.app/)
- [Railway CLI 文档](https://docs.railway.app/develop/cli)
- [数据库集成](https://docs.railway.app/databases)
- [环境变量](https://docs.railway.app/develop/variables)
- [监控指南](https://docs.railway.app/monitoring)
- [最佳实践](https://docs.railway.app/guides/best-practices)
- [定价](https://railway.app/pricing)
