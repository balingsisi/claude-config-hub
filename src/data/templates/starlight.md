# Starlight 文档站点模板

## 技术栈

- **Starlight**: Astro 文档主题
- **Astro**: 现代静态站点生成器
- **TypeScript**: 类型支持
- **Tailwind CSS**: 样式框架
- **MDX**: 增强 Markdown

## 项目结构

```
starlight-docs/
├── src/
│   ├── components/
│   │   ├── Header.astro       # 自定义头部
│   │   ├── Footer.astro       # 自定义底部
│   │   ├── Sidebar.astro      # 侧边栏
│   │   └── Custom.astro       # 自定义组件
│   ├── layouts/
│   │   └── Layout.astro       # 基础布局
│   ├── content/
│   │   ├── docs/              # 文档内容
│   │   │   ├── index.mdx
│   │   │   ├── getting-started.mdx
│   │   │   └── api-reference.mdx
│   │   └── config.ts          # 内容配置
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── custom.css
├── public/
│   ├── favicon.svg
│   └── images/
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## 代码模式

### Astro 配置

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://your-docs.com',
  integrations: [
    mdx(),
    tailwind(),
    starlight({
      title: 'My Documentation',
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: true
      },
      social: {
        github: 'https://github.com/your-repo',
        twitter: 'https://twitter.com/your-handle',
        discord: 'https://discord.gg/your-invite'
      },
      sidebar: [
        {
          label: '开始',
          items: [
            { label: '介绍', slug: 'intro' },
            { label: '快速开始', slug: 'getting-started' },
            { label: '安装', slug: 'installation' }
          ]
        },
        {
          label: '核心概念',
          items: [
            { label: '架构', slug: 'architecture' },
            { label: '组件', slug: 'components' },
            { label: '状态管理', slug: 'state-management' }
          ]
        },
        {
          label: 'API 参考',
          autogenerate: { directory: 'api' }
        }
      ],
      customCss: [
        './src/styles/custom.css'
      ],
      editLink: {
        baseUrl: 'https://github.com/your-repo/edit/main/'
      },
      lastUpdated: true,
      pagination: true,
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 4
      },
      locales: {
        root: {
          label: '简体中文',
          lang: 'zh-CN'
        },
        en: {
          label: 'English',
          lang: 'en-US'
        }
      },
      defaultLocale: 'root'
    })
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  }
});
```

### 内容配置

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const docsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date().optional(),
    updatedDate: z.date().optional(),
    heroImage: z.string().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().default(false)
  })
});

export const collections = {
  docs: docsCollection
};
```

### 文档内容示例

```mdx
---
# src/content/docs/getting-started.mdx
title: 快速开始
description: 5分钟快速上手指南
---

import { Steps } from '@astrojs/starlight/components';
import Tabs from '../components/Tabs.astro';
import Callout from '../components/Callout.astro';

# 快速开始

欢迎使用我们的文档！本指南将帮助你在5分钟内完成设置。

<Steps>

## 安装

<Tabs tabs={['npm', 'yarn', 'pnpm']}>
  <div slot="npm">
  ```bash
  npm install my-package
  ```
  </div>
  
  <div slot="yarn">
  ```bash
  yarn add my-package
  ```
  </div>
  
  <div slot="pnpm">
  ```bash
  pnpm add my-package
  ```
  </div>
</Tabs>

## 配置

创建配置文件 `config.js`：

```js title="config.js"
export default {
  apiKey: 'your-api-key',
  environment: 'development'
};
```

<Callout type="info">
  💡 提示：请确保将 API Key 保存在环境变量中，不要硬编码在代码中。
</Callout>

## 初始化

```ts title="index.ts"
import { init } from 'my-package';

init({
  apiKey: process.env.API_KEY
});
```

</Steps>

## 下一步

