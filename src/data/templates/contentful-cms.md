# Contentful CMS 模板

## 技术栈

### 核心技术
- **Contentful**: Headless CMS 平台
- **Contentful API**: REST 和 GraphQL API
- **Contentful Rich Text**: 富文本渲染
- **Contentful Images**: 图片处理和 CDN
- **TypeScript**: 类型安全

### 开发工具
- **contentful**: JavaScript SDK
- **@contentful/rich-text-react-renderer**: React 富文本渲染
- **contentful-management**: 管理 API SDK
- **Next.js**: 前端框架
- **Zod**: 数据验证

## 项目结构

```
contentful-project/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   └── products/
│   │       ├── page.tsx
│   │       └── [id]/
│   │           └── page.tsx
│   ├── lib/
│   │   ├── contentful.ts
│   │   ├── contentful.types.ts
│   │   └── queries.ts
│   ├── components/
│   │   ├── RichText.tsx
│   │   ├── BlogCard.tsx
│   │   ├── ProductCard.tsx
│   │   └── Asset.tsx
│   └── types/
│       └── contentful.ts
├── migrations/
│   ├── content-types/
│   │   ├── blog-post.json
│   │   ├── author.json
│   │   └── product.json
│   └── scripts/
│       └── migrate.ts
├── contentful-migration-cli/
│   └── package.json
├── .env.local
├── next.config.js
└── package.json
```

## 代码模式

### 1. Contentful 客户端配置 (src/lib/contentful.ts)

```typescript
import { createClient } from 'contentful'

// 环境配置
const space = process.env.CONTENTFUL_SPACE_ID!
const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN!
const previewToken = process.env.CONTENTFUL_PREVIEW_TOKEN!

// 创建客户端
export const client = createClient({
  space,
  accessToken,
})

// Preview 客户端（草稿模式）
export const previewClient = createClient({
  space,
  host: 'preview.contentful.com',
  accessToken: previewToken,
})

// 获取客户端
export const getClient = (preview: boolean = false) => {
  return preview ? previewClient : client
}
```

### 2. 类型定义 (src/types/contentful.ts)

```typescript
import type { Document } from '@contentful/rich-text-types'

// Entry 类型
export interface BlogPost {
  sys: {
    id: string
    createdAt: string
    updatedAt: string
  }
  fields: {
    title: string
    slug: string
    excerpt: string
    content: Document
    featuredImage: Asset
    author: Author
    category: string[]
    publishedAt: string
    tags?: string[]
  }
}

export interface Author {
  sys: { id: string }
  fields: {
    name: string
    bio: string
    avatar: Asset
    email: string
    social?: {
      twitter?: string
      linkedin?: string
    }
  }
}

export interface Product {
  sys: { id: string }
  fields: {
    name: string
    slug: string
    description: string
    price: number
    images: Asset[]
    category: Category
    inventory: number
    featured: boolean
  }
}

export interface Asset {
  sys: { id: string }
  fields: {
    title: string
    file: {
      url: string
      details: {
        size: number
        image?: {
          width: number
          height: number
        }
      }
      fileName: string
      contentType: string
    }
  }
}

export interface Category {
  sys: { id: string }
  fields: {
    name: string
    slug: string
    description?: string
  }
}
```

### 3. 查询函数 (src/lib/queries.ts)

