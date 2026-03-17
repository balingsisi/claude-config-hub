# Zx Google 脚本工具模板

## 技术栈

- **核心**: Google Zx 8.x
- **运行时**: Node.js 18+
- **包管理**: npm / yarn / pnpm
- **脚本语言**: JavaScript / TypeScript
- **额外工具**: fetch, chalk, fs-extra, globby

## 项目结构

```
zx-scripts/
├── scripts/                 # 脚本目录
│   ├── build.mjs           # 构建脚本
│   ├── deploy.mjs          # 部署脚本
│   ├── test.mjs            # 测试脚本
│   ├── db.mjs              # 数据库脚本
│   └── utils.mjs           # 工具脚本
├── lib/                    # 共享库
│   ├── logger.mjs          # 日志工具
│   ├── git.mjs             # Git 操作
│   └── api.mjs             # API 工具
├── config/                 # 配置文件
│   ├── dev.json
│   └── prod.json
├── package.json
└── .env
```

## 代码模式

### 基础脚本

```javascript
// scripts/hello.mjs
#!/usr/bin/env node

import { $, cd, chalk, fs, path } from 'zx';

// 示例：输出带颜色的文本
console.log(chalk.blue('Hello from Zx!'));
console.log(chalk.green.bold('Success!'));
console.log(chalk.red('Error!'));

// 执行命令
await $`echo "Hello World"`;

// 带变量的命令
const name = 'World';
await $`echo "Hello, ${name}!"`;

// 切换目录
cd('/tmp');

// 读取文件
const content = await fs.readFile('package.json', 'utf-8');
console.log(content);

// 写入文件
await fs.writeFile('output.txt', 'Hello World');

// 创建目录
await fs.ensureDir('dist');

// 复制文件
await fs.copy('src', 'dist');
```

### 构建脚本

```javascript
// scripts/build.mjs
#!/usr/bin/env node

import {
  $,
  cd,
  chalk,
  fs,
  path,
  globby,
  spinner,
} from 'zx';

// 配置
const BUILD_DIR = 'dist';
const SRC_DIR = 'src';

async function clean() {
  console.log(chalk.yellow('🧹 Cleaning build directory...'));
  await fs.remove(BUILD_DIR);
  await fs.ensureDir(BUILD_DIR);
}

async function compile() {
  console.log(chalk.blue('📦 Compiling TypeScript...'));

  await spinner('Compiling...', async () => {
    await $`tsc --project tsconfig.build.json`;
  });
}

async function copyAssets() {
  console.log(chalk.cyan('📁 Copying assets...'));

  const assets = await globby([`${SRC_DIR}/**/*.{json,html,css,png,jpg,svg}`]);

  for (const asset of assets) {
    const relativePath = path.relative(SRC_DIR, asset);
    const destPath = path.join(BUILD_DIR, relativePath);
    await fs.ensureDir(path.dirname(destPath));
    await fs.copy(asset, destPath);
  }

  console.log(chalk.green(`✓ Copied ${assets.length} assets`));
}

async function bundle() {
  console.log(chalk.magenta('📦 Bundling with esbuild...'));

  await $`esbuild ${SRC_DIR}/index.ts --bundle --platform=node --outfile=${BUILD_DIR}/bundle.js`;
}

async function optimize() {
  console.log(chalk.yellow('⚡ Optimizing...'));

  // 压缩 JS
  const jsFiles = await globby([`${BUILD_DIR}/**/*.js`]);

  for (const file of jsFiles) {
    await $`terser ${file} -o ${file} --compress --mangle`;
  }
}

async function generateManifest() {
  console.log(chalk.blue('📝 Generating manifest...'));

  const pkg = await fs.readJson('package.json');
  const manifest = {
    name: pkg.name,
    version: pkg.version,
    buildTime: new Date().toISOString(),
    files: await globby([`${BUILD_DIR}/**/*`]),
  };

  await fs.writeJson(`${BUILD_DIR}/manifest.json`, manifest, { spaces: 2 });
}

async function main() {
  const startTime = Date.now();

  try {
    await clean();
    await compile();
    await copyAssets();
    await bundle();
    await optimize();
    await generateManifest();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(chalk.green.bold(`\n✨ Build completed in ${duration}s`));
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Build failed:'));
    console.error(error);
    process.exit(1);
  }
}

main();
```

### 部署脚本

