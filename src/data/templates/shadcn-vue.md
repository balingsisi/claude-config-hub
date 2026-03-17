# shadcn-vue 模板

## 技术栈

### 核心技术
- **shadcn-vue**: 可复制粘贴的 Vue 组件库
- **Radix Vue**: 无样式可访问性组件原语
- **Tailwind CSS**: 实用优先的 CSS 框架
- **Class Variance Authority (CVA)**: 组件变体管理
- **clsx + tailwind-merge**: 类名合并工具
- **radix-vue**: Vue 3 无样式 UI 原语

### 开发工具
- **Vue 3**: Composition API
- **TypeScript**: 类型安全
- **Vite**: 构建工具
- **Lucide Vue Next**: 图标库
- **VeeValidate**: 表单验证
- **Zod**: 模式验证

## 项目结构

```
shadcn-vue-project/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn-vue 组件
│   │   │   ├── button/
│   │   │   │   ├── Button.vue
│   │   │   │   └── index.ts
│   │   │   ├── card/
│   │   │   │   ├── Card.vue
│   │   │   │   ├── CardHeader.vue
│   │   │   │   ├── CardTitle.vue
│   │   │   │   ├── CardDescription.vue
│   │   │   │   ├── CardContent.vue
│   │   │   │   ├── CardFooter.vue
│   │   │   │   └── index.ts
│   │   │   ├── dialog/
│   │   │   │   ├── Dialog.vue
│   │   │   │   ├── DialogTrigger.vue
│   │   │   │   ├── DialogContent.vue
│   │   │   │   └── index.ts
│   │   │   ├── dropdown-menu/
│   │   │   ├── form/
│   │   │   ├── input/
│   │   │   ├── select/
│   │   │   ├── table/
│   │   │   ├── tabs/
│   │   │   ├── toast/
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Header.vue
│   │   │   ├── Sidebar.vue
│   │   │   ├── Footer.vue
│   │   │   └── MobileNav.vue
│   │   └── features/
│   │       ├── UserProfile.vue
│   │       ├── DataTable.vue
│   │       └── SettingsForm.vue
│   ├── lib/
│   │   ├── utils.ts               # cn() 等工具函数
│   │   └── constants.ts
│   ├── composables/
│   │   ├── useToast.ts
│   │   └── useMediaQuery.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.vue
│   └── main.ts
├── public/
├── components.json                # shadcn-vue 配置
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

## 核心代码模式

### 1. cn() 工具函数

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 2. Button 组件（CVA 变体）

```vue
<!-- src/components/ui/button/Button.vue -->
<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

type ButtonVariants = VariantProps<typeof buttonVariants>

interface Props {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
})
</script>

<template>
  <button
    :class="cn(buttonVariants({ variant, size }), props.class)"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
```

### 3. Dialog 组合式组件

```vue
<!-- src/components/ui/dialog/Dialog.vue -->
<script setup lang="ts">
import {
  DialogRoot,
  type DialogRootEmits,
  type DialogRootProps,
  useForwardPropsEmits,
} from 'radix-vue'

const props = defineProps<DialogRootProps>()
const emits = defineEmits<DialogRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DialogRoot v-bind="forwarded">
    <slot />
  </DialogRoot>
</template>
```

```vue
<!-- src/components/ui/dialog/DialogContent.vue -->
<script setup lang="ts">
import { cn } from '@/lib/utils'
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
  type DialogContentEmits,
  type DialogContentProps,
} from 'radix-vue'
import { X } from 'lucide-vue-next'

interface Props extends DialogContentProps {
  class?: string
}

const props = defineProps<Props>()
const emits = defineEmits<DialogContentEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <DialogContent
      v-bind="forwarded"
      :class="cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        props.class
      )"
    >
      <slot />
      <button
        class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
      >
        <X class="h-4 w-4" />
        <span class="sr-only">Close</span>
      </button>
    </DialogContent>
  </DialogPortal>
</template>
```

### 4. Form 表单验证（VeeValidate + Zod）

```vue
<!-- src/components/ui/form/Form.vue -->
<script setup lang="ts">
import { Form as VeeForm, type GenericForm } from 'vee-validate'

interface Props {
  schema?: any
  initialValues?: Record<string, any>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: [values: any]
}>()

const handleSubmit = async (values: any, { resetForm }: any) => {
  emit('submit', values)
  resetForm()
}
</script>

<template>
  <VeeForm
    :validation-schema="schema"
    :initial-values="initialValues"
    @submit="handleSubmit"
  >
    <slot />
  </VeeForm>
</template>
```

```vue
<!-- src/components/features/SettingsForm.vue -->
<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useForm } from 'vee-validate'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import FormItem from '@/components/ui/form/FormItem.vue'
import FormLabel from '@/components/ui/form/FormLabel.vue'
import FormControl from '@/components/ui/form/FormControl.vue'
import FormMessage from '@/components/ui/form/FormMessage.vue'

