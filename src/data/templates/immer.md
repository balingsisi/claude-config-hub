# Immer 不可变状态模板

## 技术栈

- **核心库**: immer v10.0+
- **状态管理**: React hooks, Redux, Zustand
- **类型支持**: TypeScript
- **框架集成**: React 18+
- **工具库**: use-immer, @reduxjs/toolkit

## 项目结构

```
src/
├── store/
│   ├── index.ts              # 导出所有 store
│   ├── userStore.ts          # 用户状态
│   ├── cartStore.ts          # 购物车状态
│   ├── todoStore.ts          # 待办事项
│   └── formStore.ts          # 表单状态
├── hooks/
│   ├── useImmerState.ts      # Immer 状态 Hook
│   ├── useImmerReducer.ts    # Immer Reducer Hook
│   └── useImmerForm.ts       # 表单 Hook
├── utils/
│   ├── immerHelpers.ts       # 辅助函数
│   ├── immerMiddleware.ts    # 中间件
│   └── immerProducers.ts     # 生产函数
├── components/
│   ├── Form.tsx              # 表单组件
│   ├── TodoList.tsx          # 待办列表
│   └── ShoppingCart.tsx      # 购物车
└── types/
    └── immer.d.ts            # 类型定义
```

## 代码模式

### 1. 基础配置

```typescript
// src/utils/immerHelpers.ts
import { produce, enableMapSet, enablePatches } from 'immer';

// 启用 ES6 Map/Set 支持
enableMapSet();

// 启用补丁支持（用于撤销/重做）
enablePatches();

export { produce };

// 类型定义
export type Draft<T> = {
  -readonly [P in keyof T]: Draft<T[P]>;
};

export type Recipe<S> = (draft: Draft<S>) => void | S | undefined;
```

### 2. 基础用法

```typescript
// src/utils/immerBasics.ts
import { produce } from 'immer';

// 基础状态更新
interface State {
  name: string;
  age: number;
  address: {
    city: string;
    country: string;
  };
  hobbies: string[];
}

const baseState: State = {
  name: 'Alice',
  age: 25,
  address: {
    city: 'Shanghai',
    country: 'China',
  },
  hobbies: ['reading', 'coding'],
};

// ✅ 使用 Immer（可变风格）
const nextState = produce(baseState, (draft) => {
  draft.age = 26;
  draft.address.city = 'Beijing';
  draft.hobbies.push('gaming');
});

// ❌ 传统方式（繁琐）
const nextStateOld = {
  ...baseState,
  age: 26,
  address: {
    ...baseState.address,
    city: 'Beijing',
  },
  hobbies: [...baseState.hobbies, 'gaming'],
};
```

### 3. React Hooks

```typescript
// src/hooks/useImmerState.ts
import { useState, useCallback } from 'react';
import { produce, Draft } from 'immer';

export function useImmerState<T>(
  initialValue: T | (() => T)
): [T, (updater: (draft: Draft<T>) => void | T) => void] {
  const [state, setState] = useState(initialValue);

  const updateState = useCallback((updater: (draft: Draft<T>) => void | T) => {
    setState((prev) => produce(prev, updater));
  }, []);

  return [state, updateState];
}

// 使用示例
interface User {
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

function UserSettings() {
  const [user, updateUser] = useImmerState<User>({
    name: 'Alice',
    email: 'alice@example.com',
    preferences: {
      theme: 'light',
      notifications: true,
    },
  });

  const toggleTheme = () => {
    updateUser((draft) => {
      draft.preferences.theme = draft.preferences.theme === 'light' ? 'dark' : 'light';
    });
  };

  const updateEmail = (email: string) => {
    updateUser((draft) => {
      draft.email = email;
    });
  };

  return (
    <div>
      <p>Name: {user.name}</p>
      <p>Theme: {user.preferences.theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

### 4. useImmerReducer

```typescript
// src/hooks/useImmerReducer.ts
import { useReducer, useCallback } from 'react';
import { produce, Draft } from 'immer';

type Action<T> = {
  type: string;
  payload?: any;
};

type Reducer<S, A> = (draft: Draft<S>, action: A) => void | S;

