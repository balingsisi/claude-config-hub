# Storybook Component Development Template

## 技术栈

### 核心框架
- **Storybook** - UI 组件开发环境
- **React/Vue/Angular** - 支持多种前端框架
- **TypeScript** - 类型安全

### 插件生态
- **@storybook/addon-essentials** - 核心插件集
- **@storybook/addon-interactions** - 交互测试
- **@storybook/addon-a11y** - 无障碍测试
- **@storybook/addon-viewport** - 响应式预览
- **@storybook/addon-docs** - 文档生成

### 测试工具
- **@storybook/test** - 组件测试
- **@storybook/jest** - Jest 集成
- **@storybook/testing-library** - Testing Library 集成

### 构建工具
- **Vite** - 快速开发服务器
- **Webpack** - 传统构建工具

## 项目结构

```
storybook-project/
├── .storybook/              # Storybook 配置
│   ├── main.ts             # 主配置
│   ├── preview.ts          # 全局配置
│   ├── theme.ts            # 主题配置
│   └── manager.ts          # 管理器配置
├── src/
│   ├── components/         # 组件库
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   ├── Button.stories.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── index.ts
│   ├── hooks/              # 自定义 Hooks
│   │   ├── useCounter.ts
│   │   └── useLocalStorage.ts
│   ├── utils/              # 工具函数
│   │   ├── helpers.ts
│   │   └── constants.ts
│   ├── types/              # TypeScript 类型
│   │   └── index.ts
│   └── index.ts            # 导出所有组件
├── stories/                # Story 文件
│   ├── Introduction.stories.tsx
│   └── Examples.stories.tsx
├── docs/                   # 文档
│   ├── ARCHITECTURE.md
│   └── CONTRIBUTING.md
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 代码模式

### Storybook 配置

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-coverage',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    // 自定义 Vite 配置
    return {
      ...config,
      define: {
        ...config.define,
        'process.env': {},
      },
    };
  },
};

export default config;
```

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';
import '../src/styles/global.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'gray', value: '#f5f5f5' },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '1024px' },
        },
      },
    },
    a11y: {
      element: '#root',
      config: {},
      options: {},
      manual: false,
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
```

```typescript
// .storybook/theme.ts
import { create } from '@storybook/theming/create';

export default create({
  base: 'light',
  brandTitle: 'My Component Library',
  brandUrl: 'https://example.com',
  brandImage: '/logo.svg',
  brandTarget: '_self',
  
  colorPrimary: '#007bff',
  colorSecondary: '#6c757d',
  
  // UI
  appBg: '#ffffff',
  appContentBg: '#f5f5f5',
  appBorderColor: '#dee2e6',
  appBorderRadius: 4,
  
  // Typography
  fontBase: '"Open Sans", sans-serif',
  fontCode: 'monospace',
  
  // Text colors
  textColor: '#212529',
  textInverseColor: '#ffffff',
  
  // Toolbar default background color
  barTextColor: '#999999',
  barSelectedColor: '#007bff',
  barBg: '#ffffff',
});
```

### 组件 Story

```typescript
// src/components/Button/Button.tsx
import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps {
  /** 按钮标签 */
  label: string;
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'danger';
  /** 按钮大小 */
  size?: 'small' | 'medium' | 'large';
  /** 是否禁用 */
  disabled?: boolean;
  /** 加载状态 */
  loading?: boolean;
  /** 左侧图标 */
  leftIcon?: React.ReactNode;
  /** 右侧图标 */
  rightIcon?: React.ReactNode;
  /** 点击事件 */
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  onClick,
}) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <span className={styles.spinner}>🔄</span>}
      {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
      <span>{label}</span>
      {rightIcon && <span className={styles.icon}>{rightIcon}</span>}
    </button>
  );
};
```

```typescript
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: 'Button variant',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    label: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    label: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Danger: Story = {
  args: {
    label: 'Danger Button',
    variant: 'danger',
  },
};

export const Small: Story = {
  args: {
    label: 'Small Button',
    size: 'small',
  },
};

