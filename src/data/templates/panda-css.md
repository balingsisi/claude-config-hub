# Panda CSS 开发模板

## 技术栈

- **核心**: Panda CSS (Zero-runtime CSS-in-JS)
- **构建工具**: Vite / Next.js / Webpack
- **类型系统**: TypeScript 5.x
- **框架集成**: React / Vue / Solid / Svelte
- **设计系统**: Tokens, Semantic Tokens, Recipes
- **样式工具**: CSSType, Conditional Styles

## 项目结构

```
panda-css-project/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Layout.tsx
│   ├── styles/
│   │   └── global.css         # 全局样式
│   ├── theme/
│   │   ├── tokens/
│   │   │   ├── colors.ts
│   │   │   ├── typography.ts
│   │   │   └── spacing.ts
│   │   ├── recipes/
│   │   │   ├── button.ts
│   │   │   └── card.ts
│   │   ├── text-styles/
│   │   │   └── index.ts
│   │   └── index.ts           # 主题入口
│   ├── App.tsx
│   └── main.tsx
├── panda.config.ts            # Panda CSS 配置
├── styled-system/             # 生成的样式系统
│   ├── css/
│   ├── tokens/
│   └── patterns/
├── package.json
└── tsconfig.json
```

## 代码模式

### 配置文件

```typescript
// panda.config.ts
import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  // 预设
  presets: ['@pandacss/preset-base'],

  // 是否包含所有工具类
  includeAll: false,

  // 源文件
  include: ['./src/**/*.{js,jsx,ts,tsx}'],

  // 排除文件
  exclude: [],

  // 输出目录
  outdir: 'styled-system',

  // 是否使用 JS 运行时（用于动态样式）
  jsxFramework: 'react',

  // 主题配置
  theme: {
    extend: {
      tokens: {
        colors: {
          primary: { value: '#3B82F6' },
          secondary: { value: '#8B5CF6' },
          accent: { value: '#F59E0B' },
        },
        fonts: {
          heading: { value: 'Inter, sans-serif' },
          body: { value: 'system-ui, sans-serif' },
        },
      },
      semanticTokens: {
        colors: {
          bg: {
            DEFAULT: { value: '{colors.white}' },
            muted: { value: '{colors.gray.100}' },
          },
          text: {
            DEFAULT: { value: '{colors.gray.900}' },
            muted: { value: '{colors.gray.500}' },
          },
        },
      },
    },
  },

  // 样式配方
  recipes: {
    button: {
      className: 'button',
      base: {
        px: '4',
        py: '2',
        borderRadius: 'md',
        fontWeight: 'medium',
        transition: 'all 0.2s',
      },
      variants: {
        variant: {
          solid: {
            bg: 'primary',
            color: 'white',
            _hover: { bg: 'primary/90' },
          },
          outline: {
            border: '1px solid',
            borderColor: 'primary',
            color: 'primary',
            _hover: { bg: 'primary/10' },
          },
          ghost: {
            color: 'primary',
            _hover: { bg: 'primary/10' },
          },
        },
        size: {
          sm: { fontSize: 'sm', px: '3', py: '1.5' },
          md: { fontSize: 'md', px: '4', py: '2' },
          lg: { fontSize: 'lg', px: '6', py: '3' },
        },
      },
      defaultVariants: {
        variant: 'solid',
        size: 'md',
      },
      compoundVariants: [
        {
          variant: 'solid',
          size: 'lg',
          css: { fontWeight: 'bold' },
        },
      ],
    },
  },

  // 文本样式
  textStyles: {
    heading: {
      value: {
        fontFamily: 'heading',
        fontWeight: 'bold',
        lineHeight: '1.2',
      },
    },
    body: {
      value: {
        fontFamily: 'body',
        lineHeight: '1.5',
      },
    },
  },

  // 图案（布局组合）
  patterns: {
    extend: {
      card: {
        properties: {
          p: { type: 'property', value: 'padding' },
          shadow: { type: 'property', value: 'boxShadow' },
        },
        transform(props) {
          return {
            bg: 'white',
            borderRadius: 'lg',
            boxShadow: 'md',
            p: '6',
            ...props,
          };
        },
      },
    },
  },
});
```

### 基础样式使用

