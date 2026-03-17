# Tailwind CSS v4 模板

## 技术栈
- **Tailwind CSS v4** - 最新版本，全新引擎 Oxide
- **Vite** - 快速开发构建工具
- **PostCSS** - CSS 处理器
- **TypeScript** - 类型支持
- **CSS-first Configuration** - 零配置或 CSS 配置
- **更快的构建速度** - 比 v3 快 10 倍+

## 项目结构
```
tailwind-v4-project/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── Navbar.tsx
│   ├── styles/
│   │   ├── main.css
│   │   └── components.css
│   ├── utils/
│   │   └── cn.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── tailwind.config.ts
├── vite.config.ts
├── postcss.config.js
├── tsconfig.json
└── package.json
```

## 代码模式

### 基础配置（CSS-first）
```css
/* src/styles/main.css */
@import "tailwindcss";

/* v4 新语法：在 CSS 中配置 */
@theme {
  /* 自定义颜色 */
  --color-primary: #3b82f6;
  --color-secondary: #10b981;
  --color-accent: #f59e0b;
  
  /* 自定义字体 */
  --font-heading: "Inter", sans-serif;
  --font-body: "Inter", sans-serif;
  
  /* 自定义间距 */
  --spacing-18: 4.5rem;
  --spacing-128: 32rem;
  
  /* 自定义断点 */
  --breakpoint-3xl: 1920px;
  
  /* 自定义动画 */
  --animate-fade-in: fade-in 0.5s ease-in-out;
  --animate-slide-up: slide-up 0.3s ease-out;
}

/* 自定义动画关键帧 */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 自定义工具类 */
@utility container-custom {
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

/* 自定义变体 */
@custom-variant dark (&:where(.dark, .dark *));
@custom-variant hover (&:hover);

/* 基础样式 */
@layer base {
  h1 {
    @apply text-4xl font-bold tracking-tight;
  }
  
  h2 {
    @apply text-3xl font-semibold;
  }
  
  a {
    @apply text-primary hover:underline;
  }
}

/* 组件样式 */
@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors;
  }
  
  .btn-primary {
    @apply btn bg-primary text-white hover:bg-primary/90;
  }
  
  .btn-secondary {
    @apply btn bg-secondary text-white hover:bg-secondary/90;
  }
}
```

### React 组件示例
```typescript
// src/components/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary/90',
        secondary: 'bg-secondary text-white hover:bg-secondary/90',
        outline: 'border border-gray-300 hover:bg-gray-100',
        ghost: 'hover:bg-gray-100',
        danger: 'bg-red-500 text-white hover:bg-red-600',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  isLoading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
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
      )}
      {children}
    </button>
  );
}

// src/components/Card.tsx
import { cn } from '@/utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('rounded-xl border bg-white p-6 shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn('mb-4 flex items-center justify-between', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3 className={cn('text-lg font-semibold', className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn('', className)}>{children}</div>;
}

// src/components/Modal.tsx
import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { cn } from '@/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel
                className={cn(
                  'w-full max-w-md transform rounded-2xl bg-white p-6 align-middle shadow-xl transition-all',
                  className
                )}
              >
                {title && (
                  <DialogTitle as="h3" className="mb-4 text-lg font-semibold">
                    {title}
                  </DialogTitle>
                )}
                {children}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
```

