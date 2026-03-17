# Keycloak 认证模板

## 技术栈

### 核心技术
- **Keycloak**: 开源身份和访问管理平台
- **OpenID Connect (OIDC)**: 认证协议
- **OAuth 2.0**: 授权框架
- **next-auth / Auth.js**: Next.js 认证集成

### 开发工具
- **keycloak-js**: Keycloak JavaScript 适配器
- **@react-keycloak/web**: React 集成
- **node-fetch**: API 请求
- **TypeScript**: 类型安全

## 项目结构

```
keycloak-project/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts      # NextAuth 配置
│   │   │   └── keycloak/
│   │   │       ├── users/
│   │   │       │   └── route.ts      # 用户管理 API
│   │   │       └── roles/
│   │   │           └── route.ts      # 角色管理 API
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── callback/
│   │   │   │   └── page.tsx
│   │   │   └── logout/
│   │   │       └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginButton.tsx
│   │   │   ├── LogoutButton.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── RoleGuard.tsx
│   │   └── provider/
│   │       └── AuthProvider.tsx
│   ├── lib/
│   │   ├── keycloak.ts               # Keycloak 客户端
│   │   ├── keycloak-admin.ts         # Admin API 客户端
│   │   └── auth-config.ts            # 认证配置
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useRoles.ts
│   │   └── usePermissions.ts
│   ├── types/
│   │   └── keycloak.ts
│   └── middleware.ts                 # 路由保护
├── keycloak/
│   ├── realm-export.json             # Realm 导出
│   └── docker-compose.yml            # 本地开发配置
├── next.config.js
├── package.json
└── .env.local
```

## 代码模式

### 1. Keycloak 客户端配置 (lib/keycloak.ts)

```typescript
import Keycloak from 'keycloak-js'

const keycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL!,
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM!,
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID!,
}

export const keycloak = new Keycloak(keycloakConfig)

// 初始化选项
export const keycloakInitOptions: Keycloak.KeycloakInitOptions = {
  onLoad: 'check-sso',
  silentCheckSsoRedirectUri:
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/silent-check-sso.html`
      : undefined,
  pkceMethod: 'S256',
  checkLoginIframe: false,
  enableLogging: true,
}

// Token 刷新管理
export async function initKeycloak() {
  try {
    const authenticated = await keycloak.init(keycloakInitOptions)

    if (authenticated) {
      // 自动刷新 token
      keycloak.onAuthRefresh = () => {
        console.log('Token refreshed')
      }

      keycloak.onAuthRefreshError = () => {
        console.error('Failed to refresh token')
        keycloak.login()
      }

      keycloak.onAuthLogout = () => {
        console.log('User logged out')
        window.location.reload()
      }
    }

    return authenticated
  } catch (error) {
    console.error('Failed to initialize Keycloak:', error)
    return false
  }
}

// 获取用户信息
export async function getUserProfile() {
  try {
    const profile = await keycloak.loadUserProfile()
    return profile
  } catch (error) {
    console.error('Failed to load user profile:', error)
    return null
  }
}

// 检查角色
export function hasRole(role: string): boolean {
  return keycloak.hasRealmRole(role)
}

// 检查资源角色
export function hasResourceRole(role: string, resource?: string): boolean {
  return keycloak.hasResourceRole(role, resource)
}
```

### 2. NextAuth 集成 (app/api/auth/[...nextauth]/route.ts)

```typescript
import NextAuth, { NextAuthOptions } from 'next-auth'
import KeycloakProvider from 'next-auth/providers/keycloak'

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
      authorization: {
        params: {
          scope: 'openid email profile roles',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // 首次登录保存 token
      if (account && profile) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        token.roles = (profile as any).realm_access?.roles || []
      }

      // 检查 token 是否过期
      if (token.expiresAt && Date.now() >= (token.expiresAt as number) * 1000) {
        try {
          const refreshedToken = await refreshAccessToken(token)
          return refreshedToken
        } catch (error) {
          console.error('Failed to refresh token:', error)
          return { ...token, error: 'RefreshAccessTokenError' }
        }
      }

      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.roles = token.roles as string[]
      session.error = token.error as string | undefined
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// 刷新 Access Token
async function refreshAccessToken(token: any) {
  const response = await fetch(
    `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string,
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
      }),
    }
  )

  const refreshedTokens = await response.json()

  if (!response.ok) throw refreshedTokens

  return {
    ...token,
    accessToken: refreshedTokens.access_token,
    refreshToken: refreshedTokens.refresh_token,
    expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### 3. Auth Provider (components/provider/AuthProvider.tsx)

```typescript
'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactKeycloakProvider } from '@react-keycloak/web'
import { keycloak, keycloakInitOptions } from '@/lib/keycloak'
import { useEffect, useState } from 'react'

interface AuthProviderProps {
  children: React.ReactNode
  useNextAuth?: boolean
}

export function AuthProvider({
  children,
  useNextAuth = true,
}: AuthProviderProps) {
  const [keycloakInitialized, setKeycloakInitialized] = useState(false)

  useEffect(() => {
    if (!useNextAuth) {
      // 使用原生 Keycloak JS
      import('@/lib/keycloak').then(({ initKeycloak }) => {
        initKeycloak().then(() => {
          setKeycloakInitialized(true)
        })
      })
    }
  }, [useNextAuth])

  if (useNextAuth) {
    return <SessionProvider>{children}</SessionProvider>
  }

  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={keycloakInitOptions}
      isLoadingCheck={() => !keycloakInitialized}
    >
      {children}
    </ReactKeycloakProvider>
  )
}
```

### 4. 受保护路由 (components/auth/ProtectedRoute.tsx)

```typescript
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
  fallback = null,
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  // 加载中
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // 未认证
  if (status === 'unauthenticated') {
    return null
  }

  // 检查角色
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role) =>
      session?.roles?.includes(role)
    )
    if (!hasRequiredRole) {
      return (
        fallback || (
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-red-500">You don't have permission to access this page.</p>
          </div>
        )
      )
    }
  }

  return <>{children}</>
}
```

### 5. 角色守卫 (components/auth/RoleGuard.tsx)

```typescript
'use client'

