# PartyKit Template

## Project Overview

Real-time collaborative applications with PartyKit - serverless infrastructure for multiplayer experiences, live cursors, presence, and real-time synchronization.

## Tech Stack

- **Platform**: PartyKit
- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Protocol**: WebSocket
- **State**: In-memory + Durable Objects
- **Integration**: React / Next.js / Any frontend

## Project Structure

```
partykit-project/
├── src/
│   ├── party/
│   │   ├── server.ts           # Main party server
│   │   ├── presence.ts         # Presence tracking
│   │   └── chat.ts             # Chat room logic
│   ├── client/
│   │   ├── usePartySocket.ts   # React hook
│   │   └── party-provider.tsx  # Context provider
│   └── types/
│       └── messages.ts         # Message types
├── partykit.json               # PartyKit config
├── package.json
├── tsconfig.json
└── wrangler.toml               # Deployment config
```

## Key Patterns

### 1. Basic Party Server

```typescript
// src/party/server.ts
import type * as Party from 'partykit/server';

interface User {
  id: string;
  name: string;
  cursor?: { x: number; y: number };
}

interface Message {
  type: 'join' | 'leave' | 'cursor' | 'chat';
  userId: string;
  data?: any;
  timestamp: number;
}

export default class MainParty implements Party.Server {
  users = new Map<string, User>();
  messages: Message[] = [];

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const userId = conn.id;
    const username = new URL(ctx.request.url).searchParams.get('name') || 'Anonymous';
    
    this.users.set(userId, { id: userId, name: username });
    
    // Send current state to new user
    conn.send(JSON.stringify({
      type: 'sync',
      users: Array.from(this.users.values()),
      messages: this.messages.slice(-100),
    }));
    
    // Broadcast join to everyone
    this.broadcast({
      type: 'join',
      userId,
      data: { name: username },
      timestamp: Date.now(),
    }, conn.id);
    
    console.log(`User ${username} joined. Total: ${this.users.size}`);
  }

  onMessage(conn: Party.Connection, message: string) {
    const msg = JSON.parse(message) as Message;
    const user = this.users.get(conn.id);
    
    if (!user) return;
    
    switch (msg.type) {
      case 'cursor':
        user.cursor = msg.data;
        this.users.set(conn.id, user);
        this.broadcast({ ...msg, userId: conn.id });
        break;
        
      case 'chat':
        const chatMsg = { ...msg, userId: conn.id, timestamp: Date.now() };
        this.messages.push(chatMsg);
        this.broadcast(chatMsg);
        break;
        
      default:
        this.broadcast({ ...msg, userId: conn.id });
    }
  }

  onClose(conn: Party.Connection) {
    const user = this.users.get(conn.id);
    this.users.delete(conn.id);
    
    this.broadcast({
      type: 'leave',
      userId: conn.id,
      data: { name: user?.name },
      timestamp: Date.now(),
    });
    
    console.log(`User ${user?.name} left. Total: ${this.users.size}`);
  }

  onError(conn: Party.Connection, err: Error) {
    console.error(`Connection ${conn.id} error:`, err);
    this.users.delete(conn.id);
  }

  private broadcast(message: Message, excludeId?: string) {
    const data = JSON.stringify(message);
    for (const [id, conn] of this.room.connections) {
      if (id !== excludeId) {
        conn.send(data);
      }
    }
  }
}

MainParty satisfies Party.Worker;
```

### 2. React Hook

```typescript
// src/client/usePartySocket.ts
import { useEffect, useRef, useState } from 'react';

interface UsePartySocketOptions {
  room: string;
  host?: string;
  query?: Record<string, string>;
  onMessage?: (event: MessageEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export function usePartySocket({
  room,
  host = 'localhost:1999',
  query = {},
  onMessage,
  onOpen,
  onClose,
  onError,
}: UsePartySocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED);

  useEffect(() => {
    const params = new URLSearchParams(query);
    const ws = new WebSocket(`ws://${host}/parties/main/${room}?${params}`);
    
    ws.onopen = () => {
      setReadyState(WebSocket.OPEN);
      onOpen?.();
    };
    
    ws.onmessage = (event) => {
      onMessage?.(event);
    };
    
    ws.onclose = () => {
      setReadyState(WebSocket.CLOSED);
      onClose?.();
    };
    
    ws.onerror = (error) => {
      onError?.(error);
    };
    
    wsRef.current = ws;
    setReadyState(WebSocket.CONNECTING);
    
    return () => {
      ws.close();
    };
  }, [room, host]);

  const send = (data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  return { send, readyState, ws: wsRef.current };
}
```

### 3. Presence Component

```tsx
// src/client/presence-provider.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePartySocket } from './use-party-socket';

