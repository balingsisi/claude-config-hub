# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Vue 3 + Vite Application
**Type**: Modern Frontend Application
**Tech Stack**: Vue 3 + Vite + Pinia + Vue Router
**Goal**: Production-ready Vue 3 application with modern tooling and best practices

---

## Tech Stack

### Core
- **Framework**: Vue 3.4+ (Composition API)
- **Build Tool**: Vite 5.0+
- **Language**: TypeScript 5.3+
- **Router**: Vue Router 4.2+
- **State Management**: Pinia 2.1+
- **Styling**: Tailwind CSS 3.4+

### Development
- **Package Manager**: pnpm
- **Linting**: ESLint + @typescript-eslint
- **Formatting**: Prettier
- **Testing**: Vitest + Vue Test Utils
- **E2E Testing**: Playwright

---

## Code Standards

### TypeScript Rules
- Enable strict mode in `tsconfig.json`
- No `any` types - use `unknown` with type guards
- Always define prop types with `defineProps<T>()`
- Use `interface` for component props, `type` for unions

```typescript
// ✅ Good
interface UserProps {
  id: string
  name: string
  email: string
}

const props = defineProps<UserProps>()

// ❌ Bad
const props = defineProps({
  id: any,
  name: any
})
```

### Component Naming
- **Component Files**: PascalCase (`UserProfile.vue`)
- **Component Names**: Multi-word (avoid conflicts)
- **Pages**: kebab-case (`user-profile.vue`)
- **Composables**: camelCase with `use` prefix (`useAuth.ts`)

### Vue 3 Best Practices

#### Use Composition API
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { User } from '@/types'

// Reactive state
const user = ref<User | null>(null)
const loading = ref(true)

// Computed properties
const userName = computed(() => user.value?.name ?? 'Guest')

// Lifecycle
onMounted(async () => {
  user.value = await fetchUser()
  loading.value = false
})
</script>
```

#### Script Setup Always
- Always use `<script setup>` syntax
- No Options API unless migrating legacy code
- Keep logic in `<script setup>`, template in `<template>`

---

## Directory Structure

```
src/
├── assets/          # Static assets (images, fonts)
├── components/      # Reusable components
│   ├── ui/         # Base UI components
│   ├── forms/      # Form components
│   └── layouts/    # Layout components
├── composables/     # Vue composables (hooks)
│   ├── useAuth.ts
│   ├── useApi.ts
│   └── useToast.ts
├── directives/      # Custom directives
├── router/          # Vue Router config
│   ├── index.ts
│   └── routes.ts
├── stores/          # Pinia stores
│   ├── user.ts
│   ├── cart.ts
│   └── app.ts
├── types/           # TypeScript types
│   ├── user.ts
│   ├── api.ts
│   └── env.d.ts
├── utils/           # Utility functions
│   ├── format.ts
│   ├── validation.ts
│   └── api.ts
├── views/           # Page components
│   ├── Home.vue
│   ├── About.vue
│   └── admin/
│       └── Dashboard.vue
├── App.vue
└── main.ts
```

---

## Component Rules

### Component Structure
1. **Single File Components**: Keep components in `.vue` files
2. **One Component Per File**: No multiple exports
3. **Order**: `<script setup>` → `<template>` → `<style>`
4. **Scoped Styles**: Always use `<style scoped>`

```vue
<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const count = ref(0)
</script>

<template>
  <div class="counter">
    <BaseButton @click="count++">
      Count: {{ count }}
    </BaseButton>
  </div>
</template>

<style scoped>
.counter {
  padding: 1rem;
}
</style>
```

### Props and Emits
```vue
<script setup lang="ts">
// Props with defaults
interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

// Emits with types
interface Emits {
  (e: 'update', value: number): void
  (e: 'delete', id: string): void
}

const emit = defineEmits<Emits>()
</script>
```

### Component Organization
- **Base Components**: Pure presentational, no business logic
- **Feature Components**: Business logic + UI
- **Layout Components**: Page structure
- **Page Components**: Route-level views

---

## State Management (Pinia)

### Store Structure
```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import type { User } from '@/types'

