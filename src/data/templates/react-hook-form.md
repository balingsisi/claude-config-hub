# React Hook Form 表单管理模板

## 技术栈

- **核心**: react-hook-form
- **验证**: Zod, Yup, Joi
- **UI 库**: Material-UI, Chakra UI, Ant Design
- **类型安全**: TypeScript + Zod
- **集成**: Controller, FormProvider, useFieldArray

## 项目结构

```
project/
├── src/
│   ├── components/
│   │   ├── forms/
│   │   │   ├── FormInput.tsx
│   │   │   ├── FormSelect.tsx
│   │   │   ├── FormCheckbox.tsx
│   │   │   └── FormDatePicker.tsx
│   │   └── Form.tsx
│   ├── hooks/
│   │   └── useForm.ts
│   ├── schemas/
│   │   ├── userSchema.ts
│   │   └── productSchema.ts
│   ├── types/
│   │   └── form.ts
│   └── utils/
│       └── formHelpers.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础表单

```typescript
// src/components/Form.tsx
import React from 'react';
import { useForm } from 'react-hook-form';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
}

export function BasicForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      age: 0,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await submitForm(data);
      reset();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>First Name</label>
        <input
          {...register('firstName', {
            required: 'First name is required',
            minLength: {
              value: 2,
              message: 'Minimum 2 characters',
            },
          })}
        />
        {errors.firstName && (
          <span className="error">{errors.firstName.message}</span>
        )}
      </div>

      <div>
        <label>Last Name</label>
        <input
          {...register('lastName', {
            required: 'Last name is required',
          })}
        />
        {errors.lastName && (
          <span className="error">{errors.lastName.message}</span>
        )}
      </div>

      <div>
        <label>Email</label>
        <input
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
        />
        {errors.email && (
          <span className="error">{errors.email.message}</span>
        )}
      </div>

      <div>
        <label>Age</label>
        <input
          type="number"
          {...register('age', {
            required: 'Age is required',
            min: {
              value: 18,
              message: 'Must be at least 18',
            },
            max: {
              value: 100,
              message: 'Must be less than 100',
            },
          })}
        />
        {errors.age && (
          <span className="error">{errors.age.message}</span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

### Zod 集成

```typescript
// src/schemas/userSchema.ts
import { z } from 'zod';

export const userSchema = z.object({
  firstName: z.string().min(2, 'Minimum 2 characters'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18').max(100, 'Must be less than 100'),
  password: z
    .string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type UserFormData = z.infer<typeof userSchema>;
```

```typescript
// src/components/ZodForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema, UserFormData } from '../schemas/userSchema';

export function ZodForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    mode: 'onChange', // 实时验证
  });

  const onSubmit = (data: UserFormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('firstName')} />
      {errors.firstName && <span>{errors.firstName.message}</span>}

      <input {...register('lastName')} />
      {errors.lastName && <span>{errors.lastName.message}</span>}

      <input type="email" {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="number" {...register('age', { valueAsNumber: true })} />
      {errors.age && <span>{errors.age.message}</span>}

      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}

      <input type="password" {...register('confirmPassword')} />
      {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Controller 组件

```typescript
// src/components/forms/FormInput.tsx
import React from 'react';
import { Controller, Control, FieldError, Path } from 'react-hook-form';
import TextField from '@mui/material/TextField';

interface FormInputProps<T> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  error?: FieldError;
  type?: string;
  required?: boolean;
}

export function FormInput<T extends Record<string, any>>({
  name,
  control,
  label,
  error,
  type = 'text',
  required,
}: FormInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label={label}
          type={type}
          required={required}
          error={!!error}
          helperText={error?.message}
          fullWidth
          margin="normal"
        />
      )}
    />
  );
}

// 使用
<FormInput
  name="firstName"
  control={control}
  label="First Name"
  error={errors.firstName}
  required
/>
```

### Select 组件

```typescript
// src/components/forms/FormSelect.tsx
import React from 'react';
import { Controller, Control, FieldError, Path } from 'react-hook-form';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';

interface Option {
  value: string | number;
  label: string;
}

interface FormSelectProps<T> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  options: Option[];
  error?: FieldError;
  required?: boolean;
}

export function FormSelect<T extends Record<string, any>>({
  name,
  control,
  label,
  options,
  error,
  required,
}: FormSelectProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControl error={!!error} fullWidth margin="normal">
          <InputLabel required={required}>{label}</InputLabel>
          <Select {...field} label={label}>
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {error && <FormHelperText>{error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  );
}

// 使用
<FormSelect
  name="country"
  control={control}
  label="Country"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'cn', label: 'China' },
  ]}
  error={errors.country}