### 响应式设计
```typescript
// src/components/Navbar.tsx
import { useState } from 'react';
import { cn } from '@/utils/cn';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary" />
            <span className="text-xl font-bold">My App</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#" className="text-gray-600 hover:text-primary">
              Home
            </a>
            <a href="#" className="text-gray-600 hover:text-primary">
              About
            </a>
            <a href="#" className="text-gray-600 hover:text-primary">
              Services
            </a>
            <a href="#" className="text-gray-600 hover:text-primary">
              Contact
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-4 md:flex">
            <Button variant="ghost">Sign In</Button>
            <Button variant="primary">Get Started</Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="border-t py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <a href="#" className="text-gray-600 hover:text-primary">
                Home
              </a>
              <a href="#" className="text-gray-600 hover:text-primary">
                About
              </a>
              <a href="#" className="text-gray-600 hover:text-primary">
                Services
              </a>
              <a href="#" className="text-gray-600 hover:text-primary">
                Contact
              </a>
              <div className="mt-4 flex flex-col gap-2">
                <Button variant="outline">Sign In</Button>
                <Button variant="primary">Get Started</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// src/App.tsx
export function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-secondary/10 px-4 py-20">
        <div className="container-custom">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col justify-center">
              <h1 className="mb-6 text-5xl font-bold lg:text-6xl">
                Build amazing apps with{' '}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Tailwind v4
                </span>
              </h1>
              <p className="mb-8 text-lg text-gray-600">
                The fastest way to build modern websites. New Oxide engine makes it 10x faster.
              </p>
              <div className="flex gap-4">
                <Button variant="primary" size="lg">
                  Get Started
                </Button>
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="h-96 w-96 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20">
        <div className="container-custom">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Why choose Tailwind v4?
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 p-3">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </CardHeader>
              <CardTitle>Lightning Fast</CardTitle>
              <CardContent>
                <p className="mt-2 text-gray-600">
                  New Oxide engine provides 10x faster build times compared to v3.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-secondary/10 p-3">
                  <svg className="h-6 w-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
              </CardHeader>
              <CardTitle>CSS-first Config</CardTitle>
              <CardContent>
                <p className="mt-2 text-gray-600">
                  Configure everything in CSS. No more tailwind.config.js needed.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-accent/10 p-3">
                  <svg className="h-6 w-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
              </CardHeader>
              <CardTitle>Smaller Bundle</CardTitle>
              <CardContent>
                <p className="mt-2 text-gray-600">
                  Optimized output with better tree-shaking and smaller file sizes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 px-4 py-20">
        <div className="container-custom text-center">
          <h2 className="mb-6 text-4xl font-bold text-white">
            Ready to get started?
          </h2>
          <p className="mb-8 text-lg text-gray-300">
            Join thousands of developers building with Tailwind v4
          </p>
          <Button variant="primary" size="lg">
            Start Building Today
          </Button>
        </div>
      </section>
    </div>
  );
}
```

### 深色模式
```typescript
// 深色模式切换
import { useEffect, useState } from 'react';

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 检查系统偏好
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches || localStorage.getItem('theme') === 'dark');
  }, []);

  useEffect(() => {
    // 应用主题
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {isDark ? (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

/* main.css - 深色模式样式 */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }

  body {
    @apply bg-[hsl(var(--background))] text-[hsl(var(--foreground))];
  }
}
```

### 工具函数
```typescript
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 使用示例
<Button className={cn('my-custom-class', isLoading && 'opacity-50')}>
  Click me
</Button>
```

### 自定义变体
```css
/* src/styles/main.css */

/* 自定义变体 */
@custom-variant dark (&:where(.dark, .dark *));
@custom-variant hover (&:hover);
@custom-variant focus (&:focus);
@custom-variant active (&:active);
@custom-variant disabled (&:disabled);
@custom-variant first (&:first-child);
@custom-variant last (&:last-child);
@custom-variant odd (&:nth-child(odd));
@custom-variant even (&:nth-child(even));

/* 组合变体 */
@custom-variant focus-visible (&:focus-visible);
@custom-variant focus-within (&:focus-within);

/* 使用 */
/*
  <div class="dark:bg-gray-900 hover:bg-blue-50 focus:ring-2">
*/
```

## 最佳实践

### 1. 使用 class-variance-authority (CVA)
```typescript
// 定义组件变体
const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white',
        secondary: 'bg-secondary text-white',
        outline: 'border border-current',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);
```

### 2. 抽象组件
```typescript
// 创建可复用的基础组件
// components/ui/Input.tsx
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
```

### 3. 性能优化
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // v4 的 Vite 插件
  ],
  build: {
    // 生产优化
    cssMinify: true,
  },
});
```

## 常用命令

### 开发
```bash
# 安装 Tailwind CSS v4
npm install tailwindcss@next @tailwindcss/vite@next

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 工具
```bash
# 安装辅助工具
npm install -D clsx tailwind-merge class-variance-authority

# 安装图标
npm install lucide-react

# 安装 UI 组件库（可选）
npm install @headlessui/react @radix-ui/react-dialog
```

## 部署配置

### package.json
```json
{
  "name": "tailwind-v4-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0-alpha.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^4.0.0-alpha.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Dockerfile
```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### GitHub Actions
```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### PostCSS 配置（可选）
```javascript
// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```