- [了解核心概念](/core-concepts)
- [查看 API 参考](/api-reference)
- [阅读最佳实践](/best-practices)
```

### 自定义组件

```astro
---
// src/components/Callout.astro
interface Props {
  type?: 'info' | 'warning' | 'error' | 'success';
}

const { type = 'info' } = Astro.props;

const icons = {
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  success: '✅'
};

const colors = {
  info: 'bg-blue-50 border-blue-500',
  warning: 'bg-yellow-50 border-yellow-500',
  error: 'bg-red-50 border-red-500',
  success: 'bg-green-50 border-green-500'
};
---

<div class={`callout ${colors[type]} border-l-4 p-4 my-4 rounded`}>
  <div class="flex items-start">
    <span class="text-xl mr-3">{icons[type]}</span>
    <div class="flex-1">
      <slot />
    </div>
  </div>
</div>
```

```astro
---
// src/components/Tabs.astro
interface Props {
  tabs: string[];
}

const { tabs } = Astro.props;
---

<div class="tabs">
  <div class="tabs-header flex gap-2 border-b border-gray-200 mb-4">
    {tabs.map((tab, index) => (
      <button
        class:list={[
          'tab-button px-4 py-2 font-medium transition-colors',
          index === 0 ? 'active border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
        ]}
        data-tab={tab}
      >
        {tab}
      </button>
    ))}
  </div>
  
  <div class="tabs-content">
    <slot />
  </div>
</div>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.tab-button');
    
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tabName = target.dataset.tab;
        
        // 更新按钮状态
        buttons.forEach(btn => {
          btn.classList.remove('active', 'border-b-2', 'border-blue-500', 'text-blue-600');
          btn.classList.add('text-gray-500');
        });
        target.classList.add('active', 'border-b-2', 'border-blue-500', 'text-blue-600');
        target.classList.remove('text-gray-500');
        
        // 更新内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.add('hidden');
        });
        document.querySelector(`[data-content="${tabName}"]`)?.classList.remove('hidden');
      });
    });
  });
</script>
```

```astro
---
// src/components/CardGrid.astro
interface Props {
  columns?: 2 | 3 | 4;
}

const { columns = 3 } = Astro.props;
---

<div class:list={[
  'grid gap-6 my-8',
  columns === 2 && 'md:grid-cols-2',
  columns === 3 && 'md:grid-cols-3',
  columns === 4 && 'md:grid-cols-4'
]}>
  <slot />
</div>
```

```astro
---
// src/components/Card.astro
interface Props {
  title: string;
  icon?: string;
  href?: string;
}

const { title, icon, href } = Astro.props;
---

<a href={href} class="block group">
  <div class="card p-6 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all">
    {icon && <div class="text-3xl mb-3">{icon}</div>}
    <h3 class="text-lg font-semibold group-hover:text-blue-600">{title}</h3>
    <slot />
  </div>
</a>
```

### 自定义布局

```astro
---
// src/layouts/Layout.astro
interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content={description}>
  <title>{title}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="canonical" href={Astro.url.href}>
</head>
<body class="min-h-screen bg-white dark:bg-gray-900">
  <slot />
</body>
</html>
```

### 自定义样式

```css
/* src/styles/custom.css */
:root {
  --sl-font: 'Inter', system-ui, sans-serif;
  --sl-color-bg: #ffffff;
  --sl-color-bg-sidebar: #f8fafc;
  --sl-color-text: #1e293b;
  --sl-color-text-muted: #64748b;
  --sl-color-accent: #3b82f6;
  --sl-color-accent-low: #eff6ff;
  --sl-color-border: #e2e8f0;
}

/* 暗色主题 */
:root[data-theme='dark'] {
  --sl-color-bg: #0f172a;
  --sl-color-bg-sidebar: #1e293b;
  --sl-color-text: #f1f5f9;
  --sl-color-text-muted: #94a3b8;
  --sl-color-accent-low: #1e3a8a;
  --sl-color-border: #334155;
}

/* 代码块样式 */
pre {
  border-radius: 0.5rem;
  margin: 1.5rem 0;
}

