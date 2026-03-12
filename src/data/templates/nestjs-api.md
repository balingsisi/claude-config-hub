# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: NestJS Enterprise API
**Type**: Backend API Service
**Tech Stack**: NestJS + TypeScript + PostgreSQL + TypeORM/Prisma
**Goal**: Production-ready enterprise-grade API with authentication, validation, and scalable architecture

---

## Tech Stack

### Core
- **Framework**: NestJS 10+
- **Language**: TypeScript 5.3+
- **Runtime**: Node.js 20+ LTS
- **Architecture**: Modular, dependency injection

### Database & ORM
- **Database**: PostgreSQL 15+
- **ORM**: TypeORM or Prisma
- **Migrations**: Built-in migration system
- **Validation**: class-validator + class-transformer

### Security & Auth
- **Authentication**: JWT + Passport
- **Authorization**: RBAC with Guards
- **Security**: Helmet, CORS, Rate Limiting
- **Encryption**: bcrypt/argon2

### Development
- **Package Manager**: pnpm or npm
- **Testing**: Jest + Supertest
- **E2E Testing**: Jest + Test Containers
- **Documentation**: Swagger/OpenAPI
- **Linting**: ESLint + Prettier

---

## Code Standards

### TypeScript Rules
- Use strict mode - no `any` types
- Prefer interfaces for DTOs
- Use proper decorators for validation
- Enable strict null checks

```typescript
// ✅ Good
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;
}

// ❌ Bad
export class CreateUserDto {
  name: any;
  email: any;
}
```

### Naming Conventions
- **Modules**: kebab-case (`user.module.ts`)
- **Controllers**: kebab-case with controller suffix (`user.controller.ts`)
- **Services**: kebab-case with service suffix (`user.service.ts`)
- **DTOs**: PascalCase with DTO suffix (`CreateUserDto`)
- **Entities**: PascalCase (`User`, `Product`)
- **Guards**: PascalCase with Guard suffix (`JwtAuthGuard`)

### File Organization
```
src/
├── modules/              # Feature modules
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   ├── guards/
│   │   └── strategies/
│   ├── users/
│   └── products/
├── common/              # Shared utilities
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── middleware/
├── config/              # Configuration
├── database/            # Database setup
│   ├── migrations/
│   └── seeds/
├── entities/            # TypeORM entities (if centralized)
└── main.ts             # Application entry point
```

---

## Architecture Patterns

### Module Structure
- Organize by feature modules
- Keep modules cohesive and loosely coupled
- Use dependency injection throughout
- Export only what's necessary

```typescript
// modules/users/users.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    // Import only what this module needs
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export for other modules
})
export class UsersModule {}
```

### Controller Design
- Keep controllers thin - delegate to services
- Use DTOs for validation
- Implement proper HTTP status codes
- Document with Swagger decorators

```typescript
@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
```

### Service Layer
- Business logic belongs in services
- Handle database operations
- Implement proper error handling
- Use transactions for multi-step operations

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }
}
```

### Guards & Interceptors
- Use guards for authorization
- Use interceptors for logging, transforming responses
- Keep them focused and reusable

```typescript
// guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// interceptors/transform.interceptor.ts
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        statusCode: context.switchToHttp().getResponse().statusCode,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### Database Transactions
- Use transactions for multi-step operations
- Handle errors properly
- Rollback on failure

