# MikroORM TypeScript ORM 模板

## 技术栈

- **MikroORM**: 6.x - TypeScript ORM
- **TypeScript**: 5.x - 类型支持
- **Node.js**: 20.x - 运行时
- **PostgreSQL/MySQL/SQLite**: 数据库支持
- **Reflect Metadata**: 元数据反射
- **MikroORM CLI**: 命令行工具
- **MikroORM Migrations**: 迁移工具
- **MikroORM Seeder**: 数据填充

## 项目结构

```
mikro-orm-project/
├── src/
│   ├── entities/
│   │   ├── User.ts            # 用户实体
│   │   ├── Post.ts            # 文章实体
│   │   ├── Comment.ts         # 评论实体
│   │   ├── Category.ts        # 分类实体
│   │   └── Tag.ts             # 标签实体
│   ├── repositories/
│   │   ├── UserRepository.ts  # 用户仓储
│   │   ├── PostRepository.ts  # 文章仓储
│   │   └── CommentRepository.ts
│   ├── services/
│   │   ├── UserService.ts     # 用户服务
│   │   └── PostService.ts     # 文章服务
│   ├── middleware/
│   │   └── orm.ts             # ORM 中间件
│   ├── migrations/
│   │   └── .gitkeep
│   ├── seeders/
│   │   ├── DatabaseSeeder.ts  # 数据库填充
│   │   └── UserSeeder.ts      # 用户填充
│   ├── subscribers/
│   │   └── UserSubscriber.ts  # 事件订阅者
│   ├── types/
│   │   └── index.ts           # 类型定义
│   ├── utils/
│   │   └── pagination.ts      # 分页工具
│   ├── config/
│   │   └── database.ts        # 数据库配置
│   └── index.ts               # 入口文件
├── tests/
│   ├── entities/
│   └── repositories/
├── mikro-orm.config.ts        # MikroORM 配置
├── package.json
├── tsconfig.json
└── README.md
```

## 代码模式

### 1. MikroORM 配置

```typescript
// mikro-orm.config.ts
import { defineConfig, Options } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';

const config: Options = {
  // 基础配置
  driver: PostgreSqlDriver,
  driverOptions: {
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'myapp',
    },
  },

  // 实体配置
  entities: ['./dist/entities'],
  entitiesTs: ['./src/entities'],

  // 元数据
  metadataProvider: TsMorphMetadataProvider,
  metadataCache: {
    enabled: true,
    options: { ttl: 1000 * 60 * 60 }, // 1小时
  },

  // 迁移
  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
    glob: '!(*.d).{js,ts}',
    tableName: 'mikro_orm_migrations',
    transactional: true,
    disableForeignKeys: true,
    allOrNothing: true,
    dropTables: false,
    safe: true,
    snapshot: true,
    emit: 'ts',
  },

  // 数据填充
  seeder: {
    path: './dist/seeders',
    pathTs: './src/seeders',
    defaultSeeder: 'DatabaseSeeder',
    glob: '!(*.d).{js,ts}',
    emit: 'ts',
    fileName: (className: string) => className,
  },

  // 调试
  debug: process.env.NODE_ENV === 'development',
  highlighter: new SqlHighlighter(),

  // 日志
  logger: (message: string) => console.log(`[MikroORM] ${message}`),

  // 连接池
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
  },

  // 结果缓存
  resultCache: {
    adapter: 'memory',
    expiration: 1000 * 60 * 60, // 1小时
    options: {},
  },

  // 严格模式
  strict: true,
  validate: true,
  validateRequired: true,
};

export default defineConfig(config);
```

### 2. 实体定义

