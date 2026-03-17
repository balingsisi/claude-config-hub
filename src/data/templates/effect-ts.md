# Effect-TS 函数式编程模板

## 项目概述

Effect-TS 是一个强大的函数式编程库，提供类型安全的效果系统、错误处理、依赖注入和并发控制。它是 TypeScript 生态中最完整的函数式编程解决方案之一。

## 技术栈

- **核心**: effect 2.4+
- **平台**: @effect/platform, @effect/platform-node
- **Schema**: @effect/schema
- **测试**: @effect/vitest
- **构建**: Vite / tsc
- **运行时**: Node.js / Bun / Deno

## 项目结构

```
effect-ts-project/
├── src/
│   ├── domain/                 # 领域模型
│   │   ├── User.ts
│   │   ├── Order.ts
│   │   └── Product.ts
│   ├── services/               # 服务层
│   │   ├── UserService.ts
│   │   ├── OrderService.ts
│   │   ├── Database.ts
│   │   └── Logger.ts
│   ├── api/                    # API 层
│   │   ├── handlers/
│   │   │   ├── UserHandler.ts
│   │   │   └── OrderHandler.ts
│   │   ├── middleware/
│   │   │   ├── Auth.ts
│   │   │   └── Logging.ts
│   │   └── routes.ts
│   ├── infrastructure/         # 基础设施
│   │   ├── DatabaseLive.ts
│   │   └── Config.ts
│   ├── programs/               # 业务逻辑
│   │   ├── CreateUser.ts
│   │   └── ProcessOrder.ts
│   ├── App.ts                  # 应用入口
│   └── index.ts
├── test/
│   ├── UserService.test.ts
│   └── OrderService.test.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## 核心概念

### 1. Effect 类型

```typescript
// Effect<成功类型, 错误类型, 依赖类型>
import { Effect } from 'effect'

// 简单的 Effect
const program: Effect.Effect<string, never, never> = Effect.succeed('Hello')

// 带错误的 Effect
const fail: Effect.Effect<never, Error, never> = Effect.fail(new Error('失败'))

// 带依赖的 Effect
type Database = {
  query: (sql: string) => Effect.Effect<any[], DatabaseError>
}

const fetchUsers: Effect.Effect<User[], DatabaseError, Database> = 
  Effect.gen(function* (_) {
    const db = yield* _(Database)
    return yield* _(db.query('SELECT * FROM users'))
  })
```

### 2. 依赖注入（Context）

```typescript
// src/services/Logger.ts
import { Context, Effect } from 'effect'

// 定义服务接口
export class Logger extends Context.Tag('Logger')<
  Logger,
  {
    log: (message: string) => Effect.Effect<void>
    error: (message: string) => Effect.Effect<void>
  }
>() {}

// 实现服务
export const LoggerLive = Logger.of({
  log: (message) => Effect.sync(() => console.log(`[LOG] ${message}`)),
  error: (message) => Effect.sync(() => console.error(`[ERROR] ${message}`))
})

// 使用服务
const program = Effect.gen(function* (_) {
  const logger = yield* _(Logger)
  yield* _(logger.log('应用启动'))
})

// 提供实现
const runnable = program.pipe(
  Effect.provideService(Logger, LoggerLive)
)
```

```typescript
// src/services/Database.ts
import { Context, Effect } from 'effect'

export class DatabaseError {
  readonly _tag = 'DatabaseError'
  constructor(readonly message: string) {}
}

export interface Database {
  query: <T>(sql: string, params?: any[]) => Effect.Effect<T[], DatabaseError>
  execute: (sql: string, params?: any[]) => Effect.Effect<void, DatabaseError>
}

export class Database extends Context.Tag('Database')<Database, Database>() {}

// 实现
export const DatabaseLive = Database.of({
  query: (sql, params) => Effect.tryPromise({
    try: async () => {
      // 实际数据库查询
      const result = await db.query(sql, params)
      return result.rows
    },
    catch: (error) => new DatabaseError(String(error))
  }),
  
  execute: (sql, params) => Effect.tryPromise({
    try: async () => {
      await db.execute(sql, params)
    },
    catch: (error) => new DatabaseError(String(error))
  })
})
```

### 3. Schema 验证

```typescript
// src/domain/User.ts
import { Schema } from '@effect/schema'

