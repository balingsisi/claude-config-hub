# Rollup Library 模板

## 技术栈

- **打包工具**: Rollup 4.x
- **语言**: TypeScript 5.x
- **编译器**: @rollup/plugin-typescript
- **代码规范**: ESLint + Prettier
- **测试**: Jest/Vitest
- **文档**: TypeDoc
- **发布**: Semantic Release
- **包管理**: pnpm

## 项目结构

```
rollup-library/
├── src/                       # 源代码
│   ├── index.ts              # 入口文件
│   ├── lib/                  # 核心库代码
│   ├── utils/                # 工具函数
│   ├── types/                # 类型定义
│   └── __tests__/            # 测试文件
├── dist/                     # 构建输出
│   ├── esm/                  # ES Module
│   ├── cjs/                  # CommonJS
│   ├── umd/                  # UMD
│   └── types/                # 类型文件
├── docs/                     # 文档
│   ├── api/                  # API 文档
│   └── examples/             # 示例代码
├── scripts/                  # 构建脚本
│   ├── build.js              # 构建脚本
│   └── release.js            # 发布脚本
├── rollup.config.ts          # Rollup 配置
├── tsconfig.json             # TypeScript 配置
├── package.json              # 包配置
├── .eslintrc.js              # ESLint 配置
├── .prettierrc               # Prettier 配置
├── .releaserc.json           # Semantic Release 配置
└── README.md                 # 项目说明
```

## 代码模式

### Rollup 配置

```typescript
// rollup.config.ts
import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import dts from 'rollup-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';
import analyze from 'rollup-plugin-analyzer';
import size from 'rollup-plugin-size';
import license from 'rollup-plugin-license';
import { builtinModules } from 'module';

const isProd = process.env.NODE_ENV === 'production';
const isWatch = process.env.ROLLUP_WATCH === 'true';

const external = [
  ...builtinModules,
  ...builtinModules.map(m => `node:${m}`),
  /^node:/,
];

const plugins = [
  // 解析 node_modules
  resolve({
    preferBuiltins: true,
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  }),

  // 转换 CommonJS
  commonjs(),

  // 解析 JSON
  json(),

  // TypeScript 编译
  typescript({
    tsconfig: './tsconfig.json',
    declaration: false,
    declarationMap: false,
  }),

  // 生产环境压缩
  isProd && terser({
    format: {
      comments: false,
    },
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log'],
    },
  }),

  // 分析包大小
  isProd && analyze({
    summaryOnly: true,
  }),

  // 体积可视化
  isProd && visualizer({
    filename: './docs/stats.html',
    open: false,
    gzipSize: true,
    brotliSize: true,
  }),

  // 包大小报告
  isProd && size({
    writeFile: './docs/.size',
  }),

  // 添加许可证
  license({
    banner: {
      commentStyle: 'regular',
      content: `
        <%= pkg.name %> v<%= pkg.version %>
        Copyright (c) <%= moment().format('YYYY') %> <%= pkg.author %>
        Licensed under <%= pkg.license %>
      `,
    },
    thirdParty: {
      includePrivate: false,
      output: './docs/dependencies.txt',
    },
  }),
].filter(Boolean);

export default defineConfig([
  // ESM 构建
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/esm/index.js',
      format: 'esm',
      sourcemap: true,
      exports: 'named',
    },
    external,
    plugins,
  },

  // CommonJS 构建
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/cjs/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      interop: 'auto',
    },
    external,
    plugins,
  },

  // UMD 构建（浏览器）
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/umd/index.js',
      format: 'umd',
      name: 'MyLibrary',
      sourcemap: true,
      exports: 'named',
      globals: {
        // 外部依赖映射
      },
    },
    external,
    plugins,
  },

  // IIFE 构建（浏览器独立）
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/iife/index.js',
      format: 'iife',
      name: 'MyLibrary',
      sourcemap: true,
      exports: 'named',
    },
    external,
    plugins,
  },

  // 类型文件生成
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/types/index.d.ts',
      format: 'esm',
    },
    plugins: [
      dts({
        respectExternal: true,
      }),
    ],
  },
]);

// rollup.config.minimal.ts - 最小化配置
import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default defineConfig([
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    external: [],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
    ],
  },
]);
```

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowJs": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}

