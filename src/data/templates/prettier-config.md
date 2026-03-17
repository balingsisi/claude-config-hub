# Prettier 配置模板

## 技术栈

- **核心**: Prettier 3.x
- **插件**:
  - @prettier/plugin-xml (XML 格式化)
  - prettier-plugin-tailwindcss (Tailwind 类名排序)
  - prettier-plugin-organize-imports (导入语句排序)
  - prettier-plugin-svelte (Svelte 支持)
  - prettier-plugin-prisma (Prisma Schema 格式化)

## 项目结构

```
project/
├── src/
│   ├── components/
│   ├── pages/
│   └── index.ts
├── .prettierrc (或 prettier.config.js)
├── .prettierignore
├── package.json
└── .vscode/
    └── settings.json
```

## 配置文件

### .prettierrc (JSON)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "jsxSingleQuote": false,
  "bracketSameLine": false,
  "proseWrap": "preserve",
  "htmlWhitespaceSensitivity": "css",
  "embeddedLanguageFormatting": "auto",
  "singleAttributePerLine": false,
  
  "plugins": [
    "prettier-plugin-tailwindcss",
    "prettier-plugin-organize-imports"
  ],
  
  "tailwindConfig": "./tailwind.config.js",
  "tailwindFunctions": ["clsx", "cn", "cva"],
  "organizeImportsSkipDestructiveCodeActions": true
}
```

### prettier.config.js (JavaScript)

```javascript
/** @type {import('prettier').Config} */
module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'es5',
  printWidth: 100,
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  
  // 插件
  plugins: [
    'prettier-plugin-tailwindcss',
    'prettier-plugin-organize-imports',
  ],
  
  // 插件特定配置
  tailwindConfig: './tailwind.config.js',
  tailwindFunctions: ['clsx', 'cn', 'cva'],
  organizeImportsSkipDestructiveCodeActions: true,
  
  // 覆盖特定文件
  overrides: [
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
    {
      files: '*.json',
      options: {
        printWidth: 120,
      },
    },
    {
      files: '*.html',
      options: {
        printWidth: 120,
        htmlWhitespaceSensitivity: 'ignore',
      },
    },
  ],
};
```

### .prettierignore

```
dist
build
node_modules
coverage
.next
.nuxt
.output
*.min.js
*.min.css
package-lock.json
yarn.lock
pnpm-lock.yaml
```

### package.json 脚本

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "format:staged": "pretty-quick --staged",
    "format:changed": "pretty-quick --pattern 'src/**/*.{ts,tsx,js,jsx}'"
  },
  "devDependencies": {
    "prettier": "^3.2.0",
    "prettier-plugin-tailwindcss": "^0.5.0",
    "prettier-plugin-organize-imports": "^3.2.0",
    "pretty-quick": "^4.0.0"
  }
}
```

## 代码模式

### 格式化前后对比

#### TypeScript/JavaScript

```typescript
// ❌ 格式化前
import React, { useState, useEffect } from "react";
import Button from "./Button";
import { fetchData } from "../utils/api";

interface User {
  id: string;
  name: string;
  email: string;
}

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    fetchData(userId).then((data) => setUser(data));
  }, [userId]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

export default UserProfile;

// ✅ 格式化后
import { useState, useEffect } from 'react';

import Button from './Button';

import { fetchData } from '../utils/api';

interface User {
  id: string;
  name: string;
  email: string;
}

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchData(userId).then((data) => setUser(data));
  }, [userId]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

export default UserProfile;
```

#### Tailwind CSS 类名排序

```typescript
// ❌ 格式化前
<div class="text-red-500 p-4 bg-blue-200 hover:bg-blue-300 flex items-center justify-center">
  Content
</div>

// ✅ 格式化后（自动排序）
<div class="flex items-center justify-center bg-blue-200 p-4 text-red-500 hover:bg-blue-300">
  Content
</div>
```

#### JSX/TSX

```typescript
// ❌ 格式化前
function Card({title,description,onClick}) {
  return (
    <div className="card" onClick={onClick}>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

// ✅ 格式化后
function Card({ title, description, onClick }) {
  return (
    <div className="card" onClick={onClick}>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
```

#### CSS

```css
/* ❌ 格式化前 */
.container{display:flex;align-items:center;justify-content:space-between;padding:20px;background:#fff;}

/* ✅ 格式化后 */
.container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: #fff;
}
```

#### JSON

```json
// ❌ 格式化前
{"name":"my-app","version":"1.0.0","dependencies":{"react":"^18.0.0","typescript":"^5.0.0"}}

// ✅ 格式化后
{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 与 Tailwind CSS 集成

```typescript
// 使用 clsx 或 cn 工具函数
import { clsx } from 'clsx';

function Button({ variant, size, className, ...props }) {
  return (
    <button
      className={clsx(
        // 基础样式
        'rounded-lg font-semibold transition-colors',
        // 变体样式
        variant === 'primary' && 'bg-blue-500 text-white hover:bg-blue-600',
        variant === 'secondary' && 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        // 尺寸样式
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'lg' && 'px-6 py-3 text-lg',
        // 自定义类名
        className
      )}
      {...props}
    />
  );
}

