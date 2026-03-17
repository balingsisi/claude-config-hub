# Micro-frontends (Module Federation) 项目模板

## 技术栈

- **构建工具**: Webpack 5 / Vite + @originjs/vite-plugin-federation
- **框架**: React / Vue / Angular（可混用）
- **状态管理**: Redux Toolkit / Zustand / Pinia
- **样式方案**: CSS Modules / Tailwind CSS / Styled Components
- **路由**: React Router / Vue Router（独立路由或共享路由）
- **通信**: Custom Events / Shared State / PostMessage
- **容器**: Webpack Module Federation / Single-SPA / qiankun

## 项目结构

### 主应用（Host）结构

```
micro-frontend-host/
├── public/
│   └── index.html
├── src/
│   ├── bootstrap.tsx       # 异步引导
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 入口文件
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── ErrorBoundary.tsx
│   ├── layouts/
│   │   └── MainLayout.tsx
│   ├── remote/             # 远程组件加载
│   │   ├── RemoteWrapper.tsx
│   │   └── useRemote.ts
│   ├── store/              # 共享状态
│   │   ├── index.ts
│   │   └── slices/
│   ├── styles/
│   │   └── globals.css
│   └── utils/
│       ├── eventBus.ts     # 跨应用通信
│       └── shared.ts       # 共享工具
├── webpack.config.js       # Module Federation 配置
├── package.json
├── tsconfig.json
└── .env
```

### 远程应用（Remote）结构

```
micro-frontend-remote/
├── public/
│   └── index.html
├── src/
│   ├── bootstrap.tsx       # 异步引导
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   └── RemoteComponent.tsx
│   ├── expose/             # 暴露的组件
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── index.ts
│   ├── store/
│   │   └── index.ts
│   └── utils/
├── webpack.config.js
├── package.json
└── tsconfig.json
```

### Monorepo 结构

```
micro-frontends-monorepo/
├── apps/
│   ├── host/               # 主应用
│   ├── products/           # 产品模块
│   ├── checkout/           # 结账模块
│   ├── user-profile/       # 用户模块
│   └── shared-ui/          # 共享 UI 组件库
├── packages/
│   ├── shared-utils/       # 共享工具
│   ├── shared-types/       # 共享类型
│   └── shared-config/      # 共享配置
├── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

## 代码模式

### Webpack 5 Module Federation 配置

```javascript
// webpack.config.js (Host)
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('./package.json').dependencies;

module.exports = {
  entry: './src/main.tsx',
  mode: 'development',
  devServer: {
    port: 3000,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  output: {
    publicPath: 'auto',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        products: 'products@http://localhost:3001/remoteEntry.js',
        checkout: 'checkout@http://localhost:3002/remoteEntry.js',
        userProfile: 'userProfile@http://localhost:3003/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, eager: true, requiredVersion: deps.react },
        'react-dom': { singleton: true, eager: true, requiredVersion: deps['react-dom'] },
        'react-router-dom': { singleton: true, requiredVersion: deps['react-router-dom'] },
        '@reduxjs/toolkit': { singleton: true, requiredVersion: deps['@reduxjs/toolkit'] },
      },
    }),
  ],
};
```

```javascript
// webpack.config.js (Remote - Products)
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('./package.json').dependencies;

module.exports = {
  entry: './src/main.tsx',
  mode: 'development',
  devServer: {
    port: 3001,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  output: {
    publicPath: 'auto',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'products',
      filename: 'remoteEntry.js',
      exposes: {
        './ProductList': './src/expose/ProductList',
        './ProductDetail': './src/expose/ProductDetail',
        './ProductCard': './src/expose/ProductCard',
      },
      shared: {
        react: { singleton: true, eager: true, requiredVersion: deps.react },
        'react-dom': { singleton: true, eager: true, requiredVersion: deps['react-dom'] },
      },
    }),
  ],
};
```

### 异步引导（Bootstrap 模式）

```typescript
// src/main.tsx
import('./bootstrap');

// src/bootstrap.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 主应用加载远程组件