/>
```

### Checkbox 组件

```typescript
// src/components/forms/FormCheckbox.tsx
import React from 'react';
import { Controller, Control, Path } from 'react-hook-form';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

interface FormCheckboxProps<T> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  disabled?: boolean;
}

export function FormCheckbox<T extends Record<string, any>>({
  name,
  control,
  label,
  disabled,
}: FormCheckboxProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          control={
            <Checkbox
              checked={field.value}
              onChange={field.onChange}
              disabled={disabled}
            />
          }
          label={label}
        />
      )}
    />
  );
}
```

### DatePicker 组件

```typescript
// src/components/forms/FormDatePicker.tsx
import React from 'react';
import { Controller, Control, FieldError, Path } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

interface FormDatePickerProps<T> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  error?: FieldError;
  minDate?: Date;
  maxDate?: Date;
}

export function FormDatePicker<T extends Record<string, any>>({
  name,
  control,
  label,
  error,
  minDate,
  maxDate,
}: FormDatePickerProps<T>) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <DatePicker
            label={label}
            value={field.value}
            onChange={field.onChange}
            minDate={minDate}
            maxDate={maxDate}
            slotProps={{
              textField: {
                error: !!error,
                helperText: error?.message,
                fullWidth: true,
                margin: 'normal',
              },
            }}
          />
        )}
      />
    </LocalizationProvider>
  );
}
```

### 动态表单字段

```typescript
// src/components/DynamicForm.tsx
import React from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface FormData {
  skills: Skill[];
}

export function DynamicForm() {
  const { control, register, handleSubmit } = useForm<FormData>({
    defaultValues: {
      skills: [{ name: '', level: 'beginner' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'skills',
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input
            {...register(`skills.${index}.name` as const)}
            placeholder="Skill name"
          />
          
          <select {...register(`skills.${index}.level` as const)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <button type="button" onClick={() => remove(index)}>
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ name: '', level: 'beginner' })}
      >
        Add Skill
      </button>

      <button type="submit">Submit</button>
    </form>
  );
}
```

### FormProvider

```typescript
// src/components/FormProvider.tsx
import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormInput } from './forms/FormInput';
import { FormSelect } from './forms/FormSelect';

interface FormData {
  firstName: string;
  lastName: string;
  country: string;
}

export function ProviderForm() {
  const methods = useForm<FormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      country: '',
    },
  });

  const { handleSubmit } = methods;

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormInput name="firstName" label="First Name" />
        <FormInput name="lastName" label="Last Name" />
        <FormSelect
          name="country"
          label="Country"
          options={[
            { value: 'us', label: 'United States' },
            { value: 'uk', label: 'United Kingdom' },
          ]}
        />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}
```

## 最佳实践

### 1. 表单验证模式

```typescript
const { register } = useForm({
  mode: 'onChange',    // 每次变化时验证
  // mode: 'onBlur',  // 失去焦点时验证
  // mode: 'onSubmit', // 提交时验证（默认）
  // mode: 'onTouched', // 首次失去焦点后，每次变化验证
  // mode: 'all',      // onBlur 和 onChange 都验证
});
```

### 2. 默认值

```typescript
// 异步加载默认值
useEffect(() => {
  fetchUser().then((user) => {
    reset(user);
  });
}, [reset]);

// 条件默认值
const { register } = useForm({
  defaultValues: {
    email: initialEmail || '',
  },
});
```

### 3. 表单状态管理

```typescript
const {
  formState: {
    isDirty,          // 表单是否修改过
    isValid,          // 表单是否有效
    isSubmitting,     // 是否正在提交
    touchedFields,    // 已触摸的字段
    errors,           // 错误对象
    dirtyFields,      // 已修改的字段
  },
} = useForm();

// 禁用提交按钮
<button disabled={!isDirty || !isValid || isSubmitting}>
  Submit
</button>

// 显示已修改字段
{Object.keys(dirtyFields).map((field) => (
  <span key={field}>{field}</span>
))}
```

### 4. 自定义 Hook

```typescript
// src/hooks/useForm.ts
import { useForm as useHookForm, UseFormProps, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export function useForm<T extends FieldValues>(
  schema: z.ZodType<T>,
  props?: UseFormProps<T>
) {
  return useHookForm<T>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    ...props,
  });
}

// 使用
const { register, handleSubmit } = useForm(userSchema);
```

### 5. 重置表单

```typescript
const { reset, resetField } = useForm();

// 重置整个表单
reset();

