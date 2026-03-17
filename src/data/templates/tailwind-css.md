# Tailwind CSS 模板

## 技术栈

- **CSS 框架**: Tailwind CSS 3.x
- **构建工具**: Vite / PostCSS
- **UI 组件**: Headless UI / Radix UI
- **图标**: Heroicons / Lucide Icons
- **动画**: Tailwind CSS Animate / Framer Motion
- **主题**: CSS Variables / Dark Mode
- **代码规范**: Prettier Plugin Tailwind
- **开发工具**: Tailwind CSS IntelliSense

## 项目结构

```
tailwind-css/
├── src/                       # 源代码
│   ├── components/           # 组件目录
│   │   ├── ui/              # 基础 UI 组件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── index.ts
│   │   ├── layout/          # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Container.tsx
│   │   └── features/        # 功能组件
│   ├── styles/              # 样式文件
│   │   ├── globals.css      # 全局样式
│   │   └── animations.css   # 自定义动画
│   ├── hooks/               # 自定义 Hooks
│   ├── utils/               # 工具函数
│   │   ├── cn.ts           # classnames 工具
│   │   └── helpers.ts
│   ├── types/               # 类型定义
│   └── App.tsx
├── public/                   # 静态资源
├── tailwind.config.js        # Tailwind 配置
├── postcss.config.js         # PostCSS 配置
├── vite.config.ts           # Vite 配置
├── package.json
├── tsconfig.json
└── .prettierrc              # Prettier 配置
```

## 代码模式

