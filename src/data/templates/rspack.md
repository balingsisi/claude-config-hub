# Rspack 开发模板

## 技术栈

- **核心**: Rspack (Rust-based bundler)
- **语言**: TypeScript 5.x
- **框架**: React / Vue / Solid / Svelte
- **样式**: CSS / Sass / Less / PostCSS
- **开发工具**: Hot Module Replacement, Source Map

## 项目结构

```
rspack-project/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Layout.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   └── About.tsx
│   ├── styles/
│   │   └── global.css
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── favicon.ico
├── rspack.config.ts           # Rspack 配置
├── tsconfig.json
├── package.json
└── .browserslistrc
```

## 代码模式

### 基础配置

```typescript
// rspack.config.ts
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import * as RefreshPlugin from '@rspack/plugin-react-refresh';

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  entry: {
    main: './src/main.tsx',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': require('path').resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
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
            },
            env: {
              targets: ['defaults'],
            },
          },
        },
        type: 'javascript/auto',
      },
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
      {
        test: /\.svg$/,
        type: 'asset/resource',
      },
      {
        test: /\.(png|jpg|gif|webp)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 10KB
          },
        },
      },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './public/index.html',
      title: 'My Rspack App',
      favicon: './public/favicon.ico',
    }),
    isDev && new RefreshPlugin(),
  ].filter(Boolean),
  devtool: isDev ? 'source-map' : false,
  output: {
    path: require('path').resolve(__dirname, 'dist'),
    clean: true,
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    assetModuleFilename: 'assets/[hash][ext][query]',
  },
  optimization: {
    minimize: !isDev,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
    compress: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

### 多入口配置

```typescript
// rspack.config.ts - 多页应用
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';

export default defineConfig({
  entry: {
    home: './src/pages/home/main.tsx',
    about: './src/pages/about/main.tsx',
    admin: './src/pages/admin/main.tsx',
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      chunks: ['home'],
    }),
    new rspack.HtmlRspackPlugin({
      template: './public/index.html',
      filename: 'about.html',
      chunks: ['about'],
    }),
    new rspack.HtmlRspackPlugin({
      template: './public/index.html',
      filename: 'admin/index.html',
      chunks: ['admin'],
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        common: {
          name: 'common',
          minChunks: 2,
          priority: 10,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
          name: 'react-vendor',
          priority: 20,
        },
      },
    },
  },
});
```

### CSS/Sass 配置

```typescript
// rspack.config.ts - CSS 预处理器
export default defineConfig({
  module: {
    rules: [
      // CSS 模块
      {
        test: /\.module\.css$/,
        type: 'css/module',
      },
      // 全局 CSS
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        type: 'css',
      },
      // Sass/SCSS
      {
        test: /\.s[ac]ss$/,
        use: [
          {
            loader: 'postcss-loader',
          },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                silenceDeprecations: ['legacy-js-api'],
              },
            },
          },
        ],
        type: 'css',
      },
      // Less
      {
        test: /\.less$/,
        use: [
          {
            loader: 'postcss-loader',
          },
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                modifyVars: {
                  '@primary-color': '#3B82F6',
                },
                javascriptEnabled: true,
              },
            },
          },
        ],
        type: 'css',
      },
    ],
  },
});
```

### 环境变量

```typescript
// rspack.config.ts - 环境变量
import { rspack } from '@rspack/core';
import { loadEnv } from '@rspack/cli';

const env = loadEnv();
const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  plugins: [
    new rspack.DefinePlugin({
      'process.env': JSON.stringify({
        NODE_ENV: process.env.NODE_ENV,
        API_URL: process.env.API_URL || 'http://localhost:8080',
        ...env.parsed,
      }),
    }),
    // 或者使用 EnvironmentPlugin
    new rspack.EnvironmentPlugin({
      NODE_ENV: 'development',
      API_URL: 'http://localhost:8080',
      DEBUG: false,
    }),
  ],
});
```

### 代码分割与懒加载

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// 懒加载页面组件
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

// 动态导入时指定 chunk 名称
const AdminPanel = lazy(() => import(
  /* webpackChunkName: "admin" */
  './pages/AdminPanel'
));

export function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/admin">Admin</Link>
      </nav>
      
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

// rspack.config.ts - 预加载配置
export default defineConfig({
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
  experiments: {
    prefetch: true, // 启用预加载
  },
});
```

### SWC 配置

```typescript
// .swcrc 或在 rspack.config.ts 中
const swcOptions = {
  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: true,
      decorators: true,
      dynamicImport: true,
    },
    transform: {
      react: {
        runtime: 'automatic',
        importSource: 'react',
        pragma: 'React.createElement',
        pragmaFrag: 'React.Fragment',
      },
      legacyDecorator: true,
      decoratorMetadata: true,
    },
    experimental: {
      plugins: [
        // SWC 插件
      ],
    },
    target: 'es2015',
    loose: false,
    externalHelpers: true,
  },
  env: {
    targets: {
      chrome: '80',
      firefox: '78',
      safari: '14',
      edge: '80',
    },
    coreJs: 3,
    mode: 'usage',
  },
  sourceMaps: true,
  minify: {
    compress: {
      unused: true,
      dead_code: true,
    },
    mangle: true,
  },
};

// 在 rspack.config.ts 中使用
{
  test: /\.tsx?$/,
  use: {
    loader: 'builtin:swc-loader',
    options: swcOptions,
  },
}
```

