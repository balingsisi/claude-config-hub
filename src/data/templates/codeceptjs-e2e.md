# CodeceptJS E2E 测试模板

## 技术栈

- **测试框架**: CodeceptJS 3.x
- **浏览器驱动**: Playwright / Puppeteer / WebDriver
- **断言库**: 内置 expect
- **页面对象模式**: 内置支持
- **报告器**: Mochawesome / Allure
- **Mock**: Polly.js / MockServer
- **数据管理**: Faker.js

## 项目结构

```
codeceptjs-e2e/
├── tests/                     # 测试文件
│   ├── e2e/                  # E2E 测试
│   │   ├── login_test.ts     # 登录测试
│   │   ├── checkout_test.ts  # 结账测试
│   │   └── user_test.ts      # 用户测试
│   ├── api/                  # API 测试
│   │   └── user_api_test.ts
│   └── mobile/               # 移动端测试
│       └── app_test.ts
├── pages/                    # 页面对象
│   ├── login.page.ts         # 登录页
│   ├── home.page.ts          # 首页
│   ├── checkout.page.ts      # 结账页
│   └── base.page.ts          # 基础页
├── fragments/                # 页面片段
│   ├── header.fragment.ts    # 头部组件
│   └── footer.fragment.ts    # 底部组件
├── data/                     # 测试数据
│   ├── fixtures/             # 固定数据
│   │   ├── users.json
│   │   └── products.json
│   ├── factories/            # 数据工厂
│   │   └── user.factory.ts
│   └── environments/         # 环境数据
│       ├── dev.json
│       └── staging.json
├── helpers/                  # 自定义助手
│   ├── custom.helper.ts
│   └── api.helper.ts
├── support/                  # 支持文件
│   ├── hooks.ts             # 全局钩子
│   ├── utils.ts             # 工具函数
│   └── constants.ts         # 常量
├── output/                   # 测试输出
│   ├── screenshots/         # 截图
│   ├── videos/              # 录屏
│   └── reports/             # 报告
├── codecept.conf.ts         # CodeceptJS 配置
├── .env                     # 环境变量
├── package.json
└── tsconfig.json
```

## 代码模式

### CodeceptJS 配置

```typescript
// codecept.conf.ts
import { setHeadlessWhen, setCommonPlugins } from '@codeceptjs/configure';

setHeadlessWhen(process.env.HEADLESS);
setCommonPlugins();

export const config: CodeceptJS.MainConfig = {
  tests: './tests/**/*.test.ts',
  output: './output',
  helpers: {
    Playwright: {
      browser: 'chromium',
      url: process.env.BASE_URL || 'http://localhost:3000',
      show: !process.env.HEADLESS,
      windowSize: '1920x1080',
      waitForTimeout: 10000,
      waitForAction: 500,
      restart: 'context',
      keepBrowserState: false,
      keepCookies: false,
      emulate: {
        viewport: {
          width: 1920,
          height: 1080,
        },
        locale: 'zh-CN',
        timezoneId: 'Asia/Shanghai',
      },
    },
    REST: {
      endpoint: process.env.API_URL || 'http://localhost:3000/api',
      onRequest: (request) => {
        request.headers = {
          ...request.headers,
          Authorization: `Bearer ${process.env.API_TOKEN}`,
        };
      },
    },
    CustomHelper: {
      require: './helpers/custom.helper.ts',
    },
  },
  include: {
    loginPage: './pages/login.page.ts',
    homePage: './pages/home.page.ts',
    checkoutPage: './pages/checkout.page.ts',
    headerFragment: './fragments/header.fragment.ts',
  },
  plugins: {
    autoDelay: {
      enabled: true,
    },
    retryFailedStep: {
      enabled: true,
      retries: 3,
    },
    tryTo: {
      enabled: true,
    },
    screenshotOnFail: {
      enabled: true,
      fullPageScreenshots: true,
    },
    stepByStepReport: {
      enabled: true,
      screenshotsForReport: true,
    },
    allure: {
      enabled: true,
      require: '@codeceptjs/allure-legacy',
    },
  },
  gherkin: {
    features: './features/**/*.feature',
    steps: ['./steps/steps.ts'],
  },
  multiple: {
    parallel: {
      chunks: 2,
      browsers: ['chromium', 'firefox'],
    },
    smoke: {
      grep: '@smoke',
      browsers: ['chromium'],
    },
  },
  name: 'CodeceptJS E2E Tests',
};

module.exports = config;

// helpers/custom.helper.ts
import { Helper } from 'codeceptjs';

class CustomHelper extends Helper {
  async waitAndClick(locator: string, timeout = 10000) {
    const { Playwright } = this.helpers;
    await Playwright.waitForElement(locator, timeout);
    await Playwright.click(locator);
  }

  async grabTextFromMultiple(locator: string): Promise<string[]> {
    const { Playwright } = this.helpers;
    const elements = await Playwright.locate(locator);
    const texts: string[] = [];

    for (const element of elements) {
      texts.push(await element.textContent());
    }

    return texts;
  }

  async mockApiResponse(url: string, response: any) {
    const { Playwright } = this.helpers;
    await Playwright.page.route(url, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  async clearLocalStorage() {
    const { Playwright } = this.helpers;
    await Playwright.page.evaluate(() => {
      localStorage.clear();
    });
  }

  async setCookie(name: string, value: string) {
    const { Playwright } = this.helpers;
    await Playwright.page.context().addCookies([
      {
        name,
        value,
        domain: new URL(process.env.BASE_URL || 'http://localhost:3000').hostname,
        path: '/',
      },
    ]);
  }

  async scrollToBottom() {
    const { Playwright } = this.helpers;
    await Playwright.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }
}

export = CustomHelper;
```

