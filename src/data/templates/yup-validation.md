# Yup 数据验证模板

## 技术栈

- **Yup**: JavaScript Schema 验证库
- **TypeScript**: 类型支持
- **React Hook Form**: 表单管理（可选）
- **Formik**: 表单管理（可选）
- **Zod**: Schema 验证替代方案
- **Vite**: 构建工具

## 项目结构

```
yup-validation/
├── src/
│   ├── schemas/
│   │   ├── user.schema.ts
│   │   ├── auth.schema.ts
│   │   ├── product.schema.ts
│   │   └── index.ts
│   ├── validators/
│   │   ├── customValidators.ts
│   │   ├── asyncValidators.ts
│   │   └── transformValidators.ts
│   ├── hooks/
│   │   ├── useValidation.ts
│   │   └── useFormValidation.ts
│   ├── components/
│   │   ├── forms/
│   │   │   ├── FormInput.tsx
│   │   │   ├── FormSelect.tsx
│   │   │   ├── FormCheckbox.tsx
│   │   │   └── FormTextArea.tsx
│   │   └── ValidationError.tsx
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── validationHelpers.ts
│   │   └── errorMessages.ts
│   └── App.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 代码模式

### 基础 Schema 定义

```typescript
// src/schemas/user.schema.ts
import * as yup from 'yup';

export const userSchema = yup.object().shape({
  name: yup
    .string()
    .required('姓名是必填项')
    .min(2, '姓名至少2个字符')
    .max(50, '姓名不能超过50个字符'),
    
  email: yup
    .string()
    .required('邮箱是必填项')
    .email('请输入有效的邮箱地址'),
    
  age: yup
    .number()
    .required('年龄是必填项')
    .min(18, '年龄必须大于18岁')
    .max(120, '年龄不能超过120岁')
    .typeError('请输入有效的数字'),
    
  phone: yup
    .string()
    .matches(
      /^1[3-9]\d{9}$/,
      '请输入有效的手机号码'
    ),
    
  password: yup
    .string()
    .required('密码是必填项')
    .min(8, '密码至少8个字符')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      '密码必须包含大小写字母、数字和特殊字符'
    ),
    
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], '密码必须匹配')
    .required('请确认密码'),
    
  website: yup
    .string()
    .url('请输入有效的URL')
    .nullable(),
    
  birthDate: yup
    .date()
    .required('出生日期是必填项')
    .max(new Date(), '出生日期不能是未来日期')
    .typeError('请输入有效的日期'),
    
  avatar: yup
    .mixed()
    .test('fileSize', '文件大小不能超过5MB', (value) => {
      if (!value) return true;
      return value.size <= 5 * 1024 * 1024;
    })
    .test('fileType', '仅支持图片文件', (value) => {
      if (!value) return true;
      return ['image/jpeg', 'image/png', 'image/gif'].includes(value.type);
    }),
    
  terms: yup
    .boolean()
    .oneOf([true], '必须同意服务条款')
    .required(),
    
  notifications: yup
    .object()
    .shape({
      email: yup.boolean().default(false),
      sms: yup.boolean().default(false),
      push: yup.boolean().default(false),
    })
    .default({ email: false, sms: false, push: false }),
});

export type UserFormData = yup.InferType<typeof userSchema>;
```

```typescript
// src/schemas/auth.schema.ts
import * as yup from 'yup';

export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required('邮箱是必填项')
    .email('请输入有效的邮箱地址'),
    
  password: yup
    .string()
    .required('密码是必填项')
    .min(8, '密码至少8个字符'),
    
  rememberMe: yup.boolean().default(false),
});

export const registerSchema = yup.object().shape({
  username: yup
    .string()
    .required('用户名是必填项')
    .min(3, '用户名至少3个字符')
    .max(20, '用户名不能超过20个字符')
    .matches(
      /^[a-zA-Z0-9_]+$/,
      '用户名只能包含字母、数字和下划线'
    ),
    
  email: yup
    .string()
    .required('邮箱是必填项')
    .email('请输入有效的邮箱地址'),
    
  password: yup
    .string()
    .required('密码是必填项')
    .min(8, '密码至少8个字符')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      '密码必须包含大小写字母和数字'
    ),
    
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], '密码必须匹配')
    .required('请确认密码'),
    
  terms: yup
    .boolean()
    .oneOf([true], '必须同意服务条款')
    .required(),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;
