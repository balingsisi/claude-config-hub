# Ghost CMS 博客平台模板

## 技术栈

- **Ghost**: 无头 CMS 和博客平台
- **Ghost Content API**: 内容获取 API
- **Ghost Admin API**: 管理 API
- **Ghost Member API**: 会员系统 API
- **TypeScript**: 类型支持
- **Next.js**: 前端框架（可选）

## 项目结构

```
ghost-cms-project/
├── src/
│   ├── config/
│   │   ├── ghost.ts          # Ghost 配置
│   │   └── index.ts
│   ├── lib/
│   │   ├── ghost-api.ts      # Ghost API 封装
│   │   ├── ghost-admin.ts    # Admin API 封装
│   │   └── ghost-members.ts  # Members API 封装
│   ├── services/
│   │   ├── post.service.ts   # 文章服务
│   │   ├── page.service.ts   # 页面服务
│   │   ├── tag.service.ts    # 标签服务
│   │   ├── author.service.ts # 作者服务
│   │   └── member.service.ts # 会员服务
│   ├── types/
│   │   └── ghost.d.ts        # Ghost 类型定义
│   └── index.ts
├── frontend/                 # 前端项目（可选）
│   ├── pages/
│   │   ├── index.tsx         # 首页
│   │   ├── post/[slug].tsx   # 文章页
│   │   ├── tag/[slug].tsx    # 标签页
│   │   └── author/[slug].tsx # 作者页
│   └── components/
│       ├── PostCard.tsx
│       ├── Navigation.tsx
│       └── Footer.tsx
├── .env.example
├── package.json
└── tsconfig.json
```

## 代码模式

### Ghost 配置

```ts
// src/config/ghost.ts
export const ghostConfig = {
  // Content API
  contentApi: {
    url: process.env.GHOST_URL!,
    key: process.env.GHOST_CONTENT_API_KEY!,
    version: 'v5.0'
  },
  
  // Admin API
  adminApi: {
    url: process.env.GHOST_URL!,
    key: process.env.GHOST_ADMIN_API_KEY!,
    version: 'v5.0'
  },
  
  // Members API
  membersApi: {
    url: process.env.GHOST_URL!,
    key: process.env.GHOST_MEMBERS_API_KEY!
  }
};
```

### Ghost API 封装

```ts
// src/lib/ghost-api.ts
import GhostContentAPI from '@tryghost/content-api';
import { ghostConfig } from '../config/ghost';

// 创建 Content API 客户端
export const ghostContent = new GhostContentAPI({
  url: ghostConfig.contentApi.url,
  key: ghostConfig.contentApi.key,
  version: ghostConfig.contentApi.version
});

// 文章操作
export const postAPI = {
  // 获取所有文章
  async getAll(options = {}) {
    return ghostContent.posts.browse({
      limit: 'all',
      include: ['tags', 'authors'],
      ...options
    });
  },

  // 获取单篇文章
  async getBySlug(slug: string) {
    return ghostContent.posts.read({
      slug
    }, {
      include: ['tags', 'authors']
    });
  },

  // 获取推荐文章
  async getFeatured(limit = 5) {
    return ghostContent.posts.browse({
      limit,
      filter: 'featured:true',
      include: ['tags', 'authors']
    });
  },

  // 按标签获取
  async getByTag(tagSlug: string, limit = 10) {
    return ghostContent.posts.browse({
      limit,
      filter: `tag:${tagSlug}`,
      include: ['tags', 'authors']
    });
  },

  // 按作者获取
  async getByAuthor(authorSlug: string, limit = 10) {
    return ghostContent.posts.browse({
      limit,
      filter: `author:${authorSlug}`,
      include: ['tags', 'authors']
    });
  },

  // 搜索文章
  async search(query: string) {
    return ghostContent.posts.browse({
      limit: 10,
      filter: `title:~'${query}'+excerpt:~'${query}'`,
      include: ['tags', 'authors']
    });
  }
};

// 页面操作
export const pageAPI = {
  async getAll() {
    return ghostContent.pages.browse({
      limit: 'all'
    });
  },

  async getBySlug(slug: string) {
    return ghostContent.pages.read({
      slug
    });
  }
};

// 标签操作
export const tagAPI = {
  async getAll() {
    return ghostContent.tags.browse({
      limit: 'all',
      include: ['count.posts']
    });
  },

  async getBySlug(slug: string) {
    return ghostContent.tags.read({
      slug
    });
  }
};

// 作者操作
export const authorAPI = {
  async getAll() {
    return ghostContent.authors.browse({
      limit: 'all'
    });
  },

  async getBySlug(slug: string) {
    return ghostContent.authors.read({
      slug
    });
  }
};

// 设置
export const settingsAPI = {
  async get() {
    return ghostContent.settings.browse();
  }
};
```

