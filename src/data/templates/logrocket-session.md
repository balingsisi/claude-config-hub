# LogRocket Session Replay 模板

## 技术栈

### 核心技术
- **LogRocket**: 前端会话回放和监控平台
- **Session Replay**: 用户会话录像
- **Error Tracking**: 错误追踪
- **Performance Monitoring**: 性能监控
- **Analytics**: 用户行为分析

### 开发工具
- **logrocket**: JavaScript SDK
- **logrocket-react**: React 集成
- **@logrocket/react**: React 组件
- **Next.js**: 前端框架
- **TypeScript**: 类型安全

## 项目结构

```
logrocket-project/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── dashboard/
│   │       └── page.tsx
│   ├── lib/
│   │   ├── logrocket.ts
│   │   ├── analytics.ts
│   │   ├── errorTracking.ts
│   │   └── performance.ts
│   ├── components/
│   │   ├── ErrorBoundary.tsx
│   │   ├── TrackingProvider.tsx
│   │   └── PerformanceMonitor.tsx
│   ├── hooks/
│   │   ├── useTracking.ts
│   │   ├── useSessionRecording.ts
│   │   └── useErrorReporting.ts
│   ├── types/
│   │   └── logrocket.ts
│   └── middleware/
│       └── logging.ts
├── scripts/
│   └── setup-logrocket.ts
├── .env.local
├── next.config.js
└── package.json
```

## 代码模式

### 1. LogRocket 初始化 (src/lib/logrocket.ts)

```typescript
import LogRocket from 'logrocket'
import setupLogRocketReact from 'logrocket-react'

// 初始化配置
export function initLogRocket() {
  if (typeof window === 'undefined') return

  const appId = process.env.NEXT_PUBLIC_LOGROCKET_APP_ID
  if (!appId) {
    console.warn('LogRocket app ID not configured')
    return
  }

  // 初始化 LogRocket
  LogRocket.init(appId, {
    // 基础配置
    release: process.env.npm_package_version,
    console: {
      isEnabled: {
        log: true,
        info: true,
        warn: true,
        error: true,
      },
    },
    
    // DOM 录制配置
    dom: {
      enabled: true,
      baseHref: window.location.origin,
      inputSanitizer: true, // 自动脱敏输入字段
    },
    
    // 网络配置
    network: {
      enabled: true,
      requestSanitizer: (request) => {
        // 脱敏敏感数据
        if (request.url.includes('/api/auth')) {
          request.body = '[REDACTED]'
        }
        if (request.headers['authorization']) {
          request.headers['authorization'] = '[REDACTED]'
        }
        return request
      },
      responseSanitizer: (response) => {
        // 脱敏响应数据
        if (response.url.includes('/api/user')) {
          try {
            const body = JSON.parse(response.body)
            if (body.password) body.password = '[REDACTED]'
            if (body.ssn) body.ssn = '[REDACTED]'
            response.body = JSON.stringify(body)
          } catch (e) {}
        }
        return response
      },
    },
    
    // 性能监控
    shouldCaptureIP: true,
    shouldDebugPerformance: process.env.NODE_ENV === 'development',
  })

  // React 集成
  setupLogRocketReact(LogRocket)

  console.log('LogRocket initialized')
}

// 识别用户
export function identifyUser(
  userId: string,
  userInfo?: {
    name?: string
    email?: string
    subscription?: string
    [key: string]: any
  }
) {
  if (typeof window === 'undefined') return

  LogRocket.identify(userId, {
    name: userInfo?.name || '',
    email: userInfo?.email || '',
    subscription: userInfo?.subscription || 'free',
    ...userInfo,
  })

  console.log('User identified:', userId)
}

// 创建会话 URL
export function getSessionURL(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Not in browser environment'))
      return
    }

    LogRocket.getSessionURL((url) => {
      resolve(url)
    })
  })
}

// 追踪事件
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return

  LogRocket.track(eventName, properties || {})
}

// 追踪错误
export function trackError(error: Error, extra?: Record<string, any>) {
  if (typeof window === 'undefined') return

  LogRocket.captureException(error, {
    extra: extra || {},
  })
}

// 添加面包屑
export function addBreadcrumb(message: string, category?: string, data?: any) {
  if (typeof window === 'undefined') return

  LogRocket.captureMessage(message, {
    extra: {
      category,
      data,
    },
  })
}
```

### 2. 分析工具集成 (src/lib/analytics.ts)

