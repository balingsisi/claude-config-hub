# Vanilla Extract CSS-in-TypeScript 模板

## 技术栈

- **Vanilla Extract**: 1.x - Zero-runtime CSS-in-TypeScript
- **TypeScript**: 5.x - 类型支持
- **React**: 18.x - UI 框架（可选）
- **Vite/Webpack**: 构建工具
- **@vanilla-extract/css**: 核心 CSS API
- **@vanilla-extract/recipes**: 变体样式
- **@vanilla-extract/sprinkles**: 原子化 CSS
- **@vanilla-extract/dynamic**: 动态样式

## 项目结构

```
vanilla-extract-project/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.css.ts       # 样式定义
│   │   │   └── index.ts
│   │   ├── Card/
│   │   │   ├── Card.tsx
│   │   │   ├── Card.css.ts
│   │   │   └── index.ts
│   │   └── Input/
│   │       ├── Input.tsx
│   │       ├── Input.css.ts
│   │       └── index.ts
│   ├── styles/
│   │   ├── theme.css.ts            # 主题定义
│   │   ├── global.css.ts           # 全局样式
│   │   ├── sprinkles.css.ts        # 原子化样式
│   │   └── vars.css.ts             # CSS 变量
│   ├── utils/
│   │   └── styles.css.ts           # 样式工具
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 代码模式

### 1. 主题配置

```typescript
// src/styles/theme.css.ts
import { createTheme, createGlobalTheme } from '@vanilla-extract/css';

