# Babel JavaScript 模板

## 技术栈

- **编译器**: Babel 7.x
- **预设**: @babel/preset-env, @babel/preset-typescript, @babel/preset-react
- **插件**: @babel/plugin-transform-runtime, @babel/plugin-proposal-decorators
- **工具**: @babel/cli, @babel/core, @babel/node
- **Polyfill**: core-js, regenerator-runtime
- **集成**: Webpack, Vite, Rollup

## 项目结构

```
babel-javascript/
├── src/                       # 源代码
│   ├── components/           # React 组件
│   ├── utils/                # 工具函数
│   ├── services/             # 服务层
│   ├── index.ts              # 入口文件
│   └── types/                # 类型定义
├── dist/                     # 编译输出
│   ├── esm/                  # ES Module 输出
│   ├── cjs/                  # CommonJS 输出
│   └── umd/                  # UMD 输出
├── scripts/                  # 构建脚本
│   ├── build.js             # 构建脚本
│   └── clean.js             # 清理脚本
├── babel.config.js          # Babel 配置
├── .browserslistrc          # 浏览器兼容配置
├── package.json
└── tsconfig.json            # TypeScript 配置（如需要）
```

## 代码模式

### Babel 配置

```javascript
// babel.config.js
module.exports = function (api) {
  const isDevelopment = api.env('development');
  const isProduction = api.env('production');
  const isTest = api.env('test');

  const presets = [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: ['>0.25%', 'not dead'],
          node: 'current',
        },
        modules: isTest ? 'commonjs' : false,
        useBuiltIns: 'usage',
        corejs: {
          version: 3,
          proposals: true,
        },
        debug: isDevelopment,
      },
    ],
    [
      '@babel/preset-typescript',
      {
        isTSX: true,
        allExtensions: true,
        onlyRemoveTypeImports: true,
      },
    ],
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
        development: isDevelopment,
        importSource: '@emotion/react',
      },
    ],
  ];

  const plugins = [
    // 装饰器支持
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    
    // 类属性支持
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    
    // 私有方法支持
    '@babel/plugin-proposal-private-methods',
    
    // 私有字段支持
    ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
    
    // Runtime 优化
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: false,
        helpers: true,
        regenerator: true,
        version: '^7.23.0',
      },
    ],
    
    // 开发环境插件
    isDevelopment && 'react-refresh/babel',
    
    // 生产环境插件
    isProduction && [
      'transform-react-remove-prop-types',
      {
        removeImport: true,
      },
    ],
  ].filter(Boolean);

  return {
    presets,
    plugins,
    assumptions: {
      setPublicClassFields: true,
      privateFieldsAsProperties: true,
      objectRestNoSymbols: true,
    },
    overrides: [
      {
        test: /\.ts$/,
        plugins: [['@babel/plugin-transform-typescript', { isTSX: false }]],
      },
      {
        test: /\.tsx$/,
        plugins: [['@babel/plugin-transform-typescript', { isTSX: true }]],
      },
    ],
    env: {
      development: {
        sourceMaps: 'inline',
      },
      production: {
        comments: false,
        minified: true,
      },
      test: {
        plugins: [
          [
            'istanbul',
            {
              exclude: ['**/*.d.ts', '**/*.test.*', 'tests/**'],
            },
          ],
        ],
      },
    },
  };
};

// .babelrc (JSON 格式配置)
{
  "presets": [
    ["@babel/preset-env", {
      "targets": "> 0.25%, not dead",
      "useBuiltIns": "usage",
      "corejs": 3
    }],
    "@babel/preset-typescript",
    "@babel/preset-react"
  ],
  "plugins": [
    "@babel/plugin-transform-runtime",
    ["@babel/plugin-proposal-decorators", { "legacy": true }]
  ]
}
```

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "noEmit": true,
    "emitDeclarationOnly": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.*"]
}
```

### 浏览器兼容配置

```
# .browserslistrc
# 生产环境
[production]
> 0.25%
not dead
not op_mini all

