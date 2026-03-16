# Fastify High-Performance API Template

## Project Overview

Fastify is a high-performance Node.js web framework focused on speed, efficiency, and developer experience. It provides a robust plugin system, JSON schema validation, and excellent TypeScript support while maintaining minimal overhead.

## Tech Stack

- **Framework**: Fastify 5.x
- **Language**: TypeScript 5.x
- **Runtime**: Node.js 20+ LTS
- **Validation**: JSON Schema / TypeBox
- **Database**: PostgreSQL / MongoDB
- **ORM**: Prisma / TypeORM / Mongoose
- **Testing**: Tap / Vitest
- **Documentation**: @fastify/swagger

## Project Structure

```
├── src/
│   ├── app.ts                  # Fastify app factory
│   ├── server.ts               # Server entry point
│   ├── config/
│   │   ├── index.ts            # Config aggregator
│   │   ├── app.ts              # App config
│   │   └── database.ts         # Database config
│   ├── modules/                # Feature modules
│   │   ├── auth/
│   │   │   ├── index.ts        # Auth plugin
│   │   │   ├── routes.ts       # Auth routes
│   │   │   ├── controller.ts   # Auth controller
│   │   │   ├── service.ts      # Auth service
│   │   │   ├── schemas.ts      # JSON schemas
│   │   │   └── hooks.ts        # Auth hooks
│   │   ├── users/
│   │   │   ├── index.ts
│   │   │   ├── routes.ts
│   │   │   ├── controller.ts
│   │   │   ├── service.ts
│   │   │   ├── schemas.ts
│   │   │   └── repository.ts
│   │   └── posts/
│   │       ├── index.ts
│   │       ├── routes.ts
│   │       ├── controller.ts
│   │       ├── service.ts
│   │       └── schemas.ts
│   ├── plugins/                # Custom plugins
│   │   ├── prisma.ts           # Prisma plugin
│   │   ├── jwt.ts              # JWT plugin
│   │   ├── swagger.ts          # API docs
│   │   ├── cors.ts             # CORS config
│   │   └── rate-limit.ts       # Rate limiting
│   ├── hooks/                  # Global hooks
│   │   ├── auth.ts             # Authentication hook
│   │   └── errorHandler.ts     # Error handling
│   ├── schemas/                # Shared schemas
│   │   ├── common.ts           # Common schemas
│   │   └── error.ts            # Error schemas
│   ├── types/                  # TypeScript types
│   │   ├── fastify.d.ts        # Fastify augmentations
│   │   └── env.d.ts            # Env types
│   └── utils/                  # Utility functions
│       ├── logger.ts           # Logger config
│       └── errors.ts           # Custom errors
├── prisma/
│   ├── schema.prisma           # Prisma schema
│   └── migrations/             # Database migrations
├── tests/
│   ├── helper.ts               # Test utilities
│   ├── modules/
│   │   ├── auth.test.ts
│   │   └── users.test.ts
│   └── e2e/
│       └── api.test.ts
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Key Patterns

### 1. App Factory

```typescript
// src/app.ts
import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';

import prismaPlugin from './plugins/prisma';
import authPlugin from './modules/auth';
import usersPlugin from './modules/users';
import postsPlugin from './modules/posts';

export async function buildApp(
  options: FastifyServerOptions = {}
): Promise<FastifyInstance> {
  const app = Fastify(options);

  // Register core plugins
  await app.register(sensible);
  await app.register(helmet);
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // JWT
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'super-secret-key',
  });

  // Swagger documentation
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Fastify API',
        description: 'High-performance API documentation',
        version: '1.0.0',
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Development' },
      ],
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'users', description: 'User management' },
        { name: 'posts', description: 'Post management' },
      ],
    },
  });

  await app.register(swaggerUI, {
    routePrefix: '/documentation',
  });

  // Custom plugins
  await app.register(prismaPlugin);

  // Feature modules
  await app.register(authPlugin, { prefix: '/api/auth' });
  await app.register(usersPlugin, { prefix: '/api/users' });
  await app.register(postsPlugin, { prefix: '/api/posts' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    if (error.validation) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: error.message,
        details: error.validation,
      });
    }

    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name,
        message: error.message,
      });
    }

    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  });

  return app;
}
```

### 2. Module Structure (Plugin)

```typescript
// src/modules/users/index.ts
import { FastifyInstance } from 'fastify';
import { usersRoutes } from './routes';
import { usersService } from './service';

export default async function usersPlugin(app: FastifyInstance) {
  // Register dependencies
  app.decorate('usersService', usersService);

  // Register routes
  await app.register(usersRoutes);
}

// Type augmentation
declare module 'fastify' {
  interface FastifyInstance {
    usersService: ReturnType<typeof usersService>;
  }
}
```

### 3. Routes with Schema Validation

```typescript
// src/modules/users/routes.ts
import { FastifyInstance } from 'fastify';
import {
  getUsersSchema,
  getUserSchema,
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
} from './schemas';
import { UsersController } from './controller';

