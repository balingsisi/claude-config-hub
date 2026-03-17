# Next.js 15 模板

## 技术栈
- **Next.js 15** - React 框架最新版本
- **React 19** - 并发渲染、Server Components
- **TypeScript** - 完整类型支持
- **Turbopack** - 新一代打包工具（开发模式默认启用）
- **Server Actions** - 服务端操作
- **App Router** - 基于文件的路由系统
- **Metadata API** - SEO 优化

## 项目结构
```
nextjs-15-project/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── users/
│   │   │   └── route.ts
│   │   └── auth/
│   │       └── route.ts
│   ├── actions/
│   │   ├── user.ts
│   │   └── auth.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   └── input.tsx
│   │   └── forms/
│   │       └── login-form.tsx
│   ├── lib/
│   │   ├── db.ts
│   │   └── auth.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── public/
│   └── images/
├── next.config.ts
├── tsconfig.json
└── package.json
```

## 代码模式

### App Router 配置
```typescript
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | My App',
    default: 'My App',
  },
  description: 'Built with Next.js 15',
  keywords: ['Next.js', 'React', 'TypeScript'],
  authors: [{ name: 'Your Name' }],
  openGraph: {
    title: 'My App',
    description: 'Built with Next.js 15',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

// app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">
        Welcome to Next.js 15!
      </h1>
      <div className="flex gap-4">
        <Link 
          href="/dashboard" 
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Dashboard
        </Link>
        <Link 
          href="/login" 
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          Login
        </Link>
      </div>
    </main>
  );
}
```

### Server Actions
```typescript
// app/actions/user.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export async function updateUser(formData: FormData) {
  const validatedFields = updateUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email } = validatedFields.data;

  // 数据库操作
  await db.user.update({
    where: { id: formData.get('id') as string },
    data: { name, email },
  });

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function deleteUser(userId: string) {
  await db.user.delete({
    where: { id: userId },
  });

  revalidatePath('/dashboard');
}

// app/actions/auth.ts
'use server';

import { cookies } from 'next/headers';
import { signIn } from '@/app/lib/auth';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const user = await signIn(email, password);
    
    // 设置 cookie
    const cookieStore = await cookies();
    cookieStore.set('session', user.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return { success: true };
  } catch (error) {
    return { error: 'Invalid credentials' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
```

### Server Components
```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { DashboardStats } from '@/app/components/dashboard-stats';
import { RecentOrders } from '@/app/components/recent-orders';
import { DashboardSkeleton } from '@/app/components/skeletons';

export const dynamic = 'force-dynamic'; // 或 'force-static' 或 'auto'

export default async function DashboardPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <Suspense fallback={<DashboardSkeleton />}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <DashboardStats />
        </div>
      </Suspense>

      <Suspense fallback={<div>Loading orders...</div>}>
        <RecentOrders />
      </Suspense>
    </main>
  );
}

// app/components/dashboard-stats.tsx
async function getStats() {
  const res = await fetch('https://api.example.com/stats', {
    next: { revalidate: 60 }, // 60秒缓存
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch stats');
  }
  
  return res.json();
}

export async function DashboardStats() {
  const stats = await getStats();

  return (
    <>
      <div className="rounded-lg border p-6">
        <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
        <p className="text-3xl font-bold">{stats.totalUsers}</p>
      </div>
      <div className="rounded-lg border p-6">
        <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
        <p className="text-3xl font-bold">${stats.revenue}</p>
      </div>
      <div className="rounded-lg border p-6">
        <h3 className="text-sm font-medium text-gray-500">Orders</h3>
        <p className="text-3xl font-bold">{stats.orders}</p>
      </div>
      <div className="rounded-lg border p-6">
        <h3 className="text-sm font-medium text-gray-500">Growth</h3>
        <p className="text-3xl font-bold">{stats.growth}%</p>
      </div>
    </>
  );
}
```

### Client Components
```typescript
// app/components/forms/login-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(formData);
      
      if (result.error) {
        setError(result.error);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### API Routes
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const users = await db.user.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const user = await db.user.create({
      data: body,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await db.user.findUnique({
    where: { id: params.id },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  
  const user = await db.user.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(user);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await db.user.delete({
    where: { id: params.id },
  });

  return new NextResponse(null, { status: 204 });
}
```

