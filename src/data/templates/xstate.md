# XState 模板

JavaScript 和 TypeScript 的状态机和状态图库，用于管理复杂应用状态。

## 技术栈

- **核心**: XState v5
- **运行时**: Node.js / 浏览器 / React Native
- **框架集成**: React / Vue / Svelte
- **测试**: @xstate/test
- **工具**: Stately AI (可视化编辑器)

## 项目结构

```
xstate-app/
├── src/
│   ├── machines/            # 状态机定义
│   │   ├── auth-machine.ts
│   │   ├── form-machine.ts
│   │   ├── data-machine.ts
│   │   └── wizard-machine.ts
│   ├── actors/              # Actor 定义
│   │   ├── api-actor.ts
│   │   └── timer-actor.ts
│   ├── guards/              # 守卫函数
│   │   └── validation.ts
│   ├── actions/             # 动作函数
│   │   └── side-effects.ts
│   ├── services/            # 服务集成
│   │   └── external-api.ts
│   ├── hooks/               # React Hooks
│   │   └── use-machine.ts
│   └── utils/
│       └── helpers.ts
├── tests/
│   └── machines/
├── xstate.config.ts
└── package.json
```

## 代码模式

### 基础状态机

```typescript
import { setup, createActor } from 'xstate';

// 定义状态机
const toggleMachine = setup({
  types: {
    context: {} as { count: number },
    events: {} as { type: 'TOGGLE' } | { type: 'RESET' },
  },
  actions: {
    increment: ({ context }) => ({ count: context.count + 1 }),
  },
}).createMachine({
  id: 'toggle',
  initial: 'inactive',
  context: { count: 0 },
  states: {
    inactive: {
      on: {
        TOGGLE: {
          target: 'active',
          actions: ['increment'],
        },
      },
    },
    active: {
      on: {
        TOGGLE: 'inactive',
        RESET: {
          target: 'inactive',
          actions: assign({ count: 0 }),
        },
      },
    },
  },
});

// 使用状态机
const actor = createActor(toggleMachine);
actor.start();

actor.subscribe((snapshot) => {
  console.log(snapshot.value, snapshot.context);
});

actor.send({ type: 'TOGGLE' });
```

### React 集成

```typescript
import { useMachine } from '@xstate/react';
import { authMachine } from './machines/auth-machine';

function AuthComponent() {
  const [state, send] = useMachine(authMachine);

  return (
    <div>
      {state.matches('idle') && (
        <button onClick={() => send({ type: 'LOGIN', username: 'user', password: 'pass' })}>
          登录
        </button>
      )}

      {state.matches('authenticating') && <div>登录中...</div>}

      {state.matches('success') && <div>欢迎, {state.context.user.name}</div>}

      {state.matches('failure') && (
        <div>
          登录失败: {state.context.error}
          <button onClick={() => send({ type: 'RETRY' })}>重试</button>
        </div>
      )}
    </div>
  );
}
```

### 异步服务

```typescript
import { setup, fromPromise } from 'xstate';

const fetchUser = fromPromise(async ({ input }: { input: { userId: string } }) => {
  const response = await fetch(`/api/users/${input.userId}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
});

const userMachine = setup({
  actors: { fetchUser },
}).createMachine({
  id: 'user',
  initial: 'idle',
  context: { userId: '123', user: null, error: null },
  states: {
    idle: {
      on: { FETCH: 'loading' },
    },
    loading: {
      invoke: {
        src: 'fetchUser',
        input: ({ context }) => ({ userId: context.userId }),
        onDone: {
          target: 'success',
          actions: assign({ user: ({ event }) => event.output }),
        },
        onError: {
          target: 'failure',
          actions: assign({ error: ({ event }) => event.error }),
        },
      },
    },
    success: {
      on: { REFRESH: 'loading' },
    },
    failure: {
      on: { RETRY: 'loading' },
    },
  },
});
```

### 守卫（Guards）

```typescript
import { setup } from 'xstate';

const formMachine = setup({
  types: {
    context: {} as {
      email: string;
      password: string;
      errors: string[];
    },
    events: {} as
      | { type: 'EMAIL_CHANGE'; value: string }
      | { type: 'PASSWORD_CHANGE'; value: string }
      | { type: 'SUBMIT' },
  },
  guards: {
    isValidEmail: ({ context }) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(context.email);
    },
    isValidPassword: ({ context }) => {
      return context.password.length >= 8;
    },
    canSubmit: ({ context }) => {
      return context.email && context.password && context.errors.length === 0;
    },
  },
}).createMachine({
  id: 'form',
  initial: 'editing',
  context: { email: '', password: '', errors: [] },
  states: {
    editing: {
      on: {
        EMAIL_CHANGE: {
          actions: assign({ email: ({ event }) => event.value }),
        },
        PASSWORD_CHANGE: {
          actions: assign({ password: ({ event }) => event.value }),
        },
        SUBMIT: {
          guard: 'canSubmit',
          target: 'submitting',
        },
      },
    },
    submitting: {
      // 提交逻辑
    },
  },
});
```

### 层次状态（Nested States）

```typescript
import { setup } from 'xstate';

const wizardMachine = setup({}).createMachine({
  id: 'wizard',
  initial: 'step1',
  states: {
    step1: {
      initial: 'editing',
      states: {
        editing: {
          on: { NEXT: 'validating' },
        },
        validating: {
          on: {
            VALID: 'wizard.step2',
            INVALID: 'editing',
          },
        },
      },
    },
    step2: {
      on: { NEXT: 'step3', BACK: 'step1' },
    },
    step3: {
      on: { SUBMIT: 'complete', BACK: 'step2' },
    },
    complete: {
      type: 'final',
    },
  },
});
```

### 并行状态（Parallel States）

```typescript
import { setup } from 'xstate';

