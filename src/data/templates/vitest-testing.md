# Vitest Testing 模板

## 技术栈

- **测试框架**: Vitest 1.x
- **断言库**: Vitest 内置（兼容 Jest）
- **覆盖率**: @vitest/coverage-v8
- **UI**: @vitest/ui
- **DOM 测试**: @testing-library/react / happy-dom
- **Mock**: Vitest 内置（vi）
- **E2E**: Playwright（可选）
- **快照测试**: 内置支持

## 项目结构

```
vitest-testing/
├── src/                       # 源代码
│   ├── components/           # React 组件
│   ├── hooks/                # 自定义 hooks
│   ├── utils/                # 工具函数
│   ├── services/             # 服务层
│   └── __tests__/            # 测试文件（就近放置）
│       ├── components/
│       ├── hooks/
│       ├── utils/
│       └── setup.ts          # 测试配置
├── tests/                    # 独立测试目录
│   ├── unit/                 # 单元测试
│   ├── integration/          # 集成测试
│   ├── e2e/                  # E2E 测试
│   ├── fixtures/             # 测试数据
│   ├── mocks/                # Mock 数据
│   └── helpers/              # 测试工具
├── vitest.config.ts          # Vitest 配置
├── vitest.setup.ts           # 全局 setup
├── vitest.workspace.ts       # 工作区配置（多项目）
├── playwright.config.ts      # E2E 配置
├── package.json
└── tsconfig.json
```

## 代码模式

### Vitest 配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // 全局变量
    globals: true,
    
    // 环境
    environment: 'happy-dom',
    
    // Setup 文件
    setupFiles: ['./vitest.setup.ts'],
    
    // 包含的测试文件
    include: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    
    // 排除的文件
    exclude: ['node_modules', 'dist', '.git', 'tests/e2e'],
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    
    // 并行执行
    threads: true,
    maxThreads: 4,
    minThreads: 1,
    
    // 超时配置
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // 监听模式
    watch: false,
    
    // 报告器
    reporters: ['default', 'html'],
    
    // 快照配置
    snapshotFormat: {
      escapeString: true,
      printBasicPrototype: true,
    },
    
    // 慢测试阈值
    slowTestThreshold: 300,
  },
  
  // 路径别名
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // 依赖优化
  deps: {
    interopDefault: true,
  },
});

// vitest.setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// 每个测试后清理
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// 全局 Mock
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// 扩展断言
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`,
    };
  },
});

// 声明扩展
declare module 'vitest' {
  interface Assertion {
    toBeWithinRange(floor: number, ceiling: number): void;
  }
}
```

### 单元测试

```typescript
// src/utils/__tests__/helpers.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatDate,
  debounce,
  throttle,
  deepClone,
  groupBy,
  sleep,
} from '../helpers';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15T10:30:00');
    expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15');
  });

  it('should handle different formats', () => {
    const date = new Date('2024-12-25T15:45:30');
    expect(formatDate(date, 'MM/DD/YYYY')).toBe('12/25/2024');
    expect(formatDate(date, 'DD-MM-YYYY HH:mm')).toBe('25-12-2024 15:45');
  });

  it('should throw on invalid date', () => {
    expect(() => formatDate(new Date('invalid'), 'YYYY-MM-DD')).toThrow();
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should debounce function calls', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass the latest arguments', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn('first');
    debouncedFn('second');
    debouncedFn('third');

    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledWith('third');
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should throttle function calls', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 300);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300);
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('deepClone', () => {
  it('should deep clone object', () => {
    const obj = {
      name: 'John',
      age: 30,
      address: {
        city: 'New York',
        country: 'USA',
      },
      hobbies: ['reading', 'coding'],
    };

    const cloned = deepClone(obj);

    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.address).not.toBe(obj.address);
    expect(cloned.hobbies).not.toBe(obj.hobbies);
  });

  it('should handle null and undefined', () => {
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBe(undefined);
  });
});

describe('groupBy', () => {
  it('should group array by key', () => {
    const users = [
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 30 },
      { name: 'Charlie', age: 25 },
    ];

    const grouped = groupBy(users, 'age');

    expect(grouped).toEqual({
      25: [
        { name: 'Alice', age: 25 },
        { name: 'Charlie', age: 25 },
      ],
      30: [{ name: 'Bob', age: 30 }],
    });
  });
});

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should sleep for specified time', async () => {
    const start = Date.now();
    const sleepPromise = sleep(1000);

    vi.advanceTimersByTime(1000);
    await sleepPromise;

    expect(Date.now() - start).toBeGreaterThanOrEqual(1000);
  });
});
```

