# Cheerio HTML 解析模板

## 技术栈

- **HTML 解析**: Cheerio 1.0.x
- **DOM 操作**: jQuery 风格 API
- **类型支持**: @types/cheerio
- **网络请求**: axios / node-fetch
- **编码处理**: iconv-lite
- **性能优化**: 解析选项配置

## 项目结构

```
cheerio-html/
├── src/
│   ├── scrapers/            # 爬虫模块
│   │   ├── news/           # 新闻爬虫
│   │   ├── products/       # 产品爬虫
│   │   └── common/         # 通用爬虫
│   ├── parsers/            # 解析器
│   │   ├── html/           # HTML 解析
│   │   ├── tables/         # 表格解析
│   │   └── lists/          # 列表解析
│   ├── transformers/       # 数据转换
│   │   ├── clean/          # 数据清洗
│   │   ├── normalize/      # 数据标准化
│   │   └── extract/        # 数据提取
│   ├── utils/              # 工具函数
│   │   ├── request/        # 请求工具
│   │   ├── encoding/       # 编码处理
│   │   └── cache/          # 缓存工具
│   └── types/              # 类型定义
├── test/                   # 测试文件
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础 HTML 解析

```typescript
// src/parsers/html/basic.ts
import * as cheerio from 'cheerio';

// 加载 HTML
const loadHtml = (html: string) => {
  return cheerio.load(html, {
    xml: {
      xmlMode: false,
      decodeEntities: true,
    },
    decodeEntities: true,
    lowerCaseTags: false,
    lowerCaseAttributeNames: false,
  });
};

// 基础选择器
export const parseBasicElements = (html: string) => {
  const $ = loadHtml(html);

  // 查找元素
  const title = $('title').text();
  const metaDescription = $('meta[name="description"]').attr('content');
  const allLinks = $('a').toArray().map(el => $(el).attr('href'));

  // 遍历元素
  const items: string[] = [];
  $('li.item').each((index, element) => {
    items.push($(element).text().trim());
  });

  return {
    title,
    metaDescription,
    links: allLinks,
    items,
  };
};

// 提取结构化数据
export const extractStructuredData = (html: string) => {
  const $ = loadHtml(html);

  // 提取文章内容
  const article = {
    title: $('h1.article-title').text().trim(),
    author: $('span.author').text().trim(),
    publishDate: $('time.publish-date').attr('datetime'),
    content: $('div.article-content').text().trim(),
    tags: $('.tag')
      .toArray()
      .map(el => $(el).text().trim()),
  };

  return article;
};

// 提取表格数据
export const parseTable = (html: string, tableSelector: string = 'table') => {
  const $ = loadHtml(html);
  const table: string[][] = [];

  $(`${tableSelector} tr`).each((rowIndex, row) => {
    const rowData: string[] = [];
    $(row)
      .find('td, th')
      .each((colIndex, cell) => {
        rowData.push($(cell).text().trim());
      });
    if (rowData.length > 0) {
      table.push(rowData);
    }
  });

  return table;
};

// 表格转对象
export const parseTableToObjects = (html: string, tableSelector: string = 'table') => {
  const $ = loadHtml(html);
  const table = parseTable(html, tableSelector);

  if (table.length === 0) return [];

  const headers = table[0];
  const rows = table.slice(1);

  return rows.map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
};

// 提取链接
export const extractLinks = (html: string, baseUrl: string) => {
  const $ = loadHtml(html);
  const links: { text: string; href: string; absolute: string }[] = [];

  $('a').each((_, element) => {
    const $el = $(element);
    const href = $el.attr('href');
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      links.push({
        text: $el.text().trim(),
        href,
        absolute: new URL(href, baseUrl).href,
      });
    }
  });

  return links;
};