export const Large: Story = {
  args: {
    label: 'Large Button',
    size: 'large',
  },
};

export const WithIcons: Story = {
  args: {
    label: 'Button with Icons',
    leftIcon: '👍',
    rightIcon: '→',
  },
};

export const Loading: Story = {
  args: {
    label: 'Loading Button',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Button',
    disabled: true,
  },
};
```

### 交互测试

```typescript
// src/components/Button/Button.test.tsx
import { test, expect } from '@storybook/test';
import { within, userEvent } from '@storybook/testing-library';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Components/Button/Tests',
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;

export const TestClick: StoryObj<typeof Button> = {
  args: {
    label: 'Click me',
    onClick: () => console.log('Button clicked'),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const TestDisabled: StoryObj<typeof Button> = {
  args: {
    label: 'Disabled',
    disabled: true,
    onClick: () => console.log('Should not be called'),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const TestKeyboard: StoryObj<typeof Button> = {
  args: {
    label: 'Keyboard test',
    onClick: () => console.log('Enter pressed'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    await userEvent.tab();
    await expect(button).toHaveFocus();
    
    await userEvent.keyboard('{Enter}');
  },
};
```

### 复杂组件 Story

```typescript
// src/components/Modal/Modal.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';
import { Button } from '../Button';

const meta = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
  },
} satisfies Meta<typeof Modal>;

export default meta;

export const Default: Story = {
  args: {
    isOpen: true,
    title: 'Modal Title',
    children: 'Modal content goes here',
  },
};

export const FormModal: Story = {
  args: {
    isOpen: true,
    title: 'Create Account',
    children: (
      <form>
        <input type="text" placeholder="Name" />
        <input type="email" placeholder="Email" />
        <Button label="Submit" variant="primary" />
      </form>
    ),
  },
};

export const ConfirmDialog: Story = {
  args: {
    isOpen: true,
    title: 'Confirm Delete',
    children: (
      <>
        <p>Are you sure you want to delete this item?</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button label="Cancel" variant="secondary" />
          <Button label="Delete" variant="danger" />
        </div>
      </>
    ),
  },
};
```

### 文档和 MDX

```typescript
// src/components/Button/Button.mdx
import { Meta, Story, Canvas, ArgsTable } from '@storybook/addon-docs';
import { Button } from './Button';

<Meta title="Components/Button/Documentation" component={Button} />

# Button Component

The Button component is a reusable UI element for triggering actions.

## Usage

```tsx
import { Button } from 'my-ui-library';

<Button label="Click me" onClick={handleClick} />
```

## Props

<ArgsTable of={Button} />

## Examples

### Primary Button

<Canvas>
  <Story name="Primary">
    <Button label="Primary Button" variant="primary" />
  </Story>
</Canvas>

### Secondary Button

<Canvas>
  <Story name="Secondary">
    <Button label="Secondary Button" variant="secondary" />
  </Story>
</Canvas>

### Button with Icons

<Canvas>
  <Story name="With Icons">
    <Button label="Submit" leftIcon="👍" rightIcon="→" />
  </Story>
</Canvas>

## Accessibility

- ✅ Keyboard navigation support
- ✅ Screen reader compatible
- ✅ Focus management
- ✅ Color contrast compliant
```

### 组合组件

```typescript
// src/components/Card/Card.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Button } from '../Button';
import { Badge } from '../Badge';

const meta = {
  title: 'Components/Card',
  component: Card,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;

export const ProductCard: Story = {
  args: {
    image: 'https://via.placeholder.com/400x300',
    title: 'Product Name',
    subtitle: '$99.99',
    children: (
      <>
        <Badge label="New" variant="success" />
        <p>Product description goes here</p>
        <Button label="Add to Cart" variant="primary" />
      </>
    ),
  },
};

export const ProfileCard: Story = {
  args: {
    avatar: 'https://via.placeholder.com/100x100',
    title: 'John Doe',
    subtitle: 'Software Engineer',
    children: (
      <>
        <p>Building amazing products with code.</p>
        <Button label="Follow" variant="primary" />
      </>
    ),
  },
};
```

## 最佳实践

### 1. 组件设计

```typescript
// ✅ 清晰的 Props 接口
export interface InputProps {
  /** 输入框标签 */
  label: string;
  /** 输入框值 */
  value: string;
  /** 值变化回调 */
  onChange: (value: string) => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 错误信息 */
  error?: string;
  /** 是否必填 */
  required?: boolean;
  /** 禁用状态 */
  disabled?: boolean;
}

// ✅ 使用 TypeScript 泛型
export interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

// ✅ 使用 forwardRef 暴露 DOM 引用
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, value, onChange, ...props }, ref) => {
    return (
      <div>
        <label>{label}</label>
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
      </div>
    );
  }
);
```

### 2. Story 组织

```typescript
// ✅ 层次化的 Story 结构
// title: 'Components/Forms/Input'
// title: 'Components/Forms/Select'
// title: 'Components/Layout/Card'
// title: 'Components/Layout/Grid'

// ✅ 描述性的 Story 名称
export const PrimaryButton: Story = {};
export const PrimaryButtonWithIcon: Story = {};
export const PrimaryButtonLoading: Story = {};

// ❌ 避免模糊的名称
export const Story1: Story = {};
export const Story2: Story = {};
```

### 3. 参数控制

```typescript
// ✅ 使用合适的控件类型
argTypes: {
  variant: {
    control: 'select',
    options: ['primary', 'secondary', 'danger'],
    description: 'Button variant',
    table: {
      type: { summary: 'primary | secondary | danger' },
      defaultValue: { summary: 'primary' },
    },
  },
  size: {
    control: 'radio',
    options: ['small', 'medium', 'large'],
  },
  disabled: {
    control: 'boolean',
  },
  onClick: {
    action: 'clicked',
  },
}
```

### 4. 装饰器使用

```typescript
// ✅ 全局装饰器
// .storybook/preview.ts
export const decorators = [
  (Story) => (
    <ThemeProvider>
      <Story />
    </ThemeProvider>
  ),
];

// ✅ Story 级别装饰器
export const DarkMode: Story = {
  decorators: [
    (Story) => (
      <div style={{ background: '#1a1a1a', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
};

// ✅ 组件级别装饰器
const meta = {
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof Component>;
```

### 5. 测试策略

```typescript
// ✅ 交互测试
export const InteractionTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // 查找元素
    const button = canvas.getByRole('button');
    
    // 用户交互
    await userEvent.click(button);
    
    // 断言
    await expect(button).toHaveTextContent('Clicked');
  },
};

// ✅ 无障碍测试
export const AccessibilityTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    // 检查可访问性
    await expect(button).toHaveAttribute('aria-label');
    await expect(button).toHaveAttribute('type', 'button');
  },
};
```

### 6. 性能优化

```typescript
// ✅ 懒加载大型组件
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

export const LazyLoaded: Story = {
  render: () => (
    <React.Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </React.Suspense>
  ),
};

// ✅ 使用 React.memo 优化
const OptimizedComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});
```

## 常用命令

### 开发命令

```bash
# 安装依赖
npm install

