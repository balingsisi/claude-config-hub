# TypeORM TypeScript ORM Template

## Project Overview

TypeORM is a mature ORM for TypeScript and JavaScript that supports multiple databases (PostgreSQL, MySQL, MariaDB, SQLite, MS SQL Server, Oracle, MongoDB). It supports both Data Mapper and Active Record patterns, providing type-safe database operations with decorators and excellent TypeScript integration.

## Tech Stack

- **ORM**: TypeORM 0.3.x
- **Language**: TypeScript 5.x
- **Runtime**: Node.js 20+ LTS
- **Database**: PostgreSQL / MySQL / SQLite
- **Validation**: class-validator
- **Testing**: Jest / Vitest
- **Migration**: TypeORM CLI

## Project Structure

```
├── src/
│   ├── config/
│   │   ├── index.ts              # Config aggregator
│   │   ├── database.ts           # Database configuration
│   │   └── ormconfig.ts          # TypeORM config
│   ├── entities/                 # Entity definitions
│   │   ├── User.ts
│   │   ├── Post.ts
│   │   ├── Comment.ts
│   │   ├── Category.ts
│   │   └── index.ts
│   ├── repositories/             # Custom repositories
│   │   ├── UserRepository.ts
│   │   ├── PostRepository.ts
│   │   └── index.ts
│   ├── services/                 # Business logic
│   │   ├── UserService.ts
│   │   ├── PostService.ts
│   │   └── index.ts
│   ├── controllers/              # Request handlers
│   │   ├── UserController.ts
│   │   ├── PostController.ts
│   │   └── index.ts
│   ├── middlewares/              # Express middlewares
│   │   ├── error.ts
│   │   └── validate.ts
│   ├── migrations/               # Database migrations
│   │   ├── 1700000000000-CreateUser.ts
│   │   ├── 1700000000001-CreatePost.ts
│   │   └── index.ts
│   ├── subscribers/              # Entity subscribers
│   │   ├── UserSubscriber.ts
│   │   └── index.ts
│   ├── types/                    # TypeScript types
│   │   ├── express.d.ts
│   │   └── env.d.ts
│   ├── utils/                    # Utility functions
│   │   ├── logger.ts
│   │   └── pagination.ts
│   ├── app.ts                    # Express app
│   └── server.ts                 # Entry point
├── tests/
│   ├── setup.ts                  # Test setup
│   ├── entities/
│   │   └── User.test.ts
│   ├── repositories/
│   │   └── UserRepository.test.ts
│   └── services/
│       └── UserService.test.ts
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Key Patterns

### 1. Data Source Configuration

```typescript
// src/config/database.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'myapp',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: ['src/entities/**/*.ts'],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
  poolSize: 10,
  extra: {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};

// Development vs Production
if (process.env.NODE_ENV === 'test') {
  Object.assign(dataSourceOptions, {
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    dropSchema: true,
  });
}

export const AppDataSource = new DataSource(dataSourceOptions);

// src/app.ts
import 'reflect-metadata';
import { AppDataSource } from './config/database';

export async function initializeApp() {
  await AppDataSource.initialize();
  console.log('Database connected successfully');
}
```

### 2. Entity with Active Record Pattern

```typescript
// src/entities/User.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { IsEmail, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { Post } from './Post';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @Column({ length: 100 })
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @Column({ unique: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Column({ select: false })
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: ['admin', 'user', 'editor'], default: 'user' })
  role: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ nullable: true })
  avatar: string;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  // Instance methods
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  toJSON() {
    const { password, ...rest } = this;
    return rest;
  }
}
```

### 3. Entity with Relationships

```typescript
// src/entities/Post.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { IsNotEmpty, MaxLength, IsUrl } from 'class-validator';
import { User } from './User';
import { Comment } from './Comment';
import { Category } from './Category';

