# Vitepress 文档站点模板

## 技术栈

- **核心框架**: Vitepress 1.x (基于 Vite)
- **UI框架**: Vue 3 (内置)
- **样式**: 支持原生 CSS/SCSS
- **搜索**: 本地搜索 / Algolia DocSearch
- **部署**: Vercel / Netlify / GitHub Pages

## 项目结构

```
docs/
├── .vitepress/
│   ├── config.mts          # 主配置文件
│   ├── theme/
│   │   ├── index.ts        # 主题配置
│   │   ├── Layout.vue      # 自定义布局
│   │   ├── custom.css      # 自定义样式
│   │   └── components/     # 自定义组件
│   └── cache/              # 构建缓存
├── public/                 # 静态资源
│   ├── images/
│   └── favicon.ico
├── guide/                  # 指南文档
│   ├── index.md
│   ├── getting-started.md
│   └── advanced.md
├── api/                    # API 文档
│   ├── index.md
│   └── reference.md
├── index.md                # 首页
└── package.json
```

## 代码模式

### 配置文件 (.vitepress/config.mts)

```typescript
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'My Documentation',
  description: 'A VitePress Site',
  lang: 'zh-CN',
  
  // 主题配置
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'My Docs',
    
    // 导航
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'Config', link: '/config/' }
    ],
    
    // 侧边栏
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Quick Start', link: '/guide/getting-started' }
          ]
        }
      ]
    },
    
    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/...' }
    ],
    
    // 搜索
    search: {
      provider: 'local' // 或 'algolia'
    },
    
    // 页脚
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present'
    },
    
    // 编辑链接
    editLink: {
      pattern: 'https://github.com/.../edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },
    
    // 最后更新时间
    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    }
  },
  
  // Markdown 配置
  markdown: {
    lineNumbers: true,
    math: true,
    // 自定义代码块
    config: (md) => {
      // 自定义 markdown-it 插件
    }
  },
  
  // 构建配置
  cleanUrls: true,
  lastUpdated: true,
  
  // Head 配置
  head: [
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'og:type', content: 'website' }]
  ]
})
```

### 自定义主题 (.vitepress/theme/index.ts)

```typescript
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import MyLayout from './Layout.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: MyLayout,
  enhanceApp({ app, router, siteData }) {
    // 注册全局组件
    app.component('MyComponent', () => import('./components/MyComponent.vue'))
    
    // 路由守卫
    router.onBeforeRouteChange = (to) => {
      console.log('Route change:', to)
    }
  },
  setup() {},
  // 其他配置
} satisfies Theme
```

### 自定义布局 (.vitepress/theme/Layout.vue)

```vue
<script setup lang="ts">
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

const { Layout } = DefaultTheme
const { frontmatter } = useData()
</script>

<template>
  <Layout>
    <!-- 自定义首页 -->
    <template #home-hero-before>
      <div class="custom-hero">Welcome!</div>
    </template>
    
    <!-- 自定义内容区域 -->
    <template #doc-before>
      <div v-if="frontmatter.draft" class="draft-notice">
        This is a draft
      </div>
    </template>
    
    <!-- 自定义页脚 -->
    <template #doc-footer-before>
      <div class="custom-footer">Custom footer</div>
    </template>
  </Layout>
</template>

<style scoped>
.custom-hero {
  /* styles */
}
</style>
```

### Markdown 文档示例

```markdown
---
title: Custom Title
description: Custom description
layout: doc
---

# Introduction

This is a paragraph with **bold** and *italic* text.

## Code Blocks

\`\`\`typescript
interface User {
  id: number
  name: string
}

function greet(user: User): string {
  return `Hello, ${user.name}!`
}
\`\`\`

## Custom Containers

::: tip
This is a tip
:::

::: warning
This is a warning
:::

::: danger
This is a dangerous warning
:::

## API Documentation

### `functionName`

\`\`\`typescript
function functionName(param: string): number
\`\`\`

**Parameters:**
- `param` (string) - Description

**Returns:** number

## Math Equations

Inline: $E = mc^2$

Block:
$$
\frac{\partial f}{\partial x} = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}
$$
```

