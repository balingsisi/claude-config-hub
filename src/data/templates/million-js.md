# Million.js 性能优化模板

## 技术栈

- **核心**: Million.js 3.x
- **React**: 18.x / 19.x
- **编译器**: Babel / Vite 插件
- **优化**: 虚拟 DOM diffing 优化
- **类型安全**: TypeScript 5.x
- **测试**: Vitest + @testing-library/react

## 项目结构

```
project/
├── src/
│   ├── components/
│   │   ├── optimized/
│   │   │   ├── VirtualList.tsx
│   │   │   ├── DataTable.tsx
│   │   │   └── DynamicGrid.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useMillion.ts
│   │   └── useOptimized.ts
│   ├── utils/
│   │   └── million-helpers.ts
│   └── types/
│       └── million.d.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 代码模式

### 基础优化组件

```typescript
// src/components/optimized/VirtualList.tsx
import { block } from 'million/react';
import { useState, useCallback } from 'react';

interface Item {
  id: string;
  title: string;
  description: string;
  timestamp: number;
}

interface VirtualListProps {
  items: Item[];
  onItemClick?: (id: string) => void;
}

const VirtualList = block<VirtualListProps>(({ items, onItemClick }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleClick = useCallback((id: string) => {
    setSelectedId(id);
    onItemClick?.(id);
  }, [onItemClick]);

  return (
    <div className="virtual-list">
      {items.map((item) => (
        <div
          key={item.id}
          className={`list-item ${selectedId === item.id ? 'selected' : ''}`}
          onClick={() => handleClick(item.id)}
        >
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <span className="timestamp">
            {new Date(item.timestamp).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
});

export default VirtualList;
```

### 数据表格优化

```typescript
// src/components/optimized/DataTable.tsx
import { block, For } from 'million/react';
import { useMemo } from 'react';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: keyof T;
  onRowClick?: (row: T) => void;
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  rowKey,
  onRowClick,
}: DataTableProps<T>) {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => 
      String(a[rowKey]).localeCompare(String(b[rowKey]))
    );
  }, [data, rowKey]);

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <For each={sortedData}>
            {(row) => (
              <tr 
                key={String(row[rowKey])}
                onClick={() => onRowClick?.(row)}
                className="data-row"
              >
                {columns.map((col) => (
                  <td key={String(col.key)}>
                    {col.render 
                      ? col.render(row[col.key], row)
                      : String(row[col.key])}
                  </td>
                ))}
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}

export default block(DataTable);

// 使用示例
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

const columns: Column<User>[] = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { 
    key: 'createdAt', 
    header: 'Created',
    render: (value) => new Date(value).toLocaleDateString()
  },
];

<DataTable 
  data={users} 
  columns={columns} 
  rowKey="id"
  onRowClick={(user) => console.log(user)}
/>
```

### 动态网格优化

```typescript
// src/components/optimized/DynamicGrid.tsx
import { block } from 'million/react';
import { useState, useEffect } from 'react';

interface GridItem {
  id: string;
  content: React.ReactNode;
  width?: number;
  height?: number;
}

interface DynamicGridProps {
  items: GridItem[];
  columns?: number;
  gap?: number;
  responsive?: boolean;
}

const DynamicGrid = block<DynamicGridProps>(({
  items,
  columns = 3,
  gap = 16,
  responsive = true,
}) => {
  const [gridColumns, setGridColumns] = useState(columns);

  useEffect(() => {
    if (!responsive) return;

    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setGridColumns(1);
      else if (width < 1024) setGridColumns(2);
      else setGridColumns(columns);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [columns, responsive]);

  return (
    <div
      className="dynamic-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="grid-item"
          style={{
            width: item.width ? `${item.width}px` : 'auto',
            height: item.height ? `${item.height}px` : 'auto',
          }}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
});

export default DynamicGrid;
```

### 条件渲染优化

```typescript
// src/components/optimized/Toggle.tsx
import { block } from 'million/react';
import { useState, useCallback } from 'react';

interface ToggleProps {
  initialState?: boolean;
  onToggle?: (state: boolean) => void;
  renderOn: () => React.ReactNode;
  renderOff: () => React.ReactNode;
}

const Toggle = block<ToggleProps>(({
  initialState = false,
  onToggle,
  renderOn,
  renderOff,
}) => {
  const [isOn, setIsOn] = useState(initialState);

  const handleToggle = useCallback(() => {
    setIsOn((prev) => {
      const newState = !prev;
      onToggle?.(newState);
      return newState;
    });
  }, [onToggle]);

  return (
    <div className="toggle-container">
      <button onClick={handleToggle} className="toggle-button">
        {isOn ? 'ON' : 'OFF'}
      </button>
      <div className="toggle-content">
        {isOn ? renderOn() : renderOff()}
      </div>
    </div>
  );
});

export default Toggle;
```

### 列表渲染优化

```typescript
// src/components/optimized/OptimizedList.tsx
import { block, For } from 'million/react';
import { useMemo } from 'react';

interface ListItem {
  id: string;
  value: string;
  metadata?: Record<string, any>;
}

interface OptimizedListProps {
  items: ListItem[];
  filter?: (item: ListItem) => boolean;
  sortBy?: keyof ListItem;
  renderItem: (item: ListItem) => React.ReactNode;
}

const OptimizedList = block<OptimizedListProps>(({
  items,
  filter,
  sortBy,
  renderItem,
}) => {
  const processedItems = useMemo(() => {
    let result = items;
    
    if (filter) {
      result = result.filter(filter);
    }
    
    if (sortBy) {
      result = [...result].sort((a, b) => 
        String(a[sortBy]).localeCompare(String(b[sortBy]))
      );
    }
    
    return result;
  }, [items, filter, sortBy]);

  return (
    <div className="optimized-list">
      <For each={processedItems}>
        {(item) => (
          <div key={item.id} className="list-item">
            {renderItem(item)}
          </div>
        )}
      </For>
    </div>
  );
});

export default OptimizedList;
```

### 自定义 Hook

```typescript
// src/hooks/useMillion.ts
import { useState, useCallback, useRef, useEffect } from 'react';

export function useMillion<T>(
  initialValue: T,
  optimizer?: (prev: T, next: T) => boolean
) {
  const [value, setValue] = useState<T>(initialValue);
  const prevValueRef = useRef<T>(initialValue);

  const optimizedSetValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const next = newValue instanceof Function ? newValue(prev) : newValue;
      
      // 如果提供了优化器，检查是否需要更新
      if (optimizer && !optimizer(prevValueRef.current, next)) {
        return prev;
      }
      
      prevValueRef.current = next;
      return next;
    });
  }, [optimizer]);

  return [value, optimizedSetValue] as const;
}