```javascript
// scripts/deploy.mjs
#!/usr/bin/env node

import {
  $,
  cd,
  chalk,
  fs,
  question,
  confirm,
  spinner,
} from 'zx';

// 环境配置
const ENV = process.env.DEPLOY_ENV || 'staging';
const CONFIG_FILE = `config/${ENV}.json`;

async function loadConfig() {
  console.log(chalk.blue(`📋 Loading ${ENV} config...`));

  const config = await fs.readJson(CONFIG_FILE);
  return config;
}

async function checkGitStatus() {
  console.log(chalk.yellow('🔍 Checking git status...'));

  const { stdout: status } = await $`git status --porcelain`;

  if (status.trim()) {
    console.log(chalk.red('❌ You have uncommitted changes:'));

    await $`git status --short`;

    const shouldContinue = await confirm(
      'Continue with uncommitted changes?'
    );

    if (!shouldContinue) {
      console.log(chalk.yellow('Deployment cancelled'));
      process.exit(0);
    }
  }
}

async function runTests() {
  console.log(chalk.cyan('🧪 Running tests...'));

  await spinner('Testing...', async () => {
    await $`npm test`;
  });

  console.log(chalk.green('✓ All tests passed'));
}

async function build() {
  console.log(chalk.magenta('📦 Building...'));

  await $`npm run build`;

  console.log(chalk.green('✓ Build completed'));
}

async function createTag() {
  const pkg = await fs.readJson('package.json');
  const version = pkg.version;
  const tagName = `v${version}`;

  console.log(chalk.blue(`🏷️  Creating tag ${tagName}...`));

  const { stdout: existingTag } = await $`git tag -l ${tagName}` || { stdout: '' };

  if (existingTag.trim()) {
    console.log(chalk.yellow(`Tag ${tagName} already exists`));

    const shouldOverwrite = await confirm('Overwrite existing tag?');

    if (shouldOverwrite) {
      await $`git tag -d ${tagName}`;
      await $`git push origin :refs/tags/${tagName}`;
    } else {
      return;
    }
  }

  await $`git tag -a ${tagName} -m "Release ${tagName}"`;
  await $`git push origin ${tagName}`;

  console.log(chalk.green(`✓ Tag ${tagName} created`));
}

async function deploy(config) {
  console.log(chalk.blue(`🚀 Deploying to ${ENV}...`));

  await spinner('Deploying...', async () => {
    // 上传文件到服务器
    await $`rsync -avz --delete dist/ ${config.server}:${config.deployPath}`;

    // 重启服务
    await $`ssh ${config.server} "cd ${config.deployPath} && pm2 restart all"`;
  });

  console.log(chalk.green(`✓ Deployed to ${ENV}`));
}

async function notify(config) {
  console.log(chalk.cyan('📢 Sending notification...'));

  const pkg = await fs.readJson('package.json');
  const message = `✅ ${pkg.name} v${pkg.version} deployed to ${ENV}`;

  // Slack 通知
  if (config.slackWebhook) {
    await fetch(config.slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
  }

  console.log(chalk.green('✓ Notification sent'));
}

async function main() {
  try {
    const config = await loadConfig();

    await checkGitStatus();
    await runTests();
    await build();

    if (ENV === 'production') {
      await createTag();
    }

    await deploy(config);
    await notify(config);

    console.log(chalk.green.bold('\n✨ Deployment completed successfully!'));
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Deployment failed:'));
    console.error(error);
    process.exit(1);
  }
}

main();
```

### Git 操作脚本

```javascript
// scripts/git.mjs
#!/usr/bin/env node

import {
  $,
  chalk,
  question,
  confirm,
  spinner,
} from 'zx';

async function getCurrentBranch() {
  const { stdout } = await $`git rev-parse --abbrev-ref HEAD`;
  return stdout.trim();
}

async function getChangedFiles() {
  const { stdout } = await $`git diff --name-only`;
  return stdout.trim().split('\n').filter(Boolean);
}

async function commit() {
  const changedFiles = await getChangedFiles();

  if (changedFiles.length === 0) {
    console.log(chalk.yellow('No changes to commit'));
    return;
  }

  console.log(chalk.blue('Changed files:'));
  changedFiles.forEach((file) => console.log(chalk.gray(`  ${file}`)));

  const message = await question('Commit message: ');

  if (!message) {
    console.log(chalk.red('Commit message is required'));
    return;
  }

  await $`git add .`;
  await $`git commit -m ${message}`;

  console.log(chalk.green('✓ Committed'));
}

async function createBranch() {
  const branchName = await question('Branch name: ');

  if (!branchName) {
    console.log(chalk.red('Branch name is required'));
    return;
  }

  await $`git checkout -b ${branchName}`;

  console.log(chalk.green(`✓ Created branch: ${branchName}`));
}

async function push() {
  const currentBranch = await getCurrentBranch();

  const shouldPush = await confirm(`Push to origin/${currentBranch}?`);

  if (shouldPush) {
    await $`git push -u origin ${currentBranch}`;
    console.log(chalk.green('✓ Pushed'));
  }
}

async function pull() {
  const currentBranch = await getCurrentBranch();

  await spinner('Pulling...', async () => {
    await $`git pull origin ${currentBranch}`;
  });

  console.log(chalk.green('✓ Pulled'));
}

async function status() {
  const currentBranch = await getCurrentBranch();

  console.log(chalk.blue(`Current branch: ${currentBranch}`));

  await $`git status`;
}

async function main() {
  const action = process.argv[2] || 'status';

  const actions = {
    commit,
    branch: createBranch,
    push,
    pull,
    status,
  };

  if (actions[action]) {
    await actions[action]();
  } else {
    console.log(chalk.red(`Unknown action: ${action}`));
    console.log(chalk.yellow('Available actions: commit, branch, push, pull, status'));
  }
}

main();
```