```typescript
import LogRocket from 'logrocket'

// Google Analytics 集成
export function initGoogleAnalytics() {
  // LogRocket + Google Analytics
  LogRocket.getSessionURL((sessionURL) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'LogRocket Session', {
        event_category: 'LogRocket',
        event_label: sessionURL,
      })
    }
  })
}

// Mixpanel 集成
export function initMixpanel() {
  if (typeof window === 'undefined') return

  LogRocket.getSessionURL((sessionURL) => {
    if ((window as any).mixpanel) {
      ;(window as any).mixpanel.track('LogRocket Session', {
        sessionURL,
      })
    }
  })
}

// Intercom 集成
export function initIntercom() {
  if (typeof window === 'undefined') return

  LogRocket.getSessionURL((sessionURL) => {
    if ((window as any).Intercom) {
      ;(window as any).Intercom('trackEvent', 'logrocket-session', {
        sessionURL,
      })
    }
  })
}

// Zendesk 集成
export function initZendesk() {
  if (typeof window === 'undefined') return

  LogRocket.getSessionURL((sessionURL) => {
    if ((window as any).zE) {
      ;(window as any).zE('webWidget', 'prefill', {
        customFields: [
          {
            id: 'logrocket_session_url',
            value: sessionURL,
          },
        ],
      })
    }
  })
}

// 全面的分析集成
export function initAnalyticsIntegrations() {
  if (typeof window === 'undefined') return

  // 等待 LogRocket 初始化
  setTimeout(() => {
    initGoogleAnalytics()
    initMixpanel()
    initIntercom()
    initZendesk()
  }, 1000)
}
```

### 3. 错误追踪 (src/lib/errorTracking.ts)

```typescript
import LogRocket from 'logrocket'
import * as Sentry from '@sentry/nextjs'

// 初始化错误追踪
export function initErrorTracking() {
  if (typeof window === 'undefined') return

  // LogRocket + Sentry 集成
  LogRocket.getSessionURL((sessionURL) => {
    Sentry.configureScope((scope) => {
      scope.setExtra('sessionURL', sessionURL)
    })
  })
}

// 追踪 JavaScript 错误
export function trackJSError(error: Error, errorInfo?: any) {
  // 发送到 LogRocket
  LogRocket.captureException(error, {
    extra: errorInfo,
    tags: {
      type: 'javascript_error',
    },
  })

  // 发送到 Sentry
  Sentry.captureException(error, {
    extra: errorInfo,
  })
}

// 追踪网络错误
export function trackNetworkError(
  url: string,
  statusCode: number,
  errorMessage: string
) {
  LogRocket.captureMessage(`Network Error: ${url}`, {
    extra: {
      url,
      statusCode,
      errorMessage,
    },
    tags: {
      type: 'network_error',
    },
  })
}

// 追踪 Promise 拒绝
export function trackPromiseRejection(event: PromiseRejectionEvent) {
  const error = event.reason instanceof Error 
    ? event.reason 
    : new Error(String(event.reason))

  LogRocket.captureException(error, {
    extra: {
      type: 'unhandled_promise_rejection',
    },
  })
}

// 追踪资源加载错误
export function trackResourceError(event: Event) {
  const target = event.target as HTMLElement
  
  LogRocket.captureMessage('Resource Load Error', {
    extra: {
      tagName: target.tagName,
      src: (target as any).src || (target as any).href,
    },
    tags: {
      type: 'resource_error',
    },
  })
}

// 全局错误处理器
export function setupGlobalErrorHandlers() {
  if (typeof window === 'undefined') return

  // JavaScript 错误
  window.onerror = (message, source, lineno, colno, error) => {
    trackJSError(error || new Error(String(message)), {
      source,
      lineno,
      colno,
    })
  }

  // Promise 拒绝
  window.addEventListener('unhandledrejection', trackPromiseRejection)

  // 资源加载错误
  window.addEventListener('error', trackResourceError, true)
}
```

### 4. 性能监控 (src/lib/performance.ts)

