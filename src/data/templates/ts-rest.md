# ts-rest 开发模板

## 技术栈

- **核心**: ts-rest (Type-safe REST API)
- **服务端**: Express / Fastify / NestJS / Next.js
- **客户端**: fetch / Axios / React Query / SWR
- **类型系统**: TypeScript 5.x
- **验证**: Zod / TypeBox

## 项目结构

```
ts-rest-project/
├── packages/
│   ├── contract/              # 共享 API 契约
│   │   ├── src/
│   │   │   ├── users.ts
│   │   │   ├── posts.ts
│   │   │   └── index.ts
│   │   └── package.json
│   ├── server/                # 服务端实现
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── users.ts
│   │   │   │   └── posts.ts
│   │   │   ├── db/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── package.json
│   └── client/                # 客户端应用
│       ├── src/
│       │   ├── api/
│       │   │   └── client.ts
│       │   ├── hooks/
│       │   │   └── use-users.ts
│       │   └── App.tsx
│       └── package.json
├── package.json
└── tsconfig.json
```

## 代码模式

### 定义 API 契约

```typescript
// packages/contract/src/users.ts
import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// 用户相关 Schema
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(['admin', 'user', 'guest']),
  createdAt: z.string().datetime(),
});

const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
});

const UpdateUserSchema = CreateUserSchema.partial();

export const usersContract = c.router({
  // 获取用户列表
  list: {
    method: 'GET',
    path: '/users',
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().min(1).max(100).default(10),
      role: z.enum(['admin', 'user', 'guest']).optional(),
      search: z.string().optional(),
    }),
    responses: {
      200: z.object({
        users: z.array(UserSchema),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
      }),
    },
    summary: 'Get paginated list of users',
  },

  // 获取单个用户
  get: {
    method: 'GET',
    path: '/users/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      200: UserSchema,
      404: z.object({
        message: z.string(),
      }),
    },
    summary: 'Get user by ID',
  },

  // 创建用户
  create: {
    method: 'POST',
    path: '/users',
    body: CreateUserSchema,
    responses: {
      201: UserSchema,
      400: z.object({
        message: z.string(),
        errors: z.array(z.any()).optional(),
      }),
    },
    summary: 'Create a new user',
  },

  // 更新用户
  update: {
    method: 'PATCH',
    path: '/users/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: UpdateUserSchema,
    responses: {
      200: UserSchema,
      404: z.object({
        message: z.string(),
      }),
    },
    summary: 'Update user by ID',
  },

  // 删除用户
  delete: {
    method: 'DELETE',
    path: '/users/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      204: z.void(),
      404: z.object({
        message: z.string(),
      }),
    },
    summary: 'Delete user by ID',
  },
});
```

### 组合契约

```typescript
// packages/contract/src/index.ts
import { initContract } from '@ts-rest/core';
import { usersContract } from './users';
import { postsContract } from './posts';

const c = initContract();

export const contract = c.router({
  users: usersContract,
  posts: postsContract,
}, {
  // 全局配置
  baseHeaders: z.object({
    authorization: z.string().optional(),
  }),
  
  // 通用响应
  commonResponses: {
    401: z.object({
      message: z.literal('Unauthorized'),
    }),
    500: z.object({
      message: z.string(),
    }),
  },
});

export type Contract = typeof contract;

// 导出类型
export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
```

### Express 服务端

```typescript
// packages/server/src/index.ts
import express from 'express';
import { createExpressEndpoints, initServer } from '@ts-rest/express';
import { contract } from '@repo/contract';
import { db } from './db';

const app = express();
app.use(express.json());

const s = initServer();

// 定义路由处理器
const usersRouter = s.router(contract.users, {
  list: async ({ query }) => {
    const { page, limit, role, search } = query;
    
    const where = {
      ...(role && { role }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.user.count({ where }),
    ]);

    return {
      status: 200,
      body: { users, total, page, limit },
    };
  },

  get: async ({ params }) => {
    const user = await db.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return {
        status: 404,
        body: { message: 'User not found' },
      };
    }

    return {
      status: 200,
      body: user,
    };
  },

  create: async ({ body, request }) => {
    // 验证邮箱唯一性
    const existing = await db.user.findUnique({
      where: { email: body.email },
    });

    if (existing) {
      return {
        status: 400,
        body: { message: 'Email already exists' },
      };
    }

    const user = await db.user.create({
      data: body,
    });

    return {
      status: 201,
      body: user,
    };
  },

  update: async ({ params, body }) => {
    const user = await db.user.update({
      where: { id: params.id },
      data: body,
    });

    if (!user) {
      return {
        status: 404,
        body: { message: 'User not found' },
      };
    }

    return {
      status: 200,
      body: user,
    };
  },

  delete: async ({ params }) => {
    await db.user.delete({
      where: { id: params.id },
    });

    return {
      status: 204,
      body: undefined,
    };
  },
});

// 注册路由
createExpressEndpoints(contract, s.router(contract, {
  users: usersRouter,
  posts: postsRouter,
}), app);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### Fastify 服务端

```typescript
// packages/server/src/index.ts
import Fastify from 'fastify';
import { initServer } from '@ts-rest/fastify';
import { contract } from '@repo/contract';