### React 组件测试

```typescript
// src/components/__tests__/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should show loading state', () => {
    render(<Button loading>Click me</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should apply variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-danger');
  });

  it('should render as different elements', () => {
    const { rerender } = render(<Button as="a" href="/test">Link</Button>);
    expect(screen.getByRole('link')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/test');

    rerender(<Button as="span">Span</Button>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should support keyboard navigation', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');
    button.focus();
    fireEvent.keyDown(button, { key: 'Enter' });

    expect(handleClick).toHaveBeenCalled();
  });
});

// src/components/__tests__/UserCard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserCard } from '../UserCard';

// Mock API
vi.mock('@/services/user', () => ({
  userService: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

const createWrapper = () => {
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
};

describe('UserCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render user information', async () => {
    const mockUser = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://example.com/avatar.jpg',
    };

    vi.mocked(userService.getUser).mockResolvedValue(mockUser);

    render(<UserCard userId="1" />, { wrapper: createWrapper() });

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    });

    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByAltText(mockUser.name)).toHaveAttribute('src', mockUser.avatar);
  });

  it('should show loading state', () => {
    vi.mocked(userService.getUser).mockImplementation(() => new Promise(() => {}));

    render(<UserCard userId="1" />, { wrapper: createWrapper() });

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('should show error state', async () => {
    vi.mocked(userService.getUser).mockRejectedValue(new Error('Not found'));

    render(<UserCard userId="1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should allow editing user name', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    };

    vi.mocked(userService.getUser).mockResolvedValue(mockUser);
    vi.mocked(userService.updateUser).mockResolvedValue({
      ...mockUser,
      name: 'Jane Doe',
    });

    render(<UserCard userId="1" editable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    });

    // 点击编辑按钮
    await user.click(screen.getByRole('button', { name: /edit/i }));

    // 修改名字
    const input = screen.getByDisplayValue(mockUser.name);
    await user.clear(input);
    await user.type(input, 'Jane Doe');

    // 保存
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(userService.updateUser).toHaveBeenCalledWith('1', {
        name: 'Jane Doe',
      });
    });
  });
});
```

### Hook 测试

```typescript
// src/hooks/__tests__/useCounter.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../useCounter';

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('should initialize with custom value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('should increment count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should decrement count', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it('should reset count', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.increment();
      result.current.increment();
    });

    expect(result.current.count).toBe(7);

    act(() => {
      result.current.reset();
    });

    expect(result.current.count).toBe(5);
  });

  it('should not go below min value', () => {
    const { result } = renderHook(() => useCounter(0, { min: 0 }));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(0);
  });

  it('should not exceed max value', () => {
    const { result } = renderHook(() => useCounter(9, { max: 10 }));

    act(() => {
      result.current.increment();
      result.current.increment();
    });

    expect(result.current.count).toBe(10);
  });
});

// src/hooks/__tests__/useLocalStorage.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return initial value when no stored value', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'initial'));

    expect(result.current[0]).toBe('initial');
  });

  it('should return stored value', () => {
    localStorage.setItem('key', JSON.stringify('stored'));

    const { result } = renderHook(() => useLocalStorage('key', 'initial'));

    expect(result.current[0]).toBe('stored');
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('key')).toBe(JSON.stringify('updated'));
  });

  it('should handle function updates', () => {
    const { result } = renderHook(() => useLocalStorage('key', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });

  it('should handle complex objects', () => {
    const { result } = renderHook(() =>
      useLocalStorage('user', { name: '', age: 0 })
    );

    act(() => {
      result.current[1]({ name: 'John', age: 30 });
    });

    expect(result.current[0]).toEqual({ name: 'John', age: 30 });
  });
});
```

### API Mock 测试