```typescript
// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

// 懒加载远程组件
const ProductList = React.lazy(() => import('products/ProductList'));
const ProductDetail = React.lazy(() => import('products/ProductDetail'));
const Checkout = React.lazy(() => import('checkout/Checkout'));
const UserProfile = React.lazy(() => import('userProfile/UserProfile'));

// 加载中组件
const Loading = () => (
  <div className="loading">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="container">
        <nav className="sidebar">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/checkout">Checkout</Link>
          <Link to="/profile">Profile</Link>
        </nav>
        
        <div className="content">
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/profile" element={<UserProfile />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

function Home() {
  return (
    <div>
      <h1>Welcome to Micro-Frontend App</h1>
      <p>Navigate to different sections using the menu.</p>
    </div>
  );
}

export default App;
```

### 远程应用暴露组件

```typescript
// products/src/expose/ProductList.tsx
import React, { useState, useEffect } from 'react';
import { useSharedState } from '@shared/store';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useSharedState();

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div className="product-list">
      <h2>Products</h2>
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p>${product.price}</p>
            <button onClick={() => addToCart(product)}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
```

```typescript
// products/src/expose/ProductDetail.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // 获取产品详情逻辑
  return (
    <div className="product-detail">
      <h2>Product {id}</h2>
      {/* 产品详情内容 */}
    </div>
  );
};

export default ProductDetail;
```

### 共享状态管理

```typescript
// packages/shared-store/src/index.ts
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';

// 购物车 Slice
const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [] as any[],
    total: 0,
  },
  reducers: {
    addToCart: (state, action: PayloadAction<any>) => {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
      state.total += action.payload.price;
    },
    removeFromCart: (state, action: PayloadAction<number>) => {
      const index = state.items.findIndex(item => item.id === action.payload);
      if (index !== -1) {
        state.total -= state.items[index].price * state.items[index].quantity;
        state.items.splice(index, 1);
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    },
  },
});

// 用户 Slice
const userSlice = createSlice({
  name: 'user',
  initialState: {
    isAuthenticated: false,
    user: null as any,
  },
  reducers: {
    login: (state, action: PayloadAction<any>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
    },
  },
});

// 创建 Store
export const store = configureStore({
  reducer: {
    cart: cartSlice.reducer,
    user: userSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 导出 actions
export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export const { login, logout } = userSlice.actions;

// 导出 hooks
export { Provider, useDispatch, useSelector };

// 自定义 hook
export function useSharedState() {
  const dispatch = useDispatch<AppDispatch>();
  const cart = useSelector((state: RootState) => state.cart);
  const user = useSelector((state: RootState) => state.user);

  return {
    cart,
    user,
    addToCart: (item: any) => dispatch(addToCart(item)),
    removeFromCart: (id: number) => dispatch(removeFromCart(id)),
    clearCart: () => dispatch(clearCart()),
    login: (userData: any) => dispatch(login(userData)),
    logout: () => dispatch(logout()),
  };
}
```

### 跨应用通信

```typescript
// src/utils/eventBus.ts
type EventCallback = (data: any) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
    
    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data: any) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  once(event: string, callback: EventCallback) {
    const unsubscribe = this.on(event, (data) => {
      callback(data);
      unsubscribe();
    });
    return unsubscribe;
  }
}

export const eventBus = new EventBus();

// 使用示例
// 发布事件
eventBus.emit('user:login', { userId: 123, name: 'John' });

// 订阅事件
const unsubscribe = eventBus.on('user:login', (data) => {
  console.log('User logged in:', data);
});

// 取消订阅
unsubscribe();
```

### 远程组件包装器

```typescript
// src/remote/RemoteWrapper.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RemoteWrapper extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Remote component error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="remote-error">
          <h3>Failed to load remote component</h3>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 使用
<RemoteWrapper>
  <Suspense fallback={<Loading />}>
    <ProductList />
  </Suspense>
</RemoteWrapper>
```

### 动态加载远程模块

