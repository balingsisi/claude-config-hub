# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Astro Blog & Portfolio
**Type**: Static Site / Content Website
**Tech Stack**: Astro + TypeScript + MDX
**Goal**: Performance-optimized blog or portfolio with excellent SEO and minimal JavaScript

---

## Tech Stack

### Core
- **Framework**: Astro 4+
- **Language**: TypeScript 5.3+
- **Content**: MDX for blog posts
- **Routing**: File-based routing
- **Rendering**: Static (SSG) or Hybrid

### Styling
- **CSS**: Tailwind CSS 3.4+
- **Typography**: @tailwindcss/typography
- **Icons**: Astro Icon or Lucide Icons

### Content Management
- **CMS**: Astro Content Collections (local)
- **External CMS**: Optional (Sanity, Contentful, etc.)
- **Images**: Astro Image Optimization

### Development
- **Package Manager**: pnpm or npm
- **Testing**: Vitest + Playwright
- **Linting**: ESLint + Prettier
- **Deployment**: Vercel, Netlify, Cloudflare Pages

---

## Code Standards

### TypeScript Rules
- Use strict mode - no `any` types
- Define proper types for content collections
- Use `interface` for props, `type` for unions
- Enable strict null checks

```typescript
// ✅ Good
interface BlogPostProps {
  title: string
  pubDate: Date
  description: string
  tags: string[]
  image?: string
}

// ❌ Bad
interface BlogPostProps {
  [key: string]: any
}
```

### Naming Conventions
- **Pages**: kebab-case (`about.astro`, `blog/index.astro`)
- **Components**: PascalCase (`BlogPost.astro`, `Header.astro`)
- **Layouts**: PascalCase with Layout suffix (`BaseLayout.astro`)
- **Content**: kebab-case (`my-first-post.mdx`)

### File Organization
```
src/
├── pages/             # Routes
│   ├── index.astro   # Home page
│   ├── about.astro   # About page
│   └── blog/
│       ├── index.astro
│       └── [...slug].astro
├── components/        # Reusable components
│   ├── ui/           # Basic UI components
│   └── features/     # Feature-specific components
├── layouts/          # Page layouts
│   └── BaseLayout.astro
├── content/          # Content collections
│   ├── blog/         # Blog posts (MDX)
│   └── config.ts     # Collection schema
├── styles/           # Global styles
├── lib/              # Utility functions
└── types/            # TypeScript types
```

---

## Architecture Patterns

### Content Collections
- Define schema for content types
- Use Zod for validation
- Organize content by type

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content'

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
})

export const collections = {
  blog: blogCollection,
}
```

### Page Structure
- Use layouts for consistent structure
- Keep pages focused on content
- Use components for reusable sections

```astro
---
// src/pages/blog/[...slug].astro
import { type CollectionEntry, getCollection } from 'astro:content'
import BaseLayout from '@/layouts/BaseLayout.astro'

export async function getStaticPaths() {
  const posts = await getCollection('blog')
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: post,
  }))
}

type Props = CollectionEntry<'blog'>

const post = Astro.props
const { Content } = await post.render()
---

<BaseLayout title={post.data.title}>
  <article>
    <h1>{post.data.title}</h1>
    <time datetime={post.data.pubDate.toISOString()}>
      {post.data.pubDate.toLocaleDateString()}
    </time>
    <Content />
  </article>
</BaseLayout>
```

### Component Islands
- Use client-side JS only when needed
- Interactive components with `client:*` directives
- Keep most components static

```astro
---
// src/components/Newsletter.astro
// This is static by default
---

<form>
  <input type="email" placeholder="Enter your email" />
  <button type="submit">Subscribe</button>
</form>

---
// src/components/InteractiveForm.astro
// This will be hydrated on the client
---

<form>
  <input type="email" placeholder="Enter your email" />
  <button type="submit">Subscribe</button>
</form>

<script>
  // Client-side JavaScript for interactivity
  document.querySelector('form')?.addEventListener('submit', (e) => {
    e.preventDefault()
    // Handle form submission
  })
</script>

---
// Usage in page
---
<Newsletter />
<InteractiveForm client:visible />
```

### Layout Pattern
- Create base layout with common elements
- Use slots for content injection
- Keep layouts composable

```astro
---
// src/layouts/BaseLayout.astro
import Header from '@/components/Header.astro'
import Footer from '@/components/Footer.astro'

interface Props {
  title: string
  description?: string
}

const { title, description = 'Default description' } = Astro.props
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <title>{title} | My Blog</title>
  </head>
  <body>
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>

