# ESLint 配置模板

## 技术栈

- **核心**: ESLint v9.x (Flat Config)
- **解析器**: @typescript-eslint/parser
- **插件**: 
  - @typescript-eslint (TypeScript 支持)
  - eslint-plugin-react (React 规则)
  - eslint-plugin-react-hooks (Hooks 规则)
  - eslint-plugin-import (导入排序)
  - eslint-plugin-unicorn (现代最佳实践)
  - eslint-plugin-unused-imports (移除未使用导入)
  - eslint-config-prettier (禁用与 Prettier 冲突的规则)

## 项目结构

```
project/
├── src/
│   ├── components/
│   ├── pages/
│   ├── utils/
│   └── index.ts
├── eslint.config.js (Flat Config)
├── .eslintignore
├── package.json
└── tsconfig.json
```

## 配置文件

### eslint.config.js (ESLint v9 Flat Config)

```javascript
// @ts-check
import js from '@eslint/js';
import ts from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import unicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import prettier from 'eslint-config-prettier';

export default ts.config(
  // 忽略文件
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      '*.config.js',
      'coverage/**',
    ],
  },

  // 基础 JS 规则
  js.configs.recommended,

  // TypeScript 推荐规则
  ...ts.configs.recommended,

  // React 配置
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // 浏览器环境
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        // Node.js 环境
        process: 'readonly',
        __dirname: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React 规则
      'react/react-in-jsx-scope': 'off', // React 17+ 不需要导入 React
      'react/prop-types': 'off', // 使用 TypeScript
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/no-unescaped-entities': 'warn',
      
      // React Hooks 规则
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // TypeScript 规则调整
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },

  // Import 排序和优化
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      import: importPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: [
            'builtin',   // Node.js 内置模块
            'external',  // npm 包
            'internal',  // 内部模块（别名）
            'parent',    // 父级目录
            'sibling',   // 同级目录
            'index',     // 当前目录 index
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'before',
            },
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-unresolved': 'off', // TypeScript 会检查
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Unicorn 最佳实践
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      unicorn,
    },
    rules: {
      'unicorn/prefer-spread': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/no-for-loop': 'warn',
      'unicorn/no-useless-undefined': 'error',
      'unicorn/prefer-ternary': 'warn',
    },
  },

  // Prettier 兼容（必须放在最后）
  prettier
);
```

### .eslintignore

```
dist
build
node_modules
coverage
*.config.js
*.d.ts
public
```

### package.json 脚本

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "lint:ci": "eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0"
  },
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "typescript-eslint": "^7.0.0",
    "eslint": "^9.0.0",
    "eslint-plugin-react": "^7.34.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-import": "^2.29.0",
    "eslint-plugin-unicorn": "^52.0.0",
    "eslint-plugin-unused-imports": "^3.1.0",
    "eslint-config-prettier": "^9.1.0"
  }
}
```

## 代码模式

### 自动修复导入顺序

```typescript
// ❌ 修复前
import { useState } from 'react';
import Button from './Button';
import React from 'react';
import axios from 'axios';
import { api } from '@/utils/api';

// ✅ 修复后（自动排序）
import React, { useState } from 'react';

import axios from 'axios';

import { api } from '@/utils/api';

import Button from './Button';
```

### TypeScript 最佳实践

```typescript
// ✅ 正确的类型定义
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ 正确使用 any（仅当必要时）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logData(data: any): void {
  console.log(JSON.stringify(data, null, 2));
}

// ✅ 未使用变量前缀下划线
function handleClick(_event: React.MouseEvent, value: string) {
  console.log(value);
  // _event 未使用但必须保留参数签名
}
```

### React Hooks 规则

```typescript
// ✅ 正确使用 Hooks
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]); // ✅ 依赖项完整
  
  if (!user) return <div>Loading...</div>;
  
  return <div>{user.name}</div>;
}

