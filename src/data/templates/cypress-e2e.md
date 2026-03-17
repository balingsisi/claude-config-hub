# Cypress E2E Testing

## 技术栈

### 核心工具
- **Cypress** - 现代化端到端测试框架
- **Cypress Testing Library** - 用户为中心的查询方法
- **Cypress Real Events** - 真实的浏览器事件
- **Cypress Axe** - 无障碍测试

### 辅助工具
- **Faker.js** - 测试数据生成
- **@faker-js/faker** - Faker 的活跃分支
- **Cypress File Upload** - 文件上传测试
- **Cypress Drag Drop** - 拖拽测试

### 报告和 CI
- **Mochawesome** - 测试报告生成
- **Cypress Dashboard** - 云端测试管理
- **GitHub Actions** - CI/CD 集成
- **Allure** - 测试报告可视化

### 数据管理
- **Cypress Data Session** - 数据缓存和共享
- **Cypress Network IDLE** - 网络状态管理

## 项目结构

```
cypress-project/
├── cypress/
│   ├── e2e/
│   │   ├── auth/
│   │   │   ├── login.cy.js
│   │   │   ├── register.cy.js
│   │   │   └── password-reset.cy.js
│   │   │
│   │   ├── user/
│   │   │   ├── profile.cy.js
│   │   │   └── settings.cy.js
│   │   │
│   │   ├── products/
│   │   │   ├── list.cy.js
│   │   │   ├── search.cy.js
│   │   │   └── detail.cy.js
│   │   │
│   │   ├── checkout/
│   │   │   ├── cart.cy.js
│   │   │   └── payment.cy.js
│   │   │
│   │   └── api/
│   │       ├── users.cy.js
│   │       └── products.cy.js
│   │
│   ├── fixtures/
│   │   ├── users.json
│   │   ├── products.json
│   │   └── orders.json
│   │
│   ├── support/
│   │   ├── commands.js
│   │   ├── e2e.js
│   │   ├── index.js
│   │   │
│   │   ├── utils/
│   │   │   ├── api-helpers.js
│   │   │   ├── data-generators.js
│   │   │   └── wait-helpers.js
│   │   │
│   │   └── page-objects/
│   │       ├── LoginPage.js
│   │       ├── HomePage.js
│   │       └── CartPage.js
│   │
│   ├── plugins/
│   │   └── index.js
│   │
│   └── screenshots/
│
├── cypress.config.js
├── package.json
└── .gitignore
```

## 代码模式

### 1. 基础配置

```javascript
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    pageLoadTimeout: 60000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    experimentalStudio: true,
    experimentalSessionAndOrigin: true,
    
    setupNodeEvents(on, config) {
      // 任务和插件配置
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
      });
      
      // 环境变量配置
      if (config.env.environment === 'staging') {
        config.baseUrl = 'https://staging.example.com';
      }
      
      return config;
    },
  },
});
```

### 2. 自定义命令