// 使用示例
const [data, setData] = useMillion(
  { items: [], count: 0 },
  (prev, next) => prev.count !== next.count
);
```

```typescript
// src/hooks/useOptimized.ts
import { useMemo, useRef } from 'react';

export function useOptimized<T>(
  factory: () => T,
  deps: React.DependencyList,
  compare?: (prevDeps: React.DependencyList, nextDeps: React.DependencyList) => boolean
): T {
  const valueRef = useRef<T>();
  const depsRef = useRef<React.DependencyList>(deps);

  return useMemo(() => {
    if (compare && !compare(depsRef.current, deps)) {
      depsRef.current = deps;
      return valueRef.current!;
    }

    valueRef.current = factory();
    depsRef.current = deps;
    return valueRef.current;
  }, deps);
}

// 使用示例
const expensiveValue = useOptimized(
  () => computeExpensiveValue(data),
  [data],
  (prev, next) => prev[0] === next[0]
);
```

## 最佳实践

### 1. 识别优化场景

```typescript
// ✅ 适合优化的场景
// - 大型列表渲染（100+ 项）
// - 频繁更新的数据表格
// - 复杂的组件树
// - 动态内容区域

const LargeList = block(() => {
  // 大型列表组件
});

// ❌ 不适合优化的场景
// - 静态内容
// - 简单组件
// - 低频更新
// - 根组件
```

### 2. 正确使用 block

```typescript
// ✅ 推荐：在组件级别使用
const OptimizedComponent = block(() => {
  return <div>Content</div>;
});

// ❌ 避免：嵌套 block
const Outer = block(() => {
  const Inner = block(() => <div>Inner</div>);
  return <Inner />;
});

// ✅ 推荐：分离关注点
const Inner = block(() => <div>Inner</div>);
const Outer = block(() => <Inner />);
```

### 3. 性能对比

```typescript
// src/utils/performance.ts
export function measurePerformance(
  name: string,
  fn: () => void
): number {
  const start = performance.now();
  fn();
  const end = performance.now();
  const duration = end - start;
  
  console.log(`${name} took ${duration.toFixed(2)}ms`);
  return duration;
}

// 使用
measurePerformance('Standard React', () => {
  render(<StandardList items={largeDataset} />);
});

measurePerformance('Million.js', () => {
  render(<OptimizedList items={largeDataset} />);
});
```

### 4. 调试技巧

```typescript
// 开发模式下的调试
const DebugComponent = block((props) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Component rendered with props:', props);
  }
  
  return <div>{props.value}</div>;
});

