# LaunchDarkly Feature Flags 模板

## 技术栈

### 核心技术
- **LaunchDarkly**: Feature flag 管理平台
- **LaunchDarkly SDK**: 客户端和服务端 SDK
- **Feature Flags**: 功能开关系统
- **A/B Testing**: 实验和变体测试
- **TypeScript**: 类型安全

### 开发工具
- **launchdarkly-node-server-sdk**: Node.js SDK
- **launchdarkly-react-client-sdk**: React SDK
- **launchdarkly-js-client-sdk**: JavaScript SDK
- **Next.js**: 前端框架
- **Zod**: 数据验证

## 项目结构

```
launchdarkly-project/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── api/
│   │       └── flags/
│   │           └── route.ts
│   ├── lib/
│   │   ├── launchdarkly-server.ts
│   │   ├── launchdarkly-client.ts
│   │   ├── flags.ts
│   │   └── context.ts
│   ├── components/
│   │   ├── FeatureFlag.tsx
│   │   ├── ABTest.tsx
│   │   ├── FeatureGate.tsx
│   │   └── Variation.tsx
│   ├── hooks/
│   │   ├── useFlag.ts
│   │   ├── useFlags.ts
│   │   └── useExperiment.ts
│   ├── types/
│   │   └── launchdarkly.ts
│   └── middleware/
│       └── featureFlags.ts
├── scripts/
│   └── seed-flags.ts
├── .env.local
├── next.config.js
└── package.json
```

## 代码模式

### 1. 服务端 SDK 配置 (src/lib/launchdarkly-server.ts)

```typescript
import LaunchDarkly from 'launchdarkly-node-server-sdk'

// 单例客户端
let client: LaunchDarkly.LDClient | null = null

export async function getLDClient() {
  if (!client) {
    const sdkKey = process.env.LAUNCHDARKLY_SDK_KEY
    
    if (!sdkKey) {
      throw new Error('LAUNCHDARKLY_SDK_KEY is not set')
    }

    client = LaunchDarkly.init(sdkKey, {
      // 配置选项
      streamUri: 'https://stream.launchdarkly.com',
      baseUri: 'https://app.launchdarkly.com',
      eventsUri: 'https://events.launchdarkly.com',
      // 启用诊断
      diagnosticOptOut: false,
      // 日志级别
      logger: LaunchDarkly.basicLogger({
        level: 'info',
      }),
    })

    await client.waitForInitialization({ timeout: 5 })
  }

  return client
}

// 关闭客户端
export async function closeLDClient() {
  if (client) {
    await client.flush()
    await client.close()
    client = null
  }
}

// 创建用户上下文
export function createUserContext(
  userId: string,
  attributes: Record<string, any> = {}
): LaunchDarkly.LDContext {
  return {
    kind: 'user',
    key: userId,
    ...attributes,
  }
}

// 创建多上下文
export function createMultiContext(
  user: { id: string; email?: string; name?: string },
  organization?: { id: string; plan?: string }
): LaunchDarkly.LDContext {
  return {
    kind: 'multi',
    user: {
      key: user.id,
      email: user.email,
      name: user.name,
    },
    organization: organization
      ? {
          key: organization.id,
          plan: organization.plan,
        }
      : undefined,
  }
}
```

### 2. 客户端 SDK 配置 (src/lib/launchdarkly-client.ts)

