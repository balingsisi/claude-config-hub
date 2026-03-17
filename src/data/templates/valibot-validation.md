# Valibot 轻量级数据验证

## 技术栈

- **Valibot** - TypeScript 优先的模式验证库
- **TypeScript 5+** - 类型系统
- **Zod 兼容 API** - 熟悉的 API 设计
- **零依赖** - 轻量级，体积小

## 项目结构

```
src/
├── schemas/                  # 验证模式
│   ├── user.ts              # 用户相关模式
│   ├── auth.ts              # 认证相关模式
│   ├── api.ts               # API 请求/响应模式
│   ├── form.ts              # 表单验证模式
│   └── index.ts             # 导出所有模式
├── utils/
│   ├── validation.ts        # 验证工具函数
│   └── transforms.ts        # 数据转换函数
├── hooks/
│   └── useForm.ts           # 表单验证 Hook
├── middleware/
│   └── validate.ts          # API 验证中间件
└── types/
    └── index.ts             # 类型导出
```

## 核心概念

### 基础类型

```typescript
// schemas/primitives.ts
import * as v from 'valibot';

// 基础类型
const stringSchema = v.string();
const numberSchema = v.number();
const booleanSchema = v.boolean();
const dateSchema = v.date();
const nullSchema = v.null_();
const undefinedSchema = v.undefined();

// 可选和可空
const optionalString = v.optional(v.string()); // string | undefined
const nullableString = v.nullable(v.string()); // string | null
const nullishString = v.nullish(v.string()); // string | null | undefined

// 字面量
const roleSchema = v.literal('admin');
const statusSchema = v.picklist(['active', 'inactive', 'pending']);

// 枚举
enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}
const roleEnumSchema = v.enum_(UserRole);
```

### 对象模式

```typescript
// schemas/user.ts
import * as v from 'valibot';

// 基础对象
const AddressSchema = v.object({
  street: v.string(),
  city: v.string(),
  zipCode: v.pipe(v.string(), v.regex(/^\d{5}(-\d{4})?$/)),
  country: v.string(),
});

// 用户模式
export const UserSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  email: v.pipe(v.string(), v.email()),
  name: v.pipe(v.string(), v.minLength(2), v.maxLength(100)),
  age: v.pipe(v.number(), v.minValue(0), v.maxValue(150)),
  role: v.picklist(['admin', 'user', 'guest']),
  address: v.optional(AddressSchema),
  createdAt: v.date(),
  updatedAt: v.optional(v.date()),
});

// 推断类型
export type User = v.InferOutput<typeof UserSchema>;
// 或
export type UserInput = v.InferInput<typeof UserSchema>;
```

### 管道和转换

```typescript
// schemas/transforms.ts
import * as v from 'valibot';

// 管道：验证 + 转换
const trimmedString = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1)
);

const lowercaseEmail = v.pipe(
  v.string(),
  v.trim(),
  v.toLowerCase(),
  v.email()
);

const positiveInt = v.pipe(
  v.number(),
  v.integer(),
  v.minValue(1)
);

// 自定义转换
const dateFromString = v.pipe(
  v.string(),
  v.transform((input) => new Date(input)),
  v.date()
);

const numberFromString = v.pipe(
  v.string(),
  v.transform((input) => parseFloat(input)),
  v.number()
);

// 条件转换
const flexibleBoolean = v.pipe(
  v.union([v.boolean(), v.string()]),
  v.transform((input) => {
    if (typeof input === 'string') {
      return input.toLowerCase() === 'true';
    }
    return input;
  })
);
```

### 嵌套对象

```typescript
// schemas/complex.ts
import * as v from 'valibot';

const ProfileSchema = v.object({
  avatar: v.optional(v.pipe(v.string(), v.url())),
  bio: v.optional(v.pipe(v.string(), v.maxLength(500))),
  website: v.optional(v.pipe(v.string(), v.url())),
  social: v.optional(
    v.object({
      twitter: v.optional(v.string()),
      github: v.optional(v.string()),
      linkedin: v.optional(v.string()),
    })
  ),
});

const PreferencesSchema = v.object({
  theme: v.picklist(['light', 'dark', 'system']),
  language: v.pipe(v.string(), v.length(2)),
  notifications: v.object({
    email: v.boolean(),
    push: v.boolean(),
    sms: v.optional(v.boolean()),
  }),
});

export const FullUserSchema = v.object({
  id: v.string(),
  email: v.pipe(v.string(), v.email()),
  name: v.string(),
  profile: v.optional(ProfileSchema),
  preferences: v.optional(PreferencesSchema),
  metadata: v.optional(v.record(v.string(), v.unknown())),
});
```

