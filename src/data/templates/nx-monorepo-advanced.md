# Nx Monorepo Template

## Tech Stack
- nx v18.x
- TypeScript 5+
- React/Vue/Node.js

## Project Structure
```
apps/
├── web/
├── admin/
└── api/
libs/
├── shared/
│   ├── ui/
│   └── utils/
└── domain/
    ├── user/
    └── product/
nx.json
workspace.json
```

## Core Patterns

### Nx Configuration
```json
// nx.json
{
  "affected": {
    "defaultBase": "main"
  },
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx-cloud",
      "options": {
        "cacheableOperations": ["build", "lint", "test", "e2e"]
      }
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Library Generator
```typescript
// libs/shared/ui/src/lib/Button.tsx
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary'
}) => {
  return <button className={`btn btn-${variant}`}>{children}</button>;
};

// libs/shared/ui/src/index.ts
export * from './lib/Button';
```

### App Configuration
```json
// apps/web/project.json
{
  "root": "apps/web",
  "sourceRoot": "apps/web/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "@nx/webpack:webpack",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/apps/web",
        "main": "apps/web/src/main.tsx"
      }
    },
    "serve": {
      "executor": "@nx/webpack:dev-server",
      "options": {
        "buildTarget": "web:build"
      }
    }
  }
}
```

## Common Commands

```bash
# Create new app
nx g @nx/react:app my-app

# Create new lib
nx g @nx/react:lib shared-ui

# Run affected tests
nx affected -t test

# Build affected projects
nx affected -t build

# Visualize graph
nx graph

# Run specific target
nx build web
nx test shared-ui
```

## Related Resources
- [Nx Documentation](https://nx.dev/)
- [Nx Monorepo Guide](https://nx.dev/concepts/more-concepts/why-monorepos)
