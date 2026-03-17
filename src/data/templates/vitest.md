# Vitest 模板

## 技术栈
- **Vitest** - Vite 原生测试框架
- **Vite** - 构建工具
- **TypeScript** - 完整类型支持
- **@vitest/ui** - 可视化测试界面
- **@vitest/coverage-v8** - 代码覆盖率
- **Happy DOM / jsdom** - DOM 环境
- **MSW** - API Mock（可选）

## 项目结构
```
vitest-project/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx
│   ├── utils/
│   │   ├── format.ts
│   │   └── format.test.ts
│   ├── hooks/
│   │   ├── useCounter.ts
│   │   └── useCounter.test.ts
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── setup.ts           # 测试设置
│   ├── mocks/             # Mock 数据
│   │   └── handlers.ts    # MSW handlers
│   └── utils/
│       └── test-utils.tsx # 测试工具
├── vitest.config.ts
├── vite.config.ts
└── package.json
```

## 代码模式

### 基础单元测试
```typescript
// src/utils/format.ts
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// src/utils/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, slugify } from './format';

describe('formatCurrency', () => {
  it('should format USD currency', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('should format EUR currency', () => {
    expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('should handle negative numbers', () => {
    expect(formatCurrency(-100)).toBe('-$100.00');
  });
});

describe('formatDate', () => {
  it('should format date object', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('January 15, 2024');
  });

  it('should format date string', () => {
    expect(formatDate('2024-06-20')).toBe('June 20, 2024');
  });
});

describe('slugify', () => {
  it('should create slug from text', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should handle special characters', () => {
    expect(slugify('Hello! @World#')).toBe('hello-world');
  });

  it('should trim whitespace', () => {
    expect(slugify('  Hello World  ')).toBe('hello-world');
  });
});
```

### React 组件测试
```typescript
// src/components/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    disabled,
    className = '',
    ...props 
  }, ref) => {
    const baseStyles = 'rounded font-medium transition-colors';
    
    const variants = {
      primary: 'bg-blue-500 text-white hover:bg-blue-600',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
      danger: 'bg-red-500 text-white hover:bg-red-600',
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

// src/components/Button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('should render with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should apply variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-500');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-200');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-500');
  });

  it('should apply size styles', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5');

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3');
  });

  it('should show loading state', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    let clicked = false;
    
    render(<Button onClick={() => { clicked = true; }}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(clicked).toBe(true);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Hooks 测试
```typescript
// src/hooks/useCounter.ts
import { useState, useCallback } from 'react';

interface UseCounterOptions {
  initialValue?: number;
  min?: number;
  max?: number;
}

export function useCounter(options: UseCounterOptions = {}) {
  const { initialValue = 0, min, max } = options;
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount((prev) => {
      const next = prev + 1;
      return max !== undefined ? Math.min(next, max) : next;
    });
  }, [max]);

  const decrement = useCallback(() => {
    setCount((prev) => {
      const next = prev - 1;
      return min !== undefined ? Math.max(next, min) : next;
    });
  }, [min]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  const setValue = useCallback((value: number) => {
    setCount(() => {
      let next = value;
      if (min !== undefined) next = Math.max(next, min);
      if (max !== undefined) next = Math.min(next, max);
      return next;
    });
  }, [min, max]);

  return {
    count,
    increment,
    decrement,
    reset,
    setValue,
  };
}

// src/hooks/useCounter.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('should initialize with custom value', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 10 }));
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
    const { result } = renderHook(() => useCounter({ initialValue: 5 }));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it('should respect max value', () => {
    const { result } = renderHook(() => useCounter({ 
      initialValue: 9, 
      max: 10 
    }));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(10);

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(10); // 不会超过 max
  });

  it('should respect min value', () => {
    const { result } = renderHook(() => useCounter({ 
      initialValue: 1, 
      min: 0 
    }));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(0);

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(0); // 不会低于 min
  });

  it('should reset to initial value', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 5 }));

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

  it('should set value within bounds', () => {
    const { result } = renderHook(() => useCounter({ min: 0, max: 10 }));

    act(() => {
      result.current.setValue(15);
    });

    expect(result.current.count).toBe(10);

    act(() => {
      result.current.setValue(-5);
    });

    expect(result.current.count).toBe(0);
  });
});
```

### API Mock 测试
```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export interface User {
  id: number;
  name: string;
  email: string;
}

export async function getUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>('/users');
  return data;
}

export async function getUser(id: number): Promise<User> {
  const { data } = await api.get<User>(`/users/${id}`);
  return data;
}

