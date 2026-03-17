# Gatsby Static Site Template

## Project Overview

Performance-focused static site generator with React, GraphQL, and powerful data layer. Gatsby excels at content-heavy sites with excellent SEO, progressive web app features, and extensive plugin ecosystem.

## Tech Stack

- **Framework**: Gatsby 5.x
- **Language**: TypeScript
- **Styling**: Tailwind CSS / Styled Components
- **CMS**: Contentful / Sanity / Strapi / Markdown
- **Data**: GraphQL
- **Image**: gatsby-plugin-image
- **Testing**: Jest, Cypress, Testing Library

## Project Structure

```
├── src/                          # Source files
│   ├── components/               # React components
│   │   ├── ui/                   # UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Layout.tsx
│   │   ├── seo/                  # SEO components
│   │   │   └── Seo.tsx
│   │   └── navigation/
│   │       └── Header.tsx
│   ├── pages/                    # Page components
│   │   ├── index.tsx             # Home page
│   │   ├── 404.tsx               # 404 page
│   │   ├── blog/
│   │   │   └── index.tsx
│   │   └── contact.tsx
│   ├── templates/                # Page templates
│   │   ├── blog-post.tsx         # Blog post template
│   │   └── category.tsx
│   ├── hooks/                    # Custom hooks
│   │   └── useSiteMetadata.ts
│   ├── utils/                    # Utilities
│   │   └── helpers.ts
│   └── styles/                   # Global styles
│       └── global.css
├── content/                      # Markdown content
│   ├── blog/                     # Blog posts
│   │   ├── 2024-01-15-first-post.md
│   │   └── 2024-02-20-second-post.md
│   └── pages/                    # Static pages
├── static/                       # Static files
│   ├── favicon.ico
│   └── robots.txt
├── gatsby-config.ts              # Gatsby configuration
├── gatsby-node.ts                # Node APIs
├── gatsby-ssr.ts                 # SSR APIs
├── gatsby-browser.ts             # Browser APIs
└── package.json
```

## Key Patterns

### 1. Gatsby Configuration

```typescript
// gatsby-config.ts
import type { GatsbyConfig } from 'gatsby'

const config: GatsbyConfig = {
  siteMetadata: {
    title: `My Gatsby Site`,
    description: `A modern static site built with Gatsby`,
    siteUrl: `https://mysite.com`,
    author: `@myhandle`,
  },
  graphqlTypegen: true,
  plugins: [
    `gatsby-plugin-typescript`,
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `blog`,
        path: `${__dirname}/content/blog`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-transformer-remark`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `My Gatsby Site`,
        short_name: `MySite`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/icon.png`,
      },
    },
    `gatsby-plugin-offline`,
    {
      resolve: `gatsby-plugin-google-gtag`,
      options: {
        trackingIds: ['G-XXXXXXXXXX'],
      },
    },
  ],
}

export default config
```

### 2. GraphQL Queries for Content

```typescript
// gatsby-node.ts - Create pages from content
import type { GatsbyNode } from 'gatsby'
import path from 'path'

export const createPages: GatsbyNode['createPages'] = async ({
  graphql,
  actions,
  reporter,
}) => {
  const { createPage } = actions

  const result = await graphql<{
    allMarkdownRemark: {
      nodes: Array<{
        id: string
        frontmatter: {
          slug: string
        }
      }>
    }
  }>(`
    query BlogPosts {
      allMarkdownRemark(
        sort: { frontmatter: { date: DESC } }
        limit: 1000
      ) {
        nodes {
          id
          frontmatter {
            slug
          }
        }
      }
    }
  `)

  if (result.errors) {
    reporter.panicOnBuild('Error loading blog posts', result.errors)
    return
  }

  const posts = result.data?.allMarkdownRemark.nodes ?? []
  const blogPostTemplate = path.resolve('./src/templates/blog-post.tsx')

  posts.forEach((post) => {
    createPage({
      path: `/blog/${post.frontmatter.slug}`,
      component: blogPostTemplate,
      context: {
        id: post.id,
      },
    })
  })
}
```

### 3. Blog Post Template

```tsx
// src/templates/blog-post.tsx
import { graphql, PageProps } from 'gatsby'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { Layout } from '../components/ui/Layout'
import { Seo } from '../components/seo/Seo'

