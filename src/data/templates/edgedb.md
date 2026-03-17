# EdgeDB - 新一代图关系数据库

## 技术栈

- **核心**: EdgeDB 5.x
- **查询语言**: EdgeQL
- **客户端**: edgedb-js / edgedb-python / edgedb-go
- **类型支持**: TypeScript原生支持
- **迁移**: 内置迁移系统
- **UI**: EdgeDB UI (内置Web界面)

## 项目结构

```
project/
├── dbschema/
│   ├── default.esdl        # 默认模块schema
│   ├── modules/
│   │   └── auth.esdl       # 认证模块
│   ├── migrations/         # 迁移文件
│   └── functions/          # 自定义函数
│       └── utils.edgeql
├── src/
│   ├── queries/
│   │   ├── users.edgeql    # 用户查询
│   │   ├── posts.edgeql    # 文章查询
│   │   └── index.ts        # 查询导出
│   ├── client.ts           # EdgeDB客户端
│   ├── types.ts            # 类型定义(自动生成)
│   └── index.ts            # 应用入口
├── tests/
│   └── queries.test.ts     # 查询测试
├── edgedb.toml             # EdgeDB配置
└── package.json
```

## 代码模式

### 1. Schema定义

```edgeql
// dbschema/default.esdl
module default {
  # 用户类型
  type User {
    required property email -> str {
      constraint exclusive;
      constraint expression on (str_ends_with(__subject__, '@example.com'));
    }
    property name -> str;
    property avatar -> str;
    property bio -> str;
    property is_verified -> bool {
      default := false;
    }
    property created_at -> datetime {
      default := datetime_current();
    }
    property updated_at -> datetime {
      default := datetime_current();
    }

    # 链接
    link posts := .<author<Post;
    link comments := .<author<Comment;
    link followers := .<following<User;
    link following := User;

    # 索引
    index on (.email);
    index on (.created_at);
  }

  # 文章类型
  type Post {
    required property title -> str;
    required property content -> str;
    property excerpt -> str;
    property slug -> str {
      constraint exclusive;
    }
    property status -> str {
      default := 'draft';
      constraint one_of('draft', 'published', 'archived');
    }
    property view_count -> int64 {
      default := 0;
    }
    property published_at -> datetime;
    property created_at -> datetime {
      default := datetime_current();
    }
    property updated_at -> datetime {
      default := datetime_current();
    }

    # 链接
    required link author -> User;
    link tags := .<posts<Tag;
    link comments := Comment;

    # 计算属性
    property is_published -> bool {
      using (.status = 'published' and .published_at <= datetime_current());
    };

    # 索引
    index on (.slug);
    index on (.status);
    index on ((.status, .published_at));
  }

  # 评论类型
  type Comment {
    required property content -> str;
    property created_at -> datetime {
      default := datetime_current();
    }
    property updated_at -> datetime {
      default := datetime_current();
    }

    # 链接
    required link author -> User;
    required link post -> Post;

    # 索引
    index on (.post);
  }

  # 标签类型
  type Tag {
    required property name -> str {
      constraint exclusive;
    }
    property slug -> str {
      constraint exclusive;
    }
    property created_at -> datetime {
      default := datetime_current();
    }

    # 多对多链接
    link posts := Post;

    # 索引
    index on (.slug);
  }

  # 访问策略
  access policy allow_select_published
    allow all
    using (.status = 'published');

  access policy allow_all_if_admin
    allow all
    using (
      exists global current_user and
      global current_user.role = 'admin'
    );
}
```

```edgeql
// dbschema/modules/auth.esdl
module auth {
  # 全局变量 - 当前用户
  global current_user -> User;

  # 函数 - 检查权限
  function can_edit_post(post: Post) -> bool using (
    exists global current_user and (
      global.current_user.id = post.author.id or
      global.current_user.role = 'admin'
    )
  );

  # 函数 - 生成slug
  function generate_slug(title: str) -> str using (
    str_lower(
      str_replace(
        str_replace(title, ' ', '-'),
        '_', '-'
      )
    )
  );
}
```