```typescript
'use client'

import { asyncWithLDProvider, useFlags } from 'launchdarkly-react-client-sdk'

let LDProvider: any = null

export async function initLDProvider() {
  if (!LDProvider) {
    const clientSideID = process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID

    LDProvider = await asyncWithLDProvider({
      clientSideID,
      context: {
        kind: 'user',
        key: 'anonymous-user',
        anonymous: true,
      },
      options: {
        streaming: true,
        sendEvents: true,
        allAttributesPrivate: false,
      },
    })
  }

  return LDProvider
}

// 获取所有 flags
export function useAllFlags() {
  return useFlags()
}

// 获取单个 flag
export function useBooleanFlag(flagKey: string, defaultValue = false) {
  const flags = useFlags()
  return flags[flagKey] ?? defaultValue
}

// 获取字符串 flag
export function useStringFlag(flagKey: string, defaultValue = '') {
  const flags = useFlags()
  return flags[flagKey] ?? defaultValue
}

// 获取数字 flag
export function useNumberFlag(flagKey: string, defaultValue = 0) {
  const flags = useFlags()
  return flags[flagKey] ?? defaultValue
}

// 获取 JSON flag
export function useJsonFlag<T = any>(flagKey: string, defaultValue: T) {
  const flags = useFlags()
  return (flags[flagKey] as T) ?? defaultValue
}
```

### 3. Flag 定义 (src/lib/flags.ts)

```typescript
// 所有 Feature Flags 定义
export const FLAGS = {
  // 功能开关
  NEW_DASHBOARD: 'new-dashboard',
  DARK_MODE: 'dark-mode',
  ADVANCED_SEARCH: 'advanced-search',
  FILE_UPLOAD: 'file-upload',
  NOTIFICATION_SYSTEM: 'notification-system',
  
  // UI 变体
  HOMEPAGE_HERO_VARIANT: 'homepage-hero-variant',
  CHECKOUT_FLOW: 'checkout-flow',
  NAVIGATION_MENU: 'navigation-menu',
  
  // 性能优化
  LAZY_LOADING: 'lazy-loading',
  IMAGE_OPTIMIZATION: 'image-optimization',
  CACHE_STRATEGY: 'cache-strategy',
  
  // 实验性功能
  AI_FEATURES: 'ai-features',
  BETA_FEATURES: 'beta-features',
  
  // 后端功能
  NEW_API_ENDPOINT: 'new-api-endpoint',
  RATE_LIMITING: 'rate-limiting',
  CACHING_LAYER: 'caching-layer',
} as const

// Flag 类型
export type FlagKey = typeof FLAGS[keyof typeof FLAGS]

// Flag 默认值
export const FLAG_DEFAULTS: Record<FlagKey, any> = {
  [FLAGS.NEW_DASHBOARD]: false,
  [FLAGS.DARK_MODE]: false,
  [FLAGS.ADVANCED_SEARCH]: false,
  [FLAGS.FILE_UPLOAD]: false,
  [FLAGS.NOTIFICATION_SYSTEM]: false,
  [FLAGS.HOMEPAGE_HERO_VARIANT]: 'control',
  [FLAGS.CHECKOUT_FLOW]: 'default',
  [FLAGS.NAVIGATION_MENU]: 'standard',
  [FLAGS.LAZY_LOADING]: true,
  [FLAGS.IMAGE_OPTIMIZATION]: true,
  [FLAGS.CACHE_STRATEGY]: 'standard',
  [FLAGS.AI_FEATURES]: false,
  [FLAGS.BETA_FEATURES]: false,
  [FLAGS.NEW_API_ENDPOINT]: false,
  [FLAGS.RATE_LIMITING]: true,
  [FLAGS.CACHING_LAYER]: true,
}

// Flag 元数据
export const FLAG_METADATA: Record<FlagKey, { name: string; description: string }> = {
  [FLAGS.NEW_DASHBOARD]: {
    name: 'New Dashboard',
    description: 'Enable the redesigned dashboard interface',
  },
  [FLAGS.DARK_MODE]: {
    name: 'Dark Mode',
    description: 'Enable dark mode theme',
  },
  [FLAGS.ADVANCED_SEARCH]: {
    name: 'Advanced Search',
    description: 'Enable advanced search with filters',
  },
  [FLAGS.FILE_UPLOAD]: {
    name: 'File Upload',
    description: 'Enable file upload functionality',
  },
  [FLAGS.NOTIFICATION_SYSTEM]: {
    name: 'Notification System',
    description: 'Enable in-app notifications',
  },
  [FLAGS.HOMEPAGE_HERO_VARIANT]: {
    name: 'Homepage Hero Variant',
    description: 'A/B test different hero section designs',
  },
  [FLAGS.CHECKOUT_FLOW]: {
    name: 'Checkout Flow',
    description: 'Test different checkout flow variations',
  },
  [FLAGS.NAVIGATION_MENU]: {
    name: 'Navigation Menu',
    description: 'Test navigation menu layouts',
  },
  [FLAGS.LAZY_LOADING]: {
    name: 'Lazy Loading',
    description: 'Enable lazy loading for images and components',
  },
  [FLAGS.IMAGE_OPTIMIZATION]: {
    name: 'Image Optimization',
    description: 'Enable advanced image optimization',
  },
  [FLAGS.CACHE_STRATEGY]: {
    name: 'Cache Strategy',
    description: 'Configure caching strategy',
  },
  [FLAGS.AI_FEATURES]: {
    name: 'AI Features',
    description: 'Enable AI-powered features',
  },
  [FLAGS.BETA_FEATURES]: {
    name: 'Beta Features',
    description: 'Enable beta features for testing',
  },
  [FLAGS.NEW_API_ENDPOINT]: {
    name: 'New API Endpoint',
    description: 'Use new API endpoint architecture',
  },
  [FLAGS.RATE_LIMITING]: {
    name: 'Rate Limiting',
    description: 'Enable rate limiting on API',
  },
  [FLAGS.CACHING_LAYER]: {
    name: 'Caching Layer',
    description: 'Enable distributed caching',
  },
}
```

