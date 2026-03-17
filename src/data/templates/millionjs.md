# Million.js Performance Optimization

## Overview
Million.js is a lightweight (<3kb) virtual DOM replacement for React that makes components up to 70% faster. It provides drop-in optimization with minimal code changes.

## When to Use
- React applications with performance bottlenecks
- Large lists or frequent updates causing re-render issues
- Real-time data dashboards with high update frequency
- Projects needing performance improvements without major refactoring
- React apps where memo/useMemo optimization isn't sufficient

## Key Concepts

### 1. Installation and Setup
```bash
# Install Million.js
npm install million

# For Vite projects
npm install @million/lint
```

### 2. Basic Usage - Block Component
```tsx
import { block } from 'million/react';

// Regular React component (slow)
function UserCard({ name, email, avatar }) {
  return (
    <div className="user-card">
      <img src={avatar} alt={name} />
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
}

// Optimized with Million.js (fast)
const UserCard = block(({ name, email, avatar }) => {
  return (
    <div className="user-card">
      <img src={avatar} alt={name} />
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
});
```

### 3. List Optimization with For Component
```tsx
import { For } from 'million/react';

function UserList({ users }) {
  return (
    <div className="user-list">
      <For each={users}>
        {(user) => (
          <div key={user.id} className="user-item">
            <span>{user.name}</span>
            <span>{user.email}</span>
          </div>
        )}
      </For>
    </div>
  );
}

// With stable key extraction
function UserListOptimized({ users }) {
  return (
    <For 
      each={users} 
      memo
      getKey={(user) => user.id}
    >
      {(user) => <UserItem user={user} />}
    </For>
  );
}
```

### 4. Real-time Dashboard Example
```tsx
import { block, For } from 'million/react';

const StockCard = block(({ symbol, price, change }) => {
  const isPositive = change >= 0;
  
  return (
    <div className="stock-card">
      <h3>{symbol}</h3>
      <p className="price">${price.toFixed(2)}</p>
      <p className={isPositive ? 'positive' : 'negative'}>
        {isPositive ? '+' : ''}{change.toFixed(2)}%
      </p>
    </div>
  );
});

function StockDashboard() {
  const [stocks, setStocks] = useState([]);
  
  useEffect(() => {
    const ws = new WebSocket('wss://stock-api.com/realtime');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStocks(prev => 
        prev.map(s => s.symbol === data.symbol ? data : s)
      );
    };
    
    return () => ws.close();
  }, []);
  
  return (
    <div className="dashboard">
      <For each={stocks} memo>
        {(stock) => <StockCard key={stock.symbol} {...stock} />}
      </For>
    </div>
  );
}
```

### 5. Million Lint Integration
```javascript
// vite.config.js
import million from 'million/lint';

export default {
  plugins: [
    million.vite({ auto: true })
  ]
};

// next.config.js
const withMillion = require('million/next');

module.exports = withMillion({
  // Next.js config
});
```

### 6. Advanced Optimization Patterns
```tsx
import { block, For } from 'million/react';

// Nested block optimization
const CommentItem = block(({ text, author, timestamp }) => (
  <div className="comment">
    <span className="author">{author}</span>
    <p>{text}</p>
    <time>{new Date(timestamp).toLocaleString()}</time>
  </div>
));

const CommentList = block(({ comments }) => (
  <div className="comment-section">
    <For each={comments} memo>
      {(comment) => (
        <CommentItem 
          key={comment.id} 
          {...comment} 
        />
      )}
    </For>
  </div>
));

// Optimized form with frequent updates
const FormField = block(({ label, value, onChange, type = 'text' }) => (
  <div className="form-field">
    <label>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
));
```

