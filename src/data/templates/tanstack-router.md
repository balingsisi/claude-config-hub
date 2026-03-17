# TanStack Router 全栈类型安全路由

## 技术栈

- **TanStack Router** - 类型安全路由库
- **React 18+** - UI 框架
- **TypeScript 5+** - 类型系统
- **TanStack Query** - 数据获取（可选）
- **Zod** - 参数验证（可选）

## 项目结构

```
src/
├── routes/                    # 基于文件的路由
│   ├── __root.tsx            # 根布局
│   ├── index.tsx             # 首页 /
│   ├── about.tsx             # /about
│   ├── posts/
│   │   ├── index.tsx         # /posts
│   │   ├── $postId.tsx       # /posts/:postId
│   │   └── edit.$postId.tsx  # /posts/edit/:postId
│   ├── users/
│   │   ├── index.tsx         # /users
│   │   └── $userId/
│   │       ├── index.tsx     # /users/:userId
│   │       └── settings.tsx  # /users/:userId/settings
│   ├── _auth/                # 路由组（不影响URL）
│   │   ├── login.tsx         # /login
│   │   └── register.tsx      # /register
│   └── _layout/              # 布局路由
│       ├── _layout.tsx       # 布局组件
│       ├── dashboard.tsx     # /dashboard
│       └── settings.tsx      # /settings
├── components/
│   ├── Link.tsx              # 类型安全链接
│   └── Navigation.tsx
├── utils/
│   └── router.ts             # 路由配置
└── main.tsx
```

## 核心概念

### 路由文件约定

```
routes/
├── __root.tsx           # 根布局
├── index.tsx            # /
├── about.tsx            # /about
├── posts/
│   ├── index.tsx        # /posts
│   └── $postId.tsx      # /posts/:postId
├── _auth/
│   └── login.tsx        # /login (路由组)
└── _layout/
    ├── _layout.tsx      # 布局
    └── dashboard.tsx    # /dashboard
```

### 根布局

```tsx
// routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Navigation } from '../components/Navigation';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  );
}
```

### 静态路由

```tsx
// routes/index.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div>
      <h1>Welcome Home</h1>
      <p>This is the home page.</p>
    </div>
  );
}

// routes/about.tsx
export const Route = createFileRoute('/about')({
  component: AboutPage,
});

function AboutPage() {
  return <h1>About Us</h1>;
}
```

### 动态路由

```tsx
// routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/posts/$postId')({
  component: PostPage,
  loader: async ({ params }) => {
    const response = await fetch(`/api/posts/${params.postId}`);
    return response.json();
  },
});

function PostPage() {
  const { postId } = Route.useParams();
  const post = Route.useLoaderData();

  return (
    <article>
      <h1>{post.title}</h1>
      <p>Post ID: {postId}</p>
      <div>{post.content}</div>
    </article>
  );
}
```

## 代码模式

### 类型安全导航

```tsx
// components/Navigation.tsx
import { Link } from '@tanstack/react-router';

export function Navigation() {
  return (
    <nav>
      {/* 自动补全，类型检查 */}
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
      <Link to="/posts">Posts</Link>
      
      {/* 带参数的链接 */}
      <Link 
        to="/posts/$postId" 
        params={{ postId: '123' }}
      >
        Post 123
      </Link>
      
      {/* 带搜索参数 */}
      <Link 
        to="/posts" 
        search={{ category: 'tech', page: 1 }}
      >
        Tech Posts
      </Link>
      
      {/* 激活状态 */}
      <Link 
        to="/about"
        activeProps={{ className: 'active' }}
        activeOptions={{ exact: true }}
      >
        About
      </Link>
    </nav>
  );
}
```

### 编程式导航