### 4. React Hooks (src/hooks/useFlag.ts)

```typescript
'use client'

import { useFlags, useLDClient } from 'launchdarkly-react-client-sdk'
import { useCallback, useEffect, useState } from 'react'

// 基础 hook
export function useFlag<T = boolean>(flagKey: string, defaultValue: T): T {
  const flags = useFlags()
  return (flags[flagKey] as T) ?? defaultValue
}

// 使用多个 flags
export function useFlagsArray(flagKeys: string[]): Record<string, any> {
  const flags = useFlags()
  const result: Record<string, any> = {}
  
  flagKeys.forEach((key) => {
    result[key] = flags[key]
  })
  
  return result
}

// 动态更新上下文
export function useLDContext() {
  const client = useLDClient()
  
  const identify = useCallback(
    async (context: any) => {
      if (client) {
        await client.identify(context)
      }
    },
    [client]
  )
  
  return { identify }
}

// 实验跟踪
export function useExperiment(experimentKey: string) {
  const client = useLDClient()
  const flags = useFlags()
  const [tracked, setTracked] = useState(false)
  
  const track = useCallback(
    (eventKey: string, data?: any) => {
      if (client && !tracked) {
        client.track(eventKey, data)
        setTracked(true)
      }
    },
    [client, tracked]
  )
  
  return {
    variation: flags[experimentKey],
    track,
  }
}

// Feature flag with fallback
export function useFeatureFlag(
  flagKey: string,
  options?: {
    fallback?: React.ReactNode
    loadingComponent?: React.ReactNode
  }
) {
  const [loading, setLoading] = useState(true)
  const value = useFlag(flagKey, false)
  
  useEffect(() => {
    setLoading(false)
  }, [value])
  
  return {
    value,
    loading,
    fallback: options?.fallback,
    loadingComponent: options?.loadingComponent,
  }
}
```

### 5. Feature Flag 组件 (src/components/FeatureFlag.tsx)

