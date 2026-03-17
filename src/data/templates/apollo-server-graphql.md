# Apollo Server GraphQL API 模板

## 技术栈

- **GraphQL Server**: Apollo Server 4
- **运行时**: Node.js / TypeScript
- **数据库**: PostgreSQL + Prisma
- **认证**: JWT + bcrypt
- **订阅**: WebSocket (graphql-ws)
- **文件上传**: graphql-upload
- **缓存**: Redis (可选)
- **测试**: Jest / Vitest

## 项目结构

```
apollo-server-graphql/
├── src/
│   ├── index.ts                 # 服务器入口
│   ├── schema.ts                # Schema 聚合
│   ├── resolvers/
│   │   ├── index.ts            # Resolver 聚合
│   │   ├── Query.ts            # 查询
│   │   ├── Mutation.ts         # 变更
│   │   ├── Subscription.ts     # 订阅
│   │   ├── User.ts             # 用户类型
│   │   ├── Post.ts             # 文章类型
│   │   └── Comment.ts          # 评论类型
│   ├── models/
│   │   ├── User.ts
│   │   ├── Post.ts
│   │   └── Comment.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── post.service.ts
│   │   └── upload.service.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rateLimit.ts
│   │   └── errorHandler.ts
│   ├── directives/
│   │   ├── auth.directive.ts   # @auth 指令
│   │   └── upper.directive.ts  # @upper 指令
│   ├── scalars/
│   │   ├── Date.ts
│   │   ├── Upload.ts
│   │   └── JSON.ts
│   ├── utils/
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── cache.ts
│   ├── context.ts              # Context 定义
│   └── prisma.ts               # Prisma 客户端
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── graphql/
│   ├── schema.graphql          # GraphQL Schema
│   ├── user.graphql
│   ├── post.graphql
│   └── comment.graphql
├── tests/
│   ├── integration/
│   │   ├── user.test.ts
│   │   └── post.test.ts
│   └── utils/
│       ├── testServer.ts
│       └── mockData.ts
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## 代码模式

### 服务器配置

```typescript
// src/index.ts
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { GraphQLError } from 'graphql';
import depthLimit from 'graphql-depth-limit';
import { createComplexityLimitRule } from 'graphql-validation-complexity';
import { context, Context } from './context';
import { authDirectiveTransformer } from './directives/auth.directive';
import prisma from './prisma';

// 加载 Schema
const typeDefsArray = loadFilesSync('graphql/**/*.graphql');
const typeDefs = mergeTypeDefs(typeDefsArray);

// 加载 Resolvers
const resolversArray = loadFilesSync('src/resolvers/**/*.ts');
const resolvers = mergeResolvers(resolversArray);

// 创建 Schema
let schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// 应用指令转换器
schema = authDirectiveTransformer(schema);

// Express 应用
const app = express();
const httpServer = http.createServer(app);

// WebSocket Server (订阅)
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

const serverCleanup = useServer(
  {
    schema,
    context: async (ctx) => {
      // WebSocket 认证
      const token = ctx.connectionParams?.authorization as string;
      if (!token) return { prisma, user: null };

      try {
        const payload = verifyToken(token);
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
        });
        return { prisma, user };
      } catch {
        return { prisma, user: null };
      }
    },
  },
  wsServer
);

// Apollo Server
const server = new ApolloServer<Context>({
  schema,
  plugins: [
    // 关闭时清理 HTTP 资源
    ApolloServerPluginDrainHttpServer({ httpServer }),
    // 关闭时清理 WebSocket 资源
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
  // 验证规则
  validationRules: [
    depthLimit(7),
    createComplexityLimitRule(1000, {
      onCost: (cost) => console.log('Query cost:', cost),
    }),
  ],
  // 格式化错误
  formatError: (formattedError, error) => {
    // 生产环境隐藏内部错误
    if (process.env.NODE_ENV === 'production') {
      if (formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR') {
        return new GraphQLError('Internal server error');
      }
    }

    // 自定义错误消息
    if (formattedError.message.includes('ECONNREFUSED')) {
      return new GraphQLError('Database connection failed');
    }

    return formattedError;
  },
  // 内省（仅开发环境）
  introspection: process.env.NODE_ENV !== 'production',
});

await server.start();

// 中间件
app.use(
  '/graphql',
  cors<cors.CorsRequest>(),
  bodyParser.json({ limit: '10mb' }),
  expressMiddleware(server, {
    context: async ({ req }) => context({ req }),
  })
);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
const PORT = process.env.PORT || 4000;
await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));