// 重置为指定值
reset({ firstName: 'John', lastName: 'Doe' });

// 重置单个字段
resetField('firstName');

// 保留已修改状态
reset({ firstName: 'John' }, { keepDirtyValues: true });
```

### 6. 表单值监听

```typescript
const { watch, getValues, setValue } = useForm();

// 监听单个字段
const email = watch('email');

// 监听多个字段
const [firstName, lastName] = watch(['firstName', 'lastName']);

// 监听整个表单
const formData = watch();

// 获取当前值
const values = getValues();
const email = getValues('email');

// 设置值
setValue('firstName', 'John');
setValue('firstName', 'John', {
  shouldValidate: true,  // 触发验证
  shouldDirty: true,     // 标记为已修改
});
```

### 7. 条件字段

```typescript
function ConditionalForm() {
  const { register, watch } = useForm();
  const hasAccount = watch('hasAccount');

  return (
    <form>
      <input type="checkbox" {...register('hasAccount')} />

      {hasAccount && (
        <input {...register('accountNumber')} />
      )}
    </form>
  );
}
```

## 常用命令

### 安装依赖

```bash
# 核心
npm install react-hook-form

# 验证器
npm install zod @hookform/resolvers
npm install yup @hookform/resolvers

# UI 库（可选）
npm install @mui/material @mui/x-date-pickers
npm install @chakra-ui/react
```

### DevTools

```typescript
import { DevTool } from '@hookform/devtools';

function App() {
  const { control } = useForm();

  return (
    <>
      <form>...</form>
      <DevTool control={control} />
    </>
  );
}
```

## 部署配置

### API 集成

```typescript
// src/api/formApi.ts
import { FormData } from '../types/form';

export async function submitForm(data: FormData): Promise<void> {
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to submit form');
  }
}

// 使用
const onSubmit = async (data: FormData) => {
  try {
    await submitForm(data);
    toast.success('Form submitted successfully');
    reset();
  } catch (error) {
    toast.error('Failed to submit form');
  }
};
```

### 错误处理

```typescript
const onSubmit = async (data: FormData) => {
  try {
    await submitForm(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      // 设置服务器验证错误
      error.fields.forEach((field) => {
        setError(field.name, {
          type: 'server',
          message: field.message,
        });
      });
    }
  }
};
```

## 性能优化

### 1. 减少重渲染

```typescript
// 使用 Controller 避免整个表单重渲染
<Controller
  name="firstName"
  control={control}
  render={({ field }) => <Input {...field} />}
/>

// 使用 memo 包装自定义输入组件
const MemoizedInput = React.memo(Input);
```

### 2. 懒加载验证

```typescript
const { trigger } = useForm();

// 手动触发验证
await trigger('firstName'); // 单个字段
await trigger(['firstName', 'lastName']); // 多个字段
await trigger(); // 所有字段
```

### 3. 批量更新

```typescript
const { setValue } = useForm();

// 批量设置值
Object.entries(data).forEach(([key, value]) => {
  setValue(key, value, { shouldValidate: false });
});

// 一次性验证
trigger();
```

## 测试

```typescript
// __tests__/Form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BasicForm } from '../BasicForm';

test('should submit form with valid data', async () => {
  const onSubmit = jest.fn();
  render(<BasicForm onSubmit={onSubmit} />);

  fireEvent.change(screen.getByLabelText(/first name/i), {
    target: { value: 'John' },
  });

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'john@example.com' },
  });

  fireEvent.click(screen.getByText(/submit/i));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      firstName: 'John',
      email: 'john@example.com',
    });
  });
});

test('should display validation errors', async () => {
  render(<BasicForm />);

  fireEvent.click(screen.getByText(/submit/i));

  await waitFor(() => {
    expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
  });
});
```

## 无障碍支持

```typescript
// 关联标签和错误
<div>
  <label htmlFor="firstName">First Name</label>
  <input
    id="firstName"
    {...register('firstName')}
    aria-invalid={errors.firstName ? 'true' : 'false'}
    aria-describedby={errors.firstName ? 'firstName-error' : undefined}
  />
  {errors.firstName && (
    <span id="firstName-error" role="alert">
      {errors.firstName.message}
    </span>
  )}
</div>
```

## 参考资料

- [React Hook Form 官方文档](https://react-hook-form.com/)
- [Zod 文档](https://zod.dev/)
- [Material-UI 集成](https://react-hook-form.com/get-started#IntegratingwithUIlibraries)
- [性能优化](https://react-hook-form.com/advanced-usage#ImprovePerformance)