### Tailwind 配置

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  
  darkMode: 'class', // 或 'media'
  
  theme: {
    // 自定义断点
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    
    // 自定义颜色
    colors: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
        950: '#172554',
      },
      secondary: {
        // ... 同上
      },
    },
    
    // 自定义字体
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Fira Code', 'monospace'],
    },
    
    // 自定义间距
    spacing: {
      '128': '32rem',
      '144': '36rem',
    },
    
    // 自定义圆角
    borderRadius: {
      '4xl': '2rem',
    },
    
    // 自定义阴影
    boxShadow: {
      'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
    },
    
    // 自定义动画
    animation: {
      'fade-in': 'fadeIn 0.5s ease-in-out',
      'slide-up': 'slideUp 0.3s ease-out',
      'slide-down': 'slideDown 0.3s ease-out',
      'bounce-in': 'bounceIn 0.5s',
      'spin-slow': 'spin 3s linear infinite',
    },
    
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      slideUp: {
        '0%': { transform: 'translateY(10px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      slideDown: {
        '0%': { transform: 'translateY(-10px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      bounceIn: {
        '0%': { transform: 'scale(0.9)', opacity: '0' },
        '50%': { transform: 'scale(1.05)' },
        '100%': { transform: 'scale(1)', opacity: '1' },
      },
    },
    
    extend: {
      // 其他扩展
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
      },
    },
  },
  
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/aspect-ratio'),
    require('tailwindcss-animate'),
  ],
};
```

### 全局样式

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* 基础样式覆盖 */
  html {
    @apply scroll-smooth;
  }
  
  body {
    @apply bg-gray-50 text-gray-900 antialiased;
    @apply dark:bg-gray-900 dark:text-gray-100;
  }
  
  /* 自定义滚动条 */
  ::-webkit-scrollbar {
    @apply w-2 h-2;
  }
  
  ::-webkit-scrollbar-track {
    @apply bg-gray-100 dark:bg-gray-800;
  }
  
  ::-webkit-scrollbar-thumb {
    @apply bg-gray-300 dark:bg-gray-600 rounded-full;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-400 dark:bg-gray-500;
  }
  
  /* 选中文本样式 */
  ::selection {
    @apply bg-primary-200 dark:bg-primary-800;
  }
  
  /* 焦点样式 */
  *:focus-visible {
    @apply outline-none ring-2 ring-primary-500 ring-offset-2;
    @apply dark:ring-offset-gray-900;
  }
}

@layer components {
  /* 自定义组件样式 */
  .btn {
    @apply inline-flex items-center justify-center px-4 py-2;
    @apply font-medium rounded-lg transition-all duration-200;
    @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }
  
  .btn-primary {
    @apply btn bg-primary-600 text-white;
    @apply hover:bg-primary-700 focus:ring-primary-500;
  }
  
  .btn-secondary {
    @apply btn bg-gray-200 text-gray-900;
    @apply hover:bg-gray-300 focus:ring-gray-500;
    @apply dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600;
  }
  
  .btn-outline {
    @apply btn border-2 border-primary-600 text-primary-600;
    @apply hover:bg-primary-50 focus:ring-primary-500;
    @apply dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/20;
  }
  
  .btn-ghost {
    @apply btn text-gray-700;
    @apply hover:bg-gray-100 focus:ring-gray-500;
    @apply dark:text-gray-300 dark:hover:bg-gray-800;
  }
  
  .btn-danger {
    @apply btn bg-red-600 text-white;
    @apply hover:bg-red-700 focus:ring-red-500;
  }
  
  .input {
    @apply w-full px-4 py-2 rounded-lg border border-gray-300;
    @apply bg-white text-gray-900 placeholder-gray-400;
    @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
    @apply dark:bg-gray-800 dark:border-gray-600 dark:text-white;
    @apply dark:placeholder-gray-500 dark:focus:ring-primary-400;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
    @apply transition-colors duration-200;
  }
  
  .card {
    @apply bg-white rounded-xl shadow-soft;
    @apply dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700;
  }
  
  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }
  
  .badge-primary {
    @apply badge bg-primary-100 text-primary-800;
    @apply dark:bg-primary-900/30 dark:text-primary-300;
  }
}

@layer utilities {
  /* 自定义工具类 */
  .text-balance {
    text-wrap: balance;
  }
  
  .gradient-text {
    @apply bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent;
  }
  
  .glass {
    @apply bg-white/80 backdrop-blur-lg;
    @apply dark:bg-gray-900/80;
  }
  
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  
  /* 动画延迟 */
  .animation-delay-100 {
    animation-delay: 100ms;
  }
  
  .animation-delay-200 {
    animation-delay: 200ms;
  }
  
  .animation-delay-300 {
    animation-delay: 300ms;
  }
}

/* 自定义动画 */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(
    to right,
    #f6f7f8 0%,
    #edeef1 20%,
    #f6f7f8 40%,
    #f6f7f8 100%
  );
  background-size: 1000px 100%;
}

.dark .skeleton {
  background: linear-gradient(
    to right,
    #1f2937 0%,
    #374151 20%,
    #1f2937 40%,
    #1f2937 100%
  );
}
```

### 基础组件

```typescript
// src/components/ui/Button.tsx
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium rounded-lg',
      'transition-all duration-200 ease-in-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    );

    const variants = {
      primary: cn(
        'bg-primary-600 text-white',
        'hover:bg-primary-700 active:bg-primary-800',
        'focus:ring-primary-500'
      ),
      secondary: cn(
        'bg-gray-200 text-gray-900',
        'hover:bg-gray-300 active:bg-gray-400',
        'focus:ring-gray-500',
        'dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
      ),
      outline: cn(
        'border-2 border-primary-600 text-primary-600',
        'hover:bg-primary-50 active:bg-primary-100',
        'focus:ring-primary-500',
        'dark:border-primary-400 dark:text-primary-400',
        'dark:hover:bg-primary-900/20'
      ),
      ghost: cn(
        'text-gray-700',
        'hover:bg-gray-100 active:bg-gray-200',
        'focus:ring-gray-500',
        'dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700'
      ),
      danger: cn(
        'bg-red-600 text-white',
        'hover:bg-red-700 active:bg-red-800',
        'focus:ring-red-500'
      ),
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

// src/components/ui/Input.tsx
import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border',
              'bg-white text-gray-900 placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:border-transparent',
              'dark:bg-gray-800 dark:text-white',
              'dark:placeholder-gray-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-200',
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 dark:focus:ring-primary-400',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// src/components/ui/Card.tsx
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const baseStyles = 'rounded-xl overflow-hidden';

    const variants = {
      default: cn(
        'bg-white dark:bg-gray-800',
        'shadow-soft dark:shadow-none'
      ),
      bordered: cn(
        'bg-white dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-700'
      ),
      elevated: cn(
        'bg-white dark:bg-gray-800',
        'shadow-lg dark:shadow-2xl'
      ),
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props} />
  )
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-semibold text-gray-900 dark:text-white', className)}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-600 dark:text-gray-400 mt-1', className)}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-4 flex items-center gap-3', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';
```

