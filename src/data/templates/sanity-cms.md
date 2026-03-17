# Sanity CMS 模板

## 技术栈

### 核心技术
- **Sanity CMS**: 实时 headless 内容管理平台
- **Sanity Studio**: 开源内容编辑器
- **GROQ**: GraphQL-示意的查询语言
- **Portable Text**: 富文本结构化数据
- **Sanity Image**: 图片处理和 CDN

### 开发工具
- **@sanity/client**: JavaScript 客户端
- **@sanity/image-url**: 图片 URL 生成器
- **next-sanity**: Next.js 集成
- **TypeScript**: 类型安全
- **Zod**: 数据验证

## 项目结构

```
sanity-project/
├── studio/                        # Sanity Studio
│   ├── schemas/                   # 内容模型
│   │   ├── index.ts
│   │   ├── post.ts
│   │   ├── author.ts
│   │   ├── category.ts
│   │   └── blockContent.ts
│   ├── components/
│   │   └── Preview.tsx
│   ├── sanity.config.ts
│   ├── sanity.cli.ts
│   └── package.json
├── web/                           # Next.js 前端
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── posts/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   └── studio/
│   │   │       └── [[...index]]/
│   │   │           └── page.tsx
│   │   ├── components/
│   │   │   ├── PortableText.tsx
│   │   │   ├── PostCard.tsx
│   │   │   └── ImageBuilder.tsx
│   │   ├── lib/
│   │   │   ├── sanity.client.ts
│   │   │   ├── sanity.image.ts
│   │   │   └── sanity.queries.ts
│   │   └── types/
│   │       └── sanity.ts
│   ├── next.config.js
│   └── package.json
├── sanity.env
└── package.json                   # Monorepo 根
```

## 代码模式

### 1. Sanity 配置 (studio/sanity.config.ts)

```typescript
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './schemas'
import { visionTool } from '@sanity/vision'

export default defineConfig({
  name: 'default',
  title: 'My Blog',
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET || 'production',
  plugins: [
    structureTool(),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
})
```

### 2. 内容模型 (studio/schemas/post.ts)

```typescript
import { defineType, defineField } from 'sanity'

export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
        },
      ],
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block' }, { type: 'image' }],
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
    },
    prepare({ title, author, media }) {
      return {
        title,
        subtitle: `by ${author}`,
        media,
      }
    },
  },
})
```

### 3. GROQ 查询 (web/src/lib/sanity.queries.ts)

```typescript
import { groq } from 'next-sanity'

// 获取所有文章
export const POSTS_QUERY = groq`
  *[_type == "post" && defined(slug.current)]
    | order(publishedAt desc)[0...12] {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    "author": author->{ name, image },
    mainImage {
      asset->{
        _id,
        url,
        metadata { lqip, dimensions }
      },
      alt
    },
    categories[]->{ title, slug }
  }
`

// 获取单篇文章
export const POST_QUERY = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    body,
    "author": author->{ name, image, bio },
    mainImage {
      asset->{
        _id,
        url,
        metadata { lqip, dimensions }
      },
      alt
    },
    categories[]->{ title, slug }
  }
`

// 获取所有 slug（用于 SSG）
export const POST_SLUGS_QUERY = groq`
  *[_type == "post" && defined(slug.current)]
    .slug.current
`
```

### 4. Sanity 客户端 (web/src/lib/sanity.client.ts)

```typescript
import { createClient } from '@sanity/client'
import { apiVersion, dataset, projectId } from './sanity.api'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // 服务端渲染时禁用 CDN
})

// 获取文章列表
export async function getPosts() {
  return client.fetch(POSTS_QUERY)
}

// 获取单篇文章
export async function getPost(slug: string) {
  return client.fetch(POST_QUERY, { slug })
}

// 获取所有 slugs
export async function getPostSlugs() {
  return client.fetch(POST_SLUGS_QUERY)
}
```

### 5. 图片处理 (web/src/lib/sanity.image.ts)

```typescript
import createImageUrlBuilder from '@sanity/image-url'
import { projectId, dataset } from './sanity.api'

const imageBuilder = createImageUrlBuilder({
  projectId,
  dataset,
})