const fastify = Fastify({ logger: true });

const s = initServer();

fastify.register(async (fastify) => {
  fastify.register(s.plugin(contract, {
    users: {
      list: async ({ query }) => {
        // ... 实现同上
      },
      // ... 其他路由
    },
    posts: {
      // ... 帖子路由
    },
  }));
});

await fastify.listen({ port: 3000 });
```

### Next.js App Router 集成

```typescript
// app/api/[...ts-rest]/route.ts
import { createNextRoute, createNextRouter } from '@ts-rest/next';
import { contract } from '@repo/contract';
import { db } from '@/lib/db';

const usersRoute = createNextRoute(contract.users, {
  list: async ({ query }) => {
    const users = await db.user.findMany({
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return { status: 200, body: { users, total: 0, page: 1, limit: 10 } };
  },
  get: async ({ params }) => {
    const user = await db.user.findUnique({ where: { id: params.id } });
    return user 
      ? { status: 200, body: user }
      : { status: 404, body: { message: 'Not found' } };
  },
  // ... 其他路由
});

const router = createNextRouter(contract, {
  users: usersRoute,
  posts: postsRoute,
});

export { router as GET, router as POST, router as PUT, router as DELETE };
```

### 客户端配置

```typescript
// packages/client/src/api/client.ts
import { initClient } from '@ts-rest/core';
import { contract } from '@repo/contract';

export const client = initClient(contract, {
  baseUrl: 'http://localhost:3000',
  baseHeaders: {
    authorization: () => `Bearer ${getAccessToken()}`,
  },
  credentials: 'include',
});

// 使用示例
async function fetchUsers() {
  const response = await client.users.list({
    query: { page: 1, limit: 10 },
  });

  if (response.status === 200) {
    console.log(response.body.users);
  }
}

// 创建用户
async function createUser(data: CreateUserInput) {
  const response = await client.users.create({
    body: data,
  });

  switch (response.status) {
    case 201:
      return response.body;
    case 400:
      throw new Error(response.body.message);
    default:
      throw new Error('Unknown error');
  }
}
```

### React Query 集成

```typescript
// packages/client/src/hooks/use-users.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../api/client';

// 查询用户列表
export function useUsers(query: { page: number; limit: number; role?: string }) {
  return useQuery({
    queryKey: ['users', query],
    queryFn: async () => {
      const response = await client.users.list({ query });
      if (response.status !== 200) {
        throw new Error('Failed to fetch users');
      }
      return response.body;
    },
  });
}

// 查询单个用户
export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await client.users.get({ params: { id } });
      if (response.status === 404) {
        return null;
      }
      if (response.status !== 200) {
        throw new Error('Failed to fetch user');
      }
      return response.body;
    },
  });
}

// 创建用户
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserInput) => {
      const response = await client.users.create({ body: data });
      if (response.status !== 201) {
        throw new Error(response.body.message);
      }
      return response.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// 更新用户
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserInput }) => {
      const response = await client.users.update({
        params: { id },
        body: data,
      });
      if (response.status !== 200) {
        throw new Error(response.body.message);
      }
      return response.body;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', id] });
    },
  });
}

// 删除用户
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await client.users.delete({ params: { id } });
      if (response.status !== 204) {
        throw new Error('Failed to delete user');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

### 组件中使用

```typescript
// packages/client/src/components/UsersList.tsx
import { useState } from 'react';
import { useUsers, useDeleteUser } from '../hooks/use-users';

export function UsersList() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<string | undefined>();

  const { data, isLoading, error } = useUsers({
    page,
    limit: 10,
    role,
  });

  const deleteMutation = useDeleteUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <select value={role} onChange={(e) => setRole(e.target.value || undefined)}>
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
        <option value="guest">Guest</option>
      </select>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <button onClick={() => deleteMutation.mutate(user.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
        <span>Page {data?.page} of {Math.ceil((data?.total || 0) / 10)}</span>
        <button
          disabled={page * 10 >= (data?.total || 0)}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### React Query 扩展客户端

```typescript
// packages/client/src/api/react-client.ts
import { initClient, tsRestFetchApi } from '@ts-rest/core';
import { initTsRestReactQuery } from '@ts-rest/react-query';
import { contract } from '@repo/contract';

const client = initClient(contract, {
  baseUrl: '/api',
  credentials: 'include',
});

export const {
  useQuery: useTsRestQuery,
  useInfiniteQuery: useTsRestInfiniteQuery,
  useMutation: useTsRestMutation,
} = initTsRestReactQuery(client);

// 使用扩展客户端
export function useUsersQuery(query: { page: number; limit: number }) {
  return useTsRestQuery('users', 'list', { query });
}

export function useUserQuery(id: string) {
  return useTsRestQuery('users', 'get', { params: { id } });
}
```

## 最佳实践

### 1. 错误处理

```typescript
// 统一错误响应
const ErrorResponse = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
});

