# Biome 代码检查与格式化模板

## 技术栈

- **核心工具**: Biome 1.x（原 Rome）
- **语言支持**: JavaScript, TypeScript, JSX, TSX, JSON
- **功能**: Linting + Formatting + Import Sorting
- **编辑器集成**: VS Code, JetBrains IDEs
- **CI/CD**: GitHub Actions, GitLab CI
- **配置格式**: JSON (biome.json)

## 项目结构

```
biome-project/
├── src/                       # 源代码
│   ├── components/           # 组件
│   ├── hooks/                # Hooks
│   ├── utils/                # 工具函数
│   └── types/                # 类型定义
├── tests/                    # 测试文件
├── biome.json                # Biome 配置文件
├── package.json
├── tsconfig.json
└── .vscode/
    └── settings.json         # VS Code 配置
```

## 代码模式

### Biome 配置文件

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
        "noWith": "error",
        "useFlatMap": "error"
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
        "noUnusedVariables": "error",
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
        "noInferrableTypes": "warn",
        "noNamespace": "error",
        "noNegationElse": "warn",
        "noNonNullAssertion": "warn",
        "noParameterAssign": "warn",
        "noUnusedTemplateLiteral": "warn",
        "noVar": "error",
        "useConst": "error",
        "useEnumInitializers": "warn",
        "useExponentiationOperator": "error",
        "useForOf": "warn",
        "useFragmentSyntax": "warn",
        "useLiteralEnumMembers": "warn",
        "useNumberNamespace": "error",
        "useNumericLiterals": "warn",
        "useShorthandFunctionType": "warn",
        "useSingleCaseStatement": "warn",
        "useSingleVarDeclarator": "error",
        "useTemplate": "warn"
      },
      "performance": {
        "noAccumulatingSpread": "warn",
        "noDelete": "warn"
      },
      "security": {
        "noDangerouslySetInnerHtml": "warn",
        "noDangerouslySetInnerHtmlWithChildren": "error"
      },
      "a11y": {
        "noAccessKey": "warn",
        "noAriaHiddenOnFocusable": "error",
        "noAriaUnsupportedElements": "error",
        "noAutofocus": "warn",
        "noBlankTarget": "error",
        "noDistractingElements": "error",
        "noHeaderScope": "warn",
        "noNoninteractiveElementToInteractiveRole": "error",
        "noNoninteractiveTabindex": "warn",
        "noPositiveTabindex": "warn",
        "noRedundantAlt": "warn",
        "noRedundantRoles": "warn",
        "noSvgWithoutTitle": "warn",
        "useAltText": "error",
        "useAnchorContent": "error",
        "useAriaActivedescendantWithTabindex": "warn",
        "useAriaPropsForRole": "error",
        "useButtonType": "error",
        "useHtmlLang": "error",
        "useIframeTitle": "error",
        "useKeyWithClickEvents": "error",
        "useKeyWithMouseEvents": "warn",
        "useMediaCaption": "warn",
        "useValidAnchor": "error",
        "useValidAriaProps": "error",
        "useValidAriaRole": "error",
        "useValidAriaValues": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf",
    "attributePosition": "auto",
    "ignore": ["node_modules", "dist", "build", ".next", "coverage"]
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
      "trailingCommas": "none"
    }
  },
  "files": {
    "ignore": [
      "node_modules",
      "dist",
      "build",
      ".next",
      "coverage",
      "*.min.js",
      "*.generated.*"
    ],
    "ignoreUnknown": true
  },
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  }
}
```

### Monorepo 配置

```json
// biome.json (monorepo 根目录)
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
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingComma": "es5",
      "semicolons": "always"
    }
  },
  "overrides": [
    {
      "include": ["packages/ui/**", "packages/components/**"],
      "linter": {
        "rules": {
          "style": {
            "useConst": "off"
          }
        }
      }
    },
    {
      "include": ["apps/web/**"],
      "javascript": {
        "formatter": {
          "quoteStyle": "double"
        }
      }
    },
    {
      "include": ["**/*.test.ts", "**/*.spec.ts"],
      "linter": {
        "rules": {
          "suspicious": {
            "noExplicitAny": "off"
          }
        }
      }
    }
  ]
}
```

### Next.js 项目配置

```json
// biome.json (Next.js)
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingComma": "es5",
      "semicolons": "always"
    },
    "jsxRuntime": "transparent"
  },
  "files": {
    "ignore": [
      ".next",
      "node_modules",
      "out",
      "public",
      "coverage"
    ]
  }
}
```

### React 项目配置

```json
// biome.json (React)
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "a11y": {
        "noAutofocus": "off",
        "useButtonType": "error"
      },
      "correctness": {
        "noUnusedVariables": "error"
      },
      "suspicious": {
        "noArrayIndexKey": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingComma": "es5",
      "semicolons": "always",
      "arrowParentheses": "always"
    },
    "jsxRuntime": "reactClassic"
  }
}
```

### TypeScript 严格配置

```json
// biome.json (TypeScript 严格模式)
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
        "noUselessLoneBlockStatements": "error",
        "useSimplifiedLogicExpression": "warn"
      },
      "correctness": {
        "noUnusedVariables": "error",
        "useHookAtTopLevel": "error"
      },
      "suspicious": {
        "noExplicitAny": "error",
        "noMisleadingInstantiator": "error"
      },
      "style": {
        "noInferrableTypes": "error",
        "useConst": "error",
        "useEnumInitializers": "error",
        "useNodejsImportProtocol": "error",
        "useShorthandFunctionType": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
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
  "[javascriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescript]": {
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

// .vscode/extensions.json
{
  "recommendations": ["biomejs.biome"]
}
```

### package.json 脚本

```json
{
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --apply .",
    "lint:unsafe": "biome check --apply-unsafe .",
    "format": "biome format .",
    "format:write": "biome format --write .",
    "check": "biome check --apply --linter-enabled=true . && biome format --write .",
    "ci": "biome ci ."
  },
  "devDependencies": {
    "@biomejs/biome": "^1.5.0"
  }
}
```

## 最佳实践

### 1. 从 ESLint/Prettier 迁移

```bash
# 安装 Biome
npm install --save-dev @biomejs/biome

# 自动迁移 ESLint 配置
npx @biomejs/biome migrate --write

# 删除旧依赖
npm uninstall eslint prettier eslint-config-* prettier-plugin-*

# 更新 package.json 脚本
# 将 npm run lint 改为 biome check
# 将 npm run format 改为 biome format
```

### 2. Git Hooks 集成

```bash
# 使用 simple-git-hooks
npm install --save-dev simple-git-hooks

# package.json
{
  "simple-git-hooks": {
    "pre-commit": "npx biome check --apply --staged"
  }
}
```

```bash
# 使用 Husky
npm install --save-dev husky

# .husky/pre-commit
npx biome check --apply --staged
```

### 3. 忽略文件配置

```json
// biome.json
{
  "files": {
    "ignore": [
      "node_modules",
      "dist",
      "build",
      ".next",
      "coverage",
      "*.min.js",
      "**/*.generated.*",
      "**/vendor/**"
    ],
    "ignoreUnknown": true
  }
}
```

```gitignore
# .gitignore 中也可以忽略 Biome 相关
.biome
biome.log
```

### 4. 增量检查

```bash
# 只检查修改的文件
biome check --changed=origin/main

# 只检查暂存文件
biome check --staged

# 使用 Git diff
biome check $(git diff --name-only --diff-filter=d origin/main)
```

### 5. 错误级别配置

```json
// biome.json
{
  "linter": {
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "off"      // 完全关闭
      },
      "correctness": {
        "noUnusedVariables": "warn" // 警告级别
      },
      "style": {
        "useConst": "error"         // 错误级别
      }
    }
  }
}
```

### 6. 针对特定文件覆盖规则

```json
// biome.json
{
  "overrides": [
    {
      "include": ["**/*.test.ts", "**/*.spec.ts"],
      "linter": {
        "rules": {
          "suspicious": {
            "noExplicitAny": "off"
          },
          "complexity": {
            "noForEach": "off"
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
    }
  ]
}
```

## 常用命令

```bash
# 基础命令

# 检查代码（lint）
biome check .
biome check src/
biome check src/index.ts

# 检查并自动修复
biome check --apply .
biome check --apply-unsafe .

# 格式化代码
biome format .
biome format --write .
biome format --write src/

# 只检查不格式化
biome check --linter-enabled=true .
biome check --formatter-enabled=false .

# 组织导入
biome check --apply . --linter-enabled=false --formatter-enabled=false

# CI 模式
biome ci .
biome ci --error-on-warnings .

# 增量检查
biome check --changed=origin/main
biome check --staged

# 显示详细信息
biome check --verbose .
biome check --json .  # JSON 输出

# 检查特定规则
biome check --only=suspicious/noExplicitAny .
biome check --only=style/useConst .

# 跳过特定规则
biome check --skip=suspicious/noExplicitAny .

# 初始化配置
biome init

# 从 ESLint 迁移
biome migrate --write
biome migrate --from-eslint-prettier

# 查看 CPU/内存使用
biome check --show-parser-errors .

# 帮助
biome --help
biome check --help
biome format --help
```

## 部署配置

### GitHub Actions 集成

```yaml
# .github/workflows/lint.yml
name: Lint

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
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
      
      - name: Run Biome CI
        run: npx biome ci .
      
      - name: Run Biome with JSON output
        if: failure()
        run: npx biome check --json . > biome-report.json
      
      - name: Upload report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: biome-report
          path: biome-report.json
```

### GitLab CI 集成

```yaml
# .gitlab-ci.yml
stages:
  - lint

biome:
  stage: lint
  image: node:20-alpine
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npx biome ci .
  only:
    - merge_requests
    - main
```

### CircleCI 集成

```yaml
# .circleci/config.yml
version: 2.1

jobs:
  lint:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - restore_cache:
          keys:
            - v1-deps-{{ checksum "package-lock.json" }}
      - run: npm ci
      - save_cache:
          key: v1-deps-{{ checksum "package-lock.json" }}
          paths:
            - node_modules
      - run: npx biome ci .

workflows:
  version: 2
  build-and-lint:
    jobs:
      - lint
```

### Pre-commit Hook

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: biome-check
        name: Biome check
        entry: npx biome check --apply --staged
        language: system
        types: [file]
        files: \.(js|jsx|ts|tsx|json)$
        pass_filenames: false
```

### Docker 集成

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# 在构建前检查代码
RUN npx biome ci .

RUN npm run build

# 生产镜像
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/index.js"]
```

### Nx 集成

```json
// nx.json
{
  "targetDefaults": {
    "lint": {
      "executor": "@biomejs/biome:check",
      "options": {
        "write": true
      }
    }
  }
}

// project.json
{
  "targets": {
    "lint": {
      "executor": "@biomejs/biome:check",
      "options": {
        "write": true,
        "configPath": "biome.json"
      }
    },
    "format": {
      "executor": "@biomejs/biome:format",
      "options": {
        "write": true
      }
    }
  }
}
```

## 性能优化

### 1. 使用 Git Ignore 集成

```json
// biome.json
{
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  }
}
```

### 2. 并行处理

```bash
# 默认已并行，可设置线程数
biome check --threads=4 .
```

### 3. 增量检查

```bash
# CI 中只检查变更
biome check --changed=origin/main --no-errors-on-unmatched
```

### 4. 缓存配置

```bash
# Biome 默认使用缓存，无需额外配置
# 清除缓存
biome check --clear-cache .
```

## 与其他工具对比

| 特性 | Biome | ESLint + Prettier |
|------|-------|-------------------|
| 速度 | ⚡ 超快 (Rust) | 🐢 较慢 (JS) |
| 安装 | 📦 单个包 | 📦 50+ 包 |
| 配置 | 📝 单个文件 | 📝 多个文件 |
| Linting | ✅ | ✅ |
| Formatting | ✅ | ✅ |
| Import Sort | ✅ 内置 | ❌ 需插件 |
| 错误恢复 | ✅ 强大 | ⚠️ 一般 |
| IDE 集成 | ✅ | ✅ |

## 常见问题解决

### Q: 如何处理与 Prettier 冲突？

```bash
# 1. 卸载 Prettier
npm uninstall prettier prettier-plugin-*

# 2. 删除 .prettierrc* 配置文件

# 3. 使用 Biome 格式化
biome format --write .
```

### Q: 如何禁用特定规则？

```json
// biome.json
{
  "linter": {
    "rules": {
      "suspicious": {
        "noExplicitAny": "off"
      }
    }
  }
}
```

### Q: 如何只格式化不检查？

```bash
biome format --write .
# 或
biome check --linter-enabled=false .
```

## 参考资源

- [Biome 官方文档](https://biomejs.dev/)
- [Biome GitHub](https://github.com/biomejs/biome)
- [从 ESLint 迁移指南](https://biomejs.dev/guides/migrate-eslint-prettier/)
- [规则列表](https://biomejs.dev/linter/rules/)
- [VS Code 扩展](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
