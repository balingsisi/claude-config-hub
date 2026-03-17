# Jest Testing 模板

## 技术栈

- **测试框架**: Jest 29.x
- **断言库**: Jest 内置（expect）
- **Mock**: Jest 内置（jest.fn(), jest.mock()）
- **覆盖率**: Jest 内置（istanbul）
- **DOM 测试**: @testing-library/react / jsdom
- **快照测试**: 内置支持
- **类型支持**: @types/jest
- **增强工具**: jest-extended

## 项目结构

```
jest-testing/
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
│   ├── fixtures/             # 测试数据
│   ├── mocks/                # Mock 数据
│   └── helpers/              # 测试工具
├── jest.config.js            # Jest 配置
├── jest.setup.js             # 全局 setup
├── jest.teardown.js          # 全局 teardown
├── package.json
└── tsconfig.json
```

## 代码模式

### Jest 配置

```javascript
// jest.config.js
module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',
  
  // 根目录
  roots: ['<rootDir>/src'],
  
  // 测试文件匹配
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  
  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // 路径别名
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/tests/__mocks__/fileMock.js',
  },
  
  // Setup 文件
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // 全局变量
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  
  // 转换
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  
  // 覆盖率配置
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/__tests__/**',
    '!src/**/index.{ts,tsx}',
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // 覆盖率报告
  coverageReporters: ['text', 'lcov', 'html'],
  
  // 覆盖率输出目录
  coverageDirectory: 'coverage',
  
  // 缓存
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // 监听插件
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // 快照序列化
  snapshotSerializers: ['@emotion/jest/serializer'],
  
  // 测试超时
  testTimeout: 10000,
  
  // 详细输出
  verbose: true,
  
  // 最大工作进程
  maxWorkers: '50%',
  
  // 错误时停止
  bail: 0,
  
  // 立即失败
  failFast: false,
};

// jest.setup.js
require('@testing-library/jest-dom');

// 全局 Mock
global.fetch = require('node-fetch');

// 扩展 expect
const { toBeWithinRange } = require('./tests/helpers/matchers');
expect.extend({ toBeWithinRange });

// 每个测试后清理
afterEach(() => {
  jest.clearAllMocks();
});

// 超时设置
jest.setTimeout(10000);

// 环境变量
process.env.NODE_ENV = 'test';

// tests/helpers/matchers.js
const { diff } = require('jest-diff');

expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}\n${diff(
              { range: [floor, ceiling] },
              { received }
            )}`,
    };
  },
  
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid email`
          : `expected ${received} to be a valid email`,
    };
  },
});
```

### 单元测试

```typescript
// src/utils/__tests__/helpers.test.ts
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
  
  it.each([
    ['2024-01-15', 'YYYY-MM-DD', '2024-01-15'],
    ['2024-12-25', 'MM/DD/YYYY', '12/25/2024'],
    ['2024-06-30', 'DD-MM-YYYY', '30-06-2024'],
  ])('should format %s with %s pattern', (date, pattern, expected) => {
    expect(formatDate(new Date(date), pattern)).toBe(expected);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should debounce function calls', () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass the latest arguments', () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn('first');
    debouncedFn('second');
    debouncedFn('third');

    jest.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledWith('third');
  });
});

describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should throttle function calls', () => {
    const fn = jest.fn();
    const throttledFn = throttle(fn, 300);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(300);
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
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should sleep for specified time', async () => {
    const start = Date.now();
    const sleepPromise = sleep(1000);

    jest.advanceTimersByTime(1000);
    await sleepPromise;

    expect(Date.now() - start).toBeGreaterThanOrEqual(1000);
  });
});
```

### React 组件测试

```typescript
// src/components/__tests__/Button.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
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
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');
    button.focus();
    fireEvent.keyDown(button, { key: 'Enter' });

    expect(handleClick).toHaveBeenCalled();
  });
});

// src/components/__tests__/UserCard.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserCard } from '../UserCard';

// Mock API
jest.mock('@/services/user', () => ({
  userService: {
    getUser: jest.fn(),
    updateUser: jest.fn(),
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
    jest.clearAllMocks();
  });

  it('should render user information', async () => {
    const mockUser = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://example.com/avatar.jpg',
    };

    const { userService } = require('@/services/user');
    userService.getUser.mockResolvedValue(mockUser);

    render(<UserCard userId="1" />, { wrapper: createWrapper() });

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    });

    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByAltText(mockUser.name)).toHaveAttribute('src', mockUser.avatar);
  });

  it('should show loading state', () => {
    const { userService } = require('@/services/user');
    userService.getUser.mockImplementation(() => new Promise(() => {}));

    render(<UserCard userId="1" />, { wrapper: createWrapper() });

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('should show error state', async () => {
    const { userService } = require('@/services/user');
    userService.getUser.mockRejectedValue(new Error('Not found'));

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

    const { userService } = require('@/services/user');
    userService.getUser.mockResolvedValue(mockUser);
    userService.updateUser.mockResolvedValue({
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
import { renderHook, act } from '@testing-library/react-hooks';
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
import { renderHook, act } from '@testing-library/react-hooks';
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
      result.current[1]((prev: number) => prev + 1);
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
import { userService } from '@/services/user';

// Mock fetch
global.fetch = jest.fn();

describe('User API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch users', async () => {
    const mockUsers = [
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    const users = await userService.getAll();

    expect(fetch).toHaveBeenCalledWith('/api/users');
    expect(users).toEqual(mockUsers);
  });

  it('should fetch single user', async () => {
    const mockUser = { id: '1', name: 'John', email: 'john@example.com' };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    const user = await userService.getById('1');

    expect(fetch).toHaveBeenCalledWith('/api/users/1');
    expect(user).toEqual(mockUser);
  });

  it('should create user', async () => {
    const newUser = { name: 'Bob', email: 'bob@example.com' };
    const createdUser = { id: '3', ...newUser };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => createdUser,
    });

    const user = await userService.create(newUser);

    expect(fetch).toHaveBeenCalledWith('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    expect(user).toEqual(createdUser);
  });

  it('should handle errors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(userService.getAll()).rejects.toThrow('Internal Server Error');
  });

  it('should handle network failure', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(userService.getAll()).rejects.toThrow('Network error');
  });
});

// 使用 axios mock
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('User API with Axios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch users', async () => {
    const mockUsers = [
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: mockUsers });

    const users = await userService.getAll();

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/users');
    expect(users).toEqual(mockUsers);
  });

  it('should handle 404', async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: { status: 404 },
    });

    await expect(userService.getById('999')).rejects.toThrow();
  });
});
```

