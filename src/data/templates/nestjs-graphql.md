# NestJS GraphQL 模板

## 技术栈

- **框架**: NestJS 10.x
- **GraphQL**: @nestjs/graphql, Apollo Server 4
- **ORM**: Prisma / TypeORM / MikroORM
- **认证**: @nestjs/jwt, @nestjs/passport
- **验证**: class-validator, class-transformer
- **订阅**: GraphQL Subscriptions (WebSocket)
- **文件上传**: graphql-upload
- **Federation**: Apollo Federation 2.x

## 项目结构

```
nestjs-graphql/
├── src/
│   ├── modules/                    # 功能模块
│   │   ├── users/                 # 用户模块
│   │   │   ├── users.module.ts
│   │   │   ├── users.resolver.ts  # GraphQL Resolver
│   │   │   ├── users.service.ts   # 业务逻辑
│   │   │   ├── users.dto.ts       # DTO
│   │   │   ├── users.input.ts     # Input Types
│   │   │   ├── users.entity.ts    # 数据库实体
│   │   │   └── users.model.ts     # GraphQL Model
│   │   ├── posts/                 # 文章模块
│   │   ├── comments/              # 评论模块
│   │   └── auth/                  # 认证模块
│   ├── common/                    # 公共模块
│   │   ├── filters/              # 异常过滤器
│   │   │   └── graphql-exception.filter.ts
│   │   ├── guards/               # 守卫
│   │   │   ├── gql-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── decorators/           # 装饰器
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── interceptors/         # 拦截器
│   │   │   ├── logging.interceptor.ts
│   │   │   └── cache.interceptor.ts
│   │   ├── pipes/                # 管道
│   │   │   └── validation.pipe.ts
│   │   ├── scalars/              # 自定义标量
│   │   │   ├── date.scalar.ts
│   │   │   └── upload.scalar.ts
│   │   ├── directives/           # 自定义指令
│   │   │   └── upper.directive.ts
│   │   └── interfaces/           # 接口
│   │       └── payload.interface.ts
│   ├── config/                   # 配置
│   │   ├── graphql.config.ts
│   │   ├── database.config.ts
│   │   └── app.config.ts
│   ├── generated/                # 生成的 GraphQL 文件
│   │   └── graphql.ts
│   ├── app.module.ts             # 根模块
│   ├── main.ts                   # 入口文件
│   └── graphql/schema.gql        # GraphQL Schema
├── prisma/                       # Prisma（可选）
│   ├── schema.prisma
│   └── migrations/
├── test/                         # 测试
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── .env                          # 环境变量
├── nest-cli.json                 # Nest CLI 配置
├── tsconfig.json
└── package.json
```

## 代码模式

### 基础配置

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { GraphQLExceptionFilter } from './common/filters/graphql-exception.filter';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // 全局异常过滤器
  app.useGlobalFilters(new GraphQLExceptionFilter());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000);
}

bootstrap();

// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // GraphQL 模块
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // Schema 优先模式
        typePaths: ['./src/graphql/**/*.gql'],
        
        // 代码优先模式（推荐）
        autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
        sortSchema: true,
        debug: configService.get('NODE_ENV') === 'development',
        playground: configService.get('NODE_ENV') !== 'production',
        
        // 上下文
        context: ({ req, res }) => ({ req, res }),
        
        // 订阅
        subscriptions: {
          'graphql-ws': {
            onConnect: (context) => {
              const { connectionParams, extra } = context;
              // 验证连接
              return {
                req: extra.request,
                token: connectionParams['authorization'],
              };
            },
          },
        },
        
        // 格式化错误
        formatError: (error) => {
          const graphQLFormattedError = {
            message: error.message,
            code: error.extensions?.code,
            statusCode: error.extensions?.status,
          };
          
          if (configService.get('NODE_ENV') === 'production') {
            return graphQLFormattedError;
          }
          
          return {
            ...graphQLFormattedError,
            stack: error.extensions?.exception?.stack,
          };
        },
        
        // 插件
        plugins: [],
        
        // 缓存
        cache: 'bounded',
        
        // 性能追踪
        introspection: configService.get('NODE_ENV') !== 'production',
      }),
    }),

    // 数据库模块
    PrismaModule,

    // 功能模块
    UsersModule,
    PostsModule,
    AuthModule,
  ],
})
export class AppModule {}

