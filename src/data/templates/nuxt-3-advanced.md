# Nuxt 3 Advanced Template

## Tech Stack
- nuxt v3.x
- Vue 3.4+
- TypeScript 5+
- Nitro 2.x

## Core Patterns

### Server Routes
```typescript
// server/api/users/[id].ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const user = await getUserById(id);
  return user;
});
```

### Composables
```typescript
// composables/useUser.ts
export const useUser = () => {
  const user = useState<User | null>('user', () => null);

  const login = async (email: string, password: string) => {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    user.value = response.user;
  };

  return { user, login };
};
```

### Auto-imports
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  imports: {
    dirs: ['composables', 'utils'],
  },
});
```

### Middleware
```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { user } = useUser();
  if (!user.value) {
    return navigateTo('/login');
  }
});
```

## Common Commands

```bash
npx nuxi init my-app
npm run dev
npm run build
```

## Related Resources
- [Nuxt 3 Documentation](https://nuxt.com/)
