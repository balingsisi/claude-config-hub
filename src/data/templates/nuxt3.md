# Nuxt 3 Full-Stack Application Template

## Project Overview

Nuxt 3 is a powerful Vue.js meta-framework that enables server-side rendering, static site generation, and modern web development with automatic routing, data fetching, and optimizations. It provides an excellent developer experience with file-based routing, auto-imports, and built-in TypeScript support.

## Tech Stack

- **Framework**: Nuxt 3.10+
- **UI Library**: Vue 3.4+ (Composition API)
- **Language**: TypeScript 5.3+
- **Rendering**: SSR / SSG / Hybrid
- **Styling**: Tailwind CSS / UnoCSS
- **State**: Pinia
- **Data Fetching**: Nuxt built-in / TanStack Query
- **Testing**: Vitest + Playwright

## Project Structure

```
├── app.vue                 # Root component
├── nuxt.config.ts          # Nuxt configuration
├── app.config.ts           # Runtime config
├── components/             # Vue components (auto-imported)
│   ├── ui/                 # UI primitives
│   ├── forms/              # Form components
│   └── layout/             # Layout components
├── composables/            # Composables (auto-imported)
│   ├── useAuth.ts
│   ├── useApi.ts
│   └── useCart.ts
├── layouts/                # Layout components
│   ├── default.vue
│   ├── admin.vue
│   └── auth.vue
├── pages/                  # File-based routing
│   ├── index.vue
│   ├── about.vue
│   ├── blog/
│   │   ├── index.vue
│   │   └── [slug].vue      # Dynamic route
│   ├── admin/
│   │   └── dashboard.vue
│   └── auth/
│       ├── login.vue
│       └── register.vue
├── server/                 # Server-side code
│   ├── api/                # API routes
│   │   ├── users.ts
│   │   ├── auth/
│   │   │   └── login.post.ts
│   │   └── blog/
│   │       └── [slug].get.ts
│   ├── middleware/         # Server middleware
│   │   └── auth.ts
│   ├── routes/             # Server routes
│   │   └── sitemap.xml.ts
│   ├── plugins/            # Server plugins
│   │   └── database.ts
│   └── utils/              # Server utilities
│       └── db.ts
├── plugins/                # Client/Server plugins
│   ├── pinia.ts
│   └── vue-query.ts
├── middleware/             # Route middleware
│   ├── auth.ts
│   └── admin.ts
├── assets/                 # Assets (processed by build)
│   ├── css/
│   │   └── main.css
│   └── images/
├── public/                 # Static assets
│   ├── favicon.ico
│   └── robots.txt
├── stores/                 # Pinia stores
│   ├── user.ts
│   └── cart.ts
├── types/                  # TypeScript types
│   ├── index.d.ts
│   └── api.d.ts
├── utils/                  # Utility functions (auto-imported)
│   └── helpers.ts
└── error.vue               # Error page
```

## Key Patterns

### 1. Nuxt Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
  ],
  
  app: {
    head: {
      title: 'My Nuxt App',
      meta: [
        { name: 'description', content: 'A Nuxt 3 application' },
      ],
    },
  },
  
  runtimeConfig: {
    // Server-side only
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    
    // Public (exposed to client)
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
      appName: 'My App',
    },
  },
  
  nitro: {
    preset: 'vercel-edge', // or 'node-server', 'cloudflare-pages'
  },
  
  typescript: {
    strict: true,
    shim: false,
  },
  
  imports: {
    dirs: ['stores', 'composables', 'utils'],
  },
});
```

### 2. Page with Data Fetching

```vue
<!-- pages/blog/[slug].vue -->
<script setup lang="ts">
interface Post {
  id: string;
  slug: string;
  title: string;
  content: string;
  author: string;
  date: string;
}

const route = useRoute();
const { slug } = route.params;

// SSR data fetching with useAsyncData
const { data: post, error } = await useAsyncData<Post>(
  `post-${slug}`,
  () => $fetch(`/api/blog/${slug}`)
);

// SEO
useSeoMeta({
  title: () => post.value?.title,
  description: () => post.value?.content.slice(0, 160),
  ogTitle: () => post.value?.title,
  ogType: 'article',
});

// Error handling
if (error.value) {
  throw createError({
    statusCode: 404,
    message: 'Post not found',
  });
}

// Define page meta
definePageMeta({
  layout: 'blog',
  middleware: ['auth'],
});
</script>