const schema = toTypedSchema(
  z.object({
    username: z.string().min(2, '用户名至少2个字符'),
    email: z.string().email('请输入有效的邮箱'),
  })
)

const { handleSubmit } = useForm({
  validationSchema: schema,
})

const onSubmit = handleSubmit((values) => {
  console.log('Form submitted:', values)
})
</script>

<template>
  <form @submit="onSubmit" class="space-y-4">
    <FormItem>
      <FormLabel>用户名</FormLabel>
      <FormControl>
        <Input name="username" placeholder="请输入用户名" />
      </FormControl>
      <FormMessage />
    </FormItem>

    <FormItem>
      <FormLabel>邮箱</FormLabel>
      <FormControl>
        <Input name="email" type="email" placeholder="请输入邮箱" />
      </FormControl>
      <FormMessage />
    </FormItem>

    <Button type="submit">提交</Button>
  </form>
</template>
```

### 5. Toast 通知系统

```typescript
// src/composables/useToast.ts
import { ref } from 'vue'
import type { Toast } from '@/types'

const toasts = ref<Toast[]>([])

export function useToast() {
  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    toasts.value.push({ ...toast, id })
    
    setTimeout(() => {
      removeToast(id)
    }, toast.duration || 5000)
  }

  const removeToast = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts,
    addToast,
    removeToast,
    success: (title: string, description?: string) =>
      addToast({ title, description, variant: 'success' }),
    error: (title: string, description?: string) =>
      addToast({ title, description, variant: 'destructive' }),
  }
}
```

## 最佳实践

### 1. 组件设计原则

```typescript
// ✅ 好的做法：使用 Composition API + TypeScript
<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

defineProps<Props>()
</script>

// ❌ 避免：Options API
export default {
  props: {
    title: String,
  },
}
```

### 2. 组件复用策略

```vue
<!-- ✅ 提取可复用逻辑到 composables -->
<script setup lang="ts">
import { useMediaQuery } from '@/composables/useMediaQuery'

const isMobile = useMediaQuery('(max-width: 768px)')
</script>

<template>
  <div :class="{ 'mobile-view': isMobile }">
    <!-- 内容 -->
  </div>
</template>
```

### 3. 样式管理

```typescript
// ✅ 使用 CVA 管理变体
const buttonVariants = cva('base-styles', {
  variants: {
    intent: {
      primary: 'bg-blue-500',
      secondary: 'bg-gray-500',
    },
  },
})

// ❌ 避免硬编码类名
:class="variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500'"
```

### 4. 访问性（A11y）

```vue
<!-- ✅ 始终包含无障碍属性 -->
<button
  aria-label="关闭对话框"
  aria-describedby="dialog-description"
>
  <X class="h-4 w-4" />
</button>
```

### 5. 性能优化

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// ✅ 异步加载大型组件
const HeavyChart = defineAsyncComponent(() =>
  import('@/components/HeavyChart.vue')
)
</script>
```

## 常用命令

### 安装组件

```bash
# 初始化 shadcn-vue
npx shadcn-vue@latest init

# 添加单个组件
npx shadcn-vue@latest add button
npx shadcn-vue@latest add card
npx shadcn-vue@latest add dialog

# 添加多个组件
npx shadcn-vue@latest add button card dialog input

# 查看所有可用组件
npx shadcn-vue@latest add
```

### 开发

```bash
# 启动开发服务器
pnpm dev

# 类型检查
pnpm type-check

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

### 代码质量

```bash
# 运行 ESLint
pnpm lint

# 自动修复 ESLint 错误
pnpm lint:fix

# 运行 Prettier
pnpm format

# 类型检查
pnpm type-check
```

## 部署配置

### 1. Vite 构建配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'radix-vue': ['radix-vue'],
          'lucide': ['lucide-vue-next'],
        },
      },
    },
  },
})
```

### 2. TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 3. Tailwind 配置

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### 4. components.json 配置

```json
{
  "$schema": "https://shadcn-vue.com/schema.json",
  "style": "default",
  "typescript": true,
  "tsConfigPath": "./tsconfig.json",
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/assets/style.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "framework": "vite",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

### 5. 环境变量

```bash
# .env
VITE_APP_TITLE=My App
VITE_API_URL=https://api.example.com
```

### 6. Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
server {
  listen 80;
  server_name localhost;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

### 7. Vercel 部署

```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "pnpm install"
}
```

### 8. Netlify 部署

```toml
# netlify.toml
[build]
  command = "pnpm build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 相关资源

- [shadcn-vue 官方文档](https://www.shadcn-vue.com/)
- [Radix Vue 文档](https://www.radix-vue.com/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Vue 3 文档](https://vuejs.org/)
- [Vite 文档](https://vitejs.dev/)
- [Class Variance Authority](https://cva.style/)