```typescript
import { getClient } from './contentful'
import type { BlogPost, Author, Product, Category } from '@/types/contentful'

// 获取所有博客文章
export async function getBlogPosts(limit = 10, skip = 0) {
  const client = getClient()
  
  const entries = await client.getEntries<BlogPost['fields']>({
    content_type: 'blogPost',
    order: ['-fields.publishedAt'],
    limit,
    skip,
    include: 2, // 包含关联内容层级
  })

  return {
    posts: entries.items,
    total: entries.total,
    skip: entries.skip,
    limit: entries.limit,
  }
}

// 获取单篇文章（通过 slug）
export async function getBlogPostBySlug(slug: string, preview = false) {
  const client = getClient(preview)
  
  const entries = await client.getEntries<BlogPost['fields']>({
    content_type: 'blogPost',
    'fields.slug': slug,
    include: 2,
    limit: 1,
  })

  return entries.items[0] || null
}

// 获取所有文章 slug（用于 SSG）
export async function getAllBlogPostSlugs() {
  const client = getClient()
  
  const entries = await client.getEntries({
    content_type: 'blogPost',
    select: 'fields.slug',
    limit: 1000,
  })

  return entries.items.map((item) => item.fields.slug)
}

// 获取作者信息
export async function getAuthor(id: string) {
  const client = getClient()
  const entry = await client.getEntry<Author['fields']>(id)
  return entry
}

// 获取所有产品
export async function getProducts(categoryId?: string) {
  const client = getClient()
  
  const query: any = {
    content_type: 'product',
    order: ['-sys.createdAt'],
  }

  if (categoryId) {
    query['fields.category.sys.id'] = categoryId
  }

  const entries = await client.getEntries<Product['fields']>(query)
  return entries.items
}

// 获取特色产品
export async function getFeaturedProducts() {
  const client = getClient()
  
  const entries = await client.getEntries<Product['fields']>({
    content_type: 'product',
    'fields.featured': true,
    limit: 6,
  })

  return entries.items
}

// 搜索内容
export async function searchContent(query: string, contentType: string) {
  const client = getClient()
  
  const entries = await client.getEntries({
    content_type: contentType,
    query,
    limit: 20,
  })

  return entries.items
}

// 获取分类
export async function getCategories() {
  const client = getClient()
  
  const entries = await client.getEntries<Category['fields']>({
    content_type: 'category',
  })

  return entries.items
}
```

### 4. 富文本渲染 (src/components/RichText.tsx)

```typescript
'use client'

import {
  documentToReactComponents,
  Options,
} from '@contentful/rich-text-react-renderer'
import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types'
import Image from 'next/image'
import Link from 'next/link'

interface RichTextProps {
  document: any
  className?: string
}

export function RichText({ document, className }: RichTextProps) {
  const options: Options = {
    renderMark: {
      [MARKS.BOLD]: (text) => <strong className="font-bold">{text}</strong>,
      [MARKS.ITALIC]: (text) => <em className="italic">{text}</em>,
      [MARKS.UNDERLINE]: (text) => <u className="underline">{text}</u>,
      [MARKS.CODE]: (text) => (
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
          {text}
        </code>
      ),
    },
    renderNode: {
      [BLOCKS.PARAGRAPH]: (node, children) => (
        <p className="mb-4 leading-relaxed">{children}</p>
      ),
      [BLOCKS.HEADING_1]: (node, children) => (
        <h1 className="text-4xl font-bold mt-12 mb-4">{children}</h1>
      ),
      [BLOCKS.HEADING_2]: (node, children) => (
        <h2 className="text-3xl font-bold mt-10 mb-3">{children}</h2>
      ),
      [BLOCKS.HEADING_3]: (node, children) => (
        <h3 className="text-2xl font-bold mt-8 mb-2">{children}</h3>
      ),
      [BLOCKS.UL_LIST]: (node, children) => (
        <ul className="list-disc pl-6 my-4 space-y-2">{children}</ul>
      ),
      [BLOCKS.OL_LIST]: (node, children) => (
        <ol className="list-decimal pl-6 my-4 space-y-2">{children}</ol>
      ),
      [BLOCKS.LIST_ITEM]: (node, children) => <li>{children}</li>,
      [BLOCKS.QUOTE]: (node, children) => (
        <blockquote className="border-l-4 border-primary pl-4 italic my-6">
          {children}
        </blockquote>
      ),
      [BLOCKS.HR]: () => <hr className="my-8 border-border" />,
      [BLOCKS.EMBEDDED_ASSET]: (node) => {
        const { title, file } = node.data.target.fields
        const { url, details } = file
        const width = details.image?.width || 800
        const height = details.image?.height || 600

        return (
          <div className="my-8">
            <Image
              src={`https:${url}`}
              alt={title || 'Image'}
              width={width}
              height={height}
              className="rounded-lg"
            />
          </div>
        )
      },
      [BLOCKS.EMBEDDED_ENTRY]: (node) => {
        // 嵌入的 Entry（如代码块、引用等）
        const entry = node.data.target
        
        if (entry.sys.contentType.sys.id === 'codeBlock') {
          return (
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-6">
              <code>{entry.fields.code}</code>
            </pre>
          )
        }

        return null
      },
      [INLINES.HYPERLINK]: (node, children) => {
        const { uri } = node.data
        const isExternal = uri.startsWith('http')
        
        return (
          <a
            href={uri}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="text-primary underline hover:no-underline"
          >
            {children}
          </a>
        )
      },
      [INLINES.ENTRY_HYPERLINK]: (node, children) => {
        const entry = node.data.target
        
        if (entry.sys.contentType.sys.id === 'blogPost') {
          return (
            <Link
              href={`/blog/${entry.fields.slug}`}
              className="text-primary underline hover:no-underline"
            >
              {children}
            </Link>
          )
        }

        return <span>{children}</span>
      },
    },
  }

  return (
    <div className={className}>
      {documentToReactComponents(document, options)}
    </div>
  )
}
```

