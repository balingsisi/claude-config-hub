# Playwright E2E Testing Template

## 技术栈

### 核心框架
- **Playwright** - 现代化 E2E 测试框架
- **@playwright/test** - 官方测试运行器
- **TypeScript** - 类型安全

### 浏览器支持
- **Chromium** - Chrome, Edge
- **Firefox** - Firefox
- **WebKit** - Safari

### 工具链
- **Playwright Inspector** - 调试工具
- **Trace Viewer** - 测试追踪分析
- **Codegen** - 自动生成测试代码
- **Playwright DevTools** - 浏览器扩展

### 集成工具
- **Allure Reporter** - 测试报告
- **Playwright Test for VSCode** - IDE 集成
- **GitHub Actions** - CI/CD 集成
- **Docker** - 容器化测试环境

## 项目结构

```
playwright-e2e/
├── tests/                    # 测试文件
│   ├── e2e/                 # E2E 测试
│   │   ├── auth.spec.ts
│   │   ├── dashboard.spec.ts
│   │   └── checkout.spec.ts
│   ├── api/                 # API 测试
│   │   ├── users.spec.ts
│   │   └── products.spec.ts
│   ├── visual/              # 视觉回归测试
│   │   ├── homepage.spec.ts
│   │   └── components.spec.ts
│   └── accessibility/       # 无障碍测试
│       └── a11y.spec.ts
├── pages/                   # Page Object Model
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   └── CheckoutPage.ts
├── fixtures/                # 自定义 Fixtures
│   ├── testFixtures.ts
│   └── apiFixtures.ts
├── test-data/              # 测试数据
│   ├── users.json
│   ├── products.json
│   └── test-helpers.ts
├── utils/                  # 工具函数
│   ├── api-client.ts
│   ├── db-helper.ts
│   └── test-helpers.ts
├── config/                 # 配置文件
│   ├── base.config.ts
│   ├── dev.config.ts
│   └── prod.config.ts
├── mocks/                  # Mock 数据
│   ├── api-mocks.ts
│   └── service-worker.ts
├── scripts/                # 脚本
│   ├── setup.sh
│   └── teardown.sh
├── playwright.config.ts    # Playwright 配置
├── package.json
├── tsconfig.json
└── .env                    # 环境变量
```

## 代码模式

### Playwright 配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['allure-playwright'],
    ['github'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### Page Object Model

```typescript
// pages/BasePage.ts
import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  async getElementByText(text: string): Promise<Locator> {
    return this.page.getByText(text);
  }

  async clickElement(locator: Locator) {
    await locator.click();
    await this.page.waitForLoadState('networkidle');
  }
}
```

```typescript
// pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password-link"]');
  }

  async goto() {
    await this.navigate('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toHaveText(message);
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }
}
```

### 基础测试用例

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await loginPage.login('user@example.com', 'password123');
    
    // 验证跳转到仪表盘
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await loginPage.login('invalid@example.com', 'wrongpassword');
    
    await loginPage.expectErrorMessage('Invalid email or password');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should validate email format', async ({ page }) => {
    await loginPage.login('invalid-email', 'password123');
    
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toHaveText('Invalid email format');
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await loginPage.clickForgotPassword();
    
    await expect(page).toHaveURL(/.*forgot-password/);
  });
});
```

### 使用 Fixtures

```typescript
// fixtures/testFixtures.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ApiClient } from '../utils/api-client';

type MyFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  apiClient: ApiClient;
  authenticatedPage: void;
};

export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  apiClient: async ({ request }, use) => {
    const apiClient = new ApiClient(request);
    await use(apiClient);
  },

  authenticatedPage: async ({ page, loginPage }, use) => {
    // 自动登录
    await loginPage.goto();
    await loginPage.login('user@example.com', 'password123');
    await use();
  },
});

