# Pino Logging Template

## Project Overview

High-performance structured logging for Node.js with Pino - the fastest JSON logger available. Perfect for production applications requiring fast, structured, and search-friendly logs.

## Tech Stack

- **Logger**: Pino 8+
- **Language**: TypeScript / JavaScript
- **Runtime**: Node.js
- **Transports**: pino-pretty, pino-file, pino-socket
- **Integration**: Express, Fastify, NestJS, Next.js

## Project Structure

```
logging-project/
├── src/
│   ├── lib/
│   │   ├── logger.ts          # Logger instance
│   │   ├── logger-context.ts  # Request context
│   │   └── logger-transport.ts # Custom transports
│   ├── middleware/
│   │   └── request-logger.ts  # HTTP logging
│   ├── services/
│   │   └── user.service.ts    # Example usage
│   └── index.ts
├── logs/                       # Log files (gitignored)
├── pino.config.js             # Pino configuration
├── package.json
└── tsconfig.json
```

## Key Patterns

### 1. Basic Logger Setup

```typescript
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  
  // Base fields included in every log
  base: {
    env: process.env.NODE_ENV,
    service: 'my-app',
    version: process.env.npm_package_version,
  },
  
  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,
  
  // Custom log formatting
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      host: bindings.hostname,
    }),
  },
  
  // Redact sensitive fields
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
    censor: '[REDACTED]',
  },
  
  // Pretty printing (development only)
  transport: process.env.NODE_ENV === 'development' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

// Child logger for modules
export const createLogger = (module: string) => {
  return logger.child({ module });
};
```

### 2. Request Context Logger

```typescript
// src/lib/logger-context.ts
import { AsyncLocalStorage } from 'async_hooks';
import pino from 'pino';

interface RequestContext {
  requestId: string;
  userId?: string;
  [key: string]: any;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export function getContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

export function setContext(context: RequestContext): void {
  const store = asyncLocalStorage.getStore();
  if (store) {
    Object.assign(store, context);
  }
}

export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return asyncLocalStorage.run(context, fn);
}

// Custom logger with context
export const contextLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  mixin() {
    const context = getContext();
    return context || {};
  },
});
```

### 3. HTTP Request Logging Middleware

```typescript
// src/middleware/request-logger.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { runWithContext } from '../lib/logger-context';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
  
  // Set context for this request
  runWithContext({ requestId }, () => {
    // Log request
    logger.info({
      type: 'request',
      method: req.method,
      url: req.url,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }, `--> ${req.method} ${req.url}`);
    
    // Log response
    const originalSend = res.send;
    res.send = function (data: any): Response {
      const duration = Date.now() - startTime;
      
      logger.info({
        type: 'response',
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        contentLength: res.get('content-length'),
      }, `<-- ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
      
      return originalSend.call(this, data);
    };
    
    next();
  });
}
```

### 4. Multi-Transport Setup

```typescript
// src/lib/logger-transport.ts
import pino from 'pino';
import { multistream } from 'pino-multi-stream';

// File transport
const fileStream = pino.transport({
  target: 'pino/file',
  options: {
    destination: './logs/app.log',
    mkdir: true,
  },
});

// Pretty console (dev)
const prettyStream = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:standard',
  },
});

// Elasticsearch transport (prod)
const elasticStream = pino.transport({
  target: 'pino-elasticsearch',
  options: {
    node: process.env.ELASTICSEARCH_URL,
    index: 'app-logs',
    auth: {
      username: process.env.ELASTIC_USER!,
      password: process.env.ELASTIC_PASSWORD!,
    },
  },
});

// Sentry transport
const sentryStream = pino.transport({
  target: './sentry-transport.js',
  options: {
    dsn: process.env.SENTRY_DSN,
  },
});

// Combine streams based on environment
const streams: pino.StreamEntry[] = [
  { level: 'debug', stream: fileStream },
];

if (process.env.NODE_ENV === 'development') {
  streams.push({ level: 'debug', stream: prettyStream });
}

if (process.env.NODE_ENV === 'production') {
  streams.push({ level: 'warn', stream: elasticStream });
  streams.push({ level: 'error', stream: sentryStream });
}

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
}, multistream(streams));
```

### 5. Service Usage Examples

```typescript
// src/services/user.service.ts
import { createLogger } from '../lib/logger';

const logger = createLogger('UserService');

export class UserService {
  async createUser(data: { email: string; name: string }) {
    logger.info({ data: { email: data.email } }, 'Creating user');
    
    try {
      // Create user logic
      const user = await this.save(data);
      
      logger.info({ userId: user.id }, 'User created successfully');
      return user;
    } catch (error: any) {
      logger.error(
        { error: { message: error.message, stack: error.stack }, data },
        'Failed to create user'
      );
      throw error;
    }
  }

  async getUser(id: string) {
    logger.debug({ userId: id }, 'Fetching user');
    
    const user = await this.findById(id);
    
    if (!user) {
      logger.warn({ userId: id }, 'User not found');
      return null;
    }
    
    logger.debug({ userId: id }, 'User fetched');
    return user;
  }

  async deleteUser(id: string) {
    logger.info({ userId: id }, 'Deleting user');
    
    await this.remove(id);
    
    logger.info({ userId: id }, 'User deleted');
  }
}
```

### 6. Structured Error Logging

```typescript
// src/lib/error-logger.ts
import { logger } from './logger';
import { ErrorRequestHandler } from 'express';

