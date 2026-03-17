# Axios HTTP 客户端模板

## 技术栈

- **Axios**: 1.x (HTTP 客户端)
- **React**: 18.x
- **TypeScript**: 5.x
- **请求缓存**: axios-cache-interceptor
- **重试机制**: axios-retry
- **测试**: Vitest + MSW (Mock Service Worker)

## 项目结构

```
src/
├── api/                       # API层
│   ├── client/               # Axios客户端
│   │   ├── index.ts          # 默认客户端
│   │   ├── authClient.ts     # 认证客户端
│   │   └── uploadClient.ts   # 文件上传客户端
│   ├── interceptors/         # 拦截器
│   │   ├── request.ts        # 请求拦截器
│   │   ├── response.ts       # 响应拦截器
│   │   ├── error.ts          # 错误处理
│   │   └── auth.ts           # 认证拦截器
│   ├── services/             # API服务
│   │   ├── userService.ts    # 用户服务
│   │   ├── authService.ts    # 认证服务
│   │   ├── uploadService.ts  # 上传服务
│   │   └── index.ts          # 服务导出
│   ├── endpoints/            # 端点定义
│   │   ├── index.ts          # 端点常量
│   │   └── types.ts          # 端点类型
│   └── types/                # API类型
│       ├── common.ts         # 通用类型
│       ├── user.ts           # 用户类型
│       └── error.ts          # 错误类型
├── hooks/                    # React Hooks
│   ├── useApi.ts             # 通用API hook
│   ├── useQuery.ts           # 查询hook
│   ├── useMutation.ts        # 变更hook
│   └── useUpload.ts          # 上传hook
├── utils/                    # 工具函数
│   ├── retry.ts              # 重试逻辑
│   ├── cache.ts              # 缓存工具
│   └── transform.ts          # 数据转换
├── middleware/               # 中间件
│   ├── logger.ts             # 日志中间件
│   └── metrics.ts            # 指标收集
└── __tests__/               # 测试
    ├── api/
    ├── hooks/
    └── utils/
```

## 代码模式

### 基础客户端配置

```typescript
// api/client/index.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import axiosRetry from 'axios-retry';

// 创建基础配置
const createBaseConfig = (): AxiosRequestConfig => ({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 创建主客户端
const createApiClient = (): AxiosInstance => {
  const client = axios.create(createBaseConfig());

  // 启用缓存
  const cachedClient = setupCache(client, {
    ttl: 1000 * 60 * 5, // 5分钟缓存
    interpretHeader: true,
    modifiedSince: true,
    etag: true,
  });

  // 配置重试
  axiosRetry(cachedClient, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error: AxiosError) => {
      return (
        axiosRetry.isNetworkError(error) ||
        axiosRetry.isRetryableError(error) ||
        error.response?.status === 429 // Rate limit
      );
    },
    onRetry: (retryCount, error, requestConfig) => {
      console.log(`Retry attempt ${retryCount} for ${requestConfig.url}`);
    },
  });

  return cachedClient;
};

export const apiClient = createApiClient();
export default apiClient;
```

### 请求/响应拦截器

```typescript
// api/interceptors/request.ts
import { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAuthToken, refreshToken } from '@/utils/auth';

export function setupRequestInterceptors(client: AxiosInstance) {
  // 请求拦截器
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // 添加认证token
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 添加请求ID
      config.headers['X-Request-ID'] = crypto.randomUUID();

      // 添加时间戳
      config.metadata = { startTime: Date.now() };

      // 请求日志
      if (import.meta.env.DEV) {
        console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data,
        });
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
}

// api/interceptors/response.ts
import { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

export function setupResponseInterceptors(client: AxiosInstance) {
  // 响应拦截器
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // 记录响应时间
      const duration = Date.now() - response.config.metadata?.startTime;
      
      if (import.meta.env.DEV) {
        console.log(
          `[Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
          {
            status: response.status,
            duration: `${duration}ms`,
          }
        );
      }

      // 返回数据
      return response.data;
    },
    async (error: AxiosError) => {
      const { response, config } = error;

      // Token过期处理
      if (response?.status === 401 && !config?.headers?.['X-Retry']) {
        try {
          const newToken = await refreshToken();
          if (newToken && config) {
            config.headers.Authorization = `Bearer ${newToken}`;
            config.headers['X-Retry'] = 'true';
            return client.request(config);
          }
        } catch (refreshError) {
          // 跳转到登录页
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      // 格式化错误
      const apiError = {
        message: error.message,
        status: response?.status,
        data: response?.data,
        code: error.code,
      };

      return Promise.reject(apiError);
    }
  );
}

