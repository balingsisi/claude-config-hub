# TanStack Query v5 数据获取模板

## 技术栈

- **核心**: @tanstack/react-query
- **开发工具**: @tanstack/react-query-devtools
- **数据获取**: Axios, Fetch API
- **状态管理**: React Context
- **类型安全**: TypeScript
- **缓存**: 内存缓存, 持久化缓存

## 项目结构

```
project/
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   ├── users.ts
│   │   ├── posts.ts
│   │   └── comments.ts
│   ├── hooks/
│   │   ├── useUsers.ts
│   │   ├── usePosts.ts
│   │   ├── useComments.ts
│   │   ├── useMutations.ts
│   │   └── useInfiniteQuery.ts
│   ├── components/
│   │   ├── QueryProvider.tsx
│   │   ├── QueryDemo.tsx
│   │   ├── UserList.tsx
│   │   └── PostList.tsx
│   ├── types/
│   │   ├── api.ts
│   │   └── query.ts
│   ├── utils/
│   │   └── queryHelpers.ts
│   └── lib/
│       └── queryClient.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### QueryClient 配置

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分钟
      gcTime: 1000 * 60 * 30, // 30分钟 (以前叫 cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});
```

### QueryProvider

```typescript
// src/components/QueryProvider.tsx
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// 使用
// App.tsx
import { QueryProvider } from './components/QueryProvider';

export default function App() {
  return (
    <QueryProvider>
      <YourApp />
    </QueryProvider>
  );
}
```

### API 客户端

```typescript
// src/api/client.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 处理未授权
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 基础查询

```typescript
// src/api/users.ts
import { apiClient } from './client';
import type { User } from '@/types/api';

export const userApi = {
  getAll: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users');
    return data;
  },

  getById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },

  create: async (user: Omit<User, 'id'>): Promise<User> => {
    const { data } = await apiClient.post<User>('/users', user);
    return data;
  },

  update: async (id: string, user: Partial<User>): Promise<User> => {
    const { data } = await apiClient.put<User>(`/users/${id}`, user);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
```

### useQuery Hook

```typescript
// src/hooks/useUsers.ts
import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/api/users';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: userApi.getAll,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => userApi.getById(id),
    enabled: !!id, // 只有在有 id 时才执行
  });
}

// 使用
function UserList() {
  const { data: users, isLoading, error, refetch } = useUsers();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      <ul>
        {users?.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### useMutation Hook

```typescript
// src/hooks/useMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/api/users';
import type { User } from '@/types/api';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.create,
    onSuccess: (newUser) => {
      // 使缓存失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // 或者直接更新缓存
      queryClient.setQueryData<User[]>(['users'], (old) => [
        ...(old || []),
        newUser,
      ]);
    },
    onError: (error) => {
      console.error('Failed to create user:', error);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      userApi.update(id, data),
    onSuccess: (updatedUser) => {
      // 更新单个用户的缓存
      queryClient.setQueryData<User>(['users', updatedUser.id], updatedUser);

      // 更新用户列表缓存
      queryClient.setQueryData<User[]>(['users'], (old) =>
        old?.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      );
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.delete,
    onSuccess: (_, deletedId) => {
      // 从缓存中移除
      queryClient.setQueryData<User[]>(['users'], (old) =>
        old?.filter((user) => user.id !== deletedId)
      );
    },
  });
}

// 使用
function CreateUserForm() {
  const createUser = useCreateUser();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createUser.mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" type="text" />
      <input name="email" type="email" />
      <button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### useInfiniteQuery Hook

```typescript
// src/hooks/useInfiniteQuery.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function useInfinitePosts() {
  return useInfiniteQuery({
    queryKey: ['posts', 'infinite'],
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get<PaginatedResponse<Post>>('/posts', {
        params: { cursor: pageParam, limit: 10 },
      });
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    getPreviousPageParam: (firstPage) => firstPage.nextCursor || undefined,
  });
}

// 使用
function InfinitePostList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfinitePosts();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.data.map((post) => (
            <div key={post.id}>{post.title}</div>
          ))}
        </React.Fragment>
      ))}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? 'Loading more...'
          : hasNextPage
          ? 'Load More'
          : 'Nothing more to load'}
      </button>
    </div>
  );
}
```

### 查询键工厂

```typescript
// src/utils/queryHelpers.ts
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.posts.lists(), { filters }] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
  },
};

// 使用
useQuery({ queryKey: queryKeys.users.list({ status: 'active' }) });
queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
```

### 并行查询

```typescript
// src/hooks/useParallelQueries.ts
import { useQueries } from '@tanstack/react-query';
import { userApi } from '@/api/users';
import { postApi } from '@/api/posts';