// 定义领域模型
export const UserSchema = Schema.Struct({
  id: Schema.String,
  email: Schema.String.pipe(Schema.pattern(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)),
  name: Schema.String.pipe(Schema.minLength(2), Schema.maxLength(100)),
  age: Schema.Number.pipe(Schema.between(0, 120)),
  createdAt: Schema.Date,
  role: Schema.Literal('admin', 'user', 'guest')
})

export type User = Schema.Schema.Type<typeof UserSchema>

// API 输入验证
export const CreateUserInput = Schema.Struct({
  email: Schema.String,
  name: Schema.String,
  age: Schema.Number
})

export type CreateUserInput = Schema.Schema.Type<typeof CreateUserInput>

// 验证数据
import { ParseResult } from '@effect/schema'

const validateUser = (data: unknown): Effect.Effect<User, ParseResult.ParseError> => {
  return Schema.decode(UserSchema)(data)
}

// 使用
const program = Effect.gen(function* (_) {
  const input = { /* ... */ }
  
  // 验证会返回 Effect
  const user = yield* _(validateUser(input))
  
  console.log(user.email)  // TypeScript 知道类型
})
```

### 4. 错误处理

```typescript
import { Effect, Match } from 'effect'

// 定义错误类型
class UserNotFound {
  readonly _tag = 'UserNotFound'
  constructor(readonly userId: string) {}
}

class ValidationError {
  readonly _tag = 'ValidationError'
  constructor(readonly field: string, readonly message: string) {}
}

class DatabaseError {
  readonly _tag = 'DatabaseError'
  constructor(readonly cause: Error) {}
}

// 使用 tagged errors
const getUser = (id: string): Effect.Effect<User, UserNotFound | DatabaseError, Database> =>
  Effect.gen(function* (_) {
    const db = yield* _(Database)
    
    const users = yield* _(
      db.query<User>('SELECT * FROM users WHERE id = $1', [id]),
      Effect.mapError(error => new DatabaseError(error))
    )
    
    if (users.length === 0) {
      return yield* _(Effect.fail(new UserNotFound(id)))
    }
    
    return users[0]
  })

// 错误处理
const program = getUser('123').pipe(
  Effect.catchTag('UserNotFound', (error) => 
    Effect.succeed(null)
  ),
  Effect.catchTag('DatabaseError', (error) =>
    Effect.succeed(null)
  )
)

// 使用 Match 进行模式匹配
const handleError = (error: UserNotFound | ValidationError | DatabaseError) =>
  Match.type<UserNotFound | ValidationError | DatabaseError>().pipe(
    Match.tag('UserNotFound', (e) => `用户 ${e.userId} 不存在`),
    Match.tag('ValidationError', (e) => `验证失败: ${e.field} ${e.message}`),
    Match.tag('DatabaseError', (e) => `数据库错误: ${e.cause.message}`),
    Match.exhaustive
  )
```

### 5. 并发与 Fiber

```typescript
import { Effect, Fiber } from 'effect'

// 并行执行
const parallelProgram = Effect.gen(function* (_) {
  const [users, orders, products] = yield* _(
    Effect.all([
      fetchUsers(),
      fetchOrders(),
      fetchProducts()
    ], { concurrency: 'unbounded' })
  )
  
  return { users, orders, products }
})

// Fiber（轻量级线程）
const fiberProgram = Effect.gen(function* (_) {
  // 启动后台任务
  const fiber = yield* _(
    longRunningTask(),
    Effect.fork  // 创建 Fiber
  )
  
  // 做其他事情
  yield* _(doOtherWork())
  
  // 等待 Fiber 完成
  const result = yield* _(Fiber.join(fiber))
  
  return result
})

// 竞争
const raceProgram = Effect.gen(function* (_) {
  const result = yield* _(
    Effect.race(
      fetchFromCache(),
      fetchFromDatabase()
    )
  )
  
  return result
})

// 超时
const withTimeout = fetchUser().pipe(
  Effect.timeout('5 seconds')
)

// 重试
const withRetry = fetchUser().pipe(
  Effect.retry({
    schedule: Schedule.exponential('100 millis'),
    times: 3
  })
)
```

### 6. Layer（依赖层）

```typescript
// src/infrastructure/DatabaseLive.ts
import { Layer, Effect } from 'effect'
import { Database, DatabaseError } from '../services/Database'

