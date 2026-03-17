# Tailwind Animate 动画模板

## 技术栈

- **tailwindcss-animate**: Tailwind CSS 动画插件
- **Tailwind CSS**: v3.4+
- **Framer Motion**: 复杂动画（可选）
- **TypeScript**: 类型支持
- **React/Vue/Next.js**: 框架支持

## 项目结构

```
project/
├── src/
│   ├── components/
│   │   ├── animations/
│   │   │   ├── FadeIn.tsx
│   │   │   ├── SlideIn.tsx
│   │   │   ├── ScaleIn.tsx
│   │   │   └── AnimatedList.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── modal.tsx
│   ├── hooks/
│   │   ├── useAnimation.ts
│   │   └── useInView.ts
│   ├── lib/
│   │   └── animations.ts
│   ├── styles/
│   │   └── globals.css
│   └── app/
│       └── page.tsx
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### 1. Tailwind 配置

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out',
        'slide-in-from-top': 'slideInFromTop 0.5s ease-out',
        'slide-in-from-bottom': 'slideInFromBottom 0.5s ease-out',
        'slide-in-from-left': 'slideInFromLeft 0.5s ease-out',
        'slide-in-from-right': 'slideInFromRight 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'scale-out': 'scaleOut 0.3s ease-in',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideInFromTop: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInFromBottom: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInFromLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInFromRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      animationDelay: {
        '0': '0ms',
        '150': '150ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
      animationDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
        '4000': '4000ms',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### 2. 全局样式

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .animation-delay-150 {
    animation-delay: 150ms;
  }
  
  .animation-delay-300 {
    animation-delay: 300ms;
  }
  
  .animation-delay-500 {
    animation-delay: 500ms;
  }
  
  .animation-fill-forwards {
    animation-fill-mode: forwards;
  }
  
  .animation-fill-backwards {
    animation-fill-mode: backwards;
  }
  
  .animation-fill-both {
    animation-fill-mode: both;
  }
}

/* 进入和离开动画 */
@layer components {
  .animate-enter {
    @apply animate-in fade-in slide-in-from-bottom-4 duration-300;
  }
  
  .animate-leave {
    @apply animate-out fade-out slide-out-to-bottom-4 duration-300;
  }
  
  .animate-enter-scale {
    @apply animate-in zoom-in-95 fade-in duration-200;
  }
  
  .animate-leave-scale {
    @apply animate-out zoom-out-95 fade-out duration-200;
  }
}
```

### 3. FadeIn 组件

```typescript
// src/components/animations/FadeIn.tsx
import { type ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  once?: boolean;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 500,
  className,
  direction = 'up',
  distance = 20,
  once = true,
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, once]);

  const directionStyles = {
    up: `translate-y-${distance}`,
    down: `-translate-y-${distance}`,
    left: `translate-x-${distance}`,
    right: `-translate-x-${distance}`,
    none: '',
  };

  return (
    <div
      ref={setRef}
      className={cn(
        'transition-all',
        isVisible
          ? 'opacity-100 translate-x-0 translate-y-0'
          : `opacity-0 ${directionStyles[direction]}`,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
```

### 4. SlideIn 组件

```typescript
// src/components/animations/SlideIn.tsx
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SlideInProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  delay?: number;
  duration?: number;
  className?: string;
}

export function SlideIn({
  children,
  direction = 'left',
  delay = 0,
  duration = 500,
  className,
}: SlideInProps) {
  const animationClasses = {
    left: 'animate-slide-in-from-left',
    right: 'animate-slide-in-from-right',
    top: 'animate-slide-in-from-top',
    bottom: 'animate-slide-in-from-bottom',
  };

  return (
    <div
      className={cn(animationClasses[direction], className)}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}
```

### 5. ScaleIn 组件

```typescript
// src/components/animations/ScaleIn.tsx
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  initialScale?: number;
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 300,
  className,
  initialScale = 0.95,
}: ScaleInProps) {
  return (
    <div
      className={cn('animate-scale-in', className)}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
        ['--initial-scale' as string]: initialScale,
      }}
    >
      {children}
    </div>
  );
}
```

### 6. AnimatedList 组件

```typescript
// src/components/animations/AnimatedList.tsx
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
  animation?: 'fade-in' | 'slide-in-from-bottom' | 'scale-in';
}

export function AnimatedList({
  children,
  className,
  staggerDelay = 100,
  animation = 'fade-in',
}: AnimatedListProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {children.map((child, index) => (
        <div
          key={index}
          className={cn(`animate-${animation}`)}
          style={{
            animationDelay: `${index * staggerDelay}ms`,
            animationFillMode: 'both',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
```

### 7. 动画按钮

```typescript
// src/components/ui/button.tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', loading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-md font-medium',
          'transition-all duration-200 ease-in-out',
          'hover:scale-105 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Variants
          variant === 'default' && 'bg-blue-600 text-white hover:bg-blue-700',
          variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700',
          variant === 'outline' && 'border-2 border-gray-300 hover:bg-gray-50',
          variant === 'ghost' && 'hover:bg-gray-100',
          // Sizes
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2 text-base',
          size === 'lg' && 'px-6 py-3 text-lg',
          className
        )}
        disabled={loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
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
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### 8. 动画卡片

```typescript
// src/components/ui/card.tsx
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = true }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white shadow-sm',
        'transition-all duration-300 ease-in-out',
        hover && 'hover:shadow-lg hover:-translate-y-1',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-6 border-b', className)}>{children}</div>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}