### 页面对象模式

```typescript
// pages/base.page.ts
import { I } from '../support/utils';

export class BasePage {
  protected url: string = '/';

  async open(path?: string) {
    await I.amOnPage(path || this.url);
  }

  async waitForPageLoad() {
    await I.waitForFunction(() => document.readyState === 'complete');
  }

  async refresh() {
    await I.refreshPage();
  }

  async goBack() {
    await I.goBack();
  }

  async getTitle(): Promise<string> {
    return await I.grabTitle();
  }

  async getCurrentUrl(): Promise<string> {
    return await I.grabCurrentUrl();
  }

  async takeScreenshot(name: string) {
    await I.saveScreenshot(`${name}.png`);
  }

  async acceptPopup() {
    await I.acceptPopup();
  }

  async cancelPopup() {
    await I.cancelPopup();
  }

  async seeInPopup(text: string) {
    await I.seeInPopup(text);
  }
}

// pages/login.page.ts
import { I } from '../support/utils';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  protected url = '/login';

  // 定位器
  private readonly selectors = {
    emailInput: '#email',
    passwordInput: '#password',
    loginButton: 'button[type="submit"]',
    forgotPasswordLink: 'a[href="/forgot-password"]',
    registerLink: 'a[href="/register"]',
    errorMessage: '.error-message',
    successMessage: '.success-message',
    socialLoginButtons: '.social-login button',
  };

  async login(email: string, password: string) {
    await I.fillField(this.selectors.emailInput, email);
    await I.fillField(this.selectors.passwordInput, password);
    await I.click(this.selectors.loginButton);
    await I.waitForInvisible(this.selectors.loginButton, 10);
  }

  async loginWithGoogle() {
    await I.click(`${this.selectors.socialLoginButtons}[data-provider="google"]`);
    await I.waitForURL('accounts.google.com', 10);
  }

  async clickForgotPassword() {
    await I.click(this.selectors.forgotPasswordLink);
    await I.seeInCurrentUrl('/forgot-password');
  }

  async clickRegister() {
    await I.click(this.selectors.registerLink);
    await I.seeInCurrentUrl('/register');
  }

  async seeErrorMessage(message: string) {
    await I.see(message, this.selectors.errorMessage);
  }

  async seeSuccessMessage(message: string) {
    await I.see(message, this.selectors.successMessage);
  }

  async verifyElementsPresent() {
    await I.seeElement(this.selectors.emailInput);
    await I.seeElement(this.selectors.passwordInput);
    await I.seeElement(this.selectors.loginButton);
  }

  async isLoginButtonDisabled(): Promise<boolean> {
    const disabled = await I.grabAttributeFrom(this.selectors.loginButton, 'disabled');
    return disabled === 'true';
  }
}

// pages/home.page.ts
import { I } from '../support/utils';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  protected url = '/';

  private readonly selectors = {
    heroSection: '.hero-section',
    featuredProducts: '.featured-products',
    productCard: '.product-card',
    addToCartButton: '.add-to-cart',
    cartIcon: '.cart-icon',
    searchInput: '#search',
    searchButton: '#search-button',
    categoryMenu: '.category-menu',
  };

  async searchProduct(query: string) {
    await I.fillField(this.selectors.searchInput, query);
    await I.click(this.selectors.searchButton);
    await I.waitForVisible('.search-results', 10);
  }

  async addProductToCart(productName: string) {
    await I.click(`${this.selectors.productCard}:has-text("${productName}") ${this.selectors.addToCartButton}`);
    await I.waitForVisible('.cart-notification', 5);
  }

  async goToCart() {
    await I.click(this.selectors.cartIcon);
    await I.seeInCurrentUrl('/cart');
  }

  async selectCategory(categoryName: string) {
    await I.click(`${this.selectors.categoryMenu} a:has-text("${categoryName}")`);
  }

  async getFeaturedProductsCount(): Promise<number> {
    const products = await I.grabNumberOfVisibleElements(
      `${this.selectors.featuredProducts} ${this.selectors.productCard}`
    );
    return products;
  }
}

// pages/checkout.page.ts
import { I } from '../support/utils';
import { BasePage } from './base.page';

export class CheckoutPage extends BasePage {
  protected url = '/checkout';

  private readonly selectors = {
    shippingForm: '#shipping-form',
    firstName: '#first-name',
    lastName: '#last-name',
    address: '#address',
    city: '#city',
    zipCode: '#zip-code',
    country: '#country',
    paymentMethod: '.payment-method',
    placeOrderButton: '#place-order',
    orderConfirmation: '.order-confirmation',
    orderNumber: '.order-number',
  };

  async fillShippingInfo(info: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
  }) {
    await I.fillField(this.selectors.firstName, info.firstName);
    await I.fillField(this.selectors.lastName, info.lastName);
    await I.fillField(this.selectors.address, info.address);
    await I.fillField(this.selectors.city, info.city);
    await I.fillField(this.selectors.zipCode, info.zipCode);
    await I.selectOption(this.selectors.country, info.country);
  }

  async selectPaymentMethod(method: 'credit-card' | 'paypal' | 'bank-transfer') {
    await I.click(`${this.selectors.paymentMethod}[data-method="${method}"]`);
  }

  async placeOrder() {
    await I.click(this.selectors.placeOrderButton);
    await I.waitForVisible(this.selectors.orderConfirmation, 30);
  }

  async getOrderNumber(): Promise<string> {
    return await I.grabTextFrom(this.selectors.orderNumber);
  }

  async verifyOrderSuccess() {
    await I.see('Order placed successfully', this.selectors.orderConfirmation);
    await I.seeElement(this.selectors.orderNumber);
  }
}
```

