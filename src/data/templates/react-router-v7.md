# React Router v7 模板

最新版本的全栈 React 路由框架，支持 SSR、数据加载、Action 等。

## 技术栈

- **核心**: React Router v7
- **运行时**: Node.js / Bun
- **构建工具**: Vite
- **样式**: Tailwind CSS / CSS Modules
- **类型检查**: TypeScript
- **数据加载**: Loaders + Actions
- **部署**: Vercel / Netlify / Cloudflare Workers

## 项目结构

```
react-router-v7-app/
├── app/
│   ├── routes/               # 路由文件
│   │   ├── _index.tsx        # 首页
│   │   ├── about.tsx         # /about
│   │   ├── blog/
│   │   │   ├── _index.tsx    # /blog
│   │   │   └── $slug.tsx     # /blog/:slug
│   │   ├── dashboard/
│   │   │   ├── _layout.tsx   # 布局
│   │   │   ├── _index.tsx    # /dashboard
│   │   │   └── settings.tsx  # /dashboard/settings
│   │   └── api/
│   │       └── contact.ts    # API 路由
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── ui/
│   ├── lib/
│   │   ├── db.ts
│   │   └── auth.ts
│   ├── root.tsx              # 根组件
│   ├── entry.client.tsx      # 客户端入口
│   ├── entry.server.tsx      # 服务端入口
│   └── routes.ts             # 路由配置
├── public/
│   ├── favicon.ico
│   └── images/
├── tests/
├── react-router.config.ts    # React Router 配置
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env
```

## 代码模式

### 路由配置

```typescript
// app/routes.ts
import { type RouteConfig, index, route, layout } from '@react-router/dev/routes';

export default [
  index('./routes/_index.tsx'),
  route('about', './routes/about.tsx'),
  
  // 布局路由
  layout('./routes/dashboard/_layout.tsx', [
    index('./routes/dashboard/_index.tsx'),
    route('settings', './routes/dashboard/settings.tsx'),
  ]),
  
  // 动态路由
  route('blog/:slug', './routes/blog.$slug.tsx'),
  
  // API 路由
  route('api/contact', './routes/api.contact.ts', { type: 'api' }),
] satisfies RouteConfig[];
```

### 根组件

```typescript
// app/root.tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  LiveReload,
} from 'react-router';
import type { LinksFunction } from 'react-router';

import stylesheet from './app.css?url';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
];

export default function App() {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
```

### 数据加载（Loader）

```typescript
// app/routes/blog.$slug.tsx
import { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData } from 'react-router';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `${data?.title} | My Blog` },
    { name: 'description', content: data?.excerpt },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { slug } = params;
  
  // 从数据库或 API 获取数据
  const post = await getPostBySlug(slug!);
  
  if (!post) {
    throw new Response('Not Found', { status: 404 });
  }
  
  return post;
}

export default function BlogPost() {
  const post = useLoaderData<typeof loader>();

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.publishedAt}</p>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

### 数据修改（Action）

```typescript
// app/routes/api.contact.ts
import { ActionFunctionArgs } from 'react-router';
import { z } from 'zod';

const ContactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  
  // 验证数据
  const result = ContactSchema.safeParse(data);
  
  if (!result.success) {
    return Response.json(
      { errors: result.error.flatten() },
      { status: 400 }
    );
  }
  
  // 发送邮件或保存到数据库
  await sendContactEmail(result.data);
  
  return Response.json({ success: true });
}
```

### 表单处理

```typescript
// app/routes/contact.tsx
import { Form, useActionData, useNavigation } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email');
  
  // 处理表单提交
  await subscribeToNewsletter(email as string);
  
  return { success: true };
}

export default function Contact() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Form method="post">
      <div>
        <label htmlFor="email">邮箱</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          disabled={isSubmitting}
        />
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '提交中...' : '订阅'}
      </button>

      {actionData?.success && (
        <p className="text-green-600">订阅成功！</p>
      )}
    </Form>
  );
}
```

### 布局与嵌套路由

```typescript
// app/routes/dashboard/_layout.tsx
import { Outlet, NavLink, useNavigation } from 'react-router';
import { requireUserId } from '~/lib/auth';
import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  return null;
}

export default function DashboardLayout() {
  const navigation = useNavigation();
  const isLoading = navigation.state !== 'idle';

  return (
    <div className="dashboard-layout">
      <nav>
        <NavLink to="" end>
          仪表盘
        </NavLink>
        <NavLink to="settings">设置</NavLink>
      </nav>

      <main>
        {isLoading && <div className="loading-spinner" />}
        <Outlet />
      </main>
    </div>
  );
}
```

### 错误边界

```typescript
// app/routes/dashboard/_index.tsx
import { isRouteErrorResponse, useRouteError } from 'react-router';

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>出错了</h1>
      <p>{(error as Error).message}</p>
    </div>
  );
}

