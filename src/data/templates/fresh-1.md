# Fresh 1.x Template

## Project Overview

Modern full-stack web framework for Deno with Fresh 1.x, featuring server-side rendering, islands architecture, zero configuration, and TypeScript-first development.

## Tech Stack

- **Framework**: Fresh 1.x
- **Runtime**: Deno 2.x
- **Language**: TypeScript
- **Styling**: Twind / Tailwind CSS
- **Deployment**: Deno Deploy / Self-hosted
- **Package Manager**: Deno (no package.json)

## Project Structure

```
project/
├── components/              # UI components
│   ├── Button.tsx
│   ├── Header.tsx
│   └── Footer.tsx
├── islands/                 # Interactive islands
│   ├── Counter.tsx
│   ├── ThemeSwitcher.tsx
│   └── Form.tsx
├── routes/                  # File-based routing
│   ├── index.tsx            # Home page
│   ├── about.tsx            # About page
│   ├── api/
│   │   ├── users.ts         # API endpoint
│   │   └── posts.ts         # API endpoint
│   ├── blog/
│   │   ├── index.tsx        # Blog listing
│   │   └── [slug].tsx       # Dynamic blog post
│   └── _app.tsx             # App wrapper
├── static/                  # Static assets
│   ├── favicon.ico
│   └── images/
├── fresh.gen.ts             # Generated routes
├── deno.json                # Deno configuration
├── main.ts                  # Entry point
└── dev.ts                   # Development server
```

## Key Patterns

### 1. Deno Configuration

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
    "$std/": "https://deno.land/std@0.208.0/"
  },
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
}
```

### 2. Main Entry Point

```typescript
// main.ts
import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";

await start(manifest, config);
```

```typescript
// dev.ts
#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";

await dev(import.meta.url, "./main.ts", config);
```

### 3. App Wrapper

```tsx
// routes/_app.tsx
import { AppProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function App({ Component }: AppProps) {
  return (
    <html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My Fresh App</title>
        <link rel="stylesheet" href="/styles/globals.css" />
      </Head>
      <body>
        <Component />
      </body>
    </html>
  );
}
```

### 4. Route Handler

```tsx
// routes/index.tsx
import { Head } from "$fresh/runtime.ts";
import Counter from "../islands/Counter.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>Fresh App</title>
      </Head>
      <div class="px-4 py-8 mx-auto bg-gray-900 min-h-screen">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
          <h1 class="text-4xl font-bold text-white mb-6">
            Welcome to Fresh
          </h1>
          <div class="mb-8">
            <Counter start={3} />
          </div>
        </div>
      </div>
    </>
  );
}
```

### 5. Island Component

```tsx
// islands/Counter.tsx
import { useState } from "preact/hooks";

interface CounterProps {
  start: number;
}

export default function Counter(props: CounterProps) {
  const [count, setCount] = useState(props.start);
  
  return (
    <div class="flex gap-2 items-center">
      <button
        class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        onClick={() => setCount(count - 1)}
      >
        -1
      </button>
      <p class="text-3xl tabular-nums text-white">{count}</p>
      <button
        class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        onClick={() => setCount(count + 1)}
      >
        +1
      </button>
    </div>
  );
}
```

### 6. API Routes

```typescript
// routes/api/users.ts
import { Handlers } from "$fresh/server.ts";

interface User {
  id: string;
  name: string;
  email: string;
}

export const handler: Handlers<User[]> = {
  async GET(_req, _ctx) {
    const users: User[] = [
      { id: "1", name: "John Doe", email: "john@example.com" },
      { id: "2", name: "Jane Doe", email: "jane@example.com" },
    ];
    
    return new Response(JSON.stringify(users), {
      headers: { "Content-Type": "application/json" },
    });
  },
  
  async POST(req, _ctx) {
    const body = await req.json();
    const newUser: User = {
      id: crypto.randomUUID(),
      ...body,
    };
    
    return new Response(JSON.stringify(newUser), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  },
};
```

### 7. Dynamic Routes

```tsx
// routes/blog/[slug].tsx
import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";

interface BlogPost {
  slug: string;
  title: string;
  content: string;
  author: string;
  date: string;
}

export const handler: Handlers<BlogPost> = {
  async GET(_req, ctx) {
    const { slug } = ctx.params;
    
    // Fetch post from database or CMS
    const post: BlogPost = {
      slug,
      title: "My Blog Post",
      content: "This is the blog content...",
      author: "John Doe",
      date: new Date().toISOString(),
    };
    
    return ctx.render(post);
  },
};

export default function BlogPost({ data }: PageProps<BlogPost>) {
  return (
    <>
      <Head>
        <title>{data.title}</title>
        <meta name="description" content={data.content} />
      </Head>
      <article class="max-w-2xl mx-auto px-4 py-8">
        <header class="mb-8">
          <h1 class="text-4xl font-bold mb-2">{data.title}</h1>
          <div class="text-gray-600">
            <span>{data.author}</span>
            <span class="mx-2">•</span>
            <time>{new Date(data.date).toLocaleDateString()}</time>
          </div>
        </header>
        <div class="prose prose-lg">
          {data.content}
        </div>
      </article>
    </>
  );
}
```

### 8. Form Handling

```tsx
// islands/Form.tsx
import { useState } from "preact/hooks";

interface FormData {
  email: string;
  message: string;
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    message: "",
  });
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setStatus("loading");
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setStatus("success");
        setFormData({ email: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };
  
  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={formData.email}
          onInput={(e) => setFormData({ ...formData, email: e.currentTarget.value })}
          class="w-full px-3 py-2 border rounded"
          required
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-1">Message</label>
        <textarea
          value={formData.message}
          onInput={(e) => setFormData({ ...formData, message: e.currentTarget.value })}
          class="w-full px-3 py-2 border rounded"
          rows={4}
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={status === "loading"}
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {status === "loading" ? "Sending..." : "Send Message"}
      </button>
      
      {status === "success" && (
        <p class="text-green-600">Message sent successfully!</p>
      )}
      {status === "error" && (
        <p class="text-red-600">Failed to send message.</p>
      )}
    </form>
  );
}
```

## Best Practices

1. **Islands Architecture**: Use islands only for interactive components
2. **Server-Side Rendering**: Leverage SSR for SEO and performance
3. **Zero Client JS**: Minimize JavaScript shipped to client
4. **Edge Deployment**: Use Deno Deploy for global distribution
5. **Type Safety**: Use TypeScript throughout the application

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

# Check types
deno check main.ts

# Format code
deno fmt

# Lint code
deno lint

# Install dependencies
deno cache main.ts

# Update Fresh
deno run -A -r https://fresh.deno.dev/update .
```

