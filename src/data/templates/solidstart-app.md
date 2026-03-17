# SolidStart 全栈应用模板

## 项目概述

使用 SolidStart 构建现代化全栈应用的模板，基于 SolidJS 的响应式原理，提供服务端渲染（SSR）、静态站点生成（SSG）和 API 路由功能。

## 技术栈

- **框架**: SolidStart 1.0+
- **UI 库**: SolidJS 1.8+
- **语言**: TypeScript 5
- **样式**: Tailwind CSS / CSS Modules / UnoCSS
- **路由**: 文件系统路由
- **数据获取**: Solid Query / TanStack Query
- **状态管理**: SolidJS Stores / Signals
- **表单**: Solid Forms
- **测试**: Vitest / Playwright
- **构建工具**: Vite

## 项目结构

```
solidstart-app/
├── src/                      # 源代码
│   ├── routes/              # 路由目录（文件系统路由）
│   │   ├── index.tsx        # 首页
│   │   ├── about.tsx        # 关于页面
│   │   ├── blog/            # 博客路由
│   │   │   ├── index.tsx    # 博客列表
│   │   │   └── [slug].tsx   # 博客详情（动态路由）
│   │   ├── api/             # API 路由
│   │   │   └── users.ts     # 用户 API
│   │   └── (dashboard)/     # 路由分组
│   │       ├── layout.tsx   # 布局组件
│   │       ├── dashboard.tsx
│   │       └── settings.tsx
│   ├── components/          # 可复用组件
│   │   ├── ui/              # UI 组件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Card.tsx
│   │   ├── layout/          # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   └── features/        # 功能组件
│   ├── lib/                 # 工具库
│   │   ├── api.ts           # API 客户端
│   │   ├── auth.ts          # 认证逻辑
│   │   └── db.ts            # 数据库连接
│   ├── server/              # 服务端代码
│   │   ├── db/              # 数据库
│   │   │   ├── schema.ts    # 数据库 schema
│   │   │   └── migrations/  # 迁移文件
│   │   ├── services/        # 服务层
│   │   └── middleware/      # 中间件
│   ├── hooks/               # 自定义 Hooks
│   ├── stores/              # 状态管理
│   │   ├── user.ts          # 用户状态
│   │   └── cart.ts          # 购物车状态
│   ├── types/               # TypeScript 类型
│   ├── entry-client.tsx     # 客户端入口
│   ├── entry-server.tsx     # 服务端入口
│   ├── root.tsx             # 根组件
│   └── app.tsx              # 应用配置
├── public/                   # 静态资源
│   ├── favicon.ico
│   └── images/
├── .env                      # 环境变量
├── .env.example              # 环境变量示例
├── app.config.ts             # SolidStart 配置
├── package.json
├── tsconfig.json
├── vite.config.ts            # Vite 配置
└── tailwind.config.js        # Tailwind 配置
```

## 代码模式

### 1. 应用配置

```typescript
// app.config.ts
import { defineConfig } from '@solidjs/start/config';
import viteTsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  vite: {
    plugins: [
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
    ],
    server: {
      port: 3000,
    },
    build: {
      target: 'esnext',
    },
  },
  ssr: true,
  server: {
    preset: 'node-server', // 或 'vercel', 'netlify', 'cloudflare'
  },
});
```

```typescript
// src/app.tsx
import { MetaProvider, Title } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Suspense } from 'solid-js';
import './app.css';

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>SolidStart App</Title>
          <Suspense fallback={<div>Loading...</div>}>
            {props.children}
          </Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
```

```typescript
// src/root.tsx
// @refresh reload
import { Suspense, createEffect } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { Meta, Title, Links, Scripts } from '@solidjs/meta';
import { isServer } from 'solid-js/web';

import './app.css';

export default function Root() {
  const location = useLocation();

  createEffect(() => {
    if (!isServer) {
      console.log('Route changed to:', location.pathname);
    }
  });

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <Title>SolidStart App</Title>
        <Meta name="description" content="A SolidStart application" />
        <Links />
      </head>
      <body>
        <Suspense>
          <div id="app"></div>
        </Suspense>
        <Scripts />
      </body>
    </html>
  );
}
```

### 2. 路由和页面