### 数组和集合

```typescript
// schemas/collections.ts
import * as v from 'valibot';

// 数组
const StringArraySchema = v.array(v.string());
const NumberArraySchema = v.array(v.pipe(v.number(), v.minValue(0)));

// 数组约束
const TagsSchema = v.pipe(
  v.array(v.string()),
  v.minLength(1),
  v.maxLength(10),
  v.unique()
);

// 对象数组
const TodoSchema = v.object({
  id: v.string(),
  title: v.string(),
  completed: v.boolean(),
});

const TodoListSchema = v.array(TodoSchema);

// 元组
const CoordinateSchema = v.tuple([
  v.pipe(v.number(), v.minValue(-180), v.maxValue(180)), // longitude
  v.pipe(v.number(), v.minValue(-90), v.maxValue(90)), // latitude
]);

// Record
const MetadataSchema = v.record(
  v.string(),
  v.union([v.string(), v.number(), v.boolean()])
);
```

### 联合类型

```typescript
// schemas/unions.ts
import * as v from 'valibot';

// 简单联合
const StatusSchema = v.union([
  v.literal('pending'),
  v.literal('active'),
  v.literal('inactive'),
]);

// 可辨识联合
const SuccessResponseSchema = v.object({
  success: v.literal(true),
  data: v.unknown(),
});

const ErrorResponseSchema = v.object({
  success: v.literal(false),
  error: v.object({
    code: v.string(),
    message: v.string(),
  }),
});

const ApiResponseSchema = v.union([
  SuccessResponseSchema,
  ErrorResponseSchema,
]);

// 互斥字段
const PaymentMethodSchema = v.union([
  v.object({
    type: v.literal('credit_card'),
    cardNumber: v.string(),
    expiryDate: v.string(),
    cvv: v.string(),
  }),
  v.object({
    type: v.literal('paypal'),
    email: v.pipe(v.string(), v.email()),
  }),
  v.object({
    type: v.literal('bank_transfer'),
    accountNumber: v.string(),
    routingNumber: v.string(),
  }),
]);
```

## 代码模式

### 表单验证

```typescript
// schemas/form.ts
import * as v from 'valibot';

// 注册表单
export const RegisterFormSchema = v.object({
  email: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'Email is required'),
    v.email('Invalid email format')
  ),
  password: v.pipe(
    v.string(),
    v.minLength(8, 'Password must be at least 8 characters'),
    v.maxLength(100),
    v.regex(/[A-Z]/, 'Must contain uppercase letter'),
    v.regex(/[a-z]/, 'Must contain lowercase letter'),
    v.regex(/[0-9]/, 'Must contain number'),
    v.regex(/[^A-Za-z0-9]/, 'Must contain special character')
  ),
  confirmPassword: v.string(),
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(2, 'Name must be at least 2 characters'),
    v.maxLength(100)
  ),
  acceptTerms: v.pipe(
    v.boolean(),
    v.value(true, 'You must accept the terms')
  ),
}, [
  // 对象级别验证
  v.forward(
    v.custom(
      (input) => input.password === input.confirmPassword,
      'Passwords do not match'
    ),
    ['confirmPassword']
  ),
]);

export type RegisterForm = v.InferOutput<typeof RegisterFormSchema>;

// 登录表单
export const LoginFormSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.email()),
  password: v.string(),
  rememberMe: v.optional(v.boolean()),
});

// 使用示例
function validateRegisterForm(data: unknown) {
  const result = v.safeParse(RegisterFormSchema, data);
  
  if (result.success) {
    return { success: true, data: result.output };
  }
  
  return { 
    success: false, 
    errors: result.issues.map((issue) => ({
      path: issue.path?.map(p => p.key).join('.'),
      message: issue.message,
    })),
  };
}
```

### React Hook 集成

