# DnD Kit React 拖拽库模板

## 技术栈

- **DnD Kit**: React 拖拽库
- **React 18**: UI 框架
- **TypeScript**: 类型支持
- **Vite**: 构建工具
- **Tailwind CSS**: 样式方案
- **React Router**: 路由管理

## 项目结构

```
dnd-kit-app/
├── src/
│   ├── components/
│   │   ├── dnd/
│   │   │   ├── SortableList.tsx
│   │   │   ├── DraggableItem.tsx
│   │   │   ├── DroppableZone.tsx
│   │   │   ├── DragOverlay.tsx
│   │   │   └── KanbanBoard.tsx
│   │   ├── examples/
│   │   │   ├── TodoList.tsx
│   │   │   ├── Kanban.tsx
│   │   │   ├── ImageGallery.tsx
│   │   │   └── TreeView.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useSortable.ts
│   │   ├── useDroppable.ts
│   │   └── useDraggable.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Sortable.tsx
│   │   ├── Kanban.tsx
│   │   └── Advanced.tsx
│   ├── utils/
│   │   ├── dnd-helpers.ts
│   │   └── sensors.ts
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

### 基础拖拽组件

```tsx
// src/components/dnd/DraggableItem.tsx
import { useDraggable } from '@dnd-kit/core';
import { ReactNode } from 'react';

interface DraggableItemProps {
  id: string;
  children: ReactNode;
  disabled?: boolean;
}

export const DraggableItem = ({ id, children, disabled = false }: DraggableItemProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    disabled
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-move ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {children}
    </div>
  );
};
```

```tsx
// src/components/dnd/DroppableZone.tsx
import { useDroppable } from '@dnd-kit/core';
import { ReactNode } from 'react';

interface DroppableZoneProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const DroppableZone = ({ id, children, className = '' }: DroppableZoneProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'bg-blue-50 ring-2 ring-blue-500' : ''}`}
    >
      {children}
    </div>
  );
};
```

### 可排序列表

```tsx
// src/components/dnd/SortableList.tsx
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useState } from 'react';

interface SortableItem {
  id: string;
  content: string;
}

interface SortableListProps {
  items: SortableItem[];
  onReorder: (items: SortableItem[]) => void;
  renderItem: (item: SortableItem) => React.ReactNode;
}

export const SortableList = ({ items, onReorder, renderItem }: SortableListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map(item => renderItem(item))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
```

```tsx
// src/components/examples/TodoList.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { SortableList } from '../dnd/SortableList';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const SortableTodoItem = ({ 
  todo, 
  onToggle, 
  onDelete 
}: { 
  todo: Todo; 
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : 'hover:shadow-md'
      } transition-shadow`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-move text-gray-400 hover:text-gray-600"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
      
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        className="w-5 h-5 rounded border-gray-300"
      />
      
      <span className={`flex-1 ${todo.completed ? 'line-through text-gray-400' : ''}`}>
        {todo.text}
      </span>
      
      <button
        onClick={() => onDelete(todo.id)}
        className="px-3 py-1 text-red-500 hover:bg-red-50 rounded transition-colors"
      >
        删除
      </button>
    </div>
  );
};

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([
    { id: '1', text: '学习 DnD Kit', completed: false },
    { id: '2', text: '构建待办应用', completed: false },
    { id: '3', text: '添加拖拽功能', completed: false },
    { id: '4', text: '优化用户体验', completed: false }
  ]);
  const [inputValue, setInputValue] = useState('');

  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos([
        ...todos,
        {
          id: Date.now().toString(),
          text: inputValue,
          completed: false
        }
      ]);
      setInputValue('');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">可排序待办事项</h2>
      
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

      <SortableList
        items={todos}
        onReorder={setTodos}
        renderItem={(todo) => (
          <SortableTodoItem
            key={todo.id}
            todo={todo}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
          />
        )}
      />
    </div>
  );
};
```

### 看板（Kanban）

```tsx
// src/components/dnd/KanbanBoard.tsx
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useState } from 'react';

