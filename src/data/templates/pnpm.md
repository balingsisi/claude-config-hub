# pnpm - 高效的JavaScript包管理器

## 技术栈

- **核心**: pnpm 9.x
- **包管理**: 内容寻址存储
- **Node版本**: 18+ / 20+
- **Monorepo**: 内置workspace支持
- **兼容性**: npm生态完全兼容

## 项目结构

```
my-project/
├── node_modules/          # 非扁平化的依赖结构
│   └── .pnpm/            # 内容寻址存储
├── package.json          # 项目配置
├── pnpm-lock.yaml        # 锁定文件
├── pnpm-workspace.yaml   # workspace配置（monorepo）
├── .npmrc                # pnpm配置
└── packages/             # monorepo包（可选）
    ├── core/
    ├── ui/
    └── utils/
```

## 代码模式

### 1. package.json配置

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest",
    "lint": "eslint src"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.4.0"
  },
  "engines": {
    "node": ">=18",
    "pnpm": ">=9.0.0"
  }
}
```

### 2. Monorepo配置 (pnpm-workspace.yaml)

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - '!**/test/**'
```

```json
// packages/core/package.json
{
  "name": "@myorg/core",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --watch"
  }
}
```

### 3. pnpm配置 (.npmrc)

```ini
# .npmrc
# 严格的依赖管理
strict-peer-dependencies=true
auto-install-peers=true

# hoist配置
shamefully-hoist=true
node-linker=hoisted

# 存储位置
store-dir=~/.pnpm-store

# 私有包
@myorg:registry=http://npm.example.com
//npm.example.com/:_authToken=${NPM_TOKEN}

# 缓存
prefer-frozen-lockfile=true
```

### 4. 依赖管理

```json
// package.json中的workspace协议
{
  "dependencies": {
    "@myorg/core": "workspace:*",
    "@myorg/utils": "workspace:^"
  },
  "devDependencies": {
    "@myorg/testing": "workspace:~"
  }
}
```

## 最佳实践

### 1. 依赖管理

- ✅ 使用 `pnpm-lock.yaml` 锁定版本
- ✅ 启用严格的peer依赖检查
- ✅ 使用workspace协议管理内部依赖
- ✅ 定期更新依赖：`pnpm update --interactive`
- ✅ 检查过期依赖：`pnpm outdated`

```bash
# 添加依赖
pnpm add react
pnpm add -D typescript

# 添加到特定workspace
pnpm add lodash --filter @myorg/core

# 更新依赖
pnpm update react
pnpm update --latest

# 清理未使用的依赖
pnpm prune
```

### 2. Monorepo管理

- ✅ 使用workspace特性管理多包
- ✅ 统一版本管理（Changesets）
- ✅ 共享开发依赖
- ✅ 使用filter定向操作包

```bash
# 在特定包中运行命令
pnpm --filter @myorg/core build
pnpm --filter "./packages/**" test

# 运行所有包的命令
pnpm -r build
pnpm -r --parallel dev

# 依赖图可视化
pnpm list --depth=0 --json | pnpm-dep-tree
```

### 3. 性能优化

```ini
# .npmrc优化
# 使用硬链接节省磁盘空间
package-import-method=hardlink

# 并发安装
network-concurrency=16

# 使用缓存
prefer-frozen-lockfile=true
```

### 4. CI/CD集成

```yaml
# GitHub Actions
- name: Setup pnpm
  uses: pnpm/action-setup@v3
  with:
    version: 9

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'pnpm'

- name: Install dependencies
  run: pnpm install --frozen-lockfile

- name: Build
  run: pnpm -r build
```

## 常用命令

### 安装与初始化

```bash
# 安装pnpm
npm install -g pnpm

# 初始化项目
pnpm init

# 安装所有依赖
pnpm install

# 冻结锁定文件安装（CI）
pnpm install --frozen-lockfile
```

### 依赖管理

```bash
# 添加依赖
pnpm add react
pnpm add -D typescript
pnpm add -g prettier

# 添加到特定workspace
pnpm add lodash --filter @myorg/core

# 移除依赖
pnpm remove react
pnpm remove -D typescript

# 查看依赖树
pnpm list
pnpm list --depth=2
pnpm list --json
```

### 运行脚本

```bash
# 运行package.json脚本
pnpm dev
pnpm build

# 递归运行（monorepo）
pnpm -r build
pnpm -r --parallel test
```

### 其他命令

```bash
# 更新pnpm自身
pnpm add -g pnpm

# 检查过期依赖
pnpm outdated

# 审计安全漏洞
pnpm audit

# 清理缓存
pnpm store prune

# 查看存储状态
pnpm store status
```

## 部署配置

### 1. Docker部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

# 安装pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./
COPY packages ./packages

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
EXPOSE 3000
CMD ["pnpm", "start"]
```

### 2. Monorepo发布

```json
// package.json
{
  "scripts": {
    "changeset": "changeset",
    "version": "changeset version",
    "release": "pnpm build && changeset publish"
  }
}
```

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install --frozen-lockfile
      - run: pnpm -r build
      - run: pnpm changeset publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 3. 私有仓库配置

```ini
# .npmrc
@mycompany:registry=https://npm.mycompany.com
//npm.mycompany.com/:_authToken=${NPM_TOKEN}

# 或使用.npmrc在CI中
echo "//npm.mycompany.com/:_authToken=${{ secrets.NPM_TOKEN }}" > .npmrc
```

### 4. 缓存优化

```yaml
# GitHub Actions缓存
- name: Cache pnpm
  uses: actions/cache@v4
  with:
    path: |
      ~/.pnpm-store
      node_modules
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-
```

## 关键特性

- 🚀 **高效存储**: 内容寻址，节省磁盘空间
- ⚡ **快速安装**: 硬链接和并发下载
- 🔒 **严格依赖**: 避免幽灵依赖
- 📦 **Monorepo**: 内置workspace支持
- 🛡️ **确定性**: 生成可重现的node_modules
- 🔄 **兼容性**: 支持npm生态
