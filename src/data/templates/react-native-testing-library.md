# React Native Testing Library 测试模板

## 技术栈

### 核心技术
- **@testing-library/react-native**: React Native 测试库
- **Jest**: 测试框架
- **React Test Renderer**: React Native 渲染器
- **@testing-library/jest-native**: Jest Native 匹配器
- **MSW Native**: API Mock（可选）

### 特性
- 专注于用户行为测试
- 与 React Native 深度集成
- 支持异步操作测试
- 内置可访问性查询
- 轻量且易用

## 项目结构

```
react-native-app/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   ├── UserCard.tsx
│   │   └── UserCard.test.tsx
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   └── HomeScreen.test.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useAuth.test.ts
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   └── services/
│       └── api.ts
├── __tests__/
│   ├── setup.ts
│   ├── setupFiles.ts
│   └── mocks/
│       ├── fileMock.js
│       ├── navigationMock.ts
│       └── asyncStorageMock.ts
├── jest.config.js
├── jest.setup.js
└── package.json
```

## 核心代码模式

### 1. Jest 配置

```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFiles: ['./__tests__/setupFiles.ts'],
  setupFilesAfterEnv: ['./__tests__/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native)/)',
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__tests__/mocks/fileMock.js',
  },
  testMatch: ['**/__tests__/**/*.test.tsx', '**/*.test.tsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

```typescript
// __tests__/setup.ts
import '@testing-library/jest-native';

// 清理每个测试
afterEach(() => {
  jest.clearAllMocks();
});

// Mock console.error 以避免警告
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
```

```typescript
// __tests__/setupFiles.ts
// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));
```

### 2. 基础组件测试

```typescript
// src/components/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  testID = 'button',
}: ButtonProps) {
  return (
    <TouchableOpacity
      testID={testID}
      style={[
        styles.button,
        styles[variant],
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color="#fff" testID="button-loading" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#3B82F6',
  },
  secondary: {
    backgroundColor: '#6B7280',
  },
  danger: {
    backgroundColor: '#EF4444',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

```typescript
// src/components/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders correctly with title', () => {
    const { getByText, getByRole } = render(
      <Button title="Click Me" onPress={mockOnPress} />
    );

    expect(getByText('Click Me')).toBeTruthy();
    expect(getByRole('button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByText } = render(
      <Button title="Click Me" onPress={mockOnPress} />
    );

    fireEvent.press(getByText('Click Me'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const { getByRole } = render(
      <Button title="Click Me" onPress={mockOnPress} disabled />
    );

    fireEvent.press(getByRole('button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { queryByText, getByTestId } = render(
      <Button title="Click Me" onPress={mockOnPress} loading />
    );

    expect(getByTestId('button-loading')).toBeTruthy();
    expect(queryByText('Click Me')).toBeNull();
  });

  it('applies correct variant styles', () => {
    const { getByRole, rerender } = render(
      <Button title="Primary" onPress={mockOnPress} variant="primary" />
    );

    const primaryButton = getByRole('button');
    expect(primaryButton).toHaveStyle({ backgroundColor: '#3B82F6' });

    rerender(
      <Button title="Danger" onPress={mockOnPress} variant="danger" />
    );
    const dangerButton = getByRole('button');
    expect(dangerButton).toHaveStyle({ backgroundColor: '#EF4444' });
  });

  it('has correct accessibility properties', () => {
    const { getByRole } = render(
      <Button title="Submit" onPress={mockOnPress} />
    );

    const button = getByRole('button');
    expect(button).toBeEnabled();
    expect(button).toHaveAccessibilityLabel('Submit');
  });
});
```

### 3. 异步数据获取测试

```typescript
// src/components/UserCard.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface UserCardProps {
  userId: string;
}

export function UserCard({ userId }: UserCardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `https://api.example.com/users/${userId}`
      );
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator testID="loading-indicator" />;
  }

  if (error) {
    return (
      <View testID="error-container">
        <Text>Error: {error}</Text>
        <Text onPress={fetchUser}>Retry</Text>
      </View>
    );
  }

  if (!user) return null;

  return (
    <View testID="user-card">
      <Image
        source={{ uri: user.avatar }}
        testID="user-avatar"
        accessible={true}
        accessibilityLabel={`${user.name}'s avatar`}
      />
      <Text testID="user-name">{user.name}</Text>
      <Text testID="user-email">{user.email}</Text>
    </View>
  );
}
```

```typescript
// src/components/UserCard.test.tsx
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { UserCard } from './UserCard';

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://example.com/avatar.jpg',
};

// Mock fetch
global.fetch = jest.fn();

describe('UserCard', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('shows loading indicator while fetching', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { getByTestId } = render(<UserCard userId="1" />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('displays user data after successful fetch', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    const { getByTestId, queryByTestId } = render(<UserCard userId="1" />);

    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull();
      expect(getByTestId('user-card')).toBeTruthy();
    });

    expect(getByTestId('user-name')).toHaveTextContent('John Doe');
    expect(getByTestId('user-email')).toHaveTextContent('john@example.com');
  });

  it('displays error message on fetch failure', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { getByTestId, queryByTestId } = render(<UserCard userId="1" />);

    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull();
      expect(getByTestId('error-container')).toBeTruthy();
    });
  });

  it('retries fetch when retry button is pressed', async () => {
    (fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

    const { getByText, getByTestId, queryByTestId } = render(
      <UserCard userId="1" />
    );

    await waitFor(() => {
      expect(getByTestId('error-container')).toBeTruthy();
    });

    fireEvent.press(getByText('Retry'));

    await waitFor(() => {
      expect(queryByTestId('error-container')).toBeNull();
      expect(getByTestId('user-card')).toBeTruthy();
    });
  });
});
```

### 4. 导航测试

```typescript
// __tests__/mocks/navigationMock.ts
import React from 'react';

