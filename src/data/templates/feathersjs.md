# FeathersJS - 实时 API 框架

## 技术栈

- **核心**: Feathers 5.x (Dove)
- **运行时**: Node.js 18+
- **传输层**: REST + WebSocket (Socket.io / Primus)
- **数据库**: 支持多种数据库 (PostgreSQL, MongoDB, MySQL等)
- **认证**: @feathersjs/authentication
- **类型支持**: TypeScript

## 项目结构

```
src/
├── services/
│   ├── users/
│   │   ├── users.service.ts      # 用户服务注册
│   │   ├── users.class.ts        # 用户服务类
│   │   ├── users.schema.ts       # 用户数据模式
│   │   └── users.hooks.ts        # 用户钩子
│   ├── messages/
│   │   ├── messages.service.ts
│   │   ├── messages.class.ts
│   │   ├── messages.schema.ts
│   │   └── messages.hooks.ts
│   └── index.ts                  # 服务注册入口
├── hooks/
│   ├── log.ts                    # 日志钩子
│   ├── validate.ts               # 验证钩子
│   └── index.ts                  # 钩子导出
├── middleware/
│   └── index.ts                  # Express中间件
├── models/
│   └── index.ts                  # 数据模型
├── authentication.ts             # 认证配置
├── app.ts                        # 应用配置
├── channels.ts                   # 实时通道
├── declarations.ts               # 类型声明
└── index.ts                      # 应用入口
```

## 代码模式

### 1. 应用配置

```typescript
// src/app.ts
import { feathers } from '@feathersjs/feathers'
import '@feathersjs/transport-commons'
import express from '@feathersjs/express'
import socketio from '@feathersjs/socketio'
import cors from 'cors'
import logger from './logger'
import middleware from './middleware'
import services from './services'
import appHooks from './app.hooks'
import channels from './channels'
import authentication from './authentication'
import mongoose from './mongoose'

const app = express(feathers())

// 启用CORS
app.configure(
  cors({
    origin: ['http://localhost:3000', 'https://myapp.com'],
    credentials: true
  })
)

// Express配置
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.errorHandler({ logger }))

// Socket.io配置
app.configure(
  socketio({
    cors: {
      origin: ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingInterval: 10000,
    pingTimeout: 5000
  })
)

// 配置服务
app.configure(mongoose)
app.configure(services)
app.configure(authentication)

// 实时通道
app.configure(channels)

// 全局钩子
app.hooks(appHooks)

// 中间件
app.configure(middleware)

export default app
```

```typescript
// src/index.ts
import logger from './logger'
import app from './app'

const port = app.get('port') || 3030

const server = app.listen(port)

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise ', p, reason)
})

server.on('listening', () => {
  logger.info('Feathers application started on http://%s:%d', app.get('host'), port)
})

export default server
```

### 2. 服务定义

```typescript
// src/services/users/users.service.ts
import { Application } from '../../declarations'
import { Users } from './users.class'
import hooks from './users.hooks'
import schema from './users.schema'

export default function (app: Application) {
  const options = {
    Model: app.get('mongooseClient').model('users', schema),
    paginate: app.get('paginate'),
    multi: ['remove']
  }

  // 初始化服务
  app.use('/users', new Users(options, app))

  // 获取服务以添加钩子
  const service = app.service('users')

  service.hooks(hooks)
}
```

```typescript
// src/services/users/users.class.ts
import { Service, MongooseServiceOptions } from 'feathers-mongoose'
import { Application } from '../../declarations'
import { Params, Id, NullableId } from '@feathersjs/feathers'

export class Users extends Service {
  constructor(options: Partial<MongooseServiceOptions>, app: Application) {
    super(options)
  }

  async create(data: any, params?: Params) {
    // 自定义创建逻辑
    const { email, password, name } = data

    // 检查用户是否已存在
    const existing = await this.Model.findOne({ email })
    if (existing) {
      throw new Error('User already exists')
    }

    // 创建用户
    const user = await super.create({
      email,
      password, // 密码会在钩子中加密
      name,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return user
  }

  async patch(id: Id, data: any, params?: Params) {
    // 更新时间戳
    data.updatedAt = new Date()
    return super.patch(id, data, params)
  }

  async remove(id: NullableId, params?: Params) {
    // 软删除逻辑
    if (params?.query?.hard) {
      return super.remove(id, params)
    }

    return this.patch(id as Id, { deleted: true, deletedAt: new Date() }, params)
  }
}
```

