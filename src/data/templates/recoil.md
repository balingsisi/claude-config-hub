# Recoil 模板

React 的状态管理库，提供细粒度状态管理和派生状态。

## 技术栈

- **核心**: Recoil
- **运行时**: React 18+ / React Native
- **工具**: Recoil DevTools
- **类型**: TypeScript
- **测试**: Vitest / Jest

## 项目结构

```
recoil-app/
├── src/
│   ├── atoms/               # 原子状态
│   │   ├── user-atom.ts
│   │   ├── cart-atom.ts
│   │   └── settings-atom.ts
│   ├── selectors/           # 选择器（派生状态）
│   │   ├── filtered-todos.ts
│   │   ├── cart-total.ts
│   │   └── user-stats.ts
│   ├── hooks/               # 自定义 Hooks
│   │   ├── use-user.ts
│   │   └── use-cart.ts
│   ├── effects/             # 副作用
│   │   ├── local-storage.ts
│   │   └── sync-effect.ts
│   ├── components/
│   │   └── App.tsx
│   └── utils/
│       └── helpers.ts
├── tests/
├── recoil.config.ts
└── package.json
```

## 代码模式

### 基础 Atom

```typescript
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

// 定义原子状态
export const userState = atom<User | null>({
  key: 'userState',
  default: null,
});

// 在组件中使用
function UserProfile() {
  const [user, setUser] = useRecoilState(userState);

  if (!user) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <button onClick={() => setUser({ ...user, name: 'New Name' })}>
        Update Name
      </button>
    </div>
  );
}
```

### 只读和只写

```typescript
import { useRecoilValue, useSetRecoilState } from 'recoil';

function UserName() {
  // 只读
  const user = useRecoilValue(userState);
  return <div>{user?.name}</div>;
}

function UpdateUser() {
  // 只写
  const setUser = useSetRecoilState(userState);
  
  return (
    <button onClick={() => setUser({ name: 'Alice', email: 'alice@example.com' })}>
      Set User
    </button>
  );
}
```

### 选择器（Selector）

```typescript
import { selector, useRecoilValue } from 'recoil';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export const todosState = atom<Todo[]>({
  key: 'todosState',
  default: [],
});

// 派生状态：过滤已完成的 todos
export const completedTodosSelector = selector({
  key: 'completedTodosSelector',
  get: ({ get }) => {
    const todos = get(todosState);
    return todos.filter((todo) => todo.completed);
  },
});

// 派生状态：统计信息
export const todosStatsSelector = selector({
  key: 'todosStatsSelector',
  get: ({ get }) => {
    const todos = get(todosState);
    const completed = todos.filter((todo) => todo.completed).length;
    const total = todos.length;
    return {
      total,
      completed,
      pending: total - completed,
      percentage: total > 0 ? (completed / total) * 100 : 0,
    };
  },
});

// 使用选择器
function TodoStats() {
  const stats = useRecoilValue(todosStatsSelector);
  
  return (
    <div>
      <p>Total: {stats.total}</p>
      <p>Completed: {stats.completed}</p>
      <p>Pending: {stats.pending}</p>
      <p>Progress: {stats.percentage.toFixed(1)}%</p>
    </div>
  );
}
```

### 可写选择器

```typescript
import { selector, useRecoilState } from 'recoil';

export const filterState = atom<'all' | 'completed' | 'pending'>({
  key: 'filterState',
  default: 'all',
});

export const filteredTodosSelector = selector({
  key: 'filteredTodosSelector',
  get: ({ get }) => {
    const todos = get(todosState);
    const filter = get(filterState);

    switch (filter) {
      case 'completed':
        return todos.filter((todo) => todo.completed);
      case 'pending':
        return todos.filter((todo) => !todo.completed);
      default:
        return todos;
    }
  },
  set: ({ set }, newValue) => {
    // 允许直接设置过滤后的 todos
    set(todosState, newValue);
  },
});
```

### 异步选择器