```javascript
// cypress/support/commands.js

// 登录命令
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-cy=email-input]').type(email);
    cy.get('[data-cy=password-input]').type(password);
    cy.get('[data-cy=login-button]').click();
    cy.url().should('include', '/dashboard');
  }, {
    validate() {
      cy.getCookie('session-token').should('exist');
    },
  });
});

// 通过 API 登录（更快）
Cypress.Commands.add('loginViaAPI', (email, password) => {
  cy.request('POST', '/api/auth/login', {
    email,
    password,
  }).then((response) => {
    cy.setCookie('session-token', response.body.token);
    window.localStorage.setItem('user', JSON.stringify(response.body.user));
  });
});

// 登出
Cypress.Commands.add('logout', () => {
  cy.get('[data-cy=logout-button]').click();
  cy.url().should('include', '/login');
  cy.clearCookie('session-token');
  cy.clearLocalStorage('user');
});

// 等待页面加载完成
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-cy=loading-spinner]').should('not.exist');
  cy.get('body').should('be.visible');
});

// 检查元素可见性
Cypress.Commands.add('shouldBeVisible', { prevSubject: true }, (subject) => {
  cy.wrap(subject).should('be.visible');
});

// 选择下拉选项
Cypress.Commands.add('selectOption', { prevSubject: true }, (subject, value) => {
  cy.wrap(subject).click();
  cy.get(`[data-value="${value}"]`).click();
});

// 拖拽元素
Cypress.Commands.add('dragAndDrop', { prevSubject: true }, (subject, target) => {
  const dataTransfer = new DataTransfer();
  
  cy.wrap(subject)
    .trigger('dragstart', { dataTransfer })
    .trigger('drag', { dataTransfer });
  
  cy.get(target)
    .trigger('dragover', { dataTransfer })
    .trigger('drop', { dataTransfer })
    .trigger('dragend', { dataTransfer });
});

// 检查表格数据
Cypress.Commands.add('checkTableData', (selector, expectedData) => {
  cy.get(selector).find('tbody tr').each(($row, index) => {
    cy.wrap($row).find('td').each(($cell, cellIndex) => {
      cy.wrap($cell).should('contain', expectedData[index][cellIndex]);
    });
  });
});

// 删除所有测试数据
Cypress.Commands.add('cleanUpTestData', () => {
  cy.request({
    method: 'DELETE',
    url: '/api/test/cleanup',
    headers: {
      'Authorization': `Bearer ${Cypress.env('testToken')}`,
    },
  });
});
```

### 3. Page Object 模式

```javascript
// cypress/support/page-objects/LoginPage.js

class LoginPage {
  constructor() {
    this.selectors = {
      emailInput: '[data-cy=email-input]',
      passwordInput: '[data-cy=password-input]',
      loginButton: '[data-cy=login-button]',
      forgotPasswordLink: '[data-cy=forgot-password-link]',
      errorMessage: '[data-cy=error-message]',
      registerLink: '[data-cy=register-link]',
    };
  }
  
  visit() {
    cy.visit('/login');
    return this;
  }
  
  fillEmail(email) {
    cy.get(this.selectors.emailInput).clear().type(email);
    return this;
  }
  
  fillPassword(password) {
    cy.get(this.selectors.passwordInput).clear().type(password);
    return this;
  }
  
  clickLogin() {
    cy.get(this.selectors.loginButton).click();
    return this;
  }
  
  clickForgotPassword() {
    cy.get(this.selectors.forgotPasswordLink).click();
    return this;
  }
  
  clickRegister() {
    cy.get(this.selectors.registerLink).click();
    return this;
  }
  
  getErrorMessage() {
    return cy.get(this.selectors.errorMessage);
  }
  
  login(email, password) {
    this.fillEmail(email);
    this.fillPassword(password);
    this.clickLogin();
    return this;
  }
  
  shouldShowError(message) {
    this.getErrorMessage().should('be.visible').and('contain', message);
    return this;
  }
  
  shouldBeAtLoginPage() {
    cy.url().should('include', '/login');
    return this;
  }
}

export default LoginPage;

// cypress/support/page-objects/HomePage.js

class HomePage {
  constructor() {
    this.selectors = {
      heroSection: '[data-cy=hero-section]',
      searchInput: '[data-cy=search-input]',
      searchButton: '[data-cy=search-button]',
      productCard: '[data-cy=product-card]',
      cartButton: '[data-cy=cart-button]',
      userMenu: '[data-cy=user-menu]',
    };
  }
  
  visit() {
    cy.visit('/');
    return this;
  }
  
  search(query) {
    cy.get(this.selectors.searchInput).clear().type(query);
    cy.get(this.selectors.searchButton).click();
    return this;
  }
  
  getProductCards() {
    return cy.get(this.selectors.productCard);
  }
  
  clickProductCard(index) {
    this.getProductCards().eq(index).click();
    return this;
  }
  
  openCart() {
    cy.get(this.selectors.cartButton).click();
    return this;
  }
  
  openUserMenu() {
    cy.get(this.selectors.userMenu).click();
    return this;
  }
  
  shouldHaveProducts(count) {
    this.getProductCards().should('have.length', count);
    return this;
  }
}

export default HomePage;
```

