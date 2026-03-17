# Overmind State Management

## Overview
Overmind is a powerful state management library for React, Vue, Angular, and Svelte. It provides a declarative approach to managing application state with built-in developer tools, TypeScript support, and effect isolation.

## When to Use
- Complex applications with large state trees
- Projects requiring strict separation of concerns
- Teams wanting excellent TypeScript support
- Applications with complex side effects and async operations
- Projects needing powerful debugging tools
- Multi-framework applications requiring shared state

## Key Concepts

### 1. Installation
```bash
# Core
npm install overmind

# Framework bindings
npm install overmind-react
# or
npm install overmind-vue
# or
npm install overmind-angular
# or
npm install overmind-svelte

# TypeScript support
npm install overmind @types/node
```

### 2. Basic Setup
```typescript
// state.ts
export type State = {
  count: number;
  user: {
    name: string;
    email: string;
  } | null;
  todos: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
  isLoading: boolean;
};

export const state: State = {
  count: 0,
  user: null,
  todos: [],
  isLoading: false,
};

// actions.ts
import { Action } from 'overmind';

export const increment: Action = ({ state }) => {
  state.count++;
};

export const decrement: Action = ({ state }) => {
  state.count--;
};

export const setUser: Action<{ name: string; email: string }> = 
  ({ state }, user) => {
    state.user = user;
  };

export const addTodo: Action<string> = ({ state }, text) => {
  state.todos.push({
    id: Date.now().toString(),
    text,
    completed: false,
  });
};

export const toggleTodo: Action<string> = ({ state }, id) => {
  const todo = state.todos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
  }
};

// index.ts
import { createOvermind } from 'overmind';
import { state } from './state';
import * as actions from './actions';
import * as effects from './effects';

export const overmind = createOvermind({
  state,
  actions,
  effects,
}, {
  devtools: true, // Enable devtools
  name: 'my-app',
});
```

### 3. React Integration
```tsx
import React from 'react';
import { createOvermind } from 'overmind';
import { Provider, useOvermind } from 'overmind-react';
import { overmind } from './overmind';

const App: React.FC = () => {
  return (
    <Provider value={overmind}>
      <Counter />
      <TodoList />
    </Provider>
  );
};

// Functional component with hooks
const Counter: React.FC = () => {
  const { state, actions } = useOvermind();
  
  return (
    <div>
      <h2>Count: {state.count}</h2>
      <button onClick={actions.increment}>+</button>
      <button onClick={actions.decrement}>-</button>
    </div>
  );
};

// Component with computed values
const CompletedTodos: React.FC = () => {
  const { state } = useOvermind();
  
  const completedCount = state.todos.filter(t => t.completed).length;
  
  return (
    <div>
      Completed: {completedCount} / {state.todos.length}
    </div>
  );
};
```

### 4. Effects for Side Effects
```typescript
// effects.ts
import { Effect } from 'overmind';

export const api: Effect = {
  async fetchUser(id: string) {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },
  
  async saveTodo(todo: { text: string }) {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    });
    return response.json();
  },
};

// Using effects in actions
export const fetchUser: Action<string> = async ({ state, effects }, id) => {
  state.isLoading = true;
  try {
    const user = await effects.api.fetchUser(id);
    state.user = user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
  } finally {
    state.isLoading = false;
  }
};
```

### 5. Operators for Data Transformation
```typescript
import { Operator, map, filter, forEach } from 'overmind';

// Map operator
export const transformData: Operator<string, number> = map((_, value) => 
  parseInt(value, 10)
);

// Filter operator
export const filterActiveTodos: Operator<string[]> = filter(
  ({ state }, ids) => {
    return ids.filter(id => 
      state.todos.find(t => t.id === id && !t.completed)
    );
  }
);

// ForEach operator
export const processTodos: Operator<string[]> = forEach(
  ({ actions }, id) => {
    actions.toggleTodo(id);
  }
);

// Composing operators
import { pipe } from 'overmind';

export const complexAction: Action<string[]> = pipe(
  filterActiveTodos,
  processTodos,
  map(({ state }) => state.todos.length)
);
```