### 自定义组件 (docs/.vitepress/components/)

```vue
<!-- .vitepress/theme/components/FeatureCard.vue -->
<script setup lang="ts">
defineProps<{
  title: string
  description: string
  icon?: string
}>()
</script>

<template>
  <div class="feature-card">
    <div v-if="icon" class="icon">{{ icon }}</div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
  </div>
</template>

<style scoped>
.feature-card {
  padding: 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}
</style>
```

## 最佳实践

### 1. 文档组织

- **清晰层级**: 使用明确的目录结构
- **命名规范**: 文件名使用 kebab-case
- **索引文件**: 每个目录包含 index.md

### 2. SEO 优化

```typescript
// .vitepress/config.mts
export default defineConfig({
  head: [
    ['meta', { name: 'description', content: '...' }],
    ['meta', { name: 'keywords', content: '...' }],
    ['meta', { property: 'og:title', content: '...' }],
    ['meta', { property: 'og:description', content: '...' }],
    ['meta', { property: 'og:image', content: '...' }],
    ['link', { rel: 'canonical', href: '...' }]
  ],
  
  sitemap: {
    hostname: 'https://example.com'
  },
  
  robotsTxt: true
})
```

### 3. 版本管理

```typescript
// 多版本支持
export default defineConfig({
  locales: {
    root: {
      label: 'v2.0',
      lang: 'en',
      link: '/'
    },
    v1: {
      label: 'v1.0',
      lang: 'en',
      link: '/v1/'
    }
  }
})
```

### 4. 性能优化

- **懒加载图片**: 使用 `loading="lazy"`
- **代码分割**: 自动按页面分割
- **资源优化**: 压缩图片，使用 WebP
- **CDN 加速**: 静态资源托管到 CDN

### 5. 可访问性

- **语义化 HTML**: 使用正确的标签
- **Alt 文本**: 图片添加描述
- **键盘导航**: 确保可键盘操作
- **对比度**: 符合 WCAG 标准

### 6. 团队协作

```yaml
# .github/workflows/docs.yml
name: Deploy Docs

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install
        run: npm ci
      
      - name: Build
        run: npm run docs:build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: docs/.vitepress/dist
```

## 常用命令

### 开发命令

```bash
# 安装依赖
npm install -D vitepress

# 启动开发服务器
npm run docs:dev
# 或
npx vitepress dev docs

# 构建生产版本
npm run docs:build
# 或
npx vitepress build docs

# 预览构建结果
npm run docs:preview
# 或
npx vitepress preview docs
```

### 内容管理

```bash
# 创建新文档
touch docs/guide/new-page.md

# 添加图片
cp ~/Downloads/image.png docs/public/images/

# 生成侧边栏配置 (使用工具)
npx vitepress-sidebar
```

### 部署相关

```bash
# 构建静态文件
npm run docs:build

# 本地预览
npm run docs:preview

# 部署到 GitHub Pages
git add docs/.vitepress/dist
git commit -m "Deploy docs"
git subtree push --prefix docs/.vitepress/dist origin gh-pages
```

### 主题开发

```bash
# 查看主题变量
npm run docs:dev -- --debug

# 清除缓存
rm -rf docs/.vitepress/cache
rm -rf docs/.vitepress/dist
```

## 部署配置

### Vercel 部署

```json
// vercel.json
{
  "buildCommand": "npm run docs:build",
  "outputDirectory": "docs/.vitepress/dist",
  "framework": "vitepress",
  "cleanUrls": true
}
```

### Netlify 部署

```toml
# netlify.toml
[build]
  command = "npm run docs:build"
  publish = "docs/.vitepress/dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### GitHub Pages 部署

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run docs:build
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist
  
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY docs ./docs
RUN npm run docs:build

FROM nginx:alpine

COPY --from=builder /app/docs/.vitepress/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ $uri.html /index.html;
    }
    
    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 自动化部署脚本

```bash
#!/bin/bash
# deploy.sh

