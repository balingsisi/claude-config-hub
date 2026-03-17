# KeystoneJS 6 - Node.js 无头 CMS

强大的 GraphQL 无头 CMS 和 API 平台，基于 Prisma 和 Apollo Server，支持快速构建内容驱动的应用。

## 技术栈

- **核心**: KeystoneJS 6.x
- **数据库**: PostgreSQL / MySQL / SQLite
- **ORM**: Prisma
- **API**: GraphQL (Apollo Server)
- **UI**: Admin UI (开箱即用)
- **认证**: 内置认证系统
- **语言**: TypeScript

## 项目结构

```
keystone-project/
├── keystone.ts               # Keystone 配置入口
├── schema.ts                 # Schema 定义
├── schema.graphql            # 生成的 GraphQL schema
├── src/
│   ├── schemas/              # List schemas
│   │   ├── User.ts
│   │   ├── Post.ts
│   │   ├── Comment.ts
│   │   └── Tag.ts
│   ├── access/               # 访问控制
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   └── permissions.ts
│   ├── fields/               # 自定义字段
│   │   └── SlugField.ts
│   ├── lib/                  # 工具库
│   │   ├── graphql.ts
│   │   └── utils.ts
│   ├── hooks/                # 生命周期钩子
│   │   ├── post.hooks.ts
│   │   └── user.hooks.ts
│   ├── seed/                 # 种子数据
│   │   └── index.ts
│   └── extensions/           # GraphQL 扩展
│       └── custom-mutations.ts
├── prisma/
│   └── migrations/           # Prisma 迁移
├── public/                   # 静态文件
├── tests/
│   ├── api.test.ts
│   └── access.test.ts
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## 核心代码模式

### 1. Keystone 配置 (keystone.ts)

```typescript
import { config } from '@keystone-6/core';
import { lists } from './schema';
import { withAuth, session } from './src/access/auth';
import { insertSeedData } from './src/seed';

export default withAuth(
  config({
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL!,
      enableLogging: process.env.NODE_ENV === 'development',
      useMigrations: true,
      onConnect: async (context) => {
        if (process.argv.includes('--seed-data')) {
          await insertSeedData(context);
        }
      },
    },
    lists,
    session,
    server: {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
      healthCheck: {
        path: '/health',
        data: () => ({
          status: 'healthy',
          timestamp: new Date().toISOString(),
        }),
      },
    },
    graphql: {
      path: '/api/graphql',
      playground: process.env.NODE_ENV !== 'production',
      apolloConfig: {
        introspection: true,
      },
    },
    ui: {
      isAccessAllowed: (context) => !!context.session?.data,
      publicPages: ['/signin', '/signup'],
    },
    experimental: {
      generateNextGraphqlApi: true,
      generateNodeAPI: true,
    },
  })
);
```

### 2. Schema 定义 (src/schemas/User.ts)

```typescript
import { list } from '@keystone-6/core';
import {
  text,
  password,
  timestamp,
  image,
  relationship,
  checkbox,
  select,
} from '@keystone-6/core/fields';
import { document } from '@keystone-6/fields-document';
import { isSignedIn, permissions } from '../access/auth';

