# Zustand 模板

## 技术栈
- **Zustand** - 轻量级 React 状态管理库
- **TypeScript** - 完整类型支持
- **Immer** - 不可变数据更新（可选）
- **Persist** - 状态持久化
- **DevTools** - 调试工具集成
- **Middleware** - 日志、持久化等中间件

## 项目结构
```
zustand-project/
├── src/
│   ├── stores/            # Zustand stores
│   │   ├── index.ts
│   │   ├── userStore.ts
│   │   ├── cartStore.ts
│   │   ├── uiStore.ts
│   │   └── settingsStore.ts
│   ├── hooks/             # 自定义 hooks
│   │   ├── useAuth.ts
│   │   └── useCart.ts
│   ├── middleware/        # 中间件
│   │   ├── logger.ts
│   │   └── persist.ts
│   ├── types/             # 类型定义
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础 Store
```typescript
// src/stores/userStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        
        login: (user) => set({ 
          user, 
          isAuthenticated: true 
        }),
        
        logout: () => set({ 
          user: null, 
          isAuthenticated: false 
        }),
        
        updateProfile: (updates) => set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        })),
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({ 
          user: state.user,
          isAuthenticated: state.isAuthenticated 
        }),
      }
    ),
    { name: 'UserStore' }
  )
);
```

### 购物车 Store（复杂示例）
```typescript
// src/stores/cartStore.ts
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Computed
  getItem: (productId: string) => CartItem | undefined;
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      immer((set, get) => ({
        items: [],
        totalItems: 0,
        totalPrice: 0,
        
        addItem: (item) => set((state) => {
          const existingItem = state.items.find(
            (i) => i.productId === item.productId
          );
          
          if (existingItem) {
            existingItem.quantity += 1;
          } else {
            state.items.push({ ...item, quantity: 1 });
          }
          
          // 更新统计
          state.totalItems = state.items.reduce(
            (sum, item) => sum + item.quantity, 0
          );
          state.totalPrice = state.items.reduce(
            (sum, item) => sum + item.price * item.quantity, 0
          );
        }),
        
        removeItem: (productId) => set((state) => {
          state.items = state.items.filter(
            (item) => item.productId !== productId
          );
          
          state.totalItems = state.items.reduce(
            (sum, item) => sum + item.quantity, 0
          );
          state.totalPrice = state.items.reduce(
            (sum, item) => sum + item.price * item.quantity, 0
          );
        }),
        
        updateQuantity: (productId, quantity) => set((state) => {
          const item = state.items.find((i) => i.productId === productId);
          if (item) {
            if (quantity <= 0) {
              state.items = state.items.filter(
                (i) => i.productId !== productId
              );
            } else {
              item.quantity = quantity;
            }
          }
          
          state.totalItems = state.items.reduce(
            (sum, item) => sum + item.quantity, 0
          );
          state.totalPrice = state.items.reduce(
            (sum, item) => sum + item.price * item.quantity, 0
          );
        }),
        
        clearCart: () => set((state) => {
          state.items = [];
          state.totalItems = 0;
          state.totalPrice = 0;
        }),
        
        getItem: (productId) => {
          return get().items.find((item) => item.productId === productId);
        },
      })),
      {
        name: 'cart-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          items: state.items,
        }),
      }
    ),
    { name: 'CartStore' }
  )
);
```

### UI 状态 Store
```typescript
// src/stores/uiStore.ts
import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';
type SidebarPosition = 'left' | 'right';

interface UIState {
  // 主题
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // 侧边栏
  sidebarOpen: boolean;
  sidebarPosition: SidebarPosition;
  toggleSidebar: () => void;
  setSidebarPosition: (position: SidebarPosition) => void;
  
  // 模态框
  activeModal: string | null;
  modalData: any;
  openModal: (id: string, data?: any) => void;
  closeModal: () => void;
  
  // 通知
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),
  
  sidebarOpen: true,
  sidebarPosition: 'left',
  toggleSidebar: () => set((state) => ({ 
    sidebarOpen: !state.sidebarOpen 
  })),
  setSidebarPosition: (position) => set({ sidebarPosition: position }),
  
  activeModal: null,
  modalData: null,
  openModal: (id, data) => set({ activeModal: id, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
  
  notifications: [],
  addNotification: (notification) => {
    const id = Date.now().toString();
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }]
    }));
    
    // 自动移除
    if (notification.duration !== 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration || 5000);
    }
  },
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),
  clearNotifications: () => set({ notifications: [] }),
}));
```

### 设置 Store（异步操作）
```typescript
// src/stores/settingsStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Settings {
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showEmail: boolean;
  };
}

interface SettingsState {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  language: 'en',
  timezone: 'UTC',
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
  privacy: {
    profileVisible: true,
    showEmail: false,
  },
};

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        settings: defaultSettings,
        isLoading: false,
        error: null,
        
        fetchSettings: async () => {
          set({ isLoading: true, error: null });
          try {
            // 模拟 API 调用
            const response = await fetch('/api/settings');
            const settings = await response.json();
            set({ settings, isLoading: false });
          } catch (error) {
            set({ 
              error: 'Failed to fetch settings', 
              isLoading: false 
            });
          }
        },
        
        updateSettings: async (updates) => {
          set({ isLoading: true, error: null });
          try {
            // 模拟 API 调用
            const response = await fetch('/api/settings', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });
            const settings = await response.json();
            set({ settings, isLoading: false });
          } catch (error) {
            set({ 
              error: 'Failed to update settings', 
              isLoading: false 
            });
          }
        },
        
        resetSettings: () => set({ settings: defaultSettings }),
      }),
      {
        name: 'settings-storage',
        partialize: (state) => ({ settings: state.settings }),
      }
    ),
    { name: 'SettingsStore' }
  )
);
```

### 自定义 Hooks
```typescript
// src/hooks/useAuth.ts
import { useCallback } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';

