# Svelte 5 Application Template

## Project Overview

Modern web application built with Svelte 5, featuring the new runes reactivity system, enhanced TypeScript support, and improved performance.

## Tech Stack

- **Framework**: Svelte 5
- **Build Tool**: Vite 5
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS
- **State Management**: Svelte Stores / Runes
- **Testing**: Vitest + Playwright

## Project Structure

```
src/
├── lib/                    # Reusable components and utilities
│   ├── components/         # UI components
│   │   ├── ui/             # Base UI components
│   │   └── forms/          # Form components
│   ├── stores/             # Svelte stores
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript types
├── routes/                 # SvelteKit routes
│   ├── +layout.svelte      # Layout component
│   ├── +page.svelte        # Home page
│   ├── +page.server.ts     # Server-side data
│   └── api/                # API routes
├── params/                 # Custom param matchers
├── hooks.server.ts         # Server hooks
└── app.html                # HTML template
```

## Key Patterns

### 1. Runes - New Reactivity System

```typescript
// Svelte 5 uses runes instead of $: syntax
let count = $state(0);
let doubled = $derived(count * 2);

// Effect with cleanup
$effect(() => {
  console.log('Count changed:', count);
  
  return () => {
    console.log('Cleanup');
  };
});

// Reactive class
class Counter {
  count = $state(0);
  
  increment() {
    this.count++;
  }
  
  get doubled() {
    return $derived(this.count * 2);
  }
}
```

### 2. Server-Side Data Loading

```typescript
// src/routes/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
  const response = await fetch('/api/data');
  const data = await response.json();
  
  return {
    data,
    meta: {
      title: 'Page Title',
      description: 'Page description'
    }
  };
};
```

### 3. Form Actions

```typescript
// src/routes/+page.server.ts
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get('email');
    
    if (!email) {
      return fail(400, { email, missing: true });
    }
    
    // Process form...
    return { success: true };
  }
};
```

### 4. Component with Props

```svelte
<!-- src/lib/components/UserCard.svelte -->
<script lang="ts">
  interface Props {
    user: {
      id: string;
      name: string;
      email: string;
    };
    onEdit?: (id: string) => void;
  }
  
  let { user, onEdit }: Props = $props();
</script>

<article class="card">
  <h3>{user.name}</h3>
  <p>{user.email}</p>
  {#if onEdit}
    <button onclick={() => onEdit(user.id)}>Edit</button>
  {/if}
</article>
```

### 5. Store Pattern

```typescript
// src/lib/stores/user.ts
import { writable, derived } from 'svelte/store';

interface User {
  id: string;
  name: string;
  email: string;
}

function createUserStore() {
  const { subscribe, set, update } = writable<User | null>(null);
  
  return {
    subscribe,
    login: async (email: string, password: string) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      const user = await response.json();
      set(user);
    },
    logout: () => {
      set(null);
    },
    updateProfile: (data: Partial<User>) => {
      update(user => user ? { ...user, ...data } : null);
    }
  };
}

export const user = createUserStore();
```

### 6. Error Handling

```typescript
// src/routes/+error.svelte
<script lang="ts">
  import { page } from '$app/stores';
  
  $: status = $page.status;
  $: message = $page.error?.message;
</script>

<div class="error-page">
  <h1>{status}</h1>
  <p>{message}</p>
  <a href="/">Go Home</a>
</div>
```

## Best Practices

1. **Use Runes**: Prefer `$state`, `$derived`, `$effect` over legacy reactivity
2. **Server Components**: Load data on server for better SEO and performance
3. **Progressive Enhancement**: Forms should work without JavaScript
4. **Type Safety**: Use generated types from `./$types`
5. **Accessibility**: Include ARIA labels and keyboard navigation

## Common Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm check

# Run tests
pnpm test

# E2E tests
pnpm test:e2e
```

## Performance Tips

1. **Code Splitting**: SvelteKit automatically splits by route
2. **Image Optimization**: Use `@sveltejs/enhanced-img`
3. **Preloading**: Use `<svelte:head>` for preload hints
4. **Streaming**: Use streaming for slow data loads
5. **Edge Deployment**: Deploy to edge for global performance

## Deployment

### Vercel (Recommended)

```bash
pnpm install -g vercel
vercel
```

### Cloudflare Pages

```bash
pnpm build
# Deploy `build` directory
```

### Node.js Adapter

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-node';

export default {
  kit: {
    adapter: adapter()
  }
};
```

## Svelte 5 Migration Tips

1. Replace `$:` with `$state` and `$derived`
2. Update component props syntax
3. Use new event handlers (`onclick` instead of `on:click`)
4. Migrate to new slot syntax
5. Update store usage if needed

## Resources

- [Svelte 5 Documentation](https://svelte-5-preview.vercel.app/)
- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Svelte 5 Runes](https://svelte-5-preview.vercel.app/docs/runes)