export { expect } from '@playwright/test';
```

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '../../fixtures/testFixtures';

test.describe('Dashboard', () => {
  test('should display user stats', async ({ page, authenticatedPage }) => {
    await page.goto('/dashboard');
    
    await expect(page.locator('[data-testid="stats-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-orders"]')).toContainText(/\d+/);
  });

  test('should create new order', async ({ page, authenticatedPage, dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.clickNewOrder();
    
    // 填写订单表单
    await page.fill('[data-testid="order-title"]', 'Test Order');
    await page.click('[data-testid="submit-order"]');
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});
```

### API 测试

```typescript
// tests/api/users.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Users API', () => {
  const baseUrl = process.env.API_URL || 'http://localhost:3001/api';

  test('should get all users', async ({ request }) => {
    const response = await request.get(`${baseUrl}/users`);
    
    expect(response.ok()).toBeTruthy();
    
    const users = await response.json();
    expect(Array.isArray(users)).toBeTruthy();
    expect(users.length).toBeGreaterThan(0);
  });

  test('should create a new user', async ({ request }) => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
    };

    const response = await request.post(`${baseUrl}/users`, {
      data: userData,
    });

    expect(response.status()).toBe(201);
    
    const user = await response.json();
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
  });

  test('should update user', async ({ request }) => {
    const userId = 1;
    const updateData = {
      name: 'Updated Name',
    };

    const response = await request.put(`${baseUrl}/users/${userId}`, {
      data: updateData,
    });

    expect(response.ok()).toBeTruthy();
    
    const user = await response.json();
    expect(user.name).toBe(updateData.name);
  });

  test('should delete user', async ({ request }) => {
    const userId = 999;
    
    const response = await request.delete(`${baseUrl}/users/${userId}`);
    
    expect(response.status()).toBe(204);
  });

  test('should handle authentication', async ({ request }) => {
    const response = await request.get(`${baseUrl}/protected`, {
      headers: {
        Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      },
    });

    expect(response.ok()).toBeTruthy();
  });
});
```

### 视觉回归测试

```typescript
// tests/visual/homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('homepage should match snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 全屏截图对比
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('header component should match snapshot', async ({ page }) => {
    await page.goto('/');
    
    const header = page.locator('header');
    await expect(header).toHaveScreenshot('header.png', {
      maxDiffPixels: 50,
    });
  });

  test('login form should match snapshot', async ({ page }) => {
    await page.goto('/login');
    
    const form = page.locator('[data-testid="login-form"]');
    await expect(form).toHaveScreenshot('login-form.png');
  });

  test('responsive design - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
    });
  });

  test('responsive design - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
    });
  });
});
```

### 无障碍测试

```typescript
// tests/accessibility/a11y.spec.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await injectAxe(page);
  });

  test('homepage should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('login page should be accessible', async ({ page }) => {
    await page.goto('/login');
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true },
        'label': { enabled: true },
      },
    });
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    const h1 = await page.locator('h1').count();
    expect(h1).toBe(1); // 只有一个 h1
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab 键导航
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // 验证焦点顺序
    const focusableElements = await page.locator(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).all();
    
    expect(focusableElements.length).toBeGreaterThan(0);
  });
});
```

## 最佳实践

### 1. 测试隔离

```typescript
// ✅ 使用独立测试数据
test('should create order', async ({ page, request }) => {
  // 创建测试用户
  const user = await request.post('/api/test/users', {
    data: { email: 'test@example.com' },
  });
  const { id: userId } = await user.json();

  // 执行测试
  await page.goto('/orders');
  await page.fill('[data-testid="user-id"]', userId);
  await page.click('[data-testid="create-order"]');

  // 清理测试数据
  await request.delete(`/api/test/users/${userId}`);
});
```

### 2. 等待策略

