# ArkType 运行时类型验证模板

## 技术栈

- **核心**: ArkType (TypeScript-first runtime validation)
- **类型系统**: TypeScript 5.x
- **运行时**: Node.js / Bun / Browser
- **框架集成**: Express / Fastify / Next.js / tRPC
- **表单**: React Hook Form / Formik

## 项目结构

```
arktype-project/
├── src/
│   ├── schemas/
│   │   ├── user.ts
│   │   ├── product.ts
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   ├── middlewares/
│   │   └── validate.ts
│   ├── utils/
│   │   └── transforms.ts
│   └── index.ts
├── tests/
│   └── schemas.test.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础类型定义

```typescript
// src/schemas/user.ts
import { type } from 'arktype';

// 基础类型
export const UserSchema = type({
  id: 'string',
  email: 'email',
  name: 'string & 2 <= chars <= 100',
  age: 'number & 0 <= value <= 150',
  role: '"admin" | "user" | "guest"',
  'createdAt?': 'Date',
  'metadata?': {
    '[string]': 'unknown',
  },
});

// 推断类型
export type User = typeof UserSchema.infer;
export type UserInput = typeof UserSchema.inferIn;

// 可选字段
export const UserProfileSchema = type({
  'id?': 'string',
  name: 'string',
  'bio?': 'string',
  'avatar?': 'string.url',
});

// 联合类型
export const StatusSchema = type("'pending' | 'active' | 'inactive' | 'deleted'");

// 枚举
export const RoleSchema = type.enumerated('admin', 'user', 'guest');
```

### 复杂类型

```typescript
// src/schemas/product.ts
import { type } from 'arktype';

// 嵌套对象
export const AddressSchema = type({
  street: 'string',
  city: 'string',
  country: 'string',
  zipCode: '/^\\d{5}(-\\d{4})?$/',
});

// 数组
export const ProductSchema = type({
  id: 'string.uuid',
  name: 'string & 1 <= chars <= 200',
  description: 'string?',
  price: 'number & 0 < value',
  'discount?': 'number & 0 <= value <= 100',
  tags: 'string[]',
  variants: {
    'id': 'string',
    'name': 'string',
    'price': 'number',
    'stock': 'number.integer & 0 <= value',
  }[],
  category: '"electronics" | "clothing" | "books" | "other"',
  status: "'draft' | 'published' | 'archived'",
  metadata: {
    '[string]': 'unknown',
  },
  createdAt: 'Date',
  updatedAt: 'Date',
});

// Record 类型
export const TranslationsSchema = type({
  '[string]': {
    title: 'string',
    description: 'string?',
  },
});

// 元组
export const CoordinateSchema = type('[number, number]');

// 带长度约束的元组
export const RGBColorSchema = type('[number & 0 <= value <= 255, number & 0 <= value <= 255, number & 0 <= value <= 255]');
```

### 自定义验证

```typescript
// src/schemas/custom.ts
import { type, scope } from 'arktype';

// 自定义类型
const password = type('string & 8 <= chars')
  .atLeast('digit', 1)
  .atLeast('uppercase', 1)
  .atLeast('lowercase', 1)
  .atLeast('special', 1);

// 正则匹配
const phone = type('/^\\+?[1-9]\\d{1,14}$/');

// 自定义验证函数
const evenNumber = type('number').narrow((n, ctx) => {
  if (n % 2 !== 0) {
    ctx.error = 'Value must be even';
    return false;
  }
  return true;
});

// 组合验证
const PasswordSchema = type('string')
  .atLeast('digit', 1)
  .atLeast('uppercase', 1)
  .atLeast('lowercase', 1)
  .atLeast('special', 1)
  .and('8 <= chars <= 128');

// 使用 scope 组织类型
export const UserScope = scope({
  User: {
    id: 'string.uuid',
    email: 'email',
    password: PasswordSchema,
    role: '"admin" | "user"',
    'profile?': 'UserProfile',
  },
  UserProfile: {
    name: 'string & 2 <= chars <= 100',
    'bio?': 'string & chars <= 500',
    'avatar?': 'string.url',
  },
  CreateUser: 'Omit<User, "id">',
  UpdateUser: 'Partial<Omit<User, "id" | "email">>',
});

export const { User, UserProfile, CreateUser, UpdateUser } = UserScope.export();
```

### 数据转换

```typescript
// src/utils/transforms.ts
import { type } from 'arktype';

// 自动转换
export const NumberFromString = type('string.numeric').pipe(type('number'));

// 链式转换
export const TrimmedString = type('string').pipe(type('string.trim'));

