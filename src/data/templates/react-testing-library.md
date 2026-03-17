# React Testing Library 测试模板

## 技术栈

- **核心库**: @testing-library/react v14+
- **测试框架**: Vitest / Jest
- **用户事件**: @testing-library/user-event
- **DOM 匹配**: @testing-library/jest-dom
- **快照测试**: Vitest / Jest Snapshot
- **Mock 工具**: vi.fn() / jest.fn(), msw
- **覆盖率**: c8 / Istanbul
- **E2E 补充**: Playwright / Cypress

## 项目结构

```
src/
├── components/
│   ├── Button.tsx
│   ├── Button.test.tsx      # 组件测试
│   └── __snapshots__/       # 快照文件
├── hooks/
│   ├── useCounter.ts
│   └── useCounter.test.ts   # Hook 测试
├── utils/
│   ├── format.ts
│   └── format.test.ts       # 工具函数测试
├── pages/
│   ├── Home.tsx
│   └── Home.test.tsx        # 页面集成测试
├── test/
│   ├── setup.ts             # 测试配置
│   ├── utils.tsx            # 自定义 render
│   └── mocks/               # Mock 数据
│       ├── handlers.ts      # MSW handlers
│       └── server.ts        # MSW server
└── vitest.config.ts
```

## 代码模式

### 1. 基础组件测试

```typescript
// src/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    
    render(<Button onClick={onClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

### 2. 异步操作测试

```typescript
// src/components/UserList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UserList } from './UserList';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('UserList', () => {
  it('displays loading state initially', () => {
    render(<UserList />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders user list after successful fetch', async () => {
    render(<UserList />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays error message on fetch failure', async () => {
    server.use(
      http.get('/api/users', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );
    
    render(<UserList />);
    
    await waitFor(() => {
      expect(screen.getByText(/error loading users/i)).toBeInTheDocument();
    });
  });

  it('retries fetch when retry button is clicked', async () => {
    const user = userEvent.setup();
    let callCount = 0;
    
    server.use(
      http.get('/api/users', () => {
        callCount++;
        if (callCount === 1) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json([{ id: 1, name: 'John' }]);
      })
    );
    
    render(<UserList />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('button', { name: /retry/i }));
    
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });
  });
});
```

### 3. 表单测试

```typescript
// src/components/LoginForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('submits form with valid credentials', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    
    render(<LoginForm onSubmit={onSubmit} />);
    
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
      });
    });
  });

  it('displays validation errors for invalid inputs', async () => {
    const user = userEvent.setup();
    
    render(<LoginForm onSubmit={vi.fn()} />);
    
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void;
    const onSubmit = vi.fn(() => new Promise<void>(resolve => {
      resolveSubmit = resolve;
    }));
    
    render(<LoginForm onSubmit={onSubmit} />);
    
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent(/signing in/i);
    
    resolveSubmit!();
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeEnabled();
    });
  });
});
```

### 4. Hook 测试

```typescript
// src/hooks/useCounter.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('initializes with custom value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('increments count', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });

  it('decrements count', () => {
    const { result } = renderHook(() => useCounter(5));
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(4);
  });

  it('resets count', () => {
    const { result } = renderHook(() => useCounter(10));
    
    act(() => {
      result.current.increment();
      result.current.increment();
    });
    
    expect(result.current.count).toBe(12);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.count).toBe(10);
  });
});
```

### 5. 自定义 Render 函数

```typescript
// src/test/utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';

// 创建测试用的 QueryClient
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

// 自定义 render 函数
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialEntries?: string[];
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const {
    queryClient = createTestQueryClient(),
    initialEntries = ['/'],
    ...renderOptions
  } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// 重新导出所有 testing-library 方法
export * from '@testing-library/react';
export { renderWithProviders as render };
```

### 6. MSW Mock 配置

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw';

export const handlers = [
  // GET 请求
  http.get('/api/users', async () => {
    await delay(100);
    return HttpResponse.json([
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ]);
  }),

  // POST 请求
  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    await delay(100);
    return HttpResponse.json(
      { id: 3, ...body },
      { status: 201 }
    );
  }),

  // 动态参数
  http.get('/api/users/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      id: Number(id),
      name: 'John Doe',
      email: 'john@example.com',
    });
  }),

  // 错误响应
  http.get('/api/error', () => {
    return new HttpResponse(null, { status: 500 });
  }),
];

// src/test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// src/test/setup.ts
import { beforeAll, afterAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';
import '@testing-library/jest-dom/vitest';

// MSW 服务器
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
```