### Ghost Admin API 封装

```ts
// src/lib/ghost-admin.ts
import GhostAdminAPI from '@tryghost/admin-api';
import { ghostConfig } from '../config/ghost';

// 创建 Admin API 客户端
export const ghostAdmin = new GhostAdminAPI({
  url: ghostConfig.adminApi.url,
  key: ghostConfig.adminApi.key,
  version: ghostConfig.adminApi.version
});

// 文章管理
export const postAdmin = {
  // 创建文章
  async create(data: any) {
    return ghostAdmin.posts.add({
      title: data.title,
      html: data.content,
      feature_image: data.featureImage,
      featured: data.featured || false,
      status: data.status || 'draft',
      tags: data.tags || [],
      authors: data.authors || []
    });
  },

  // 更新文章
  async update(id: string, data: any) {
    return ghostAdmin.posts.edit({
      id,
      ...data
    });
  },

  // 删除文章
  async delete(id: string) {
    return ghostAdmin.posts.destroy({
      id
    });
  },

  // 发布文章
  async publish(id: string) {
    return ghostAdmin.posts.edit({
      id,
      status: 'published',
      published_at: new Date().toISOString()
    });
  },

  // 取消发布
  async unpublish(id: string) {
    return ghostAdmin.posts.edit({
      id,
      status: 'draft'
    });
  }
};

// 标签管理
export const tagAdmin = {
  async create(data: any) {
    return ghostAdmin.tags.add({
      name: data.name,
      description: data.description,
      slug: data.slug
    });
  },

  async update(id: string, data: any) {
    return ghostAdmin.tags.edit({
      id,
      ...data
    });
  },

  async delete(id: string) {
    return ghostAdmin.tags.destroy({
      id
    });
  }
};

// 作者管理
export const authorAdmin = {
  async create(data: any) {
    return ghostAdmin.authors.add({
      name: data.name,
      email: data.email,
      slug: data.slug
    });
  },

  async update(id: string, data: any) {
    return ghostAdmin.authors.edit({
      id,
      ...data
    });
  }
};

// 页面管理
export const pageAdmin = {
  async create(data: any) {
    return ghostAdmin.pages.add({
      title: data.title,
      html: data.content,
      status: data.status || 'draft'
    });
  },

  async update(id: string, data: any) {
    return ghostAdmin.pages.edit({
      id,
      ...data
    });
  },

  async delete(id: string) {
    return ghostAdmin.pages.destroy({
      id
    });
  }
};

// 站点设置
export const settingsAdmin = {
  async update(data: any) {
    return ghostAdmin.settings.update(data);
  }
};
```

### Members API 封装

```ts
// src/lib/ghost-members.ts
import axios from 'axios';
import { ghostConfig } from '../config/ghost';

const membersApi = axios.create({
  baseURL: `${ghostConfig.membersApi.url}/members/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const membersAPI = {
  // 创建会员
  async create(email: string, name?: string) {
    const response = await membersApi.post('/members/', {
      members: [{
        email,
        name,
        subscribed: true
      }]
    });
    return response.data;
  },

  // 获取会员信息
  async get(email: string) {
    const response = await membersApi.get(`/members/${email}`);
    return response.data;
  },

  // 更新会员
  async update(email: string, data: any) {
    const response = await membersApi.put(`/members/${email}`, data);
    return response.data;
  },

  // 删除会员
  async delete(email: string) {
    const response = await membersApi.delete(`/members/${email}`);
    return response.data;
  },

  // 检查会员状态
  async checkSubscription(email: string) {
    const response = await membersApi.get(`/members/${email}/subscription`);
    return response.data;
  },

  // 发送魔法链接
  async sendMagicLink(email: string, redirect?: string) {
    const response = await membersApi.post('/members/send-magic-link/', {
      email,
      redirect
    });
    return response.data;
  },

  // 验证 Token
  async verifyToken(token: string) {
    const response = await membersApi.post('/members/token/', {
      token
    });
    return response.data;
  }
};
```

### 服务层

```ts
// src/services/post.service.ts
import { postAPI, postAdmin } from '../lib/ghost-api';
import { postAdmin as admin } from '../lib/ghost-admin';

