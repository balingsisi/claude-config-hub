# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Turborepo Monorepo
**Type**: Monorepo with Multiple Packages
**Tech Stack**: Turborepo + pnpm + TypeScript
**Goal**: Scalable monorepo for shared code and multiple applications

---

## Tech Stack

### Core
- **Monorepo Tool**: Turborepo 1.11+
- **Package Manager**: pnpm 8+
- **Language**: TypeScript 5.3+
- **Build System**: Turborepo Remote Cache (optional)

### Development
- **Linting**: ESLint (shared config)
- **Formatting**: Prettier (shared config)
- **Testing**: Jest / Vitest (shared config)
- **Versioning**: Changesets

---

## Project Structure

```
my-monorepo/
├── apps/                      # Applications
│   ├── web/                   # Next.js web app
│   │   ├── src/
│   │   ├── package.json
│   │   ├── next.config.js
│   │   └── tsconfig.json
│   ├── docs/                  # Documentation site
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── mobile/                # React Native app (optional)
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── packages/                  # Shared packages
│   ├── ui/                    # Shared UI components
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   └── styles/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── config/                # Shared configurations
│   │   ├── src/
│   │   │   ├── eslint.js
│   │   │   ├── typescript/
│   │   │   └── prettier.js
│   │   └── package.json
│   ├── utils/                 # Shared utilities
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── date.ts
│   │   │   └── string.ts
│   │   └── package.json
│   └── types/                 # Shared TypeScript types
│       ├── src/
│       │   ├── index.ts
│       │   └── api.ts
│       └── package.json
├── tooling/                   # Development tools
│   └── scripts/
│       └── setup.sh
├── turbo.json                 # Turborepo configuration
├── pnpm-workspace.yaml        # pnpm workspace config
├── package.json               # Root package.json
└── .gitignore
```

---

## Coding Rules

### 1. Package Dependencies

**Use workspace protocol for internal packages:**

```json
// apps/web/package.json
{
  "name": "@my-org/web",
  "dependencies": {
    "@my-org/ui": "workspace:*",
    "@my-org/utils": "workspace:*",
    "@my-org/types": "workspace:*",
    "next": "^14.0.0",
    "react": "^18.2.0"
  }
}
```

**Version internal packages appropriately:**

```json
// packages/ui/package.json
{
  "name": "@my-org/ui",
  "version": "0.0.1",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./styles.css": "./dist/styles.css"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "dev": "tsup src/index.ts --format esm,cjs --watch --dts"
  }
}
```

### 2. Turborepo Pipeline

**Define tasks and dependencies:**

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

### 3. Shared TypeScript Config

**Create base config in packages/config:**

```json
// packages/config/src/typescript/base.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Default",
  "compilerOptions": {
    "composite": false,
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "inlineSources": false,
    "isolatedModules": true,
    "moduleResolution": "node",
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "preserveWatchOutput": true,
    "skipLibCheck": true,
    "strict": true
  },
  "exclude": ["node_modules"]
}

// packages/config/src/typescript/nextjs.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Next.js",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "incremental": true,
    "esModuleInterop": true,
    "module": "esnext",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["src", "next-env.d.ts"],
  "exclude": ["node_modules"]
}

// apps/web/tsconfig.json
{
  "extends": "@my-org/config/typescript/nextjs.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 4. Shared ESLint Config

**Create reusable ESLint config:**

```javascript
// packages/config/src/eslint/index.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
};

// apps/web/.eslintrc.js
module.exports = {
  root: true,
  extends: ['@my-org/config/eslint'],
  rules: {
    // App-specific overrides
  },
};
```

### 5. Shared UI Components

**Create reusable component library:**

```typescript
// packages/ui/src/components/Button.tsx
import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  ghost: 'bg-transparent hover:bg-gray-100',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

// packages/ui/src/index.ts
export * from './components/Button';
export * from './components/Input';
export * from './utils/cn';
```

### 6. Utility Functions

**Create shared utilities:**

```typescript
// packages/utils/src/date.ts
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

export function formatDate(date: Date | string, pattern = 'PPP'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, pattern, { locale: zhCN });
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

// packages/utils/src/index.ts
export * from './date';
export * from './string';
```

---

## Turborepo Commands

```bash
# Run dev server for all apps
pnpm dev

# Run dev for specific app
pnpm --filter @my-org/web dev

# Build all packages and apps
pnpm build

# Build specific app
pnpm --filter @my-org/web build

# Run linting
pnpm lint

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Add dependency to specific package
pnpm --filter @my-org/web add axios

# Add dev dependency to root
pnpm add -w -D typescript

# Clean all build artifacts
pnpm clean

# Generate changeset
pnpm changeset

# Version packages
pnpm changeset version

# Publish packages
pnpm release
```

---

## Dependency Management

### Workspace Dependencies

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tooling/*'
```

### Adding Dependencies

```bash
# Add to specific app/package
pnpm --filter @my-org/web add react-router-dom

# Add to multiple packages
pnpm --filter "@my-org/*" add -D vitest

# Add to root (shared dev dependency)
pnpm add -w -D prettier
```

---

## Version Management with Changesets

### Creating a Changeset

```bash
pnpm changeset
```

This prompts for:
1. Package to bump
2. Type of change (patch/minor/major)
3. Description

### Example Changeset

```markdown
<!-- .changeset/cool-feature.md -->
---
"@my-org/ui": minor
---

Added new Button variants
```

### Version and Publish

```bash
# Bump versions based on changesets
pnpm changeset version

# Publish to npm
pnpm changeset publish
```

---

## Performance Tips

### 1. Use Remote Cache
```bash
# Enable Turborepo remote cache
turbo login
turbo link
```

### 2. Parallelize Tasks
```json
// turbo.json
{
  "pipeline": {
    "test": {
      "dependsOn": ["^build"],
      "outputs": [],
      "inputs": ["src/**/*.ts", "test/**/*.ts"]
    }
  }
}
```

### 3. Prune Dependencies
```bash
# Install only necessary dependencies
pnpm install --prod
```

---

## Common Commands

```bash
# Start development
pnpm dev

# Build everything
pnpm build

# Run all tests
pnpm test

# Lint all packages
pnpm lint

# Format all files
pnpm format

# Check for circular dependencies
npx madge --circular apps packages

# Analyze bundle size
pnpm --filter @my-org/web analyze

# Update all dependencies
pnpm update -r -i

# Clean install
pnpm install --force
```

---

## Root package.json

```json
{
  "name": "my-monorepo",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "clean": "turbo run clean && rm -rf node_modules",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "turbo run build --filter=@my-org/* && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.1",
    "prettier": "^3.2.0",
    "turbo": "^1.11.0"
  },
  "packageManager": "pnpm@8.14.0",
  "engines": {
    "node": ">=18"
  }
}
```

---

## Deployment Checklist

- [ ] Run full build locally: `pnpm build`
- [ ] Run all tests: `pnpm test`
- [ ] Check for TypeScript errors: `pnpm typecheck`
- [ ] Verify no circular dependencies
- [ ] Update changelog with changesets
- [ ] Bump versions if needed
- [ ] Deploy apps in correct order (shared packages first)
