# Legend State 模板

## 技术栈

### 核心技术
- **@legendapp/state**: 极致性能的状态管理库
- **@legendapp/state/react**: React 集成
- **@legendapp/state/persist**: 持久化插件
- **TypeScript**: 完整类型支持

### 特性
- 超高性能（比其他库快 10-100 倍）
- 极简 API（无需 actions、reducers）
- 自动追踪依赖
- 内置持久化
- 支持 React 18 并发模式
- 细粒度更新（只重渲染变化的组件）

## 项目结构

```
legend-state-app/
├── src/
│   ├── stores/              # 全局状态
│   │   ├── index.ts
│   │   ├── userStore.ts
│   │   ├── settingsStore.ts
│   │   └── uiStore.ts
│   ├── components/
│   │   ├── User/
│   │   │   ├── UserProfile.tsx
│   │   │   └── UserAvatar.tsx
│   │   └── UI/
│   │       ├── ThemeToggle.tsx
│   │       └── Notification.tsx
│   ├── hooks/
│   │   └── useObservable.ts
│   ├── services/
│   │   └── api.ts
│   ├── persist/
│   │   ├── index.ts
│   │   └── config.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── tsconfig.json
```

## 核心代码模式

### 1. 基础 Store 创建

```typescript
// src/stores/userStore.ts
import { observable } from '@legendapp/state';
import { persistObservable } from '@legendapp/state/persist';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
}

// 创建可观察状态
const userState$ = observable<UserState>({
  currentUser: null,
  isAuthenticated: false,
  theme: 'light',
});

// 持久化配置
persistObservable(userState$, {
  local: 'user-storage',
  persistRemote: {
    // 可选：同步到远程服务器
  },
});

// 导出状态和方法
export const userStore = {
  // 状态
  state: userState$,

  // 方法
  login: (user: User) => {
    userState$.currentUser.set(user);
    userState$.isAuthenticated.set(true);
  },

  logout: () => {
    userState$.currentUser.set(null);
    userState$.isAuthenticated.set(false);
  },

  updateProfile: (updates: Partial<User>) => {
    userState$.currentUser.assign(updates);
  },

  toggleTheme: () => {
    userState$.theme.set((prev) => (prev === 'light' ? 'dark' : 'light'));
  },
};
```

### 2. React 组件集成

```typescript
// src/components/User/UserProfile.tsx
import React from 'react';
import { observer } from '@legendapp/state/react';
import { userStore } from '../../stores/userStore';

// 使用 observer 包裹组件
export const UserProfile = observer(() => {
  // 直接读取状态，自动追踪依赖
  const user = userStore.state.currentUser.get();
  const theme = userStore.state.theme.get();

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div className={`profile ${theme}`}>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button onClick={() => userStore.toggleTheme()}>
        Toggle Theme ({theme})
      </button>
      <button onClick={() => userStore.updateProfile({ name: 'Updated' })}>
        Update Name
      </button>
    </div>
  );
});
```

```typescript
// src/components/User/UserAvatar.tsx
import React from 'react';
import { observer } from '@legendapp/state/react';
import { userStore } from '../../stores/userStore';

// 使用 useObservable hook
export function UserAvatar() {
  const avatar = userStore.state.currentUser.avatar.use();

  if (!avatar) return null;

  return <img src={avatar} alt="User avatar" />;
}

// 或者使用 observer
export const UserAvatarObserver = observer(() => {
  const avatar = userStore.state.currentUser.avatar.get();

  if (!avatar) return null;

  return <img src={avatar} alt="User avatar" />;
});
```

### 3. 复杂数据结构