export const errorLogger: ErrorRequestHandler = (err, req, res, next) => {
  const errorInfo = {
    type: err.constructor.name,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    userId: (req as any).user?.id,
  };

  // Operational errors (safe to expose)
  if (err.isOperational) {
    logger.warn(errorInfo, 'Operational error');
  } else {
    // Programming errors (critical)
    logger.error(errorInfo, 'Unhandled error');
  }

  res.status(err.status || 500).json({
    error: err.isOperational ? err.message : 'Internal server error',
    requestId: req.headers['x-request-id'],
  });
};

// Custom error class
export class AppError extends Error {
  public readonly status: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.status = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}
```

### 7. Performance Logging

```typescript
// src/lib/performance-logger.ts
import { logger } from './logger';

export function logPerformance(label: string) {
  const startTime = process.hrtime.bigint();

  return {
    end: (metadata?: Record<string, any>) => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds

      logger.info({
        performance: {
          label,
          duration,
          unit: 'ms',
        },
        ...metadata,
      }, `Performance: ${label}`);
    },
  };
}

// Usage
async function processData() {
  const timer = logPerformance('processData');
  
  await heavyOperation();
  
  timer.end({ recordsProcessed: 1000 });
}
```

### 8. Log Rotation

```typescript
// Using pino-rotating-file
import pino from 'pino';

const transport = pino.transport({
  target: 'pino-rotating-file',
  options: {
    path: './logs/app-%Y-%m-%d.log',
    frequency: 'daily',
    limit: {
      count: 30, // Keep 30 days
      size: '100M', // Max 100MB per file
    },
    mkdir: true,
    compress: 'gzip',
  },
});

export const logger = pino(transport);
```

## Configuration

### Environment Variables

```bash
# .env
LOG_LEVEL=info
NODE_ENV=development
ELASTICSEARCH_URL=http://localhost:9200
ELASTIC_USER=elastic
ELASTIC_PASSWORD=changeme
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### package.json

```json
{
  "dependencies": {
    "pino": "^8.19.0",
    "pino-pretty": "^10.3.1",
    "pino-multi-stream": "^6.0.0",
    "pino-elasticsearch": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0"
  }
}
```

## Integration Examples

### Express

```typescript
import express from 'express';
import { logger } from './lib/logger';
import { requestLogger } from './middleware/request-logger';
import { errorLogger } from './lib/error-logger';

const app = express();

app.use(requestLogger);

app.get('/', (req, res) => {
  logger.info('Home page accessed');
  res.json({ message: 'Hello World' });
});

app.use(errorLogger);

app.listen(3000, () => {
  logger.info('Server running on port 3000');
});
```

### Fastify

```typescript
import Fastify from 'fastify';
import { logger } from './lib/logger';

const fastify = Fastify({
  logger: {
    level: 'info',
    stream: logger,
  },
});

fastify.get('/', async (request, reply) => {
  request.log.info('Home page accessed');
  return { message: 'Hello World' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    logger.info('Server running on port 3000');
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();
```

### Next.js API Routes

```typescript
// pages/api/hello.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createLogger } from '../../src/lib/logger';

const logger = createLogger('API');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  logger.info({ method: req.method }, 'API endpoint called');
  
  res.status(200).json({ message: 'Hello' });
}
```

## Best Practices

### 1. Use Structured Data

```typescript
// ❌ Bad
logger.info('User ' + userId + ' logged in');

// ✅ Good
logger.info({ userId }, 'User logged in');
```

### 2. Log Levels

```typescript
logger.trace('Very detailed info'); // Rarely used
logger.debug('Debug info'); // Development only
logger.info('General info'); // Normal operations
logger.warn('Warning'); // Potential issues
logger.error('Error'); // Failures
logger.fatal('Fatal error'); // Critical failures
```

### 3. Child Loggers

```typescript
// Create child logger with persistent context
const userLogger = logger.child({ module: 'UserService' });
userLogger.info('User created'); // Automatically includes module
```

### 4. Conditional Logging

```typescript
// Check log level before expensive operations
if (logger.isLevelEnabled('debug')) {
  const expensiveData = computeExpensiveDebugInfo();
  logger.debug({ data: expensiveData }, 'Debug info');
}
```

### 5. Redact Sensitive Data

```typescript
const logger = pino({
  redact: {
    paths: [
      'password',
      'token',
      'apiKey',
      'req.headers.authorization',
      'req.body.password',
    ],
    censor: '[REDACTED]',
  },
});
```

## Querying Logs

### CLI

```bash
# Pretty print JSON logs
cat logs/app.log | pino-pretty

# Filter by level
cat logs/app.log | jq 'select(.level >= 40)'

# Search for specific field
cat logs/app.log | jq 'select(.userId == "123")'

# Time range
cat logs/app.log | jq 'select(.time >= "2024-01-01T00:00:00Z")'
```

### Elasticsearch

```bash
# Search errors
curl -X GET "localhost:9200/app-logs/_search" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {
      "level": "error"
    }
  }
}'

# Aggregate by service
curl -X GET "localhost:9200/app-logs/_search" -H 'Content-Type: application/json' -d'
{
  "aggs": {
    "services": {
      "terms": {
        "field": "service.keyword"
      }
    }
  }
}'
```

## Performance Tips

1. **Use child loggers**: Reduce object allocation
2. **Avoid synchronous operations**: Pino is async by design
3. **Redact wisely**: Only redact what's necessary
4. **Use streams**: Leverage pino-multi-stream
5. **Batch writes**: For high-volume logging

## Resources

- [Pino Documentation](https://getpino.io/)
- [Pino GitHub](https://github.com/pinojs/pino)
- [Pino Pretty](https://github.com/pinojs/pino-pretty)
- [Pino Ecosystem](https://getpino.io/#/docs/ecosystem)
