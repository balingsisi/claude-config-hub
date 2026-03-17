# Knip Unused Code Detection Template

## Project Overview

Detect and remove unused files, exports, dependencies, and class members with Knip - a powerful static analysis tool for finding dead code in JavaScript and TypeScript projects.

## Tech Stack

- **Tool**: Knip 5+
- **Language**: TypeScript / JavaScript
- **Integration**: VS Code, CI/CD
- **Package Manager**: npm / yarn / pnpm

## Project Structure

```
project/
├── src/
│   ├── components/
│   ├── utils/
│   ├── services/
│   └── index.ts
├── test/
├── knip.json                # Knip configuration
├── package.json
└── tsconfig.json
```

## Key Patterns

### 1. Basic Configuration

```json
// knip.json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": ["src/index.ts"],
  "project": ["src/**/*.ts", "src/**/*.tsx"],
  "ignore": [
    "src/**/*.test.ts",
    "src/**/*.spec.ts",
    "src/**/__tests__/**"
  ],
  "ignoreExportsUsedInFile": {
    "interface": true,
    "type": true
  }
}
```

### 2. Framework-Specific Configs

#### Next.js

```json
// knip.json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "next": true,
  "entry": [
    "src/pages/**/*.{ts,tsx}",
    "src/app/**/*.{ts,tsx}",
    "next.config.mjs"
  ],
  "project": ["src/**/*.{ts,tsx}", "!src/**/*.test.{ts,tsx}"],
  "ignore": [
    ".next/**",
    "out/**",
    "next-env.d.ts"
  ]
}
```

#### React + Vite

```json
// knip.json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "vite": true,
  "entry": ["src/main.tsx", "vite.config.ts"],
  "project": ["src/**/*.{ts,tsx}"],
  "ignore": [
    "src/**/*.test.{ts,tsx}",
    "src/**/*.stories.{ts,tsx}",
    "src/vite-env.d.ts"
  ]
}
```

#### NestJS

```json
// knip.json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": ["src/main.ts"],
  "project": ["src/**/*.ts"],
  "ignore": [
    "src/**/*.spec.ts",
    "src/**/*.e2e-spec.ts"
  ],
  "ignoreDependencies": [
    "@nestjs/testing",
    "jest",
    "supertest"
  ]
}
```

#### Express

```json
// knip.json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": ["src/index.ts", "src/server.ts"],
  "project": ["src/**/*.ts"],
  "ignore": [
    "src/**/*.test.ts",
    "dist/**"
  ],
  "ignoreDependencies": [
    "@types/express",
    "@types/node"
  ]
}
```

### 3. Monorepo Configuration

```json
// Root knip.json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "workspaces": {
    "packages/*": {
      "entry": ["src/index.ts"],
      "project": ["src/**/*.ts"]
    },
    "apps/*": {
      "entry": ["src/main.ts"],
      "project": ["src/**/*.{ts,tsx}"]
    }
  }
}
```

```json
// packages/ui/knip.json (workspace override)
{
  "entry": ["src/index.ts", "src/**/*.stories.tsx"],
  "ignoreExportsUsedInFile": false
}
```

### 4. Advanced Configuration

```json
// knip.json (comprehensive)
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": [
    "src/index.ts",
    "src/cli.ts",
    "scripts/**/*.ts"
  ],
  "project": ["src/**/*.{ts,tsx}", "scripts/**/*.ts"],
  "ignore": [
    "src/**/*.test.{ts,tsx}",
    "src/**/__mocks__/**",
    "src/**/__fixtures__/**",
    "types/**/*.d.ts"
  ],
  "ignoreExportsUsedInFile": {
    "interface": true,
    "type": true,
    "class": false
  },
  "ignoreDependencies": [
    "eslint",
    "prettier",
    "@types/*",
    "vitest"
  ],
  "ignoreBinaries": [
    "ts-node"
  ],
  "include": [
    "files",
    "dependencies",
    "exports",
    "classMembers",
    "types",
    "nsExports",
    "nsTypes",
    "duplicates"
  ],
  "exclude": [
    "binaries"
  ]
}
```