### 4. 测试用例模式

```javascript
// cypress/e2e/auth/login.cy.js

import LoginPage from '../../support/page-objects/LoginPage';
import HomePage from '../../support/page-objects/HomePage';

describe('Login', () => {
  const loginPage = new LoginPage();
  const homePage = new HomePage();
  
  beforeEach(() => {
    loginPage.visit();
  });
  
  it('should display login form', () => {
    cy.get('[data-cy=email-input]').should('be.visible');
    cy.get('[data-cy=password-input]').should('be.visible');
    cy.get('[data-cy=login-button]').should('be.visible');
  });
  
  it('should login successfully with valid credentials', () => {
    const user = {
      email: 'test@example.com',
      password: 'Password123!',
    };
    
    loginPage.login(user.email, user.password);
    
    // 验证跳转到首页
    cy.url().should('include', '/dashboard');
    
    // 验证用户已登录
    cy.get('[data-cy=user-menu]').should('contain', 'Test User');
  });
  
  it('should show error with invalid credentials', () => {
    loginPage
      .login('invalid@example.com', 'wrongpassword')
      .shouldShowError('Invalid email or password');
  });
  
  it('should validate email format', () => {
    loginPage
      .fillEmail('invalid-email')
      .fillPassword('Password123!')
      .clickLogin()
      .shouldShowError('Please enter a valid email address');
  });
  
  it('should require password', () => {
    loginPage
      .fillEmail('test@example.com')
      .clickLogin()
      .shouldShowError('Password is required');
  });
  
  it('should navigate to forgot password page', () => {
    loginPage.clickForgotPassword();
    cy.url().should('include', '/forgot-password');
  });
  
  it('should navigate to register page', () => {
    loginPage.clickRegister();
    cy.url().should('include', '/register');
  });
  
  it('should show loading state during login', () => {
    loginPage
      .fillEmail('test@example.com')
      .fillPassword('Password123!')
      .clickLogin();
    
    cy.get('[data-cy=loading-spinner]').should('be.visible');
    cy.get('[data-cy=loading-spinner]').should('not.exist');
  });
  
  it('should maintain session after page reload', () => {
    cy.login('test@example.com', 'Password123!');
    
    cy.reload();
    
    cy.get('[data-cy=user-menu]').should('contain', 'Test User');
  });
});

// cypress/e2e/checkout/cart.cy.js

import HomePage from '../../support/page-objects/HomePage';
import CartPage from '../../support/page-objects/CartPage';

describe('Shopping Cart', () => {
  const homePage = new HomePage();
  const cartPage = new CartPage();
  
  beforeEach(() => {
    cy.login('test@example.com', 'Password123!');
    homePage.visit();
  });
  
  it('should add item to cart', () => {
    homePage.clickProductCard(0);
    
    cy.get('[data-cy=add-to-cart-button]').click();
    
    cy.get('[data-cy=cart-badge]').should('contain', '1');
    cy.get('[data-cy=success-message]').should('contain', 'Added to cart');
  });
  
  it('should update quantity in cart', () => {
    // 添加商品到购物车
    homePage.clickProductCard(0);
    cy.get('[data-cy=add-to-cart-button]').click();
    
    // 打开购物车
    homePage.openCart();
    
    // 更新数量
    cartPage.updateQuantity(0, 3);
    
    // 验证更新
    cartPage.getItemQuantity(0).should('have.value', '3');
    cartPage.getTotal().should('contain', '$90.00');
  });
  
  it('should remove item from cart', () => {
    // 添加商品
    homePage.clickProductCard(0);
    cy.get('[data-cy=add-to-cart-button]').click();
    
    // 打开购物车
    homePage.openCart();
    
    // 删除商品
    cartPage.removeItem(0);
    
    // 验证购物车为空
    cartPage.isEmpty().should('be.true');
  });
  
  it('should calculate total correctly', () => {
    // 添加多个商品
    homePage.clickProductCard(0);
    cy.get('[data-cy=add-to-cart-button]').click();
    
    homePage.visit();
    homePage.clickProductCard(1);
    cy.get('[data-cy=add-to-cart-button]').click();
    
    // 打开购物车
    homePage.openCart();
    
    // 验证总计
    cartPage.getTotal().should('contain', '$60.00');
  });
  
  it('should apply discount code', () => {
    // 添加商品
    homePage.clickProductCard(0);
    cy.get('[data-cy=add-to-cart-button]').click();
    
    // 打开购物车
    homePage.openCart();
    
    // 应用折扣码
    cartPage.applyDiscount('SAVE10');
    
    // 验证折扣
    cartPage.getDiscount().should('contain', '-$3.00');
    cartPage.getTotal().should('contain', '$27.00');
  });
  
  it('should show error for invalid discount code', () => {
    // 添加商品
    homePage.clickProductCard(0);
    cy.get('[data-cy=add-to-cart-button]').click();
    
    // 打开购物车
    homePage.openCart();
    
    // 应用无效折扣码
    cartPage.applyDiscount('INVALID');
    
    // 验证错误消息
    cartPage.getErrorMessage().should('contain', 'Invalid discount code');
  });
});
```