```typescript
// src/routes/index.tsx
import { createSignal, createResource, For, Show } from 'solid-js';
import { Title } from '@solidjs/meta';
import { useRouteData } from '@solidjs/router';
import { Counter } from '~/components/Counter';
import { ProductCard } from '~/components/ProductCard';

// 服务端数据获取
export function routeData() {
  const [products] = createResource(async () => {
    const response = await fetch('https://api.example.com/products');
    return response.json();
  });
  
  return { products };
}

export default function Home() {
  const { products } = useRouteData<typeof routeData>();
  const [count, setCount] = createSignal(0);

  return (
    <main class="container mx-auto px-4 py-8">
      <Title>Home - SolidStart App</Title>
      
      <h1 class="text-4xl font-bold mb-6">Welcome to SolidStart</h1>
      
      {/* 响应式计数器 */}
      <Counter count={count()} setCount={setCount} />
      
      {/* 产品列表 */}
      <section class="mt-12">
        <h2 class="text-2xl font-semibold mb-4">Products</h2>
        
        <Show
          when={!products.loading}
          fallback={<div>Loading products...</div>}
        >
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <For each={products()}>
              {(product) => <ProductCard product={product} />}
            </For>
          </div>
        </Show>
      </section>
    </main>
  );
}

// src/routes/blog/[slug].tsx - 动态路由
import { createResource, Show } from 'solid-js';
import { Title, Meta } from '@solidjs/meta';
import { useParams } from '@solidjs/router';

export function routeData() {
  const params = useParams();
  
  const [post] = createResource(async () => {
    const response = await fetch(`https://api.example.com/posts/${params.slug}`);
    if (!response.ok) throw new Error('Post not found');
    return response.json();
  });
  
  return { post };
}

export default function BlogPost() {
  const { post } = useRouteData<typeof routeData>();

  return (
    <Show
      when={post()}
      fallback={<div>Loading...</div>}
    >
      {(postData) => (
        <article class="container mx-auto px-4 py-8">
          <Title>{postData().title}</Title>
          <Meta name="description" content={postData().excerpt} />
          <Meta property="og:title" content={postData().title} />
          <Meta property="og:description" content={postData().excerpt} />
          
          <header class="mb-8">
            <h1 class="text-4xl font-bold mb-4">{postData().title}</h1>
            <time class="text-gray-600">{postData().publishedAt}</time>
          </header>
          
          <div class="prose max-w-none" innerHTML={postData().content} />
        </article>
      )}
    </Show>
  );
}