```typescript
// src/entities/User.ts
import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
  Collection,
  Index,
  Unique,
  BeforeCreate,
  BeforeUpdate,
} from '@mikro-orm/core';
import { Post } from './Post';
import { Comment } from './Comment';

@Entity()
@Index({ properties: ['email', 'username'] })
export class User {
  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  @Index()
  email!: string;

  @Property()
  @Unique()
  @Index()
  username!: string;

  @Property()
  password!: string;

  @Property({ nullable: true })
  fullName?: string;

  @Property({ nullable: true })
  avatar?: string;

  @Property({ default: 'user' })
  role!: string;

  @Property({ default: true })
  isActive!: boolean;

  @Property({ nullable: true })
  bio?: string;

  @Property({ nullable: true })
  website?: string;

  @OneToMany(() => Post, (post) => post.author)
  posts = new Collection<Post>(this);

  @OneToMany(() => Comment, (comment) => comment.author)
  comments = new Collection<Comment>(this);

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @BeforeCreate()
  beforeCreate() {
    this.email = this.email.toLowerCase();
    this.username = this.username.toLowerCase();
  }

  @BeforeUpdate()
  beforeUpdate() {
    this.updatedAt = new Date();
    if (this.email) {
      this.email = this.email.toLowerCase();
    }
  }

  // 虚拟属性
  get displayName(): string {
    return this.fullName || this.username;
  }

  // 方法
  canModerate(): boolean {
    return this.role === 'admin' || this.role === 'moderator';
  }
}

// src/entities/Post.ts
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  ManyToMany,
  Collection,
  Index,
  BeforeCreate,
} from '@mikro-orm/core';
import { User } from './User';
import { Comment } from './Comment';
import { Tag } from './Tag';
import { Category } from './Category';

@Entity()
@Index({ properties: ['status', 'publishedAt'] })
@Index({ properties: ['author', 'createdAt'] })
export class Post {
  @PrimaryKey()
  id!: number;

  @Property()
  @Index()
  title!: string;

  @Property()
  @Index({ unique: true })
  slug!: string;

  @Property({ type: 'text' })
  content!: string;

  @Property({ type: 'text', nullable: true })
  excerpt?: string;

  @Property({ nullable: true })
  featuredImage?: string;

  @Property({ default: 'draft' })
  status!: 'draft' | 'published' | 'archived';

  @ManyToOne(() => User, { eager: true })
  author!: User;

  @ManyToOne(() => Category, { nullable: true })
  category?: Category;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments = new Collection<Comment>(this);

  @ManyToMany(() => Tag, (tag) => tag.posts, { owner: true })
  tags = new Collection<Tag>(this);

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  publishedAt?: Date;

  @Property({ default: 0 })
  viewCount!: number;

  @Property({ default: 0 })
  likeCount!: number;

  @BeforeCreate()
  beforeCreate() {
    if (!this.slug) {
      this.slug = this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    if (this.status === 'published' && !this.publishedAt) {
      this.publishedAt = new Date();
    }
  }

  // 虚拟属性
  get readTime(): number {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  // 方法
  isPublished(): boolean {
    return this.status === 'published' && this.publishedAt !== undefined;
  }

  incrementViewCount(): void {
    this.viewCount++;
  }
}

// src/entities/Comment.ts
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Index,
} from '@mikro-orm/core';
import { User } from './User';
import { Post } from './Post';

@Entity()
@Index({ properties: ['post', 'createdAt'] })
export class Comment {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'text' })
  content!: string;

  @ManyToOne(() => User, { eager: true })
  author!: User;

  @ManyToOne(() => Post)
  post!: Post;

  @ManyToOne(() => Comment, { nullable: true })
  parent?: Comment;

  @Property({ default: false })
  isApproved!: boolean;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;
}

// src/entities/Tag.ts
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToMany,
  Collection,
} from '@mikro-orm/core';
import { Post } from './Post';

@Entity()
export class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true })
  slug!: string;

  @ManyToMany(() => Post, (post) => post.tags)
  posts = new Collection<Post>(this);

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;
}

// src/entities/Category.ts
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { Post } from './Post';

@Entity()
export class Category {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true })
  slug!: string;

  @Property({ nullable: true })
  description?: string;

  @ManyToOne(() => Category, { nullable: true })
  parent?: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children = new Collection<Category>(this);

  @OneToMany(() => Post, (post) => post.category)
  posts = new Collection<Post>(this);

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;
}
```