export type RegisterFormData = yup.InferType<typeof registerSchema>;
```

```typescript
// src/schemas/product.schema.ts
import * as yup from 'yup';

export const productSchema = yup.object().shape({
  name: yup
    .string()
    .required('产品名称是必填项')
    .min(2, '产品名称至少2个字符')
    .max(100, '产品名称不能超过100个字符'),
    
  description: yup
    .string()
    .required('产品描述是必填项')
    .min(10, '产品描述至少10个字符')
    .max(1000, '产品描述不能超过1000个字符'),
    
  price: yup
    .number()
    .required('价格是必填项')
    .positive('价格必须是正数')
    .min(0.01, '价格不能小于0.01')
    .typeError('请输入有效的价格'),
    
  discountPrice: yup
    .number()
    .nullable()
    .test(
      'discount-less-than-price',
      '折扣价必须小于原价',
      function(value) {
        if (!value) return true;
        const { price } = this.parent;
        return value < price;
      }
    ),
    
  category: yup
    .string()
    .required('请选择产品类别')
    .oneOf(
      ['electronics', 'clothing', 'books', 'home', 'sports'],
      '请选择有效的产品类别'
    ),
    
  tags: yup
    .array()
    .of(yup.string().required())
    .min(1, '至少添加一个标签')
    .max(10, '最多添加10个标签')
    .required('标签是必填项'),
    
  images: yup
    .array()
    .of(
      yup.object().shape({
        url: yup.string().url().required(),
        alt: yup.string().required(),
      })
    )
    .min(1, '至少上传一张图片')
    .max(10, '最多上传10张图片')
    .required('产品图片是必填项'),
    
  stock: yup
    .number()
    .required('库存是必填项')
    .integer('库存必须是整数')
    .min(0, '库存不能小于0')
    .typeError('请输入有效的库存数量'),
    
  sku: yup
    .string()
    .required('SKU是必填项')
    .matches(
      /^[A-Z]{3}-[0-9]{6}$/,
      'SKU格式必须是 XXX-123456'
    ),
    
  isPublished: yup.boolean().default(false),
  
  specifications: yup
    .array()
    .of(
      yup.object().shape({
        key: yup.string().required('规格名称是必填项'),
        value: yup.string().required('规格值是必填项'),
      })
    )
    .min(1, '至少添加一个规格')
    .required('产品规格是必填项'),
});

export type ProductFormData = yup.InferType<typeof productSchema>;
```

### 自定义验证器

```typescript
// src/validators/customValidators.ts
import * as yup from 'yup';

// 扩展 yup 类型
declare module 'yup' {
  interface StringSchema {
    phone(message?: string): StringSchema;
    password(message?: string): StringSchema;
    username(message?: string): StringSchema;
  }
}

// 手机号验证
yup.addMethod(yup.string, 'phone', function(message = '请输入有效的手机号码') {
  return this.test('phone', message, function(value) {
    if (!value) return true;
    return /^1[3-9]\d{9}$/.test(value);
  });
});

// 密码强度验证
yup.addMethod(yup.string, 'password', function(message = '密码强度不足') {
  return this.test('password', message, function(value) {
    if (!value) return true;
    
    const hasLower = /[a-z]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[@$!%*?&]/.test(value);
    const isLongEnough = value.length >= 8;
    
    return hasLower && hasUpper && hasNumber && hasSpecial && isLongEnough;
  });
});

// 用户名验证
yup.addMethod(yup.string, 'username', function(message = '用户名只能包含字母、数字和下划线') {
  return this.test('username', message, function(value) {
    if (!value) return true;
    return /^[a-zA-Z0-9_]+$/.test(value);
  });
});

// 使用示例
export const customUserSchema = yup.object().shape({
  phone: yup.string().phone(),
  password: yup.string().password(),
  username: yup.string().username(),
});
```

```typescript
// src/validators/asyncValidators.ts
import * as yup from 'yup';

// 异步验证：检查邮箱是否已存在
export const asyncEmailSchema = yup
  .string()
  .required('邮箱是必填项')
  .email('请输入有效的邮箱地址')
  .test(
    'unique-email',
    '该邮箱已被注册',
    async function(value) {
      if (!value) return true;
      
      try {
        const response = await fetch(`/api/check-email?email=${value}`);
        const { exists } = await response.json();
        return !exists;
      } catch (error) {
        return true; // 网络错误时允许通过
      }
    }
  );