// 提取图片
export const extractImages = (html: string, baseUrl: string) => {
  const $ = loadHtml(html);
  const images: { src: string; alt: string; absolute: string }[] = [];

  $('img').each((_, element) => {
    const $el = $(element);
    const src = $el.attr('src');
    if (src) {
      images.push({
        src,
        alt: $el.attr('alt') || '',
        absolute: new URL(src, baseUrl).href,
      });
    }
  });

  return images;
};
```

### DOM 操作

```typescript
// src/parsers/html/dom-operations.ts
import * as cheerio from 'cheerio';

export class DomParser {
  private $: cheerio.CheerioAPI;

  constructor(html: string) {
    this.$ = cheerio.load(html);
  }

  // 查找元素
  find(selector: string) {
    return this.$(selector);
  }

  // 查找单个元素
  findOne(selector: string) {
    const element = this.$(selector).first();
    return element.length > 0 ? element : null;
  }

  // 获取文本
  getText(selector: string): string {
    return this.$(selector).text().trim();
  }

  // 获取属性
  getAttr(selector: string, attr: string): string | undefined {
    return this.$(selector).attr(attr);
  }

  // 获取 HTML
  getHtml(selector: string): string {
    return this.$(selector).html() || '';
  }

  // 移除元素
  remove(selector: string): this {
    this.$(selector).remove();
    return this;
  }

  // 清空元素
  empty(selector: string): this {
    this.$(selector).empty();
    return this;
  }

  // 替换文本
  replaceText(selector: string, text: string): this {
    this.$(selector).text(text);
    return this;
  }

  // 添加类
  addClass(selector: string, className: string): this {
    this.$(selector).addClass(className);
    return this;
  }

  // 移除类
  removeClass(selector: string, className: string): this {
    this.$(selector).removeClass(className);
    return this;
  }

  // 获取表单数据
  getFormData(formSelector: string = 'form') {
    const $ = this.$;
    const formData: Record<string, string> = {};

    $(`${formSelector} input, ${formSelector} select, ${formSelector} textarea`).each(
      (_, element) => {
        const $el = $(element);
        const name = $el.attr('name');
        const type = $el.attr('type');
        
        if (name) {
          if (type === 'checkbox' || type === 'radio') {
            if ($el.is(':checked')) {
              formData[name] = $el.attr('value') || 'on';
            }
          } else {
            formData[name] = $el.val() as string;
          }
        }
      }
    );

    return formData;
  }

  // 提取元数据
  getMetadata() {
    const $ = this.$;
    return {
      title: $('title').text().trim(),
      description: $('meta[name="description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content') || '',
      ogTitle: $('meta[property="og:title"]').attr('content') || '',
      ogDescription: $('meta[property="og:description"]').attr('content') || '',
      ogImage: $('meta[property="og:image"]').attr('content') || '',
      canonical: $('link[rel="canonical"]').attr('href') || '',
    };
  }

  // 提取 JSON-LD 数据
  getJsonLd() {
    const $ = this.$;
    const jsonLdData: any[] = [];

    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const content = $(element).html();
        if (content) {
          jsonLdData.push(JSON.parse(content));
        }
      } catch (error) {
        console.error('Failed to parse JSON-LD:', error);
      }
    });

    return jsonLdData;
  }

  // 获取面包屑导航
  getBreadcrumbs(selector: string = '.breadcrumb') {
    const $ = this.$;
    const breadcrumbs: { text: string; href: string }[] = [];

    $(selector)
      .find('a')
      .each((_, element) => {
        const $el = $(element);
        breadcrumbs.push({
          text: $el.text().trim(),
          href: $el.attr('href') || '',
        });
      });

    return breadcrumbs;
  }

  // 导出修改后的 HTML
  toHtml(): string {
    return this.$.html();
  }
}

// 使用示例
const html = `
  <html>
    <head>
      <title>Test Page</title>
      <meta name="description" content="A test page">
    </head>
    <body>
      <h1>Hello World</h1>
      <p class="content">This is a test.</p>
    </body>
  </html>
`;