### 数据库操作脚本

```javascript
// scripts/db.mjs
#!/usr/bin/env node

import {
  $,
  chalk,
  fs,
  spinner,
} from 'zx';

// 数据库配置
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_NAME = process.env.DB_NAME || 'mydb';
const DB_USER = process.env.DB_USER || 'postgres';
const BACKUP_DIR = 'backups';

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${DB_NAME}-${timestamp}.sql`;
  const filepath = `${BACKUP_DIR}/${filename}`;

  await fs.ensureDir(BACKUP_DIR);

  console.log(chalk.blue(`📦 Backing up database to ${filepath}...`));

  await spinner('Backing up...', async () => {
    await $`pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} ${DB_NAME} > ${filepath}`;
  });

  console.log(chalk.green('✓ Backup completed'));
}

async function restore() {
  const backupFile = process.argv[3];

  if (!backupFile) {
    const files = await fs.readdir(BACKUP_DIR);
    console.log(chalk.yellow('Available backups:'));

    files.forEach((file) => console.log(chalk.gray(`  ${file}`)));

    return;
  }

  const filepath = `${BACKUP_DIR}/${backupFile}`;

  if (!(await fs.pathExists(filepath))) {
    console.log(chalk.red(`Backup file not found: ${filepath}`));
    return;
  }

  console.log(chalk.blue(`📥 Restoring database from ${filepath}...`));

  await spinner('Restoring...', async () => {
    await $`psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f ${filepath}`;
  });

  console.log(chalk.green('✓ Restore completed'));
}

async function migrate() {
  console.log(chalk.blue('🔄 Running migrations...'));

  await spinner('Migrating...', async () => {
    await $`npx prisma migrate deploy`;
  });

  console.log(chalk.green('✓ Migrations completed'));
}

async function seed() {
  console.log(chalk.blue('🌱 Seeding database...'));

  await spinner('Seeding...', async () => {
    await $`npx prisma db seed`;
  });

  console.log(chalk.green('✓ Seeding completed'));
}

async function reset() {
  console.log(chalk.yellow('⚠️  This will delete all data!'));

  await spinner('Resetting...', async () => {
    await $`npx prisma migrate reset --force`;
  });

  console.log(chalk.green('✓ Database reset'));
}

async function main() {
  const action = process.argv[2] || 'help';

  const actions = {
    backup,
    restore,
    migrate,
    seed,
    reset,
    help: () => {
      console.log(chalk.blue('Database management commands:'));
      console.log(chalk.gray('  backup  - Backup database'));
      console.log(chalk.gray('  restore - Restore database'));
      console.log(chalk.gray('  migrate - Run migrations'));
      console.log(chalk.gray('  seed    - Seed database'));
      console.log(chalk.gray('  reset   - Reset database'));
    },
  };

  if (actions[action]) {
    await actions[action]();
  } else {
    console.log(chalk.red(`Unknown action: ${action}`));
    await actions.help();
  }
}

main();
```

### API 测试脚本

```javascript
// scripts/api-test.mjs
#!/usr/bin/env node

import {
  $,
  chalk,
  spinner,
} from 'zx';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function request(method, path, data = null) {
  const url = `${BASE_URL}${path}`;

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  return {
    status: response.status,
    ok: response.ok,
    data: await response.json(),
  };
}

async function testHealth() {
  console.log(chalk.blue('🏥 Testing health endpoint...'));

  const response = await request('GET', '/health');

  if (response.ok) {
    console.log(chalk.green('✓ Health check passed'));
    console.log(chalk.gray(JSON.stringify(response.data, null, 2)));
  } else {
    console.log(chalk.red('✗ Health check failed'));
  }
}