export function useImmerReducer<S, A extends Action<S>>(
  reducer: Reducer<S, A>,
  initialState: S
): [S, (action: A) => void] {
  const immerReducer = useCallback(
    (state: S, action: A) => produce(state, (draft) => reducer(draft, action)),
    [reducer]
  );

  return useReducer(immerReducer, initialState);
}

// 使用示例
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type TodoAction =
  | { type: 'ADD'; payload: string }
  | { type: 'TOGGLE'; payload: number }
  | { type: 'DELETE'; payload: number };

function TodoList() {
  const [todos, dispatch] = useImmerReducer<Todo[], TodoAction>(
    (draft, action) => {
      switch (action.type) {
        case 'ADD':
          draft.push({
            id: Date.now(),
            text: action.payload,
            completed: false,
          });
          break;
        case 'TOGGLE':
          const todo = draft.find((t) => t.id === action.payload);
          if (todo) todo.completed = !todo.completed;
          break;
        case 'DELETE':
          const index = draft.findIndex((t) => t.id === action.payload);
          if (index !== -1) draft.splice(index, 1);
          break;
      }
    },
    []
  );

  return (
    <div>
      <button onClick={() => dispatch({ type: 'ADD', payload: 'New todo' })}>
        Add Todo
      </button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <span
              style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
              onClick={() => dispatch({ type: 'TOGGLE', payload: todo.id })}
            >
              {todo.text}
            </span>
            <button onClick={() => dispatch({ type: 'DELETE', payload: todo.id })}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 5. 表单处理

```typescript
// src/hooks/useImmerForm.ts
import { useCallback } from 'react';
import { useImmerState } from './useImmerState';

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
}

export function useImmerForm<T extends Record<string, any>>(
  initialValues: T
) {
  const [state, updateState] = useImmerState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
  });

  const handleChange = useCallback((field: keyof T, value: any) => {
    updateState((draft) => {
      draft.values[field] = value;
      draft.touched[field] = true;
    });
  }, [updateState]);

  const setError = useCallback((field: keyof T, error: string) => {
    updateState((draft) => {
      draft.errors[field] = error;
    });
  }, [updateState]);

  const clearError = useCallback((field: keyof T) => {
    updateState((draft) => {
      delete draft.errors[field];
    });
  }, [updateState]);

  const reset = useCallback(() => {
    updateState((draft) => {
      draft.values = initialValues;
      draft.errors = {};
      draft.touched = {};
    });
  }, [initialValues, updateState]);

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    handleChange,
    setError,
    clearError,
    reset,
  };
}

// 使用示例
interface ContactForm {
  name: string;
  email: string;
  message: string;
}

function ContactForm() {
  const {
    values,
    errors,
    touched,
    handleChange,
    setError,
    clearError,
    reset,
  } = useImmerForm<ContactForm>({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证
    if (!values.name) {
      setError('name', 'Name is required');
      return;
    }
    
    if (!values.email.includes('@')) {
      setError('email', 'Invalid email');
      return;
    }
    
    // 提交
    console.log('Submit:', values);
    reset();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={values.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="Name"
      />
      {touched.name && errors.name && <span>{errors.name}</span>}
      
      <input
        value={values.email}
        onChange={(e) => handleChange('email', e.target.value)}
        placeholder="Email"
      />
      {touched.email && errors.email && <span>{errors.email}</span>}
      
      <textarea
        value={values.message}
        onChange={(e) => handleChange('message', e.target.value)}
        placeholder="Message"
      />
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 6. 购物车示例

```typescript
// src/store/cartStore.ts
import { produce } from 'immer';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
}

export function createCartStore() {
  let state: CartState = {
    items: [],
    total: 0,
  };

  const listeners = new Set<() => void>();

  const getState = () => state;

  const setState = (newState: CartState) => {
    state = newState;
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const addItem = (product: Product) => {
    setState(
      produce(state, (draft) => {
        const existingItem = draft.items.find((item) => item.id === product.id);
        
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          draft.items.push({ ...product, quantity: 1 });
        }
        
        draft.total = draft.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
      })
    );
  };

  const removeItem = (productId: string) => {
    setState(
      produce(state, (draft) => {
        const index = draft.items.findIndex((item) => item.id === productId);
        if (index !== -1) {
          draft.items.splice(index, 1);
          draft.total = draft.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );
        }
      })
    );
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setState(
      produce(state, (draft) => {
        const item = draft.items.find((item) => item.id === productId);
        if (item) {
          item.quantity = Math.max(0, quantity);
          draft.total = draft.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );
        }
      })
    );
  };

  const clearCart = () => {
    setState(
      produce(state, (draft) => {
        draft.items = [];
        draft.total = 0;
      })
    );
  };

  return {
    getState,
    subscribe,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };
}

