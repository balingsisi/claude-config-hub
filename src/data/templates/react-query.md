# React Query 数据获取模板

## 技术栈

- **核心库**: @tanstack/react-query v5
- **开发工具**: @tanstack/react-query-devtools
- **数据获取**: Axios / Fetch API
- **状态管理**: React Query Cache
- **类型系统**: TypeScript
- **框架支持**: React, Next.js, Remix
- **测试**: @testing-library/react, msw

## 项目结构

```
src/
├── api/                    # API 配置
│   ├── client.ts          # Axios 实例配置
│   ├── endpoints.ts       # API 端点定义
│   └── interceptors.ts    # 请求/响应拦截器
├── hooks/                  # 自定义 Hooks
│   ├── queries/           # 查询 Hooks
│   │   ├── useUser.ts
│   │   ├── usePosts.ts
│   │   └── useProduct.ts
│   ├── mutations/         # 变更 Hooks
│   │   ├── useCreateUser.ts
│   │   ├── useUpdatePost.ts
│   │   └── useDeleteComment.ts
│   └── index.ts
├── types/                  # TypeScript 类型
│   ├── api.ts             # API 响应类型
│   ├── user.ts
│   └── post.ts
├── components/             # React 组件
│   ├── QueryProvider.tsx  # Query Client Provider
│   ├── QueryBoundary.tsx  # 错误边界
│   └── ui/
├── pages/                  # 页面组件
├── utils/                  # 工具函数
│   ├── queryKeys.ts       # Query Keys 工厂
│   └── cache.ts           # 缓存工具
└── App.tsx
```

## 代码模式

### 1. Query Client 配置

```typescript
// src/components/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      gcTime: 10 * 60 * 1000, // 10分钟 (原 cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 2. Query Keys 工厂模式

```typescript
// src/utils/queryKeys.ts
export const queryKeys = {
  // 用户相关
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  
  // 帖子相关
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters: PostFilters) =>
      [...queryKeys.posts.lists(), { filters }] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
    comments: (postId: string) =>
      [...queryKeys.posts.detail(postId), 'comments'] as const,
  },
  
  // 产品相关
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (category: string) =>
      [...queryKeys.products.lists(), category] as const,
    infinite: (category: string) =>
      [...queryKeys.products.all, 'infinite', category] as const,
  },
} as const;
```

### 3. 查询 Hook (useQuery)

```typescript
// src/hooks/queries/useUser.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';
import { userApi } from '@/api/endpoints';
import type { User } from '@/types/user';

export function useUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => userApi.getUser(userId),
    enabled: !!userId, // 只在 userId 存在时执行
    staleTime: 5 * 60 * 1000,
  });
}

export function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => userApi.getUsers(filters),
    staleTime: 2 * 60 * 1000,
  });
}

// 使用示例
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useUser(userId);
  
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <div>{user?.name}</div>;
}
```

### 4. 变更 Hook (useMutation)

```typescript
// src/hooks/mutations/useCreateUser.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/api/endpoints';
import { queryKeys } from '@/utils/queryKeys';
import { toast } from 'sonner';

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userApi.createUser,
    onMutate: async (newUser) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() });
      
      // 保存之前的数据用于回滚
      const previousUsers = queryClient.getQueryData(queryKeys.users.lists());
      
      // 乐观更新
      queryClient.setQueryData(queryKeys.users.lists(), (old: User[]) => [
        ...old,
        { ...newUser, id: 'temp-id' },
      ]);
      
      return { previousUsers };
    },
    onError: (error, newUser, context) => {
      // 回滚乐观更新
      queryClient.setQueryData(queryKeys.users.lists(), context?.previousUsers);
      toast.error('创建用户失败');
    },
    onSuccess: (data) => {
      // 使缓存失效，重新获取
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success('用户创建成功');
    },
    onSettled: () => {
      // 无论成功或失败都执行
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

// 使用示例
function CreateUserForm() {
  const createUser = useCreateUser();
  
  const handleSubmit = (data: CreateUserInput) => {
    createUser.mutate(data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? '创建中...' : '创建用户'}
      </button>
    </form>
  );
}
```

### 5. 无限滚动 (useInfiniteQuery)

```typescript
// src/hooks/queries/useInfinitePosts.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { postApi } from '@/api/endpoints';
import { queryKeys } from '@/utils/queryKeys';

interface PostPage {
  posts: Post[];
  nextCursor: string | null;
}

export function useInfinitePosts(category: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.list({ category }),
    queryFn: ({ pageParam }) => postApi.getPosts({ category, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: PostPage) => lastPage.nextCursor,
    getPreviousPageParam: (firstPage: PostPage) => firstPage.prevCursor,
    staleTime: 5 * 60 * 1000,
  });
}