export const mockNavigate = jest.fn();
export const mockGoBack = jest.fn();
export const mockReplace = jest.fn();
export const mockReset = jest.fn();

export const navigationMock = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  replace: mockReplace,
  reset: mockReset,
  setOptions: jest.fn(),
  addListener: jest.fn(),
  isFocused: jest.fn(() => true),
};

export const routeMock = {
  key: 'test-key',
  name: 'TestScreen',
  params: {},
};

// Navigation Context Provider for testing
export const MockNavigationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return React.createElement(
    React.Fragment,
    null,
    children
  );
};
```

```typescript
// src/screens/HomeScreen.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';
import { navigationMock } from '../../__tests__/mocks/navigationMock';

// Mock useNavigation hook
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => navigationMock,
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    navigationMock.navigate.mockClear();
  });

  it('renders welcome message', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Welcome')).toBeTruthy();
  });

  it('navigates to Profile screen when button pressed', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Go to Profile'));
    expect(navigationMock.navigate).toHaveBeenCalledWith('Profile');
  });

  it('calls goBack when back button pressed', () => {
    const { getByTestId } = render(<HomeScreen />);
    fireEvent.press(getByTestId('back-button'));
    expect(navigationMock.goBack).toHaveBeenCalled();
  });
});
```

### 5. Hooks 测试

```typescript
// src/hooks/useAuth.ts
import { useState, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.example.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
    error,
  };
}
```

```typescript
// src/hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from './useAuth';

global.fetch = jest.fn();

describe('useAuth', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('logs in successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles login error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.login('test@example.com', 'wrong');
      } catch (error) {
        // Expected error
      }
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('logs out successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

### 6. 快照测试

```typescript
// src/components/__snapshots__/Button.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button Snapshots', () => {
  it('matches snapshot for primary button', () => {
    const tree = render(
      <Button title="Primary Button" onPress={() => {}} variant="primary" />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('matches snapshot for disabled button', () => {
    const tree = render(
      <Button title="Disabled Button" onPress={() => {}} disabled />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('matches snapshot for loading button', () => {
    const tree = render(
      <Button title="Loading Button" onPress={() => {}} loading />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
```

## 最佳实践

### 1. 查询优先级
- 优先使用 `getByRole` 和 `getByLabelText`
- 使用 `getByPlaceholderText` 用于输入框
- 使用 `getByText` 作为备选
- `getByTestId` 作为最后手段

### 2. 可访问性优先
```typescript
// ✅ Good
expect(getByRole('button')).toBeTruthy();
expect(getByLabelText('Submit form')).toBeTruthy();

// ❌ Avoid
expect(getByTestId('submit-button')).toBeTruthy();
```

### 3. 用户行为模拟
```typescript
import { fireEvent, waitFor } from '@testing-library/react-native';

// ✅ Good - 模拟真实用户行为
fireEvent.press(getByText('Submit'));
await waitFor(() => expect(mockSubmit).toHaveBeenCalled());

// ✅ Good - 测试输入
fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
```

### 4. 异步测试
```typescript
// ✅ Good
await waitFor(() => {
  expect(getByTestId('user-card')).toBeTruthy();
}, { timeout: 3000 });

// ✅ Good - findBy 自动等待
const userCard = await findByTestId('user-card');
```

### 5. Mock 最佳实践
```typescript
// ✅ Good - Mock 外部依赖
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// ✅ Good - 清理 Mock
beforeEach(() => {
  jest.clearAllMocks();
});
```

## 常见问题

### 1. Animated 组件警告
```typescript
// __tests__/setupFiles.ts
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
```

### 2. AsyncStorage Mock
```typescript
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

### 3. 图片组件测试
```typescript
// 使用 testID
<Image source={{ uri: url }} testID="avatar-image" />

// 测试
expect(getByTestId('avatar-image')).toBeTruthy();
```

## 依赖安装

```bash
# 核心依赖
npm install --save-dev @testing-library/react-native
npm install --save-dev @testing-library/jest-native
npm install --save-dev @testing-library/react-hooks
npm install --save-dev react-test-renderer
npm install --save-dev jest

# TypeScript 支持
npm install --save-dev @types/jest
```

## package.json 脚本

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:update": "jest --updateSnapshot"
  }
}
```

## 测试覆盖率目标

- **组件**: 80%+ 覆盖率
- **Hooks**: 90%+ 覆盖率
- **工具函数**: 95%+ 覆盖率
- **关键业务逻辑**: 100% 覆盖率

## 参考资源

- [React Native Testing Library 文档](https://callstack.github.io/react-native-testing-library/)
- [Testing Library 最佳实践](https://testing-library.com/docs/react-native-testing-library/intro/)
- [Jest 文档](https://jestjs.io/)