# 启动 Storybook
npm run storybook

# 构建静态站点
npm run build-storybook

# 运行测试
npm run test-storybook

# 运行 lint
npm run lint

# 类型检查
npm run type-check
```

### Storybook CLI

```bash
# 创建新项目
npx storybook@latest init

# 添加到现有项目
npx storybook@latest init --builder vite

# 升级 Storybook
npx storybook@latest upgrade

# 生成组件
npx storybook@latest generate component Button

# 运行 smoke test
npm run storybook -- --smoke-test
```

### 调试工具

```bash
# 启动调试模式
npm run storybook -- --debug

# 查看配置
npm run storybook -- --verbose

# 指定端口
npm run storybook -- --port 6007

# 禁用自动打开浏览器
npm run storybook -- --no-open
```

## 部署配置

### 1. 静态部署

```bash
# 构建 Storybook
npm run build-storybook

# 输出目录: storybook-static/
```

### 2. GitHub Pages

```yaml
# .github/workflows/deploy-storybook.yml
name: Deploy Storybook to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Storybook
        run: npm run build-storybook
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./storybook-static
```

### 3. Chromatic 部署

```yaml
# .github/workflows/chromatic.yml
name: Chromatic

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Publish to Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

### 4. Netlify 部署

```toml
# netlify.toml
[build]
  command = "npm run build-storybook"
  publish = "storybook-static"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 5. Vercel 部署

```json
// vercel.json
{
  "buildCommand": "npm run build-storybook",
  "outputDirectory": "storybook-static",
  "framework": "storybook"
}
```

### 6. Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build-storybook

FROM nginx:alpine
COPY --from=builder /app/storybook-static /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  storybook:
    build: .
    ports:
      - "8080:80"
```

