# Deno 2 Advanced Template

## Tech Stack
- deno v2.x
- TypeScript 5+

## Core Patterns

### HTTP Server
```typescript
Deno.serve({ port: 8000 }, (req) => {
  const url = new URL(req.url);

  if (url.pathname === '/api/users') {
    return Response.json({ users: [] });
  }

  return new Response('Not Found', { status: 404 });
});
```

### File Operations
```typescript
const data = await Deno.readTextFile('./data.json');
await Deno.writeTextFile('./output.txt', 'Hello World');

for await (const entry of Deno.readDir('./src')) {
  console.log(entry.name);
}
```

### Oak Framework
```typescript
import { Application, Router } from 'https://deno.land/x/oak/mod.ts';

const app = new Application();
const router = new Router();

router.get('/api/users', (ctx) => {
  ctx.response.body = { users: [] };
});

router.post('/api/users', async (ctx) => {
  const body = await ctx.request.body().value;
  ctx.response.status = 201;
  ctx.response.body = body;
});

app.use(router.routes());
await app.listen({ port: 8000 });
```

### Fresh Framework
```typescript
// routes/index.tsx
export default function Home() {
  return (
    <main>
      <h1>Welcome to Fresh</h1>
    </main>
  );
}
```

## Common Commands

```bash
deno run --allow-net server.ts
deno compile --output=app server.ts
deno test
```

## Related Resources
- [Deno Documentation](https://docs.deno.com/)
