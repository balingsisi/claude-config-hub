# Biome Linting & Formatting Template

## 技术栈

- **核心**: Biome ^1.x (Rome 继任者)
- **功能**: Linting + Formatting + Import Sorting
- **语言**: JavaScript / TypeScript / JSX / TSX / JSON
- **集成**: VS Code / WebStorm / CI/CD

## 项目结构

```
biome-project/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── index.ts
├── biome.json              # Biome 配置
├── package.json
├── tsconfig.json
└── .vscode/
    └── settings.json       # 编辑器集成
```

## 代码模式

### 基础配置

```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noExtraBooleanCast": "error",
        "noMultipleSpacesInRegularExpressionLiterals": "error",
        "noUselessCatch": "error",
        "noUselessThisAlias": "error",
        "noUselessTypeConstraint": "error",
        "noWith": "error"
      },
      "correctness": {
        "noConstAssign": "error",
        "noConstantCondition": "warn",
        "noEmptyCharacterClassInRegex": "error",
        "noEmptyPattern": "error",
        "noGlobalObjectCalls": "error",
        "noInvalidConstructorSuper": "error",
        "noInvalidNewBuiltin": "error",
        "noNewSymbol": "error",
        "noNonoctalDecimalEscape": "error",
        "noPrecisionLoss": "error",
        "noSelfAssign": "error",
        "noSetterReturn": "error",
        "noSwitchDeclarations": "error",
        "noUndeclaredVariables": "error",
        "noUnreachable": "error",
        "noUnreachableSuper": "error",
        "noUnsafeFinally": "error",
        "noUnsafeOptionalChaining": "error",
        "noUnusedLabels": "error",
        "noUnusedVariables": "warn",
        "useIsNan": "error",
        "useValidForDirection": "error",
        "useYield": "error"
      },
      "suspicious": {
        "noAsyncPromiseExecutor": "error",
        "noCatchAssign": "error",
        "noClassAssign": "error",
        "noCompareNegZero": "error",
        "noControlCharactersInRegex": "error",
        "noDebugger": "error",
        "noDuplicateCase": "error",
        "noDuplicateClassMembers": "error",
        "noDuplicateObjectKeys": "error",
        "noDuplicateParameters": "error",
        "noEmptyBlockStatements": "warn",
        "noExplicitAny": "warn",
        "noFallthroughSwitchClause": "error",
        "noFunctionAssign": "error",
        "noGlobalAssign": "error",
        "noImportAssign": "error",
        "noMisleadingCharacterClass": "error",
        "noPrototypeBuiltins": "error",
        "noRedeclare": "error",
        "noShadowRestrictedNames": "error",
        "noUnsafeDeclarationMerging": "error",
        "noUnsafeNegation": "error",
        "useGetterReturn": "error",
        "useValidTypeof": "error"
      },
      "style": {
        "noArguments": "error",
        "noVar": "error",
        "useConst": "error",
        "useTemplate": "warn"
      },
      "performance": {
        "noDelete": "warn"
      },
      "security": {
        "noDangerouslySetInnerHtml": "warn",
        "noGlobalEval": "error"
      },
      "a11y": {
        "useAltText": "error",
        "useAnchorContent": "error",
        "useButtonType": "error",
        "useKeyWithClickEvents": "warn",
        "useKeyWithMouseEvents": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingComma": "es5",
      "semicolons": "always",
      "arrowParentheses": "always",
      "bracketSpacing": true,
      "bracketSameLine": false,
      "quoteProperties": "asNeeded",
      "attributePosition": "auto"
    }
  },
  "json": {
    "formatter": {
      "enabled": true,
      "indentStyle": "space",
      "indentWidth": 2,
      "lineWidth": 100
    }
  },
  "files": {
    "ignore": [
      "node_modules",
      "dist",
      "build",
      ".next",
      "coverage",
      "*.min.js"
    ]
  }
}
```

### React/JSX 配置

```json
// biome.json (React 项目)
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",
  "linter": {
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "useExhaustiveDependencies": "warn"
      },
      "a11y": {
        "useAltText": "error",
        "useAnchorContent": "error",
        "useButtonType": "error",
        "useHtmlLang": "error",
        "useIframeTitle": "error",
        "useMediaCaption": "warn",
        "noBlankTarget": "error",
        "noSvgWithoutTitle": "warn"
      }
    }
  },
  "javascript": {
    "jsxRuntime": "react",
    "formatter": {
      "jsxQuoteStyle": "double",
      "quoteStyle": "single"
    }
  }
}
```

### Next.js 配置

```json
// biome.json (Next.js 项目)
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",
  "linter": {
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error"
      }
    }
  },
  "javascript": {
    "jsxRuntime": "transparent"
  },
  "files": {
    "ignore": [
      ".next",
      "out",
      "next-env.d.ts"
    ]
  }
}
```