// 使用示例
function PostList({ category }: { category: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePosts(category);
  
  const posts = data?.pages.flatMap((page) => page.posts) ?? [];
  
  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? '加载中...' : '加载更多'}
        </button>
      )}
    </div>
  );
}
```

### 6. 并行查询

```typescript
// src/hooks/queries/useDashboard.ts
import { useQueries } from '@tanstack/react-query';
import { userApi } from '@/api/endpoints';
import { postApi } from '@/api/endpoints';

export function useDashboard(userId: string) {
  const queries = useQueries({
    queries: [
      {
        queryKey: queryKeys.users.detail(userId),
        queryFn: () => userApi.getUser(userId),
      },
      {
        queryKey: queryKeys.posts.list({ authorId: userId }),
        queryFn: () => postApi.getPosts({ authorId: userId }),
      },
      {
        queryKey: queryKeys.users.stats(userId),
        queryFn: () => userApi.getUserStats(userId),
      },
    ],
  });
  
  const [userQuery, postsQuery, statsQuery] = queries;
  
  return {
    user: userQuery.data,
    posts: postsQuery.data,
    stats: statsQuery.data,
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
    errors: queries.map((q) => q.error).filter(Boolean),
  };
}
```

### 7. 依赖查询

```typescript
// src/hooks/queries/usePostComments.ts
export function usePostComments(postId: string | undefined) {
  const { data: post } = usePost(postId!);
  
  // 只有在 post 存在且有评论时才获取
  const { data: comments } = useQuery({
    queryKey: queryKeys.posts.comments(postId!),
    queryFn: () => commentApi.getComments(postId!),
    enabled: !!post && post.hasComments,
  });
  
  return { post, comments };
}
```

### 8. API 客户端

```typescript
// src/api/client.ts
import axios, { AxiosError, AxiosInstance } from 'axios';

const client: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && originalRequest) {
      // 刷新 token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return client(originalRequest);
        } catch (refreshError) {
          // 刷新失败，跳转登录
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default client;
```

## 最佳实践

### 1. Query Keys 管理
- 使用工厂模式创建 query keys
- 保持层级结构，便于批量失效
- 使用常量避免拼写错误

### 2. 数据获取策略
- 使用 `staleTime` 控制数据新鲜度
- 使用 `gcTime` 控制缓存保留时间
- 合理使用 `enabled` 条件查询

### 3. 错误处理
- 实现 `QueryErrorResetBoundary`
- 使用 Error Boundary 捕获错误
- 提供重试机制

### 4. 性能优化
- 使用 `select` 选择性订阅
- 避免不必要的重新渲染
- 合理使用并行查询

### 5. 缓存管理
- 及时失效过期数据
- 使用乐观更新提升体验
- 实现后台同步

### 6. TypeScript 支持
- 为所有查询定义类型
- 使用泛型提高复用性
- 导出类型供外部使用

## 常用命令

### 开发

```bash
# 安装依赖
npm install @tanstack/react-query @tanstack/react-query-devtools

# 启动开发服务器
npm run dev

# 类型检查
npm run type-check

# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage
```

### 调试

```typescript
// 启用开发工具
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>

// 控制台调试
queryClient.getQueryData(['users']);
queryClient.setQueryData(['users'], newData);
queryClient.invalidateQueries({ queryKey: ['users'] });
queryClient.clear();
```

## 部署配置

### 环境变量

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_QUERY_STALE_TIME=300000
NEXT_PUBLIC_QUERY_CACHE_TIME=600000
```

### SSR/SSG 配置 (Next.js)

```typescript
// src/app/page.tsx
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';
import { postApi } from '@/api/endpoints';

export default async function HomePage() {
  const queryClient = new QueryClient();
  
  // 预取数据
  await queryClient.prefetchQuery({
    queryKey: queryKeys.posts.lists(),
    queryFn: postApi.getPosts,
  });
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostList />
    </HydrationBoundary>
  );
}
```

### 测试配置 (Vitest + MSW)

```typescript
// src/test/setup.ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

export function renderWithQueryClient(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = createTestQueryClient();
  
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    ...options,
  });
}

// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'John Doe',
      email: 'john@example.com',
    });
  }),
];
```

### CI/CD (GitHub Actions)

```yaml
name: React Query CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
```