// src/routes/(dashboard)/layout.tsx - 路由分组布局
import { createSignal, Show } from 'solid-js';
import { Outlet } from '@solidjs/router';
import { Sidebar } from '~/components/Sidebar';
import { Header } from '~/components/Header';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = createSignal(false);

  return (
    <div class="flex h-screen overflow-hidden">
      {/* 侧边栏 */}
      <Sidebar isOpen={sidebarOpen()} onClose={() => setSidebarOpen(false)} />
      
      {/* 主内容 */}
      <div class="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main class="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// src/routes/(dashboard)/dashboard.tsx
import { Title } from '@solidjs/meta';
import { createResource } from 'solid-js';
import { StatsCard } from '~/components/StatsCard';

export default function DashboardPage() {
  const [stats] = createResource(async () => {
    const response = await fetch('/api/stats');
    return response.json();
  });

  return (
    <div>
      <Title>Dashboard</Title>
      
      <h1 class="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Show when={stats()}>
          <StatsCard title="Users" value={stats().users} />
          <StatsCard title="Revenue" value={stats().revenue} />
          <StatsCard title="Orders" value={stats().orders} />
          <StatsCard title="Visitors" value={stats().visitors} />
        </Show>
      </div>
    </div>
  );
}
```

### 3. API 路由

```typescript
// src/routes/api/users.ts
import { json } from '@solidjs/router';
import { createUser, getUsers, updateUser, deleteUser } from '~/server/services/users';

// GET /api/users
export async function GET(event) {
  const url = new URL(event.request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  
  try {
    const users = await getUsers(page, limit);
    return json(users);
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}

// POST /api/users
export async function POST(event) {
  const body = await event.request.json();
  
  try {
    const user = await createUser(body);
    return json(user, { status: 201 });
  } catch (error) {
    return json({ error: error.message }, { status: 400 });
  }
}

// PUT /api/users/:id
export async function PUT(event) {
  const id = event.params.id;
  const body = await event.request.json();
  
  try {
    const user = await updateUser(id, body);
    return json(user);
  } catch (error) {
    return json({ error: error.message }, { status: 400 });
  }
}

// DELETE /api/users/:id
export async function DELETE(event) {
  const id = event.params.id;
  
  try {
    await deleteUser(id);
    return json({ success: true });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}

// src/routes/api/auth/login.ts
import { json } from '@solidjs/router';
import { verifyPassword, createSession } from '~/server/services/auth';

export async function POST(event) {
  const { email, password } = await event.request.json();
  
  try {
    const user = await verifyPassword(email, password);
    const session = await createSession(user.id);
    
    return json(
      { user, sessionId: session.id },
      {
        headers: {
          'Set-Cookie': `sessionId=${session.id}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`,
        },
      }
    );
  } catch (error) {
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }
}

// src/routes/api/auth/register.ts
import { json } from '@solidjs/router';
import { hashPassword, createUser } from '~/server/services/auth';

export async function POST(event) {
  const { email, password, name } = await event.request.json();
  
  try {
    const hashedPassword = await hashPassword(password);
    const user = await createUser({ email, password: hashedPassword, name });
    
    return json(user, { status: 201 });
  } catch (error) {
    return json({ error: error.message }, { status: 400 });
  }
}
```

### 4. 状态管理

```typescript
// src/stores/user.ts
import { createSignal, createStore, produce } from 'solid-js';

// 使用 Signal
const [user, setUser] = createSignal<User | null>(null);
const [isAuthenticated, setIsAuthenticated] = createSignal(false);

export { user, setUser, isAuthenticated, setIsAuthenticated };

// 使用 Store
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const [cart, setCart] = createStore<{
  items: CartItem[];
  total: number;
}>({
  items: [],
  total: 0,
});

// 添加商品到购物车
export function addToCart(item: Omit<CartItem, 'quantity'>) {
  setCart(
    produce((state) => {
      const existingItem = state.items.find((i) => i.id === item.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...item, quantity: 1 });
      }
      
      state.total = calculateTotal(state.items);
    })
  );
}

// 从购物车移除商品
export function removeFromCart(itemId: string) {
  setCart(
    produce((state) => {
      const index = state.items.findIndex((i) => i.id === itemId);
      if (index !== -1) {
        state.items.splice(index, 1);
        state.total = calculateTotal(state.items);
      }
    })
  );
}

// 更新商品数量
export function updateQuantity(itemId: string, quantity: number) {
  setCart(
    produce((state) => {
      const item = state.items.find((i) => i.id === itemId);
      if (item) {
        item.quantity = quantity;
        state.total = calculateTotal(state.items);
      }
    })
  );
}

// 清空购物车
export function clearCart() {
  setCart({ items: [], total: 0 });
}

function calculateTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export { cart, setCart };

// src/stores/theme.ts
import { createSignal, createEffect, onMount } from 'solid-js';

type Theme = 'light' | 'dark';

const [theme, setTheme] = createSignal<Theme>('light');

export function useTheme() {
  onMount(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
  });

  createEffect(() => {
    const currentTheme = theme();
    document.documentElement.classList.toggle('dark', currentTheme === 'dark');
    localStorage.setItem('theme', currentTheme);
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, setTheme, toggleTheme };
}
```

### 5. 组件模式

```typescript
// src/components/Counter.tsx
import { createSignal, createMemo, createEffect } from 'solid-js';

interface CounterProps {
  count: number;
  setCount: (value: number | ((prev: number) => number)) => void;
}

export function Counter(props: CounterProps) {
  const doubleCount = createMemo(() => props.count * 2);
  
  createEffect(() => {
    console.log('Count changed to:', props.count);
  });

  return (
    <div class="flex items-center gap-4">
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        onClick={() => props.setCount((prev) => prev - 1)}
      >
        -
      </button>
      
      <span class="text-2xl font-bold">{props.count}</span>
      <span class="text-lg text-gray-600">Double: {doubleCount()}</span>
      
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        onClick={() => props.setCount((prev) => prev + 1)}
      >
        +
      </button>
    </div>
  );
}

// src/components/ProductCard.tsx
import { Show, createSignal } from 'solid-js';
import { Link } from '@solidjs/router';
import { addToCart } from '~/stores/cart';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  inStock: boolean;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard(props: ProductCardProps) {
  const [adding, setAdding] = createSignal(false);

  const handleAddToCart = async () => {
    setAdding(true);
    
    try {
      addToCart({
        id: props.product.id,
        name: props.product.name,
        price: props.product.price,
      });
      
      // 显示成功提示
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <Link href={`/products/${props.product.id}`}>
        <img
          src={props.product.image}
          alt={props.product.name}
          class="w-full h-48 object-cover"
        />
      </Link>
      
      <div class="p-4">
        <Link href={`/products/${props.product.id}`}>
          <h3 class="text-lg font-semibold mb-2 hover:text-blue-500 transition">
            {props.product.name}
          </h3>
        </Link>
        
        <p class="text-gray-600 text-sm mb-4 line-clamp-2">
          {props.product.description}
        </p>
        
        <div class="flex items-center justify-between">
          <span class="text-xl font-bold">${props.product.price}</span>
          
          <Show
            when={props.product.inStock}
            fallback={<span class="text-red-500">Out of Stock</span>}
          >
            <button
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50"
              onClick={handleAddToCart}
              disabled={adding()}
            >
              {adding() ? 'Adding...' : 'Add to Cart'}
            </button>
          </Show>
        </div>
      </div>
    </div>
  );
}

// src/components/ui/Button.tsx
import { splitProps, JSX } from 'solid-js';
import { cx } from '~/utils/cx';

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: JSX.Element;
  rightIcon?: JSX.Element;
}

const variants = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button(props: ButtonProps) {
  const [local, others] = splitProps(props, [
    'class',
    'variant',
    'size',
    'loading',
    'leftIcon',
    'rightIcon',
    'children',
  ]);

  return (
    <button
      class={cx(
        'inline-flex items-center justify-center font-medium rounded transition',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[local.variant || 'primary'],
        sizes[local.size || 'md'],
        local.class
      )}
      disabled={local.loading || others.disabled}
      {...others}
    >
      <Show when={local.loading}>
        <svg
          class="animate-spin h-4 w-4 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </Show>
      
      <Show when={local.leftIcon && !local.loading}>
        <span class="mr-2">{local.leftIcon}</span>
      </Show>
      
      {local.children}
      
      <Show when={local.rightIcon}>
        <span class="ml-2">{local.rightIcon}</span>
      </Show>
    </button>
  );
}
```

### 6. 服务端功能

```typescript
// src/server/db/schema.ts
import { pgTable, uuid, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  published: boolean('published').default(false),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// src/server/services/posts.ts
import { db } from '~/server/db';
import { posts } from '~/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function getPosts(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  
  const result = await db
    .select()
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
  
  return result;
}

export async function getPostBySlug(slug: string) {
  const result = await db
    .select()
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);
  
  return result[0];
}

export async function createPost(data: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  authorId: string;
}) {
  const result = await db.insert(posts).values(data).returning();
  return result[0];
}

