# Waku 模板

## 技术栈

### 核心技术
- **Waku**: 轻量级 React 框架
- **React 18**: Server Components
- **TypeScript**: 类型安全
- **Vite**: 构建工具

### 特性
- **Server Components**: 服务端组件
- **Client Components**: 客户端组件
- **Streaming SSR**: 流式渲染
- **File-based Routing**: 文件系统路由

### 开发工具
- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **React Query**: 数据获取（可选）

## 项目结构

```
waku-project/
├── src/
│   ├── components/
│   │   ├── Counter.tsx          # Client Component
│   │   ├── Header.tsx           # Server Component
│   │   ├── Footer.tsx           # Server Component
│   │   └── ClientOnly.tsx       # 仅客户端渲染
│   ├── pages/
│   │   ├── _layout.tsx          # 根布局
│   │   ├── index.tsx            # 首页
│   │   ├── about.tsx            # 关于页面
│   │   └── blog/
│   │       ├── index.tsx        # 博客列表
│   │       └── [slug].tsx       # 博客详情
│   ├── lib/
│   │   ├── db.ts                # 数据库
│   │   └── api.ts               # API 函数
│   ├── styles/
│   │   └── global.css
│   └── types/
│       └── index.ts
├── public/
│   └── favicon.ico
├── package.json
├── tsconfig.json
└── waku.config.ts
```

## 核心代码模式

### 1. Server Component

```tsx
// src/pages/index.tsx
import { Header } from '../components/Header'
import { Counter } from '../components/Counter'

// Server Component - 默认
export default async function HomePage() {
  // 服务端数据获取
  const posts = await fetchPosts()
  
  return (
    <div>
      <Header title="首页" />
      <main>
        <h1>欢迎来到 Waku</h1>
        <Counter /> {/* Client Component */}
        <ul>
          {posts.map(post => (
            <li key={post.id}>
              <a href={`/blog/${post.slug}`}>{post.title}</a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}

// 服务端数据获取函数
async function fetchPosts() {
  const res = await fetch('https://api.example.com/posts', {
    cache: 'no-store', // 禁用缓存
  })
  return res.json()
}
```

### 2. Client Component

```tsx
// src/components/Counter.tsx
'use client' // 标记为客户端组件

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        增加
      </button>
    </div>
  )
}
```

### 3. 布局组件

```tsx
// src/pages/_layout.tsx
import { Footer } from '../components/Footer'
import '../styles/global.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Waku App</title>
      </head>
      <body>
        <nav>
          <a href="/">首页</a>
          <a href="/about">关于</a>
          <a href="/blog">博客</a>
        </nav>
        {children}
        <Footer />
      </body>
    </html>
  )
}
```

### 4. 动态路由

```tsx
// src/pages/blog/[slug].tsx
interface Props {
  slug: string
}

export default async function BlogPost({ slug }: Props) {
  const post = await fetchPost(slug)
  
  if (!post) {
    return <div>文章未找到</div>
  }
  
  return (
    <article>
      <h1>{post.title}</h1>
      <p>发布时间: {post.date}</p>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  )
}

async function fetchPost(slug: string) {
  const res = await fetch(`https://api.example.com/posts/${slug}`)
  return res.json()
}
```

### 5. 客户端导航

```tsx
// src/components/ClientOnly.tsx
'use client'

import { useState, useEffect } from 'react'

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return null
  }
  
  return <>{children}</>
}
```

### 6. 数据获取模式

```tsx
// src/pages/blog/index.tsx
import { Suspense } from 'react'

export default function BlogPage() {
  return (
    <div>
      <h1>博客文章</h1>
      <Suspense fallback={<div>加载中...</div>}>
        <BlogList />
      </Suspense>
    </div>
  )
}

async function BlogList() {
  const posts = await fetchPosts()
  
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>
          <a href={`/blog/${post.slug}`}>{post.title}</a>
        </li>
      ))}
    </ul>
  )
}
```

### 7. API 路由

```tsx
// src/pages/api/posts.ts
import type { APIContext } from 'waku'

export async function GET({ request }: APIContext) {
  const posts = await fetchPosts()
  
  return new Response(JSON.stringify(posts), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export async function POST({ request }: APIContext) {
  const body = await request.json()
  
  // 保存文章
  const post = await savePost(body)
  
  return new Response(JSON.stringify(post), {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
```

### 8. 表单处理

```tsx
// src/pages/contact.tsx
'use client'

import { useState } from 'react'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const res = await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name, email, message }),
    })
    
    if (res.ok) {
      alert('发送成功！')
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="姓名"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="邮箱"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="消息"
      />
      <button type="submit">发送</button>
    </form>
  )
}
```

## 最佳实践

### 1. 组件拆分

```tsx
// ✅ 好的做法：将交互部分拆分为 Client Component
// Server Component
export default async function Page() {
  const data = await fetchData()
  return (
    <div>
      <StaticContent data={data} />
      <InteractiveWidget /> {/* Client Component */}
    </div>
  )
}

// ❌ 避免：整个页面都是 Client Component
'use client'
export default function Page() {
  // 失去 Server Component 的优势
}
```

### 2. 数据获取

```tsx
// ✅ 在 Server Component 中直接获取数据
export default async function Page() {
  const data = await fetch('https://api.example.com/data')
  return <div>{data}</div>
}

// ❌ 避免：在客户端获取数据（除非必要）
'use client'
export default function Page() {
  useEffect(() => {
    fetch('/api/data').then(...)
  }, [])
}
```

### 3. 使用 Suspense

```tsx
// ✅ 使用 Suspense 实现流式渲染
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<Skeleton />}>
        <SlowComponent />
      </Suspense>
    </div>
  )
}
```

### 4. 错误处理

```tsx
// src/pages/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>出错了！</h2>
      <p>{error.message}</p>
      <button onClick={reset}>重试</button>
    </div>
  )
}
```

## 常用命令

### 开发

```bash
# 启动开发服务器
pnpm dev

# 指定端口
pnpm dev --port 3001

# 构建并启动
pnpm build && pnpm start
```

### 构建

```bash
# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview

# 静态导出
pnpm build --static
```

### 其他

```bash
# 类型检查
pnpm type-check

# Lint
pnpm lint
```

## 部署配置

### 1. Vercel 部署

```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "waku"
}
```

### 2. Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["pnpm", "start"]
```

### 3. Netlify 部署

```toml
# netlify.toml
[build]
  command = "pnpm build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 4. 环境变量

```bash
# .env
DATABASE_URL=postgresql://localhost:5432/mydb
API_KEY=your-api-key
```

```tsx
// 使用环境变量
const dbUrl = process.env.DATABASE_URL
```

## Waku vs Next.js

| 特性 | Waku | Next.js |
|------|------|---------|
| 包大小 | 🟢 极小 | 🔴 较大 |
| 启动速度 | ⚡ 极快 | 🟡 中等 |
| Server Components | 🟢 支持 | 🟢 支持 |
| 学习曲线 | 🟢 简单 | 🟡 中等 |
| 生态系统 | 🟡 成长中 | 🟢 成熟 |
| 文件路由 | 🟢 支持 | 🟢 支持 |
| API 路由 | 🟢 支持 | 🟢 支持 |

## 相关资源

- [Waku 官方文档](https://waku.gg/)
- [Waku GitHub](https://github.com/dai-shi/waku)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on#react-server-components)
- [Vite 文档](https://vitejs.dev/)