```typescript
'use client'

import { useFlags } from 'launchdarkly-react-client-sdk'

interface FeatureFlagProps {
  flagKey: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

// 条件渲染组件
export function FeatureFlag({ flagKey, children, fallback }: FeatureFlagProps) {
  const flags = useFlags()
  
  if (flags[flagKey]) {
    return <>{children}</>
  }
  
  return fallback ? <>{fallback}</> : null
}

// 变体组件
interface VariationProps {
  flagKey: string
  variations: Record<string, React.ReactNode>
  defaultVariation?: string
}

export function Variation({
  flagKey,
  variations,
  defaultVariation = 'control',
}: VariationProps) {
  const flags = useFlags()
  const variation = flags[flagKey] || defaultVariation
  
  return <>{variations[variation] || variations[defaultVariation]}</>
}

// Feature Gate
interface FeatureGateProps {
  flagKey: string
  children: React.ReactNode
  fallback?: React.ReactNode
  loadingComponent?: React.ReactNode
}

export function FeatureGate({
  flagKey,
  children,
  fallback,
  loadingComponent,
}: FeatureGateProps) {
  const flags = useFlags()
  
  // 检查 flag 是否已加载
  if (flags[flagKey] === undefined) {
    return loadingComponent ? <>{loadingComponent}</> : null
  }
  
  return flags[flagKey] ? <>{children}</> : fallback ? <>{fallback}</> : null
}

// A/B Test 组件
interface ABTestProps {
  flagKey: string
  experimentName: string
  control: React.ReactNode
  variants: Record<string, React.ReactNode>
  onMount?: (variation: string) => void
}

export function ABTest({
  flagKey,
  experimentName,
  control,
  variants,
  onMount,
}: ABTestProps) {
  const flags = useFlags()
  const client = useLDClient()
  const variation = flags[flagKey] || 'control'
  
  useEffect(() => {
    if (onMount) {
      onMount(variation)
    }
  }, [variation, onMount])
  
  const trackConversion = useCallback(
    (data?: any) => {
      if (client) {
        client.track(`${experimentName}-conversion`, data)
      }
    },
    [client, experimentName]
  )
  
  const content = variation === 'control' ? control : variants[variation]
  
  return (
    <div data-experiment={experimentName} data-variation={variation}>
      {typeof content === 'function' ? content(trackConversion) : content}
    </div>
  )
}
```

### 6. 服务端 API 路由 (src/app/api/flags/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getLDClient, createUserContext } from '@/lib/launchdarkly-server'
import { FLAGS, FLAG_DEFAULTS } from '@/lib/flags'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') || 'anonymous'
    
    const client = await getLDClient()
    const context = createUserContext(userId, {
      email: searchParams.get('email') || undefined,
      country: searchParams.get('country') || undefined,
    })
    
    // 获取所有 flags
    const allFlags = await client.allFlagsState(context)
    
    return NextResponse.json({
      flags: allFlags.toJSON(),
    })
  } catch (error) {
    console.error('Failed to get flags:', error)
    return NextResponse.json(
      { error: 'Failed to get flags' },
      { status: 500 }
    )
  }
}

// 获取单个 flag
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { flagKey, userId, defaultValue, contextAttributes } = body
    
    const client = await getLDClient()
    const context = createUserContext(userId, contextAttributes)
    
    const value = await client.variation(
      flagKey,
      context,
      defaultValue ?? FLAG_DEFAULTS[flagKey as keyof typeof FLAG_DEFAULTS]
    )
    
    return NextResponse.json({ value })
  } catch (error) {
    console.error('Failed to get flag:', error)
    return NextResponse.json(
      { error: 'Failed to get flag' },
      { status: 500 }
    )
  }
}
```

### 7. Dashboard 页面示例 (src/app/dashboard/page.tsx)

```typescript
import { getLDClient, createUserContext } from '@/lib/launchdarkly-server'
import { FLAGS } from '@/lib/flags'
import { cookies } from 'next/headers'