// 复杂转换
export const EmailSchema = type('string')
  .pipe(type('string.trim'))
  .pipe(type('string.lower'))
  .pipe(type('email'));

// 日期转换
export const DateFromString = type('string.date').pipe(type('Date'));

// 自定义转换
export const JSONParse = type('string').pipe((s, ctx) => {
  try {
    return JSON.parse(s as string);
  } catch (e) {
    ctx.error = 'Invalid JSON';
    return false;
  }
});

// 带转换的完整示例
export const CreatePostSchema = type({
  title: type('string').pipe(type('string.trim')).and('1 <= chars <= 200'),
  content: 'string',
  tags: type('string')
    .pipe(type('string.trim'))
    .array()
    .pipe((arr) => [...new Set(arr)]), // 去重
  'publishAt?': DateFromString,
});
```

### Express 中间件

```typescript
// src/middlewares/validate.ts
import { Request, Response, NextFunction } from 'express';
import { type } from 'arktype';

export const validate =
  <T extends type<any>>(schema: T, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const data = req[source];
    const result = schema(data);

    if (result instanceof type.errors) {
      return res.status(400).json({
        status: 'error',
        errors: result.summary,
        details: result.map((e) => ({
          path: e.path?.join('.') || '',
          message: e.message,
        })),
      });
    }

    // 将验证后的数据附加到请求
    (req as any).validated = result;
    return next();
  };

// 使用示例
import { Router } from 'express';
import { CreateUserSchema } from '../schemas/user';

const router = Router();

router.post(
  '/users',
  validate(CreateUserSchema, 'body'),
  async (req, res) => {
    const userData = (req as any).validated;
    // userData 已验证且类型安全
    const user = await createUser(userData);
    res.status(201).json(user);
  }
);

router.get(
  '/users/:id',
  validate(type({ id: 'string.uuid' }), 'params'),
  async (req, res) => {
    const { id } = (req as any).validated;
    const user = await findUserById(id);
    res.json(user);
  }
);
```

### Next.js App Router 集成

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { type } from 'arktype';
import { CreateUserSchema } from '@/schemas/user';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证
    const result = CreateUserSchema(body);
    
    if (result instanceof type.errors) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.map((e) => ({
            path: e.path?.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // result 是验证后的数据
    const user = await createUser(result);
    
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 查询参数验证
const ListQuerySchema = type({
  'page?': 'string.numeric.integer & 1 <= value',
  'limit?': 'string.numeric.integer & 1 <= value <= 100',
  'search?': 'string',
  'role?': '"admin" | "user" | "guest"',
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams);
  
  const result = ListQuerySchema(query);
  
  if (result instanceof type.errors) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: result.summary },
      { status: 400 }
    );
  }

  const users = await listUsers({
    page: result.page ? Number(result.page) : 1,
    limit: result.limit ? Number(result.limit) : 10,
    search: result.search,
    role: result.role,
  });

  return NextResponse.json(users);
}
```

### React Hook Form 集成

```typescript
// src/hooks/useArkForm.ts
import { useForm, Resolver } from 'react-hook-form';
import { type } from 'arktype';

// 创建 resolver
export function arkResolver<T extends type<any>>(schema: T): Resolver<any> {
  return async (values) => {
    const result = schema(values);

    if (result instanceof type.errors) {
      return {
        values: {},
        errors: result.reduce((acc, error) => {
          const path = error.path?.join('.') || 'root';
          acc[path] = {
            type: 'validation',
            message: error.message,
          };
          return acc;
        }, {} as Record<string, any>),
      };
    }

    return {
      values: result,
      errors: {},
    };
  };
}

// 使用示例
import { useForm } from 'react-hook-form';
import { type } from 'arktype';
import { arkResolver } from './useArkForm';

const LoginFormSchema = type({
  email: 'email',
  password: 'string & 8 <= chars',
  'rememberMe?': 'boolean',
});

type LoginForm = typeof LoginFormSchema.infer;

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: arkResolver(LoginFormSchema),
    mode: 'onChange',
  });

  const onSubmit = handleSubmit((data) => {
    console.log(data); // data 已验证且类型安全
  });

  return (
    <form onSubmit={onSubmit}>
      <div>
        <input {...register('email')} placeholder="Email" />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      <div>
        <input type="password" {...register('password')} placeholder="Password" />
        {errors.password && <span>{errors.password.message}</span>}
      </div>

      <div>
        <label>
          <input type="checkbox" {...register('rememberMe')} />
          Remember me
        </label>
      </div>

      <button type="submit">Login</button>
    </form>
  );
}
```

### tRPC 集成