import { useSession } from 'next-auth/react'

interface RoleGuardProps {
  children: React.ReactNode
  roles: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
}

export function RoleGuard({
  children,
  roles,
  requireAll = false,
  fallback = null,
}: RoleGuardProps) {
  const { data: session } = useSession()

  const userRoles = session?.roles || []

  const hasAccess = requireAll
    ? roles.every((role) => userRoles.includes(role))
    : roles.some((role) => userRoles.includes(role))

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// 使用示例
<RoleGuard roles={['admin', 'manager']} fallback={<p>Access denied</p>}>
  <AdminPanel />
</RoleGuard>
```

### 6. 登录按钮 (components/auth/LoginButton.tsx)

```typescript
'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'

interface LoginButtonProps {
  callbackUrl?: string
  className?: string
}

export function LoginButton({
  callbackUrl = '/dashboard',
  className,
}: LoginButtonProps) {
  return (
    <Button
      onClick={() => signIn('keycloak', { callbackUrl })}
      className={className}
    >
      Sign in with Keycloak
    </Button>
  )
}

// 或使用原生 Keycloak JS
import { keycloak } from '@/lib/keycloak'

export function LoginButtonKeycloak({
  callbackUrl = '/dashboard',
}: LoginButtonProps) {
  const handleLogin = () => {
    keycloak.login({ redirectUri: `${window.location.origin}${callbackUrl}` })
  }

  return (
    <button
      onClick={handleLogin}
      className="bg-primary text-white px-4 py-2 rounded-lg"
    >
      Sign in with Keycloak
    </button>
  )
}
```

### 7. 用户菜单 (components/auth/UserMenu.tsx)

```typescript
'use client'

import { useSession, signOut } from 'next-auth/react'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { UserCircleIcon } from '@heroicons/react/24/outline'

export function UserMenu() {
  const { data: session } = useSession()

  if (!session) return null

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100">
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || ''}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <UserCircleIcon className="h-8 w-8 text-gray-400" />
        )}
        <span className="text-sm font-medium">{session.user?.name}</span>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <a
                  href="/profile"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } block px-4 py-2 text-sm text-gray-700 rounded-md`}
                >
                  Profile
                </a>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <a
                  href="/settings"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } block px-4 py-2 text-sm text-gray-700 rounded-md`}
                >
                  Settings
                </a>
              )}
            </Menu.Item>
            <hr className="my-1" />
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } block w-full text-left px-4 py-2 text-sm text-red-600 rounded-md`}
                >
                  Sign out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
```

### 8. 中间件保护 (middleware.ts)

```typescript
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // 添加自定义逻辑
    const token = req.nextauth.token

    // 检查特定路径的角色
    if (req.nextUrl.pathname.startsWith('/admin')) {
      const roles = token?.roles as string[] | undefined
      if (!roles?.includes('admin')) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/protected/:path*',
  ],
}
```

### 9. Keycloak Admin API (lib/keycloak-admin.ts)