```tsx
// components/LoginForm.tsx
import { useNavigate } from '@tanstack/react-router';

export function LoginForm() {
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 登录逻辑...
    
    // 导航到仪表盘
    await navigate({ to: '/dashboard' });
    
    // 带参数导航
    await navigate({
      to: '/posts/$postId',
      params: { postId: '123' },
    });
    
    // 带搜索参数
    await navigate({
      to: '/posts',
      search: { category: 'tech' },
    });
    
    // 替换历史记录
    await navigate({
      to: '/home',
      replace: true,
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 搜索参数

```tsx
// routes/posts/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

// 搜索参数验证
const searchSchema = z.object({
  page: z.number().default(1),
  category: z.string().optional(),
  sort: z.enum(['date', 'title']).default('date'),
  search: z.string().optional(),
});

export const Route = createFileRoute('/posts/')({
  validateSearch: searchSchema,
  component: PostsPage,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    const { page, category, sort, search } = deps.search;
    const params = new URLSearchParams({
      page: String(page),
      ...(category && { category }),
      sort,
      ...(search && { search }),
    });
    
    const response = await fetch(`/api/posts?${params}`);
    return response.json();
  },
});

function PostsPage() {
  const { page, category, sort, search } = Route.useSearch();
  const posts = Route.useLoaderData();
  const navigate = useNavigate();

  const handlePageChange = (newPage: number) => {
    navigate({
      to: '.',
      search: (prev) => ({ ...prev, page: newPage }),
    });
  };

  return (
    <div>
      <h1>Posts</h1>
      <p>Page: {page}, Category: {category}, Sort: {sort}</p>
      
      {/* 过滤表单 */}
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        navigate({
          search: {
            page: 1,
            category: formData.get('category') as string,
            sort: formData.get('sort') as 'date' | 'title',
            search: formData.get('search') as string,
          },
        });
      }}>
        <input name="search" defaultValue={search} />
        <select name="category" defaultValue={category}>
          <option value="">All</option>
          <option value="tech">Tech</option>
          <option value="life">Life</option>
        </select>
        <button type="submit">Filter</button>
      </form>
      
      {/* 帖子列表 */}
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link to="/posts/$postId" params={{ postId: post.id }}>
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
      
      {/* 分页 */}
      <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
        Previous
      </button>
      <button onClick={() => handlePageChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
```

### 布局路由

```tsx
// routes/_layout/_layout.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_layout')({
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <div className="flex">
      <aside className="w-64 bg-gray-100 p-4">
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/settings">Settings</Link>
        </nav>
      </aside>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}

// routes/_layout/dashboard.tsx
export const Route = createFileRoute('/_layout/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  return <h1>Dashboard</h1>;
}
```

### 嵌套路由

```tsx
// routes/users/$userId/index.tsx
export const Route = createFileRoute('/users/$userId/')({
  component: UserPage,
  loader: async ({ params }) => {
    return fetch(`/api/users/${params.userId}`).then((r) => r.json());
  },
});

// routes/users/$userId/settings.tsx
export const Route = createFileRoute('/users/$userId/settings')({
  component: UserSettings,
});

function UserPage() {
  const { userId } = Route.useParams();
  const user = Route.useLoaderData();

  return (
    <div>
      <h1>{user.name}</h1>
      <nav>
        <Link to="/users/$userId" params={{ userId }}>Profile</Link>
        <Link to="/users/$userId/settings" params={{ userId }}>Settings</Link>
      </nav>
    </div>
  );
}
```

### 数据加载器

```tsx
// routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params, abortController }) => {
    // 使用 AbortController 支持取消
    const response = await fetch(`/api/posts/${params.postId}`, {
      signal: abortController.signal,
    });
    
    if (!response.ok) {
      throw new Error('Post not found');
    }
    
    return response.json();
  },
  
  // 加载时显示的组件
  pendingComponent: () => <div>Loading post...</div>,
  
  // 错误处理
  errorComponent: ({ error }) => (
    <div>
      <h1>Error loading post</h1>
      <p>{error.message}</p>
    </div>
  ),
  
  component: PostPage,
});