async function testUsers() {
  console.log(chalk.blue('\n👥 Testing users endpoints...'));

  // 获取用户列表
  console.log(chalk.cyan('GET /api/users'));
  const listResponse = await request('GET', '/api/users');
  console.log(chalk.gray(`Status: ${listResponse.status}`));

  // 创建用户
  console.log(chalk.cyan('\nPOST /api/users'));
  const createResponse = await request('POST', '/api/users', {
    name: 'Test User',
    email: 'test@example.com',
  });
  console.log(chalk.gray(`Status: ${createResponse.status}`));

  if (createResponse.ok) {
    const userId = createResponse.data.id;

    // 获取单个用户
    console.log(chalk.cyan(`\nGET /api/users/${userId}`));
    const getResponse = await request('GET', `/api/users/${userId}`);
    console.log(chalk.gray(`Status: ${getResponse.status}`));

    // 更新用户
    console.log(chalk.cyan(`\nPATCH /api/users/${userId}`));
    const updateResponse = await request('PATCH', `/api/users/${userId}`, {
      name: 'Updated User',
    });
    console.log(chalk.gray(`Status: ${updateResponse.status}`));

    // 删除用户
    console.log(chalk.cyan(`\nDELETE /api/users/${userId}`));
    const deleteResponse = await request('DELETE', `/api/users/${userId}`);
    console.log(chalk.gray(`Status: ${deleteResponse.status}`));
  }
}

async function benchmark() {
  console.log(chalk.blue('\n⚡ Running benchmark...'));

  const iterations = 100;
  const startTime = Date.now();

  await spinner(`Running ${iterations} requests...`, async () => {
    for (let i = 0; i < iterations; i++) {
      await request('GET', '/api/users');
    }
  });

  const duration = Date.now() - startTime;
  const avgTime = (duration / iterations).toFixed(2);

  console.log(chalk.green(`\n✓ Completed ${iterations} requests`));
  console.log(chalk.gray(`Total time: ${duration}ms`));
  console.log(chalk.gray(`Average: ${avgTime}ms per request`));
}

async function main() {
  const action = process.argv[2] || 'all';

  console.log(chalk.bold.blue(`\n🧪 API Testing - ${BASE_URL}\n`));

  const actions = {
    health: testHealth,
    users: testUsers,
    benchmark,
    all: async () => {
      await testHealth();
      await testUsers();
      await benchmark();
    },
  };

  if (actions[action]) {
    await actions[action]();
    console.log(chalk.green.bold('\n✨ Tests completed!\n'));
  } else {
    console.log(chalk.red(`Unknown action: ${action}`));
    console.log(chalk.yellow('Available actions: health, users, benchmark, all'));
  }
}

main();
```

### 文件监控脚本

```javascript
// scripts/watch.mjs
#!/usr/bin/env node

import {
  $,
  chalk,
  watch,
  fs,
} from 'zx';

const SRC_DIR = 'src';
const BUILD_DIR = 'dist';

async function compile(file) {
  console.log(chalk.blue(`📝 Compiling ${file}...`));

  try {
    await $`esbuild ${file} --outfile=${BUILD_DIR}/${file.replace('src/', '')} --format=esm`;

    console.log(chalk.green(`✓ Compiled ${file}`));
  } catch (error) {
    console.error(chalk.red(`✗ Failed to compile ${file}`));
    console.error(error.stderr);
  }
}

async function copy(file) {
  console.log(chalk.cyan(`📁 Copying ${file}...`));

  const destPath = file.replace(SRC_DIR, BUILD_DIR);
  await fs.ensureDir(require('path').dirname(destPath));
  await fs.copy(file, destPath);

  console.log(chalk.green(`✓ Copied ${file}`));
}

async function main() {
  console.log(chalk.bold.blue('\n👀 Watching for changes...\n'));

  await fs.ensureDir(BUILD_DIR);

  // 初始构建
  const files = await globby([`${SRC_DIR}/**/*`]);

  for (const file of files) {
    if (file.endsWith('.ts') || file.endsWith('.js')) {
      await compile(file);
    } else {
      await copy(file);
    }
  }

  // 监控变化
  const watcher = watch(SRC_DIR);

  watcher.on('change', async (file) => {
    console.log(chalk.yellow(`\n🔄 Changed: ${file}`));

    if (file.endsWith('.ts') || file.endsWith('.js')) {
      await compile(file);
    } else {
      await copy(file);
    }
  });

  watcher.on('add', async (file) => {
    console.log(chalk.green(`\n➕ Added: ${file}`));

    if (file.endsWith('.ts') || file.endsWith('.js')) {
      await compile(file);
    } else {
      await copy(file);
    }
  });

  watcher.on('unlink', async (file) => {
    console.log(chalk.red(`\n➖ Removed: ${file}`));

    const destPath = file.replace(SRC_DIR, BUILD_DIR);
    await fs.remove(destPath);
  });
}

