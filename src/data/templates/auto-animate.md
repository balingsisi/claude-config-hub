# Auto Animate 零配置动画库模板

## 技术栈

- **Auto Animate**: 零配置动画库
- **React 18**: UI 框架
- **TypeScript**: 类型支持
- **Vite**: 构建工具
- **Tailwind CSS**: 样式方案
- **React Router**: 路由管理

## 项目结构

```
auto-animate-app/
├── src/
│   ├── components/
│   │   ├── animated/
│   │   │   ├── AnimatedList.tsx
│   │   │   ├── AnimatedGrid.tsx
│   │   │   ├── AnimatedCard.tsx
│   │   │   ├── AnimatedForm.tsx
│   │   │   ├── AnimatedTable.tsx
│   │   │   └── AnimatedTabs.tsx
│   │   ├── examples/
│   │   │   ├── TodoList.tsx
│   │   │   ├── ImageGallery.tsx
│   │   │   ├── DataTable.tsx
│   │   │   └── Accordion.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useAutoAnimate.ts
│   │   └── useAnimationConfig.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Lists.tsx
│   │   ├── Grids.tsx
│   │   └── Forms.tsx
│   ├── utils/
│   │   ├── animations.ts
│   │   └── helpers.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 代码模式

### 基础列表动画

```tsx
// src/components/animated/AnimatedList.tsx
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { ReactNode } from 'react';

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
}

