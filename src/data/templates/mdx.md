# MDX - Markdown + JSX

MDX 是 Markdown 的超集，允许在 Markdown 中直接使用 JSX 组件。广泛用于文档站点、博客和内容驱动的应用。

## 技术栈

- **核心**: MDX v3
- **运行时**: React, Preact, Vue (via @mdx-js/vue)
- **构建工具**: Vite, Webpack, Next.js, Remix
- **内容管理**: Contentlayer, Contentful, Sanio
- **样式**: Tailwind CSS, CSS Modules, styled-components

## 项目结构

```
mdx-project/
├── src/
│   ├── content/              # MDX 内容文件
│   │   ├── blog/
│   │   │   ├── post-1.mdx
│   │   │   └── post-2.mdx
│   │   └── docs/
│   │       ├── getting-started.mdx
│   │       └── advanced.mdx
│   ├── components/           # MDX 中使用的组件
│   │   ├── Button.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── Callout.tsx
│   │   └── Chart.tsx
│   ├── mdx/                  # MDX 配置和组件映射
│   │   ├── components.tsx    # 组件映射
│   │   └── provider.tsx      # MDX Provider
│   └── layouts/              # 布局组件
│       ├── BlogLayout.tsx
│       └── DocsLayout.tsx
├── contentlayer.config.ts    # Contentlayer 配置（可选）
└── mdx-components.tsx        # 全局 MDX 组件
```

## 代码模式

### MDX 文件示例

```mdx
---
title: Getting Started with MDX
description: Learn how to use MDX in your projects
date: 2024-01-15
---

import { Callout } from '@/components/Callout';
import { CodeBlock } from '@/components/CodeBlock';
import Chart from '@/components/Chart';

# {frontmatter.title}

<Callout type="info">
  This is an interactive component inside Markdown!
</Callout>

## Introduction

MDX combines the simplicity of Markdown with the power of JSX.

### Code Example

<CodeBlock language="typescript" title="example.ts">
{`
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}
`}
</CodeBlock>

### Interactive Chart

Here's an interactive chart component:

<Chart data={[1, 2, 3, 4, 5]} type="line" />

## Conclusion

MDX enables rich, interactive content with minimal effort.
```

### MDX 组件映射

```typescript
// src/mdx/components.tsx
import type { MDXComponents } from 'mdx/types';
import { Callout } from '@/components/Callout';
import { CodeBlock } from '@/components/CodeBlock';
import { Button } from '@/components/Button';

export const mdxComponents: MDXComponents = {
  // 覆盖默认 HTML 元素
  h1: ({ children }) => (
    <h1 className="text-4xl font-bold mb-4">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-3xl font-semibold mb-3 mt-8">{children}</h2>
  ),
  p: ({ children }) => (
    <p className="text-lg leading-relaxed mb-4">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-blue-600 hover:text-blue-800 underline"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
      {children}
    </pre>
  ),
  
  // 自定义组件
  Callout,
  CodeBlock,
  Button,
};
```

### MDX Provider 配置

```typescript
// src/mdx/provider.tsx
'use client';

import { MDXProvider } from '@mdx-js/react';
import { mdxComponents } from './components';

interface MDXProviderProps {
  children: React.ReactNode;
}

export function MDXContentProvider({ children }: MDXProviderProps) {
  return (
    <MDXProvider components={mdxComponents}>
      {children}
    </MDXProvider>
  );
}
```

### Contentlayer 集成

```typescript
// contentlayer.config.ts
import { defineDocumentType, makeSource } from 'contentlayer/source-files';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrism from 'rehype-prism-plus';

export const Blog = defineDocumentType(() => ({
  name: 'Blog',
  filePathPattern: `blog/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'string', required: true },
    date: { type: 'date', required: true },
    author: { type: 'string', required: true },
    tags: { type: 'list', of: { type: 'string' }, default: [] },
    image: { type: 'string' },
    published: { type: 'boolean', default: true },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc._raw.flattenedPath.replace(/blog\/?/, ''),
    },
    readingTime: {
      type: 'number',
      resolve: (doc) => {
        const wordsPerMinute = 200;
        const words = doc.body.raw.split(/\s+/).length;
        return Math.ceil(words / wordsPerMinute);
      },
    },
  },
}));

