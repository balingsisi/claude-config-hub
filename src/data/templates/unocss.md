# UnoCSS 原子化 CSS 引擎模板

## 项目概述

UnoCSS 是即时的按需原子化 CSS 引擎，比 Tailwind CSS 更快、更灵活。支持自定义规则、图标、属性模式等高级功能。

## 技术栈

- **核心**: UnoCSS 0.58+
- **构建工具**: Vite 5 / Webpack 5 / Rollup
- **预设**: @unocss/preset-uno, @unocss/preset-icons, @unocss/preset-attributify
- **图标**: @iconify/json (100+ 图标集)
- **框架**: React / Vue / Svelte / Solid
- **类型**: TypeScript 5

## 项目结构

```
unocss-project/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   ├── styles/
│   │   └── global.css       # 全局样式
│   ├── App.tsx
│   └── main.tsx
├── uno.config.ts             # UnoCSS 配置
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## 核心配置

### 1. UnoCSS 配置

```typescript
// uno.config.ts
import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss'
import { presetAnimations } from 'unocss-preset-animations'

export default defineConfig({
  // 预设
  presets: [
    presetUno(),                    // Tailwind / Windi CSS 兼容
    presetAttributify(),            // 属性模式
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/',
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle'
      }
    }),
    presetWebFonts({
      fonts: {
        sans: 'Inter:400,600,800',
        mono: 'DM Mono'
      }
    }),
    presetAnimations()
  ],

  // 转换器
  transformers: [
    transformerDirectives(),        // @apply, @screen, @tailwind
    transformerVariantGroup()       // 变体组语法
  ],

  // 自定义规则
  rules: [
    // 静态规则
    ['m-1', { margin: '0.25rem' }],
    
    // 动态规则
    [/^m-(\d+)$/, ([, d]) => ({ margin: `${d}px` })],
    
    // 带选项的规则
    [/^text-(red|green|blue)$/, ([, c]) => ({ color: c })],
    
    // 完整规则
    [
      /^custom-(\d+)$/, 
      ([, d], { theme }) => ({
        padding: `${d}px`,
        margin: `${d}px`,
        backgroundColor: theme.colors.primary
      })
    ]
  ],

  // 自定义快捷方式
  shortcuts: {
    // 静态快捷方式
    'btn': 'px-4 py-2 rounded inline-block bg-blue-500 text-white cursor-pointer hover:bg-blue-600 disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50',
    'btn-icon': 'btn inline-flex items-center justify-center gap-1',
    
    // 动态快捷方式
    'btn-lg': 'btn text-lg px-6 py-3',
    'btn-sm': 'btn text-sm px-2 py-1',
    
    // 复杂快捷方式
    'card': 'bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow',
    'card-header': 'text-2xl font-bold mb-4 text-gray-900 dark:text-white',
    
    // 响应式快捷方式
    'container': 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    'section': 'py-8 md:py-12 lg:py-16'
  },

  // 主题定制
  theme: {
    colors: {
      primary: {
        DEFAULT: '#3B82F6',
        50: '#EFF6FF',
        100: '#DBEAFE',
        200: '#BFDBFE',
        300: '#93C5FD',
        400: '#60A5FA',
        500: '#3B82F6',
        600: '#2563EB',
        700: '#1D4ED8',
        800: '#1E40AF',
        900: '#1E3A8A'
      },
      secondary: {
        DEFAULT: '#8B5CF6',
        // ... 其他色阶
      }
    },
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    },
    fontFamily: {
      sans: 'Inter, system-ui, sans-serif',
      mono: 'DM Mono, monospace'
    },
    animation: {
      'fade-in': 'fadeIn 0.5s ease-in-out',
      'slide-up': 'slideUp 0.3s ease-out',
      'bounce-in': 'bounceIn 0.5s'
    }
  },

  // 变体
  variants: [
    // 自定义 hover 变体
    {
      name: 'hover',
      match: v => v.startsWith('hover:') && v.slice(6),
      selector: s => `${s}:hover`
    }
  ],

  // 图标配置
  safelist: [
    // 预加载图标
    'i-carbon-logo-github',
    'i-carbon-logo-twitter',
    'i-heroicons-user'
  ]
})
```

### 2. Vite 集成

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [
    UnoCSS({
      // 配置文件路径
      configFile: './uno.config.ts',
      
      // 开发模式配置
      mode: 'vue-scoped',  // 或 'shadow-dom', 'svelte-scoped'
      
      // 注入 CSS 到入口
      inject: {
        /** 
         * 可选值：
         * - true: 自动注入到入口
         * - false: 手动导入
         * - 'virtual': 虚拟模块导入
         */
      }
    }),
    react()
  ],
  
  // CSS 配置
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  }
})
```

