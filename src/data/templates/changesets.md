# Changesets Monorepo 版本管理模板

## 技术栈

- **Changesets**: 版本管理与发布工具
- **Monorepo**: 多包仓库管理
- **pnpm/yarn/npm**: 包管理器
- **GitHub Actions**: CI/CD 自动化
- **TypeScript**: 类型支持

## 项目结构

```
monorepo/
├── .changeset/
│   ├── config.json          # Changesets 配置
│   ├── pre.json             # 预发布配置（可选）
│   └── *.md                 # 变更日志文件
├── packages/
│   ├── core/
│   │   ├── package.json
│   │   ├── src/
│   │   └── tsconfig.json
│   ├── utils/
│   │   ├── package.json
│   │   ├── src/
│   │   └── tsconfig.json
│   └── cli/
│       ├── package.json
│       ├── src/
│       └── tsconfig.json
├── package.json
├── pnpm-workspace.yaml      # pnpm workspace 配置
└── tsconfig.json            # 根配置
```

## 代码模式

### Changesets 配置

```json
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@2.3.1/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@my-org/docs"],
  "___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH": {
    "updateInternalDependencies": "always",
    "onlyUpdatePeerDependentsWhenOutOfRange": true
  }
}
```

### pnpm Workspace 配置

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - 'tools/*'
```

### 根 package.json

```json
// package.json
{
  "name": "monorepo-root",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "changeset": "changeset",
    "version": "changeset version",
    "release": "turbo run build && changeset publish",
    "release:canary": "changeset pre enter canary && changeset version && changeset publish && changeset pre exit"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "turbo": "^1.12.0",
    "typescript": "^5.3.0"
  },
  "packageManager": "pnpm@8.15.0"
}
```

### 创建 Changeset

```bash
# 创建变更记录
pnpm changeset

# 交互式选择：
# 1. 选择受影响的包
# 2. 选择版本类型（major/minor/patch）
# 3. 编写变更描述
```

```markdown
<!-- .changeset/cool-feature-2024.md -->
---
'@my-org/core': minor
'@my-org/utils': patch
---

Add new feature for handling complex data structures
```

### 版本升级

```bash
# 消费所有 changesets 并升级版本
pnpm version

# 这会：
# 1. 更新 package.json 版本号
# 2. 更新 CHANGELOG.md
# 3. 删除已处理的 .changeset/*.md 文件
```

### 自动化发布脚本

```typescript
// scripts/release.ts
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const ALLOWED_BRANCHES = ['main', 'next'];
const currentBranch = execSync('git rev-parse --abbrev-ref HEAD')
  .toString()
  .trim();

if (!ALLOWED_BRANCHES.includes(currentBranch)) {
  console.error(`❌ Release only allowed from: ${ALLOWED_BRANCHES.join(', ')}`);
  process.exit(1);
}

// 检查是否有未提交的更改
const status = execSync('git status --porcelain').toString();
if (status) {
  console.error('❌ Working directory is not clean');
  process.exit(1);
}

// 运行测试
console.log('🧪 Running tests...');
execSync('pnpm test', { stdio: 'inherit' });

// 构建
console.log('📦 Building packages...');
execSync('pnpm build', { stdio: 'inherit' });

// 发布
console.log('🚀 Publishing to npm...');
execSync('pnpm release', { stdio: 'inherit' });

console.log('✅ Release complete!');
```

### GitHub Actions 自动发布

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches:
      - main

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repo
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Create Release Pull Request or Publish to npm
        uses: changesets/action@v1
        with:
          publish: pnpm release
          version: pnpm version
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 预发布（Beta/Canary）

```bash
# 进入预发布模式
pnpm changeset pre enter beta

# 添加变更
pnpm changeset

# 升级版本（会生成 -beta.0 等后缀）
pnpm version

# 发布预发布版本
pnpm release

# 退出预发布模式
pnpm changeset pre exit
```

```json
// .changeset/pre.json
{
  "mode": "pre",
  "tag": "beta",
  "initialVersions": {
    "@my-org/core": "1.0.0",
    "@my-org/utils": "1.0.0"
  },
  "changesets": []
}
```

### 包间依赖管理

```json
// packages/core/package.json
{
  "name": "@my-org/core",
  "version": "1.0.0",
  "dependencies": {
    "@my-org/utils": "workspace:*"
  },
  "peerDependencies": {
    "typescript": "^5.0.0"
  }
}
```

```json
// packages/cli/package.json
{
  "name": "@my-org/cli",
  "version": "1.0.0",
  "dependencies": {
    "@my-org/core": "workspace:*",
    "@my-org/utils": "workspace:*"
  }
}
```

### 自定义 Changelog 生成器

```typescript
// .changeset/changelog-generator.ts
import { ChangelogFunctions } from '@changesets/types';