### 7. Performance Comparison
```tsx
import { useState } from 'react';
import { block, For } from 'million/react';

// Without Million.js - slow on large datasets
function SlowList({ items }) {
  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          {item.name} - {item.value}
        </div>
      ))}
    </div>
  );
}

// With Million.js - optimized
const FastList = block(({ items }) => (
  <div>
    <For each={items} memo>
      {(item) => (
        <div key={item.id}>
          {item.name} - {item.value}
        </div>
      )}
    </For>
  </div>
));

// Benchmark component
function Benchmark() {
  const [items, setItems] = useState(
    Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random()
    }))
  );
  
  const updateRandomItem = () => {
    const randomIndex = Math.floor(Math.random() * items.length);
    setItems(prev => prev.map((item, i) => 
      i === randomIndex 
        ? { ...item, value: Math.random() }
        : item
    ));
  };
  
  return (
    <div>
      <button onClick={updateRandomItem}>
        Update Random Item
      </button>
      <FastList items={items} />
    </div>
  );
}
```

### 8. Integration with React Ecosystem
```tsx
import { block } from 'million/react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

// Works with React Query
const UserData = block(({ userId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  });
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>{data.name}</h2>
      <p>{data.email}</p>
    </div>
  );
});

// Works with Framer Motion
const AnimatedCard = block(({ title, content }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <h3>{title}</h3>
    <p>{content}</p>
  </motion.div>
));
```

## Best Practices

1. **Use block() for leaf components** - Components that render frequently and have simple props
2. **Use <For> for lists** - Especially large lists (>100 items) or frequently updating lists
3. **Add memo prop** - Use `memo` on `<For>` when list items are stable objects
4. **Provide stable keys** - Always use unique, stable keys for list items
5. **Profile first** - Use React DevTools Profiler to identify bottlenecks before optimizing
6. **Don't over-optimize** - Not every component needs Million.js; focus on hot paths

## Common Patterns

```tsx
// Pattern 1: Simple component optimization
const Button = block(({ onClick, children }) => (
  <button onClick={onClick}>{children}</button>
));

// Pattern 2: List with conditional rendering
const TodoList = block(({ todos, filter }) => {
  const filteredTodos = todos.filter(todo => 
    filter === 'all' || todo.status === filter
  );
  
  return (
    <For each={filteredTodos} memo>
      {(todo) => <TodoItem key={todo.id} {...todo} />}
    </For>
  );
});

// Pattern 3: DataTable with frequent updates
const DataTable = block(({ rows, columns }) => (
  <table>
    <thead>
      <tr>
        {columns.map(col => (
          <th key={col.key}>{col.label}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      <For each={rows} memo>
        {(row) => (
          <tr key={row.id}>
            {columns.map(col => (
              <td key={col.key}>{row[col.key]}</td>
            ))}
          </tr>
        )}
      </For>
    </tbody>
  </table>
));
```

## Performance Tips

1. **Batch updates** - Use React 18's automatic batching or manual batching
2. **Virtualize long lists** - Combine with react-window for very large lists
3. **Avoid inline functions** - Define handlers outside render when possible
4. **Use React.memo wisely** - Combine with Million.js for maximum performance
5. **Monitor bundle size** - Million.js adds ~3kb but saves much more in runtime

## Debugging

```tsx
import { block } from 'million/react';

// Debug mode (development only)
const DebugCard = block(({ data }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Rendering DebugCard with:', data);
  }
  
  return (
    <div className="debug-card">
      {/* Component content */}
    </div>
  );
}, { debug: true });
```

## Limitations

- **React-only** - Works only with React (not other frameworks)
- **Not for all components** - Some components may not benefit from optimization
- **Learning curve** - Requires understanding of when to apply optimizations
- **Debugging complexity** - Can make debugging slightly more challenging
- **Compatibility** - May have issues with some React libraries or patterns

## When to Choose Million.js

✅ **Good fit:**
- React apps with performance issues
- Large lists or frequent updates
- Real-time data applications
- Performance-critical UI components
- Projects wanting drop-in optimization

❌ **Not ideal:**
- Small, fast apps without performance issues
- Non-React projects
- Apps with complex animation libraries that conflict
- Projects with strict bundle size requirements (though Million.js is tiny)

## Alternatives

- **React.memo** - Built-in React optimization
- **useMemo/useCallback** - Manual memoization hooks
- **react-window** - Virtual scrolling for large lists
- **Preact** - Lighter React alternative with signals
- **Solid.js** - Fine-grained reactivity system