### 2. EdgeQL查询

```edgeql
// src/queries/users.edgeql

# 获取所有用户
SELECT User {
  id,
  email,
  name,
  avatar,
  bio,
  is_verified,
  created_at,
  posts: {
    id,
    title,
    slug,
    status
  } ORDER BY .created_at DESC LIMIT 5,
  followers_count := count(.followers),
  following_count := count(.following)
}
ORDER BY .created_at DESC
```

```edgeql
// src/queries/posts.edgeql

# 创建文章
INSERT Post {
  title := <str>$title,
  content := <str>$content,
  excerpt := <str>$excerpt,
  slug := <str>$slug,
  status := <str>$status,
  author := (SELECT User FILTER .id = <uuid>$author_id),
  published_at := <datetime>$published_at
};

# 获取文章详情
SELECT Post {
  id,
  title,
  content,
  excerpt,
  slug,
  status,
  view_count,
  published_at,
  created_at,
  author: {
    id,
    name,
    avatar
  },
  tags: {
    id,
    name,
    slug
  },
  comments: {
    id,
    content,
    created_at,
    author: {
      id,
      name,
      avatar
    }
  } ORDER BY .created_at DESC,
  comments_count := count(.comments)
}
FILTER .slug = <str>$slug
LIMIT 1;

# 更新文章
UPDATE Post
FILTER .id = <uuid>$id AND .author.id = global.current_user.id
SET {
  title := <str>$title,
  content := <str>$content,
  excerpt := <str>$excerpt,
  status := <str>$status,
  updated_at := datetime_current(),
  published_at := <datetime>$published_at IF .status = 'draft' AND <str>$status = 'published' ELSE .published_at
};

# 删除文章
DELETE Post
FILTER .id = <uuid>$id AND .author.id = global.current_user.id;

# 搜索文章
SELECT Post {
  id,
  title,
  excerpt,
  slug,
  author: {
    name
  },
  published_at
}
FILTER .status = 'published' AND (
  str_lower(.title) LIKE '%' ++ str_lower(<str>$query) ++ '%' OR
  str_lower(.content) LIKE '%' ++ str_lower(<str>$query) ++ '%'
)
ORDER BY .published_at DESC
LIMIT 20;

# 分页查询
SELECT Post {
  id,
  title,
  slug,
  author: { name },
  published_at
}
FILTER .status = 'published'
ORDER BY .published_at DESC
OFFSET <int64>$offset
LIMIT <int64>$limit;

# 聚合统计
SELECT {
  total_posts := count(Post),
  published_posts := count(Post FILTER .status = 'published'),
  draft_posts := count(Post FILTER .status = 'draft'),
  total_users := count(User),
  posts_by_status := (
    SELECT Post {
      status,
      count := count(Post FILTER .status = Post.status)
    }
    GROUP BY .status
  )
};
```

### 3. 客户端使用

```typescript
// src/client.ts
import { createClient } from 'edgedb'
import { createClient as createHttpClient } from 'edgedb/http'

// 标准客户端
const client = createClient({
  instance: 'my_instance',
  database: 'myapp',
  tlsSecurity: 'default'
})

// HTTP客户端(用于无状态环境)
const httpClient = createHttpClient({
  instance: 'my_instance',
  database: 'myapp',
  secretKey: process.env.EDGEDB_SECRET_KEY!
})

export { client, httpClient }
```

