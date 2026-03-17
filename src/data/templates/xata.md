# Xata Serverless PostgreSQL 数据库模板

## 技术栈

- **Xata**: Serverless PostgreSQL 数据库
- **Next.js 14**: React 全栈框架
- **TypeScript**: 类型支持
- **Tailwind CSS**: 样式方案
- **@xata.io/client**: Xata 客户端

## 项目结构

```
xata-app/
├── src/
│   ├── lib/
│   │   ├── xata.ts
│   │   └── helpers.ts
│   ├── components/
│   │   ├── posts/
│   │   │   ├── PostList.tsx
│   │   │   ├── PostForm.tsx
│   │   │   └── PostDetail.tsx
│   │   ├── users/
│   │   │   ├── UserList.tsx
│   │   │   └── UserForm.tsx
│   │   ├── comments/
│   │   │   ├── CommentList.tsx
│   │   │   └── CommentForm.tsx
│   │   ├── search/
│   │   │   └── SearchBar.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       └── Modal.tsx
│   ├── hooks/
│   │   ├── usePosts.ts
│   │   ├── useUsers.ts
│   │   └── useSearch.ts
│   ├── pages/
│   │   ├── api/
│   │   │   ├── posts/
│   │   │   │   ├── index.ts
│   │   │   │   ├── [id].ts
│   │   │   │   └── search.ts
│   │   │   └── users/
│   │   │       ├── index.ts
│   │   │       └── [id].ts
│   │   ├── posts/
│   │   │   ├── index.tsx
│   │   │   ├── [id].tsx
│   │   │   └── new.tsx
│   │   ├── users/
│   │   │   └── index.tsx
│   │   ├── _app.tsx
│   │   └── index.tsx
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── globals.css
├── xata/
│   └── schema.json
├── .env.local
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 代码模式

### Xata 客户端配置

```ts
// src/lib/xata.ts
import { BaseClientOptions, buildClient } from '@xata.io/client';
import { DatabaseSchema } from './schema';

const tables = [
  {
    name: 'users',
    columns: [
      { name: 'name', type: 'string' },
      { name: 'email', type: 'email' },
      { name: 'avatar', type: 'string' },
      { name: 'bio', type: 'text' },
      { name: 'createdAt', type: 'datetime' }
    ]
  },
  {
    name: 'posts',
    columns: [
      { name: 'title', type: 'string' },
      { name: 'content', type: 'text' },
      { name: 'slug', type: 'string' },
      { name: 'published', type: 'bool' },
      { name: 'author', type: 'link', link: { table: 'users' } },
      { name: 'tags', type: 'multiple' },
      { name: 'viewCount', type: 'int' },
      { name: 'createdAt', type: 'datetime' },
      { name: 'updatedAt', type: 'datetime' }
    ]
  },
  {
    name: 'comments',
    columns: [
      { name: 'content', type: 'text' },
      { name: 'post', type: 'link', link: { table: 'posts' } },
      { name: 'author', type: 'link', link: { table: 'users' } },
      { name: 'createdAt', type: 'datetime' }
    ]
  }
] as const;

export type DatabaseSchema = {
  tables: typeof tables;
};

export const XataClient = buildClient<DatabaseSchema>();

let xata: XataClient | undefined;

export const getXataClient = () => {
  if (!xata) {
    xata = new XataClient({
      databaseURL: process.env.XATA_DATABASE_URL,
      apiKey: process.env.XATA_API_KEY
    });
  }
  return xata;
};
```

```ts
// src/lib/schema.ts (自动生成)
export type Users = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
};