console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
console.log(`📡 Subscriptions ready at ws://localhost:${PORT}/graphql`);
```

### Context 定义

```typescript
// src/context.ts
import { ExpressContextFunctionArgument } from '@apollo/server/express4';
import { verify } from 'jsonwebtoken';
import prisma from './prisma';

export interface Context {
  prisma: typeof prisma;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
  userId?: string;
}

export const context = async ({
  req,
}: ExpressContextFunctionArgument): Promise<Context> => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return { prisma, user: null };
  }

  try {
    const payload = verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    });

    return {
      prisma,
      user,
      userId: payload.userId,
    };
  } catch (error) {
    return { prisma, user: null };
  }
};
```

### Schema 定义

```graphql
# graphql/schema.graphql
scalar Date
scalar Upload
scalar JSON

directive @auth(requires: String) on FIELD_DEFINITION
directive @upper on FIELD_DEFINITION

type Query {
  me: User @auth
  user(id: ID!): User
  users(
    filter: UserFilter
    orderBy: UserOrderBy
    skip: Int
    take: Int
  ): UserConnection!
  
  post(id: ID!): Post
  posts(
    filter: PostFilter
    orderBy: PostOrderBy
    skip: Int
    take: Int
  ): PostConnection!
  
  search(query: String!): [SearchResult!]!
}

type Mutation {
  # 认证
  register(input: RegisterInput!): AuthPayload!
  login(input: LoginInput!): AuthPayload!
  refreshToken(token: String!): AuthPayload!
  
  # 用户
  updateProfile(input: UpdateUserInput!): User! @auth
  changePassword(input: ChangePasswordInput!): Boolean! @auth
  deleteAccount: Boolean! @auth
  
  # 文章
  createPost(input: CreatePostInput!): Post! @auth
  updatePost(id: ID!, input: UpdatePostInput!): Post! @auth
  deletePost(id: ID!): Boolean! @auth
  
  # 评论
  createComment(input: CreateCommentInput!): Comment! @auth
  updateComment(id: ID!, input: UpdateCommentInput!): Comment! @auth
  deleteComment(id: ID!): Boolean! @auth
  
  # 点赞
  toggleLike(postId: ID!): Like! @auth
  
  # 文件上传
  uploadAvatar(file: Upload!): String! @auth
  uploadPostImage(file: Upload!): String! @auth
}

type Subscription {
  postCreated: Post!
  commentAdded(postId: ID!): Comment!
  userOnline: User!
}

# 类型定义
type User {
  id: ID!
  email: String!
  name: String!
  avatar: String
  bio: String
  role: UserRole!
  posts: [Post!]!
  comments: [Comment!]!
  followers: [User!]!
  following: [User!]!
  followersCount: Int!
  followingCount: Int!
  createdAt: Date!
  updatedAt: Date!
}

type Post {
  id: ID!
  title: String!
  content: String!
  excerpt: String!
  coverImage: String
  tags: [String!]!
  author: User!
  comments: [Comment!]!
  likes: [Like!]!
  likesCount: Int!
  commentsCount: Int!
  isPublished: Boolean!
  publishedAt: Date
  createdAt: Date!
  updatedAt: Date!
}

type Comment {
  id: ID!
  content: String!
  author: User!
  post: Post!
  parent: Comment
  replies: [Comment!]!
  createdAt: Date!
  updatedAt: Date!
}

type Like {
  id: ID!
  user: User!
  post: Post!
  createdAt: Date!
}

type AuthPayload {
  token: String!
  user: User!
  refreshToken: String!
}