### 工具函数

```typescript
// src/utils/cn.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并 Tailwind CSS 类名
 * 使用 clsx 处理条件类名，tailwind-merge 处理冲突
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 使用示例
// cn('px-4 py-2', 'bg-blue-500', isActive && 'bg-blue-700')
// cn('text-red-500', 'text-blue-500') // 输出: 'text-blue-500'

// src/utils/helpers.ts
/**
 * 生成随机 ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD'): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 深拷贝
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as T;
  }

  if (obj instanceof Object) {
    const copy = {} as T;
    Object.keys(obj).forEach((key) => {
      (copy as any)[key] = deepClone((obj as any)[key]);
    });
    return copy;
  }

  return obj;
}
```

### 布局组件

```typescript
// src/components/layout/Container.tsx
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'lg', children, ...props }, ref) => {
    const sizes = {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full',
    };

    return (
      <div
        ref={ref}
        className={cn('mx-auto px-4 sm:px-6 lg:px-8', sizes[size], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';

// src/components/layout/Header.tsx
import { useState } from 'react';
import { cn } from '@/utils/cn';
import { Container } from './Container';
import { Button } from '../ui/Button';

export interface HeaderProps {
  logo?: React.ReactNode;
  navigation?: Array<{ label: string; href: string }>;
  actions?: React.ReactNode;
  className?: string;
}

export function Header({ logo, navigation, actions, className }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full',
        'bg-white/80 backdrop-blur-lg border-b border-gray-200',
        'dark:bg-gray-900/80 dark:border-gray-800',
        className
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            {logo || (
              <a href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                Logo
              </a>
            )}
          </div>

          {/* Desktop Navigation */}
          {navigation && (
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    'text-gray-700 hover:text-primary-600',
                    'dark:text-gray-300 dark:hover:text-primary-400'
                  )}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {actions}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-gray-700 dark:text-gray-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            {navigation && (
              <nav className="flex flex-col space-y-4">
                {navigation.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-base font-medium text-gray-700 dark:text-gray-300"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            )}
            {actions && (
              <div className="mt-4 flex flex-col space-y-3">
                {actions}
              </div>
            )}
          </div>
        )}
      </Container>
    </header>
  );
}

// src/components/layout/Footer.tsx
import { cn } from '@/utils/cn';
import { Container } from './Container';

export interface FooterProps {
  className?: string;
  children?: React.ReactNode;
}

export function Footer({ className, children }: FooterProps) {
  return (
    <footer
      className={cn(
        'mt-auto py-8',
        'bg-gray-50 border-t border-gray-200',
        'dark:bg-gray-900 dark:border-gray-800',
        className
      )}
    >
      <Container>
        {children || (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} Your Company. All rights reserved.
          </div>
        )}
      </Container>
    </footer>
  );
}
```

## 最佳实践

### 1. 类名组织

```typescript
// 使用 cn 工具函数组合类名
import { cn } from '@/utils/cn';

// 基础样式 + 变体 + 状态
const buttonStyles = cn(
  // 基础样式
  'inline-flex items-center justify-center font-medium rounded-lg',
  'transition-all duration-200',
  
  // 变体样式
  variant === 'primary' && 'bg-primary-600 text-white hover:bg-primary-700',
  variant === 'secondary' && 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  
  // 尺寸样式
  size === 'sm' && 'px-3 py-1.5 text-sm',
  size === 'md' && 'px-4 py-2 text-base',
  
  // 状态样式
  disabled && 'opacity-50 cursor-not-allowed',
  
  // 自定义类名
  className
);

// 使用对象语法
const styles = {
  base: 'rounded-lg border',
  variants: {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-200 text-gray-900',
  },
  sizes: {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
  },
};
```

