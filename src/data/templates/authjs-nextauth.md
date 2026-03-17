# Auth.js (NextAuth.js) 认证模板

## 技术栈

### 核心技术
- **Auth.js (NextAuth.js)**: 开源认证解决方案
- **Next.js 14+**: App Router 支持
- **TypeScript**: 类型安全
- **Prisma**: 数据库适配器

### 认证功能
- **OAuth 提供商**: Google, GitHub, Discord, Twitter, Apple 等
- **邮箱/密码**: Credentials Provider
- **Magic Link**: 无密码邮件登录
- **多因素认证**: TOTP, WebAuthn
- **Passkey**: FIDO2 无密码认证

### Session 策略
- **JWT**: 无状态会话
- **Database**: 有状态会话
- **混合模式**: JWT + 数据库刷新

## 项目结构

```
authjs-project/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── verify-request/
│   │   │   │   └── page.tsx
│   │   │   └── error/
│   │   │       └── page.tsx
│   │   ├── (protected)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts
│   │   └── layout.tsx
│   ├── components/
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   ├── social-buttons.tsx
│   │   │   └── user-avatar.tsx
│   │   └── providers/
│   │       └── session-provider.tsx
│   ├── lib/
│   │   ├── auth.ts              # Auth.js 配置
│   │   ├── prisma.ts            # Prisma 客户端
│   │   └── password.ts          # 密码工具
│   ├── hooks/
│   │   └── use-session.ts
│   ├── types/
│   │   ├── next-auth.d.ts       # 类型扩展
│   │   └── user.ts
│   └── middleware.ts            # 路由保护
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env.local
├── next.config.js
└── package.json
```

## 代码模式

### 1. Auth.js 配置

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
import { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { randomBytes, randomUUID } from "crypto";

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),

  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    // GitHub OAuth
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    // Discord OAuth
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),

    // 邮箱/密码登录
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
    generateSessionToken: () => {
      return randomUUID?.() ?? randomBytes(32).toString("hex");
    },
  },

  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/dashboard",
  },

  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // 初始登录时添加用户信息到 token
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // 更新 session 时刷新用户数据
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      // OAuth 登录时处理 account
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }

      return token;
    },

    async session({ session, token, user }) {
      // JWT 策略：从 token 获取数据
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.accessToken = token.accessToken as string;
      }

      // Database 策略：从 user 获取数据
      if (user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }

      return session;
    },

    async signIn({ user, account, profile, email, credentials }) {
      // 允许没有验证邮箱的用户登录（可选）
      if (account?.provider === "google") {
        return !!profile?.email_verified;
      }

      // 限制特定邮箱域名
      const allowedDomains = ["company.com", "partner.com"];
      if (user.email && !allowedDomains.includes(user.email.split("@")[1])) {
        return false;
      }

      return true;
    },

    async redirect({ url, baseUrl }) {
      // 允许相对路径
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      // 允许同域名 URL
      if (new URL(url).origin === baseUrl) return url;

      // 默认重定向到首页
      return baseUrl;
    },
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`);
      if (isNewUser) {
        // 发送欢迎邮件
        // await sendWelcomeEmail(user.email);
      }
    },

    async signOut({ token, session }) {
      console.log(`User signed out`);
    },

    async createUser({ user }) {
      console.log(`New user created: ${user.email}`);
      // 创建用户后的初始化逻辑
    },
  },

  debug: process.env.NODE_ENV === "development",
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
```

### 2. API 路由

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

### 3. Session Provider

```typescript
// src/components/providers/session-provider.tsx
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface SessionProviderProps {
  children: ReactNode;
  session?: any;
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session} refetchInterval={5 * 60}>
      {children}
    </NextAuthSessionProvider>
  );
}
```

