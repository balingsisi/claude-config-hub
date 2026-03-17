# Puppeteer 浏览器自动化模板

## 技术栈

- **Puppeteer**: 22.x - Node.js 浏览器自动化
- **TypeScript**: 5.x - 类型支持
- **Node.js**: 20.x - 运行时
- **Jest/Vitest**: 测试框架
- **Puppeteer Cluster**: 并发控制
- **Puppeteer Recorder**: 录制脚本

## 项目结构

```
puppeteer-project/
├── src/
│   ├── scrapers/
│   │   ├── BaseScraper.ts      # 基础爬虫类
│   │   ├── ProductScraper.ts   # 产品爬虫
│   │   └── NewsScraper.ts      # 新闻爬虫
│   ├── browsers/
│   │   ├── BrowserManager.ts   # 浏览器管理
│   │   └── PagePool.ts         # 页面池
│   ├── utils/
│   │   ├── screenshot.ts       # 截图工具
│   │   ├── pdf.ts              # PDF 生成
│   │   ├── wait.ts             # 等待策略
│   │   └── stealth.ts          # 隐身模式
│   ├── handlers/
│   │   ├── LoginHandler.ts     # 登录处理
│   │   ├── FormHandler.ts      # 表单处理
│   │   └── DownloadHandler.ts  # 下载处理
│   ├── types/
│   │   └── index.ts            # 类型定义
│   └── index.ts                # 入口文件
├── tests/
│   ├── e2e/
│   │   └── login.test.ts
│   └── fixtures/
│       └── test-data.ts
├── scripts/
│   ├── screenshot.ts           # 截图脚本
│   ├── pdf.ts                  # PDF 脚本
│   └── crawl.ts                # 爬取脚本
├── puppeteer.config.ts         # Puppeteer 配置
├── package.json
├── tsconfig.json
└── README.md
```

## 代码模式

### 1. Puppeteer 配置

```typescript
// puppeteer.config.ts
import { LaunchOptions } from 'puppeteer';

export const puppeteerConfig: LaunchOptions = {
  // 浏览器路径（可选）
  // executablePath: '/path/to/chrome',

  // 无头模式
  headless: process.env.HEADLESS !== 'false',

  // 慢速操作（调试用）
  slowMo: process.env.NODE_ENV === 'development' ? 50 : 0,

  // 超时设置
  timeout: 30000,

  // 视口大小
  defaultViewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  },

  // 忽略 HTTPS 错误
  ignoreHTTPSErrors: true,

  // 浏览器参数
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
  ],
};

// 开发环境配置
export const devConfig: LaunchOptions = {
  ...puppeteerConfig,
  headless: false,
  devtools: true,
};

// 生产环境配置
export const prodConfig: LaunchOptions = {
  ...puppeteerConfig,
  headless: true,
  args: [
    ...puppeteerConfig.args!,
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
  ],
};
```

### 2. 浏览器管理器

```typescript
// src/browsers/BrowserManager.ts
import puppeteer, { Browser, Page, BrowserContext } from 'puppeteer';
import { puppeteerConfig } from '../../puppeteer.config';

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  // 启动浏览器
  async launch(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    this.browser = await puppeteer.launch(puppeteerConfig);
    return this.browser;
  }

  // 创建新的浏览器上下文
  async createContext(options?: {
    userAgent?: string;
    viewport?: { width: number; height: number };
    cookies?: any[];
  }): Promise<BrowserContext> {
    if (!this.browser) {
      await this.launch();
    }

    this.context = await this.browser!.createIncognitoBrowserContext();

    // 设置用户代理
    if (options?.userAgent) {
      await this.context.overridePermissions('https://example.com', ['geolocation']);
    }

    return this.context;
  }

  // 创建新页面
  async newPage(): Promise<Page> {
    if (!this.browser) {
      await this.launch();
    }

    const page = await this.browser!.newPage();

    // 设置视口
    await page.setViewport({ width: 1920, height: 1080 });

    // 设置用户代理
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // 拦截请求（可选）
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      // 阻止加载图片、样式、字体（加速）
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    return page;
  }

  // 关闭浏览器
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
    }
  }

  // 获取浏览器实例
  getBrowser(): Browser | null {
    return this.browser;
  }
}
```

### 3. 基础爬虫类

