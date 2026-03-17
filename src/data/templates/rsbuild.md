# Rsbuild 模板

## 技术栈

### 核心技术
- **Rsbuild**: 基于 Rspack 的构建工具
- **Rspack**: Rust 实现的 webpack 替代品
- **React**: UI 框架
- **TypeScript**: 类型安全

### 开发工具
- **Rsbuild Plugin React**: React 支持
- **Rsbuild Plugin Svelte**: Svelte 支持
- **Rsbuild Plugin Vue**: Vue 支持
- **Rsbuild Plugin Less/Sass**: CSS 预处理器

### 插件生态
- **@rsbuild/plugin-react**
- **@rsbuild/plugin-vue**
- **@rsbuild/plugin-svelte**
- **@rsbuild/plugin-babel**
- **@rsbuild/plugin-svgr**

## 项目结构

```
rsbuild-project/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   └── index.ts
│   │   ├── Header/
│   │   └── Footer/
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   └── Contact.tsx
│   ├── hooks/
│   │   └── useWindowSize.ts
│   ├── utils/
│   │   └── helpers.ts
│   ├── styles/
│   │   ├── global.css
│   │   └── variables.css
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── index.tsx
├── public/
│   └── favicon.ico
├── rsbuild.config.ts
├── tsconfig.json
└── package.json
```

## 核心代码模式

### 1. Rsbuild 配置

```typescript
// rsbuild.config.ts
import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginSvgr } from '@rsbuild/plugin-svgr'

export default defineConfig({
  plugins: [pluginReact(), pluginSvgr()],
  html: {
    template: './public/index.html',
  },
  source: {
    entry: {
      index: './src/index.tsx',
    },
  },
  output: {
    distPath: {
      root: 'dist',
    },
    assetPrefix: '/',
  },
  dev: {
    port: 3000,
    hot: true,
    liveReload: true,
  },
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
    },
  },
})
```

### 2. React 入口文件

```tsx
// src/index.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

### 3. App 组件

```tsx
// src/App.tsx
import { useState } from 'react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Home count={count} setCount={setCount} />
      </main>
      <Footer />
    </div>
  )
}
```

### 4. 模块化 CSS

```tsx
// src/components/Button/Button.tsx
import styles from './Button.module.css'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

```css
/* src/components/Button/Button.module.css */
.button {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.primary {
  background-color: #4F46E5;
  color: white;
}

.primary:hover {
  background-color: #4338CA;
}

.secondary {
  background-color: transparent;
  color: #4F46E5;
  border: 2px solid #4F46E5;
}

.secondary:hover {
  background-color: #EEF2FF;
}
```

### 5. 环境变量

```typescript
// rsbuild.config.ts
import { loadEnv } from '@rsbuild/core'

const { publicVars } = loadEnv({ prefixes: ['PUBLIC_'] })

export default defineConfig({
  source: {
    globalVars: {
      'process.env': publicVars,
    },
  },
})
```

```bash
# .env
PUBLIC_API_URL=https://api.example.com
PUBLIC_APP_NAME=My Rsbuild App
```

### 6. 多页面应用

```typescript
// rsbuild.config.ts
export default defineConfig({
  source: {
    entry: {
      index: './src/pages/index.tsx',
      about: './src/pages/about.tsx',
      contact: './src/pages/contact.tsx',
    },
  },
  html: {
    template({ entryName }) {
      return {
        templatePath: `./public/${entryName}.html`,
      }
    },
  },
})
```

### 7. 代码分割与懒加载

```tsx
// src/App.tsx
import { lazy, Suspense } from 'react'
import { Loading } from './components/Loading'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Suspense>
  )
}
```

### 8. 性能优化配置

```typescript
// rsbuild.config.ts
export default defineConfig({
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
    },
    removeConsole: ['log', 'info'],
  },
  security: {
    nonce: 'your-nonce-value',
  },
  output: {
    filenameHash: true,
    minify: {
      js: true,
      css: true,
    },
  },
})
```

## 最佳实践

### 1. 快速启动

```typescript
// ✅ 使用 Rsbuild 的快速 HMR
// Rsbuild 基于 Rspack，启动速度比 webpack 快 10 倍

// rsbuild.config.ts
export default defineConfig({
  dev: {
    hot: true,
    liveReload: true,
    // 快速启动
    devMiddleware: {
      writeToDisk: false,
    },
  },
})
```

### 2. TypeScript 集成

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

### 3. 路径别名

```typescript
// rsbuild.config.ts
export default defineConfig({
  source: {
    alias: {
      '@': './src',
      '@components': './src/components',
      '@utils': './src/utils',
    },
  },
})
```

### 4. CSS Modules

```typescript
// rsbuild.config.ts
export default defineConfig({
  output: {
    cssModules: {
      localIdentName: '[local]_[hash:base64:5]',
    },
  },
})
```

## 常用命令

### 开发

```bash
# 启动开发服务器
pnpm dev

# 指定端口
pnpm dev --port 3001

# 打开浏览器
pnpm dev --open
```

### 构建

```bash
# 构建生产版本
pnpm build

# 分析构建产物
pnpm build --analyze

# 构建并查看报告
ANALYZE=true pnpm build
```

### 其他

```bash
# 预览生产构建
pnpm preview

# 类型检查
pnpm type-check

# Lint
pnpm lint
```

## 部署配置

### 1. Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. Vercel 部署

```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": "rsbuild"
}
```

### 3. Netlify 部署

```toml
# netlify.toml
[build]
  command = "pnpm build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 4. 静态资源 CDN

```typescript
// rsbuild.config.ts
export default defineConfig({
  output: {
    assetPrefix: 'https://cdn.example.com/',
  },
})
```

## Rsbuild vs Webpack

| 特性 | Rsbuild | Webpack |
|------|---------|---------|
| 启动速度 | ⚡ 极快 (Rspack) | 🐢 慢 |
| 构建速度 | ⚡ 极快 | 🐢 慢 |
| 配置复杂度 | 🟢 简单 | 🔴 复杂 |
| 生态系统 | 🟡 成长中 | 🟢 成熟 |
| TypeScript | 🟢 原生支持 | 🟡 需要配置 |
| CSS Modules | 🟢 原生支持 | 🟡 需要 loader |

## 相关资源

- [Rsbuild 官方文档](https://rsbuild.dev/)
- [Rspack 文档](https://rspack.dev/)
- [React 文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/)