export function useUserAndPosts(userId: string) {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['users', userId],
        queryFn: () => userApi.getById(userId),
      },
      {
        queryKey: ['posts', 'user', userId],
        queryFn: () => postApi.getByUserId(userId),
      },
    ],
  });

  const [userQuery, postsQuery] = queries;

  return {
    user: userQuery.data,
    posts: postsQuery.data,
    isLoading: userQuery.isLoading || postsQuery.isLoading,
    error: userQuery.error || postsQuery.error,
  };
}
```

### 乐观更新

```typescript
// src/hooks/useOptimisticUpdate.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/api/users';
import type { User } from '@/types/api';

export function useOptimisticUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.update,
    onMutate: async (newUser) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: ['users', newUser.id] });

      // 保存旧数据
      const previousUser = queryClient.getQueryData<User>(['users', newUser.id]);

      // 乐观更新
      queryClient.setQueryData<User>(['users', newUser.id], (old) => ({
        ...old!,
        ...newUser.data,
      }));

      return { previousUser };
    },
    onError: (err, newUser, context) => {
      // 回滚
      queryClient.setQueryData(['users', newUser.id], context?.previousUser);
    },
    onSettled: (newUser) => {
      // 重新获取数据
      queryClient.invalidateQueries({ queryKey: ['users', newUser.id] });
    },
  });
}
```

### 持久化缓存

```typescript
// src/utils/persistQueryClient.ts
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { queryClient } from '@/lib/queryClient';

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'REACT_QUERY_OFFLINE_CACHE',
  serialize: JSON.stringify,
  deserialize: JSON.parse,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24小时
});
```

## 最佳实践

### 1. 查询键管理

```typescript
// 使用工厂模式管理查询键
export const keys = {
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
};

// 统一管理
useQuery({ queryKey: keys.users });
queryClient.invalidateQueries({ queryKey: keys.users });
```

### 2. 错误处理

```typescript
// 全局错误处理
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.error('Query error:', error);
      toast.error('Something went wrong');
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error('Mutation error:', error);
      toast.error('Operation failed');
    },
  }),
});
```

### 3. 请求去重

```typescript
// QueryClient 自动去重
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1分钟内的相同请求会被去重
    },
  },
});
```

### 4. 依赖查询

```typescript
// 依赖其他查询的结果
function useUserPosts(userId: string | undefined) {
  return useQuery({
    queryKey: ['posts', 'user', userId],
    queryFn: () => fetchUserPosts(userId!),
    enabled: !!userId, // 只有 userId 存在时才执行
  });
}
```

### 5. 预取数据

```typescript
// 预取下一页数据
function UserList() {
  const queryClient = useQueryClient();

  const handleMouseEnter = (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['users', userId],
      queryFn: () => userApi.getById(userId),
    });
  };

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id} onMouseEnter={() => handleMouseEnter(user.id)}>
          {user.name}
        </li>
      ))}
    </ul>
  );
}
```

## 常用命令

### 安装依赖

```bash
# React Query v5
npm install @tanstack/react-query

# 开发工具
npm install -D @tanstack/react-query-devtools

# 持久化
npm install @tanstack/react-query-persist-client
npm install @tanstack/query-sync-storage-persister
```

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## 部署配置

### 测试配置

```typescript
// __tests__/useUsers.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUsers } from '../useUsers';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

test('should fetch users', async () => {
  const { result } = renderHook(() => useUsers(), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(result.current.data).toHaveLength(10);
});
```

### Storybook 集成

```typescript
// .storybook/preview.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

export const decorators = [
  (Story) => (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  ),
];
```

## 性能优化

### 1. 结构化共享

```typescript
// QueryClient 默认启用结构化共享
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      structuralSharing: true, // 默认为 true
    },
  },
});
```

### 2. 选择性订阅

```typescript
// 只订阅需要的字段
function UserName({ userId }: { userId: string }) {
  const name = useQuery({
    queryKey: ['users', userId],
    queryFn: () => userApi.getById(userId),
    select: (user) => user.name, // 只选择 name 字段
  });

  return <div>{name.data}</div>;
}
```

### 3. 虚拟化长列表

```typescript
// 使用 react-window 虚拟化长列表
import { FixedSizeList } from 'react-window';

function VirtualizedUserList() {
  const { data: users } = useUsers();

  const Row = ({ index, style }) => (
    <div style={style}>{users[index].name}</div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={users.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

## 参考资料

- [TanStack Query v5 文档](https://tanstack.com/query/latest)
- [React Query v5 迁移指南](https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5)
- [最佳实践](https://tkdodo.eu/blog/practical-react-query)
- [性能优化](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