// api/interceptors/auth.ts
import { AxiosInstance } from 'axios';

export function setupAuthInterceptors(client: AxiosInstance) {
  client.interceptors.request.use((config) => {
    // 添加设备信息
    config.headers['X-Device-ID'] = getDeviceId();
    config.headers['X-Platform'] = getPlatform();
    
    return config;
  });
}

function getDeviceId(): string {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

function getPlatform(): string {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}
```

### API 服务层

```typescript
// api/services/userService.ts
import { apiClient } from '@/api/client';
import type { User, CreateUserDTO, UpdateUserDTO, UserQuery } from '@/api/types/user';
import type { PaginatedResponse, ApiResponse } from '@/api/types/common';

export const userService = {
  // 获取用户列表
  getUsers: async (query?: UserQuery): Promise<PaginatedResponse<User>> => {
    return apiClient.get('/users', { params: query });
  },

  // 获取单个用户
  getUser: async (id: string): Promise<ApiResponse<User>> => {
    return apiClient.get(`/users/${id}`);
  },

  // 创建用户
  createUser: async (data: CreateUserDTO): Promise<ApiResponse<User>> => {
    return apiClient.post('/users', data);
  },

  // 更新用户
  updateUser: async (id: string, data: UpdateUserDTO): Promise<ApiResponse<User>> => {
    return apiClient.patch(`/users/${id}`, data);
  },

  // 删除用户
  deleteUser: async (id: string): Promise<void> => {
    return apiClient.delete(`/users/${id}`);
  },

  // 批量操作
  batchUpdate: async (updates: Array<{ id: string; data: UpdateUserDTO }>): Promise<ApiResponse<User[]>> => {
    return apiClient.post('/users/batch', { updates });
  },

  // 导出数据
  exportUsers: async (format: 'csv' | 'xlsx'): Promise<Blob> => {
    const response = await apiClient.get('/users/export', {
      params: { format },
      responseType: 'blob',
    });
    return response;
  },

  // 搜索用户
  searchUsers: async (keyword: string, limit = 10): Promise<ApiResponse<User[]>> => {
    return apiClient.get('/users/search', {
      params: { q: keyword, limit },
    });
  },
};

// api/services/authService.ts
import { apiClient } from '@/api/client';
import type { LoginDTO, RegisterDTO, AuthResponse, TokenPayload } from '@/api/types/auth';

export const authService = {
  // 登录
  login: async (credentials: LoginDTO): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    // 保存token
    localStorage.setItem('access_token', response.accessToken);
    localStorage.setItem('refresh_token', response.refreshToken);
    
    return response;
  },

  // 注册
  register: async (data: RegisterDTO): Promise<AuthResponse> => {
    return apiClient.post('/auth/register', data);
  },

  // 登出
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  // 刷新token
  refreshToken: async (): Promise<string> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{ accessToken: string }>('/auth/refresh', {
      refreshToken,
    });

    localStorage.setItem('access_token', response.accessToken);
    return response.accessToken;
  },

  // 获取当前用户
  getCurrentUser: async (): Promise<TokenPayload> => {
    return apiClient.get('/auth/me');
  },

  // 验证token
  verifyToken: async (token: string): Promise<boolean> => {
    try {
      await apiClient.post('/auth/verify', { token });
      return true;
    } catch {
      return false;
    }
  },
};

// api/services/uploadService.ts
import { apiClient } from '@/api/client';
import type { UploadResponse, UploadProgress } from '@/api/types/upload';

export const uploadService = {
  // 单文件上传
  uploadFile: async (
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          });
        }
      },
    });

    return response;
  },

  // 多文件上传
  uploadMultiple: async (
    files: File[],
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadResponse[]> => {
    const results: UploadResponse[] = [];

    for (let i = 0; i < files.length; i++) {
      const result = await uploadService.uploadFile(files[i], (progress) => {
        onProgress?.(i, progress);
      });
      results.push(result);
    }

    return results;
  },

  // 分片上传（大文件）
  uploadChunked: async (
    file: File,
    chunkSize = 5 * 1024 * 1024, // 5MB
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> => {
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadId = crypto.randomUUID();

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('uploadId', uploadId);
      formData.append('chunkIndex', String(i));
      formData.append('totalChunks', String(totalChunks));

      await apiClient.post('/upload/chunk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onProgress?.({
        loaded: end,
        total: file.size,
        percentage: Math.round((end * 100) / file.size),
      });
    }

    // 合并分片
    const response = await apiClient.post<UploadResponse>('/upload/complete', {
      uploadId,
      filename: file.name,
      totalChunks,
    });

    return response;
  },
};
```

### React Hooks

```typescript
// hooks/useApi.ts
import { useState, useCallback } from 'react';
import { AxiosRequestConfig } from 'axios';
import { apiClient } from '@/api/client';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (config: AxiosRequestConfig): Promise<T> => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const data = await apiClient.request<T>(config);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const err = error as Error;
      setState({ data: null, loading: false, error: err });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

