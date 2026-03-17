# SWR 数据获取模板

## 技术栈

- **SWR**: 2.x - React Hooks 数据获取库
- **React**: 18.x - UI 框架
- **TypeScript**: 5.x - 类型支持
- **Axios**: 1.x - HTTP 客户端（可选）
- **SWR DevTools**: 开发工具
- **SWR Mutation**: 数据变更
- **SWR Infinite**: 无限滚动
- **SWR Immer**: Immer 集成

## 项目结构

```
swr-project/
├── src/
│   ├── hooks/
│   │   ├── useUser.ts         # 用户相关 Hook
│   │   ├── useProducts.ts     # 产品相关 Hook
│   │   ├── useAuth.ts         # 认证 Hook
│   │   ├── useInfinite.ts     # 无限滚动 Hook
│   │   └── useMutation.ts     # 自定义 Mutation
│   ├── services/
│   │   ├── api.ts             # API 配置
│   │   ├── fetcher.ts         # 通用 Fetcher
│   │   ├── user.ts            # 用户 API
│   │   └── product.ts         # 产品 API
│   ├── store/
│   │   ├── swrConfig.ts       # SWR 全局配置
│   │   └── cache.ts           # 缓存管理
│   ├── components/
│   │   ├── DataBoundary.tsx   # 数据边界组件
│   │   ├── Loading.tsx        # 加载状态
│   │   └── ErrorBoundary.tsx  # 错误边界
│   ├── types/
│   │   └── api.ts             # API 类型定义
│   └── utils/
│       ├── retry.ts           # 重试策略
│       └── prefetch.ts        # 预取工具
├── public/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 代码模式

### 1. SWR 配置

```typescript
// src/store/swrConfig.ts
import SWRConfig from 'swr';
import type { SWRConfiguration } from 'swr';

// 全局配置
export const swrConfig: SWRConfiguration = {
  // 数据获取函数
  fetcher: (url: string) => fetch(url).then((res) => res.json()),

  // 重新验证配置
  revalidateOnFocus: true,        // 窗口聚焦时重新验证
  revalidateOnReconnect: true,    // 网络重连时重新验证
  revalidateOnMount: true,        // 组件挂载时验证
  shouldRetryOnError: true,       // 错误时重试

  // 缓存配置
  dedupingInterval: 2000,         // 2秒内重复请求去重
  focusThrottleInterval: 5000,    // 聚焦节流
  loadingTimeout: 3000,           // 加载超时

  // 错误重试
  errorRetryCount: 3,             // 重试次数
  errorRetryInterval: 5000,       // 重试间隔

  // 轮询
  refreshInterval: 0,             // 轮询间隔（0 = 禁用）
  refreshWhenHidden: false,       // 页面隐藏时刷新
  refreshWhenOffline: false,      // 离线时刷新

  // 其他
  suspense: false,                // Suspense 模式
  keepPreviousData: true,         // 保留旧数据
};

// Provider 配置
export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
}
```

### 2. Fetcher 函数

```typescript
// src/services/fetcher.ts
import type { AxiosError, AxiosRequestConfig } from 'axios';
import axios from 'axios';

// 基础 axios 实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // 处理未授权
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 通用 Fetcher
export const fetcher = async <T>(url: string): Promise<T> => {
  return api.get(url);
};

// POST Fetcher
export const postFetcher = async <T>(url: string, data?: unknown): Promise<T> => {
  return api.post(url, data);
};

// PUT Fetcher
export const putFetcher = async <T>(url: string, data?: unknown): Promise<T> => {
  return api.put(url, data);
};

// DELETE Fetcher
export const deleteFetcher = async <T>(url: string): Promise<T> => {
  return api.delete(url);
};

export { api };
```

### 3. 基础 Hooks

```typescript
// src/hooks/useUser.ts
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { fetcher, postFetcher, putFetcher, deleteFetcher } from '@/services/fetcher';
import type { User, UserCreate, UserUpdate } from '@/types/api';

