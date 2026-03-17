# tRPC v11 模板

## 技术栈

- **框架**: tRPC v11
- **后端**: Node.js (Express / Fastify / Bun)
- **前端**: React / Next.js
- **类型**: TypeScript (端到端类型安全)
- **验证**: Zod
- **数据库**: Prisma / Drizzle

## 项目结构

```
trpc-v11-project/
├── packages/
│   ├── api/                    # 后端 API
│   │   ├── src/
│   │   │   ├── routers/
│   │   │   │   ├── user.ts
│   │   │   │   ├── post.ts
│   │   │   │   └── auth.ts
│   │   │   ├── middlewares/
│   │   │   │   └── auth.ts
│   │   │   ├── trpc/
│   │   │   │   ├── index.ts    # tRPC 实例
│   │   │   │   └── context.ts
│   │   │   ├── db/
│   │   │   │   └── index.ts
│   │   │   └── server.ts
│   │   └── package.json
│   │
│   └── web/                    # 前端应用
│       ├── src/
│       │   ├── hooks/
│       │   │   └── useAuth.ts
│       │   ├── components/
│       │   │   ├── UserList.tsx
│       │   │   └── PostForm.tsx
│       │   ├── pages/
│       │   │   └── index.tsx
│       │   ├── utils/
│       │   │   └── trpc.ts     # tRPC 客户端
│       │   └── App.tsx
│       └── package.json
│
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

## 代码模式

### 服务端配置

```typescript
// packages/api/src/trpc/index.ts
import { initTRPC, inferAsyncReturnType } from "@trpc/server";
import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import superjson from "superjson";
import { ZodError } from "zod";

// Context 类型
export async function createContext({ req, res }: CreateFastifyContextOptions) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  let user = null;
  if (token) {
    user = await verifyToken(token);
  }

  return {
    req,
    res,
    user,
    db: prisma,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

// 初始化 tRPC
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

// 导出路由器构建器
export const router = t.router;
export const publicProcedure = t.procedure;

// 受保护的过程
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// 导出中间件
export const middleware = t.middleware;
```

### 定义路由

```typescript
// packages/api/src/routers/user.ts
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = router({
  // 获取所有用户
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional(),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 50;
      
      const users = await ctx.db.user.findMany({
        take: limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem!.id;
      }

      return { users, nextCursor };
    }),

  // 获取单个用户
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        include: { posts: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    }),

  // 创建用户 (受保护)
  create: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already exists",
        });
      }

      return ctx.db.user.create({
        data: {
          email: input.email,
          name: input.name,
        },
      });
    }),

  // 更新用户
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      return ctx.db.user.update({
        where: { id },
        data,
      });
    }),

  // 删除用户
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.delete({
        where: { id: input.id },
      });
    }),
});
```

### Post 路由

```typescript
// packages/api/src/routers/post.ts
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

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
      
      const posts = await ctx.db.post.findMany({
        take: limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: input.authorId ? { authorId: input.authorId } : undefined,
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem!.id;
      }

      return { posts, nextCursor };
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
      return ctx.db.post.create({
        data: {
          ...input,
          authorId: ctx.user.id,
        },
      });
    }),

  // 批量操作
  publishMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.post.updateMany({
        where: { id: { in: input.ids } },
        data: { published: true },
      });

      return { count: result.count };
    }),
});
```

### 根路由器

```typescript
// packages/api/src/routers/_app.ts
import { router } from "../trpc";
import { userRouter } from "./user";
import { postRouter } from "./post";
import { authRouter } from "./auth";

export const appRouter = router({
  user: userRouter,
  post: postRouter,
  auth: authRouter,
});

// 导出类型
export type AppRouter = typeof appRouter;
```

### 服务器入口

```typescript
// packages/api/src/server.ts
import fastify from "fastify";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { appRouter, createContext } from "./routers";

const server = fastify({ maxParamLength: 5000 });

server.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: {
    router: appRouter,
    createContext,
    onError({ path, error }) {
      console.error("Error in tRPC handler:", path, error);
    },
  },
});

// CORS
server.register(require("@fastify/cors"), {
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
});