export const User = list({
  fields: {
    name: text({
      validation: { isRequired: true },
      ui: {
        description: '用户显示名称',
      },
    }),
    email: text({
      validation: { isRequired: true },
      isIndexed: 'unique',
      ui: {
        description: '登录邮箱',
      },
    }),
    password: password({
      validation: { isRequired: true },
      ui: {
        itemView: { fieldMode: 'hidden' },
        createView: { fieldMode: 'edit' },
      },
    }),
    avatar: image({
      storage: 'images',
    }),
    bio: text({
      ui: { displayMode: 'textarea' },
    }),
    role: select({
      type: 'enum',
      options: [
        { label: '管理员', value: 'admin' },
        { label: '编辑', value: 'editor' },
        { label: '作者', value: 'author' },
        { label: '用户', value: 'user' },
      ],
      defaultValue: 'user',
      validation: { isRequired: true },
      ui: { displayMode: 'segmented-control' },
    }),
    isVerified: checkbox({
      defaultValue: false,
    }),
    posts: relationship({
      ref: 'Post.author',
      many: true,
      ui: {
        displayMode: 'count',
        listViewFieldMode: 'read',
      },
    }),
    comments: relationship({
      ref: 'Comment.author',
      many: true,
      ui: {
        displayMode: 'count',
        listViewFieldMode: 'read',
      },
    }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
      validation: { isRequired: true },
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
      },
    }),
    updatedAt: timestamp({
      db: { updatedAtAt: true },
      validation: { isRequired: true },
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
      },
    }),
  },
  access: {
    operation: {
      create: permissions.canManageUsers,
      query: () => true,
      update: permissions.canManageUsers,
      delete: permissions.canManageUsers,
    },
    filter: {
      query: () => true,
      update: permissions.ownOrAdmin,
      delete: permissions.ownOrAdmin,
    },
  },
  hooks: {
    beforeOperation: async ({ operation, inputData, item, context }) => {
      if (operation === 'create' || operation === 'update') {
        // 密码自动哈希处理（Keystone 自动处理）
        if (inputData?.email) {
          inputData.email = inputData.email.toLowerCase().trim();
        }
      }
    },
    afterOperation: async ({ operation, item, context }) => {
      if (operation === 'create') {
        console.log(`新用户创建: ${item.id}`);
        // 发送欢迎邮件等
      }
    },
    resolveInput: async ({ operation, inputData, item, context }) => {
      if (operation === 'create' || operation === 'update') {
        // 自动生成头像 URL
        if (inputData?.name && !inputData?.avatar) {
          // 使用 Gravatar 或其他服务
        }
      }
      return inputData;
    },
  },
  ui: {
    label: '用户',
    listView: {
      initialColumns: ['name', 'email', 'role', 'isVerified', 'createdAt'],
      defaultFieldMode: 'read',
    },
    labelField: 'name',
  },
});
```

### 3. Post Schema (src/schemas/Post.ts)

```typescript
import { list } from '@keystone-6/core';
import {
  text,
  timestamp,
  relationship,
  select,
  integer,
  checkbox,
  virtual,
} from '@keystone-6/core/fields';
import { document } from '@keystone-6/fields-document';
import { isSignedIn, permissions, rules } from '../access/auth';

// 文档字段配置
const contentDocument = document({
  formatting: {
    inlineMarks: {
      bold: true,
      italic: true,
      underline: true,
      strikethrough: true,
      code: true,
    },
    listTypes: {
      ordered: true,
      unordered: true,
    },
    headingLevels: [1, 2, 3, 4],
    blockTypes: {
      blockquote: true,
      code: {
        component: ({ value }) => {
          return `<pre><code>${value}</code></pre>`;
        },
      },
    },
  },
  dividers: true,
  layouts: [
    [1, 1],
    [1, 1, 1],
    [2, 1],
    [1, 2],
  ],
  links: true,
  relationships: {
    inline: true,
  },
});