```typescript
// tests/integration/api.test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { userService } from '@/services/user';

// MSW 服务器
const server = setupServer(
  // GET 用户列表
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ]);
  }),

  // GET 单个用户
  http.get('/api/users/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({ id, name: 'John', email: 'john@example.com' });
  }),

  // POST 创建用户
  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: '3', ...body }, { status: 201 });
  }),

  // 错误场景
  http.get('/api/error', () => {
    return new HttpResponse(null, { status: 500 });
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('User API', () => {
  it('should fetch users', async () => {
    const users = await userService.getAll();
    
    expect(users).toHaveLength(2);
    expect(users[0].name).toBe('John');
  });

  it('should fetch single user', async () => {
    const user = await userService.getById('1');
    
    expect(user.id).toBe('1');
    expect(user.name).toBe('John');
  });

  it('should create user', async () => {
    const newUser = { name: 'Bob', email: 'bob@example.com' };
    const user = await userService.create(newUser);
    
    expect(user.id).toBe('3');
    expect(user.name).toBe(newUser.name);
  });

  it('should handle errors', async () => {
    await expect(userService.fetchFromErrorEndpoint()).rejects.toThrow();
  });
});

// 使用 MSW 模拟网络错误
describe('Network Error Handling', () => {
  it('should handle network failure', async () => {
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.error();
      })
    );

    await expect(userService.getAll()).rejects.toThrow('Network error');
  });

  it('should handle timeout', async () => {
    server.use(
      http.get('/api/users', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return HttpResponse.json([]);
      })
    );

    await expect(userService.getAll({ timeout: 1000 })).rejects.toThrow('Timeout');
  });
});
```

### 快照测试

```typescript
// src/components/__tests__/Card.snapshot.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Card } from '../Card';

describe('Card Snapshots', () => {
  it('should match snapshot with basic props', () => {
    const { container } = render(
      <Card title="Test Card" description="This is a test card" />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match snapshot with all props', () => {
    const { container } = render(
      <Card
        title="Featured Card"
        description="A featured card with image"
        image="https://example.com/image.jpg"
        tags={['react', 'typescript']}
        footer={<button>Action</button>}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match inline snapshot', () => {
    const { container } = render(<Card title="Inline Snapshot" />);

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="card"
      >
        <h3
          class="card-title"
        >
          Inline Snapshot
        </h3>
      </div>
    `);
  });
});
```

## 最佳实践

### 1. 测试组织

```typescript
// 使用 describe 嵌套组织测试
describe('UserService', () => {
  describe('create', () => {
    it('should create user with valid data', () => {});
    it('should throw error with invalid email', () => {});
    it('should hash password', () => {});
  });

  describe('update', () => {
    it('should update user name', () => {});
    it('should not update email to existing one', () => {});
  });

  describe('delete', () => {
    it('should soft delete user', () => {});
    it('should cascade delete related data', () => {});
  });
});

// 使用 test.each 进行参数化测试
describe('validateEmail', () => {
  it.each([
    ['user@example.com', true],
    ['invalid-email', false],
    ['user@', false],
    ['@example.com', false],
    ['', false],
  ])('should return %s for %s', (email, expected) => {
    expect(validateEmail(email)).toBe(expected);
  });
});

// 使用 describe.skip 和 it.only
describe.skip('Feature not ready', () => {
  it('should work when implemented', () => {});
});

describe('Critical Feature', () => {
  it.only('must pass', () => {});
});
```

### 2. Mock 策略

```typescript
// 自动 Mock
vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// 手动 Mock
const mockFn = vi.fn();

// Mock 实现
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock 返回值
const mockUser = { id: '1', name: 'John' };
vi.mocked(userService.getById).mockReturnValue(mockUser);
vi.mocked(userService.getById).mockResolvedValue(mockUser);

// Spyon
import * as utils from '@/utils/helpers';

it('should call formatDate', () => {
  const spy = vi.spyOn(utils, 'formatDate');
  
  processDate(new Date());
  
  expect(spy).toHaveBeenCalled();
  expect(spy).toHaveBeenCalledWith(expect.any(Date));
  
  spy.mockRestore();
});

