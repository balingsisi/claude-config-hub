# Clerk 认证服务模板

## 技术栈

### 核心技术
- **Clerk**: 现代化用户管理和认证平台
- **@clerk/nextjs**: Next.js 集成
- **@clerk/react**: React 集成
- **@clerk/backend**: 后端 SDK

### 认证功能
- **多因素认证 (MFA)**: SMS、TOTP、备用码
- **社交登录**: Google、GitHub、Apple、Facebook 等
- **邮箱/密码**: 传统认证
- **Magic Links**: 无密码登录
- **Web3 认证**: MetaMask、Coinbase Wallet

### 配套工具
- **TypeScript**: 类型安全
- **Next.js App Router**: 服务端组件支持
- **Prisma**: 数据库 ORM
- **Zod**: 模式验证

## 项目结构

```
clerk-auth-project/
├── src/
│   ├── app/
│   │   ├── (auth)/                    # 认证相关路由组
│   │   │   ├── sign-in/
│   │   │   │   └── page.tsx
│   │   │   ├── sign-up/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (protected)/               # 受保护路由组
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── security/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   └── clerk/
│   │   │   │       └── route.ts       # Clerk Webhooks
│   │   │   └── users/
│   │   │       └── route.ts
│   │   ├── layout.tsx                 # 根布局
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── auth/
│   │   │   ├── sign-in-form.tsx
│   │   │   ├── sign-up-form.tsx
│   │   │   ├── social-buttons.tsx
│   │   │   └── password-strength.tsx
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── user-button.tsx
│   │   │   └── mobile-menu.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       └── card.tsx
│   ├── lib/
│   │   ├── clerk.ts                   # Clerk 配置
│   │   ├── prisma.ts                  # Prisma 客户端
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── use-user.ts                # 用户状态钩子
│   │   └── use-session.ts             # 会话钩子
│   ├── types/
│   │   ├── user.types.ts
│   │   └── api.types.ts
│   └── middleware.ts                  # Clerk 中间件
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env.local
├── middleware.ts
├── next.config.js
└── package.json
```

## 代码模式

### 1. 基础配置

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
])

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/settings(.*)",
  "/api/users(.*)",
])

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect()
  }
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
```

```typescript
// app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#3b82f6",
        },
      }}
    >
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

### 2. 认证页面

```typescript
// app/(auth)/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        appearance={{
          elements: {
            formButtonPrimary: "bg-blue-500 hover:bg-blue-600",
            card: "shadow-none",
          },
        }}
      />
    </div>
  )
}
```

```typescript
// app/(auth)/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        appearance={{
          elements: {
            formButtonPrimary: "bg-blue-500 hover:bg-blue-600",
          },
        }}
      />
    </div>
  )
}
```

### 3. 用户组件

```typescript
// components/layout/user-button.tsx
"use client"

import { UserButton, useUser } from "@clerk/nextjs"
import { Skeleton } from "@/components/ui/skeleton"

export function UserMenu() {
  const { isSignedIn, isLoaded } = useUser()

  if (!isLoaded) {
    return <Skeleton className="h-10 w-10 rounded-full" />
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <a href="/sign-in" className="text-sm font-medium">
          Sign In
        </a>
        <a
          href="/sign-up"
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white"
        >
          Sign Up
        </a>
      </div>
    )
  }

  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "h-10 w-10",
        },
      }}
      afterSignOutUrl="/"
    >
      <UserButton.MenuItems>
        <UserButton.Link
          label="Dashboard"
          href="/dashboard"
          labelIcon={<LayoutDashboardIcon className="h-4 w-4" />}
        />
        <UserButton.Link
          label="Settings"
          href="/settings"
          labelIcon={<SettingsIcon className="h-4 w-4" />}
        />
      </UserButton.MenuItems>
    </UserButton>
  )
}
```

### 4. 受保护路由

```typescript
// app/(protected)/layout.tsx
import { auth, redirectToSignIn } from "@clerk/nextjs/server"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()

  if (!userId) {
    return redirectToSignIn()
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        {/* Header content */}
      </header>
      <main className="container py-6">{children}</main>
    </div>
  )
}
```

