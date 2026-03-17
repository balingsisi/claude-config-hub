# DaisyUI Template

## Project Overview

DaisyUI is a Tailwind CSS component library that provides beautiful, semantic, and accessible UI components. It offers a clean and modern design system with excellent dark mode support, making it perfect for rapid prototyping and production applications.

## Tech Stack

- **Core**: DaisyUI 4.x
- **Styling**: Tailwind CSS 3.x
- **Language**: TypeScript
- **Framework**: React / Vue / Svelte / HTML
- **Build Tool**: Vite
- **Icons**: Heroicons / Lucide
- **Testing**: Vitest, Testing Library

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── ui/                    # Reusable UI components
│   │   │   ├── button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   └── index.ts
│   │   │   ├── card/
│   │   │   │   ├── Card.tsx
│   │   │   │   └── index.ts
│   │   │   ├── modal/
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── index.ts
│   │   │   └── navbar/
│   │   │       ├── Navbar.tsx
│   │   │       └── index.ts
│   │   ├── layout/
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── features/
│   │       ├── auth/
│   │       │   ├── LoginForm.tsx
│   │       │   └── RegisterForm.tsx
│   │       └── dashboard/
│   │           └── Dashboard.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   └── Contact.tsx
│   ├── hooks/
│   │   ├── useTheme.ts
│   │   └── useLocalStorage.ts
│   ├── utils/
│   │   ├── cn.ts                   # Class names utility
│   │   └── helpers.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── public/
│   └── favicon.ico
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
├── tsconfig.json
├── package.json
└── index.html
```

## Key Patterns

### 1. Tailwind Configuration with DaisyUI

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#570df8',
        secondary: '#f000b8',
        accent: '#37cdbe',
        neutral: '#3d4451',
        'base-100': '#ffffff',
        info: '#0ab4ff',
        success: '#36d399',
        warning: '#fcb717',
        error: '#f87272',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          ...require('daisyui/src/theming/themes')['light'],
          primary: '#570df8',
          secondary: '#f000b8',
          accent: '#37cdbe',
          neutral: '#3d4451',
          'base-100': '#ffffff',
          '--rounded-box': '1rem',
          '--rounded-btn': '0.5rem',
        },
        dark: {
          ...require('daisyui/src/theming/themes')['dark'],
          primary: '#c084fc',
          secondary: '#f472b6',
          accent: '#2dd4bf',
          neutral: '#1f2937',
          'base-100': '#111827',
        },
      },
    ],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
  },
}
```

### 2. Global Styles

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
  }

  body {
    @apply bg-base-100 text-base-content;
  }
}

@layer components {
  .btn-gradient {
    @apply bg-gradient-to-r from-primary to-secondary text-white hover:from-secondary hover:to-primary;
  }
}
```

### 3. Theme Toggle Hook

```typescript
// src/hooks/useTheme.ts
import { useEffect, useState } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')

    setTheme(initialTheme)
    document.documentElement.setAttribute('data-theme', initialTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return { theme, toggleTheme }
}
```

### 4. Class Names Utility

```typescript
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 5. Button Component

```typescript
// src/components/ui/button/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'link'
  size?: 'lg' | 'md' | 'sm' | 'xs'
  loading?: boolean
  outline?: boolean
  wide?: boolean
  block?: boolean
  circle?: boolean
  square?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      outline = false,
      wide = false,
      block = false,
      circle = false,
      square = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      accent: 'btn-accent',
      ghost: 'btn-ghost',
      link: 'btn-link',
    }

    const sizeClasses = {
      lg: 'btn-lg',
      md: 'btn-md',
      sm: 'btn-sm',
      xs: 'btn-xs',
    }

    return (
      <button
        ref={ref}
        className={cn(
          'btn',
          variantClasses[variant],
          sizeClasses[size],
          outline && 'btn-outline',
          wide && 'btn-wide',
          block && 'btn-block',
          circle && 'btn-circle',
          square && 'btn-square',
          loading && 'loading',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <span className="loading loading-spinner"></span> : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
```

### 6. Card Component

```typescript
// src/components/ui/card/Card.tsx
import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  bordered?: boolean
  compact?: boolean
  side?: boolean
  imageFull?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, bordered = true, compact = false, side = false, imageFull = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'card',
          'bg-base-100',
          'shadow-xl',
          bordered && 'card-bordered',
          compact && 'card-compact',
          side && 'card-side',
          imageFull && 'image-full',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h2 ref={ref} className={cn('card-title', className)} {...props}>
        {children}
      </h2>
    )
  }
)

CardTitle.displayName = 'CardTitle'

export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('card-body', className)} {...props}>
        {children}
      </div>
    )
  }
)

CardBody.displayName = 'CardBody'

export const CardActions = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('card-actions', className)} {...props}>
        {children}
      </div>
    )
  }
)

CardActions.displayName = 'CardActions'
```