// ❌ 错误示例（会被 ESLint 捕获）
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, []); // ❌ 缺少 userId 依赖项
  
  return <div>{user?.name}</div>;
}
```

### Import 优化

```typescript
// ❌ 未使用的导入（会被自动移除）
import { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';

function Component() {
  const [value] = useState('');
  return <div>{value}</div>;
}

// ✅ 修复后
import { useState } from 'react';

function Component() {
  const [value] = useState('');
  return <div>{value}</div>;
}
```

## 最佳实践

1. **配置层级**
   - 使用 Flat Config（ESLint v9+）
   - 从通用到具体的配置顺序
   - Prettier 配置必须放在最后

2. **规则设置**
   - `error`: 必须修复的问题
   - `warn`: 建议修复的问题
   - `off`: 禁用的规则

3. **TypeScript 项目**
   - 禁用 JS 规则，使用 TS 等价规则
   - 配置 `parserOptions.project` 进行类型检查规则

4. **团队协作**
   - 统一 IDE 设置（保存时自动修复）
   - CI/CD 中运行 `lint:ci`（不允许警告）
   - 使用共享配置包

5. **性能优化**
   - 使用 `--cache` 提升速度
   - 合理配置 `ignores`
   - 避免过度严格的规则

## 常用命令

### 开发

```bash
# 安装依赖
npm install --save-dev eslint @eslint/js typescript-eslint

# 初始化配置（如果从零开始）
npm init @eslint/config

# 运行检查
npm run lint

# 自动修复
npm run lint:fix

# 检查特定文件
npx eslint src/components/Button.tsx

# 输出修复内容（不实际修改）
npx eslint src/ --fix-dry-run
```

### 调试

```bash
# 查看生效的规则
npx eslint --print-config src/index.ts

# 检查特定规则
npx eslint src/ --rule '@typescript-eslint/no-explicit-any: error'

# 生成配置文档
npx eslint --inspect-config
```

### CI/CD 集成

```bash
# GitHub Actions
- name: Lint
  run: npm run lint:ci

# 不允许警告
npm run lint -- --max-warnings 0

# 使用缓存
npm run lint -- --cache --cache-location .eslintcache
```

## 进阶配置

### 共享配置包

```javascript
// packages/eslint-config/index.js
import js from '@eslint/js';
import ts from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      // ... 团队共享规则
    },
  },
];

// 使用
// eslint.config.js
import sharedConfig from '@my-org/eslint-config';

export default [
  ...sharedConfig,
  {
    // 项目特定覆盖
  },
];
```

### 类型检查规则

```javascript
// eslint.config.js
export default [
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // 需要类型信息的规则
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',
    },
  },
];
```

### Monorepo 配置

```javascript
// 根目录 eslint.config.js
import js from '@eslint/js';

export default [
  {
    ignores: [
      'packages/*/dist/**',
      'packages/*/node_modules/**',
    ],
  },
  js.configs.recommended,
];

// packages/app/eslint.config.js
import rootConfig from '../../eslint.config.js';

export default [
  ...rootConfig,
  {
    files: ['**/*.tsx'],
    rules: {
      'react/react-in-jsx-scope': 'off',
    },
  },
];
```

## VSCode 集成

### .vscode/settings.json

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.useFlatConfig": true,
  "eslint.workingDirectories": [{ "mode": "auto" }]
}
```

### .vscode/extensions.json

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint"
  ]
}
```

## 注意事项

1. **ESLint v9 迁移**
   - Flat Config 是新的配置格式
   - `.eslintrc.*` 文件已废弃
   - 使用 `import` 而非 `require`

2. **与 Prettier 配合**
   - `eslint-config-prettier` 禁用格式化规则
   - Prettier 负责格式化，ESLint 负责代码质量
   - 先运行 ESLint 修复，再运行 Prettier

3. **性能考虑**
   - 类型检查规则较慢，仅在 CI 中启用
   - 使用 `--cache` 加速增量检查
   - 避免过于复杂的规则

4. **规则冲突**
   - TypeScript ESLint 规则覆盖基础 JS 规则
   - 插件规则可能有重叠，检查优先级
   - 使用 `eslint-config-prettier` 避免格式化冲突

5. **团队采用**
   - 逐步引入严格规则
   - 文档化自定义规则的原因
   - 定期审查和调整规则

## 相关资源

- [ESLint 官方文档](https://eslint.org/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [ESLint v9 迁移指南](https://eslint.org/docs/latest/use/configure/migration-guide)
- [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react)
- [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn)
