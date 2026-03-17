# Husky Git Hooks Template

## 技术栈

- **核心**: Husky ^9.x
- **Linting**: lint-staged
- **提交规范**: Commitlint + Conventional Commits
- **验证**: ESLint / Prettier / TypeScript

## 项目结构

```
husky-project/
├── .husky/
│   ├── pre-commit       # 提交前钩子
│   ├── commit-msg       # 提交信息验证
│   ├── pre-push         # 推送前检查
│   ├── post-merge       # 合并后处理
│   └── pre-rebase       # 变基前检查
├── .lintstagedrc        # lint-staged 配置
├── commitlint.config.js # 提交规范配置
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础配置

```bash
# 安装
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional

# 初始化 husky
npx husky init

# 创建钩子
echo "npx lint-staged" > .husky/pre-commit
echo "npx commitlint --edit \$1" > .husky/commit-msg
```

### Pre-commit 钩子

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 类型检查
npx tsc --noEmit

# 运行 lint-staged
npx lint-staged

# 运行测试（快速）
npm run test:related
```

```json
// .lintstagedrc
{
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,css,scss}": [
    "prettier --write"
  ],
  "*.{ts,tsx}": [
    "bash -c 'tsc --noEmit'"
  ]
}
```

### Commit Message 验证

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复 bug
        'docs',     // 文档更新
        'style',    // 代码格式
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试
        'build',    // 构建相关
        'ci',       // CI 配置
        'chore',    // 其他修改
        'revert',   // 回退
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
  },
};
```

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit "$1"
```

### Pre-push 钩子

```bash
# .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 获取当前分支
current_branch=$(git branch --show-current)

# 保护主分支
protected_branches="main master develop"

if echo "$protected_branches" | grep -q "$current_branch"; then
  echo "❌ Direct push to $current_branch is not allowed"
  echo "Please create a feature branch and submit a PR"
  exit 1
fi

# 运行完整测试
echo "Running tests before push..."
npm run test:coverage

# 检查测试覆盖率
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Push aborted."
  exit 1
fi

echo "✅ All checks passed. Pushing..."
```

### Post-merge 钩子

```bash
# .husky/post-merge
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "Checking for dependency updates..."

# 检查 package.json 是否有变化
changed_files=$(git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD)

if echo "$changed_files" | grep -q "package.json\|package-lock.json\|pnpm-lock.yaml"; then
  echo "📦 Dependencies changed, installing..."
  npm install
fi

if echo "$changed_files" | grep -q ".env.example"; then
  echo "⚠️  .env.example changed, check your .env file"
fi
```

### Pre-rebase 钩子

```bash
# .husky/pre-rebase
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 获取要变基的分支
onto_branch=${1:-main}
current_branch=$(git branch --show-current)

# 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
  echo "❌ You have uncommitted changes. Please commit or stash first."
  exit 1
fi

# 检查是否是受保护的分支
protected="main master"
if echo "$protected" | grep -q "$current_branch"; then
  echo "❌ Cannot rebase protected branch: $current_branch"
  exit 1
fi

echo "✅ Pre-rebase checks passed"
```

## 最佳实践

### 1. 性能优化

```json
// .lintstagedrc - 只检查相关文件
{
  "*.{ts,tsx}": [
    "eslint --cache --fix",
    "prettier --write"
  ],
  "*.{js,jsx}": [
    "eslint --cache --fix"
  ]
}
```

```bash
# .husky/pre-commit - 增量检查
#!/usr/bin/env sh

# 只运行与更改相关的测试
changed_files=$(git diff --cached --name-only --diff-filter=ACM)
test_files=$(echo "$changed_files" | grep -E '\.(test|spec)\.(ts|tsx)$' || true)
source_files=$(echo "$changed_files" | grep -E '\.(ts|tsx)$' | grep -v -E '\.(test|spec)\.' || true)

if [ -n "$test_files" ] || [ -n "$source_files" ]; then
  npm run test:related -- $test_files $source_files
fi
```

### 2. 条件执行