```typescript
// src/components/Button.tsx
import { css } from '../../styled-system/css';
import { cva } from '../../styled-system/css';

// 使用 cva 定义组件变体
const buttonStyle = cva({
  base: {
    px: '4',
    py: '2',
    borderRadius: 'md',
    fontWeight: 'medium',
    cursor: 'pointer',
    transition: 'all 0.2s',
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  variants: {
    variant: {
      primary: {
        bg: 'primary',
        color: 'white',
        _hover: { bg: 'primary/90' },
      },
      secondary: {
        bg: 'secondary',
        color: 'white',
        _hover: { bg: 'secondary/90' },
      },
      danger: {
        bg: 'red.500',
        color: 'white',
        _hover: { bg: 'red.600' },
      },
    },
    size: {
      sm: { fontSize: 'sm', px: '3', py: '1' },
      md: { fontSize: 'md' },
      lg: { fontSize: 'lg', px: '6', py: '3' },
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={buttonStyle({ variant, size })}
      {...props}
    />
  );
}

// 使用 css 函数
export function InlineStyles() {
  return (
    <div
      className={css({
        display: 'flex',
        alignItems: 'center',
        gap: '4',
        p: '4',
        bg: 'bg',
        rounded: 'lg',
        shadow: 'md',
        _hover: { shadow: 'lg', transform: 'translateY(-2px)' },
      })}
    >
      <span className={css({ textStyle: 'heading', color: 'primary' })}>
        Title
      </span>
    </div>
  );
}
```

### Recipes 使用

```typescript
// src/theme/recipes/button.ts
import { defineRecipe } from '@pandacss/dev';

export const buttonRecipe = defineRecipe({
  className: 'button',
  description: 'Button component styles',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    px: '4',
    py: '2',
    borderRadius: 'md',
    fontWeight: 'medium',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  variants: {
    variant: {
      solid: {
        bg: 'primary',
        color: 'white',
        _hover: { bg: 'primary/90' },
        _active: { bg: 'primary/80' },
      },
      outline: {
        border: '2px solid',
        borderColor: 'primary',
        color: 'primary',
        _hover: { bg: 'primary/10' },
      },
      ghost: {
        color: 'primary',
        _hover: { bg: 'primary/10' },
      },
    },
    size: {
      sm: { fontSize: 'sm', h: '8', px: '3' },
      md: { fontSize: 'md', h: '10', px: '4' },
      lg: { fontSize: 'lg', h: '12', px: '6' },
    },
    fullWidth: {
      true: { width: 'full' },
    },
  },
  defaultVariants: {
    variant: 'solid',
    size: 'md',
  },
  compoundVariants: [
    {
      variant: 'outline',
      size: 'lg',
      css: { borderWidth: '3px' },
    },
  ],
});

// 在组件中使用
import { button } from '../../styled-system/recipes';

export function Button({ variant, size, fullWidth, ...props }) {
  return (
    <button
      className={button({ variant, size, fullWidth })}
      {...props}
    />
  );
}
```

### 布局 Patterns

```typescript
// src/components/Layout.tsx
import { flex, grid, stack, wrap } from '../../styled-system/patterns';
import { css } from '../../styled-system/css';

export function FlexLayout() {
  return (
    <div className={flex({ justify: 'space-between', align: 'center', gap: '4' })}>
      <div className={css({ flex: '1' })}>Left</div>
      <div>Right</div>
    </div>
  );
}

export function GridLayout() {
  return (
    <div
      className={grid({
        columns: { base: 1, md: 2, lg: 3 },
        gap: '6',
      })}
    >
      {items.map((item) => (
        <Card key={item.id} {...item} />
      ))}
    </div>
  );
}

export function StackLayout() {
  return (
    <div className={stack({ gap: '4', align: 'stretch' })}>
      <Header />
      <Main />
      <Footer />
    </div>
  );
}

export function WrapLayout() {
  return (
    <div className={wrap({ gap: '2', justify: 'center' })}>
      {tags.map((tag) => (
        <Tag key={tag}>{tag}</Tag>
      ))}
    </div>
  );
}

// 浮动布局
import { float } from '../../styled-system/patterns';

export function FloatingButton() {
  return (
    <div className={float({ placement: 'bottom-right', offset: '4' })}>
      <Button>+</Button>
    </div>
  );
}

// 分割布局
import { divider } from '../../styled-system/patterns';

export function SplitSection() {
  return (
    <div className={divider({ orientation: 'horizontal', gap: '8' })}>
      <LeftPanel />
      <RightPanel />
    </div>
  );
}
```

### 语义化 Tokens