// hooks/useQuery.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { AxiosRequestConfig } from 'axios';
import { apiClient } from '@/api/client';

interface UseQueryOptions<T> extends AxiosRequestConfig {
  enabled?: boolean;
  cacheKey?: string;
  staleTime?: number;
  refetchInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useQuery<T>(options: UseQueryOptions<T>) {
  const {
    enabled = true,
    cacheKey,
    staleTime = 0,
    refetchInterval,
    onSuccess,
    onError,
    ...axiosConfig
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastFetchTime = useRef<number>(0);
  const abortController = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (force = false) => {
    // 检查是否需要强制刷新
    if (!force && staleTime > 0 && Date.now() - lastFetchTime.current < staleTime) {
      return;
    }

    // 取消之前的请求
    abortController.current?.abort();
    abortController.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.request<T>({
        ...axiosConfig,
        signal: abortController.current.signal,
      });

      setData(result);
      lastFetchTime.current = Date.now();
      onSuccess?.(result);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err as Error);
      onError?.(err as Error);
    } finally {
      setLoading(false);
    }
  }, [axiosConfig, staleTime, onSuccess, onError]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }

    return () => {
      abortController.current?.abort();
    };
  }, [enabled, fetchData]);

  // 自动刷新
  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(() => fetchData(), refetchInterval);
      return () => clearInterval(interval);
    }
  }, [refetchInterval, enabled, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
  };
}

// hooks/useMutation.ts
import { useState, useCallback } from 'react';
import { AxiosRequestConfig } from 'axios';
import { apiClient } from '@/api/client';

interface UseMutationOptions<T, V> {
  onMutate?: (variables: V) => void;
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: Error, variables: V) => void;
  onSettled?: (data: T | null, error: Error | null, variables: V) => void;
}

export function useMutation<T, V>(
  config: AxiosRequestConfig | ((variables: V) => AxiosRequestConfig),
  options: UseMutationOptions<T, V> = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (variables: V): Promise<T> => {
    setLoading(true);
    setError(null);
    options.onMutate?.(variables);

    try {
      const requestConfig = typeof config === 'function' ? config(variables) : config;
      const result = await apiClient.request<T>(requestConfig);

      setData(result);
      options.onSuccess?.(result, variables);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      options.onError?.(error, variables);
      throw error;
    } finally {
      setLoading(false);
      options.onSettled?.(data, error, variables);
    }
  }, [config, options, data, error]);

  return {
    data,
    loading,
    error,
    mutate,
    reset: () => {
      setData(null);
      setError(null);
      setLoading(false);
    },
  };
}

