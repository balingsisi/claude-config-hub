# Bun 1.2 Advanced Template

## Tech Stack
- bun v1.2+
- TypeScript 5+
- React 18+

## Core Patterns

### HTTP Server
```typescript
Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/api/users') {
      return Response.json({ users: [] });
    }

    return new Response('Not Found', { status: 404 });
  },
});
```

### WebSocket
```typescript
Bun.serve({
  fetch(req, server) {
    const success = server.upgrade(req);
    if (success) return undefined;
    return new Response('WebSocket upgrade failed', { status: 400 });
  },
  websocket: {
    message(ws, message) {
      ws.send(`Echo: ${message}`);
    },
    open(ws) {
      console.log('Client connected');
    },
  },
});
```

### SQLite Database
```typescript
import { Database } from 'bun:sqlite';

const db = new Database('mydb.sqlite');

const query = db.query('SELECT * FROM users WHERE id = ?');
const user = query.get(1);

db.run('INSERT INTO users (name) VALUES (?)', ['Alice']);
```

### File I/O
```typescript
const file = Bun.file('./data.json');
const data = await file.json();

await Bun.write('./output.txt', 'Hello World');
```

### Hot Reloading
```typescript
// watch mode
Bun.serve({
  port: 3000,
  development: true,
  async fetch(req) {
    const module = await import('./handler.ts');
    return module.default(req);
  },
});
```

## Common Commands

```bash
bun init
bun run server.ts
bun build ./index.ts --outdir ./dist
bun test
```

## Related Resources
- [Bun Documentation](https://bun.sh/docs)