```typescript
// src/theme/tokens/colors.ts
import { defineTokens } from '@pandacss/dev';

export const colors = defineTokens.colors({
  // 基础颜色
  transparent: { value: 'transparent' },
  current: { value: 'currentColor' },

  // 品牌色
  brand: {
    primary: { value: '#3B82F6' },
    secondary: { value: '#8B5CF6' },
    accent: { value: '#F59E0B' },
  },

  // 语义色
  success: { value: '#22C55E' },
  warning: { value: '#F59E0B' },
  error: { value: '#EF4444' },
  info: { value: '#3B82F6' },

  // 灰度
  gray: {
    50: { value: '#F9FAFB' },
    100: { value: '#F3F4F6' },
    200: { value: '#E5E7EB' },
    300: { value: '#D1D5DB' },
    400: { value: '#9CA3AF' },
    500: { value: '#6B7280' },
    600: { value: '#4B5563' },
    700: { value: '#374151' },
    800: { value: '#1F2937' },
    900: { value: '#111827' },
    950: { value: '#030712' },
  },
});

// panda.config.ts 中的语义 Tokens
semanticTokens: {
  colors: {
    bg: {
      DEFAULT: { value: '{colors.white}' },
      subtle: { value: '{colors.gray.50}' },
      muted: { value: '{colors.gray.100}' },
    },
    fg: {
      DEFAULT: { value: '{colors.gray.900}' },
      muted: { value: '{colors.gray.500}' },
      subtle: { value: '{colors.gray.400}' },
    },
    border: {
      DEFAULT: { value: '{colors.gray.200}' },
      muted: { value: '{colors.gray.100}' },
    },
    accent: {
      DEFAULT: { value: '{colors.brand.primary}' },
      fg: { value: '{colors.white}' },
      muted: { value: '{colors.brand.primary/20}' },
    },
  },
}

// 使用语义 Tokens
<div className={css({
  bg: 'bg',
  color: 'fg',
  borderColor: 'border',
  _hover: { bg: 'bg.subtle' },
})}>
  Content
</div>
```

### 条件样式

```typescript
// 响应式样式
export function ResponsiveCard() {
  return (
    <div
      className={css({
        p: { base: '4', md: '6', lg: '8' },
        fontSize: { base: 'sm', md: 'md' },
        flexDirection: { base: 'column', md: 'row' },
        gap: { base: '2', md: '4' },
      })}
    >
      Content
    </div>
  );
}

// 状态样式
export function InteractiveCard({ isSelected, isDisabled }) {
  return (
    <div
      className={css({
        p: '4',
        borderRadius: 'lg',
        bg: 'bg',
        border: '2px solid',
        borderColor: 'border',
        cursor: 'pointer',
        transition: 'all 0.2s',

        // 状态变体
        _hover: {
          borderColor: 'primary',
          shadow: 'md',
        },
        _focus: {
          outline: 'none',
          ring: '2px',
          ringColor: 'primary',
        },
        _active: {
          transform: 'scale(0.98)',
        },
        _disabled: {
          opacity: 0.5,
          cursor: 'not-allowed',
        },

        // 自定义属性条件
        ...(isSelected && {
          borderColor: 'primary',
          bg: 'primary/5',
        }),
        ...(isDisabled && {
          pointerEvents: 'none',
        }),
      })}
    >
      Card Content
    </div>
  );
}

// 深色模式
export function DarkModeSupport() {
  return (
    <div
      className={css({
        bg: { base: 'white', _dark: 'gray.900' },
        color: { base: 'gray.900', _dark: 'gray.100' },
        borderColor: { base: 'gray.200', _dark: 'gray.700' },
      })}
    >
      Content
    </div>
  );
}

// 组选择器
<div className={css({
  '& > p': {
    marginBottom: '4',
  },
  '&:first-child': {
    marginTop: '0',
  },
  '&:is(:hover, :focus)': {
    bg: 'primary/10',
  },
})}>
  Content
</div>
```

### JSX 风格

```typescript
// panda.config.ts
export default defineConfig({
  jsxFramework: 'react',
  jsxFactory: 'styled',
});

// 组件定义
import { styled } from '../../styled-system/jsx';

export const Box = styled('div', {
  base: {
    p: '4',
    borderRadius: 'lg',
    bg: 'bg',
  },
});

export const Flex = styled('div', {
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '4',
  },
});

export const Text = styled('p', {
  base: {
    color: 'fg',
    lineHeight: '1.5',
  },
  variants: {
    size: {
      sm: { fontSize: 'sm' },
      md: { fontSize: 'md' },
      lg: { fontSize: 'lg' },
    },
    weight: {
      normal: { fontWeight: 'normal' },
      medium: { fontWeight: 'medium' },
      bold: { fontWeight: 'bold' },
    },
  },
  defaultVariants: {
    size: 'md',
    weight: 'normal',
  },
});

// 使用
<Flex>
  <Box>
    <Text size="lg" weight="bold">Hello</Text>
  </Box>
</Flex>
```