### 3. 自定义仓储

```typescript
// src/repositories/UserRepository.ts
import { EntityRepository } from '@mikro-orm/core';
import { User } from '../entities/User';

export class UserRepository extends EntityRepository<User> {
  // 根据邮箱查找
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email: email.toLowerCase() });
  }

  // 根据用户名查找
  async findByUsername(username: string): Promise<User | null> {
    return this.findOne({ username: username.toLowerCase() });
  }

  // 查找活跃用户
  async findActiveUsers(limit = 10): Promise<User[]> {
    return this.find(
      { isActive: true },
      {
        limit,
        orderBy: { createdAt: 'DESC' },
      }
    );
  }

  // 搜索用户
  async searchUsers(query: string, limit = 20): Promise<User[]> {
    return this.createQueryBuilder('user')
      .where({
        $or: [
          { username: { $ilike: `%${query}%` } },
          { fullName: { $ilike: `%${query}%` } },
          { email: { $ilike: `%${query}%` } },
        ],
      })
      .limit(limit)
      .getResult();
  }

  // 获取用户统计
  async getUserStats(userId: number) {
    const user = await this.findOne(userId, {
      populate: ['posts', 'comments'],
    });

    if (!user) return null;

    return {
      postsCount: user.posts.count(),
      commentsCount: user.comments.count(),
    };
  }

  // 批量更新状态
  async updateActiveStatus(userIds: number[], isActive: boolean): Promise<number> {
    const result = await this.nativeUpdate(
      { id: { $in: userIds } },
      { isActive }
    );
    return result;
  }
}

// src/repositories/PostRepository.ts
import { EntityRepository, QueryBuilder } from '@mikro-orm/core';
import { Post } from '../entities/Post';

export class PostRepository extends EntityRepository<Post> {
  // 查找已发布的文章
  async findPublished(options?: { limit?: number; offset?: number }) {
    return this.find(
      { status: 'published', publishedAt: { $lte: new Date() } },
      {
        limit: options?.limit || 20,
        offset: options?.offset || 0,
        orderBy: { publishedAt: 'DESC' },
        populate: ['author', 'category', 'tags'],
      }
    );
  }

  // 根据作者查找
  async findByAuthor(authorId: number, status?: string) {
    const where: any = { author: authorId };
    if (status) where.status = status;

    return this.find(where, {
      orderBy: { createdAt: 'DESC' },
      populate: ['category', 'tags'],
    });
  }

  // 搜索文章
  async searchPosts(query: string, limit = 20) {
    return this.createQueryBuilder('post')
      .where({
        status: 'published',
        $or: [
          { title: { $ilike: `%${query}%` } },
          { content: { $ilike: `%${query}%` } },
          { excerpt: { $ilike: `%${query}%` } },
        ],
      })
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .limit(limit)
      .orderBy({ publishedAt: 'DESC' })
      .getResult();
  }

  // 获取热门文章
  async findPopular(limit = 10) {
    return this.find(
      { status: 'published' },
      {
        limit,
        orderBy: { viewCount: 'DESC' },
        populate: ['author'],
      }
    );
  }

  // 获取相关文章
  async findRelated(postId: number, categoryId?: number, limit = 5) {
    const qb = this.createQueryBuilder('post')
      .where({ id: { $ne: postId }, status: 'published' });

    if (categoryId) {
      qb.andWhere({ category: categoryId });
    }

    return qb
      .leftJoinAndSelect('post.author', 'author')
      .limit(limit)
      .orderBy({ publishedAt: 'DESC' })
      .getResult();
  }

  // 统计文章数量
  async countByStatus() {
    const result = await this.createQueryBuilder('post')
      .select(['status', 'count(*) as count'])
      .groupBy('status')
      .execute();

    return result.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);
  }
}

// 注册自定义仓储
@EntityRepository(User)
export class UserRepository extends EntityRepository<User> {}

@EntityRepository(Post)
export class PostRepository extends EntityRepository<Post> {}
```