function PostPage() {
  const post = Route.useLoaderData();
  const { postId } = Route.useParams();

  return (
    <article>
      <h1>{post.title}</h1>
      <p>Post ID: {postId}</p>
      <div>{post.content}</div>
    </article>
  );
}
```

### 重定向

```tsx
// routes/admin.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context }) => {
    // 检查认证状态
    if (!context.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: '/admin' },
      });
    }
    
    // 检查权限
    if (!context.user.isAdmin) {
      throw redirect({ to: '/' });
    }
  },
  component: AdminPage,
});

// 上下文类型
declare module '@tanstack/react-router' {
  interface Register {
    routerContext: {
      isAuthenticated: boolean;
      user: { id: string; isAdmin: boolean };
    };
  }
}
```

### 路由守卫

```tsx
// routes/_authenticated.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    if (!context.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}

// 所有在 _authenticated 下的路由都需要登录
// routes/_authenticated/profile.tsx
export const Route = createFileRoute('/_authenticated/profile')({
  component: Profile,
});
```

## 最佳实践

### 1. 路由配置

```tsx
// utils/router.ts
import { createRouter, createRouteTree } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';

// 导入路由
import { Route as rootRoute } from '../routes/__root';
import { Route as indexRoute } from '../routes/index';
import { Route as aboutRoute } from '../routes/about';
import { Route as postsIndexRoute } from '../routes/posts/index';
import { Route as postsPostIdRoute } from '../routes/posts/$postId';

// 构建路由树
const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  postsIndexRoute,
  postsPostIdRoute,
]);

// 创建路由器
export const router = createRouter({
  routeTree,
  context: {
    queryClient: new QueryClient(),
  },
  defaultPreload: 'intent', // 悬停时预加载
  defaultPreloadStaleTime: 0,
});

// 类型注册
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

### 2. 类型安全搜索参数

```tsx
// routes/users/index.tsx
import { createFileRoute } from '@tanstack/react-router';

interface UserSearch {
  page?: number;
  role?: 'admin' | 'user' | 'guest';
  active?: boolean;
}

export const Route = createFileRoute('/users/')({
  validateSearch: (search: Record<string, unknown>): UserSearch => {
    return {
      page: Number(search.page ?? 1),
      role: search.role as UserSearch['role'],
      active: search.active === 'true',
    };
  },
  component: UsersPage,
});
```

### 3. 懒加载

```tsx
// routes/dashboard.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  component: lazy(() => import('../components/Dashboard')),
  loader: () => import('../loaders/dashboard'),
});

// 或者使用动态导入
const Dashboard = React.lazy(() => import('../components/Dashboard'));

function DashboardWrapper() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Dashboard />
    </React.Suspense>
  );
}
```

### 4. 404 处理

```tsx
// routes/__root.tsx
import { createRootRoute, Outlet, notFoundComponent } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => (
    <div>
      <h1>404 - Page Not Found</h1>
      <Link to="/">Go Home</Link>
    </div>
  ),
});
```

## 常用命令

```bash
# 安装
npm install @tanstack/react-router

# 开发工具
npm install @tanstack/router-devtools

# CLI 路由生成
npm install @tanstack/router-cli

# 生成路由类型
npx @tanstack/router-cli generate

# 监听模式
npx @tanstack/router-cli watch
```

## 与其他工具集成

### TanStack Query 集成

```tsx
// utils/router.ts
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient();

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
});

// routes/posts/$postId.tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params, context }) => {
    // 使用 Query Client 缓存
    return context.queryClient.ensureQueryData({
      queryKey: ['post', params.postId],
      queryFn: () => fetch(`/api/posts/${params.postId}`).then((r) => r.json()),
    });
  },
});
```

### Zod 验证

```tsx
// routes/posts/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  search: z.string().optional(),
});

export const Route = createFileRoute('/posts/')({
  validateSearch: searchSchema.parse,
  component: PostsPage,
});
```

### 认证集成