```typescript
// hooks/useForm.ts
import { useState, useCallback } from 'react';
import * as v from 'valibot';

interface UseFormOptions<T> {
  schema: v.GenericSchema<T>;
  initialValues?: Partial<T>;
  onSubmit: (values: T) => void | Promise<void>;
}

interface FieldError {
  message: string;
}

export function useForm<T extends Record<string, any>>({
  schema,
  initialValues = {},
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<Partial<T>>(initialValues);
  const [errors, setErrors] = useState<Record<string, FieldError>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    
    // 实时验证单个字段
    const fieldSchema = v.object({ [name]: schema });
    const result = v.safeParse(fieldSchema, { [name]: value });
    
    if (!result.success) {
      const error = result.issues.find(
        (issue) => issue.path?.[0]?.key === name
      );
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: { message: error.message } }));
      }
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as string];
        return next;
      });
    }
  }, [schema]);

  const handleBlur = useCallback((name: keyof T) => {
    setTouched((prev) => new Set(prev).add(name as string));
  }, []);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSubmitting(true);

    const result = v.safeParse(schema, values);

    if (!result.success) {
      const newErrors: Record<string, FieldError> = {};
      result.issues.forEach((issue) => {
        const path = issue.path?.map((p) => p.key).join('.');
        if (path) {
          newErrors[path] = { message: issue.message };
        }
      });
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(result.output);
    } finally {
      setIsSubmitting(false);
    }
  }, [schema, values, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched(new Set());
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue: (name: keyof T, value: any) => handleChange(name, value),
    setFieldError: (name: keyof T, message: string) => {
      setErrors((prev) => ({ ...prev, [name]: { message } }));
    },
  };
}

// 使用示例
function RegisterForm() {
  const { values, errors, handleChange, handleBlur, handleSubmit, isSubmitting } = useForm({
    schema: RegisterFormSchema,
    onSubmit: async (data) => {
      await fetch('/api/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          name="email"
          value={values.email ?? ''}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
        />
        {errors.email && <span className="error">{errors.email.message}</span>}
      </div>
      {/* ... */}
      <button type="submit" disabled={isSubmitting}>
        Register
      </button>
    </form>
  );
}
```

### API 验证中间件

```typescript
// middleware/validate.ts
import * as v from 'valibot';
import { NextFunction, Request, Response } from 'express';

export function validateBody<T>(schema: v.GenericSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = v.safeParse(schema, req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.issues.map((issue) => ({
          path: issue.path?.map((p) => p.key).join('.'),
          message: issue.message,
        })),
      });
    }

    req.body = result.output;
    next();
  };
}

export function validateQuery<T>(schema: v.GenericSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = v.safeParse(schema, req.query);

    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: result.issues.map((issue) => ({
          path: issue.path?.map((p) => p.key).join('.'),
          message: issue.message,
        })),
      });
    }

    req.query = result.output as any;
    next();
  };
}

// 使用示例
// routes/users.ts
import { Router } from 'express';
import { validateBody, validateQuery } from '../middleware/validate';
import * as v from 'valibot';

const CreateUserSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  name: v.pipe(v.string(), v.minLength(2)),
  role: v.optional(v.picklist(['admin', 'user'])),
});

const ListUsersQuerySchema = v.object({
  page: v.optional(v.pipe(v.string(), v.transform(Number), v.minValue(1))),
  limit: v.optional(v.pipe(v.string(), v.transform(Number), v.minValue(1), v.maxValue(100))),
  search: v.optional(v.string()),
});

const router = Router();

router.post(
  '/',
  validateBody(CreateUserSchema),
  async (req, res) => {
    // req.body 已验证且类型安全
    const user = await createUser(req.body);
    res.json(user);
  }
);

router.get(
  '/',
  validateQuery(ListUsersQuerySchema),
  async (req, res) => {
    const users = await listUsers(req.query);
    res.json(users);
  }
);
```

### 自定义验证器

