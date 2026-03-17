# MSW (Mock Service Worker) 模板

## 技术栈

- **核心库**: MSW 2.x (Mock Service Worker)
- **运行环境**: Service Worker (浏览器) / Node.js (测试)
- **请求处理**: Fetch API / Axios
- **类型系统**: TypeScript
- **测试框架**: Vitest / Jest / Playwright
- **开发工具**: MSW DevTools

## 项目结构

```
msw-mocking/
├── src/
│   ├── mocks/
│   │   ├── handlers/          # 请求处理器
│   │   │   ├── user.ts        # 用户相关接口
│   │   │   ├── post.ts        # 帖子相关接口
│   │   │   ├── auth.ts        # 认证相关接口
│   │   │   └── index.ts       # 汇总导出
│   │   ├── resolvers/         # 响应解析器
│   │   │   ├── userResolver.ts
│   │   │   └── postResolver.ts
│   │   ├── data/              # 模拟数据
│   │   │   ├── users.ts
│   │   │   ├── posts.ts
│   │   │   └── db.ts          # 数据库模拟
│   │   ├── browser.ts         # 浏览器端设置
│   │   ├── server.ts          # Node 端设置
│   │   └── node.ts            # Node 端入口
│   ├── api/                   # 真实 API 客户端
│   │   ├── client.ts
│   │   └── endpoints.ts
│   ├── hooks/                 # 数据获取 Hooks
│   ├── components/            # UI 组件
│   └── App.tsx
├── tests/
│   ├── setup.ts               # 测试设置
│   ├── integration/           # 集成测试
│   └── e2e/                   # 端到端测试
├── public/
│   └── mockServiceWorker.js   # 生成的 Service Worker
├── package.json
├── tsconfig.json
└── msw.config.ts              # MSW 配置
```

## 代码模式

### 1. 基础设置

```typescript
// src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

// src/main.tsx
async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    return worker.start({
      onUnhandledRequest: 'bypass', // 或 'warn' / 'error'
    });
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
```

```typescript
// src/mocks/server.ts (用于 Node 环境)
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// tests/setup.ts
import { server } from '../src/mocks/server';

beforeAll(() => server.listen({
  onUnhandledRequest: 'error',
}));

afterEach(() => server.resetHandlers());

afterAll(() => server.close());
```

### 2. 请求处理器 (Handlers)

```typescript
// src/mocks/handlers/user.ts
import { http, HttpResponse, delay } from 'msw';
import { db } from '../data/db';

const API_BASE = 'https://api.example.com';

export const userHandlers = [
  // GET - 获取用户列表
  http.get(`${API_BASE}/users`, async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    await delay(200); // 模拟网络延迟
    
    const users = db.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return HttpResponse.json({
      data: users,
      total: db.user.count(),
      page,
      limit,
    });
  }),
  
  // GET - 获取单个用户
  http.get(`${API_BASE}/users/:id`, async ({ params }) => {
    const { id } = params;
    
    await delay(100);
    
    const user = db.user.findFirst({
      where: { id: { equals: Number(id) } },
    });
    
    if (!user) {
      return new HttpResponse(null, {
        status: 404,
        statusText: 'User not found',
      });
    }
    
    return HttpResponse.json(user);
  }),
  
  // POST - 创建用户
  http.post(`${API_BASE}/users`, async ({ request }) => {
    const body = await request.json();
    
    await delay(300);
    
    // 验证数据
    if (!body.name || !body.email) {
      return new HttpResponse(
        JSON.stringify({ message: 'Name and email are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // 检查邮箱是否已存在
    const existingUser = db.user.findFirst({
      where: { email: { equals: body.email } },
    });
    
    if (existingUser) {
      return new HttpResponse(
        JSON.stringify({ message: 'Email already exists' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    const newUser = db.user.create({
      ...body,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    });
    
    return HttpResponse.json(newUser, { status: 201 });
  }),
  
  // PUT - 更新用户
  http.put(`${API_BASE}/users/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    
    await delay(200);
    
    const user = db.user.findFirst({
      where: { id: { equals: Number(id) } },
    });
    
    if (!user) {
      return new HttpResponse(null, { status: 404 });
    }
    
    const updatedUser = db.user.update({
      where: { id: { equals: Number(id) } },
      data: body,
    });
    
    return HttpResponse.json(updatedUser);
  }),
  
  // DELETE - 删除用户
  http.delete(`${API_BASE}/users/:id`, async ({ params }) => {
    const { id } = params;
    
    await delay(100);
    
    const user = db.user.findFirst({
      where: { id: { equals: Number(id) } },
    });
    
    if (!user) {
      return new HttpResponse(null, { status: 404 });
    }
    
    db.user.delete({
      where: { id: { equals: Number(id) } },
    });
    
    return new HttpResponse(null, { status: 204 });
  }),
];
```

```typescript
// src/mocks/handlers/auth.ts
import { http, HttpResponse, delay, passthrough } from 'msw';