// 创建 Layer
export const DatabaseLive = Layer.effect(
  Database,
  Effect.gen(function* (_) {
    const connection = yield* _(
      Effect.acquireRelease(
        Effect.tryPromise({
          try: () => createConnection(),
          catch: (error) => new DatabaseError(String(error))
        }),
        (conn) => Effect.promise(() => conn.close())
      )
    )
    
    return Database.of({
      query: (sql, params) => 
        Effect.tryPromise({
          try: () => connection.query(sql, params),
          catch: (error) => new DatabaseError(String(error))
        }),
      
      execute: (sql, params) =>
        Effect.tryPromise({
          try: () => connection.execute(sql, params),
          catch: (error) => new DatabaseError(String(error))
        })
    })
  })
)

// 组合 Layers
import { LoggerLive } from '../services/Logger'

export const AppLayer = Layer.mergeAll(
  DatabaseLive,
  LoggerLive,
  ConfigLive
)

// 使用
const program = Effect.gen(function* (_) {
  // ...
})

const runnable = program.pipe(
  Effect.provide(AppLayer)
)
```

### 7. 服务层示例

```typescript
// src/services/UserService.ts
import { Effect, Context } from 'effect'
import { Database } from './Database'
import { Logger } from './Logger'
import { User, UserSchema, CreateUserInput } from '../domain/User'

export interface UserService {
  getUser: (id: string) => Effect.Effect<User, UserNotFound | DatabaseError, Database>
  createUser: (input: CreateUserInput) => Effect.Effect<User, ValidationError | DatabaseError, Database>
  updateUser: (id: string, updates: Partial<User>) => Effect.Effect<User, UserNotFound | ValidationError | DatabaseError, Database>
  deleteUser: (id: string) => Effect.Effect<void, DatabaseError, Database>
}

export class UserService extends Context.Tag('UserService')<UserService, UserService>() {}

export const UserServiceLive = UserService.of({
  getUser: (id) =>
    Effect.gen(function* (_) {
      const db = yield* _(Database)
      const logger = yield* _(Logger)
      
      yield* _(logger.log(`获取用户: ${id}`))
      
      const users = yield* _(
        db.query<User>('SELECT * FROM users WHERE id = $1', [id])
      )
      
      if (users.length === 0) {
        return yield* _(Effect.fail(new UserNotFound(id)))
      }
      
      return users[0]
    }),
  
  createUser: (input) =>
    Effect.gen(function* (_) {
      const db = yield* _(Database)
      const logger = yield* _(Logger)
      
      // 验证输入
      const validatedInput = yield* _(
        Schema.decode(CreateUserInput)(input),
        Effect.mapError((e) => new ValidationError('input', String(e)))
      )
      
      yield* _(logger.log(`创建用户: ${validatedInput.email}`))
      
      const user: User = {
        id: generateId(),
        ...validatedInput,
        createdAt: new Date(),
        role: 'user'
      }
      
      yield* _(
        db.execute(
          'INSERT INTO users (id, email, name, age, created_at, role) VALUES ($1, $2, $3, $4, $5, $6)',
          [user.id, user.email, user.name, user.age, user.createdAt, user.role]
        )
      )
      
      return user
    }),
  
  // ... 其他方法
})
```

### 8. API Handler

```typescript
// src/api/handlers/UserHandler.ts
import { Effect } from 'effect'
import { UserService } from '../../services/UserService'
import { CreateUserInput } from '../../domain/User'

