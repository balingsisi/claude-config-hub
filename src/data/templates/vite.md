# Vite - 现代前端构建工具

## 技术栈

- **核心**: Vite 5.x
- **开发服务器**: 原生ES模块 + HMR
- **构建工具**: Rollup (生产构建)
- **语言**: TypeScript / JavaScript
- **包管理器**: pnpm / npm / yarn
- **Node版本**: 18+ / 20+

## 项目结构

```
my-vite-project/
├── public/              # 静态资源
│   └── favicon.ico
├── src/
│   ├── assets/         # 需要处理的资源
│   ├── components/     # UI组件
│   ├── pages/          # 页面组件
│   ├── utils/          # 工具函数
│   ├── styles/         # 样式文件
│   ├── App.tsx         # 根组件
│   └── main.tsx        # 入口文件
├── index.html          # HTML模板
├── vite.config.ts      # Vite配置
├── tsconfig.json       # TypeScript配置
├── package.json
└── .env                # 环境变量
```

## 代码模式

### 1. Vite配置 (vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [react()], // 或 vue()
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'axios']
        }
      }
    }
  }
})
```

### 2. 环境变量

```env
# .env
VITE_APP_TITLE=My App
VITE_API_URL=http://localhost:8080

# .env.development
VITE_API_URL=http://dev-api.example.com

# .env.production
VITE_API_URL=https://api.example.com
```

```typescript
// 使用环境变量
const apiUrl = import.meta.env.VITE_API_URL
const mode = import.meta.env.MODE // development | production
```

### 3. 动态导入 (Code Splitting)

```typescript
// 路由懒加载
const Home = () => import('./pages/Home')
const About = () => import('./pages/About')

// 条件加载
async function loadModule() {
  const { heavyFunction } = await import('./utils/heavy')
  return heavyFunction()
}
```

### 4. 静态资源处理

```typescript
// 导入图片
import logoUrl from './assets/logo.png'
<img src={logoUrl} alt="Logo" />

// 动态加载资源
const imageUrl = new URL('./assets/image.png', import.meta.url).href

// public目录资源
<img src="/favicon.ico" />
```

## 最佳实践

### 1. 性能优化

- ✅ 使用动态导入实现代码分割
- ✅ 配置手动分包减少重复代码
- ✅ 启用gzip压缩和brotli
- ✅ 使用预加载和预获取
- ✅ 优化依赖预构建

```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: ['react', 'react-dom', 'lodash'],
    exclude: ['your-linked-package']
  },
  build: {
    target: 'es2015',
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  }
})
```

### 2. 开发体验

- ✅ 配置路径别名简化导入
- ✅ 使用环境变量管理配置
- ✅ 配置代理解决跨域
- ✅ 启用HMR快速反馈
- ✅ 使用TypeScript类型检查

### 3. 插件生态

```typescript
// 常用插件
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import svgr from 'vite-plugin-svgr'
import compression from 'vite-plugin-compression'
import visualizer from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    compression({
      algorithm: 'gzip'
    }),
    visualizer({
      open: true
    })
  ]
})
```

### 4. 多环境配置

```javascript
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:staging": "vite build --mode staging",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx"
  }
}
```

## 常用命令

### 开发

```bash
# 启动开发服务器
pnpm dev
vite

# 指定端口和主机
vite --port 4000 --host

# 指定模式
vite --mode staging
```

### 构建

```bash
# 生产构建
pnpm build
vite build

# 构建分析
vite build --mode analyze

# 预览构建结果
pnpm preview
vite preview
```

### 其他

```bash
# 依赖预构建
vite optimize

# 清除缓存
vite --force

# 创建新项目
pnpm create vite my-app --template react-ts
```

## 部署配置

### 1. Docker部署

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

```nginx
# nginx.conf
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8080;
    }
}
```

### 2. 静态托管

```javascript
// vercel.json
{
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "framework": "vite"
}

// netlify.toml
[build]
  command = "vite build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. CDN配置

```typescript
// vite.config.ts - CDN构建
export default defineConfig({
  base: 'https://cdn.example.com/',
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[hash][extname]',
        chunkFileNames: 'assets/[hash].js',
        entryFileNames: 'assets/[hash].js'
      }
    }
  }
})
```

### 4. GitHub Pages

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 关键特性

- ⚡ **极速启动**: 原生ES模块，无需打包
- 🔥 **即时HMR**: 毫秒级热更新
- 🛠️ **丰富的插件**: 兼容Rollup插件生态
- 📦 **优化的构建**: 预配置的Rollup构建
- 🌐 **SSR支持**: 内置服务端渲染支持
- 🎯 **TypeScript**: 开箱即用的TypeScript支持