```typescript
// src/remote/useRemote.ts
import { useState, useEffect } from 'react';

interface RemoteConfig {
  url: string;
  scope: string;
  module: string;
}

export function useRemote<T = any>(config: RemoteConfig) {
  const [remote, setRemote] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRemote();
  }, [config.url, config.scope, config.module]);

  async function loadRemote() {
    try {
      setLoading(true);
      
      // 动态加载远程入口
      await loadScript(config.url);
      
      // 获取远程容器
      const container = (window as any)[config.scope];
      
      // 初始化共享作用域
      await container.init(__webpack_share_scopes__.default);
      
      // 加载模块
      const factory = await container.get(config.module);
      const module = factory();
      
      setRemote(module.default || module);
      setError(null);
    } catch (err) {
      console.error('Failed to load remote:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return { remote, error, loading, reload: loadRemote };
}

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.type = 'text/javascript';
    script.async = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    
    document.head.appendChild(script);
  });
}

// 使用
function DynamicRemoteComponent() {
  const { remote: ProductList, loading, error } = useRemote({
    url: 'http://localhost:3001/remoteEntry.js',
    scope: 'products',
    module: './ProductList',
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!ProductList) return null;

  return <ProductList />;
}
```

### Vite Module Federation

```typescript
// vite.config.ts (Host)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host',
      remotes: {
        products: 'http://localhost:3001/assets/remoteEntry.js',
        checkout: 'http://localhost:3002/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom', 'react-router-dom'],
    }),
  ],
  build: {
    target: 'esnext',
  },
});

// vite.config.ts (Remote)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'products',
      filename: 'remoteEntry.js',
      exposes: {
        './ProductList': './src/expose/ProductList',
        './ProductDetail': './src/expose/ProductDetail',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: {
    target: 'esnext',
  },
});
```

## 最佳实践

### 版本管理

```typescript
// 使用 semantic versioning 共享依赖
// webpack.config.js
shared: {
  react: {
    singleton: true,
    requiredVersion: '^18.0.0',
    strictVersion: false,  // 允许次要版本差异
  },
  'react-dom': {
    singleton: true,
    requiredVersion: '^18.0.0',
  },
  '@shared/utils': {
    singleton: true,
    requiredVersion: '1.0.0',
    strictVersion: true,  // 严格版本要求
  },
}
```