// Partial Mock
vi.mock('@/services/user', () => ({
  userService: {
    ...vi.importActual('@/services/user'),
    create: vi.fn(),
  },
}));
```

### 3. 异步测试

```typescript
// 等待 Promise
it('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});

// 等待状态更新
it('should update state', async () => {
  const { result } = renderHook(() => useData());

  await waitFor(() => {
    expect(result.current.data).toBeDefined();
  });
});

// 等待元素出现
it('should show loading then data', async () => {
  render(<DataComponent />);

  expect(screen.getByText('Loading')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});

// 等待 Mock 调用
it('should call API', async () => {
  const mockFetch = vi.fn().mockResolvedValue({ data: 'test' });

  await fetchDataWithCallback(mockFetch);

  expect(mockFetch).toHaveBeenCalled();
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
```

### 4. 测试数据管理

```typescript
// tests/fixtures/user.ts
export const userFixtures = {
  basic: {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
  },
  
  admin: {
    id: '2',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
  },
  
  withPosts: {
    id: '3',
    name: 'Author',
    email: 'author@example.com',
    posts: [
      { id: 'p1', title: 'Post 1' },
      { id: 'p2', title: 'Post 2' },
    ],
  },
};

// Factory 函数
export const createUser = (overrides = {}) => ({
  id: Math.random().toString(),
  name: 'Test User',
  email: 'test@example.com',
  ...overrides,
});

// 使用
it('should create user', () => {
  const user = createUser({ name: 'Custom Name' });
  expect(user.name).toBe('Custom Name');
});

// Faker.js 生成数据
import { faker } from '@faker-js/faker';

export const generateUser = () => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  avatar: faker.image.avatar(),
});
```

## 常用命令

```bash
# Vitest CLI 命令

# 运行所有测试
npm run test

# 监听模式
npm run test:watch

# UI 模式
npm run test:ui

# 生成覆盖率报告
npm run test:coverage

# 运行特定文件
npm run test Button.test.tsx

# 运行特定测试
npm run test -t "should render"

# 并行运行
npm run test --threads

# 串行运行
npm run test --no-threads

# 更新快照
npm run test -u

# 仅运行失败的测试
npm run test --reporter=verbose --bail=1

# 生成 HTML 报告
npm run test --reporter=html

# Watch 模式（只运行变更的测试）
npm run test --changed

# 运行 E2E 测试（Playwright）
npm run test:e2e

# 调试模式
npm run test --inspect
```

## 部署配置

### CI/CD 集成

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:coverage
        
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
      
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            coverage/
            test-results/
            playwright-report/
```

### Package.json 脚本

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:debug": "vitest --inspect-brk",
    "test:update": "vitest -u"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@playwright/test": "^1.40.0",
    "happy-dom": "^13.0.0",
    "msw": "^2.0.0",
    "@faker-js/faker": "^8.0.0"
  }
}
```

### VSCode 配置

```json
// .vscode/settings.json
{
  "vitest.enable": true,
  "vitest.commandLine": "npm run test",
  "vitest.include": ["**/__tests__/**/*.test.{ts,tsx}"],
  "vitest.debuggerPort": 9229
}

// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Current Test",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/vitest",
      "runtimeArgs": [
        "run",
        "${file}",
        "--inspect-brk"
      ],
      "port": 9229,
      "autoAttachChildProcesses": true
    }
  ]
}
```

## 性能优化

### 1. 并行执行

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    threads: true,
    maxThreads: 4,
    minThreads: 1,
    
    // 分片执行（CI 环境）
    shard: {
      current: 1,
      total: 4,
    },
  },
});
```

### 2. 测试隔离

```typescript
// 使用 beforeEach/afterEach 清理
beforeEach(() => {
  // 设置
});

afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});

// 使用 describe 块隔离
describe('Feature A', () => {
  let state: any;

  beforeEach(() => {
    state = createState();
  });

  it('test 1', () => {
    // 使用 state
  });
});
```

### 3. Mock 优化

```typescript
// 在 setup 文件中全局 Mock
// vitest.setup.ts
vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

// 测试文件中只 Mock 特定行为
vi.mocked(useRouter).mockReturnValue({
  push: vi.fn(),
});
```

## 参考资源

- [Vitest 官方文档](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW - Mock Service Worker](https://mswjs.io/)
- [Playwright](https://playwright.dev/)
- [Vitest GitHub](https://github.com/vitest-dev/vitest)