const parser = new DomParser(html);
const title = parser.getText('h1');
const metadata = parser.getMetadata();
const cleanHtml = parser.remove('.ads').toHtml();
```

### 网络爬虫

```typescript
// src/scrapers/common/base-scraper.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';

export interface ScraperConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  delay?: number;
}

export abstract class BaseScraper {
  protected client: AxiosInstance;
  protected config: Required<ScraperConfig>;

  constructor(config: ScraperConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: config.headers || {},
      retries: config.retries || 3,
      delay: config.delay || 1000,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ScraperBot/1.0)',
        ...this.config.headers,
      },
    });
  }

  protected async fetch(url: string, options: AxiosRequestConfig = {}): Promise<string> {
    let lastError: Error | null = null;

    for (let i = 0; i < this.config.retries; i++) {
      try {
        const response = await this.client.get(url, options);
        
        // 延迟
        if (this.config.delay > 0) {
          await this.sleep(this.config.delay);
        }

        return response.data;
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${i + 1} failed:`, error);
        
        if (i < this.config.retries - 1) {
          await this.sleep(this.config.delay * (i + 1));
        }
      }
    }

    throw lastError || new Error('Failed to fetch URL');
  }

  protected loadHtml(html: string): cheerio.CheerioAPI {
    return cheerio.load(html);
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  abstract scrape(...args: any[]): Promise<any>;
}

// 新闻爬虫示例
// src/scrapers/news/news-scraper.ts
export interface NewsArticle {
  title: string;
  url: string;
  summary: string;
  author: string;
  publishDate: string;
  imageUrl?: string;
  tags: string[];
}

export class NewsScraper extends BaseScraper {
  constructor(config: ScraperConfig) {
    super(config);
  }

  async scrape(category?: string): Promise<NewsArticle[]> {
    const url = category ? `/category/${category}` : '/';
    const html = await this.fetch(url);
    return this.parseListPage(html);
  }

  async scrapeArticle(url: string): Promise<NewsArticle> {
    const html = await this.fetch(url);
    return this.parseArticlePage(html, url);
  }

  private parseListPage(html: string): NewsArticle[] {
    const $ = this.loadHtml(html);
    const articles: NewsArticle[] = [];

    $('.article-item').each((_, element) => {
      const $article = $(element);
      const link = $article.find('a').first();
      const url = link.attr('href') || '';

      articles.push({
        title: $article.find('.title').text().trim(),
        url: new URL(url, this.config.baseUrl).href,
        summary: $article.find('.summary').text().trim(),
        author: $article.find('.author').text().trim(),
        publishDate: $article.find('time').attr('datetime') || '',
        imageUrl: $article.find('img').attr('src'),
        tags: [],
      });
    });

    return articles;
  }

  private parseArticlePage(html: string, url: string): NewsArticle {
    const $ = this.loadHtml(html);

    return {
      title: $('h1').text().trim(),
      url,
      summary: $('meta[name="description"]').attr('content') || '',
      author: $('.author-name').text().trim(),
      publishDate: $('time').attr('datetime') || '',
      imageUrl: $('article img').first().attr('src'),
      tags: $('.tag')
        .toArray()
        .map(el => $(el).text().trim()),
    };
  }
}

// 使用示例
const newsScraper = new NewsScraper({
  baseUrl: 'https://news.example.com',
  delay: 2000,
});

const articles = await newsScraper.scrape('technology');
const article = await newsScraper.scrapeArticle(articles[0].url);
```

### 产品爬虫

```typescript
// src/scrapers/products/product-scraper.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  currency: string;
  description: string;
  imageUrl: string[];
  rating: number;
  reviewCount: number;
  availability: 'in-stock' | 'out-of-stock' | 'limited';
  category: string;
  url: string;
}

export class ProductScraper extends BaseScraper {
  constructor(config: ScraperConfig) {
    super(config);
  }

  async scrape(searchQuery: string): Promise<Product[]> {
    const searchUrl = `/search?q=${encodeURIComponent(searchQuery)}`;
    const html = await this.fetch(searchUrl);
    return this.parseSearchResults(html);
  }

  async scrapeProduct(url: string): Promise<Product> {
    const html = await this.fetch(url);
    return this.parseProductPage(html, url);
  }

  private parseSearchResults(html: string): Product[] {
    const $ = this.loadHtml(html);
    const products: Product[] = [];

    $('.product-item').each((_, element) => {
      const $product = $(element);
      const link = $product.find('a').first();
      const url = link.attr('href') || '';

      products.push({
        id: $product.data('id') || '',
        name: $product.find('.product-name').text().trim(),
        price: this.parsePrice($product.find('.price').text()),
        currency: 'USD',
        description: '',
        imageUrl: [$product.find('img').attr('src') || ''],
        rating: parseFloat($product.find('.rating').text()) || 0,
        reviewCount: parseInt($product.find('.review-count').text()) || 0,
        availability: 'in-stock',
        category: '',
        url: new URL(url, this.config.baseUrl).href,
      });
    });

    return products;
  }

  private parseProductPage(html: string, url: string): Product {
    const $ = this.loadHtml(html);

    const priceText = $('.price').text();
    const originalPriceText = $('.original-price').text();

    return {
      id: $('[data-product-id]').data('product-id') || '',
      name: $('h1.product-title').text().trim(),
      price: this.parsePrice(priceText),
      originalPrice: originalPriceText ? this.parsePrice(originalPriceText) : undefined,
      currency: 'USD',
      description: $('.product-description').text().trim(),
      imageUrl: $('.product-gallery img')
        .toArray()
        .map(el => $(el).attr('src') || ''),
      rating: parseFloat($('.rating-value').text()) || 0,
      reviewCount: parseInt($('.review-count').text()) || 0,
      availability: this.parseAvailability($('.availability').text()),
      category: $('.breadcrumb .category').last().text().trim(),
      url,
    };
  }

  private parsePrice(priceText: string): number {
    const match = priceText.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  }

  private parseAvailability(text: string): 'in-stock' | 'out-of-stock' | 'limited' {
    const lower = text.toLowerCase();
    if (lower.includes('out of stock')) return 'out-of-stock';
    if (lower.includes('limited')) return 'limited';
    return 'in-stock';
  }
}

// 电商网站爬虫
// src/scrapers/products/ecommerce-scraper.ts
export class EcommerceScraper extends BaseScraper {
  async scrapeCategory(categoryUrl: string, maxPages: number = 5): Promise<Product[]> {
    const products: Product[] = [];

    for (let page = 1; page <= maxPages; page++) {
      const url = `${categoryUrl}?page=${page}`;
      const html = await this.fetch(url);
      const pageProducts = this.parseCategoryPage(html);

      if (pageProducts.length === 0) break;
      products.push(...pageProducts);
    }

    return products;
  }

  private parseCategoryPage(html: string): Product[] {
    const $ = this.loadHtml(html);
    const products: Product[] = [];

    $('.product-card').each((_, element) => {
      const $card = $(element);
      
      products.push({
        id: $card.data('product-id') || '',
        name: $card.find('.product-title').text().trim(),
        price: parseFloat($card.find('.current-price').text().replace(/[^0-9.]/g, '')),
        currency: 'USD',
        description: '',
        imageUrl: [$card.find('img').attr('src') || ''],
        rating: 0,
        reviewCount: 0,
        availability: 'in-stock',
        category: '',
        url: new URL($card.find('a').attr('href') || '', this.config.baseUrl).href,
      });
    });

    return products;
  }
}
```

### 数据清洗

```typescript
// src/transformers/clean/data-cleaner.ts
import * as cheerio from 'cheerio';

// 清理 HTML 标签
export const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

// 清理空白字符
export const normalizeWhitespace = (text: string): string => {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
};

// 提取纯文本
export const extractText = (html: string): string => {
  const $ = cheerio.load(html);
  
  // 移除脚本和样式
  $('script, style').remove();
  
  // 获取文本
  const text = $('body').text();
  
  return normalizeWhitespace(text);
};

// 清理数据
export const cleanData = <T extends Record<string, any>>(
  data: T,
  cleaners: Partial<{ [K in keyof T]: (value: T[K]) => T[K] }>
): T => {
  const result = { ...data };
  
  for (const key in cleaners) {
    if (key in result && cleaners[key]) {
      result[key] = cleaners[key]!(result[key]);
    }
  }
  
  return result;
};

// 数据标准化
export const normalizeData = {
  // 价格标准化
  price: (value: string): number => {
    const match = value.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  },

  // 日期标准化
  date: (value: string): Date => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date() : date;
  },

  // URL 标准化
  url: (value: string, baseUrl?: string): string => {
    try {
      return new URL(value, baseUrl).href;
    } catch {
      return value;
    }
  },

  // 数字标准化
  number: (value: string): number => {
    const match = value.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  },

  // 布尔值标准化
  boolean: (value: string): boolean => {
    return ['true', 'yes', '1', 'on'].includes(value.toLowerCase());
  },
};

// 移除 HTML 注释
export const removeComments = (html: string): string => {
  return html.replace(/<!--[\s\S]*?-->/g, '');
};

// 提取主要文本内容
export const extractMainContent = (html: string): string => {
  const $ = cheerio.load(html);
  
  // 移除无关元素
  $('script, style, nav, header, footer, aside, .ads, .sidebar').remove();
  
  // 获取主要内容区域
  const mainContent = $('main, article, .content, .post, #content').first();
  
  if (mainContent.length > 0) {
    return normalizeWhitespace(mainContent.text());
  }
  
  return normalizeWhitespace($('body').text());
};

// 解析 HTML 实体
export const decodeHtmlEntities = (text: string): string => {
  const $ = cheerio.load('');
  return $.parseHTML(text)
    .map(el => $(el).text())
    .join('');
};

// 实际应用：清洗文章数据
export interface RawArticle {
  title: string;
  content: string;
  publishDate: string;
  author: string;
  tags: string;
}

export interface CleanArticle {
  title: string;
  content: string;
  publishDate: Date;
  author: string;
  tags: string[];
}

export const cleanArticle = (raw: RawArticle): CleanArticle => {
  return {
    title: normalizeWhitespace(stripHtmlTags(raw.title)),
    content: extractMainContent(raw.content),
    publishDate: normalizeData.date(raw.publishDate),
    author: normalizeWhitespace(raw.author),
    tags: raw.tags.split(',').map(tag => normalizeWhitespace(tag)),
  };
};
```

### 高级解析技巧

```typescript
// src/parsers/html/advanced.ts
import * as cheerio from 'cheerio';

// 分页解析
export const parsePagination = (html: string) => {
  const $ = cheerio.load(html);
  
  const currentPage = parseInt($('.pagination .current').text()) || 1;
  const totalPages = parseInt($('.pagination .last').text()) || currentPage;
  
  const nextPageLink = $('.pagination .next a').attr('href');
  const prevPageLink = $('.pagination .prev a').attr('href');
  
  return {
    currentPage,
    totalPages,
    hasNext: !!nextPageLink,
    hasPrev: !!prevPageLink,
    nextPage: nextPageLink,
    prevPage: prevPageLink,
  };
};

// 无限滚动页面解析
export const parseInfiniteScrollData = (html: string) => {
  const $ = cheerio.load(html);
  
  // 查找 JSON 数据
  const scriptTag = $('script').filter((_, el) => {
    const content = $(el).html() || '';
    return content.includes('window.__INITIAL_STATE__') || 
           content.includes('window.__DATA__');
  }).first();
  
  if (scriptTag.length === 0) return null;
  
  const content = scriptTag.html() || '';
  const jsonMatch = content.match(/window\.__(?:INITIAL_STATE__|DATA__)\s*=\s*({.*?});/);
  
  if (!jsonMatch) return null;
  
  try {
    return JSON.parse(jsonMatch[1]);
  } catch {
    return null;
  }
};

// 提取嵌套数据
export const extractNestedData = (html: string, selector: string) => {
  const $ = cheerio.load(html);
  const items: any[] = [];
  
  $(selector).each((_, element) => {
    const $el = $(element);
    const item: any = {};
    
    // 提取所有数据属性
    Object.keys($el[0].attribs)
      .filter(attr => attr.startsWith('data-'))
      .forEach(attr => {
        const key = attr.replace('data-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        item[key] = $el.attr(attr);
      });
    
    // 提取子元素
    $el.find('[data-field]').each((_, child) => {
      const $child = $(child);
      const field = $child.data('field');
      if (field) {
        item[field] = $child.text().trim();
      }
    });
    
    items.push(item);
  });
  
  return items;
};

// 动态内容检测
export const detectDynamicContent = (html: string): boolean => {
  const $ = cheerio.load(html);
  
  // 检查是否使用客户端渲染
  const hasReactRoot = $('#root, #app, [data-reactroot]').length > 0;
  const hasVueApp = $('#app, [data-v-app]').length > 0;
  const hasAngularApp = $('ng-app, [ng-app]').length > 0;
  
  // 检查是否包含动态加载脚本
  const hasLazyLoading = $('script[lazy], script[async]').length > 0;
  
  // 检查内容是否为空
  const bodyContent = $('body').text().trim();
  const hasMinimalContent = bodyContent.length < 100;
  
  return (hasReactRoot || hasVueApp || hasAngularApp) && hasMinimalContent;
};

// CSS 选择器生成
export const generateSelector = (html: string, targetText: string): string[] => {
  const $ = cheerio.load(html);
  const selectors: string[] = [];
  
  // 遍历所有元素
  $('*').each((_, element) => {
    const $el = $(element);
    const text = $el.text().trim();
    
    if (text.includes(targetText)) {
      // 生成选择器
      const tag = element.tagName.toLowerCase();
      const id = $el.attr('id');
      const classes = $el.attr('class');
      
      if (id) {
        selectors.push(`#${id}`);
      } else if (classes) {
        const classList = classes.split(' ').filter(c => c);
        selectors.push(`${tag}.${classList.join('.')}`);
      } else {
        selectors.push(tag);
      }
    }
  });
  
  return [...new Set(selectors)];
};