### 4. 服务层

```typescript
// src/services/UserService.ts
import { EntityManager } from '@mikro-orm/core';
import { User } from '../entities/User';
import { UserRepository } from '../repositories/UserRepository';
import bcrypt from 'bcryptjs';

export class UserService {
  private readonly userRepository: UserRepository;

  constructor(private readonly em: EntityManager) {
    this.userRepository = em.getRepository(User);
  }

  // 创建用户
  async create(data: {
    email: string;
    username: string;
    password: string;
    fullName?: string;
  }): Promise<User> {
    // 检查邮箱是否已存在
    const existingEmail = await this.userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error('邮箱已被使用');
    }

    // 检查用户名是否已存在
    const existingUsername = await this.userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new Error('用户名已被使用');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 创建用户
    const user = this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    await this.em.persistAndFlush(user);

    return user;
  }

  // 更新用户
  async update(
    id: number,
    data: { fullName?: string; avatar?: string; bio?: string; website?: string }
  ): Promise<User> {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new Error('用户不存在');
    }

    this.userRepository.assign(user, data);
    await this.em.flush();

    return user;
  }

  // 验证登录
  async validateLogin(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('邮箱或密码错误');
    }

    if (!user.isActive) {
      throw new Error('账户已被禁用');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('邮箱或密码错误');
    }

    return user;
  }

  // 获取用户详情
  async getById(id: number): Promise<User> {
    const user = await this.userRepository.findOne(id, {
      populate: ['posts', 'comments'],
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  }

  // 搜索用户
  async search(query: string, limit = 20): Promise<User[]> {
    return this.userRepository.searchUsers(query, limit);
  }

  // 获取活跃用户
  async getActiveUsers(limit = 10): Promise<User[]> {
    return this.userRepository.findActiveUsers(limit);
  }

  // 删除用户
  async delete(id: number): Promise<void> {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new Error('用户不存在');
    }

    await this.em.removeAndFlush(user);
  }
}

// src/services/PostService.ts
import { EntityManager } from '@mikro-orm/core';
import { Post } from '../entities/Post';
import { PostRepository } from '../repositories/PostRepository';
import { UserRepository } from '../repositories/UserRepository';

export class PostService {
  private readonly postRepository: PostRepository;
  private readonly userRepository: UserRepository;

  constructor(private readonly em: EntityManager) {
    this.postRepository = em.getRepository(Post);
    this.userRepository = em.getRepository(User);
  }

  // 创建文章
  async create(data: {
    title: string;
    content: string;
    authorId: number;
    excerpt?: string;
    categoryId?: number;
    tagIds?: number[];
    status?: 'draft' | 'published';
  }): Promise<Post> {
    const author = await this.userRepository.findOne(data.authorId);
    if (!author) {
      throw new Error('作者不存在');
    }

    const post = this.postRepository.create({
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      author,
      status: data.status || 'draft',
    });

    await this.em.persistAndFlush(post);

    return post;
  }

  // 更新文章
  async update(
    id: number,
    data: {
      title?: string;
      content?: string;
      excerpt?: string;
      status?: 'draft' | 'published' | 'archived';
      categoryId?: number;
    }
  ): Promise<Post> {
    const post = await this.postRepository.findOne(id);
    if (!post) {
      throw new Error('文章不存在');
    }

    this.postRepository.assign(post, data);
    await this.em.flush();

    return post;
  }

  // 发布文章
  async publish(id: number): Promise<Post> {
    const post = await this.postRepository.findOne(id);
    if (!post) {
      throw new Error('文章不存在');
    }

    post.status = 'published';
    post.publishedAt = new Date();

    await this.em.flush();

    return post;
  }

  // 获取文章详情
  async getById(id: number): Promise<Post> {
    const post = await this.postRepository.findOne(id, {
      populate: ['author', 'category', 'tags', 'comments'],
    });

    if (!post) {
      throw new Error('文章不存在');
    }

    return post;
  }

  // 获取已发布文章列表
  async getPublished(options?: { limit?: number; offset?: number }) {
    return this.postRepository.findPublished(options);
  }

  // 搜索文章
  async search(query: string, limit = 20) {
    return this.postRepository.searchPosts(query, limit);
  }

  // 增加浏览量
  async incrementViewCount(id: number): Promise<void> {
    const post = await this.postRepository.findOne(id);
    if (post) {
      post.incrementViewCount();
      await this.em.flush();
    }
  }

  // 删除文章
  async delete(id: number): Promise<void> {
    const post = await this.postRepository.findOne(id);
    if (!post) {
      throw new Error('文章不存在');
    }

    await this.em.removeAndFlush(post);
  }
}
```

