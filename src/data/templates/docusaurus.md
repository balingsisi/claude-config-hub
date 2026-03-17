# Docusaurus 文档站点模板

## 技术栈

- **核心框架**: Docusaurus 3.x
- **基础**: React 18
- **构建工具**: Webpack 5
- **样式**: CSS Modules / Tailwind CSS
- **Markdown**: MDX 支持
- **搜索**: Algolia DocSearch / 本地搜索
- **部署**: Vercel / Netlify / GitHub Pages

## 项目结构

```
my-docs/
├── blog/                    # 博客文章
│   ├── 2024-01-01-welcome.md
│   ├── 2024-01-15-update.md
│   └── authors.yml          # 作者信息
├── docs/                    # 文档目录
│   ├── intro.md
│   ├── tutorial-basics/
│   │   ├── _category_.json
│   │   ├── create-a-page.md
│   │   └── create-a-document.md
│   └── tutorial-extras/
├── src/                     # 自定义代码
│   ├── components/          # React 组件
│   │   └── HomepageFeatures/
│   │       ├── index.js
│   │       └── styles.module.css
│   ├── css/                 # 自定义样式
│   │   └── custom.css
│   ├── pages/               # 自定义页面
│   │   ├── index.js         # 首页
│   │   └── index.module.css
│   └── theme/               # 主题覆盖
│       └── Navbar/
├── static/                  # 静态资源
│   └── img/
│       ├── logo.svg
│       └── favicon.ico
├── docusaurus.config.js     # 主配置文件
├── sidebars.js              # 侧边栏配置
├── package.json
└── README.md
```

## 代码模式

### 配置文件 (docusaurus.config.js)

```javascript
// @ts-check
const lightCodeTheme = require('prism-react-renderer/themes/github')
const darkCodeTheme = require('prism-react-renderer/themes/dracula')

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'My Site',
  tagline: 'Dinosaurs are cool',
  favicon: 'img/favicon.ico',
  
  // 生产环境的 URL
  url: 'https://your-docusaurus-site.example.com',
  baseUrl: '/',
  
  // GitHub 配置
  organizationName: 'facebook',
  projectName: 'docusaurus',
  
  // 部署分支
  deploymentBranch: 'gh-pages',
  
  // i18n 配置
  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['zh-CN', 'en'],
    localeConfigs: {
      'zh-CN': {
        label: '简体中文',
        direction: 'ltr'
      },
      en: {
        label: 'English',
        direction: 'ltr'
      }
    }
  },
  
  // 预设配置
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/.../tree/main/',
          remarkPlugins: [],
          rehypePlugins: [],
          // 版本管理
          lastVersion: 'current',
          versions: {
            current: {
              label: 'Next',
              path: 'next'
            }
          }
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/.../tree/main/',
          blogSidebarCount: 'ALL',
          blogSidebarTitle: 'All posts',
          postsPerPage: 10
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css')
        },
        gtag: {
          trackingID: 'G-XXXXXXX',
          anonymizeIP: true
        }
      })
    ]
  ],
  
  // 主题配置
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true
        }
      },
      navbar: {
        title: 'My Site',
        logo: {
          alt: 'My Site Logo',
          src: 'img/logo.svg',
          srcDark: 'img/logo_dark.svg'
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: 'Tutorial'
          },
          {
            to: '/blog',
            label: 'Blog',
            position: 'left'
          },
          {
            href: 'https://github.com/...',
            label: 'GitHub',
            position: 'right'
          },
          {
            type: 'localeDropdown',
            position: 'right'
          },
          {
            type: 'search',
            position: 'right'
          }
        ]
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Tutorial',
                to: '/docs/intro'
              }
            ]
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/...'
              },
              {
                label: 'Discord',
                href: 'https://discordapp.com/...'
              }
            ]
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog'
              },
              {
                label: 'GitHub',
                href: 'https://github.com/...'
              }
            ]
          }
        ],
        copyright: `Copyright © ${new Date().getFullYear()} My Project. Built with Docusaurus.`
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['rust', 'typescript', 'python']
      },
      algolia: {
        appId: 'YOUR_APP_ID',
        apiKey: 'YOUR_API_KEY',
        indexName: 'YOUR_INDEX_NAME',
        contextualSearch: true
      },
      announcementBar: {
        id: 'support_us',
        content:
          'We are looking for contributors! <a target="_blank" rel="noopener noreferrer" href="#">Join us!</a>',
        backgroundColor: '#fafbfc',
        textColor: '#091E42',
        isCloseable: false
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true
      }
    }),
  
  // 插件配置
  plugins: [
    [
      '@docusaurus/plugin-ideal-image',
      {
        quality: 70,
        max: 1030,
        min: 640,
        steps: 2,
        disableInDev: false
      }
    ],
    [
      '@docusaurus/plugin-pwa',
      {
        debug: true,
        offlineModeActivationStrategies: [
          'appInstalled',
          'standalone',
          'queryString'
        ],
        pwaHead: [
          {
            tagName: 'link',
            rel: 'icon',
            href: '/img/docusaurus.png'
          },
          {
            tagName: 'link',
            rel: 'manifest',
            href: '/manifest.json'
          },
          {
            tagName: 'meta',
            name: 'theme-color',
            content: 'rgb(37, 194, 160)'
          }
        ]
      }
    ],
    [
      'docusaurus-plugin-plausible',
      {
        domain: 'your-domain.com'
      }
    ]
  ],
  
  // 主题配置
  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['en', 'zh'],
        indexBlog: true,
        indexDocs: true
      }
    ]
  ],
  
  // Webpack 配置
  webpack: {
    jsLoader: (isServer) => ({
      loader: require.resolve('swc-loader'),
      options: {
        jsc: {
          target: 'es2017',
          parser: {
            syntax: 'typescript',
            tsx: true
          },
          transform: {
            react: {
              runtime: 'automatic'
            }
          }
        },
        module: {
          type: isServer ? 'commonjs' : 'es6'
        }
      }
    })
  }
}

module.exports = config
```