// 异步验证：检查用户名是否已存在
export const asyncUsernameSchema = yup
  .string()
  .required('用户名是必填项')
  .min(3, '用户名至少3个字符')
  .test(
    'unique-username',
    '该用户名已被使用',
    async function(value) {
      if (!value) return true;
      
      try {
        const response = await fetch(`/api/check-username?username=${value}`);
        const { exists } = await response.json();
        return !exists;
      } catch (error) {
        return true;
      }
    }
  );

// 异步验证：检查SKU是否已存在
export const asyncSkuSchema = yup
  .string()
  .required('SKU是必填项')
  .test(
    'unique-sku',
    '该SKU已被使用',
    async function(value) {
      if (!value) return true;
      
      try {
        const response = await fetch(`/api/check-sku?sku=${value}`);
        const { exists } = await response.json();
        return !exists;
      } catch (error) {
        return true;
      }
    }
  );
```

```typescript
// src/validators/transformValidators.ts
import * as yup from 'yup';

// 数据转换验证
export const transformSchema = yup.object().shape({
  // 去除空格
  name: yup
    .string()
    .transform((value) => value?.trim())
    .required('姓名是必填项'),
    
  // 转换为大写
  code: yup
    .string()
    .transform((value) => value?.toUpperCase())
    .required('代码是必填项'),
    
  // 转换为小写
  email: yup
    .string()
    .transform((value) => value?.toLowerCase().trim())
    .email('请输入有效的邮箱地址')
    .required('邮箱是必填项'),
    
  // 字符串转数字
  price: yup
    .number()
    .transform((value, originalValue) => {
      if (typeof originalValue === 'string') {
        return parseFloat(originalValue.replace(/[^\d.-]/g, ''));
      }
      return value;
    })
    .required('价格是必填项'),
    
  // 布尔值转换
  active: yup
    .boolean()
    .transform((value, originalValue) => {
      if (originalValue === 'yes' || originalValue === '1') return true;
      if (originalValue === 'no' || originalValue === '0') return false;
      return value;
    })
    .default(false),
    
  // 日期转换
  date: yup
    .date()
    .transform((value, originalValue) => {
      if (typeof originalValue === 'string') {
        // 支持多种日期格式
        const parsed = new Date(originalValue);
        return isNaN(parsed.getTime()) ? value : parsed;
      }
      return value;
    })
    .required('日期是必填项'),
    
  // 数组转换
  tags: yup
    .array()
    .of(yup.string())
    .transform((value, originalValue) => {
      if (typeof originalValue === 'string') {
        return originalValue.split(',').map((tag: string) => tag.trim());
      }
      return value;
    })
    .min(1, '至少添加一个标签'),
});
```

### React Hook Form 集成

```typescript
// src/hooks/useFormValidation.ts
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { ObjectSchema } from 'yup';
import { useCallback } from 'react';

interface UseFormValidationOptions<T> {
  schema: ObjectSchema<T>;
  defaultValues?: Partial<T>;
  onSubmit: (data: T) => void | Promise<void>;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  defaultValues,
  onSubmit,
}: UseFormValidationOptions<T>) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    setValue,
    getValues,
    watch,
    trigger,
  } = useForm<T>({
    resolver: yupResolver(schema),
    defaultValues: defaultValues as any,
    mode: 'onBlur', // 失焦时验证
    reValidateMode: 'onChange', // 修改时重新验证
  });

  const submitForm = useCallback(
    async (event?: React.BaseSyntheticEvent) => {
      return handleSubmit(onSubmit)(event);
    },
    [handleSubmit, onSubmit]
  );

  const validateField = useCallback(
    async (field: keyof T) => {
      return trigger(field as string);
    },
    [trigger]
  );

  const validateAllFields = useCallback(async () => {
    return trigger();
  }, [trigger]);

  return {
    register,
    handleSubmit: submitForm,
    errors,
    isSubmitting,
    isValid,
    reset,
    setValue,
    getValues,
    watch,
    trigger,
    validateField,
    validateAllFields,
  };
}

// 使用示例
/*
import { useFormValidation } from './hooks/useFormValidation';
import { userSchema, UserFormData } from './schemas/user.schema';

function UserForm() {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
  } = useFormValidation<UserFormData>({
    schema: userSchema,
    defaultValues: {
      name: '',
      email: '',
    },
    onSubmit: async (data) => {
      console.log(data);
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <button type="submit" disabled={isSubmitting}>
        提交
      </button>
    </form>
  );
}
*/
```

```typescript
// src/hooks/useValidation.ts
import { useState, useCallback } from 'react';
import { ObjectSchema, ValidationError } from 'yup';