```bash
# .husky/pre-commit
#!/usr/bin/env sh

# 检查是否是 CI 环境
if [ "$CI" = "true" ]; then
  echo "Running in CI, skipping husky hooks"
  exit 0
fi

# 检查是否跳过钩子
if [ "$SKIP_PRE_COMMIT" = "1" ]; then
  echo "Skipping pre-commit hooks"
  exit 0
fi

# 正常执行钩子
npx lint-staged
```

### 3. 错误处理与回退

```bash
# .husky/pre-commit
#!/usr/bin/env sh
set -e

echo "🔍 Running pre-commit checks..."

# 备份当前状态
git stash push -m "pre-commit-backup" --keep-index 2>/dev/null || true

# 恢复函数
cleanup() {
  git stash pop 2>/dev/null || true
}
trap cleanup EXIT

# 运行检查
npx lint-staged

if [ $? -ne 0 ]; then
  echo "❌ Pre-commit checks failed"
  echo "Please fix the issues and try again"
  exit 1
fi

echo "✅ Pre-commit checks passed"
```

### 4. 多项目管理

```javascript
// package.json (monorepo root)
{
  "scripts": {
    "prepare": "husky install",
    "lint-staged": "lint-staged"
  },
  "lint-staged": {
    "packages/*/{src,tests}/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit (monorepo)
#!/usr/bin/env sh

# 获取更改的包
changed_packages=$(npx lerna list --since --json 2>/dev/null || echo "[]")

# 为每个包运行检查
echo "$changed_packages" | jq -r '.[].name' | while read pkg; do
  echo "Checking $pkg..."
  npm run lint --workspace="$pkg"
  npm run test --workspace="$pkg"
done
```

### 5. 自定义验证脚本

```javascript
// scripts/validate-branch.js
const branch = process.argv[2];
const allowedPatterns = [
  /^(feat|fix|docs|refactor|test|chore)\/[a-z0-9-]+$/,
  /^(main|develop|staging)$/,
  /^release\/v\d+\.\d+\.\d+$/,
  /^hotfix\/[a-z0-9-]+$/,
];

const isValid = allowedPatterns.some((pattern) => pattern.test(branch));

if (!isValid) {
  console.error(`
❌ Invalid branch name: ${branch}

Branch name must follow these patterns:
- feat/description     (new feature)
- fix/description      (bug fix)
- docs/description     (documentation)
- refactor/description (refactoring)
- test/description     (testing)
- chore/description    (maintenance)
- main/develop/staging (protected branches)
- release/v1.2.3       (release branches)
- hotfix/description   (hotfix branches)
  `);
  process.exit(1);
}

console.log(`✅ Valid branch: ${branch}`);
```

```bash
# .husky/pre-push
#!/usr/bin/env sh

current_branch=$(git branch --show-current)
node scripts/validate-branch.js "$current_branch"
```

## 常用命令

```bash
# 安装依赖
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional

# 初始化 husky
npx husky init

# 手动运行钩子
npx husky run pre-commit

# 跳过钩子（紧急情况）
git commit --no-verify -m "emergency fix"
SKIP_PRE_COMMIT=1 git commit -m "skip lint"

# 调试钩子
HUSKY_DEBUG=1 git commit -m "test"

# 卸载
npm uninstall husky && rm -rf .husky
```

## 部署配置

### CI/CD 集成

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:coverage
```

### Docker 构建

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# 复制 package.json
COPY package*.json ./

# 安装依赖（跳过 husky）
RUN npm ci --ignore-scripts

# 复制源代码
COPY . .

# 构建
RUN npm run build

# 启动
CMD ["npm", "start"]
```

### 环境变量

```bash
# .env.example
# 跳过 pre-commit 钩子
SKIP_PRE_COMMIT=0

# CI 环境（自动跳过钩子）
CI=false

# 调试模式
HUSKY_DEBUG=0
```

### npm scripts 配置

```json
{
  "scripts": {
    "prepare": "husky",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write .",
    "test": "vitest",
    "test:related": "vitest related",
    "test:coverage": "vitest --coverage",
    "typecheck": "tsc --noEmit",
    "validate": "npm run lint && npm run typecheck && npm run test"
  }
}
```