// 格式化后，类名按 Tailwind 推荐顺序排列
```

### Import 语句组织

```typescript
// ❌ 格式化前
import { useState } from 'react';
import React from 'react';
import Button from './Button';
import axios from 'axios';
import { api } from '@/utils/api';

// ✅ 格式化后（自动排序）
import React, { useState } from 'react';

import axios from 'axios';

import { api } from '@/utils/api';

import Button from './Button';
```

## 最佳实践

1. **团队协作**
   - 统一 Prettier 配置文件
   - 提交前自动格式化（husky + lint-staged）
   - CI/CD 中运行格式检查

2. **编辑器集成**
   - VSCode: 安装 Prettier 插件
   - 启用 "Format on Save"
   - 设置 Prettier 为默认格式化工具

3. **与 ESLint 配合**
   - 使用 `eslint-config-prettier` 禁用冲突规则
   - 先运行 ESLint 修复，再运行 Prettier
   - ESLint 负责代码质量，Prettier 负责格式化

4. **渐进式采用**
   - 使用 `.prettierignore` 排除旧文件
   - 分批次格式化代码
   - 不强制一次性格式化整个项目

5. **性能优化**
   - 使用缓存（`--cache`）
   - 仅格式化修改的文件
   - 避免格式化生成的文件

## 常用命令

### 开发

```bash
# 安装依赖
npm install --save-dev prettier

# 格式化所有文件
npm run format

# 检查格式化（不修改）
npm run format:check

# 格式化特定文件
npx prettier --write src/index.ts

# 格式化特定类型文件
npx prettier --write "**/*.{ts,tsx,js,jsx}"

# 使用不同配置
npx prettier --config .prettierrc.custom --write .

# 输出格式化结果（不修改文件）
npx prettier src/index.ts
```

### Git 集成

```bash
# 安装 husky 和 lint-staged
npm install --save-dev husky lint-staged

# 初始化 husky
npx husky init

# 添加 pre-commit hook
echo "npx lint-staged" > .husky/pre-commit

# package.json 配置
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx,json,css,md}": [
      "prettier --write"
    ]
  }
}
```

### CI/CD 集成

```yaml
# .github/workflows/format-check.yml
name: Format Check

on: [pull_request]

jobs:
  format-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run format:check
```

## VSCode 集成

### .vscode/settings.json

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit"
  },
  "prettier.requireConfig": true,
  "prettier.useEditorConfig": true,
  "prettier.configPath": ".prettierrc",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[html]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[css]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### .vscode/extensions.json

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "editorconfig.editorconfig"
  ]
}
```

### .editorconfig

```ini
# EditorConfig - 跨编辑器配置
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

## 进阶配置

### 共享配置包

```javascript
// packages/prettier-config/index.js
module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  plugins: [
    'prettier-plugin-tailwindcss',
  ],
};

// 使用
// package.json
{
  "prettier": "@my-org/prettier-config"
}

// 或 .prettierrc.js
import baseConfig from '@my-org/prettier-config';

export default {
  ...baseConfig,
  // 项目特定覆盖
  printWidth: 120,
};
```

### Monorepo 配置

```javascript
// 根目录 prettier.config.js
module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  overrides: [
    {
      files: 'packages/frontend/**/*.{ts,tsx}',
      options: {
        plugins: ['prettier-plugin-tailwindcss'],
      },
    },
    {
      files: 'packages/backend/**/*.ts',
      options: {
        printWidth: 120,
      },
    },
  ],
};
```

### 动态配置

```javascript
// prettier.config.js
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  printWidth: isProduction ? 120 : 100,
  semi: true,
  singleQuote: true,
};
```

## 注意事项

1. **配置优先级**
   - Prettier 查找配置文件的顺序：
     1. `package.json` 中的 `"prettier"` 键
     2. `.prettierrc` (JSON/YAML)
     3. `.prettierrc.json`
     4. `.prettierrc.yaml`
     5. `.prettierrc.yml`
     6. `.prettierrc.toml`
     7. `.prettierrc.js`
     8. `.prettierrc.cjs`
     9. `prettier.config.js`
     10. `prettier.config.cjs`

2. **与 ESLint 冲突**
   - 安装 `eslint-config-prettier`
   - 在 ESLint 配置中添加 `"prettier"`
   - 确保 Prettier 配置在最后

3. **Tailwind 插件顺序**
   - `prettier-plugin-tailwindcss` 必须最后加载
   - 在插件数组中放在其他插件之后

4. **大型项目**
   - 使用 `.prettierignore` 排除文件
   - 分批次格式化
   - 使用缓存加速

5. **IDE 兼容性**
   - 确保所有开发者使用相同配置
   - 使用 `.editorconfig` 作为备用
   - 文档化团队约定

## 相关资源

- [Prettier 官方文档](https://prettier.io/)
- [Prettier 选项](https://prettier.io/docs/en/options.html)
- [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)
- [prettier-plugin-organize-imports](https://github.com/simonhaenisch/prettier-plugin-organize-imports)
- [EditorConfig](https://editorconfig.org/)
