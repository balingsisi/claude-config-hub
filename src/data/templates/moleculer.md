# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Moleculer Microservices
**Type**: Microservices Framework
**Tech Stack**: Moleculer + Node.js + TypeScript + NATS/Redis
**Goal**: Build scalable, fault-tolerant microservices architecture with service discovery and load balancing

---

## Tech Stack

### Core
- **Framework**: Moleculer 0.14+
- **Language**: TypeScript 5.3+
- **Runtime**: Node.js 20+ LTS
- **Architecture**: Microservices, Event-driven

### Transport
- **Message Broker**: NATS, Redis, RabbitMQ, Kafka
- **Protocol**: TCP, HTTP, WebSocket
- **Serialization**: JSON, Avro, Protobuf

### Database & Storage
- **Databases**: MongoDB, PostgreSQL, Redis
- **Caching**: Redis, Memcached
- **ORM**: Moleculer DB mixin

### Development
- **Package Manager**: pnpm or npm
- **Testing**: Jest
- **Monitoring**: Moleculer Console, Prometheus
- **Linting**: ESLint + Prettier

---

## Code Standards

### TypeScript Rules
- Use strict mode
- Define service schemas with TypeScript interfaces
- Use async/await for service actions
- Enable strict null checks

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface CreateUserParams {
  name: string;
  email: string;
}

export default {
  name: 'users',
  actions: {
    async create(ctx: Context<CreateUserParams>): Promise<User> {
      const { name, email } = ctx.params;
      // Implementation
    }
  }
};

// ❌ Bad
export default {
  name: 'users',
  actions: {
    create(ctx: any) {
      // No type safety
    }
  }
};
```

### Naming Conventions
- **Services**: lowercase with dots (`user.service`, `order.service`)
- **Actions**: camelCase (`createUser`, `getUser`)
- **Events**: dot notation (`user.created`, `order.completed`)
- **Mixins**: PascalCase with Mixin suffix (`DbMixin`, `CacheMixin`)
- **Methods**: camelCase (`validateEmail`, `hashPassword`)

### File Organization
```
src/
├── services/              # Service modules
│   ├── users/
│   │   ├── users.service.ts
│   │   ├── users.actions.ts
│   │   ├── users.events.ts
│   │   └── users.methods.ts
│   ├── orders/
│   ├── products/
│   └── api/              # API Gateway
│       ├── api.service.ts
│       └── routes.ts
├── mixins/               # Reusable mixins
│   ├── db.mixin.ts
│   └── cache.mixin.ts
├── middlewares/          # Middlewares
│   ├── errorHandler.ts
│   └── requestLogger.ts
├── config/              # Configuration
│   ├── moleculer.config.ts
│   └── database.config.ts
├── types/               # TypeScript types
│   └── index.d.ts
└── index.ts            # Application entry point
```

---

## Architecture Patterns

### Service Structure
- Single responsibility per service
- Use mixins for shared functionality
- Implement proper error handling
- Document actions with metadata

```typescript
// services/users/users.service.ts
import { Service, ServiceSchema } from 'moleculer';
import DbMixin from '../../mixins/db.mixin';
import { User, CreateUserParams } from '../../types';

const UsersService: ServiceSchema = {
  name: 'users',

  mixins: [DbMixin('users')],

  settings: {
    fields: ['id', 'name', 'email', 'createdAt'],
    entityValidator: {
      name: 'string|min:2',
      email: 'email',
    },
  },

  actions: {
    create: {
      rest: 'POST /users',
      params: {
        name: 'string|min:2',
        email: 'email',
      },
      async handler(ctx: Context<CreateUserParams>): Promise<User> {
        const entity = await this.validateEntity(ctx.params);
        const hashedPassword = await this.hashPassword(entity.password);
        const user = await this.adapter.insert({
          ...entity,
          password: hashedPassword,
          createdAt: new Date(),
        });

        // Emit event
        ctx.emit('user.created', user);

        return user;
      },
    },

    get: {
      rest: 'GET /users/:id',
      params: {
        id: 'string',
      },
      async handler(ctx: Context<{ id: string }>): Promise<User> {
        const user = await this.getById(ctx.params.id);
        if (!user) {
          throw new MoleculerError('User not found', 404);
        }
        return user;
      },
    },
  },

  methods: {
    async hashPassword(password: string): Promise<string> {
      const bcrypt = require('bcrypt');
      return bcrypt.hash(password, 10);
    },
  },

  events: {
    'order.completed': {
      async handler(ctx: Context<OrderCompletedEvent>) {
        this.logger.info('Order completed for user:', ctx.params.userId);
      },
    },
  },
};