<style is:global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>
```

### Image Optimization
- Use Astro's built-in image optimization
- Lazy load images below the fold
- Provide proper alt text

```astro
---
import { Image } from 'astro:assets'
import heroImage from '@/assets/hero.jpg'
---

<Image 
  src={heroImage} 
  alt="Hero image description"
  width={800}
  height={600}
  loading="lazy"
/>
```

---

## Key Constraints

### Performance
- ✅ Zero JavaScript by default
- ✅ Optimize images automatically
- ✅ Use static generation when possible
- ✅ Lazy load below-the-fold content
- ❌ Don't add unnecessary client-side JS
- ❌ Don't load large images without optimization

### SEO
- ✅ Use semantic HTML
- ✅ Add proper meta tags
- ✅ Generate sitemap automatically
- ✅ Add structured data (JSON-LD)
- ❌ Don't forget Open Graph tags
- ❌ Don't use generic title tags

### Content
- ✅ Use content collections for structured data
- ✅ Validate frontmatter with Zod
- ✅ Organize content logically
- ❌ Don't skip content validation
- ❌ Don't hardcode content in pages

---

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Content
```bash
npm run astro content sync    # Sync content collections
npm run astro content add     # Add new content entry
```

### Deployment
```bash
npm run deploy       # Deploy to hosting platform
```

---

## Important Prohibitions

### ❌ Never Do
- Don't use `any` type - use proper TypeScript types
- Don't add client-side JavaScript without reason
- Don't skip image alt text
- Don't hardcode content in components
- Don't ignore TypeScript errors
- Don't disable ESLint rules without good reason
- Don't forget meta tags for SEO
- Don't use large unoptimized images
- Don't skip content validation
- Don't forget responsive design

### ⚠️ Use with Caution
- `client:*` directives - only when interactivity is needed
- External scripts - ensure they don't block rendering
- Large dependencies - consider bundle size impact
- Dynamic routes - ensure proper static generation

---

## Best Practices

### Component Design
- Keep components focused and reusable
- Use props for configuration
- Prefer static components by default

```astro
---
// ✅ Good - Reusable component with proper props
interface BlogCardProps {
  title: string
  description: string
  pubDate: Date
  slug: string
  tags: string[]
}

const { title, description, pubDate, slug, tags } = Astro.props
---

<article class="rounded-lg shadow-md p-6">
  <time datetime={pubDate.toISOString()} class="text-sm text-gray-500">
    {pubDate.toLocaleDateString()}
  </time>
  <h2 class="text-xl font-bold mt-2">
    <a href={`/blog/${slug}`}>{title}</a>
  </h2>
  <p class="text-gray-600 mt-2">{description}</p>
  <div class="flex gap-2 mt-4">
    {tags.map((tag) => (
      <span class="text-xs bg-gray-100 px-2 py-1 rounded">{tag}</span>
    ))}
  </div>
</article>
```

### MDX Usage
- Use MDX for rich content
- Keep components importable
- Use frontmatter for metadata

```mdx
---
title: My First Blog Post
description: A comprehensive guide to getting started
pubDate: 2026-03-12
tags: [tutorial, getting-started]
---

import Callout from '@/components/Callout.astro'
import CodeBlock from '@/components/CodeBlock.astro'

# {frontmatter.title}

This is my first blog post with MDX!

<Callout type="info">
  This is an important note.
</Callout>

<CodeBlock language="typescript">
console.log('Hello, World!')
</CodeBlock>
```

### RSS Feed
- Generate RSS feed automatically
- Include all published posts
- Provide proper metadata

```typescript
// src/pages/rss.xml.ts
import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import { SITE_TITLE, SITE_DESCRIPTION } from '@/consts'

export async function GET(context: { site: string }) {
  const posts = await getCollection('blog')
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
    })),
  })
}
```

---

## Compact Instructions

When using `/compact`, preserve:
- Content collection schema changes
- Routing structure changes
- Component architecture decisions
- Modified files list and critical diffs

Discard:
- Verbose log output
- Exploratory search dead ends
- Redundant confirmation messages

---

## Quick Reference

### File Locations
- Pages: `src/pages/**/*.astro`
- Components: `src/components/**/*.astro`
- Layouts: `src/layouts/**/*.astro`
- Content: `src/content/**/*.{md,mdx}`
- Styles: `src/styles/**/*.css`
- Types: `src/types/**/*.ts`

### Content Collection Schema
```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
})

export const collections = { blog }
```

### Client Directives
```astro
<InteractiveComponent client:load />      <!-- Load immediately -->
<InteractiveComponent client:idle />      <!-- Load on idle -->
<InteractiveComponent client:visible />   <!-- Load when visible -->
<InteractiveComponent client:media="(max-width: 640px)" />
```

---

**Last Updated**: 2026-03-12