### 侧边栏配置 (sidebars.js)

```javascript
// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // 默认侧边栏
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction'
    },
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: ['getting-started/installation', 'getting-started/configuration']
    },
    {
      type: 'category',
      label: 'Tutorial',
      items: [
        'tutorial-basics/create-a-page',
        'tutorial-basics/create-a-document',
        'tutorial-basics/create-a-blog-post',
        'tutorial-basics/markdown-features',
        'tutorial-basics/deploy-your-site'
      ]
    },
    {
      type: 'category',
      label: 'Advanced',
      items: ['tutorial-extras/manage-docs-versions', 'tutorial-extras/translate-your-site']
    },
    {
      type: 'link',
      label: 'GitHub',
      href: 'https://github.com/...'
    }
  ],
  
  // 自动生成侧边栏
  autoSidebar: [
    {
      type: 'autogenerated',
      dirName: '.'
    }
  ]
}

module.exports = sidebars
```

### 自定义首页 (src/pages/index.js)

```jsx
import React from 'react'
import clsx from 'clsx'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import HomepageFeatures from '@site/src/components/HomepageFeatures'
import styles from './index.module.css'

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext()
  
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro"
          >
            Docusaurus Tutorial - 5min ⏱️
          </Link>
        </div>
      </div>
    </header>
  )
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext()
  
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />"
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  )
}
```

### 自定义组件 (src/components/HomepageFeatures/)

```jsx
// index.js
import React from 'react'
import clsx from 'clsx'
import styles from './styles.module.css'

const FeatureList = [
  {
    title: 'Easy to Use',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Docusaurus was designed from the ground up to be easily installed and
        used to get your website up and running quickly.
      </>
    )
  },
  {
    title: 'Focus on What Matters',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Docusaurus lets you focus on your docs, and we&apos;ll do the chores. Go
        ahead and move your documentation into the <code>docs</code> directory.
      </>
    )
  },
  {
    title: 'Powered by React',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Extend or customize your website layout by reusing React. Docusaurus can
        be extended while reusing the same header and footer.
      </>
    )
  }
]

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  )
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
```

```css
/* styles.module.css */
.features {
  display: flex;
  align-items: center;
  padding: 2rem 0;
  width: 100%;
}

.featureSvg {
  height: 200px;
  width: 200px;
}
```