### 5. 迁移文件

```typescript
// src/migrations/Migration20240101000000.ts
import { Migration } from '@mikro-orm/migrations';

export class Migration20240101000000 extends Migration {
  async up(): Promise<void> {
    // 创建用户表
    this.addSql(`
      CREATE TABLE "user" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "username" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "full_name" VARCHAR(255),
        "avatar" VARCHAR(255),
        "role" VARCHAR(50) NOT NULL DEFAULT 'user',
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "bio" TEXT,
        "website" VARCHAR(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    this.addSql(`
      CREATE INDEX idx_user_email ON "user" ("email");
      CREATE INDEX idx_user_username ON "user" ("username");
    `);

    // 创建文章表
    this.addSql(`
      CREATE TABLE "post" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(255) NOT NULL,
        "slug" VARCHAR(255) NOT NULL UNIQUE,
        "content" TEXT NOT NULL,
        "excerpt" TEXT,
        "featured_image" VARCHAR(255),
        "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
        "author_id" INTEGER NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
        "category_id" INTEGER REFERENCES "category" ("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "published_at" TIMESTAMP,
        "view_count" INTEGER NOT NULL DEFAULT 0,
        "like_count" INTEGER NOT NULL DEFAULT 0
      );
    `);

    this.addSql(`
      CREATE INDEX idx_post_slug ON "post" ("slug");
      CREATE INDEX idx_post_status ON "post" ("status", "published_at");
      CREATE INDEX idx_post_author ON "post" ("author_id", "created_at");
    `);

    // 创建标签表
    this.addSql(`
      CREATE TABLE "tag" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "slug" VARCHAR(255) NOT NULL UNIQUE,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 创建文章-标签关联表
    this.addSql(`
      CREATE TABLE "post_tags" (
        "post_id" INTEGER NOT NULL REFERENCES "post" ("id") ON DELETE CASCADE,
        "tag_id" INTEGER NOT NULL REFERENCES "tag" ("id") ON DELETE CASCADE,
        PRIMARY KEY ("post_id", "tag_id")
      );
    `);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "post_tags";`);
    this.addSql(`DROP TABLE IF EXISTS "tag";`);
    this.addSql(`DROP TABLE IF EXISTS "post";`);
    this.addSql(`DROP TABLE IF EXISTS "user";`);
  }
}
```

### 6. 数据填充

```typescript
// src/seeders/UserSeeder.ts
import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/core';
import { User } from '../entities/User';
import bcrypt from 'bcryptjs';

export class UserSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    // 创建管理员
    const admin = em.create(User, {
      email: 'admin@example.com',
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      fullName: 'System Admin',
      role: 'admin',
      isActive: true,
    });

    // 创建测试用户
    const users = [];
    for (let i = 1; i <= 10; i++) {
      users.push(
        em.create(User, {
          email: `user${i}@example.com`,
          username: `user${i}`,
          password: await bcrypt.hash('password123', 10),
          fullName: `Test User ${i}`,
          role: 'user',
          isActive: true,
        })
      );
    }

    await em.persistAndFlush([admin, ...users]);
  }
}