```typescript
// app/(protected)/dashboard/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const { userId } = auth()
  const user = await currentUser()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        Welcome back, {user?.firstName || "User"}!
      </h1>
      <div className="grid gap-4 md:grid-cols-3">
        {/* Dashboard content */}
      </div>
    </div>
  )
}
```

### 5. API 路由保护

```typescript
// app/api/users/route.ts
import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await currentUser()
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  return NextResponse.json({
    user: {
      id: user?.id,
      email: user?.emailAddresses[0].emailAddress,
      name: `${user?.firstName} ${user?.lastName}`,
      ...dbUser,
    },
  })
}

export async function POST(req: Request) {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  // 更新用户数据
  const updatedUser = await prisma.user.update({
    where: { clerkId: userId },
    data: body,
  })

  return NextResponse.json(updatedUser)
}
```

### 6. Webhooks 处理

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from "svix"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const headerPayload = headers()
  const svixId = headerPayload.get("svix-id")
  const svixTimestamp = headerPayload.get("svix-timestamp")
  const svixSignature = headerPayload.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing headers" }, { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(webhookSecret)
  let evt: any

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    })
  } catch (err) {
    console.error("Webhook verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const eventType = evt.type

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data

    await prisma.user.create({
      data: {
        clerkId: id,
        email: email_addresses[0].email_address,
        firstName: first_name,
        lastName: last_name,
        imageUrl: image_url,
      },
    })
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name } = evt.data

    await prisma.user.update({
      where: { clerkId: id },
      data: {
        email: email_addresses[0].email_address,
        firstName: first_name,
        lastName: last_name,
      },
    })
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data

    await prisma.user.delete({
      where: { clerkId: id },
    })
  }

  return NextResponse.json({ success: true })
}
```

### 7. 自定义用户资料

```typescript
// app/(protected)/settings/profile/page.tsx
"use client"

import { useUser } from "@clerk/nextjs"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const [isUpdating, setIsUpdating] = useState(false)

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    username: user?.username || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    try {
      await user?.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
      })
    } catch (error) {
      console.error("Failed to update profile:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!isLoaded) return <div>Loading...</div>

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Profile Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />
        </div>

        <Button type="submit" disabled={isUpdating}>
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  )
}
```

### 8. 角色和权限

```typescript
// lib/auth.ts
import { auth, clerkClient } from "@clerk/nextjs/server"

export type Role = "admin" | "user" | "moderator"

export async function getCurrentUser() {
  const { userId } = auth()
  if (!userId) return null

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  
  const role = user.publicMetadata.role as Role || "user"

  return {
    id: userId,
    email: user.emailAddresses[0].emailAddress,
    role,
    isAdmin: role === "admin",
    isModerator: role === "moderator" || role === "admin",
  }
}

export async function requireRole(role: Role) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  if (user.role !== role && user.role !== "admin") {
    throw new Error("Forbidden")
  }

  return user
}

// 使用示例
// app/admin/page.tsx
import { requireRole } from "@/lib/auth"

export default async function AdminPage() {
  await requireRole("admin")

  return <div>Admin Dashboard</div>
}
```

### 9. 组织和多租户

```typescript
// lib/organizations.ts
import { auth, clerkClient } from "@clerk/nextjs/server"

export async function getCurrentOrganization() {
  const { orgId, orgRole } = auth()

  if (!orgId) return null

  const client = await clerkClient()
  const org = await client.organizations.getOrganization({
    organizationId: orgId,
  })

  return {
    id: orgId,
    name: org.name,
    slug: org.slug,
    role: orgRole,
    isAdmin: orgRole === "org:admin",
  }
}

// 使用组织中间件
// middleware.ts
export default clerkMiddleware((auth, req) => {
  // 要求用户在组织中
  const { orgId } = auth()
  
  if (req.nextUrl.pathname.startsWith("/team") && !orgId) {
    return NextResponse.redirect(new URL("/select-org", req.url))
  }
})
```

## 最佳实践

### 1. 会话管理
```typescript
// ✅ 使用服务端组件获取用户
export default async function Page() {
  const { userId } = auth()
  const user = await currentUser()

  if (!userId) {
    redirect("/sign-in")
  }
}

// ✅ 使用客户端钩子
"use client"
import { useUser, useClerk } from "@clerk/nextjs"