### 5. API 测试

```javascript
// cypress/e2e/api/users.cy.js

describe('Users API', () => {
  let authToken;
  
  before(() => {
    // 获取认证 token
    cy.request('POST', '/api/auth/login', {
      email: 'admin@example.com',
      password: 'Admin123!',
    }).then((response) => {
      authToken = response.body.token;
    });
  });
  
  it('should get all users', () => {
    cy.request({
      method: 'GET',
      url: '/api/users',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.greaterThan(0);
    });
  });
  
  it('should create a new user', () => {
    const newUser = {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
    };
    
    cy.request({
      method: 'POST',
      url: '/api/users',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: newUser,
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.name).to.eq(newUser.name);
      expect(response.body.email).to.eq(newUser.email);
      expect(response.body).to.have.property('id');
    });
  });
  
  it('should update a user', () => {
    const userId = 1;
    const updateData = {
      name: 'Updated Name',
    };
    
    cy.request({
      method: 'PUT',
      url: `/api/users/${userId}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: updateData,
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.name).to.eq(updateData.name);
    });
  });
  
  it('should delete a user', () => {
    const userId = 2;
    
    cy.request({
      method: 'DELETE',
      url: `/api/users/${userId}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(204);
    });
  });
  
  it('should return 401 without auth token', () => {
    cy.request({
      method: 'GET',
      url: '/api/users',
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
    });
  });
  
  it('should return 404 for non-existent user', () => {
    const userId = 99999;
    
    cy.request({
      method: 'GET',
      url: `/api/users/${userId}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(404);
    });
  });
});

// cypress/e2e/api/products.cy.js