export const AnimatedList = ({ children, className = '' }: AnimatedListProps) => {
  const [parent] = useAutoAnimate();

  return (
    <div ref={parent} className={className}>
      {children}
    </div>
  );
};
```

```tsx
// src/components/examples/TodoList.tsx
import { useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: '学习 Auto Animate', completed: false },
    { id: 2, text: '构建示例应用', completed: false },
    { id: 3, text: '优化动画效果', completed: false }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [parent] = useAutoAnimate();

  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos([
        ...todos,
        {
          id: Date.now(),
          text: inputValue,
          completed: false
        }
      ]);
      setInputValue('');
    }
  };

  const removeTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">待办事项</h2>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="添加新任务..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addTodo}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          添加
        </button>
      </div>

      <ul ref={parent} className="space-y-2">
        {todos.map(todo => (
          <li
            key={todo.id}
            className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              className="w-5 h-5 rounded border-gray-300"
            />
            <span
              className={`flex-1 ${
                todo.completed ? 'line-through text-gray-400' : ''
              }`}
            >
              {todo.text}
            </span>
            <button
              onClick={() => removeTodo(todo.id)}
              className="px-3 py-1 text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

### 网格布局动画

```tsx
// src/components/animated/AnimatedGrid.tsx
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { ReactNode } from 'react';

interface AnimatedGridProps {
  children: ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
}

export const AnimatedGrid = ({ 
  children, 
  columns = 3, 
  gap = 4,
  className = '' 
}: AnimatedGridProps) => {
  const [parent] = useAutoAnimate();

  return (
    <div
      ref={parent}
      className={`grid gap-${gap} ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
};
```

```tsx
// src/components/examples/ImageGallery.tsx
import { useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface Image {
  id: number;
  url: string;
  title: string;
}

export const ImageGallery = () => {
  const [images, setImages] = useState<Image[]>([
    { id: 1, url: 'https://picsum.photos/300/200?random=1', title: '风景 1' },
    { id: 2, url: 'https://picsum.photos/300/200?random=2', title: '风景 2' },
    { id: 3, url: 'https://picsum.photos/300/200?random=3', title: '风景 3' },
    { id: 4, url: 'https://picsum.photos/300/200?random=4', title: '风景 4' },
    { id: 5, url: 'https://picsum.photos/300/200?random=5', title: '风景 5' },
    { id: 6, url: 'https://picsum.photos/300/200?random=6', title: '风景 6' }
  ]);
  const [parent] = useAutoAnimate();

  const addImage = () => {
    const newId = Date.now();
    setImages([
      ...images,
      {
        id: newId,
        url: `https://picsum.photos/300/200?random=${newId}`,
        title: `新图片 ${images.length + 1}`
      }
    ]);
  };

  const removeImage = (id: number) => {
    setImages(images.filter(img => img.id !== id));
  };

  const shuffleImages = () => {
    const shuffled = [...images].sort(() => Math.random() - 0.5);
    setImages(shuffled);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">图片画廊</h2>
        <div className="flex gap-2">
          <button
            onClick={shuffleImages}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            随机排序
          </button>
          <button
            onClick={addImage}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            添加图片
          </button>
        </div>
      </div>

      <div
        ref={parent}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {images.map(image => (
          <div
            key={image.id}
            className="relative group rounded-lg overflow-hidden shadow-lg"
          >
            <img
              src={image.url}
              alt={image.title}
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
              <button
                onClick={() => removeImage(image.id)}
                className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-red-500 text-white rounded-lg transition-opacity"
              >
                删除
              </button>
            </div>
            <div className="p-3 bg-white">
              <p className="font-medium">{image.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 表单动画

```tsx
// src/components/animated/AnimatedForm.tsx
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { ReactNode } from 'react';

interface AnimatedFormProps {
  children: ReactNode;
  className?: string;
}

export const AnimatedForm = ({ children, className = '' }: AnimatedFormProps) => {
  const [parent] = useAutoAnimate();

  return (
    <form ref={parent} className={className}>
      {children}
    </form>
  );
};
```

```tsx
// src/pages/Forms.tsx
import { useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface Field {
  id: string;
  label: string;
  type: string;
  value: string;
}

export const Forms = () => {
  const [fields, setFields] = useState<Field[]>([
    { id: '1', label: '姓名', type: 'text', value: '' },
    { id: '2', label: '邮箱', type: 'email', value: '' }
  ]);
  const [parent] = useAutoAnimate();

  const addField = () => {
    const newField: Field = {
      id: Date.now().toString(),
      label: `字段 ${fields.length + 1}`,
      type: 'text',
      value: ''
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const updateField = (id: string, value: string) => {
    setFields(
      fields.map(field =>
        field.id === id ? { ...field, value } : field
      )
    );
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">动态表单</h2>
      
      <div ref={parent} className="space-y-4">
        {fields.map(field => (
          <div key={field.id} className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                {field.label}
              </label>
              <input
                type={field.type}
                value={field.value}
                onChange={(e) => updateField(field.id, e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => removeField(field.id)}
              className="self-end px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              删除
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addField}
        className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        添加字段
      </button>
    </div>
  );
};
```

### 表格动画

```tsx
// src/components/animated/AnimatedTable.tsx
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { ReactNode } from 'react';

interface AnimatedTableProps {
  children: ReactNode;
  className?: string;
}

export const AnimatedTable = ({ children, className = '' }: AnimatedTableProps) => {
  const [parent] = useAutoAnimate();

  return (
    <div ref={parent} className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        {children}
      </table>
    </div>
  );
};
```

```tsx
// src/components/examples/DataTable.tsx
import { useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const DataTable = () => {
  const [users, setUsers] = useState<User[]>([
    { id: 1, name: '张三', email: 'zhang@example.com', role: '管理员' },
    { id: 2, name: '李四', email: 'li@example.com', role: '用户' },
    { id: 3, name: '王五', email: 'wang@example.com', role: '用户' },
    { id: 4, name: '赵六', email: 'zhao@example.com', role: '编辑' }
  ]);
  const [parent] = useAutoAnimate();

  const addUser = () => {
    const newUser: User = {
      id: Date.now(),
      name: `用户 ${users.length + 1}`,
      email: `user${users.length + 1}@example.com`,
      role: '用户'
    };
    setUsers([...users, newUser]);
  };

  const removeUser = (id: number) => {
    setUsers(users.filter(user => user.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">用户列表</h2>
        <button
          onClick={addUser}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          添加用户
        </button>
      </div>

      <div ref={parent} className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                姓名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                邮箱
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                角色
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => removeUser(user.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

### 手风琴组件

```tsx
// src/components/examples/Accordion.tsx
import { useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface AccordionItem {
  id: string;
  title: string;
  content: string;
}

export const Accordion = () => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [parent] = useAutoAnimate();

  const items: AccordionItem[] = [
    {
      id: '1',
      title: '什么是 Auto Animate？',
      content: 'Auto Animate 是一个零配置的动画库，可以自动为你的应用添加流畅的过渡动画。'
    },
    {
      id: '2',
      title: '如何使用？',
      content: '只需使用 useAutoAnimate hook 并将返回的 ref 附加到父元素即可。'
    },
    {
      id: '3',
      title: '支持哪些框架？',
      content: '支持 React、Vue、Solid、Svelte 和 Preact 等多个前端框架。'
    },
    {
      id: '4',
      title: '性能如何？',
      content: 'Auto Animate 非常轻量，对性能影响极小，适用于生产环境。'
    }
  ];

  const toggleItem = (id: string) => {
    setOpenItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">常见问题</h2>
      
      <div ref={parent} className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center"
            >
              <span className="font-medium">{item.title}</span>
              <svg
                className={`w-5 h-5 transform transition-transform ${
                  openItems.includes(item.id) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openItems.includes(item.id) && (
              <div className="px-4 py-3 bg-white">
                <p className="text-gray-600">{item.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 自定义动画配置

```tsx
// src/hooks/useAnimationConfig.ts
import { useAutoAnimate } from '@formkit/auto-animate/react';

export const useAnimationConfig = (customConfig = {}) => {
  const defaultConfig = {
    duration: 300,
    easing: 'ease-out',
    disrespectReducedMotion: false
  };

  const config = { ...defaultConfig, ...customConfig };
  return useAutoAnimate(config);
};
```

```tsx
// src/pages/Grids.tsx
import { useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

export const Grids = () => {
  const [items, setItems] = useState(
    Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      color: `hsl(${(i * 30) % 360}, 70%, 60%)`
    }))
  );
  const [parent] = useAutoAnimate({
    duration: 500,
    easing: 'ease-in-out'
  });

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const shuffleItems = () => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setItems(shuffled);
  };

  const resetItems = () => {
    setItems(
      Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        color: `hsl(${(i * 30) % 360}, 70%, 60%)`
      }))
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">彩色方块</h2>
        <div className="flex gap-2">
          <button
            onClick={shuffleItems}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            随机排序
          </button>
          <button
            onClick={resetItems}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            重置
          </button>
        </div>
      </div>

      <div
        ref={parent}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {items.map(item => (
          <div
            key={item.id}
            className="aspect-square rounded-lg shadow-lg flex items-center justify-center text-white text-2xl font-bold cursor-pointer hover:scale-105 transition-transform"
            style={{ backgroundColor: item.color }}
            onClick={() => removeItem(item.id)}
          >
            {item.id}
          </div>
        ))}
      </div>

      <p className="text-center text-gray-500 mt-4">点击方块删除</p>
    </div>
  );
};
```

## 核心特性

### 1. 零配置
- 自动检测 DOM 变化
- 无需手动编写动画代码
- 开箱即用

### 2. 轻量级
- 仅 1.6KB gzipped
- 无外部依赖
- 高性能

### 3. 灵活配置
- 自定义动画时长
- 自定义缓动函数
- 支持禁用动画

### 4. 多框架支持
- React
- Vue
- Solid
- Svelte
- Preact

## 最佳实践

1. **合理使用 ref**: 只在需要动画的容器上使用 useAutoAnimate hook
2. **唯一 key**: 确保列表项有稳定的唯一 key
3. **避免过度使用**: 不需要对所有元素都添加动画
4. **考虑可访问性**: 尊重用户的减少动画偏好设置

## 常见用例

- 列表增删改
- 网格布局变化
- 表单字段动态添加
- 表格数据更新
- 手风琴/折叠面板
- 标签页切换
- 通知/提示消息

## 性能优化

```tsx
// 禁用动画（例如在低端设备上）
const [parent] = useAutoAnimate({
  disrespectReducedMotion: true
});

// 自定义动画时长
const [parent] = useAutoAnimate({
  duration: 200 // 更快的动画
});

// 使用不同的缓动函数
const [parent] = useAutoAnimate({
  easing: 'linear'
});
```

## 工具函数

```ts
// src/utils/animations.ts
export const animationPresets = {
  fast: {
    duration: 150,
    easing: 'ease-out'
  },
  normal: {
    duration: 300,
    easing: 'ease-in-out'
  },
  slow: {
    duration: 500,
    easing: 'ease-in-out'
  }
};

export const getAnimationConfig = (preset: keyof typeof animationPresets) => {
  return animationPresets[preset];
};
```

## 依赖

```json
{
  "dependencies": {
    "@formkit/auto-animate": "^0.8.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
```