## 高级特性

### 1. 自定义插件

```typescript
// .storybook/addons/my-addon/register.ts
import { addons, types } from '@storybook/manager-api';
import { AddonPanel } from '@storybook/components';

const MyPanel = () => <div>My Custom Panel</div>;

addons.register('my-addon', () => {
  addons.add('my-addon/panel', {
    type: types.PANEL,
    title: 'My Addon',
    render: ({ active, key }) => (
      <AddonPanel active={active} key={key}>
        <MyPanel />
      </AddonPanel>
    ),
  });
});
```

### 2. 主题定制

```typescript
// .storybook/theme.ts
import { create } from '@storybook/theming/create';

export default create({
  base: 'light',
  brandTitle: 'My UI Library',
  brandUrl: 'https://example.com',
  brandImage: '/logo.svg',
  
  colorPrimary: '#007bff',
  colorSecondary: '#6c757d',
  
  fontBase: '"Inter", sans-serif',
  fontCode: '"Fira Code", monospace',
  
  appBg: '#f8f9fa',
  appContentBg: '#ffffff',
  appBorderColor: '#dee2e6',
  
  textColor: '#212529',
  textInverseColor: '#ffffff',
  
  barTextColor: '#6c757d',
  barSelectedColor: '#007bff',
  barBg: '#ffffff',
});
```

### 3. 全局状态管理

```typescript
// .storybook/preview.ts
import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../src/store';

export const decorators = [
  (Story) => (
    <Provider store={store}>
      <Story />
    </Provider>
  ),
];
```

### 4. Mock 数据

```typescript
// src/mocks/data.ts
export const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
];

// src/components/UserList/UserList.stories.tsx
import { mockUsers } from '../../mocks/data';

export const WithMockData: Story = {
  args: {
    users: mockUsers,
  },
};
```

### 5. 国际化

```typescript
// .storybook/preview.ts
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n';

export const decorators = [
  (Story) => (
    <I18nextProvider i18n={i18n}>
      <Story />
    </I18nextProvider>
  ),
];

export const globalTypes = {
  locale: {
    name: 'Locale',
    description: 'Internationalization locale',
    defaultValue: 'en',
    toolbar: {
      icon: 'globe',
      items: [
        { value: 'en', right: '🇺🇸', title: 'English' },
        { value: 'zh', right: '🇨🇳', title: '中文' },
      ],
    },
  },
};
```

## 总结

Storybook 是一个功能强大的组件开发环境，特别适合：
- **组件库开发** - 独立开发和测试 UI 组件
- **设计系统** - 构建和维护设计系统
- **文档生成** - 自动生成组件文档
- **视觉测试** - 视觉回归测试
- **协作工具** - 设计师和开发者协作

关键优势：
✅ 隔离的组件开发环境
✅ 丰富的插件生态系统
✅ 自动文档生成
✅ 交互式测试
✅ 视觉回归测试
✅ 支持多种前端框架

适用场景：
- 组件库开发
- 设计系统构建
- UI 文档生成
- 视觉回归测试
- 组件交互测试
- 团队协作
- 原型设计
