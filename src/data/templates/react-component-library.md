# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: React Component Library
**Type**: UI Component Library
**Tech Stack**: React 19 + TypeScript + Storybook
**Goal**: Production-ready, accessible, and customizable React component library

---

## Tech Stack

### Core
- **Framework**: React 19
- **Language**: TypeScript 5.9+
- **Build Tool**: Vite
- **Package Manager**: pnpm

### Development
- **Documentation**: Storybook 8
- **Testing**: Vitest + Testing Library + React Testing Library
- **Linting**: ESLint + Prettier
- **CSS**: Tailwind CSS / CSS-in-JS (choose one)

### Quality
- **Type Checking**: TypeScript strict mode
- **Accessibility**: axe-core
- **Bundle Analysis**: rollup-plugin-visualizer
- **CI/CD**: GitHub Actions

---

## Component Standards

### Component Structure
```typescript
// components/button/Button.tsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', disabled, children, className, onClick }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'base-button-classes',
          variant && `button-${variant}`,
          size && `button-${size}`,
          className
        )}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
```

### Required Files per Component
```
components/
├── component-name/
│   ├── ComponentName.tsx    # Component implementation
│   ├── ComponentName.test.tsx # Unit tests
│   ├── ComponentName.stories.tsx # Storybook stories
│   └── index.ts              # Export
```

### TypeScript Guidelines
- Always export props interfaces
- Use `forwardRef` for components that need ref forwarding
- Use proper generic types
- Enable strict mode

```typescript
// ✅ Good
export interface SelectProps<T> {
  options: T[]
  value?: T
  onChange: (value: T) => void
  labelKey: keyof T
}

export function Select<T>({ options, value, onChange, labelKey }: SelectProps<T>) {
  // ...
}

// ❌ Bad
export function Select({ options, value, onChange, labelKey }: any) {
  // ...
}
```

---

## Accessibility Standards

### ARIA Requirements
- All interactive components must be keyboard accessible
- Use semantic HTML elements
- Add proper ARIA labels
- Implement focus management
- Support screen readers

```typescript
// ✅ Accessible Modal
export function Modal({ isOpen, onClose, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Focus trap
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements?.[0] as HTMLElement
      firstElement?.focus()
    }
  }, [isOpen])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <h2 id="modal-title">Modal Title</h2>
      {children}
      <button onClick={onClose} aria-label="Close modal">
        ×
      </button>
    </div>
  )
}
```

### Keyboard Navigation
- Tab: Navigate forward
- Shift + Tab: Navigate backward
- Enter/Space: Activate buttons and links
- Escape: Close modals and dropdowns

---

## Testing Standards

### Unit Tests
- Test all component variants
- Test user interactions
- Test edge cases
- Use `@testing-library/user-event`

```typescript
// Button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### Storybook Stories
```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
}
```

---

## Build & Publishing

### Build Configuration
- Use `library` mode in Vite
- Output ESM and CJS formats
- Include TypeScript declaration files
- Tree-shakeable exports

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'MyComponentLibrary',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
  plugins: [dts()],
})
```

### Version Management
- Follow semantic versioning (SemVer)
- Use `changeset` for version management
- Create CHANGELOG.md
- Tag releases in Git

---

## Common Commands

### Development
```bash
pnpm dev          # Start dev server
pnpm storybook    # Start Storybook
pnpm build        # Build library
pnpm test         # Run tests
pnpm lint         # Run ESLint
pnpm type-check   # TypeScript check
```

### Publishing
```bash
pnpm build        # Build library
pnpm publish      # Publish to npm
```

---

## Important Rules

### ✅ Do
- Use TypeScript strict mode
- Write tests for all components
- Add Storybook stories
- Ensure accessibility
- Document props with JSDoc
- Use semantic HTML
- Support dark mode
- Make components customizable

### ❌ Don't
- Don't use `any` type
- Don't skip accessibility
- Don't forget tests
- Don't hardcode styles
- Don't ignore TypeScript errors
- Don't break API changes without major version bump
- Don't forget to update documentation
- Don't create components larger than 200 lines

---

## Best Practices

### Component Composition
```typescript
// ✅ Good - Composable
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// ❌ Bad - Props explosion
<Card
  headerTitle="Title"
  headerSubtitle="Subtitle"
  content="Content"
  footerAction="Action"
/>
```

### Controlled Components
```typescript
// ✅ Good - Controlled + Uncontrolled
export function Input({ value, defaultValue, onChange, ...props }: InputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)

  const finalValue = value !== undefined ? value : internalValue
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e)
    }
    if (value === undefined) {
      setInternalValue(e.target.value)
    }
  }

  return <input value={finalValue} onChange={handleChange} {...props} />
}
```

### Performance
- Use `React.memo` for expensive components
- Implement proper dependency arrays in `useEffect` and `useMemo`
- Lazy load heavy components
- Code split by route

---

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "lint": "eslint .",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit"
  }
}
```

---

**Last Updated**: 2026-03-01