```typescript
import LogRocket from 'logrocket'

// 性能指标类型
interface PerformanceMetrics {
  pageLoadTime: number
  domContentLoaded: number
  firstPaint: number
  firstContentfulPaint: number
  timeToInteractive: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
}

// 收集性能指标
export function collectPerformanceMetrics(): PerformanceMetrics | null {
  if (typeof window === 'undefined') return null

  const timing = performance.timing
  const paintEntries = performance.getEntriesByType('paint')
  const navigationEntries = performance.getEntriesByType('navigation')

  // 计算 Page Load Time
  const pageLoadTime = timing.loadEventEnd - timing.navigationStart

  // DOM Content Loaded
  const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart

  // First Paint
  const firstPaint = paintEntries.find((entry) => entry.name === 'first-paint')?.startTime || 0

  // First Contentful Paint
  const firstContentfulPaint =
    paintEntries.find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0

  // Time to Interactive
  const timeToInteractive = navigationEntries[0]
    ? (navigationEntries[0] as any).domInteractive
    : 0

  // Largest Contentful Paint
  let largestContentfulPaint = 0
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      largestContentfulPaint = lastEntry.startTime
    })
    observer.observe({ type: 'largest-contentful-paint', buffered: true })
  }

  // Cumulative Layout Shift
  let cumulativeLayoutShift = 0
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          cumulativeLayoutShift += (entry as any).value
        }
      }
    })
    observer.observe({ type: 'layout-shift', buffered: true })
  }

  // First Input Delay
  let firstInputDelay = 0
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        firstInputDelay = (entry as any).processingStart - entry.startTime
      }
    })
    observer.observe({ type: 'first-input', buffered: true })
  }

  return {
    pageLoadTime,
    domContentLoaded,
    firstPaint,
    firstContentfulPaint,
    timeToInteractive,
    largestContentfulPaint,
    cumulativeLayoutShift,
    firstInputDelay,
  }
}

// 追踪性能指标
export function trackPerformanceMetrics() {
  if (typeof window === 'undefined') return

  // 页面加载完成后收集
  window.addEventListener('load', () => {
    setTimeout(() => {
      const metrics = collectPerformanceMetrics()
      if (metrics) {
        LogRocket.track('Performance Metrics', metrics)

        // 发送到分析平台
        if ((window as any).gtag) {
          ;(window as any).gtag('event', 'timing_complete', {
            name: 'load',
            value: metrics.pageLoadTime,
            event_category: 'Performance',
          })
        }
      }
    }, 0)
  })
}

// 追踪自定义性能标记
export function trackPerformanceMark(name: string, startTime?: number) {
  if (typeof window === 'undefined') return

  const markName = `custom_${name}`
  performance.mark(markName)

  const entries = performance.getEntriesByName(markName)
  const duration = entries[0]?.startTime || startTime || 0

  LogRocket.track(`Performance Mark: ${name}`, {
    duration,
    timestamp: Date.now(),
  })
}

// 追踪资源加载
export function trackResourceLoading() {
  if (typeof window === 'undefined') return

  const resources = performance.getEntriesByType('resource')

  resources.forEach((resource) => {
    LogRocket.track('Resource Loaded', {
      name: (resource as any).name,
      duration: resource.duration,
      size: (resource as any).transferSize,
      type: (resource as any).initiatorType,
    })
  })
}
```

### 5. React Hooks (src/hooks/useTracking.ts)

```typescript
'use client'

import { useEffect, useCallback, useState } from 'react'
import {
  trackEvent,
  identifyUser,
  getSessionURL,
  trackError,
  addBreadcrumb,
} from '@/lib/logrocket'

// 使用追踪 Hook
export function useTracking() {
  const [sessionURL, setSessionURL] = useState<string>('')

  // 获取会话 URL
  useEffect(() => {
    getSessionURL()
      .then((url) => setSessionURL(url))
      .catch((error) => console.error('Failed to get session URL:', error))
  }, [])

  // 追踪事件
  const track = useCallback((eventName: string, properties?: Record<string, any>) => {
    trackEvent(eventName, properties)
  }, [])

  // 识别用户
  const identify = useCallback(
    (userId: string, userInfo?: Record<string, any>) => {
      identifyUser(userId, userInfo)
    },
    []
  )

  // 追踪错误
  const trackException = useCallback((error: Error, extra?: Record<string, any>) => {
    trackError(error, extra)
  }, [])

  // 添加面包屑
  const addCrumb = useCallback((message: string, category?: string, data?: any) => {
    addBreadcrumb(message, category, data)
  }, [])

  return {
    sessionURL,
    track,
    identify,
    trackException,
    addCrumb,
  }
}

// 会话录制控制 Hook
export function useSessionRecording() {
  const [isRecording, setIsRecording] = useState(true)

  // 暂停录制
  const pauseRecording = useCallback(() => {
    // LogRocket 暂不支持动态暂停/恢复
    // 但可以通过其他方式控制
    setIsRecording(false)
  }, [])

  // 恢复录制
  const resumeRecording = useCallback(() => {
    setIsRecording(true)
  }, [])

  return {
    isRecording,
    pauseRecording,
    resumeRecording,
  }
}

// 错误报告 Hook
export function useErrorReporting() {
  const reportError = useCallback((error: Error, context?: Record<string, any>) => {
    trackError(error, context)

    // 也可以发送到其他错误追踪服务
    if (process.env.NODE_ENV === 'production') {
      // 发送到服务器
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
        }),
      }).catch((e) => console.error('Failed to report error:', e))
    }
  }, [])

  return { reportError }
}
```