interface KanbanCard {
  id: string;
  title: string;
  description?: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onColumnsChange: (columns: KanbanColumn[]) => void;
}

export const KanbanBoard = ({ columns, onColumnsChange }: KanbanBoardProps) => {
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  const findColumnByCardId = (cardId: string) => {
    return columns.find(col => col.cards.some(card => card.id === cardId));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const column = findColumnByCardId(active.id as string);
    const card = column?.cards.find(c => c.id === active.id);
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumnByCardId(activeId);
    const overColumn = findColumnByCardId(overId) || 
      columns.find(col => col.id === overId);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    const activeCard = activeColumn.cards.find(c => c.id === activeId);
    if (!activeCard) return;

    const newColumns = columns.map(col => {
      if (col.id === activeColumn.id) {
        return {
          ...col,
          cards: col.cards.filter(c => c.id !== activeId)
        };
      }
      if (col.id === overColumn.id) {
        const overIndex = col.cards.findIndex(c => c.id === overId);
        const insertIndex = overIndex >= 0 ? overIndex : col.cards.length;
        const newCards = [...col.cards];
        newCards.splice(insertIndex, 0, activeCard);
        return { ...col, cards: newCards };
      }
      return col;
    });

    onColumnsChange(newColumns);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto p-4">
        {columns.map(column => (
          <div
            key={column.id}
            className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4"
          >
            <h3 className="font-bold text-lg mb-4">{column.title}</h3>
            <SortableContext
              items={column.cards.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 min-h-[200px]">
                {column.cards.map(card => (
                  <div
                    key={card.id}
                    className="bg-white p-3 rounded shadow hover:shadow-md transition-shadow cursor-move"
                  >
                    <p className="font-medium">{card.title}</p>
                    {card.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {card.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeCard ? (
          <div className="bg-white p-3 rounded shadow-lg ring-2 ring-blue-500">
            <p className="font-medium">{activeCard.title}</p>
            {activeCard.description && (
              <p className="text-sm text-gray-600 mt-1">
                {activeCard.description}
              </p>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
```

```tsx
// src/components/examples/Kanban.tsx
import { useState } from 'react';
import { KanbanBoard } from '../dnd/KanbanBoard';

interface KanbanColumn {
  id: string;
  title: string;
  cards: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

export const Kanban = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    {
      id: 'todo',
      title: '待办',
      cards: [
        { id: '1', title: '设计首页', description: '创建响应式布局' },
        { id: '2', title: '实现登录功能', description: '集成 OAuth' }
      ]
    },
    {
      id: 'in-progress',
      title: '进行中',
      cards: [
        { id: '3', title: '开发 API', description: 'RESTful 端点' }
      ]
    },
    {
      id: 'done',
      title: '已完成',
      cards: [
        { id: '4', title: '项目初始化', description: '设置开发环境' }
      ]
    }
  ]);

  return (
    <div className="h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4">
        <h2 className="text-2xl font-bold">项目看板</h2>
      </div>
      <KanbanBoard columns={columns} onColumnsChange={setColumns} />
    </div>
  );
};
```

### 图片画廊

```tsx
// src/components/examples/ImageGallery.tsx
import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Image {
  id: string;
  url: string;
  title: string;
}

const SortableImage = ({ image }: { image: Image }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative group rounded-lg overflow-hidden shadow-lg ${
        isDragging ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <img
        src={image.url}
        alt={image.title}
        className="w-full h-48 object-cover"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all">
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-white font-medium">{image.title}</p>
        </div>
      </div>
    </div>
  );
};

export const ImageGallery = () => {
  const [images, setImages] = useState<Image[]>([
    { id: '1', url: 'https://picsum.photos/300/200?random=1', title: '风景 1' },
    { id: '2', url: 'https://picsum.photos/300/200?random=2', title: '风景 2' },
    { id: '3', url: 'https://picsum.photos/300/200?random=3', title: '风景 3' },
    { id: '4', url: 'https://picsum.photos/300/200?random=4', title: '风景 4' },
    { id: '5', url: 'https://picsum.photos/300/200?random=5', title: '风景 5' },
    { id: '6', url: 'https://picsum.photos/300/200?random=6', title: '风景 6' }
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex(img => img.id === active.id);
      const newIndex = images.findIndex(img => img.id === over.id);
      
      const newImages = [...images];
      const [removed] = newImages.splice(oldIndex, 1);
      newImages.splice(newIndex, 0, removed);
      
      setImages(newImages);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">可拖拽图片画廊</h2>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={images} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map(image => (
              <SortableImage key={image.id} image={image} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
```

### 树形视图

```tsx
// src/components/examples/TreeView.tsx
import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TreeNode {
  id: string;
  title: string;
  children?: TreeNode[];
}

const SortableTreeNode = ({ 
  node, 
  depth = 0 
}: { 
  node: TreeNode; 
  depth?: number;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${depth * 20}px`
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        className={`flex items-center gap-2 p-2 bg-white rounded border ${
          isDragging ? 'shadow-lg ring-2 ring-blue-500' : 'hover:bg-gray-50'
        } cursor-move`}
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
        <span>{node.title}</span>
      </div>
      {node.children && (
        <div className="mt-1 space-y-1">
          {node.children.map(child => (
            <SortableTreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const TreeView = () => {
  const [nodes, setNodes] = useState<TreeNode[]>([
    {
      id: '1',
      title: '项目根目录',
      children: [
        {
          id: '1-1',
          title: 'src',
          children: [
            { id: '1-1-1', title: 'components' },
            { id: '1-1-2', title: 'utils' }
          ]
        },
        { id: '1-2', title: 'public' },
        { id: '1-3', title: 'tests' }
      ]
    }
  ]);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    // 实现树形结构的拖拽逻辑
    console.log('Drag ended:', event);
  };

  const flattenNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.reduce((acc: TreeNode[], node) => {
      acc.push(node);
      if (node.children) {
        acc.push(...flattenNodes(node.children));
      }
      return acc;
    }, []);
  };

  const allNodes = flattenNodes(nodes);

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">可拖拽树形视图</h2>
      
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={allNodes} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {nodes.map(node => (
              <SortableTreeNode key={node.id} node={node} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
```

## 核心特性

### 1. 零依赖
- 不依赖第三方动画库
- 轻量级，性能优秀
- 树摇优化友好

### 2. 高度可定制
- 自定义传感器（鼠标、触摸、键盘）
- 自定义碰撞检测算法
- 自定义拖拽覆盖层

### 3. 无障碍支持
- 完整的键盘导航支持
- 屏幕阅读器友好
- 遵循 WAI-ARIA 标准

### 4. 灵活的排序策略
- 垂直列表
- 水平列表
- 网格布局
- 树形结构

## 最佳实践

1. **合理设置激活约束**: 避免误触发拖拽
2. **提供视觉反馈**: 使用 DragOverlay 显示拖拽预览
3. **优化性能**: 大列表使用虚拟化
4. **处理边界情况**: 考虑空状态和边界限制

## 常见用例

- 可排序列表
- 看板（Kanban）系统
- 图片画廊排序
- 树形结构重组
- 拖拽上传
- 表格行排序
- 多列布局调整

## 传感器配置

```tsx
// src/utils/sensors.ts
import { PointerSensor, KeyboardSensor, MouseSensor, TouchSensor } from '@dnd-kit/core';

export const createSensors = () => {
  return [
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 需要移动 8px 才激活
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 长按 200ms 激活
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {}),
  ];
};
```

## 碰撞检测

```tsx
import {
  closestCenter,
  closestCorners,
  pointerWithin,
  rectIntersection
} from '@dnd-kit/core';

// 不同的碰撞检测策略
const collisionStrategies = {
  closestCenter,    // 最近中心点
  closestCorners,   // 最近角落
  pointerWithin,    // 指针在区域内
  rectIntersection  // 矩形相交
};
```

## 依赖

```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
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