export async function updatePost(
  slug: string,
  data: Partial<{
    title: string;
    content: string;
    excerpt: string;
    published: boolean;
  }>
) {
  const result = await db
    .update(posts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(posts.slug, slug))
    .returning();
  
  return result[0];
}

export async function deletePost(slug: string) {
  await db.delete(posts).where(eq(posts.slug, slug));
}

// src/server/services/auth.ts
import { hash, verify } from 'argon2';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export async function verifyPassword(
  email: string,
  password: string
): Promise<typeof users.$inferSelect> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  if (!user[0]) {
    throw new Error('User not found');
  }
  
  const isValid = await verify(user[0].password, password);
  
  if (!isValid) {
    throw new Error('Invalid password');
  }
  
  return user[0];
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
}): Promise<typeof users.$inferSelect> {
  const hashedPassword = await hashPassword(data.password);
  
  const result = await db
    .insert(users)
    .values({
      email: data.email,
      password: hashedPassword,
      name: data.name,
    })
    .returning();
  
  return result[0];
}

export async function createSession(userId: string) {
  const sessionId = nanoid();
  
  // 存储到 Redis 或数据库
  // await redis.set(`session:${sessionId}`, userId, 'EX', 604800);
  
  return { id: sessionId, userId };
}
```

### 7. 中间件

```typescript
// src/server/middleware/auth.ts
import { eventHandler, getCookie, sendError } from 'h3';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export const authMiddleware = eventHandler(async (event) => {
  const token = getCookie(event, 'token');
  
  if (!token) {
    return sendError(event, createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    }));
  }
  
  try {
    const decoded = verify(token, JWT_SECRET) as { userId: string };
    event.context.userId = decoded.userId;
  } catch (error) {
    return sendError(event, createError({
      statusCode: 401,
      statusMessage: 'Invalid token',
    }));
  }
});