// 服务端错误处理
const errorHandler = (error: unknown) => {
  if (error instanceof z.ZodError) {
    return {
      status: 400,
      body: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.flatten(),
      },
    };
  }

  if (error instanceof NotFoundError) {
    return {
      status: 404,
      body: {
        code: 'NOT_FOUND',
        message: error.message,
      },
    };
  }

  return {
    status: 500,
    body: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  };
};
```

### 2. 中间件

```typescript
// packages/server/src/middleware/auth.ts
import { Request } from 'express';

export const withAuth = <T extends Request>(handler: (args: T) => Promise<any>) => {
  return async (args: T) => {
    const token = args.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return {
        status: 401,
        body: { message: 'Unauthorized' },
      };
    }

    try {
      const user = await verifyToken(token);
      (args as any).user = user;
      return handler(args);
    } catch (error) {
      return {
        status: 401,
        body: { message: 'Invalid token' },
      };
    }
  };
};

// 使用
const protectedRouter = s.router(contract.admin, {
  getUsers: withAuth(async ({ query, user }) => {
    // user 已注入
    return { status: 200, body: await getUsers(query) };
  }),
});
```

### 3. 文件上传

```typescript
// packages/contract/src/files.ts
export const filesContract = c.router({
  upload: {
    method: 'POST',
    path: '/files/upload',
    body: z.custom<File>(), // 使用 FormData
    contentType: 'multipart/form-data',
    responses: {
      200: z.object({
        url: z.string(),
        filename: z.string(),
      }),
    },
  },
});

// 服务端处理
const filesRouter = s.router(contract.files, {
  upload: async ({ body }) => {
    // body 是 File 对象
    const buffer = await body.arrayBuffer();
    const url = await uploadToS3(buffer, body.name);
    
    return {
      status: 200,
      body: { url, filename: body.name },
    };
  },
});
```

### 4. 流式响应

```typescript
// packages/contract/src/stream.ts
export const streamContract = c.router({
  stream: {
    method: 'GET',
    path: '/stream',
    responses: {
      200: z.any(), // 流式响应
    },
  },
});

// 服务端
const streamRouter = s.router(contract.stream, {
  stream: async () => {
    const stream = new ReadableStream({
      async start(controller) {
        for (let i = 0; i < 10; i++) {
          controller.enqueue(`data: ${i}\n\n`);
          await sleep(1000);
        }
        controller.close();
      },
    });

    return {
      status: 200,
      body: stream,
    };
  },
});
```

## 常用命令

```bash
# 安装
npm install @ts-rest/core

# 服务端适配器
npm install @ts-rest/express
npm install @ts-rest/fastify
npm install @ts-rest/nest
npm install @ts-rest/next

# 客户端集成
npm install @ts-rest/react-query
npm install @ts-rest/solid-query
npm install @ts-rest/vue-query

# 测试
npm run test

# 类型检查
tsc --noEmit
```

## 部署配置

### Monorepo 配置

```json
// package.json
{
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test"
  }
}

// packages/contract/package.json
{
  "name": "@repo/contract",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "default": "./dist/index.js"
    }
  }
}
```

### 环境变量

```bash
# .env
API_BASE_URL=http://localhost:3000
API_TIMEOUT=30000

# 生产
API_BASE_URL=https://api.example.com
```

### OpenAPI 生成

```typescript
// scripts/generate-openapi.ts
import { generateOpenApi } from '@ts-rest/open-api';
import { contract } from '@repo/contract';

const openApi = generateOpenApi(contract, {
  info: {
    title: 'My API',
    version: '1.0.0',
  },
});

console.log(JSON.stringify(openApi, null, 2));
```

## 扩展资源

- [ts-rest 官方文档](https://ts-rest.com/)
- [ts-rest GitHub](https://github.com/ts-rest/ts-rest)
- [React Query 集成](https://ts-rest.com/docs/react-query)
- [Express 集成](https://ts-rest.com/docs/express)
- [OpenAPI 生成](https://ts-rest.com/docs/open-api)
