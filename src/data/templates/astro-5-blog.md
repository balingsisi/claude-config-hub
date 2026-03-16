# Astro 5 Blog Template

## Project Overview

Content-driven blog built with Astro 5, featuring Content Collections, View Transitions, and optimal performance out of the box.

## Tech Stack

- **Framework**: Astro 5
- **Content**: Content Collections (Local)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Vercel / Netlify / Cloudflare

## Project Structure

```
src/
├── content/                # Content collections
│   ├── blog/               # Blog posts (Markdown/MDX)
│   │   ├── post-1.md
│   │   └── post-2.mdx
│   ├── config.ts           # Collection schema
│   └── authors/            # Author profiles
├── components/             # Astro components
│   ├── Header.astro
│   ├── Footer.astro
│   ├── BlogCard.astro
│   └── Newsletter.astro
├── layouts/                # Page layouts
│   ├── BaseLayout.astro
│   └── BlogPost.astro
├── pages/                  # File-based routing
│   ├── index.astro         # Home page
│   ├── blog/
│   │   ├── index.astro     # Blog listing
│   │   └── [...slug].astro # Dynamic blog posts
│   ├── about.astro
│   └── rss.xml.ts          # RSS feed
├── utils/                  # Helper functions
└── styles/                 # Global styles
```

## Key Patterns

### 1. Content Collections

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    heroImage: z.string().optional(),
    author: z.string(),
    tags: z.array(z.string()),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  blog: blogCollection,
};
```

### 2. Querying Content

```astro
---
// src/pages/blog/index.astro
import { getCollection } from 'astro:content';

const allPosts = await getCollection('blog', ({ data }) => {
  return !data.draft;
});

const sortedPosts = allPosts.sort(
  (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
);
---

<Layout title="Blog">
  {sortedPosts.map(post => (
    <BlogCard post={post} />
  ))}
</Layout>
```

### 3. Dynamic Blog Post Page

```astro
---
// src/pages/blog/[...slug].astro
import { getCollection, render } from 'astro:content';
import BlogPost from '../../layouts/BlogPost.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---

<BlogPost frontmatter={post.data}>
  <Content />
</BlogPost>
```

### 4. View Transitions

```astro
---
// src/layouts/BaseLayout.astro
import { ViewTransitions } from 'astro:transitions';
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>{Astro.props.title}</title>
    <ViewTransitions />
  </head>
  <body>
    <Header />
    <slot />
    <Footer />
  </body>
</html>
```

### 5. Component with Props

```astro
---
// src/components/BlogCard.astro
interface Props {
  title: string;
  description: string;
  pubDate: Date;
  slug: string;
  heroImage?: string;
}

const { title, description, pubDate, slug, heroImage } = Astro.props;

const formattedDate = pubDate.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
---

<article class="blog-card">
  {heroImage && (
    <img src={heroImage} alt={title} loading="lazy" />
  )}
  <div class="content">
    <time datetime={pubDate.toISOString()}>{formattedDate}</time>
    <h2><a href={`/blog/${slug}`}>{title}</a></h2>
    <p>{description}</p>
  </div>
</article>

<style>
  .blog-card {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 0.5rem;
    background: var(--card-bg);
  }
</style>
```

### 6. RSS Feed

```typescript
// src/pages/rss.xml.ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
  const posts = await getCollection('blog');
  
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
    })),
  });
}
```

### 7. MDX Integration

```mdx
---
title: My First Post
description: Learning MDX in Astro
pubDate: 2024-01-15
author: Jane Doe
---

import { Chart } from '../components/Chart.astro';

# {frontmatter.title}

This is a blog post with MDX features.

<Chart data={[1, 2, 3, 4, 5]} />

Interactive component:

<button onClick={() => alert('Hello!')}>Click me</button>
```

## Best Practices

1. **Content First**: Design around content collections
2. **Static by Default**: Prefer static generation over SSR
3. **Image Optimization**: Use `@astrojs/image` for optimized images
4. **SEO Friendly**: Include meta tags, sitemap, and RSS
5. **Progressive Enhancement**: Works without JavaScript

## Common Commands

```bash
# Development
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Add integrations
pnpm astro add tailwind
pnpm astro add mdx
pnpm astro add sitemap

# Type checking
pnpm astro check
```

## Performance Features

| Feature | Benefit |
|---------|---------|
| Zero JS by default | Minimal payload |
| Partial hydration | Load JS only where needed |
| Image optimization | Automatic resizing and format |
| CSS scoping | No style conflicts |
| Static generation | CDN-friendly |

## Content Authoring

### Frontmatter Schema

```yaml
---
title: "Understanding Astro 5"
description: "Deep dive into Astro 5 features"
pubDate: 2024-03-15
heroImage: "/images/astro-5.jpg"
author: "john-doe"
tags: ["astro", "web development", "tutorial"]
draft: false
---
```

### Markdown Features

- GitHub-flavored Markdown
- Syntax highlighting (Shiki)
- Custom components in MDX
- Frontmatter validation

## Deployment

### Vercel

```bash
pnpm astro add vercel
```

### Netlify

```bash
pnpm astro add netlify
```

### Cloudflare Pages

```bash
pnpm astro add cloudflare
```

### Static Hosting

```bash
pnpm build
# Deploy `dist` directory
```

## Integrations

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import image from '@astrojs/image';

export default defineConfig({
  site: 'https://example.com',
  integrations: [
    tailwind(),
    mdx(),
    sitemap(),
    image(),
  ],
});
```

## SEO Checklist

- [ ] Set `site` in `astro.config.mjs`
- [ ] Add sitemap integration
- [ ] Include meta tags
- [ ] Create RSS feed
- [ ] Add structured data (JSON-LD)
- [ ] Optimize images
- [ ] Add canonical URLs

## Resources

- [Astro Documentation](https://docs.astro.build/)
- [Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [View Transitions](https://docs.astro.build/en/guides/view-transitions/)
- [Astro Integrations](https://astro.build/integrations/)
