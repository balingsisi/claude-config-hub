# Zustand State Management 模板

## 技术栈

- **状态管理**: Zustand 4.x
- **React**: 18.x (支持 Concurrent Mode)
- **TypeScript**: 5.x
- **开发工具**: Zustand DevTools, Immer middleware
- **持久化**: zustand/middleware (localStorage, sessionStorage)
- **测试**: Vitest + @testing-library/react

## 项目结构

```
src/
├── stores/                    # Zustand stores
│   ├── index.ts              # Store exports
│   ├── userStore.ts          # 用户状态
│   ├── cartStore.ts          # 购物车状态
│   ├── uiStore.ts            # UI状态
│   └── middleware/           # 自定义中间件
│       ├── logger.ts         # 日志中间件
│       └── persist.ts        # 持久化配置
├── hooks/                    # 自定义hooks
│   ├── useUser.ts           # 用户状态hook
│   ├── useCart.ts           # 购物车hook
│   └── useUI.ts             # UI状态hook
├── types/                    # 类型定义
│   ├── user.ts
│   ├── cart.ts
│   └── store.ts
├── selectors/               # 选择器
│   ├── userSelectors.ts
│   └── cartSelectors.ts
└── __tests__/              # 测试
    ├── stores/
    └── hooks/
```

## 代码模式

### 基础 Store 创建

```typescript
// stores/userStore.ts
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User, UserState, UserActions } from '@/types/user';

type UserStore = UserState & UserActions;

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Actions
        setUser: (user: User | null) => {
          set((state) => {
            state.user = user;
            state.isAuthenticated = !!user;
          });
        },

        login: async (credentials) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          
          try {
            const user = await authApi.login(credentials);
            set((state) => {
              state.user = user;
              state.isAuthenticated = true;
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.isLoading = false;
            });
          }
        },

        logout: () => {
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
          });
        },

        updateUser: (updates) => {
          set((state) => {
            if (state.user) {
              Object.assign(state.user, updates);
            }
          });
        },

        reset: () => {
          set(initialState);
        },
      })),
      {
        name: 'user-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'UserStore' }
  )
);
```

### 选择器模式

```typescript
// selectors/userSelectors.ts
import { useUserStore } from '@/stores/userStore';

// 基础选择器
export const useUser = () => useUserStore((state) => state.user);
export const useIsAuthenticated = () => useUserStore((state) => state.isAuthenticated);

// 派生选择器
export const useUserDisplayName = () => 
  useUserStore((state) => {
    if (!state.user) return 'Guest';
    return `${state.user.firstName} ${state.user.lastName}`;
  });

// 计算属性
export const useUserInitials = () =>
  useUserStore((state) => {
    if (!state.user) return '?';
    return `${state.user.firstName[0]}${state.user.lastName[0]}`.toUpperCase();
  });

// 批量选择（避免重渲染）
export const useUserActions = () => 
  useUserStore((state) => ({
    login: state.login,
    logout: state.logout,
    updateUser: state.updateUser,
  }));
```

### 异步 Actions

```typescript
// stores/cartStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
}

interface CartActions {
  addItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
}

export const useCartStore = create<CartState & CartActions>()(
  devtools(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      fetchCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const cart = await cartApi.get();
          set({ items: cart.items, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      addItem: async (productId, quantity) => {
        const { items } = get();
        set({ isLoading: true });
        
        try {
          const newItem = await cartApi.addItem(productId, quantity);
          set({ 
            items: [...items, newItem],
            isLoading: false 
          });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      removeItem: async (itemId) => {
        set({ isLoading: true });
        try {
          await cartApi.removeItem(itemId);
          set((state) => ({
            items: state.items.filter((item) => item.id !== itemId),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      clearCart: async () => {
        try {
          await cartApi.clear();
          set({ items: [] });
        } catch (error) {
          set({ error: error.message });
        }
      },
    }),
    { name: 'CartStore' }
  )
);
```

### 自定义中间件

```typescript
// stores/middleware/logger.ts
import { StateCreator, StoreMutatorIdentifier } from 'zustand';

type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>;

export const logger: Logger = (f, name) => (set, get, api) => {
  type T = ReturnType<typeof f>;
  
  const loggedSet: typeof set = (...args) => {
    const prevState = get();
    set(...args);
    const nextState = get();
    
    console.group(`%c ${name || 'Store'} Update`, 'color: #9c88ff; font-weight: bold');
    console.log('%c Prev State:', 'color: #ff6b6b', prevState);
    console.log('%c Next State:', 'color: #4ecdc4', nextState);
    console.groupEnd();
  };

  return f(loggedSet, get, api);
};

// 使用
export const useStore = create(
  logger(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    'CounterStore'
  )
);
```

### 组合多个 Stores

```typescript
// hooks/useAppInitialization.ts
import { useEffect } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';

export const useAppInitialization = () => {
  const fetchUser = useUserStore((state) => state.fetchUser);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const setTheme = useUIStore((state) => state.setTheme);

  useEffect(() => {
    const init = async () => {
      // 并行加载初始数据
      await Promise.all([
        fetchUser(),
        fetchCart(),
      ]);

      // 从 localStorage 恢复主题
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme);
      }
    };

    init();
  }, []);
};

// stores/combinedStore.ts - 共享状态场景
interface RootStore {
  user: UserStore;
  cart: CartStore;
}

export const useRootStore = create<RootStore>(() => ({
  user: useUserStore.getState(),
  cart: useCartStore.getState(),
}));

// 跨 store 通信
useUserStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated) {
      useCartStore.getState().clearCart();
    }
  }
);
```