```typescript
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update product inventory
      await queryRunner.manager.decrement(
        Product,
        { id: createOrderDto.productId },
        'stock',
        createOrderDto.quantity,
      );

      // Create order
      const order = queryRunner.manager.create(Order, createOrderDto);
      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();
      return order;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

---

## Key Constraints

### Security
- ✅ Validate all input with DTOs
- ✅ Use guards for authentication/authorization
- ✅ Hash passwords with bcrypt/argon2
- ✅ Use environment variables for secrets
- ✅ Implement rate limiting
- ❌ No hardcoded secrets or API keys
- ❌ No SQL injection vulnerabilities
- ❌ No unvalidated query parameters

### Performance
- ✅ Use pagination for list endpoints
- ✅ Implement proper database indexing
- ✅ Use caching where appropriate
- ✅ Optimize database queries (avoid N+1)
- ❌ Don't fetch unnecessary data
- ❌ Don't block the event loop

### Code Quality
- ✅ Follow SOLID principles
- ✅ Write unit and E2E tests
- ✅ Use dependency injection
- ✅ Document APIs with Swagger
- ❌ No circular dependencies
- ❌ No business logic in controllers

---

## Common Commands

### Development
```bash
npm run start          # Start development server
npm run start:dev      # Start with watch mode
npm run start:debug    # Start with debug mode
npm run start:prod     # Start production server
```

### Database
```bash
npm run migration:generate -- -n <name>  # Generate migration
npm run migration:run                    # Run migrations
npm run migration:revert                 # Revert last migration
npm run seed                             # Run database seeds
```

### Testing
```bash
npm test               # Run unit tests
npm run test:watch     # Watch mode
npm run test:cov       # Coverage report
npm run test:e2e       # Run E2E tests
```

### Building
```bash
npm run build          # Build application
npm run lint           # Run ESLint
npm run format         # Format with Prettier
```

---

## Important Prohibitions

### ❌ Never Do
- Don't use `any` type - use proper TypeScript types
- Don't put business logic in controllers
- Don't skip input validation
- Don't hardcode configuration values
- Don't commit `.env` files
- Don't ignore TypeScript errors
- Don't disable ESLint rules without reason
- Don't use raw SQL queries without parameterization
- Don't skip error handling
- Don't forget to handle async errors

### ⚠️ Use with Caution
- Global modules - keep them minimal
- Interceptors - ensure they don't hide errors
- Custom decorators - document their purpose
- Dynamic modules - test thoroughly
- Transactions - ensure proper cleanup

---

## Best Practices

### DTO Validation
- Always validate input with class-validator
- Use appropriate decorators
- Provide clear error messages

```typescript
// ✅ Good
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Min(18)
  @Max(120)
  age?: number;
}
```

### Error Handling
- Use built-in HTTP exceptions
- Create custom exceptions when needed
- Implement global exception filters
- Log errors appropriately

```typescript
// ✅ Good
@Get(':id')
async findOne(@Param('id') id: string) {
  if (!isUUID(id)) {
    throw new BadRequestException('Invalid UUID format');
  }

  const user = await this.usersService.findOne(id);
  if (!user) {
    throw new NotFoundException(`User with ID ${id} not found`);
  }
  
  return user;
}
```

### Configuration
- Use ConfigModule for environment variables
- Validate configuration on startup
- Use namespaced configuration

```typescript
// config/app.config.ts
export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'app_db',
  },
}));
```

---

## Compact Instructions

When using `/compact`, preserve:
- Architecture decisions and API changes
- Database schema changes
- Test commands and results
- Modified files list and critical diffs

Discard:
- Verbose log output
- Exploratory search dead ends
- Redundant confirmation messages

---

## Quick Reference

### File Locations
- Controllers: `src/modules/**/controllers/*.controller.ts`
- Services: `src/modules/**/services/*.service.ts`
- DTOs: `src/modules/**/dto/*.dto.ts`
- Entities: `src/modules/**/entities/*.entity.ts` or `src/entities/*.entity.ts`
- Guards: `src/common/guards/*.guard.ts`
- Interceptors: `src/common/interceptors/*.interceptor.ts`

### Environment Variables
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/db
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
```

### Decorators Reference
```typescript
// Common decorators
@Controller('path')
@Get(), @Post(), @Put(), @Delete(), @Patch()
@Body(), @Param(), @Query()
@UseGuards(), @UseInterceptors()
@Req(), @Res()

// Validation decorators
@IsString(), @IsNumber(), @IsEmail(), @IsOptional()
@Min(), @Max(), @MinLength(), @MaxLength()

// Swagger decorators
@ApiTags(), @ApiOperation(), @ApiResponse()
@ApiBearerAuth(), @ApiBody()
```

---

**Last Updated**: 2026-03-12
