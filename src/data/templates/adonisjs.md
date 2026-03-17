# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: AdonisJS Application
**Type**: Full-Stack Web Application
**Tech Stack**: AdonisJS 6 + TypeScript + PostgreSQL + Lucid ORM
**Goal**: Build scalable, maintainable web applications with an MVC architecture

---

## Tech Stack

### Backend
- **Framework**: AdonisJS 6.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15+
- **ORM**: Lucid ORM
- **Authentication**: @adonisjs/auth
- **Validation**: @adonisjs/validator
- **Websockets**: @adonisjs/transmission (optional)

### Frontend
- **Template Engine**: Edge (built-in)
- **Asset Bundling**: Vite (via @adonisjs/vite)
- **CSS Framework**: Tailwind CSS
- **JavaScript**: TypeScript/Alpine.js (optional)

### Development
- **Package Manager**: npm/pnpm
- **Testing**: Japa
- **Linting**: ESLint
- **Formatting**: Prettier

---

## Code Standards

### TypeScript Rules
- Use strict mode
- Prefer interfaces over type aliases
- Use explicit return types for public methods
- Avoid `any` - use proper types

```typescript
// ✅ Good
interface UserDTO {
  email: string
  password: string
}

export default class AuthController {
  public async login({ request }: HttpContext): Promise<{ token: string }> {
    const { email, password }: UserDTO = request.only(['email', 'password'])
    // ...
  }
}

// ❌ Bad
public async login({ request }: any): any {
  const data = request.all()
}
```

### Naming Conventions
- **Controllers**: PascalCase with `Controller` suffix (`UserController.ts`)
- **Models**: PascalCase singular (`User.ts`)
- **Migrations**: snake_case (`create_users_table.ts`)
- **Routes**: kebab-case URLs (`/user-profile`)
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE

### File Organization
```
app/
├── Controllers/     # HTTP Controllers
├── Models/         # Lucid Models
├── Services/       # Business logic services
├── Validators/     # Request validators
├── Middleware/     # HTTP middleware
├── Exceptions/     # Custom exceptions
└── Types/          # TypeScript type definitions
config/
├── app.ts
├── database.ts
└── auth.ts
database/
├── migrations/     # Database migrations
├── seeders/        # Database seeders
└── factories/      # Model factories
resources/
├── views/          # Edge templates
└── js/             # Frontend JavaScript
start/
├── routes.ts       # Route definitions
├── kernel.ts       # HTTP kernel
└── events.ts       # Event listeners
tests/              # Test files
```

---

## Architecture Patterns

### MVC Structure
- Controllers handle HTTP requests
- Models represent data and business logic
- Services encapsulate complex business logic
- Views render HTML responses

```typescript
// ✅ Good - Controller delegates to service
export default class UserController {
  constructor(protected userService: UserService) {}

  public async index({ view }: HttpContext) {
    const users = await this.userService.getAll()
    return view.render('users/index', { users })
  }

  public async store({ request, response }: HttpContext) {
    const data = request.all()
    const user = await this.userService.create(data)
    return response.created(user)
  }
}
```

### Lucid ORM
- Use Lucid models for database operations
- Define relationships in models
- Use query scopes for reusable queries
- Use migrations for schema changes

```typescript
// ✅ Good - Lucid model with relationships
import { column, hasMany, HasMany } from '@adonisjs/lucid/orm'
import Post from '#models/post'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column()
  declare name: string

  @hasMany(() => Post)
  declare posts: HasMany<typeof Post>

  // Query scope
  public static active() {
    return this.query().where('isActive', true)
  }
}

// Usage
const users = await User.query().active().preload('posts')
```

### Route Definitions
- Group related routes
- Use middleware for authentication/authorization
- Use resource controllers for CRUD operations

```typescript
// ✅ Good - Organized routes
import router from '@adonisjs/core/services/router'
import UsersController from '#controllers/UsersController'

router.group(() => {
  router.get('/', [UsersController, 'index']).as('users.index')
  router.get('/:id', [UsersController, 'show']).as('users.show')
  router.post('/', [UsersController, 'store']).as('users.store')
  router.put('/:id', [UsersController, 'update']).as('users.update')
  router.delete('/:id', [UsersController, 'destroy']).as('users.destroy')
})
.prefix('api/users')
.middleware(['auth'])
```

### Validation
- Use validators for request validation
- Define custom error messages
- Validate at route level

```typescript
// ✅ Good - Request validator
import { schema, rules } from '@adonisjs/validator'

export default class CreateUserValidator {
  public schema = schema.create({
    email: schema.string({ trim: true }, [
      rules.email(),
      rules.unique({ table: 'users', column: 'email' })
    ]),
    password: schema.string({}, [
      rules.minLength(8),
      rules.confirmed()
    ]),
    name: schema.string({ trim: true })
  })

  public messages = {
    'email.required': 'Email is required',
    'email.unique': 'Email already exists',
    'password.minLength': 'Password must be at least 8 characters'
  }
}

// Usage in controller
public async store({ request, response }: HttpContext) {
  const data = await request.validateUsing(CreateUserValidator)
  const user = await User.create(data)
  return response.created(user)
}
```