export default async function DashboardPage() {
  const userId = cookies().get('userId')?.value || 'anonymous'
  
  const client = await getLDClient()
  const context = createUserContext(userId, {
    subscription: 'premium',
    beta_tester: true,
  })
  
  // 获取 flag 值
  const showNewDashboard = await client.variation(
    FLAGS.NEW_DASHBOARD,
    context,
    false
  )
  
  const darkMode = await client.variation(
    FLAGS.DARK_MODE,
    context,
    false
  )
  
  const heroVariant = await client.variation(
    FLAGS.HOMEPAGE_HERO_VARIANT,
    context,
    'control'
  )
  
  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        {showNewDashboard ? (
          <NewDashboardContent variant={heroVariant} />
        ) : (
          <OldDashboardContent />
        )}
      </div>
    </div>
  )
}

function NewDashboardContent({ variant }: { variant: string }) {
  return (
    <div>
      <p className="text-muted-foreground mb-4">
        New Dashboard (Variant: {variant})
      </p>
      {/* 新版 dashboard 内容 */}
    </div>
  )
}

function OldDashboardContent() {
  return (
    <div>
      <p className="text-muted-foreground mb-4">Classic Dashboard</p>
      {/* 旧版 dashboard 内容 */}
    </div>
  )
}
```

### 8. 中间件 (src/middleware/featureFlags.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getLDClient, createUserContext } from '@/lib/launchdarkly-server'

export async function featureFlagsMiddleware(req: NextRequest) {
  // 跳过静态资源
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/api')
  ) {
    return NextResponse.next()
  }
  
  const userId = req.cookies.get('userId')?.value || 'anonymous'
  
  try {
    const client = await getLDClient()
    const context = createUserContext(userId, {
      ip: req.ip,
      country: req.geo?.country,
      userAgent: req.headers.get('user-agent') || undefined,
    })
    
    // 获取所有 flags
    const flags = await client.allFlagsState(context)
    
    // 将 flags 注入到请求头
    const response = NextResponse.next()
    response.headers.set('x-feature-flags', JSON.stringify(flags.toJSON()))
    
    return response
  } catch (error) {
    console.error('Feature flags middleware error:', error)
    return NextResponse.next()
  }
}
```

## 最佳实践

### 1. Flag 命名和组织
```typescript
// ✅ 使用一致的命名规范
FLAGS.NEW_DASHBOARD // 清晰的命名
FLAGS.CHECKOUT_FLOW_V2 // 版本化
FLAGS.EXPERIMENT_HERO_2024 // 实验性功能

// ✅ 按功能分类
const FEATURE_FLAGS = {
  UI: ['dark-mode', 'new-navigation'],
  BACKEND: ['new-api', 'caching-layer'],
  EXPERIMENT: ['hero-test', 'checkout-test'],
}

// ❌ 避免模糊的命名
FLAGS.FLAG_1 // 不清楚用途
FLAGS.TEMP // 临时性的命名
```

### 2. 上下文设计
```typescript
// ✅ 使用多上下文
const context = {
  kind: 'multi',
  user: {
    key: 'user-123',
    email: 'user@example.com',
    name: 'John Doe',
  },
  organization: {
    key: 'org-456',
    plan: 'enterprise',
  },
  device: {
    key: 'device-789',
    type: 'mobile',
    os: 'iOS',
  },
}

// ✅ 包含相关属性
const userContext = {
  kind: 'user',
  key: userId,
  email,
  country,
  subscription_tier,
  beta_tester,
}

// ❌ 避免敏感信息
const badContext = {
  kind: 'user',
  key: userId,
  password, // ❌ 不要包含敏感信息
  ssn, // ❌ 不要包含 PII
}
```

### 3. 实验设计
```typescript
// ✅ 清晰的实验设置
const experiment = {
  key: 'checkout-flow-test',
  name: 'Checkout Flow Optimization',
  variations: {
    control: { value: 'default', name: 'Current Flow' },
    treatment_a: { value: 'simplified', name: 'Simplified Flow' },
    treatment_b: { value: 'one-page', name: 'One-Page Checkout' },
  },
  targeting: {
    attribute: 'country',
    values: ['US', 'CA'],
  },
  metrics: ['conversion-rate', 'time-to-complete'],
}

// ✅ 跟踪转化
function CheckoutButton() {
  const { variation, track } = useExperiment('checkout-flow-test')
  
  const handleClick = () => {
    track('checkout-started')
    // 处理点击
  }
  
  return <button onClick={handleClick}>Checkout</button>
}
```