### 7. Modal Component

```typescript
// src/components/ui/modal/Modal.tsx
import { HTMLAttributes, forwardRef, useEffect } from 'react'
import { cn } from '@/utils/cn'

export interface ModalProps extends HTMLAttributes<HTMLDialogElement> {
  open?: boolean
  onClose?: () => void
}

export const Modal = forwardRef<HTMLDialogElement, ModalProps>(
  ({ className, open = false, onClose, children, ...props }, ref) => {
    useEffect(() => {
      const dialog = ref as React.RefObject<HTMLDialogElement>
      if (dialog.current) {
        if (open) {
          dialog.current.showModal()
        } else {
          dialog.current.close()
        }
      }
    }, [open, ref])

    return (
      <dialog ref={ref} className={cn('modal', className)} {...props}>
        <div className="modal-box">{children}</div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={onClose}>close</button>
        </form>
      </dialog>
    )
  }
)

Modal.displayName = 'Modal'
```

### 8. Navbar Component

```typescript
// src/components/ui/navbar/Navbar.tsx
import { useState } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/utils/cn'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </label>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li>
              <a>Home</a>
            </li>
            <li>
              <a>About</a>
            </li>
            <li>
              <a>Contact</a>
            </li>
          </ul>
        </div>
        <a className="btn btn-ghost text-xl">daisyUI</a>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <a>Home</a>
          </li>
          <li>
            <a>About</a>
          </li>
          <li>
            <a>Contact</a>
          </li>
        </ul>
      </div>
      <div className="navbar-end">
        <label className="swap swap-rotate mr-4">
          <input type="checkbox" onChange={toggleTheme} checked={theme === 'dark'} />
          <svg className="swap-on fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
          </svg>
          <svg className="swap-off fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
          </svg>
        </label>
        <button className="btn btn-primary">Get Started</button>
      </div>
    </div>
  )
}
```

### 9. Login Form

```typescript
// src/components/features/auth/LoginForm.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardTitle, CardActions } from '@/components/ui/card'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log({ email, password })
  }

  return (
    <Card className="w-96 mx-auto mt-10">
      <CardBody>
        <CardTitle className="text-center">Login</CardTitle>

        <form onSubmit={handleSubmit} className="form-control w-full">
          <label className="label">
            <span className="label-text">Email</span>
          </label>
          <input
            type="email"
            placeholder="email@example.com"
            className="input input-bordered w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="label">
            <span className="label-text">Password</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="input input-bordered w-full pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <label className="label">
            <a href="#" className="label-text-alt link link-hover">
              Forgot password?
            </a>
          </label>

          <CardActions className="mt-4">
            <Button type="submit" block>
              Login
            </Button>
          </CardActions>
        </form>

        <div className="divider mt-4">OR</div>

        <Button variant="outline" block className="mb-2">
          Continue with Google
        </Button>
        <Button variant="outline" block>
          Continue with GitHub
        </Button>

        <p className="text-center mt-4 text-sm">
          Don't have an account?{' '}
          <a href="#" className="link link-primary">
            Sign up
          </a>
        </p>
      </CardBody>
    </Card>
  )
}
```

## Best Practices

1. **Semantic Classes**: Use DaisyUI's semantic class names (btn-primary, card, etc.)
2. **Theme System**: Leverage built-in dark mode and custom themes
3. **Accessibility**: DaisyUI provides accessible components out of the box
4. **Customization**: Extend themes with Tailwind's extend feature
5. **Component Composition**: Build complex components from DaisyUI primitives
6. **Responsive Design**: Use responsive modifiers (lg:, md:, sm:)
7. **Utility Classes**: Combine DaisyUI with Tailwind utilities for fine-tuning

## Common Commands

```bash
# Development
pnpm dev                   # Start dev server
pnpm build                 # Build for production
pnpm preview               # Preview production build

# Testing
pnpm test                  # Run tests
pnpm test:watch            # Watch mode
pnpm test:coverage         # Coverage report

# Linting
pnpm lint                  # Run ESLint
pnpm lint:fix              # Fix issues

# Type checking
pnpm type-check            # TypeScript check
```

## Deployment

### Vercel

```bash
# Build command
pnpm build

# Output directory
dist
```

### Netlify

```toml
# netlify.toml
[build]
  command = "pnpm build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Resources

- [DaisyUI Documentation](https://daisyui.com/)
- [DaisyUI Components](https://daisyui.com/components/)
- [DaisyUI Themes](https://daisyui.com/docs/themes/)
- [Tailwind CSS](https://tailwindcss.com/)
- [DaisyUI GitHub](https://github.com/saadeghi/daisyui)