### 2. 响应式设计

```typescript
// 移动优先的响应式设计
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  xl:grid-cols-4
">
  {/* 内容 */}
</div>

// 响应式字体大小
<h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl">
  响应式标题
</h1>

// 响应式间距
<div className="p-4 md:p-6 lg:p-8">
  {/* 内容 */}
</div>

// 响应式隐藏/显示
<div className="hidden md:block">
  桌面端显示
</div>
<div className="md:hidden">
  移动端显示
</div>

// 响应式布局
<div className="flex flex-col md:flex-row">
  <div className="w-full md:w-1/2">左侧</div>
  <div className="w-full md:w-1/2">右侧</div>
</div>
```

### 3. Dark Mode

```typescript
// 使用 class 策略（推荐）
// 在 html 元素添加 class="dark"

// 暗色模式切换
import { useEffect, useState } from 'react';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 检查系统偏好或本地存储
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    setIsDark(savedTheme === 'dark' || (!savedTheme && prefersDark));
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return [isDark, setIsDark] as const;
}

// Dark Mode 组件
export function DarkModeToggle() {
  const [isDark, setIsDark] = useDarkMode();

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {isDark ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}
```

### 4. 性能优化

```typescript
// 使用 JIT 模式（默认启用）
// Tailwind 会在构建时移除未使用的样式

// 避免动态类名构建
// ❌ 错误：动态类名无法被 PurgeCSS 检测
<div className={`text-${color}-500`}>

// ✅ 正确：使用完整类名
const colorClasses = {
  red: 'text-red-500',
  blue: 'text-blue-500',
  green: 'text-green-500',
};
<div className={colorClasses[color]}>

// 使用 CSS 变量实现动态主题
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
      },
    },
  },
};

// CSS
:root {
  --color-primary: #3b82f6;
}

.dark {
  --color-primary: #60a5fa;
}
```

### 5. 组件抽象

```typescript
// 创建可复用的组件变体
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
  ghost: 'text-gray-700 hover:bg-gray-100',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg',
        'transition-colors duration-200',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

## 常用命令

```bash
# 开发命令
npm run dev              # 启动开发服务器
npm run build            # 生产构建
npm run preview          # 预览构建结果

# Tailwind 相关
npx tailwindcss init     # 初始化 Tailwind 配置
npx tailwindcss -i ./src/input.css -o ./dist/output.css --watch  # 监听模式

# 代码规范
npm run lint             # 运行 ESLint
npm run format           # 运行 Prettier 格式化

# 分析构建大小
npm run build -- --mode analyze
```

## 部署配置

### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    // 生产构建配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['clsx', 'tailwind-merge'],
        },
      },
    },
  },
});
```

### PostCSS 配置

```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: ['default', {
          discardComments: { removeAll: true },
        }],
      },
    } : {}),
  },
};
```

### Package.json 脚本

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\""
  },
  "dependencies": {
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@tailwindcss/forms": "^0.5.0",
    "@tailwindcss/typography": "^0.5.0",
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

### VSCode 配置

```json
// .vscode/settings.json
{
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "editor.quickSuggestions": {
    "strings": true
  },
  "css.validate": false
}

// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

### CI/CD 集成

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
```

## 参考资源

- [Tailwind CSS 官方文档](https://tailwindcss.com/)
- [Tailwind UI](https://tailwindui.com/)
- [Headless UI](https://headlessui.com/)
- [Heroicons](https://heroicons.com/)
- [Tailwind CSS GitHub](https://github.com/tailwindlabs/tailwindcss)
- [Tailwind CSS Cheat Sheet](https://nerdcave.com/tailwind-cheatheet)
