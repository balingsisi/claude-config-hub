# TanStack Virtual 模板

## 技术栈

### 核心技术
- **@tanstack/react-virtual**: React 虚拟滚动库
- **React**: UI 框架
- **TypeScript**: 类型安全

### 支持框架
- **@tanstack/react-virtual**: React
- **@tanstack/vue-virtual**: Vue 3
- **@tanstack/svelte-virtual**: Svelte
- **@tanstack/solid-virtual**: SolidJS
- **@tanstack/angular-virtual**: Angular

### 核心特性
- **虚拟滚动**: 只渲染可见项
- **无限滚动**: 支持动态加载
- **网格布局**: 支持多列
- **可变尺寸**: 动态高度项
- **粘性项**: 固定头部/尾部

## 项目结构

```
virtual-list-project/
├── src/
│   ├── components/
│   │   ├── VirtualList/
│   │   │   ├── BasicList.tsx
│   │   │   ├── InfiniteList.tsx
│   │   │   ├── GridList.tsx
│   │   │   ├── VariableSizeList.tsx
│   │   │   └── StickyList.tsx
│   │   ├── UserList.tsx
│   │   ├── ChatWindow.tsx
│   │   └── DataTable.tsx
│   ├── hooks/
│   │   ├── useVirtualList.ts
│   │   └── useInfiniteScroll.ts
│   ├── utils/
│   │   └── helpers.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── tsconfig.json
├── vite.config.ts
└── package.json
```

## 核心代码模式

### 1. 基础虚拟列表

```tsx
// src/components/VirtualList/BasicList.tsx
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

interface Item {
  id: string
  text: string
}

interface Props {
  items: Item[]
}

export function BasicList({ items }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // 每项高度估计值
    overscan: 5, // 预渲染项数
  })

  return (
    <div
      ref={parentRef}
      style={{
        height: '400px',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <div className="list-item">
              {items[virtualRow.index].text}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 2. 无限滚动列表

```tsx
// src/components/VirtualList/InfiniteList.tsx
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useState, useEffect } from 'react'

interface Post {
  id: string
  title: string
  body: string
}

