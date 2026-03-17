# Sentry 错误监控模板

## 技术栈

- **错误监控**: Sentry SDK
- **性能监控**: Sentry Performance Monitoring
- **会话回放**: Session Replay
- **平台支持**: JavaScript, TypeScript, Node.js, Python, Go, Rust
- **集成**: React, Vue, Next.js, Express, NestJS

## 项目结构

```
project/
├── src/
│   ├── lib/
│   │   └── sentry.ts              # Sentry 初始化配置
│   ├── middleware/
│   │   └── sentryMiddleware.ts    # Express/Fastify 中间件
│   └── app.ts
├── sentry.client.config.ts        # 客户端配置（Next.js）
├── sentry.server.config.ts        # 服务端配置（Next.js）
├── sentry.edge.config.ts          # Edge 配置（Next.js）
└── .sentryclirc                   # Sentry CLI 配置
```

## 代码模式

### 基础初始化

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE,
  
  // 性能监控采样率
  tracesSampleRate: 0.1, // 生产环境 10%
  
  // 性能分析
  profilesSampleRate: 0.1,
  
  // 集成
  integrations: [
    nodeProfilingIntegration(),
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express(),
  ],
  
  // 忽略特定错误
  ignoreErrors: [
    'NetworkError',
    'Non-Error exception captured',
  ],
  
  // 过滤敏感数据
  beforeSend(event, hint) {
    if (event.request?.headers?.authorization) {
      delete event.request.headers.authorization;
    }
    return event;
  },
});
```

### Next.js 集成

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  
  // 会话回放
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### React 组件集成

```typescript
// src/components/ErrorBoundary.tsx
import React from 'react';
import * as Sentry from '@sentry/react';

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  render() {
    return this.props.children;
  }
}

// 使用 Sentry 的 ErrorBoundary
export const AppErrorBoundary = Sentry.ErrorBoundary;
```

### Express 中间件

```typescript
// src/middleware/sentryMiddleware.ts
import * as Sentry from '@sentry/node';
import { Request, Response, NextFunction } from 'express';

// 请求处理器（必须在所有中间件之前）
export const sentryRequestHandler = Sentry.Handlers.requestHandler({
  ip: true,
  user: ['id', 'username', 'email'],
});

// 错误处理器（必须在所有中间件之后）
export const sentryErrorHandler = Sentry.Handlers.errorHandler();

// 添加用户上下文
export function sentryUserContext(req: Request, res: Response, next: NextFunction) {
  if (req.user) {
    Sentry.setUser({
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
    });
  }
  next();
}

// 自定义面包屑
export function addBreadcrumb(category: string, message: string, data?: any) {
  Sentry.addBreadcrumb({
    category,
    message,
    level: 'info',
    data,
  });
}
```

### 手动捕获错误

```typescript
// 捕获异常
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}

// 捕获消息
Sentry.captureMessage('Something unusual happened', 'warning');

// 添加上下文
Sentry.setContext('character', {
  name: 'Mighty Fighter',
  level: 30,
});

// 设置标签
Sentry.setTag('page_locale', 'zh-CN');

// 添加面包屑
Sentry.addBreadcrumb({
  category: 'auth',
  message: 'User logged in',
  level: 'info',
});

// 事务追踪
const transaction = Sentry.startTransaction({
  op: 'task',
  name: 'Process Payment',
});

const span = transaction.startChild({
  op: 'db.query',
  description: 'Update user balance',
});

await updateUserBalance(userId);
span.finish();
transaction.finish();
```

### 性能监控

```typescript
// 自定义性能指标
import * as Sentry from '@sentry/nextjs';

export async function measurePerformance<T>(
  name: string,
  op: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = Sentry.startTransaction({
    name,
    op,
  });

  try {
    const result = await fn();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    Sentry.captureException(error);
    throw error;
  } finally {
    transaction.finish();
  }
}