// 使用 React DevTools
// Million.js 组件会在 DevTools 中显示为特殊标记
```

## 配置

### Vite 插件配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import million from 'million/compiler';

export default defineConfig({
  plugins: [
    million.vite({
      auto: true, // 自动优化
      threshold: 0.05, // 性能阈值
      silent: false, // 显示优化日志
    }),
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          million: ['million'],
        },
      },
    },
  },
});
```

### Babel 配置

```javascript
// babel.config.js
module.exports = {
  presets: ['@babel/preset-react', '@babel/preset-typescript'],
  plugins: [
    'million/babel',
    // 其他插件
  ],
};
```

### Next.js 集成

```javascript
// next.config.js
const million = require('million/compiler');

module.exports = million.next({
  auto: true,
  threshold: 0.05,
}, {
  // Next.js 配置
  reactStrictMode: true,
});
```

## 常用命令

```bash
# 安装依赖
npm install million

# 开发依赖
npm install -D @types/react @types/react-dom

# 开发服务器
npm run dev

# 生产构建
npm run build

# 性能分析
npm run analyze

# 运行测试
npm run test

# 代码检查
npm run lint
```

## 部署配置

### Vercel 部署

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 性能指标

### 基准测试

```typescript
// src/__tests__/benchmark.ts
import { render } from '@testing-library/react';
import { StandardList, OptimizedList } from '@/components';

const generateData = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: String(i),
    value: `Item ${i}`,
  }));

describe('Performance Benchmarks', () => {
  it('should render 1000 items faster with Million.js', () => {
    const data = generateData(1000);
    
    const standardStart = performance.now();
    render(<StandardList items={data} />);
    const standardDuration = performance.now() - standardStart;
    
    const optimizedStart = performance.now();
    render(<OptimizedList items={data} />);
    const optimizedDuration = performance.now() - optimizedStart;
    
    console.log(`Standard: ${standardDuration.toFixed(2)}ms`);
    console.log(`Optimized: ${optimizedDuration.toFixed(2)}ms`);
    console.log(`Improvement: ${((1 - optimizedDuration / standardDuration) * 100).toFixed(1)}%`);
    
    expect(optimizedDuration).toBeLessThan(standardDuration);
  });
});
```

### 监控指标

```typescript
// src/utils/monitoring.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance() {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  measure(name: string, fn: () => void) {
    const start = performance.now();
    fn();
    const duration = performance.now() - start;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
  }

  getAverageTime(name: string): number {
    const times = this.metrics.get(name) || [];
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  report() {
    this.metrics.forEach((times, name) => {
      const avg = this.getAverageTime(name);
      console.log(`${name}: avg ${avg.toFixed(2)}ms (${times.length} samples)`);
    });
  }
}
```

## 测试

```typescript
// src/__tests__/VirtualList.test.tsx
import { render, screen } from '@testing-library/react';
import VirtualList from '@/components/optimized/VirtualList';

describe('VirtualList', () => {
  const mockItems = [
    { id: '1', title: 'Item 1', description: 'Desc 1', timestamp: Date.now() },
    { id: '2', title: 'Item 2', description: 'Desc 2', timestamp: Date.now() },
  ];

  it('should render all items', () => {
    render(<VirtualList items={mockItems} />);
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('should handle item click', () => {
    const handleClick = jest.fn();
    render(<VirtualList items={mockItems} onItemClick={handleClick} />);
    
    screen.getByText('Item 1').click();
    expect(handleClick).toHaveBeenCalledWith('1');
  });

  it('should highlight selected item', () => {
    render(<VirtualList items={mockItems} />);
    
    const item = screen.getByText('Item 1');
    item.click();
    
    expect(item.closest('.list-item')).toHaveClass('selected');
  });
});
```

## 故障排除

### 常见问题

```typescript
// 问题 1: block 不生效
// ❌ 错误用法
export default function Component() {
  return <div>Content</div>;
}

// ✅ 正确用法
export default block(() => {
  return <div>Content</div>;
});

// 问题 2: 性能没有提升
// 检查是否满足优化条件：
// 1. 组件是否有频繁更新？
// 2. 数据量是否足够大？
// 3. 是否正确使用了 block？

// 问题 3: 类型错误
// 确保安装了正确的类型定义
npm install -D @types/react @types/react-dom
```

## 参考资源

- [Million.js 官方文档](https://million.dev/)
- [Million.js GitHub](https://github.com/aidenybai/million)
- [React 性能优化指南](https://react.dev/learn/render-and-commit)
- [性能分析工具](https://react.dev/learn/profiling)