type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PostEdge {
  node: Post!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

union SearchResult = User | Post | Comment

# 枚举
enum UserRole {
  USER
  ADMIN
  MODERATOR
}

enum UserOrderBy {
  createdAt_ASC
  createdAt_DESC
  name_ASC
  name_DESC
}

enum PostOrderBy {
  createdAt_ASC
  createdAt_DESC
  publishedAt_ASC
  publishedAt_DESC
  likesCount_ASC
  likesCount_DESC
}

# 输入类型
input RegisterInput {
  email: String!
  password: String!
  name: String!
}

input LoginInput {
  email: String!
  password: String!
}

input UpdateUserInput {
  name: String
  avatar: String
  bio: String
}

input ChangePasswordInput {
  oldPassword: String!
  newPassword: String!
}

input CreatePostInput {
  title: String!
  content: String!
  coverImage: String
  tags: [String!]!
  isPublished: Boolean!
}

input UpdatePostInput {
  title: String
  content: String
  coverImage: String
  tags: [String!]
  isPublished: Boolean
}

input CreateCommentInput {
  content: String!
  postId: ID!
  parentId: ID
}

input UpdateCommentInput {
  content: String!
}

input UserFilter {
  name: String
  email: String
  role: UserRole
}

input PostFilter {
  title: String
  tags: [String!]
  authorId: ID
  isPublished: Boolean
}
```

### Resolver 实现

```typescript
// src/resolvers/Query.ts
import { Resolvers } from '../types/generated';
import { AuthenticationError, UserInputError } from 'apollo-server-express';

export const Query: Resolvers['Query'] = {
  me: async (_, __, { user, prisma }) => {
    if (!user) throw new AuthenticationError('未认证');
    return prisma.user.findUnique({ where: { id: user.id } });
  },

  user: async (_, { id }, { prisma }) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new UserInputError('用户不存在');
    return user;
  },

  users: async (_, { filter, orderBy, skip = 0, take = 10 }, { prisma }) => {
    const where: any = {};

    if (filter) {
      if (filter.name) {
        where.name = { contains: filter.name, mode: 'insensitive' };
      }
      if (filter.email) {
        where.email = { contains: filter.email, mode: 'insensitive' };
      }
      if (filter.role) {
        where.role = filter.role;
      }
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: orderBy ? { [orderBy.split('_')[0]]: orderBy.split('_')[1].toLowerCase() } : undefined,
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      edges: users.map((user) => ({
        node: user,
        cursor: user.id,
      })),
      pageInfo: {
        hasNextPage: take < totalCount,
        hasPreviousPage: skip > 0,
        startCursor: users[0]?.id,
        endCursor: users[users.length - 1]?.id,
      },
      totalCount,
    };
  },

  post: async (_, { id }, { prisma }) => {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new UserInputError('文章不存在');
    return post;
  },

  posts: async (_, { filter, orderBy, skip = 0, take = 10 }, { prisma }) => {
    const where: any = {};

    if (filter) {
      if (filter.title) {
        where.title = { contains: filter.title, mode: 'insensitive' };
      }
      if (filter.tags && filter.tags.length > 0) {
        where.tags = { hasSome: filter.tags };
      }
      if (filter.authorId) {
        where.authorId = filter.authorId;
      }
      if (filter.isPublished !== undefined) {
        where.isPublished = filter.isPublished;
      }
    }

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: orderBy
          ? { [orderBy.split('_')[0]]: orderBy.split('_')[1].toLowerCase() }
          : { createdAt: 'desc' },
        skip,
        take,
        include: {
          author: true,
          _count: {
            select: { comments: true, likes: true },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return {
      edges: posts.map((post) => ({
        node: {
          ...post,
          commentsCount: post._count.comments,
          likesCount: post._count.likes,
        },
        cursor: post.id,
      })),
      pageInfo: {
        hasNextPage: skip + take < totalCount,
        hasPreviousPage: skip > 0,
        startCursor: posts[0]?.id,
        endCursor: posts[posts.length - 1]?.id,
      },
      totalCount,
    };
  },

  search: async (_, { query }, { prisma }) => {
    const [users, posts, comments] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      prisma.comment.findMany({
        where: {
          content: { contains: query, mode: 'insensitive' },
        },
        take: 5,
      }),
    ]);

    return [...users, ...posts, ...comments];
  },
};
```

```typescript
// src/resolvers/Mutation.ts
import { Resolvers } from '../types/generated';
import { hash, compare } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { AuthenticationError, UserInputError, ForbiddenError } from 'apollo-server-express';
import { uploadToS3 } from '../services/upload.service';