// 结构化数据提取
export const extractSchemaOrg = (html: string) => {
  const $ = cheerio.load(html);
  const schemas: any[] = [];
  
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const content = $(element).html();
      if (content) {
        const schema = JSON.parse(content);
        
        // 处理 @graph
        if (schema['@graph']) {
          schemas.push(...schema['@graph']);
        } else {
          schemas.push(schema);
        }
      }
    } catch (error) {
      console.error('Failed to parse schema.org data:', error);
    }
  });
  
  return schemas;
};

// 使用示例
const html = `
  <html>
    <body>
      <div class="pagination">
        <span class="prev"><a href="/page/1">Previous</a></span>
        <span class="current">2</span>
        <span class="next"><a href="/page/3">Next</a></span>
        <span class="last">10</span>
      </div>
    </body>
  </html>
`;

const pagination = parsePagination(html);
console.log(pagination);
// {
//   currentPage: 2,
//   totalPages: 10,
//   hasNext: true,
//   hasPrev: true,
//   nextPage: '/page/3',
//   prevPage: '/page/1'
// }
```

## 最佳实践

### 1. 错误处理

```typescript
// src/utils/request/error-handling.ts
import * as cheerio from 'cheerio';

export const safeParse = <T>(
  html: string,
  parser: ($: cheerio.CheerioAPI) => T,
  fallback: T
): T => {
  try {
    const $ = cheerio.load(html);
    return parser($);
  } catch (error) {
    console.error('Parse error:', error);
    return fallback;
  }
};