### 5. Package.json Scripts

```json
// package.json
{
  "scripts": {
    "knip": "knip",
    "knip:fix": "knip --fix",
    "knip:production": "knip --production",
    "lint": "npm run knip && eslint .",
    "check": "npm run lint && npm run type-check && npm test"
  },
  "devDependencies": {
    "knip": "^5.0.0"
  }
}
```

### 6. Custom Reporter

```typescript
// knip-reporter.ts
import type { Reporter, Issue } from 'knip';

export default class CustomReporter implements Reporter {
  report(issues: Issue[]) {
    const grouped = new Map<string, Issue[]>();

    for (const issue of issues) {
      const file = issue.file?.filePath || 'unknown';
      if (!grouped.has(file)) {
        grouped.set(file, []);
      }
      grouped.get(file)!.push(issue);
    }

    console.log('\n🔍 Unused Code Report\n');

    for (const [file, fileIssues] of grouped) {
      console.log(`\n📄 ${file}`);
      
      for (const issue of fileIssues) {
        const symbol = issue.symbol ? `: ${issue.symbol}` : '';
        console.log(`  ${issue.type}${symbol} (line ${issue.line})`);
      }
    }

    console.log(`\nTotal issues: ${issues.length}\n`);
  }
}
```

```json
// knip.json
{
  "reporter": "./knip-reporter.ts"
}
```

### 7. Handling False Positives

```typescript
// src/utils/helpers.ts

/**
 * @knipignore
 * Used by external plugin system
 */
export function utilityFunction() {
  // ...
}

// Exported for type checking only
export type { Config } from './types';
```

```json
// knip.json
{
  "ignoreExportsUsedInFile": {
    "interface": true,
    "type": true
  }
}
```

### 8. CI/CD Integration

#### GitHub Actions

```yaml
# .github/workflows/knip.yml
name: Knip

on: [push, pull_request]

jobs:
  knip:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - run: npm ci
      
      - name: Run Knip
        run: npm run knip
```

#### GitLab CI

```yaml
# .gitlab-ci.yml
knip:
  image: node:20
  stage: test
  script:
    - npm ci
    - npm run knip
  only:
    - merge_requests
```

#### Pre-commit Hook

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run knip
```

## Configuration Options

### Entry Points

```json
{
  "entry": [
    "src/index.ts",           // Single entry
    "src/**/*.ts",            // Glob pattern
    "!src/**/*.test.ts",      // Negation
    { "src/cli.ts": "bin" }   // Binary entry
  ]
}
```

### Project Files

```json
{
  "project": [
    "src/**/*.{ts,tsx}",
    "lib/**/*.js",
    "!dist/**"
  ]
}
```

### Ignore Patterns

```json
{
  "ignore": [
    "src/**/*.test.ts",
    "src/**/*.spec.ts",
    "src/**/__tests__/**",
    "src/**/__mocks__/**",
    "types/**/*.d.ts",
    "**/fixtures/**",
    "**/examples/**"
  ]
}
```

### Dependency Whitelist

```json
{
  "ignoreDependencies": [
    "@types/*",
    "eslint",
    "prettier",
    "typescript",
    "vitest",
    "jest",
    "@testing-library/*"
  ]
}
```

### Binary Whitelist

```json
{
  "ignoreBinaries": [
    "ts-node",
    "nodemon",
    "cross-env"
  ]
}
```

## CLI Commands

### Basic Usage

```bash
# Run analysis
npx knip

# Fix issues automatically
npx knip --fix

# Production mode (ignore devDependencies)
npx knip --production

# Include dependencies analysis
npx knip --include dependencies

# Exclude specific checks
npx knip --exclude files,exports

# Verbose output
npx knip --verbose

# JSON output
npx knip --reporter json

# Watch mode
npx knip --watch
```

### Advanced Usage

```bash
# Custom config file
npx knip --config ./custom-knip.json