export const Mutation: Resolvers['Mutation'] = {
  // 认证
  register: async (_, { input }, { prisma }) => {
    const { email, password, name } = input;

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new UserInputError('邮箱已被注册');
    }

    // 创建用户
    const hashedPassword = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // 生成令牌
    const token = sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });
    const refreshToken = sign({ userId: user.id }, process.env.REFRESH_SECRET!, {
      expiresIn: '30d',
    });

    return {
      token,
      refreshToken,
      user,
    };
  },

  login: async (_, { input }, { prisma }) => {
    const { email, password } = input;

    // 查找用户
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AuthenticationError('邮箱或密码错误');
    }

    // 验证密码
    const valid = await compare(password, user.password);
    if (!valid) {
      throw new AuthenticationError('邮箱或密码错误');
    }

    // 生成令牌
    const token = sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });
    const refreshToken = sign({ userId: user.id }, process.env.REFRESH_SECRET!, {
      expiresIn: '30d',
    });

    return {
      token,
      refreshToken,
      user,
    };
  },

  refreshToken: async (_, { token }, { prisma }) => {
    try {
      const payload = verify(token, process.env.REFRESH_SECRET!) as {
        userId: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new AuthenticationError('用户不存在');
      }

      const newToken = sign({ userId: user.id }, process.env.JWT_SECRET!, {
        expiresIn: '7d',
      });
      const newRefreshToken = sign(
        { userId: user.id },
        process.env.REFRESH_SECRET!,
        { expiresIn: '30d' }
      );

      return {
        token: newToken,
        refreshToken: newRefreshToken,
        user,
      };
    } catch (error) {
      throw new AuthenticationError('无效的刷新令牌');
    }
  },

  // 用户
  updateProfile: async (_, { input }, { user, prisma }) => {
    if (!user) throw new AuthenticationError('未认证');

    return prisma.user.update({
      where: { id: user.id },
      data: input,
    });
  },

  changePassword: async (_, { input }, { user, prisma }) => {
    if (!user) throw new AuthenticationError('未认证');

    const { oldPassword, newPassword } = input;

    // 验证旧密码
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    const valid = await compare(oldPassword, currentUser!.password);
    if (!valid) {
      throw new UserInputError('旧密码错误');
    }

    // 更新密码
    const hashedPassword = await hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return true;
  },

  deleteAccount: async (_, __, { user, prisma }) => {
    if (!user) throw new AuthenticationError('未认证');

    await prisma.user.delete({ where: { id: user.id } });
    return true;
  },

  // 文章
  createPost: async (_, { input }, { user, prisma, pubsub }) => {
    if (!user) throw new AuthenticationError('未认证');

    const post = await prisma.post.create({
      data: {
        ...input,
        authorId: user.id,
        publishedAt: input.isPublished ? new Date() : null,
      },
    });

    // 发布订阅事件
    if (input.isPublished) {
      pubsub.publish('POST_CREATED', { postCreated: post });
    }

    return post;
  },

  updatePost: async (_, { id, input }, { user, prisma }) => {
    if (!user) throw new AuthenticationError('未认证');

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new UserInputError('文章不存在');
    if (post.authorId !== user.id) {
      throw new ForbiddenError('无权限修改此文章');
    }

    return prisma.post.update({
      where: { id },
      data: {
        ...input,
        publishedAt: input.isPublished && !post.isPublished ? new Date() : post.publishedAt,
      },
    });
  },

  deletePost: async (_, { id }, { user, prisma }) => {
    if (!user) throw new AuthenticationError('未认证');

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new UserInputError('文章不存在');
    if (post.authorId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenError('无权限删除此文章');
    }

    await prisma.post.delete({ where: { id } });
    return true;
  },

  // 文件上传
  uploadAvatar: async (_, { file }, { user }) => {
    if (!user) throw new AuthenticationError('未认证');

    const { createReadStream, filename, mimetype } = await file;
    const stream = createReadStream();

    const url = await uploadToS3(stream, `avatars/${user.id}/${filename}`, mimetype);

    return url;
  },
};
```

```typescript
// src/resolvers/Subscription.ts
import { Resolvers } from '../types/generated';
import { withFilter } from 'apollo-server-express';

export const Subscription: Resolvers['Subscription'] = {
  postCreated: {
    subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(['POST_CREATED']),
  },

  commentAdded: {
    subscribe: withFilter(
      (_, __, { pubsub }) => pubsub.asyncIterator(['COMMENT_ADDED']),
      (payload, variables) => {
        return payload.commentAdded.postId === variables.postId;
      }
    ),
  },

  userOnline: {
    subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(['USER_ONLINE']),
  },
};
```

### 认证指令

```typescript
// src/directives/auth.directive.ts
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLSchema } from 'graphql';
import { AuthenticationError, ForbiddenError } from 'apollo-server-express';

export function authDirectiveTransformer(schema: GraphQLSchema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, 'auth')?.[0];

      if (authDirective) {
        const { requires } = authDirective;
        const { resolve = defaultFieldResolver } = fieldConfig;

        fieldConfig.resolve = async function (source, args, context, info) {
          if (!context.user) {
            throw new AuthenticationError('未认证');
          }

          if (requires && context.user.role !== requires) {
            throw new ForbiddenError('权限不足');
          }

          return resolve(source, args, context, info);
        };
      }

      return fieldConfig;
    },
  });
}
```

### 自定义标量

```typescript
// src/scalars/Date.ts
import { GraphQLScalarType, Kind } from 'graphql';