// 使用示例
function ShoppingCart() {
  const cartStore = createCartStore();
  const [state, setState] = useState(cartStore.getState());

  useEffect(() => {
    return cartStore.subscribe(() => {
      setState(cartStore.getState());
    });
  }, []);

  const handleAdd = (product: Product) => {
    cartStore.addItem(product);
  };

  return (
    <div>
      <h2>Shopping Cart</h2>
      <ul>
        {state.items.map((item) => (
          <li key={item.id}>
            {item.name} x {item.quantity} = ${item.price * item.quantity}
          </li>
        ))}
      </ul>
      <p>Total: ${state.total}</p>
    </div>
  );
}
```

### 7. Redux 集成

```typescript
// src/store/reduxStore.ts
import { createSlice, configureStore, PayloadAction } from '@reduxjs/toolkit';
// @reduxjs/toolkit 内部使用 Immer

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const todosSlice = createSlice({
  name: 'todos',
  initialState: [] as Todo[],
  reducers: {
    addTodo: (state, action: PayloadAction<string>) => {
      // ✅ 可以直接修改（RTK 内部使用 Immer）
      state.push({
        id: Date.now(),
        text: action.payload,
        completed: false,
      });
    },
    toggleTodo: (state, action: PayloadAction<number>) => {
      const todo = state.find((t) => t.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    deleteTodo: (state, action: PayloadAction<number>) => {
      const index = state.findIndex((t) => t.id === action.payload);
      if (index !== -1) {
        state.splice(index, 1);
      }
    },
  },
});

export const { addTodo, toggleTodo, deleteTodo } = todosSlice.actions;

export const store = configureStore({
  reducer: {
    todos: todosSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 8. 补丁与撤销/重做

```typescript
// src/utils/immerPatches.ts
import { produce, enablePatches, Patch } from 'immer';

enablePatches();

interface HistoryState<T> {
  current: T;
  history: {
    past: Array<{ patches: Patch[]; inversePatches: Patch[] }>;
    future: Array<{ patches: Patch[]; inversePatches: Patch[] }>;
  };
}

export function createHistory<T>(initialState: T) {
  let state: HistoryState<T> = {
    current: initialState,
    history: {
      past: [],
      future: [],
    },
  };

  const update = (recipe: (draft: T) => void) => {
    const [nextState, patches, inversePatches] = produce(
      state.current,
      recipe,
      true
    );

    state = {
      current: nextState,
      history: {
        past: [...state.history.past, { patches, inversePatches }],
        future: [],
      },
    };

    return state;
  };

  const undo = () => {
    if (state.history.past.length === 0) return state;

    const { patches, inversePatches } = state.history.past[
      state.history.past.length - 1
    ];

    const previousState = produce(
      state.current,
      (draft) => {
        // 应用反向补丁
        applyPatches(draft, inversePatches);
      }
    ) as T;

    state = {
      current: previousState,
      history: {
        past: state.history.past.slice(0, -1),
        future: [{ patches, inversePatches }, ...state.history.future],
      },
    };

    return state;
  };

  const redo = () => {
    if (state.history.future.length === 0) return state;

    const { patches, inversePatches } = state.history.future[0];

    const nextState = produce(
      state.current,
      (draft) => {
        // 应用补丁
        applyPatches(draft, patches);
      }
    ) as T;

    state = {
      current: nextState,
      history: {
        past: [...state.history.past, { patches, inversePatches }],
        future: state.history.future.slice(1),
      },
    };

    return state;
  };

  const canUndo = () => state.history.past.length > 0;
  const canRedo = () => state.history.future.length > 0;

  return {
    getState: () => state,
    update,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
```

### 9. 异步更新

```typescript
// src/hooks/useAsyncImmer.ts
import { useState, useCallback } from 'react';
import { produce, Draft } from 'immer';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsyncImmer<T>(initialData: T | null = null) {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (
      asyncFn: () => Promise<T>,
      onSuccess?: (data: T) => void,
      onError?: (error: Error) => void
    ) => {
      setState(
        produce((draft) => {
          draft.loading = true;
          draft.error = null;
        })
      );

      try {
        const data = await asyncFn();
        setState(
          produce((draft) => {
            draft.data = data;
            draft.loading = false;
          })
        );
        onSuccess?.(data);
      } catch (error) {
        setState(
          produce((draft) => {
            draft.error = error as Error;
            draft.loading = false;
          })
        );
        onError?.(error as Error);
      }
    },
    []
  );

  const updateData = useCallback((updater: (draft: Draft<T>) => void) => {
    setState(
      produce((draft) => {
        if (draft.data) {
          updater(draft.data as Draft<T>);
        }
      })
    );
  }, []);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    });
  }, [initialData]);

  return {
    ...state,
    execute,
    updateData,
    reset,
  };
}
```

## 最佳实践

### 1. 性能优化

```typescript
// ✅ 使用 produce 进行批量更新
const nextState = produce(state, (draft) => {
  draft.user.name = 'Alice';
  draft.user.age = 30;
  draft.items.push(newItem);
});

// ✅ 避免不必要的 produce
const updatedItems = produce(items, (draft) => {
  // 只在需要时更新
  if (shouldUpdate) {
    draft.push(newItem);
  }
});

// ✅ 使用 useCallback 缓存更新函数
const updateUser = useCallback((name: string) => {
  updateState((draft) => {
    draft.user.name = name;
  });
}, [updateState]);
```

### 2. 类型安全

```typescript
// ✅ 使用 Draft 类型
import { Draft } from 'immer';

interface State {
  readonly id: string;
  readonly name: string;
  readonly items: readonly string[];
}

function updateState(draft: Draft<State>) {
  draft.name = 'Updated'; // ✅ 可以修改
  draft.items.push('new item'); // ✅ 可以修改
}

// ✅ 类型推导
const [state, updateState] = useImmerState<State>({
  id: '1',
  name: 'Initial',
  items: ['a', 'b'],
});

updateState((draft) => {
  draft.name; // string
  draft.items; // string[]
});
```

### 3. 不可变检查

```typescript
// ✅ Immer 自动冻结状态（开发模式）
import { setAutoFreeze } from 'immer';

// 开发模式启用冻结
if (process.env.NODE_ENV === 'development') {
  setAutoFreeze(true);
}

// ❌ 禁用冻结（仅用于性能优化）
// setAutoFreeze(false);
```

### 4. 错误处理

```typescript
// ✅ 捕获 Immer 错误
try {
  const nextState = produce(state, (draft) => {
    // 可能抛出错误的操作
    draft.items.push(mayThrow());
  });
} catch (error) {
  console.error('Immer error:', error);
}

// ✅ 验证状态
import { isDraft, original } from 'immer';

function safeUpdate(draft: Draft<State>) {
  if (isDraft(draft)) {
    const originalState = original(draft);
    // 使用原始状态进行验证
  }
}
```

## 常用命令

```bash
# 安装 Immer
npm install immer

# 安装 React hooks
npm install use-immer

# 安装 Redux Toolkit（内置 Immer）
npm install @reduxjs/toolkit

# TypeScript 支持（内置）
# 无需额外安装

# 测试
npm test
```

## API 参考

### 核心函数

```typescript
produce              // 创建下一个状态
produceWithPatches   // 创建状态并返回补丁
enableMapSet         // 启用 Map/Set 支持
enablePatches        // 启用补丁支持
setAutoFreeze        // 设置自动冻结
setUseProxies        // 设置使用 Proxy
```

### 辅助函数

```typescript
isDraft              // 是否是 draft
isDraftable          // 是否可 draft
original             // 获取原始对象
current              // 获取当前状态
freeze               // 冻结对象
```

### 类型

```typescript
Draft<T>             // Draft 类型
Recipe<S>            // Recipe 函数类型
Patch                // 补丁类型
```

## 扩展资源

- [Immer 官方文档](https://immerjs.github.io/immer/)
- [Immer GitHub](https://github.com/immerjs/immer)
- [use-immer](https://github.com/immerjs/use-immer)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [性能指南](https://immerjs.github.io/immer/docs/performance)