```typescript
// src/queries/index.ts
import { client } from '../client'
import e from '../dbschema/edgeql-js'

// 获取所有用户
export async function getUsers() {
  const query = e.select(e.User, (user) => ({
    id: true,
    email: true,
    name: true,
    avatar: true,
    bio: true,
    is_verified: true,
    created_at: true,
    posts: {
      id: true,
      title: true,
      slug: true,
      status: true
    },
    followers_count: e.count(user.followers),
    following_count: e.count(user.following),
    order_by: {
      expression: user.created_at,
          direction: e.DESC
        }
  }))

  return query.run(client)
}

// 获取用户详情
export async function getUserById(id: string) {
  const query = e.select(e.User, (user) => ({
    filter_single: { id }
  }))

  return query.run(client)
}

// 创建用户
export async function createUser(userData: {
  email: string
  name: string
  avatar?: string
  bio?: string
}) {
  const query = e.insert(e.User, {
    email: userData.email,
    name: userData.name,
    avatar: userData.avatar || null,
    bio: userData.bio || null
  })

  return query.run(client)
}

// 更新用户
export async function updateUser(
  id: string,
  userData: Partial<{
    name: string
    avatar: string
    bio: string
    is_verified: boolean
  }>
) {
  const query = e.update(e.User, (user) => ({
    filter_single: { id },
    set: {
      ...userData,
      updated_at: new Date()
    }
  }))

  return query.run(client)
}

// 删除用户
export async function deleteUser(id: string) {
  const query = e.delete(e.User, (user) => ({
    filter_single: { id }
  }))

  return query.run(client)
}

// 获取文章列表
export async function getPosts(options: {
  status?: 'draft' | 'published' | 'archived'
  limit?: number
  offset?: number
}) {
  const query = e.select(e.Post, (post) => ({
    id: true,
    title: true,
    slug: true,
    excerpt: true,
    status: true,
    view_count: true,
    published_at: true,
    created_at: true,
    author: {
      id: true,
      name: true,
      avatar: true
    },
    tags: {
      id: true,
      name: true,
      slug: true
    },
    comments_count: e.count(post.comments),
    filter: options.status ? e.op(post.status, '=', options.status) : undefined,
    order_by: {
      expression: post.created_at,
          direction: e.DESC
        },
        limit: options.limit || 20,
        offset: options.offset || 0
  }))

  return query.run(client)
}

// 创建文章
export async function createPost(postData: {
  title: string
  content: string
  excerpt?: string
  slug: string
  author_id: string
  tag_ids?: string[]
}) {
  const query = e.insert(e.Post, {
    title: postData.title,
    content: postData.content,
    excerpt: postData.excerpt || null,
    slug: postData.slug,
    author: e.select(e.User, (user) => ({
      filter_single: { id: postData.author_id }
    })),
    tags: postData.tag_ids
      ? e.select(e.Tag, (tag) => ({
          filter: e.op(tag.id, 'in', e.set(...postData.tag_ids))
        }))
      : undefined
  })

  return query.run(client)
}

// 搜索文章
export async function searchPosts(query: string) {
  const searchQuery = `%${query.toLowerCase()}%`

  const q = e.select(e.Post, (post) => ({
    id: true,
    title: true,
    slug: true,
    excerpt: true,
    author: {
      name: true
    },
    published_at: true,
    filter: e.op(
      e.op(post.status, '=', 'published'),
      'and',
      e.op(
        e.op(e.str_lower(post.title), 'like', searchQuery),
        'or',
        e.op(e.str_lower(post.content), 'like', searchQuery)
      )
    ),
    order_by: {
      expression: post.published_at,
          direction: e.DESC
        }
  }))

  return q.run(client)
}
```

### 4. 事务处理