const API_BASE = 'https://api.example.com';

export const authHandlers = [
  // POST - 登录
  http.post(`${API_BASE}/auth/login`, async ({ request, cookies }) => {
    const body = await request.json();
    
    await delay(500);
    
    if (body.email === 'test@example.com' && body.password === 'password') {
      return HttpResponse.json({
        user: {
          id: 1,
          email: body.email,
          name: 'Test User',
        },
        token: 'mock-jwt-token-12345',
      });
    }
    
    return new HttpResponse(
      JSON.stringify({ message: 'Invalid credentials' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),
  
  // POST - 注册
  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const body = await request.json();
    
    await delay(400);
    
    return HttpResponse.json(
      {
        user: {
          id: Date.now(),
          email: body.email,
          name: body.name,
        },
        token: 'mock-jwt-token-' + Date.now(),
      },
      { status: 201 }
    );
  }),
  
  // GET - 获取当前用户
  http.get(`${API_BASE}/auth/me`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    await delay(100);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return HttpResponse.json({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
    });
  }),
  
  // POST - 登出
  http.post(`${API_BASE}/auth/logout`, async () => {
    await delay(200);
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),
];
```

```typescript
// src/mocks/handlers/index.ts
import { userHandlers } from './user';
import { authHandlers } from './auth';
import { postHandlers } from './post';

export const handlers = [
  ...userHandlers,
  ...authHandlers,
  ...postHandlers,
];
```

### 3. 模拟数据库

```typescript
// src/mocks/data/db.ts
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: string;
}

// 简单的内存数据库
class MockDatabase {
  private users: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', createdAt: '2024-01-01' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', createdAt: '2024-01-02' },
  ];
  
  private posts: Post[] = [
    { id: 1, title: 'First Post', content: 'Content 1', authorId: 1, createdAt: '2024-01-01' },
    { id: 2, title: 'Second Post', content: 'Content 2', authorId: 2, createdAt: '2024-01-02' },
  ];
  
  user = {
    findMany: ({ skip = 0, take = 10 }: { skip?: number; take?: number } = {}) => {
      return this.users.slice(skip, skip + take);
    },
    
    findFirst: ({ where }: { where?: any }) => {
      return this.users.find(user => {
        if (where?.id?.equals) return user.id === where.id.equals;
        if (where?.email?.equals) return user.email === where.email.equals;
        return true;
      });
    },
    
    create: (data: Omit<User, 'id' | 'createdAt'>) => {
      const user: User = {
        ...data,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };
      this.users.push(user);
      return user;
    },
    
    update: ({ where, data }: { where: any; data: Partial<User> }) => {
      const index = this.users.findIndex(user => {
        if (where?.id?.equals) return user.id === where.id.equals;
        return false;
      });
      
      if (index === -1) return null;
      
      this.users[index] = { ...this.users[index], ...data };
      return this.users[index];
    },
    
    delete: ({ where }: { where: any }) => {
      const index = this.users.findIndex(user => {
        if (where?.id?.equals) return user.id === where.id.equals;
        return false;
      });
      
      if (index === -1) return null;
      
      this.users.splice(index, 1);
      return true;
    },
    
    count: () => this.users.length,
  };
  
  post = {
    findMany: ({ skip = 0, take = 10 }: { skip?: number; take?: number } = {}) => {
      return this.posts.slice(skip, skip + take);
    },
    
    // ... 类似的方法
  };
}

export const db = new MockDatabase();
```

### 4. 测试集成

```typescript
// tests/integration/user.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '../src/mocks/server';
import { http, HttpResponse } from 'msw';
import { userApi } from '../src/api/endpoints';