export function useAuth() {
  const { user, isAuthenticated, login, logout, updateProfile } = useUserStore();
  const { clearCart } = useCartStore();
  const { addNotification } = useUIStore();
  
  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      // 模拟 API 调用
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) throw new Error('Login failed');
      
      const userData = await response.json();
      login(userData);
      
      addNotification({
        type: 'success',
        message: `Welcome back, ${userData.name}!`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Login failed. Please check your credentials.',
      });
      throw error;
    }
  }, [login, addNotification]);
  
  const handleLogout = useCallback(() => {
    logout();
    clearCart();
    addNotification({
      type: 'info',
      message: 'You have been logged out.',
    });
  }, [logout, clearCart, addNotification]);
  
  return {
    user,
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
    updateProfile,
  };
}

// src/hooks/useCart.ts
import { useCallback } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';

export function useCart() {
  const {
    items,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItem,
  } = useCartStore();
  
  const { addNotification } = useUIStore();
  
  const handleAddItem = useCallback((item: Parameters<typeof addItem>[0]) => {
    addItem(item);
    addNotification({
      type: 'success',
      message: `${item.name} added to cart`,
      duration: 3000,
    });
  }, [addItem, addNotification]);
  
  const handleRemoveItem = useCallback((productId: string, name: string) => {
    removeItem(productId);
    addNotification({
      type: 'info',
      message: `${name} removed from cart`,
      duration: 3000,
    });
  }, [removeItem, addNotification]);
  
  return {
    items,
    totalItems,
    totalPrice,
    addItem: handleAddItem,
    removeItem: handleRemoveItem,
    updateQuantity,
    clearCart,
    getItem,
  };
}
```

### 中间件
```typescript
// src/middleware/logger.ts
import { StateCreator } from 'zustand';

type Logger = <T>(
  f: StateCreator<T>,
  name?: string
) => StateCreator<T>;

export const logger: Logger = (f, name) => (set, get, api) =>
  f(
    (args) => {
      console.log(`[${name}] prev state:`, get());
      set(args);
      console.log(`[${name}] next state:`, get());
    },
    get,
    api
  );

// src/middleware/persist.ts
import { StateCreator, StoreMutatorIdentifier } from 'zustand';

type PersistWithExpiry = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  name: string,
  expiryMs?: number
) => StateCreator<T, Mps, Mcs>;

export const persistWithExpiry: PersistWithExpiry = (
  f,
  name,
  expiryMs = 24 * 60 * 60 * 1000 // 默认 24 小时
) => (set, get, api) => {
  // 从 localStorage 加载
  const stored = localStorage.getItem(name);
  if (stored) {
    const { state, timestamp } = JSON.parse(stored);
    if (Date.now() - timestamp < expiryMs) {
      api.setState(state);
    }
  }
  
  return f(
    (args) => {
      set(args);
      // 保存到 localStorage
      localStorage.setItem(
        name,
        JSON.stringify({
          state: get(),
          timestamp: Date.now(),
        })
      );
    },
    get,
    api
  );
};
```

### TypeScript 工具
```typescript
// src/types/index.ts
import { StateCreator } from 'zustand';

// Store 状态类型
export type StoreState<T> = T;

// Store Actions 类型
export type StoreActions<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

// 创建带类型的 store
export type CreateStore<T> = StateCreator<T, [], [], T>;

// 选择器类型
export type Selector<T, U> = (state: T) => U;

// 浅比较类型
export type ShallowEqual<T> = (a: T, b: T) => boolean;
```

## 最佳实践

### 1. 模块化 Store
```typescript
// src/stores/index.ts
export { useUserStore } from './userStore';
export { useCartStore } from './cartStore';
export { useUIStore } from './uiStore';
export { useSettingsStore } from './settingsStore';

// 组合 store
export const useRootStore = () => ({
  user: useUserStore(),
  cart: useCartStore(),
  ui: useUIStore(),
  settings: useSettingsStore(),
});
```

### 2. 性能优化
```typescript
// 使用选择器避免不必要的重渲染
import { shallow } from 'zustand/shallow';

function Component() {
  // ❌ 不好：整个 store 变化都会触发重渲染
  const store = useCartStore();
  
  // ✅ 好：只订阅需要的字段
  const totalItems = useCartStore((state) => state.totalItems);
  
  // ✅ 好：多个字段使用 shallow 比较
  const { items, totalPrice } = useCartStore(
    (state) => ({ items: state.items, totalPrice: state.totalPrice }),
    shallow
  );
}
```

### 3. 测试
```typescript
// tests/cartStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/stores/cartStore';

describe('CartStore', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      totalItems: 0,
      totalPrice: 0,
    });
  });
  
  it('should add item to cart', () => {
    const { addItem } = useCartStore.getState();
    
    addItem({
      productId: '1',
      name: 'Product 1',
      price: 10,
    });
    
    const { items, totalItems, totalPrice } = useCartStore.getState();
    
    expect(items).toHaveLength(1);
    expect(totalItems).toBe(1);
    expect(totalPrice).toBe(10);
  });
});
```

## 常用命令

### 安装
```bash
# 安装 Zustand
npm install zustand

# 安装 Immer 中间件（可选）
npm install immer

# 安装开发工具
npm install -D @types/node
```

### 开发
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm run test
```

## 部署配置

### package.json
```json
{
  "name": "zustand-project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "zustand": "^4.5.0",
    "immer": "^10.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Vite 配置
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Dockerfile
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
```

### 环境变量
```bash
# .env
VITE_API_URL=https://api.example.com
VITE_APP_NAME=My App
```