// 创建主题
export const [themeClass, vars] = createTheme({
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    white: '#ffffff',
    black: '#000000',
    text: '#212529',
    background: '#ffffff',
  },
  space: {
    none: '0',
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  typography: {
    fontFamily: {
      body: 'system-ui, -apple-system, sans-serif',
      heading: 'system-ui, -apple-system, sans-serif',
      mono: 'Menlo, Monaco, Consolas, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  radii: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  transitions: {
    fast: '150ms ease',
    normal: '300ms ease',
    slow: '500ms ease',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
});

// 暗色主题
export const darkTheme = createTheme(vars, {
  colors: {
    primary: '#4da6ff',
    secondary: '#868e96',
    success: '#51cf66',
    danger: '#ff6b6b',
    warning: '#ffd43b',
    info: '#22b8cf',
    light: '#212529',
    dark: '#f8f9fa',
    white: '#000000',
    black: '#ffffff',
    text: '#f8f9fa',
    background: '#1a1a1a',
  },
  // 其他配置与默认主题相同
  space: vars.space,
  typography: vars.typography,
  radii: vars.radii,
  shadows: vars.shadows,
  transitions: vars.transitions,
  breakpoints: vars.breakpoints,
  zIndex: vars.zIndex,
});

// 导出类型
export type Theme = typeof vars;
```

### 2. 全局样式

```typescript
// src/styles/global.css.ts
import { globalStyle, createGlobalTheme } from '@vanilla-extract/css';
import { vars } from './theme.css';

// 全局重置
globalStyle('*', {
  margin: 0,
  padding: 0,
  boxSizing: 'border-box',
});

globalStyle('html', {
  fontSize: '16px',
  lineHeight: 1.5,
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
});

globalStyle('body', {
  fontFamily: vars.typography.fontFamily.body,
  fontSize: vars.typography.fontSize.md,
  color: vars.colors.text,
  backgroundColor: vars.colors.background,
  transition: `color ${vars.transitions.normal}, background-color ${vars.transitions.normal}`,
});

globalStyle('h1, h2, h3, h4, h5, h6', {
  fontFamily: vars.typography.fontFamily.heading,
  fontWeight: vars.typography.fontWeight.bold,
  lineHeight: vars.typography.lineHeight.tight,
});

globalStyle('a', {
  color: vars.colors.primary,
  textDecoration: 'none',
  transition: `color ${vars.transitions.fast}`,
});

globalStyle('a:hover', {
  color: vars.colors.primary,
  textDecoration: 'underline',
});

// 代码块
globalStyle('code, pre', {
  fontFamily: vars.typography.fontFamily.mono,
  fontSize: vars.typography.fontSize.sm,
});

// 滚动条样式
globalStyle('::-webkit-scrollbar', {
  width: '8px',
  height: '8px',
});

globalStyle('::-webkit-scrollbar-track', {
  backgroundColor: vars.colors.light,
});

globalStyle('::-webkit-scrollbar-thumb', {
  backgroundColor: vars.colors.secondary,
  borderRadius: vars.radii.full,
});

globalStyle('::-webkit-scrollbar-thumb:hover', {
  backgroundColor: vars.colors.dark,
});

// 选择文本样式
globalStyle('::selection', {
  backgroundColor: vars.colors.primary,
  color: vars.colors.white,
});
```

### 3. 基础组件样式

```typescript
// src/components/Button/Button.css.ts
import { style, createVar } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { vars } from '../../styles/theme.css';

// 创建 CSS 变量
const buttonColor = createVar();
const buttonBg = createVar();

// 基础样式
const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.sm,
  padding: `${vars.space.sm} ${vars.space.md}`,
  border: 'none',
  borderRadius: vars.radii.md,
  fontFamily: vars.typography.fontFamily.body,
  fontSize: vars.typography.fontSize.md,
  fontWeight: vars.typography.fontWeight.medium,
  lineHeight: 1.5,
  textAlign: 'center',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: `all ${vars.transitions.fast}`,
  userSelect: 'none',
  whiteSpace: 'nowrap',

  selectors: {
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    '&:focus': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${vars.colors.primary}40`,
    },
  },
});

// 使用 recipes 创建变体
export const button = recipe({
  base,

  variants: {
    // 变体
    variant: {
      primary: {
        backgroundColor: vars.colors.primary,
        color: vars.colors.white,
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: '#0056b3',
          },
        },
      },
      secondary: {
        backgroundColor: vars.colors.secondary,
        color: vars.colors.white,
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: '#545b62',
          },
        },
      },
      outline: {
        backgroundColor: 'transparent',
        border: `2px solid ${vars.colors.primary}`,
        color: vars.colors.primary,
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: vars.colors.primary,
            color: vars.colors.white,
          },
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: vars.colors.primary,
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: `${vars.colors.primary}10`,
          },
        },
      },
      danger: {
        backgroundColor: vars.colors.danger,
        color: vars.colors.white,
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: '#bd2130',
          },
        },
      },
    },

    // 尺寸
    size: {
      small: {
        padding: `${vars.space.xs} ${vars.space.sm}`,
        fontSize: vars.typography.fontSize.sm,
      },
      medium: {
        padding: `${vars.space.sm} ${vars.space.md}`,
        fontSize: vars.typography.fontSize.md,
      },
      large: {
        padding: `${vars.space.md} ${vars.space.lg}`,
        fontSize: vars.typography.fontSize.lg,
      },
    },

    // 全宽
    fullWidth: {
      true: {
        width: '100%',
      },
    },

    // 圆形
    rounded: {
      true: {
        borderRadius: vars.radii.full,
      },
    },

    // 加载状态
    loading: {
      true: {
        opacity: 0.7,
        cursor: 'wait',
        selectors: {
          '&::after': {
            content: '""',
            display: 'inline-block',
            width: '1em',
            height: '1em',
            border: `2px solid currentColor`,
            borderRightColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.75s linear infinite',
            marginLeft: vars.space.xs,
          },
        },
      },
    },
  },

  // 默认变体
  defaultVariants: {
    variant: 'primary',
    size: 'medium',
    fullWidth: false,
    rounded: false,
    loading: false,
  },

  // 复合变体
  compoundVariants: [
    {
      variants: { variant: 'outline', size: 'large' },
      style: {
        borderWidth: '3px',
      },
    },
  ],
});

// 全局动画
globalStyle('@keyframes spin', {
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

// 图标样式
export const icon = style({
  width: '1.25em',
  height: '1.25em',
});
```

### 4. 组件实现

```typescript
// src/components/Button/Button.tsx
import React from 'react';
import { button, icon as iconStyle } from './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  rounded?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  rounded = false,
  loading = false,
  icon,
  iconPosition = 'left',
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={button({
        variant,
        size,
        fullWidth,
        rounded,
        loading,
        className,
      })}
      disabled={disabled || loading}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className={iconStyle}>{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className={iconStyle}>{icon}</span>}
    </button>
  );
}

// 使用示例
function Example() {
  return (
    <div>
      <Button variant="primary">Primary Button</Button>
      <Button variant="secondary" size="large">
        Secondary Button
      </Button>
      <Button variant="outline" loading>
        Loading...
      </Button>
      <Button variant="ghost" icon={<Icon />} iconPosition="left">
        With Icon
      </Button>
    </div>
  );
}
```

### 5. Sprinkles（原子化 CSS）

```typescript
// src/styles/sprinkles.css.ts
import { defineProperties, createSprinkles } from '@vanilla-extract/sprinkles';
import { vars } from './theme.css';

const responsiveProperties = defineProperties({
  conditions: {
    mobile: {},
    tablet: { '@media': `screen and (min-width: ${vars.breakpoints.md})` },
    desktop: { '@media': `screen and (min-width: ${vars.breakpoints.lg})` },
  },
  defaultCondition: 'mobile',
  properties: {
    display: ['none', 'flex', 'block', 'inline', 'inline-block', 'grid'],
    flexDirection: ['row', 'column', 'row-reverse', 'column-reverse'],
    justifyContent: [
      'flex-start',
      'flex-end',
      'center',
      'space-between',
      'space-around',
      'space-evenly',
    ],
    alignItems: ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'],
    gap: vars.space,
    paddingTop: vars.space,
    paddingBottom: vars.space,
    paddingLeft: vars.space,
    paddingRight: vars.space,
    marginTop: vars.space,
    marginBottom: vars.space,
    marginLeft: vars.space,
    marginRight: vars.space,
    width: ['auto', '100%', '50%', '33.333%', '66.666%'],
    height: ['auto', '100%'],
    fontSize: vars.typography.fontSize,
    fontWeight: vars.typography.fontWeight,
    lineHeight: vars.typography.lineHeight,
    textAlign: ['left', 'center', 'right', 'justify'],
    color: vars.colors,
    backgroundColor: vars.colors,
    borderRadius: vars.radii,
    position: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
    top: ['auto', '0'],
    right: ['auto', '0'],
    bottom: ['auto', '0'],
    left: ['auto', '0'],
    zIndex: vars.zIndex,
  },
  shorthands: {
    padding: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
    paddingX: ['paddingLeft', 'paddingRight'],
    paddingY: ['paddingTop', 'paddingBottom'],
    margin: ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'],
    marginX: ['marginLeft', 'marginRight'],
    marginY: ['marginTop', 'marginBottom'],
    inset: ['top', 'right', 'bottom', 'left'],
  },
});

export const sprinkles = createSprinkles(responsiveProperties);
export type Sprinkles = Parameters<typeof sprinkles>[0];

// 使用示例
import { sprinkles } from '../styles/sprinkles.css';

const container = style([
  sprinkles({
    display: 'flex',
    flexDirection: 'column',
    gap: 'md',
    padding: 'lg',
    backgroundColor: 'white',
    borderRadius: 'lg',
  }),
  {
    // 额外的自定义样式
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
]);
```

### 6. 动态样式

```typescript
// src/components/Card/Card.css.ts
import { style, styleVariants } from '@vanilla-extract/css';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { vars } from '../../styles/theme.css';

// 静态样式
export const card = style({
  backgroundColor: vars.colors.white,
  borderRadius: vars.radii.lg,
  padding: vars.space.lg,
  boxShadow: vars.shadows.md,
  transition: `transform ${vars.transitions.fast}, box-shadow ${vars.transitions.fast}`,

  selectors: {
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: vars.shadows.lg,
    },
  },
});

// 动态 CSS 变量
export const cardPadding = createVar();
export const cardRadius = createVar();

export const dynamicCard = style({
  padding: cardPadding,
  borderRadius: cardRadius,
  backgroundColor: vars.colors.white,
  boxShadow: vars.shadows.md,
});

// 在组件中使用
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { dynamicCard, cardPadding, cardRadius } from './Card.css';

function Card({ padding = '1rem', radius = '0.5rem' }) {
  return (
    <div
      className={dynamicCard}
      style={assignInlineVars({
        [cardPadding]: padding,
        [cardRadius]: radius,
      })}
    >
      Card content
    </div>
  );
}

// 变体样式
export const cardVariants = styleVariants({
  elevated: {
    boxShadow: vars.shadows.lg,
  },
  outlined: {
    border: `1px solid ${vars.colors.light}`,
    boxShadow: 'none',
  },
  filled: {
    backgroundColor: vars.colors.light,
    boxShadow: 'none',
  },
});
```

### 7. CSS 生成器

```typescript
// src/utils/styles.css.ts
import { style, globalStyle } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css';

// 生成间距工具类
type SpaceKey = keyof typeof vars.space;

export function createSpacingStyles() {
  const spacingClasses: Record<string, string> = {};

  const directions = {
    t: 'Top',
    r: 'Right',
    b: 'Bottom',
    l: 'Left',
    x: ['Left', 'Right'],
    y: ['Top', 'Bottom'],
    a: '',
  };

  Object.keys(vars.space).forEach((key) => {
    const value = vars.space[key as SpaceKey];

    // Padding
    Object.entries(directions).forEach(([dir, props]) => {
      const className = `p${dir}_${key}`;
      if (Array.isArray(props)) {
        spacingClasses[className] = style({
          paddingLeft: value,
          paddingRight: value,
        });
      } else {
        spacingClasses[className] = style({
          [`padding${props}`]: value,
        });
      }
    });

    // Margin
    Object.entries(directions).forEach(([dir, props]) => {
      const className = `m${dir}_${key}`;
      if (Array.isArray(props)) {
        spacingClasses[className] = style({
          marginLeft: value,
          marginRight: value,
        });
      } else {
        spacingClasses[className] = style({
          [`margin${props}`]: value,
        });
      }
    });
  });

  return spacingClasses;
}

export const spacing = createSpacingStyles();

// 使用示例
import { spacing } from '../utils/styles.css';

<div className={spacing.pa_md}>
  <div className={spacing.mb_lg}>Content</div>
</div>
```

## 最佳实践

### 1. 组织结构

```typescript
// ✅ 好的组织
// 1. 主题定义在独立文件
// src/styles/theme.css.ts

// 2. 全局样式在独立文件
// src/styles/global.css.ts

// 3. 组件样式与组件在一起
// src/components/Button/Button.css.ts
// src/components/Button/Button.tsx

// ✅ 样式文件命名约定
// Component.css.ts - 样式定义
// Component.tsx - 组件实现
// Component.spec.ts - 测试
// index.ts - 导出

// ❌ 避免
// 在组件文件中直接写样式
// styles.ts（缺少 .css. 前缀）
```

### 2. 类型安全

```typescript
// ✅ 导出类型
import { recipe } from '@vanilla-extract/recipes';

export const button = recipe({
  // ...
});

// 导出变体类型
export type ButtonVariants = Parameters<typeof button>[0];

// 在组件中使用
interface ButtonProps {
  variant?: ButtonVariants['variant'];
  size?: ButtonVariants['size'];
}

// ✅ 使用主题类型
import { Theme } from '../styles/theme.css';

function createStyles(theme: Theme) {
  return {
    primary: {
      color: theme.colors.primary,
    },
  };
}
```

### 3. 性能优化

```typescript
// ✅ 使用 Sprinkles 避免重复样式
import { sprinkles } from '../styles/sprinkles.css';

const container = style([
  sprinkles({
    display: 'flex',
    padding: 'md',
    gap: 'sm',
  }),
  {
    // 仅添加独特的样式
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
]);

// ✅ 使用 Recipes 管理变体
export const button = recipe({
  variants: {
    variant: {
      primary: { /* ... */ },
      secondary: { /* ... */ },
    },
  },
});

// ❌ 避免为每个变体创建单独的样式
export const buttonPrimary = style({ /* ... */ });
export const buttonSecondary = style({ /* ... */ });
export const buttonOutline = style({ /* ... */ });
```

### 4. 调试

```typescript
// ✅ 使用有意义的类名
export const button = style({
  // ...
});

// ❌ 避免无意义的类名
export const style1 = style({ /* ... */ });

// ✅ 使用 CSS 变量调试
export const card = style({
  '--card-padding': vars.space.md,
  padding: 'var(--card-padding)',
  backgroundColor: vars.colors.white,
});
```

## 常用命令

### 开发命令

```bash
# 安装 Vanilla Extract
npm install @vanilla-extract/css
npm install -D @vanilla-extract/vite-plugin

# 安装扩展
npm install @vanilla-extract/recipes
npm install @vanilla-extract/sprinkles
npm install @vanilla-extract/dynamic

# 开发
npm run dev

# 构建
npm run build

# 类型检查
npm run type-check
```

### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    vanillaExtractPlugin({
      // 配置选项
      identifiers: process.env.NODE_ENV === 'production' ? 'short' : 'debug',
    }),
  ],
});
```

### Next.js 配置

```javascript
// next.config.js
const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin');

