# Better Auth 模板

TypeScript-first 的现代认证库，支持多框架、多种认证方式。

## 技术栈

- **核心**: Better Auth
- **框架**: Next.js / Nuxt / SvelteKit / Astro / Hono
- **数据库**: PostgreSQL / MySQL / SQLite / MongoDB
- **认证方式**: 邮箱密码、OAuth、魔法链接、两步验证
- **ORM**: Prisma / Drizzle / Kysely

## 项目结构

```
better-auth-app/
├── src/
│   ├── lib/
│   │   ├── auth.ts              # Better Auth 配置
│   │   ├── auth-client.ts       # 客户端配置
│   │   └── db.ts                # 数据库连接
│   ├── app/
│   │   ├── api/auth/[...all]/   # API 路由
│   │   │   └── route.ts
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── dashboard/
│   │       └── page.tsx
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── SocialLogin.tsx
│   │   └── TwoFactorSetup.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   └── types/
│       └── auth.ts
├── prisma/
│   └── schema.prisma
├── .env.local
└── package.json
```

## 代码模式

### 服务端配置

```typescript
// lib/auth.ts
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from './email';

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  // 邮箱密码认证
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: '重置密码',
        body: `点击链接重置密码: ${url}`,
      });
    },
  },

  // OAuth 提供商
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    },
  },

  // 两步验证
  twoFactor: {
    enabled: true,
    otpOptions: {
      digits: 6,
      period: 30,
    },
  },

  // 会话配置
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7天
    updateAge: 60 * 60 * 24, // 1天
  },

  // 用户配置
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
      },
      avatar: {
        type: 'string',
        required: false,
      },
    },
  },

  // 高级功能
  advanced: {
    generateId: false,
    cookie: {
      prefix: 'app',
      secure: process.env.NODE_ENV === 'production',
    },
  },
});

export type Auth = typeof auth;
```

### 客户端配置

```typescript
// lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  useUser,
} = authClient;
```

### API 路由（Next.js）

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return auth.handler(request);
}

export async function POST(request: NextRequest) {
  return auth.handler(request);
}
```

### React 组件

#### 登录表单

```typescript
// components/LoginForm.tsx
'use client';

import { useState } from 'react';
import { signIn } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await signIn.email({
        email,
        password,
      });

      router.push('/dashboard');
    } catch (err) {
      setError('登录失败，请检查邮箱和密码');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>邮箱</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input"
        />
      </div>

      <div>
        <label>密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input"
        />
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <button type="submit" className="btn-primary">
        登录
      </button>
    </form>
  );
}
```

#### 注册表单

```typescript
// components/RegisterForm.tsx
'use client';

import { useState } from 'react';
import { signUp } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await signUp.email({
        email,
        password,
        name,
      });

      router.push('/verify-email');
    } catch (err) {
      setError('注册失败，邮箱可能已被使用');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>姓名</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="input"
        />
      </div>

      <div>
        <label>邮箱</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input"
        />
      </div>

      <div>
        <label>密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input"
        />
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <button type="submit" className="btn-primary">
        注册
      </button>
    </form>
  );
}
```

#### OAuth 登录

```typescript
// components/SocialLogin.tsx
'use client';

import { signIn } from '@/lib/auth-client';

export default function SocialLogin() {
  const handleGitHubLogin = async () => {
    await signIn.social({
      provider: 'github',
      callbackURL: '/dashboard',
    });
  };

  const handleGoogleLogin = async () => {
    await signIn.social({
      provider: 'google',
      callbackURL: '/dashboard',
    });
  };

  return (
    <div className="space-y-2">
      <button onClick={handleGitHubLogin} className="btn-github">
        <GitHubIcon /> 使用 GitHub 登录
      </button>

      <button onClick={handleGoogleLogin} className="btn-google">
        <GoogleIcon /> 使用 Google 登录
      </button>
    </div>
  );
}
```

#### 会话管理

```typescript
// hooks/useAuth.ts
'use client';

import { useSession, useUser } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useRequireAuth() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  return { session, isPending };
}

