# TinyBase 响应式数据存储模板

## 技术栈

- **核心**: TinyBase 5.x
- **React**: 18.x / 19.x
- **状态管理**: TinyBase Store
- **持久化**: IndexedDB / SQLite
- **同步**: TinyBase Synchronizer
- **类型安全**: TypeScript 5.x
- **测试**: Vitest

## 项目结构

```
project/
├── src/
│   ├── store/
│   │   ├── index.ts              # Store 导出
│   │   ├── schema.ts             # 数据结构定义
│   │   ├── store.ts              # Store 创建
│   │   ├── persisters/
│   │   │   ├── indexedDB.ts      # IndexedDB 持久化
│   │   │   └── sqlite.ts         # SQLite 持久化
│   │   └── synchronizers/
│   │       └── websocket.ts      # WebSocket 同步
│   ├── hooks/
│   │   ├── useStore.ts           # Store 访问
│   │   ├── useTables.ts          # 表数据访问
│   │   ├── useValues.ts          # 值数据访问
│   │   └── useMetrics.ts         # 指标计算
│   ├── components/
│   │   ├── TodoList.tsx
│   │   ├── UserProfile.tsx
│   │   └── Dashboard.tsx
│   ├── types/
│   │   └── store.ts
│   └── utils/
│       └── store-helpers.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### 数据结构定义

```typescript
// src/store/schema.ts
import { createStore } from 'tinybase';

// 定义表结构
export interface TablesSchema {
  todos: {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
    updatedAt: number;
    priority: 'low' | 'medium' | 'high';
    tags: string[];
  };
  users: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'admin' | 'user' | 'guest';
    preferences: {
      theme: 'light' | 'dark';
      notifications: boolean;
    };
  };
  comments: {
    id: string;
    todoId: string;
    userId: string;
    text: string;
    createdAt: number;
  };
}

// 定义值结构
export interface ValuesSchema {
  appVersion: string;
  lastSyncTime: number;
  currentUser: string;
  settings: {
    language: string;
    timezone: string;
  };
}

// 创建类型安全的 Store
export type AppStore = ReturnType<typeof createAppStore>;

export function createAppStore() {
  return createStore();
}
```

### Store 创建和配置

```typescript
// src/store/store.ts
import { createStore } from 'tinybase';
import { createIndexedDBPersister } from 'tinybase/persisters/persister-indexed-db';
import { createWebSocketSynchronizer } from 'tinybase/synchronizers/synchronizer-ws-client';

let store: ReturnType<typeof createStore> | null = null;
let persister: ReturnType<typeof createIndexedDBPersister> | null = null;
let synchronizer: ReturnType<typeof createWebSocketSynchronizer> | null = null;

export async function initializeStore() {
  if (store) return store;

  // 创建 Store
  store = createStore();

  // 初始化 IndexedDB 持久化
  persister = createIndexedDBPersister(store, 'app-db');
  await persister.load();

  // 自动保存到 IndexedDB
  persister.startAutoSave();

  // 初始化 WebSocket 同步（可选）
  if (process.env.NEXT_PUBLIC_SYNC_URL) {
    synchronizer = createWebSocketSynchronizer(
      store,
      process.env.NEXT_PUBLIC_SYNC_URL
    );
    await synchronizer.startSync();
  }

  return store;
}

export function getStore() {
  if (!store) {
    throw new Error('Store not initialized. Call initializeStore() first.');
  }
  return store;
}

export async function destroyStore() {
  if (synchronizer) {
    await synchronizer.stopSync();
    synchronizer = null;
  }

  if (persister) {
    await persister.destroy();
    persister = null;
  }

  store = null;
}

// 重置 Store
export async function resetStore() {
  const store = getStore();
  store.delTables();
  store.delValues();
  
  if (persister) {
    await persister.save();
  }
}
```

### React Hooks

```typescript
// src/hooks/useStore.ts
import { useStore, useTables, useValues, useTable, useRow, useCell, useValue } from 'tinybase/react';
import { getStore } from '@/store/store';

export function useAppStore() {
  return useStore(getStore());
}

// 访问所有表
export function useAppTables() {
  return useTables(getStore());
}

// 访问所有值
export function useAppValues() {
  return useValues(getStore());
}

// 访问特定表
export function useAppTable(tableId: string) {
  return useTable(tableId, getStore());
}

// 访问特定行
export function useAppRow(tableId: string, rowId: string) {
  return useRow(tableId, rowId, getStore());
}