# Specific directory
npx knip --directory ./packages/app

# Performance timing
npx knip --performance

# Debug mode
npx knip --debug

# Show only errors
npx knip --no-warnings

# Max warnings threshold
npx knip --max-issues 50
```

## VS Code Integration

### settings.json

```json
// .vscode/settings.json
{
  "knip.enable": true,
  "knip.run": "onSave",
  "knip.configPath": "./knip.json",
  "knip.exclude": [
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

### extensions.json

```json
// .vscode/extensions.json
{
  "recommendations": [
    "webpro.knip-vscode"
  ]
}
```

## Common Issues & Solutions

### 1. False Positive: Dynamic Imports

```typescript
// ❌ Knip can't detect this
const module = await import(`./modules/${name}`);

// ✅ Whitelist the modules directory
```

```json
{
  "ignore": ["src/modules/**"]
}
```

### 2. False Positive: Plugin System

```typescript
// Plugin exports that are used externally
export function pluginHook() {
  // ...
}
```

```typescript
// Use JSDoc to ignore
/**
 * @knipignore
 */
export function pluginHook() {
  // ...
}
```

### 3. False Positive: Type-Only Exports

```typescript
// Exported for type inference only
export type { Props } from './types';
```

```json
// Automatically handled by
{
  "ignoreExportsUsedInFile": {
    "type": true
  }
}
```

### 4. Circular Dependencies

```bash
# Knip detects circular dependencies
npx knip --include duplicates
```

```typescript
// a.ts
import { b } from './b';
export const a = 'a';

// b.ts
import { a } from './a';
export const b = 'b';
```

### 5. Unused Dependencies

```bash
# Check dependencies
npx knip --include dependencies

# Auto-remove unused dependencies
npx knip --fix --include dependencies
```

## Best Practices

### 1. Incremental Adoption

```json
// Start with loose config
{
  "include": ["files"],
  "ignoreExportsUsedInFile": {
    "interface": true,
    "type": true,
    "class": true
  }
}

// Gradually tighten
{
  "include": ["files", "exports", "dependencies"],
  "ignoreExportsUsedInFile": {
    "interface": true,
    "type": true
  }
}
```

### 2. CI Thresholds

```yaml
# .github/workflows/knip.yml
- name: Run Knip
  run: |
    issues=$(npx knip --reporter json | jq 'length')
    if [ $issues -gt 10 ]; then
      echo "Too many issues: $issues (max 10)"
      exit 1
    fi
```

### 3. Pre-commit Mode

```bash
# Only check staged files
npx knip --staged
```

### 4. Production Build Check

```bash
# Check production build
npm run build
npx knip --production --directory dist
```

### 5. Regular Maintenance

```bash
# Weekly cleanup
npm run knip:fix
npm prune
npm install
```

## Troubleshooting

### Slow Performance

```json
// Limit scope
{
  "entry": ["src/index.ts"],
  "project": ["src/**/*.ts"],
  "ignore": [
    "node_modules/**",
    "dist/**",
    ".next/**",
    "coverage/**"
  ]
}
```

### Memory Issues

```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npx knip
```

### Parser Errors

```json
// Add TypeScript parser options
{
  "compilerOptions": {
    "extends": "./tsconfig.json"
  }
}
```

## Example Output

```
Unused exports (3)
src/utils/helpers.ts:2:14
  formatDate        Used in 0 files, exported in 1 file
  parseJSON         Used in 0 files, exported in 1 file
src/types/index.ts:5:14
  UserConfig        Used in 0 files, exported in 1 file

Unused dependencies (2)
  lodash            Listed in dependencies, not used in code
  moment            Listed in dependencies, not used in code

Unused files (1)
  src/deprecated.ts  Not imported anywhere

Total: 6 issues
```

## Resources

- [Knip Documentation](https://knip.dev/)
- [Knip GitHub](https://github.com/webpro/knip)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=webpro.knip-vscode)
- [Examples](https://github.com/webpro/knip/tree/main/packages/knip/examples)