export function InfiniteList() {
  const parentRef = useRef<HTMLDivElement>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const fetchPosts = async (pageNum: number) => {
    setIsLoading(true)
    const res = await fetch(
      `https://jsonplaceholder.typicode.com/posts?_page=${pageNum}&_limit=20`
    )
    const data = await res.json()
    setPosts((prev) => [...prev, ...data])
    setHasMore(data.length > 0)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchPosts(page)
  }, [page])

  const rowVirtualizer = useVirtualizer({
    count: hasMore ? posts.length + 1 : posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  })

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse()

    if (!lastItem) return

    if (
      lastItem.index >= posts.length - 1 &&
      hasMore &&
      !isLoading
    ) {
      setPage((p) => p + 1)
    }
  }, [rowVirtualizer.getVirtualItems(), posts.length, hasMore, isLoading])

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const isLoaderRow = virtualRow.index > posts.length - 1
          const post = posts[virtualRow.index]

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {isLoaderRow ? (
                <div className="loading">加载中...</div>
              ) : (
                <div className="post-item">
                  <h3>{post.title}</h3>
                  <p>{post.body}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### 3. 虚拟网格

```tsx
// src/components/VirtualList/GridList.tsx
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

interface Image {
  id: string
  url: string
  title: string
}

interface Props {
  images: Image[]
  columnCount?: number
}

export function GridList({ images, columnCount = 3 }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(images.length / columnCount),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 3,
  })

  return (
    <div
      ref={parentRef}
      style={{
        height: '600px',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIdx = virtualRow.index * columnCount
          const rowImages = images.slice(startIdx, startIdx + columnCount)

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'flex',
                gap: '16px',
                padding: '0 16px',
              }}
            >
              {rowImages.map((image) => (
                <div
                  key={image.id}
                  style={{
                    flex: 1,
                    height: '100%',
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### 4. 可变高度列表

```tsx
// src/components/VirtualList/VariableSizeList.tsx
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useCallback } from 'react'

interface Message {
  id: string
  text: string
  sender: string
}

interface Props {
  messages: Message[]
}

export function VariableSizeList({ messages }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index: number) => {
      // 根据文本长度估算高度
      const textLength = messages[index].text.length
      return Math.max(60, Math.ceil(textLength / 50) * 20 + 40)
    }, [messages]),
    overscan: 10,
  })

  return (
    <div
      ref={parentRef}
      style={{
        height: '500px',
        overflow: 'auto',
        border: '1px solid #ccc',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const message = messages[virtualRow.index]

          return (
            <div
              key={virtualRow.key}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #eee',
                }}
              >
                <strong>{message.sender}</strong>
                <p>{message.text}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### 5. 粘性头部列表

```tsx
// src/components/VirtualList/StickyList.tsx
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

interface Group {
  id: string
  title: string
  items: string[]
}

interface Props {
  groups: Group[]
}

export function StickyList({ groups }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  // 展平分组为单个列表
  const flattenedItems = groups.flatMap((group) => [
    { type: 'header' as const, data: group.title },
    ...group.items.map((item) => ({ type: 'item' as const, data: item })),
  ])

  const rowVirtualizer = useVirtualizer({
    count: flattenedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      return flattenedItems[index].type === 'header' ? 40 : 50
    },
    overscan: 5,
  })

  return (
    <div
      ref={parentRef}
      style={{
        height: '600px',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = flattenedItems[virtualRow.index]
          const isHeader = item.type === 'header'

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                ...(isHeader && {
                  zIndex: 1,
                  position: 'sticky',
                  top: `${virtualRow.start}px`,
                }),
              }}
            >
              {isHeader ? (
                <div
                  style={{
                    padding: '10px',
                    backgroundColor: '#4F46E5',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  {item.data}
                </div>
              ) : (
                <div
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  {item.data}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### 6. 聊天窗口示例

```tsx
// src/components/ChatWindow.tsx
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useEffect } from 'react'

interface ChatMessage {
  id: string
  text: string
  sender: 'me' | 'other'
  timestamp: Date
}

interface Props {
  messages: ChatMessage[]
}

export function ChatWindow({ messages }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
    initialOffset: 0,
  })

  // 自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      rowVirtualizer.scrollToIndex(messages.length - 1, {
        align: 'end',
      })
    }
  }, [messages.length])

  return (
    <div
      ref={parentRef}
      style={{
        height: '500px',
        overflow: 'auto',
        padding: '16px',
        backgroundColor: '#f9fafb',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const message = messages[virtualRow.index]
          const isMe = message.sender === 'me'

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'flex',
                justifyContent: isMe ? 'flex-end' : 'flex-start',
                padding: '8px 0',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: isMe ? '#4F46E5' : 'white',
                  color: isMe ? 'white' : 'black',
                }}
              >
                <p>{message.text}</p>
                <span
                  style={{
                    fontSize: '12px',
                    opacity: 0.7,
                  }}
                >
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

## 最佳实践

### 1. 性能优化

```tsx
// ✅ 使用 measureElement 动态测量高度
const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
  measureElement: (element) => {
    return element?.getBoundingClientRect().height || 50
  },
})

// 在元素上添加 ref 和 data-index
<div
  ref={rowVirtualizer.measureElement}
  data-index={virtualRow.index}
>
```

### 2. 记忆化回调

```tsx
// ✅ 使用 useCallback 避免重复创建函数
const estimateSize = useCallback((index: number) => {
  return calculateHeight(items[index])
}, [items])

const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize,
})
```

### 3. 滚动到指定项

```tsx
// 滚动到索引 100
rowVirtualizer.scrollToIndex(100)

// 带对齐选项
rowVirtualizer.scrollToIndex(100, { align: 'center' })

// 平滑滚动
rowVirtualizer.scrollToIndex(100, { smoothScroll: true })
```

### 4. 响应式设计

```tsx
// 使用 ResizeObserver 监听容器大小变化
import { useResizeObserver } from '@vueuse/core'

const parentRef = useRef<HTMLDivElement>(null)
const [containerWidth, setContainerWidth] = useState(0)

useResizeObserver(parentRef, (entries) => {
  setContainerWidth(entries[0].contentRect.width)
})
```

## 常用命令

### 安装

```bash
# React
pnpm add @tanstack/react-virtual

# Vue
pnpm add @tanstack/vue-virtual

# Svelte
pnpm add @tanstack/svelte-virtual
```

### 开发

```bash
# 启动开发服务器
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm type-check
```

## 部署配置

### 1. Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'tanstack-virtual': ['@tanstack/react-virtual'],
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
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true
  }
}
```

## 相关资源

- [TanStack Virtual 官方文档](https://tanstack.com/virtual/latest)
- [TanStack Virtual GitHub](https://github.com/TanStack/virtual)
- [React 虚拟化最佳实践](https://react.dev/learn/rendering-lists)
- [性能优化指南](https://web.dev/virtualize-long-lists-react-window/)