### 6. React 组件 (src/components/TrackingProvider.tsx)

```typescript
'use client'

import { useEffect, ReactNode } from 'react'
import { initLogRocket, initAnalyticsIntegrations } from '@/lib/logrocket'
import { initErrorTracking, setupGlobalErrorHandlers } from '@/lib/errorTracking'
import { trackPerformanceMetrics } from '@/lib/performance'

interface TrackingProviderProps {
  children: ReactNode
  userId?: string
  userInfo?: Record<string, any>
}

export function TrackingProvider({
  children,
  userId,
  userInfo,
}: TrackingProviderProps) {
  useEffect(() => {
    // 初始化 LogRocket
    initLogRocket()

    // 初始化错误追踪
    initErrorTracking()
    setupGlobalErrorHandlers()

    // 初始化性能监控
    trackPerformanceMetrics()

    // 初始化分析集成
    initAnalyticsIntegrations()

    // 识别用户
    if (userId) {
      const { identifyUser } = require('@/lib/logrocket')
      identifyUser(userId, userInfo)
    }
  }, [userId, userInfo])

  return <>{children}</>
}

// Performance Monitor Component
export function PerformanceMonitor() {
  useEffect(() => {
    // 监控长任务
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            // 长任务阈值 50ms
            console.warn('Long task detected:', entry)
          }
        }
      })
      observer.observe({ type: 'longtask', buffered: true })

      return () => observer.disconnect()
    }
  }, [])

  return null
}
```

### 7. API 路由集成 (src/app/api/users/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // 获取 LogRocket 会话 URL（从请求头）
    const logrocketSession = req.headers.get('x-logrocket-session')
    
    // 创建用户
    const user = await db.user.create({
      data: {
        email: body.email,
        name: body.name,
      },
    })
    
    // 返回用户数据和会话 URL
    return NextResponse.json({
      user,
      logrocketSession,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create user:', error)
    
    // 如果有 LogRocket 会话，记录到错误日志
    const logrocketSession = req.headers.get('x-logrocket-session')
    if (logrocketSession) {
      console.error('LogRocket Session:', logrocketSession)
    }
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
```

### 8. Dashboard 页面示例 (src/app/dashboard/page.tsx)

```typescript
'use client'

import { useTracking } from '@/hooks/useTracking'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const { track, sessionURL } = useTracking()
  const [metrics, setMetrics] = useState<any>({})

  useEffect(() => {
    // 追踪页面访问
    track('page_view', {
      page: 'dashboard',
      timestamp: Date.now(),
    })

    // 收集性能指标
    const collectMetrics = () => {
      const timing = performance.timing
      setMetrics({
        pageLoadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      })
    }

    window.addEventListener('load', collectMetrics)
    return () => window.removeEventListener('load', collectMetrics)
  }, [track])

  const handleButtonClick = () => {
    // 追踪按钮点击
    track('button_click', {
      button: 'dashboard_action',
      timestamp: Date.now(),
    })

    // 执行操作
    console.log('Button clicked')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* 会话信息 */}
      <div className="bg-muted p-4 rounded-lg mb-6">
        <p className="text-sm text-muted-foreground mb-2">
          <strong>Session URL:</strong>{' '}
          <a href={sessionURL} target="_blank" rel="noopener noreferrer" className="text-primary">
            {sessionURL || 'Loading...'}
          </a>
        </p>
      </div>

      {/* 性能指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Page Load Time</p>
          <p className="text-2xl font-bold">{metrics.pageLoadTime || 0}ms</p>
        </div>
        <div className="bg-card p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">DOM Content Loaded</p>
          <p className="text-2xl font-bold">{metrics.domContentLoaded || 0}ms</p>
        </div>
      </div>

      {/* 操作按钮 */}
      <button
        onClick={handleButtonClick}
        className="px-4 py-2 bg-primary text-white rounded hover:opacity-90"
      >
        Perform Action
      </button>
    </div>
  )
}
```

## 最佳实践

### 1. 隐私和合规
```typescript
// ✅ 脱敏敏感数据
LogRocket.init(appId, {
  network: {
    requestSanitizer: (request) => {
      // 脱敏密码字段
      if (request.body) {
        const body = JSON.parse(request.body)
        if (body.password) body.password = '[REDACTED]'
        request.body = JSON.stringify(body)
      }
      return request
    },
  },
})