// src/config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: process.env.DB_TYPE || 'postgresql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'nestjs_graphql',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
}));
```

### GraphQL Schema（代码优先）

```typescript
// src/modules/users/users.model.ts
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Post } from '../posts/posts.model';
import { Role } from '../../common/enums/role.enum';

@ObjectType()
export class User {
  @Field(() => ID, { description: 'User unique identifier' })
  id: string;

  @Field({ description: 'User email address' })
  email: string;

  @Field({ description: 'User full name', nullable: true })
  name?: string;

  @Field(() => Int, { description: 'User age', nullable: true })
  age?: number;

  @Field(() => Role, { description: 'User role', defaultValue: Role.USER })
  role: Role;

  @Field(() => [Post], { description: 'User posts' })
  posts: Post[];

  @Field({ description: 'Account creation date' })
  createdAt: Date;

  @Field({ description: 'Last update date' })
  updatedAt: Date;
}

// src/modules/users/users.input.ts
import { InputType, Field, PartialType, PickType } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsInt, Min, Max } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(8)
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(120)
  age?: number;
}

@InputType()
export class UpdateUserInput extends PartialType(
  PickType(CreateUserInput, ['name', 'age'] as const)
) {
  @Field()
  @IsString()
  id: string;
}

@InputType()
export class UserFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  age?: number;
}