export const UserHandler = {
  getUser: (id: string) =>
    Effect.gen(function* (_) {
      const userService = yield* _(UserService)
      const user = yield* _(userService.getUser(id))
      return { success: true, data: user }
    }),
  
  createUser: (body: unknown) =>
    Effect.gen(function* (_) {
      const userService = yield* _(UserService)
      const input = body as CreateUserInput
      const user = yield* _(userService.createUser(input))
      return { success: true, data: user }
    }),
  
  updateUser: (id: string, body: unknown) =>
    Effect.gen(function* (_) {
      const userService = yield* _(UserService)
      const updates = body as Partial<User>
      const user = yield* _(userService.updateUser(id, updates))
      return { success: true, data: user }
    })
}
```

```typescript
// src/api/routes.ts
import { Effect, Layer } from 'effect'
import { NodeHttpServer, NodeContext } from '@effect/platform-node'
import { HttpApi, HttpApiBuilder, HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import { UserHandler } from './handlers/UserHandler'

// 定义 API
export class UserApi extends HttpApiGroup.Group('users') {
  getUser = HttpApiEndpoint.get('getUser', '/users/:id')
    .setPath(Schema.Struct({ id: Schema.String }))
    .addSuccess(Schema.Struct({ success: Schema.Boolean, data: UserSchema }))
  
  createUser = HttpApiEndpoint.post('createUser', '/users')
    .setBody(Schema.Struct({ body: CreateUserInput }))
    .addSuccess(Schema.Struct({ success: Schema.Boolean, data: UserSchema }))
  
  updateUser = HttpApiEndpoint.patch('updateUser', '/users/:id')
    .setPath(Schema.Struct({ id: Schema.String }))
    .setBody(Schema.Struct({ body: Schema.Any }))
    .addSuccess(Schema.Struct({ success: Schema.Boolean, data: UserSchema }))
}

export class Api extends HttpApi.make({
  groups: [UserApi]
}) {}

// 服务器
const ServerLive = NodeHttpServer.serverLayer({ port: 3000 })

const program = HttpApiBuilder.serve(Api).pipe(
  Layer.provide(AppLayer),
  Layer.provide(ServerLive),
  Layer.provide(NodeContext.layer)
)

// 运行
Effect.runFork(Layer.launch(program))
```

## 最佳实践

### 1. 组织代码

```typescript
// ✅ 好的做法 - 分离接口和实现
// services/Database.ts - 接口
export interface Database {
  query: <T>(sql: string) => Effect.Effect<T[], DatabaseError>
}

export class Database extends Context.Tag('Database')<Database, Database>() {}

// infrastructure/DatabaseLive.ts - 实现
export const DatabaseLive = Layer.effect(Database, /* ... */)

// ✅ 使用 domain 文件夹组织模型
// domain/User.ts
export const UserSchema = Schema.Struct({ /* ... */ })
export type User = Schema.Schema.Type<typeof UserSchema>

export class UserNotFound {
  readonly _tag = 'UserNotFound'
  constructor(readonly userId: string) {}
}
```

### 2. 错误处理

```typescript
// ✅ 使用 tagged errors
class UserNotFound {
  readonly _tag = 'UserNotFound'
  constructor(readonly userId: string) {}
}

// ✅ 在 Effect 类型中明确错误
const getUser: Effect.Effect<User, UserNotFound, Database> = /* ... */

// ✅ 使用 catchTag 处理特定错误
program.pipe(
  Effect.catchTag('UserNotFound', (e) => Effect.succeed(null))
)

// ✅ 使用 catchAll 处理所有错误
program.pipe(
  Effect.catchAll((error) => Effect.succeed(null))
)
```

### 3. 测试

```typescript
// test/UserService.test.ts
import { Effect, Layer } from 'effect'
import { describe, it, expect } from 'vitest'
import { UserService, UserServiceLive } from '../src/services/UserService'

describe('UserService', () => {
  it('should get user by id', async () => {
    const MockDatabase = Layer.succeed(Database, Database.of({
      query: () => Effect.succeed([{ id: '1', name: 'John' }]),
      execute: () => Effect.unit
    }))
    
    const TestLayer = Layer.provide(UserServiceLive, MockDatabase)
    
    const program = Effect.gen(function* (_) {
      const service = yield* _(UserService)
      return yield* _(service.getUser('1'))
    }).pipe(
      Effect.provide(TestLayer)
    )
    
    const result = await Effect.runPromise(program)
    
    expect(result.name).toBe('John')
  })
})
```

### 4. 性能优化

```typescript
// ✅ 使用并发
const results = yield* _(
  Effect.all([task1(), task2(), task3()], { concurrency: 'unbounded' })
)

// ✅ 使用缓存
const cachedQuery = Effect.cachedWithTTL('5 minutes')(db.query)

// ✅ 使用 Fiber 做后台任务
const fiber = yield* _(sendEmail(), Effect.fork)
// 继续执行，不等待邮件发送完成
```

## 常用命令

```bash
# 安装
npm install effect @effect/platform @effect/platform-node @effect/schema

# 开发
npm run dev

# 构建
npm run build

# 测试
npm test

# 类型检查
npx tsc --noEmit
```

## 部署配置

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## 资源

- [Effect 官方文档](https://effect.website/)
- [Effect API 文档](https://effect-ts.github.io/effect/)
- [Effect 示例](https://github.com/Effect-TS/examples)
- [Effect Discord](https://discord.gg/effect-ts)