### Markdown/MDX 文档示例

```markdown
---
id: intro
title: Tutorial Intro
sidebar_label: Introduction
slug: /
---

# Welcome to Docusaurus

This is an introduction to the tutorial.

## Getting Started

Get started by **creating a new site**.

Or **try Docusaurus immediately** with **[docusaurus.new](https://docusaurus.new)**.

## Generate a new site

Generate a new Docusaurus site using the **classic template**:

```shell
npm init docusaurus@latest my-website classic
```

## Features

Docusaurus provides many features out of the box:

- 📖 **Documentation**: Write docs in Markdown/MDX
- 🌍 **i18n**: Internationalization support
- 🔍 **Search**: Algolia DocSearch integration
- 🎨 **Theming**: Customizable themes
- 📱 **PWA**: Progressive Web App support

## MDX Support

You can use **React components** in Markdown:

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'

<Tabs>
  <TabItem value="apple" label="Apple" default>
    This is an apple 🍎
  </TabItem>
  <TabItem value="orange" label="Orange">
    This is an orange 🍊
  </TabItem>
  <TabItem value="banana" label="Banana">
    This is a banana 🍌
  </TabItem>
</Tabs>

## Admonitions

:::tip
This is a tip
:::

:::info
This is an info
:::

:::caution
This is a caution
:::

:::danger
This is a danger
:::

## Code Blocks

```typescript title="example.ts"
interface User {
  id: number
  name: string
}

function greet(user: User): string {
  return `Hello, ${user.name}!`
}
```

## Interactive Code Editor

```jsx live
function Clock(props) {
  const [date, setDate] = useState(new Date())
  
  useEffect(() => {
    const timerID = setInterval(() => {
      setDate(new Date())
    }, 1000)
    
    return () => clearInterval(timerID)
  }, [])
  
  return (
    <div>
      <h2>It is {date.toLocaleTimeString()}.</h2>
    </div>
  )
}
```

## Next Steps

- Read the [Documentation](/docs/intro)
- Check out the [Blog](/blog)
- Join the [Community](https://discord.gg/docusaurus)
```

### 博客文章示例

```markdown
---
slug: welcome
title: Welcome
authors: [yangshun]
tags: [facebook, hello, docusaurus]
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'

# Welcome to Docusaurus

**Docusaurus blogging features** are powered by the [blog plugin](https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-content-blog).

## Getting Started

Simply add Markdown files (or folders) to the `blog` directory.

Regular blog authors can be added to `authors.yml`.

The blog post date can be extracted from filenames, such as:

- `2019-05-30-welcome.md`
- `2019-05-30-welcome/index.md`

A blog post folder can be convenient to co-locate blog images:

![Docusaurus Plushie](./docusaurus-plushie-banner.jpeg)

The blog supports tags as well!

**And if you don't want a blog**: just delete this directory, and use `blog: false` in your Docusaurus config.

## Using Tabs

<Tabs>
  <TabItem value="apple" label="Apple">This is an apple 🍎</TabItem>
  <TabItem value="orange" label="Orange">This is an orange 🍊</TabItem>
</Tabs>

<!-- truncate -->

This is the excerpt that will appear in the blog list page.
```

### 主题覆盖 (src/theme/)

```jsx
// src/theme/Root.js
import React from 'react'

// Default implementation
export default function Root({ children }) {
  return (
    <>
      {children}
    </>
  )
}
```

```jsx
// src/theme/Navbar.js
import Navbar from '@theme-original/Navbar'
import React from 'react'

export default function NavbarWrapper(props) {
  return (
    <>
      <Navbar {...props} />
      {/* 自定义内容 */}
    </>
  )
}
```

## 最佳实践

### 1. 文档组织

```javascript
// docs/tutorial-basics/_category_.json
{
  "label": "Tutorial - Basics",
  "position": 2,
  "link": {
    "type": "generated-index",
    "description": "5 minutes to learn the most important Docusaurus concepts."
  },
  "collapsed": false,
  "customProps": {
    "preview": true
  }
}
```

### 2. 版本管理