const withVanillaExtract = createVanillaExtractPlugin({
  identifiers: process.env.NODE_ENV === 'production' ? 'short' : 'debug',
});

module.exports = withVanillaExtract({
  // Next.js 配置
});
```

## 部署配置

### 1. package.json 脚本

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx,.css.ts"
  },
  "dependencies": {
    "@vanilla-extract/css": "^1.14.0",
    "@vanilla-extract/recipes": "^0.5.0",
    "@vanilla-extract/sprinkles": "^1.6.0",
    "react": "^18.2.0"
  },
  "devDependencies": {
    "@vanilla-extract/vite-plugin": "^4.0.0",
    "@vanilla-extract/esbuild-plugin": "^2.3.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### 2. TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

### 3. CI/CD 配置

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Type Check
        run: npm run type-check

      - name: Build
        run: npm run build

      - name: Test
        run: npm run test
```

## 相关资源

- [Vanilla Extract 官方文档](https://vanilla-extract.style/)
- [Vanilla Extract GitHub](https://github.com/vanilla-extract-css/vanilla-extract)
- [Recipes](https://vanilla-extract.style/documentation/packages/recipes/)
- [Sprinkles](https://vanilla-extract.style/documentation/packages/sprinkles/)
- [Dynamic](https://vanilla-extract.style/documentation/packages/dynamic/)
- [Integrations](https://vanilla-extract.style/documentation/integrations/)
- [CSS Modules](https://github.com/css-modules/css-modules)
