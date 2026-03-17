# Lucide React 图标库模板

## 技术栈

- **核心**: lucide-react
- **框架**: React, Next.js, Vite
- **样式**: Tailwind CSS, CSS Modules
- **类型安全**: TypeScript
- **工具**: SVGR, Iconify

## 项目结构

```
project/
├── src/
│   ├── components/
│   │   ├── icons/
│   │   │   ├── Icon.tsx
│   │   │   ├── Icon.types.ts
│   │   │   └── CustomIcon.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── IconButton.tsx
│   │   │   └── IconText.tsx
│   │   └── IconDemo.tsx
│   ├── hooks/
│   │   └── useIcon.ts
│   ├── lib/
│   │   └── iconUtils.ts
│   └── types/
│       └── icon.d.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础使用

```typescript
// src/components/IconDemo.tsx
import {
  Home,
  User,
  Settings,
  Search,
  Heart,
  ChevronRight,
  Menu,
  X,
  Mail,
  Phone,
} from 'lucide-react';

export function IconDemo() {
  return (
    <div className="flex gap-4">
      <Home className="w-6 h-6" />
      <User className="w-6 h-6" />
      <Settings className="w-6 h-6" />
      <Search className="w-6 h-6" />
      <Heart className="w-6 h-6 text-red-500" />
      <ChevronRight className="w-6 h-6" />
      <Menu className="w-6 h-6" />
      <X className="w-6 h-6" />
    </div>
  );
}
```

### 自定义图标组件

```typescript
// src/components/icons/Icon.tsx
import React from 'react';
import { LucideIcon, LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IconProps extends LucideProps {
  icon: LucideIcon;
  label?: string;
}

export function Icon({ icon: IconComponent, label, className, ...props }: IconProps) {
  return (
    <span className="inline-flex items-center justify-center" aria-label={label}>
      <IconComponent className={cn('w-5 h-5', className)} {...props} />
    </span>
  );
}

// 使用
import { Home, Settings } from 'lucide-react';
<Icon icon={Home} label="Home" />
<Icon icon={Settings} className="text-blue-600" size={24} />
```

### IconButton 组件

```typescript
// src/components/ui/IconButton.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, label, size = 'md', variant = 'default', className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
    };

    const variantClasses = {
      default: 'bg-gray-900 text-white hover:bg-gray-800',
      ghost: 'hover:bg-gray-100',
      outline: 'border border-gray-300 hover:bg-gray-50',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md transition-colors',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        aria-label={label}
        {...props}
      >
        <Icon className="w-5 h-5" />
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

// 使用
import { Menu, Search, Bell } from 'lucide-react';
<IconButton icon={Menu} label="Open menu" variant="ghost" />
<IconButton icon={Search} label="Search" size="lg" />
<IconButton icon={Bell} label="Notifications" variant="outline" />
```

### IconText 组件

```typescript
// src/components/ui/IconText.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IconTextProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  iconPosition?: 'left' | 'right';
  iconClassName?: string;
  children: React.ReactNode;
}

export function IconText({
  icon: Icon,
  iconPosition = 'left',
  iconClassName,
  className,
  children,
  ...props
}: IconTextProps) {
  return (
    <div
      className={cn('inline-flex items-center gap-2', className)}
      {...props}
    >
      {iconPosition === 'left' && <Icon className={cn('w-5 h-5', iconClassName)} />}
      <span>{children}</span>
      {iconPosition === 'right' && <Icon className={cn('w-5 h-5', iconClassName)} />}
    </div>
  );
}

// 使用
import { Mail, Phone, MapPin } from 'lucide-react';
<IconText icon={Mail}>contact@example.com</IconText>
<IconText icon={Phone} iconPosition="right">+1 234 567 890</IconText>
<IconText icon={MapPin} iconClassName="text-red-500">New York, USA</IconText>
```

### 动态图标加载

```typescript
// src/hooks/useIcon.ts
import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';

export function useIcon(iconName: string) {
  const [Icon, setIcon] = useState<LucideIcons.LucideIcon | null>(null);

  useEffect(() => {
    const icon = (LucideIcons as Record<string, any>)[iconName];
    if (icon) {
      setIcon(() => icon);
    } else {
      console.warn(`Icon "${iconName}" not found`);
      setIcon(() => LucideIcons.HelpCircle);
    }
  }, [iconName]);

  return Icon;
}

// 使用
function DynamicIconExample() {
  const iconName = 'Home';
  const Icon = useIcon(iconName);

  if (!Icon) return null;

  return <Icon className="w-6 h-6" />;
}
```

### 自定义 SVG 图标

```typescript
// src/components/icons/CustomIcon.tsx
import React from 'react';
import { createLucideIcon } from 'lucide-react';

// 自定义 Logo 图标
const CustomLogo = createLucideIcon('CustomLogo', [
  ['path', { d: 'M12 2L2 7l10 5 10-5-10-5z', key: '1a' }],
  ['path', { d: 'M2 17l10 5 10-5', key: '2b' }],
  ['path', { d: 'M2 12l10 5 10-5', key: '3c' }],
]);

export function LogoIcon() {
  return <CustomLogo className="w-8 h-8 text-blue-600" />;
}
```

### 图标按钮组

```typescript
// src/components/IconGroup.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { IconButton } from './ui/IconButton';
import { cn } from '@/lib/utils';

export interface IconGroupProps {
  icons: Array<{
    icon: LucideIcon;
    label: string;
    onClick?: () => void;
  }>;
  className?: string;
}