export const Post = list({
  fields: {
    title: text({
      validation: { isRequired: true },
      isIndexed: true,
      ui: { description: '文章标题' },
    }),
    slug: text({
      isIndexed: 'unique',
      validation: { isRequired: true },
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
      },
    }),
    excerpt: text({
      ui: {
        displayMode: 'textarea',
        description: '文章摘要',
      },
    }),
    content: contentDocument,
    featuredImage: image({
      storage: 'images',
    }),
    status: select({
      type: 'enum',
      options: [
        { label: '草稿', value: 'draft' },
        { label: '已发布', value: 'published' },
        { label: '已归档', value: 'archived' },
      ],
      defaultValue: 'draft',
      validation: { isRequired: true },
      ui: { displayMode: 'segmented-control' },
    }),
    author: relationship({
      ref: 'User.posts',
      many: false,
      ui: {
        displayMode: 'cards',
        cardFields: ['name', 'email', 'avatar'],
        inlineEdit: { fields: ['name'] },
        createView: { fieldMode: 'edit' },
      },
    }),
    tags: relationship({
      ref: 'Tag.posts',
      many: true,
      ui: {
        displayMode: 'cards',
        cardFields: ['name'],
        inlineEdit: { fields: ['name', 'slug'] },
      },
    }),
    comments: relationship({
      ref: 'Comment.post',
      many: true,
      ui: {
        displayMode: 'count',
        listViewFieldMode: 'read',
      },
    }),
    viewCount: integer({
      defaultValue: 0,
      validation: { isRequired: true },
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
      },
    }),
    isFeatured: checkbox({
      defaultValue: false,
      ui: { description: '是否为精选文章' },
    }),
    allowComments: checkbox({
      defaultValue: true,
      ui: { description: '是否允许评论' },
    }),
    publishedAt: timestamp({
      ui: {
        description: '发布时间',
      },
    }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
      validation: { isRequired: true },
    }),
    updatedAt: timestamp({
      db: { updatedAtAt: true },
      validation: { isRequired: true },
    }),
    // 虚拟字段
    readingTime: virtual({
      field: graphql.field({
        type: graphql.Int,
        resolve: async (item, args, context) => {
          // 计算阅读时间
          const content = item.content;
          if (!content) return 0;
          const wordCount = content.document
            .map((block: any) => block.text || '')
            .join(' ')
            .split(/\s+/).length;
          return Math.ceil(wordCount / 200); // 200 words per minute
        },
      }),
    }),
  },
  access: {
    operation: {
      create: isSignedIn,
      query: () => true,
      update: permissions.canManagePosts,
      delete: permissions.canManagePosts,
    },
    filter: {
      query: rules.canReadPosts,
      update: rules.canManagePosts,
      delete: rules.canManagePosts,
    },
  },
  hooks: {
    resolveInput: async ({ operation, inputData, item, context }) => {
      const data = { ...inputData };

      // 自动生成 slug
      if (operation === 'create' || (operation === 'update' && inputData.title)) {
        const title = inputData.title || item?.title;
        data.slug = title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
      }

      // 发布时自动设置 publishedAt
      if (
        inputData.status === 'published' &&
        (!item || item.status !== 'published')
      ) {
        data.publishedAt = new Date().toISOString();
      }

      // 自动生成 excerpt
      if (
        operation === 'create' ||
        (operation === 'update' && inputData.content && !inputData.excerpt)
      ) {
        const content = inputData.content || item?.content;
        if (content?.document) {
          const text = content.document
            .map((block: any) => block.text || '')
            .join(' ');
          data.excerpt = text.substring(0, 200) + (text.length > 200 ? '...' : '');
        }
      }

      return data;
    },
    afterOperation: async ({ operation, item, context }) => {
      if (operation === 'create') {
        console.log(`文章创建: ${item.id}`);
      }
      if (operation === 'update' && item.status === 'published') {
        // 清除缓存
        // 发送通知
      }
    },
  },
  ui: {
    label: '文章',
    listView: {
      initialColumns: ['title', 'status', 'author', 'publishedAt', 'viewCount'],
      defaultFieldMode: 'read',
      pageSize: 20,
    },
    labelField: 'title',
    searchFields: ['title', 'content'],
  },
});
```

### 4. 访问控制 (src/access/auth.ts)

```typescript
import { createAuth } from '@keystone-6/auth';
import { statelessSessions } from '@keystone-6/core/session';
import { list } from '@keystone-6/core';
import { permissionsList } from './permissions';

// 认证配置
export const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  secretField: 'password',
  sessionData: 'id name email role',
  initFirstItem: {
    fields: ['name', 'email', 'password'],
    itemData: {
      role: 'admin',
    },
  },
  passwordResetLink: {
    sendToken: async ({ itemId, identity, token, context }) => {
      // 发送密码重置邮件
      console.log(`发送重置邮件到: ${identity}`);
      console.log(`Token: ${token}`);
    },
  },
});