### 7. 快照测试

```typescript
// src/components/Card.test.tsx
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card } from './Card';

describe('Card', () => {
  it('matches snapshot', () => {
    const { asFragment } = render(
      <Card title="Test Card" description="This is a test card">
        <p>Card content</p>
      </Card>
    );
    
    expect(asFragment()).toMatchSnapshot();
  });

  it('matches snapshot with different props', () => {
    const { asFragment } = render(
      <Card title="Another Card" description="Different description" variant="outlined">
        <p>Different content</p>
      </Card>
    );
    
    expect(asFragment()).toMatchSnapshot();
  });
});
```

## 最佳实践

### 1. 查询优先级

```typescript
// ✅ 优先使用用户可见的查询
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email/i);
screen.getByPlaceholderText(/enter email/i);
screen.getByText(/welcome/i);
screen.getByDisplayValue('john@example.com');

// ⚠️ 仅在必要时使用
screen.getByAltText(/profile picture/i);
screen.getByTitle(/close/i);

// ❌ 避免使用（容易变化）
screen.getByTestId('submit-button');
screen.getByClassName('btn-primary');
```

### 2. 用户交互

```typescript
// ✅ 使用 userEvent（推荐）
const user = userEvent.setup();
await user.click(button);
await user.type(input, 'text');
await user.selectOptions(select, 'option1');
await user.upload(fileInput, file);

// ❌ 避免 fireEvent（底层 API）
fireEvent.click(button); // 不模拟完整用户交互
```

### 3. 异步测试

```typescript
// ✅ 使用 waitFor 等待状态更新
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});

// ✅ 使用 findBy（自带等待）
const element = await screen.findByText(/success/i);

// ❌ 避免使用 setTimeout
await new Promise(resolve => setTimeout(resolve, 1000));
```

### 4. 测试隔离

```typescript
// ✅ 每个测试独立
describe('Component', () => {
  beforeEach(() => {
    // 重置状态
    server.resetHandlers();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('test 1', () => {
    // ...
  });

  it('test 2', () => {
    // ...
  });
});
```

### 5. Mock 最佳实践

```typescript
// ✅ Mock 外部依赖
vi.mock('@/lib/api', () => ({
  fetchUser: vi.fn(() => Promise.resolve({ id: 1, name: 'John' })),
}));

// ✅ 使用 MSW Mock API
server.use(
  http.get('/api/users', () => {
    return HttpResponse.json(mockUsers);
  })
);

// ❌ 避免过度 Mock
vi.mock('react'); // 不要 Mock React 本身
```

## 常用命令

```bash
# 运行测试
npm test

# 监听模式
npm run test:watch

# 覆盖率
npm run test:coverage

# 更新快照
npm run test:update

# 特定文件
npm test Button.test.tsx

# 并行运行
npm run test:parallel

# UI 模式（Vitest）
npm run test:ui

# 调试
npm run test:debug
```

## 测试配置

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:update": "vitest -u"
  }
}
```

### CI/CD 配置

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
```

## 调试技巧

### 1. debug() 方法

```typescript
import { render, screen, debug } from '@testing-library/react';

it('debugs the DOM', () => {
  render(<Component />);
  
  // 打印整个 DOM
  debug();
  
  // 打印特定元素
  debug(screen.getByRole('button'));
});
```

### 2. logTestingPlaygroundURL()

```typescript
import { screen } from '@testing-library/react';

it('generates playground URL', () => {
  render(<Component />);
  
  // 生成浏览器调试 URL
  screen.logTestingPlaygroundURL();
});
```

### 3. 快照差异

```typescript
it('detects snapshot changes', () => {
  const { asFragment } = render(<Component />);
  expect(asFragment()).toMatchSnapshot();
  
  // 更新快照：npm run test:update
});
```

## 扩展资源

- [Testing Library 官方文档](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest 文档](https://vitest.dev/)
- [MSW 文档](https://mswjs.io/)
- [常见错误](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