```typescript
// src/stores/settingsStore.ts
import { observable } from '@legendapp/state';
import { persistObservable } from '@legendapp/state/persist';

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}

interface PrivacySettings {
  profileVisible: boolean;
  showActivity: boolean;
}

interface SettingsState {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  language: string;
  fontSize: number;
}

const settingsState$ = observable<SettingsState>({
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
  privacy: {
    profileVisible: true,
    showActivity: false,
  },
  language: 'en',
  fontSize: 14,
});

persistObservable(settingsState$, {
  local: 'settings-storage',
});

export const settingsStore = {
  state: settingsState$,

  updateNotifications: (updates: Partial<NotificationSettings>) => {
    settingsState$.notifications.assign(updates);
  },

  updatePrivacy: (updates: Partial<PrivacySettings>) => {
    settingsState$.privacy.assign(updates);
  },

  setLanguage: (lang: string) => {
    settingsState$.language.set(lang);
  },

  increaseFontSize: () => {
    settingsState$.fontSize.set((prev) => Math.min(prev + 2, 24));
  },

  decreaseFontSize: () => {
    settingsState$.fontSize.set((prev) => Math.max(prev - 2, 12));
  },
};
```

```typescript
// src/components/UI/Notification.tsx
import React from 'react';
import { observer } from '@legendapp/state/react';
import { settingsStore } from '../../stores/settingsStore';

export const NotificationSettings = observer(() => {
  const notifications = settingsStore.state.notifications.get();

  const handleToggle = (key: keyof typeof notifications) => {
    settingsStore.updateNotifications({
      [key]: !notifications[key],
    });
  };

  return (
    <div>
      <h3>Notification Preferences</h3>
      <label>
        <input
          type="checkbox"
          checked={notifications.email}
          onChange={() => handleToggle('email')}
        />
        Email Notifications
      </label>
      <label>
        <input
          type="checkbox"
          checked={notifications.push}
          onChange={() => handleToggle('push')}
        />
        Push Notifications
      </label>
      <label>
        <input
          type="checkbox"
          checked={notifications.sms}
          onChange={() => handleToggle('sms')}
        />
        SMS Notifications
      </label>
    </div>
  );
});
```

### 4. 数组和集合操作

```typescript
// src/stores/todoStore.ts
import { observable } from '@legendapp/state';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

const todoState$ = observable<Todo[]>([]);

export const todoStore = {
  state: todoState$,

  addTodo: (text: string) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: new Date(),
    };
    todoState$.push(newTodo);
  },

  removeTodo: (id: string) => {
    const index = todoState$.get().findIndex((todo) => todo.id === id);
    if (index !== -1) {
      todoState$.splice(index, 1);
    }
  },

  toggleTodo: (id: string) => {
    const todo = todoState$.find((t) => t.id === id);
    if (todo) {
      todo.completed.set((prev) => !prev);
    }
  },

  updateTodo: (id: string, updates: Partial<Todo>) => {
    const todo = todoState$.find((t) => t.id === id);
    if (todo) {
      todo.assign(updates);
    }
  },

  clearCompleted: () => {
    todoState$.set((todos) => todos.filter((todo) => !todo.completed));
  },

  // 派生状态
  getActiveTodos: () => {
    return todoState$.get().filter((todo) => !todo.completed);
  },

  getCompletedTodos: () => {
    return todoState$.get().filter((todo) => todo.completed);
  },
};
```

```typescript
// src/components/TodoList.tsx
import React, { useState } from 'react';
import { observer } from '@legendapp/state/react';
import { todoStore } from '../stores/todoStore';

export const TodoList = observer(() => {
  const [inputValue, setInputValue] = useState('');

  const todos = todoStore.state.get();
  const activeTodos = todoStore.getActiveTodos();
  const completedTodos = todoStore.getCompletedTodos();

  const handleAdd = () => {
    if (inputValue.trim()) {
      todoStore.addTodo(inputValue);
      setInputValue('');
    }
  };

  return (
    <div>
      <h2>Todo List ({todos.length})</h2>
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        placeholder="Add a todo..."
      />
      <button onClick={handleAdd}>Add</button>
      <button onClick={() => todoStore.clearCompleted()}>
        Clear Completed ({completedTodos.length})
      </button>

      <div>
        <h3>Active ({activeTodos.length})</h3>
        {activeTodos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </div>

      <div>
        <h3>Completed ({completedTodos.length})</h3>
        {completedTodos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </div>
    </div>
  );
});

const TodoItem = observer(({ todo }: { todo: Todo }) => {
  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => todoStore.toggleTodo(todo.id)}
      />
      <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
        {todo.text}
      </span>
      <button onClick={() => todoStore.removeTodo(todo.id)}>Delete</button>
    </div>
  );
});
```