type BlogPostQuery = Queries.BlogPostByIdQuery

const BlogPostTemplate = ({ data }: PageProps<BlogPostQuery>) => {
  const post = data.markdownRemark
  const { title, date, author, featuredImage } = post?.frontmatter || {}
  const image = featuredImage ? getImage(featuredImage) : null

  return (
    <Layout>
      <article className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
          <div className="text-gray-600">
            <span>{author}</span> • <time>{date}</time>
          </div>
          {image && (
            <GatsbyImage
              image={image}
              alt={title || ''}
              className="mt-6 rounded-lg"
            />
          )}
        </header>
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post?.html || '' }}
        />
      </article>
    </Layout>
  )
}

export const Head = ({ data }: PageProps<BlogPostQuery>) => (
  <Seo
    title={data.markdownRemark?.frontmatter?.title || ''}
    description={data.markdownRemark?.excerpt || ''}
  />
)

export const query = graphql`
  query BlogPostById($id: String!) {
    markdownRemark(id: { eq: $id }) {
      id
      html
      excerpt
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        author
        featuredImage {
          childImageSharp {
            gatsbyImageData(width: 800, aspectRatio: 2)
          }
        }
      }
    }
  }
`

export default BlogPostTemplate
```

### 4. SEO Component

```tsx
// src/components/seo/Seo.tsx
import { graphql, useStaticQuery } from 'gatsby'
import React from 'react'

interface SeoProps {
  title?: string
  description?: string
  pathname?: string
  image?: string
  children?: React.ReactNode
}

