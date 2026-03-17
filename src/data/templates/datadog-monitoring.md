# Datadog Monitoring 模板

## 技术栈

### 核心技术
- **Datadog**: 全栈监控平台
- **APM**: 应用性能监控
- **Logs**: 日志管理
- **Metrics**: 指标收集
- **Tracing**: 分布式追踪

### 开发工具
- **dd-trace**: Node.js APM SDK
- **@datadog/datadog-api-client**: API 客户端
- **winston**: 日志框架
- **Next.js**: 前端框架
- **TypeScript**: 类型安全

## 项目结构

```
datadog-project/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/
│   │       ├── users/
│   │       │   └── route.ts
│   │       └── health/
│   │           └── route.ts
│   ├── lib/
│   │   ├── datadog.ts
│   │   ├── logger.ts
│   │   ├── metrics.ts
│   │   └── tracing.ts
│   ├── components/
│   │   └── ErrorBoundary.tsx
│   ├── middleware/
│   │   └── monitoring.ts
│   └── instrumentation/
│       └── datadog-init.ts
├── dashboards/
│   ├── application.json
│   ├── infrastructure.json
│   └── errors.json
├── monitors/
│   ├── high-error-rate.json
│   ├── latency.json
│   └── database.json
├── scripts/
│   └── deploy-monitors.ts
├── .env.local
├── datadog.yaml
├── next.config.js
└── package.json
```

## 代码模式

### 1. Datadog 初始化 (src/lib/datadog.ts)

```typescript
import tracer from 'dd-trace'
import { statsD } from './metrics'
import { logger } from './logger'

// 初始化 APM
tracer.init({
  service: process.env.DD_SERVICE || 'my-app',
  env: process.env.DD_ENV || process.env.NODE_ENV,
  version: process.env.DD_VERSION || process.env.npm_package_version,
  
  // 采样率配置
  sampleRate: parseFloat(process.env.DD_TRACE_SAMPLE_RATE || '1.0'),
  
  // 启用集成
  plugins: {
    express: true,
    http: true,
    graphql: true,
    mongodb: true,
    redis: true,
    pg: true,
  },
  
  // 日志配置
  logLevel: process.env.DD_LOG_LEVEL || 'info',
  logger: {
    debug: (message) => logger.debug(message),
    info: (message) => logger.info(message),
    warn: (message) => logger.warn(message),
    error: (message) => logger.error(message),
  },
  
  // 运行时指标
  runtimeMetrics: true,
})

// 导出 tracer
export const trace = tracer

// 获取当前 span
export function getCurrentSpan() {
  return tracer.scope().active()
}

// 创建自定义 span
export function createSpan(name: string, options?: any) {
  return tracer.startSpan(name, options)
}
```

### 2. 日志配置 (src/lib/logger.ts)

```typescript
import winston from 'winston'
import Transport from 'winston-transport'
import { trace } from './datadog'

// Datadog 日志传输
class DatadogTransport extends Transport {
  private apiKey: string
  private endpoint: string

  constructor(opts: any) {
    super(opts)
    this.apiKey = opts.apiKey
    this.endpoint = opts.endpoint || 'https://http-intake.logs.datadoghq.com/v1/input'
  }

  async log(info: any, callback: () => void) {
    const span = trace.scope().active()
    
    const logEntry = {
      ...info,
      dd: {
        trace_id: span?.context().toTraceId(),
        span_id: span?.context().toSpanId(),
      },
      service: process.env.DD_SERVICE,
      env: process.env.DD_ENV,
    }

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': this.apiKey,
        },
        body: JSON.stringify(logEntry),
      })
    } catch (error) {
      console.error('Failed to send log to Datadog:', error)
    }

    callback()
  }
}

// 创建 logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.DD_SERVICE,
    env: process.env.DD_ENV,
    version: process.env.DD_VERSION,
  },
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    
    // Datadog 传输
    process.env.DD_API_KEY
      ? new DatadogTransport({
          apiKey: process.env.DD_API_KEY,
        })
      : null,
  ].filter(Boolean) as winston.transport[],
})

// 便捷方法
export function logInfo(message: string, meta?: any) {
  logger.info(message, meta)
}

export function logError(message: string, error?: Error, meta?: any) {
  logger.error(message, { error: error?.message, stack: error?.stack, ...meta })
}

export function logWarn(message: string, meta?: any) {
  logger.warn(message, meta)
}

export function logDebug(message: string, meta?: any) {
  logger.debug(message, meta)
}
```