### 快照测试

```typescript
// src/components/__tests__/Card.snapshot.test.tsx
import React from 'react';
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

  it('should match snapshot with children', () => {
    const { container } = render(
      <Card title="With Children">
        <p>Child content</p>
        <button>Click me</button>
      </Card>
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});

// 更新快照
// npm test -- -u
// npm test -- --updateSnapshot
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

// 使用 describe.each
describe.each([
  [1, 1, 2],
  [1, 2, 3],
  [2, 1, 3],
])('.add(%i, %i)', (a, b, expected) => {
  it(`returns ${expected}`, () => {
    expect(a + b).toBe(expected);
  });
});
```

### 2. Mock 策略

```typescript
// 自动 Mock
jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// 手动 Mock
const mockFn = jest.fn();

// Mock 实现
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock 返回值
const mockUser = { id: '1', name: 'John' };
userService.getById.mockReturnValue(mockUser);
userService.getById.mockResolvedValue(mockUser);
userService.getById.mockRejectedValue(new Error('Not found'));

// Spyon
import * as utils from '@/utils/helpers';

it('should call formatDate', () => {
  const spy = jest.spyOn(utils, 'formatDate');

  processDate(new Date());

  expect(spy).toHaveBeenCalled();
  expect(spy).toHaveBeenCalledWith(expect.any(Date));

  spy.mockRestore();
});

// Partial Mock
jest.mock('@/services/user', () => ({
  userService: {
    ...jest.requireActual('@/services/user'),
    create: jest.fn(),
  },
}));

// Mock 时间
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('should call timer', () => {
  const callback = jest.fn();
  setTimeout(callback, 1000);

  jest.advanceTimersByTime(1000);

  expect(callback).toHaveBeenCalled();
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock as any;

// Mock window
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
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
  const mockFetch = jest.fn().mockResolvedValue({ data: 'test' });

  await fetchDataWithCallback(mockFetch);

  expect(mockFetch).toHaveBeenCalled();
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

// 处理异步错误
it('should handle async error', async () => {
  await expect(fetchData()).rejects.toThrow('Network error');
});

// 使用 resolves/rejects
it('should resolve with data', async () => {
  await expect(fetchData()).resolves.toEqual({ id: 1 });
});

it('should reject with error', async () => {
  await expect(fetchData()).rejects.toThrow('Error');
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
# Jest CLI 命令

# 运行所有测试
npm test

# 监听模式
npm test -- --watch

# 运行特定文件
npm test Button.test.tsx

# 运行特定测试
npm test -t "should render"

# 生成覆盖率报告
npm test -- --coverage

# 更新快照
npm test -- -u

# 仅运行失败的测试
npm test -- --onlyFailures

# 并行运行
npm test -- --maxWorkers=4

# 串行运行
npm test -- --runInBand

# 详细输出
npm test -- --verbose

# 检测未使用的快照
npm test -- --ci

# 清除缓存
npm test -- --clearCache

# 显示缓存目录
npm test -- --showConfig | grep cacheDirectory

# 调试模式
node --inspect-brk node_modules/.bin/jest --runInBand

# 运行特定目录
npm test -- src/components

# 输出 JSON 报告
npm test -- --json --outputFile=test-results.json

# 使用配置文件
npm test -- --config=jest.config.js
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

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            coverage/
            test-results/
```

### Package.json 脚本

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "test:update": "jest -u",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "identity-obj-proxy": "^3.0.0",
    "jest-extended": "^4.0.0",
    "@faker-js/faker": "^8.0.0"
  }
}
```

### VSCode 配置

```json
// .vscode/settings.json
{
  "jest.autoEnable": true,
  "jest.pathToJest": "npm test --",
  "jest.runAllTestsFirst": false,
  "jest.showCoverageOnLoad": false
}

// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Current Test",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "${file}",
        "--config",
        "jest.config.js"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "windows": {
        "program": "${workspaceFolder}/node_modules/jest/bin/jest"
      }
    }
  ]
}
```

## 性能优化

### 1. 并行执行

```javascript
// jest.config.js
module.exports = {
  // 并行运行
  maxWorkers: '50%',
  
  // 分片执行（CI 环境）
  // npm test -- --shard=1/4
};
```

### 2. 测试隔离

```typescript
// 使用 beforeEach/afterEach 清理
beforeEach(() => {
  // 设置
});

afterEach(() => {
  jest.clearAllMocks();
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
// jest.setup.js
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// 测试文件中只 Mock 特定行为
const { useRouter } = require('next/router');
useRouter.mockReturnValue({
  push: jest.fn(),
});
```

### 4. 缓存优化

```javascript
// jest.config.js
module.exports = {
  // 启用缓存
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
};
```

## 参考资源

- [Jest 官方文档](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Jest DOM](https://github.com/testing-library/jest-dom)
- [Jest Extended](https://github.com/jest-community/jest-extended)
- [Jest GitHub](https://github.com/facebook/jest)
