# Nx Monorepo Template

## Project Overview

Smart, extensible monorepo toolkit with first-class support for React, Angular, Node.js, and more. Nx provides powerful dependency graph visualization, affected command optimization, and consistent code generation across multiple frameworks.

## Tech Stack

- **Core**: Nx 19.x
- **Package Manager**: pnpm / npm / yarn
- **Language**: TypeScript
- **Frameworks**: React, Angular, Node.js, NestJS, Next.js
- **Testing**: Jest, Cypress, Playwright
- **CI**: Nx Cloud / GitHub Actions

## Project Structure

```
├── apps/                         # Applications
│   ├── web/                      # React web app
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── pages/
│   │   │   │   └── app.tsx
│   │   │   ├── assets/
│   │   │   ├── environments/
│   │   │   ├── index.html
│   │   │   └── main.tsx
│   │   ├── project.json
│   │   ├── tsconfig.app.json
│   │   └── vite.config.ts
│   ├── api/                      # Node.js API
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   └── modules/
│   │   │   ├── environments/
│   │   │   └── main.ts
│   │   ├── project.json
│   │   └── tsconfig.app.json
│   ├── admin/                    # Angular admin app
│   │   ├── src/
│   │   │   ├── app/
│   │   │   └── main.ts
│   │   └── project.json
│   └── web-e2e/                  # E2E tests
│       ├── src/
│       │   ├── e2e/
│       │   └── support/
│       └── project.json
├── libs/                         # Shared libraries
│   ├── ui/                       # Shared UI components
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── button/
│   │   │   │   ├── card/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── project.json
│   │   └── tsconfig.lib.json
│   ├── api-interfaces/           # Shared types
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   └── user.interface.ts
│   │   │   └── index.ts
│   │   └── project.json
│   ├── utils/                    # Shared utilities
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── date.ts
│   │   │   │   └── validation.ts
│   │   │   └── index.ts
│   │   └── project.json
│   └── data-access/              # Data layer
│       ├── src/
│       │   ├── lib/
│       │   │   ├── api.service.ts
│       │   │   └── auth.service.ts
│       │   └── index.ts
│       └── project.json
├── tools/                        # Custom scripts
│   └── scripts/
│       └── build-stats.ts
├── nx.json                       # Nx configuration
├── workspace.json                # Workspace config (optional)
├── tsconfig.base.json            # Base TypeScript config
├── package.json
└── pnpm-workspace.yaml
```

## Key Patterns

### 1. Nx Configuration

```json
// nx.json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "defaultBase": "main",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "sharedGlobals": [],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/.eslintrc.json"
    ]
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "cache": true
    },
    "test": {
      "inputs": ["default", "^production"],
      "cache": true
    },
    "lint": {
      "inputs": ["default", "^production"],
      "cache": true
    }
  },
  "plugins": [
    {
      "plugin": "@nx/vite/plugin",
      "options": {
        "buildTargetName": "build",
        "testTargetName": "test",
        "serveTargetName": "serve",
        "previewTargetName": "preview"
      }
    },
    {
      "plugin": "@nx/eslint/plugin",
      "options": {
        "targetName": "lint"
      }
    }
  ],
  "generators": {
    "@nx/react": {
      "application": {
        "style": "tailwind",
        "linter": "eslint",
        "bundler": "vite"
      },
      "library": {
        "style": "tailwind",
        "linter": "eslint"
      }
    }
  }
}
```

### 2. Project Configuration

```json
// apps/web/project.json
{
  "name": "web",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/web/src",
  "projectType": "application",
  "tags": ["type:app", "scope:web"],
  "targets": {
    "build": {
      "executor": "@nx/vite:build",
      "outputs": ["{workspaceRoot}/dist/apps/web"],
      "defaultConfiguration": "production",
      "options": {
        "outputPath": "dist/apps/web"
      },
      "configurations": {
        "development": {
          "mode": "development"
        },
        "production": {
          "mode": "production"
        }
      }
    },
    "serve": {
      "executor": "@nx/vite:dev-server",
      "defaultConfiguration": "development",
      "options": {
        "buildTarget": "web:build"
      },
      "configurations": {
        "development": {
          "buildTarget": "web:build:development",
          "hmr": true
        },
        "production": {
          "buildTarget": "web:build:production",
          "hmr": false
        }
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "outputs": ["{workspaceRoot}/coverage/apps/web"],
      "options": {
        "passWithNoTests": true
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "outputs": ["{options.outputFile}"]
    }
  }
}
```

### 3. Shared UI Library

```tsx
// libs/ui/src/lib/button/button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'rounded font-medium transition-colors'
    
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      ghost: 'bg-transparent hover:bg-gray-100',
    }
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
```

```tsx
// libs/ui/src/index.ts
export * from './lib/button/button'
export * from './lib/card/card'
export * from './lib/input/input'
```

### 4. API Service Library