### 3. 组件使用示例

```tsx
// src/components/Button.tsx
import { defineComponent } from 'react'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  children
}: ButtonProps) {
  const baseClasses = 'btn transition-all duration-200'
  
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        flex items-center gap-2
      `}
      disabled={disabled || loading}
    >
      {loading ? (
        <div className="i-carbon-renew animate-spin" />
      ) : icon ? (
        <div className={icon} />
      ) : null}
      {children}
    </button>
  )
}

// 使用
<Button variant="primary" size="lg" icon="i-carbon-add">
  创建项目
</Button>
```

```tsx
// src/components/Card.tsx
export function Card({ title, children }) {
  return (
    <div className="card hover:scale-105 transition-transform">
      <h3 className="card-header">{title}</h3>
      <div className="text-gray-600 dark:text-gray-300">
        {children}
      </div>
    </div>
  )
}
```

### 4. 属性模式（Attributify Mode）

```tsx
// 启用属性模式后，可以像这样使用
<button
  bg="blue-500 hover:blue-600"
  text="white"
  p="x-4 y-2"
  rounded="lg"
  transition="all duration-200"
>
  属性模式按钮
</button>

<div
  m="t-4 b-8"
  p="x-6 y-4"
  border="1 gray-200 rounded"
>
  属性模式容器
</div>

// 图标也可以用属性模式
<div i="carbon-logo-github" text="3xl blue-500" />
```

### 5. 图标使用

```tsx
// 直接使用图标类名
<div className="i-carbon-home text-2xl text-blue-500" />

// 图标 + 文字
<button className="flex items-center gap-2">
  <div className="i-carbon-add text-lg" />
  添加
</button>

// 动态图标
function Icon({ name, size = 'md' }) {
  const sizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  }
  
  return <div className={`${name} ${sizeMap[size]}`} />
}

// 使用
<Icon name="i-carbon-logo-github" size="lg" />
```

### 6. 变体组（Variant Group）

```tsx
// 使用变体组语法简化代码
<div className="hover:(bg-blue-500 text-white scale-105)">
  悬停时多个样式
</div>

// 等价于
<div className="hover:bg-blue-500 hover:text-white hover:scale-105">
  悬停时多个样式
</div>

// 响应式变体组
<div className="sm:(p-4 bg-gray-100) lg:(p-8 bg-white)">
  响应式样式
</div>

// 状态变体组
<button className="focus:(ring-2 ring-blue-500 outline-none)">
  聚焦样式
</button>
```

### 7. 自定义指令

```css
/* src/styles/global.css */
@layer base {
  html {
    @apply antialiased;
  }
  
  body {
    @apply bg-white dark:bg-gray-900 text-gray-900 dark:text-white;
  }
}

@layer components {
  .custom-component {
    @apply rounded-lg shadow-md p-6;
    @apply bg-gradient-to-r from-blue-500 to-purple-500;
  }
}

@layer utilities {
  .text-shadow {
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  }
}
```

### 8. 响应式设计

```tsx
// 响应式网格
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => (
    <Card key={item.id} {...item} />
  ))}
</div>

// 响应式布局
<div className="flex flex-col md:flex-row lg:flex-row-reverse gap-4">
  <aside className="w-full md:w-64 lg:w-80">
    侧边栏
  </aside>
  <main className="flex-1">
    主内容
  </main>
</div>

