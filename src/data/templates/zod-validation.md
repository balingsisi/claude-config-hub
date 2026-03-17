# Zod Schema Validation Template

## 技术栈

- **核心**: Zod ^3.x (TypeScript-first schema validation)
- **运行时**: Node.js / Bun / Deno / Browser
- **类型系统**: TypeScript 5.x
- **表单集成**: React Hook Form / Formik
- **API 集成**: tRPC / Zodios

## 项目结构

```
zod-project/
├── src/
│   ├── schemas/
│   │   ├── user.schema.ts
│   │   ├── product.schema.ts
│   │   ├── auth.schema.ts
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts        # 从 schema 推断类型
│   ├── validators/
│   │   ├── custom.ts       # 自定义验证器
│   │   └── transformers.ts # 数据转换器
│   ├── middlewares/
│   │   └── validate.ts     # Express/Fastify 验证中间件
│   └── index.ts
├── tests/
│   └── schemas.test.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础 Schema 定义

```typescript
// schemas/user.schema.ts
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2).max(100),
  age: z.number().int().min(0).max(150).optional(),
  role: z.enum(['admin', 'user', 'guest']).default('user'),
  createdAt: z.date(),
  metadata: z.record(z.unknown()).optional(),
});

// 从 schema 推断 TypeScript 类型
export type User = z.infer<typeof UserSchema>;
export type UserInput = z.input<typeof UserSchema>;
export type UserOutput = z.output<typeof UserSchema>;
```

### 嵌套与组合

```typescript
// schemas/address.schema.ts
import { z } from 'zod';

const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  country: z.string(),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
});

// schemas/order.schema.ts
export const OrderSchema = z.object({
  id: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })).min(1),
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema.optional(),
  status: z.enum(['pending', 'paid', 'shipped', 'delivered']),
  createdAt: z.date().default(() => new Date()),
}).refine(
  (data) => data.items.length > 0,
  { message: 'Order must have at least one item' }
);
```

### 自定义验证与转换

```typescript
// validators/custom.ts
import { z } from 'zod';

// 自定义 refinement
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^A-Za-z0-9]/, 'Must contain special character');

// 自定义 transform
const trimmedString = z.string().trim();
const lowercaseEmail = z.string().email().toLowerCase();
const normalizedPhone = z.string()
  .transform((val) => val.replace(/\D/g, ''))
  .refine((val) => val.length >= 10, 'Invalid phone number');

// 异步验证
const uniqueEmailSchema = z.string().email().refine(
  async (email) => {
    const exists = await checkEmailInDatabase(email);
    return !exists;
  },
  { message: 'Email already registered' }
);
```

### Express 中间件

```typescript
// middlewares/validate.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: 'error',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return next(error);
    }
  };

// 使用示例
app.post(
  '/users',
  validate(z.object({
    body: UserSchema.omit({ id: true, createdAt: true }),
  })),
  createUserHandler
);
```

### React Hook Form 集成

```typescript
// hooks/useZodForm.ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export function useZodForm<T extends z.ZodTypeAny>(schema: T) {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });
}

// 组件使用
const LoginFormSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password too short'),
  rememberMe: z.boolean().optional(),
});

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useZodForm(LoginFormSchema);
  
  const onSubmit = handleSubmit((data) => {
    console.log(data);
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Login</button>
    </form>
  );
}
```

### tRPC 集成

```typescript
// routers/user.ts
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

const userRouter = router({
  create: publicProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(2),
    }))
    .output(z.object({
      id: z.string(),
      email: z.string(),
      name: z.string(),
    }))
    .mutation(async ({ input }) => {
      return createUser(input);
    }),

  getById: publicProcedure
    .input(z.string().uuid())
    .output(UserSchema.nullable())
    .query(async ({ input }) => {
      return findUserById(input);
    }),

  list: publicProcedure
    .input(z.object({
      page: z.number().int().positive().default(1),
      limit: z.number().int().min(1).max(100).default(10),
      role: z.enum(['admin', 'user', 'guest']).optional(),
    }))
    .query(async ({ input }) => {
      return listUsers(input);
    }),
});
```

## 最佳实践

### 1. Schema 复用与组合

```typescript
// schemas/base.schema.ts
import { z } from 'zod';

// 可复用的基础 schema
export const EntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 继承扩展
export const ProductSchema = EntitySchema.extend({
  name: z.string(),
  price: z.number().positive(),
  description: z.string().optional(),
});

// Pick/Omit
export const ProductUpdateSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
}).partial();

// Merge
export const FullProductSchema = ProductSchema.merge(
  z.object({
    category: CategorySchema,
    reviews: z.array(ReviewSchema),
  })
);
```

### 2. 错误消息国际化

```typescript
// locales/en.ts
import { z } from 'zod';
import { en } from './locales';

z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return { message: en.errors.invalid_type[issue.expected] };
    case z.ZodIssueCode.too_small:
      return { message: en.errors.too_small[issue.type] };
    default:
      return { message: ctx.defaultError };
  }
});

// 使用 i18n
import i18next from 'i18next';

const localizedSchema = z.object({
  name: z.string({
    required_error: i18next.t('validation.name.required'),
    invalid_type_error: i18next.t('validation.name.invalid'),
  }),
});
```

### 3. 渐进式验证

```typescript
// 分层验证策略
const SafeUserSchema = UserSchema.transform((data) => ({
  ...data,
  // 脱敏处理
  email: data.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
}));

// 安全解析
function parseUser(data: unknown) {
  const result = UserSchema.safeParse(data);
  
  if (!result.success) {
    logger.warn('User validation failed', {
      errors: result.error.flatten(),
      input: data,
    });
    return null;
  }
  
  return result.data;
}
```

### 4. 品牌类型（Branded Types）

```typescript
// 防止类型混淆
import { z } from 'zod';

const UserId = z.string().uuid().brand<'UserId'>();
const OrderId = z.string().uuid().brand<'OrderId'>();

type UserId = z.infer<typeof UserId>;
type OrderId = z.infer<typeof OrderId>;

// 编译时类型安全
function getUser(id: UserId) { /* ... */ }
function getOrder(id: OrderId) { /* ... */ }

const userId = UserId.parse('...');
const orderId = OrderId.parse('...');

getUser(userId); // ✅
getUser(orderId); // ❌ 类型错误
```

## 常用命令

```bash
# 安装
npm install zod
bun add zod

# React Hook Form 集成
npm install @hookform/resolvers

# 测试
bun test
vitest run

# 类型检查
tsc --noEmit

# 代码生成（从 OpenAPI/JSON Schema）
npx ts-to-zod generate types.ts schemas.ts
```

## 部署配置

### Next.js API Routes

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateUserSchema.parse(body);
    
    const user = await createUser(validated);
    
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

### Serverless 函数

```typescript
// netlify/functions/user.ts
import { Handler } from '@netlify/functions';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405 };
  }

  const result = schema.safeParse(JSON.parse(event.body || '{}'));
  
  if (!result.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ errors: result.error.errors }),
    };
  }

  // 处理业务逻辑
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};
```

### 环境变量验证

```typescript
// env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
  ALLOWED_ORIGINS: z.string().transform((s) => s.split(',')),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```
