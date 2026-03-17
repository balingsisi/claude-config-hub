# Preact Application Template

## 技术栈

### 核心框架
- **Preact** - 轻量级 React 替代品（3KB）
- **Preact CLI** - 官方构建工具
- **Vite** - 现代化构建工具（可选）

### 状态管理
- **Preact Signals** - 响应式状态管理
- **Context API** - 内置上下文管理
- **Preact/Redux** - Redux 集成（可选）

### 路由
- **preact-router** - 官方路由解决方案
- **match-path** - 路径匹配工具

### UI 组件库
- **Preact Material Design** - Material Design 组件
- **Emotion** - CSS-in-JS 解决方案
- **Styled Components** - 样式组件

### 工具链
- **TypeScript** - 类型安全
- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **Jest + @testing-library/preact** - 单元测试

## 项目结构

```
preact-app/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── common/         # 通用组件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   └── layout/         # 布局组件
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── Sidebar.tsx
│   ├── routes/             # 路由页面
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   └── NotFound.tsx
│   ├── hooks/              # 自定义 Hooks
│   │   ├── useSignal.ts
│   │   ├── useLocalStorage.ts
│   │   └── useFetch.ts
│   ├── stores/             # 状态管理
│   │   ├── userStore.ts
│   │   ├── cartStore.ts
│   │   └── themeStore.ts
│   ├── utils/              # 工具函数
│   │   ├── api.ts
│   │   ├── helpers.ts
│   │   └── constants.ts
│   ├── styles/             # 样式文件
│   │   ├── global.css
│   │   └── variables.css
│   ├── types/              # TypeScript 类型
│   │   └── index.ts
│   ├── App.tsx             # 根组件
│   ├── index.tsx           # 应用入口
│   └── manifest.json       # PWA 配置
├── public/
│   ├── favicon.ico
│   └── assets/
├── tests/                  # 测试文件
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── preact.config.js        # Preact CLI 配置
```

## 代码模式

### 组件定义

```tsx
// Functional Component with TypeScript
import { FunctionalComponent } from 'preact';
import { Signal, useSignal } from '@preact/signals';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: FunctionalComponent<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <button
      class={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};
```

### Signals 状态管理

```tsx
import { signal, computed, effect } from '@preact/signals';

// 创建响应式状态
const count = signal(0);
const doubleCount = computed(() => count.value * 2);

// 自动追踪依赖
effect(() => {
  console.log(`Count is ${count.value}`);
});

// 在组件中使用
import { useSignal } from '@preact/signals';

function Counter() {
  const count = useSignal(0);
  
  return (
    <div>
      <p>Count: {count.value}</p>
      <button onClick={() => count.value++}>Increment</button>
    </div>
  );
}
```

### 路由配置

```tsx
import { Router } from 'preact-router';
import { createHashHistory } from 'history';
import Home from './routes/Home';
import About from './routes/About';
import NotFound from './routes/NotFound';

function App() {
  return (
    <Router history={createHashHistory()}>
      <Home path="/" />
      <About path="/about" />
      <NotFound default />
    </Router>
  );
}
```

### Context 使用

```tsx
import { createContext } from 'preact';
import { useContext } from 'preact/hooks';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: any }) {
  const theme = useSignal<'light' | 'dark'>('light');
  
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  };
  
  return (
    <ThemeContext.Provider value={{ theme: theme.value, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

### 自定义 Hooks

```tsx
import { useSignal, useSignalEffect } from '@preact/signals';
import { fetch } from './utils/api';

export function useFetch<T>(url: string) {
  const data = useSignal<T | null>(null);
  const loading = useSignal(true);
  const error = useSignal<Error | null>(null);

  useSignalEffect(() => {
    fetch(url)
      .then((res) => {
        data.value = res;
        loading.value = false;
      })
      .catch((err) => {
        error.value = err;
        loading.value = false;
      });
  });

  return { data: data.value, loading: loading.value, error: error.value };
}
```

## 最佳实践

### 1. 性能优化

```tsx
// ✅ 使用 Signals 减少重渲染
import { signal } from '@preact/signals';
const globalState = signal(initialValue);

// ✅ 懒加载组件
const LazyComponent = lazy(() => import('./HeavyComponent'));

// ✅ 使用 memo 避免不必要的渲染
import { memo } from 'preact/compat';
const OptimizedComponent = memo(MyComponent);

// ✅ 代码分割
{showModal && <Suspense fallback={<Loading />}><Modal /></Suspense>}
```

### 2. TypeScript 集成

```ts
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 3. 样式管理

```tsx
// CSS Modules
import styles from './Button.module.css';

export function Button({ label }: { label: string }) {
  return <button class={styles.button}>{label}</button>;
}

// Inline Styles (推荐用于动态样式)
export function DynamicStyleComponent() {
  const color = useSignal('red');
  return (
    <div style={{ color: color.value }}>
      Styled Text
    </div>
  );
}

// Emotion CSS-in-JS
import { css } from '@emotion/css';

const buttonStyle = css`
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  
  &:hover {
    background: #0056b3;
  }