### 5. Asset 组件 (src/components/Asset.tsx)

```typescript
'use client'

import Image from 'next/image'
import type { Asset } from '@/types/contentful'

interface AssetProps {
  asset: Asset
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function ContentfulAsset({
  asset,
  width = 800,
  height = 600,
  className,
  priority = false,
}: AssetProps) {
  const { title, file } = asset.fields
  const imageUrl = `https:${file.url}`

  return (
    <Image
      src={imageUrl}
      alt={title || 'Image'}
      width={file.details.image?.width || width}
      height={file.details.image?.height || height}
      className={className}
      priority={priority}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  )
}

// 图片 URL 构建器
export function getImageUrl(
  asset: Asset,
  options: {
    width?: number
    height?: number
    fit?: 'pad' | 'fill' | 'scale' | 'crop' | 'thumb'
    format?: 'jpg' | 'png' | 'webp'
    quality?: number
  } = {}
) {
  const { file } = asset.fields
  let url = `https:${file.url}`

  const params = new URLSearchParams()

  if (options.width) params.append('w', options.width.toString())
  if (options.height) params.append('h', options.height.toString())
  if (options.fit) params.append('fit', options.fit)
  if (options.format) params.append('fm', options.format)
  if (options.quality) params.append('q', options.quality.toString())

  if (params.toString()) {
    url += `?${params.toString()}`
  }

  return url
}

// SrcSet 构建器
export function getImageSrcSet(asset: Asset, sizes = [320, 640, 960, 1280]) {
  return sizes
    .map((w) => `${getImageUrl(asset, { width: w, format: 'webp' })} ${w}w`)
    .join(', ')
}
```

### 6. 博客列表页面 (src/app/blog/page.tsx)

```typescript
import { getBlogPosts } from '@/lib/queries'
import { BlogCard } from '@/components/BlogCard'

export const revalidate = 60 // 60秒 ISR

export default async function BlogPage() {
  const { posts } = await getBlogPosts(12)

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogCard key={post.sys.id} post={post} />
        ))}
      </div>
    </div>
  )
}
```

### 7. 博客详情页面 (src/app/blog/[slug]/page.tsx)

```typescript
import { notFound } from 'next/navigation'
import { getBlogPostBySlug, getAllBlogPostSlugs } from '@/lib/queries'
import { RichText } from '@/components/RichText'
import { ContentfulAsset } from '@/components/Asset'
import { format } from 'date-fns'

// 生成静态页面
export async function generateStaticParams() {
  const slugs = await getAllBlogPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

// 页面组件
export default async function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getBlogPostBySlug(params.slug, false)

  if (!post) {
    notFound()
  }

  const { title, excerpt, content, featuredImage, author, publishedAt } =
    post.fields

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {/* 头部 */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        
        <div className="flex items-center gap-4 text-muted-foreground">
          <time>{format(new Date(publishedAt), 'yyyy-MM-dd')}</time>
          {author && (
            <div className="flex items-center gap-2">
              {author.fields.avatar && (
                <ContentfulAsset
                  asset={author.fields.avatar}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <span>{author.fields.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* 特色图片 */}
      {featuredImage && (
        <ContentfulAsset
          asset={featuredImage}
          width={1200}
          height={630}
          className="rounded-lg mb-8 w-full"
          priority
        />
      )}

      {/* 摘要 */}
      {excerpt && (
        <p className="text-xl text-muted-foreground mb-8">{excerpt}</p>
      )}

      {/* 富文本内容 */}
      <RichText document={content} />
    </article>
  )
}
```