# 开发环境
[development]
last 1 chrome version
last 1 firefox version
last 1 safari version
last 1 edge version

# 现代浏览器
[modern]
supports es6-module
maintained node versions
```

### Package.json 脚本

```json
{
  "name": "my-babel-project",
  "version": "1.0.0",
  "main": "dist/cjs/index.js",
  "module": "dist/esm/index.js",
  "browser": "dist/umd/my-project.min.js",
  "types": "dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts",
      "default": "./dist/cjs/index.js"
    },
    "./package.json": "./package.json"
  },
  "files": ["dist"],
  "scripts": {
    "build": "npm run clean && npm run build:cjs && npm run build:esm && npm run build:umd",
    "build:cjs": "BABEL_ENV=cjs babel src --out-dir dist/cjs --extensions '.ts,.tsx,.js,.jsx' --copy-files",
    "build:esm": "BABEL_ENV=esm babel src --out-dir dist/esm --extensions '.ts,.tsx,.js,.jsx' --copy-files",
    "build:umd": "BABEL_ENV=umd webpack --config webpack.umd.config.js",
    "clean": "rimraf dist",
    "dev": "BABEL_ENV=development babel src --out-dir dist --watch --source-maps inline",
    "start": "babel-node src/index.ts",
    "test": "BABEL_ENV=test jest",
    "lint": "eslint src --ext .ts,.tsx,.js,.jsx",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@babel/cli": "^7.23.0",
    "@babel/core": "^7.23.0",
    "@babel/node": "^7.23.0",
    "@babel/plugin-proposal-class-properties": "^7.18.0",
    "@babel/plugin-proposal-decorators": "^7.23.0",
    "@babel/plugin-proposal-private-methods": "^7.18.0",
    "@babel/plugin-proposal-private-property-in-object": "^7.21.0",
    "@babel/plugin-transform-runtime": "^7.23.0",
    "@babel/preset-env": "^7.23.0",
    "@babel/preset-react": "^7.23.0",
    "@babel/preset-typescript": "^7.23.0",
    "@babel/register": "^7.22.0",
    "babel-loader": "^9.1.0",
    "core-js": "^3.33.0",
    "regenerator-runtime": "^0.14.0",
    "rimraf": "^5.0.0",
    "typescript": "^5.3.0",
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.0"
  },
  "dependencies": {
    "@babel/runtime": "^7.23.0",
    "@babel/runtime-corejs3": "^7.23.0"
  }
}
```

### Webpack 集成

```javascript
// webpack.config.js
const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    library: {
      name: 'MyLibrary',
      type: 'umd',
    },
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            cacheCompression: false,
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  devtool: 'source-map',
  optimization: {
    minimize: true,
  },
};

// webpack.umd.config.js
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist/umd'),
    filename: 'my-project.min.js',
    library: {
      name: 'MyProject',
      type: 'umd',
    },
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
          output: {
            comments: false,
          },
        },
      }),
    ],
  },
};
```

### Vite 集成

```javascript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      babel: {
        presets: ['@babel/preset-env'],
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-proposal-class-properties', { loose: true }],
        ],
        // 自定义 Babel 配置
        configFile: './babel.config.js',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2015',
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'MyProject',
      fileName: (format) => `my-project.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
```

### Rollup 集成

```javascript
// rollup.config.js
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';

const extensions = ['.ts', '.tsx', '.js', '.jsx'];

export default [
  // ESM
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/esm/index.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      resolve({ extensions }),
      commonjs(),
      typescript(),
      babel({
        babelHelpers: 'bundled',
        extensions,
        exclude: 'node_modules/**',
      }),
    ],
  },
  // CJS
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/cjs/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      resolve({ extensions }),
      commonjs(),
      typescript(),
      babel({
        babelHelpers: 'bundled',
        extensions,
        exclude: 'node_modules/**',
      }),
    ],
  },
  // UMD
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/umd/index.js',
      format: 'umd',
      name: 'MyProject',
      sourcemap: true,
    },
    plugins: [
      resolve({ extensions }),
      commonjs(),
      typescript(),
      babel({
        babelHelpers: 'bundled',
        extensions,
        exclude: 'node_modules/**',
      }),
      terser(),
    ],
  },
];
```

