# Immer 模板

不可变状态管理库，通过"草稿"机制简化不可变数据操作。

## 技术栈

- **核心**: Immer
- **运行时**: Node.js / 浏览器 / React Native
- **框架集成**: React / Redux / Zustand
- **工具**: TypeScript / ES6+
- **测试**: Vitest / Jest

## 项目结构

```
immer-app/
├── src/
│   ├── store/               # 状态管理
│   │   ├── user-store.ts
│   │   ├── cart-store.ts
│   │   └── settings-store.ts
│   ├── reducers/            # Reducers（用于 Redux）
│   │   ├── todos-reducer.ts
│   │   └── auth-reducer.ts
│   ├── hooks/               # React Hooks
│   │   ├── use-immer.ts
│   │   └── use-immer-reducer.ts
│   ├── utils/               # 工具函数
│   │   ├── produce-utils.ts
│   │   └── patch-utils.ts
│   └── types/
│       └── state.ts
├── tests/
│   └── store/
├── immer.config.ts
└── package.json
```

## 代码模式

### 基础用法

```typescript
import { produce } from 'immer';

interface State {
  readonly users: readonly string[];
  readonly count: number;
}

const baseState: State = {
  users: ['Alice', 'Bob'],
  count: 0,
};

// 使用 produce 创建新状态
const nextState = produce(baseState, (draft) => {
  // 在草稿上直接修改
  draft.users.push('Charlie');
  draft.count += 1;
});

console.log(baseState.users); // ['Alice', 'Bob'] - 未改变
console.log(nextState.users); // ['Alice', 'Bob', 'Charlie']
console.log(baseState === nextState); // false
```

### React Hooks

```typescript
import { useImmer } from 'use-immer';

interface User {
  name: string;
  age: number;
}

function UserProfile() {
  const [user, updateUser] = useImmer<User>({
    name: 'Alice',
    age: 25,
  });

  const updateName = (name: string) => {
    updateUser((draft) => {
      draft.name = name;
    });
  };

  const incrementAge = () => {
    updateUser((draft) => {
      draft.age += 1;
    });
  };

  return (
    <div>
      <p>Name: {user.name}</p>
      <p>Age: {user.age}</p>
      <button onClick={() => updateName('Bob')}>Change Name</button>
      <button onClick={incrementAge}>Increment Age</button>
    </div>
  );
}
```

### useImmerReducer

```typescript
import { useImmerReducer } from 'use-immer';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type Action =
  | { type: 'ADD'; text: string }
  | { type: 'TOGGLE'; id: number }
  | { type: 'DELETE'; id: number };

function todosReducer(draft: Todo[], action: Action) {
  switch (action.type) {
    case 'ADD':
      draft.push({
        id: Date.now(),
        text: action.text,
        completed: false,
      });
      break;
    case 'TOGGLE':
      const todo = draft.find((t) => t.id === action.id);
      if (todo) todo.completed = !todo.completed;
      break;
    case 'DELETE':
      const index = draft.findIndex((t) => t.id === action.id);
      if (index !== -1) draft.splice(index, 1);
      break;
  }
}

function TodoList() {
  const [todos, dispatch] = useImmerReducer(todosReducer, []);

  return (
    <div>
      <button onClick={() => dispatch({ type: 'ADD', text: 'New Todo' })}>
        Add Todo
      </button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <span
              style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
              onClick={() => dispatch({ type: 'TOGGLE', id: todo.id })}
            >
              {todo.text}
            </span>
            <button onClick={() => dispatch({ type: 'DELETE', id: todo.id })}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Redux 集成

```typescript
import { produce } from 'immer';
import { createSlice, configureStore } from '@reduxjs/toolkit';

