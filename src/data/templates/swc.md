# SWC - 超快的JavaScript/TypeScript编译器

## 技术栈

- **核心**: SWC (Speedy Web Compiler)
- **语言**: Rust (编译实现)
- **支持**: JavaScript, TypeScript, JSX, TSX
- **用途**: 编译、压缩、打包
- **集成**: Webpack, Vite, Next.js, Rollup

## 项目结构

```
my-project/
├── src/
│   ├── components/
│   ├── pages/
│   ├── utils/
│   └── index.tsx        # 入口文件
├── .swcrc               # SWC配置文件
├── tsconfig.json        # TypeScript配置
├── package.json
└── node_modules/
```

## 代码模式

### 1. SWC配置 (.swcrc)

```json
{
  "$schema": "https://json.schemastore.org/swcrc",
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "tsx": true,
      "decorators": true,
      "dynamicImport": true
    },
    "transform": {
      "react": {
        "pragma": "React.createElement",
        "pragmaFrag": "React.Fragment",
        "throwIfNamespace": true,
        "development": false,
        "useBuiltins": false
      }
    },
    "target": "es2020",
    "loose": false,
    "externalHelpers": true,
    "experimental": {
      "plugins": []
    }
  },
  "module": {
    "type": "es6",
    "strict": true,
    "noInterop": false
  },
  "minify": {
    "compress": true,
    "mangle": true
  },
  "sourceMaps": true
}
```

### 2. Webpack集成 (swc-loader)

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true
              },
              transform: {
                react: {
                  runtime: 'automatic'
                }
              },
              target: 'es2020'
            }
          }
        }
      }
    ]
  }
}
```

### 3. Vite集成 (@vitejs/plugin-react-swc)

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  esbuild: false // 禁用esbuild，使用SWC
})
```

### 4. Next.js集成

```javascript
// next.config.js
module.exports = {
  swcMinify: true, // 使用SWC压缩
  
  // 自定义SWC配置
  experimental: {
    swcPlugins: [
      ['@swc/plugin-styled-components', {}]
    ]
  }
}
```

### 5. Rollup集成

```javascript
// rollup.config.js
import { swc } from 'rollup-plugin-swc3'

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm'
  },
  plugins: [
    swc({
      jsc: {
        parser: {
          syntax: 'typescript'
        },
        target: 'es2020'
      }
    })
  ]
}
```

## 最佳实践

### 1. 性能优化

- ✅ 启用externalHelpers减少重复代码
- ✅ 使用合适的target版本
- ✅ 生产环境启用压缩
- ✅ 使用sourceMaps便于调试

```json
// .swcrc优化配置
{
  "jsc": {
    "externalHelpers": true,
    "target": "es2020",
    "transform": {
      "optimizer": {
        "globals": {
          "vars": {
            "process.env.NODE_ENV": "production"
          }
        }
      }
    }
  },
  "minify": {
    "compress": {
      "unused": true,
      "drop_console": true
    },
    "mangle": true
  }
}
```

### 2. TypeScript支持

```json
// .swcrc for TypeScript
{
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "tsx": true,
      "decorators": true,
      "dynamicImport": true
    },
    "transform": {
      "react": {
        "runtime": "automatic",
        "importSource": "react"
      }
    }
  }
}
```

### 3. 自定义插件

```javascript
// 使用SWC Wasm插件
{
  "jsc": {
    "experimental": {
      "plugins": [
        ["swc-plugin-styled-components", {
          "ssr": true,
          "displayName": true,
          "pure": true
        }]
      ]
    }
  }
}
```

### 4. 开发环境配置

```json
// .swcrc开发配置
{
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "tsx": true
    },
    "transform": {
      "react": {
        "development": true,
        "refresh": true // Fast Refresh
      }
    },
    "target": "es2020"
  },
  "sourceMaps": "inline"
}
```

## 常用命令

### CLI使用

```bash
# 安装
pnpm add -D @swc/cli @swc/core

# 编译文件
swc src/index.ts -o dist/index.js

# 编译目录
swc src -d dist

# 监听模式
swc src -d dist --watch

# 指定配置文件
swc src -d dist --config-file .swcrc

# 源映射
swc src -d dist --source-maps

# 压缩
swc src -d dist --minify
```

### Node.js API

```javascript
const { transformSync, transformFile } = require('@swc/core')

// 同步转换
const result = transformSync('const x = 1', {
  jsc: {
    parser: {
      syntax: 'typescript'
    },
    target: 'es2020'
  }
})

// 异步文件转换
const { code, map } = await transformFile('src/index.ts', {
  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: true
    }
  }
})
```

### 测试集成

```javascript
// jest.config.js with @swc/jest
module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  }
}
```

## 部署配置

### 1. 生产环境配置

```json
// .swcrc.production
{
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "tsx": true
    },
    "target": "es2020",
    "minify": {
      "compress": {
        "drop_console": true,
        "drop_debugger": true,
        "unused": true
      },
      "mangle": true,
      "format": {
        "comments": false
      }
    }
  },
  "module": {
    "type": "es6"
  },
  "sourceMaps": false
}
```

### 2. Webpack生产配置

```javascript
// webpack.prod.js
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true
              },
              minify: {
                compress: true,
                mangle: true
              }
            }
          }
        }
      }
    ]
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        minify: TerserPlugin.swcMinify
      })
    ]
  }
}
```

### 3. CI/CD集成

```yaml
# GitHub Actions
name: Build

on: [push]

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
      - run: pnpm install
      - run: pnpm build # 使用swc-loader构建
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

### 4. Docker构建

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

## 关键特性

- ⚡ **极速编译**: Rust实现，比Babel快20倍
- 🦀 **Rust编写**: 内存安全，高性能
- 📦 **内置压缩**: 集成代码压缩功能
- 🔄 **插件系统**: 支持Wasm插件扩展
- 🎯 **兼容性**: 与Babel配置兼容
- 🛠️ **工具集成**: Webpack, Vite, Next.js等
