# esbuild - 极速JavaScript打包器

## 技术栈

- **核心**: esbuild 0.20+
- **语言**: Go (编译实现)
- **支持**: JavaScript, TypeScript, JSX, CSS, JSON
- **特性**: 打包、压缩、转换
- **集成**: Vite, Webpack plugin, CLI

## 项目结构

```
my-project/
├── src/
│   ├── components/
│   ├── utils/
│   ├── styles/
│   │   └── main.css
│   └── index.tsx
├── public/
│   └── index.html
├── esbuild.config.js    # esbuild配置
├── package.json
└── tsconfig.json
```

## 代码模式

### 1. 基础配置 (esbuild.config.js)

```javascript
const esbuild = require('esbuild')

// 开发模式
async function build() {
  await esbuild.build({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    outfile: 'dist/bundle.js',
    format: 'esm',
    platform: 'browser',
    target: ['es2020'],
    sourcemap: true,
    minify: false,
    
    // 处理CSS
    loader: {
      '.css': 'css',
      '.png': 'file',
      '.svg': 'file'
    },
    
    // 路径别名
    alias: {
      '@': './src'
    },
    
    // 环境变量
    define: {
      'process.env.NODE_ENV': '"development"'
    }
  })
}

build()
```

### 2. 开发服务器

```javascript
const esbuild = require('esbuild')

async function startDev() {
  const ctx = await esbuild.context({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    outfile: 'dist/bundle.js',
    sourcemap: true,
    loader: {
      '.tsx': 'tsx',
      '.css': 'css'
    }
  })
  
  // 启动开发服务器
  await ctx.serve({
    servedir: 'public',
    port: 3000
  })
  
  // 启用watch模式
  await ctx.watch()
  
  console.log('Server running at http://localhost:3000')
}

startDev()
```

### 3. 多入口打包

```javascript
esbuild.build({
  entryPoints: [
    { in: 'src/pages/home.tsx', out: 'home' },
    { in: 'src/pages/about.tsx', out: 'about' },
    { in: 'src/pages/contact.tsx', out: 'contact' }
  ],
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  splitting: true, // 启用代码分割
  chunkNames: 'chunks/[name]-[hash]',
  metafile: true // 生成构建分析文件
}).then(result => {
  // 输出构建分析
  const text = JSON.stringify(result.metafile, null, 2)
  require('fs').writeFileSync('meta.json', text)
})
```

### 4. 插件系统

```javascript
const esbuild = require('esbuild')
const fs = require('fs')

// HTTP插件示例
const httpPlugin = {
  name: 'http',
  setup(build) {
    // 拦截http/https导入
    build.onResolve({ filter: /^https?:\/\// }, args => ({
      path: args.path,
      namespace: 'http-url'
    }))
    
    // 加载远程模块
    build.onLoad({ filter: /.*/, namespace: 'http-url' }, async (args) => {
      const response = await fetch(args.path)
      const contents = await response.text()
      return { contents }
    })
  }
}

// 环境变量插件
const envPlugin = {
  name: 'env',
  setup(build) {
    build.onResolve({ filter: /^env$/ }, () => ({
      path: 'env',
      namespace: 'env-ns'
    }))
    
    build.onLoad({ filter: /.*/, namespace: 'env-ns' }, () => ({
      contents: JSON.stringify(process.env),
      loader: 'json'
    }))
  }
}

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/bundle.js',
  plugins: [httpPlugin, envPlugin]
})
```

### 5. CSS处理

```javascript
esbuild.build({
  entryPoints: ['src/styles/main.css'],
  bundle: true,
  outfile: 'dist/styles.css',
  loader: {
    '.css': 'css',
    '.png': 'file',
    '.svg': 'dataurl'
  },
  minify: true
})

// CSS-in-JS
esbuild.build({
  entryPoints: ['src/index.tsx'],
  bundle: true,
  outfile: 'dist/bundle.js',
  loader: {
    '.css': 'text' // CSS作为字符串导入
  }
})
```

## 最佳实践

### 1. 性能优化

- ✅ 启用代码分割减少包体积
- ✅ 使用合适的target版本
- ✅ 配置tree-shaking
- ✅ 使用loader优化资源加载