interface User {
  id: string;
  name: string;
  cursor?: { x: number; y: number };
  color?: string;
}

interface PresenceContext {
  users: User[];
  sendMessage: (msg: any) => void;
  updateCursor: (x: number, y: number) => void;
}

const Context = createContext<PresenceContext | null>(null);

export function PresenceProvider({ 
  children, 
  room,
  username,
}: { 
  children: ReactNode;
  room: string;
  username: string;
}) {
  const [users, setUsers] = useState<User[]>([]);
  
  const { send } = usePartySocket({
    room,
    query: { name: username },
    onMessage: (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'sync':
          setUsers(data.users);
          break;
        case 'join':
          setUsers((prev) => [...prev, data.data]);
          break;
        case 'leave':
          setUsers((prev) => prev.filter((u) => u.id !== data.userId));
          break;
        case 'cursor':
          setUsers((prev) =>
            prev.map((u) =>
              u.id === data.userId ? { ...u, cursor: data.data } : u
            )
          );
          break;
      }
    },
  });

  const updateCursor = (x: number, y: number) => {
    send({ type: 'cursor', data: { x, y } });
  };

  return (
    <Context.Provider value={{ users, sendMessage: send, updateCursor }}>
      {children}
    </Context.Provider>
  );
}

export const usePresence = () => {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('usePresence must be used within PresenceProvider');
  return ctx;
};
```

### 4. Cursor Tracking

```tsx
// src/components/CursorOverlay.tsx
import { usePresence } from '../client/presence-provider';