### 6. Computed Values
```typescript
// Using computed
import { computed } from 'overmind';

export const state = {
  todos: [] as Array<{ id: string; text: string; completed: boolean }>,
  
  // Computed values
  completedTodos: computed((state) => 
    state.todos.filter(t => t.completed)
  ),
  
  activeTodos: computed((state) => 
    state.todos.filter(t => !t.completed)
  ),
  
  todosCount: computed((state) => state.todos.length),
  
  completionPercentage: computed((state) => {
    if (state.todos.length === 0) return 0;
    return Math.round(
      (state.completedTodos.length / state.todos.length) * 100
    );
  }),
};
```

### 7. OnInitialize Hook
```typescript
// Initialize app with async data
export const onInitialize: Action = async ({ state, effects, actions }) => {
  // Restore session
  const token = localStorage.getItem('token');
  if (token) {
    state.isLoading = true;
    try {
      const user = await effects.api.getCurrentUser();
      state.user = user;
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      state.isLoading = false;
    }
  }
  
  // Load initial data
  await actions.loadTodos();
};

// Create Overmind with onInitialize
export const overmind = createOvermind({
  state,
  actions,
  effects,
  onInitialize,
});
```

### 8. Testing
```typescript
import { createOvermindMock } from 'overmind';
import { state } from './state';
import * as actions from './actions';
import * as effects from './effects';

describe('Todo Actions', () => {
  it('should add todo', () => {
    const overmind = createOvermindMock({
      state,
      actions,
      effects,
    });
    
    overmind.actions.addTodo('Test todo');
    
    expect(overmind.state.todos).toHaveLength(1);
    expect(overmind.state.todos[0].text).toBe('Test todo');
    expect(overmind.state.todos[0].completed).toBe(false);
  });
  
  it('should toggle todo', () => {
    const overmind = createOvermindMock({
      state: {
        ...state,
        todos: [{ id: '1', text: 'Test', completed: false }],
      },
      actions,
      effects,
    });
    
    overmind.actions.toggleTodo('1');
    
    expect(overmind.state.todos[0].completed).toBe(true);
  });
  
  it('should fetch user', async () => {
    const mockUser = { name: 'John', email: 'john@example.com' };
    
    const overmind = createOvermindMock({
      state,
      actions,
      effects: {
        ...effects,
        api: {
          fetchUser: jest.fn().mockResolvedValue(mockUser),
        },
      },
    });
    
    await overmind.actions.fetchUser('123');
    
    expect(overmind.state.user).toEqual(mockUser);
    expect(overmind.state.isLoading).toBe(false);
  });
});
```

### 9. Advanced Patterns
```typescript
// Derived state with dependencies
export const state = {
  users: [] as Array<{ id: string; name: string }>,
  selectedUserId: null as string | null,
  
  selectedUser: computed(
    (state) => state.users.find(u => u.id === state.selectedUserId)
  ),
  
  userTodos: computed(
    (state) => state.todos.filter(t => t.userId === state.selectedUserId)
  ),
};

// Async action with optimistic update
export const updateTodo: Action<{ id: string; text: string }> = 
  async ({ state, effects }, { id, text }) => {
    // Optimistic update
    const todo = state.todos.find(t => t.id === id);
    if (todo) {
      const previousText = todo.text;
      todo.text = text;
      
      try {
        await effects.api.updateTodo(id, text);
      } catch (error) {
        // Revert on error
        if (todo) todo.text = previousText;
        throw error;
      }
    }
  };

// State history (undo/redo)
import { createOvermind, IConfig } from 'overmind';

const config = {
  state,
  actions,
  effects,
};

export const overmind = createOvermind(config, {
  devtools: true,
  stateHistory: {
    enabled: true,
    limit: 50, // Keep last 50 states
  },
});

// Undo/Redo actions
export const undo: Action = ({ state }) => {
  // Access state history
};

export const redo: Action = ({ state }) => {
  // Access state history
};
```

