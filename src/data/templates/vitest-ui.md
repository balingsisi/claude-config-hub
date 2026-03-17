# Vitest UI 可视化测试模板

## 技术栈

- **测试框架**: Vitest 1.x
- **可视化界面**: @vitest/ui
- **断言库**: Vitest (内置)
- **测试工具**: @vue/test-utils / @testing-library/react
- **模拟工具**: vi (Vitest 内置)
- **覆盖率**: @vitest/coverage-v8
- **语言**: TypeScript

## 项目结构

```
vitest-ui/
├── src/
│   ├── components/          # 组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── hooks/              # 自定义 Hooks
│   │   ├── useCounter.ts
│   │   └── useFetch.ts
│   ├── utils/              # 工具函数
│   │   ├── format.ts
│   │   └── validation.ts
│   └── App.tsx
├── tests/
│   ├── unit/               # 单元测试
│   │   ├── utils/
│   │   │   ├── format.test.ts
│   │   │   └── validation.test.ts
│   │   └── hooks/
│   │       ├── useCounter.test.ts
│   │       └── useFetch.test.ts
│   ├── components/         # 组件测试
│   │   ├── Button.test.tsx
│   │   ├── Input.test.tsx
│   │   └── Card.test.tsx
│   ├── integration/        # 集成测试
│   │   └── user-flow.test.tsx
│   ├── e2e/               # 端到端测试
│   │   └── app.test.ts
│   ├── setup.ts           # 测试设置
│   └── utils.tsx          # 测试工具
├── vitest.config.ts       # Vitest 配置
├ vite.config.ts          # Vite 配置
├── package.json
├── tsconfig.json
└── .env.test              # 测试环境变量
```

## 代码模式