// Redux Toolkit 内部已使用 Immer
const todosSlice = createSlice({
  name: 'todos',
  initialState: [] as Todo[],
  reducers: {
    addTodo: (state, action) => {
      // 可以直接修改 state
      state.push({
        id: Date.now(),
        text: action.payload,
        completed: false,
      });
    },
    toggleTodo: (state, action) => {
      const todo = state.find((t) => t.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    removeTodo: (state, action) => {
      return state.filter((t) => t.id !== action.payload);
    },
  },
});

const store = configureStore({
  reducer: {
    todos: todosSlice.reducer,
  },
});
```

### Zustand 集成

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface StoreState {
  users: User[];
  count: number;
  addUser: (user: User) => void;
  removeUser: (id: string) => void;
  increment: () => void;
}

const useStore = create<StoreState>()(
  immer((set) => ({
    users: [],
    count: 0,
    addUser: (user) =>
      set((state) => {
        state.users.push(user);
      }),
    removeUser: (id) =>
      set((state) => {
        const index = state.users.findIndex((u) => u.id === id);
        if (index !== -1) state.users.splice(index, 1);
      }),
    increment: () =>
      set((state) => {
        state.count += 1;
      }),
  }))
);
```

### 嵌套对象更新

```typescript
import { produce } from 'immer';

interface DeepState {
  nested: {
    deep: {
      value: number;
      items: string[];
    };
  };
}

const state: DeepState = {
  nested: {
    deep: {
      value: 0,
      items: ['a', 'b'],
    },
  },
};

const nextState = produce(state, (draft) => {
  // 直接修改深层嵌套对象
  draft.nested.deep.value += 1;
  draft.nested.deep.items.push('c');
});
```

### 数组操作

```typescript
import { produce } from 'immer';

interface State {
  items: Array<{ id: string; value: number }>;
}

const state: State = {
  items: [
    { id: '1', value: 10 },
    { id: '2', value: 20 },
  ],
};

const nextState = produce(state, (draft) => {
  // 添加元素
  draft.items.push({ id: '3', value: 30 });

  // 删除元素
  draft.items.splice(0, 1);

  // 更新元素
  const item = draft.items.find((i) => i.id === '2');
  if (item) item.value += 5;

  // 过滤
  draft.items = draft.items.filter((i) => i.value > 15);
});
```

### Map 和 Set

```typescript
import { produce } from 'immer';

interface State {
  userMap: Map<string, User>;
  idSet: Set<string>;
}

const state: State = {
  userMap: new Map([['1', { id: '1', name: 'Alice' }]]),
  idSet: new Set(['1', '2']),
};

const nextState = produce(state, (draft) => {
  // Map 操作
  draft.userMap.set('2', { id: '2', name: 'Bob' });
  draft.userMap.delete('1');

  // Set 操作
  draft.idSet.add('3');
  draft.idSet.delete('1');
});
```

### Patches（补丁记录）

```typescript
import { produceWithPatches, applyPatches, enablePatches } from 'immer';

// 启用 patches
enablePatches();

interface State {
  value: number;
}

const state: State = { value: 0 };

// 生成补丁
const [nextState, patches, inversePatches] = produceWithPatches(state, (draft) => {
  draft.value += 1;
});

console.log(patches);
// [{ op: 'replace', path: ['value'], value: 1 }]

// 应用补丁
const restored = applyPatches(state, patches);

// 撤销（应用反向补丁）
const undone = applyPatches(nextState, inversePatches);
```

### 当前状态快照

```typescript
import { produce, current } from 'immer';

interface State {
  items: string[];
  logs: string[];
}

const state: State = {
  items: ['a', 'b'],
  logs: [],
};

const nextState = produce(state, (draft) => {
  // 获取当前草稿的快照
  const snapshot = current(draft.items);
  draft.logs.push(`Items: ${snapshot.join(', ')}`);

  draft.items.push('c');
});
```

## 最佳实践

### 1. 类型安全

```typescript
import { produce } from 'immer';

interface State {
  readonly users: readonly User[];
  readonly count: number;
}

const nextState = produce(state: State, (draft) => {
  // draft 自动推断为可写类型
  draft.users.push({ id: '3', name: 'Charlie' });
  draft.count += 1;
});
```

### 2. 性能优化

```typescript
import { produce } from 'immer';

// 使用 recipe 函数重用
const updateValue = (value: number) =>
  produce((draft: State) => {
    draft.value = value;
  });

const state1 = updateValue(10)(baseState);
const state2 = updateValue(20)(baseState);
```

### 3. 异步操作

```typescript
import { produce } from 'immer';

async function fetchAndUpdate(state: State) {
  const data = await fetchData();

  return produce(state, (draft) => {
    draft.data = data;
    draft.lastUpdated = Date.now();
  });
}
```

### 4. 冻结状态

```typescript
import { setAutoFreeze, freeze } from 'immer';

// 全局启用冻结（开发环境）
if (process.env.NODE_ENV === 'development') {
  setAutoFreeze(true);
}

// 手动冻结对象
const frozenState = freeze(state);
```

### 5. 原始类型处理

```typescript
import { isDraft, original, Draft } from 'immer';

const nextState = produce(state, (draft) => {
  // 检查是否为草稿
  if (isDraft(draft.user)) {
    // 获取原始对象
    const originalUser = original(draft.user);
    console.log('Original:', originalUser);
  }
});
```

## 常用命令

```bash
# 安装
npm install immer

# React hooks
npm install use-immer

# Redux Toolkit（内置 Immer）
npm install @reduxjs/toolkit

# Zustand（带 Immer 中间件）
npm install zustand

# 运行开发服务器
npm run dev

# 测试
npm test

# 类型检查
npm run type-check
```

## 部署配置

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### 环境变量

```bash
# .env.example
NODE_ENV=production
IMMER_AUTO_FREEZE=true
```

## 常见问题

### 避免返回值

```typescript
// ❌ 错误：不要返回
const nextState = produce(state, (draft) => {
  return { ...draft, count: 1 };
});

// ✅ 正确：直接修改
const nextState = produce(state, (draft) => {
  draft.count = 1;
});
```

### 处理只读类型

```typescript
import { produce, Draft } from 'immer';

interface ReadonlyState {
  readonly items: readonly string[];
}

const nextState = produce(state as ReadonlyState, (draft: Draft<ReadonlyState>) => {
  draft.items.push('new item');
});
```

### 性能优化技巧

```typescript
import { produce } from 'immer';

// 大数组优化
const nextState = produce(state, (draft) => {
  // 批量操作
  draft.largeArray = draft.largeArray.filter(item => item.active);
  
  // 避免频繁操作
  // ❌ draft.items.push(...Array(10000));
  // ✅ draft.items = [...draft.items, ...Array(10000)];
});
```

### 调试技巧

```typescript
import { produce, isDraft } from 'immer';

const nextState = produce(state, (draft) => {
  console.log('Is draft:', isDraft(draft));
  console.log('Current state:', current(draft));
  
  draft.value += 1;
});
```

## 相关资源

- [Immer 官方文档](https://immerjs.github.io/immer/)
- [Immer GitHub](https://github.com/immerjs/immer)
- [Redux Toolkit 文档](https://redux-toolkit.js.org/)
- [Zustand 文档](https://github.com/pmndrs/zustand)
