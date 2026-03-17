# React 19 模板

## 技术栈
- **React 19** - 最新版本，并发渲染、Server Components
- **TypeScript** - 完整类型支持
- **Vite** - 快速开发构建工具
- **React Compiler** - 自动优化（可选）
- **Server Actions** - 表单和服务端操作
- **use() Hook** - Promise 和 Context 解包
- **useOptimistic** - 乐观更新
- **useFormStatus** - 表单状态

## 项目结构
```
react-19-project/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   ├── forms/
│   │   │   ├── SearchForm.tsx
│   │   │   └── CommentForm.tsx
│   │   ├── data/
│   │   │   ├── DataLoader.tsx
│   │   │   └── UserList.tsx
│   │   └── features/
│   │       ├── TodoList.tsx
│   │       └── LikeButton.tsx
│   ├── hooks/
│   │   ├── useAsync.ts
│   │   ├── useOptimisticUpdate.ts
│   │   └── useTransition.ts
│   ├── context/
│   │   └── ThemeContext.tsx
│   ├── utils/
│   │   └── api.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 代码模式

### use() Hook - 新特性
```typescript
// src/components/data/DataLoader.tsx
import { use, Suspense } from 'react';

// use() 可以解包 Promise
function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);
  
  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold">{user.name}</h2>
      <p className="text-gray-600">{user.email}</p>
    </div>
  );
}

