# SolidJS Application Template

## Project Overview

High-performance reactive web application built with SolidJS, featuring fine-grained reactivity, no virtual DOM, and exceptional performance.

## Tech Stack

- **Framework**: SolidJS 1.8+
- **Build Tool**: Vite 5
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: Solid Router
- **State**: Solid Stores / Context

## Project Structure

```
src/
├── components/             # Reusable components
│   ├── ui/                 # UI primitives
│   ├── forms/              # Form components
│   └── layout/             # Layout components
├── routes/                 # File-based routing
│   ├── index.tsx           # Home page
│   ├── about.tsx           # About page
│   └── [...404].tsx        # 404 page
├── stores/                 # Global state
│   ├── user.ts
│   └── cart.ts
├── utils/                  # Utility functions
├── types/                  # TypeScript types
├── App.tsx                 # Root component
├── index.tsx               # Entry point
└── router.tsx              # Router configuration
```

## Key Patterns

### 1. Reactive Primitives

```tsx
// src/components/Counter.tsx
import { createSignal, createMemo, createEffect } from 'solid-js';

export function Counter() {
  const [count, setCount] = createSignal(0);
  
  // Derived value (memoized)
  const doubled = createMemo(() => count() * 2);
  
  // Side effect
  createEffect(() => {
    console.log('Count changed:', count());
  });
  
  return (
    <div>
      <p>Count: {count()}</p>
      <p>Doubled: {doubled()}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### 2. Components with Props

```tsx
// src/components/UserCard.tsx
import { type Component, type JSX } from 'solid-js';

interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  onEdit?: (id: string) => void;
  children?: JSX.Element;
}

export const UserCard: Component<UserCardProps> = (props) => {
  return (
    <article class="card">
      <h3>{props.user.name}</h3>
      <p>{props.user.email}</p>
      {props.children}
      {props.onEdit && (
        <button onClick={() => props.onEdit!(props.user.id)}>
          Edit
        </button>
      )}
    </article>
  );
};
```

### 3. Store Pattern

```tsx
// src/stores/user.ts
import { createStore, produce } from 'solid-js/store';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

const [state, setState] = createStore<UserState>({
  currentUser: null,
  isLoading: false,
  error: null,
});

export const userStore = {
  state,
  login: async (email: string, password: string) => {
    setState({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const user = await response.json();
      setState({ currentUser: user, isLoading: false });
    } catch (error) {
      setState({ error: error.message, isLoading: false });
    }
  },
  logout: () => {
    setState({ currentUser: null });
  },
};
```

### 4. Routing

```tsx
// src/router.tsx
import { Router, Route } from '@solidjs/router';
import { lazy } from 'solid-js';

const Home = lazy(() => import('./routes/index'));
const About = lazy(() => import('./routes/about'));
const Blog = lazy(() => import('./routes/blog'));
const BlogPost = lazy(() => import('./routes/blog/[slug]'));

export function AppRouter() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="*404" component={NotFound} />
    </Router>
  );
}
```

### 5. Data Fetching

```tsx
// src/routes/blog/index.tsx
import { createResource, For } from 'solid-js';
import { PostCard } from '../../components/PostCard';

async function fetchPosts() {
  const response = await fetch('/api/posts');
  return response.json();
}

export default function BlogPage() {
  const [posts] = createResource(fetchPosts);
  
  return (
    <div>
      <h1>Blog</h1>
      {posts.loading && <p>Loading...</p>}
      {posts.error && <p>Error: {posts.error.message}</p>}
      <For each={posts()}>
        {(post) => <PostCard post={post} />}
      </For>
    </div>
  );
}
```

### 6. Context Pattern

```tsx
// src/context/ThemeContext.tsx
import { createContext, useContext, type JSX } from 'solid-js';
import { createSignal } from 'solid-js';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: () => Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>();

export function ThemeProvider(props: { children: JSX.Element }) {
  const [theme, setTheme] = createSignal<Theme>('light');
  
  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

## Best Practices

1. **Use Signals**: Prefer `createSignal` over state for local reactivity
2. **Fine-Grained Reactivity**: Update only what changes
3. **No Virtual DOM**: Direct DOM updates for performance
4. **Declarative Rendering**: Use JSX for clarity
5. **TypeScript First**: Strong typing for better DX

## Common Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Preview
pnpm preview

# Type checking
pnpm type-check

# Test
pnpm test
```

## Performance Characteristics

| Feature | SolidJS | React |
|---------|---------|-------|
| Virtual DOM | No | Yes |
| Bundle size | ~7KB | ~40KB |
| Initial render | Fast | Medium |
| Updates | Very Fast | Fast |
| Memory usage | Low | Medium |

## SolidJS vs React

```tsx
// React
const [count, setCount] = useState(0);
const doubled = useMemo(() => count * 2, [count]);

// SolidJS
const [count, setCount] = createSignal(0);
const doubled = createMemo(() => count() * 2);
```

Key differences:
1. **Signals are functions** - Call them to get value
2. **No dependency arrays** - Automatic tracking
3. **No hooks rules** - Use anywhere
4. **No re-renders** - Fine-grained updates

## Deployment

```bash
# Build for production
pnpm build

# Static hosting (Vercel, Netlify, etc.)
# Deploy `dist` directory
```

## Resources

- [SolidJS Documentation](https://www.solidjs.com/)
- [Solid Router](https://github.com/solidjs/solid-router)
- [Solid Playground](https://playground.solidjs.com/)