```typescript
// src/scrapers/BaseScraper.ts
import { Page, Browser } from 'puppeteer';
import { BrowserManager } from '../browsers/BrowserManager';

export abstract class BaseScraper {
  protected page: Page | null = null;
  protected browserManager: BrowserManager;

  constructor() {
    this.browserManager = new BrowserManager();
  }

  // 初始化
  async init(): Promise<void> {
    await this.browserManager.launch();
    this.page = await this.browserManager.newPage();
  }

  // 导航到 URL
  async goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2' }) {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    await this.page.goto(url, {
      waitUntil: options?.waitUntil || 'networkidle2',
      timeout: 60000,
    });
  }

  // 等待选择器
  async waitForSelector(selector: string, timeout = 30000) {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    return this.page.waitForSelector(selector, { timeout });
  }

  // 获取文本内容
  async getText(selector: string): Promise<string | null> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const element = await this.page.$(selector);
    if (!element) return null;

    return element.evaluate((el) => el.textContent?.trim() || null);
  }

  // 获取多个元素文本
  async getTexts(selector: string): Promise<string[]> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    return this.page.$$eval(selector, (elements) =>
      elements.map((el) => el.textContent?.trim() || '').filter(Boolean)
    );
  }

  // 获取属性
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const element = await this.page.$(selector);
    if (!element) return null;

    return element.evaluate((el, attr) => el.getAttribute(attr), attribute);
  }

  // 点击元素
  async click(selector: string): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    await this.page.click(selector);
  }

  // 输入文本
  async type(selector: string, text: string, options?: { delay: number }): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    await this.page.type(selector, text, options);
  }

  // 执行脚本
  async evaluate<T>(fn: () => T): Promise<T> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    return this.page.evaluate(fn);
  }

  // 截图
  async screenshot(path: string, fullPage = false): Promise<Buffer> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    return this.page.screenshot({ path, fullPage });
  }

  // 保存 PDF
  async pdf(path: string, options?: { format?: string; printBackground?: boolean }): Promise<Buffer> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    return this.page.pdf({
      path,
      format: options?.format || 'A4',
      printBackground: options?.printBackground ?? true,
    });
  }

  // 关闭
  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    await this.browserManager.close();
  }

  // 抽象方法 - 子类实现
  abstract scrape(url: string): Promise<any>;
}
```

### 4. 产品爬虫示例

```typescript
// src/scrapers/ProductScraper.ts
import { BaseScraper } from './BaseScraper';

interface Product {
  title: string;
  price: number;
  description: string;
  image: string;
  rating: number;
  reviews: number;
}

export class ProductScraper extends BaseScraper {
  async scrape(url: string): Promise<Product | null> {
    await this.init();
    await this.goto(url);

    // 等待产品信息加载
    await this.waitForSelector('.product-title');

    // 提取产品信息
    const product = await this.page!.evaluate(() => {
      const titleElement = document.querySelector('.product-title');
      const priceElement = document.querySelector('.product-price');
      const descElement = document.querySelector('.product-description');
      const imageElement = document.querySelector('.product-image img');
      const ratingElement = document.querySelector('.product-rating');

      if (!titleElement) return null;

      // 提取价格
      const priceText = priceElement?.textContent || '';
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));

      // 提取评分
      const ratingText = ratingElement?.textContent || '';
      const rating = parseFloat(ratingText.match(/(\d+\.?\d*)/)?.[1] || '0');

      return {
        title: titleElement.textContent?.trim() || '',
        price,
        description: descElement?.textContent?.trim() || '',
        image: imageElement?.getAttribute('src') || '',
        rating,
        reviews: parseInt(document.querySelector('.review-count')?.textContent || '0'),
      };
    });

    await this.close();
    return product;
  }

  // 批量爬取
  async scrapeMultiple(urls: string[]): Promise<Product[]> {
    const products: Product[] = [];

    for (const url of urls) {
      try {
        const product = await this.scrape(url);
        if (product) {
          products.push(product);
        }
      } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
      }

      // 延迟，避免被封
      await this.delay(2000);
    }

    return products;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### 5. 登录处理器

```typescript
// src/handlers/LoginHandler.ts
import { Page } from 'puppeteer';
import { BrowserManager } from '../browsers/BrowserManager';

export class LoginHandler {
  private page: Page | null = null;

  async init(): Promise<void> {
    const browserManager = new BrowserManager();
    await browserManager.launch();
    this.page = await browserManager.newPage();
  }