### 1. Vitest 配置

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
    
    // 测试环境
    environment: 'jsdom',
    
    // 设置文件
    setupFiles: ['./tests/setup.ts'],
    
    // 包含的测试文件
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    
    // 排除的文件
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/types/**',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    
    // UI 配置
    ui: true,
    
    // 监听模式
    watch: true,
    
    // 并行测试
    threads: true,
    
    // 超时时间
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // 快照配置
    snapshotFormat: {
      escapeString: true,
      printBasicPrototype: true,
    },
    
    // 模拟配置
    deps: {
      interopDefault: true,
    },
    
    // 全局设置
    globalSetup: ['./tests/global-setup.ts'],
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

```typescript
// tests/setup.ts
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// 扩展断言
expect.extend(matchers);

// 每个测试后清理
afterEach(() => {
  cleanup();
});

// 全局模拟
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// 模拟 window.matchMedia
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

// 模拟 localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
```

### 2. 单元测试

```typescript
// src/utils/format.ts
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD'): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// tests/unit/utils/format.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatCurrency, formatDate, debounce } from '@/utils/format';

describe('formatCurrency', () => {
  it('should format USD currency correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });
  
  it('should format EUR currency correctly', () => {
    expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
  });
  
  it('should handle zero amount', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
  
  it('should handle negative amount', () => {
    expect(formatCurrency(-100)).toBe('-$100.00');
  });
  
  it.each([
    [1000, 'USD', '$1,000.00'],
    [1000, 'EUR', '€1,000.00'],
    [1000, 'GBP', '£1,000.00'],
    [1000, 'JPY', '¥1,000'],
  ])('should format %i %s as %s', (amount, currency, expected) => {
    expect(formatCurrency(amount, currency)).toBe(expected);
  });
});

describe('formatDate', () => {
  it('should format date with default format', () => {
    const date = new Date('2024-01-15T10:30:45');
    expect(formatDate(date)).toBe('2024-01-15');
  });
  
  it('should format date with custom format', () => {
    const date = new Date('2024-01-15T10:30:45');
    expect(formatDate(date, 'YYYY/MM/DD HH:mm:ss')).toBe('2024/01/15 10:30:45');
  });
  
  it('should handle string input', () => {
    expect(formatDate('2024-01-15')).toBe('2024-01-15');
  });
  
  it('should handle different date formats', () => {
    const date = '2024-12-25T15:45:30';
    expect(formatDate(date, 'DD-MM-YYYY')).toBe('25-12-2024');
    expect(formatDate(date, 'MM/DD/YYYY')).toBe('12/25/2024');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('should debounce function calls', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 1000);
    
    debouncedFn();
    debouncedFn();
    debouncedFn();
    
    expect(mockFn).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(1000);
    
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
  
  it('should pass arguments to debounced function', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 500);
    
    debouncedFn('arg1', 'arg2');
    
    vi.advanceTimersByTime(500);
    
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });
  
  it('should reset debounce on subsequent calls', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 1000);
    
    debouncedFn();
    vi.advanceTimersByTime(500);
    
    debouncedFn();
    vi.advanceTimersByTime(500);
    
    expect(mockFn).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(500);
    
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
```

### 3. Hook 测试

```typescript
// src/hooks/useCounter.ts
import { useState, useCallback } from 'react';

interface UseCounterOptions {
  initialValue?: number;
  min?: number;
  max?: number;
}

export function useCounter(options: UseCounterOptions = {}) {
  const { initialValue = 0, min = -Infinity, max = Infinity } = options;
  
  const [count, setCount] = useState(initialValue);
  
  const increment = useCallback(() => {
    setCount((prev) => Math.min(prev + 1, max));
  }, [max]);
  
  const decrement = useCallback(() => {
    setCount((prev) => Math.max(prev - 1, min));
  }, [min]);
  
  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);
  
  const setValue = useCallback(
    (value: number) => {
      setCount(Math.min(Math.max(value, min), max));
    },
    [min, max]
  );
  
  return {
    count,
    increment,
    decrement,
    reset,
    setValue,
  };
}

// tests/unit/hooks/useCounter.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '@/hooks/useCounter';

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
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(-1);
  });
  
  it('should reset count to initial value', () => {
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
  
  it('should respect max value', () => {
    const { result } = renderHook(() => useCounter({ max: 5 }));
    
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.increment();
      }
    });
    
    expect(result.current.count).toBe(5);
  });
  
  it('should respect min value', () => {
    const { result } = renderHook(() => useCounter({ min: 0 }));
    
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.decrement();
      }
    });
    
    expect(result.current.count).toBe(0);
  });
  
  it('should set value within bounds', () => {
    const { result } = renderHook(() =>
      useCounter({ min: 0, max: 10, initialValue: 5 })
    );
    
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

### 4. 组件测试

```typescript
// src/components/Button.tsx
import { forwardRef, ButtonHTMLAttributes } from 'react';
import './Button.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`btn btn-${variant} btn-${size} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <span className="spinner" data-testid="spinner" />}
        {!loading && leftIcon && <span className="left-icon">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="right-icon">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

// tests/components/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, ButtonProps } from '@/components/Button';

describe('Button', () => {
  const defaultProps: ButtonProps = {
    children: 'Click me',
  };
  
  it('should render correctly', () => {
    render(<Button {...defaultProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  
  it('should display children', () => {
    render(<Button {...defaultProps} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button {...defaultProps} onClick={handleClick} />);
    
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('should be disabled when disabled prop is true', () => {
    render(<Button {...defaultProps} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  it('should be disabled when loading', () => {
    render(<Button {...defaultProps} loading />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  it('should show spinner when loading', () => {
    render(<Button {...defaultProps} loading />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });
  
  it('should not trigger click when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button {...defaultProps} onClick={handleClick} disabled />);
    
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  it.each([
    ['primary', 'btn-primary'],
    ['secondary', 'btn-secondary'],
    ['outline', 'btn-outline'],
    ['ghost', 'btn-ghost'],
    ['danger', 'btn-danger'],
  ] as const)('should render %s variant', (variant, expectedClass) => {
    render(<Button {...defaultProps} variant={variant} />);
    expect(screen.getByRole('button')).toHaveClass(expectedClass);
  });
  
  it.each([
    ['sm', 'btn-sm'],
    ['md', 'btn-md'],
    ['lg', 'btn-lg'],
  ] as const)('should render %s size', (size, expectedClass) => {
    render(<Button {...defaultProps} size={size} />);
    expect(screen.getByRole('button')).toHaveClass(expectedClass);
  });
  
  it('should render left icon', () => {
    render(<Button {...defaultProps} leftIcon={<span data-testid="left-icon">←</span>} />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });
  
  it('should render right icon', () => {
    render(<Button {...defaultProps} rightIcon={<span data-testid="right-icon">→</span>} />);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });
  
  it('should accept custom className', () => {
    render(<Button {...defaultProps} className="custom-class" />);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
  
  it('should forward ref', () => {
    const ref = { current: null };
    render(<Button {...defaultProps} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
  
  it('should have correct type attribute', () => {
    render(<Button {...defaultProps} type="submit" />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
```

### 5. 模拟和 Spy

```typescript
// src/utils/api.ts
export async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}

// tests/unit/utils/api.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchUser } from '@/utils/api';

describe('fetchUser', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  
  it('should fetch user successfully', async () => {
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    } as Response);
    
    const user = await fetchUser('1');
    
    expect(fetch).toHaveBeenCalledWith('/api/users/1');
    expect(user).toEqual(mockUser);
  });
  
  it('should throw error when request fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);
    
    await expect(fetchUser('1')).rejects.toThrow('Failed to fetch user');
  });
  
  it('should handle network errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
    
    await expect(fetchUser('1')).rejects.toThrow('Network error');
  });
});

// 模拟模块
// src/utils/storage.ts
export const storage = {
  get: (key: string) => localStorage.getItem(key),
  set: (key: string, value: string) => localStorage.setItem(key, value),
  remove: (key: string) => localStorage.removeItem(key),
};

// tests/unit/utils/storage.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storage } from '@/utils/storage';

describe('storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should get item from localStorage', () => {
    const mockGetItem = vi.fn().mockReturnValue('value');
    Object.defineProperty(window, 'localStorage', {
      value: { getItem: mockGetItem },
    });
    
    const result = storage.get('key');
    
    expect(mockGetItem).toHaveBeenCalledWith('key');
    expect(result).toBe('value');
  });
  
  it('should set item to localStorage', () => {
    const mockSetItem = vi.fn();
    Object.defineProperty(window, 'localStorage', {
      value: { setItem: mockSetItem },
    });
    
    storage.set('key', 'value');
    
    expect(mockSetItem).toHaveBeenCalledWith('key', 'value');
  });
  
  it('should remove item from localStorage', () => {
    const mockRemoveItem = vi.fn();
    Object.defineProperty(window, 'localStorage', {
      value: { removeItem: mockRemoveItem },
    });
    
    storage.remove('key');
    
    expect(mockRemoveItem).toHaveBeenCalledWith('key');
  });
});
```

### 6. 快照测试

```typescript
// tests/components/Button.snapshot.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '@/components/Button';

describe('Button Snapshots', () => {
  it('should match primary button snapshot', () => {
    const { asFragment } = render(<Button variant="primary">Primary</Button>);
    expect(asFragment()).toMatchSnapshot();
  });
  
  it('should match secondary button snapshot', () => {
    const { asFragment } = render(<Button variant="secondary">Secondary</Button>);
    expect(asFragment()).toMatchSnapshot();
  });
  
  it('should match loading button snapshot', () => {
    const { asFragment } = render(<Button loading>Loading</Button>);
    expect(asFragment()).toMatchSnapshot();
  });
  
  it('should match button with icons snapshot', () => {
    const { asFragment } = render(
      <Button leftIcon={<span>←</span>} rightIcon={<span>→</span>}>
        With Icons
      </Button>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});

// 更新快照: vitest -u
```

### 7. 集成测试

```typescript
// tests/integration/user-flow.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@/App';
import { server } from '@/mocks/server';

describe('User Flow Integration', () => {
  beforeEach(() => {
    server.listen();
  });
  
  afterEach(() => {
    server.resetHandlers();
    server.close();
  });
  
  it('should complete user registration flow', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // 导航到注册页面
    await user.click(screen.getByText('Register'));
    
    // 填写表单
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    
    // 提交表单
    await user.click(screen.getByRole('button', { name: /register/i }));
    
    // 等待成功消息
    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
    });
    
    // 验证重定向到登录页
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
  });
  
  it('should complete login and dashboard access', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // 登录
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    // 等待登录成功并跳转到仪表板
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
    
    // 验证用户信息显示
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });
});
```

## 最佳实践

### 1. 测试组织
- 按功能分组测试
- 使用描述性的测试名称
- 遵循 AAA 模式 (Arrange, Act, Assert)

### 2. 模拟策略
- 只模拟外部依赖
- 避免过度模拟
- 使用真实的实现

### 3. 断言
- 使用具体的断言
- 避免多重断言
- 使用自定义匹配器

### 4. 性能
- 并行运行测试
- 使用快照测试
- 避免重复设置

### 5. 可维护性
- DRY 原则
- 使用测试工具函数
- 定期重构测试

## 常用命令

```bash
# 安装依赖
npm install -D vitest @vitest/ui @vitest/coverage-v8

# 运行测试
npm run test

# 运行测试 UI
npm run test:ui

# 运行测试并生成覆盖率
npm run test:coverage

# 监听模式
npm run test:watch

# 更新快照
npm run test -- -u

# 运行特定测试文件
npm run test Button.test.tsx

# 运行特定测试
npm run test -t "should render correctly"

# 并行运行
npm run test -- --threads

# 串行运行
npm run test -- --no-threads
```

## Package.json 配置

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "jsdom": "^24.0.0",
    "vitest": "^1.0.0"
  }
}
```

## Vitest UI 功能

### 1. 测试浏览器
- 查看所有测试文件
- 运行单个测试
- 查看测试结果
- 查看覆盖率

### 2. 测试详情
- 查看断言结果
- 查看错误信息
- 查看控制台输出
- 查看快照差异

### 3. 时间旅行
- 查看测试历史
- 比较测试结果
- 回放测试执行

### 4. 调试工具
- 断点调试
- 查看变量
- 单步执行
- 查看调用栈

## 部署配置

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
        run: npm run test:run
      
      - name: Generate coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true
```

### VSCode 配置

```json
// .vscode/settings.json
{
  "vitest.enable": true,
  "vitest.commandLine": "npm run test",
  "vitest.include": ["**/*.{test,spec}.{js,ts,jsx,tsx}"],
  "vitest.debugExclude": ["<node_internals>/**", "**/node_modules/**"]
}

// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Current Test File",
      "autoAttachChildProcesses": true,
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
      "program": "${workspaceRoot}/node_modules/vitest/vitest.mjs",
      "args": ["run", "${file}"],
      "smartStep": true,
      "console": "integratedTerminal"
    }
  ]
}
```

## 总结

Vitest UI 提供了：
✅ 可视化测试界面
✅ 快速的测试执行
✅ 全面的测试功能
✅ 优秀的开发体验
✅ 与 Vite 完美集成

适用场景：
- 单元测试
- 组件测试
- 集成测试
- 快照测试
- TDD 开发
- 持续集成
