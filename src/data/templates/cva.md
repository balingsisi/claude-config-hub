# Class Variance Authority (CVA) 组件样式变体模板

## 技术栈

- **核心**: class-variance-authority
- **样式**: Tailwind CSS, CSS Modules, styled-components
- **工具**: clsx, tailwind-merge
- **类型安全**: TypeScript
- **组件库**: React

## 项目结构

```
project/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.variants.ts
│   │   │   │   └── index.ts
│   │   │   ├── Card/
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Card.variants.ts
│   │   │   │   └── index.ts
│   │   │   ├── Input/
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Input.variants.ts
│   │   │   │   └── index.ts
│   │   │   └── Badge/
│   │   │       ├── Badge.tsx
│   │   │       ├── Badge.variants.ts
│   │   │       └── index.ts
│   │   └── Button.stories.tsx
│   ├── lib/
│   │   └── utils.ts
│   └── types/
│       └── cva.d.ts
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## 代码模式

### 基础配置

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Button 变体

```typescript
// src/components/ui/Button/Button.variants.ts
import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white hover:bg-blue-700',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border border-gray-300 bg-transparent hover:bg-gray-100',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        ghost: 'hover:bg-gray-100 hover:text-gray-900',
        link: 'text-blue-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
```

```typescript
// src/components/ui/Button/Button.tsx
import React from 'react';
import { buttonVariants, type ButtonVariants } from './Button.variants';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
```

```typescript
// src/components/ui/Button/index.ts
export { Button, buttonVariants } from './Button';
export type { ButtonProps, ButtonVariants } from './Button';
```

### Card 变体

```typescript
// src/components/ui/Card/Card.variants.ts
import { cva, type VariantProps } from 'class-variance-authority';

export const cardVariants = cva('rounded-lg border bg-white text-gray-950 shadow-sm', {
  variants: {
    variant: {
      default: 'border-gray-200',
      elevated: 'border-0 shadow-lg',
      outlined: 'border-2 border-gray-300 bg-transparent',
      filled: 'border-0 bg-gray-100',
    },
    padding: {
      none: 'p-0',
      sm: 'p-3',
      default: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'default',
  },
});

export type CardVariants = VariantProps<typeof cardVariants>;
```

```typescript
// src/components/ui/Card/Card.tsx
import React from 'react';
import { cardVariants, type CardVariants } from './Card.variants';
import { cn } from '@/lib/utils';

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    CardVariants {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, className }))}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
```

### Input 变体

```typescript
// src/components/ui/Input/Input.variants.ts
import { cva, type VariantProps } from 'class-variance-authority';

export const inputVariants = cva(
  'flex w-full rounded-md border bg-white text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
        error: 'border-red-500 focus-visible:ring-2 focus-visible:ring-red-500',
        success: 'border-green-500 focus-visible:ring-2 focus-visible:ring-green-500',
      },
      inputSize: {
        default: 'h-10 px-3 py-2',
        sm: 'h-9 px-2 py-1 text-xs',
        lg: 'h-11 px-4 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export type InputVariants = VariantProps<typeof inputVariants>;
```

```typescript
// src/components/ui/Input/Input.tsx
import React from 'react';
import { inputVariants, type InputVariants } from './Input.variants';
import { cn } from '@/lib/utils';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    InputVariants {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
```

### Badge 变体

```typescript
// src/components/ui/Badge/Badge.variants.ts
import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'border-transparent bg-gray-200 text-gray-900 hover:bg-gray-300',
        destructive: 'border-transparent bg-red-600 text-white hover:bg-red-700',
        outline: 'border-gray-300 text-gray-700',
        success: 'border-transparent bg-green-600 text-white hover:bg-green-700',
        warning: 'border-transparent bg-yellow-600 text-white hover:bg-yellow-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
```

```typescript
// src/components/ui/Badge/Badge.tsx
import React from 'react';
import { badgeVariants, type BadgeVariants } from './Badge.variants';
import { cn } from '@/lib/utils';

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    BadgeVariants {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
```

### 复合变体

```typescript
// 使用 compoundVariants 创建复合变体
import { cva } from 'class-variance-authority';

const alertVariants = cva('rounded-md border p-4', {
  variants: {
    variant: {
      default: 'bg-white text-gray-900',
      destructive: 'bg-red-50 text-red-900 border-red-200',
      success: 'bg-green-50 text-green-900 border-green-200',
    },
    size: {
      sm: 'p-3 text-sm',
      default: 'p-4',
      lg: 'p-6 text-lg',
    },
  },
  compoundVariants: [
    {
      variant: 'destructive',
      size: 'lg',
      className: 'border-2',
    },
  ],
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});
```

## 最佳实践

### 1. 使用 TypeScript

```typescript
// 导出类型供外部使用
export type ButtonVariants = VariantProps<typeof buttonVariants>;

// 在组件中使用
interface ButtonProps extends ButtonVariants {
  // ...
}
```

### 2. 组合样式

```typescript
// 使用 cn 工具函数组合样式
import { cn } from '@/lib/utils';

<Button className={cn(buttonVariants({ variant: 'default' }), 'my-custom-class')} />
```

### 3. 默认变体

```typescript
// 设置合理的默认值
const buttonVariants = cva('base-styles', {
  variants: { /* ... */ },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});
```

### 4. 响应式变体

```typescript
// 使用 Tailwind 的响应式类
const containerVariants = cva('w-full', {
  variants: {
    width: {
      full: 'w-full',
      container: 'max-w-7xl mx-auto',
      narrow: 'max-w-3xl mx-auto',
    },
  },
});
```

### 5. 状态变体

```typescript
const inputVariants = cva('rounded border', {
  variants: {
    state: {
      idle: 'border-gray-300',
      focused: 'border-blue-600 ring-2 ring-blue-200',
      error: 'border-red-500 ring-2 ring-red-200',
      disabled: 'bg-gray-100 cursor-not-allowed',
    },
  },
});
```

## 常用命令

### 安装依赖

```bash
# CVA 核心
npm install class-variance-authority

# 工具函数
npm install clsx tailwind-merge

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
```

### Tailwind 配置

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

## 部署配置

### Storybook 集成

```typescript
// src/components/ui/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};
```

### 测试组件

```typescript
// __tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

test('renders button with default variant', () => {
  render(<Button>Click me</Button>);
  const button = screen.getByRole('button');
  expect(button).toHaveClass('bg-blue-600');
});

test('renders button with outline variant', () => {
  render(<Button variant="outline">Click me</Button>);
  const button = screen.getByRole('button');
  expect(button).toHaveClass('border');
});
```

## 性能优化

### 1. 提取变体定义

```typescript
// 将变体定义提取到单独文件
// Button.variants.ts
export const buttonVariants = cva(/* ... */);

// Button.tsx
import { buttonVariants } from './Button.variants';
```

### 2. 使用 React.memo

```typescript
// 避免不必要的重渲染
const Button = React.memo(({ variant, size, children, ...props }) => {
  return (
    <button className={buttonVariants({ variant, size })} {...props}>
      {children}
    </button>
  );
});
```

### 3. 样式缓存

```typescript
// 使用 useMemo 缓存计算后的类名
const buttonClass = useMemo(
  () => buttonVariants({ variant, size, className }),
  [variant, size, className]
);
```

## 参考资料

- [CVA 官方文档](https://cva.style/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [clsx](https://github.com/lukeed/clsx)
- [tailwind-merge](https://github.com/dcastil/tailwind-merge)
- [shadcn/ui](https://ui.shadcn.com/)