// 在路由中使用
// src/routes/api/protected.ts
import { authMiddleware } from '~/server/middleware/auth';

export const middleware = authMiddleware;

export async function GET(event) {
  const userId = event.context.userId;
  
  // 返回受保护的数据
  return json({ userId, data: 'Protected data' });
}
```

### 8. 表单处理

```typescript
// src/components/ContactForm.tsx
import { createSignal, Show } from 'solid-js';
import { createForm, required, email, minLength } from '@modular-forms/solid';

type ContactForm = {
  name: string;
  email: string;
  message: string;
};

export function ContactForm() {
  const [submitting, setSubmitting] = createSignal(false);
  const [success, setSuccess] = createSignal(false);
  
  const [form, { Form, Field }] = createForm<ContactForm>({
    initialValues: {
      name: '',
      email: '',
      message: '',
    },
    validate: (values) => {
      const errors: Partial<Record<keyof ContactForm, string>> = {};
      
      if (!values.name) errors.name = 'Name is required';
      if (!values.email) errors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = 'Invalid email format';
      }
      if (!values.message) errors.message = 'Message is required';
      
      return errors;
    },
  });

  const handleSubmit = async (values: ContactForm) => {
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      
      if (response.ok) {
        setSuccess(true);
        form.reset();
      }
    } catch (error) {
      console.error('Failed to submit form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="max-w-md mx-auto">
      <Show when={success()}>
        <div class="mb-4 p-4 bg-green-100 text-green-800 rounded">
          Message sent successfully!
        </div>
      </Show>
      
      <Form onSubmit={handleSubmit} class="space-y-4">
        <Field name="name">
          {(field, props) => (
            <div>
              <label class="block text-sm font-medium mb-1">Name</label>
              <input
                {...props}
                type="text"
                class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                classList={{
                  'border-red-500': field.error,
                  'border-gray-300': !field.error,
                }}
              />
              <Show when={field.error}>
                <p class="mt-1 text-sm text-red-500">{field.error}</p>
              </Show>
            </div>
          )}
        </Field>
        
        <Field name="email">
          {(field, props) => (
            <div>
              <label class="block text-sm font-medium mb-1">Email</label>
              <input
                {...props}
                type="email"
                class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                classList={{
                  'border-red-500': field.error,
                  'border-gray-300': !field.error,
                }}
              />
              <Show when={field.error}>
                <p class="mt-1 text-sm text-red-500">{field.error}</p>
              </Show>
            </div>
          )}
        </Field>
        
        <Field name="message">
          {(field, props) => (
            <div>
              <label class="block text-sm font-medium mb-1">Message</label>
              <textarea
                {...props}
                rows={4}
                class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                classList={{
                  'border-red-500': field.error,
                  'border-gray-300': !field.error,
                }}
              />
              <Show when={field.error}>
                <p class="mt-1 text-sm text-red-500">{field.error}</p>
              </Show>
            </div>
          )}
        </Field>
        
        <button
          type="submit"
          class="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50"
          disabled={submitting()}
        >
          {submitting() ? 'Sending...' : 'Send Message'}
        </button>
      </Form>
    </div>
  );
}
```

## 最佳实践

### 1. 性能优化

```typescript
// 懒加载组件
import { lazy, Suspense } from 'solid-js';

const LazyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}

// 使用资源预加载
import { preload } from 'solid-js';