code {
  font-family: 'Fira Code', monospace;
  font-size: 0.9em;
}

/* 表格样式 */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
}

th, td {
  border: 1px solid var(--sl-color-border);
  padding: 0.75rem 1rem;
  text-align: left;
}

th {
  background-color: var(--sl-color-bg-sidebar);
  font-weight: 600;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--sl-color-bg);
}

::-webkit-scrollbar-thumb {
  background: var(--sl-color-text-muted);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--sl-color-text);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
  
  .mobile-menu {
    display: block;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
```

### 搜索集成

```ts
// src/components/Search.astro
// 使用 Pagefind 搜索
---
<div id="search" class="search-container">
  <button id="search-button" class="search-button">
    <svg>...</svg>
    <span>搜索文档...</span>
    <kbd>⌘K</kbd>
  </button>
</div>

<script>
  import '@pagefind/default-ui/css/ui.css';
  
  window.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('search-button');
    
    // 快捷键监听
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    });
    
    searchButton?.addEventListener('click', openSearch);
  });
  
  async function openSearch() {
    const { PagefindUI } = await import('@pagefind/default-ui');
    
    const container = document.createElement('div');
    container.id = 'search-modal';
    document.body.appendChild(container);
    
    new PagefindUI({
      element: '#search-modal',
      showSubResults: true,
      showImages: false
    });
  }
</script>
```

### API 文档组件

```astro
---
// src/components/APIEndpoint.astro
interface Props {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  auth?: boolean;
}

const { method, path, auth = false } = Astro.props;

const methodColors = {
  GET: 'bg-green-500',
  POST: 'bg-blue-500',
  PUT: 'bg-yellow-500',
  DELETE: 'bg-red-500',
  PATCH: 'bg-purple-500'
};
---

<div class="api-endpoint border border-gray-200 rounded-lg overflow-hidden my-6">
  <div class="flex items-center gap-3 p-4 bg-gray-50">
    <span class:list={['px-3 py-1 text-white text-sm font-bold rounded', methodColors[method]]}>
      {method}
    </span>
    <code class="flex-1 text-sm font-mono">{path}</code>
    {auth && (
      <span class="text-xs bg-gray-200 px-2 py-1 rounded">
        🔒 需要认证
      </span>
    )}
  </div>
  
  <div class="p-4">
    <slot />
  </div>
</div>
```

```astro
---
// src/components/ResponseExample.astro
interface Props {
  status: number;
  title?: string;
}

const { status, title } = Astro.props;
---

<div class="response-example my-4">
  <div class="flex items-center gap-2 mb-2">
    <span class="font-semibold">{title || '响应示例'}</span>
    <span class:list={[
      'text-sm px-2 py-1 rounded',
      status >= 200 && status < 300 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    ]}>
      {status}
    </span>
  </div>
  
  <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
    <code><slot /></code>
  </pre>
</div>
```

### 版本切换器

```astro
---
// src/components/VersionSwitcher.astro
const versions = [
  { name: 'v3.0 (最新)', path: '/' },
  { name: 'v2.5', path: '/v2.5/' },
  { name: 'v2.0', path: '/v2.0/' }
];

const currentVersion = 'v3.0';
---

<div class="version-switcher relative inline-block">
  <button 
    class="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded hover:bg-gray-50"
    id="version-button"
  >
    <span>{currentVersion}</span>
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
    </svg>
  </button>
  
  <div class="dropdown hidden absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
    {versions.map(version => (
      <a
        href={version.path}
        class:list={[
          'block px-4 py-2 hover:bg-gray-50',
          version.name.includes(currentVersion) && 'font-semibold'
        ]}
      >
        {version.name}
      </a>
    ))}
  </div>
</div>