```typescript
// src/services/users/users.schema.ts
import { Schema } from 'mongoose'

export default new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.password
      delete ret.__v
      return ret
    }
  }
})
```

### 3. 钩子系统

```typescript
// src/services/users/users.hooks.ts
import { HooksObject } from '@feathersjs/feathers'
import { disallow, iff, isProvider, preventChanges } from 'feathers-hooks-common'
import { hashPassword, protect } from '@feathersjs/authentication-local'
import { validateSchema } from 'feathers-hooks-common'
import Ajv from 'ajv'

const ajv = new Ajv({ allErrors: true })

const userSchema = {
  type: 'object',
  required: ['email', 'password', 'name'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 },
    name: { type: 'string', minLength: 2 },
    role: { type: 'string', enum: ['user', 'admin', 'moderator'] }
  }
}

export default {
  before: {
    all: [],
    find: [
      // 过滤已删除的用户
      (context) => {
        context.params.query = context.params.query || {}
        if (!context.params.query.deleted) {
          context.params.query.deleted = { $ne: true }
        }
        return context
      }
    ],
    get: [],
    create: [
      // 验证数据
      validateSchema(userSchema, ajv),
      // 加密密码
      hashPassword('password'),
      // 设置默认角色
      (context) => {
        context.data.role = context.data.role || 'user'
        return context
      }
    ],
    update: [
      disallow('external'),
      hashPassword('password')
    ],
    patch: [
      // 禁止修改某些字段
      preventChanges(true, 'email', 'createdAt'),
      // 只允许修改自己的账户(非管理员)
      iff(
        isProvider('external'),
        (context) => {
          if (context.params.user?.role !== 'admin') {
            if (context.id.toString() !== context.params.user?._id.toString()) {
              throw new Error('You can only modify your own account')
            }
          }
        }
      ),
      // 如果修改密码，加密
      iff(
        (context) => context.data.password,
        hashPassword('password')
      )
    ],
    remove: [
      // 只有管理员可以硬删除
      iff(
        (context) => context.params.query?.hard,
        (context) => {
          if (context.params.user?.role !== 'admin') {
            throw new Error('Only admins can permanently delete users')
          }
        }
      )
    ]
  },

  after: {
    all: [
      // 隐藏密码字段
      protect('password')
    ],
    find: [],
    get: [],
    create: [
      // 发送欢迎邮件
      async (context) => {
        const { email, name } = context.result
        // await sendWelcomeEmail(email, name)
        return context
      }
    ],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [
      (context) => {
        console.error(`Error in ${context.path} service`, context.error)
        return context
      }
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
}
```

### 4. 认证配置

```typescript
// src/authentication.ts
import { AuthenticationService, JWTStrategy } from '@feathersjs/authentication'
import { LocalStrategy } from '@feathersjs/authentication-local'
import { OAuthStrategy, GitHubStrategy, GoogleStrategy } from '@feathersjs/authentication-oauth'
import { Application } from './declarations'

declare module './declarations' {
  interface ServiceTypes {
    authentication: AuthenticationService
  }
}

class MyJWTStrategy extends JWTStrategy {
  async authenticate(authentication: any, params: any) {
    const { accessToken } = authentication
    const { entity, service, entityId } = this.configuration
    const id = await this.verifyAccessToken(accessToken, params.jwt)

    const result = {
      accessToken: await this.createAccessToken({ sub: id }, params.jwt),
      [entity]: await service.get(id)
    }

    return result
  }
}

class MyLocalStrategy extends LocalStrategy {
  async getEntityQuery(query: any, params: any) {
    return {
      ...query,
      deleted: { $ne: true },
      isVerified: true
    }
  }
}

export default function (app: Application) {
  const authentication = new AuthenticationService(app)

  authentication.register('jwt', new MyJWTStrategy())
  authentication.register('local', new MyLocalStrategy())
  authentication.register('github', new GitHubStrategy())
  authentication.register('google', new GoogleStrategy())

  app.use('/authentication', authentication)

  app.service('authentication').hooks({
    before: {
      create: [
        (context: any) => {
          // 限制登录尝试
          const { email } = context.data
          // 可以添加速率限制逻辑
          return context
        }
      ],
      remove: [
        // 确保用户已认证
        (context: any) => {
          if (!context.params.user) {
            throw new Error('You must be authenticated')
          }
        }
      ]
    },
    after: {
      create: [
        // 添加用户角色到payload
        async (context: any) => {
          const { user } = context.result
          context.result.user = user
          return context
        }
      ]
    }
  })
}
```