```typescript
// src/transactions.ts
import { client } from './client'
import e from '../dbschema/edgeql-js'

// 创建文章和标签(事务)
export async function createPostWithTags(data: {
  title: string
  content: string
  slug: string
  author_id: string
  tags: string[]
}) {
  return await client.transaction(async (tx) => {
    // 1. 确保标签存在
    for (const tagName of data.tags) {
      await e
        .insert(e.Tag, {
          name: tagName,
          slug: tagName.toLowerCase().replace(/\s+/g, '-')
        })
        .unless_conflict((tag) => ({
          on: tag.name
        }))
        .run(tx)
    }

    // 2. 创建文章
    const post = await e
      .insert(e.Post, {
        title: data.title,
        content: data.content,
        slug: data.slug,
        author: e.select(e.User, (user) => ({
          filter_single: { id: data.author_id }
        })),
        tags: e.select(e.Tag, (tag) => ({
          filter: e.op(tag.name, 'in', e.set(...data.tags))
        }))
      })
      .run(tx)

    return post
  })
}

// 转移文章所有权(事务)
export async function transferPostOwnership(postId: string, newAuthorId: string) {
  return await client.transaction(async (tx) => {
    // 1. 验证新作者存在
    const newAuthor = await e
      .select(e.User, (user) => ({
        filter_single: { id: newAuthorId }
      }))
      .run(tx)

    if (!newAuthor) {
      throw new Error('New author not found')
    }

    // 2. 更新文章作者
    const post = await e
      .update(e.Post, (post) => ({
        filter_single: { id: postId },
        set: {
          author: e.select(e.User, (user) => ({
            filter_single: { id: newAuthorId }
          }))
        }
      }))
      .run(tx)

    return post
  })
}
```

### 5. 实时订阅

```typescript
// src/subscriptions.ts
import { client } from './client'
import e from '../dbschema/edgeql-js'

// 订阅文章变化
export function subscribeToPosts(onChange: (posts: any) => void) {
  const query = e.select(e.Post, (post) => ({
    id: true,
    title: true,
    slug: true,
    status: true,
    author: {
      name: true
    },
    order_by: {
      expression: post.created_at,
          direction: e.DESC
        }
  }))

  return query.subscribe(client, {
    onResult: onChange
  })
}

// 订阅特定文章的评论
export function subscribeToComments(postId: string, onChange: (comments: any) => void) {
  const query = e.select(e.Comment, (comment) => ({
    id: true,
    content: true,
    created_at: true,
    author: {
      id: true,
      name: true,
      avatar: true
    },
    filter: e.op(comment.post.id, '=', postId),
    order_by: {
      expression: comment.created_at,
          direction: e.DESC
        }
  }))

  return query.subscribe(client, {
    onResult: onChange
  })
}
```

## 最佳实践

### 1. Schema设计

```edgeql
# 使用计算属性
type Product {
  property price -> float64;
  property discount -> float64;

  # 计算属性
  property final_price -> float64 {
    using (.price * (1 - .discount));
  };
}

# 使用联合类型
type Content {
  property media_type -> str {
    constraint one_of('image', 'video', 'audio');
  }
  property media_data -> json;
}

# 使用多态
abstract type Node {
  required property name -> str;
  property created_at -> datetime {
    default := datetime_current();
  }
}

type User extending Node {
  property email -> str;
}

type Post extending Node {
  property content -> str;
}
```

### 2. 查询优化

```edgeql
# 使用SELECT形状限制字段
SELECT User {
  id,
  name
  # 只选择需要的字段
}
FILTER .id = <uuid>$id;

# 使用EXPLAIN分析查询
EXPLAIN SELECT User {
  posts: {
    title
  }
};

# 使用链接预加载
SELECT User {
  name,
  posts: {
    title
  } @include(if := <bool>$include_posts)
};

# 使用批量操作
FOR item IN {array_unpack(<array<json>>$items)}
UNION (
  INSERT Post {
    title := <str>item['title'],
    content := <str>item['content']
  }
);
```

### 3. 访问控制

```edgeql
# 基于角色的访问控制
type Post {
  required property title -> str;
  required link author -> User;

  # 所有人可以读取已发布的文章
  access policy allow_read_published
    allow select
    using (.status = 'published');

  # 作者可以读写自己的文章
  access policy allow_owner_full
    allow all
    using (
      exists global current_user and
      .author.id = global.current_user.id
    );

  # 管理员可以访问所有内容
  access policy allow_admin_full
    allow all
    using (
      exists global.current_user and
      global.current_user.role = 'admin'
    );
}
```