interface UserState {
  user: User | null
  loading: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    loading: false
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.user,
    userName: (state) => state.user?.name ?? 'Guest'
  },
  
  actions: {
    async fetchUser() {
      this.loading = true
      try {
        this.user = await api.fetchCurrentUser()
      } finally {
        this.loading = false
      }
    },
    
    logout() {
      this.user = null
    }
  }
})
```

### Store Rules
- One store per domain (user, cart, app)
- Use Setup Stores for complex logic
- Use Options Stores for simple state
- Never mutate state directly outside actions
- Use `$reset()` to reset state

```typescript
// ✅ Good - in actions
async function updateUser(data: User) {
  user.value = data
}

// ❌ Bad - direct mutation in component
user.value = newUser
```

---

## Routing (Vue Router)

### Route Configuration
```typescript
// router/routes.ts
import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/Settings.vue')
      }
    ]
  }
]
```

### Navigation Guards
```typescript
// router/index.ts
router.beforeEach((to, from) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})
```

### Route Rules
- Use lazy loading for all routes
- Define route metadata for permissions
- Keep routes in separate file
- Use named routes (not paths) for navigation
- Handle 404 with catch-all route

```typescript
// ✅ Good
router.push({ name: 'user', params: { id: '123' } })

// ❌ Bad
router.push('/user/123')
```

---

## Composables (Reusability)

### Composable Rules
- Start with `use` prefix
- Return reactive values
- Keep them focused (single responsibility)
- Accept refs or plain values

```typescript
// composables/useFetch.ts
import { ref, type Ref } from 'vue'

export function useFetch<T>(url: string | Ref<string>) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(false)

  async function execute() {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(unref(url))
      data.value = await response.json()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, execute }
}
```

### Common Composables
- `useAuth` - Authentication state
- `useApi` - API calls with loading state
- `useToast` - Toast notifications
- `useLocalStorage` - Persistent state
- `useDebounce` - Debounced values

---

## API Integration

### API Service Pattern
```typescript
// utils/api.ts
import { useUserStore } from '@/stores/user'

const BASE_URL = import.meta.env.VITE_API_URL

class ApiService {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const userStore = useUserStore()
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(userStore.user?.token && {
        Authorization: `Bearer ${userStore.user.token}`
      })
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint)
  }

  post<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

export const api = new ApiService()
```

---

## Form Handling

### Form Composition
```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, email } from '@vuelidate/validators'

interface FormData {
  email: string
  password: string
}

const form = reactive<FormData>({
  email: '',
  password: ''
})

const rules = {
  email: { required, email },
  password: { required }
}

const v$ = useVuelidate(rules, form)

async function onSubmit() {
  const isValid = await v$.value.$validate()
  if (!isValid) return
  
  // Submit form
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <input
      v-model="form.email"
      type="email"
      @blur="v$.email.$touch()"
    />
    <span v-if="v$.email.$error">Invalid email</span>
    
    <button type="submit">Submit</button>
  </form>
</template>
```

---

## Styling Rules

### Tailwind CSS
- Use Tailwind utility classes
- Extract components with `@apply` sparingly
- Use semantic color names in config
- Mobile-first responsive design

```vue
<template>
  <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
    Click me
  </button>
</template>

<style scoped>
/* Only for complex animations or Tailwind can't handle */
.custom-animation {
  animation: fade-in 0.3s ease-in;
}
</style>
```

### CSS Modules
- Use CSS modules for complex components
- Name classes semantically

```vue
<template>
  <div :class="$style.container">
    <h1 :class="$style.title">Title</h1>
  </div>
</template>

<style module lang="scss">
.container {
  padding: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: bold;
}
</style>
```

---

## Testing

### Unit Tests (Vitest)
```typescript
// __tests__/components/UserCard.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UserCard from '@/components/UserCard.vue'

describe('UserCard', () => {
  it('renders user name', () => {
    const wrapper = mount(UserCard, {
      props: {
        user: { id: '1', name: 'John', email: 'john@example.com' }
      }
    })
    
    expect(wrapper.text()).toContain('John')
  })
})
```

### Testing Rules
- Test user behavior, not implementation
- Use `data-testid` for stable selectors
- Mock API calls and external dependencies
- Test accessibility (ARIA attributes)
- Aim for 70%+ coverage

---

## Performance Optimization

### Lazy Loading
```typescript
// Lazy load components
const HeavyComponent = defineAsyncComponent(() =>
  import('@/components/HeavyComponent.vue')
)

// Lazy load routes
{
  path: '/dashboard',
  component: () => import('@/views/Dashboard.vue')
}
```

### Best Practices
- Use `v-once` for static content
- Use `v-memo` for expensive lists
- Debounce input handlers
- Virtual scrolling for long lists
- Computed properties over methods

```vue
<!-- ✅ Good - v-memo for expensive rendering -->
<div v-for="item in items" :key="item.id" v-memo="[item.selected]">
  {{ item.name }}
</div>

<!-- ❌ Bad - re-renders on every update -->
<div v-for="item in items" :key="item.id">
  {{ item.name }}
</div>
```

---

## Error Handling

### Global Error Handler
```typescript
// main.ts
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  // Report to error tracking service
}
```

### Component Error Handling
```vue
<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const toast = useToast()