### 5. 异步操作

```typescript
// src/stores/dataStore.ts
import { observable } from '@legendapp/state';

interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function createAsyncStore<T>(fetchFn: () => Promise<T>) {
  const state$ = observable<DataState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  return {
    state: state$,

    fetch: async () => {
      state$.loading.set(true);
      state$.error.set(null);

      try {
        const data = await fetchFn();
        state$.data.set(data);
      } catch (err) {
        state$.error.set(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        state$.loading.set(false);
      }
    },

    reset: () => {
      state$.set({
        data: null,
        loading: false,
        error: null,
      });
    },
  };
}

// 使用示例
interface Post {
  id: number;
  title: string;
  body: string;
}

const postStore = createAsyncStore<Post[]>(() =>
  fetch('https://jsonplaceholder.typicode.com/posts').then((res) => res.json())
);

export { postStore };
```

```typescript
// src/components/PostList.tsx
import React, { useEffect } from 'react';
import { observer } from '@legendapp/state/react';
import { postStore } from '../stores/dataStore';

export const PostList = observer(() => {
  const { data, loading, error } = postStore.state.get();

  useEffect(() => {
    postStore.fetch();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  return (
    <div>
      <h2>Posts ({data.length})</h2>
      {data.slice(0, 10).map((post) => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.body}</p>
        </div>
      ))}
      <button onClick={() => postStore.fetch()}>Refresh</button>
    </div>
  );
});
```

### 6. 派生状态和计算属性

```typescript
// src/stores/cartStore.ts
import { observable, computed } from '@legendapp/state';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  discount: number;
}

const cartState$ = observable<CartState>({
  items: [],
  discount: 0,
});

// 派生状态：计算总价
const subtotal$ = computed(() => {
  return cartState$.items
    .get()
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
});

const discountAmount$ = computed(() => {
  return subtotal$.get() * (cartState$.discount.get() / 100);
});

const total$ = computed(() => {
  return subtotal$.get() - discountAmount$.get();
});

const itemCount$ = computed(() => {
  return cartState$.items.get().reduce((sum, item) => sum + item.quantity, 0);
});

export const cartStore = {
  state: cartState$,
  subtotal: subtotal$,
  discountAmount: discountAmount$,
  total: total$,
  itemCount: itemCount$,

  addItem: (item: Omit<CartItem, 'id'>) => {
    const existing = cartState$.items
      .get()
      .find((i) => i.productId === item.productId);

    if (existing) {
      const index = cartState$.items.get().indexOf(existing);
      cartState$.items[index].quantity.set((prev) => prev + item.quantity);
    } else {
      cartState$.items.push({ ...item, id: crypto.randomUUID() });
    }
  },

  removeItem: (id: string) => {
    const index = cartState$.get().items.findIndex((item) => item.id === id);
    if (index !== -1) {
      cartState$.items.splice(index, 1);
    }
  },

  updateQuantity: (id: string, quantity: number) => {
    const item = cartState$.items.find((i) => i.id === id);
    if (item) {
      item.quantity.set(quantity);
    }
  },

  setDiscount: (discount: number) => {
    cartState$.discount.set(discount);
  },

  clearCart: () => {
    cartState$.items.set([]);
    cartState$.discount.set(0);
  },
};
```