// 响应式间距
<section className="px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
  响应式间距
</section>
```

### 9. 深色模式

```tsx
// 自动深色模式
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  自动深色模式
</div>

// 手动控制
import { useDark, useToggle } from '@vueuse/core'

function App() {
  const isDark = useDark()
  const toggleDark = useToggle(isDark)

  return (
    <>
      <button onClick={toggleDark}>
        <div className={
          isDark.value ? 'i-carbon-moon' : 'i-carbon-sun'
        } />
      </button>
      
      <div className="bg-white dark:bg-gray-900">
        内容
      </div>
    </>
  )
}
```

## 最佳实践

### 1. 性能优化

```typescript
// uno.config.ts
export default defineConfig({
  // 1. 使用 safelist 预生成动态类名
  safelist: [
    // 动态生成的类名
    ...['red', 'green', 'blue'].map(c => `bg-${c}-500`),
    
    // 图标
    'i-carbon-logo-github'
  ],
  
  // 2. 排除不需要的预设
  presets: [
    presetUno({
      // 不生成某些工具类
      preflight: false
    })
  ],
  
  // 3. 按需生成
  mode: 'react-scoped',  // 作用域模式，减少 CSS 体积
})
```

### 2. 组件库模式

```typescript
// uno.config.ts
import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  presets: [presetUno()],
  
  // 导出配置供其他项目使用
  exportConfig: {
    name: 'my-design-system',
    include: ['shortcuts', 'theme']
  }
})

// 其他项目中引用
import { defineConfig, presetUno } from 'unocss'
import myDesignSystem from 'my-design-system/unocss.config'

export default defineConfig({
  presets: [
    presetUno(),
    myDesignSystem
  ]
})
```

### 3. CSS 层级控制

```typescript
// 使用 @layer 控制优先级
// base < components < utilities < shortcuts
export default defineConfig({
  rules: [
    [/^custom-(.+)$/, ([, name], { theme }) => {
      return {
        'padding': theme.spacing[4],
        'margin': theme.spacing[2]
      }
    }, { layer: 'components' }]
  ]
})
```

### 4. 类型安全

```typescript
// uno.config.ts - 类型检查
import { defineConfig, presetUno } from 'unocss'
import type { Theme } from 'unocss/preset-uno'

declare module 'unocss' {
  interface Theme {
    // 扩展主题类型
    colors: {
      brand: string
    }
  }
}

export default defineConfig<Theme>({
  theme: {
    colors: {
      brand: '#FF6B6B'  // 有类型提示
    }
  }
})
```

## 常用命令

```bash
# 安装
npm install -D unocss @unocss/reset

# 开发
npm run dev

# 构建
npm run build

# 生成静态 CSS
npx unocss src/**/*.tsx -o dist/uno.css

# 查看生成的 CSS
npx unocss src/**/*.tsx --watch

# 预检模式（生成所有可能用到的类）
npx unocss --preflight

# 图标搜索
npx unocss-list-icons
```

## 与 Tailwind CSS 对比

| 特性 | UnoCSS | Tailwind CSS |
|------|--------|--------------|
| 性能 | 🚀 极快 (5x+) | 快 |
| 体积 | 更小 (纯 CSS-in-JS) | 较大 |
| 灵活性 | 自定义规则、图标、属性模式 | 有限 |
| 学习曲线 | 相似 | 基准 |
| 生态系统 | 快速发展中 | 成熟 |
| 预设 | 兼容 Tailwind | 原生 |

## VS Code 集成

```json
// .vscode/settings.json
{
  "unocss.root": ".",
  "unocss.autocomplete": true,
  "unocss.colorPreview": true,
  "unocss.remToPxRatio": 16
}

// 安装扩展
// - UnoCSS (antfu.unocss)
```

## 部署配置

### Vercel

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 资源

- [UnoCSS 官方文档](https://unocss.dev/)
- [UnoCSS Playground](https://unocss.dev/play/)
- [Awesome UnoCSS](https://github.com/unocss/awesome-unocss)
- [Iconify 图标库](https://icon-sets.iconify.design/)