set -e

echo "Building documentation..."
npm run docs:build

echo "Deploying to production..."
# Vercel
vercel --prod

# 或 Netlify
# netlify deploy --prod --dir=docs/.vitepress/dist

# 或自定义服务器
# rsync -avz docs/.vitepress/dist/ user@server:/var/www/docs/

echo "Deployment complete!"
```

## 进阶功能

### 国际化 (i18n)

```typescript
// .vitepress/config.mts
export default defineConfig({
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [...],
        sidebar: {...}
      }
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        nav: [...],
        sidebar: {...}
      }
    }
  }
})
```

### 自定义 Markdown 插件

```typescript
// .vitepress/config.mts
import markdownItKbd from 'markdown-it-kbd'

export default defineConfig({
  markdown: {
    config: (md) => {
      md.use(markdownItKbd)
    }
  }
})
```

### 集成评论系统

```vue
<!-- .vitepress/theme/components/Comments.vue -->
<script setup lang="ts">
import { useData } from 'vitepress'
import { onMounted, ref } from 'vue'

const { title } = useData()
const loaded = ref(false)

onMounted(() => {
  // 加载评论系统 (如 Giscus)
  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.setAttribute('data-repo', 'your/repo')
  script.setAttribute('data-repo-id', '...')
  script.setAttribute('data-category', 'Announcements')
  script.setAttribute('data-mapping', 'pathname')
  script.setAttribute('data-theme', 'preferred_color_scheme')
  script.crossOrigin = 'anonymous'
  script.async = true
  
  document.querySelector('.giscus')?.appendChild(script)
  loaded.value = true
})
</script>

<template>
  <div class="giscus"></div>
</template>
```

### 数据获取

```vue
<!-- docs/.vitepress/components/DataFetcher.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const data = ref(null)

onMounted(async () => {
  const response = await fetch('https://api.example.com/data')
  data.value = await response.json()
})
</script>

<template>
  <div v-if="data">
    <!-- 显示数据 -->
  </div>
</template>
```

## 工具集成

### Algolia DocSearch

```typescript
// .vitepress/config.mts
export default defineConfig({
  themeConfig: {
    search: {
      provider: 'algolia',
      options: {
        appId: 'YOUR_APP_ID',
        apiKey: 'YOUR_API_KEY',
        indexName: 'YOUR_INDEX_NAME',
        locales: {
          zh: {
            placeholder: '搜索文档',
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档'
              }
            }
          }
        }
      }
    }
  }
})
```

### Google Analytics

```typescript
// .vitepress/config.mts
export default defineConfig({
  head: [
    [
      'script',
      {
        async: true,
        src: 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID'
      }
    ],
    [
      'script',
      {},
      `window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'GA_MEASUREMENT_ID');`
    ]
  ]
})
```

### PWA 支持

```typescript
// .vitepress/config.mts
import { withPwa } from '@vite-pwa/vitepress'

export default withPwa(defineConfig({
  pwa: {
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'robots.txt'],
    manifest: {
      name: 'My Docs',
      short_name: 'Docs',
      theme_color: '#3eaf7c',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    }
  }
}))
```

## 故障排查

### 常见问题

1. **热重载不工作**
   ```bash
   # 清除缓存
   rm -rf docs/.vitepress/cache
   npm run docs:dev
   ```

2. **构建失败**
   ```bash
   # 调试模式
   npm run docs:build -- --debug
   ```

3. **样式不生效**
   - 检查 CSS 作用域
   - 使用 `:global()` 突破作用域

4. **链接失效**
   - 使用相对路径
   - 启用 `cleanUrls` 配置

5. **搜索不工作**
   - 检查 Algolia 配置
   - 确保索引已构建

### 性能监控

```typescript
// .vitepress/theme/index.ts
export default {
  enhanceApp() {
    if (typeof window !== 'undefined') {
      // 监控性能
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('[Performance]', entry.name, entry.duration)
        }
      })
      observer.observe({ entryTypes: ['measure', 'navigation'] })
    }
  }
}
```
