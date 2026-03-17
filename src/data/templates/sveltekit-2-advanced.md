# SvelteKit 2 Advanced Template

## Tech Stack
- @sveltejs/kit v2.x
- Svelte 5.x
- TypeScript 5+

## Core Patterns

### Server Load
```typescript
// +page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
  const response = await fetch(`/api/posts/${params.slug}`);
  const post = await response.json();
  return { post };
};
```

### Form Actions
```typescript
// +page.server.ts
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get('email');
    // Process form
    return { success: true };
  },
};
```

### Server Hooks
```typescript
// hooks.server.ts
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Authentication logic
  const session = event.cookies.get('session');
  if (session) {
    event.locals.user = await getUser(session);
  }
  return resolve(event);
};
```

### Layout Groups
```typescript
// (app)/layout.svelte
<script>
  let { children } = $props();
</script>

<nav>App Navigation</nav>
{@render children()}
```

## Common Commands

```bash
npm create svelte@latest my-app
npm run dev
npm run build
```

## Related Resources
- [SvelteKit Documentation](https://kit.svelte.dev/)
