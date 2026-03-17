# tRPC + SvelteKit 全栈类型安全模板

## 项目概述

tRPC + SvelteKit 是一个全栈类型安全的解决方案，利用 tRPC 在前后端之间共享类型，结合 SvelteKit 的服务端渲染和路由系统，提供极致的开发者体验和端到端的类型安全。

## 技术栈

- **框架**: SvelteKit 2.x
- **语言**: TypeScript 5.3+
- **API**: tRPC v11
- **验证**: Zod
- **数据库**: Prisma / Drizzle
- **状态管理**: Svelte Stores
- **样式**: Tailwind CSS
- **测试**: Vitest + Playwright

## 项目结构

```
trpc-sveltekit-app/
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── trpc/
│   │   │   │   ├── index.ts
│   │   │   │   ├── context.ts
│   │   │   │   └── trpc.ts
│   │   │   ├── routers/
│   │   │   │   ├── _app.ts
│   │   │   │   ├── user.ts
│   │   │   │   ├── post.ts
│   │   │   │   ├── auth.ts
│   │   │   │   └── comment.ts
│   │   │   ├── db.ts
│   │   │   └── auth.ts
│   │   ├── trpc.ts
│   │   ├── stores/
│   │   │   ├── auth.ts
│   │   │   └── theme.ts
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── button.svelte
│   │   │   │   ├── input.svelte
│   │   │   │   └── card.svelte
│   │   │   ├── auth/
│   │   │   │   ├── login-form.svelte
│   │   │   │   └── register-form.svelte
│   │   │   └── posts/
│   │   │       ├── post-list.svelte
│   │   │       ├── post-card.svelte
│   │   │       └── post-form.svelte
│   │   └── utils.ts
│   ├── routes/
│   │   ├── trpc/
│   │   │   └── [trpc]/
│   │   │       └── +server.ts
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── +page.svelte
│   │   │   └── register/
│   │   │       └── +page.svelte
│   │   ├── (app)/
│   │   │   ├── +layout.server.ts
│   │   │   ├── +page.server.ts
│   │   │   ├── posts/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── [id]/
│   │   │   │       ├── +page.server.ts
│   │   │   │       └── +page.svelte
│   │   │   └── profile/
│   │   │       └── +page.svelte
│   │   ├── +layout.svelte
│   │   ├── +layout.server.ts
│   │   └── +page.svelte
│   ├── app.html
│   └── app.d.ts
├── prisma/
│   └── schema.prisma
├── static/
│   └── favicon.png
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 核心代码模式

### 1. tRPC 服务端配置

```typescript
// src/lib/server/trpc/context.ts
import type { RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { verifyToken } from '$lib/server/auth';

export async function createContext(event: RequestEvent) {
  const token = event.cookies.get('auth-token');

  let user = null;

  if (token) {
    try {
      const userId = await verifyToken(token);
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
    } catch (error) {
      // Token 无效，user 保持 null
    }
  }

  return {
    user,
    prisma,
    event,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

```typescript
// src/lib/server/trpc/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context';
import superjson from 'superjson';
import { ZodError } from 'zod';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// 受保护的过程
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // 现在 user 一定存在
    },
  });
});

export const middleware = t.middleware;
```

### 2. tRPC 路由器

```typescript
// src/lib/server/routers/user.ts
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc/trpc';
import { TRPCError } from '@trpc/server';

export const userRouter = router({
  // 获取当前用户
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  // 获取用户列表
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional(),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 10;
      const { cursor } = input;

      const users = await ctx.prisma.user.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      let nextCursor: typeof cursor | undefined;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem!.id;
      }

      return {
        users,
        nextCursor,
      };
    }),

  // 获取单个用户
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          createdAt: true,
          posts: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '用户未找到',
        });
      }

      return user;
    }),

  // 更新用户信息
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(50).optional(),
        bio: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: input,
        select: {
          id: true,
          name: true,
          bio: true,
        },
      });
    }),
});
```

```typescript
// src/lib/server/routers/post.ts
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc/trpc';
import { TRPCError } from '@trpc/server';

export const postRouter = router({
  // 无限滚动列表
  infinitePosts: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional(),
        cursor: z.string().optional(),
        authorId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 10;
      const { cursor, authorId } = input;

      const posts = await ctx.prisma.post.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: authorId ? { authorId } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, name: true },
          },
          _count: {
            select: { comments: true },
          },
        },
      });

      let nextCursor: typeof cursor | undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem!.id;
      }

      return {
        posts,
        nextCursor,
      };
    }),

  // 获取单篇文章
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: { id: true, name: true },
          },
          comments: {
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
              author: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '文章未找到',
        });
      }

      return post;
    }),

  // 创建文章
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        content: z.string().optional(),
        published: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.post.create({
        data: {
          ...input,
          authorId: ctx.user.id,
        },
      });
    }),

  // 更新文章
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        content: z.string().optional(),
        published: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // 检查所有权
      const post = await ctx.prisma.post.findUnique({
        where: { id },
        select: { authorId: true },
      });

      if (!post || post.authorId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权编辑此文章',
        });
      }

      return ctx.prisma.post.update({
        where: { id },
        data,
      });
    }),

  // 删除文章
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
        select: { authorId: true },
      });

      if (!post || post.authorId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权删除此文章',
        });
      }

      return ctx.prisma.post.delete({
        where: { id: input.id },
      });
    }),
});
```

```typescript
// src/lib/server/routers/auth.ts
import { z } from 'zod';
import { router, publicProcedure } from '../trpc/trpc';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import { signToken } from '$lib/server/auth';

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 检查邮箱是否已存在
      const existing = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: '该邮箱已被注册',
        });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(input.password, 12);

      // 创建用户
      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          name: input.name,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      // 生成 token
      const token = signToken(user.id);

      // 设置 cookie
      ctx.event.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7天
        path: '/',
      });

      return { user, token };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 查找用户
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '邮箱或密码错误',
        });
      }

      // 验证密码
      const valid = await bcrypt.compare(input.password, user.password);

      if (!valid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '邮箱或密码错误',
        });
      }

      // 生成 token
      const token = signToken(user.id);

      // 设置 cookie
      ctx.event.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      };
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    ctx.event.cookies.delete('auth-token', { path: '/' });
    return { success: true };
  }),
});
```

```typescript
// src/lib/server/routers/_app.ts
import { router } from '../trpc/trpc';
import { userRouter } from './user';
import { postRouter } from './post';
import { authRouter } from './auth';

export const appRouter = router({
  user: userRouter,
  post: postRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
```

### 3. SvelteKit API 路由

```typescript
// src/routes/trpc/[trpc]/+server.ts
import { createFetchHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '$lib/server/routers/_app';
import { createContext } from '$lib/server/trpc/context';

const handler = createFetchHandler({
  router: appRouter,
  createContext,
  endpoint: '/trpc',
});

export const GET = handler;
export const POST = handler;
```

### 4. tRPC 客户端

```typescript
// src/lib/trpc.ts
import { createTRPCClient, httpBatchLink, loggerLink } from '@trpc/client';
import type { AppRouter } from '$lib/server/routers/_app';
import superjson from 'superjson';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '';
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT ?? 5173}`;
};

export const trpc = createTRPCClient<AppRouter>({
  transformer: superjson,
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === 'development' ||
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include', // 发送 cookies
        });
      },
    }),
  ],
});
```

### 5. SvelteKit 页面（使用 tRPC）

```svelte
<!-- src/routes/(app)/posts/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { trpc } from '$lib/trpc';
  import PostCard from '$lib/components/posts/post-card.svelte';
  import { onMount } from 'svelte';

  let posts: any[] = [];
  let cursor: string | undefined = undefined;
  let loading = false;
  let hasMore = true;

  async function loadPosts(newCursor?: string) {
    if (loading || !hasMore) return;
    
    loading = true;
    try {
      const result = await trpc.post.infinitePosts.query({
        limit: 10,
        cursor: newCursor,
        authorId: $page.url.searchParams.get('author') || undefined,
      });

      if (newCursor) {
        posts = [...posts, ...result.posts];
      } else {
        posts = result.posts;
      }

      cursor = result.nextCursor;
      hasMore = !!result.nextCursor;
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      loading = false;
    }
  }

  function loadMore() {
    if (cursor && hasMore) {
      loadPosts(cursor);
    }
  }

  onMount(() => {
    loadPosts();
  });