const changelogFunctions: ChangelogFunctions = {
  getDependencyReleaseLine: async (changesets, dependenciesUpdated) => {
    if (dependenciesUpdated.length === 0) return '';
    
    const updates = dependenciesUpdated
      .map(dep => `  - ${dep.name}@${dep.newVersion}`)
      .join('\n');
    
    return `\n**Updated dependencies:**\n${updates}`;
  },
  
  getReleaseLine: async (changeset, type) => {
    const [firstLine, ...futureLines] = changeset.summary
      .split('\n')
      .map(l => l.trimRight());
    
    return `- ${firstLine}\n${futureLines
      .map(l => `  ${l}`)
      .join('\n')}`;
  }
};

export default changelogFunctions;
```

```json
// .changeset/config.json
{
  "changelog": "./changelog-generator.ts"
}
```

## 最佳实践

### 1. 版本策略

```markdown
# 版本类型选择指南

- **major (1.0.0 → 2.0.0)**: 
  - 破坏性变更
  - API 不兼容的更改
  - 重大功能重构

- **minor (1.0.0 → 1.1.0)**:
  - 新增功能
  - 非破坏性的 API 扩展
  - 新增可选参数

- **patch (1.0.0 → 1.0.1)**:
  - Bug 修复
  - 文档更新
  - 内部优化
```

### 2. Changeset 命名规范

```bash
# 推荐的 changeset 文件命名
feature-add-dark-mode-2024.md
fix-memory-leak-utils.md
refactor-core-api.md
docs-readme-update.md
```

### 3. Monorepo 包组织

```typescript
// packages/core/src/index.ts
export { coreFunction } from './core';

// packages/utils/src/index.ts
export { helper } from './helper';

// packages/cli/src/index.ts
import { coreFunction } from '@my-org/core';
import { helper } from '@my-org/utils';

// 使用 workspace 协议确保使用本地版本
```

### 4. 依赖锁定

```json
// package.json
{
  "dependencies": {
    "@my-org/core": "workspace:*",  // 最新版本
    "@my-org/utils": "workspace:^"  // 兼容版本
  }
}
```

### 5. CI/CD 检查

```yaml
# .github/workflows/ci.yml
name: CI

on: [pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      
      - name: Check for missing changesets
        run: pnpm changeset status --since=origin/main
      
      - run: pnpm build
      - run: pnpm test
```

### 6. 自动版本更新 PR

```yaml
# 使用 Changesets GitHub Action 自动创建版本更新 PR
name: Version Packages

on:
  push:
    branches:
      - main

jobs:
  version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - uses: pnpm/action-setup@v2
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      
      - uses: changesets/action@v1
        with:
          version: pnpm version
          commit: 'chore: update versions'
          title: 'chore: update versions'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 常用命令

```bash
# 安装 Changesets
pnpm add -D @changesets/cli

# 初始化
pnpm changeset init

# 创建变更记录
pnpm changeset

# 查看状态
pnpm changeset status

# 查看自某个分支以来的变更
pnpm changeset status --since=origin/main

# 升级版本（不发布）
pnpm version

# 发布到 npm
pnpm release

# 进入预发布模式
pnpm changeset pre enter beta

# 退出预发布模式
pnpm changeset pre exit

# 添加空的 changeset（用于触发发布）
pnpm changeset --empty
```

## 部署配置

### .npmrc

```ini
# .npmrc
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

### TypeScript 配置

```json
// tsconfig.json (root)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/utils" },
    { "path": "./packages/cli" }
  ]
}
```

### Turbo 配置

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### CHANGELOG.md 示例

```markdown
# @my-org/core

## 1.2.0

### Minor Changes

- Add new feature for handling complex data structures

### Patch Changes

- Updated dependencies []:
  - @my-org/utils@1.1.0

## 1.1.0

### Minor Changes

- Add dark mode support

### Patch Changes

- Fix memory leak in utils
- Updated dependencies []:
  - @my-org/utils@1.0.1
```

## 资源

- [Changesets 官方文档](https://github.com/changesets/changesets)
- [Changesets GitHub Action](https://github.com/changesets/action)
- [pnpm Workspace](https://pnpm.io/workspaces)
- [Turborepo](https://turbo.build/)