// use() 可以解包 Context
function ThemeAwareComponent() {
  const theme = use(ThemeContext);
  
  return (
    <div className={theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'}>
      Current theme: {theme}
    </div>
  );
}

// 在 Suspense 边界中使用
export function DataLoader() {
  const userPromise = fetchUser(); // 返回 Promise

  return (
    <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}

// 错误边界处理
import { ErrorBoundary } from 'react-error-boundary';

function DataWithFallback() {
  return (
    <ErrorBoundary
      fallback={<div className="text-red-500">Something went wrong</div>}
    >
      <Suspense fallback={<div>Loading...</div>}>
        <UserProfile userPromise={fetchUser()} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### useFormStatus - 表单状态
```typescript
// src/components/forms/SubmitButton.tsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Submitting...
        </span>
      ) : (
        'Submit'
      )}
    </button>
  );
}

// src/components/forms/CommentForm.tsx
export function CommentForm() {
  async function submitComment(formData: FormData) {
    'use server'; // Server Action（如果支持）
    
    const comment = formData.get('comment');
    await saveComment(comment);
  }

  return (
    <form action={submitComment} className="space-y-4">
      <textarea
        name="comment"
        className="w-full p-2 border rounded"
        rows={4}
        required
      />
      <SubmitButton />
    </form>
  );
}
```

### useOptimistic - 乐观更新
```typescript
// src/components/features/TodoList.tsx
import { useOptimistic } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, addOptimisticTodo] = useOptimistic(
    initialTodos,
    (state, newTodo: string) => [
      ...state,
      { id: Date.now(), text: newTodo, completed: false, sending: true }
    ]
  );

  async function addTodo(formData: FormData) {
    const text = formData.get('todo') as string;
    
    // 立即显示乐观更新
    addOptimisticTodo(text);
    
    try {
      // 实际服务器操作
      const newTodo = await saveTodoToServer(text);
      // 更新真实数据
    } catch (error) {
      // 回滚乐观更新
      console.error('Failed to save todo:', error);
    }
  }

  async function toggleTodo(id: number) {
    addOptimisticTodo(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
    
    await toggleTodoOnServer(id);
  }

  return (
    <div className="space-y-4">
      <form action={addTodo} className="flex gap-2">
        <input
          type="text"
          name="todo"
          className="flex-1 px-3 py-2 border rounded"
          placeholder="Add a new todo..."
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add
        </button>
      </form>

      <ul className="space-y-2">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`flex items-center gap-2 p-2 border rounded ${
              todo.sending ? 'opacity-50' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              className="w-4 h-4"
            />
            <span className={todo.completed ? 'line-through text-gray-500' : ''}>
              {todo.text}
            </span>
            {todo.sending && <span className="text-xs text-gray-400">Saving...</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// 点赞按钮示例
export function LikeButton({ postId, initialLikes }: { 
  postId: string; 
  initialLikes: number;
}) {
  const [likes, addLike] = useOptimistic(initialLikes, (state) => state + 1);

  async function handleLike() {
    addLike(); // 乐观更新
    await likePost(postId); // 实际请求
  }

  return (
    <button
      onClick={handleLike}
      className="flex items-center gap-1 text-gray-500 hover:text-red-500"
    >
      ❤️ {likes}
    </button>
  );
}
```

### useTransition - 非阻塞更新
```typescript
// src/components/features/SearchComponent.tsx
import { useState, useTransition } from 'react';

const largeList = Array.from({ length: 10000 }, (_, i) => `Item ${i + 1}`);

export function SearchComponent() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    
    // 立即更新输入框（紧急更新）
    setQuery(value);

    // 使用 transition 标记非紧急更新
    startTransition(() => {
      const filtered = largeList.filter(item =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      setResults(filtered);
    });
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search items..."
        className="w-full px-3 py-2 border rounded"
      />
      
      {isPending && (
        <div className="text-sm text-gray-500">Updating results...</div>
      )}
      
      <ul className="max-h-64 overflow-y-auto border rounded">
        {results.slice(0, 20).map((result, i) => (
          <li key={i} className="p-2 border-b last:border-b-0">
            {result}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Tab 切换示例
export function TabContainer() {
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState('about');

  function selectTab(nextTab: string) {
    startTransition(() => {
      setTab(nextTab);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        {['about', 'posts', 'contact'].map((t) => (
          <button
            key={t}
            onClick={() => selectTab(t)}
            className={`px-4 py-2 ${
              tab === t
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500'
            } ${isPending && tab !== t ? 'opacity-50' : ''}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        <Suspense fallback={<div>Loading...</div>}>
          <TabContent tab={tab} />
        </Suspense>
      </div>
    </div>
  );
}
```

### React Compiler 优化
```typescript
// React Compiler 会自动优化这些组件
// 无需手动使用 useMemo、useCallback

// 编译器会自动 memoize
function ExpensiveComponent({ items }: { items: Item[] }) {
  // 编译器会自动识别并优化这个昂贵的计算
  const sorted = items.sort((a, b) => a.name.localeCompare(b.name));
  const filtered = sorted.filter(item => item.active);
  const total = filtered.reduce((sum, item) => sum + item.value, 0);

  return (
    <div>
      <p>Total: {total}</p>
      <ul>
        {filtered.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}

// 编译器会自动处理对象引用
function ParentComponent() {
  const [count, setCount] = useState(0);
  
  // 编译器会自动稳定这些引用
  const config = { theme: 'dark', size: 'large' };
  const handleClick = () => console.log('clicked');

  return (
    <ChildComponent config={config} onClick={handleClick} />
  );
}

// 配置 React Compiler
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {}],
        ],
      },
    }),
  ],
});
```

### 并发渲染
```typescript
// src/App.tsx
import { Suspense, useState, useTransition } from 'react';

function SlowComponent({ data }: { data: string }) {
  // 模拟慢组件
  const start = performance.now();
  while (performance.now() - start < 100) {
    // 阻塞 100ms
  }
  
  return <div className="p-4 border rounded">{data}</div>;
}

export function ConcurrentDemo() {
  const [items, setItems] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function addManyItems() {
    const newItems = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
    
    // 使用 transition 保持 UI 响应
    startTransition(() => {
      setItems(prev => [...prev, ...newItems]);
    });
  }

  return (
    <div className="space-y-4">
      <button
        onClick={addManyItems}
        disabled={isPending}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Add 100 Items
      </button>
      
      {isPending && <div className="text-gray-500">Adding items...</div>}
      
      <div className="grid grid-cols-4 gap-2">
        {items.map((item, i) => (
          <SlowComponent key={i} data={item} />
        ))}
      </div>
    </div>
  );
}
```

### 新的 Ref 行为
```typescript
// React 19: ref 作为普通 prop
// 旧的写法
const OldInput = forwardRef<HTMLInputElement>((props, ref) => {
  return <input ref={ref} {...props} />;
});

// 新的写法（React 19）
function NewInput({ ref, ...props }: { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}

// 使用
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <NewInput ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>
        Focus Input
      </button>
    </div>
  );
}
```

### Context 改进
```typescript
// src/context/ThemeContext.tsx
import { createContext, useContext, use } from 'react';

// Context 可以直接作为 Provider 使用（不需要 .Provider）
const ThemeContext = createContext<string>('light');

// 旧写法
function OldApp() {
  return (
    <ThemeContext.Provider value="dark">
      <Child />
    </ThemeContext.Provider>
  );
}

// 新写法（React 19）
function NewApp() {
  return (
    <ThemeContext value="dark">
      <Child />
    </ThemeContext>
  );
}

function Child() {
  const theme = use(ThemeContext); // 使用 use() hook
  return <div>Theme: {theme}</div>;
}

// 多个 Context
const UserContext = createContext<User | null>(null);
const SettingsContext = createContext<Settings>({} as Settings);

function App() {
  return (
    <UserContext value={{ name: 'John' }}>
      <SettingsContext value={{ theme: 'dark' }}>
        <Dashboard />
      </SettingsContext>
    </UserContext>
  );
}
```

### 资源预加载
```typescript
// 使用新的 preload API
import { preload, preinit } from 'react-dom';

// 预加载样式
preload('/styles/main.css', { as: 'style' });

// 预加载脚本
preload('/scripts/analytics.js', { as: 'script' });

// 预加载字体
preload('/fonts/roboto.woff2', { as: 'font', type: 'font/woff2' });

// 预初始化（立即执行）
preinit('/scripts/critical.js', { as: 'script' });

// 在组件中使用
function App() {
  useEffect(() => {
    // 预加载下一页资源
    preload('/dashboard.js', { as: 'script' });
    preload('/dashboard.css', { as: 'style' });
  }, []);

  return <MainContent />;
}
```

## 最佳实践

### 1. 合理使用 useTransition
```typescript
// ✅ 好：用于非紧急更新
startTransition(() => {
  setSearchResults(heavyFiltering(query));
});

// ❌ 不好：用于紧急更新（输入框）
startTransition(() => {
  setInputValue(value); // 输入框应该立即响应
});
```

### 2. 错误边界处理
```typescript
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // 重置状态
      }}
    >
      <Suspense fallback={<Loading />}>
        <DataComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### 3. 服务端组件与客户端组件分离
```typescript
// ServerComponent.server.tsx (如果支持)
export async function UserProfile({ userId }: { userId: string }) {
  const user = await db.user.findUnique({ where: { id: userId } });
  return <div>{user.name}</div>;
}

// ClientComponent.tsx
'use client';

import { useState } from 'react';

export function InteractiveWidget() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <button onClick={() => setIsOpen(!isOpen)}>
      {isOpen ? 'Close' : 'Open'}
    </button>
  );
}
```

## 常用命令

### 开发
```bash
# 安装 React 19 RC
npm install react@rc react-dom@rc

# 安装 React Compiler（可选）
npm install -D babel-plugin-react-compiler

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### React Compiler 配置
```javascript
// babel.config.js
module.exports = {
  presets: ['@babel/preset-react'],
  plugins: [
    ['babel-plugin-react-compiler', {
      // 配置选项
    }],
  ],
};
```

## 部署配置

### package.json
```json
{
  "name": "react-19-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-error-boundary": "^4.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "babel-plugin-react-compiler": "^0.0.1",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {}],
        ],
      },
    }),
  ],
});
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Dockerfile
```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### GitHub Actions
```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```