```typescript
// utils/customValidators.ts
import * as v from 'valibot';

// 手机号验证
export const phoneSchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(
    /^\+?[\d\s-]{10,}$/,
    'Invalid phone number format'
  )
);

// 密码强度验证
export const strongPasswordSchema = v.pipe(
  v.string(),
  v.minLength(8, 'Password must be at least 8 characters'),
  v.maxLength(100),
  v.regex(/[A-Z]/, 'Must contain uppercase letter'),
  v.regex(/[a-z]/, 'Must contain lowercase letter'),
  v.regex(/[0-9]/, 'Must contain number'),
  v.regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  v.custom(
    (value) => !commonPasswords.includes(value),
    'Password is too common'
  )
);

// URL 验证（支持相对路径）
export const urlSchema = v.pipe(
  v.string(),
  v.custom((value) => {
    try {
      new URL(value, 'http://localhost');
      return true;
    } catch {
      return false;
    }
  }, 'Invalid URL')
);

// 颜色验证
export const hexColorSchema = v.pipe(
  v.string(),
  v.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color')
);

// 日期范围验证
export const dateRangeSchema = v.pipe(
  v.object({
    start: v.date(),
    end: v.date(),
  }),
  v.custom(
    (value) => value.start < value.end,
    'Start date must be before end date'
  )
);

// 文件大小验证（字节）
export const fileSizeSchema = (maxMB: number) =>
  v.pipe(
    v.number(),
    v.maxValue(maxMB * 1024 * 1024, `File size must be less than ${maxMB}MB`)
  );

// 文件扩展名验证
export const fileExtensionSchema = (allowed: string[]) =>
  v.pipe(
    v.string(),
    v.custom(
      (value) => {
        const ext = value.split('.').pop()?.toLowerCase();
        return ext ? allowed.includes(ext) : false;
      },
      `File extension must be one of: ${allowed.join(', ')}`
    )
  );
```

### 条件验证

```typescript
// schemas/conditional.ts
import * as v from 'valibot';

// 基于类型的条件验证
export const PaymentSchema = v.object({
  method: v.picklist(['card', 'bank', 'paypal']),
  details: v.custom((_, context) => {
    const method = (context as any)?.method;
    
    switch (method) {
      case 'card':
        return v.object({
          number: v.string(),
          cvv: v.string(),
          expiry: v.string(),
        });
      case 'bank':
        return v.object({
          account: v.string(),
          routing: v.string(),
        });
      case 'paypal':
        return v.object({
          email: v.pipe(v.string(), v.email()),
        });
      default:
        return v.never();
    }
  }),
});

// 依赖验证
export const EventSchema = v.object({
  type: v.picklist(['online', 'offline']),
  location: v.optional(v.string()),
  meetingUrl: v.optional(v.pipe(v.string(), v.url())),
}, [
  v.custom((input) => {
    if (input.type === 'offline' && !input.location) {
      return false;
    }
    if (input.type === 'online' && !input.meetingUrl) {
      return false;
    }
    return true;
  }, 'Location or meeting URL required based on event type'),
]);
```

### 异步验证

```typescript
// schemas/async.ts
import * as v from 'valibot';

// 异步唯一性检查
export const UniqueEmailSchema = v.pipeAsync(
  v.string(),
  v.email(),
  v.customAsync(async (email) => {
    const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`);
    const { available } = await response.json();
    return available;
  }, 'Email already registered')
);

// 使用
async function validateEmail(email: string) {
  const result = await v.safeParseAsync(UniqueEmailSchema, email);
  return result;
}

// 用户名验证（多异步检查）
export const UsernameSchema = v.pipeAsync(
  v.string(),
  v.minLength(3),
  v.maxLength(20),
  v.regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  v.customAsync(async (username) => {
    // 检查是否被保留
    const reserved = await checkReserved(username);
    if (reserved) return false;
    
    // 检查是否已存在
    const exists = await checkExists(username);
    return !exists;
  }, 'Username is not available')
);
```

## 最佳实践

### 1. 模式复用

```typescript
// schemas/common.ts
import * as v from 'valibot';

// 可复用的基础模式
export const IdSchema = v.pipe(v.string(), v.uuid());
export const EmailSchema = v.pipe(v.string(), v.trim(), v.email());
export const TimestampSchema = v.date();

// 可复用的模式片段
export const AuditableSchema = {
  createdAt: v.date(),
  updatedAt: v.date(),
  createdBy: v.string(),
};

// 组合使用
export const BasePostSchema = v.object({
  id: IdSchema,
  title: v.string(),
  ...AuditableSchema,
});
```

### 2. 错误消息

```typescript
// utils/messages.ts
import * as v from 'valibot';