### 3. 指标收集 (src/lib/metrics.ts)

```typescript
import StatsD from 'hot-shots'

// StatsD 客户端
export const statsD = new StatsD({
  host: process.env.DD_AGENT_HOST || 'localhost',
  port: parseInt(process.env.DD_DOGSTATSD_PORT || '8125'),
  prefix: process.env.DD_SERVICE || 'my-app',
  globalTags: {
    env: process.env.DD_ENV || process.env.NODE_ENV,
    version: process.env.DD_VERSION || '1.0.0',
  },
})

// 指标类型
export type MetricTag = Record<string, string | number>

// 计数器
export function incrementCounter(metric: string, value = 1, tags?: MetricTag) {
  statsD.increment(metric, value, tags)
}

// 计量器
export function gaugeValue(metric: string, value: number, tags?: MetricTag) {
  statsD.gauge(metric, value, tags)
}

// 直方图
export function histogram(metric: string, value: number, tags?: MetricTag) {
  statsD.histogram(metric, value, tags)
}

// 计时器
export function timing(metric: string, duration: number, tags?: MetricTag) {
  statsD.timing(metric, duration, tags)
}

// 分布
export function distribution(metric: string, value: number, tags?: MetricTag) {
  statsD.distribution(metric, value, tags)
}

// 装饰器：自动测量函数执行时间
export function measure(metricName: string, tags?: MetricTag) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const start = Date.now()
      try {
        const result = await originalMethod.apply(this, args)
        timing(`${metricName}.duration`, Date.now() - start, tags)
        incrementCounter(`${metricName}.success`, 1, tags)
        return result
      } catch (error) {
        timing(`${metricName}.duration`, Date.now() - start, tags)
        incrementCounter(`${metricName}.error`, 1, tags)
        throw error
      }
    }

    return descriptor
  }
}

// 业务指标
export const businessMetrics = {
  // 用户注册
  userSignup: (method: string) => {
    incrementCounter('user.signup', 1, { method })
  },

  // 订单创建
  orderCreated: (amount: number, currency: string) => {
    incrementCounter('order.created', 1, { currency })
    gaugeValue('order.amount', amount, { currency })
  },

  // 支付成功
  paymentSuccess: (amount: number, paymentMethod: string) => {
    incrementCounter('payment.success', 1, { payment_method: paymentMethod })
    histogram('payment.amount', amount, { payment_method: paymentMethod })
  },

  // API 调用
  apiCall: (endpoint: string, statusCode: number, duration: number) => {
    incrementCounter('api.call', 1, { endpoint, status_code: statusCode.toString() })
    timing('api.duration', duration, { endpoint })
  },

  // 缓存命中
  cacheHit: (cacheName: string) => {
    incrementCounter('cache.hit', 1, { cache: cacheName })
  },

  cacheMiss: (cacheName: string) => {
    incrementCounter('cache.miss', 1, { cache: cacheName })
  },

  // 数据库查询
  dbQuery: (query: string, duration: number) => {
    timing('db.query.duration', duration, { query })
  },
}
```

### 4. 分布式追踪 (src/lib/tracing.ts)