// Session 配置
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV !== 'production') {
  sessionSecret = '-- DEV SECRET --';
}

export const session = statelessSessions({
  maxAge: 60 * 60 * 24 * 30, // 30 天
  secret: sessionSecret!,
});

// 权限检查函数
export const isSignedIn = (context: any) => {
  return !!context.session?.data;
};

export const permissions = {
  canManageUsers: (context: any) => {
    return isSignedIn(context) && ['admin'].includes(context.session.data.role);
  },
  canManagePosts: (context: any) => {
    return (
      isSignedIn(context) &&
      ['admin', 'editor', 'author'].includes(context.session.data.role)
    );
  },
  canManageContent: (context: any) => {
    return (
      isSignedIn(context) &&
      ['admin', 'editor'].includes(context.session.data.role)
    );
  },
  ownOrAdmin: (context: any) => {
    if (!isSignedIn(context)) return false;
    if (context.session.data.role === 'admin') return true;
    return { id: { equals: context.session.data.id } };
  },
};

// 过滤规则
export const rules = {
  canReadPosts: (context: any) => {
    if (!isSignedIn(context)) {
      return { status: { equals: 'published' } };
    }
    if (['admin', 'editor'].includes(context.session.data.role)) {
      return true;
    }
    return {
      OR: [
        { status: { equals: 'published' } },
        { author: { id: { equals: context.session.data.id } } },
      ],
    };
  },
  canManagePosts: (context: any) => {
    if (!isSignedIn(context)) return false;
    if (['admin', 'editor'].includes(context.session.data.role)) {
      return true;
    }
    return { author: { id: { equals: context.session.data.id } } };
  },
};
```

### 5. 自定义 GraphQL 扩展 (src/extensions/custom-mutations.ts)

```typescript
import { graphql } from '@keystone-6/core';
import { Context } from '.keystone/types';

export const extendGraphqlSchema = graphql.extend((base) => {
  return {
    query: {
      // 搜索文章
      searchPosts: graphql.field({
        type: graphql.nonNull(graphql.list(base.object('Post'))),
        args: {
          query: graphql.arg({ type: graphql.nonNull(graphql.String) }),
          limit: graphql.arg({ type: graphql.Int, defaultValue: 10 }),
        },
        resolve: async (root, { query, limit }, context: Context) => {
          return context.db.Post.findMany({
            where: {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } },
              ],
              status: { equals: 'published' },
            },
            take: limit,
            orderBy: { publishedAt: 'desc' },
          });
        },
      }),
      // 获取统计数据
      getStats: graphql.field({
        type: graphql.object({
          name: 'Stats',
          fields: {
            userCount: graphql.field({ type: graphql.Int }),
            postCount: graphql.field({ type: graphql.Int }),
            commentCount: graphql.field({ type: graphql.Int }),
          },
        }),
        resolve: async (root, args, context: Context) => {
          const [userCount, postCount, commentCount] = await Promise.all([
            context.db.User.count(),
            context.db.Post.count({ where: { status: { equals: 'published' } } }),
            context.db.Comment.count(),
          ]);
          return { userCount, postCount, commentCount };
        },
      }),
    },
    mutation: {
      // 发布文章
      publishPost: graphql.field({
        type: base.object('Post'),
        args: {
          id: graphql.arg({ type: graphql.nonNull(graphql.ID) }),
        },
        resolve: async (root, { id }, context: Context) => {
          if (!context.session?.data) {
            throw new Error('未授权');
          }

          const post = await context.db.Post.findOne({
            where: { id: parseInt(id) },
          });

          if (!post) {
            throw new Error('文章不存在');
          }

          if (
            post.authorId !== context.session.data.id &&
            context.session.data.role !== 'admin'
          ) {
            throw new Error('无权限');
          }

          return context.db.Post.updateOne({
            where: { id: parseInt(id) },
            data: {
              status: 'published',
              publishedAt: new Date().toISOString(),
            },
          });
        },
      }),
      // 批量删除
      bulkDeletePosts: graphql.field({
        type: graphql.object({
          name: 'BulkDeleteResult',
          fields: {
            count: graphql.field({ type: graphql.Int }),
          },
        }),
        args: {
          ids: graphql.arg({ type: graphql.nonNull(graphql.list(graphql.ID)) }),
        },
        resolve: async (root, { ids }, context: Context) => {
          if (!context.session?.data || context.session.data.role !== 'admin') {
            throw new Error('无权限');
          }

          const result = await context.db.Post.deleteMany({
            where: {
              id: { in: ids.map((id) => parseInt(id)) },
            },
          });

          return { count: result.length };
        },
      }),
    },
  };
});
```

### 6. 种子数据 (src/seed/index.ts)

```typescript
import { Context } from '.keystone/types';