### 8. Content Type 迁移 (migrations/content-types/blog-post.json)

```json
{
  "contentTypeId": "blogPost",
  "name": "Blog Post",
  "description": "A blog post entry",
  "displayField": "title",
  "fields": [
    {
      "id": "title",
      "name": "Title",
      "type": "Symbol",
      "required": true,
      "localized": false
    },
    {
      "id": "slug",
      "name": "Slug",
      "type": "Symbol",
      "required": true,
      "validations": [
        {
          "unique": true
        },
        {
          "regexp": {
            "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
          }
        }
      ]
    },
    {
      "id": "excerpt",
      "name": "Excerpt",
      "type": "Text",
      "required": false
    },
    {
      "id": "content",
      "name": "Content",
      "type": "RichText",
      "required": true,
      "validations": [
        {
          "enabledMarks": ["bold", "italic", "underline", "code"],
          "message": "Only bold, italic, underline, and code marks are allowed"
        },
        {
          "enabledNodeTypes": [
            "heading-1",
            "heading-2",
            "heading-3",
            "ordered-list",
            "unordered-list",
            "hr",
            "blockquote",
            "embedded-entry-block",
            "embedded-asset-block",
            "hyperlink",
            "entry-hyperlink",
            "asset-hyperlink"
          ],
          "message": "Only enabled node types are allowed"
        }
      ]
    },
    {
      "id": "featuredImage",
      "name": "Featured Image",
      "type": "Link",
      "linkType": "Asset",
      "required": false,
      "validations": [
        {
          "linkMimetypeGroup": ["image"]
        }
      ]
    },
    {
      "id": "author",
      "name": "Author",
      "type": "Link",
      "linkType": "Entry",
      "required": true,
      "validations": [
        {
          "linkContentType": ["author"]
        }
      ]
    },
    {
      "id": "category",
      "name": "Category",
      "type": "Array",
      "items": {
        "type": "Link",
        "linkType": "Entry",
        "validations": [
          {
            "linkContentType": ["category"]
          }
        ]
      },
      "required": false
    },
    {
      "id": "tags",
      "name": "Tags",
      "type": "Array",
      "items": {
        "type": "Symbol"
      },
      "required": false
    },
    {
      "id": "publishedAt",
      "name": "Published At",
      "type": "Date",
      "required": true
    }
  ]
}
```

## 最佳实践

### 1. 查询优化
```typescript
// ✅ 只获取需要的字段
const entries = await client.getEntries({
  content_type: 'blogPost',
  select: 'fields.title,fields.slug,fields.excerpt',
})

// ✅ 使用 include 控制深度
const entries = await client.getEntries({
  content_type: 'blogPost',
  include: 2, // 最多2层嵌套
})

// ✅ 使用分页
const entries = await client.getEntries({
  content_type: 'blogPost',
  limit: 20,
  skip: page * 20,
})

// ❌ 避免过度嵌套
const bad = await client.getEntries({
  include: 10, // 过深的嵌套
})
```

### 2. 图片优化
```typescript
// ✅ 使用 Contentful 图片 API
const imageUrl = `https:${asset.fields.file.url}?w=800&h=600&fit=fill&fm=webp&q=80`

// ✅ 响应式图片
<img
  src={getImageUrl(asset, { width: 800, format: 'webp', quality: 80 })}
  srcSet={getImageSrcSet(asset)}
  sizes="(max-width: 768px) 100vw, 800px"
  alt={asset.fields.title}
/>

// ✅ 使用 Next.js Image
<Image
  src={`https:${asset.fields.file.url}`}
  alt={asset.fields.title}
  width={asset.fields.file.details.image?.width || 800}
  height={asset.fields.file.details.image?.height || 600}
/>
```