### 4. 迁移管理

```bash
# 创建迁移
edgedb migration create

# 应用迁移
edgedb migrate

# 查看迁移状态
edgedb migration status

# 回滚迁移
edgedb migration apply --to-revision <revision>
```

```typescript
// 使用迁移API
import { migrate } from 'edgedb/migrate'

await migrate({
  instance: 'my_instance',
  database: 'myapp',
  migrationsDir: './dbschema/migrations'
})
```

### 5. 测试策略

```typescript
// tests/queries.test.ts
import { createClient } from 'edgedb'
import { beforeEach, afterAll, describe, it, expect } from 'vitest'

const client = createClient()

describe('User queries', () => {
  let testUserId: string

  beforeEach(async () => {
    // 创建测试用户
    const user = await client.querySingle(`
      INSERT User {
        email := 'test@example.com',
        name := 'Test User'
      }
    `)
    testUserId = user.id
  })

  afterAll(async () => {
    // 清理测试数据
    await client.query(`
      DELETE User FILTER .email LIKE '%@example.com'
    `)
  })

  it('should create a user', async () => {
    const user = await client.querySingle(`
      SELECT User {
        id,
        email,
        name
      }
      FILTER .id = <uuid>$id
    `, { id: testUserId })

    expect(user.email).toBe('test@example.com')
    expect(user.name).toBe('Test User')
  })
})
```

## 常用命令

```bash
# 安装EdgeDB
curl --proto '=https' --tlsv1.2 -sSf https://sh.edgedb.com | sh

# 初始化项目
edgedb project init

# 启动实例
edgedb instance start my_instance

# 连接到数据库
edgedb -I my_instance

# 创建迁移
edgedb migration create

# 应用迁移
edgedb migrate

# 生成查询类型
npx @edgedb/generate edgeql-js
npx @edgedb/generate queries

# 打开UI
edgedb ui

# 备份数据库
edgedb instance backup -I my_instance

# 恢复数据库
edgedb instance restore -I my_instance backup.dump
```

## 部署配置

### 1. EdgeDB Cloud

```bash
# 创建云实例
edgedb instance create myapp --cloud

# 连接到云实例
edgedb -I myapp
```

### 2. Docker部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  edgedb:
    image: edgedb/edgedb:5
    environment:
      EDGEDB_SERVER_SECURITY: insecure_dev_mode
      EDGEDB_SERVER_PASSWORD: secret
    ports:
      - "5656:5656"
    volumes:
      - edgedb_data:/var/lib/edgedb/data

volumes:
  edgedb_data:
```

### 3. 环境配置

```toml
# edgedb.toml
[edgedb]
server-version = "5.0"

[database]
name = "myapp"

[connection]
host = "localhost"
port = 5656
```

### 4. 生产配置

```typescript
// 生产环境客户端
import { createClient, Options } from 'edgedb'

const options: Options = {
  instance: process.env.EDGEDB_INSTANCE,
  database: process.env.EDGEDB_DATABASE,
  tlsSecurity: 'strict',
  secretKey: process.env.EDGEDB_SECRET_KEY,
  maxConcurrency: 50
}

const client = createClient(options)
```

## 关键特性

- 📊 **图关系模型**: 强大的关系查询能力
- 🔍 **EdgeQL**: 声明式查询语言
- 🔒 **类型安全**: 编译时类型检查
- 🔄 **实时订阅**: 内置实时数据同步
- 🎯 **访问控制**: 声明式权限系统
- 📦 **内置迁移**: 版本化schema管理
- 🖥️ **Web UI**: 可视化管理界面
- 🚀 **高性能**: 优化的查询执行
- 🌐 **多语言**: JS/TS, Python, Go客户端
- ☁️ **云服务**: EdgeDB Cloud托管