export const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    throw new Error('Date Scalar serialize error');
  },
  parseValue(value) {
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    throw new Error('Date Scalar parseValue error');
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    throw new Error('Date Scalar parseLiteral error');
  },
});
```

```typescript
// src/scalars/Upload.ts
import { GraphQLUpload } from 'graphql-upload';

export const UploadScalar = GraphQLUpload;
```

## 最佳实践

### 1. N+1 问题解决

```typescript
// 使用 DataLoader 批量查询
import DataLoader from 'dataloader';

// 创建 DataLoader
const userLoader = new DataLoader(async (ids: string[]) => {
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
  });
  const userMap = new Map(users.map((user) => [user.id, user]));
  return ids.map((id) => userMap.get(id));
});

// 在 Context 中提供
export const context = async ({ req }) => {
  // ...
  return {
    prisma,
    user,
    loaders: {
      user: userLoader,
    },
  };
};

// 在 Resolver 中使用
const Post = {
  author: async (post, _, { loaders }) => {
    return loaders.user.load(post.authorId);
  },
};
```

### 2. 查询复杂度控制

```typescript
import { createComplexityLimitRule } from 'graphql-validation-complexity';

const server = new ApolloServer({
  schema,
  validationRules: [
    createComplexityLimitRule(1000, {
      onCost: (cost) => console.log('Query cost:', cost),
      formatError: (cost) => new GraphQLError(`Query cost ${cost} exceeds limit`),
    }),
  ],
});
```

### 3. 缓存策略

```typescript
// 响应缓存
import responseCachePlugin from '@apollo/server-plugin-response-cache';

const server = new ApolloServer({
  schema,
  plugins: [
    responseCachePlugin({
      sessionId: (requestContext) =>
        requestContext.request.http?.headers.get('authorization') || null,
    }),
  ],
});

// 在 Resolver 中设置缓存
const Query = {
  posts: async (_, __, { cacheControl }) => {
    cacheControl.setCacheHint({ maxAge: 60, scope: 'PUBLIC' });
    // ...
  },
};
```

### 4. 错误处理

```typescript
// 自定义错误类
export class ValidationError extends GraphQLError {
  constructor(message: string, field: string) {
    super(message, {
      extensions: {
        code: 'VALIDATION_ERROR',
        field,
      },
    });
  }
}

// 使用
if (!email.includes('@')) {
  throw new ValidationError('邮箱格式不正确', 'email');
}
```

### 5. 批量操作

```typescript
const Mutation = {
  createPosts: async (_, { inputs }, { user, prisma }) => {
    if (!user) throw new AuthenticationError('未认证');

    // 批量创建
    const posts = await prisma.post.createMany({
      data: inputs.map((input) => ({
        ...input,
        authorId: user.id,
      })),
    });

    return posts;
  },
};
```

## 常用命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 生产运行
npm run start

# 生成 Prisma 客户端
npx prisma generate

# 数据库迁移
npx prisma migrate dev --name init

# 打开 Prisma Studio
npx prisma studio

# 运行测试
npm run test

# 代码生成（类型）
npm run codegen
```

## 部署配置

### package.json

```json
{
  "name": "apollo-server-graphql",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "codegen": "graphql-codegen --config codegen.yml",
    "test": "jest",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@apollo/server": "^4.9.0",
    "@graphql-tools/load-files": "^7.0.0",
    "@graphql-tools/merge": "^9.0.0",
    "@graphql-tools/schema": "^10.0.0",
    "@prisma/client": "^5.0.0",
    "bcrypt": "^5.1.0",
    "cors": "^2.8.5",
    "express": "^4.18.0",
    "graphql": "^16.8.0",
    "graphql-upload": "^16.0.0",
    "graphql-ws": "^5.14.0",
    "jsonwebtoken": "^9.0.0",
    "ws": "^8.13.0"
  },
  "devDependencies": {
    "@graphql-codegen/cli": "^5.0.0",
    "@graphql-codegen/typescript": "^4.0.0",
    "@graphql-codegen/typescript-resolvers": "^4.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/cors": "^2.8.0",
    "@types/express": "^4.17.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/node": "^20.0.0",
    "@types/ws": "^8.5.0",
    "prisma": "^5.0.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/graphql
      - JWT_SECRET=your-secret-key
      - REFRESH_SECRET=your-refresh-secret
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: graphql
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 参考资源

- [Apollo Server 文档](https://www.apollographql.com/docs/apollo-server/)
- [GraphQL 最佳实践](https://graphql.org/learn/best-practices/)
- [Prisma 文档](https://www.prisma.io/docs/)
- [GraphQL WebSocket](https://github.com/enisdenjo/graphql-ws)
- [DataLoader](https://github.com/graphql/dataloader)