export const urlForImage = (source: any) => {
  return imageBuilder?.image(source).auto('format').fit('max')
}

export const urlFor = (source: any, width = 800, height = 600) => {
  return urlForImage(source)?.width(width).height(height).url()
}

// 响应式图片 srcset
export const getSrcSet = (source: any) => {
  const sizes = [320, 640, 750, 828, 1080, 1200, 1920]
  return sizes
    .map((w) => `${urlForImage(source)?.width(w).url()} ${w}w`)
    .join(', ')
}
```

### 6. Portable Text 渲染 (web/src/components/PortableText.tsx)

```typescript
'use client'

import {
  PortableText as PortableTextReact,
  PortableTextComponents,
} from '@portabletext/react'
import { urlForImage } from '@/lib/sanity.image'
import Image from 'next/image'

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset?._ref) return null
      return (
        <div className="my-8">
          <Image
            src={urlForImage(value).width(800).url()}
            alt={value.alt || 'Image'}
            width={800}
            height={600}
            className="rounded-lg"
          />
        </div>
      )
    },
  },
  block: {
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold mt-12 mb-4">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-bold mt-10 mb-3">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-bold mt-8 mb-2">{children}</h3>
    ),
    normal: ({ children }) => (
      <p className="text-lg leading-relaxed mb-4">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 italic my-6">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-bold">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
        {children}
      </code>
    ),
    link: ({ value, children }) => {
      const target = (value?.href || '').startsWith('http')
        ? '_blank'
        : undefined
      return (
        <a
          href={value?.href}
          target={target}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          className="text-primary underline hover:no-underline"
        >
          {children}
        </a>
      )
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc pl-6 my-4">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal pl-6 my-4">{children}</ol>
    ),
  },
}

export function PortableText({ value }: { value: any }) {
  return <PortableTextReact value={value} components={components} />
}
```

### 7. Next.js 页面 (web/src/app/posts/[slug]/page.tsx)

```typescript
import { notFound } from 'next/navigation'
import { getPost, getPostSlugs } from '@/lib/sanity.client'
import { PortableText } from '@/components/PortableText'
import { urlFor } from '@/lib/sanity.image'
import Image from 'next/image'
import { format } from 'date-fns'