```typescript
import { trace, getCurrentSpan } from './datadog'
import { logger } from './logger'

// 追踪函数
export async function traced<T>(
  name: string,
  fn: () => Promise<T>,
  options?: {
    resource?: string
    type?: string
    tags?: Record<string, string>
  }
): Promise<T> {
  const span = trace.startSpan(name, {
    resource: options?.resource,
    type: options?.type,
    tags: options?.tags,
  })

  try {
    const result = await fn()
    span.finish()
    return result
  } catch (error: any) {
    span.setTag('error', error)
    span.setTag('error.message', error.message)
    span.setTag('error.stack', error.stack)
    span.finish()
    throw error
  }
}

// 追踪数据库查询
export async function traceQuery<T>(
  queryName: string,
  query: string,
  fn: () => Promise<T>
): Promise<T> {
  return traced(`db.query.${queryName}`, fn, {
    resource: query,
    type: 'db',
    tags: { query_name: queryName },
  })
}

// 追踪外部 API 调用
export async function traceHttpCall<T>(
  url: string,
  method: string,
  fn: () => Promise<T>
): Promise<T> {
  return traced(`http.request`, fn, {
    resource: `${method} ${url}`,
    type: 'web',
    tags: { url, method },
  })
}

// 添加 span 标签
export function addSpanTag(key: string, value: string | number) {
  const span = getCurrentSpan()
  if (span) {
    span.setTag(key, value)
  }
}

// 添加 span 错误
export function addSpanError(error: Error) {
  const span = getCurrentSpan()
  if (span) {
    span.setTag('error', error)
    span.setTag('error.message', error.message)
    span.setTag('error.stack', error.stack)
  }
}

// 设置用户信息
export function setUserContext(userId: string, email?: string, name?: string) {
  const span = getCurrentSpan()
  if (span) {
    span.setTag('user.id', userId)
    if (email) span.setTag('user.email', email)
    if (name) span.setTag('user.name', name)
  }
}

// 追踪中间件
export function tracingMiddleware(req: any, res: any, next: any) {
  const span = trace.startSpan('web.request', {
    resource: `${req.method} ${req.path}`,
    type: 'web',
  })

  // 添加请求信息
  span.setTag('http.method', req.method)
  span.setTag('http.url', req.url)
  span.setTag('http.route', req.route?.path)
  span.setTag('http.useragent', req.headers['user-agent'])
  span.setTag('http.remote_addr', req.ip)

  // 响应完成时结束 span
  res.on('finish', () => {
    span.setTag('http.status_code', res.statusCode)
    if (res.statusCode >= 400) {
      span.setTag('error', true)
    }
    span.finish()
  })

  next()
}
```

### 5. API 路由示例 (src/app/api/users/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { traced, addSpanTag, setUserContext } from '@/lib/tracing'
import { incrementCounter, timing } from '@/lib/metrics'
import { logInfo, logError } from '@/lib/logger'
import { db } from '@/lib/database'