```bash
# 创建新版本
npm run docusaurus docs:version 2.0

# 版本配置
{
  docs: {
    lastVersion: 'current',
    versions: {
      current: {
        label: '2.0.0 (Next)',
        path: 'next',
        banner: 'unreleased'
      },
      '1.0.0': {
        label: '1.0.0',
        path: '1.0.0',
        banner: 'none'
      }
    }
  }
}
```

### 3. SEO 优化

```javascript
// docusaurus.config.js
{
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'description',
        content: 'Your description'
      }
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:title',
        content: 'Your Title'
      }
    }
  ],
  
  // Sitemap
  presets: [
    [
      'classic',
      {
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml'
        }
      }
    ]
  ]
}
```

### 4. 性能优化

```javascript
// docusaurus.config.js
{
  // 图片优化
  plugins: [
    [
      '@docusaurus/plugin-ideal-image',
      {
        quality: 70,
        max: 1030,
        min: 640,
        steps: 2
      }
    ]
  ],
  
  // 代码分割
  webpack: {
    jsLoader: (isServer) => ({
      loader: require.resolve('swc-loader'),
      options: {
        jsc: {
          target: 'es2017'
        }
      }
    })
  }
}
```

### 5. 国际化

```javascript
// docusaurus.config.js
{
  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['zh-CN', 'en']
  }
}

// i18n/zh-CN/code.json
{
  "theme.ErrorReportContent.h1": {
    "message": "此页面不存在",
    "description": "The page not found message"
  }
}
```

### 6. 自动化测试

```javascript
// __tests__/homepage.test.js
import React from 'react'
import { render, screen } from '@testing-library/react'
import Home from '@site/src/pages/index'

test('renders homepage', () => {
  render(<Home />)
  expect(screen.getByText('Welcome to My Site')).toBeInTheDocument()
})
```

## 常用命令

### 开发命令

```bash
# 创建新站点
npx create-docusaurus@latest my-website classic

# 启动开发服务器
npm start
# 或
npm run docusaurus start -- --port 3001 --host 0.0.0.0

# 构建生产版本
npm run build

# 预览构建结果
npm run serve

# 清除缓存和构建
npm run clear
```

### 内容管理

```bash
# 创建新版本
npm run docusaurus docs:version 2.0

# 写博客
npm run docusaurus write-blog-headers

# 翻译
npm run write-translations -- --locale zh-CN

# 生成侧边栏
npm run docusaurus docs:generate-sidebar
```

### 部署相关

```bash
# 部署到 GitHub Pages
npm run deploy
# 或
npm run docusaurus deploy

# 自定义部署
GIT_USER=<GITHUB_USERNAME> \
  USE_SSH=true \
  npm run deploy
```

### 插件和主题

```bash
# 添加插件
npm install --save @docusaurus/plugin-ideal-image

# 添加主题
npm install --save @docusaurus/theme-live-codeblock

# 更新 Docusaurus
npm update @docusaurus/core @docusaurus/preset-classic
```

### 调试命令

```bash
# 详细日志
npm start -- --verbose

# 检查依赖
npm run docusaurus swizzle -- --list

# 主题组件
npm run docusaurus swizzle @docusaurus/theme-classic Navbar -- --wrap
```

## 部署配置

### Vercel 部署

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "docusaurus"
}
```

### Netlify 部署

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "build"

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
          node-version: 18
          cache: 'npm'
      
      - uses: actions/configure-pages@v4
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build website
        run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: build
  
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
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
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
        try_files $uri $uri/ /index.html;
    }
    
    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### 自动化部署脚本

```bash
#!/bin/bash
# deploy.sh

set -e

echo "Building Docusaurus site..."
npm run build

echo "Deploying to production..."
# Vercel
vercel --prod

# 或 Netlify
# netlify deploy --prod --dir=build

# 或自定义服务器
# rsync -avz build/ user@server:/var/www/docs/