// 生成静态页面
export async function generateStaticParams() {
  const slugs = await getPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

// 页面组件
export default async function PostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getPost(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {/* 头部 */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-muted-foreground">
          <time>{format(new Date(post.publishedAt), 'yyyy-MM-dd')}</time>
          {post.author && (
            <div className="flex items-center gap-2">
              {post.author.image && (
                <Image
                  src={urlFor(post.author.image, 40, 40)}
                  alt={post.author.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <span>{post.author.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* 主图 */}
      {post.mainImage && (
        <Image
          src={urlFor(post.mainImage, 1200, 630)}
          alt={post.mainImage.alt || post.title}
          width={1200}
          height={630}
          className="rounded-lg mb-8"
        />
      )}

      {/* 摘要 */}
      {post.excerpt && (
        <p className="text-xl text-muted-foreground mb-8">{post.excerpt}</p>
      )}

      {/* 内容 */}
      <PortableText value={post.body} />
    </article>
  )
}
```

### 8. 嵌入 Studio (web/src/app/studio/[[...index]]/page.tsx)

```typescript
import { NextStudio } from 'next-sanity/studio'
import config from '../../../../studio/sanity.config'

export default function StudioPage() {
  return <NextStudio config={config} />
}
```

## 最佳实践

### 1. Schema 设计
```typescript
// ✅ 使用 defineType 和 defineField
export const product = defineType({
  name: 'product',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (Rule) => Rule.required().min(5),
    }),
  ],
})

// ✅ 使用预览提高编辑体验
preview: {
  select: { title: 'title', media: 'image' },
}

// ❌ 避免过深的嵌套结构
```

### 2. GROQ 查询优化
```typescript
// ✅ 只获取需要的字段
const query = groq`
  *[_type == "post"] {
    title,
    slug,
    "authorName": author->name
  }
`

// ✅ 使用 projection 和 joins
const query = groq`
  *[_type == "post"] {
    ...,
    "categories": categories[]->{ title, slug }
  }
`

// ❌ 避免 * 获取所有内容
const bad = groq`*[_type == "post"]` // 不推荐
```

### 3. 图片优化
```typescript
// ✅ 使用 hotspot 实现智能裁剪
{
  name: 'mainImage',
  type: 'image',
  options: { hotspot: true }
}

// ✅ 响应式图片
<Image
  src={urlForImage(source).width(800).url()}
  srcSet={getSrcSet(source)}
  sizes="(max-width: 768px) 100vw, 800px"
/>

// ✅ 使用 LQIP 占位符
<Image
  src={urlForImage(source).width(800).url()}
  placeholder="blur"
  blurDataURL={source.asset.metadata.lqip}
/>
```

### 4. 缓存策略
```typescript
// ✅ 服务端使用 useCdn: false
export const client = createClient({
  projectId,
  dataset,
  useCdn: false, // SSR 时禁用
})

// ✅ 客户端使用 useCdn: true
export const client = createClient({
  projectId,
  dataset,
  useCdn: true, // 客户端启用
})

// ✅ 使用 ISR
export const revalidate = 60 // 60秒重新验证
```

### 5. TypeScript 类型
```typescript
// types/sanity.ts
import type { SanityDocument, Image } from '@sanity/client'

export interface Post extends SanityDocument {
  _type: 'post'
  title: string
  slug: { current: string }
  excerpt?: string
  mainImage?: Image & { alt?: string }
  body?: any[]
  author?: Author
  categories?: Category[]
  publishedAt: string
}

export interface Author extends SanityDocument {
  _type: 'author'
  name: string
  image?: Image
  bio?: string
}

export interface Category extends SanityDocument {
  _type: 'category'
  title: string
  slug: { current: string }
}
```

## 常用命令

### Sanity CLI
```bash
# 安装 CLI
npm install -g @sanity/cli

# 创建新项目
npm create sanity@latest

# 启动 Studio
cd studio && npm run dev

# 部署 Studio
npx sanity deploy

# 导出数据
npx sanity dataset export production backup.tar.gz

# 导入数据
npx sanity dataset import backup.tar.gz staging

# 执行 GROQ 查询
npx sanity query "*[_type == 'post']{title}"
```

### 开发命令
```bash
# 同时运行 Studio 和 Web
npm run dev

# 类型生成
npx sanity schema extract
npx sanity typegen generate

# 构建
npm run build
```

## 部署配置

### 环境变量
```bash
# .env.local
SANITY_PROJECT_ID=your-project-id
SANITY_DATASET=production
SANITY_API_VERSION=2024-01-01
SANITY_API_TOKEN=your-api-token
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
```

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  experimental: {
    taint: true, // 安全功能
  },
}

module.exports = nextConfig
```

### sanity.config.ts (CORS)
```typescript
export default defineConfig({
  // ...
  // 允许的 CORS 源
  cors: {
    origins: [
      'http://localhost:3000',
      'https://your-domain.com',
    ],
  },
})
```

### Vercel 部署
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "web/.next",
  "framework": "nextjs",
  "env": {
    "SANITY_PROJECT_ID": "@sanity-project-id",
    "SANITY_API_TOKEN": "@sanity-api-token"
  }
}
```

### Webhook 配置
```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const signature = req.headers.get('sanity-webhook-signature')

  // 验证签名（可选）
  // if (!isValidSignature(body, signature)) {
  //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  // }

  const { slug } = body

  if (slug) {
    revalidatePath(`/posts/${slug}`)
  } else {
    revalidateTag('posts')
  }

  return NextResponse.json({ revalidated: true })
}
```

## 扩展资源

- [Sanity 官方文档](https://www.sanity.io/docs)
- [GROQ 查询语言](https://www.sanity.io/docs/groq)
- [Portable Text](https://www.sanity.io/docs/presenting-block-text)
- [Next.js + Sanity](https://github.com/sanity-io/next-sanity)
- [Sanity Exchange](https://www.sanity.io/exchange)
- [Sanity UI](https://www.sanity.io/ui)