<template>
  <article class="max-w-3xl mx-auto p-6">
    <h1 class="text-4xl font-bold mb-4">{{ post?.title }}</h1>
    <div class="flex gap-4 text-gray-600 mb-6">
      <span>By {{ post?.author }}</span>
      <span>{{ post?.date }}</span>
    </div>
    <div class="prose lg:prose-lg">
      {{ post?.content }}
    </div>
  </article>
</template>
```

### 3. Composable (Auto-imported)

```typescript
// composables/useAuth.ts
interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const state = useState<AuthState>('auth', () => ({
  user: null,
  token: null,
  isAuthenticated: false,
}));

export const useAuth = () => {
  const config = useRuntimeConfig();
  
  const login = async (email: string, password: string) => {
    try {
      const response = await $fetch<{ user: User; token: string }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: { email, password },
        }
      );
      
      state.value.user = response.user;
      state.value.token = response.token;
      state.value.isAuthenticated = true;
      
      // Store token in cookie
      const tokenCookie = useCookie('auth-token', {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        secure: true,
        httpOnly: false,
      });
      tokenCookie.value = response.token;
      
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };
  
  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' });
    
    state.value.user = null;
    state.value.token = null;
    state.value.isAuthenticated = false;
    
    const tokenCookie = useCookie('auth-token');
    tokenCookie.value = null;
  };
  
  const fetchUser = async () => {
    if (!state.value.token) return null;
    
    try {
      const user = await $fetch<User>('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${state.value.token}`,
        },
      });
      
      state.value.user = user;
      state.value.isAuthenticated = true;
      
      return user;
    } catch {
      state.value.user = null;
      state.value.isAuthenticated = false;
      return null;
    }
  };
  
  return {
    user: computed(() => state.value.user),
    isAuthenticated: computed(() => state.value.isAuthenticated),
    token: computed(() => state.value.token),
    login,
    logout,
    fetchUser,
  };
};
```

### 4. API Route Handler

```typescript
// server/api/users/[id].get.ts
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, paramsSchema.parse);
  
  const config = useRuntimeConfig();
  const db = await connectDB(config.databaseUrl);
  
  const user = await db.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });
  
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
    });
  }
  
  return user;
});
```

```typescript
// server/api/users/index.post.ts
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const bodySchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse);
  
  const config = useRuntimeConfig();
  const db = await connectDB(config.databaseUrl);
  
  // Check if user exists
  const existing = await db.user.findUnique({
    where: { email: body.email },
  });
  
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Email already registered',
    });
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(body.password, 10);
  
  // Create user
  const user = await db.user.create({
    data: {
      ...body,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
  
  setResponseStatus(event, 201);
  return user;
});
```

### 5. Pinia Store

```typescript
// stores/cart.ts
import { defineStore } from 'pinia';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
  }),
  
  getters: {
    totalItems: (state) => 
      state.items.reduce((sum, item) => sum + item.quantity, 0),
    
    totalPrice: (state) => 
      state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    
    isEmpty: (state) => state.items.length === 0,
  },
  
  actions: {
    addItem(product: Omit<CartItem, 'id' | 'quantity'>) {
      const existing = this.items.find(item => item.productId === product.productId);
      
      if (existing) {
        existing.quantity++;
      } else {
        this.items.push({
          id: crypto.randomUUID(),
          ...product,
          quantity: 1,
        });
      }
    },
    
    removeItem(itemId: string) {
      const index = this.items.findIndex(item => item.id === itemId);
      if (index > -1) {
        this.items.splice(index, 1);
      }
    },
    
    updateQuantity(itemId: string, quantity: number) {
      const item = this.items.find(item => item.id === itemId);
      if (item) {
        if (quantity <= 0) {
          this.removeItem(itemId);
        } else {
          item.quantity = quantity;
        }
      }
    },
    
    clear() {
      this.items = [];
    },
  },
  
  persist: {
    storage: persistedState.localStorage,
  },
});
```

### 6. Route Middleware

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { isAuthenticated, fetchUser } = useAuth();
  
  // If not authenticated, try to fetch user
  if (!isAuthenticated.value) {
    await fetchUser();
  }
  
  // If still not authenticated, redirect to login
  if (!isAuthenticated.value) {
    return navigateTo('/auth/login', {
      query: { redirect: to.fullPath },
    });
  }
});
```

```typescript
// middleware/admin.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user } = useAuth();
  
  if (!user.value?.roles?.includes('admin')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Admin access required',
    });
  }
});
```

### 7. Server Middleware