export async function insertSeedData(context: Context) {
  console.log('🌱 开始插入种子数据...');

  // 创建用户
  const users = await Promise.all([
    context.db.User.createOne({
      data: {
        name: '管理员',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        isVerified: true,
      },
    }),
    context.db.User.createOne({
      data: {
        name: '编辑员',
        email: 'editor@example.com',
        password: 'editor123',
        role: 'editor',
        isVerified: true,
      },
    }),
  ]);

  console.log(`✅ 创建了 ${users.length} 个用户`);

  // 创建标签
  const tags = await Promise.all([
    context.db.Tag.createOne({
      data: { name: '技术', slug: 'tech' },
    }),
    context.db.Tag.createOne({
      data: { name: '生活', slug: 'life' },
    }),
    context.db.Tag.createOne({
      data: { name: '教程', slug: 'tutorial' },
    }),
  ]);

  console.log(`✅ 创建了 ${tags.length} 个标签`);

  // 创建文章
  const posts = await Promise.all([
    context.db.Post.createOne({
      data: {
        title: 'KeystoneJS 入门指南',
        slug: 'keystonejs-getting-started',
        excerpt: '学习如何使用 KeystoneJS 构建强大的内容管理系统',
        content: {
          document: [
            {
              type: 'paragraph',
              children: [{ text: '这是一篇关于 KeystoneJS 的教程文章...' }],
            },
          ],
        },
        status: 'published',
        author: { connect: { id: users[0].id } },
        tags: { connect: [{ id: tags[0].id }, { id: tags[2].id }] },
        publishedAt: new Date().toISOString(),
      },
    }),
    context.db.Post.createOne({
      data: {
        title: 'GraphQL 最佳实践',
        slug: 'graphql-best-practices',
        excerpt: '探索 GraphQL API 设计的最佳实践',
        content: {
          document: [
            {
              type: 'paragraph',
              children: [{ text: 'GraphQL 是一种强大的查询语言...' }],
            },
          ],
        },
        status: 'published',
        author: { connect: { id: users[1].id } },
        tags: { connect: [{ id: tags[0].id }] },
        publishedAt: new Date().toISOString(),
      },
    }),
  ]);

  console.log(`✅ 创建了 ${posts.length} 篇文章`);
  console.log('🎉 种子数据插入完成！');
}
```

### 7. 文件存储配置 (keystone.ts 扩展)

```typescript
import { config } from '@keystone-6/core';
import { localFile, s3File } from '@keystone-6/core/dist/fields/file';

export default config({
  // ... 其他配置
  storage: {
    // 本地存储（开发）
    images_local: {
      kind: 'local',
      type: 'image',
      generateUrl: (path) => `http://localhost:3000/images/${path}`,
      serverRoute: {
        path: '/images',
      },
      storagePath: 'public/images',
    },
    // S3 存储（生产）
    images_s3: {
      kind: 's3',
      type: 'image',
      bucketName: process.env.S3_BUCKET!,
      region: process.env.S3_REGION!,
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      signed: { expiry: 3600 },
    },
    // 根据环境选择
    images: process.env.NODE_ENV === 'production' 
      ? { storage: 'images_s3' }
      : { storage: 'images_local' },
  },
});
```

### 8. 环境变量 (.env.example)

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/keystone"

# Session
SESSION_SECRET="your-secret-key-at-least-32-chars"

# 服务端口
PORT=3000

# 前端 URL
FRONTEND_URL="http://localhost:3001"

# S3 存储（可选）
S3_BUCKET="your-bucket"
S3_REGION="us-east-1"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"

# 邮件服务（可选）
MAILGUN_API_KEY="your-mailgun-key"
MAILGUN_DOMAIN="your-domain.com"
```