// 使用
await measurePerformance('Fetch User Data', 'http.client', async () => {
  const response = await fetch('/api/user');
  return response.json();
});
```

## 最佳实践

### 1. 环境配置

```bash
# .env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_RELEASE=1.0.0
SENTRY_ENVIRONMENT=production
```

### 2. Source Maps 上传

```javascript
// next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(module.exports, {
  silent: true,
  org: 'your-org',
  project: 'your-project',
  sentryUrl: 'https://sentry.io',
  
  // 自动上传 source maps
  widenClientFileUpload: true,
  
  // 隐藏 source maps
  hideSourceMaps: true,
  
  // 禁用日志
  disableLogger: true,
});
```

### 3. 过滤敏感数据

```typescript
// 过滤请求头
Sentry.init({
  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers.cookie;
      delete event.request.headers.authorization;
      delete event.request.headers['x-api-key'];
    }
    
    // 过滤 POST 请求体
    if (event.request?.data) {
      const data = JSON.parse(event.request.data);
      if (data.password) data.password = '[Filtered]';
      if (data.token) data.token = '[Filtered]';
      event.request.data = JSON.stringify(data);
    }
    
    return event;
  },
});
```

### 4. 采样策略

```typescript
// 生产环境动态采样
Sentry.init({
  tracesSampleRate: (samplingContext) => {
    // 关键路由 100% 采样
    if (samplingContext.name?.includes('/checkout')) {
      return 1.0;
    }
    
    // 健康检查 0% 采样
    if (samplingContext.name?.includes('/health')) {
      return 0;
    }
    
    // 其他 10% 采样
    return 0.1;
  },
});
```

### 5. Release 追踪

```bash
# 创建 release
sentry-cli releases new -p your-project $RELEASE

# 上传 source maps
sentry-cli releases files $RELEASE upload-sourcemaps ./dist

# 部署完成
sentry-cli releases finalize $RELEASE

# 设置 commit
sentry-cli releases set-commits --auto $RELEASE
```

## 常用命令

### 安装依赖

```bash
# Node.js
npm install @sentry/node

# Next.js
npm install @sentry/nextjs

# React
npm install @sentry/react

# 性能分析
npm install @sentry/profiling-node
```

### Sentry CLI

```bash
# 登录
sentry-cli login

# 配置项目
sentry-cli info

# 上传 source maps
sentry-cli releases files <release> upload-sourcemaps ./dist

# 创建 release
sentry-cli releases new <release>

# 完成 release
sentry-cli releases finalize <release>

# 查看项目列表
sentry-cli projects list

# 发送测试事件
sentry-cli send-event -m "Test event"
```

### 调试

```bash
# 启用调试模式
SENTRY_DEBUG=1 npm start

# 测试错误捕获
curl http://localhost:3000/api/debug-sentry
```

## 部署配置

### Docker 集成

```dockerfile
# Dockerfile
FROM node:18-alpine

# 安装 Sentry CLI
RUN npm install -g @sentry/cli

# 设置环境变量
ARG SENTRY_DSN
ARG SENTRY_RELEASE
ENV SENTRY_DSN=$SENTRY_DSN
ENV SENTRY_RELEASE=$SENTRY_RELEASE

COPY . .
RUN npm ci
RUN npm run build

CMD ["npm", "start"]
```

### GitHub Actions

```yaml
# .github/workflows/sentry.yml
name: Sentry Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Create Sentry release
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: your-org
          SENTRY_PROJECT: your-project
        with:
          environment: production
          version: ${{ github.sha }}
          
      - name: Upload source maps
        run: |
          npm install
          npm run build
          sentry-cli releases files ${{ github.sha }} upload-sourcemaps ./dist
```

### Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  template:
    spec:
      containers:
      - name: app
        image: app:latest
        env:
        - name: SENTRY_DSN
          valueFrom:
            secretKeyRef:
              name: sentry-secret
              key: dsn
        - name: SENTRY_RELEASE
          value: "1.0.0"
        - name: SENTRY_ENVIRONMENT
          value: "production"
```

### Vercel 集成

```bash
# 设置环境变量
vercel env add SENTRY_DSN
vercel env add SENTRY_AUTH_TOKEN

# vercel.json
{
  "build": {
    "env": {
      "SENTRY_RELEASE": "@commit_hash"
    }
  }
}
```

## 告警规则

### 性能告警

```yaml
# 在 Sentry 项目设置中配置
- alert: High Error Rate
  condition: error rate > 1% over 5 minutes
  action: send email to team@example.com

- alert: Slow Transactions
  condition: p95 duration > 3s over 10 minutes
  action: send Slack notification
```

## 监控指标

- **错误率**: 错误数 / 总请求数
- **崩溃率**: 崩溃会话数 / 总会话数
- **P95 延迟**: 95% 的请求响应时间
- **Apdex**: 应用性能指数 (> 0.7 为良好)
- **吞吐量**: 每分钟请求数 (RPM)

## 成本优化

1. **采样率调整**: 生产环境 10%，开发环境 1%
2. **过滤无用错误**: 忽略健康检查、爬虫请求
3. **限制会话回放**: 仅在错误时记录
4. **清理旧数据**: 设置合理的保留期限
5. **分环境配置**: 不同环境使用不同采样率

## 参考资料

- [Sentry 官方文档](https://docs.sentry.io/)
- [Next.js Sentry 集成](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [性能监控最佳实践](https://docs.sentry.io/product/performance/best-practices/)
- [Sentry CLI 文档](https://docs.sentry.io/product/cli/)