  // 登录处理
  async login(config: {
    url: string;
    usernameSelector: string;
    passwordSelector: string;
    submitSelector: string;
    username: string;
    password: string;
    successSelector?: string;
  }): Promise<void> {
    if (!this.page) {
      await this.init();
    }

    // 访问登录页
    await this.page!.goto(config.url, { waitUntil: 'networkidle2' });

    // 输入用户名
    await this.page!.waitForSelector(config.usernameSelector);
    await this.page!.type(config.usernameSelector, config.username);

    // 输入密码
    await this.page!.type(config.passwordSelector, config.password);

    // 点击登录按钮
    await this.page!.click(config.submitSelector);

    // 等待登录成功
    if (config.successSelector) {
      await this.page!.waitForSelector(config.successSelector, { timeout: 30000 });
    } else {
      await this.page!.waitForNavigation({ waitUntil: 'networkidle2' });
    }
  }

  // 保存 Cookie
  async saveCookies(filePath: string): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const cookies = await this.page.cookies();
    const fs = await import('fs/promises');
    await fs.writeFile(filePath, JSON.stringify(cookies, null, 2));
  }

  // 加载 Cookie
  async loadCookies(filePath: string): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const fs = await import('fs/promises');
    const cookiesString = await fs.readFile(filePath, 'utf-8');
    const cookies = JSON.parse(cookiesString);
    await this.page.setCookie(...cookies);
  }

  // 检查是否已登录
  async isLoggedIn(checkSelector: string): Promise<boolean> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      await this.page.waitForSelector(checkSelector, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  // 获取页面实例
  getPage(): Page | null {
    return this.page;
  }
}

// 使用示例
async function example() {
  const loginHandler = new LoginHandler();

  await loginHandler.login({
    url: 'https://example.com/login',
    usernameSelector: '#username',
    passwordSelector: '#password',
    submitSelector: 'button[type="submit"]',
    username: 'user@example.com',
    password: 'password123',
    successSelector: '.dashboard',
  });

  // 保存登录状态
  await loginHandler.saveCookies('./cookies.json');
}
```

### 6. 表单处理器

```typescript
// src/handlers/FormHandler.ts
import { Page } from 'puppeteer';

export class FormHandler {
  constructor(private page: Page) {}

  // 填写表单
  async fillForm(fields: Record<string, string>): Promise<void> {
    for (const [selector, value] of Object.entries(fields)) {
      await this.page.waitForSelector(selector);
      await this.page.type(selector, value);
    }
  }

  // 选择下拉框
  async select(selector: string, value: string): Promise<void> {
    await this.page.waitForSelector(selector);
    await this.page.select(selector, value);
  }

  // 勾选复选框
  async check(selector: string): Promise<void> {
    await this.page.waitForSelector(selector);
    await this.page.check(selector);
  }

  // 取消勾选
  async uncheck(selector: string): Promise<void> {
    await this.page.waitForSelector(selector);
    await this.page.uncheck(selector);
  }

  // 上传文件
  async uploadFile(selector: string, filePath: string): Promise<void> {
    await this.page.waitForSelector(selector);
    const fileInput = await this.page.$(selector);
    if (fileInput) {
      await fileInput.uploadFile(filePath);
    }
  }

  // 提交表单
  async submit(selector?: string): Promise<void> {
    if (selector) {
      await this.page.click(selector);
    } else {
      await this.page.keyboard.press('Enter');
    }
  }

  // 验证表单错误
  async getErrors(errorSelector: string): Promise<string[]> {
    const errors = await this.page.$$eval(errorSelector, (elements) =>
      elements.map((el) => el.textContent?.trim() || '').filter(Boolean)
    );
    return errors;
  }
}
```

## 最佳实践

### 1. 反爬虫策略

```typescript
// src/utils/stealth.ts
import { Page } from 'puppeteer';

// 隐藏 Puppeteer 特征
export async function applyStealthMode(page: Page): Promise<void> {
  // 隐藏 webdriver 属性
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // 修改 navigator 属性
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    Object.defineProperty(navigator, 'languages', {
      get: () => ['zh-CN', 'zh', 'en'],
    });

    // 隐藏 Chrome 特征
    (window as any).chrome = {
      runtime: {},
    };

    // 修改权限查询
    const originalQuery = window.navigator.permissions.query;
    (window.navigator.permissions as any).query = (parameters: any) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
        : originalQuery(parameters);
  });
}