## 最佳实践

### 1. Token 组织

```typescript
// src/theme/index.ts
import { defineTheme } from '@pandacss/dev';

export const theme = defineTheme({
  tokens: {
    colors: import('./tokens/colors').then((m) => m.colors),
    fonts: import('./tokens/fonts').then((m) => m.fonts),
    spacing: import('./tokens/spacing').then((m) => m.spacing),
  },
  semanticTokens: {
    colors: import('./tokens/semantic-colors').then((m) => m.semanticColors),
  },
});
```

### 2. 组件封装

```typescript
// src/components/ui/Card.tsx
import { css, sva } from '../../styled-system/css';

const cardSlotStyle = sva({
  slots: ['root', 'header', 'body', 'footer'],
  base: {
    root: {
      bg: 'bg',
      borderRadius: 'xl',
      shadow: 'md',
      overflow: 'hidden',
    },
    header: {
      p: '4',
      borderBottom: '1px solid',
      borderColor: 'border',
    },
    body: {
      p: '4',
    },
    footer: {
      p: '4',
      borderTop: '1px solid',
      borderColor: 'border',
      bg: 'bg.subtle',
    },
  },
  variants: {
    variant: {
      elevated: {
        root: { shadow: 'lg' },
      },
      outlined: {
        root: { border: '1px solid', borderColor: 'border', shadow: 'none' },
      },
    },
  },
});

interface CardProps {
  variant?: 'elevated' | 'outlined';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Card({ variant, header, footer, children }: CardProps) {
  const styles = cardSlotStyle({ variant });

  return (
    <div className={styles.root}>
      {header && <div className={styles.header}>{header}</div>}
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
```

### 3. 全局样式

```css
/* src/styles/global.css */
@layer reset, base, tokens, recipes, utilities;

:root {
  --font-heading: 'Inter', sans-serif;
  --font-body: system-ui, sans-serif;
}

html {
  font-family: var(--font-body);
  line-height: 1.5;
}

body {
  margin: 0;
  min-height: 100vh;
}

/* 使用 Panda 生成的层 */
@layer base {
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
    font-weight: 700;
  }
}
```

### 4. 类型安全

```typescript
// 扩展 Panda CSS 类型
declare module '../../styled-system/css' {
  interface CustomProperties {
    // 自定义属性
  }
}

// 导出类型
export type { ColorToken, SpacingToken } from '../../styled-system/tokens';
```

## 常用命令

```bash
# 安装
npm install -D @pandacss/dev

# 初始化
npx panda init

# 生成样式
npx panda codegen

# 监听模式（开发）
npx panda codegen --watch

# 清理生成文件
npx panda cssgen --clean

# 导出 CSS
npx panda cssgen --outfile styles.css

# 分析样式使用
npx panda analyze

# 类型检查
tsc --noEmit
```

## 部署配置

### Next.js 集成

```javascript
// next.config.js
const { withPanda } = require('@pandacss/nextjs');

module.exports = withPanda({
  reactStrictMode: true,
});
```

```json
// package.json
{
  "scripts": {
    "dev": "panda codegen --watch & next dev",
    "build": "panda codegen && next build",
    "start": "next start"
  }
}
```

### Vite 集成

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pandaCss } from '@pandacss/dev/vite';

export default defineConfig({
  plugins: [
    react(),
    pandaCss(),
  ],
});
```

### Storybook 集成

```javascript
// .storybook/main.js
module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: '@storybook/react-vite',
  viteFinal: async (config) => {
    const { pandaCss } = await import('@pandacss/dev/vite');
    config.plugins.push(pandaCss());
    return config;
  },
};
```

### 环境变量

```bash
# .env
PANDA_CACHE=true           # 启用缓存
PANDA_WATCH=true           # 开发时监听
PANDA_LOG_LEVEL=info       # 日志级别
```

## 扩展资源

- [Panda CSS 官方文档](https://panda-css.com/)
- [Panda CSS GitHub](https://github.com/chakra-ui/panda)
- [Recipes 指南](https://panda-css.com/docs/concepts/recipes)
- [Patterns 文档](https://panda-css.com/docs/concepts/patterns)
- [与 Tailwind 对比](https://panda-css.com/docs/comparison/tailwind)