---

## Key Constraints

### Security
- ✅ Always validate user input
- ✅ Use CSRF protection
- ✅ Hash passwords with Lucid hooks
- ✅ Use environment variables for secrets
- ✅ Implement proper authentication/authorization
- ❌ Never trust user input
- ❌ Never expose sensitive data in responses
- ❌ Never disable CSRF protection

### Performance
- ✅ Use database indexes for frequently queried fields
- ✅ Use Lucid's `preload` to avoid N+1 queries
- ✅ Cache expensive operations
- ✅ Use connection pooling
- ❌ Don't fetch unnecessary columns
- ❌ Don't make unindexed queries on large tables

### Database
- ✅ Always use migrations for schema changes
- ✅ Use transactions for multi-step operations
- ✅ Define proper foreign key constraints
- ✅ Use soft deletes when appropriate
- ❌ Don't modify schema manually
- ❌ Don't skip migrations

---

## Common Commands

### Development
```bash
node ace serve          # Start development server
node ace build          # Build for production
node ace serve --watch  # Watch mode with auto-reload
```

### Database
```bash
node ace migration:run         # Run migrations
node ace migration:rollback    # Rollback last migration
node ace migration:reset       # Reset all migrations
node ace migration:refresh     # Reset and re-run migrations
node ace db:seed              # Run seeders
node ace make:migration       # Create new migration
node ace make:model           # Create new model
```

### Code Generation
```bash
node ace make:controller      # Create controller
node ace make:model           # Create model
node ace make:middleware      # Create middleware
node ace make:validator       # Create validator
node ace make:command         # Create custom command
```

### Testing
```bash
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Run with coverage
```

---

## Important Prohibitions

### ❌ Never Do
- Don't skip input validation
- Don't use `any` type
- Don't disable CSRF protection
- Don't commit `.env` files
- Don't write raw SQL queries (use Lucid)
- Don't ignore TypeScript errors
- Don't create fat controllers (use services)
- Don't skip migrations
- Don't use synchronous operations in controllers

### ⚠️ Use with Caution
- Raw queries - only when Lucid can't handle it
- Global middleware - prefer route-specific
- Fat models - extract to services
- Edge templates with complex logic - keep simple

---

## Best Practices

### Service Layer
- Extract business logic to services
- Keep controllers thin
- Use dependency injection

```typescript
// ✅ Good - Service with business logic
export default class UserService {
  public async create(data: CreateUserDTO): Promise<User> {
    // Hash password
    data.password = await hash.make(data.password)
    
    // Create user
    const user = await User.create(data)
    
    // Send welcome email
    await Mail.send((message) => {
      message
        .to(user.email)
        .subject('Welcome!')
        .htmlView('emails/welcome', { user })
    })
    
    return user
  }
}
```

### Authentication
- Use AdonisJS auth guards
- Implement proper middleware
- Use API tokens for APIs

```typescript
// ✅ Good - Auth middleware
export default class AuthMiddleware {
  public async handle({ auth, response }: HttpContext, next: () => Promise<void>) {
    await auth.authenticate()
    await next()
  }
}

// Protect routes
router.group(() => {
  // Protected routes
}).middleware([AuthMiddleware])
```

### Error Handling
- Use global exception handler
- Create custom exceptions
- Return proper HTTP status codes

```typescript
// ✅ Good - Custom exception
export default class UserNotFoundException extends Exception {
  public static message = 'User not found'
  public static status = 404
  public static code = 'E_USER_NOT_FOUND'
}

// Usage
public async show({ params }: HttpContext) {
  const user = await User.find(params.id)
  if (!user) {
    throw new UserNotFoundException()
  }
  return user
}
```

---

## Quick Reference

### Artisan Commands
- `make:controller` - Create controller
- `make:model` - Create model
- `make:migration` - Create migration
- `make:middleware` - Create middleware
- `make:validator` - Create validator
- `make:command` - Create custom command
- `make:exception` - Create exception

### Lucid Relationships
- `@hasMany` - One-to-many
- `@belongsTo` - Many-to-one
- `@manyToMany` - Many-to-many
- `@hasOne` - One-to-one

### Validation Rules
- `rules.required()` - Field required
- `rules.email()` - Valid email
- `rules.unique()` - Unique in database
- `rules.minLength(n)` - Minimum length
- `rules.confirmed()` - Field confirmation

### Common Directories
- Controllers: `app/Controllers/`
- Models: `app/Models/`
- Views: `resources/views/`
- Config: `config/`
- Routes: `start/routes.ts`

---

**Last Updated**: 2026-03-17
