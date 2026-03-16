# Qwik Application Template

## Project Overview

Resumable web application built with Qwik - the framework that delivers instant loading through fine-grained lazy loading and zero JavaScript by default.

## Tech Stack

- **Framework**: Qwik 1.5+
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: Qwik City
- **State**: Signals

## Project Structure

```
src/
├── components/             # Reusable components
│   ├── header/
│   │   └── header.tsx
│   └── footer/
│       └── footer.tsx
├── routes/                 # File-based routing
│   ├── layout.tsx          # Root layout
│   ├── index.tsx           # Home page
│   ├── about/
│   │   └── index.tsx
│   ├── blog/
│   │   ├── index.tsx
│   │   └── [slug]/
│   │       └── index.tsx
│   └── api/                # API endpoints
│       └── data/
│           └── index.ts
├── root.tsx                # Root component
├── entry.ssr.tsx           # SSR entry
├── global.css              # Global styles
└── types.ts                # TypeScript types
```

## Key Patterns

### 1. Component with Signals

```tsx
// src/components/counter/counter.tsx
import { component$, useSignal } from '@builder.io/qwik';

export const Counter = component$(() => {
  const count = useSignal(0);
  
  return (
    <div>
      <p>Count: {count.value}</p>
      <button onClick$={() => count.value++}>
        Increment
      </button>
    </div>
  );
});
```

### 2. Props and Events

```tsx
// src/components/user-card/user-card.tsx
import { component$, $, Slot } from '@builder.io/qwik';

interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  onEdit$?: (id: string) => void;
}

export const UserCard = component$<UserCardProps>(({ user, onEdit$ }) => {
  return (
    <article class="card">
      <Slot name="header" />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {onEdit$ && (
        <button onClick$={() => onEdit$(user.id)}>
          Edit
        </button>
      )}
      <Slot />
    </article>
  );
});
```

### 3. Server Data Loading

```tsx
// src/routes/blog/index.tsx
import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';

export const useBlogPosts = routeLoader$(async () => {
  // This runs on the server only
  const response = await fetch('https://api.example.com/posts');
  return response.json();
});

export default component$(() => {
  const posts = useBlogPosts();
  
  return (
    <div>
      <h1>Blog</h1>
      <ul>
        {posts.value.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
});
```

### 4. Server Actions

```tsx
// src/routes/contact/index.tsx
import { component$ } from '@builder.io/qwik';
import { routeAction$, z, zod$ } from '@builder.io/qwik-city';

export const useSubmitForm = routeAction$(
  async (data, { fail }) => {
    // Server-side validation and processing
    if (!data.email.includes('@')) {
      return fail(400, { message: 'Invalid email' });
    }
    
    // Process form...
    return { success: true };
  },
  zod$({
    email: z.string().email(),
    message: z.string().min(10),
  })
);

export default component$(() => {
  const action = useSubmitForm();
  
  return (
    <form action={action.actionPath} method="post">
      <input name="email" type="email" />
      <textarea name="message"></textarea>
      <button type="submit">Submit</button>
      {action.value?.success && <p>Form submitted!</p>}
      {action.value?.failed && <p>{action.value.message}</p>}
    </form>
  );
});
```

### 5. Context Pattern

```tsx
// src/context/user-context.ts
import { createContextId, useContext, useContextProvider, useSignal, type Signal } from '@builder.io/qwik';

interface UserContext {
  userId: Signal<string | null>;
  login: (id: string) => void;
  logout: () => void;
}

export const UserContextId = createContextId<UserContext>('user-context');

export function useUserProvider() {
  const userId = useSignal<string | null>(null);
  
  useContextProvider(UserContextId, {
    userId,
    login: (id: string) => { userId.value = id; },
    logout: () => { userId.value = null; },
  });
}

export function useUser() {
  return useContext(UserContextId);
}
```

### 6. API Routes

```tsx
// src/routes/api/data/index.ts
import { json } from '@builder.io/qwik-city';

export const onGet = async () => {
  const data = await fetchData();
  return json(data);
};

export const onPost = async ({ request }: { request: Request }) => {
  const body = await request.json();
  // Process data...
  return json({ success: true });
};
```

## Best Practices

1. **Resumability**: Use `$` suffix for lazy-loaded functions
2. **Signals**: Prefer signals for reactive state
3. **Server Functions**: Use `server$` for server-only code
4. **Code Splitting**: Qwik does this automatically
5. **Streaming**: Use streaming for slow data

## Common Commands

```bash
# Development
pnpm start

# Build
pnpm build

# Preview production
pnpm preview

# Type checking
pnpm typecheck
```

## Performance Characteristics

| Feature | Qwik | React |
|---------|------|-------|
| Initial JS | ~1KB | ~40KB |
| Hydration | No (Resumable) | Yes |
| Time to Interactive | Instant | Delayed |
| Bundle size | Tiny | Medium |

## Deployment

### Vercel

```bash
pnpm build
# Deploy `dist` directory
```

### Cloudflare Pages

```bash
pnpm build
# Deploy `dist` directory
```

### Node.js

```typescript
// entry.server.ts
import { createQwikCity } from '@builder.io/qwik-city/middleware/node';
import qwikCityPlan from '@qwik-city-plan';
import render from './entry.ssr';

const { app, router } = createQwikCity({ render, qwikCityPlan });

export default app;
```

## Qwik vs React

```tsx
// React
const [count, setCount] = useState(0);
<button onClick={() => setCount(count + 1)}>+</button>

// Qwik
const count = useSignal(0);
<button onClick$={() => count.value++}>+</button>
```

Key differences:
1. **No hydration** - Qwik is resumable
2. **Lazy loading** - Functions load on demand
3. **Signals** - Fine-grained reactivity
4. **Server-first** - Optimized for SSR

## Resources

- [Qwik Documentation](https://qwik.builder.io/)
- [Qwik City](https://qwik.builder.io/qwikcity/overview/)
- [Qwik Examples](https://github.com/BuilderIO/qwik/tree/main/starters)