@Entity('posts')
@Index(['slug'], { unique: true })
@Index(['authorId', 'status'])
@Index(['publishedAt'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  @IsNotEmpty()
  content: string;

  @Column({ nullable: true, type: 'text' })
  excerpt: string;

  @Column({ nullable: true })
  @IsUrl()
  featuredImage: string;

  @Column({ type: 'enum', enum: ['draft', 'published', 'archived'], default: 'draft' })
  status: string;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: true })
  allowComments: boolean;

  @Column({ nullable: true })
  metaTitle: string;

  @Column({ nullable: true, type: 'text' })
  metaDescription: string;

  @Column({ nullable: true })
  publishedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.posts, {
    eager: true,
    onDelete: 'CASCADE',
  })
  author: User;

  @Column()
  authorId: string;

  @OneToMany(() => Comment, (comment) => comment.post, {
    cascade: true,
  })
  comments: Comment[];

  @ManyToMany(() => Category, (category) => category.posts, {
    eager: true,
  })
  @JoinTable()
  categories: Category[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Hooks
  generateSlug() {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      slug: this.slug,
      content: this.content,
      excerpt: this.excerpt,
      featuredImage: this.featuredImage,
      status: this.status,
      viewCount: this.viewCount,
      author: this.author,
      categories: this.categories,
      publishedAt: this.publishedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
```

### 4. Custom Repository (Data Mapper Pattern)

```typescript
// src/repositories/UserRepository.ts
import { EntityRepository, Repository } from 'typeorm';
import { User } from '../entities/User';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async findByEmail(email: string): Promise<User | null> {
    return this.createQueryBuilder('user')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();
  }

  async findActiveUsers(): Promise<User[]> {
    return this.createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true })
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }

  async findWithPosts(userId: string): Promise<User | null> {
    return this.createQueryBuilder('user')
      .leftJoinAndSelect('user.posts', 'post')
      .where('user.id = :userId', { userId })
      .getOne();
  }

  async searchUsers(query: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await this.createQueryBuilder('user')
      .where(
        'user.firstName ILIKE :query OR user.lastName ILIKE :query OR user.email ILIKE :query',
        { query: `%${query}%` }
      )
      .skip(skip)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserStats(userId: string): Promise<void> {
    await this.createQueryBuilder()
      .update(User)
      .set({
        // Update computed fields
      })
      .where('id = :userId', { userId })
      .execute();
  }

  async deactivateInactiveUsers(daysInactive: number): Promise<number> {
    const result = await this.createQueryBuilder()
      .update(User)
      .set({ isActive: false })
      .where('lastLoginAt < :date', {
        date: new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000),
      })
      .execute();

    return result.affected || 0;
  }
}
```

### 5. Service Layer

```typescript
// src/services/UserService.ts
import { Service } from 'typedi';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { UserRepository } from '../repositories/UserRepository';
import { ConflictError, NotFoundError, UnauthorizedError } from '../utils/errors';

@Service()
export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = AppDataSource.getCustomRepository(UserRepository);
  }

  async create(userData: Partial<User>): Promise<User> {
    // Check if email exists
    const existing = await this.userRepository.findByEmail(userData.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async search(query: string, page = 1, limit = 10) {
    return this.userRepository.searchUsers(query, page, limit);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.findById(id);

    // Check email uniqueness if changing
    if (userData.email && userData.email !== user.email) {
      const existing = await this.userRepository.findByEmail(userData.email);
      if (existing) {
        throw new ConflictError('Email already registered');
      }
    }

    Object.assign(user, userData);
    return this.userRepository.save(user);
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  async authenticate(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findByEmailWithPassword(email);
    
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Remove password from response
    delete user.password;
    return user;
  }

  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await user.validatePassword(oldPassword);
    if (!isValid) {
      throw new UnauthorizedError('Invalid current password');
    }

    user.password = newPassword;
    await this.userRepository.save(user);
  }
}
```

### 6. Controller

```typescript
// src/controllers/UserController.ts
import { Service } from 'typedi';
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto, UpdateUserDto } from '../dtos/UserDto';