### 9. Package Scripts (package.json)

```json
{
  "name": "keystone-cms",
  "version": "1.0.0",
  "scripts": {
    "dev": "keystone dev",
    "start": "keystone start",
    "build": "keystone build",
    "prisma:migrate": "keystone prisma migrate dev",
    "prisma:studio": "keystone prisma studio",
    "seed": "keystone dev --seed-data",
    "generate": "keystone build --no-ui",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "@keystone-6/auth": "^8.0.0",
    "@keystone-6/core": "^6.3.0",
    "@keystone-6/fields-document": "^9.0.0",
    "typescript": "^5.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "prisma": "^5.9.0",
    "typescript": "^5.3.0"
  }
}
```

### 10. 前端查询示例

```typescript
// 查询文章列表
const GET_POSTS = gql`
  query GetPosts($skip: Int!, $take: Int!) {
    posts(
      skip: $skip
      take: $take
      where: { status: { equals: "published" } }
      orderBy: { publishedAt: desc }
    ) {
      id
      title
      slug
      excerpt
      featuredImage {
        url
      }
      author {
        name
        avatar {
          url
        }
      }
      tags {
        name
        slug
      }
      publishedAt
      viewCount
    }
    postsCount(where: { status: { equals: "published" } })
  }
`;

// 查询单篇文章
const GET_POST = gql`
  query GetPost($slug: String!) {
    post(where: { slug: $slug }) {
      id
      title
      content {
        document
      }
      author {
        name
        bio
        avatar {
          url
        }
      }
      tags {
        name
        slug
      }
      publishedAt
      viewCount
      comments {
        id
        content
        author {
          name
        }
        createdAt
      }
    }
  }
`;

// 创建评论
const CREATE_COMMENT = gql`
  mutation CreateComment($data: CommentCreateInput!) {
    createComment(data: $data) {
      id
      content
      createdAt
    }
  }
`;
```

## KeystoneJS 特色功能

### 1. 自动生成的 Admin UI
- 开箱即用的管理界面
- 支持 CRUD 操作
- 可自定义字段显示
- 支持搜索和过滤

### 2. 强大的字段类型
- 文本、数字、日期
- 图片、文件上传
- 富文本编辑器
- 关系字段
- 虚拟字段

### 3. 访问控制
- 操作级别控制
- 字段级别控制
- 数据过滤
- 基于角色的权限

### 4. 生命周期钩子
- resolveInput: 修改输入数据
- beforeOperation: 操作前处理
- afterOperation: 操作后处理
- validateInput: 验证输入

## 最佳实践

1. **Schema 设计**
   - 合理拆分 List
   - 使用关系而非嵌套
   - 善用虚拟字段

2. **访问控制**
   - 最小权限原则
   - 分层权限设计
   - 审计日志

3. **性能优化**
   - 使用分页
   - 限制关联深度
   - 启用缓存

4. **安全配置**
   - 强密码策略
   - Session 管理
   - 输入验证

## 常用命令

```bash
# 创建项目
npm create keystone@latest my-cms

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 运行迁移
npm run prisma:migrate

# 插入种子数据
npm run seed

# 打开 Prisma Studio
npm run prisma:studio
```

## 参考资源

- [KeystoneJS 官方文档](https://keystonejs.com)
- [KeystoneJS GitHub](https://github.com/keystonejs/keystone)
- [Prisma 文档](https://www.prisma.io/docs)
- [GraphQL 最佳实践](https://graphql.org/learn/)
