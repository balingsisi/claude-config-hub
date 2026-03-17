# MobX State Management Template

## Tech Stack
- mobx v6.x
- mobx-react-lite v4.x
- React 18+
- TypeScript 5+

## Core Patterns

### Observable Store
```typescript
import { makeAutoObservable } from 'mobx';

class TodoStore {
  todos: Todo[] = [];
  filter: 'all' | 'active' | 'completed' = 'all';

  constructor() {
    makeAutoObservable(this);
  }

  addTodo(text: string) {
    this.todos.push({
      id: Date.now(),
      text,
      completed: false,
    });
  }

  toggleTodo(id: number) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) todo.completed = !todo.completed;
  }

  get filteredTodos() {
    switch (this.filter) {
      case 'active':
        return this.todos.filter(t => !t.completed);
      case 'completed':
        return this.todos.filter(t => t.completed);
      default:
        return this.todos;
    }
  }
}

export const todoStore = new TodoStore();
```

### React Integration
```typescript
import { observer } from 'mobx-react-lite';
import { todoStore } from './stores/TodoStore';

export const TodoList = observer(() => {
  return (
    <ul>
      {todoStore.filteredTodos.map(todo => (
        <li key={todo.id} onClick={() => todoStore.toggleTodo(todo.id)}>
          {todo.text} - {todo.completed ? '✓' : '○'}
        </li>
      ))}
    </ul>
  );
});
```

## Common Commands

```bash
npm install mobx mobx-react-lite
npm run dev
```

## Related Resources
- [MobX Documentation](https://mobx.js.org/)
- [MobX React](https://mobx.js.org/react-integration.html)