### 3. 缓存策略
```typescript
// ✅ 使用 ISR
export const revalidate = 60 // 60秒

// ✅ 使用缓存
export async function getBlogPost(slug: string) {
  const client = getClient()
  
  const entries = await client.getEntries({
    content_type: 'blogPost',
    'fields.slug': slug,
  })

  return entries.items[0]
}

// ✅ Preview 模式
export async function getBlogPost(slug: string, preview: boolean) {
  const client = getClient(preview)
  // ...
}
```

### 4. TypeScript 类型安全
```typescript
// ✅ 使用泛型
const entries = await client.getEntries<BlogPost['fields']>({
  content_type: 'blogPost',
})

// ✅ 类型守卫
function isBlogPost(entry: any): entry is BlogPost {
  return entry.sys.contentType.sys.id === 'blogPost'
}

// ✅ 严格类型
export type BlogPostFields = BlogPost['fields']
```

### 5. 错误处理
```typescript
// ✅ 统一错误处理
export async function getBlogPost(slug: string) {
  try {
    const client = getClient()
    const entries = await client.getEntries({
      content_type: 'blogPost',
      'fields.slug': slug,
    })

    return entries.items[0] || null
  } catch (error) {
    console.error('Failed to fetch blog post:', error)
    return null
  }
}

// ✅ 使用 notFound
if (!post) {
  notFound()
}
```

## 常用命令

### Contentful CLI
```bash
# 安装 CLI
npm install -g contentful-cli

# 登录
contentful login

# 创建空间
contentful space create --name "My Blog"

# 使用空间
contentful space use --space-id <space-id>

# 导出内容
contentful space export --content-file export.json

# 导入内容
contentful space import --content-file export.json

# 运行迁移
contentful space migration --file migration.js
```

### 开发命令
```bash
# 启动开发服务器
npm run dev

# 构建
npm run build

# 类型检查
npm run type-check

# 生成类型
npm run generate-types
```

## 部署配置

### 环境变量
```bash
# .env.local
CONTENTFUL_SPACE_ID=your-space-id
CONTENTFUL_ACCESS_TOKEN=your-delivery-token
CONTENTFUL_PREVIEW_TOKEN=your-preview-token
CONTENTFUL_MANAGEMENT_TOKEN=your-management-token
CONTENTFUL_ENVIRONMENT=master
```

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
      },
      {
        protocol: 'https',
        hostname: '*.contentful.com',
      },
    ],
  },
}

module.exports = nextConfig
```

### Webhook 配置
```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  
  // 验证 webhook（可选）
  const signature = req.headers.get('x-contentful-webhook-signature')
  
  const { sys, fields } = body
  
  if (sys.contentType.sys.id === 'blogPost') {
    revalidatePath('/blog')
    if (fields.slug) {
      revalidatePath(`/blog/${fields.slug}`)
    }
  }
  
  return NextResponse.json({ revalidated: true })
}
```

### Vercel 部署
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "env": {
    "CONTENTFUL_SPACE_ID": "@contentful-space-id",
    "CONTENTFUL_ACCESS_TOKEN": "@contentful-access-token",
    "CONTENTFUL_PREVIEW_TOKEN": "@contentful-preview-token"
  }
}
```

## 扩展资源

- [Contentful 官方文档](https://www.contentful.com/developers/docs/)
- [Contentful JavaScript SDK](https://github.com/contentful/contentful.js)
- [Rich Text Rendering](https://github.com/contentful/rich-text)
- [Contentful CLI](https://github.com/contentful/contentful-cli)
- [Contentful Migration](https://github.com/contentful/contentful-migration)
- [Next.js + Contentful](https://www.contentful.com/developers/docs/javascript/tutorials/using-nextjs-and-contentful-in-an-app/)