// 自定义错误消息
export const customMessages = {
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be no more than ${max} characters`,
};

// 使用
const schema = v.object({
  email: v.pipe(
    v.string(),
    v.minLength(1, customMessages.required),
    v.email(customMessages.invalidEmail)
  ),
  password: v.pipe(
    v.string(),
    v.minLength(8, customMessages.minLength(8)),
    v.maxLength(100, customMessages.maxLength(100))
  ),
});
```

### 3. 类型推断

```typescript
// schemas/types.ts
import * as v from 'valibot';

// 从模式推断类型
const UserSchema = v.object({
  id: v.string(),
  name: v.string(),
  email: v.string(),
});

// 输入类型（更宽松）
type UserInput = v.InferInput<typeof UserSchema>;

// 输出类型（经过转换后）
type UserOutput = v.InferOutput<typeof UserSchema>;

// 部分类型（用于更新）
type UserUpdate = Partial<UserInput>;

// 只读类型
type ReadonlyUser = Readonly<UserOutput>;
```

### 4. 性能优化

```typescript
// 缓存模式
const cachedSchema = v.lazy(() => HeavySchema);

// 延迟验证
const schema = v.object({
  data: v.optional(v.lazy(() => HeavyNestedSchema)),
});
```

## 常用命令

```bash
# 安装
npm install valibot

# TypeScript 支持（内置）
# 无需额外安装

# 体积对比
# valibot: ~3KB gzipped
# zod: ~12KB gzipped
```

## 与其他工具集成

### React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import * as v from 'valibot';

const LoginSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.string(),
});

type LoginFormData = v.InferOutput<typeof LoginSchema>;

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: valibotResolver(LoginSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      <button type="submit">Login</button>
    </form>
  );
}
```

### TanStack Router

```typescript
import { createFileRoute } from '@tanstack/react-router';
import * as v from 'valibot';

const SearchSchema = v.object({
  page: v.optional(v.pipe(v.string(), v.transform(Number)), '1'),
  search: v.optional(v.string()),
});

export const Route = createFileRoute('/posts/')({
  validateSearch: (search) => v.parse(SearchSchema, search),
  component: PostsPage,
});
```

### tRPC

```typescript
import { initTRPC } from '@trpc/server';
import * as v from 'valibot';
import { ValibotValidator } from './utils/valibot-validator';

const t = initTRPC.create({
  validator: ValibotValidator,
});

const CreateUserSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  name: v.string(),
});

const router = t.router({
  createUser: t.procedure
    .input(CreateUserSchema)
    .mutation(async ({ input }) => {
      // input 已验证
      return createUser(input);
    }),
});
```

## 部署配置

### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['valibot'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          valibot: ['valibot'],
        },
      },
    },
  },
});
```

## 测试

```typescript
// __tests__/schemas.test.ts
import * as v from 'valibot';
import { describe, it, expect } from 'vitest';
import { UserSchema, RegisterFormSchema } from '../schemas';

describe('UserSchema', () => {
  it('validates valid user', () => {
    const result = v.safeParse(UserSchema, {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      name: 'John Doe',
      role: 'user',
      createdAt: new Date(),
    });
    
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = v.safeParse(UserSchema, {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'invalid-email',
      name: 'John Doe',
    });
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues[0].message).toContain('email');
    }
  });
});

describe('RegisterFormSchema', () => {
  it('requires matching passwords', () => {
    const result = v.safeParse(RegisterFormSchema, {
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Different123!',
      name: 'John',
      acceptTerms: true,
    });
    
    expect(result.success).toBe(false);
  });
});
```

## 迁移指南（从 Zod）

```typescript
// Zod -> Valibot 映射
// z.string() -> v.string()
// z.number() -> v.number()
// z.boolean() -> v.boolean()
// z.object() -> v.object()
// z.array() -> v.array()
// z.optional() -> v.optional()
// z.nullable() -> v.nullable()
// z.enum() -> v.picklist()
// z.union() -> v.union()
// z.intersection() -> v.intersect()
// z.discriminatedUnion() -> v.union() + v.object()
// z.transform() -> v.pipe() + v.transform()
// z.refine() -> v.custom()
// z.preprocess() -> v.pipe()
// .min() -> v.minLength() / v.minValue()
// .max() -> v.maxLength() / v.maxValue()
// .email() -> v.email()
// .url() -> v.url()
// .regex() -> v.regex()

// Zod 示例
const zodSchema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(150),
});

// Valibot 等效
const valibotSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  age: v.pipe(v.number(), v.minValue(0), v.maxValue(150)),
});
```