@Service()
export class UserController {
  constructor(private readonly userService: UserService) {}

  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await this.userService.findAll(page, limit);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await this.userService.search(q as string, page, limit);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await this.userService.findById(id);
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  store = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = plainToInstance(CreateUserDto, req.body);
      
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }
      
      const user = await this.userService.create(dto);
      
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const dto = plainToInstance(UpdateUserDto, req.body);
      
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }
      
      const user = await this.userService.update(id, dto);
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  destroy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.userService.delete(id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const user = await this.userService.authenticate(email, password);
      
      // Generate JWT token here
      const token = 'generated-jwt-token';
      
      res.json({ user, token });
    } catch (error) {
      next(error);
    }
  };
}
```

### 7. Migration

```typescript
// src/migrations/1700000000000-CreateUser.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUser1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'firstName',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'lastName',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['admin', 'user', 'editor'],
            default: "'user'",
          },
          {
            name: 'bio',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'avatar',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_EMAIL',
        columnNames: ['email'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

### 8. Entity Subscriber

```typescript
// src/subscribers/UserSubscriber.ts
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { User } from '../entities/User';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }

  beforeInsert(event: InsertEvent<User>) {
    console.log(`BEFORE USER INSERTED: ${event.entity.email}`);
  }

  afterInsert(event: InsertEvent<User>) {
    console.log(`USER INSERTED: ${event.entity.email}`);
    // Send welcome email
    // Update statistics
  }

  beforeUpdate(event: UpdateEvent<User>) {
    console.log(`BEFORE USER UPDATED: ${event.entity.email}`);
  }

  afterUpdate(event: UpdateEvent<User>) {
    console.log(`USER UPDATED: ${event.entity.email}`);
    // Log changes
  }

  beforeRemove(event: RemoveEvent<User>) {
    console.log(`BEFORE USER REMOVED: ${event.entityId}`);
  }

  afterRemove(event: RemoveEvent<User>) {
    console.log(`USER REMOVED: ${event.entityId}`);
    // Clean up related data
  }
}
```

### 9. Query Builder Examples

```typescript
// Complex query examples
async function getPostsWithAuthorAndComments() {
  return AppDataSource.getRepository(Post)
    .createQueryBuilder('post')
    .leftJoinAndSelect('post.author', 'author')
    .leftJoinAndSelect('post.comments', 'comment')
    .leftJoinAndSelect('comment.author', 'commentAuthor')
    .where('post.status = :status', { status: 'published' })
    .andWhere('post.publishedAt <= :now', { now: new Date() })
    .orderBy('post.publishedAt', 'DESC')
    .limit(10)
    .getMany();
}

async function getPostStats(authorId: string) {
  return AppDataSource.getRepository(Post)
    .createQueryBuilder('post')
    .select('post.status', 'status')
    .addSelect('COUNT(*)', 'count')
    .addSelect('SUM(post.viewCount)', 'totalViews')
    .where('post.authorId = :authorId', { authorId })
    .groupBy('post.status')
    .getRawMany();
}

async function searchPostsWithPagination(query: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  
  return AppDataSource.getRepository(Post)
    .createQueryBuilder('post')
    .leftJoinAndSelect('post.author', 'author')
    .leftJoinAndSelect('post.categories', 'category')
    .where(
      'post.title ILIKE :query OR post.content ILIKE :query',
      { query: `%${query}%` }
    )
    .andWhere('post.status = :status', { status: 'published' })
    .orderBy('post.publishedAt', 'DESC')
    .skip(skip)
    .take(limit)
    .getManyAndCount();
}
```

## Best Practices

### 1. Entity Design
- Use UUID for primary keys
- Add indexes for frequently queried columns
- Implement soft deletes for important data
- Use enums for status fields
- Add validation decorators

### 2. Relationships
- Choose appropriate cascade options
- Use eager loading carefully
- Implement lazy loading for large relations
- Use junction tables for many-to-many

### 3. Performance
- Use query builder for complex queries
- Implement pagination
- Use select for specific columns
- Enable query caching when appropriate

### 4. Migrations
- Always test migrations
- Implement both up and down methods
- Use transactions for data migrations
- Keep migrations small and focused

## Common Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build               # Build for production
npm run start               # Start production server

# Database
npm run migration:generate -- -n MigrationName  # Generate migration
npm run migration:run       # Run migrations
npm run migration:revert    # Revert last migration
npm run migration:show      # Show migration status

npm run schema:drop         # Drop database schema
npm run schema:sync         # Sync schema (dev only)

# TypeORM CLI
npx typeorm init            # Initialize TypeORM project
npx typeorm entity:create -n User  # Create entity
npx typeorm migration:create -n CreateUser  # Create migration
npx typeorm subscriber:create -n UserSubscriber  # Create subscriber

# Testing
npm run test                # Run tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# Code Quality
npm run lint                # Run ESLint
npm run lint:fix            # Auto-fix issues
npm run type-check          # TypeScript check
```

## Configuration

```json
// package.json scripts
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src",
    "type-check": "tsc --noEmit",
    "migration:generate": "typeorm migration:generate -d src/config/database.ts",
    "migration:run": "typeorm migration:run -d src/config/database.ts",
    "migration:revert": "typeorm migration:revert -d src/config/database.ts",
    "schema:drop": "typeorm schema:drop -d src/config/database.ts",
    "schema:sync": "typeorm schema:sync -d src/config/database.ts"
  }
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "sourceMap": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Deployment

### Docker

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --production

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

USER node

CMD ["node", "dist/server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USERNAME=postgres
      - DB_PASSWORD=password
      - DB_DATABASE=myapp
    depends_on:
      - postgres
    restart: unless-stopped
    
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

## Resources

- [TypeORM Documentation](https://typeorm.io/)
- [TypeORM Guide](https://typeorm.datahouse.ch/)
- [class-validator](https://github.com/typestack/class-validator)
- [class-transformer](https://github.com/typestack/class-transformer)

---

**Last Updated**: 2026-03-17