export function CursorOverlay() {
  const { users } = usePresence();

  return (
    <div className="fixed inset-0 pointer-events-none">
      {users
        .filter((u) => u.cursor)
        .map((user) => (
          <div
            key={user.id}
            className="absolute transition-all duration-100"
            style={{
              left: user.cursor!.x,
              top: user.cursor!.y,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={user.color || '#00f'}
            >
              <path d="M5.65 3.15l14.7 7.35-6.23 1.87-1.87 6.23-6.6-15.45z" />
            </svg>
            <span className="ml-4 text-xs bg-black text-white px-2 py-1 rounded">
              {user.name}
            </span>
          </div>
        ))}
    </div>
  );
}
```

### 5. Chat Room

```typescript
// src/party/chat.ts
import type * as Party from 'partykit/server';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

export default class ChatRoom implements Party.Server {
  messages: ChatMessage[] = [];
  maxMessages = 500;

  constructor(readonly room: Party.Room) {}

  async onStart() {
    // Load persisted messages
    const stored = await this.room.storage.get<ChatMessage[]>('messages');
    if (stored) {
      this.messages = stored;
    }
  }

  onMessage(conn: Party.Connection, message: string) {
    const { type, text, username } = JSON.parse(message);
    
    if (type === 'chat') {
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        userId: conn.id,
        username,
        text,
        timestamp: Date.now(),
      };
      
      this.messages.push(msg);
      
      // Trim old messages
      if (this.messages.length > this.maxMessages) {
        this.messages = this.messages.slice(-this.maxMessages);
      }
      
      // Persist (debounced in production)
      this.room.storage.put('messages', this.messages);
      
      // Broadcast
      this.broadcast(msg);
    }
  }

  private broadcast(message: ChatMessage) {
    const data = JSON.stringify(message);
    for (const conn of this.room.connections.values()) {
      conn.send(data);
    }
  }
}

ChatRoom satisfies Party.Worker;
```

### 6. Hibernation (Durable Objects)

```typescript
// src/party/durable-party.ts
import type * as Party from 'partykit/server';

// Enable hibernation for long-running parties
export default class DurableParty implements Party.Server {
  options: Party.ServerOptions = {
    hibernate: true,
  };

  state: any = null;

  constructor(readonly room: Party.Room) {}

  async onStart() {
    this.state = await this.room.storage.get('state');
  }

  async onRequest(req: Party.Request) {
    if (req.method === 'GET') {
      return Response.json({ state: this.state });
    }
    
    if (req.method === 'POST') {
      const data = await req.json();
      this.state = { ...this.state, ...data };
      await this.room.storage.put('state', this.state);
      return Response.json({ success: true });
    }
    
    return new Response('Method not allowed', { status: 405 });
  }

  onMessage(conn: Party.Connection, message: string) {
    // Handle WebSocket messages
    const data = JSON.parse(message);
    conn.send(JSON.stringify({ echo: data }));
  }
}
```

## Configuration

### partykit.json

```json
{
  "$schema": "https://www.partykit.io/schema.json",
  "name": "my-party-app",
  "main": "src/party/server.ts",
  "parties": {
    "main": "src/party/server.ts",
    "chat": "src/party/chat.ts",
    "presence": "src/party/presence.ts"
  },
  "serve": {
    "path": "./public",
    "build": "npm run build"
  },
  "vars": {
    "API_URL": "https://api.example.com"
  }
}
```

### wrangler.toml (for deployment)

```toml
name = "my-partykit-app"
main = "src/party/server.ts"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "production"
```

## Deployment

### Development

```bash
# Install CLI
npm install -g partykit

# Run dev server
partykit dev

# With custom port
partykit dev --port 3001
```

### Production

```bash
# Login to PartyKit
partykit login

# Deploy
partykit deploy

# Deploy to specific environment
partykit deploy --env staging

# View logs
partykit logs

# Manage rooms
partykit list
partykit delete <room-name>
```

### Environment Variables

```bash
# Set secrets
partykit secret set API_KEY my-secret-key

# List secrets
partykit secret list
```

## Testing

```typescript
// test/party.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import PartySocket from 'partysocket';

describe('Party Server', () => {
  let client1: PartySocket;
  let client2: PartySocket;

  beforeAll(() => {
    client1 = new PartySocket({
      host: 'localhost:1999',
      room: 'test-room',
      party: 'main',
    });

    client2 = new PartySocket({
      host: 'localhost:1999',
      room: 'test-room',
      party: 'main',
    });
  });

  afterAll(() => {
    client1.close();
    client2.close();
  });

  test('users can join and see each other', async () => {
    const messages: any[] = [];
    
    client1.addEventListener('message', (e) => {
      messages.push(JSON.parse(e.data));
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(messages.some((m) => m.type === 'join')).toBe(true);
  });
});
```

## Best Practices

### 1. Message Throttling

```typescript
// Throttle cursor updates
import { throttle } from 'lodash-es';

const throttledSend = throttle(send, 50); // 20 fps

onMouseMove((e) => {
  throttledSend({ type: 'cursor', data: { x: e.clientX, y: e.clientY } });
});
```

### 2. Reconnection Logic

```typescript
// Automatic reconnection with backoff
let retryCount = 0;
const maxRetries = 5;

function connect() {
  const ws = new WebSocket(url);
  
  ws.onclose = () => {
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000;
      setTimeout(connect, delay);
      retryCount++;
    }
  };
  
  ws.onopen = () => {
    retryCount = 0;
  };
}
```

### 3. State Management

```typescript
// Keep server state small
export default class OptimizedParty implements Party.Server {
  // Only store essential data
  connections = new Map<string, { id: string; joinedAt: number }>();
  
  // Offload to external storage
  async persistState() {
    await this.room.storage.put('connections', Array.from(this.connections));
  }
}
```

### 4. Security

```typescript
// Validate messages
import { z } from 'zod';

const MessageSchema = z.object({
  type: z.enum(['chat', 'cursor', 'join']),
  data: z.any(),
});

onMessage(conn, message) {
  const result = MessageSchema.safeParse(JSON.parse(message));
  if (!result.success) {
    conn.send(JSON.stringify({ error: 'Invalid message' }));
    return;
  }
  
  // Process validated message
}
```

## Resources

- [PartyKit Documentation](https://docs.partykit.io/)
- [PartyKit GitHub](https://github.com/partykit/partykit)
- [Real-time Patterns](https://docs.partykit.io/guides/realtime-basics)
- [Examples](https://github.com/partykit/partykit/tree/main/examples)
