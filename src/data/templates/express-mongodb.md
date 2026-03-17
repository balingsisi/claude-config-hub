# Express + MongoDB API 开发模板

## 技术栈

- **Express**: Node.js Web 框架
- **MongoDB**: NoSQL 数据库
- **Mongoose**: ODM 库
- **TypeScript**: 类型支持
- **JWT**: 身份认证
- **Zod**: 数据验证

## 项目结构

```
express-mongodb-api/
├── src/
│   ├── config/
│   │   ├── database.ts       # 数据库连接
│   │   ├── index.ts          # 配置聚合
│   │   └── env.ts            # 环境变量
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   └── post.controller.ts
│   ├── middleware/
│   │   ├── auth.ts           # JWT 验证
│   │   ├── validate.ts       # 请求验证
│   │   ├── error.ts          # 错误处理
│   │   └── rateLimiter.ts    # 限流
│   ├── models/
│   │   ├── User.ts
│   │   ├── Post.ts
│   │   └── index.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   └── post.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── user.service.ts
│   ├── utils/
│   │   ├── apiError.ts
│   │   ├── logger.ts
│   │   └── response.ts
│   ├── validations/
│   │   ├── auth.validation.ts
│   │   └── user.validation.ts
│   ├── types/
│   │   └── index.d.ts
│   └── app.ts
├── tests/
│   ├── auth.test.ts
│   └── setup.ts
├── .env.example
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## 代码模式

### 应用入口

```ts
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFound } from './middleware/error';
import routes from './routes';
import { connectDB } from './config/database';
import logger from './utils/logger';

const app = express();

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每个 IP 最多 100 请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api', limiter);

// 路由
app.use('/api/v1', routes);

// 错误处理
app.use(notFound);
app.use(errorHandler);

// 启动服务器
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`🚀 服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();

export default app;
```

### 数据库配置

```ts
// src/config/database.ts
import mongoose from 'mongoose';
import logger from '../utils/logger';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI!);
    logger.info(`MongoDB 已连接: ${conn.connection.host}`);
  } catch (error) {
    logger.error('MongoDB 连接失败:', error);
    process.exit(1);
  }
};

// 连接事件
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB 断开连接');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB 错误:', err);
});
```

### Mongoose 模型

```ts
// src/models/User.ts
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  avatar?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, '邮箱必填'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, '密码必填'],
      minlength: 6,
      select: false
    },
    name: {
      type: String,
      required: [true, '姓名必填'],
      trim: true
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    avatar: String,
    isEmailVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// 密码加密
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 密码比对
userSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

// 索引
userSchema.index({ email: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
```

```ts
// src/models/Post.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  tags: string[];
  likes: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, '标题必填'],
      trim: true,
      maxlength: 200
    },
    content: {
      type: String,
      required: [true, '内容必填']
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tags: [String],
    likes: {
      type: Number,
      default: 0
    },
    isPublished: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// 索引
postSchema.index({ title: 'text', content: 'text' });
postSchema.index({ author: 1, createdAt: -1 });

export const Post = mongoose.model<IPost>('Post', postSchema);
```

### 控制器

```ts
// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/response';
import { ApiError } from '../utils/apiError';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body;
      
      // 检查邮箱是否已存在
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApiError(400, '邮箱已被注册');
      }

      // 创建用户
      const user = await User.create({ email, password, name });
      
      // 生成 token
      const token = this.authService.generateToken(user.id);

      res.status(201).json(
        ApiResponse.success({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          token
        }, '注册成功')
      );
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // 查找用户
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        throw new ApiError(401, '邮箱或密码错误');
      }

      // 生成 token
      const token = this.authService.generateToken(user.id);

      res.json(
        ApiResponse.success({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          token
        }, '登录成功')
      );
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.user!.id);
      res.json(ApiResponse.success(user));
    } catch (error) {
      next(error);
    }
  };
}
```

### 路由

```ts
// src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authValidation } from '../validations/auth.validation';
import { auth } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

router.post(
  '/register',
  validate(authValidation.register),
  authController.register
);

router.post(
  '/login',
  validate(authValidation.login),
  authController.login
);

router.get('/me', auth, authController.getMe);

export default router;
```

```ts
// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import postRoutes from './post.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);

export default router;
```

### 认证中间件

```ts
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 获取 token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new ApiError(401, '请先登录');
    }

    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    
    // 查找用户
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, '用户不存在');
    }

    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(401, '认证失败'));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, '没有权限执行此操作'));
    }
    next();
  };
};
```

### 验证中间件

```ts
// src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { ApiError } from '../utils/apiError';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error: any) {
      const messages = error.errors.map((e: any) => e.message);
      next(new ApiError(400, messages.join(', ')));
    }
  };
};
```

### Zod 验证

```ts
// src/validations/auth.validation.ts
import { z } from 'zod';

export const authValidation = {
  register: z.object({
    body: z.object({
      email: z.string().email('邮箱格式不正确'),
      password: z.string().min(6, '密码至少6位'),
      name: z.string().min(2, '姓名至少2个字符')
    })
  }),

  login: z.object({
    body: z.object({
      email: z.string().email('邮箱格式不正确'),
      password: z.string().min(1, '密码必填')
    })
  })
};
```

### 错误处理

```ts
// src/utils/apiError.ts
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// src/middleware/error.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || '服务器错误';

  // Mongoose 错误
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e: any) => e.message).join(', ');
  }

  if (err.code === 11000) {
    statusCode = 400;
    message = '数据已存在';
  }

  // 记录错误
  logger.error(`${statusCode} - ${message} - ${req.originalUrl}`);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, `路由 ${req.originalUrl} 不存在`));
};
```

## 最佳实践

### 1. 分页查询

```ts
// src/utils/pagination.ts
export const paginate = async (model: any, query: any, options: any) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 10;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.find(query).skip(skip).limit(limit),
    model.countDocuments(query)
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
```

### 2. 事务处理

```ts
// 使用事务
const session = await mongoose.startSession();
session.startTransaction();

try {
  const user = await User.create([{ ...userData }], { session });
  await Post.create([{ ...postData, author: user[0]._id }], { session });
  
  await session.commitTransaction();
  return user[0];
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 3. 软删除

```ts
// 添加软删除
schema.plugin(mongooseDelete, { 
  deletedAt: true,
  overrideMethods: true 
});

// 使用
await User.softDelete({ _id: id });
await User.findDeleted(); // 查询已删除
```

## 常用命令

### 开发

```bash
# 安装依赖
npm install express mongoose typescript
npm install -D @types/express @types/mongoose ts-node nodemon

# 开发模式
npm run dev

# 构建
npm run build

# 生产运行
npm start
```

### Docker

```bash
# 构建镜像
docker build -t express-mongo-api .

# 运行容器
docker run -p 3000:3000 express-mongo-api

# 使用 docker-compose
docker-compose up -d
```

## 部署配置

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/app.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/mydb
      - JWT_SECRET=your-secret-key
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

### 环境变量

```env
# .env.example
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/mydb
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```
