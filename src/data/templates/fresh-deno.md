# Fresh (Deno) Full-Stack Application Template

## Project Overview

Fresh is a next-generation web framework for Deno that delivers excellent performance through server-side rendering, islands architecture, and zero client-side JavaScript by default. It provides instant page loads with just-in-time rendering and edge deployment capabilities.

## Tech Stack

- **Runtime**: Deno 2.0+
- **Framework**: Fresh 1.6+
- **Language**: TypeScript (Deno native)
- **Rendering**: Server-Side Rendering (SSR) + Islands
- **Routing**: File-based routing
- **Styling**: Tailwind CSS / Twind
- **Testing**: Deno Test
- **Deployment**: Deno Deploy

## Project Structure

```
├── components/             # Reusable Preact components
│   ├── ui/                 # UI primitives
│   ├── forms/              # Form components
│   └── layout/             # Layout components
├── islands/                # Interactive components (client-side JS)
│   ├── Counter.tsx
│   ├── SearchBox.tsx
│   └── Modal.tsx
├── routes/                 # File-based routing
│   ├── index.tsx           # Home page
│   ├── about.tsx           # About page
│   ├── api/                # API routes
│   │   ├── users.ts
│   │   └── auth.ts
│   ├── blog/
│   │   ├── index.tsx
│   │   └── [slug].tsx      # Dynamic route
│   └── _app.tsx            # App wrapper
├── static/                 # Static assets
│   ├── favicon.ico
│   └── images/
├── data/                   # Data fetching
│   ├── db.ts
│   └── kv.ts
├── utils/                  # Utility functions
│   └── helpers.ts
├── types/                  # TypeScript types
│   └── index.ts
├── dev.ts                  # Development entry
├── main.ts                 # Production entry
└── deno.json               # Deno configuration
```

## Key Patterns

### 1. Route Definition

```tsx
// routes/index.tsx
import { Head } from '$fresh/runtime.ts';
import Counter from '../islands/Counter.tsx';

export default function Home() {
  return (
    <>
      <Head>
        <title>Fresh App</title>
      </Head>
      <div class="px-4 py-8 mx-auto bg-gray-100">
        <h1 class="text-4xl font-bold">Welcome to Fresh</h1>
        <Counter start={3} />
      </div>
    </>
  );
}
```

### 2. Islands Architecture (Interactive Components)

```tsx
// islands/Counter.tsx
import { useState } from 'preact/hooks';

interface CounterProps {
  start: number;
}

export default function Counter({ start }: CounterProps) {
  const [count, setCount] = useState(start);
  
  return (
    <div class="flex gap-2 items-center">
      <button 
        onClick={() => setCount(count - 1)}
        class="px-2 py-1 border rounded"
      >
        -1
      </button>
      <span class="text-xl font-bold">{count}</span>
      <button 
        onClick={() => setCount(count + 1)}
        class="px-2 py-1 border rounded"
      >
        +1
      </button>
    </div>
  );
}
```

### 3. API Routes

```ts
// routes/api/users.ts
import { Handlers } from '$fresh/server.ts';

interface User {
  id: string;
  name: string;
  email: string;
}

export const handler: Handlers<User[]> = {
  async GET(_req) {
    const users = await fetchUsers(); // Your data fetching
    return new Response(JSON.stringify(users), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
  
  async POST(req) {
    const body = await req.json();
    const user = await createUser(body);
    return new Response(JSON.stringify(user), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
```

### 4. Dynamic Routes

```tsx
// routes/blog/[slug].tsx
import { Head } from '$fresh/runtime.ts';
import { Handlers, PageProps } from '$fresh/server.ts';
import { getPostBySlug, getPostSlugs } from '../../data/posts.ts';

interface Post {
  slug: string;
  title: string;
  content: string;
  date: string;
}

export const handler: Handlers<Post, { slug: string }> = {
  async GET(_req, ctx) {
    const post = await getPostBySlug(ctx.params.slug);
    if (!post) {
      return ctx.renderNotFound();
    }
    return ctx.render(post);
  },
};

export default function BlogPost({ data: post }: PageProps<Post>) {
  return (
    <>
      <Head>
        <title>{post.title}</title>
      </Head>
      <article class="max-w-2xl mx-auto p-4">
        <h1 class="text-3xl font-bold mb-2">{post.title}</h1>
        <time class="text-gray-500">{post.date}</time>
        <div class="mt-4 prose">
          {post.content}
        </div>
      </article>
    </>
  );
}

// For static generation
export const config = {
  routeOverride: '/blog/:slug',
};

// Generate static paths
export const getStaticPaths = async () => {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({ params: { slug } }));
};
```

### 5. Deno KV Integration

```ts
// data/kv.ts
const kv = await Deno.openKv();

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export async function createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  const id = crypto.randomUUID();
  const newUser: User = {
    ...user,
    id,
    createdAt: new Date(),
  };
  
  await kv.set(['users', id], newUser);
  return newUser;
}

export async function getUser(id: string): Promise<User | null> {
  const result = await kv.get<User>(['users', id]);
  return result.value;
}

export async function getAllUsers(): Promise<User[]> {
  const users: User[] = [];
  const iter = kv.list<User>({ prefix: ['users'] });
  
  for await (const { value } of iter) {
    users.push(value);
  }
  
  return users;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const user = await getUser(id);
  if (!user) return null;
  
  const updated = { ...user, ...updates };
  await kv.set(['users', id], updated);
  return updated;
}

export async function deleteUser(id: string): Promise<boolean> {
  await kv.delete(['users', id]);
  return true;
}
```

### 6. Middleware