```typescript
// src/app/layout.tsx
import { SessionProvider } from "@/components/providers/session-provider";
import { auth } from "@/lib/auth";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

### 4. 中间件保护

```typescript
// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;

  // 公开路由
  const isPublicRoute = ["/", "/login", "/register", "/api/auth"].some(
    (route) => nextUrl.pathname.startsWith(route)
  );

  // 受保护路由
  const isProtectedRoute = ["/dashboard", "/profile", "/settings"].some(
    (route) => nextUrl.pathname.startsWith(route)
  );

  // 管理员路由
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  // API 路由
  const isApiRoute = nextUrl.pathname.startsWith("/api");

  // 未登录访问受保护路由
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 已登录访问认证页面
  if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  // 管理员权限检查
  if (isAdminRoute && session?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  // API 路由保护
  if (isApiRoute && !isPublicRoute && !isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### 5. 登录组件

```typescript
// src/components/auth/login-form.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError("Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
```

```typescript
// src/components/auth/social-buttons.tsx
"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

const providers = [
  { name: "Google", id: "google", icon: GoogleIcon },
  { name: "GitHub", id: "github", icon: GitHubIcon },
  { name: "Discord", id: "discord", icon: DiscordIcon },
];

interface SocialButtonsProps {
  callbackUrl?: string;
}

export function SocialButtons({ callbackUrl }: SocialButtonsProps) {
  const handleSignIn = async (providerId: string) => {
    await signIn(providerId, {
      callbackUrl: callbackUrl || "/dashboard",
    });
  };

  return (
    <div className="grid gap-2">
      {providers.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          onClick={() => handleSignIn(provider.id)}
          className="w-full"
        >
          <provider.icon className="mr-2 h-4 w-4" />
          Continue with {provider.name}
        </Button>
      ))}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}
```

### 6. 用户状态 Hook

```typescript
// src/hooks/use-current-user.ts
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useCurrentUser() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const isUnauthenticated = status === "unauthenticated";

  const user = session?.user;

  const requireAuth = useCallback(() => {
    if (isUnauthenticated) {
      router.push("/login");
    }
  }, [isUnauthenticated, router]);

  const requireRole = useCallback(
    (role: string) => {
      if (isUnauthenticated) {
        router.push("/login");
        return false;
      }

      if (user?.role !== role && user?.role !== "admin") {
        router.push("/dashboard");
        return false;
      }

      return true;
    },
    [isUnauthenticated, user?.role, router]
  );

  const updateUser = useCallback(
    async (data: Record<string, any>) => {
      await update(data);
      router.refresh();
    },
    [update, router]
  );

  return {
    user,
    isLoading,
    isAuthenticated,
    isUnauthenticated,
    requireAuth,
    requireRole,
    updateUser,
  };
}
```

### 7. 服务端使用

```typescript
// src/app/(protected)/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        Welcome, {session.user.name || "User"}!
      </h1>
      <p>Email: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
    </div>
  );
}
```

```typescript
// src/app/api/protected/route.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    message: "Protected data",
    user: session.user,
  });
}
```

### 8. 密码工具

```typescript
// src/lib/password.ts
import { hash, compare } from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### 9. 类型扩展

```typescript
// src/types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
    accessToken?: string;
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    accessToken?: string;
    provider?: string;
  }
}
```

### 10. 注册流程

```typescript
// src/app/api/register/route.ts
import { NextResponse } from "next/server";
import { hashPassword, validatePassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 验证密码强度
    const validation = validatePassword(password);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // 创建用户
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "user",
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## 最佳实践

### 1. Session 策略选择

```typescript
// ✅ JWT 策略 - 无状态，适合无数据库场景
session: {
  strategy: "jwt",
}

// ✅ Database 策略 - 可撤销，适合需要即时失效的场景
session: {
  strategy: "database",
  maxAge: 30 * 24 * 60 * 60,
}

// ✅ 混合策略 - JWT + 定期数据库验证
callbacks: {
  async jwt({ token }) {
    // 每24小时验证一次
    if (!token.lastChecked || Date.now() - token.lastChecked > 86400000) {
      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub },
      });
      if (!dbUser) throw new Error("User not found");
      token.lastChecked = Date.now();
    }
    return token;
  },
}
```

### 2. 安全配置

```typescript
// ✅ 启用 CSRF 保护
cookies: {
  sessionToken: {
    name: `${prefix}-authjs.session-token`,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
  },
}

// ✅ 限制登录尝试
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
});

// ✅ 使用 HTTPS
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
```

### 3. 错误处理

```typescript
// ✅ 自定义错误页面
pages: {
  error: "/auth/error",
}

// src/app/auth/error/page.tsx
"use client";

import { useSearchParams } from "next/navigation";

const errors: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have access to this resource.",
  Verification: "The verification token has expired or has already been used.",
  Default: "An error occurred during authentication.",
};

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";

  return (
    <div>
      <h1>Authentication Error</h1>
      <p>{errors[error] || errors.Default}</p>
    </div>
  );
}
```

### 4. 测试

```typescript
// __tests__/auth.test.ts
import { auth, signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 模拟 auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

describe("Authentication", () => {
  it("should return null when not authenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const session = await auth();
    expect(session).toBeNull();
  });

  it("should return session when authenticated", async () => {
    const mockSession = {
      user: { id: "1", email: "test@example.com", role: "user" },
    };
    (auth as jest.Mock).mockResolvedValue(mockSession);
    const session = await auth();
    expect(session).toEqual(mockSession);
  });
});
```

## 常用命令

```bash
# 安装依赖
npm install next-auth @auth/prisma-adapter
npm install prisma @prisma/client
npm install bcryptjs
npm install -D @types/bcryptjs

# 初始化 Prisma
npx prisma init

# 生成 Prisma 客户端
npx prisma generate

# 运行迁移
npx prisma migrate dev --name init

# 创建环境变量
cp .env.example .env.local

# 启动开发服务器
npm run dev
```

## 部署配置

### 环境变量

```bash
# .env.local
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key-here

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

# Database
DATABASE_URL="postgresql://..."
```

### 生成密钥

```bash
# 生成 NEXTAUTH_SECRET
openssl rand -base64 32
```

### Docker 部署

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXTAUTH_URL=https://yourdomain.com

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
```

### Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod

# 设置环境变量
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
```

### Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          String    @default("user")
  accounts      Account[]
  sessions      Session[]

  @@index([email])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

## 参考资源

- [Auth.js 官方文档](https://authjs.dev/)
- [NextAuth.js 指南](https://next-auth.js.org/)
- [Prisma 适配器](https://authjs.dev/getting-started/adapters/prisma)
- [OAuth 提供商配置](https://authjs.dev/getting-started/providers/oauth-tutorial)
- [TypeScript 类型](https://authjs.dev/getting-started/typescript)
- [安全最佳实践](https://authjs.dev/guides/basics/security)