</script>

<svelte:head>
  <title>文章列表</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8">文章列表</h1>

  <div class="grid gap-6">
    {#each posts as post (post.id)}
      <PostCard {post} />
    {/each}
  </div>

  {#if loading}
    <div class="text-center py-8">
      <div class="spinner"></div>
    </div>
  {/if}

  {#if hasMore && !loading}
    <div class="text-center mt-8">
      <button
        on:click={loadMore}
        class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        加载更多
      </button>
    </div>
  {/if}

  {#if !hasMore && posts.length === 0}
    <div class="text-center py-12 text-gray-500">
      暂无文章
    </div>
  {/if}
</div>
```

### 6. 文章详情页

```svelte
<!-- src/routes/(app)/posts/[id]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { trpc } from '$lib/trpc';
  import { onMount } from 'svelte';

  export let data;

  let post = data.post;
  let loading = false;

  async function refreshPost() {
    loading = true;
    try {
      post = await trpc.post.byId.query({ id: $page.params.id });
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>{post?.title || '加载中...'}</title>
</svelte:head>

{#if loading}
  <div class="text-center py-12">
    <div class="spinner"></div>
  </div>
{:else if post}
  <article class="container mx-auto px-4 py-8 max-w-4xl">
    <header class="mb-8">
      <h1 class="text-4xl font-bold mb-4">{post.title}</h1>
      <div class="flex items-center gap-4 text-gray-600">
        <span>作者：{post.author.name}</span>
        <span>•</span>
        <time datetime={post.createdAt}>
          {new Date(post.createdAt).toLocaleDateString('zh-CN')}
        </time>
      </div>
    </header>

    <div class="prose max-w-none">
      {post.content}
    </div>

    {#if post.comments && post.comments.length > 0}
      <section class="mt-12">
        <h2 class="text-2xl font-bold mb-6">评论 ({post.comments.length})</h2>
        <div class="space-y-4">
          {#each post.comments as comment (comment.id)}
            <div class="p-4 bg-gray-50 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <span class="font-semibold">{comment.author.name}</span>
                <span class="text-sm text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <p>{comment.content}</p>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  </article>
{:else}
  <div class="text-center py-12">
    <p class="text-gray-500">文章未找到</p>
  </div>
{/if}
```

```typescript
// src/routes/(app)/posts/[id]/+page.server.ts
import { trpc } from '$lib/trpc';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  try {
    const post = await trpc.post.byId.query({ id: params.id });
    return { post };
  } catch (err) {
    throw error(404, '文章未找到');
  }
};
```

### 7. 登录表单组件

```svelte
<!-- src/lib/components/auth/login-form.svelte -->
<script lang="ts">
  import { trpc } from '$lib/trpc';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = '';
    loading = true;

    try {
      await trpc.auth.login.mutate({ email, password });
      goto('/');
    } catch (err: any) {
      error = err.message || '登录失败';
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit={handleSubmit} class="space-y-4">
  {#if error}
    <div class="p-4 bg-red-50 text-red-600 rounded-lg">
      {error}
    </div>
  {/if}

  <div>
    <label for="email" class="block text-sm font-medium mb-2">
      邮箱
    </label>
    <input
      type="email"
      id="email"
      bind:value={email}
      required
      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div>
    <label for="password" class="block text-sm font-medium mb-2">
      密码
    </label>
    <input
      type="password"
      id="password"
      bind:value={password}
      required
      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <button
    type="submit"
    disabled={loading}
    class="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
  >
    {loading ? '登录中...' : '登录'}
  </button>
</form>
```

### 8. 文章表单组件

```svelte
<!-- src/lib/components/posts/post-form.svelte -->
<script lang="ts">
  import { trpc } from '$lib/trpc';
  import { goto } from '$app/navigation';

  export let post: any = null;

  let title = post?.title || '';
  let content = post?.content || '';
  let published = post?.published || false;
  let loading = false;
  let error = '';

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = '';
    loading = true;

    try {
      if (post) {
        await trpc.post.update.mutate({
          id: post.id,
          title,
          content,
          published,
        });
      } else {
        await trpc.post.create.mutate({
          title,
          content,
          published,
        });
      }
      goto('/posts');
    } catch (err: any) {
      error = err.message || '操作失败';
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit={handleSubmit} class="space-y-6">
  {#if error}
    <div class="p-4 bg-red-50 text-red-600 rounded-lg">
      {error}
    </div>
  {/if}

  <div>
    <label for="title" class="block text-sm font-medium mb-2">
      标题
    </label>
    <input
      type="text"
      id="title"
      bind:value={title}
      required
      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div>
    <label for="content" class="block text-sm font-medium mb-2">
      内容
    </label>
    <textarea
      id="content"
      bind:value={content}
      rows="10"
      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
    ></textarea>
  </div>

  <div class="flex items-center gap-2">
    <input
      type="checkbox"
      id="published"
      bind:checked={published}
      class="w-4 h-4"
    />
    <label for="published" class="text-sm">
      发布
    </label>
  </div>

  <button
    type="submit"
    disabled={loading}
    class="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
  >
    {loading ? '保存中...' : post ? '更新' : '创建'}
  </button>
</form>
```

### 9. 布局和中间件

```svelte
<!-- src/routes/(app)/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { trpc } from '$lib/trpc';

  export let data;

  let user = data.user;

  async function checkAuth() {
    if (browser && !user) {
      try {
        const result = await trpc.user.me.query();
        user = result;
      } catch (error) {
        // 未登录
      }
    }
  }

  onMount(() => {
    checkAuth();
  });
</script>

<svelte:head>
  <title>我的应用</title>
</svelte:head>

<div class="min-h-screen flex flex-col">
  <header class="bg-white shadow">
    <nav class="container mx-auto px-4 py-4 flex justify-between items-center">
      <a href="/" class="text-xl font-bold">我的应用</a>
      
      <div class="flex items-center gap-4">
        {#if user}
          <a href="/posts" class="hover:underline">文章</a>
          <a href="/profile" class="hover:underline">{user.name}</a>
          <button
            on:click={async () => {
              await trpc.auth.logout.mutate();
              window.location.href = '/';
            }}
            class="text-red-500 hover:underline"
          >
            退出
          </button>
        {:else}
          <a href="/login" class="hover:underline">登录</a>
          <a href="/register" class="hover:underline">注册</a>
        {/if}
      </div>
    </nav>
  </header>

  <main class="flex-1">
    <slot />
  </main>

  <footer class="bg-gray-100 py-8 mt-12">
    <div class="container mx-auto px-4 text-center text-gray-600">
      © {new Date().getFullYear()} 我的应用. 保留所有权利。
    </div>
  </footer>
</div>
```

```typescript
// src/routes/(app)/+layout.server.ts
import { trpc } from '$lib/trpc';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
  const token = cookies.get('auth-token');
  
  if (!token) {
    return { user: null };
  }

  try {
    const user = await trpc.user.me.query();
    return { user };
  } catch (error) {
    return { user: null };
  }
};
```

### 10. Prisma Schema

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
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  bio       String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts     Post[]
  comments  Comment[]

  @@map("users")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  comments  Comment[]

  @@map("posts")
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  post      Post     @relation(fields: [postId], references: [id])
  postId    String
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String

  @@map("comments")
}

enum Role {
  USER
  ADMIN
}
```

## 最佳实践

### 1. 类型安全

```typescript
// 使用类型推导
import type { AppRouter } from '$lib/server/routers/_app';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

// 使用类型
type CreatePostInput = RouterInputs['post']['create'];
type PostOutput = RouterOutputs['post']['byId'];
```

### 2. 错误处理

```typescript
// 全局错误处理
import { TRPCError } from '@trpc/server';

export const errorHandler = middleware(async ({ ctx, next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof TRPCError) {
      // 处理 tRPC 错误
      console.error('tRPC Error:', error);
    }
    throw error;
  }
});
```

### 3. 性能优化

```typescript
// 使用 SSR 预加载
export const load: PageServerLoad = async ({ params }) => {
  const post = await trpc.post.byId.query({ id: params.id });
  return { post };
};

// 客户端缓存
const cachedData = new Map();

async function getCachedData(key: string, fetcher: () => Promise<any>) {
  if (cachedData.has(key)) {
    return cachedData.get(key);
  }

  const data = await fetcher();
  cachedData.set(key, data);
  return data;
}
```

### 4. 测试

```typescript
// __tests__/post.test.ts
import { test, expect } from 'vitest';
import { appRouter } from '$lib/server/routers/_app';
import { createContext } from '$lib/server/trpc/context';

test('should create a post', async () => {
  const ctx = await createContext(mockEvent);
  const caller = appRouter.createCaller(ctx);

  const post = await caller.post.create({
    title: 'Test Post',
    content: 'Test Content',
    published: true,
  });

  expect(post.title).toBe('Test Post');
});
```

## 常用命令

```bash
# 安装依赖
npm install @trpc/server @trpc/client zod superjson

# 开发
npm run dev

# 构建
npm run build

# 预览
npm run preview

# 测试
npm run test
npm run test:e2e

# Lint
npm run lint

# Prisma
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

## 部署配置

### 环境变量

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
JWT_SECRET="your-secret-key"
NODE_ENV="production"
```

### Vercel 部署

```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel --prod
```

### Docker 部署

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
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "build"]
```

## 参考资源

- [tRPC 官方文档](https://trpc.io/)
- [SvelteKit 文档](https://kit.svelte.dev/)
- [Prisma 文档](https://www.prisma.io/)
- [Zod 文档](https://zod.dev/)

---

**最后更新**: 2026-03-17
