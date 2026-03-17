# shadcn/ui 模板

## 技术栈

### 核心技术
- **shadcn/ui**: 可复制粘贴的 React 组件库
- **Radix UI**: 无样式可访问性组件原语
- **Tailwind CSS**: 实用优先的 CSS 框架
- **Class Variance Authority (CVA)**: 组件变体管理
- **clsx + tailwind-merge**: 类名合并工具

### 开发工具
- **TypeScript**: 类型安全
- **Lucide React**: 图标库
- **React Hook Form**: 表单处理（可选）
- **Zod**: 模式验证（可选）

## 项目结构

```
shadcn-ui-project/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui 组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── footer.tsx
│   │   │   └── mobile-nav.tsx
│   │   └── features/
│   │       ├── user-profile.tsx
│   │       ├── data-table.tsx
│   │       └── settings-form.tsx
│   ├── lib/
│   │   ├── utils.ts               # cn() 等工具函数
│   │   └── constants.ts
│   ├── hooks/
│   │   ├── use-toast.ts
│   │   └── use-media-query.ts
│   ├── styles/
│   │   └── globals.css            # Tailwind + CSS 变量
│   ├── types/
│   │   └── index.ts
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx
│       └── globals.css
├── components.json                # shadcn/ui 配置
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── .env.local
```

## 代码模式

### 1. 工具函数 (lib/utils.ts)

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 2. 组件变体 (CVA 模式)

```typescript
// components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### 3. 主题配置 (globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 4. 组合组件示例

```typescript
// components/features/user-profile.tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export function UserProfile() {
  const { toast } = useToast()

  const handleSave = () => {
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>Update your account details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Enter your name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="Enter your email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="guest">Guest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save changes</Button>
      </CardFooter>
    </Card>
  )
}
```

### 5. 数据表格模式

```typescript
// components/features/data-table.tsx
"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

## 最佳实践

### 1. 组件组织
```typescript
// ✅ 好的做法：每个 UI 组件独立文件
components/ui/button.tsx
components/ui/card.tsx
components/ui/dialog.tsx

// ✅ 业务组件放在 features 目录
components/features/user-profile.tsx
components/features/dashboard-stats.tsx

// ❌ 避免在一个文件中混合多个 UI 组件
```

### 2. 样式扩展
```typescript
// ✅ 使用 cn() 合并类名
<Button className={cn("mt-4", isLarge && "h-12")}>

// ✅ 保持组件变体的一致性
const customVariants = cva("base-classes", {
  variants: {
    intent: {
      primary: "bg-blue-500",
      secondary: "bg-gray-500",
    },
  },
})

// ❌ 避免硬编码样式值
<Button style={{ backgroundColor: 'red' }}>
```

### 3. 可访问性
```typescript
// ✅ 使用 Radix UI 的可访问性特性
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogTitle>Dialog Title</DialogTitle>
    <DialogDescription>Description</DialogDescription>
    {/* 内容 */}
  </DialogContent>
</Dialog>

// ✅ 提供适当的 ARIA 标签
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>
```

### 4. 主题管理
```typescript
// ✅ 使用 next-themes 管理主题
import { ThemeProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      {children}
    </ThemeProvider>
  )
}

// ✅ 支持系统主题
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
```

### 5. 表单处理
```typescript
// ✅ 结合 react-hook-form 和 zod
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"

const formSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
})

export function UserForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
```

### 6. 响应式设计
```typescript
// ✅ 使用 Tailwind 响应式前缀
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ✅ 使用 useMediaQuery 钩子
const isDesktop = useMediaQuery("(min-width: 768px)")

// ✅ 移动优先设计
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="md:hidden">
      <Menu className="h-5 w-5" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    {/* Mobile navigation */}
  </SheetContent>
</Sheet>
```

## 常用命令

### 安装和初始化
```bash
# 创建 Next.js 项目（推荐）
npx create-next-app@latest my-app --typescript --tailwind --eslint

# 初始化 shadcn/ui
npx shadcn-ui@latest init

# 初始化时选择配置
# - Style: Default / New York
# - Base color: Slate / Gray / Zinc / Neutral / Stone
# - CSS variables: Yes / No
```

### 组件管理
```bash
# 添加单个组件
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog

# 添加多个组件
npx shadcn-ui@latest add button card dialog input

# 添加所有组件
npx shadcn-ui@latest add

# 覆盖现有组件
npx shadcn-ui@latest add button --overwrite

# 查看可用组件
npx shadcn-ui@latest add --help
```

### 开发命令
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 运行 lint
npm run lint

# 类型检查
npm run type-check
```

### 主题和样式
```bash
# 查看主题生成器
# 访问 https://ui.shadcn.com/themes

# 或使用 CLI 生成主题
npx shadcn-ui@latest theme
```

## 部署配置

### Next.js + Vercel
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["hkg1"]
}
```

### 环境变量
```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

### Docker 部署
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['images.unsplash.com'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
}

module.exports = nextConfig
```

### components.json 配置
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### CI/CD (GitHub Actions)
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm run lint
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 扩展资源

- [shadcn/ui 官方文档](https://ui.shadcn.com)
- [Radix UI 文档](https://www.radix-ui.com)
- [Tailwind CSS 文档](https://tailwindcss.com)
- [CVA 文档](https://cva.style/docs)
- [主题生成器](https://ui.shadcn.com/themes)
- [图标库 (Lucide)](https://lucide.dev)
- [示例项目](https://github.com/shadcn-ui/ui/tree/main/apps/www/app/examples)