```typescript
import { selector, useRecoilValue } from 'recoil';

export const userListSelector = selector({
  key: 'userListSelector',
  get: async () => {
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  },
});

function UserList() {
  const users = useRecoilValue(userListSelector);

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// 带错误处理和加载状态
function UserListWithSuspense() {
  return (
    <Recoil.Suspense fallback={<div>Loading...</div>}>
      <UserList />
    </Recoil.Suspense>
  );
}
```

### Atom Effects（副作用）

```typescript
import { atom, AtomEffect } from 'recoil';

// 本地存储持久化
const localStorageEffect = <T>(key: string): AtomEffect<T> => ({
  setSelf,
  onSet,
}) => {
  // 从 localStorage 读取初始值
  const savedValue = localStorage.getItem(key);
  if (savedValue != null) {
    setSelf(JSON.parse(savedValue));
  }

  // 保存到 localStorage
  onSet((newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue));
  });
};

export const themeState = atom<'light' | 'dark'>({
  key: 'themeState',
  default: 'light',
  effects: [localStorageEffect('theme')],
});
```

### 异步 Atom Effects

```typescript
import { atom, AtomEffect } from 'recoil';

// 从 API 加载数据
const apiSyncEffect = <T>(endpoint: string): AtomEffect<T> => ({
  setSelf,
  onSet,
}) => {
  // 初始加载
  fetch(endpoint)
    .then((res) => res.json())
    .then((data) => setSelf(data))
    .catch((error) => console.error('Failed to load:', error));

  // 同步更新
  onSet((newValue) => {
    fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newValue),
    }).catch((error) => console.error('Failed to sync:', error));
  });
};

export const settingsState = atom({
  key: 'settingsState',
  default: {},
  effects: [apiSyncEffect('/api/settings')],
});
```

### Atom Family

```typescript
import { atomFamily, useRecoilState } from 'recoil';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

// 为每个 ID 创建独立的 atom
export const todoState = atomFamily<Todo, string>({
  key: 'todoState',
  default: (id) => ({
    id,
    text: '',
    completed: false,
  }),
});

function TodoItem({ id }: { id: string }) {
  const [todo, setTodo] = useRecoilState(todoState(id));

  return (
    <div>
      <input
        value={todo.text}
        onChange={(e) => setTodo({ ...todo, text: e.target.value })}
      />
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={(e) => setTodo({ ...todo, completed: e.target.checked })}
      />
    </div>
  );
}
```

### Selector Family

```typescript
import { selectorFamily, useRecoilValue } from 'recoil';

export const userSelector = selectorFamily({
  key: 'userSelector',
  get:
    (userId: string) =>
    async ({ get }) => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
});

function UserDetail({ userId }: { userId: string }) {
  const user = useRecoilValue(userSelector(userId));

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

### 快照和事务

```typescript
import { useRecoilCallback } from 'recoil';

function UpdateMultiple() {
  const updateMultiple = useRecoilCallback(
    ({ set, snapshot, reset }) =>
      async () => {
        // 批量更新
        set(userState, { name: 'Alice', email: 'alice@example.com' });
        set(themeState, 'dark');
        
        // 读取当前状态
        const currentUser = await snapshot.getPromise(userState);
        console.log('Current user:', currentUser);
        
        // 重置状态
        reset(settingsState);
      },
    []
  );

  return <button onClick={updateMultiple}>Update All</button>;
}
```

## 最佳实践

### 1. 组织结构

```typescript
// atoms/index.ts - 统一导出
export * from './user-atom';
export * from './cart-atom';
export * from './settings-atom';

// selectors/index.ts - 统一导出
export * from './filtered-todos';
export * from './cart-total';
export * from './user-stats';
```

### 2. 类型安全

```typescript
import { atom, selector } from 'recoil';

interface User {
  id: string;
  name: string;
  email: string;
}

export const userState = atom<User | null>({
  key: 'userState',
  default: null,
});

export const userNameSelector = selector<string>({
  key: 'userNameSelector',
  get: ({ get }) => {
    const user = get(userState);
    return user?.name ?? 'Anonymous';
  },
});
```

### 3. 性能优化

```typescript
import { selector } from 'recoil';