const uploadMachine = setup({}).createMachine({
  id: 'upload',
  type: 'parallel',
  states: {
    upload: {
      initial: 'idle',
      states: {
        idle: {
          on: { START: 'uploading' },
        },
        uploading: {
          on: { COMPLETE: 'completed' },
        },
        completed: {
          type: 'final',
        },
      },
    },
    validation: {
      initial: 'pending',
      states: {
        pending: {
          on: { VALIDATE: 'validating' },
        },
        validating: {
          on: {
            VALID: 'valid',
            INVALID: 'invalid',
          },
        },
        valid: {},
        invalid: {},
      },
    },
  },
});
```

### 历史状态（History States）

```typescript
import { setup } from 'xstate';

const playerMachine = setup({}).createMachine({
  id: 'player',
  initial: 'stopped',
  states: {
    stopped: {
      on: { PLAY: 'playing' },
    },
    playing: {
      on: {
        PAUSE: 'paused',
        STOP: 'stopped',
      },
    },
    paused: {
      on: {
        PLAY: 'playing',
        RESUME: 'playing.history',
      },
    },
    playing: {
      states: {
        song1: {},
        song2: {},
      },
      history: 'deep', // 深度历史状态
    },
  },
});
```

### 动作和副作用

```typescript
import { setup, assign } from 'xstate';

const counterMachine = setup({
  actions: {
    increment: assign({
      count: ({ context }) => context.count + 1,
    }),
    log: ({ context, event }) => {
      console.log('Context:', context);
      console.log('Event:', event);
    },
    notifyParent: ({ sendParent }) => {
      sendParent({ type: 'CHILD_UPDATED' });
    },
  },
}).createMachine({
  id: 'counter',
  context: { count: 0 },
  initial: 'active',
  states: {
    active: {
      on: {
        INCREMENT: {
          actions: ['increment', 'log', 'notifyParent'],
        },
      },
    },
  },
});
```

## 最佳实践

### 1. 类型安全

```typescript
import { setup } from 'xstate';

const machine = setup({
  types: {
    context: {} as {
      user: { id: string; name: string } | null;
      error: string | null;
    },
    events: {} as
      | { type: 'FETCH'; userId: string }
      | { type: 'RETRY' }
      | { type: 'RESET' },
  },
}).createMachine({
  // 完全类型安全
});
```

### 2. 测试

```typescript
import { createActor } from 'xstate';
import { expect } from 'vitest';
import { authMachine } from './auth-machine';

test('login flow', async () => {
  const actor = createActor(authMachine);
  actor.start();

  // 发送登录事件
  actor.send({ type: 'LOGIN', username: 'user', password: 'pass' });

  // 等待状态变化
  await waitFor(actor, (state) => state.matches('success'));

  expect(actor.getSnapshot().context.user).toBeDefined();
});
```

### 3. 持久化

```typescript
import { createActor, getState, setState } from 'xstate';

// 保存状态
const state = actor.getSnapshot();
localStorage.setItem('machine-state', JSON.stringify(state));

// 恢复状态
const persistedState = JSON.parse(localStorage.getItem('machine-state'));
const actor = createActor(machine, { state: persistedState });
actor.start();
```

### 4. 可视化调试

```typescript
import { createActor, inspect } from 'xstate';

// 启用检查
inspect({
  iframe: false, // 在控制台输出
});

const actor = createActor(machine, {
  inspect: (inspectionEvent) => {
    console.log(inspectionEvent);
  },
});
```

### 5. Actor 通信

```typescript
import { setup, createActor, fromChild } from 'xstate';

const parentMachine = setup({
  actors: {
    child: childMachine,
  },
}).createMachine({
  id: 'parent',
  initial: 'active',
  states: {
    active: {
      invoke: {
        src: 'child',
        id: 'childActor',
        onDone: 'complete',
      },
      on: {
        CHILD_EVENT: {
          actions: ({ event }) => console.log('From child:', event),
        },
      },
    },
    complete: {},
  },
});
```

## 常用命令

```bash
# 安装
npm install xstate

# React 集成
npm install @xstate/react

# Vue 集成
npm install @xstate/vue

# 测试工具
npm install @xstate/test

# 运行开发服务器
npm run dev

# 测试
npm test

# 生成可视化
npx @statelyai/agent generate ./src/machines
```

## 部署配置

### 环境变量

```bash
# .env.example
XSTATE_INSPECT=true
```

### 测试配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
```

## 常见问题

### 状态持久化

```typescript
// 使用 Zustand 或其他状态管理库同步
import { create } from 'zustand';

const useStore = create((set) => ({
  machineState: null,
  setMachineState: (state) => set({ machineState: state }),
}));

// 在 actor 订阅中同步
actor.subscribe((snapshot) => {
  useStore.getState().setMachineState(snapshot);
});
```

### 性能优化

```typescript
import { createSelector } from '@xstate/react';

// 使用选择器避免不必要的重渲染
const userName = createSelector(
  (state) => state.context.user?.name
);

function Component() {
  const name = useSelector(actor, userName);
  return <div>{name}</div>;
}
```

### 调试技巧

```typescript
import { createActor, toObserver } from 'xstate';

const actor = createActor(machine);

actor.subscribe(
  toObserver({
    next: (snapshot) => console.log('State:', snapshot.value),
    error: (error) => console.error('Error:', error),
    complete: () => console.log('Complete'),
  })
);
```

## 相关资源

- [XState 官方文档](https://stately.ai/docs/xstate)
- [XState v5 迁移指南](https://stately.ai/docs/xstate-v5)
- [Stately AI 可视化编辑器](https://stately.ai/editor)
- [示例代码库](https://github.com/statelyai/xstate/tree/main/examples)