### 5. 实时通道

```typescript
// src/channels.ts
import { Application, Params } from './declarations'

export default function (app: Application) {
  // 登录用户连接时
  app.on('connection', (connection: any) => {
    // 连接时触发
    app.channel('anonymous').join(connection)
  })

  app.on('login', (authResult: any, params: Params) => {
    const { connection } = params
    const { user } = authResult

    if (connection) {
      // 离开匿名通道
      app.channel('anonymous').leave(connection)
      // 加入认证用户通道
      app.channel('authenticated').join(connection)
      // 加入用户专属通道
      app.channel(`user/${user._id}`).join(connection)
      // 加入角色通道
      app.channel(`roles/${user.role}`).join(connection)
    }
  })

  app.on('logout', (authResult: any, params: Params) => {
    const { connection } = params
    if (connection) {
      app.channel('authenticated').leave(connection)
    }
  })

  // 发布事件
  app.publish((data: any, hook: any) => {
    // 发布到认证用户通道
    return app.channel('authenticated')
  })

  // 服务级发布
  app.service('messages').publish((data: any, hook: any) => {
    // 只发布给相关用户
    return [
      app.channel('authenticated'),
      app.channel(`user/${data.userId}`)
    ]
  })
}
```

### 6. 自定义钩子

```typescript
// src/hooks/log.ts
import { Hook, HookContext } from '@feathersjs/feathers'
import logger from '../logger'

export default function (options: {} = {}): Hook {
  return async (context: HookContext) => {
    const { method, path, type, data, params, result, error } = context
    const userId = params.user?._id || 'anonymous'

    if (type === 'after') {
      logger.info({
        timestamp: new Date().toISOString(),
        method,
        path,
        userId,
        success: !error,
        data: type === 'before' ? data : undefined,
        result: type === 'after' ? result : undefined
      })
    }

    return context
  }
}
```

```typescript
// src/hooks/validate.ts
import { Hook, HookContext } from '@feathersjs/feathers'

export function validateField(field: string, validator: (value: any) => boolean, message: string): Hook {
  return async (context: HookContext) => {
    const value = context.data[field]

    if (value !== undefined && !validator(value)) {
      throw new Error(`Validation failed: ${message}`)
    }

    return context
  }
}

export function sanitizeData(fields: string[]): Hook {
  return async (context: HookContext) => {
    if (context.data) {
      fields.forEach(field => {
        if (context.data[field] !== undefined) {
          delete context.data[field]
        }
      })
    }
    return context
  }
}
```

```typescript
// src/hooks/ownership.ts
import { Hook, HookContext } from '@feathersjs/feathers'
import { Forbidden } from '@feathersjs/errors'

export function restrictToOwner(options: { idField?: string; ownerField?: string } = {}): Hook {
  const { idField = '_id', ownerField = 'userId' } = options

  return async (context: HookContext) => {
    const { params, id, method } = context

    if (!params.user) {
      throw new Forbidden('You must be authenticated')
    }

    if (params.user.role === 'admin') {
      return context
    }

    if (method === 'create') {
      context.data[ownerField] = params.user[idField]
      return context
    }

    if (['get', 'update', 'patch', 'remove'].includes(method)) {
      const item = await context.service.get(id, { ...params, provider: undefined })

      if (item[ownerField].toString() !== params.user[idField].toString()) {
        throw new Forbidden('You do not have permission to access this resource')
      }
    }

    return context
  }
}
```

## 最佳实践

### 1. 服务设计

```typescript
// 推荐: 单一职责
export class Comments extends Service {
  // 只处理评论相关逻辑
}

// 避免: 臃肿的服务
export class Content extends Service {
  // 处理文章、评论、标签... (太复杂)
}
```

### 2. 错误处理