### 生产优化

```typescript
// rspack.config.ts - 生产环境优化
import { rspack } from '@rspack/core';
import { BundleAnalyzerPlugin } from 'rspack-bundle-analyzer';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  mode: isProd ? 'production' : 'development',
  
  output: {
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
    assetModuleFilename: 'assets/[hash:8][ext][query]',
    publicPath: '/',
  },
  
  optimization: {
    minimize: isProd,
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin({
        minimizerOptions: {
          compress: {
            drop_console: isProd,
            drop_debugger: isProd,
          },
          mangle: true,
        },
      }),
      new rspack.LightningCssMinimizerRspackPlugin({
        minimizerOptions: {
          errorRecovery: true,
        },
      }),
    ],
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      minRemainingSize: 0,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
  },
  
  plugins: [
    isProd && new rspack.CopyRspackPlugin({
      patterns: [
        { from: 'public', to: 'public' },
      ],
    }),
    isProd && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    }),
  ].filter(Boolean),
  
  performance: {
    maxAssetSize: 250000,
    maxEntrypointSize: 250000,
    hints: isProd ? 'warning' : false,
  },
});
```

### TypeScript 支持

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["@rspack/core/module"]
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

```typescript
// src/vite-env.d.ts (或 src/rspack-env.d.ts)
/// <reference types="@rspack/core/module" />

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}
```

### Module Federation

```typescript
// rspack.config.ts - Module Federation
import { rspack } from '@rspack/core';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';

export default defineConfig({
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        remote1: 'remote1@http://localhost:3001/remoteEntry.js',
        remote2: 'remote2@http://localhost:3002/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, eager: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, eager: true, requiredVersion: '^18.0.0' },
      },
    }),
  ],
});

// 远程应用配置
export default defineConfig({
  plugins: [
    new ModuleFederationPlugin({
      name: 'remote1',
      filename: 'remoteEntry.js',
      exposes: {
        './Button': './src/components/Button',
        './Dashboard': './src/pages/Dashboard',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
      },
    }),
  ],
});

// 消费远程模块
// src/App.tsx
const RemoteButton = React.lazy(() => import('remote1/Button'));
const RemoteDashboard = React.lazy(() => import('remote2/Dashboard'));
```

## 最佳实践

### 1. 缓存优化

```typescript
// rspack.config.ts
export default defineConfig({
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
    cacheDirectory: '.rspack/cache',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7天
  },
});
```

### 2. 构建分析

```typescript
// rspack.config.ts
import { BundleAnalyzerPlugin } from 'rspack-bundle-analyzer';

export default defineConfig({
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'server',
      analyzerPort: 8888,
      openAnalyzer: false,
    }),
  ],
});

// package.json
{
  "scripts": {
    "analyze": "rspack build --analyze"
  }
}
```

### 3. Source Map 配置

```typescript
// 根据环境选择 Source Map 类型
export default defineConfig({
  devtool: isDev
    ? 'eval-source-map'        // 开发环境：快速重建
    : 'hidden-source-map',      // 生产环境：隐藏但不分离
});
```

### 4. 公共路径配置

```typescript
// 动态公共路径
export default defineConfig({
  output: {
    publicPath: isProd ? 'https://cdn.example.com/assets/' : '/',
  },
});

// 或在运行时设置
// src/main.tsx
__webpack_public_path__ = window.CDN_URL || '/';
```

## 常用命令

```bash
# 安装
npm install @rspack/core @rspack/cli -D

# React 支持
npm install @rspack/plugin-react-refresh -D

# 开发服务器
rspack serve

# 构建
rspack build

# 生产构建
rspack build --mode production

# 分析
rspack build --analyze

# 清理缓存
rm -rf .rspack/cache

# 类型检查
tsc --noEmit

# 代码检查
eslint src/
```

## 部署配置

### package.json Scripts

```json
{
  "scripts": {
    "dev": "rspack serve",
    "build": "rspack build",
    "build:analyze": "rspack build --analyze",
    "preview": "npx serve dist",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "clean": "rm -rf dist .rspack/cache"
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

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### CI/CD 配置

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run build
      
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

### Vercel 部署

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": null,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## 扩展资源

- [Rspack 官方文档](https://rspack.dev/)
- [Rspack GitHub](https://github.com/web-infra-dev/rspack)
- [从 Webpack 迁移](https://rspack.dev/guide/migration/webpack)
- [Module Federation](https://module-federation.io/)
- [SWC 配置](https://swc.rs/docs/configuration/swcrc)
- [性能对比](https://rspack.dev/misc/benchmark)