@InputType()
export class PaginationInput {
  @Field({ nullable: true, defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @Field({ nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

// src/common/interfaces/payload.interface.ts
import { ObjectType, Field, ClassType } from '@nestjs/graphql';

@ObjectType()
export class PageInfo {
  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;

  @Field()
  totalCount: number;
}

export function PaginatedResponse<T>(classRef: ClassType<T>) {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedResponseClass {
    @Field(() => [classRef])
    items: T[];

    @Field(() => PageInfo)
    pageInfo: PageInfo;
  }

  return PaginatedResponseClass;
}

@ObjectType()
export class UserPayload extends PaginatedResponse(User) {}
```

### Resolver 实现

```typescript
// src/modules/users/users.resolver.ts
import { Resolver, Query, Mutation, Args, ResolveField, Parent, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './users.model';
import { CreateUserInput, UpdateUserInput, UserFilterInput, PaginationInput } from './users.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Post } from '../posts/posts.model';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  // Queries
  @Query(() => [User], { name: 'users' })
  @UseGuards(GqlAuthGuard)
  async getUsers(
    @Args('filter', { nullable: true }) filter?: UserFilterInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput
  ): Promise<User[]> {
    return this.usersService.findAll(filter, pagination);
  }

  @Query(() => User, { name: 'user', nullable: true })
  @UseGuards(GqlAuthGuard)
  async getUser(@Args('id', { type: () => ID }) id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Query(() => User, { name: 'me' })
  @UseGuards(GqlAuthGuard)
  async getCurrentUser(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  // Mutations
  @Mutation(() => User, { name: 'createUser' })
  async createUser(@Args('input') input: CreateUserInput): Promise<User> {
    return this.usersService.create(input);
  }

  @Mutation(() => User, { name: 'updateUser' })
  @UseGuards(GqlAuthGuard)
  async updateUser(@Args('input') input: UpdateUserInput): Promise<User> {
    return this.usersService.update(input);
  }

  @Mutation(() => Boolean, { name: 'deleteUser' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteUser(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.usersService.delete(id);
  }

  // Field Resolvers
  @ResolveField(() => [Post], { name: 'posts' })
  async getPosts(@Parent() user: User): Promise<Post[]> {
    return this.usersService.getUserPosts(user.id);
  }

  @ResolveField(() => Int, { name: 'postsCount' })
  async getPostsCount(@Parent() user: User): Promise<number> {
    return this.usersService.getUserPostsCount(user.id);
  }
}

// src/modules/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserInput, UpdateUserInput, UserFilterInput, PaginationInput } from './users.input';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: UserFilterInput, pagination?: PaginationInput) {
    const { search, age } = filter || {};
    const { limit = 10, offset = 0 } = pagination || {};

    return this.prisma.user.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { email: { contains: search, mode: 'insensitive' } },
                  { name: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          age ? { age } : {},
        ],
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(input: CreateUserInput) {
    const hashedPassword = await bcrypt.hash(input.password, 10);

    return this.prisma.user.create({
      data: {
        ...input,
        password: hashedPassword,
      },
    });
  }

  async update(input: UpdateUserInput) {
    const { id, ...data } = input;

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    await this.prisma.user.delete({
      where: { id },
    });

    return true;
  }

  async getUserPosts(userId: string) {
    return this.prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserPostsCount(userId: string) {
    return this.prisma.post.count({
      where: { authorId: userId },
    });
  }
}

// src/modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [PrismaModule, PostsModule],
  providers: [UsersResolver, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

### 认证与授权

```typescript
// src/modules/auth/auth.resolver.ts
import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './auth.input';
import { AuthPayload } from './auth.model';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.authService.login(input);
  }

  @Mutation(() => AuthPayload)
  async refreshToken(@Args('token') token: string): Promise<AuthPayload> {
    return this.authService.refreshToken(token);
  }

  @Query(() => Boolean)
  async verifyToken(@Args('token') token: string): Promise<boolean> {
    return this.authService.verifyToken(token);
  }
}

// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginInput } from './auth.input';
import { AuthPayload } from './auth.model';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async login(input: LoginInput): Promise<AuthPayload> {
    const user = await this.usersService.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async refreshToken(token: string): Promise<AuthPayload> {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);

      const newPayload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(newPayload);
      const refreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

      return {
        accessToken,
        refreshToken,
        user,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async verifyToken(token: string): Promise<boolean> {
    try {
      this.jwtService.verify(token);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// src/common/guards/gql-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}

// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  }
);
```

### 自定义标量和指令

```typescript
// src/common/scalars/date.scalar.ts
import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('Date', () => Date)
export class DateScalar implements CustomScalar<number, Date> {
  description = 'Date custom scalar type';

  parseValue(value: number): Date {
    return new Date(value); // value from the client
  }

  serialize(value: Date): number {
    return value.getTime(); // value sent to the client
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.INT) {
      return new Date(ast.value);
    }
    return null;
  }
}

// src/common/scalars/upload.scalar.ts
import { Scalar, CustomScalar } from '@nestjs/graphql';
import { GraphQLUpload, FileUpload } from 'graphql-upload';

@Scalar('Upload', () => GraphQLUpload)
export class UploadScalar implements CustomScalar<typeof GraphQLUpload, FileUpload> {
  description = 'The Upload scalar type represents a file upload.';

  parseValue(value: any) {
    return GraphQLUpload.parseValue(value);
  }

  serialize(value: any) {
    return GraphQLUpload.serialize(value);
  }

  parseLiteral(ast: any) {
    return GraphQLUpload.parseLiteral(ast);
  }
}

// src/common/directives/upper.directive.ts
import { DirectiveLocation, GraphQLDirective, GraphQLString } from 'graphql';
import { SchemaDirectiveVisitor } from 'apollo-server-express';

export class UpperCaseDirective extends SchemaDirectiveVisitor {
  static getDirectiveDeclaration(directiveName: string) {
    return new GraphQLDirective({
      name: directiveName,
      locations: [DirectiveLocation.FIELD_DEFINITION],
      args: {
        unless: {
          type: GraphQLString,
        },
      },
    });
  }

  visitFieldDefinition(field: any) {
    const { resolve = defaultFieldResolver } = field;
    const { unless } = this.args;

    field.resolve = async function (...args: any[]) {
      const result = await resolve.apply(this, args);

      if (typeof result === 'string' && result !== unless) {
        return result.toUpperCase();
      }

      return result;
    };

    return field;
  }
}
```

### 订阅（Subscriptions）

```typescript
// src/modules/posts/posts.resolver.ts
import { Resolver, Subscription, Mutation, Args } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { Post } from './posts.model';
import { CreatePostInput } from './posts.input';

const pubSub = new PubSub();

@Resolver(() => Post)
export class PostsResolver {
  @Mutation(() => Post)
  async createPost(@Args('input') input: CreatePostInput): Promise<Post> {
    const post = await this.postsService.create(input);
    
    // 发布订阅事件
    pubSub.publish('postCreated', { postCreated: post });
    
    return post;
  }

  @Subscription(() => Post, {
    name: 'postCreated',
    resolve: (value) => value.postCreated,
  })
  postCreated() {
    return pubSub.asyncIterator('postCreated');
  }

  @Subscription(() => Post, {
    name: 'postUpdated',
    filter: (payload, variables) => {
      return payload.postUpdated.id === variables.postId;
    },
  })
  postUpdated(@Args('postId') postId: string) {
    return pubSub.asyncIterator('postUpdated');
  }
}

// GraphQL 订阅示例
const subscription = gql`
  subscription OnPostCreated {
    postCreated {
      id
      title
      content
      author {
        name
      }
    }
  }
`;
```

### 文件上传

```typescript
// src/modules/uploads/uploads.resolver.ts
import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { createWriteStream } from 'fs';
import { join } from 'path';

@Resolver()
export class UploadsResolver {
  @Mutation(() => Boolean)
  async uploadFile(
    @Args({ name: 'file', type: () => GraphQLUpload }) file: FileUpload
  ): Promise<boolean> {
    const { createReadStream, filename } = file;

    return new Promise((resolve, reject) => {
      createReadStream()
        .pipe(createWriteStream(join(process.cwd(), `uploads/${filename}`)))
        .on('finish', () => resolve(true))
        .on('error', () => reject(false));
    });
  }

  @Mutation(() => [Boolean])
  async uploadFiles(
    @Args({ name: 'files', type: () => [GraphQLUpload] }) files: FileUpload[]
  ): Promise<boolean[]> {
    const results = await Promise.all(
      files.map((file) => this.uploadFile(file))
    );
    return results;
  }
}
```

## 测试

```typescript
// test/users.resolver.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersResolver } from '../src/modules/users/users.resolver';
import { UsersService } from '../src/modules/users/users.service';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let service: UsersService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findAll: jest.fn().mockResolvedValue([mockUser]),
    findById: jest.fn().mockResolvedValue(mockUser),
    create: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn().mockResolvedValue(mockUser),
    delete: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    resolver = module.get<UsersResolver>(UsersResolver);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getUsers', () => {
    it('should return an array of users', async () => {
      const result = await resolver.getUsers();
      expect(result).toEqual([mockUser]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    it('should return a user by id', async () => {
      const result = await resolver.getUser('1');
      expect(result).toEqual(mockUser);
      expect(service.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const input = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      const result = await resolver.createUser(input);
      expect(result).toEqual(mockUser);
      expect(service.create).toHaveBeenCalledWith(input);
    });
  });
});
```

## 常用命令

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run start:prod

# 生成 GraphQL Schema
npm run generate:typedefs

# Prisma 命令（如果使用）
npx prisma generate
npx prisma migrate dev
npx prisma studio

# 测试
npm run test
npm run test:e2e
npm run test:cov

# 代码格式化
npm run format

# Lint
npm run lint
```

## 参考资源

- [NestJS 官方文档](https://docs.nestjs.com/)
- [NestJS GraphQL](https://docs.nestjs.com/graphql/quick-start)
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
- [Prisma](https://www.prisma.io/)
- [GraphQL Federation](https://www.apollographql.com/docs/federation/)
