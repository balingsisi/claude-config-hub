# Fresh Full-Stack Template (Deno)

## Project Overview

Next-gen web framework for Deno with Fresh, featuring server-side rendering, islands architecture, zero configuration, and edge deployment.

## Tech Stack

- **Framework**: Fresh 1.6+
- **Runtime**: Deno 1.40+
- **Language**: TypeScript / JSX
- **Styling**: Twind / Tailwind CSS
- **Rendering**: Server-Side Rendering (SSR)
- **Architecture**: Islands Architecture

## Project Structure

```
fresh-project/
├── routes/
│   ├── index.tsx              # Home page
│   ├── about.tsx              # About page
│   ├── api/
│   │   ├── users.ts           # API endpoints
│   │   └── auth.ts
│   ├── blog/
│   │   ├── index.tsx
│   │   └── [slug].tsx        # Dynamic route
│   └── _app.tsx               # App wrapper
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── Button.tsx
├── islands/
│   ├── Counter.tsx            # Interactive component
│   └── ThemeToggle.tsx
├── static/
│   ├── favicon.ico
│   └── logo.svg
├── deno.json                  # Deno configuration
├── fresh.config.ts            # Fresh configuration
├── twind.config.ts            # Twind configuration
└── dev.ts                     # Development entry
```

## Key Patterns

### 1. Fresh Configuration

```typescript
// fresh.config.ts
import { defineConfig } from "$fresh/server.ts";

export default defineConfig({
  plugins: [
    // Add plugins here
  ],
  router: {
    trailingSlash: false,
  },
  staticDir: "./static",
});
```

```json
// deno.json
{
  "lock": false,
  "tasks": {
    "start": "deno run -A --watch=static/,routes/ dev.ts",
    "build": "deno run -A dev.ts build",
    "preview": "deno run -A main.ts"
  },
  "imports": {
    "$fresh/": "https://deno.land/x/fresh@1.6.8/",
    "preact": "https://esm.sh/preact@10.19.3",
    "preact/": "https://esm.sh/preact@10.19.3/",
    "@preact/signals": "https://esm.sh/*@preact/signals@1.2.2",
    "@preact/signals-core": "https://esm.sh/*@preact/signals-core@1.5.1",
    "tailwindcss": "npm:tailwindcss@3.4.1",
    "tailwindcss/": "npm:/tailwindcss@3.4.1/",
    "tailwindcss/plugin": "npm:/tailwindcss@3.4.1/plugin.js",
    "$std/": "https://deno.land/std@0.216.0/"
  },
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  },
  "nodeModulesDir": true
}
```

### 2. Route Handlers

```typescript
// routes/index.tsx
import { Head } from "$fresh/runtime.ts";

export default function Home() {
  return (
    <>
      <Head>
        <title>Fresh App</title>
        <meta name="description" content="A Fresh application" />
      </Head>
      <div class="px-4 py-8 mx-auto bg-gray-100">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
          <h1 class="text-4xl font-bold">Welcome to Fresh</h1>
          <p class="mt-4 text-gray-600">
            The next-gen web framework for Deno
          </p>
          <a href="/about" class="mt-6 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Learn More
          </a>
        </div>
      </div>
    </>
  );
}
```

```typescript
// routes/blog/[slug].tsx
import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";

interface BlogPost {
  slug: string;
  title: string;
  content: string;
  date: string;
}

export const handler: Handlers<BlogPost> = {
  async GET(_req, ctx) {
    const { slug } = ctx.params;
    
    // Fetch blog post
    const post = await getBlogPost(slug);
    
    if (!post) {
      return ctx.renderNotFound();
    }
    
    return ctx.render(post);
  },
};

export default function BlogPost({ data }: PageProps<BlogPost>) {
  return (
    <>
      <Head>
        <title>{data.title}</title>
      </Head>
      <article class="max-w-screen-md mx-auto p-8">
        <h1 class="text-4xl font-bold">{data.title}</h1>
        <time class="text-gray-500">{data.date}</time>
        <div class="mt-8 prose">
          {data.content}
        </div>
      </article>
    </>
  );
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  // Fetch from database or file system
  return {
    slug,
    title: "My Blog Post",
    content: "This is the content...",
    date: "2024-01-15",
  };
}
```