### E2E 测试示例

```typescript
// tests/e2e/login_test.ts
Feature('User Login');

Before(({ I }) => {
  I.amOnPage('/');
});

Scenario('User can login successfully', async ({ I, loginPage }) => {
  await loginPage.open();
  await loginPage.verifyElementsPresent();

  await loginPage.login('test@example.com', 'password123');

  I.see('Welcome back!');
  I.dontSeeInCurrentUrl('/login');
});

Scenario('User sees error with invalid credentials', async ({ I, loginPage }) => {
  await loginPage.open();
  await loginPage.login('invalid@example.com', 'wrongpassword');

  await loginPage.seeErrorMessage('Invalid email or password');
  I.seeInCurrentUrl('/login');
});

Scenario('User can navigate to forgot password', async ({ I, loginPage }) => {
  await loginPage.open();
  await loginPage.clickForgotPassword();

  I.seeInCurrentUrl('/forgot-password');
  I.see('Reset Password');
});

Scenario('User can login with Google', async ({ I, loginPage }) => {
  await loginPage.open();
  await loginPage.loginWithGoogle();

  I.seeInCurrentUrl('accounts.google.com');
});

Scenario('Login button is disabled with empty fields', async ({ I, loginPage }) => {
  await loginPage.open();

  const isDisabled = await loginPage.isLoginButtonDisabled();
  assert.isTrue(isDisabled, 'Login button should be disabled');
});

// tests/e2e/checkout_test.ts
Feature('Checkout Process');

Before(({ I }) => {
  I.amOnPage('/');
});

Scenario('User can complete checkout', async ({ I, homePage, checkoutPage }) => {
  // 添加商品到购物车
  await homePage.addProductToCart('Test Product');
  await homePage.goToCart();

  // 进入结账页面
  I.click('Proceed to Checkout');
  I.seeInCurrentUrl('/checkout');

  // 填写配送信息
  await checkoutPage.fillShippingInfo({
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Test Street',
    city: 'Test City',
    zipCode: '12345',
    country: 'US',
  });

  // 选择支付方式
  await checkoutPage.selectPaymentMethod('credit-card');

  // 提交订单
  await checkoutPage.placeOrder();

  // 验证订单成功
  await checkoutPage.verifyOrderSuccess();
  const orderNumber = await checkoutPage.getOrderNumber();
  assert.match(orderNumber, /^ORD-\d+$/, 'Order number should be valid');
});

Scenario('User can apply discount code', async ({ I, homePage }) => {
  await homePage.addProductToCart('Test Product');
  await homePage.goToCart();

  I.fillField('#discount-code', 'SAVE10');
  I.click('Apply');

  I.see('Discount applied');
  I.see('$10.00 off');
});

// tests/e2e/user_test.ts
Feature('User Profile');

Scenario('User can update profile', async ({ I }) => {
  // 登录
  I.login('test@example.com', 'password123');

  // 进入个人中心
  I.click('.user-avatar');
  I.click('Profile');

  // 更新信息
  I.fillField('#phone', '+1234567890');
  I.fillField('#bio', 'This is my bio');
  I.click('Save Changes');

  I.see('Profile updated successfully');
});

Scenario('User can change password', async ({ I }) => {
  I.login('test@example.com', 'password123');

  I.click('.user-avatar');
  I.click('Settings');
  I.click('Change Password');

  I.fillField('#current-password', 'password123');
  I.fillField('#new-password', 'newpassword123');
  I.fillField('#confirm-password', 'newpassword123');
  I.click('Update Password');

  I.see('Password changed successfully');
});
```