// 获取单个用户
export function useUser(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<User>(
    id ? `/users/${id}` : null,
    fetcher
  );

  return {
    user: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// 获取用户列表
export function useUsers(params?: { page?: number; limit?: number; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.search) searchParams.set('search', params.search);

  const query = searchParams.toString();
  const key = query ? `/users?${query}` : '/users';

  const { data, error, isLoading, mutate } = useSWR<{ data: User[]; total: number }>(
    key,
    fetcher
  );

  return {
    users: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// 创建用户
export function useCreateUser() {
  const { trigger, isMutating, error } = useSWRMutation(
    '/users',
    (url: string, { arg }: { arg: UserCreate }) => postFetcher<User>(url, arg)
  );

  return {
    createUser: trigger,
    isCreating: isMutating,
    error,
  };
}

// 更新用户
export function useUpdateUser(id: string) {
  const { trigger, isMutating, error } = useSWRMutation(
    `/users/${id}`,
    (url: string, { arg }: { arg: UserUpdate }) => putFetcher<User>(url, arg)
  );

  return {
    updateUser: trigger,
    isUpdating: isMutating,
    error,
  };
}

// 删除用户
export function useDeleteUser() {
  const { trigger, isMutating, error } = useSWRMutation(
    '/users',
    (url: string, { arg }: { arg: string }) => deleteFetcher<void>(`${url}/${arg}`)
  );

  return {
    deleteUser: trigger,
    isDeleting: isMutating,
    error,
  };
}
```

### 4. 无限滚动

```typescript
// src/hooks/useInfinite.ts
import useSWRInfinite from 'swr/infinite';
import { fetcher } from '@/services/fetcher';
import type { User } from '@/types/api';

interface PaginatedResponse {
  data: User[];
  nextCursor: string | null;
  hasMore: boolean;
}

// 无限滚动 Hook
export function useInfiniteUsers(pageSize = 20) {
  const getKey = (pageIndex: number, previousPageData: PaginatedResponse | null) => {
    // 已到达末尾
    if (previousPageData && !previousPageData.hasMore) return null;

    // 第一页
    if (pageIndex === 0) return `/users?limit=${pageSize}`;

    // 后续页
    const cursor = previousPageData?.nextCursor;
    return `/users?limit=${pageSize}&cursor=${cursor}`;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<PaginatedResponse>(getKey, fetcher, {
      revalidateFirstPage: false, // 不重新验证第一页
      revalidateAll: false,       // 不重新验证所有页
    });

  // 扁平化数据
  const users = data ? data.flatMap((page) => page.data) : [];
  const isEmpty = data?.[0]?.data.length === 0;
  const isReachingEnd = isEmpty || (data && !data[data.length - 1]?.hasMore);
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');

  return {
    users,
    isLoading: isLoadingMore,
    isValidating,
    isError: !!error,
    error,
    size,
    setSize,
    loadMore: () => setSize(size + 1),
    hasMore: !isReachingEnd,
    mutate,
  };
}

// 使用示例
function UserList() {
  const { users, isLoading, hasMore, loadMore } = useInfiniteUsers(20);

  return (
    <div>
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
      {hasMore && (
        <button onClick={loadMore} disabled={isLoading}>
          {isLoading ? '加载中...' : '加载更多'}
        </button>
      )}
    </div>
  );
}
```

### 5. 乐观更新

```typescript
// src/hooks/useOptimisticUpdate.ts
import useSWRMutation from 'swr/mutation';
import { useSWRConfig } from 'swr';
import { putFetcher } from '@/services/fetcher';
import type { User, UserUpdate } from '@/types/api';

export function useOptimisticUserUpdate(id: string) {
  const { mutate } = useSWRConfig();

  const { trigger, isMutating } = useSWRMutation(
    `/users/${id}`,
    async (url: string, { arg }: { arg: UserUpdate }) => {
      // 乐观更新：立即更新缓存
      mutate(
        `/users/${id}`,
        (current: User | undefined) => (current ? { ...current, ...arg } : current),
        false // 不重新验证
      );

      try {
        // 实际 API 调用
        const result = await putFetcher<User>(url, arg);
        // 成功后重新验证
        mutate(`/users/${id}`);
        return result;
      } catch (error) {
        // 失败时回滚
        mutate(`/users/${id}`);
        throw error;
      }
    }
  );

  return {
    updateUser: trigger,
    isUpdating: isMutating,
  };
}

// 使用示例
function UserEditor({ userId }: { userId: string }) {
  const { user } = useUser(userId);
  const { updateUser, isUpdating } = useOptimisticUserUpdate(userId);

  const handleNameChange = (name: string) => {
    updateUser({ fullName: name });
  };

  return (
    <input
      value={user?.fullName}
      onChange={(e) => handleNameChange(e.target.value)}
      disabled={isUpdating}
    />
  );
}
```

### 6. 数据预取

```typescript
// src/utils/prefetch.ts
import { useSWRConfig } from 'swr';
import { fetcher } from '@/services/fetcher';

export function usePrefetch() {
  const { mutate, cache } = useSWRConfig();

  // 预取单个资源
  const prefetch = async <T>(key: string): Promise<T> => {
    // 检查缓存
    if (cache.get(key)) {
      return cache.get(key);
    }

    // 预取数据
    const data = await fetcher<T>(key);
    mutate(key, data, false);
    return data;
  };

  // 批量预取
  const prefetchMany = async (keys: string[]) => {
    await Promise.all(keys.map((key) => prefetch(key)));
  };

  // 预取相关数据
  const prefetchUserDetails = async (userIds: string[]) => {
    await prefetchMany(userIds.map((id) => `/users/${id}`));
  };

  return {
    prefetch,
    prefetchMany,
    prefetchUserDetails,
  };
}

// 使用示例
function UserList() {
  const { users } = useUsers();
  const { prefetch } = usePrefetch();

  return (
    <ul>
      {users.map((user) => (
        <li
          key={user.id}
          onMouseEnter={() => prefetch(`/users/${user.id}`)}
        >
          {user.name}
        </li>
      ))}
    </ul>
  );
}
```

### 7. 条件获取

```typescript
// src/hooks/useConditionalFetch.ts
import useSWR from 'swr';
import { fetcher } from '@/services/fetcher';

// 条件 1: 值为 null/undefined 时暂停
export function useUserWhenLoggedIn(userId: string | null) {
  return useSWR(userId ? `/users/${userId}` : null, fetcher);
}

// 条件 2: 基于其他数据
export function useUserPosts(userId: string | null) {
  const { data: user } = useUserWhenLoggedIn(userId);

  // 只有用户存在且有权限时才获取
  return useSWR(
    user && user.canViewPosts ? `/users/${userId}/posts` : null,
    fetcher
  );
}

// 条件 3: 基于函数
export function useSearchResults(query: string) {
  return useSWR(
    () => (query.length >= 3 ? `/search?q=${query}` : null),
    fetcher
  );
}

// 条件 4: 依赖多个条件
export function useDependentData() {
  const { data: user } = useSWR('/user', fetcher);
  const { data: permissions } = useSWR(() => (user ? `/permissions/${user.id}` : null), fetcher);
  const { data: resources } = useSWR(
    () => (user && permissions ? `/resources?user=${user.id}` : null),
    fetcher
  );

  return { user, permissions, resources };
}
```

## 最佳实践

### 1. 错误处理

```typescript
// ✅ 好的做法 - 统一错误处理
export function useUser(id: string) {
  const { data, error, isLoading } = useSWR<User>(
    `/users/${id}`,
    fetcher,
    {
      onError: (error) => {
        console.error('Failed to fetch user:', error);
        toast.error('获取用户失败');
      },
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // 404 不重试
        if (error.status === 404) return;
        // 最多重试 3 次
        if (retryCount >= 3) return;
        // 5 秒后重试
        setTimeout(() => revalidate({ retryCount }), 5000);
      },
    }
  );

  return { data, error, isLoading };
}

// ✅ 使用 Error Boundary
function UserProfile({ userId }: { userId: string }) {
  const { user, error, isLoading } = useUser(userId);

  if (isLoading) return <Loading />;
  if (error) throw error; // 抛给 Error Boundary

  return <div>{user?.name}</div>;
}

// ✅ 重试策略
const fetcherWithRetry = async (url: string) => {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      return await fetcher(url);
    } catch (error) {
      retryCount++;
      if (retryCount >= maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
    }
  }
};
```

### 2. 缓存管理

```typescript
// ✅ 手动缓存更新
import { useSWRConfig } from 'swr';

function useUserActions() {
  const { mutate } = useSWRConfig();

  const updateUser = async (id: string, data: Partial<User>) => {
    // 更新单个资源
    await mutate(`/users/${id}`, data, false);

    // 更新列表中的用户
    await mutate(
      '/users',
      (current: { data: User[] } | undefined) =>
        current
          ? {
              ...current,
              data: current.data.map((u) =>
                u.id === id ? { ...u, ...data } : u
              ),
            }
          : current,
      false
    );
  };

  const invalidateUser = async (id: string) => {
    // 使缓存失效，触发重新获取
    await mutate(`/users/${id}`);
  };

  const clearAllCache = () => {
    mutate(() => true, undefined, false);
  };

  return { updateUser, invalidateUser, clearAllCache };
}

// ✅ 缓存键策略
// 使用数组作为键
useSWR(['user', userId], fetcher);
useSWR(['posts', userId, { category }], fetcher);

// 序列化参数
const key = JSON.stringify(['search', { query, filters }]);
useSWR(key, fetcher);
```

### 3. 性能优化

```typescript
// ✅ 使用 keepPreviousData
export function useUserList(page: number) {
  return useSWR(`/users?page=${page}`, fetcher, {
    keepPreviousData: true, // 切换页面时保留旧数据
  });
}

// ✅ 去重配置
export function useExpensiveQuery() {
  return useSWR('/expensive-query', fetcher, {
    dedupingInterval: 60000, // 60秒内重复请求去重
  });
}

// ✅ 聚焦时重新验证
export function useRealTimeData() {
  return useSWR('/real-time', fetcher, {
    revalidateOnFocus: true,
    focusThrottleInterval: 5000, // 5秒节流
  });
}

// ✅ 轮询
export function usePollingData() {
  return useSWR('/notifications', fetcher, {
    refreshInterval: 5000, // 每5秒刷新
  });
}

// ✅ 懒加载
export function useLazyData(id: string | null) {
  return useSWR(id ? `/data/${id}` : null, fetcher);
}
```

### 4. 类型安全

```typescript
// ✅ 完整的类型定义
import type { SWRResponse, Key, Fetcher } from 'swr';

interface ApiError {
  message: string;
  code: string;
  status: number;
}

type ApiFetcher<T> = Fetcher<T, ApiError>;

// 类型安全的 Hook
export function useTypedSWR<T>(key: Key, fetcher: ApiFetcher<T>): SWRResponse<T, ApiError> {
  return useSWR<T, ApiError>(key, fetcher);
}

// 使用示例
interface Post {
  id: string;
  title: string;
  content: string;
}

export function usePost(id: string) {
  return useTypedSWR<Post>(`/posts/${id}`, fetcher);
  // data, error 都有完整类型
}
```

### 5. 测试

```typescript
// tests/hooks/useUser.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '@testing-library/react-hooks';
import { SWRConfig } from 'swr';
import { useUser } from '@/hooks/useUser';

describe('useUser', () => {
  it('should fetch user successfully', async () => {
    const mockUser = { id: '1', name: 'John' };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
        {children}
      </SWRConfig>
    );

    // Mock fetcher
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockUser),
      } as Response)
    );

    const { result } = renderHook(() => useUser('1'), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
  });

  it('should handle error', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
        {children}
      </SWRConfig>
    );

    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    const { result } = renderHook(() => useUser('1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
```

## 常用命令

### 开发命令

```bash
# 安装依赖
npm install swr axios
npm install -D @types/react

# 开发
npm run dev

# 构建
npm run build

# 类型检查
npm run type-check

# 测试
npm run test
npm run test:watch
```

### 调试命令

```bash
# 启用 SWR DevTools
REACT_APP_SWR_DEVTOOLS=true npm run dev

# 查看缓存状态
# 在浏览器控制台
window.__SWR_DEVTOOLS__.cache
```

## 部署配置

### 1. 环境变量

```env
# .env.local
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://ws.example.com

# .env.production
VITE_API_URL=https://prod-api.example.com
VITE_WS_URL=wss://prod-ws.example.com
```

### 2. Docker 配置

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3. Nginx 配置

```nginx
# nginx.conf
server {
    listen 80;
    server_name example.com;
    root /usr/share/nginx/html;
    index index.html;

    # SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass https://api.example.com;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4. CI/CD 配置

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run test
      - run: npm run build
        env:
          VITE_API_URL: ${{ secrets.API_URL }}

      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 相关资源

- [SWR 官方文档](https://swr.vercel.app/)
- [SWR GitHub](https://github.com/vercel/swr)
- [SWR DevTools](https://swr.vercel.app/docs/devtools)
- [数据获取最佳实践](https://swr.vercel.app/docs/data-fetching)
- [错误处理](https://swr.vercel.app/docs/error-handling)
- [缓存](https://swr.vercel.app/docs/advanced/cache)