interface UseValidationOptions<T> {
  schema: ObjectSchema<T>;
  initialData?: Partial<T>;
}

interface ValidationErrors {
  [key: string]: string;
}

export function useValidation<T extends Record<string, any>>({
  schema,
  initialData = {},
}: UseValidationOptions<T>) {
  const [data, setData] = useState<T>(initialData as T);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isValid, setIsValid] = useState(false);

  const validateField = useCallback(
    async (field: string, value: any) => {
      try {
        await schema.validateAt(field, { ...data, [field]: value });
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
        return true;
      } catch (error) {
        if (error instanceof ValidationError) {
          setErrors((prev) => ({
            ...prev,
            [field]: error.message,
          }));
        }
        return false;
      }
    },
    [schema, data]
  );

  const validateAll = useCallback(async () => {
    try {
      await schema.validate(data, { abortEarly: false });
      setErrors({});
      setIsValid(true);
      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        const newErrors: ValidationErrors = {};
        error.inner.forEach((err) => {
          if (err.path) {
            newErrors[err.path] = err.message;
          }
        });
        setErrors(newErrors);
      }
      setIsValid(false);
      return false;
    }
  }, [schema, data]);

  const handleChange = useCallback(
    async (field: string, value: any) => {
      setData((prev) => ({
        ...prev,
        [field]: value,
      }));
      
      await validateField(field, value);
    },
    [validateField]
  );

  const reset = useCallback(() => {
    setData(initialData as T);
    setErrors({});
    setIsValid(false);
  }, [initialData]);

  return {
    data,
    errors,
    isValid,
    handleChange,
    validateField,
    validateAll,
    reset,
    setData,
  };
}

// 使用示例
/*
import { useValidation } from './hooks/useValidation';
import { userSchema, UserFormData } from './schemas/user.schema';

function UserForm() {
  const {
    data,
    errors,
    isValid,
    handleChange,
    validateAll,
  } = useValidation<UserFormData>({
    schema: userSchema,
    initialData: {
      name: '',
      email: '',
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateAll();
    if (isValid) {
      console.log('提交数据:', data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={data.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      {errors.name && <span>{errors.name}</span>}
      
      <input
        value={data.email}
        onChange={(e) => handleChange('email', e.target.value)}
      />
      {errors.email && <span>{errors.email}</span>}
      
      <button type="submit" disabled={!isValid}>
        提交
      </button>
    </form>
  );
}
*/
```

### 表单组件

```typescript
// src/components/forms/FormInput.tsx
import { forwardRef, InputHTMLAttributes } from 'react';
import { FieldError } from 'react-hook-form';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError;
  helperText?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-lg border
            bg-white text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
            ${error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error.message}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
```

```typescript
// src/components/forms/FormSelect.tsx
import { forwardRef, SelectHTMLAttributes } from 'react';
import { FieldError } from 'react-hook-form';