### 10. Vue Integration
```vue
<template>
  <div>
    <h2>Count: {{ state.count }}</h2>
    <button @click="actions.increment">+</button>
    <button @click="actions.decrement">-</button>
  </div>
</template>

<script>
import { createOvermind } from 'overmind';
import { createPlugin } from 'overmind-vue';
import { overmind } from './overmind';

const OvermindPlugin = createPlugin(overmind);

export default {
  plugins: [OvermindPlugin],
  name: 'Counter',
};
</script>
```

### 11. DevTools
```typescript
// Enable devtools in development
export const overmind = createOvermind(config, {
  devtools: process.env.NODE_ENV === 'development' ? 'localhost:3031' : false,
  logProxies: true,
  name: 'my-app',
});

// Custom devtools actions
export const actions = {
  increment: ({ state, devtools }) => {
    state.count++;
    devtools.send('INCREMENT_CUSTOM', { value: state.count });
  },
};
```

## Best Practices

1. **Separate concerns** - Keep state, actions, and effects in separate files
2. **Use TypeScript** - Strong typing provides excellent DX and safety
3. **Keep actions focused** - One action, one responsibility
4. **Use effects for side effects** - Never call APIs directly in actions
5. **Leverage computed values** - For derived state
6. **Test actions and effects** - Use createOvermindMock for testing
7. **Use devtools** - Essential for debugging complex state

## Common Patterns

```typescript
// Pattern 1: Form handling
export const state = {
  form: {
    values: {} as Record<string, any>,
    errors: {} as Record<string, string>,
    touched: {} as Record<string, boolean>,
  },
};

export const actions = {
  setFieldValue: Action<{ field: string; value: any }> = 
    ({ state }, { field, value }) => {
      state.form.values[field] = value;
    },
  
  setFieldError: Action<{ field: string; error: string }> = 
    ({ state }, { field, error }) => {
      state.form.errors[field] = error;
    },
  
  submitForm: Action = async ({ state, effects, actions }) => {
    try {
      await effects.api.submitForm(state.form.values);
      actions.resetForm();
    } catch (error) {
      // Handle error
    }
  },
};

// Pattern 2: Pagination
export const state = {
  items: [],
  currentPage: 1,
  pageSize: 10,
  totalPages: computed((state) => 
    Math.ceil(state.items.length / state.pageSize)
  ),
  paginatedItems: computed((state) => {
    const start = (state.currentPage - 1) * state.pageSize;
    const end = start + state.pageSize;
    return state.items.slice(start, end);
  }),
};

// Pattern 3: Authentication
export const state = {
  user: null,
  token: null,
  isAuthenticated: computed((state) => !!state.token),
};

export const actions = {
  login: Action<{ email: string; password: string }> = 
    async ({ state, effects }, credentials) => {
      const { user, token } = await effects.api.login(credentials);
      state.user = user;
      state.token = token;
      localStorage.setItem('token', token);
    },
  
  logout: Action = ({ state }) => {
    state.user = null;
    state.token = null;
    localStorage.removeItem('token');
  },
};
```

## Performance Optimization

```typescript
// Lazy loading state
export const state = {
  heavyData: null,
  loaded: false,
};

export const loadHeavyData: Action = async ({ state, effects }) => {
  if (!state.loaded) {
    state.heavyData = await effects.api.fetchHeavyData();
    state.loaded = true;
  }
};

// Memoization with computed
export const state = {
  items: [],
  filteredItems: computed((state) => 
    state.items.filter(item => item.active) // Only recomputes when items change
  ),
};
```

## When to Choose Overmind

✅ **Good fit:**
- Complex applications with large state trees
- Projects requiring excellent TypeScript support
- Teams wanting powerful devtools
- Applications with complex async operations
- Multi-framework projects
- Projects needing strict separation of concerns

❌ **Not ideal:**
- Small, simple applications (use useState/useContext)
- Projects with minimal state management needs
- Teams unfamiliar with state management concepts
- Applications requiring minimal bundle size

## Alternatives

- **Redux** - More boilerplate, larger ecosystem
- **MobX** - Observable-based state management
- **Zustand** - Lightweight state management
- **Jotai/Recoil** - Atomic state management
- **XState** - State machines and workflows
