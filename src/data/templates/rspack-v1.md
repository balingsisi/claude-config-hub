# Rspack v1 构建工具模板

## 技术栈

- **构建工具**: Rspack v1
- **语言**: TypeScript
- **框架**: React 18 / Vue 3 / Svelte
- **样式**: CSS Modules / Tailwind CSS / Sass
- **代码规范**: ESLint + Prettier
- **测试**: Vitest
- **包管理器**: pnpm

## 项目结构

```
rspack-v1/
├── src/
│   ├── index.tsx               # 入口文件
│   ├── App.tsx                 # 根组件
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   └── index.ts
│   │   └── Layout/
│   │       ├── Layout.tsx
│   │       └── Layout.module.css
│   ├── pages/
│   │   ├── Home.tsx
│   │   └── About.tsx
│   ├── hooks/
│   │   └── useCustomHook.ts
│   ├── utils/
│   │   └── helpers.ts
│   ├── styles/
│   │   ├── global.css
│   │   └── variables.css
│   └── types/
│       └── index.ts
├── public/
│   └── favicon.ico
├── rspack.config.ts            # Rspack 配置
├── tsconfig.json
├── package.json
└── .env
```

## 代码模式

### Rspack 配置

```typescript
// rspack.config.ts
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import * as RefreshPlugin from '@rspack/plugin-react-refresh';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  entry: {
    main: './src/index.tsx',
  },

  output: {
    path: __dirname + '/dist',
    publicPath: '/',
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    chunkFilename: isDev ? '[name].js' : '[name].[contenthash].js',
    clean: true,
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': __dirname + '/src',
    },
  },

  module: {
    rules: [
      // TypeScript / JavaScript
      {
        test: /\.tsx?$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                  development: isDev,
                  refresh: isDev,
                },
              },
              target: 'es2020',
            },
            env: {
              coreJs: '3.32',
              targets: {
                chrome: '90',
              },
            },
          },
        },
        type: 'javascript/auto',
      },

      // CSS
      {
        test: /\.css$/,
        use: [
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: {
                  tailwindcss: {},
                  autoprefixer: {},
                },
              },
            },
          },
        ],
        type: 'css',
      },

      // CSS Modules
      {
        test: /\.module\.css$/,
        use: [
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: {
                  tailwindcss: {},
                  autoprefixer: {},
                },
              },
            },
          },
        ],
        type: 'css/module',
      },

      // Sass
      {
        test: /\.s[ac]ss$/,
        use: [
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: {
                  tailwindcss: {},
                  autoprefixer: {},
                },
              },
            },
          },
          'sass-loader',
        ],
        type: 'css',
      },

      // Less
      {
        test: /\.less$/,
        use: [
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: {
                  autoprefixer: {},
                },
              },
            },
          },
          'less-loader',
        ],
        type: 'css',
      },

      // 图片
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 10KB
          },
        },
        generator: {
          filename: 'images/[hash][ext][query]',
        },
      },

      // 字体
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[hash][ext][query]',
        },
      },
    ],
  },

  plugins: [
    // HTML 模板
    new rspack.HtmlRspackPlugin({
      template: './public/index.html',
      title: 'Rspack App',
      favicon: './public/favicon.ico',
      meta: {
        viewport: 'width=device-width, initial-scale=1.0',
      },
    }),

    // 环境变量
    new rspack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.API_URL': JSON.stringify(process.env.API_URL),
    }),

    // React Fast Refresh（开发模式）
    isDev && new RefreshPlugin(),

    // 模块联邦（可选）
    process.env.MODULE_FEDERATION && new ModuleFederationPlugin({
      name: 'app1',
      remotes: {
        app2: 'app2@http://localhost:3001/remoteEntry.js',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),

    // 压缩（生产模式）
    !isDev && new rspack.SwcJsMinimizerRspackPlugin({
      minimizerOptions: {
        compress: {
          drop_console: true,
        },
      },
    }),
  ].filter(Boolean),

  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 244000,
      minChunks: 1,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'initial',
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    runtimeChunk: 'single',
  },

  devtool: isDev ? 'eval-source-map' : 'source-map',

  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
    compress: true,
    open: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  performance: {
    hints: isDev ? false : 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },

  stats: {
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
});
```

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["@rspack/core/module"]
  },
  "include": ["src/**/*", "rspack.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### React 入口文件

```typescript
// src/index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept();
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

```typescript
// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout/Layout';

// 懒加载页面
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>

        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
```

### 组件示例

```typescript
// src/components/Button/Button.tsx
import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <span className={styles.spinner} /> : children}
    </button>
  );
}
```

```css
/* src/components/Button/Button.module.css */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Variants */
.primary {
  background-color: #3b82f6;
  color: white;
}

.primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.secondary {
  background-color: #6b7280;
  color: white;
}

.secondary:hover:not(:disabled) {
  background-color: #4b5563;
}

.danger {
  background-color: #ef4444;
  color: white;
}

.danger:hover:not(:disabled) {
  background-color: #dc2626;
}

/* Sizes */
.small {
  padding: 4px 12px;
  font-size: 12px;
}

.medium {
  padding: 8px 16px;
  font-size: 14px;
}

.large {
  padding: 12px 24px;
  font-size: 16px;
}

/* Loading */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

### 自定义 Hook

```typescript
// src/hooks/useCustomHook.ts
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(url, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        setData(json);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [url]);

  return { data, loading, error };
}
```

### 环境变量

```bash
# .env
NODE_ENV=development
API_URL=http://localhost:8080/api
```

```bash
# .env.production
NODE_ENV=production
API_URL=https://api.example.com
```

### PostCSS 配置

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}),
  },
};
```

### Tailwind CSS 配置

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
      },
    },
  },
  plugins: [],
};
```

## 最佳实践

### 1. 代码分割

```typescript
// 路由级懒加载
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));

// 组件级懒加载
const HeavyComponent = lazy(() => import('./components/HeavyComponent'));

// 预加载
const prefetchAbout = () => import('./pages/About');

// 使用
<Link to="/about" onMouseEnter={prefetchAbout}>
  About
</Link>
```

### 2. 性能优化

```typescript
// rspack.config.ts
export default defineConfig({
  // 缓存
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },

  // 并行处理
  parallelism: 4,

  // 实验性功能
  experiments: {
    lazyCompilation: true, // 懒编译
  },
});
```

### 3. Tree Shaking

```typescript
// package.json
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "*.less"
  ]
}

// 代码中使用
import { debounce } from 'lodash-es'; // 使用 ES 版本
```

### 4. 别名配置

```typescript
// rspack.config.ts
resolve: {
  alias: {
    '@': __dirname + '/src',
    '@components': __dirname + '/src/components',
    '@hooks': __dirname + '/src/hooks',
    '@utils': __dirname + '/src/utils',
  },
}
```

### 5. 构建分析

```typescript
// rspack.config.ts
import { BundleAnalyzerPlugin } from 'rspack-bundle-analyzer';

export default defineConfig({
  plugins: [
    process.env.ANALYZE && new BundleAnalyzerPlugin({
      analyzerMode: 'server',
      analyzerPort: 8888,
    }),
  ].filter(Boolean),
});
```

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 生产模式预览
pnpm preview

# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 测试
pnpm test

# 构建分析
ANALYZE=true pnpm build

# 类型检查
pnpm type-check
```

## 部署配置

### package.json

```json
{
  "name": "rspack-v1-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "rspack serve",
    "build": "rspack build",
    "preview": "rspack preview",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "test": "vitest",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  },
  "devDependencies": {
    "@rspack/cli": "^1.0.0",
    "@rspack/core": "^1.0.0",
    "@rspack/plugin-react-refresh": "^1.0.0",
    "@module-federation/enhanced": "^0.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "sass": "^1.69.0",
    "less": "^4.2.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "vitest": "^1.0.0"
  }
}
```

### Dockerfile

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建
RUN pnpm build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理（如果需要）
    location /api/ {
        proxy_pass http://api-server:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### CI/CD 配置

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm type-check

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build
        env:
          NODE_ENV: production

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist

      - name: Deploy to server
        # 添加部署步骤
        run: echo "Deploy to production"
```

## 参考资源

- [Rspack 官方文档](https://rspack.dev/)
- [Rspack GitHub](https://github.com/web-infra-dev/rspack)
- [React 官方文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
