# Zustand Devtools Template

## Tech Stack
- zustand v4.x
- React 18+
- TypeScript 5+

## Core Patterns

### Store with Devtools
```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface TodoState {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
}

export const useTodoStore = create<TodoState>()(
  devtools(
    persist(
      (set) => ({
        todos: [],
        addTodo: (text) =>
          set(
            (state) => ({
              todos: [...state.todos, { id: Date.now().toString(), text, done: false }],
            }),
            false,
            'addTodo'
          ),
        toggleTodo: (id) =>
          set(
            (state) => ({
              todos: state.todos.map((t) =>
                t.id === id ? { ...t, done: !t.done } : t
              ),
            }),
            false,
            'toggleTodo'
          ),
      }),
      { name: 'todo-storage' }
    ),
    { name: 'TodoStore' }
  )
);
```

### Redux DevTools Integration
```typescript
import { devtools } from 'zustand/middleware';

export const useStore = create(
  devtools(
    (set) => ({
      bears: 0,
      increase: () => set((state) => ({ bears: state.bears + 1 }), false, 'increase'),
    }),
    {
      name: 'BearStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
```

### Logger Middleware
```typescript
const log = (config) => (set, get, api) =>
  config(
    (...args) => {
      console.log('prev state:', get());
      set(...args);
      console.log('next state:', get());
    },
    get,
    api
  );

export const useStore = create(log(store));
```

## Common Commands

```bash
npm install zustand
npm run dev
```

## Related Resources
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Devtools Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)