`;
```

### 4. 错误边界

```tsx
import { Component, ErrorInfo } from 'preact';

interface Props {
  children: any;
  fallback?: any;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

### 5. 测试策略

```tsx
// Button.test.tsx
import { render, fireEvent } from '@testing-library/preact';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct label', () => {
    const { getByText } = render(<Button label="Click me" onClick={() => {}} />);
    expect(getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    const { getByText } = render(<Button label="Click me" onClick={handleClick} />);
    fireEvent.click(getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const { getByText } = render(
      <Button label="Click me" onClick={() => {}} disabled />
    );
    expect(getByText('Click me')).toBeDisabled();
  });
});
```

### 6. PWA 配置

```json
// manifest.json
{
  "name": "My Preact App",
  "short_name": "PreactApp",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007bff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

```ts
// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('SW registered:', registration);
      },
      (error) => {
        console.log('SW registration failed:', error);
      }
    );
  });
}
```

## 常用命令

### 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 或
preact watch

# 构建生产版本
npm run build
# 或
preact build

# 预览生产构建
npm run preview

# 代码检查
npm run lint

# 代码格式化
npm run format

# 运行测试
npm test
npm run test:watch

# 类型检查
npm run type-check
```

### Preact CLI 命令

```bash
# 创建新项目
npx preact-cli create default my-app

# 创建 TypeScript 项目
npx preact-cli create typescript my-app

# 生成组件
preact generate component MyComponent

# 生成页面
preact generate route my-page

# 部署到 Netlify
preact build && netlify deploy --prod

# 部署到 Vercel
vercel --prod
```

### 调试工具

```bash
# Preact DevTools (浏览器扩展)
# 安装 Preact Developer Tools

# 启用调试模式
preact watch --env.NODE_ENV=development

# 性能分析
# 使用 Chrome DevTools Performance Tab
```

## 部署配置

### 1. Netlify 部署

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 2. Vercel 部署

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "preact",
  "routes": [
    {
      "src": "/sw.js",
      "headers": {
        "Cache-Control": "no-cache"
      }
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 3. Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
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

  location /sw.js {
    add_header Cache-Control "no-cache";
  }
}
```

### 4. GitHub Pages 部署

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
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
      
      - name: Build
        run: npm run build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build
```

### 5. AWS S3 + CloudFront 部署

```bash
# 构建应用
npm run build

# 同步到 S3
aws s3 sync build/ s3://my-app-bucket --delete

# 使 CloudFront 缓存失效
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### 6. Firebase 部署

```bash
# 安装 Firebase CLI
npm install -g firebase-tools

# 初始化
firebase init hosting

# 构建
npm run build

# 部署
firebase deploy
```

```json
// firebase.json
{
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}
```

## 性能优化建议

### 1. 包体积优化

```bash
# 分析包体积
npm install -D bundlephobia
npx bundlephobia <package-name>

# 使用 Webpack Bundle Analyzer (如果使用 Webpack)
npm install -D webpack-bundle-analyzer
```

### 2. 懒加载策略

```tsx
// 路由级别懒加载
import { lazy, Suspense } from 'preact/compat';

const Home = lazy(() => import('./routes/Home'));
const About = lazy(() => import('./routes/About'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Router>
        <Home path="/" />
        <About path="/about" />
      </Router>
    </Suspense>
  );
}
```

### 3. 图片优化

```tsx
// 使用 WebP 格式
<picture>
  <source srcset="/image.webp" type="image/webp" />
  <source srcset="/image.jpg" type="image/jpeg" />
  <img src="/image.jpg" alt="Description" loading="lazy" />
</picture>

// 响应式图片
<img
  src="/image-800.jpg"
  srcset="/image-400.jpg 400w, /image-800.jpg 800w, /image-1200.jpg 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
  alt="Description"
  loading="lazy"
/>
```

## 监控和分析

### Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: './lighthouserc.json'
          temporaryPublicStorage: true
```

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:8080/"],
      "startServerCommand": "npm run preview"
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }]
      }
    }
  }
}
```

## 总结

Preact 是一个优秀的轻量级 React 替代品，特别适合：
- **小型到中型应用** - 包体积极小（3KB）
- **性能敏感场景** - 快速启动和渲染
- **PWA 应用** - 内置 PWA 支持
- **嵌入式应用** - 适合受限环境

关键优势：
✅ 体积小（3KB vs React 45KB）
✅ 与 React 生态兼容
✅ 原生 Signals 支持
✅ 快速渲染和更新
✅ 简单易用的 API

适用场景：
- 移动端 Web 应用
- 嵌入式组件
- 微前端架构
- 性能要求高的应用
- 渐进式 Web 应用（PWA）