```typescript
// ✅ 使用智能等待
await page.click('button');
await page.waitForLoadState('networkidle'); // 等待网络请求完成

// ✅ 等待特定元素
await expect(page.locator('.success-message')).toBeVisible({ timeout: 5000 });

// ✅ 等待 URL 变化
await expect(page).toHaveURL(/.*dashboard/);

// ✅ 等待请求完成
await page.waitForResponse(response => 
  response.url().includes('/api/orders') && response.status() === 200
);
```

### 3. 选择器策略

```typescript
// ✅ 优先使用 data-testid
await page.locator('[data-testid="submit-button"]').click();

// ✅ 使用文本内容
await page.getByText('Submit').click();

// ✅ 使用角色
await page.getByRole('button', { name: 'Submit' }).click();

// ✅ 使用标签
await page.getByLabel('Email').fill('user@example.com');

// ❌ 避免使用脆弱的选择器
await page.locator('div > div:nth-child(3) > button').click(); // 不推荐
```

### 4. Mock 和拦截

```typescript
// Mock API 响应
test('should handle API error', async ({ page }) => {
  await page.route('**/api/users', route => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  });

  await page.goto('/users');
  await expect(page.locator('.error-message')).toHaveText('Failed to load users');
});

// 修改请求
test('should modify request headers', async ({ page }) => {
  await page.route('**/api/**', route => {
    const headers = {
      ...route.request().headers(),
      'X-Custom-Header': 'test-value',
    };
    route.continue({ headers });
  });

  await page.goto('/');
});

// 拦截请求
test('should block analytics', async ({ page }) => {
  await page.route('**/analytics.js', route => route.abort());
  await page.goto('/');
});
```

### 5. 测试数据管理

```typescript
// test-data/users.json
[
  {
    "id": 1,
    "email": "user1@example.com",
    "password": "password123",
    "role": "user"
  },
  {
    "id": 2,
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin"
  }
]
```

```typescript
// utils/test-helpers.ts
import { testUsers } from '../test-data/users.json';

export function getTestUser(role: string = 'user') {
  return testUsers.find(user => user.role === role);
}

export async function setupTestData(request: APIRequestContext) {
  for (const user of testUsers) {
    await request.post('/api/test/users', { data: user });
  }
}

export async function cleanupTestData(request: APIRequestContext) {
  await request.delete('/api/test/cleanup');
}
```

### 6. 并行执行

```typescript
// playwright.config.ts
export default defineConfig({
  // 完全并行执行
  fullyParallel: true,
  
  // 工作进程数量
  workers: process.env.CI ? 2 : 4,
  
  // 分片测试
  // CI 中运行: npx playwright test --shard=1/3
  // npx playwright test --shard=2/3
  // npx playwright test --shard=3/3
});
```

### 7. 错误处理

```typescript
// 自定义错误处理
test('should handle network error gracefully', async ({ page }) => {
  try {
    await page.goto('/slow-page', { timeout: 5000 });
  } catch (error) {
    // 处理超时
    await page.screenshot({ path: 'error-screenshot.png' });
    throw error;
  }
});

// 重试逻辑
test('flaky test with retry', async ({ page }) => {
  test.slow(); // 给予更多时间
  
  let retries = 0;
  while (retries < 3) {
    try {
      await page.goto('/');
      await expect(page.locator('.data')).toBeVisible();
      break;
    } catch (error) {
      retries++;
      if (retries === 3) throw error;
      await page.waitForTimeout(1000);
    }
  }
});
```

## 常用命令

### 开发命令

```bash
# 安装依赖
npm install

# 安装浏览器
npx playwright install

# 安装特定浏览器
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit

# 运行所有测试
npx playwright test

# 运行特定文件
npx playwright test tests/e2e/auth.spec.ts

# 运行特定测试
npx playwright test -g "should login"

# 运行特定浏览器
npx playwright test --project=chromium

# UI 模式
npx playwright test --ui

# 调试模式
npx playwright test --debug

# 查看测试报告
npx playwright show-report

# 生成测试代码
npx playwright codegen http://localhost:3000

# 追踪查看器
npx playwright show-trace trace.zip
```