export function MyComponent() {
  const { user, isLoaded } = useUser()
  const { openSignIn } = useClerk()

  if (!isLoaded) return <div>Loading...</div>

  if (!user) {
    return <button onClick={() => openSignIn()}>Sign In</button>
  }
}

// ❌ 避免在客户端组件中使用 auth()
```

### 2. 安全实践
```typescript
// ✅ 使用中间件保护路由
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"])
export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect()
  }
})

// ✅ API 路由验证
export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // ...
}

// ✅ 验证 Webhook 签名
const wh = new Webhook(webhookSecret)
const evt = wh.verify(body, headers)
```

### 3. 数据库同步
```typescript
// ✅ 使用 Webhooks 同步用户数据
// user.created -> 创建本地用户记录
// user.updated -> 更新本地用户记录
// user.deleted -> 删除本地用户记录

// ✅ 使用事务确保一致性
await prisma.$transaction([
  prisma.user.create({ data: userData }),
  prisma.auditLog.create({ data: logData }),
])

// ✅ 处理重复创建
try {
  await prisma.user.create({ data: userData })
} catch (error) {
  if (error.code === "P2002") {
    // 已存在，更新
    await prisma.user.update({
      where: { clerkId: userId },
      data: userData,
    })
  }
}
```

### 4. 错误处理
```typescript
// ✅ 捕获认证错误
import { clerkClient } from "@clerk/nextjs/server"

try {
  const user = await clerkClient.users.getUser(userId)
} catch (error) {
  if (error.status === 404) {
    // 用户不存在
  }
  console.error("Failed to fetch user:", error)
}

// ✅ 处理 Webhook 错误
try {
  const evt = wh.verify(body, headers)
} catch (error) {
  console.error("Webhook verification failed:", error)
  return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
}
```

### 5. 性能优化
```typescript
// ✅ 缓存用户数据
import { unstable_cache } from "next/cache"

export const getCurrentUser = unstable_cache(
  async () => {
    const { userId } = auth()
    if (!userId) return null
    // ...
  },
  ["current-user"],
  { revalidate: 60 }
)

// ✅ 预加载关键数据
export default async function Layout({ children }) {
  const user = await getCurrentUser() // 预加载
  return <div>{children}</div>
}
```

### 6. 测试
```typescript
// ✅ 模拟认证状态
import { auth, currentUser } from "@clerk/nextjs/server"

jest.mock("@clerk/nextjs/server")

auth.mockReturnValue({ userId: "user_123" })
currentUser.mockReturnValue({
  id: "user_123",
  emailAddresses: [{ emailAddress: "test@example.com" }],
})

// ✅ 测试受保护路由
it("redirects unauthenticated users", async () => {
  auth.mockReturnValue({ userId: null })
  
  const response = await GET()
  expect(response.status).toBe(401)
})
```

## 常用命令

### 安装
```bash
# Next.js
npm install @clerk/nextjs

# React
npm install @clerk/clerk-react

# 后端
npm install @clerk/backend

# Webhook 验证
npm install svix
```

### 环境变量
```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### CLI 命令
```bash
# 创建新应用
npx create-next-app@latest --typescript --tailwind

# 安装 Clerk
npx @clerk/clerk-cli@latest

# 同步用户
npx @clerk/clerk-cli users sync
```

## 部署配置

### Vercel 部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod

# 设置环境变量
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
```

### Docker 部署
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

### 环境配置
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
}

module.exports = nextConfig
```

### Prisma Schema
```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  firstName String?
  lastName  String?
  imageUrl  String?
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([clerkId])
}
```

## 扩展资源

- [Clerk 官方文档](https://clerk.com/docs)
- [Next.js 集成指南](https://clerk.com/docs/quickstarts/nextjs)
- [React 集成指南](https://clerk.com/docs/quickstarts/react)
- [Webhooks 指南](https://clerk.com/docs/integrations/webhooks)
- [组织管理](https://clerk.com/docs/organizations/overview)
- [自定义流程](https://clerk.com/docs/custom-flows/overview)
- [示例项目](https://github.com/clerkinc/clerk-nextjs-starter)
- [Discord 社区](https://discord.com/invite/b5rXHjAg7A)