// 使用示例
const page = await browser.newPage();
await applyStealthMode(page);
```

### 2. 等待策略

```typescript
// src/utils/wait.ts
import { Page } from 'puppeteer';

// 等待元素可见
export async function waitForVisible(page: Page, selector: string, timeout = 30000): Promise<void> {
  await page.waitForSelector(selector, {
    visible: true,
    timeout,
  });
}

// 等待元素隐藏
export async function waitForHidden(page: Page, selector: string, timeout = 30000): Promise<void> {
  await page.waitForSelector(selector, {
    hidden: true,
    timeout,
  });
}

// 等待网络空闲
export async function waitForNetworkIdle(page: Page, timeout = 30000): Promise<void> {
  await page.waitForNavigation({
    waitUntil: 'networkidle0',
    timeout,
  });
}

// 等待指定时间
export async function waitForTimeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 智能等待（等待元素出现或超时）
export async function smartWait(page: Page, selector: string, timeout = 30000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}
```

### 3. 错误处理

```typescript
// ✅ 好的错误处理
async function safeScrape(page: Page, selector: string) {
  try {
    await page.waitForSelector(selector, { timeout: 10000 });
    const content = await page.$eval(selector, (el) => el.textContent);
    return { success: true, data: content };
  } catch (error) {
    console.error(`Failed to scrape ${selector}:`, error);
    return { success: false, error: error.message };
  } finally {
    // 清理资源
    await page.close();
  }
}

// ❌ 避免
async function badScrape(page: Page, selector: string) {
  const content = await page.$eval(selector, (el) => el.textContent); // 可能抛出异常
  return content;
}
```

### 4. 性能优化

```typescript
// ✅ 拦截不必要的资源
await page.setRequestInterception(true);
page.on('request', (request) => {
  const resourceType = request.resourceType();
  if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
    request.abort();
  } else {
    request.continue();
  }
});

// ✅ 使用页面池
class PagePool {
  private pool: Page[] = [];
  private maxSize = 5;

  async getPage(): Promise<Page> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return await browser.newPage();
  }

  async releasePage(page: Page): Promise<void> {
    if (this.pool.length < this.maxSize) {
      await page.goto('about:blank');
      this.pool.push(page);
    } else {
      await page.close();
    }
  }
}

// ✅ 并发控制
import pLimit from 'p-limit';

const limit = pLimit(3); // 最多 3 个并发
const promises = urls.map((url) => limit(() => scrape(url)));
const results = await Promise.all(promises);
```

## 常用命令

### 开发命令

```bash
# 安装 Puppeteer
npm install puppeteer
npm install -D @types/puppeteer

# 安装额外工具
npm install puppeteer-cluster
npm install puppeteer-core # 不包含 Chromium

# 运行脚本
npx ts-node scripts/screenshot.ts

# 运行测试
npm run test

# 开发模式（非无头）
HEADLESS=false npm run dev
```

### 调试命令

```bash
# 启用调试日志
DEBUG=puppeteer:* npm run dev

# 生成 Trace 文件
await page.tracing.start({ path: 'trace.json' });
await page.goto('https://example.com');
await page.tracing.stop();

# 查看浏览器视图
headless: false,
devtools: true
```

## 部署配置

### 1. Docker 配置

```dockerfile
# Dockerfile
FROM node:20-slim

# 安装 Chrome 依赖
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
```

### 2. 环境变量

```env
# .env
HEADLESS=true
CHROME_PATH=/usr/bin/google-chrome
USER_AGENT=Mozilla/5.0...
CONCURRENCY=5
TIMEOUT=30000
```

### 3. CI/CD 配置

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    container:
      image: browserless/chrome:latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Run tests
        run: npm run test
        env:
          CHROME_PATH: /usr/bin/google-chrome-stable
          HEADLESS: true
```

## 相关资源

- [Puppeteer 官方文档](https://pptr.dev/)
- [Puppeteer GitHub](https://github.com/puppeteer/puppeteer)
- [API 参考](https://pptr.dev/api/)
- [Puppeteer Cluster](https://github.com/thomasdondorf/puppeteer-cluster)
- [Playwright (替代方案)](https://playwright.dev/)
- [Browserless](https://www.browserless.io/)