```typescript
// src/routers/user.ts
import { initTRPC } from '@trpc/server';
import { type } from 'arktype';

const t = initTRPC.create();

// 验证中间件
const validateProcedure = t.procedure.use(async ({ input, next }) => {
  return next({ input });
});

// 定义 schema
const UserByIdSchema = type({ id: 'string.uuid' });
const CreateUserSchema = type({
  email: 'email',
  name: 'string & 2 <= chars <= 100',
  role: '"admin" | "user" | "guest"',
});

export const userRouter = t.router({
  getById: t.procedure
    .input(UserByIdSchema.assert)
    .query(async ({ input }) => {
      return findUserById(input.id);
    }),

  create: t.procedure
    .input(CreateUserSchema.assert)
    .mutation(async ({ input }) => {
      return createUser(input);
    }),

  list: t.procedure
    .input(type({
      'page?': 'number.integer & 1 <= value',
      'limit?': 'number.integer & 1 <= value <= 100',
    }).assert)
    .query(async ({ input }) => {
      return listUsers({
        page: input.page ?? 1,
        limit: input.limit ?? 10,
      });
    }),
});
```

## 最佳实践

### 1. Schema 复用与组合

```typescript
// src/schemas/base.ts
import { type, scope } from 'arktype';

// 基础 schema
export const TimestampSchema = type({
  createdAt: 'Date',
  updatedAt: 'Date',
});

export const IdSchema = type({ id: 'string.uuid' });

// 使用 scope 组合
export const EntityScope = scope({
  Timestamp: TimestampSchema,
  WithId: IdSchema,
  User: {
    '...': 'WithId',
    '...': 'Timestamp',
    email: 'email',
    name: 'string',
  },
});
```

### 2. 错误消息定制

```typescript
// src/schemas/messages.ts
import { type } from 'arktype';

// 配置全局错误消息
type.configure({
  messages: {
    email: 'Please enter a valid email address',
    'string.min': 'Must be at least {min} characters',
    'string.max': 'Must be at most {max} characters',
    'number.min': 'Must be at least {min}',
    'number.max': 'Must be at most {max}',
  },
});

// 字段级错误消息
const CustomSchema = type({
  name: type('string & 2 <= chars').describe('Name must be at least 2 characters'),
  age: type('number & 0 <= value <= 150').describe('Age must be between 0 and 150'),
});
```

### 3. 环境变量验证

```typescript
// src/env.ts
import { type } from 'arktype';

const EnvSchema = type({
  NODE_ENV: '"development" | "production" | "test"',
  DATABASE_URL: 'string.url',
  JWT_SECRET: 'string & 32 <= chars',
  'PORT?': 'string.numeric.integer',
  'ALLOWED_ORIGINS?': 'string',
});

const result = EnvSchema(process.env);

if (result instanceof type.errors) {
  console.error('Invalid environment variables:');
  result.forEach((error) => {
    console.error(`  ${error.path?.join('.')}: ${error.message}`);
  });
  process.exit(1);
}

export const env = {
  ...result,
  PORT: result.PORT ? Number(result.PORT) : 3000,
  ALLOWED_ORIGINS: result.ALLOWED_ORIGINS?.split(',') ?? [],
};

export type Env = typeof env;
```

### 4. API 响应验证

```typescript
// src/schemas/api.ts
import { type } from 'arktype';

// 分页响应
export const PaginatedResponse = <T extends type<any>>(itemSchema: T) =>
  type({
    data: itemSchema.array(),
    total: 'number.integer & 0 <= value',
    page: 'number.integer & 1 <= value',
    limit: 'number.integer & 1 <= value',
    'hasMore': 'boolean',
  });

// API 响应
export const ApiResponse = <T extends type<any>>(dataSchema: T) =>
  type({
    success: 'boolean',
    'data?': dataSchema,
    'error?': {
      code: 'string',
      message: 'string',
    },
  });

// 使用
const UserListResponse = PaginatedResponse(UserSchema);
const UserResponse = ApiResponse(UserSchema);
```

## 常用命令

```bash
# 安装
npm install arktype

# 测试
npm test

# 类型检查
tsc --noEmit

# 构建
npm run build
```

## 部署配置

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 环境变量

```bash
# .env
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/mydb
JWT_SECRET=your-secret-key-at-least-32-characters-long
PORT=3000
```

## 扩展资源

- [ArkType 官方文档](https://arktype.io/)
- [ArkType GitHub](https://github.com/arktypeio/arktype)
- [类型系统文档](https://arktype.io/docs)
- [与 Zod 对比](https://arktype.io/docs/comparison)
- [性能基准](https://arktype.io/docs/performance)