// ✅ 遵守用户偏好
if (userConsent) {
  initLogRocket()
}

// ✅ GDPR 合规
const shouldTrack = window.localStorage.getItem('analytics-consent') === 'true'
if (shouldTrack) {
  initLogRocket()
}
```

### 2. 性能优化
```typescript
// ✅ 延迟加载非关键功能
setTimeout(() => {
  initAnalyticsIntegrations()
}, 2000)

// ✅ 条件性启用功能
if (process.env.NODE_ENV === 'production') {
  LogRocket.init(appId, {
    dom: {
      enabled: true,
    },
  })
} else {
  // 开发环境禁用 DOM 录制
  LogRocket.init(appId, {
    dom: {
      enabled: false,
    },
  })
}

// ✅ 采样率控制
const shouldRecord = Math.random() < 0.1 // 10% 采样率
if (shouldRecord) {
  initLogRocket()
}
```

### 3. 错误处理
```typescript
// ✅ 全面的错误捕获
window.addEventListener('error', (event) => {
  trackError(event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  })
})

// ✅ Promise 拒绝处理
window.addEventListener('unhandledrejection', (event) => {
  trackError(new Error(event.reason), {
    type: 'unhandled_promise_rejection',
  })
})

// ✅ React Error Boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    trackError(error, {
      componentStack: errorInfo.componentStack,
    })
  }
}
```

### 4. 会话管理
```typescript
// ✅ 用户识别
identifyUser(user.id, {
  name: user.name,
  email: user.email,
  subscription: user.subscription,
})

// ✅ 会话 URL 共享
LogRocket.getSessionURL((sessionURL) => {
  // 发送到支持系统
  supportTicket.sessionURL = sessionURL

  // 发送到 Slack
  sendToSlack(`User session: ${sessionURL}`)
})

// ✅ 会话标记
LogRocket.track('checkout_started', {
  cartValue: cart.total,
  itemCount: cart.items.length,
})
```

### 5. 集成策略
```typescript
// ✅ 多工具集成
initLogRocket()

// 集成 Sentry
initErrorTracking()

// 集成分析工具
initAnalyticsIntegrations()

// ✅ 统一错误处理
function reportError(error: Error, context?: any) {
  // LogRocket
  LogRocket.captureException(error, { extra: context })
  
  // Sentry
  Sentry.captureException(error, { extra: context })
  
  // 自定义错误追踪
  fetch('/api/errors', {
    method: 'POST',
    body: JSON.stringify({ error, context }),
  })
}
```

## 常用命令

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

### LogRocket Dashboard
```bash
# 访问 LogRocket Dashboard
https://app.logrocket.com/

# 查看会话
https://app.logrocket.com/[app-id]/sessions

# 查看错误
https://app.logrocket.com/[app-id]/errors
```

## 部署配置

### 环境变量
```bash
# .env.local
NEXT_PUBLIC_LOGROCKET_APP_ID=your-app-id
LOGROCKET_APP_SECRET=your-app-secret
```

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_LOGROCKET_APP_ID: process.env.NEXT_PUBLIC_LOGROCKET_APP_ID,
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
    "NEXT_PUBLIC_LOGROCKET_APP_ID": "@logrocket-app-id"
  }
}
```

### 客户支持集成
```typescript
// 在客户支持表单中包含会话 URL
const supportForm = {
  email: user.email,
  message: supportMessage,
  logrocketSession: await getSessionURL(),
}

// 提交到支持系统
await submitSupportTicket(supportForm)
```

## 扩展资源

- [LogRocket 官方文档](https://docs.logrocket.com/)
- [React Integration](https://docs.logrocket.com/docs/react)
- [Session Recording](https://docs.logrocket.com/docs/session-recording)
- [Error Tracking](https://docs.logrocket.com/docs/error-tracking)
- [Performance Monitoring](https://docs.logrocket.com/docs/performance)
- [Privacy & Security](https://docs.logrocket.com/docs/privacy-and-security)
- [Integrations](https://docs.logrocket.com/docs/integrations)