### 错误边界

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  remoteName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 上报错误
    console.error(`Error in ${this.props.remoteName || 'component'}:`, error);
    
    // 发送到错误追踪服务
    if (typeof window !== 'undefined' && (window as any).errorReporter) {
      (window as any).errorReporter.captureException(error, {
        tags: { remote: this.props.remoteName },
        extra: { errorInfo },
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 样式隔离

```typescript
// 1. CSS Modules（推荐）
// ProductList.module.css
.productCard {
  padding: 1rem;
  border: 1px solid #ccc;
}

// ProductList.tsx
import styles from './ProductList.module.css';

<div className={styles.productCard}>...</div>

// 2. CSS-in-JS (Styled Components)
import styled from 'styled-components';

const ProductCard = styled.div`
  padding: 1rem;
  border: 1px solid #ccc;
`;

// 3. Shadow DOM
class ProductWidget extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    // 添加样式和内容
  }
}
```

### 性能优化

```typescript
// 1. 预加载远程模块
<link rel="preload" href="http://localhost:3001/remoteEntry.js" as="script" />

// 2. 代码分割
const ProductList = lazy(() => import('products/ProductList'));

// 3. 按需加载
function App() {
  const [showProducts, setShowProducts] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowProducts(true)}>
        Show Products
      </button>
      {showProducts && (
        <Suspense fallback={<Loading />}>
          <ProductList />
        </Suspense>
      )}
    </div>
  );
}

// 4. 缓存远程模块
const remoteCache = new Map();

async function loadRemoteWithCache(url: string) {
  if (remoteCache.has(url)) {
    return remoteCache.get(url);
  }
  
  const module = await import(/* webpackIgnore: true */ url);
  remoteCache.set(url, module);
  return module;
}
```

## 常用命令

### Monorepo 管理

```bash
# 初始化项目
pnpm init

# 安装所有依赖
pnpm install

# 运行特定应用
pnpm --filter host dev
pnpm --filter products dev

# 构建所有应用
pnpm -r build

# 构建特定应用
pnpm --filter host build

# 运行测试
pnpm -r test

# 清理所有构建产物
pnpm -r clean
```

### Turborepo

```bash
# 安装 Turborepo
pnpm add turbo -D -w

# 运行开发服务器
turbo dev

# 构建所有项目
turbo build

# 运行测试
turbo test

# 只构建变更的项目
turbo build --filter=...[origin/main]
```

### Webpack 开发

```bash
# 启动开发服务器
npm start

# 构建生产版本
npm run build

# 分析包大小
npm run analyze

# 运行测试
npm test
```

## 部署配置

### Docker 部署

```dockerfile
# Dockerfile (Host)
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  host:
    build: ./apps/host
    ports:
      - "3000:80"
    depends_on:
      - products
      - checkout
  
  products:
    build: ./apps/products
    ports:
      - "3001:80"
  
  checkout:
    build: ./apps/checkout
    ports:
      - "3002:80"
```

### Nginx 配置

```nginx
# nginx.conf
server {
    listen 80;
    server_name example.com;

    # 主应用
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # 远程模块代理
    location /remote/products/ {
        proxy_pass http://products:80/;
        proxy_set_header Host $host;
    }

    location /remote/checkout/ {
        proxy_pass http://checkout:80/;
        proxy_set_header Host $host;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy Micro-Frontends

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build all apps
        run: pnpm -r build
      
      - name: Deploy to S3
        run: |
          aws s3 sync apps/host/dist s3://my-bucket/host --delete
          aws s3 sync apps/products/dist s3://my-bucket/products --delete
          aws s3 sync apps/checkout/dist s3://my-bucket/checkout --delete
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## 测试策略

```typescript
// tests/integration/remote.test.ts
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../src/App';

describe('Micro-Frontend Integration', () => {
  it('should load remote ProductList component', async () => {
    render(<App />);
    
    // 导航到产品页
    const productsLink = screen.getByText('Products');
    productsLink.click();
    
    // 等待远程组件加载
    await waitFor(() => {
      expect(screen.getByText('Loading products...')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Products' })).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});

// 单元测试远程组件
// products/tests/ProductList.test.tsx
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@shared/store';
import ProductList from '../src/expose/ProductList';

describe('ProductList', () => {
  it('should render products', async () => {
    render(
      <Provider store={store}>
        <ProductList />
      </Provider>
    );
    
    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });
});
```

## 常见问题

### 1. 共享依赖版本冲突

```javascript
// webpack.config.js
shared: {
  react: {
    singleton: true,
    eager: false,  // 延迟加载
    requiredVersion: deps.react,
    strictVersion: false,  // 允许版本范围
  },
}

// 使用 npm alias 统一版本
// package.json
{
  "dependencies": {
    "react": "18.2.0",
    "react-remote": "npm:react@18.2.0"
  }
}
```

### 2. 样式冲突

```typescript
// 1. 使用 CSS Modules
import styles from './Component.module.css';

// 2. 使用命名空间
<div className="app-product-list">...</div>

// 3. 使用 CSS-in-JS
import styled from 'styled-components';
const Wrapper = styled.div`...`;

// 4. Shadow DOM（完全隔离）
const shadow = element.attachShadow({ mode: 'open' });
```

### 3. 路由同步

```typescript
// 共享路由状态
// packages/shared-router/src/index.ts
import { createBrowserHistory } from 'history';

export const history = createBrowserHistory();

// 各应用使用同一 history 实例
// host/src/App.tsx
import { history } from '@shared/router';
import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom';

<HistoryRouter history={history}>
  <Routes>...</Routes>
</HistoryRouter>
```

### 4. 性能问题

```typescript
// 1. 预加载关键模块
<link rel="modulepreload" href="http://localhost:3001/remoteEntry.js" />

// 2. 使用 HTTP/2 Push
// 3. CDN 缓存
// 4. 按需加载
const RemoteComponent = lazy(() => import('remote/Component'));
```

## 相关资源

- [Webpack Module Federation](https://webpack.js.org/concepts/module-federation/)
- [Module Federation Examples](https://github.com/module-federation/module-federation-examples)
- [Single-SPA](https://single-spa.js.org/)
- [qiankun (阿里)](https://qiankun.umijs.org/)
- [Vite Plugin Federation](https://github.com/originjs/vite-plugin-federation)
- [Micro Frontends](https://micro-frontends.org/)
