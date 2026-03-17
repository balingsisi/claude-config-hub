# Effector State Management Template

## Tech Stack
- effector v23.x
- effector-react v23.x
- React 18+
- TypeScript 5+

## Core Patterns

### Store and Events
```typescript
import { createEvent, createStore, createEffect, sample } from 'effector';

// Events
export const addTodo = createEvent<string>();
export const toggleTodo = createEvent<number>();
export const deleteTodo = createEvent<number>();

// Effect
export const fetchTodosFx = createEffect(async () => {
  const response = await fetch('/api/todos');
  return response.json();
});

// Store
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export const $todos = createStore<Todo[]>([])
  .on(addTodo, (todos, text) => [...todos, { id: Date.now(), text, completed: false }])
  .on(toggleTodo, (todos, id) =>
    todos.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
  )
  .on(deleteTodo, (todos, id) => todos.filter(t => t.id !== id))
  .on(fetchTodosFx.doneData, (_, todos) => todos);

// Computed store
export const $activeTodos = $todos.map(todos => todos.filter(t => !t.completed));
export const $completedTodos = $todos.map(todos => todos.filter(t => t.completed));
```

### React Integration
```typescript
import { useUnit } from 'effector-react';
import { $todos, addTodo, toggleTodo, deleteTodo } from './model';

export const TodoList: React.FC = () => {
  const [todos, handleAdd, handleToggle, handleDelete] = useUnit([
    $todos,
    addTodo,
    toggleTodo,
    deleteTodo,
  ]);

  return (
    <div>
      <button onClick={() => handleAdd('New todo')}>Add</button>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <span onClick={() => handleToggle(todo.id)}>
              {todo.completed ? '✓' : '○'} {todo.text}
            </span>
            <button onClick={() => handleDelete(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

## Common Commands

```bash
npm install effector effector-react
npm run dev
```

## Related Resources
- [Effector Documentation](https://effector.dev/)
- [React Integration](https://effector.dev/docs/api/effector-react)