### 3. API Routes

```typescript
// routes/api/users.ts
import { Handlers } from "$fresh/server.ts";

interface User {
  id: string;
  name: string;
  email: string;
}

export const handler: Handlers<User | User[]> = {
  async GET(_req) {
    const users = await getUsers();
    return new Response(JSON.stringify(users), {
      headers: { "Content-Type": "application/json" },
    });
  },

  async POST(req) {
    const body = await req.json();
    const user = await createUser(body);
    
    return new Response(JSON.stringify(user), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  },
};

async function getUsers(): Promise<User[]> {
  return [
    { id: "1", name: "John Doe", email: "john@example.com" },
    { id: "2", name: "Jane Smith", email: "jane@example.com" },
  ];
}

async function createUser(data: Partial<User>): Promise<User> {
  return {
    id: "3",
    name: data.name || "",
    email: data.email || "",
  };
}
```

### 4. Islands (Interactive Components)

```typescript
// islands/Counter.tsx
import { useSignal } from "@preact/signals";

export default function Counter() {
  const count = useSignal(0);

  return (
    <div class="flex gap-8 py-6">
      <button
        class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        onClick={() => count.value--}
      >
        -1
      </button>
      <p class="text-3xl tabular-nums">{count}</p>
      <button
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        onClick={() => count.value++}
      >
        +1
      </button>
    </div>
  );
}
```

```typescript
// islands/ThemeToggle.tsx
import { useSignal, useSignalEffect } from "@preact/signals";

export default function ThemeToggle() {
  const isDark = useSignal(false);

  useSignalEffect(() => {
    if (isDark.value) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  });

  return (
    <button
      class="p-2 rounded-lg bg-gray-200 dark:bg-gray-800"
      onClick={() => isDark.value = !isDark.value}
    >
      {isDark.value ? "🌙" : "☀️"}
    </button>
  );
}
```

### 5. App Wrapper

```typescript
// routes/_app.tsx
import { AppProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function App({ Component }: AppProps) {
  return (
    <html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/styles/globals.css" />
      </Head>
      <body class="bg-white dark:bg-gray-900">
        <Component />
      </body>
    </html>
  );
}
```

### 6. Styling with Twind

```typescript
// twind.config.ts
import { Options } from "$fresh/plugins/twind.ts";

export default {
  selfURL: import.meta.url,
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
      },
    },
  },
} as Options;
```

```typescript
// dev.ts
import "$std/dotenv/load.ts";
import { dev } from "$fresh/dev.ts";
import config from "./fresh.config.ts";

import twindPlugin from "$fresh/plugins/twind.ts";
import twindConfig from "./twind.config.ts";

config.plugins = [twindPlugin(twindConfig)];

await dev(import.meta.url, "./main.ts", config);
```

### 7. Server-Side Data Fetching

```typescript
// routes/dashboard.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

interface DashboardData {
  stats: {
    users: number;
    revenue: number;
    orders: number;
  };
}

export const handler: Handlers<DashboardData> = {
  async GET(_req, ctx) {
    // Fetch data server-side
    const stats = await fetchStats();
    
    return ctx.render({ stats });
  },
};

export default function Dashboard({ data }: PageProps<DashboardData>) {
  return (
    <>
      <Head>
        <title>Dashboard</title>
      </Head>
      <div class="max-w-screen-md mx-auto p-8">
        <h1 class="text-3xl font-bold mb-6">Dashboard</h1>
        <div class="grid grid-cols-3 gap-4">
          <div class="p-6 bg-white rounded-lg shadow">
            <p class="text-gray-500">Users</p>
            <p class="text-2xl font-bold">{data.stats.users}</p>
          </div>
          <div class="p-6 bg-white rounded-lg shadow">
            <p class="text-gray-500">Revenue</p>
            <p class="text-2xl font-bold">${data.stats.revenue}</p>
          </div>
          <div class="p-6 bg-white rounded-lg shadow">
            <p class="text-gray-500">Orders</p>
            <p class="text-2xl font-bold">{data.stats.orders}</p>
          </div>
        </div>
      </div>
    </>
  );
}

async function fetchStats() {
  return {
    users: 1234,
    revenue: 45678,
    orders: 567,
  };
}
```