export class PostService {
  // 获取文章列表（分页）
  async getPosts(page = 1, limit = 10) {
    const posts = await postAPI.getAll({
      limit,
      page
    });
    
    return {
      posts,
      pagination: posts.meta.pagination
    };
  }

  // 获取文章详情
  async getPost(slug: string) {
    const post = await postAPI.getBySlug(slug);
    
    // 获取相关文章
    const relatedPosts = await postAPI.getAll({
      limit: 4,
      filter: `tags:[${post.tags.map(t => t.slug).join(',')}]`,
      exclude: `id:${post.id}`
    });
    
    return {
      post,
      relatedPosts
    };
  }

  // 获取首页内容
  async getHomeContent() {
    const [featured, latest, tags] = await Promise.all([
      postAPI.getFeatured(3),
      postAPI.getAll({ limit: 6 }),
      tagAPI.getAll()
    ]);
    
    return {
      featured,
      latest,
      tags
    };
  }

  // 创建文章（管理员）
  async createPost(data: any) {
    return admin.create(data);
  }

  // 更新文章（管理员）
  async updatePost(id: string, data: any) {
    return admin.update(id, data);
  }
}
```

### Next.js 前端集成

```tsx
// frontend/pages/index.tsx
import { GetStaticProps } from 'next';
import { ghostContent, postAPI, settingsAPI } from '../src/lib/ghost-api';
import PostCard from '../components/PostCard';