export type Posts = {
  id: string;
  title: string;
  content: string;
  slug: string;
  published: boolean;
  author: Users;
  tags: string[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Comments = {
  id: string;
  content: string;
  post: Posts;
  author: Users;
  createdAt: Date;
};

export type DatabaseSchema = {
  users: Users;
  posts: Posts;
  comments: Comments;
};
```

### 用户 CRUD 操作

```tsx
// src/pages/api/users/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getXataClient } from '@/lib/xata';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const xata = getXataClient();

  if (req.method === 'GET') {
    try {
      const users = await xata.db.users
        .select(['*', 'author.*'])
        .sort('createdAt', 'desc')
        .getMany();
      
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: '获取用户列表失败' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, email, avatar, bio } = req.body;
      
      const user = await xata.db.users.create({
        name,
        email,
        avatar,
        bio,
        createdAt: new Date()
      });
      
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: '创建用户失败' });
    }
  }
}
```

```tsx
// src/pages/api/users/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getXataClient } from '@/lib/xata';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const xata = getXataClient();
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const user = await xata.db.users.read(id as string);
      
      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: '获取用户失败' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, email, avatar, bio } = req.body;
      
      const user = await xata.db.users.update(id as string, {
        name,
        email,
        avatar,
        bio
      });
      
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: '更新用户失败' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await xata.db.users.delete(id as string);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: '删除用户失败' });
    }
  }
}
```

```tsx
// src/components/users/UserForm.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';

interface User {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
}

interface UserFormProps {
  initialData?: User;
  userId?: string;
}

export const UserForm = ({ initialData, userId }: UserFormProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState<User>(
    initialData || { name: '', email: '', avatar: '', bio: '' }
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = userId ? `/api/users/${userId}` : '/api/users';
      const method = userId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.push('/users');
      } else {
        const error = await response.json();
        alert(error.error || '操作失败');
      }
    } catch (error) {
      alert('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">姓名</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">邮箱</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">头像 URL</label>
        <input
          type="url"
          value={formData.avatar}
          onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">个人简介</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '保存中...' : userId ? '更新' : '创建'}
      </button>
    </form>
  );
};
```

### 博客文章 CRUD 操作

```tsx
// src/pages/api/posts/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getXataClient } from '@/lib/xata';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const xata = getXataClient();

  if (req.method === 'GET') {
    try {
      const { page = 1, pageSize = 10 } = req.query;
      
      const posts = await xata.db.posts
        .select(['*', 'author.*'])
        .filter('published', true)
        .sort('createdAt', 'desc')
        .getPaginated({
          pagination: {
            size: Number(pageSize),
            offset: (Number(page) - 1) * Number(pageSize)
          }
        });
      
      res.status(200).json(posts);
    } catch (error) {
      res.status(500).json({ error: '获取文章列表失败' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, content, slug, author, tags, published = false } = req.body;
      
      const post = await xata.db.posts.create({
        title,
        content,
        slug,
        author,
        tags,
        published,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ error: '创建文章失败' });
    }
  }
}
```

```tsx
// src/pages/api/posts/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getXataClient } from '@/lib/xata';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const xata = getXataClient();
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const post = await xata.db.posts
        .select(['*', 'author.*'])
        .filter('id', id as string)
        .getFirst();
      
      if (!post) {
        return res.status(404).json({ error: '文章不存在' });
      }
      
      // 增加浏览计数
      await xata.db.posts.update(id as string, {
        viewCount: (post.viewCount || 0) + 1
      });
      
      res.status(200).json(post);
    } catch (error) {
      res.status(500).json({ error: '获取文章失败' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { title, content, slug, tags, published } = req.body;
      
      const post = await xata.db.posts.update(id as string, {
        title,
        content,
        slug,
        tags,
        published,
        updatedAt: new Date()
      });
      
      res.status(200).json(post);
    } catch (error) {
      res.status(500).json({ error: '更新文章失败' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await xata.db.posts.delete(id as string);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: '删除文章失败' });
    }
  }
}
```

```tsx
// src/components/posts/PostList.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  slug: string;
  author: {
    name: string;
    avatar?: string;
  };
  tags: string[];
  viewCount: number;
  createdAt: string;
}

export const PostList = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/posts?page=${page}&pageSize=10`);
      const data = await response.json();
      setPosts(data.records || []);
    } catch (error) {
      console.error('获取文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return;
    
    try {
      await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      setPosts(posts.filter(post => post.id !== id));
    } catch (error) {
      alert('删除失败');
    }
  };

  if (loading) {
    return <div className="text-center py-10">加载中...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">博客文章</h1>
        <Link
          href="/posts/new"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          新建文章
        </Link>
      </div>

      <div className="space-y-4">
        {posts.map(post => (
          <div
            key={post.id}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link href={`/posts/${post.id}`}>
                  <h2 className="text-xl font-bold hover:text-blue-600 transition-colors">
                    {post.title}
                  </h2>
                </Link>
                
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    {post.author.avatar && (
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span>{post.author.name}</span>
                  </div>
                  <span>•</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{post.viewCount} 次浏览</span>
                </div>

                <div className="flex gap-2 mt-3">
                  {post.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <Link
                  href={`/posts/${post.id}/edit`}
                  className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  编辑
                </Link>
                <button
                  onClick={() => deletePost(post.id)}
                  className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-8">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          上一页
        </button>
        <span className="px-4 py-2">第 {page} 页</span>
        <button
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          下一页
        </button>
      </div>
    </div>
  );
};
```