export async function usersRoutes(app: FastifyInstance) {
  const controller = new UsersController(app);

  // GET /api/users
  app.get('/', {
    schema: getUsersSchema,
    preHandler: [app.authenticate],
    handler: controller.index.bind(controller),
  });

  // GET /api/users/:id
  app.get('/:id', {
    schema: getUserSchema,
    preHandler: [app.authenticate],
    handler: controller.show.bind(controller),
  });

  // POST /api/users
  app.post('/', {
    schema: createUserSchema,
    handler: controller.store.bind(controller),
  });

  // PUT /api/users/:id
  app.put('/:id', {
    schema: updateUserSchema,
    preHandler: [app.authenticate],
    handler: controller.update.bind(controller),
  });

  // DELETE /api/users/:id
  app.delete('/:id', {
    schema: deleteUserSchema,
    preHandler: [app.authenticate],
    handler: controller.destroy.bind(controller),
  });
}
```

### 4. JSON Schema with TypeBox

```typescript
// src/modules/users/schemas.ts
import { Type, Static } from '@sinclair/typebox';

// User entity
export const UserSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String(),
  email: Type.String({ format: 'email' }),
  role: Type.Union([Type.Literal('admin'), Type.Literal('user'), Type.Literal('editor')]),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

export type User = Static<typeof UserSchema>;

// Create user input
export const CreateUserSchema = Type.Object({
  name: Type.String({ minLength: 2, maxLength: 100 }),
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8, maxLength: 100 }),
  role: Type.Optional(Type.Union([
    Type.Literal('admin'),
    Type.Literal('user'),
    Type.Literal('editor'),
  ])),
});

export type CreateUserInput = Static<typeof CreateUserSchema>;

// Update user input
export const UpdateUserSchema = Type.Partial(Type.Object({
  name: Type.String({ minLength: 2, maxLength: 100 }),
  email: Type.String({ format: 'email' }),
  role: Type.Union([
    Type.Literal('admin'),
    Type.Literal('user'),
    Type.Literal('editor'),
  ]),
}));

export type UpdateUserInput = Static<typeof UpdateUserSchema>;

// Route schemas
export const getUsersSchema = {
  tags: ['users'],
  summary: 'Get all users',
  querystring: Type.Object({
    page: Type.Optional(Type.Number({ minimum: 1 })),
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
    search: Type.Optional(Type.String()),
  }),
  response: {
    200: Type.Object({
      data: Type.Array(UserSchema),
      pagination: Type.Object({
        page: Type.Number(),
        limit: Type.Number(),
        total: Type.Number(),
        totalPages: Type.Number(),
      }),
    }),
  },
};

export const getUserSchema = {
  tags: ['users'],
  summary: 'Get user by ID',
  params: Type.Object({
    id: Type.String({ format: 'uuid' }),
  }),
  response: {
    200: UserSchema,
    404: Type.Object({
      statusCode: Type.Number(),
      error: Type.String(),
      message: Type.String(),
    }),
  },
};

export const createUserSchema = {
  tags: ['users'],
  summary: 'Create a new user',
  body: CreateUserSchema,
  response: {
    201: UserSchema,
    400: Type.Object({
      statusCode: Type.Number(),
      error: Type.String(),
      message: Type.String(),
      details: Type.Any(),
    }),
  },
};

export const updateUserSchema = {
  tags: ['users'],
  summary: 'Update user',
  params: Type.Object({
    id: Type.String({ format: 'uuid' }),
  }),
  body: UpdateUserSchema,
  response: {
    200: UserSchema,
    404: Type.Object({
      statusCode: Type.Number(),
      error: Type.String(),
      message: Type.String(),
    }),
  },
};

export const deleteUserSchema = {
  tags: ['users'],
  summary: 'Delete user',
  params: Type.Object({
    id: Type.String({ format: 'uuid' }),
  }),
  response: {
    204: Type.Null(),
    404: Type.Object({
      statusCode: Type.Number(),
      error: Type.String(),
      message: Type.String(),
    }),
  },
};
```

### 5. Controller

```typescript
// src/modules/users/controller.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { User, CreateUserInput, UpdateUserInput } from './schemas';

interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}

interface IdParams {
  id: string;
}

export class UsersController {
  constructor(private app: FastifyInstance) {}

  async index(
    request: FastifyRequest<{ Querystring: PaginationQuery }>,
    reply: FastifyReply
  ) {
    const { page = 1, limit = 10, search } = request.query;
    
    const result = await this.app.usersService.findAll({
      page,
      limit,
      search,
    });

    return reply.status(200).send(result);
  }