interface Option {
  value: string;
  label: string;
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  error?: FieldError;
  helperText?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, options, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
        <select
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-lg border
            bg-white text-gray-900
            focus:outline-none focus:ring-2 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
            ${error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
            }
            ${className}
          `}
          {...props}
        >
          <option value="">请选择</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error.message}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';
```

```typescript
// src/components/forms/FormTextArea.tsx
import { forwardRef, TextareaHTMLAttributes } from 'react';
import { FieldError } from 'react-hook-form';

interface FormTextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: FieldError;
  helperText?: string;
}

export const FormTextArea = forwardRef<HTMLTextAreaElement, FormTextAreaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-lg border
            bg-white text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
            resize-y min-h-[100px]
            ${error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error.message}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

FormTextArea.displayName = 'FormTextArea';
```

```typescript
// src/components/forms/FormCheckbox.tsx
import { forwardRef, InputHTMLAttributes } from 'react';
import { FieldError } from 'react-hook-form';

interface FormCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError;
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            className={`
              w-4 h-4 rounded border-gray-300
              text-blue-600 focus:ring-blue-500
              ${className}
            `}
            {...props}
          />
          <span className="text-sm text-gray-700">{label}</span>
        </label>
        {error && (
          <p className="mt-1.5 text-sm text-red-500 ml-6">{error.message}</p>
        )}
      </div>
    );
  }
);

FormCheckbox.displayName = 'FormCheckbox';
```

### 工具函数

```typescript
// src/utils/validationHelpers.ts
import { ValidationError } from 'yup';

export function formatYupErrors(error: unknown): Record<string, string> {
  if (error instanceof ValidationError) {
    const errors: Record<string, string> = {};
    
    error.inner.forEach((err) => {
      if (err.path) {
        errors[err.path] = err.message;
      }
    });
    
    return errors;
  }
  
  return {};
}

export function getFirstError(errors: Record<string, string>): string | null {
  const keys = Object.keys(errors);
  return keys.length > 0 ? errors[keys[0]] : null;
}

export function hasErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0;
}

export function clearErrors(
  errors: Record<string, string>,
  field: string
): Record<string, string> {
  const newErrors = { ...errors };
  delete newErrors[field];
  return newErrors;
}
```

```typescript
// src/utils/errorMessages.ts
export const errorMessages = {
  required: '此字段为必填项',
  email: '请输入有效的邮箱地址',
  url: '请输入有效的URL',
  min: (min: number) => `至少需要 ${min} 个字符`,
  max: (max: number) => `不能超过 ${max} 个字符`,
  minLength: (min: number) => `至少需要 ${min} 个字符`,
  maxLength: (max: number) => `不能超过 ${max} 个字符`,
  between: (min: number, max: number) => `必须在 ${min} 和 ${max} 之间`,
  phone: '请输入有效的手机号码',
  password: '密码强度不足',
  passwordMatch: '两次密码不匹配',
  date: '请输入有效的日期',
  number: '请输入有效的数字',
  positive: '必须是正数',
  integer: '必须是整数',
  oneOf: '请选择有效的选项',
  file: {
    size: (maxSize: number) => `文件大小不能超过 ${maxSize}MB`,
    type: '不支持的文件类型',
  },
  custom: {
    username: '用户名只能包含字母、数字和下划线',
    creditCard: '请输入有效的信用卡号',
    postalCode: '请输入有效的邮政编码',
  },
};
```

## 最佳实践

### 1. Schema 组织

```typescript
// 将 schema 分离到独立文件
// src/schemas/user.schema.ts
export const userSchema = yup.object().shape({
  // ...
});

// 复用 schema
export const userUpdateSchema = userSchema.shape({
  password: yup.string().notRequired(),
  confirmPassword: yup.string().when('password', {
    is: (password: string) => !!password,
    then: (schema) => schema.oneOf([yup.ref('password')], '密码必须匹配'),
  }),
});
```

### 2. 条件验证

```typescript
// 使用 when 进行条件验证
yup.object().shape({
  hasDiscount: yup.boolean(),
  discountCode: yup.string().when('hasDiscount', {
    is: true,
    then: (schema) => schema.required('请输入折扣码'),
    otherwise: (schema) => schema.notRequired(),
  }),
});
```

### 3. 嵌套对象验证

```typescript
// 嵌套对象验证
const schema = yup.object().shape({
  address: yup.object().shape({
    street: yup.string().required(),
    city: yup.string().required(),
    zipCode: yup.string().required(),
  }),
});

// 数组验证
const schema = yup.object().shape({
  items: yup.array().of(
    yup.object().shape({
      name: yup.string().required(),
      quantity: yup.number().positive().required(),
    })
  ),
});
```

### 4. 性能优化

```typescript
// 避免在渲染时创建 schema
// ❌ 错误
function Component() {
  const schema = yup.object().shape({ /* ... */ });
  // ...
}

// ✅ 正确
const schema = yup.object().shape({ /* ... */ });

function Component() {
  // 使用 schema
}
```

## 常用命令

```bash
# 安装依赖
npm install yup
npm install @hookform/resolvers react-hook-form

# 开发模式
npm run dev

# 构建
npm run build

# 测试
npm run test
```

## 部署配置

### package.json

```json
{
  "dependencies": {
    "yup": "^1.3.0",
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipModuleCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 参考资源

- [Yup 官方文档](https://github.com/jquense/yup)
- [React Hook Form](https://react-hook-form.com/)
- [Yup API 参考](https://github.com/jquense/yup#api)
- [表单验证最佳实践](https://kentcdodds.com/blog/robust-react-form-validation)