export const Seo = ({
  title,
  description,
  pathname,
  image,
  children,
}: SeoProps) => {
  const { site } = useStaticQuery<Queries.SeoQuery>(graphql`
    query Seo {
      site {
        siteMetadata {
          title
          description
          siteUrl
          author
        }
      }
    }
  `)

  const metaDescription = description || site?.siteMetadata?.description
  const defaultTitle = site?.siteMetadata?.title
  const siteUrl = site?.siteMetadata?.siteUrl
  const seoImage = image ? `${siteUrl}${image}` : `${siteUrl}/og-image.png`

  return (
    <>
      <title>{title ? `${title} | ${defaultTitle}` : defaultTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="og:title" content={title || defaultTitle} />
      <meta name="og:description" content={metaDescription} />
      <meta name="og:type" content="website" />
      <meta name="og:image" content={seoImage} />
      {pathname && <meta name="og:url" content={`${siteUrl}${pathname}`} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={site?.siteMetadata?.author || ''} />
      <meta name="twitter:title" content={title || defaultTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={seoImage} />
      {children}
    </>
  )
}
```

### 5. Layout Component

```tsx
// src/components/ui/Layout.tsx
import { graphql, useStaticQuery } from 'gatsby'
import { Link } from 'gatsby'
import React from 'react'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const data = useStaticQuery<Queries.LayoutQuery>(graphql`
    query Layout {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            {data.site?.siteMetadata?.title}
          </Link>
          <ul className="flex gap-6">
            <li>
              <Link to="/" className="hover:text-primary">
                Home
              </Link>
            </li>
            <li>
              <Link to="/blog" className="hover:text-primary">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-primary">
                About
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          © {new Date().getFullYear()} {data.site?.siteMetadata?.title}
        </div>
      </footer>
    </div>
  )
}
```

### 6. Blog Index Page with Pagination

```tsx
// src/pages/blog/index.tsx
import { graphql, PageProps, Link } from 'gatsby'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { Layout } from '../../components/ui/Layout'
import { Seo } from '../../components/seo/Seo'

type BlogIndexQuery = Queries.BlogIndexQuery

const BlogIndex = ({ data }: PageProps<BlogIndexQuery>) => {
  const posts = data.allMarkdownRemark.nodes

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const image = post.frontmatter?.featuredImage
              ? getImage(post.frontmatter.featuredImage)
              : null

            return (
              <article key={post.id} className="border rounded-lg overflow-hidden">
                {image && (
                  <GatsbyImage image={image} alt={post.frontmatter?.title || ''} />
                )}
                <div className="p-4">
                  <time className="text-sm text-gray-600">
                    {post.frontmatter?.date}
                  </time>
                  <h2 className="text-xl font-semibold mt-2">
                    <Link to={`/blog/${post.frontmatter?.slug}`}>
                      {post.frontmatter?.title}
                    </Link>
                  </h2>
                  <p className="mt-2 text-gray-600">{post.excerpt}</p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}

export const Head = () => <Seo title="Blog" />

export const query = graphql`
  query BlogIndex {
    allMarkdownRemark(
      sort: { frontmatter: { date: DESC } }
      filter: { frontmatter: { template: { eq: "blog" } } }
    ) {
      nodes {
        id
        excerpt
        frontmatter {
          title
          date(formatString: "MMMM DD, YYYY")
          slug
          featuredImage {
            childImageSharp {
              gatsbyImageData(width: 400, aspectRatio: 1.5)
            }
          }
        }
      }
    }
  }
`

export default BlogIndex
```

### 7. Source from Headless CMS (Contentful)

```typescript
// gatsby-config.ts - Contentful integration
{
  resolve: `gatsby-source-contentful`,
  options: {
    spaceId: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
    downloadLocal: true,
  },
}
```

```tsx
// Query Contentful data
export const query = graphql`
  query ContentfulBlogPost($id: String!) {
    contentfulBlogPost(id: { eq: $id }) {
      title
      slug
      publishedDate(formatString: "MMMM DD, YYYY")
      body {
        raw
      }
      featuredImage {
        gatsbyImageData(width: 800, aspectRatio: 2)
        description
      }
    }
  }
`
```

## Best Practices

1. **Image Optimization**: Always use gatsby-plugin-image for responsive images
2. **Query Fragments**: Reuse GraphQL fragments across queries
3. **Lazy Loading**: Use `loading="lazy"` for below-fold content
4. **Static Query**: Use useStaticQuery for shared data
5. **Preview Mode**: Implement preview for CMS content

## Common Commands

```bash
# Development
gatsby develop
gatsby develop -H 0.0.0.0 -p 8000

# Build
gatsby build

# Serve production build
gatsby serve

# Clean cache
gatsby clean

# Info
gatsby info

# New project
gatsby new my-site

# Type generation
gatsby develop --graphql-typegen
```

## Markdown Frontmatter

```markdown
---
title: "My First Blog Post"
date: "2024-01-15"
author: "John Doe"
slug: "my-first-blog-post"
template: "blog"
featuredImage: "./hero.jpg"
tags: ["gatsby", "tutorial"]
description: "A comprehensive guide to building with Gatsby"
---

Content goes here...
```

## Deployment

### Netlify

```bash
gatsby build
# Deploy `public` directory
```

```toml
# netlify.toml
[build]
  command = "gatsby build"
  publish = "public"

[[plugins]]
  package = "@netlify/plugin-gatsby"
```

### Vercel

```bash
gatsby build
# Deploy automatically
```

### Cloudflare Pages

```bash
gatsby build
# Deploy `public` directory
```

## Resources

- [Gatsby Documentation](https://www.gatsbyjs.com/docs/)
- [Gatsby Tutorial](https://www.gatsbyjs.com/docs/tutorial/)
- [Gatsby Plugin Library](https://www.gatsbyjs.com/plugins/)
- [Gatsby GitHub](https://github.com/gatsbyjs/gatsby)