```tsx
// routes/_middleware.ts
import { MiddlewareHandlerContext } from '$fresh/server.ts';

interface State {
  user: { id: string; name: string } | null;
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (token) {
    ctx.state.user = await verifyToken(token);
  }
  
  const response = await ctx.next();
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  
  return response;
}

async function verifyToken(token: string) {
  // Your token verification logic
  return { id: '1', name: 'User' };
}
```

### 7. App Wrapper with Layout

```tsx
// routes/_app.tsx
import { AppProps } from '$fresh/server.ts';

export default function App({ Component }: AppProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/styles/globals.css" />
      </head>
      <body>
        <header class="bg-blue-600 text-white p-4">
          <nav class="flex gap-4">
            <a href="/" class="hover:underline">Home</a>
            <a href="/about" class="hover:underline">About</a>
            <a href="/blog" class="hover:underline">Blog</a>
          </nav>
        </header>
        <main class="container mx-auto p-4">
          <Component />
        </main>
        <footer class="bg-gray-200 p-4 text-center">
          © 2024 Fresh App
        </footer>
      </body>
    </html>
  );
}
```

## Best Practices

### 1. Use Islands Sparingly
- Only make components interactive when necessary
- Keep client-side JavaScript minimal
- Prefer server-side rendering for content

### 2. Leverage Deno's Security
- Explicit permission flags
- Secure-by-default approach
- No node_modules pollution

### 3. Optimize for Edge Deployment
- Use Deno KV for edge-compatible storage
- Avoid filesystem operations when possible
- Use streaming for large responses

### 4. Type Safety
- Leverage TypeScript throughout
- Use Deno's built-in type checking
- Import types explicitly

### 5. Error Handling

```tsx
// routes/_500.tsx - Custom error page
import { ErrorPageProps } from '$fresh/server.ts';

export default function Error500({ error }: ErrorPageProps) {
  return (
    <div class="p-4 bg-red-50">
      <h1 class="text-2xl font-bold text-red-800">Server Error</h1>
      <p class="text-red-600">{error.message}</p>
    </div>
  );
}

// routes/_404.tsx - Not found page
export default function NotFound() {
  return (
    <div class="p-4">
      <h1 class="text-2xl font-bold">404 - Page Not Found</h1>
      <a href="/" class="text-blue-600 hover:underline">Go Home</a>
    </div>
  );
}
```

## Common Commands

```bash
# Development
deno task dev           # Start dev server
deno task start         # Start production server
deno task build         # Build for production

# Testing
deno test               # Run all tests
deno test --watch       # Watch mode
deno test --coverage    # With coverage

# Type checking
deno check **/*.ts      # Type check all files
deno check main.ts      # Type check specific file

# Formatting
deno fmt                # Format all files
deno fmt --check        # Check formatting

# Linting
deno lint               # Lint code
deno lint --fix         # Auto-fix issues

# Cache management
deno cache --reload     # Reload cache
deno info mod.ts        # Module info

# Deploy
deployctl deploy        # Deploy to Deno Deploy
```

## Deno Configuration

```json
// deno.json
{
  "lock": false,
  "tasks": {
    "dev": "deno run -A --watch=static/,routes/ dev.ts",
    "start": "deno run -A main.ts",
    "build": "deno run -A dev.ts build",
    "preview": "deno run -A main.ts",
    "test": "deno test -A",
    "check": "deno check **/*.ts"
  },
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  },
  "imports": {
    "$fresh/": "https://deno.land/x/fresh@1.6.8/",
    "preact": "https://esm.sh/preact@10.19.6",
    "preact/": "https://esm.sh/preact@10.19.6/",
    "@preact/signals": "https://esm.sh/*@preact/signals@1.2.2",
    "@preact/signals-core": "https://esm.sh/*@preact/signals-core@1.5.1",
    "tailwindcss": "https://esm.sh/*tailwindcss@3.4.1",
    "tailwindcss/": "https://esm.sh/*tailwindcss@3.4.1/",
    "$std/": "https://deno.land/std@0.216.0/"
  },
  "exclude": ["**/_fresh/*"],
  "nodeModulesDir": "auto"
}
```

## Fresh Configuration

```ts
// fresh.config.ts
import { defineConfig } from '$fresh/server.ts';
import tailwind from '$fresh/plugins/tailwind.ts';

export default defineConfig({
  plugins: [tailwind()],
  router: {
    trailingSlash: false,
  },
  render: {
    useSuspense: true,
  },
  static: {
    maxAge: 86400,
  },
});
```

## Deployment

### Deno Deploy

```yaml
# .github/workflows/deploy.yml
name: Deploy to Deno Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v1
        with:
          deno-version: vx
      - run: deno task build
      - uses: denoland/deployctl@v1
        with:
          project: your-project-name
          entrypoint: main.ts
          root: .
```

### Self-Hosted

```bash
# Build and run
deno task build
deno task start

# With environment variables
deno task start --allow-net --allow-env
```

### Docker

```dockerfile
FROM denoland/deno:2.0.0

WORKDIR /app

COPY . .

RUN deno cache main.ts

EXPOSE 8000

CMD ["run", "-A", "main.ts"]
```

## Performance Tips

1. **Islands Optimization**: Only hydrate interactive components
2. **Streaming**: Use streaming responses for large data
3. **Caching**: Leverage Deno KV's built-in caching
4. **Edge Deployment**: Deploy to Deno Deploy for global edge
5. **Static Generation**: Pre-render pages where possible

## Resources

- [Fresh Documentation](https://fresh.deno.dev/)
- [Deno Manual](https://deno.land/manual)
- [Deno KV Documentation](https://deno.com/kv)
- [Preact Documentation](https://preactjs.com/)
- [Deno Deploy](https://deno.com/deploy)

---

**Last Updated**: 2026-03-17