export default UsersService;
```

### API Gateway
- Centralized entry point for external clients
- Route requests to appropriate services
- Handle authentication and rate limiting
- Transform request/response formats

```typescript
// services/api/api.service.ts
import { Service, ServiceSchema } from 'moleculer-web';

const ApiService: ServiceSchema = {
  name: 'api',

  mixins: [ApiGateway],

  settings: {
    port: process.env.PORT || 3000,

    routes: [
      {
        path: '/api',
        whitelist: [
          'users.*',
          'products.*',
          'orders.*',
        ],
        aliases: {
          'POST /users': 'users.create',
          'GET /users/:id': 'users.get',
          'GET /products': 'products.list',
          'POST /orders': 'orders.create',
        },
        authentication: true,
        authorization: true,
      },
    ],

    onError(req, res, err) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(err.code || 500);
      res.end(JSON.stringify({
        error: err.message,
        code: err.code,
      }));
    },
  },

  methods: {
    async authenticate(ctx, route, req, res) {
      const token = req.headers['authorization'];
      if (!token) {
        throw new UnAuthorizedError('NO_TOKEN');
      }

      const user = await ctx.call('users.verifyToken', { token });
      ctx.meta.user = user;
      return user;
    },
  },
};

export default ApiService;
```

### Event-Driven Communication
- Use events for async communication
- Implement event handlers with proper error handling
- Ensure idempotency in event handlers

```typescript
// services/orders/orders.service.ts
export default {
  name: 'orders',

  actions: {
    async create(ctx: Context<CreateOrderParams>) {
      // Create order
      const order = await this.adapter.insert(ctx.params);

      // Emit event (async)
      ctx.emit('order.created', order);

      return order;
    },
  },

  events: {
    'user.created': {
      async handler(ctx: Context<UserCreatedEvent>) {
        // Handle user creation (e.g., send welcome email)
        await this.actions.sendWelcomeEmail({ userId: ctx.params.id });
      },
    },

    'payment.completed': {
      async handler(ctx: Context<PaymentCompletedEvent>) {
        const { orderId, transactionId } = ctx.params;

        // Update order status
        await this.adapter.updateById(orderId, {
          $set: {
            status: 'paid',
            transactionId,
            paidAt: new Date(),
          },
        });

        // Emit next event
        ctx.emit('order.paid', { orderId });
      },
    },
  },
};
```

### Circuit Breaker Pattern
- Use built-in circuit breaker
- Configure timeouts and retries
- Handle failures gracefully

```typescript
// moleculer.config.ts
import { ServiceBroker } from 'moleculer';

const config = {
  nodeID: 'node-' + process.pid,

  transporter: 'nats://localhost:4222',

  circuitBreaker: {
    enabled: true,
    threshold: 0.5,
    windowTime: 60,
    minRequestCount: 20,
    halfOpenTime: 10 * 1000,
  },

  retryPolicy: {
    enabled: true,
    retries: 3,
    delay: 100,
    maxDelay: 1000,
    factor: 2,
  },

  requestTimeout: 10 * 1000,

  logger: true,
};