describe('Products API', () => {
  const baseUrl = '/api/products';
  
  it('should get products with pagination', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}?page=1&per_page=10`,
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('data');
      expect(response.body).to.have.property('total');
      expect(response.body).to.have.property('page');
      expect(response.body.data.length).to.be.at.most(10);
    });
  });
  
  it('should search products', () => {
    const searchTerm = 'laptop';
    
    cy.request({
      method: 'GET',
      url: `${baseUrl}?search=${searchTerm}`,
    }).then((response) => {
      expect(response.status).to.eq(200);
      response.body.data.forEach((product) => {
        expect(
          product.name.toLowerCase()
        ).to.include(searchTerm.toLowerCase());
      });
    });
  });
  
  it('should filter products by category', () => {
    const category = 'electronics';
    
    cy.request({
      method: 'GET',
      url: `${baseUrl}?category=${category}`,
    }).then((response) => {
      expect(response.status).to.eq(200);
      response.body.data.forEach((product) => {
        expect(product.category).to.eq(category);
      });
    });
  });
});
```

### 6. Fixtures 数据管理

```json
// cypress/fixtures/users.json
{
  "validUser": {
    "email": "test@example.com",
    "password": "Password123!",
    "name": "Test User"
  },
  "adminUser": {
    "email": "admin@example.com",
    "password": "Admin123!",
    "name": "Admin User",
    "role": "admin"
  },
  "invalidUser": {
    "email": "invalid@example.com",
    "password": "wrongpassword"
  }
}

// cypress/fixtures/products.json
{
  "product1": {
    "id": 1,
    "name": "Product 1",
    "price": 29.99,
    "category": "electronics"
  },
  "product2": {
    "id": 2,
    "name": "Product 2",
    "price": 49.99,
    "category": "clothing"
  }
}
```

```javascript
// 使用 fixtures
describe('Using Fixtures', () => {
  beforeEach(() => {
    cy.fixture('users').as('users');
  });
  
  it('should login with fixture data', function () {
    const { validUser } = this.users;
    
    cy.visit('/login');
    cy.get('[data-cy=email-input]').type(validUser.email);
    cy.get('[data-cy=password-input]').type(validUser.password);
    cy.get('[data-cy=login-button]').click();
    
    cy.url().should('include', '/dashboard');
  });
});
```

### 7. 数据生成器

```javascript
// cypress/support/utils/data-generators.js
import { faker } from '@faker-js/faker';

export const generateUser = (overrides = {}) => {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password({ length: 12 }),
    phone: faker.phone.number(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
    },
    ...overrides,
  };
};

export const generateProduct = (overrides = {}) => {
  return {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price()),
    category: faker.commerce.department(),
    image: faker.image.url(),
    ...overrides,
  };
};

export const generateOrder = (overrides = {}) => {
  return {
    userId: faker.number.int({ min: 1, max: 100 }),
    products: [
      {
        productId: faker.number.int({ min: 1, max: 50 }),
        quantity: faker.number.int({ min: 1, max: 10 }),
      },
    ],
    status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered']),
    ...overrides,
  };
};

// 使用
import { generateUser, generateProduct } from '../support/utils/data-generators';

it('should create a new user with random data', () => {
  const newUser = generateUser({ role: 'admin' });
  
  cy.request('POST', '/api/users', newUser).then((response) => {
    expect(response.status).to.eq(201);
    expect(response.body.email).to.eq(newUser.email);
  });
});
```

### 8. 网络拦截和 Mock

```javascript
// cypress/e2e/mocking.cy.js

describe('API Mocking', () => {
  beforeEach(() => {
    cy.visit('/');
  });
  
  it('should mock GET request', () => {
    cy.intercept('GET', '/api/products', {
      fixture: 'products.json',
    }).as('getProducts');
    
    cy.visit('/products');
    
    cy.wait('@getProducts').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
    });
    
    cy.get('[data-cy=product-card]').should('have.length', 2);
  });
  
  it('should mock POST request', () => {
    cy.intercept('POST', '/api/users', {
      statusCode: 201,
      body: {
        id: 123,
        name: 'New User',
        email: 'new@example.com',
      },
    }).as('createUser');
    
    cy.visit('/register');
    cy.get('[data-cy=name-input]').type('New User');
    cy.get('[data-cy=email-input]').type('new@example.com');
    cy.get('[data-cy=submit-button]').click();
    
    cy.wait('@createUser').its('request.body').should('deep.equal', {
      name: 'New User',
      email: 'new@example.com',
    });
  });
  
  it('should mock error response', () => {
    cy.intercept('GET', '/api/products', {
      statusCode: 500,
      body: {
        error: 'Internal Server Error',
      },
    }).as('getProductsError');
    
    cy.visit('/products');
    
    cy.wait('@getProductsError');
    cy.get('[data-cy=error-message]').should('contain', 'Failed to load products');
  });
  
  it('should delay response', () => {
    cy.intercept('GET', '/api/products', {
      fixture: 'products.json',
      delay: 2000,
    }).as('getProductsDelayed');
    
    cy.visit('/products');
    
    cy.get('[data-cy=loading-spinner]').should('be.visible');
    
    cy.wait('@getProductsDelayed');
    
    cy.get('[data-cy=loading-spinner]').should('not.exist');
    cy.get('[data-cy=product-card]').should('be.visible');
  });
  
  it('should modify request', () => {
    cy.intercept('GET', '/api/products', (req) => {
      req.headers['X-Custom-Header'] = 'test-value';
      req.continue();
    }).as('getProducts');
    
    cy.visit('/products');
    
    cy.wait('@getProducts').its('request.headers').should('have.property', 'X-Custom-Header');
  });
  
  it('should modify response', () => {
    cy.intercept('GET', '/api/products', (req) => {
      req.reply((res) => {
        res.body.data = res.body.data.map(product => ({
          ...product,
          price: product.price * 0.9, // 10% discount
        }));
      });
    }).as('getProducts');
    
    cy.visit('/products');
    
    cy.wait('@getProducts');
    cy.get('[data-cy=product-price]').first().should('contain', '$26.99');
  });
});
```

## 最佳实践

### 1. 使用 data-cy 属性

```html
<!-- 推荐 -->
<button data-cy="submit-button">Submit</button>
<input data-cy="email-input" type="email" />

<!-- 不推荐（脆弱的选择器） -->
<button class="btn btn-primary">Submit</button>
```

```javascript
// 推荐
cy.get('[data-cy=submit-button]').click();

// 不推荐
cy.get('.btn-primary').click();
```

### 2. 使用 Aliases

```javascript
// 为元素创建别名
cy.get('[data-cy=email-input]').as('emailInput');
cy.get('[data-cy=password-input]').as('passwordInput');

// 使用别名
cy.get('@emailInput').type('test@example.com');
cy.get('@passwordInput').type('password');
```

### 3. 使用环境变量

```javascript
// cypress.config.js
module.exports = defineConfig({
  e2e: {
    env: {
      apiUrl: 'https://api.example.com',
      testUser: {
        email: 'test@example.com',
        password: 'Test123!',
      },
    },
  },
});

// 测试中使用
const apiUrl = Cypress.env('apiUrl');
const { email, password } = Cypress.env('testUser');
```

### 4. 避免硬编码等待

```javascript
// 不推荐
cy.wait(5000);
cy.get('.element').click();

// 推荐
cy.get('.element', { timeout: 10000 }).should('be.visible').click();

// 或使用自定义命令
cy.waitForPageLoad();
```

### 5. 使用 beforeEach 清理状态

```javascript
describe('Tests', () => {
  beforeEach(() => {
    // 清理 cookies 和 local storage
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // 重置数据库（通过 API）
    cy.cleanUpTestData();
    
    // 访问页面
    cy.visit('/');
  });
});
```

### 6. 使用 retries

```javascript
// cypress.config.js
module.exports = defineConfig({
  e2e: {
    retries: {
      runMode: 2,  // CI 环境重试 2 次
      openMode: 0,  // 开发环境不重试
    },
  },
});
```

### 7. 组织测试用例

```javascript
describe('User Management', () => {
  context('Authentication', () => {
    it('should login');
    it('should logout');
  });
  
  context('Profile', () => {
    it('should view profile');
    it('should update profile');
  });
  
  context('Settings', () => {
    it('should change password');
    it('should update preferences');
  });
});
```

### 8. 测试数据隔离

```javascript
describe('Tests', () => {
  let testUser;
  
  before(() => {
    // 创建测试用户
    cy.request('POST', '/api/test/users', {
      email: `test-${Date.now()}@example.com`,
      password: 'Test123!',
    }).then((response) => {
      testUser = response.body;
    });
  });
  
  after(() => {
    // 删除测试用户
    cy.request('DELETE', `/api/test/users/${testUser.id}`);
  });
  
  it('should use test user', () => {
    cy.login(testUser.email, testUser.password);
    // ...
  });
});
```

## 常用命令

### Cypress CLI
```bash
# 打开 Cypress Test Runner
npx cypress open

# 运行所有测试（headless）
npx cypress run

# 运行特定文件
npx cypress run --spec "cypress/e2e/auth/login.cy.js"

# 运行匹配模式的测试
npx cypress run --spec "cypress/e2e/auth/**/*.cy.js"

# 指定浏览器
npx cypress run --browser chrome

# 指定配置文件
npx cypress run --config-file cypress.staging.config.js

# 指定环境变量
npx cypress run --env environment=staging

# 生成报告
npx cypress run --reporter mochawesome

# 并行运行（需要 Dashboard）
npx cypress run --parallel --record --key <record-key>

# 检查 Cypress 版本
npx cypress version

# 验证安装
npx cypress verify
```

### package.json 脚本
```json
{
  "scripts": {
    "cy:open": "cypress open",
    "cy:run": "cypress run",
    "cy:run:chrome": "cypress run --browser chrome",
    "cy:run:firefox": "cypress run --browser firefox",
    "cy:run:headless": "cypress run --headless",
    "cy:run:staging": "cypress run --config-file cypress.staging.config.js",
    "cy:report": "cypress run --reporter mochawesome",
    "cy:clear": "cypress cache clear"
  }
}
```

### 调试命令
```bash
# 打开 Chrome DevTools
cy.pause();

// 打印到控制台
cy.log('Debug message');
console.log('Console message');

// 调试命令链
cy.get('.element').debug();

// 查看元素
cy.get('.element').then(($el) => {
  console.log($el);
});
```

## 部署配置

### GitHub Actions

```yaml
# .github/workflows/cypress.yml
name: Cypress Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  cypress:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        browser: [chrome, firefox]
        node-version: [18.x]
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Run Cypress tests
        uses: cypress-io/github-action@v5
        with:
          browser: ${{ matrix.browser }}
          start: npm start
          wait-on: 'http://localhost:3000'
          wait-on-timeout: 120
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
      
      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-screenshots-${{ matrix.browser }}
          path: cypress/screenshots
      
      - name: Upload videos
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: cypress-videos-${{ matrix.browser }}
          path: cypress/videos
      
      - name: Upload test reports
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: cypress-reports-${{ matrix.browser }}
          path: cypress/reports
```

### Docker

```dockerfile
# Dockerfile.cypress
FROM cypress/included:13.0.0

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx cypress verify

CMD ["npx", "cypress", "run"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/testdb
    depends_on:
      - db
  
  cypress:
    image: cypress/included:13.0.0
    depends_on:
      - app
    environment:
      - CYPRESS_baseUrl=http://app:3000
    working_dir: /app
    volumes:
      - ./:/app
    command: npx cypress run
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=testdb
```

### Mochawesome 报告

```javascript
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'cypress/reports',
    overwrite: false,
    html: true,
    json: true,
  },
  e2e: {
    // ...
  },
});
```

### Allure 报告

```javascript
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  e2e: {
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);
    },
  },
});
```

```bash
# 生成 Allure 报告
npm run cy:run -- --reporter allure-cypress
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

### 环境配置

```javascript
// cypress.config.js - Development
module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    video: false,
    screenshotOnRunFailure: true,
  },
});

// cypress.staging.config.js - Staging
module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://staging.example.com',
    video: true,
    screenshotOnRunFailure: true,
    retries: {
      runMode: 2,
    },
  },
});

// cypress.production.config.js - Production
module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://example.com',
    video: true,
    screenshotOnRunFailure: true,
    retries: {
      runMode: 3,
    },
    defaultCommandTimeout: 15000,
  },
});
```

## 性能指标

- **测试执行速度**: 1-5s 每个测试
- **页面加载超时**: 60s（默认）
- **命令超时**: 4s（默认）
- **并发能力**: 多个浏览器并行
- **CI 执行时间**: 5-30 分钟（取决于测试数量）
- **内存占用**: 300-800MB 每个浏览器实例
- **视频大小**: 1-10MB 每个测试
- **截图大小**: 100KB-2MB 每张