  async show(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    
    const user = await this.app.usersService.findById(id);
    
    if (!user) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `User with ID ${id} not found`,
      });
    }

    return reply.status(200).send(user);
  }

  async store(
    request: FastifyRequest<{ Body: CreateUserInput }>,
    reply: FastifyReply
  ) {
    const user = await this.app.usersService.create(request.body);
    return reply.status(201).send(user);
  }

  async update(
    request: FastifyRequest<{ Params: IdParams; Body: UpdateUserInput }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    
    const user = await this.app.usersService.update(id, request.body);
    
    if (!user) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `User with ID ${id} not found`,
      });
    }

    return reply.status(200).send(user);
  }

  async destroy(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    
    await this.app.usersService.delete(id);
    
    return reply.status(204).send();
  }
}
```

### 6. Service Layer

```typescript
// src/modules/users/service.ts
import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { User, CreateUserInput, UpdateUserInput } from './schemas';

interface FindAllOptions {
  page: number;
  limit: number;
  search?: string;
}

interface PaginatedResult {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function usersService(app: FastifyInstance) {
  const prisma = app.prisma;

  return {
    async findAll(options: FindAllOptions): Promise<PaginatedResult> {
      const { page, limit, search } = options;
      const skip = (page - 1) * limit;

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      const [data, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },

    async findById(id: string): Promise<User | null> {
      return prisma.user.findUnique({
        where: { id },
      });
    },

    async findByEmail(email: string): Promise<User | null> {
      return prisma.user.findUnique({
        where: { email },
      });
    },

    async create(data: CreateUserInput): Promise<User> {
      // Check if email exists
      const existing = await this.findByEmail(data.email);
      if (existing) {
        throw app.httpErrors.conflict('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      return prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
        },
      });
    },

    async update(id: string, data: UpdateUserInput): Promise<User | null> {
      // Check if user exists
      const user = await this.findById(id);
      if (!user) return null;

      // Check email uniqueness if changing email
      if (data.email && data.email !== user.email) {
        const existing = await this.findByEmail(data.email);
        if (existing) {
          throw app.httpErrors.conflict('Email already registered');
        }
      }

      return prisma.user.update({
        where: { id },
        data,
      });
    },

    async delete(id: string): Promise<void> {
      await prisma.user.delete({
        where: { id },
      });
    },
  };
}
```

### 7. Authentication Hook

```typescript
// src/hooks/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

export async function authHook(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<{
      id: string;
      email: string;
      role: string;
    }>();
    
    request.user = payload;
  } catch (error) {
    throw request.server.httpErrors.unauthorized('Invalid or expired token');
  }
}

// Register in app.ts
app.decorate('authenticate', authHook);
```

### 8. Prisma Plugin

```typescript
// src/plugins/prisma.ts
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export default async function prismaPlugin(app: FastifyInstance) {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
  });

  app.decorate('prisma', prisma);

  app.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
}
```

## Best Practices

### 1. Schema Validation
- Use TypeBox for type-safe schemas
- Define all request/response schemas
- Leverage auto-generated documentation

### 2. Error Handling
- Use `@fastify/sensible` for HTTP errors
- Create custom error classes
- Return consistent error format

### 3. Performance
- Use async/await consistently
- Implement connection pooling
- Enable compression

### 4. Security
- Always validate input
- Use rate limiting
- Implement CORS properly
- Sanitize error messages in production

### 5. Testing
- Write unit tests for services
- Write integration tests for routes
- Use test fixtures and factories

## Common Commands

```bash
# Development
pnpm dev                # Start dev server with hot reload
pnpm start              # Start production server
pnpm build              # Build for production

# Database
pnpm prisma generate    # Generate Prisma client
pnpm prisma migrate dev # Run migrations (dev)
pnpm prisma migrate deploy # Run migrations (prod)
pnpm prisma studio      # Open Prisma Studio

# Testing
pnpm test               # Run all tests
pnpm test:watch         # Watch mode
pnpm test:coverage      # With coverage

# Code Quality
pnpm lint               # Run ESLint
pnpm lint:fix           # Auto-fix issues
pnpm type-check         # TypeScript check
pnpm format             # Format with Prettier

# Production
pnpm build              # Build application
NODE_ENV=production pnpm start
```

## Configuration

```typescript
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
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

```json
// package.json scripts
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src tests",
    "lint:fix": "eslint src tests --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\"",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
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
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@postgres:5432/fastify_api
      - JWT_SECRET=your-secret-key
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: fastify_api
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

## Performance Tips

1. **Schema Compilation**: Fastify compiles schemas for maximum performance
2. **Connection Pooling**: Use Prisma connection pooling
3. **Caching**: Implement Redis for caching
4. **Compression**: Use `@fastify/compress`
5. **Logging**: Use Pino (built-in) for fast JSON logging
6. **Async Operations**: Never block the event loop

## Resources

- [Fastify Documentation](https://fastify.dev/)
- [TypeBox Documentation](https://github.com/sinclairzx81/typebox)
- [Prisma Documentation](https://prisma.io/docs)
- [Fastify Ecosystem](https://fastify.dev/ecosystem/)
- [Vitest Documentation](https://vitest.dev/)

---

**Last Updated**: 2026-03-17