### 8. Middleware

```typescript
// routes/_middleware.ts
import { MiddlewareHandlerContext } from "$fresh/server.ts";

interface State {
  user?: {
    id: string;
    name: string;
  };
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  // Check authentication
  const authHeader = req.headers.get("Authorization");
  
  if (authHeader) {
    ctx.state.user = await verifyToken(authHeader);
  }
  
  // Continue to next handler
  const response = await ctx.next();
  
  // Add custom headers
  response.headers.set("X-Powered-By", "Fresh");
  
  return response;
}

async function verifyToken(token: string) {
  // Verify JWT token
  return { id: "1", name: "John Doe" };
}
```

## Best Practices

1. **Islands Architecture**: Use islands only for interactive components
2. **Server-Side Rendering**: Fetch data server-side when possible
3. **Zero Client JS**: Minimize client-side JavaScript
4. **Edge Deployment**: Deploy to Deno Deploy for edge performance
5. **File-Based Routing**: Use file system for route structure

## Common Commands

```bash
# Start development server
deno task start

# Build for production
deno task build

# Preview production build
deno task preview

# Run tests
deno test

# Format code
deno fmt

# Lint code
deno lint

# Cache dependencies
deno cache dev.ts
```

## Dependencies

```json
// deno.json imports
{
  "imports": {
    "$fresh/": "https://deno.land/x/fresh@1.6.8/",
    "preact": "https://esm.sh/preact@10.19.3",
    "preact/": "https://esm.sh/preact@10.19.3/",
    "@preact/signals": "https://esm.sh/*@preact/signals@1.2.2",
    "tailwindcss": "npm:tailwindcss@3.4.1",
    "$std/": "https://deno.land/std@0.216.0/"
  }
}
```

## Deployment

### Deno Deploy

```typescript
// main.ts
import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";

await start(manifest, config);
```

```bash
# Deploy to Deno Deploy
deployctl deploy --project=my-app main.ts
```

### Docker

```dockerfile
FROM denoland/deno:alpine

WORKDIR /app

COPY . .

RUN deno cache main.ts

EXPOSE 8000

CMD ["run", "--allow-all", "main.ts"]
```

### Self-Hosted

```bash
# Build
deno task build

# Run
deno task preview
```

## Testing

```typescript
// tests/routes_test.ts
import { assertEquals } from "$std/testing/asserts.ts";

Deno.test("GET / should return 200", async () => {
  const response = await fetch("http://localhost:8000/");
  assertEquals(response.status, 200);
});

Deno.test("GET /api/users should return users", async () => {
  const response = await fetch("http://localhost:8000/api/users");
  const users = await response.json();
  assertEquals(Array.isArray(users), true);
});
```

## Route Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| `index.tsx` | Home route | `/` |
| `about.tsx` | Static route | `/about` |
| `[id].tsx` | Dynamic segment | `/123` |
| `[...slug].tsx` | Catch-all | `/blog/a/b/c` |
| `_app.tsx` | App wrapper | - |
| `_middleware.ts` | Middleware | - |
| `api/users.ts` | API route | `/api/users` |

## Performance Tips

1. **Use Islands Sparingly**: Only make interactive parts islands
2. **Static Generation**: Pre-render static pages
3. **Edge Caching**: Cache responses at the edge
4. **Lazy Loading**: Lazy load islands
5. **Minimize Dependencies**: Keep bundle size small

## Resources

- [Fresh Documentation](https://fresh.deno.dev/)
- [Fresh GitHub](https://github.com/denoland/fresh)
- [Deno Documentation](https://deno.land/manual)
- [Preact Documentation](https://preactjs.com/)
- [Deno Deploy](https://deno.com/deploy)
- [Twind Documentation](https://twind.style/)
