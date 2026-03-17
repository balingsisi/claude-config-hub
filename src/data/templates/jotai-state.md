# Jotai 原子状态管理

## 技术栈

- **Jotai** - 原子化状态管理库
- **React 18+** - UI 框架
- **TypeScript** - 类型安全
- **Jotai DevTools** - 调试工具
- **Jotai Utils** - 工具函数集

## 项目结构

```
src/
├── atoms/              # 原子定义
│   ├── index.ts        # 导出所有原子
│   ├── user.ts         # 用户相关原子
│   ├── cart.ts         # 购物车原子
│   ├── ui.ts           # UI 状态原子
│   └── derived.ts      # 派生原子
├── hooks/              # 自定义 hooks
│   ├── useUser.ts
│   └── useCart.ts
├── components/
├── utils/
│   └── atomUtils.ts    # 原子工具函数
└── App.tsx
```

## 核心概念

### 基础原子 (Primitive Atom)

```typescript
// atoms/user.ts
import { atom } from 'jotai';

// 基础原子
export const userAtom = atom<User | null>(null);
export const isLoggedInAtom = atom(false);

// 只读原子（派生）
export const userNameAtom = atom((get) => {
  const user = get(userAtom);
  return user?.name ?? 'Guest';
});
```

### 可写派生原子

```typescript
// atoms/cart.ts
import { atom } from 'jotai';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export const cartItemsAtom = atom<CartItem[]>([]);

// 派生：总价
export const cartTotalAtom = atom((get) => {
  const items = get(cartItemsAtom);
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

// 派生：商品数量
export const cartCountAtom = atom((get) => {
  const items = get(cartItemsAtom);
  return items.reduce((sum, item) => sum + item.quantity, 0);
});

// 可写派生原子：添加商品
export const addToCartAtom = atom(null, (get, set, item: Omit<CartItem, 'quantity'>) => {
  const items = get(cartItemsAtom);
  const existingIndex = items.findIndex(i => i.id === item.id);
  
  if (existingIndex >= 0) {
    const newItems = [...items];
    newItems[existingIndex] = {
      ...newItems[existingIndex],
      quantity: newItems[existingIndex].quantity + 1,
    };
    set(cartItemsAtom, newItems);
  } else {
    set(cartItemsAtom, [...items, { ...item, quantity: 1 }]);
  }
});

// 清空购物车
export const clearCartAtom = atom(null, (get, set) => {
  set(cartItemsAtom, []);
});
```

### 异步原子

```typescript
// atoms/data.ts
import { atom } from 'jotai';

// 异步数据获取
export const postsAtom = atom(async (get) => {
  const response = await fetch('/api/posts');
  if (!response.ok) throw new Error('Failed to fetch posts');
  return response.json();
});

// 依赖异步原子
export const userPostsAtom = atom(async (get) => {
  const user = get(userAtom);
  if (!user) return [];
  
  const response = await fetch(`/api/users/${user.id}/posts`);
  return response.json();
});
```

## 代码模式

### 在组件中使用

```tsx
// components/UserProfile.tsx
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { userAtom, userNameAtom, isLoggedInAtom } from '../atoms/user';

export function UserProfile() {
  // 读写模式
  const [user, setUser] = useAtom(userAtom);
  
  // 只读模式
  const userName = useAtomValue(userNameAtom);
  const isLoggedIn = useAtomValue(isLoggedInAtom);
  
  // 只写模式（性能优化）
  const logout = useSetAtom(logoutAtom);

  if (!isLoggedIn) {
    return <LoginForm />;
  }

  return (
    <div>
      <h1>Welcome, {userName}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 购物车示例

```tsx
// components/Cart.tsx
import { useAtomValue, useSetAtom } from 'jotai';
import { cartItemsAtom, cartTotalAtom, cartCountAtom, addToCartAtom, clearCartAtom } from '../atoms/cart';

export function Cart() {
  const items = useAtomValue(cartItemsAtom);
  const total = useAtomValue(cartTotalAtom);
  const count = useAtomValue(cartCountAtom);
  const addToCart = useSetAtom(addToCartAtom);
  const clearCart = useSetAtom(clearCartAtom);

  return (
    <div>
      <h2>Cart ({count} items)</h2>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            {item.name} x {item.quantity} - ${item.price * item.quantity}
          </li>
        ))}
      </ul>
      <p>Total: ${total}</p>
      <button onClick={clearCart}>Clear Cart</button>
    </div>
  );
}
```

### 带参数的原子 (Atom Family)

```typescript
// atoms/todo.ts
import { atomFamily } from 'jotai/utils';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

// 根据ID创建原子族
export const todoAtomFamily = atomFamily((id: string) =>
  atom<Todo | null>(null)
);

// 异步加载族
export const todoDataAtomFamily = atomFamily((id: string) =>
  atom(async () => {
    const response = await fetch(`/api/todos/${id}`);
    return response.json();
  })
);
```

### 使用 Atom Family

```tsx
// components/TodoItem.tsx
import { useAtom } from 'jotai';
import { todoAtomFamily } from '../atoms/todo';