### 全文搜索

```tsx
// src/pages/api/posts/search.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getXataClient } from '@/lib/xata';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const xata = getXataClient();

  if (req.method === 'GET') {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({ error: '搜索关键词不能为空' });
      }

      const posts = await xata.db.posts
        .select(['*', 'author.*'])
        .search(q as string, {
          target: ['title', 'content', 'tags'],
          fuzziness: 2
        });
      
      res.status(200).json(posts);
    } catch (error) {
      res.status(500).json({ error: '搜索失败' });
    }
  }
}
```

```tsx
// src/components/search/SearchBar.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export const SearchBar = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchPosts();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/posts/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索文章..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {loading && (
        <div className="absolute top-full left-0 right-0 mt-1 p-4 bg-white border rounded-lg shadow-lg">
          <p className="text-gray-500">搜索中...</p>
        </div>
      )}

      {results.length > 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((post: any) => (
            <button
              key={post.id}
              onClick={() => {
                router.push(`/posts/${post.id}`);
                setQuery('');
                setResults([]);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
            >
              <p className="font-medium">{post.title}</p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {post.content}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 评论系统

```tsx
// src/components/comments/CommentList.tsx
import { useState, useEffect } from 'react';

interface Comment {
  id: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

interface CommentListProps {
  postId: string;
}

export const CommentList = ({ postId }: CommentListProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('获取评论失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-4 text-gray-500">加载评论中...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">评论 ({comments.length})</h3>
      
      {comments.length === 0 ? (
        <p className="text-gray-500">暂无评论</p>
      ) : (
        comments.map(comment => (
          <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              {comment.author.avatar && (
                <img
                  src={comment.author.avatar}
                  alt={comment.author.name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{comment.author.name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-gray-700">{comment.content}</p>
          </div>
        ))
      )}
    </div>
  );
};
```

```tsx
// src/components/comments/CommentForm.tsx
import { useState } from 'react';

interface CommentFormProps {
  postId: string;
  onCommentAdded: () => void;
}

export const CommentForm = ({ postId, onCommentAdded }: CommentFormProps) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        setContent('');
        onCommentAdded();
      } else {
        alert('评论失败');
      }
    } catch (error) {
      alert('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="写下你的评论..."
        rows={3}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '提交中...' : '发表评论'}
      </button>
    </form>
  );
};
```

## 核心特性

### 1. Serverless PostgreSQL
- 无需管理数据库服务器
- 自动扩展
- 高可用性

### 2. 内置全文搜索
- 强大的搜索功能
- 模糊匹配
- 多字段搜索

### 3. TypeScript 优先
- 自动生成类型
- 类型安全查询
- 优秀的 IDE 支持

### 4. 实时功能
- 实时数据同步
- 订阅变更
- 冲突解决

## 最佳实践

1. **使用环境变量**: 将敏感信息存储在环境变量中
2. **批量操作**: 使用批量创建/更新提高性能
3. **合理使用链接**: 利用表关系减少数据冗余
4. **索引优化**: 为常用查询字段添加索引

## 常见用例

- 博客平台
- 内容管理系统
- 用户管理系统
- 评论系统
- 搜索功能
- 电商应用
- SaaS 应用

## 数据库迁移

```bash
# 生成迁移
npx xata pull main

# 推送 schema 变更
npx xata push main

# 查看数据库状态
npx xata status
```

## 环境变量

```env
# .env.local
XATA_DATABASE_URL=https://your-workspace.xata.sh/db/your-database
XATA_API_KEY=xau_your_api_key_here
```

## 依赖

```json
{
  "dependencies": {
    "@xata.io/client": "^0.28.0",
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.3.3"
  }
}
```