```javascript
esbuild.build({
  entryPoints: ['src/index.tsx'],
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  splitting: true,
  treeShaking: true,
  minify: {
    syntax: true,
    whitespace: true,
    identifiers: true
  },
  target: ['es2020', 'chrome80', 'firefox75'],
  loader: {
    '.png': 'file',
    '.woff2': 'file',
    '.svg': 'dataurl'
  }
})
```

### 2. TypeScript集成

```javascript
esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/bundle.js',
  // esbuild只做转换，不做类型检查
  // 需要单独运行tsc进行类型检查
  tsconfig: 'tsconfig.json'
})

// package.json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "build": "npm run type-check && node esbuild.config.js"
  }
}
```

### 3. 开发体验

```javascript
const esbuild = require('esbuild')
const { local } = require('./plugin-local')

async function dev() {
  const ctx = await esbuild.context({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    outdir: 'dist',
    sourcemap: 'linked',
    banner: {
      js: '// Built with esbuild'
    },
    footer: {
      js: '// End of bundle'
    }
  })
  
  await ctx.watch()
  console.log('Watching for changes...')
}

dev()
```

### 4. 生产环境配置

```javascript
const esbuild = require('esbuild')

async function build() {
  const result = await esbuild.build({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    outdir: 'dist',
    format: 'esm',
    splitting: true,
    minify: true,
    metafile: true,
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    drop: ['console', 'debugger'], // 移除console和debugger
    legalComments: 'none', // 移除注释
    treeShaking: true
  })
  
  // 分析构建结果
  const analysis = await esbuild.analyzeMetafile(result.metafile)
  console.log(analysis)
}

build()
```

## 常用命令

### CLI使用

```bash
# 安装
pnpm add -D esbuild

# 基础打包
esbuild src/index.ts --bundle --outfile=dist/bundle.js

# 开发模式
esbuild src/index.ts --bundle --outfile=dist/bundle.js --watch --servedir=.

# 生产构建
esbuild src/index.ts --bundle --outfile=dist/bundle.js --minify

# 指定格式
esbuild src/index.ts --bundle --format=esm --platform=browser

# 代码分割
esbuild src/*.ts --bundle --outdir=dist --splitting --format=esm

# 分析包体积
esbuild src/index.ts --bundle --minify --analyze
```

### API使用

```javascript
const esbuild = require('esbuild')

// 一次性构建
await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/bundle.js'
})

// 持续监听
const ctx = await esbuild.context({ /* config */ })
await ctx.watch()

// 开发服务器
await ctx.serve({ servedir: 'dist' })

// 增量构建
const result = await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/bundle.js',
  incremental: true
})
await result.rebuild()
```

## 部署配置

### 1. 生产构建脚本

```javascript
// esbuild.prod.js
const esbuild = require('esbuild')
const { copy } = require('esbuild-plugin-copy')

async function build() {
  await esbuild.build({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    outdir: 'dist',
    format: 'esm',
    splitting: true,
    minify: true,
    metafile: true,
    sourcemap: false,
    treeShaking: true,
    target: ['es2020'],
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    plugins: [
      copy({
        assets: {
          from: ['public/index.html'],
          to: ['index.html']
        }
      })
    ]
  })
}

build()
```

### 2. Docker部署

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3. CI/CD集成

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

### 4. 多环境构建

```javascript
// esbuild.config.js
const mode = process.env.MODE || 'development'

const config = {
  development: {
    minify: false,
    sourcemap: 'inline',
    define: {
      'process.env.NODE_ENV': '"development"'
    }
  },
  production: {
    minify: true,
    sourcemap: false,
    drop: ['console', 'debugger'],
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  }
}

esbuild.build({
  entryPoints: ['src/index.tsx'],
  bundle: true,
  outfile: 'dist/bundle.js',
  ...config[mode]
})
```

## 关键特性

- ⚡ **极速构建**: Go实现，比Webpack快100倍
- 🦎 **Go编写**: 并行处理，内存高效
- 📦 **内置功能**: 打包、压缩、转换一体化
- 🔌 **插件系统**: 灵活的扩展能力
- 🌳 **Tree Shaking**: 自动移除未使用代码
- 📊 **构建分析**: 内置包体积分析
- 🔄 **Watch模式**: 快速增量构建