const start = async () => {
  try {
    await server.listen({ port: 4000 });
    console.log("Server running on http://localhost:4000");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
```

### 客户端配置

```typescript
// packages/web/src/utils/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@acme/api";

export const trpc = createTRPCReact<AppRouter>();

// 配置链接
import { httpBatchLink, loggerLink } from "@trpc/client";
import superjson from "superjson";

const getBaseUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "http://localhost:4000";
};

export const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === "development" ||
        (opts.direction === "down" && opts.result instanceof Error),
    }),
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
      headers() {
        const token = localStorage.getItem("token");
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
```

### React 集成

```typescript
// packages/web/src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./utils/trpc";
import superjson from "superjson";

const queryClient = new QueryClient();

function App() {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: "http://localhost:4000/trpc",
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <UserList />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### 使用查询

```typescript
// packages/web/src/components/UserList.tsx
import { trpc } from "../utils/trpc";
import { useState } from "react";

export function UserList() {
  const [cursor, setCursor] = useState<string | undefined>();

  const { data, isLoading, error, fetchNextPage, hasNextPage } =
    trpc.user.list.useInfiniteQuery(
      { limit: 10 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.pages.flatMap((page) =>
        page.users.map((user) => (
          <div key={user.id} className="p-4 border-b">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>
        ))
      )}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          className="mt-4 p-2 bg-blue-500 text-white"
        >
          Load More
        </button>
      )}
    </div>
  );
}
```

### 使用变更

```typescript
// packages/web/src/components/CreateUserForm.tsx
import { trpc } from "../utils/trpc";
import { useState } from "react";
import { z } from "zod";

export function CreateUserForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const utils = trpc.useUtils();

  const createUser = trpc.user.create.useMutation({
    onSuccess: (data) => {
      // 乐观更新 - 自动刷新用户列表
      utils.user.list.invalidate();
      // 或者设置特定数据
      utils.user.byId.setData({ id: data.id }, data);
      // 重置表单
      setEmail("");
      setName("");
    },
    onError: (error) => {
      console.error("Failed to create user:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate({ email, name });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
        required
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        required
      />
      <button type="submit" disabled={createUser.isLoading}>
        {createUser.isLoading ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
```

### 订阅

```typescript
// packages/api/src/routers/chat.ts
import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";

const ee = new EventEmitter();

export const chatRouter = router({
  onMessage: publicProcedure.subscription(() => {
    return observable<{ message: string }>((emit) => {
      const onMessage = (data: { message: string }) => {
        emit.next(data);
      };

      ee.on("message", onMessage);

      return () => {
        ee.off("message", onMessage);
      };
    });
  }),

  sendMessage: publicProcedure
    .input(z.object({ message: z.string() }))
    .mutation(({ input }) => {
      ee.emit("message", input);
      return input;
    }),
});
```

```typescript
// packages/web/src/components/Chat.tsx
import { trpc } from "../utils/trpc";

export function Chat() {
  const [messages, setMessages] = useState<string[]>([]);

  trpc.chat.onMessage.useSubscription(undefined, {
    onData(data) {
      setMessages((prev) => [...prev, data.message]);
    },
  });

  const sendMessage = trpc.chat.sendMessage.useMutation();

  return (
    <div>
      {messages.map((msg, i) => (
        <p key={i}>{msg}</p>
      ))}
      <button onClick={() => sendMessage.mutate({ message: "Hello!" })}>
        Send
      </button>
    </div>
  );
}
```

## 最佳实践

### 1. 中间件

```typescript
// packages/api/src/middlewares/rateLimit.ts
import { middleware } from "../trpc";
import { TRPCError } from "@trpc/server";

const rateLimit = new Map<string, number[]>();

export const rateLimitMiddleware = middleware(async ({ ctx, next, path }) => {
  const ip = ctx.req.ip;
  const now = Date.now();
  const windowMs = 60000; // 1 分钟
  const max = 100;

  const timestamps = rateLimit.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= max) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests",
    });
  }

  recent.push(now);
  rateLimit.set(ip, recent);

  return next();
});

// 使用
export const rateLimitedProcedure = publicProcedure
  .use(rateLimitMiddleware);
```

### 2. 错误处理

```typescript
// 自定义错误类
export class AppError extends Error {
  constructor(
    public code: "BAD_REQUEST" | "UNAUTHORIZED" | "NOT_FOUND" | "CONFLICT",
    message: string
  ) {
    super(message);
  }
}

// 格式化
export function formatError(error: unknown) {
  if (error instanceof AppError) {
    throw new TRPCError({
      code: error.code,
      message: error.message,
    });
  }
  throw error;
}
```

### 3. 数据加载策略

```typescript
// 并行加载
const userQuery = trpc.user.byId.useQuery({ id: "1" });
const postsQuery = trpc.post.infinitePosts.useQuery({ authorId: "1" });

// 依赖加载
const userQuery = trpc.user.byId.useQuery({ id: "1" });
const postsQuery = trpc.post.infinitePosts.useQuery(
  { authorId: userQuery.data?.id },
  { enabled: !!userQuery.data }
);

// 预加载
const utils = trpc.useUtils();
utils.user.byId.prefetch({ id: "1" });
```

### 4. 类型安全的事件

```typescript
// packages/api/src/trpc/events.ts
import { EventEmitter } from "events";

interface EventMap {
  userCreated: (user: { id: string; name: string }) => void;
  postPublished: (post: { id: string; title: string }) => void;
}

export const ee = new EventEmitter() as {
  on<K extends keyof EventMap>(event: K, listener: EventMap[K]): this;
  emit<K extends keyof EventMap>(event: K, ...args: Parameters<EventMap[K]>): boolean;
};
```

## 常用命令

```bash
# 安装依赖
pnpm add @trpc/server @trpc/client @trpc/react-query @tanstack/react-query zod superjson

# 开发模式
pnpm --filter api dev
pnpm --filter web dev

# 构建
pnpm --filter api build
pnpm --filter web build

# 类型检查
pnpm tsc --noEmit

# 生成类型 (独立客户端)
pnpm trpc-codegen --input ./packages/api/src/routers/_app.ts --output ./packages/web/src/types/trpc.ts
```

## 部署配置

### Docker

```dockerfile
# packages/api/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: "3.8"
services:
  api:
    build: ./packages/api
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/app
      - NODE_ENV=production
    depends_on:
      - db

  web:
    build: ./packages/web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:4000
    depends_on:
      - api

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "trpc-api",
      script: "dist/server.js",
      cwd: "./packages/api",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
  ],
};
```