### 4. 错误处理
```typescript
// ✅ 优雅降级
export async function getFlag(flagKey: string, userId: string) {
  try {
    const client = await getLDClient()
    const context = createUserContext(userId)
    return await client.variation(flagKey, context, FLAG_DEFAULTS[flagKey])
  } catch (error) {
    console.error('Failed to get flag:', error)
    return FLAG_DEFAULTS[flagKey]
  }
}

// ✅ 使用 React Error Boundary
<ErrorBoundary fallback={<FallbackComponent />}>
  <FeatureFlag flagKey="new-feature">
    <NewFeature />
  </FeatureFlag>
</ErrorBoundary>
```

### 5. 性能优化
```typescript
// ✅ 批量获取 flags
const allFlags = await client.allFlagsState(context)
const flags = allFlags.toJSON()

// ✅ 缓存 flags
const flagsCache = new Map<string, any>()

export async function getCachedFlag(flagKey: string, context: any) {
  const cacheKey = `${flagKey}:${context.key}`
  
  if (flagsCache.has(cacheKey)) {
    return flagsCache.get(cacheKey)
  }
  
  const value = await client.variation(flagKey, context, false)
  flagsCache.set(cacheKey, value)
  
  return value
}

// ✅ 客户端使用流式更新
const LDProvider = await asyncWithLDProvider({
  clientSideID,
  options: {
    streaming: true, // 实时更新
  },
})
```

## 常用命令

### LaunchDarkly CLI
```bash
# 安装 CLI
npm install -g launchdarkly-cli

# 登录
ld login

# 列出所有 flags
ld flags list

# 创建 flag
ld flags create --key new-feature --name "New Feature"

# 更新 flag
ld flags update new-feature --on

# 删除 flag
ld flags delete new-feature

# 查看实验
ld experiments list
```

### 开发命令
```bash
# 启动开发服务器
npm run dev

# 构建
npm run build

# 类型检查
npm run type-check

# 运行测试
npm run test
```

## 部署配置

### 环境变量
```bash
# .env.local
LAUNCHDARKLY_SDK_KEY=sdk-xxx # 服务端 SDK Key
NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID=xxx # 客户端 ID
LAUNCHDARKLY_MOBILE_KEY=xxx # 移动端 Key
```

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID: process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID,
  },
  // 服务端环境变量
  serverRuntimeConfig: {
    LAUNCHDARKLY_SDK_KEY: process.env.LAUNCHDARKLY_SDK_KEY,
  },
}

module.exports = nextConfig
```

### Webhook 配置
```typescript
// app/api/webhooks/launchdarkly/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-ld-signature')
  const body = await req.json()
  
  // 验证签名
  // if (!verifySignature(signature, body)) {
  //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  // }
  
  // 处理 webhook 事件
  const { kind, data } = body
  
  if (kind === 'flag') {
    // Flag 更新
    console.log('Flag updated:', data.key)
    // 清除缓存
    clearFlagsCache()
  }
  
  return NextResponse.json({ received: true })
}
```

### Vercel 部署
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "env": {
    "LAUNCHDARKLY_SDK_KEY": "@launchdarkly-sdk-key",
    "NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID": "@launchdarkly-client-id"
  }
}
```

## 扩展资源

- [LaunchDarkly 官方文档](https://docs.launchdarkly.com/)
- [JavaScript SDK](https://docs.launchdarkly.com/sdk/client-side/javascript)
- [Node.js SDK](https://docs.launchdarkly.com/sdk/server-side/nodejs)
- [React SDK](https://docs.launchdarkly.com/sdk/client-side/react)
- [Best Practices](https://docs.launchdarkly.com/guides/best-practices)
- [Experimentation](https://docs.launchdarkly.com/home/creating-experiments)