describe('User API', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  
  it('should fetch users', async () => {
    const users = await userApi.getUsers();
    expect(users.data).toHaveLength(2);
    expect(users.data[0]).toHaveProperty('name');
  });
  
  it('should create a new user', async () => {
    const newUser = await userApi.createUser({
      name: 'Test User',
      email: 'test@example.com',
    });
    
    expect(newUser.name).toBe('Test User');
    expect(newUser).toHaveProperty('id');
  });
  
  it('should handle errors', async () => {
    // 覆盖默认处理器来测试错误场景
    server.use(
      http.get('https://api.example.com/users', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );
    
    await expect(userApi.getUsers()).rejects.toThrow();
  });
  
  it('should handle specific user not found', async () => {
    server.use(
      http.get('https://api.example.com/users/:id', ({ params }) => {
        const { id } = params;
        if (id === '999') {
          return new HttpResponse(null, { status: 404 });
        }
        return HttpResponse.json({ id: 1, name: 'Test' });
      })
    );
    
    await expect(userApi.getUser('999')).rejects.toThrow();
  });
});

// tests/e2e/login.test.ts
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils';
import { LoginPage } from '../src/pages/LoginPage';

describe('Login Flow', () => {
  it('should login successfully', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });
});
```

### 5. React Query 集成

```typescript
// src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/endpoints';

export function useUsers(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['users', page, limit],
    queryFn: () => userApi.getUsers(page, limit),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userApi.getUser(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// 使用示例
function UserList() {
  const { data, isLoading, error } = useUsers(1, 10);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <ul>
      {data?.data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 6. 环境变量配置

```typescript
// src/config/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.example.com';

// .env.development
VITE_API_URL=https://api.example.com
VITE_ENABLE_MSW=true

// .env.production
VITE_API_URL=https://api.production.com
VITE_ENABLE_MSW=false

// src/main.tsx
async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true') {
    const { worker } = await import('./mocks/browser');
    return worker.start({
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    });
  }
}
```

### 7. 高级模式

```typescript
// src/mocks/handlers/pagination.ts
import { http, HttpResponse, delay } from 'msw';
import { db } from '../data/db';

export const paginationHandlers = [
  http.get('https://api.example.com/posts', async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    
    await delay(300);
    
    let posts = db.post.findMany();
    
    // 搜索过滤
    if (search) {
      posts = posts.filter(post =>
        post.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // 分页
    const total = posts.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedPosts = posts.slice(start, end);
    
    return HttpResponse.json({
      data: paginatedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }),
];

// src/mocks/handlers/upload.ts
export const uploadHandlers = [
  http.post('https://api.example.com/upload', async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new HttpResponse(
        JSON.stringify({ message: 'No file provided' }),
        { status: 400 }
      );
    }
    
    await delay(1000); // 模拟上传延迟
    
    return HttpResponse.json({
      url: `https://cdn.example.com/${file.name}`,
      filename: file.name,
      size: file.size,
      mimetype: file.type,
    });
  }),
];
```

## 最佳实践

### 1. 组织结构
- 按功能模块分组 handlers
- 使用 TypeScript 类型保证类型安全
- 模拟真实 API 的延迟和错误

### 2. 数据管理
- 使用独立的模拟数据库
- 支持增删改查操作
- 保持测试间的数据隔离

### 3. 测试策略
- 使用 `server.resetHandlers()` 重置
- 用 `server.use()` 覆盖特定场景
- 测试成功和失败两种情况

### 4. 开发体验
- 只在开发环境启用 MSW
- 使用 `onUnhandledRequest: 'warn'` 发现未处理请求
- 利用 DevTools 调试

### 5. 性能优化
- 控制延迟时间
- 避免不必要的模拟
- 使用真实的业务逻辑

## 常用命令

```bash
# 安装依赖
npm install msw --save-dev

# 初始化 Service Worker
npx msw init public/ --save

# 运行开发服务器
npm run dev

# 运行测试
npm run test

# 生成类型
npm run codegen

# 构建
npm run build
```

## 部署配置

### Package.json

```json
{
  "scripts": {
    "dev": "vite",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "msw:init": "msw init public/ --save"
  },
  "devDependencies": {
    "msw": "^2.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

### Vitest 配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### CI/CD

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
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
```

## 总结

MSW 提供了：
✅ 真实的网络层拦截
✅ 浏览器和 Node 环境支持
✅ 类型安全的 API 模拟
✅ 与测试框架完美集成
✅ 无需修改应用代码

适用场景：
- 前端开发 API 模拟
- 单元测试和集成测试
- E2E 测试
- 演示和原型开发
- API 驱动开发