// src/seeders/DatabaseSeeder.ts
import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/core';
import { UserSeeder } from './UserSeeder';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    return this.call(em, [UserSeeder]);
  }
}
```

## 最佳实践

### 1. 实体设计

```typescript
// ✅ 好的做法
@Entity()
export class User {
  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  email!: string;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @OneToMany(() => Post, (post) => post.author)
  posts = new Collection<Post>(this);
}

// ❌ 避免
@Entity()
export class User {
  @PrimaryKey()
  id!: number;

  @Property()
  email!: string;

  // ❌ 缺少索引
  // ❌ 缺少时间戳
  // ❌ 缺少关系定义
}
```

### 2. 查询优化

```typescript
// ✅ 使用 populate 预加载
const posts = await em.find(Post, {}, {
  populate: ['author', 'category', 'tags']
});

// ❌ N+1 查询问题
const posts = await em.find(Post, {});
for (const post of posts) {
  const author = await em.findOne(User, post.author.id); // N+1 查询
}

// ✅ 使用分页
const [posts, total] = await em.findAndCount(
  Post,
  { status: 'published' },
  {
    limit: 20,
    offset: 0,
    orderBy: { createdAt: 'DESC' }
  }
);

// ✅ 使用索引
@Index({ properties: ['status', 'publishedAt'] })
export class Post { ... }
```

### 3. 事务处理

```typescript
// ✅ 使用事务
await em.transactional(async (em) => {
  const user = em.create(User, userData);
  await em.persist(user);

  const post = em.create(Post, { ...postData, author: user });
  await em.persist(post);

  // 如果任何操作失败，整个事务回滚
});

// ✌ 使用 flush 批量提交
const users = userData.map(data => em.create(User, data));
await em.persistAndFlush(users);
```

### 4. 缓存使用

```typescript
// ✅ 使用结果缓存
const posts = await em.find(Post, { status: 'published' }, {
  cache: 60 * 60 * 1000, // 1小时
  populate: ['author']
});

// ✅ 清除缓存
await em.clear(); // 清除所有缓存
await em.getRepository(Post).clearCache(); // 清除特定实体缓存
```

## 常用命令

### 开发命令

```bash
# 安装 MikroORM
npm install @mikro-orm/core @mikro-orm/postgresql
npm install @mikro-orm/reflection
npm install @mikro-orm/migrations @mikro-orm/seeder

# 生成初始迁移
npx mikro-orm migration:create --initial

# 创建新迁移
npx mikro-orm migration:create

# 运行迁移
npx mikro-orm migration:up

# 回滚迁移
npx mikro-orm migration:down

# 查看迁移状态
npx mikro-orm migration:pending

# 运行数据填充
npx mikro-orm seeder:run

# 生成实体
npx mikro-orm generate-entities

# 数据库架构更新
npx mikro-orm schema:update --run

# 创建数据库
npx mikro-orm database:create

# 删除数据库
npx mikro-orm database:drop
```

### 调试命令

```bash
# 启用调试日志
DEBUG=mikro-orm:* npm run dev

# 查看生成的 SQL
npx mikro-orm schema:update --dump

# 验证实体元数据
npx mikro-orm debug
```

## 部署配置

### 1. 环境变量

```env
# .env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=myapp

NODE_ENV=production
```

### 2. Docker 配置

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
```

### 3. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: password
      DB_NAME: myapp
    depends_on:
      - postgres
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

### 4. CI/CD 配置

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: password
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - run: npm run test
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USER: postgres
          DB_PASSWORD: password
          DB_NAME: test_db
```

## 相关资源

- [MikroORM 官方文档](https://mikro-orm.io/)
- [MikroORM GitHub](https://github.com/mikro-orm/mikro-orm)
- [实体定义](https://mikro-orm.io/docs/defining-entities)
- [关系映射](https://mikro-orm.io/docs/relationships)
- [查询构建器](https://mikro-orm.io/docs/query-builder)
- [迁移](https://mikro-orm.io/docs/migrations)
- [数据填充](https://mikro-orm.io/docs/seeding)