```typescript
interface KeycloakAdminConfig {
  baseUrl: string
  realm: string
  adminUsername: string
  adminPassword: string
}

class KeycloakAdminClient {
  private config: KeycloakAdminConfig
  private accessToken: string | null = null

  constructor(config: KeycloakAdminConfig) {
    this.config = config
  }

  async authenticate() {
    const response = await fetch(
      `${this.config.baseUrl}/realms/master/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: this.config.adminUsername,
          password: this.config.adminPassword,
          client_id: 'admin-cli',
        }),
      }
    )

    const data = await response.json()
    this.accessToken = data.access_token
  }

  async getUsers(params?: { search?: string; first?: number; max?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.first) searchParams.set('first', String(params.first))
    if (params?.max) searchParams.set('max', String(params.max))

    const response = await fetch(
      `${this.config.baseUrl}/admin/realms/${this.config.realm}/users?${searchParams}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    )

    return response.json()
  }

  async createUser(userData: {
    username: string
    email: string
    firstName?: string
    lastName?: string
    enabled?: boolean
    credentials?: Array<{ type: string; value: string; temporary: boolean }>
  }) {
    const response = await fetch(
      `${this.config.baseUrl}/admin/realms/${this.config.realm}/users`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to create user')
    }

    // 返回新用户 ID
    const location = response.headers.get('Location')
    return location?.split('/').pop()
  }

  async assignRole(userId: string, roleName: string) {
    // 获取角色
    const rolesResponse = await fetch(
      `${this.config.baseUrl}/admin/realms/${this.config.realm}/roles/${roleName}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    )
    const role = await rolesResponse.json()

    // 分配角色
    await fetch(
      `${this.config.baseUrl}/admin/realms/${this.config.realm}/users/${userId}/role-mappings/realm`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([role]),
      }
    )
  }
}

export const keycloakAdmin = new KeycloakAdminClient({
  baseUrl: process.env.KEYCLOAK_URL!,
  realm: process.env.KEYCLOAK_REALM!,
  adminUsername: process.env.KEYCLOAK_ADMIN_USER!,
  adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD!,
})
```

## 最佳实践

### 1. Token 管理
```typescript
// ✅ 自动刷新 token
keycloak.onAuthRefresh = () => {
  console.log('Token refreshed')
}

keycloak.onAuthRefreshError = () => {
  keycloak.login()
}

// ✅ 使用 PKCE 增强安全性
const initOptions = {
  pkceMethod: 'S256',
}

// ❌ 避免存储敏感 token 在 localStorage
```

### 2. 安全配置
```typescript
// ✅ 使用 HTTPS
const config = {
  url: 'https://keycloak.example.com',
}

// ✅ 验证 token
import { verify } from 'jsonwebtoken'

export function verifyToken(token: string) {
  return verify(token, process.env.KEYCLOAK_PUBLIC_KEY!)
}

// ✅ 使用短期 token
// 在 Keycloak Realm 设置中配置 Access Token Lifespan
```

### 3. 角色管理
```typescript
// ✅ 前端角色检查（用于 UI）
<RoleGuard roles={['admin']}>
  <AdminPanel />
</RoleGuard>

// ✅ 后端角色验证（必需）
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.roles?.includes('admin')) {
    return new Response('Unauthorized', { status: 403 })
  }

  // 处理请求
}
```

## 常用命令

### Keycloak CLI
```bash
# 启动 Keycloak
bin/kc.sh start-dev

# 创建 admin 用户
bin/kc.sh start --bootstrap-admin-username admin --bootstrap-admin-password admin

# 导出 realm
bin/kc.sh export --file realm-export.json

# 导入 realm
bin/kc.sh import --file realm-export.json
```

### Docker
```bash
# 启动 Keycloak 容器
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev

# 使用 docker-compose
docker-compose up -d
```

## 部署配置

### Docker Compose (keycloak/docker-compose.yml)
```yaml
version: '3.8'

services:
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak
      KC_HOSTNAME: keycloak.example.com
      KC_HOSTNAME_STRICT: false
      KC_HTTP_ENABLED: true
    command: start-dev
    ports:
      - "8080:8080"
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 环境变量
```bash
# .env.local
KEYCLOAK_URL=https://keycloak.example.com
KEYCLOAK_REALM=myapp
KEYCLOAK_CLIENT_ID=myapp-frontend
KEYCLOAK_CLIENT_SECRET=your-client-secret
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=admin-password
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://myapp.example.com
```

### Next.js 配置
```javascript
// next.config.js
module.exports = {
  experimental: {
    trustHost: true, // 允许外部 Keycloak host
  },
}
```

## 扩展资源

- [Keycloak 官方文档](https://www.keycloak.org/documentation)
- [Keycloak JavaScript 适配器](https://www.keycloak.org/docs/latest/securing_apps/#_javascript_adapter)
- [NextAuth Keycloak Provider](https://next-auth.js.org/providers/keycloak)
- [Keycloak Admin REST API](https://www.keycloak.org/docs-api/latest/rest-api/)
- [Keycloak Docker](https://www.keycloak.org/server/containers)