// tsconfig.build.json - 仅用于构建
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/__tests__/**"
  ]
}
```

### Package.json 配置

```json
{
  "name": "my-library",
  "version": "1.0.0",
  "description": "A modern JavaScript library built with Rollup and TypeScript",
  "main": "dist/cjs/index.js",
  "module": "dist/esm/index.js",
  "types": "dist/types/index.d.ts",
  "unpkg": "dist/umd/index.js",
  "jsdelivr": "dist/umd/index.js",
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "default": "./dist/esm/index.js"
    },
    "./package.json": "./package.json"
  },
  "sideEffects": false,
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "dev": "rollup -c -w",
    "build": "rollup -c",
    "build:prod": "NODE_ENV=production rollup -c",
    "clean": "rm -rf dist",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,md}\"",
    "type-check": "tsc --noEmit",
    "docs": "typedoc --out docs src/index.ts",
    "size": "size-limit",
    "analyze": "npm run build && open docs/stats.html",
    "release": "semantic-release",
    "prepublishOnly": "npm run clean && npm run build:prod && npm run test"
  },
  "keywords": [
    "javascript",
    "typescript",
    "library",
    "rollup"
  ],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/username/my-library.git"
  },
  "bugs": {
    "url": "https://github.com/username/my-library/issues"
  },
  "homepage": "https://github.com/username/my-library#readme",
  "devDependencies": {
    "@rollup/plugin-commonjs": "^25.0.0",
    "@rollup/plugin-json": "^6.0.0",
    "@rollup/plugin-node-resolve": "^15.0.0",
    "@rollup/plugin-terser": "^0.4.0",
    "@rollup/plugin-typescript": "^11.0.0",
    "@semantic-release/changelog": "^6.0.0",
    "@semantic-release/git": "^10.0.0",
    "@size-limit/preset-small-lib": "^9.0.0",
    "@types/jest": "^29.0.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jest": "^29.0.0",
    "prettier": "^3.0.0",
    "rollup": "^4.0.0",
    "rollup-plugin-analyzer": "^4.0.0",
    "rollup-plugin-dts": "^6.0.0",
    "rollup-plugin-license": "^3.0.0",
    "rollup-plugin-size": "^0.3.0",
    "rollup-plugin-visualizer": "^5.0.0",
    "semantic-release": "^22.0.0",
    "size-limit": "^9.0.0",
    "ts-jest": "^29.0.0",
    "typedoc": "^0.25.0",
    "typescript": "^5.0.0"
  },
  "peerDependencies": {},
  "engines": {
    "node": ">=16",
    "npm": ">=8"
  },
  "size-limit": [
    {
      "path": "dist/esm/index.js",
      "limit": "10 KB"
    },
    {
      "path": "dist/cjs/index.js",
      "limit": "10 KB"
    },
    {
      "path": "dist/umd/index.js",
      "limit": "15 KB"
    }
  ]
}
```

### 库代码示例

```typescript
// src/index.ts
export { formatCurrency } from './lib/currency';
export { formatDate, parseDate } from './lib/date';
export { validateEmail, validatePhone } from './lib/validation';
export * from './types';

// src/lib/currency.ts
export interface CurrencyOptions {
  locale?: string;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function formatCurrency(
  value: number,
  options: CurrencyOptions = {}
): string {
  const {
    locale = 'en-US',
    currency = 'USD',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

// src/lib/date.ts
export type DateFormat = 'short' | 'medium' | 'long' | 'full';

export interface DateOptions {
  locale?: string;
  format?: DateFormat;
}

export function formatDate(
  date: Date | string | number,
  options: DateOptions = {}
): string {
  const { locale = 'en-US', format = 'medium' } = options;
  const dateObj = parseDate(date);

  const formatOptions: Intl.DateTimeFormatOptions = {
    dateStyle: format,
  };

  return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
}

export function parseDate(date: Date | string | number): Date {
  if (date instanceof Date) return date;
  if (typeof date === 'number') return new Date(date);
  if (typeof date === 'string') return new Date(date);
  throw new Error('Invalid date');
}

// src/lib/validation.ts
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s-()]{10,}$/;

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  return PHONE_REGEX.test(phone.trim());
}

// src/types/index.ts
export interface Result<T, E = Error> {
  ok: boolean;
  value?: T;
  error?: E;
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
```

### 测试配置

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

// src/__tests__/currency.test.ts
import { formatCurrency } from '../lib/currency';

describe('formatCurrency', () => {
  it('should format USD', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('should format EUR', () => {
    expect(formatCurrency(1234.56, { currency: 'EUR', locale: 'de-DE' })).toBe(
      '1.234,56 €'
    );
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('should handle negative values', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
  });

  it('should handle fraction digits', () => {
    expect(
      formatCurrency(1234.5678, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
      })
    ).toBe('$1,234.5678');
  });
});

// src/__tests__/date.test.ts
import { formatDate, parseDate } from '../lib/date';

describe('formatDate', () => {
  it('should format date with default options', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toMatch(/Jan.*15.*2024/);
  });

  it('should format with different locales', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date, { locale: 'zh-CN' })).toMatch(/2024.*1.*15/);
  });

  it('should handle string date', () => {
    expect(formatDate('2024-01-15')).toMatch(/2024/);
  });

  it('should handle timestamp', () => {
    const timestamp = Date.now();
    expect(formatDate(timestamp)).toBeDefined();
  });
});

describe('parseDate', () => {
  it('should parse Date object', () => {
    const date = new Date();
    expect(parseDate(date)).toBe(date);
  });

  it('should parse string', () => {
    const dateStr = '2024-01-15';
    const parsed = parseDate(dateStr);
    expect(parsed.getFullYear()).toBe(2024);
  });

  it('should parse timestamp', () => {
    const timestamp = Date.now();
    const parsed = parseDate(timestamp);
    expect(parsed.getTime()).toBe(timestamp);
  });

  it('should throw on invalid date', () => {
    expect(() => parseDate('invalid')).toThrow();
  });
});
```

## 最佳实践

### 1. 代码组织

```typescript
// src/lib/debounce.ts
export interface DebounceOptions {
  immediate?: boolean;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: DebounceOptions = {}
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const { immediate = false } = options;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    const later = () => {
      timeoutId = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeoutId;

    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
}

// src/lib/throttle.ts
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

// src/utils/is.ts
export const isBrowser = typeof window !== 'undefined';
export const isNode = typeof process !== 'undefined' && process.versions?.node;
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// src/utils/env.ts
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}
```

### 2. Tree-shaking 优化

```typescript
// ❌ Bad - 会打包所有代码
export * from './utils';

// ✅ Good - 只打包使用的函数
export { formatDate } from './utils/formatDate';
export { formatCurrency } from './utils/formatCurrency';

// package.json
{
  "sideEffects": false
}

// 或指定文件
{
  "sideEffects": [
    "*.css",
    "*.scss"
  ]
}
```

### 3. 类型导出

```typescript
// src/types/index.ts
export type { Result, DeepPartial, Prettify } from './common';
export type { User, UserCreateInput, UserUpdateInput } from './user';

// src/index.ts
export type { Result, User } from './types';
export { formatCurrency, formatDate } from './lib';

// 确保类型导出正确
// package.json
{
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js"
    }
  },
  "typesVersions": {
    "*": {
      "*": ["dist/types/*"]
    }
  }
}
```

### 4. 错误处理

```typescript
// src/utils/error.ts
export class LibraryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LibraryError';
  }
}

export class ValidationError extends LibraryError {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new LibraryError(message);
  }
}

// src/lib/validation.ts
import { ValidationError } from '../utils/error';

export function validateEmail(email: string): boolean {
  if (typeof email !== 'string') {
    throw new ValidationError('Email must be a string', 'email');
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

## 常用命令

```bash
# Rollup CLI 命令

# 开发模式
npm run dev

# 构建
npm run build

# 生产构建
npm run build:prod

# 监听模式
npm run dev

# 指定配置文件
rollup -c rollup.config.ts --configPlugin @rollup/plugin-typescript

# 生成 sourcemap
rollup -c --sourcemap

# 压缩代码
NODE_ENV=production rollup -c

# 分析包大小
npm run analyze

# 清理构建产物
npm run clean

# 运行测试
npm test

# 生成覆盖率报告
npm run test:coverage

# 类型检查
npm run type-check

# 代码格式化
npm run format

# 代码检查
npm run lint

# 自动修复
npm run lint:fix

# 生成文档
npm run docs

# 检查包大小
npm run size

# 发布
npm run release

# 本地测试
npm link
```

## 部署配置

### Semantic Release

```json
// .releaserc.json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git",
    "@semantic-release/github"
  ]
}
```

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:coverage

      - name: Build
        run: npm run build

      - name: Check size
        run: npm run size

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  release:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build:prod

      - name: Release
        run: npm run release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### .npmignore

```
# Source files
src/
tests/
__tests__/
*.test.ts
*.spec.ts

# Config files
tsconfig.json
rollup.config.ts
jest.config.js
.eslintrc.js
.prettierrc
.releaserc.json
.github/

# Development files
node_modules/
coverage/
docs/
*.log
.DS_Store
.env
.env.local

# Build scripts
scripts/
```

## 性能优化

### 1. 代码分割

```typescript
// rollup.config.ts
export default defineConfig([
  {
    input: {
      main: 'src/index.ts',
      utils: 'src/utils/index.ts',
      validation: 'src/lib/validation.ts',
    },
    output: [
      {
        dir: 'dist/esm',
        format: 'esm',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
      {
        dir: 'dist/cjs',
        format: 'cjs',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    ],
    plugins: [/* ... */],
  },
]);
```

### 2. 外部化依赖

```typescript
// rollup.config.ts
const external = [
  'react',
  'react-dom',
  'lodash',
  // 正则匹配
  /^lodash\/.*/,
];

export default {
  external,
  output: {
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      lodash: '_',
    },
  },
};
```

### 3. 压缩优化

```typescript
import terser from '@rollup/plugin-terser';

const plugins = [
  terser({
    format: {
      comments: false,
    },
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log'],
      passes: 2,
    },
    mangle: {
      properties: {
        regex: /^_/,
      },
    },
  }),
];
```

## 参考资源

- [Rollup 官方文档](https://rollupjs.org/)
- [Rollup 插件列表](https://github.com/rollup/awesome)
- [TypeScript](https://www.typescriptlang.org/)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [Size Limit](https://github.com/ai/size-limit)