export default config;
```

---

## Key Constraints

### Service Boundaries
- ✅ Keep services small and focused
- ✅ Use events for inter-service communication
- ✅ Implement proper error handling
- ✅ Document service actions
- ❌ No tight coupling between services
- ❌ No direct database sharing
- ❌ No synchronous calls for critical paths

### Performance
- ✅ Use caching for frequently accessed data
- ✅ Implement circuit breakers
- ✅ Use connection pooling
- ✅ Optimize database queries
- ❌ Don't block the event loop
- ❌ Don't use synchronous I/O

### Security
- ✅ Validate all inputs
- ✅ Use authentication/authorization
- ✅ Encrypt sensitive data
- ✅ Use environment variables for secrets
- ❌ No hardcoded secrets
- ❌ No unvalidated parameters

---

## Common Commands

### Development
```bash
npm run dev              # Start development mode
npm run start            # Start production mode
npm run cli              # Start REPL console
```

### Testing
```bash
npm test                 # Run unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:e2e         # Run E2E tests
```

### Building
```bash
npm run build            # Build TypeScript
npm run lint             # Run ESLint
npm run format           # Format with Prettier
```

### Operations
```bash
moleculer connect        # Connect to running broker
moleculer call users.list  # Call service action
moleculer emit user.created  # Emit event
```

---

## Important Prohibitions

### ❌ Never Do
- Don't use synchronous I/O operations
- Don't share databases between services
- Don't skip input validation
- Don't hardcode configuration
- Don't commit `.env` files
- Don't ignore TypeScript errors
- Don't disable circuit breakers in production
- Don't use untyped service actions

### ⚠️ Use with Caution
- Global middlewares - ensure they don't impact performance
- Hot reload - test thoroughly in production-like environment
- Bulk operations - ensure proper batching and rate limiting
- Event handlers - ensure idempotency

---

## Best Practices

### Service Discovery
- Use built-in service registry
- Implement health checks
- Use multiple transporters for redundancy

```typescript
// health check action
actions: {
  health: {
    rest: 'GET /health',
    async handler(ctx) {
      return {
        status: 'ok',
        timestamp: new Date(),
        uptime: process.uptime(),
      };
    },
  },
}
```

### Configuration Management
- Use environment variables
- Validate configuration on startup
- Use namespaced configuration

```typescript
// config/app.config.ts
export default {
  nodeID: process.env.NODE_ID || `node-${process.pid}`,
  transporter: process.env.TRANSPORTER || 'nats://localhost:4222',
  logger: {
    type: 'Console',
    options: {
      level: process.env.LOG_LEVEL || 'info',
    },
  },
};
```

### Error Handling
- Use MoleculerError for custom errors
- Implement global error handler
- Log errors with context

```typescript
import { MoleculerError, ValidationError } from 'moleculer';

// ✅ Good
async handler(ctx: Context<{ id: string }>) {
  if (!ctx.params.id) {
    throw new ValidationError('ID is required');
  }

  const user = await this.getById(ctx.params.id);
  if (!user) {
    throw new MoleculerError('User not found', 404, 'USER_NOT_FOUND');
  }

  return user;
}
```

---

## Compact Instructions

When using `/compact`, preserve:
- Service schema changes
- API route modifications
- Event definitions and handlers
- Configuration changes
- Test commands and results

Discard:
- Verbose log output
- Exploratory search dead ends
- Redundant confirmation messages

---

## Quick Reference

### File Locations
- Services: `src/services/**/*.service.ts`
- Mixins: `src/mixins/*.mixin.ts`
- Middlewares: `src/middlewares/*.ts`
- Config: `src/config/*.config.ts`
- Types: `src/types/*.d.ts`

### Environment Variables
```env
NODE_ENV=development
NODE_ID=node-1
TRANSPORTER=nats://localhost:4222
PORT=3000
DATABASE_URL=mongodb://localhost:27017/app
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

### Decorators Reference
```typescript
// Action decorators
rest: 'GET /users'
rest: ['GET /users', 'POST /users']
params: { id: 'string' }
visibility: 'public' | 'protected' | 'private'

// Service settings
settings: {
  fields: ['id', 'name'],
  entityValidator: { name: 'string' }
}
```

---

**Last Updated**: 2026-03-17