// 避免重复计算
export const expensiveComputationSelector = selector({
  key: 'expensiveComputationSelector',
  get: ({ get }) => {
    const data = get(dataState);
    
    // 只在 data 改变时重新计算
    return performExpensiveComputation(data);
  },
});

// 使用缓存
export const cachedDataSelector = selector({
  key: 'cachedDataSelector',
  get: ({ get }) => {
    const cache = get(cacheState);
    const key = get(keyState);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const data = computeData(key);
    cache.set(key, data);
    return data;
  },
});
```

### 4. 错误处理

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <RecoilRoot>
      <ErrorBoundary
        fallback={<div>Something went wrong</div>}
        onError={(error) => console.error(error)}
      >
        <UserList />
      </ErrorBoundary>
    </RecoilRoot>
  );
}
```

### 5. 测试

```typescript
import { render, screen } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { UserList } from './UserList';

test('renders user list', async () => {
  render(
    <RecoilRoot>
      <UserList />
    </RecoilRoot>
  );

  expect(await screen.findByText('Alice')).toBeInTheDocument();
});
```

## 常用命令

```bash
# 安装
npm install recoil

# React
npm install react react-dom

# 测试工具
npm install @testing-library/react @testing-library/jest-dom

# 开发工具
npm install recoil-devtools

# 运行开发服务器
npm run dev

# 测试
npm test

# 类型检查
npm run type-check
```

## 部署配置

### 应用根组件

```typescript
import { RecoilRoot } from 'recoil';
import { App } from './App';

function Root() {
  return (
    <RecoilRoot>
      <React.Suspense fallback={<div>Loading...</div>}>
        <App />
      </React.Suspense>
    </RecoilRoot>
  );
}
```

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## 常见问题

### 状态重置

```typescript
import { useResetRecoilState, useRecoilCallback } from 'recoil';

function LogoutButton() {
  const resetUser = useResetRecoilState(userState);
  const resetCart = useResetRecoilState(cartState);

  const handleLogout = useRecoilCallback(
    ({ reset }) => () => {
      reset(userState);
      reset(cartState);
      reset(settingsState);
    },
    []
  );

  return <button onClick={handleLogout}>Logout</button>;
}
```

### 依赖注入

```typescript
import { atom, useRecoilValue } from 'recoil';

// 可配置的 API 端点
export const apiEndpointState = atom<string>({
  key: 'apiEndpointState',
  default: '/api',
});

export const userSelector = selector({
  key: 'userSelector',
  get: async ({ get }) => {
    const endpoint = get(apiEndpointState);
    const response = await fetch(`${endpoint}/users`);
    return response.json();
  },
});
```

### 性能优化技巧

```typescript
import { atom, selector, useRecoilValue } from 'recoil';

// 使用 selector 避免不必要的渲染
export const userDisplayNameSelector = selector({
  key: 'userDisplayNameSelector',
  get: ({ get }) => {
    const user = get(userState);
    return user ? `${user.firstName} ${user.lastName}` : 'Anonymous';
  },
});

// 只订阅需要的状态
function UserName() {
  const displayName = useRecoilValue(userDisplayNameSelector);
  return <div>{displayName}</div>;
}
```

### 调试技巧

```typescript
import { RecoilRoot, Snapshot, useRecoilSnapshot } from 'recoil';

function DebugObserver() {
  const snapshot = useRecoilSnapshot();
  
  React.useEffect(() => {
    console.log('State changed:');
    for (const node of snapshot.getNodes_UNSTABLE({ isModified: true })) {
      console.log(node.key, snapshot.getLoadable(node).contents);
    }
  }, [snapshot]);

  return null;
}

function App() {
  return (
    <RecoilRoot>
      <DebugObserver />
      <YourApp />
    </RecoilRoot>
  );
}
```

## 相关资源

- [Recoil 官方文档](https://recoiljs.org/)
- [Recoil GitHub](https://github.com/facebookexperimental/Recoil)
- [Recoil DevTools](https://github.com/NodeSecure/recoil-devtools)
- [示例代码](https://recoiljs.org/docs/introduction/Installation)