export const safeExtract = (
  $: cheerio.CheerioAPI,
  selector: string,
  extractor: ($el: cheerio.Cheerio<any>) => string
): string => {
  try {
    const element = $(selector).first();
    return element.length > 0 ? extractor(element) : '';
  } catch {
    return '';
  }
};

// 使用示例
const title = safeExtract($, 'h1.title', $el => $el.text().trim());
```

### 2. 性能优化

```typescript
// src/utils/performance/optimization.ts
import * as cheerio from 'cheerio';

// 优化加载选项
export const loadOptimized = (html: string) => {
  return cheerio.load(html, {
    xml: {
      xmlMode: false,
      decodeEntities: false, // 关闭解码以提高性能
    },
    decodeEntities: false,
    lowerCaseTags: false,
    lowerCaseAttributeNames: false,
  });
};

// 批量解析
export const batchParse = <T>(
  htmlItems: string[],
  parser: (html: string) => T
): T[] => {
  return htmlItems.map(parser);
};

// 选择器缓存
export class SelectorCache {
  private cache = new Map<string, any>();

  get<T>(key: string, factory: () => T): T {
    if (!this.cache.has(key)) {
      this.cache.set(key, factory());
    }
    return this.cache.get(key);
  }

  clear() {
    this.cache.clear();
  }
}
```

### 3. 类型安全

```typescript
// src/types/cheerio.d.ts
import * as cheerio from 'cheerio';