export function IconGroup({ icons, className }: IconGroupProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      {icons.map((item, index) => (
        <IconButton
          key={index}
          icon={item.icon}
          label={item.label}
          onClick={item.onClick}
          variant="ghost"
          size="sm"
        />
      ))}
    </div>
  );
}

// 使用
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
<IconGroup
  icons={[
    { icon: Bold, label: 'Bold', onClick: () => console.log('Bold') },
    { icon: Italic, label: 'Italic', onClick: () => console.log('Italic') },
    { icon: Underline, label: 'Underline', onClick: () => console.log('Underline') },
    { icon: AlignLeft, label: 'Align Left', onClick: () => console.log('Align Left') },
    { icon: AlignCenter, label: 'Align Center', onClick: () => console.log('Align Center') },
    { icon: AlignRight, label: 'Align Right', onClick: () => console.log('Align Right') },
  ]}
/>
```

### 导航菜单

```typescript
// src/components/Navigation.tsx
import React from 'react';
import { Home, User, Settings, FileText, HelpCircle } from 'lucide-react';
import { IconText } from './ui/IconText';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: FileText, label: 'Documents', href: '/documents' },
  { icon: Settings, label: 'Settings', href: '/settings' },
  { icon: HelpCircle, label: 'Help', href: '/help' },
];

export function Navigation() {
  return (
    <nav className="w-64 bg-white border-r">
      <ul className="space-y-1 p-4">
        {navItems.map((item, index) => (
          <li key={index}>
            <a
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <IconText icon={item.icon} iconClassName="text-gray-600">
                {item.label}
              </IconText>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

### 图标动画

```typescript
// src/components/AnimatedIcon.tsx
import React from 'react';
import { Loader2, RefreshCw, ArrowUpCircle } from 'lucide-react';

export function LoadingIcon() {
  return <Loader2 className="w-6 h-6 animate-spin" />;
}

export function RefreshIcon() {
  return <RefreshCw className="w-6 h-6 animate-spin-slow" />;
}

export function BounceIcon() {
  return <ArrowUpCircle className="w-6 h-6 animate-bounce" />;
}
```

## 最佳实践

### 1. 一致的尺寸

```typescript
// 定义标准图标尺寸
const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
} as const;

// 使用
<Home className={iconSizes.md} />
```

### 2. 颜色继承

```typescript
// 图标继承父元素颜色
<div className="text-blue-600">
  <Mail className="w-5 h-5" /> {/* 自动变为蓝色 */}
</div>
```

### 3. 无障碍支持

```typescript
// 为图标添加 aria-label
<button aria-label="Open menu">
  <Menu className="w-6 h-6" />
</button>

// 装饰性图标使用 aria-hidden
<span aria-hidden="true">
  <Star className="w-5 h-5" />
</span>
```

### 4. TypeScript 类型

```typescript
// 导出图标类型
import { LucideIcon, LucideProps } from 'lucide-react';

// 在组件中使用
interface Props {
  icon: LucideIcon;
  iconProps?: Omit<LucideProps, 'ref'>;
}
```

### 5. 树摇优化

```typescript
// ✅ 仅导入需要的图标
import { Home, User, Settings } from 'lucide-react';

// ❌ 导入所有图标
import * as Icons from 'lucide-react';
```

## 常用命令

### 安装依赖

```bash
# Lucide React
npm install lucide-react

# 或者使用 yarn
yarn add lucide-react

# 或者使用 pnpm
pnpm add lucide-react
```

### 图标搜索

```bash
# 在线搜索图标
# https://lucide.dev/icons/
```

## 部署配置

### Next.js 配置

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 优化图标导入
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;
```

### Vite 配置

```javascript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'lucide-react': ['lucide-react'],
        },
      },
    },
  },
});
```

### Storybook 集成

```typescript
// src/components/icons/Icon.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Home, Settings, User } from 'lucide-react';
import { Icon } from './Icon';

const meta: Meta<typeof Icon> = {
  title: 'Components/Icon',
  component: Icon,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const HomeIcon: Story = {
  args: {
    icon: Home,
    label: 'Home',
  },
};

export const SettingsIcon: Story = {
  args: {
    icon: Settings,
    label: 'Settings',
    className: 'text-blue-600',
    size: 32,
  },
};
```

## 性能优化

### 1. 懒加载图标

```typescript
// 使用 React.lazy 懒加载大图标集
const HomeIcon = React.lazy(() => 
  import('lucide-react').then(module => ({ default: module.Home }))
);

function LazyIconExample() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <HomeIcon />
    </React.Suspense>
  );
}
```

### 2. 图标缓存

```typescript
// 缓存已加载的图标
const iconCache = new Map<string, LucideIcon>();

export function useIconWithCache(iconName: string) {
  const cachedIcon = iconCache.get(iconName);
  if (cachedIcon) return cachedIcon;

  const Icon = useIcon(iconName);
  iconCache.set(iconName, Icon);
  return Icon;
}
```

### 3. SVG Sprite

```typescript
// 使用 SVG sprite 减少重复代码
import { createLucideIcon } from 'lucide-react';

// 创建 sprite
const sprite = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
sprite.style.display = 'none';
document.body.appendChild(sprite);
```

## 参考资料

- [Lucide 官方文档](https://lucide.dev/)
- [Lucide React](https://lucide.dev/guide/packages/lucide-react)
- [图标列表](https://lucide.dev/icons/)
- [React Icons 最佳实践](https://react.dev/learn/sharing-state-between-components)