### 并发特性
```typescript
// app/components/concurrent-features.tsx
'use client';

import { use, useState, useTransition } from 'react';

// use() hook - React 19 新特性
function Comments({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  const comments = use(commentsPromise);
  
  return (
    <ul>
      {comments.map((comment) => (
        <li key={comment.id}>{comment.text}</li>
      ))}
    </ul>
  );
}

// useTransition - 非阻塞更新
export function SearchComponent() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value); // 立即更新输入框

    // 使用 transition 标记非紧急更新
    startTransition(() => {
      const filtered = largeList.filter(item => 
        item.includes(value)
      );
      setResults(filtered);
    });
  }

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        className="border rounded px-3 py-2"
      />
      
      {isPending && <span className="ml-2">Searching...</span>}
      
      <ul className="mt-4">
        {results.map((result, i) => (
          <li key={i}>{result}</li>
        ))}
      </ul>
    </div>
  );
}

// useOptimistic - 乐观更新
import { useOptimistic } from 'react';

export function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: string) => [
      ...state,
      { id: Date.now(), text: newTodo, completed: false },
    ]
  );

  async function addTodo(formData: FormData) {
    const text = formData.get('todo') as string;
    
    // 立即显示乐观更新
    addOptimisticTodo(text);
    
    // 实际服务器操作
    await saveTodo(text);
  }

  return (
    <form action={addTodo} className="space-y-4">
      <input
        type="text"
        name="todo"
        className="border rounded px-3 py-2"
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Add
      </button>
      
      <ul>
        {optimisticTodos.map((todo) => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </form>
  );
}
```

### Middleware
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session');

  // 保护的路由
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 认证路由（已登录用户不能访问）
  if (request.nextUrl.pathname.startsWith('/login')) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 添加自定义 header
  const response = NextResponse.next();
  response.headers.set('x-custom-header', 'value');

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login/:path*',
  ],
};
```

## 最佳实践

### 1. 数据获取策略
```typescript
// 静态生成
export const dynamic = 'force-static';
export const revalidate = 3600; // 1小时

// 动态渲染
export const dynamic = 'force-dynamic';

// 增量静态再生
fetch('https://api.example.com/data', {
  next: { revalidate: 60 }, // 60秒
});

// 按需重新验证
import { revalidateTag, revalidatePath } from 'next/cache';

revalidateTag('users');
revalidatePath('/dashboard');
```

### 2. 错误处理
```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Try again
      </button>
    </div>
  );
}

// app/not-found.tsx
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold">Not Found</h2>
      <p className="text-gray-600">Could not find requested resource</p>
    </div>
  );
}

// app/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  );
}
```

### 3. 性能优化
```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 启用 Turbopack（开发模式）
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // 图片优化
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
    ],
  },
  
  // 压缩
  compress: true,
  
  // 严格模式
  reactStrictMode: true,
  
  // 输出配置
  output: 'standalone', // 或 'export' 用于静态导出
};

export default nextConfig;
```

## 常用命令

### 开发
```bash
# 开发模式（使用 Turbopack）
next dev --turbo

# 生产构建
next build

# 启动生产服务器
next start

# 静态导出
next build && next export

# 类型检查
next lint
npx tsc --noEmit
```

### 部署
```bash
# Vercel 部署
vercel

# Docker 构建
docker build -t nextjs-app .
docker run -p 3000:3000 nextjs-app
```

## 部署配置

### package.json
```json
{
  "name": "nextjs-15-project",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.3.0"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./app/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Dockerfile
```dockerfile
FROM node:20-alpine AS base

# 安装依赖
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# 生产镜像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# 自动利用输出跟踪来减少镜像大小
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Vercel 配置
```json
// vercel.json
{
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["hnd1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npx tsc --noEmit
      
      - name: Build
        run: npm run build
      
      - name: Run tests
        run: npm test
```

### 环境变量
```bash
# .env.local
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_API_URL="https://api.example.com"
NEXT_PUBLIC_ANALYTICS_ID="UA-XXXXX"
```