<script>
  const button = document.getElementById('version-button');
  const dropdown = document.querySelector('.dropdown');
  
  button?.addEventListener('click', () => {
    dropdown?.classList.toggle('hidden');
  });
  
  document.addEventListener('click', (e) => {
    if (!button?.contains(e.target as Node)) {
      dropdown?.classList.add('hidden');
    }
  });
</script>
```

## 最佳实践

### 1. 自动生成侧边栏

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import fs from 'fs';
import path from 'path';

function generateSidebar() {
  const docsPath = './src/content/docs';
  const categories = fs.readdirSync(docsPath);
  
  return categories.map(category => ({
    label: category,
    autogenerate: { directory: category }
  }));
}

export default defineConfig({
  integrations: [
    starlight({
      title: 'My Docs',
      sidebar: generateSidebar()
    })
  ]
});
```

### 2. i18n 支持

```ts
// src/i18n/ui.ts
export const languages = {
  'zh-CN': {
    'nav.getStarted': '开始使用',
    'nav.guide': '指南',
    'nav.api': 'API 参考',
    'search.placeholder': '搜索文档...'
  },
  'en-US': {
    'nav.getStarted': 'Get Started',
    'nav.guide': 'Guide',
    'nav.api': 'API Reference',
    'search.placeholder': 'Search docs...'
  }
} as const;

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in languages) return lang as keyof typeof languages;
  return 'zh-CN';
}
```

### 3. 链接检查

```js
// scripts/check-links.js
import { globby } from 'globby';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkLinks() {
  const files = await globby('dist/**/*.html');
  const brokenLinks = [];
  
  for (const file of files) {
    const { stdout } = await execAsync(`linkchecker ${file}`);
    if (stdout.includes('404')) {
      brokenLinks.push(file);
    }
  }
  
  if (brokenLinks.length > 0) {
    console.error('发现失效链接:', brokenLinks);
    process.exit(1);
  }
}

checkLinks();
```

### 4. 自动部署

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 5. 内容校验

```ts
// scripts/validate-content.ts
import { globby } from 'globby';
import matter from 'gray-matter';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1),
  description: z.string().min(10),
  author: z.string(),
  pubDate: z.string().datetime()
});

async function validateContent() {
  const files = await globby('src/content/**/*.mdx');
  const errors = [];
  
  for (const file of files) {
    const content = matter.read(file);
    
    try {
      schema.parse(content.data);
    } catch (error) {
      errors.push({ file, error });
    }
  }
  
  if (errors.length > 0) {
    console.error('内容校验失败:', errors);
    process.exit(1);
  }
  
  console.log('✅ 所有内容校验通过');
}

validateContent();
```

## 常用命令

### 开发

```bash
# 安装依赖
npm install @astrojs/starlight @astrojs/tailwind @astrojs/mdx

# 开发模式
npm run dev

# 构建
npm run build

# 预览
npm run preview

# 类型检查
npm run typecheck
```

### 内容管理

```bash
# 创建新文档
npm run new:doc getting-started

# 构建搜索索引
npm run build:search

# 检查链接
npm run check:links

# 验证内容
npm run validate
```

## 部署配置

### Vercel

```json
// vercel.json
{
  "framework": "astro",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

### Netlify

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Docker

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

## SEO 优化

### Meta 标签

```astro
---
// src/components/SEO.astro
interface Props {
  title: string;
  description: string;
  image?: string;
}

const { title, description, image = '/og-image.png' } = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
---

<!-- Primary Meta Tags -->
<title>{title}</title>
<meta name="title" content={title}>
<meta name="description" content={description}>

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:url" content={canonicalURL}>
<meta property="og:title" content={title}>
<meta property="og:description" content={description}>
<meta property="og:image" content={image}>

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content={canonicalURL}>
<meta property="twitter:title" content={title}>
<meta property="twitter:description" content={description}>
<meta property="twitter:image" content={image}>

<!-- Canonical -->
<link rel="canonical" href={canonicalURL}>
```

### Sitemap

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://your-docs.com',
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date()
    })
  ]
});
```