### npm scripts 配置

```json
// package.json
{
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check . --apply",
    "format": "biome format . --write",
    "check": "biome check . --apply && biome format . --write",
    "ci": "biome ci ."
  },
  "devDependencies": {
    "@biomejs/biome": "^1.5.0"
  }
}
```

### VS Code 集成

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

### 从 ESLint/Prettier 迁移

```bash
# 安装 Biome
npm install -D @biomejs/biome

# 从 ESLint + Prettier 配置迁移
npx @biomejs/biome migrate --write

# 卸载旧依赖
npm uninstall eslint prettier eslint-config-* prettier-plugin-*
```

```json
// 迁移后的 biome.json
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "lineWidth": 80
  }
}
```

## 最佳实践

### 1. 渐进式采用

```json
// biome.json (渐进式配置)
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      // 先警告后错误
      "correctness": {
        "noUnusedVariables": "warn"
      },
      "style": {
        "useConst": "warn",
        "noVar": "warn"
      }
    }
  },
  "files": {
    "ignore": [
      "legacy/**",
      "*.test.ts"
    ]
  }
}
```

### 2. Monorepo 配置

```json
// 根目录 biome.json
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

```json
// packages/app/biome.json (继承并覆盖)
{
  "extends": "../../biome.json",
  "linter": {
    "rules": {
      "a11y": {
        "useAltText": "error"
      }
    }
  }
}
```

### 3. CI/CD 集成

```yaml
# .github/workflows/lint.yml
name: Lint

on: [push, pull_request]

jobs:
  biome:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - run: npm ci
      
      - name: Run Biome
        run: npm run ci
```

```yaml
# GitLab CI
lint:
  image: node:20
  script:
    - npm ci
    - npm run ci
  only:
    - merge_requests
```

### 4. Pre-commit 钩子

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx @biomejs/biome check --staged --apply
```

```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx,json}": [
      "biome check --apply"
    ]
  }
}
```

### 5. 自定义规则覆盖

```json
// biome.json
{
  "overrides": [
    {
      "include": ["*.test.ts", "*.spec.ts"],
      "linter": {
        "rules": {
          "correctness": {
            "noUnusedVariables": "off"
          },
          "suspicious": {
            "noExplicitAny": "off"
          }
        }
      }
    },
    {
      "include": ["scripts/**"],
      "linter": {
        "rules": {
          "style": {
            "noConsole": "off"
          }
        }
      }
    },
    {
      "include": ["*.config.js", "*.config.ts"],
      "linter": {
        "rules": {
          "style": {
            "useNamingConvention": "off"
          }
        }
      }
    }
  ]
}
```

### 6. 团队共享配置

```javascript
// biome.config.js (可编程配置)
module.exports = {
  linter: {
    rules: {
      recommended: true,
      // 根据环境调整
      ...(process.env.NODE_ENV === 'production' && {
        correctness: {
          noUnusedVariables: 'error'
        }
      })
    }
  }
};
```

```bash
# 发布共享配置包
# @your-org/biome-config
npm init -y
npm publish
```

```json
// 使用共享配置
{
  "extends": "@your-org/biome-config"
}
```

## 常用命令

```bash
# 安装
npm install -D @biomejs/biome

# 初始化
npx @biomejs/biome init

# 检查
npx @biomejs/biome check .

# 自动修复
npx @biomejs/biome check --apply .

# 格式化
npx @biomejs/biome format --write .

# 仅检查暂存文件
npx @biomejs/biome check --staged .

# CI 模式
npx @biomejs/biome ci .

# 从 ESLint/Prettier 迁移
npx @biomejs/biome migrate --write

# 查看 info
npx @biomejs/biome rage

# 搜索规则
npx @biomejs/biome search noUnused
```

## 部署配置

### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 Biome
RUN npm install -g @biomejs/biome

COPY package*.json ./
RUN npm ci

COPY . .

# 运行检查
RUN biome ci .

# 构建
RUN npm run build

# 生产镜像
FROM node:20-alpine
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "biome check . && next build",
    "lint": "biome check .",
    "lint:fix": "biome check --apply .",
    "format": "biome format --write .",
    "ci": "biome ci .",
    "prepare": "husky"
  }
}
```

### 编辑器配置

```json
// .vscode/extensions.json
{
  "recommendations": [
    "biomejs.biome"
  ]
}
```

```xml
<!-- .idea/workspace.xml (WebStorm/IntelliJ) -->
<component name="BiomeSettings">
  <option name="biomeExecutable" value="node_modules/.bin/biome" />
  <option name="runBiomeOnSave" value="true" />
</component>
```