// 使用示例
function UserList() {
  const { data, loading, error, refetch } = useQuery<User[]>({
    url: '/users',
    staleTime: 1000 * 60, // 1分钟
    refetchInterval: 1000 * 30, // 30秒自动刷新
  });

  const createMutation = useMutation<User, CreateUserDTO>(
    (data) => ({
      method: 'POST',
      url: '/users',
      data,
    }),
    {
      onSuccess: () => {
        refetch();
      },
    }
  );

  const handleCreate = async (userData: CreateUserDTO) => {
    try {
      await createMutation.mutate(userData);
    } catch (error) {
      console.error('Create failed:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {data?.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 请求取消和竞态处理

```typescript
// utils/cancelToken.ts
import { CancelTokenSource } from 'axios';
import axios from 'axios';

export class RequestCanceller {
  private sources = new Map<string, CancelTokenSource>();

  createToken(key: string): CancelTokenSource {
    // 取消之前的请求
    this.cancel(key);

    const source = axios.CancelToken.source();
    this.sources.set(key, source);
    return source;
  }

  cancel(key: string, message?: string) {
    const source = this.sources.get(key);
    if (source) {
      source.cancel(message || 'Request cancelled');
      this.sources.delete(key);
    }
  }

  cancelAll(message?: string) {
    this.sources.forEach((source, key) => {
      source.cancel(message || `Request ${key} cancelled`);
    });
    this.sources.clear();
  }
}

// 使用示例
const canceller = new RequestCanceller();

async function searchUsers(query: string) {
  const source = canceller.createToken('search');
  
  try {
    return await apiClient.get('/users/search', {
      params: { q: query },
      cancelToken: source.token,
    });
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request cancelled:', error.message);
    }
    throw error;
  }
}

// hooks/useDebouncedQuery.ts
import { useState, useEffect, useRef } from 'react';
import { AxiosRequestConfig } from 'axios';
import { useQuery } from './useQuery';

export function useDebouncedQuery<T>(
  options: UseQueryOptions<T> & { debounceMs?: number }
) {
  const { debounceMs = 300, ...queryOptions } = options;
  const [debouncedParams, setDebouncedParams] = useState(queryOptions.params);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedParams(queryOptions.params);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [queryOptions.params, debounceMs]);

  return useQuery<T>({
    ...queryOptions,
    params: debouncedParams,
  });
}

// 使用示例
function SearchUsers() {
  const [keyword, setKeyword] = useState('');
  
  const { data, loading } = useDebouncedQuery<User[]>({
    url: '/users/search',
    params: { q: keyword },
    debounceMs: 500,
  });

  return (
    <div>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Search users..."
      />
      {loading && <div>Searching...</div>}
      <ul>
        {data?.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 错误处理

```typescript
// api/interceptors/error.ts
import { AxiosError, AxiosInstance } from 'axios';

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, any>;
}

export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string; details?: any }>;
    
    return {
      message: axiosError.response?.data?.message || 
               axiosError.response?.data?.error ||
               axiosError.message ||
               'An unexpected error occurred',
      code: axiosError.code || 'UNKNOWN_ERROR',
      status: axiosError.response?.status || 0,
      details: axiosError.response?.data?.details,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'CLIENT_ERROR',
      status: 0,
    };
  }

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    status: 0,
  };
}

export function setupErrorInterceptors(client: AxiosInstance) {
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const apiError = normalizeError(error);

      // 根据状态码处理
      switch (apiError.status) {
        case 400:
          console.error('Bad Request:', apiError.details);
          break;
        case 401:
          console.error('Unauthorized:', apiError.message);
          // 跳转到登录
          break;
        case 403:
          console.error('Forbidden:', apiError.message);
          break;
        case 404:
          console.error('Not Found:', apiError.message);
          break;
        case 500:
          console.error('Server Error:', apiError.message);
          break;
        case 503:
          console.error('Service Unavailable:', apiError.message);
          break;
      }

      return Promise.reject(apiError);
    }
  );
}

// Error Boundary
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ApiErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('API Error:', error, errorInfo);
    // 发送错误到监控服务
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 测试

```typescript
// __tests__/api/services/userService.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { userService } from '@/api/services/userService';

const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          { id: '1', name: 'John Doe', email: 'john@example.com' },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      })
    );
  }),

  rest.post('/api/users', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        data: { id: '2', ...(req.body as any) },
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('userService', () => {
  it('should fetch users', async () => {
    const result = await userService.getUsers({ page: 1 });
    
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('John Doe');
  });

  it('should create user', async () => {
    const newUser = { name: 'Jane Doe', email: 'jane@example.com' };
    const result = await userService.createUser(newUser);
    
    expect(result.data.name).toBe('Jane Doe');
  });

  it('should handle errors', async () => {
    server.use(
      rest.get('/api/users/:id', (req, res, ctx) => {
        return res(ctx.status(404), ctx.json({ message: 'User not found' }));
      })
    );

    await expect(userService.getUser('999')).rejects.toMatchObject({
      status: 404,
    });
  });
});

// __tests__/hooks/useQuery.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useQuery } from '@/hooks/useQuery';

describe('useQuery', () => {
  it('should fetch data successfully', async () => {
    const { result } = renderHook(() =>
      useQuery({ url: '/test' })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.error).toBeNull();
  });

  it('should handle errors', async () => {
    const { result } = renderHook(() =>
      useQuery({ url: '/error' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeNull();
  });
});
```

## 配置文件

### package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint . --ext ts,tsx",
    "type-check": "tsc --noEmit"
  }
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

## 最佳实践

1. **统一错误处理**: 使用拦截器统一处理错误
2. **请求取消**: 使用 AbortController 或 CancelToken 取消请求
3. **重试机制**: 对临时性错误实现自动重试
4. **缓存策略**: 合理使用缓存减少不必要的请求
5. **类型安全**: 为所有 API 响应定义类型
6. **请求日志**: 开发环境记录请求详情
7. **环境变量**: 使用环境变量配置 API 地址
8. **并发控制**: 对批量请求实现并发限制
9. **安全存储**: Token 存储考虑安全性
10. **性能监控**: 记录请求时间用于性能分析