export const Docs = defineDocumentType(() => ({
  name: 'Docs',
  filePathPattern: `docs/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'string' },
    category: { type: 'string', required: true },
    order: { type: 'number', default: 0 },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc._raw.flattenedPath.replace(/docs\/?/, ''),
    },
  },
}));

export default makeSource({
  contentDirPath: 'src/content',
  documentTypes: [Blog, Docs],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
      [rehypePrism, { showLineNumbers: true }],
    ],
  },
});
```

### Vite MDX 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';

export default defineConfig({
  plugins: [
    { enforce: 'pre', ...mdx({
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug],
    })},
    react(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

### Next.js MDX 配置

```typescript
// next.config.mjs
import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
};

export default withMDX(nextConfig);
```

### 自定义组件示例

```typescript
// src/components/Callout.tsx
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

type CalloutType = 'info' | 'warning' | 'success' | 'error';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const icons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
};

const styles = {
  info: 'bg-blue-50 border-blue-500 text-blue-900',
  warning: 'bg-yellow-50 border-yellow-500 text-yellow-900',
  success: 'bg-green-50 border-green-500 text-green-900',
  error: 'bg-red-50 border-red-500 text-red-900',
};

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const Icon = icons[type];
  
  return (
    <div className={`my-6 p-4 border-l-4 rounded-r-lg ${styles[type]}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <div className="text-sm leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}
```

```typescript
// src/components/CodeBlock.tsx
import { highlight } from 'sugar-high';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  title?: string;
  children: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ 
  language = 'typescript', 
  title, 
  children,
  showLineNumbers = false 
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const code = children.trim();
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="my-4 rounded-lg overflow-hidden border border-gray-200">
      {title && (
        <div className="bg-gray-800 text-gray-200 px-4 py-2 text-sm flex justify-between items-center">
          <span className="font-mono">{title}</span>
          <span className="text-gray-400">{language}</span>
        </div>
      )}
      <div className="relative bg-gray-900">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
        <pre className="p-4 overflow-x-auto text-sm">
          <code 
            className={`language-${language}`}
            dangerouslySetInnerHTML={{ __html: highlight(code) }}
          />
        </pre>
      </div>
    </div>
  );
}
```

## 最佳实践

### 1. 内容组织

```typescript
// 按类别组织内容
content/
├── blog/           # 博客文章
├── docs/           # 文档
├── tutorials/      # 教程
└── changelog/      # 更新日志

// 使用一致的 frontmatter
---
title: string
description: string
date: YYYY-MM-DD
author: string
tags: string[]
image?: string
---
```

### 2. 组件设计

```typescript
// 组件应该：
// - 简洁的 API（少量 props）
// - 合理的默认值
// - 类型安全

interface ComponentProps {
  children: React.ReactNode;  // 主要内容
  variant?: 'primary' | 'secondary';  // 变体
  className?: string;  // 扩展样式
}

// 避免复杂的配置对象
// ✅ 好
<Callout type="warning" title="注意">
  内容
</Callout>

// ❌ 避免
<Callout config={{ type: 'warning', options: { title: '注意' } }}>
  内容
</Callout>
```

### 3. 性能优化

```typescript
// 使用动态导入大型组件
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('@/components/Chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

// 图片优化
import Image from 'next/image';

// 在 MDX 组件映射中
img: (props) => (
  <Image
    src={props.src || ''}
    alt={props.alt || ''}
    width={800}
    height={400}
    className="rounded-lg"
  />
),
```

### 4. SEO 优化

```typescript
// 自动生成目录
import { toc } from 'mdast-util-toc';

// 生成结构化数据
interface BlogPost {
  headline: string;
  datePublished: string;
  author: { name: string };
  image?: string;
}

function generateStructuredData(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.headline,
    datePublished: post.datePublished,
    author: post.author,
    image: post.image,
  };
}
```

### 5. 可访问性

```typescript
// 为交互组件添加 ARIA 属性
export function Tabs({ children }: TabsProps) {
  return (
    <div role="tablist" aria-label="Content tabs">
      {children}
    </div>
  );
}

// 图片必须有 alt 文本
img: ({ src, alt }) => (
  <img 
    src={src} 
    alt={alt || ''}  // 强制 alt
    loading="lazy"
  />
),
```

## 常用命令

### 开发

```bash
# 安装依赖
npm install @mdx-js/react @mdx-js/loader @mdx-js/rollup

# Contentlayer（可选）
npm install contentlayer next-contentlayer

# 插件
npm install remark-gfm rehype-slug rehype-autolink-headings

# 开发服务器
npm run dev

# 构建内容
npm run contentlayer build

# 监听内容变化
npm run contentlayer watch
```

### 内容管理

```bash
# 创建新文章
echo "---\ntitle: New Post\n---\n\nContent here" > content/blog/new-post.mdx

# 验证 frontmatter
npx contentlayer validate

# 生成类型
npx contentlayer codegen
```

### 构建和部署

```bash
# 构建
npm run build

# 导出静态站点
npm run build && npm run export

# 预览
npm run preview
```

## 部署配置

### Vercel

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["hkg1"]
}
```

### Netlify

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "20"
```

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production

EXPOSE 3000
CMD ["npm", "start"]
```

## 相关资源

- [MDX 官方文档](https://mdxjs.com/)
- [Contentlayer 文档](https://contentlayer.dev/)
- [Next.js MDX 集成](https://nextjs.org/docs/app/building-your-application/configuring/mdx)
- [remark 插件列表](https://github.com/remarkjs/remark/blob/main/doc/plugins.md)
- [rehype 插件列表](https://github.com/rehypejs/rehype/blob/main/doc/plugins.md)