export default function Home({ posts, settings }) {
  return (
    <div>
      <header>
        <h1>{settings.title}</h1>
        <p>{settings.description}</p>
      </header>

      <main>
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const [posts, settings] = await Promise.all([
    postAPI.getAll({ limit: 10 }),
    settingsAPI.get()
  ]);

  return {
    props: {
      posts,
      settings
    },
    revalidate: 60 // ISR: 每60秒重新生成
  };
};
```

```tsx
// frontend/pages/post/[slug].tsx
import { GetStaticPaths, GetStaticProps } from 'next';
import { postAPI } from '../../src/lib/ghost-api';

export default function Post({ post }) {
  return (
    <article>
      <header>
        <h1>{post.title}</h1>
        <time>{new Date(post.published_at).toLocaleDateString()}</time>
        <div>
          {post.tags.map(tag => (
            <span key={tag.id}>{tag.name}</span>
          ))}
        </div>
      </header>

      <div dangerouslySetInnerHTML={{ __html: post.html }} />

      <footer>
        <div>
          <img src={post.authors[0].profile_image} alt={post.authors[0].name} />
          <span>{post.authors[0].name}</span>
        </div>
      </footer>
    </article>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await postAPI.getAll();
  
  const paths = posts.map(post => ({
    params: { slug: post.slug }
  }));

  return {
    paths,
    fallback: 'blocking'
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const post = await postAPI.getBySlug(params.slug as string);

  if (!post) {
    return {
      notFound: true
    };
  }

  return {
    props: { post },
    revalidate: 60
  };
};
```

### React 组件

```tsx
// frontend/components/PostCard.tsx
import Link from 'next/link';
import Image from 'next/image';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  feature_image: string;
  published_at: string;
  authors: Array<{
    name: string;
    profile_image: string;
  }>;
  tags: Array<{
    name: string;
    slug: string;
  }>;
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="post-card">
      {post.feature_image && (
        <Link href={`/post/${post.slug}`}>
          <Image
            src={post.feature_image}
            alt={post.title}
            width={600}
            height={400}
          />
        </Link>
      )}

      <div className="post-content">
        <div className="tags">
          {post.tags.map(tag => (
            <Link key={tag.slug} href={`/tag/${tag.slug}`}>
              {tag.name}
            </Link>
          ))}
        </div>

        <h2>
          <Link href={`/post/${post.slug}`}>
            {post.title}
          </Link>
        </h2>

        <p>{post.excerpt}</p>

        <div className="meta">
          <img 
            src={post.authors[0].profile_image} 
            alt={post.authors[0].name}
          />
          <span>{post.authors[0].name}</span>
          <time>
            {new Date(post.published_at).toLocaleDateString('zh-CN')}
          </time>
        </div>
      </div>
    </article>
  );
}
```

### RSS Feed

```ts
// src/lib/rss.ts
import RSS from 'rss';
import { postAPI, settingsAPI } from './ghost-api';

export async function generateRSS() {
  const [posts, settings] = await Promise.all([
    postAPI.getAll({ limit: 20 }),
    settingsAPI.get()
  ]);

  const feed = new RSS({
    title: settings.title,
    description: settings.description,
    site_url: settings.url,
    feed_url: `${settings.url}/rss.xml`,
    language: 'zh-CN',
    pubDate: new Date()
  });

  posts.forEach(post => {
    feed.item({
      title: post.title,
      description: post.excerpt,
      url: `${settings.url}/post/${post.slug}`,
      date: post.published_at,
      author: post.authors[0].name,
      categories: post.tags.map(t => t.name)
    });
  });

  return feed.xml();
}
```

### Sitemap 生成

```ts
// src/lib/sitemap.ts
import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import { postAPI, pageAPI, tagAPI, authorAPI, settingsAPI } from './ghost-api';

export async function generateSitemap() {
  const [posts, pages, tags, authors, settings] = await Promise.all([
    postAPI.getAll(),
    pageAPI.getAll(),
    tagAPI.getAll(),
    authorAPI.getAll(),
    settingsAPI.get()
  ]);

  const smStream = new SitemapStream({
    hostname: settings.url
  });

  // 首页
  smStream.write({
    url: '/',
    changefreq: 'daily',
    priority: 1.0
  });

  // 文章页
  posts.forEach(post => {
    smStream.write({
      url: `/post/${post.slug}`,
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: post.updated_at
    });
  });

  // 页面
  pages.forEach(page => {
    smStream.write({
      url: `/${page.slug}`,
      changefreq: 'monthly',
      priority: 0.7
    });
  });

  // 标签页
  tags.forEach(tag => {
    smStream.write({
      url: `/tag/${tag.slug}`,
      changefreq: 'weekly',
      priority: 0.6
    });
  });

  // 作者页
  authors.forEach(author => {
    smStream.write({
      url: `/author/${author.slug}`,
      changefreq: 'monthly',
      priority: 0.5
    });
  });

  smStream.end();

  const sitemap = await streamToPromise(smStream);
  return sitemap.toString();
}
```

## 最佳实践

### 1. 缓存策略

```ts
// src/lib/cache.ts
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5分钟缓存

export const cachedFetch = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 300
): Promise<T> => {
  const cached = cache.get<T>(key);
  
  if (cached) {
    return cached;
  }

  const data = await fetcher();
  cache.set(key, data, ttl);
  
  return data;
};

// 使用
const posts = await cachedFetch('posts:all', () => postAPI.getAll(), 300);
```

### 2. 图片优化

```ts
// Ghost 图片处理
export const optimizeGhostImage = (
  url: string,
  options: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill';
    format?: 'webp' | 'jpg' | 'png';
  } = {}
) => {
  const params = new URLSearchParams();
  
  if (options.width) params.append('w', options.width.toString());
  if (options.height) params.append('h', options.height.toString());
  if (options.fit) params.append('fit', options.fit);
  if (options.format) params.append('format', options.format);
  
  return `${url}?${params.toString()}`;
};