// 访问特定单元格
export function useAppCell(tableId: string, rowId: string, cellId: string) {
  return useCell(tableId, rowId, cellId, getStore());
}

// 访问特定值
export function useAppValue(valueId: string) {
  return useValue(valueId, getStore());
}
```

### Todo 应用示例

```typescript
// src/components/TodoList.tsx
'use client';

import { useState, useCallback } from 'react';
import { useTable, useCreateRow, useDelRow, useSetCell } from 'tinybase/react';
import { getStore } from '@/store/store';
import type { TablesSchema } from '@/store/schema';

export default function TodoList() {
  const todos = useTable('todos', getStore());
  const createRow = useCreateRow(getStore());
  const delRow = useDelRow(getStore());
  const setCell = useSetCell(getStore());

  const [newTodoText, setNewTodoText] = useState('');

  const handleAddTodo = useCallback(() => {
    if (!newTodoText.trim()) return;

    const todoId = `todo-${Date.now()}`;
    createRow('todos', todoId);
    
    setCell('todos', todoId, 'text', newTodoText);
    setCell('todos', todoId, 'completed', false);
    setCell('todos', todoId, 'createdAt', Date.now());
    setCell('todos', todoId, 'updatedAt', Date.now());
    setCell('todos', todoId, 'priority', 'medium');
    setCell('todos', todoId, 'tags', []);

    setNewTodoText('');
  }, [newTodoText, createRow, setCell]);

  const handleToggleTodo = useCallback((todoId: string, completed: boolean) => {
    setCell('todos', todoId, 'completed', !completed);
    setCell('todos', todoId, 'updatedAt', Date.now());
  }, [setCell]);

  const handleDeleteTodo = useCallback((todoId: string) => {
    delRow('todos', todoId);
  }, [delRow]);

  const todoArray = Object.entries(todos || {}).map(([id, data]) => ({
    id,
    ...(data as TablesSchema['todos']),
  }));

  return (
    <div className="todo-list">
      <div className="add-todo">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
          placeholder="Add a new todo..."
        />
        <button onClick={handleAddTodo}>Add</button>
      </div>

      <ul className="todos">
        {todoArray.map((todo) => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggleTodo(todo.id, todo.completed)}
            />
            <span>{todo.text}</span>
            <button onClick={() => handleDeleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 用户配置管理

```typescript
// src/components/UserProfile.tsx
'use client';

import { useRow, useSetCell, useValue, useSetValue } from 'tinybase/react';
import { getStore } from '@/store/store';
import type { TablesSchema, ValuesSchema } from '@/store/schema';

interface UserProfileProps {
  userId: string;
}

export default function UserProfile({ userId }: UserProfileProps) {
  const user = useRow('users', userId, getStore()) as TablesSchema['users'];
  const setCell = useSetCell(getStore());
  const currentUser = useValue('currentUser', getStore());
  const setValue = useSetValue(getStore());

  const handleUpdateName = (name: string) => {
    setCell('users', userId, 'name', name);
  };

  const handleUpdateTheme = (theme: 'light' | 'dark') => {
    const preferences = user?.preferences || { theme: 'light', notifications: true };
    setCell('users', userId, 'preferences', { ...preferences, theme });
  };

  const handleSwitchUser = (newUserId: string) => {
    setValue('currentUser', newUserId);
  };

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="user-profile">
      <div className="avatar">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} />
        ) : (
          <div className="avatar-placeholder">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="user-info">
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        <span className="role">{user.role}</span>
      </div>

      <div className="preferences">
        <h3>Preferences</h3>
        
        <div className="preference-item">
          <label>Theme</label>
          <select
            value={user.preferences?.theme || 'light'}
            onChange={(e) => handleUpdateTheme(e.target.value as 'light' | 'dark')}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="preference-item">
          <label>Notifications</label>
          <input
            type="checkbox"
            checked={user.preferences?.notifications ?? true}
            onChange={(e) => {
              const preferences = user.preferences || { theme: 'light', notifications: true };
              setCell('users', userId, 'preferences', {
                ...preferences,
                notifications: e.target.checked,
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
```

### 数据指标和计算

```typescript
// src/hooks/useMetrics.ts
import { useMemo } from 'react';
import { useTable } from 'tinybase/react';
import { getStore } from '@/store/store';
import type { TablesSchema } from '@/store/schema';

export function useTodoMetrics() {
  const todos = useTable('todos', getStore());

  return useMemo(() => {
    const todoArray = Object.values(todos || {}) as TablesSchema['todos'][];

    const total = todoArray.length;
    const completed = todoArray.filter((t) => t.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    const priorityCounts = {
      low: todoArray.filter((t) => t.priority === 'low').length,
      medium: todoArray.filter((t) => t.priority === 'medium').length,
      high: todoArray.filter((t) => t.priority === 'high').length,
    };

    const recentTodos = todoArray
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    return {
      total,
      completed,
      pending,
      completionRate,
      priorityCounts,
      recentTodos,
    };
  }, [todos]);
}

// 使用示例
function Dashboard() {
  const metrics = useTodoMetrics();

  return (
    <div className="dashboard">
      <div className="metric-card">
        <h3>Total Todos</h3>
        <p className="metric-value">{metrics.total}</p>
      </div>

      <div className="metric-card">
        <h3>Completion Rate</h3>
        <p className="metric-value">{metrics.completionRate.toFixed(1)}%</p>
      </div>

      <div className="metric-card">
        <h3>By Priority</h3>
        <div className="priority-bars">
          <div className="bar high" style={{ width: `${(metrics.priorityCounts.high / metrics.total) * 100}%` }}>
            High: {metrics.priorityCounts.high}
          </div>
          <div className="bar medium" style={{ width: `${(metrics.priorityCounts.medium / metrics.total) * 100}%` }}>
            Medium: {metrics.priorityCounts.medium}
          </div>
          <div className="bar low" style={{ width: `${(metrics.priorityCounts.low / metrics.total) * 100}%` }}>
            Low: {metrics.priorityCounts.low}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 持久化配置

```typescript
// src/store/persisters/indexedDB.ts
import { createIndexedDBPersister } from 'tinybase/persisters/persister-indexed-db';
import type { Store } from 'tinybase';

export async function setupIndexedDBPersister(
  store: Store,
  dbName: string = 'app-db'
) {
  const persister = createIndexedDBPersister(store, dbName);

  // 加载持久化数据
  await persister.load();

  // 启动自动保存
  persister.startAutoSave();

  return persister;
}

// SQLite 持久化（用于 Electron/React Native）
// src/store/persisters/sqlite.ts
import { createSqlitePersister } from 'tinybase/persisters/persister-sqlite3';
import type { Store } from 'tinybase';

export async function setupSQLitePersister(
  store: Store,
  dbPath: string
) {
  const sqlite3 = require('sqlite3');
  const db = new sqlite3.Database(dbPath);

  const persister = createSqlitePersister(store, db, 'tinybase');

  await persister.load();
  persister.startAutoSave();

  return persister;
}
```

### 数据同步

```typescript
// src/store/synchronizers/websocket.ts
import { createWebSocketSynchronizer } from 'tinybase/synchronizers/synchronizer-ws-client';
import type { Store } from 'tinybase';

export async function setupWebSocketSync(
  store: Store,
  url: string
) {
  const synchronizer = createWebSocketSynchronizer(store, url);

  // 监听同步状态
  synchronizer.addStatusListener((status) => {
    console.log('Sync status:', status);
  });

  // 开始同步
  await synchronizer.startSync();

  return synchronizer;
}

// 自定义同步策略
export async function setupCustomSync(
  store: Store,
  serverUrl: string
) {
  const synchronizer = createWebSocketSynchronizer(store, serverUrl, {
    // 同步间隔（毫秒）
    syncInterval: 5000,
    
    // 重连配置
    retryInterval: 3000,
    maxRetries: 5,
    
    // 冲突解决
    conflictResolution: 'server-wins', // or 'client-wins', 'merge'
  });

  await synchronizer.startSync();

  return synchronizer;
}
```

### 查询和过滤

```typescript
// src/utils/store-helpers.ts
import { getStore } from '@/store/store';

export function queryTodos(filters: {
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  search?: string;
}) {
  const store = getStore();
  const todos = store.getTable('todos');

  return Object.entries(todos)
    .filter(([id, todo]) => {
      if (filters.completed !== undefined && todo.completed !== filters.completed) {
        return false;
      }
      if (filters.priority && todo.priority !== filters.priority) {
        return false;
      }
      if (filters.search && !todo.text.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      return true;
    })
    .map(([id, todo]) => ({ id, ...todo }));
}

export function sortTodos(
  todos: Array<{ id: string; createdAt: number; priority: string }>,
  sortBy: 'date' | 'priority'
) {
  return [...todos].sort((a, b) => {
    if (sortBy === 'date') {
      return b.createdAt - a.createdAt;
    }
    
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
```

## 最佳实践

### 1. 数据建模

```typescript
// ✅ 推荐：规范化数据结构
interface TablesSchema {
  todos: { id: string; text: string; userId: string };
  users: { id: string; name: string };
  comments: { id: string; todoId: string; userId: string; text: string };
}

// ❌ 避免：嵌套过深的数据
interface BadSchema {
  todos: {
    id: string;
    user: {
      profile: {
        name: string;
        avatar: string;
      };
    };
  };
}
```

### 2. 性能优化

```typescript
// ✅ 使用细粒度订阅
const text = useCell('todos', todoId, 'text', getStore());

// ❌ 避免订阅整个表
const todos = useTable('todos', getStore());
const text = todos[todoId]?.text;
```

### 3. 批量更新

```typescript
// ✅ 事务性更新
store.transaction(() => {
  store.setCell('todos', todoId, 'completed', true);
  store.setCell('todos', todoId, 'updatedAt', Date.now());
  store.setValue('lastUpdate', Date.now());
});

// ❌ 避免多次单独更新
store.setCell('todos', todoId, 'completed', true);
store.setCell('todos', todoId, 'updatedAt', Date.now());
```

### 4. 类型安全

```typescript
// ✅ 使用类型守卫
function isValidPriority(priority: any): priority is 'low' | 'medium' | 'high' {
  return ['low', 'medium', 'high'].includes(priority);
}

const priority = userPriorityInput;
if (isValidPriority(priority)) {
  setCell('todos', todoId, 'priority', priority);
}
```

## 常用命令

```bash
# 安装依赖
npm install tinybase

# 持久化适配器
npm install idb                # IndexedDB
npm install sqlite3            # SQLite

# 开发依赖
npm install -D @types/node

# 开发服务器
npm run dev

# 生产构建
npm run build

# 运行测试
npm run test

# 类型检查
npm run type-check
```

## 测试

```typescript
// src/__tests__/store.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createStore } from 'tinybase';

describe('TinyBase Store', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  afterEach(() => {
    store.delTables();
    store.delValues();
  });

  it('should set and get cell values', () => {
    store.setCell('todos', 'todo-1', 'text', 'Test todo');
    
    expect(store.getCell('todos', 'todo-1', 'text')).toBe('Test todo');
  });

  it('should handle row operations', () => {
    store.addRow('todos', { text: 'New todo', completed: false });
    
    const todos = store.getTable('todos');
    expect(Object.keys(todos)).toHaveLength(1);
  });

  it('should support transactions', () => {
    store.transaction(() => {
      store.setCell('todos', 'todo-1', 'text', 'Todo 1');
      store.setCell('todos', 'todo-2', 'text', 'Todo 2');
    });

    expect(store.getTable('todos')).toHaveLength(2);
  });

  it('should listen to changes', () => {
    const listener = jest.fn();
    store.addCellListener('todos', null, 'text', listener);

    store.setCell('todos', 'todo-1', 'text', 'Test');

    expect(listener).toHaveBeenCalled();
  });
});
```

## 部署配置

### Vercel 部署

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
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

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

## 调试工具

```typescript
// src/utils/debug.ts
import { getStore } from '@/store/store';

export function enableDebugMode() {
  const store = getStore();

  // 监听所有变化
  store.addTablesListener(() => {
    console.log('Tables changed:', store.getTables());
  });

  store.addValuesListener(() => {
    console.log('Values changed:', store.getValues());
  });

  // 导出调试函数到全局
  if (typeof window !== 'undefined') {
    (window as any).tinybase = {
      store,
      getTables: () => store.getTables(),
      getValues: () => store.getValues(),
      reset: () => {
        store.delTables();
        store.delValues();
      },
    };
  }
}

// 在浏览器控制台使用
// tinybase.getTables()
// tinybase.reset()
```

## 参考资源

- [TinyBase 官方文档](https://tinybase.org/)
- [TinyBase GitHub](https://github.com/tinyplex/tinybase)
- [React 集成指南](https://tinybase.org/guides/react/)
- [持久化文档](https://tinybase.org/guides/persistence/)
- [同步指南](https://tinybase.org/guides/synchronization/)