interface Props {
  id: string;
}

export function TodoItem({ id }: Props) {
  const [todo, setTodo] = useAtom(todoAtomFamily(id));

  if (!todo) return <div>Loading...</div>;

  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={(e) => setTodo({ ...todo, completed: e.target.checked })}
      />
      <span>{todo.title}</span>
    </div>
  );
}
```

### 选择器优化 (SelectAtom)

```typescript
// atoms/selectors.ts
import { selectAtom } from 'jotai/utils';
import { userAtom } from './user';

// 只在特定字段变化时重新渲染
export const userAvatarAtom = selectAtom(
  userAtom,
  (user) => user?.avatarUrl ?? '/default-avatar.png'
);

export const userEmailAtom = selectAtom(
  userAtom,
  (user) => user?.email ?? ''
);
```

### 持久化存储

```typescript
// atoms/storage.ts
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

// localStorage 持久化
export const themeAtom = atomWithStorage<'light' | 'dark'>(
  'theme',
  'light',
  createJSONStorage(() => localStorage)
);

// sessionStorage 持久化
export const sessionTokenAtom = atomWithStorage<string | null>(
  'sessionToken',
  null,
  createJSONStorage(() => sessionStorage)
);
```

### 乐观更新

```typescript
// atoms/optimistic.ts
import { atom } from 'jotai';

export const todosAtom = atom<Todo[]>([]);

export const addTodoOptimisticAtom = atom(
  null,
  async (get, set, newTodo: Omit<Todo, 'id'>) => {
    const tempId = 'temp-' + Date.now();
    
    // 乐观更新
    set(todosAtom, (prev) => [...prev, { ...newTodo, id: tempId }]);
    
    try {
      // 实际API调用
      const response = await fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify(newTodo),
      });
      const savedTodo = await response.json();
      
      // 替换临时数据
      set(todosAtom, (prev) =>
        prev.map((todo) => (todo.id === tempId ? savedTodo : todo))
      );
    } catch (error) {
      // 回滚
      set(todosAtom, (prev) => prev.filter((todo) => todo.id !== tempId));
      throw error;
    }
  }
);
```

### 原子间依赖

```typescript
// atoms/dependencies.ts
import { atom } from 'jotai';

// 基础原子
export const filterAtom = atom<'all' | 'active' | 'completed'>('all');
export const todosAtom = atom<Todo[]>([]);

// 组合派生
export const filteredTodosAtom = atom((get) => {
  const filter = get(filterAtom);
  const todos = get(todosAtom);
  
  switch (filter) {
    case 'active':
      return todos.filter((t) => !t.completed);
    case 'completed':
      return todos.filter((t) => t.completed);
    default:
      return todos;
  }
});

// 复杂派生
export const todoStatsAtom = atom((get) => {
  const todos = get(todosAtom);
  const completed = todos.filter((t) => t.completed).length;
  const active = todos.length - completed;
  
  return {
    total: todos.length,
    completed,
    active,
    percentComplete: todos.length > 0 ? (completed / todos.length) * 100 : 0,
  };
});
```

## 最佳实践

### 1. 原子粒度

```typescript
// ❌ 避免：过大的原子
export const appStateAtom = atom({
  user: null,
  cart: [],
  ui: { theme: 'light', sidebarOpen: false },
});

// ✅ 推荐：细粒度原子
export const userAtom = atom(null);
export const cartAtom = atom([]);
export const themeAtom = atom('light');
export const sidebarOpenAtom = atom(false);
```

### 2. 命名约定

```typescript
// atoms/ 命名约定
export const [entity]Atom = atom();          // 基础原子
export const [action]Atom = atom(null, ...); // 动作原子
export const is[State]Atom = atom();         // 布尔状态
export const [entity]LoadingAtom = atom();   // 加载状态
```

### 3. 类型定义

```typescript
// types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

// atoms/user.ts
import type { PrimitiveAtom, WritableAtom } from 'jotai';

export const userAtom: PrimitiveAtom<User | null> = atom<User | null>(null);