```

### 9. 动画模态框

```typescript
// src/components/ui/modal.tsx
import { Fragment, type ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'w-full max-w-md transform overflow-hidden rounded-2xl',
                  'bg-white p-6 shadow-xl transition-all',
                  className
                )}
              >
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
```

### 10. 自定义 Hook

```typescript
// src/hooks/useAnimation.ts
import { useState, useEffect } from 'react';

export function useAnimation(
  duration: number = 300,
  delay: number = 0
) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const startAnimation = () => {
    setIsAnimating(true);
    setIsComplete(false);
  };

  useEffect(() => {
    if (!isAnimating) return;

    const timer = setTimeout(() => {
      setIsComplete(true);
      setIsAnimating(false);
    }, duration + delay);

    return () => clearTimeout(timer);
  }, [isAnimating, duration, delay]);

  return {
    isAnimating,
    isComplete,
    startAnimation,
    animationClass: isAnimating ? 'animate-shake' : '',
  };
}

// src/hooks/useInView.ts
import { useEffect, useState, useRef, type RefObject } from 'react';

export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = {}
): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return [ref as RefObject<T>, isInView];
}
```

### 11. 页面示例

```typescript
// src/app/page.tsx
import { FadeIn } from '@/components/animations/FadeIn';
import { SlideIn } from '@/components/animations/SlideIn';
import { AnimatedList } from '@/components/animations/AnimatedList';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const features = [
    { title: 'Feature 1', description: 'Description for feature 1' },
    { title: 'Feature 2', description: 'Description for feature 2' },
    { title: 'Feature 3', description: 'Description for feature 3' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Hero Section */}
        <FadeIn>
          <section className="text-center space-y-4">
            <h1 className="text-5xl font-bold animate-fade-in">
              Welcome to Our App
            </h1>
            <p className="text-xl text-gray-600 animate-fade-in animation-delay-150">
              Beautiful animations powered by Tailwind CSS
            </p>
            <Button className="animate-scale-in animation-delay-300">
              Get Started
            </Button>
          </section>
        </FadeIn>

        {/* Features Section */}
        <AnimatedList
          animation="slide-in-from-bottom"
          staggerDelay={150}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </AnimatedList>

        {/* Slide In Section */}
        <div className="grid grid-cols-2 gap-8">
          <SlideIn direction="left">
            <Card>
              <CardContent>
                <h3 className="text-2xl font-bold mb-4">Left Slide</h3>
                <p className="text-gray-600">
                  This content slides in from the left.
                </p>
              </CardContent>
            </Card>
          </SlideIn>

          <SlideIn direction="right" delay={200}>
            <Card>
              <CardContent>
                <h3 className="text-2xl font-bold mb-4">Right Slide</h3>
                <p className="text-gray-600">
                  This content slides in from the right.
                </p>
              </CardContent>
            </Card>
          </SlideIn>
        </div>
      </div>
    </div>
  );
}
```

## 最佳实践

### 1. 性能优化

```typescript
// 使用 will-change 优化 GPU 加速
.animate-optimized {
  will-change: transform, opacity;
  transform: translateZ(0);
}

// 避免过度使用动画
.animated-element {
  animation: fadeIn 0.3s ease-out;
  animation-fill-mode: forwards;
}
```

### 2. 响应式动画

```typescript
// 根据设备性能调整动画
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

function AnimatedComponent() {
  if (prefersReducedMotion) {
    return <div>{/* 无动画版本 */}</div>;
  }

  return <div className="animate-fade-in">{/* 动画版本 */}</div>;
}
```

### 3. 动画组合

```typescript
// 组合多个动画
<div className="animate-fade-in animate-slide-in-from-bottom">
  Combined animations
</div>

// 使用 animation-composition (CSS)
<div className="animate-fade-in" style={{ animationComposition: 'add' }}>
  Composited animation
</div>
```

### 4. 条件动画

```typescript
import { useState } from 'react';

function ConditionalAnimation() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={`
        transition-all duration-300
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      Conditional content
    </div>
  );
}
```

### 5. 交错动画

```typescript
// 交错动画列表
function StaggeredList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={index}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
```

## 常用命令

```bash
# 安装依赖
npm install tailwindcss-animate

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## Package.json

```json
{
  "dependencies": {
    "tailwindcss-animate": "^1.0.7",
    "@headlessui/react": "^2.0.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35"
  }
}
```

## 资源

- [Tailwind CSS Animate](https://github.com/jamiebuilds/tailwindcss-animate)
- [Tailwind CSS Animation Docs](https://tailwindcss.com/docs/animation)
- [CSS Animations Performance](https://web.dev/animations/)
- [Framer Motion](https://www.framer.com/motion/)
- [Headless UI Transitions](https://headlessui.com/react/transition)