## Styling with Twind

```typescript
// fresh.config.ts
import { defineConfig } from "$fresh/server.ts";
import twind from "$fresh/plugins/twind.ts";
import twindConfig from "./twind.config.ts";

export default defineConfig({
  plugins: [twind(twindConfig)],
});
```

```typescript
// twind.config.ts
import { defineConfig } from "twind";

export default defineConfig({
  selfURL: import.meta.url,
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",
        secondary: "#8B5CF6",
      },
    },
  },
});
```

## Database Integration

```typescript
// lib/database.ts
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const pool = new Pool({
  hostname: Deno.env.get("DB_HOST") || "localhost",
  port: 5432,
  database: Deno.env.get("DB_NAME") || "mydb",
  user: Deno.env.get("DB_USER") || "postgres",
  password: Deno.env.get("DB_PASSWORD") || "",
}, 10);

export async function query<T>(sql: string, args: any[] = []) {
  const client = await pool.connect();
  try {
    const result = await client.queryObject<T>(sql, args);
    return result.rows;
  } finally {
    client.release();
  }
}
```

```typescript
// routes/api/posts.ts
import { Handlers } from "$fresh/server.ts";
import { query } from "../../lib/database.ts";

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: Date;
}

export const handler: Handlers<Post[]> = {
  async GET() {
    const posts = await query<Post>(
      "SELECT id, title, content, created_at FROM posts ORDER BY created_at DESC"
    );
    
    return new Response(JSON.stringify(posts), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
```

## Middleware

```typescript
// routes/_middleware.ts
import { MiddlewareHandlerContext } from "$fresh/server.ts";

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext
) {
  // Log request
  console.log(`${req.method} ${req.url}`);
  
  // Add custom header
  const response = await ctx.next();
  response.headers.set("X-Powered-By", "Fresh");
  
  return response;
}
```

## Authentication

```typescript
// lib/auth.ts
import { decode, encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";
import { create, getNumericDate, verify } from "https://deno.land/x/djwt@v2.9.1/mod.ts";

const cryptoKey = await crypto.subtle.importKey(
  "raw",
  decode(Deno.env.get("JWT_SECRET") || ""),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"]
);

export async function createToken(userId: string) {
  const payload = {
    sub: userId,
    exp: getNumericDate(60 * 60 * 24), // 24 hours
  };
  
  return await create({ alg: "HS256", typ: "JWT" }, payload, cryptoKey);
}

export async function verifyToken(token: string) {
  try {
    const payload = await verify(token, cryptoKey);
    return payload.sub as string;
  } catch {
    return null;
  }
}
```

```typescript
// routes/dashboard.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { verifyToken } from "../lib/auth.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const cookies = req.headers.get("cookie") || "";
    const token = cookies.split(";")
      .find(c => c.trim().startsWith("token="))
      ?.split("=")[1];
    
    if (!token) {
      return new Response("", {
        status: 302,
        headers: { Location: "/login" },
      });
    }
    
    const userId = await verifyToken(token);
    if (!userId) {
      return new Response("", {
        status: 302,
        headers: { Location: "/login" },
      });
    }
    
    return ctx.render({ userId });
  },
};

export default function Dashboard({ data }: PageProps<{ userId: string }>) {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>User ID: {data.userId}</p>
    </div>
  );
}
```

## Server-Sent Events

```typescript
// routes/api/events.ts
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET() {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        const interval = setInterval(() => {
          const data = { time: new Date().toISOString() };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        }, 1000);
        
        // Cleanup on close
        setTimeout(() => {
          clearInterval(interval);
          controller.close();
        }, 60000);
      },
    });
    
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  },
};
```

## Deployment

### Deno Deploy

```bash
# Install deployctl
deno install -A jsr:@deno/deployctl

# Deploy
deployctl deploy --project=my-fresh-app main.ts
```

### Self-hosted

```bash
# Build
deno task build

# Run production server
deno run -A main.ts
```

## Environment Variables

```typescript
// .env (use dotenv for local development)
DATABASE_URL=postgres://user:pass@localhost:5432/mydb
JWT_SECRET=your-secret-key
API_KEY=your-api-key
```

```typescript
// Access environment variables
const dbUrl = Deno.env.get("DATABASE_URL");
const apiKey = Deno.env.get("API_KEY");
```

## Performance Optimization

1. **Edge Caching**: Use Deno Deploy edge cache
2. **Static Assets**: Cache static files aggressively
3. **Island Hydration**: Lazy load islands
4. **Image Optimization**: Use responsive images
5. **Code Splitting**: Automatic with Fresh

## Resources

- [Fresh Documentation](https://fresh.deno.dev/)
- [Deno Manual](https://deno.land/manual)
- [Preact Documentation](https://preactjs.com/)
- [Twind Documentation](https://twind.style/)
- [Deno Deploy](https://deno.com/deploy)