### API 测试

```typescript
// tests/api/user_api_test.ts
Feature('User API');

Scenario('Get user list', async ({ I }) => {
  const response = await I.sendGetRequest('/users');

  I.seeResponseCodeIs(200);
  I.seeResponseContainsKeys(['data', 'total']);
  I.seeResponseContainsJson({
    success: true,
  });

  const body = JSON.parse(response.data);
  assert.isArray(body.data);
  assert.isTrue(body.data.length > 0);
});

Scenario('Create new user', async ({ I }) => {
  const userData = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
  };

  const response = await I.sendPostRequest('/users', userData);

  I.seeResponseCodeIs(201);
  I.seeResponseContainsJson({
    success: true,
    data: {
      name: userData.name,
      email: userData.email,
    },
  });

  const body = JSON.parse(response.data);
  assert.exists(body.data.id);
});

Scenario('Update user', async ({ I }) => {
  const userId = '123';
  const updateData = {
    name: 'Jane Doe',
  };

  const response = await I.sendPatchRequest(`/users/${userId}`, updateData);

  I.seeResponseCodeIs(200);
  I.seeResponseContainsJson({
    success: true,
    data: {
      id: userId,
      name: updateData.name,
    },
  });
});

Scenario('Delete user', async ({ I }) => {
  const userId = '123';

  const response = await I.sendDeleteRequest(`/users/${userId}`);

  I.seeResponseCodeIs(204);
});
```

### 数据管理

```typescript
// data/fixtures/users.json
{
  "validUser": {
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  },
  "admin": {
    "email": "admin@example.com",
    "password": "admin123",
    "name": "Admin User"
  }
}

// data/factories/user.factory.ts
import { faker } from '@faker-js/faker';

export const userFactory = {
  create(overrides = {}) {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'Test123!',
      phone: faker.phone.number(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
      },
      ...overrides,
    };
  },

  createMany(count: number, overrides = {}) {
    return Array.from({ length: count }, () => this.create(overrides));
  },
};

// data/environments/dev.json
{
  "baseUrl": "http://localhost:3000",
  "apiUrl": "http://localhost:3000/api",
  "users": {
    "testUser": {
      "email": "test@example.com",
      "password": "test123"
    }
  }
}

// support/utils.ts
import * as codeceptjs from 'codeceptjs';

declare global {
  const I: codeceptjs.I;
  const loginPage: LoginPage;
  const homePage: HomePage;
}

export { codeceptjs };

// support/hooks.ts
import { I } from './utils';

BeforeSuite(async () => {
  console.log('Starting test suite...');
});

AfterSuite(async () => {
  console.log('Test suite completed');
});

Before(async () => {
  await I.clearCookie();
  await I.clearLocalStorage();
});

After(async () => {
  // 清理测试数据
});
```

### Gherkin BDD 测试