### Jest 集成

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.*',
  ],
};

// jest.setup.js
require('@babel/register');
```

### 源代码示例

```typescript
// src/index.ts
export * from './utils';
export * from './services';
export * from './components';

// src/utils/helpers.ts
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// src/components/Button.tsx
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_URL || 'https://api.example.com',
  timeout: 10000,
});

export const userService = {
  async getUsers() {
    const response = await api.get('/users');
    return response.data;
  },

  async getUser(id: string) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async createUser(data: any) {
    const response = await api.post('/users', data);
    return response.data;
  },
};
```

## 最佳实践

### 1. 预设和插件选择

```javascript
// 推荐的预设组合
const presets = [
  // 根据目标环境自动确定转换
  '@babel/preset-env',
  
  // TypeScript 支持
  '@babel/preset-typescript',
  
  // React JSX 支持
  '@babel/preset-react',
];

// 推荐的插件组合
const plugins = [
  // 装饰器（legacy 模式兼容性更好）
  ['@babel/plugin-proposal-decorators', { legacy: true }],
  
  // 类属性
  ['@babel/plugin-proposal-class-properties', { loose: true }],
  
  // Runtime 优化（避免重复代码）
  '@babel/plugin-transform-runtime',
];
```

### 2. Polyfill 策略

```javascript
// babel.config.js - 按需引入
presets: [
  [
    '@babel/preset-env',
    {
      useBuiltIns: 'usage', // 根据使用自动引入
      corejs: 3,
    },
  ],
]

// 或者手动在入口文件引入
// src/index.ts
import 'core-js/stable';
import 'regenerator-runtime/runtime';
```

### 3. 缓存优化

```javascript
// webpack.config.js
use: {
  loader: 'babel-loader',
  options: {
    cacheDirectory: true, // 启用缓存
    cacheCompression: false, // 不压缩缓存
  },
}

// babel.config.js
module.exports = {
  // ...
  cache: true,
  cacheDirectory: './node_modules/.cache/babel',
};
```

### 4. 环境特定配置

```javascript
// babel.config.js
module.exports = function (api) {
  const env = api.env();

  const config = {
    development: {
      sourceMaps: 'inline',
      plugins: ['react-refresh/babel'],
    },
    production: {
      comments: false,
      minified: true,
      plugins: ['transform-react-remove-prop-types'],
    },
    test: {
      plugins: ['istanbul'],
    },
  };

  return {
    // 基础配置
    presets: [...],
    plugins: [...],
    // 环境配置
    ...config[env],
  };
};
```

## 常用命令

```bash
# 编译文件
babel src --out-dir dist

# 编译并监听变化
babel src --out-dir dist --watch

# 生成 source maps
babel src --out-dir dist --source-maps

# 指定配置文件
babel src --out-dir dist --config-file ./babel.config.js

# 忽略文件
babel src --out-dir dist --ignore "src/**/*.test.js"

# 复制非 JavaScript 文件
babel src --out-dir dist --copy-files

# 指定扩展名
babel src --out-dir dist --extensions '.ts,.tsx,.js,.jsx'

# 运行 Node.js 脚本
babel-node src/index.ts

# 运行时指定环境
BABEL_ENV=production babel src --out-dir dist

# 清理缓存
rm -rf node_modules/.cache/babel-loader
```

## 参考资源

- [Babel 官方文档](https://babeljs.io/)
- [Babel Preset Env](https://babeljs.io/docs/en/babel-preset-env)
- [Babel Plugin Transform Runtime](https://babeljs.io/docs/en/babel-plugin-transform-runtime)
- [CoreJS 文档](https://github.com/zloirock/core-js)
- [Babel GitHub](https://github.com/babel/babel)