// 使用示例
export default function DashboardPage() {
  const { session, isPending } = useRequireAuth();
  const { data: user } = useUser();

  if (isPending) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <h1>欢迎, {user?.name}</h1>
      <p>邮箱: {user?.email}</p>
    </div>
  );
}
```

### 服务端使用（Server Components）

```typescript
// app/dashboard/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session) {
    redirect('/login');
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.name}</p>
    </div>
  );
}
```

### 中间件保护

```typescript
// middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function middleware(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const protectedPaths = ['/dashboard', '/settings', '/profile'];

  if (protectedPaths.some(path => request.url.includes(path))) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/profile/:path*'],
};
```

## 最佳实践

### 1. 角色权限

```typescript
// lib/roles.ts
import { auth } from './auth';

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export function requireRole(role: string) {
  return async (request: Request) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || session.user.role !== role) {
      throw new Error('Unauthorized');
    }

    return session;
  };
}

// 使用
export async function DELETE(request: Request) {
  await requireRole(ROLES.ADMIN)(request);
  // 执行删除操作
}
```

### 2. 两步验证

```typescript
// components/TwoFactorSetup.tsx
'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

export default function TwoFactorSetup() {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');

  useEffect(() => {
    async function setup2FA() {
      const result = await authClient.twoFactor.enable({
        code: '',
      });
      
      if (result.data) {
        setQrCode(result.data.qrCode);
        setSecret(result.data.secret);
      }
    }
    
    setup2FA();
  }, []);

  return (
    <div>
      <h2>设置两步验证</h2>
      <img src={qrCode} alt="2FA QR Code" />
      <p>手动输入密钥: {secret}</p>
    </div>
  );
}
```

### 3. 邮箱验证

```typescript
// app/api/verify-email/route.ts
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  try {
    await auth.api.verifyEmail({
      body: {
        token,
      },
    });

    return NextResponse.redirect(new URL('/login?verified=true', request.url));
  } catch (error) {
    return NextResponse.redirect(new URL('/login?error=invalid-token', request.url));
  }
}
```

### 4. 密码重置

```typescript
// components/ForgotPassword.tsx
'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await authClient.forgetPassword({
      email,
      redirectTo: '/reset-password',
    });
    
    setSent(true);
  };

  if (sent) {
    return <div>重置邮件已发送，请检查邮箱</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="输入邮箱"
        required
      />
      <button type="submit">发送重置邮件</button>
    </form>
  );
}
```

## 常用命令

```bash
# 安装
npm install better-auth @prisma/client

# 生成 Prisma 客户端
npx prisma generate

# 数据库迁移
npx prisma migrate dev --name init

# 启动开发服务器
npm run dev

# 构建
npm run build
```

## 部署配置

### 数据库 Schema（Prisma）

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id
  email         String    @unique
  emailVerified Boolean   @default(false)
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  role          String    @default("user")
  sessions      Session[]
  accounts      Account[]
}

model Session {
  id           String   @id
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  expiresAt    DateTime
  ipAddress    String?
  userAgent    String?
}

model Account {
  id                String  @id
  userId            String
  user              User    @relation(fields: [userId], references: [id])
  accountId         String
  providerId        String
  accessToken       String?
  refreshToken      String?
  expiresAt         DateTime?
}
```

### 环境变量

```bash
# .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# OAuth - GitHub
GITHUB_CLIENT_ID="xxx"
GITHUB_CLIENT_SECRET="xxx"

# OAuth - Google
GOOGLE_CLIENT_ID="xxx"
GOOGLE_CLIENT_SECRET="xxx"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 邮件服务
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="xxx"
```

## 常见问题

### 1. 跨域问题

```typescript
export const auth = betterAuth({
  // ...
  advanced: {
    cors: {
      allowedOrigins: ['https://yourdomain.com', 'http://localhost:3000'],
    },
  },
});
```

### 2. 自定义用户字段

```typescript
export const auth = betterAuth({
  user: {
    additionalFields: {
      phone: {
        type: 'string',
        required: false,
        unique: true,
      },
      bio: {
        type: 'string',
        required: false,
      },
    },
  },
});
```

### 3. 会话持久化

```typescript
export const auth = betterAuth({
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30天
    updateAge: 60 * 60 * 24, // 每天更新
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5分钟
    },
  },
});
```

## 相关资源

- [Better Auth 官方文档](https://www.better-auth.com/)
- [GitHub 仓库](https://github.com/better-auth/better-auth)
- [示例项目](https://github.com/better-auth/better-auth/tree/main/examples)
- [Discord 社区](https://discord.gg/better-auth)
