# Vite + React Application Template

## Project Overview

Lightning-fast React application built with Vite, featuring instant hot module replacement, optimized builds, and modern development experience.

## Tech Stack

- **Build Tool**: Vite 5
- **Framework**: React 18
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State**: Zustand / React Query
- **Testing**: Vitest + Playwright

## Project Structure

```
src/
├── components/             # Reusable components
│   ├── ui/                 # UI primitives
│   ├── forms/              # Form components
│   └── layout/             # Layout components
├── pages/                  # Page components
│   ├── Home.tsx
│   ├── About.tsx
│   └── NotFound.tsx
├── hooks/                  # Custom hooks
│   ├── useAuth.ts
│   └── useApi.ts
├── services/               # API services
│   ├── api.ts
│   └── auth.ts
├── stores/                 # State management
│   └── userStore.ts
├── utils/                  # Utility functions
│   └── helpers.ts
├── types/                  # TypeScript types
│   └── index.ts
├── App.tsx                 # Root component
├── main.tsx                # Entry point
└── vite-env.d.ts           # Vite types
```

## Key Patterns

### 1. App Setup

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
```

### 2. Router Configuration

```tsx
// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
```

### 3. Custom Hook with React Query

```tsx
// src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../services/api';

export function useUsers() {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  });
  
  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
  
  return {
    users: data,
    isLoading,
    error,
    createUser: createMutation.mutate,
  };
}
```

### 4. Zustand Store

```tsx
// src/stores/userStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'user-storage',
    }
  )
);
```

### 5. API Service

```tsx
// src/services/api.ts
const BASE_URL = import.meta.env.VITE_API_URL;

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}

export const usersApi = {
  getAll: () => fetchApi<User[]>('/users'),
  getById: (id: string) => fetchApi<User>(`/users/${id}`),
  create: (data: Partial<User>) => 
    fetchApi<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
```

### 6. Environment Variables

```typescript
// .env.local
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=My App

// Access in code
const apiUrl = import.meta.env.VITE_API_URL;
```

## Best Practices

1. **Component Organization**: Keep components small and focused
2. **Custom Hooks**: Extract logic into reusable hooks
3. **Type Safety**: Use TypeScript strict mode
4. **Lazy Loading**: Use React.lazy for code splitting
5. **Error Boundaries**: Handle errors gracefully

## Common Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Preview production
pnpm preview

# Type checking
pnpm type-check

# Linting
pnpm lint

# Test
pnpm test

# E2E test
pnpm test:e2e
```

## Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
```

## Performance Tips

1. **Code Splitting**: Use React.lazy for route-based splitting
2. **Tree Shaking**: Vite does this automatically
3. **Asset Optimization**: Use Vite's built-in optimization
4. **Preloading**: Use `<link rel="preload">` for critical assets
5. **Bundle Analysis**: Use rollup-plugin-visualizer

## Deployment

### Vercel

```bash
pnpm build
# Deploy automatically
```

### Netlify

```bash
pnpm build
# Deploy `dist` directory
```

### Docker

```dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN pnpm install
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