async function fetchData() {
  try {
    const data = await api.get('/data')
    return data
  } catch (error) {
    toast.error('Failed to load data')
    console.error(error)
  }
}
</script>
```

---

## Security Best Practices

### XSS Prevention
- Never use `v-html` with user content
- Sanitize HTML if absolutely necessary
- Use text interpolation `{{ }}` by default

### CSRF Protection
- Include CSRF token in API requests
- Use same-site cookies
- Validate origin headers

### Input Validation
- Validate on client AND server
- Use TypeScript for type safety
- Sanitize all user inputs

```typescript
// ✅ Good - sanitize input
import DOMPurify from 'dompurify'

const safeHtml = DOMPurify.sanitize(userInput)

// ❌ Bad - raw user input
<div v-html="userInput"></div>
```

---

## Git Workflow

### Commit Messages
```
feat: add user authentication
fix: resolve login redirect issue
docs: update API documentation
style: format code with prettier
refactor: extract user store logic
test: add unit tests for UserCard
chore: update dependencies
```

### Branch Names
- `feature/user-authentication`
- `fix/login-redirect`
- `refactor/user-store`

---

## Environment Variables

```bash
# .env
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=My App
VITE_ENABLE_ANALYTICS=true
```

```typescript
// Access in code
const apiUrl = import.meta.env.VITE_API_URL
```

---

## Build and Deployment

### Build Commands
```bash
# Development
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run tests
pnpm test
```

### Production Checklist
- [ ] Remove console.log statements
- [ ] Enable minification
- [ ] Optimize images
- [ ] Set proper caching headers
- [ ] Enable gzip compression
- [ ] Test in production mode
- [ ] Check bundle size

---

## Common Patterns

### Modal Pattern
```vue
<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)

function open() {
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

defineExpose({ open, close })
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal" @click.self="close">
      <slot />
    </div>
  </Teleport>
</template>
```

### Infinite Scroll
```typescript
// composables/useInfiniteScroll.ts
export function useInfiniteScroll(
  fetchFn: (page: number) => Promise<any[]>,
  threshold: number = 100
) {
  const items = ref<any[]>([])
  const page = ref(1)
  const hasMore = ref(true)
  const loading = ref(false)

  async function loadMore() {
    if (loading.value || !hasMore.value) return
    
    loading.value = true
    const newItems = await fetchFn(page.value)
    
    if (newItems.length === 0) {
      hasMore.value = false
    } else {
      items.value.push(...newItems)
      page.value++
    }
    
    loading.value = false
  }

  // Intersection observer logic here
  return { items, loadMore, hasMore, loading }
}
```

---

## Documentation

### Component Documentation
```vue
<script setup lang="ts">
/**
 * UserCard component displays user information
 * 
 * @example
 * <UserCard :user="{ id: '1', name: 'John' }" />
 */
interface Props {
  /** User object to display */
  user: User
  /** Show email address */
  showEmail?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showEmail: false
})
</script>
```

### README Structure
- Project overview
- Setup instructions
- Available scripts
- Environment variables
- Deployment guide
- Contributing guidelines

---

## Best Practices Summary

1. **Use Composition API** with `<script setup>`
2. **Type everything** with TypeScript
3. **Lazy load** routes and heavy components
4. **Keep components small** and focused
5. **Use Pinia** for global state
6. **Follow naming conventions** consistently
7. **Write tests** for critical paths
8. **Handle errors** gracefully
9. **Optimize performance** with computed/memo
10. **Document complex logic**

---

## Quick Reference

### Common Commands
```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm test         # Run unit tests
pnpm lint         # Lint code
pnpm format       # Format code
```

### Useful Resources
- [Vue 3 Docs](https://vuejs.org/)
- [Vite Docs](https://vitejs.dev/)
- [Pinia Docs](https://pinia.vuejs.org/)
- [Vue Router Docs](https://router.vuejs.org/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