export default function DashboardIndex() {
  return <h1>Dashboard</h1>;
}
```

### 客户端数据加载

```typescript
// app/routes/search.tsx
import { useSearchParams, useFetcher } from 'react-router';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const fetcher = useFetcher();

  return (
    <div>
      <fetcher.Form method="get">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="搜索..."
        />
        <button type="submit">搜索</button>
      </fetcher.Form>

      {fetcher.data && (
        <ul>
          {fetcher.data.results.map((item) => (
            <li key={item.id}>{item.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## 最佳实践

### 1. 认证保护

```typescript
// app/lib/auth.ts
import { redirect } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';

export async function requireUserId(request: Request) {
  const userId = await getUserId(request);
  
  if (!userId) {
    const url = new URL(request.url);
    throw redirect(`/login?redirectTo=${url.pathname}`);
  }
  
  return userId;
}

export async function getUserId(request: Request) {
  // 从 cookie 或 session 获取用户 ID
  const cookie = request.headers.get('Cookie');
  // ... 验证逻辑
  return userId;
}
```

### 2. 预加载资源

```typescript
// app/components/Link.tsx
import { NavLink, useFetcher } from 'react-router';

export function PreloadLink({ to, children, ...props }: any) {
  const fetcher = useFetcher();

  return (
    <NavLink
      to={to}
      onMouseEnter={() => {
        fetcher.load(to);
      }}
      {...props}
    >
      {children}
    </NavLink>
  );
}
```

### 3. 缓存控制

```typescript
// app/routes/blog._index.tsx
import type { LoaderFunctionArgs, HeadersFunction } from 'react-router';

export const headers: HeadersFunction = () => ({
  'Cache-Control': 'public, max-age=300, s-maxage=600',
});

export async function loader({ request }: LoaderFunctionArgs) {
  const posts = await getBlogPosts();
  return posts;
}
```

### 4. 流式渲染

```typescript
// app/routes/dashboard/_index.tsx
import { defer, type LoaderFunctionArgs } from 'react-router';
import { Await, useLoaderData } from 'react-router';
import { Suspense } from 'react';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request); // 快速数据
  const stats = getStats(); // 慢速数据 (Promise)
  
  return defer({ user, stats });
}

export default function DashboardIndex() {
  const { user, stats } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>欢迎, {user.name}</h1>
      
      <Suspense fallback={<div>加载统计数据...</div>}>
        <Await resolve={stats}>
          {(stats) => (
            <div>
              <p>文章数: {stats.posts}</p>
              <p>评论数: {stats.comments}</p>
            </div>
          )}
        </Await>
      </Suspense>
    </div>
  );
}
```

## 常用命令

```bash
# 创建项目
npx create-react-router@latest my-app

# 开发
npm run dev

# 构建
npm run build

# 生产运行
npm run start

# 类型检查
npm run typecheck

# 测试
npm test

# 生成路由类型
npm run build:types
```

## 部署配置

### Vercel

```typescript
// react-router.config.ts
import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
  future: {
    unstable_singleFetch: true,
  },
} satisfies Config;
```

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build/client"
}
```

### Cloudflare Workers

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { reactRouter } from '@react-router/dev/vite';
import { cloudflare } from '@react-router/cloudflare';

export default defineConfig({
  plugins: [
    reactRouter(),
    cloudflare({
      persist: {
        directory: './.wrangler/state',
      },
    }),
  ],
});
```

### Docker

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "build/server.js"]
```

### 环境变量

```bash
# .env
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"
SESSION_SECRET="your-secret-key"
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="xxx"
```

## 常见问题

### 1. 客户端路由不刷新

```typescript
// 使用 useNavigation 检测导航状态
import { useNavigation } from 'react-router';

export default function Page() {
  const navigation = useNavigation();
  
  if (navigation.state === 'loading') {
    return <LoadingSpinner />;
  }
  
  // ...
}
```

### 2. SEO 优化

```typescript
// app/routes/_index.tsx
import type { MetaFunction } from 'react-router';

export const meta: MetaFunction = () => {
  return [
    { title: '我的应用 - 首页' },
    { name: 'description', content: '这是我的应用描述' },
    { property: 'og:title', content: '我的应用' },
    { property: 'og:description', content: '应用描述' },
    { property: 'og:image', content: 'https://example.com/og.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ];
};
```

### 3. 文件上传

```typescript
// app/routes/upload.tsx
import type { ActionFunctionArgs } from 'react-router';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    return { error: '请选择文件' };
  }
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // 保存文件
  await saveFile(buffer, file.name);
  
  return { success: true, filename: file.name };
}
```

## 相关资源

- [React Router 官方文档](https://reactrouter.com/)
- [React Router v7 发布说明](https://remix.run/blog/react-router-v7)
- [示例项目](https://github.com/remix-run/react-router/tree/main/examples)
- [Discord 社区](https://rmx.as/discord)