### 测试管理

```bash
# 并行执行
npx playwright test --workers=4

# 串行执行
npx playwright test --workers=1

# 失败重试
npx playwright test --retries=2

# 仅运行失败的测试
npx playwright test --last-failed

# 更新快照
npx playwright test --update-snapshots

# 查看浏览器
npx playwright test --headed
```

### 报告和分析

```bash
# 生成 HTML 报告
npx playwright test --reporter=html

# 生成 Allure 报告
npx playwright test --reporter=allure-playwright
allure serve allure-results

# 列表报告
npx playwright test --reporter=list

# Dot 报告
npx playwright test --reporter=dot

# JSON 报告
npx playwright test --reporter=json
```

### 调试工具

```bash
# 打开 Playwright Inspector
npx playwright test --debug

# 逐步执行
npx playwright test --debug --headed

# 查看追踪
npx playwright show-trace trace.zip

# Codegen 工具
npx playwright codegen https://example.com

# 保存 Codegen 结果
npx playwright codegen --output=test.spec.ts https://example.com
```

## 部署配置

### 1. GitHub Actions CI

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
        shard: [1/4, 2/4, 3/4, 4/4]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run Playwright tests
        run: npx playwright test --project=${{ matrix.browser }} --shard=${{ matrix.shard }}
        env:
          CI: true
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report-${{ matrix.browser }}-${{ strategy.job-index }}
          path: playwright-report/
          retention-days: 30
      
      - name: Upload trace
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: trace-${{ matrix.browser }}-${{ strategy.job-index }}
          path: test-results/
```

### 2. Docker 测试环境

```dockerfile
# Dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx playwright install