declare module 'cheerio' {
  interface CheerioAPI {
    // 添加自定义方法
    extractText(selector: string): string;
    extractAttr(selector: string, attr: string): string | undefined;
  }
}

// 类型安全的解析器
export interface Parser<T> {
  parse(html: string): T;
}

export class TypedParser<T> implements Parser<T> {
  constructor(
    private selectors: { [K in keyof T]: string },
    private transformers?: { [K in keyof T]?: (value: string) => T[K] }
  ) {}

  parse(html: string): T {
    const $ = cheerio.load(html);
    const result: Partial<T> = {};

    for (const key in this.selectors) {
      const selector = this.selectors[key];
      const value = $(selector).text().trim();
      
      result[key] = this.transformers?.[key]
        ? this.transformers[key]!(value)
        : (value as any);
    }

    return result as T;
  }
}

// 使用示例
interface ProductData {
  name: string;
  price: number;
  rating: number;
}

const productParser = new TypedParser<ProductData>(
  {
    name: '.product-name',
    price: '.product-price',
    rating: '.product-rating',
  },
  {
    price: (v) => parseFloat(v.replace('$', '')),
    rating: (v) => parseFloat(v),
  }
);

const product = productParser.parse(html);
```

## 常用命令

```bash
# 安装依赖
npm install cheerio
npm install --save-dev @types/cheerio

# 运行爬虫
npm run scrape

# 测试
npm test

# 类型检查
npm run type-check

# 构建生产版本
npm run build
```

## 部署配置

### Package.json

```json
{
  "dependencies": {
    "cheerio": "^1.0.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/cheerio": "^0.22.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  },
  "scripts": {
    "scrape": "ts-node src/index.ts",
    "test": "jest",
    "type-check": "tsc --noEmit",
    "build": "tsc"
  }
}
```

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 参考资源

- [Cheerio 官方文档](https://cheerio.js.org/)
- [Cheerio GitHub](https://github.com/cheeriojs/cheerio)
- [jQuery API 文档](https://api.jquery.com/)
- [MDN Web Docs - XPath](https://developer.mozilla.org/en-US/docs/Web/XPath)
- [Node.js 网络爬虫教程](https://www.digitalocean.com/community/tutorials/how-to-write-a-web-scraper-in-node-js)