## 最佳实践

### 1. 状态切片模式

```typescript
// stores/slices/userSlice.ts
import { StateCreator } from 'zustand';

export interface UserSlice {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
}

export const createUserSlice: StateCreator<UserSlice> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateUser: (updates) => 
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
});

// stores/slices/cartSlice.ts
export interface CartSlice {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
}

export const createCartSlice: StateCreator<CartSlice> = (set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
});

// stores/index.ts - 组合 slices
import { create } from 'zustand';
import { createUserSlice, UserSlice } from './slices/userSlice';
import { createCartSlice, CartSlice } from './slices/cartSlice';

type StoreState = UserSlice & CartSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createUserSlice(...a),
  ...createCartSlice(...a),
}));
```

### 2. 性能优化

```typescript
// ❌ 避免：整个 store 变化时重渲染
const Component = () => {
  const store = useCartStore(); // 订阅整个 store
  return <div>{store.items.length}</div>;
};

// ✅ 推荐：精确选择器
const Component = () => {
  const itemsCount = useCartStore((state) => state.items.length);
  return <div>{itemsCount}</div>;
};

// ✅ 使用 shallow 比较对象
import { shallow } from 'zustand/shallow';

const Component = () => {
  const { items, total } = useCartStore(
    (state) => ({ items: state.items, total: state.total }),
    shallow
  );
};

// ✅ 使用 useShallow (React 18+)
import { useShallow } from 'zustand/react/shallow';

const Component = () => {
  const { items, total } = useCartStore(
    useShallow((state) => ({ items: state.items, total: state.total }))
  );
};
```

### 3. TypeScript 最佳实践

```typescript
// types/store.ts
import { StateCreator } from 'zustand';

// 通用 Store 类型
export interface StoreApi<T> {
  getState: () => T;
  setState: (partial: T | Partial<T>) => void;
  subscribe: (listener: (state: T) => void) => () => void;
}

// Action 类型
export type Actions<T extends object> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never;
};

// State 类型
export type State<T extends object> = Omit<T, keyof Actions<T>>;

// 创建类型安全的 store
export function createTypedStore<T extends object>(
  config: StateCreator<T>
) {
  return create<T>()(config);
}
```

### 4. 测试策略

```typescript
// __tests__/stores/userStore.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { useUserStore } from '@/stores/userStore';

describe('UserStore', () => {
  beforeEach(() => {
    // 重置 store
    useUserStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('should set user correctly', () => {
    const mockUser = { id: '1', name: 'John' };
    
    act(() => {
      useUserStore.getState().setUser(mockUser);
    });

    expect(useUserStore.getState().user).toEqual(mockUser);
    expect(useUserStore.getState().isAuthenticated).toBe(true);
  });

  it('should handle login', async () => {
    await act(async () => {
      await useUserStore.getState().login({ email: 'test@example.com' });
    });

    const state = useUserStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toBeDefined();
  });
});
```

## 常用命令

```bash
# 安装依赖
npm install zustand immer

# 开发依赖
npm install -D @testing-library/react vitest

# TypeScript 类型
npm install -D @types/node

# 开发服务器
npm run dev

# 运行测试
npm run test

# 构建生产版本
npm run build

# 代码检查
npm run lint
```

## 调试技巧

```typescript
// 1. DevTools 集成
export const useStore = create(
  devtools(
    (set) => ({
      // your store
    }),
    { 
      name: 'MyStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// 2. Console 日志
useStore.subscribe((state, prevState) => {
  console.log('State changed:', { prevState, state });
});

// 3. 性能监控
const startTime = performance.now();
useStore.subscribe(() => {
  const duration = performance.now() - startTime;
  if (duration > 16) {
    console.warn('Slow store update:', duration);
  }
});
```

## 部署配置

### Vercel 部署

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url"
  }
}
```

### Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

### SSR 注意事项

```typescript
// SSR 安全的持久化
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      // state
    }),
    {
      name: 'storage',
      storage: createJSONStorage(() => {
        // SSR 时使用内存存储
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
    }
  )
);
```

## 迁移指南

### 从 Redux 迁移

```typescript
// Redux
const mapStateToProps = (state) => ({
  user: state.user,
  cart: state.cart,
});

// Zustand
const useStore = () => ({
  user: useUserStore((state) => state.user),
  cart: useCartStore((state) => state.cart),
});

// Redux Thunk
const login = (credentials) => async (dispatch) => {
  dispatch({ type: 'LOGIN_START' });
  const user = await api.login(credentials);
  dispatch({ type: 'LOGIN_SUCCESS', payload: user });
};

// Zustand
const useUserStore = create((set) => ({
  login: async (credentials) => {
    set({ isLoading: true });
    const user = await api.login(credentials);
    set({ user, isLoading: false });
  },
}));
```

### 从 Context API 迁移

```typescript
// Context
const UserContext = createContext();
const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Zustand - 无需 Provider
export const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

// 直接使用
const Component = () => {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
};
```

## 参考资源

- [Zustand 官方文档](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Immer 中间件](https://docs.pmnd.rs/zustand/guides/immer-middleware)
- [TypeScript 最佳实践](https://docs.pmnd.rs/zustand/guides/typescript)