export const updateUserAtom: WritableAtom<null, [Partial<User>], void> = atom(
  null,
  (get, set, updates) => {
    const current = get(userAtom);
    if (current) {
      set(userAtom, { ...current, ...updates });
    }
  }
);
```

### 4. Provider 配置

```tsx
// App.tsx
import { Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { userAtom, themeAtom } from './atoms';

interface Props {
  initialUser: User | null;
  initialTheme: 'light' | 'dark';
}

function HydrateAtoms({ initialUser, initialTheme }: Props) {
  useHydrateAtoms([
    [userAtom, initialUser],
    [themeAtom, initialTheme],
  ]);
  return null;
}

export function App({ initialUser, initialTheme }: Props) {
  return (
    <Provider>
      <HydrateAtoms initialUser={initialUser} initialTheme={initialTheme} />
      <Router />
    </Provider>
  );
}
```

### 5. 错误处理

```tsx
// components/AsyncData.tsx
import { useAtom } from 'jotai';
import { postsAtom } from '../atoms/posts';

export function PostsList() {
  const [posts] = useAtom(postsAtom);

  if (posts.state === 'loading') {
    return <div>Loading...</div>;
  }

  if (posts.state === 'hasError') {
    return <div>Error: {posts.error.message}</div>;
  }

  return (
    <ul>
      {posts.data.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

## 常用命令

```bash
# 安装
npm install jotai

# 开发工具
npm install jotai-devtools

# 工具函数
npm install jotai-utils

# 类型定义
npm install -D @types/node
```

## 与其他工具集成

### React Query 集成

```typescript
// atoms/react-query.ts
import { atomWithQuery } from 'jotai-tanstack-query';

export const userAtom = atomWithQuery(() => ({
  queryKey: ['user'],
  queryFn: async () => {
    const res = await fetch('/api/user');
    return res.json();
  },
}));
```

### Immer 集成

```typescript
// atoms/immer.ts
import { atomWithImmer } from 'jotai-immer';

export const todosAtom = atomWithImmer<Todo[]>([]);

export const toggleTodoAtom = atom(null, (get, set, id: string) => {
  set(todosAtom, (draft) => {
    const todo = draft.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  });
});
```

### Redux 集成

```typescript
// atoms/redux.ts
import { atomWithStore } from 'jotai-redux';
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: rootReducer,
});

export const reduxAtom = atomWithStore(store);
```

## 部署配置

### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['jotai', 'jotai/utils', 'jotai/devtools'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          jotai: ['jotai', 'jotai/utils'],
        },
      },
    },
  },
});
```

### Next.js 配置

```tsx
// app/providers.tsx
'use client';

import { Provider } from 'jotai';

export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}

// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## 调试工具

### DevTools

```tsx
// App.tsx
import { useAtomDevtools } from 'jotai-devtools';
import { userAtom } from './atoms/user';

function DebugUser() {
  const [user, setUser] = useAtom(userAtom);
  
  // 添加到 Redux DevTools
  useAtomDevtools(userAtom, {
    name: 'user',
    enabled: process.env.NODE_ENV === 'development',
  });
  
  return null;
}
```

### 原子快照

```typescript
// utils/debug.ts
import { snapshot, subscribe } from 'jotai/utils';
import { userAtom, cartAtom } from '../atoms';

export function debugAtoms(store: Store) {
  console.log('Current State:');
  console.log('User:', snapshot(store, userAtom));
  console.log('Cart:', snapshot(store, cartAtom));
}
```

## 性能优化

### 1. 避免不必要渲染

```tsx
// ❌ 组件会在任何 user 变化时重新渲染
function UserAvatar() {
  const [user] = useAtom(userAtom);
  return <img src={user.avatarUrl} />;
}

// ✅ 只在 avatarUrl 变化时重新渲染
function UserAvatar() {
  const avatarUrl = useAtomValue(
    selectAtom(userAtom, (user) => user?.avatarUrl)
  );
  return <img src={avatarUrl} />;
}
```

### 2. 批量更新

```typescript
// atoms/batch.ts
import { atom } from 'jotai';

export const batchUpdateAtom = atom(null, (get, set, updates: Partial<User>) => {
  // Jotai 自动批量处理
  set(userAtom, (prev) => ({ ...prev, ...updates }));
  set(lastUpdatedAtom, Date.now());
});
```

### 3. 懒加载原子

```typescript
// atoms/lazy.ts
import { atom, unstable_buildGetInitialState } from 'jotai';

export const lazyDataAtom = atom(async () => {
  // 只在被访问时才加载
  const { data } = await import('./heavy-data');
  return data;
});
```

## 测试

### 单元测试

```typescript
// __tests__/cart.test.ts
import { atom, createStore } from 'jotai';
import { cartItemsAtom, cartTotalAtom, addToCartAtom } from '../atoms/cart';

describe('Cart Atoms', () => {
  let store: Store;

  beforeEach(() => {
    store = createStore();
  });

  test('addToCart should add item', () => {
    const item = { id: '1', name: 'Test', price: 10, quantity: 1 };
    
    store.set(addToCartAtom, item);
    
    const items = store.get(cartItemsAtom);
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(item);
  });

  test('cartTotal should calculate correctly', () => {
    store.set(cartItemsAtom, [
      { id: '1', name: 'A', price: 10, quantity: 2 },
      { id: '2', name: 'B', price: 5, quantity: 3 },
    ]);
    
    const total = store.get(cartTotalAtom);
    expect(total).toBe(35); // (10*2) + (5*3)
  });
});
```

### 组件测试

```tsx
// __tests__/Cart.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'jotai';
import { Cart } from '../components/Cart';
import { cartItemsAtom } from '../atoms/cart';

test('displays cart items', () => {
  const initialItems = [
    { id: '1', name: 'Test Item', price: 10, quantity: 2 },
  ];

  render(
    <Provider initialValues={[[cartItemsAtom, initialItems]]}>
      <Cart />
    </Provider>
  );

  expect(screen.getByText('Test Item x 2')).toBeInTheDocument();
  expect(screen.getByText('$20')).toBeInTheDocument();
});
```