main();
```

## 最佳实践

### 1. 错误处理

```javascript
import { $, chalk } from 'zx';

// 全局错误处理
$.verbose = false;

process.on('uncaughtException', (error) => {
  console.error(chalk.red.bold('Uncaught Exception:'));
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red.bold('Unhandled Rejection:'));
  console.error(reason);
  process.exit(1);
});

// 命令错误处理
try {
  await $`some-command`;
} catch (error) {
  console.error(chalk.red('Command failed:'));
  console.error(error.stderr);
  process.exit(1);
}
```

### 2. 进度显示

```javascript
import { chalk, spinner, ProgressBar } from 'zx';

// Spinner
await spinner('Loading...', async () => {
  await someAsyncOperation();
});

// 进度条
const files = await getFiles();
const bar = new ProgressBar(':bar :current/:total', { total: files.length });

for (const file of files) {
  await processFile(file);
  bar.tick();
}
```

### 3. 配置管理

```javascript
// config.mjs
import { fs, chalk } from 'zx';

const ENV = process.env.NODE_ENV || 'development';

let config = null;

export async function loadConfig() {
  if (config) return config;

  try {
    config = await fs.readJson(`config/${ENV}.json`);
    return config;
  } catch (error) {
    console.error(chalk.red(`Failed to load config for ${ENV}`));
    throw error;
  }
}

export function getConfig() {
  if (!config) {
    throw new Error('Config not loaded. Call loadConfig() first.');
  }
  return config;
}
```

### 4. 日志系统

```javascript
// lib/logger.mjs
import { chalk } from 'zx';

class Logger {
  info(message) {
    console.log(chalk.blue('ℹ'), message);
  }

  success(message) {
    console.log(chalk.green('✓'), message);
  }

  warning(message) {
    console.log(chalk.yellow('⚠'), message);
  }

  error(message) {
    console.log(chalk.red('✗'), message);
  }

  debug(message) {
    if (process.env.DEBUG) {
      console.log(chalk.gray('🔍'), chalk.gray(message));
    }
  }
}

export const logger = new Logger();
```

## 常用命令

```bash
# 运行脚本
npx zx scripts/build.mjs

# 直接执行（需要 shebang）
./scripts/build.mjs

# 传递参数
npx zx scripts/deploy.mjs --env production

# 交互模式
npx zx

# 安装 zx
npm install -g zx
npm install -D zx

# 设置为可执行
chmod +x scripts/*.mjs

# 在 package.json 中添加脚本
{
  "scripts": {
    "build": "zx scripts/build.mjs",
    "deploy": "zx scripts/deploy.mjs",
    "db": "zx scripts/db.mjs"
  }
}
```

## 部署配置

### package.json 脚本

```json
{
  "name": "my-project",
  "scripts": {
    "build": "zx scripts/build.mjs",
    "dev": "zx scripts/dev.mjs",
    "test": "zx scripts/test.mjs",
    "deploy": "zx scripts/deploy.mjs",
    "db:backup": "zx scripts/db.mjs backup",
    "db:restore": "zx scripts/db.mjs restore",
    "git:commit": "zx scripts/git.mjs commit"
  },
  "devDependencies": {
    "zx": "^8.0.0",
    "fs-extra": "^11.0.0",
    "globby": "^14.0.0"
  }
}
```

### CI/CD 集成

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run build script
        run: npx zx scripts/build.mjs

      - name: Run tests
        run: npx zx scripts/test.mjs

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Deploy
        run: npx zx scripts/deploy.mjs
        env:
          DEPLOY_ENV: production
          DB_HOST: ${{ secrets.DB_HOST }}
          DB_USER: ${{ secrets.DB_USER }}
```

### Cron 任务

```bash
# 添加到 crontab
# 每天凌晨 2 点备份数据库
0 2 * * * cd /path/to/project && /usr/local/bin/npx zx scripts/db.mjs backup >> /var/log/backup.log 2>&1

# 每小时检查服务状态
0 * * * * cd /path/to/project && /usr/local/bin/npx zx scripts/health-check.mjs
```

## 参考资源

- [Zx 官方文档](https://google.github.io/zx/)
- [Zx GitHub](https://github.com/google/zx)
- [Zx Recipes](https://github.com/google/zx/blob/main/docs/recipes.md)
- [Node.js Child Process](https://nodejs.org/api/child_process.html)
- [Chalk 文档](https://github.com/chalk/chalk)