async function preloadData() {
  const data = await fetch('/api/data');
  return data.json();
}

// 在路由中预加载
export function routeData() {
  return preload(preloadData);
}

// 使用 Transition 优化体验
import { createSignal, useTransition } from 'solid-js';

function App() {
  const [isPending, start] = useTransition();
  const [tab, setTab] = createSignal('tab1');

  const changeTab = (newTab: string) => {
    start(() => setTab(newTab));
  };

  return (
    <div>
      <button onClick={() => changeTab('tab1')}>Tab 1</button>
      <button onClick={() => changeTab('tab2')}>Tab 2</button>
      
      <div classList={{ 'opacity-50': isPending() }}>
        {tab() === 'tab1' ? <Tab1 /> : <Tab2 />}
      </div>
    </div>
  );
}
```

### 2. SEO 优化

```typescript
// src/routes/blog/[slug].tsx
import { Title, Meta, Link } from '@solidjs/meta';

export default function BlogPost() {
  const { post } = useRouteData<typeof routeData>();

  return (
    <>
      <Title>{post().title} | My Blog</Title>
      <Meta name="description" content={post().excerpt} />
      <Meta name="keywords" content={post().tags.join(', ')} />
      
      {/* Open Graph */}
      <Meta property="og:title" content={post().title} />
      <Meta property="og:description" content={post().excerpt} />
      <Meta property="og:image" content={post().image} />
      <Meta property="og:type" content="article" />
      <Meta property="og:url" content={`https://example.com/blog/${post().slug}`} />
      
      {/* Twitter Card */}
      <Meta name="twitter:card" content="summary_large_image" />
      <Meta name="twitter:title" content={post().title} />
      <Meta name="twitter:description" content={post().excerpt} />
      <Meta name="twitter:image" content={post().image} />
      
      {/* Canonical URL */}
      <Link rel="canonical" href={`https://example.com/blog/${post().slug}`} />
      
      <article>
        {/* ... */}
      </article>
    </>
  );
}
```

### 3. 错误边界

```typescript
// src/components/ErrorBoundary.tsx
import { createSignal, ErrorBoundary as SolidErrorBoundary, JSX } from 'solid-js';

interface ErrorBoundaryProps {
  fallback?: JSX.Element;
  children: JSX.Element;
}

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return (
    <SolidErrorBoundary
      fallback={(err, reset) => (
        <div class="p-4 bg-red-100 text-red-800 rounded">
          <h2 class="text-lg font-bold mb-2">Something went wrong</h2>
          <p class="mb-4">{err.message}</p>
          <button
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={reset}
          >
            Try again
          </button>
        </div>
      )}
    >
      {props.children}
    </SolidErrorBoundary>
  );
}

// 使用
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

### 4. 代码分割

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import solidStart from '@solidjs/start/vite';

export default defineConfig({
  plugins: [
    solidStart({
      ssr: true,
    }),
    solid(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['solid-js', '@solidjs/router'],
          'ui': ['@kobalte/core'],
        },
      },
    },
  },
});
```

## 常用命令

```bash
# 开发
npm run dev           # 启动开发服务器
npm run build         # 生产构建
npm run start         # 启动生产服务器

# 测试
npm run test          # 运行测试
npm run test:watch    # 监听模式
npm run test:coverage # 测试覆盖率

# 代码质量
npm run lint          # 运行 ESLint
npm run type-check    # TypeScript 类型检查
npm run format        # Prettier 格式化

# 数据库
npm run db:generate   # 生成迁移
npm run db:migrate    # 运行迁移
npm run db:studio     # 打开 Drizzle Studio
```

## 部署配置

### Vercel 部署

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".output",
  "framework": "solidstart",
  "regions": ["iad1"]
}
```

### Netlify 部署

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".output"

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server/:splat"
  status = 200
```

### Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
```

### PM2 部署

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'solidstart-app',
      script: '.output/server/index.mjs',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
```

## 参考资源

- [SolidStart 文档](https://start.solidjs.com/)
- [SolidJS 文档](https://www.solidjs.com/)
- [Solid Router](https://github.com/solidjs/solid-router)
- [Solid Meta](https://github.com/solidjs/solid-meta)
- [Vite 文档](https://vitejs.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