```typescript
// libs/data-access/src/lib/api.service.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

class ApiService {
  private client: AxiosInstance

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.get<T>(url, config)
    return data
  }

  async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.post<T>(url, body, config)
    return data
  }

  async put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.put<T>(url, body, config)
    return data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.delete<T>(url, config)
    return data
  }
}

export const apiService = new ApiService(
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
)
```

### 5. Shared Types

```typescript
// libs/api-interfaces/src/lib/user.interface.ts
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  MODERATOR = 'MODERATOR',
}

export interface CreateUserDto {
  email: string
  name: string
  password: string
}

export interface UpdateUserDto {
  name?: string
  email?: string
}
```

```typescript
// libs/api-interfaces/src/index.ts
export * from './lib/user.interface'
export * from './lib/post.interface'
export * from './lib/auth.interface'
```

### 6. Using Libraries in Apps

```tsx
// apps/web/src/app/pages/home/home.tsx
import { Button, Card } from '@myorg/ui'
import { User, UserRole } from '@myorg/api-interfaces'
import { apiService } from '@myorg/data-access'
import { useState, useEffect } from 'react'

export function HomePage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await apiService.get<User[]>('/users')
      setUsers(data)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Users</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id}>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              {user.role}
            </span>
          </Card>
        ))}
      </div>
      <Button className="mt-6">Add User</Button>
    </div>
  )
}
```

### 7. Path Mappings

```json
// tsconfig.base.json
{
  "compileOnSave": false,
  "compilerOptions": {
    "rootDir": ".",
    "sourceMap": true,
    "declaration": false,
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "es2022",
    "module": "esnext",
    "lib": ["es2022", "dom"],
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@myorg/ui": ["libs/ui/src/index.ts"],
      "@myorg/api-interfaces": ["libs/api-interfaces/src/index.ts"],
      "@myorg/data-access": ["libs/data-access/src/index.ts"],
      "@myorg/utils": ["libs/utils/src/index.ts"]
    }
  }
}
```

### 8. Affected Commands (CI Optimization)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Derive appropriate SHAs for base and head for `nx affected`
        uses: nrwl/nx-set-shas@v4

      - run: pnpm nx affected -t lint,test,build
```

## Best Practices

1. **Library Boundaries**: Use tags and enforce with nx enforce-module-boundaries
2. **Code Generation**: Use generators for consistent structure
3. **Affected Commands**: Always use affected in CI
4. **Dependency Graph**: Review with `nx graph`
5. **Incremental Builds**: Enable remote caching with Nx Cloud

## Common Commands

```bash
# Development
nx serve web
nx serve api

# Build
nx build web
nx build api

# Build affected
nx affected -t build

# Test
nx test web
nx test api-interfaces

# Test affected
nx affected -t test

# Lint
nx lint web

# Run all affected
nx affected -t lint,test,build

# Generate app
nx g @nx/react:app my-app
nx g @nx/node:app my-api

# Generate library
nx g @nx/react:lib ui-components
nx g @nx/js:lib shared-utils

# Generate component
nx g @nx/react:component button --project=ui

# Dependency graph
nx graph

# Clear cache
nx reset

# List projects
nx show projects
nx show projects --type lib
```

## Nx Cloud Configuration

```typescript
// nx-cloud.env
NX_CLOUD_ACCESS_TOKEN=your-token-here
```

```json
// nx.json - Add distributed task execution
{
  "nxCloudId": "your-org-id",
  "parallel": 3
}
```

## Library Constraints

```json
// .eslintrc.json - Enforce module boundaries
{
  "overrides": [
    {
      "files": ["*.ts", "*.tsx"],
      "rules": {
        "@nx/enforce-module-boundaries": [
          "error",
          {
            "enforceBuildableLibDependency": true,
            "allow": [],
            "depConstraints": [
              {
                "sourceTag": "type:app",
                "onlyDependOnLibsWithTags": ["type:lib", "type:feature"]
              },
              {
                "sourceTag": "type:feature",
                "onlyDependOnLibsWithTags": ["type:lib", "type:util"]
              },
              {
                "sourceTag": "type:lib",
                "onlyDependOnLibsWithTags": ["type:util"]
              },
              {
                "sourceTag": "scope:web",
                "onlyDependOnLibsWithTags": ["scope:web", "scope:shared"]
              }
            ]
          }
        ]
      }
    }
  ]
}
```

## Deployment

### Docker Multi-stage

```dockerfile
# Build stage
FROM node:20-alpine as builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm nx build web --prod

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist/apps/web /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Deploy Specific App

```bash
# Build specific app
nx build web --prod

# Output in dist/apps/web
```

## Resources

- [Nx Documentation](https://nx.dev/)
- [Nx React Tutorial](https://nx.dev/react-tutorial/01-create-application)
- [Nx Cloud](https://nx.app/)
- [Nx GitHub](https://github.com/nrwl/nx)