echo "Deployment complete!"
```

## 进阶功能

### 自定义插件

```javascript
// plugins/my-plugin.js
module.exports = function (context, options) {
  return {
    name: 'docusaurus-plugin-my-plugin',
    
    async loadContent() {
      // 加载内容
      return {}
    },
    
    async contentLoaded({ content, actions }) {
      // 处理内容
      const { createData, addRoute } = actions
      
      const data = await createData(
        'my-data.json',
        JSON.stringify(content)
      )
      
      addRoute({
        path: '/custom-page',
        component: '@site/src/components/CustomPage.js',
        modules: {
          data: data
        },
        exact: true
      })
    },
    
    configureWebpack(config, isServer, utils) {
      return {
        mergeStrategy: { 'plugins': 'prepend' },
        plugins: []
      }
    },
    
    async postBuild(props) {
      // 构建后处理
    }
  }
}
```

### 主题定制

```javascript
// swizzle 组件
npm run docusaurus swizzle @docusaurus/theme-classic Footer -- --wrap

// src/theme/Footer/index.js
import React from 'react'
import Footer from '@theme-original/Footer'

export default function FooterWrapper(props) {
  return (
    <>
      <Footer {...props} />
      {/* 自定义内容 */}
    </>
  )
}
```

### API 文档生成

```javascript
// 使用 docusaurus-plugin-typedoc-api
// docusaurus.config.js
{
  plugins: [
    [
      'docusaurus-plugin-typedoc-api',
      {
        projectRoot: `${__dirname}/../`,
        packages: ['packages/core', 'packages/utils'],
        typedocOptions: {
          tsconfig: `${__dirname}/../tsconfig.json`
        }
      }
    ]
  ]
}
```

### 集成评论系统

```jsx
// src/theme/DocItem/Layout/index.js
import React from 'react'
import DocItemLayout from '@theme-original/DocItem/Layout'
import Giscus from '@giscus/react'
import { useColorMode } from '@docusaurus/theme-common'

export default function DocItemLayoutWrapper(props) {
  const { colorMode } = useColorMode()
  
  return (
    <>
      <DocItemLayout {...props} />
      <Giscus
        repo="your/repo"
        repoId="..."
        category="Announcements"
        categoryId="..."
        mapping="pathname"
        theme={colorMode === 'dark' ? 'dark' : 'light'}
        reactionsEnabled="1"
      />
    </>
  )
}
```

## 工具集成

### Algolia DocSearch

```javascript
// docusaurus.config.js
{
  themeConfig: {
    algolia: {
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_API_KEY',
      indexName: 'YOUR_INDEX_NAME',
      contextualSearch: true,
      searchParameters: {},
      searchPagePath: 'search'
    }
  }
}
```

### Google Analytics

```javascript
// docusaurus.config.js
{
  presets: [
    [
      'classic',
      {
        gtag: {
          trackingID: 'G-XXXXXXX',
          anonymizeIP: true
        }
      }
    ]
  ]
}
```

### Sentry 错误监控

```javascript
// docusaurus.config.js
{
  clientModules: [
    require.resolve('./src/sentry.js')
  ]
}

// src/sentry.js
import * as Sentry from '@sentry/browser'

if (typeof window !== 'undefined') {
  Sentry.init({
    dsn: 'YOUR_DSN',
    environment: process.env.NODE_ENV
  })
}
```

## 故障排查

### 常见问题

1. **构建失败**
   ```bash
   # 清除缓存
   npm run clear
   npm run build
   ```

2. **样式不生效**
   - 检查 CSS Modules 作用域
   - 使用 `:global()` 突破作用域

3. **图片加载失败**
   - 使用 `require()` 导入图片
   - 检查路径大小写

4. **路由不工作**
   - 检查 `docusaurus.config.js` 的 `baseUrl`
   - 确保使用正确的链接

5. **MDX 解析错误**
   - 检查 JSX 语法
   - 导入必需的组件

### 调试技巧

```bash
# 详细日志
npm start -- --verbose

# 检查依赖树
npm ls @docusaurus/core

# 检查配置
node -e "console.log(require('./docusaurus.config.js'))"
```

### 性能监控

```javascript
// src/theme/Root.js
import React, { useEffect } from 'react'

export default function Root({ children }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 监控性能
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('[Performance]', entry.name, entry.duration)
        }
      })
      observer.observe({ entryTypes: ['measure', 'navigation'] })
    }
  }, [])
  
  return <>{children}</>
}
```