```typescript
// src/components/Cart.tsx
import React from 'react';
import { observer } from '@legendapp/state/react';
import { cartStore } from '../stores/cartStore';

export const Cart = observer(() => {
  const items = cartStore.state.items.get();
  const subtotal = cartStore.subtotal.get();
  const discountAmount = cartStore.discountAmount.get();
  const total = cartStore.total.get();
  const itemCount = cartStore.itemCount.get();

  return (
    <div>
      <h2>Shopping Cart ({itemCount} items)</h2>

      {items.map((item) => (
        <div key={item.id}>
          <span>{item.name}</span>
          <span>${item.price}</span>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) =>
              cartStore.updateQuantity(item.id, parseInt(e.target.value))
            }
          />
          <button onClick={() => cartStore.removeItem(item.id)}>Remove</button>
        </div>
      ))}

      <div>
        <p>Subtotal: ${subtotal.toFixed(2)}</p>
        <p>
          Discount ({cartStore.state.discount.get()}%): -$
          {discountAmount.toFixed(2)}
        </p>
        <p>Total: ${total.toFixed(2)}</p>
      </div>

      <button onClick={() => cartStore.setDiscount(10)}>
        Apply 10% Discount
      </button>
      <button onClick={() => cartStore.clearCart()}>Clear Cart</button>
    </div>
  );
});
```

### 7. 持久化配置

```typescript
// src/persist/config.ts
import { configureObservablePersistence } from '@legendapp/state/persist';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';

// 配置持久化
configureObservablePersistence({
  // 本地存储插件
  pluginLocal: ObservablePersistLocalStorage,

  // 默认配置
  localOptions: {
    // 表名前缀
    prefix: 'app_',
    // 持久化调整器（可选）
    adjustData: {
      // 加载时调整
      load: (value) => value,
      // 保存时调整
      save: (value) => value,
    },
  },
});
```

```typescript
// src/persist/index.ts
import { persistObservable } from '@legendapp/state/persist';
import { userStore } from '../stores/userStore';
import { settingsStore } from '../stores/settingsStore';

// 持久化用户状态
persistObservable(userStore.state, {
  local: 'user',
});

// 持久化设置
persistObservable(settingsStore.state, {
  local: 'settings',
});

// 导出初始化函数
export function initializePersistence() {
  console.log('Persistence initialized');
}
```

## 最佳实践

### 1. 命名约定
```typescript
// ✅ Good - 可观察变量以 $ 结尾
const userState$ = observable({ name: 'John' });

// ✅ Good - store 使用语义化命名
export const userStore = { state: userState$ };
```

### 2. 组件优化
```typescript
// ✅ Good - 使用 observer 自动优化
export const MyComponent = observer(() => {
  const value = store.state.value.get();
  return <div>{value}</div>;
});

// ✅ Good - 使用 use hook 细粒度更新
export function MyComponent() {
  const value = store.state.value.use();
  return <div>{value}</div>;
}
```

### 3. 避免过度使用
```typescript
// ❌ Bad - 不需要 observer 的简单组件
export const StaticComponent = observer(() => {
  return <div>Static content</div>;
});

// ✅ Good - 普通组件
export function StaticComponent() {
  return <div>Static content</div>;
}
```

### 4. 批量更新
```typescript
// ✅ Good - 自动批量更新
store.state.users.push(user1);
store.state.users.push(user2);
// React 只会重渲染一次

// ✅ Good - 使用 batch
import { batch } from '@legendapp/state';
batch(() => {
  store.state.name.set('John');
  store.state.email.set('john@example.com');
});
```

## 性能对比

| 库 | 操作/秒 | 相对性能 |
|---|---|---|
| Legend State | 10,000,000+ | 100x |
| Zustand | 1,000,000 | 10x |
| Jotai | 800,000 | 8x |
| Redux | 500,000 | 5x |
| MobX | 1,200,000 | 12x |

## 依赖安装

```bash
# 核心依赖
npm install @legendapp/state

# React 集成
npm install @legendapp/state/react

# 持久化插件
npm install @legendapp/state/persist
npm install @legendapp/state/persist-plugins/local-storage
```

## TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## 参考资源

- [Legend State 官方文档](https://legendapp.com/open-source/state/)
- [GitHub 仓库](https://github.com/LegendApp/legend-state)
- [性能基准测试](https://legendapp.com/open-source/state/benchmarks/)
- [示例项目](https://github.com/LegendApp/legend-state/tree/main/examples)