CMD ["npx", "playwright", "test"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  playwright:
    build: .
    volumes:
      - ./test-results:/app/test-results
      - ./playwright-report:/app/playwright-report
    environment:
      - BASE_URL=http://web:3000
    depends_on:
      - web
  
  web:
    image: my-app:latest
    ports:
      - "3000:3000"
```

### 3. GitLab CI

```yaml
# .gitlab-ci.yml
image: mcr.microsoft.com/playwright:v1.40.0-jammy

stages:
  - test

playwright-tests:
  stage: test
  script:
    - npm ci
    - npx playwright install
    - npx playwright test
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
    expire_in: 30 days
  only:
    - merge_requests
    - main
```

### 4. Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
  agent any
  
  stages {
    stage('Install') {
      steps {
        sh 'npm ci'
        sh 'npx playwright install --with-deps'
      }
    }
    
    stage('Test') {
      parallel {
        stage('Chromium') {
          steps {
            sh 'npx playwright test --project=chromium'
          }
        }
        stage('Firefox') {
          steps {
            sh 'npx playwright test --project=firefox'
          }
        }
        stage('WebKit') {
          steps {
            sh 'npx playwright test --project=webkit'
          }
        }
      }
    }
    
    stage('Report') {
      steps {
        publishHTML([
          allowMissing: false,
          alwaysLinkToLastBuild: true,
          keepAll: true,
          reportDir: 'playwright-report',
          reportFiles: 'index.html',
          reportName: 'Playwright Report'
        ])
      }
    }
  }
  
  post {
    always {
      archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
    }
  }
}
```

### 5. Azure DevOps

```yaml
# azure-pipelines.yml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

strategy:
  matrix:
    chromium:
      browser: chromium
    firefox:
      browser: firefox
    webkit:
      browser: webkit

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '18.x'
    displayName: 'Install Node.js'

  - script: npm ci
    displayName: 'Install dependencies'

  - script: npx playwright install --with-deps $(browser)
    displayName: 'Install Playwright browsers'

  - script: npx playwright test --project=$(browser)
    displayName: 'Run Playwright tests'

  - task: PublishTestResults@2
    condition: succeededOrFailed()
    inputs:
      testResultsFormat: 'JUnit'
      testResultsFiles: 'test-results/junit.xml'

  - task: PublishBuildArtifacts@1
    condition: succeededOrFailed()
    inputs:
      pathToPublish: 'playwright-report'
      artifactName: 'Playwright Report'
```

### 6. CircleCI

```yaml
# .circleci/config.yml
version: 2.1

orbs:
  browser-tools: circleci/browser-tools@1.4.0

workflows:
  test:
    jobs:
      - playwright-test:
          matrix:
            parameters:
              browser: [chromium, firefox, webkit]

jobs:
  playwright-test:
    parameters:
      browser:
        type: string
    docker:
      - image: mcr.microsoft.com/playwright:v1.40.0-jammy
    steps:
      - checkout
      - restore_cache:
          keys:
            - v1-dependencies-{{ checksum "package.json" }}
      - run: npm ci
      - save_cache:
          key: v1-dependencies-{{ checksum "package.json" }}
          paths:
            - node_modules
      - run: npx playwright install << parameters.browser >>
      - run: npx playwright test --project=<< parameters.browser >>
      - store_artifacts:
          path: playwright-report
          destination: playwright-report
      - store_test_results:
          path: test-results
```

## 高级特性

### 1. 测试标签

```typescript
// 使用标签组织测试
test('critical test @smoke @critical', async ({ page }) => {
  // 测试代码
});

test('slow test @slow', async ({ page }) => {
  // 测试代码
});

// 运行特定标签的测试
// npx playwright test --grep @smoke
// npx playwright test --grep-invert @slow
```

### 2. 测试注释

```typescript
test.describe('Feature A', () => {
  test.skip('skip this test', async ({ page }) => {
    // 跳过的测试
  });

  test.only('only run this test', async ({ page }) => {
    // 仅运行此测试
  });

  test.fixme('need to fix this test', async ({ page }) => {
    // 需要修复的测试
  });

  test.slow('this is a slow test', async ({ page }) => {
    // 慢速测试，超时时间翻倍
  });
});
```

### 3. 参数化测试

```typescript
const users = [
  { role: 'admin', expectedAccess: 'full' },
  { role: 'user', expectedAccess: 'limited' },
  { role: 'guest', expectedAccess: 'none' },
];

for (const { role, expectedAccess } of users) {
  test(`should grant ${expectedAccess} access to ${role}`, async ({ page }) => {
    await page.goto('/login');
    await loginAs(page, role);
    await expect(page.locator('.access-level')).toHaveText(expectedAccess);
  });
}
```

### 4. 网络追踪

```typescript
test('should track network requests', async ({ page }) => {
  await page.route('**/*', route => {
    console.log(route.request().url());
    route.continue();
  });

  await page.goto('/');
  
  // 分析网络请求
  const requests = [];
  page.on('request', request => requests.push(request));
  
  await page.click('button');
  
  const apiRequests = requests.filter(r => r.url().includes('/api/'));
  expect(apiRequests.length).toBeGreaterThan(0);
});
```

## 总结

Playwright 是一个功能强大的现代化 E2E 测试框架，特别适合：
- **跨浏览器测试** - 支持 Chromium、Firefox、WebKit
- **现代 Web 应用** - 完美支持 React、Vue、Angular 等
- **API 测试** - 内置 API 测试能力
- **视觉回归** - 快照对比功能
- **无障碍测试** - 可集成 axe-core

关键优势：
✅ 跨浏览器支持（Chromium、Firefox、WebKit）
✅ 自动等待机制
✅ 强大的调试工具
✅ 并行执行能力
✅ 内置 API 测试
✅ 视觉回归测试
✅ 丰富的生态系统

适用场景：
- E2E 测试
- API 测试
- 视觉回归测试
- 无障碍测试
- 性能测试
- 跨浏览器兼容性测试
- 移动端 Web 测试