export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const { data } = await api.post<User>('/users', user);
  return data;
}

// src/services/api.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { getUsers, getUser, createUser } from './api';

const handlers = [
  http.get('https://api.example.com/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Doe', email: 'jane@example.com' },
    ]);
  }),
  
  http.get('https://api.example.com/users/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      id: Number(id),
      name: 'John Doe',
      email: 'john@example.com',
    });
  }),
  
  http.post('https://api.example.com/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: 3,
      ...body,
    }, { status: 201 });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('API', () => {
  it('should fetch users', async () => {
    const users = await getUsers();
    expect(users).toHaveLength(2);
    expect(users[0].name).toBe('John Doe');
  });

  it('should fetch single user', async () => {
    const user = await getUser(1);
    expect(user.id).toBe(1);
    expect(user.name).toBe('John Doe');
  });

  it('should create user', async () => {
    const newUser = await createUser({
      name: 'Bob Smith',
      email: 'bob@example.com',
    });
    expect(newUser.id).toBe(3);
    expect(newUser.name).toBe('Bob Smith');
  });

  it('should handle errors', async () => {
    server.use(
      http.get('https://api.example.com/users', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    await expect(getUsers()).rejects.toThrow();
  });
});
```

### 测试工具
```typescript
// tests/utils/test-utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 创建测试用的 QueryClient
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

// 全局 Provider 包装器
interface WrapperProps {
  children: React.ReactNode;
}

function AllProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// 自定义 render 函数
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// 重新导出所有
export * from '@testing-library/react';
export { customRender as render };

// Mock IntersectionObserver
export function mockIntersectionObserver() {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver;
}

// Mock window.matchMedia
export function mockMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Mock localStorage
export function mockLocalStorage() {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
  
  return localStorageMock;
}
```

### 测试设置
```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// 每个测试后清理
afterEach(() => {
  cleanup();
});

// 全局 Mock
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

### 快照测试
```typescript
// src/components/Card.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <Card title="Test Card" description="This is a test card">
        <p>Card content</p>
      </Card>
    );
    
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with image', () => {
    const { container } = render(
      <Card 
        title="Card with Image" 
        image="https://example.com/image.jpg"
      />
    );
    
    expect(container).toMatchSnapshot();
  });
});
```

## 最佳实践

### 1. 测试组织
```typescript
// 使用 describe 嵌套组织测试
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', () => {});
    it('should throw error with invalid email', () => {});
    it('should throw error with duplicate email', () => {});
  });

  describe('updateUser', () => {
    it('should update user name', () => {});
    it('should update user email', () => {});
    it('should throw error if user not found', () => {});
  });
});
```

### 2. 使用 fixtures
```typescript
// tests/fixtures/users.ts
export const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Doe', email: 'jane@example.com' },
];

export const mockUser = mockUsers[0];

// tests/services/userService.test.ts
import { mockUsers, mockUser } from '../fixtures/users';

it('should return users', () => {
  // 使用 fixture
});
```

### 3. 参数化测试
```typescript
describe.each([
  ['USD', '$', 1234.56, '$1,234.56'],
  ['EUR', '€', 1234.56, '€1,234.56'],
  ['GBP', '£', 1234.56, '£1,234.56'],
])('formatCurrency with %s', (currency, symbol, amount, expected) => {
  it(`should format ${amount} as ${expected}`, () => {
    expect(formatCurrency(amount, currency)).toBe(expected);
  });
});
```

## 常用命令

### 运行测试
```bash
# 运行所有测试
vitest

# 运行特定文件
vitest button.test.tsx

# 监听模式
vitest watch

# UI 界面
vitest --ui

# 生成覆盖率
vitest --coverage

# 更新快照
vitest -u
```

### 调试
```bash
# 显示详细输出
vitest --reporter=verbose

# 显示测试时间
vitest --reporter=verbose --slowTestThreshold=100

# 运行失败的测试
vitest --failed
```

## 部署配置

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
      ],
    },
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### package.json
```json
{
  "name": "vitest-project",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest watch"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^14.2.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "@vitest/coverage-v8": "^1.2.0",
    "@vitest/ui": "^1.2.0",
    "happy-dom": "^13.0.0",
    "msw": "^2.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.2.0"
  }
}
```

### GitHub Actions CI
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

    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npm", "run", "test"]
```

### 忽略文件
```bash
# .gitignore
coverage/
.vitest/

# vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      reportsDirectory: './coverage',
    },
  },
});
```