// 使用
const optimizedImage = optimizeGhostImage(post.feature_image, {
  width: 800,
  format: 'webp'
});
```

### 3. Webhook 集成

```ts
// API Route: /api/webhooks/ghost
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 验证签名
  const signature = req.headers['x-ghost-signature'];
  
  if (!verifySignature(req.body, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { post } = req.body;

  // 触发操作
  switch (req.body.event) {
    case 'post.published':
      // 更新缓存
      await clearCache('posts:*');
      
      // 发送通知
      await sendNotification(post);
      
      // 更新搜索索引
      await updateSearchIndex(post);
      break;

    case 'post.updated':
      await clearCache(`post:${post.slug}`);
      break;

    case 'post.deleted':
      await clearCache('posts:*');
      await removeFromSearchIndex(post.id);
      break;
  }

  res.status(200).json({ received: true });
}
```

### 4. 全文搜索

```ts
// src/lib/search.ts
import Fuse from 'fuse.js';
import { postAPI } from './ghost-api';

let searchIndex: Fuse<any> | null = null;

export async function initSearch() {
  const posts = await postAPI.getAll();
  
  searchIndex = new Fuse(posts, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'excerpt', weight: 1 },
      { name: 'tags.name', weight: 1.5 }
    ],
    includeScore: true,
    threshold: 0.3
  });
}

export function search(query: string, limit = 10) {
  if (!searchIndex) {
    throw new Error('Search index not initialized');
  }

  const results = searchIndex.search(query, { limit });
  
  return results.map(r => r.item);
}
```

### 5. 访问统计

```ts
// src/lib/analytics.ts
import { postAPI } from './ghost-api';

export async function getPopularPosts(days = 7, limit = 10) {
  const posts = await postAPI.getAll({
    limit,
    order: 'published_at DESC',
    filter: `published_at:>='${new Date(Date.now() - days * 86400000).toISOString()}'`
  });

  return posts;
}

// 阅读时间估算
export function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).length;
  const minutes = Math.ceil(words / 200); // 200 words per minute
  
  return minutes;
}
```

## 常用命令

### 开发

```bash
# 安装依赖
npm install @tryghost/content-api @tryghost/admin-api
npm install -D @types/node typescript ts-node

# 本地开发
npm run dev

# 构建
npm run build

# 生成静态站点
npm run export
```

### Ghost CLI

```bash
# 安装 Ghost CLI
npm install ghost-cli@latest -g

# 本地运行 Ghost
ghost install local

# 启动 Ghost
ghost start

# 停止 Ghost
ghost stop

# 重启 Ghost
ghost restart

# 查看 Ghost 日志
ghost log

# 更新 Ghost
ghost update
```

## 部署配置

### 环境变量

```env
# .env.example
GHOST_URL=https://your-blog.com
GHOST_CONTENT_API_KEY=your-content-api-key
GHOST_ADMIN_API_KEY=your-admin-api-key
GHOST_MEMBERS_API_KEY=your-members-api-key
```

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY frontend ./frontend

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Vercel 部署

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "GHOST_URL": "@ghost_url",
    "GHOST_CONTENT_API_KEY": "@ghost_content_api_key"
  }
}
```

## SEO 优化

### Meta 标签

```tsx
// frontend/components/SEO.tsx
import Head from 'next/head';

export default function SEO({ post, settings }) {
  return (
    <Head>
      <title>{post.title} | {settings.title}</title>
      <meta name="description" content={post.excerpt} />
      <meta property="og:type" content="article" />
      <meta property="og:title" content={post.title} />
      <meta property="og:description" content={post.excerpt} />
      <meta property="og:image" content={post.feature_image} />
      <meta property="og:url" content={`${settings.url}/post/${post.slug}`} />
      <meta property="article:published_time" content={post.published_at} />
      <meta property="article:author" content={post.authors[0].name} />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  );
}
```

### 结构化数据

```tsx
// JSON-LD 结构化数据
export function generateArticleSchema(post, settings) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "image": [post.feature_image],
    "datePublished": post.published_at,
    "dateModified": post.updated_at,
    "author": [{
      "@type": "Person",
      "name": post.authors[0].name
    }],
    "publisher": {
      "@type": "Organization",
      "name": settings.title,
      "logo": {
        "@type": "ImageObject",
        "url": settings.icon
      }
    }
  };
}
```