```typescript
// server/middleware/auth.ts
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  
  // Skip auth for public routes
  if (url.pathname.startsWith('/api/public/')) {
    return;
  }
  
  // Skip auth for login/register
  if (['/api/auth/login', '/api/auth/register'].includes(url.pathname)) {
    return;
  }
  
  const token = getHeader(event, 'Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }
  
  try {
    const config = useRuntimeConfig();
    const decoded = jwt.verify(token, config.jwtSecret);
    event.context.user = decoded;
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid token',
    });
  }
});
```

### 8. Component with Props and Slots

```vue
<!-- components/ui/Card.vue -->
<script setup lang="ts">
interface Props {
  title?: string;
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md',
});

const variantClasses = {
  default: 'bg-white',
  bordered: 'bg-white border border-gray-200',
  elevated: 'bg-white shadow-lg',
};

const paddingClasses = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};
</script>

<template>
  <div 
    :class="[
      'rounded-lg',
      variantClasses[variant],
      paddingClasses[padding]
    ]"
  >
    <header v-if="title || $slots.header" class="mb-4">
      <slot name="header">
        <h3 class="text-xl font-semibold">{{ title }}</h3>
      </slot>
    </header>
    
    <div class="content">
      <slot />
    </div>
    
    <footer v-if="$slots.footer" class="mt-4 pt-4 border-t">
      <slot name="footer" />
    </footer>
  </div>
</template>
```

## Best Practices

### 1. Auto-Import Awareness
- Components, composables, and utils are auto-imported
- Use explicit imports only when necessary
- Organize code in the designated directories

### 2. SSR Considerations
- Avoid direct browser APIs in setup
- Use `onMounted` for client-only code
- Check `import.meta.client` / `import.meta.server`

### 3. Data Fetching Strategy
- Use `useAsyncData` for SSR data
- Use `useFetch` for simpler cases
- Implement proper caching with keys

### 4. Performance Optimization
- Enable route-based code splitting
- Use lazy components (`Lazy` prefix)
- Implement proper caching strategies

### 5. TypeScript Integration
- Use strict mode in Nuxt config
- Define types for all API responses
- Use `typed-router` for route types

## Common Commands

```bash
# Development
nuxt dev              # Start dev server
nuxt dev -o           # Open in browser
nuxt dev --host       # Listen on all interfaces

# Building
nuxt build            # Build for production
nuxt generate         # Static site generation

# Production
nuxt preview          # Preview production build
node .output/server/index.mjs  # Start server

# Testing
vitest                # Run unit tests
vitest run            # Run once
vitest coverage       # With coverage
npx playwright test   # E2E tests

# Code Quality
npx eslint .          # Lint code
npx eslint . --fix    # Auto-fix
npx prettier --write . # Format code

# Analysis
nuxt analyze          # Bundle analysis
nuxi info             # Project info
nuxi typecheck        # Type checking
```

## Nuxt Modules

```typescript
// Commonly used modules
export default defineNuxtConfig({
  modules: [
    // State Management
    '@pinia/nuxt',
    
    // UI & Styling
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxtjs/google-fonts',
    
    // Data & API
    '@nuxtjs/apollo',
    '@nuxtjs/supabase',
    
    // SEO & Analytics
    '@nuxtjs/seo',
    '@nuxtjs/google-analytics',
    
    // Developer Experience
    '@nuxt/devtools',
    '@nuxt/image',
    
    // Forms & Validation
    '@vee-validate/nuxt',
    'nuxt-zod-i18n',
    
    // Internationalization
    '@nuxtjs/i18n',
    
    // PWA
    '@vite-pwa/nuxt',
  ],
});
```

## Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or use Git integration
```

### Netlify

```toml
# netlify.toml
[build]
  command = "npm run generate"
  publish = ".output/public"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Docker

```dockerfile
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.output ./.output
EXPOSE 3000
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
CMD ["node", ".output/server/index.mjs"]
```

### Static Hosting

```bash
# Generate static site
npm run generate

# Output in .output/public/
# Deploy to any static host
```

## Performance Tips

1. **Route Splitting**: Automatic with Nuxt
2. **Image Optimization**: Use `@nuxt/image`
3. **Lazy Loading**: Use `Lazy` prefix for components
4. **Caching**: Use `useAsyncData` with proper keys
5. **Bundle Analysis**: Run `nuxt analyze` regularly
6. **Server Components**: Use for heavy components

## Resources

- [Nuxt 3 Documentation](https://nuxt.com/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Nuxt Modules](https://nuxt.com/modules)

---

**Last Updated**: 2026-03-17