```typescript
// src/hooks/error-handler.ts
import { HookContext } from '@feathersjs/feathers'
import { BadRequest, NotAuthenticated, Forbidden, NotFound } from '@feathersjs/errors'

app.hooks({
  error: {
    all: [
      (context: HookContext) => {
        const { error } = context

        // 转换错误类型
        if (error.name === 'ValidationError') {
          context.error = new BadRequest(error.message)
        }

        if (error.name === 'MongoError' && error.code === 11000) {
          context.error = new BadRequest('Duplicate entry')
        }

        // 记录错误
        logger.error({
          service: context.path,
          method: context.method,
          error: context.error
        })

        return context
      }
    ]
  }
})
```

### 3. 数据库连接

```typescript
// src/mongoose.ts
import mongoose from 'mongoose'
import { Application } from './declarations'

export default function (app: Application) {
  mongoose.connect(app.get('mongodb'), {
    // 连接选项已弃用，保持简单
  })

  mongoose.Promise = global.Promise

  const db = mongoose.connection

  db.on('error', (err) => {
    console.error('MongoDB connection error:', err)
  })

  db.once('open', () => {
    console.log('MongoDB connected successfully')
  })

  app.set('mongooseClient', mongoose)
}
```

### 4. 测试策略

```typescript
// test/services/users.test.ts
import assert from 'assert'
import { app } from '../../src/app'

describe('Users service', () => {
  it('registers the service', () => {
    const service = app.service('users')
    assert.ok(service, 'Registered the service')
  })

  it('creates a user', async () => {
    const user = await app.service('users').create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    })

    assert.ok(user._id)
    assert.strictEqual(user.email, 'test@example.com')
    assert.strictEqual(user.password, undefined) // 密码被隐藏
  })

  it('prevents duplicate emails', async () => {
    const userData = {
      email: 'duplicate@example.com',
      password: 'password123',
      name: 'Test User'
    }

    await app.service('users').create(userData)

    try {
      await app.service('users').create(userData)
      assert.fail('Should have thrown error')
    } catch (error: any) {
      assert.ok(error)
    }
  })
})
```

### 5. 客户端使用

```typescript
// client.ts
import feathers from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import auth from '@feathersjs/authentication-client'
import io from 'socket.io-client'

const socket = io('http://localhost:3030', {
  transports: ['websocket'],
  forceNew: true
})

const client = feathers()

client.configure(socketio(socket))
client.configure(auth({ storage: window.localStorage }))

// 使用服务
async function main() {
  try {
    // 登录
    await client.authenticate({
      strategy: 'local',
      email: 'user@example.com',
      password: 'password'
    })

    // 获取用户
    const users = await client.service('users').find()
    console.log('Users:', users)

    // 监听实时事件
    client.service('messages').on('created', (message: any) => {
      console.log('New message:', message)
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
```

## 常用命令

```bash
# 创建项目
npm create feathers@latest my-app

# 安装依赖
npm install @feathersjs/feathers @feathersjs/express @feathersjs/socketio
npm install @feathersjs/authentication @feathersjs/authentication-local
npm install feathers-mongoose mongoose

# 开发
npm run dev

# 测试
npm test

# 生产
npm start
```

## 部署配置

### 1. Docker部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3030

CMD ["npm", "start"]
```

### 2. 环境配置

```typescript
// config/default.json
{
  "host": "localhost",
  "port": 3030,
  "mongodb": "mongodb://localhost:27017/myapp",
  "authentication": {
    "entity": "user",
    "service": "users",
    "secret": "your-secret-key",
    "authStrategies": ["jwt", "local"],
    "jwtOptions": {
      "header": { "typ": "access" },
      "audience": "https://myapp.com",
      "issuer": "feathers",
      "algorithm": "HS256",
      "expiresIn": "1d"
    }
  }
}
```

### 3. PM2部署

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'feathers-api',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3030
    }
  }]
}
```

## 关键特性

- 🔄 **实时通信**: WebSocket双向通信
- 🔌 **REST API**: 标准REST接口
- 🔐 **认证授权**: 多种认证策略
- 🎣 **钩子系统**: 灵活的中间件
- 📡 **通道系统**: 精确的实时推送
- 💾 **多数据库**: 支持多种ORM
- 📦 **TypeScript**: 完整类型支持
- 🧪 **可测试**: 易于单元测试
- 🔧 **模块化**: 服务架构设计
- 🚀 **高性能**: 轻量级框架