export async function GET(req: NextRequest) {
  const start = Date.now()
  
  try {
    const result = await traced('api.users.list', async () => {
      // 设置用户上下文
      const userId = req.headers.get('x-user-id')
      if (userId) {
        setUserContext(userId)
      }
      
      addSpanTag('endpoint', '/api/users')
      addSpanTag('method', 'GET')
      
      // 获取查询参数
      const { searchParams } = new URL(req.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')
      
      addSpanTag('page', page)
      addSpanTag('limit', limit)
      
      // 查询数据库
      const users = await traced('db.query.users', async () => {
        return db.user.findMany({
          skip: (page - 1) * limit,
          take: limit,
        })
      })
      
      logInfo('Users fetched successfully', { page, limit, count: users.length })
      
      return { users, page, limit }
    })
    
    // 记录指标
    const duration = Date.now() - start
    incrementCounter('api.users.list.success')
    timing('api.users.list.duration', duration)
    
    return NextResponse.json(result)
  } catch (error: any) {
    // 记录错误
    logError('Failed to fetch users', error)
    incrementCounter('api.users.list.error')
    
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const start = Date.now()
  
  try {
    const body = await req.json()
    
    const result = await traced('api.users.create', async () => {
      addSpanTag('endpoint', '/api/users')
      addSpanTag('method', 'POST')
      
      // 创建用户
      const user = await traced('db.query.user.create', async () => {
        return db.user.create({
          data: {
            email: body.email,
            name: body.name,
          },
        })
      })
      
      // 设置用户上下文
      setUserContext(user.id, user.email, user.name)
      
      logInfo('User created successfully', { userId: user.id, email: user.email })
      
      return { user }
    })
    
    // 记录指标
    const duration = Date.now() - start
    incrementCounter('api.users.create.success')
    timing('api.users.create.duration', duration)
    
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    logError('Failed to create user', error)
    incrementCounter('api.users.create.error')
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
```

### 6. 健康检查 (src/app/api/health/route.ts)

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { redis } from '@/lib/redis'

export async function GET() {
  const checks = {
    database: false,
    redis: false,
    datadog: false,
  }

  try {
    // 检查数据库连接
    await db.$queryRaw`SELECT 1`
    checks.database = true
  } catch (error) {
    console.error('Database health check failed:', error)
  }

  try {
    // 检查 Redis 连接
    await redis.ping()
    checks.redis = true
  } catch (error) {
    console.error('Redis health check failed:', error)
  }

  // 检查 Datadog Agent
  checks.datadog = process.env.DD_AGENT_HOST ? true : false

  const allHealthy = Object.values(checks).every((v) => v)

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  )
}
```

### 7. Error Boundary (src/components/ErrorBoundary.tsx)

```typescript
'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { logError } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误到 Datadog
    logError('React Error Boundary', error, {
      componentStack: errorInfo.componentStack,
    })

    // 发送到 Datadog RUM
    if (typeof window !== 'undefined' && (window as any).DD_RUM) {
      ;(window as any).DD_RUM.addError(error, {
        componentStack: errorInfo.componentStack,
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-screen">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <button
              className="px-4 py-2 bg-primary text-white rounded"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
```

### 8. 监控配置文件 (datadog.yaml)

```yaml
# Datadog Agent 配置示例
# 通常用于服务器上的 Datadog Agent，而非应用代码

# API Key
api_key: ${DD_API_KEY}

# Site
site: datadoghq.com

# Tags
tags:
  - env:${DD_ENV}
  - service:${DD_SERVICE}
  - version:${DD_VERSION}

# APM 配置
apm_config:
  enabled: true
  env: ${DD_ENV}
  receiver_port: 8126

# Log 配置
logs_enabled: true
logs_config:
  container_collect_all: true

# Process 监控
process_config:
  enabled: true

# 基础设施
infrastructure_config:
  enabled: true

# Network
network_config:
  enabled: true

# StatsD
dogstatsd_port: 8125
dogstatsd_non_local_traffic: true
```

## 最佳实践

### 1. 指标命名
```typescript
// ✅ 使用清晰的命名规范
incrementCounter('user.signup', 1, { method: 'email' })
incrementCounter('order.created', 1, { currency: 'USD' })
timing('api.duration', 100, { endpoint: '/users' })

// ✅ 使用命名空间
incrementCounter('app.payment.success')
incrementCounter('app.payment.failed')

// ❌ 避免模糊的命名
incrementCounter('counter1') // 不清楚用途
incrementCounter('metric') // 太通用
```

### 2. 追踪策略
```typescript
// ✅ 追踪关键业务逻辑
await traced('payment.process', async () => {
  // 处理支付
})

// ✅ 追踪外部依赖
await traceHttpCall('https://api.stripe.com/v1/charges', 'POST', async () => {
  // 调用 Stripe API
})

// ✅ 追踪数据库操作
await traceQuery('findUser', 'SELECT * FROM users WHERE id = ?', async () => {
  // 查询数据库
})

// ❌ 避免过度追踪
await traced('loop.iteration', async () => {
  // 每次循环都追踪会生成大量数据
})
```

### 3. 日志管理
```typescript
// ✅ 结构化日志
logInfo('User logged in', {
  userId: user.id,
  email: user.email,
  ip: req.ip,
})

// ✅ 错误日志包含上下文
logError('Payment failed', error, {
  orderId: order.id,
  amount: order.amount,
  currency: order.currency,
})

// ❌ 避免敏感信息
logInfo('User data', {
  password: user.password, // ❌ 不要记录密码
  ssn: user.ssn, // ❌ 不要记录 PII
})
```

### 4. 告警配置
```typescript
// ✅ 关键指标告警
const monitor = {
  name: 'High Error Rate',
  type: 'metric alert',
  query: 'avg(last_5m):sum:api.error{service:my-app} > 10',
  message: 'Error rate is too high. Check logs for details.',
  priority: 1,
  tags: ['service:my-app', 'env:production'],
}

// ✅ 延迟告警
const latencyMonitor = {
  name: 'High Latency',
  type: 'metric alert',
  query: 'avg(last_5m):trace.http.request{service:my-app} > 1000',
  message: 'P95 latency is above 1s.',
  priority: 2,
}

// ✅ 数据库连接告警
const dbMonitor = {
  name: 'Database Connection Pool',
  type: 'metric alert',
  query: 'avg(last_5m):db.connection.pool{service:my-app} > 80',
  message: 'Database connection pool is running low.',
  priority: 2,
}
```

### 5. Dashboard 组织
```typescript
// ✅ 按功能组织 Dashboard
const dashboards = {
  application: {
    title: 'Application Overview',
    widgets: [
      { type: 'timeseries', query: 'avg:api.request{service:my-app}' },
      { type: 'timeseries', query: 'avg:api.error{service:my-app}' },
      { type: 'query_value', query: 'avg:api.latency{service:my-app}' },
    ],
  },
  
  infrastructure: {
    title: 'Infrastructure Metrics',
    widgets: [
      { type: 'timeseries', query: 'avg:system.cpu{service:my-app}' },
      { type: 'timeseries', query: 'avg:system.memory{service:my-app}' },
    ],
  },
  
  business: {
    title: 'Business Metrics',
    widgets: [
      { type: 'query_value', query: 'sum:user.signup{service:my-app}' },
      { type: 'query_value', query: 'sum:order.created{service:my-app}' },
    ],
  },
}
```

## 常用命令

### Datadog CLI
```bash
# 安装 CLI
pip install datadog

# 配置 API Key
export DD_API_KEY=your-api-key
export DD_APP_KEY=your-app-key

# 查询指标
datadog metric query "avg:system.cpu{*}"

# 发送指标
datadog metric send test.metric 1 --tags env:prod

# 创建 monitor
datadog monitor create --name "High Error Rate" --type "metric alert" --query "avg(last_5m):sum:api.error{*} > 10"

# 查看事件
datadog event stream --priority all
```

### 开发命令
```bash
# 启动开发服务器
npm run dev

# 构建
npm run build

# 运行测试
npm run test

# 类型检查
npm run type-check
```

## 部署配置

### 环境变量
```bash
# .env.local
DD_API_KEY=xxx
DD_APP_KEY=xxx
DD_SITE=datadoghq.com
DD_SERVICE=my-app
DD_ENV=production
DD_VERSION=1.0.0
DD_TRACE_SAMPLE_RATE=1.0
DD_LOG_LEVEL=info
DD_AGENT_HOST=localhost
DD_DOGSTATSD_PORT=8125
```

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true, // 启用 instrumentation hook
  },
  env: {
    DD_SERVICE: process.env.DD_SERVICE,
    DD_ENV: process.env.DD_ENV,
    DD_VERSION: process.env.DD_VERSION,
  },
}

module.exports = nextConfig
```

### Vercel 部署
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "env": {
    "DD_API_KEY": "@datadog-api-key",
    "DD_APP_KEY": "@datadog-app-key",
    "DD_SERVICE": "my-app",
    "DD_ENV": "production"
  }
}
```

### Docker 部署
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV DD_SERVICE=my-app
ENV DD_ENV=production

CMD ["node", "-r", "dd-trace/init", "server.js"]
```

## 扩展资源

- [Datadog 官方文档](https://docs.datadoghq.com/)
- [Node.js APM](https://docs.datadoghq.com/tracing/setup_overview/setup/nodejs/)
- [Metrics](https://docs.datadoghq.com/metrics/)
- [Logs](https://docs.datadoghq.com/logs/)
- [Dashboards](https://docs.datadoghq.com/dashboards/)
- [Monitors](https://docs.datadoghq.com/monitors/)
- [APM Best Practices](https://docs.datadoghq.com/tracing/guide/)