```tsx
// main.tsx
import { RouterProvider } from '@tanstack/react-router';
import { router } from './utils/router';
import { AuthProvider, useAuth } from './auth';

function App() {
  const auth = useAuth();
  
  return (
    <RouterProvider 
      router={router} 
      context={{ auth }}
    />
  );
}

// routes/__root.tsx
export const Route = createRootRoute({
  component: RootComponent,
  beforeLoad: async ({ context }) => {
    // 在所有路由加载前检查认证
    return {
      ...context,
      isAuthenticated: await context.auth.checkAuth(),
    };
  },
});
```

## 部署配置

### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';

export default defineConfig({
  plugins: [
    TanStackRouterVite(), // 自动生成路由
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          router: ['@tanstack/react-router'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

### Next.js 集成

```tsx
// app/layout.tsx (App Router 中使用)
import { RouterProvider } from '@tanstack/react-router';
import { router } from '../utils/router';

export default function RootLayout() {
  return (
    <html>
      <body>
        <RouterProvider router={router} />
      </body>
    </html>
  );
}
```

## 调试工具

### DevTools

```tsx
// routes/__root.tsx
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </>
  ),
});
```

### 路由匹配调试

```tsx
// components/RouteDebug.tsx
import { useMatches } from '@tanstack/react-router';

export function RouteDebug() {
  const matches = useMatches();
  
  return (
    <pre>
      {JSON.stringify(
        matches.map((m) => ({
          pathname: m.pathname,
          routeId: m.routeId,
          params: m.params,
        })),
        null,
        2
      )}
    </pre>
  );
}
```

## 性能优化

### 1. 预加载策略

```tsx
// utils/router.ts
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent', // 'intent' | 'render' | 'viewport'
  defaultPreloadDelay: 100, // 悬停延迟
});

// 组件中控制预加载
<Link 
  to="/posts/$postId" 
  params={{ postId: '123' }}
  preload="intent"
  preloadDelay={50}
>
  Post 123
</Link>
```

### 2. 缓存控制

```tsx
// routes/posts/$postId.tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const response = await fetch(`/api/posts/${params.postId}`);
    return response.json();
  },
  loaderGcTime: 1000 * 60 * 5, // 缓存5分钟
  loaderStaleTime: 1000 * 30, // 30秒内视为新鲜
});
```

### 3. 并行加载

```tsx
// routes/dashboard.tsx
export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    // 并行加载多个数据源
    const [users, posts, stats] = await Promise.all([
      fetch('/api/users').then((r) => r.json()),
      fetch('/api/posts').then((r) => r.json()),
      fetch('/api/stats').then((r) => r.json()),
    ]);
    
    return { users, posts, stats };
  },
});
```

## 测试

### 单元测试

```typescript
// __tests__/router.test.ts
import { render, screen } from '@testing-library/react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from '../utils/router';

test('renders home page', async () => {
  render(<RouterProvider router={router} />);
  
  expect(await screen.findByText('Welcome Home')).toBeInTheDocument();
});
```

### 组件测试

```tsx
// __tests__/Navigation.test.tsx
import { render, screen } from '@testing-library/react';
import { createMemoryHistory } from '@tanstack/history';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { Navigation } from '../components/Navigation';

test('navigation links are correct', () => {
  const history = createMemoryHistory();
  const router = createRouter({ routeTree, history });
  
  render(<RouterProvider router={router} />);
  
  expect(screen.getByText('Home')).toHaveAttribute('href', '/');
  expect(screen.getByText('About')).toHaveAttribute('href', '/about');
});
```

## 服务端渲染 (SSR)

```tsx
// server.ts
import express from 'express';
import { createMemoryHistory } from '@tanstack/history';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { renderToString } from 'react-dom/server';
import { routeTree } from './routeTree';

const app = express();

app.get('*', async (req, res) => {
  const history = createMemoryHistory({
    initialEntries: [req.path],
  });
  
  const router = createRouter({
    routeTree,
    history,
  });
  
  // 等待数据加载
  await router.load();
  
  const html = renderToString(<RouterProvider router={router} />);
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="root">${html}</div>
        <script src="/client.js"></script>
      </body>
    </html>
  `);
});
```