```gherkin
# features/login.feature
Feature: User Login
  As a user
  I want to login
  So that I can access my account

  @smoke
  Scenario: Successful login
    Given I am on the login page
    When I fill in "email" with "test@example.com"
    And I fill in "password" with "password123"
    And I click "Login"
    Then I should see "Welcome back!"
    And I should be on the dashboard page

  Scenario: Failed login with invalid credentials
    Given I am on the login page
    When I fill in "email" with "invalid@example.com"
    And I fill in "password" with "wrongpassword"
    And I click "Login"
    Then I should see "Invalid email or password"
    And I should be on the login page

# features/checkout.feature
Feature: Checkout Process
  As a customer
  I want to checkout
  So that I can complete my purchase

  @smoke
  Scenario: Complete checkout with credit card
    Given I am logged in
    And I have added "Product A" to cart
    When I go to checkout
    And I fill shipping information
    And I select "credit-card" payment method
    And I place order
    Then I should see order confirmation
    And I should receive order number
```

```typescript
// steps/steps.ts
import { I } from '../support/utils';

const loginPage = new LoginPage();
const homePage = new HomePage();
const checkoutPage = new CheckoutPage();

Given('I am on the login page', async () => {
  await loginPage.open();
});

When('I fill in {string} with {string}', async (field: string, value: string) => {
  await I.fillField(`#${field}`, value);
});

When('I click {string}', async (button: string) => {
  await I.click(button);
});

Then('I should see {string}', async (text: string) => {
  await I.see(text);
});

Then('I should be on the {string} page', async (page: string) => {
  const url = `/${page.toLowerCase().replace(' ', '-')}`;
  await I.seeInCurrentUrl(url);
});

Given('I am logged in', async () => {
  await loginPage.open();
  await loginPage.login('test@example.com', 'password123');
});

Given('I have added {string} to cart', async (product: string) => {
  await homePage.addProductToCart(product);
});

When('I go to checkout', async () => {
  await homePage.goToCart();
  await I.click('Proceed to Checkout');
});

When('I fill shipping information', async () => {
  await checkoutPage.fillShippingInfo({
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Test Street',
    city: 'Test City',
    zipCode: '12345',
    country: 'US',
  });
});

When('I select {string} payment method', async (method: string) => {
  await checkoutPage.selectPaymentMethod(method as any);
});

When('I place order', async () => {
  await checkoutPage.placeOrder();
});

Then('I should see order confirmation', async () => {
  await checkoutPage.verifyOrderSuccess();
});

Then('I should receive order number', async () => {
  const orderNumber = await checkoutPage.getOrderNumber();
  assert.exists(orderNumber);
});
```

## 最佳实践

### 1. 测试组织

```typescript
// 使用标签组织测试
@smoke
@critical
@regression
@mobile
Scenario('Important test', async ({ I }) => {
  // ...
});

// 运行特定标签
// codeceptjs run --grep "@smoke"
```

### 2. 等待策略

```typescript
// 使用智能等待
await I.waitForElement('.element', 10);
await I.waitForText('Expected text', 5);
await I.waitForInvisible('.loading', 10);
await I.waitForEnabled('#button', 5);
await I.waitForValue('#input', 'expected', 5);

// 避免硬编码等待
// ❌ await I.wait(5);
// ✅ await I.waitForElement('.element', 10);
```

### 3. 截图和调试

```typescript
Scenario('Debug test', async ({ I }) => {
  await I.saveScreenshot('step1.png');
  
  // 调试模式
  await I.debug();
  
  // 暂停测试
  await I.pause();
});
```

### 4. 数据驱动测试

```typescript
// 使用数据驱动
const testData = [
  { email: 'user1@example.com', password: 'pass1' },
  { email: 'user2@example.com', password: 'pass2' },
];

Data(testData).Scenario('Login with multiple users', async ({ I, current }) => {
  await loginPage.open();
  await loginPage.login(current.email, current.password);
});
```

## 常用命令

```bash
# 运行所有测试
codeceptjs run

# 运行特定文件
codeceptjs run tests/e2e/login_test.ts

# 运行特定场景
codeceptjs run --grep "Login"

# 并行运行
codeceptjs run-multiple parallel

# 运行 BDD 测试
codeceptjs gherkin:steps
codeceptjs gherkin:snippets
codeceptjs run --features

# 生成报告
codeceptjs run --reporter mochawesome

# Headless 模式
HEADLESS=true codeceptjs run

# 调试模式
codeceptjs run --debug

# 生成页面对象
codeceptjs gpo

# 生成测试
codeceptjs gt

# 生成助手
codeceptjs gh
```

## CI/CD 集成

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          HEADLESS: true
          BASE_URL: http://localhost:3000

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            output/
            reports/
```

## 参考资源

- [CodeceptJS 官方文档](https://codecept.io/)
- [CodeceptJS GitHub](https://github.com/Codeception/CodeceptJS)
- [Playwright Helper](https://codecept.io/helpers/Playwright/)
- [Allure Reporter](https://docs.qameta.io/allure/)
