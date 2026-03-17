# Socket.io Real-Time Communication Template

## Project Overview

Socket.io is a JavaScript library that enables real-time, bidirectional, event-based communication between web clients and servers. It builds on WebSocket, providing additional features like fallback to HTTP long-polling, automatic reconnection, and room-based broadcasting.

## Tech Stack

- **Library**: Socket.io 4.x
- **Server**: Node.js 20+ / Express / Fastify
- **Client**: Socket.io-client
- **Authentication**: JWT / Session-based
- **Redis**: socket.io-redis-adapter (for scaling)
- **Monitoring**: Socket.io Admin UI / Prometheus

## Project Structure

```
├── src/
│   ├── server/
│   │   ├── index.ts              # Server entry point
│   │   ├── app.ts                # Express/Fastify app
│   │   ├── socket.ts             # Socket.io server setup
│   │   ├── config/
│   │   │   ├── index.ts
│   │   │   └── socket.ts         # Socket.io config
│   │   ├── middlewares/
│   │   │   ├── auth.ts           # Socket authentication
│   │   │   ├── rate-limit.ts     # Rate limiting
│   │   │   └── logging.ts        # Logging middleware
│   │   ├── handlers/             # Event handlers
│   │   │   ├── index.ts
│   │   │   ├── connection.ts     # Connection handler
│   │   │   ├── chat.ts           # Chat events
│   │   │   ├── notifications.ts  # Notification events
│   │   │   ├── presence.ts       # User presence
│   │   │   └── webrtc.ts         # WebRTC signaling
│   │   ├── rooms/                # Room management
│   │   │   ├── index.ts
│   │   │   ├── chat-room.ts
│   │   │   └── game-room.ts
│   │   ├── services/
│   │   │   ├── room-service.ts
│   │   │   ├── presence-service.ts
│   │   │   └── message-service.ts
│   │   ├── types/
│   │   │   ├── socket.ts         # Socket types
│   │   │   └── events.ts         # Event types
│   │   └── utils/
│   │       ├── logger.ts
│   │       └── metrics.ts
│   └── client/                   # Client-side code (optional)
│       ├── index.ts
│       ├── socket.ts             # Socket client setup
│       └── hooks/
│           ├── useSocket.ts      # React hook
│           └── useRoom.ts
├── tests/
│   ├── setup.ts
│   ├── handlers/
│   │   └── chat.test.ts
│   └── integration/
│       └── socket.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Key Patterns

### 1. Server Setup

```typescript
// src/server/socket.ts
import { Server as HttpServer } from 'http';
import { Server as SocketServer, ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { instrument } from '@socket.io/admin-ui';
import Redis from 'ioredis';
import { authMiddleware } from './middlewares/auth';
import { rateLimitMiddleware } from './middlewares/rate-limit';
import { loggingMiddleware } from './middlewares/logging';
import { registerHandlers } from './handlers';

export function createSocketServer(httpServer: HttpServer) {
  const options: Partial<ServerOptions> = {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e7, // 10MB
    transports: ['websocket', 'polling'],
    allowEIO3: true, // Support older clients
  };

  const io = new SocketServer(httpServer, options);

  // Redis adapter for scaling
  if (process.env.REDIS_URL) {
    const pubClient = new Redis(process.env.REDIS_URL);
    const subClient = pubClient.duplicate();
    
    io.adapter(createAdapter(pubClient, subClient));
    console.log('Redis adapter connected');
  }

  // Admin UI for monitoring (optional)
  if (process.env.NODE_ENV !== 'production') {
    instrument(io, {
      auth: false,
      mode: 'development',
    });
  }

  // Global middlewares
  io.use(authMiddleware);
  io.use(rateLimitMiddleware);
  io.use(loggingMiddleware);

  // Connection handling
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    registerHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on('error', (error) => {
      console.error(`Socket error: ${socket.id}`, error);
    });
  });

  return io;
}
```

### 2. Authentication Middleware

```typescript
// src/server/middlewares/auth.ts
import { Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { ExtendedError } from 'socket.io/dist/namespace';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare module 'socket.io' {
  interface Socket {
    userId?: string;
    user?: JwtPayload;
  }
}

export async function authMiddleware(
  socket: Socket,
  next: (err?: ExtendedError) => void
) {
  try {
    // Get token from handshake auth or headers
    const token = 
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Verify JWT
    const payload = verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    // Attach user to socket
    socket.userId = payload.userId;
    socket.user = payload;

    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
}

// Optional: Session-based authentication
export async function sessionMiddleware(
  socket: Socket,
  next: (err?: ExtendedError) => void
) {
  const sessionId = socket.handshake.auth.sessionId;
  
  if (!sessionId) {
    return next(new Error('Session required'));
  }

  // Validate session in database
  const session = await validateSession(sessionId);
  
  if (!session) {
    return next(new Error('Invalid session'));
  }

  socket.userId = session.userId;
  next();
}
```

### 3. Rate Limiting Middleware

```typescript
// src/server/middlewares/rate-limit.ts
import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';

interface RateLimitStore {
  [socketId: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;

export function rateLimitMiddleware(
  socket: Socket,
  next: (err?: ExtendedError) => void
) {
  const now = Date.now();
  const socketId = socket.id;

  if (!store[socketId]) {
    store[socketId] = {
      count: 1,
      resetAt: now + WINDOW_MS,
    };
    return next();
  }

  const record = store[socketId];

  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + WINDOW_MS;
    return next();
  }

  record.count++;

  if (record.count > MAX_REQUESTS) {
    return next(new Error('Rate limit exceeded'));
  }

  next();
}

// Clean up disconnected sockets
export function cleanupRateLimit(socketId: string) {
  delete store[socketId];
}
```

### 4. Event Handlers

```typescript
// src/server/handlers/index.ts
import { Server, Socket } from 'socket.io';
import { handleChat } from './chat';
import { handleNotifications } from './notifications';
import { handlePresence } from './presence';
import { handleWebRTC } from './webrtc';

export function registerHandlers(io: Server, socket: Socket) {
  handleChat(io, socket);
  handleNotifications(io, socket);
  handlePresence(io, socket);
  handleWebRTC(io, socket);
}

// src/server/handlers/chat.ts
import { Server, Socket } from 'socket.io';
import { MessageService } from '../services/message-service';

export function handleChat(io: Server, socket: Socket) {
  const messageService = new MessageService();

  // Join a chat room
  socket.on('chat:join', async (roomId: string) => {
    try {
      socket.join(`chat:${roomId}`);
      
      // Notify others in room
      socket.to(`chat:${roomId}`).emit('chat:user-joined', {
        userId: socket.userId,
        socketId: socket.id,
        timestamp: new Date(),
      });

      // Send recent messages
      const messages = await messageService.getRecentMessages(roomId, 50);
      socket.emit('chat:history', messages);

      console.log(`User ${socket.userId} joined chat room ${roomId}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Leave a chat room
  socket.on('chat:leave', (roomId: string) => {
    socket.leave(`chat:${roomId}`);
    
    socket.to(`chat:${roomId}`).emit('chat:user-left', {
      userId: socket.userId,
      socketId: socket.id,
      timestamp: new Date(),
    });
  });

  // Send a message
  socket.on('chat:message', async (data: { roomId: string; message: string }) => {
    try {
      const { roomId, message } = data;

      // Validate message
      if (!message || message.trim().length === 0) {
        return socket.emit('error', { message: 'Message cannot be empty' });
      }

      if (message.length > 5000) {
        return socket.emit('error', { message: 'Message too long' });
      }

      // Save message
      const savedMessage = await messageService.saveMessage({
        roomId,
        userId: socket.userId!,
        content: message,
        timestamp: new Date(),
      });

      // Broadcast to room
      io.to(`chat:${roomId}`).emit('chat:message', savedMessage);
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('chat:typing', (data: { roomId: string; isTyping: boolean }) => {
    socket.to(`chat:${data.roomId}`).emit('chat:typing', {
      userId: socket.userId,
      isTyping: data.isTyping,
    });
  });

  // Mark as read
  socket.on('chat:read', async (data: { roomId: string; messageId: string }) => {
    await messageService.markAsRead(data.roomId, data.messageId, socket.userId!);
    
    io.to(`chat:${data.roomId}`).emit('chat:read', {
      userId: socket.userId,
      messageId: data.messageId,
    });
  });
}

// src/server/handlers/presence.ts
import { Server, Socket } from 'socket.io';
import { PresenceService } from '../services/presence-service';

export function handlePresence(io: Server, socket: Socket) {
  const presenceService = new PresenceService();

  // Set user status
  socket.on('presence:status', async (status: 'online' | 'away' | 'busy' | 'offline') => {
    await presenceService.setUserStatus(socket.userId!, status, socket.id);
    
    // Broadcast status to relevant users
    socket.broadcast.emit('presence:status', {
      userId: socket.userId,
      status,
      timestamp: new Date(),
    });
  });

  // Get online users
  socket.on('presence:get-online', async (callback: (users: string[]) => void) => {
    const onlineUsers = await presenceService.getOnlineUsers();
    callback(onlineUsers);
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    await presenceService.setUserOffline(socket.userId!, socket.id);
    
    socket.broadcast.emit('presence:offline', {
      userId: socket.userId,
      timestamp: new Date(),
    });
  });
}

// src/server/handlers/notifications.ts
import { Server, Socket } from 'socket.io';

export function handleNotifications(io: Server, socket: Socket) {
  // Join user's personal notification room
  socket.join(`user:${socket.userId}`);

  socket.on('notification:mark-read', async (notificationId: string) => {
    // Mark notification as read in database
    // ...
    
    socket.emit('notification:read', { notificationId });
  });

  socket.on('notification:get-unread', async (callback: Function) => {
    // Get unread notifications
    // ...
    
    callback([]);
  });
}

// Utility: Send notification to specific user
export function sendNotificationToUser(
  io: Server,
  userId: string,
  notification: any
) {
  io.to(`user:${userId}`).emit('notification:new', notification);
}
```

### 5. Room Management

```typescript
// src/server/rooms/chat-room.ts
import { Server, Socket } from 'socket.io';

interface ChatRoom {
  id: string;
  name: string;
  participants: Set<string>;
  createdAt: Date;
}

export class ChatRoomManager {
  private rooms: Map<string, ChatRoom> = new Map();

  constructor(private io: Server) {}

  createRoom(name: string, creatorId: string): ChatRoom {
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const room: ChatRoom = {
      id: roomId,
      name,
      participants: new Set([creatorId]),
      createdAt: new Date(),
    };

    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId: string, socket: Socket): boolean {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return false;
    }

    socket.join(roomId);
    room.participants.add(socket.userId!);

    // Notify room
    this.io.to(roomId).emit('room:user-joined', {
      roomId,
      userId: socket.userId,
      participantCount: room.participants.size,
    });

    return true;
  }

  leaveRoom(roomId: string, socket: Socket): void {
    const room = this.rooms.get(roomId);
    
    if (!room) return;

    socket.leave(roomId);
    room.participants.delete(socket.userId!);

    // Notify room
    this.io.to(roomId).emit('room:user-left', {
      roomId,
      userId: socket.userId,
      participantCount: room.participants.size,
    });

    // Delete empty rooms
    if (room.participants.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  getRoomInfo(roomId: string): ChatRoom | undefined {
    return this.rooms.get(roomId);
  }

  getRooms(): ChatRoom[] {
    return Array.from(this.rooms.values());
  }
}

// src/server/rooms/game-room.ts
import { Server, Socket } from 'socket.io';

interface Player {
  id: string;
  socketId: string;
  ready: boolean;
  score: number;
}

interface GameRoom {
  id: string;
  players: Map<string, Player>;
  status: 'waiting' | 'playing' | 'finished';
  maxPlayers: number;
}

export class GameRoomManager {
  private rooms: Map<string, GameRoom> = new Map();

  constructor(private io: Server) {}

  createGame(hostId: string, socketId: string, maxPlayers = 4): GameRoom {
    const gameId = `game-${Date.now()}`;
    
    const game: GameRoom = {
      id: gameId,
      players: new Map([
        [hostId, { id: hostId, socketId, ready: false, score: 0 }],
      ]),
      status: 'waiting',
      maxPlayers,
    };

    this.rooms.set(gameId, game);
    return game;
  }

  joinGame(gameId: string, socket: Socket): { success: boolean; message?: string } {
    const game = this.rooms.get(gameId);

    if (!game) {
      return { success: false, message: 'Game not found' };
    }

    if (game.status !== 'waiting') {
      return { success: false, message: 'Game already started' };
    }

    if (game.players.size >= game.maxPlayers) {
      return { success: false, message: 'Game is full' };
    }

    socket.join(gameId);
    game.players.set(socket.userId!, {
      id: socket.userId!,
      socketId: socket.id,
      ready: false,
      score: 0,
    });

    this.io.to(gameId).emit('game:player-joined', {
      gameId,
      players: this.getPlayerList(game),
    });

    return { success: true };
  }

  setReady(gameId: string, userId: string, ready: boolean): void {
    const game = this.rooms.get(gameId);
    if (!game) return;

    const player = game.players.get(userId);
    if (player) {
      player.ready = ready;

      this.io.to(gameId).emit('game:player-ready', {
        userId,
        ready,
        players: this.getPlayerList(game),
      });

      // Start game if all players ready
      if (this.allPlayersReady(game)) {
        this.startGame(game);
      }
    }
  }

  private allPlayersReady(game: GameRoom): boolean {
    const players = Array.from(game.players.values());
    return players.length >= 2 && players.every(p => p.ready);
  }

  private startGame(game: GameRoom): void {
    game.status = 'playing';
    this.io.to(game.id).emit('game:started', { gameId: game.id });
  }

  private getPlayerList(game: GameRoom) {
    return Array.from(game.players.values());
  }
}
```

### 6. Socket.io Client (TypeScript)

```typescript
// src/client/socket.ts
import { io, Socket } from 'socket.io-client';

interface ServerToClientEvents {
  'chat:message': (message: any) => void;
  'chat:user-joined': (data: any) => void;
  'chat:user-left': (data: any) => void;
  'chat:typing': (data: any) => void;
  'notification:new': (notification: any) => void;
  'error': (error: { message: string }) => void;
}

interface ClientToServerEvents {
  'chat:join': (roomId: string) => void;
  'chat:leave': (roomId: string) => void;
  'chat:message': (data: { roomId: string; message: string }) => void;
  'chat:typing': (data: { roomId: string; isTyping: boolean }) => void;
}

class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  private connected = false;

  constructor(url: string, token: string) {
    this.socket = io(url, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.socket.on('connect', () => {
      this.connected = true;
      console.log('Connected to server');
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  // Chat methods
  joinRoom(roomId: string) {
    this.socket.emit('chat:join', roomId);
  }

  leaveRoom(roomId: string) {
    this.socket.emit('chat:leave', roomId);
  }

  sendMessage(roomId: string, message: string) {
    this.socket.emit('chat:message', { roomId, message });
  }

  setTyping(roomId: string, isTyping: boolean) {
    this.socket.emit('chat:typing', { roomId, isTyping });
  }

  // Event listeners
  onMessage(callback: (message: any) => void) {
    this.socket.on('chat:message', callback);
  }

  onUserJoined(callback: (data: any) => void) {
    this.socket.on('chat:user-joined', callback);
  }

  onUserLeft(callback: (data: any) => void) {
    this.socket.on('chat:user-left', callback);
  }

  onTyping(callback: (data: any) => void) {
    this.socket.on('chat:typing', callback);
  }

  onNotification(callback: (notification: any) => void) {
    this.socket.on('notification:new', callback);
  }

  onError(callback: (error: { message: string }) => void) {
    this.socket.on('error', callback);
  }

  // Cleanup
  disconnect() {
    this.socket.disconnect();
  }

  removeAllListeners() {
    this.socket.removeAllListeners();
  }
}

export const createSocketClient = (url: string, token: string) => {
  return new SocketClient(url, token);
};
```

### 7. React Hook

```typescript
// src/client/hooks/useSocket.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  url: string;
  token: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useSocket(options: UseSocketOptions) {
  const { url, token, onConnect, onDisconnect, onError } = options;
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(url, {
      auth: { token },
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setConnected(true);
      onConnect?.();
    });

    socket.on('disconnect', () => {
      setConnected(false);
      onDisconnect?.();
    });

    socket.on('connect_error', (error) => {
      onError?.(error);
    });

    return () => {
      socket.disconnect();
    };
  }, [url, token, onConnect, onDisconnect, onError]);

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback);
    
    return () => {
      socketRef.current?.off(event, callback);
    };
  }, []);

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    socketRef.current?.off(event, callback);
  }, []);

  return {
    socket: socketRef.current,
    connected,
    emit,
    on,
    off,
  };
}

// src/client/hooks/useRoom.ts
import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';

interface Message {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
}

export function useChatRoom(roomId: string) {
  const { socket, connected } = useSocket({
    url: process.env.REACT_APP_SOCKET_URL!,
    token: localStorage.getItem('token') || '',
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!socket || !connected) return;

    // Join room
    socket.emit('chat:join', roomId);

    // Listen for messages
    socket.on('chat:message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for history
    socket.on('chat:history', (history: Message[]) => {
      setMessages(history);
    });

    // Listen for typing
    socket.on('chat:typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    return () => {
      socket.emit('chat:leave', roomId);
      socket.off('chat:message');
      socket.off('chat:history');
      socket.off('chat:typing');
    };
  }, [socket, connected, roomId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (socket && connected) {
        socket.emit('chat:message', { roomId, message: content });
      }
    },
    [socket, connected, roomId]
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (socket && connected) {
        socket.emit('chat:typing', { roomId, isTyping });
      }
    },
    [socket, connected, roomId]
  );

  return {
    messages,
    typingUsers,
    sendMessage,
    setTyping,
    connected,
  };
}
```

### 8. WebRTC Signaling

```typescript
// src/server/handlers/webrtc.ts
import { Server, Socket } from 'socket.io';

export function handleWebRTC(io: Server, socket: Socket) {
  // Join video call room
  socket.on('webrtc:join', (roomId: string) => {
    socket.join(`webrtc:${roomId}`);

    // Notify existing participants
    socket.to(`webrtc:${roomId}`).emit('webrtc:user-joined', {
      userId: socket.userId,
      socketId: socket.id,
    });

    // Send list of existing participants to new user
    const room = io.sockets.adapter.rooms.get(`webrtc:${roomId}`);
    if (room) {
      const participants = Array.from(room)
        .filter((id) => id !== socket.id)
        .map((socketId) => {
          const s = io.sockets.sockets.get(socketId);
          return { socketId, userId: s?.userId };
        });

      socket.emit('webrtc:participants', participants);
    }
  });

  // WebRTC signaling
  socket.on('webrtc:offer', (data: { targetId: string; offer: RTCSessionDescriptionInit }) => {
    io.to(data.targetId).emit('webrtc:offer', {
      from: socket.id,
      offer: data.offer,
    });
  });

  socket.on('webrtc:answer', (data: { targetId: string; answer: RTCSessionDescriptionInit }) => {
    io.to(data.targetId).emit('webrtc:answer', {
      from: socket.id,
      answer: data.answer,
    });
  });

  socket.on('webrtc:ice-candidate', (data: { targetId: string; candidate: RTCIceCandidateInit }) => {
    io.to(data.targetId).emit('webrtc:ice-candidate', {
      from: socket.id,
      candidate: data.candidate,
    });
  });

  // Leave video call
  socket.on('webrtc:leave', (roomId: string) => {
    socket.leave(`webrtc:${roomId}`);
    
    socket.to(`webrtc:${roomId}`).emit('webrtc:user-left', {
      userId: socket.userId,
      socketId: socket.id,
    });
  });
}
```

## Best Practices

### 1. Connection Management
- Implement heartbeat/ping-pong
- Handle reconnection gracefully
- Clean up resources on disconnect
- Use connection pooling

### 2. Security
- Always authenticate connections
- Validate all incoming events
- Implement rate limiting
- Sanitize data before broadcasting

### 3. Performance
- Use rooms for efficient broadcasting
- Implement pagination for history
- Use Redis adapter for scaling
- Monitor connection count

### 4. Error Handling
- Emit error events to clients
- Log errors server-side
- Handle edge cases (network issues)
- Implement retry logic

## Common Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build               # Build for production
npm run start               # Start production server

# Testing
npm run test                # Run tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# Code Quality
npm run lint                # Run ESLint
npm run lint:fix            # Auto-fix issues
npm run type-check          # TypeScript check

# Redis (if using adapter)
redis-cli ping              # Check Redis connection
redis-cli monitor           # Monitor Redis commands
```

## Configuration

```json
// package.json scripts
{
  "scripts": {
    "dev": "tsx watch src/server/index.ts",
    "build": "tsc",
    "start": "node dist/server/index.js",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "socket.io": "^4.7.0",
    "@socket.io/redis-adapter": "^8.3.0",
    "@socket.io/admin-ui": "^0.5.1",
    "ioredis": "^5.3.0",
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0"
  }
}
```

## Deployment

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY dist ./dist

EXPOSE 3000

USER node

CMD ["node", "dist/server/index.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  socket-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-secret-key
    depends_on:
      - redis
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

### Nginx Configuration

```nginx
# WebSocket proxy
upstream socket_backend {
    ip_hash;
    server localhost:3000;
}

server {
    listen 443 ssl http2;
    server_name socket.example.com;
    
    location /socket.io/ {
        proxy_pass http://socket_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

## Resources

- [Socket.io Documentation](https://socket.io/docs/)
- [Socket.io Server API](https://socket.io/docs/server-api/)
- [Socket.io Client API](https://socket.io/docs/client-api/)
- [Redis Adapter](https://socket.io/docs/v4/redis-adapter/)
- [Admin UI](https://socket.io/docs/v4/admin-ui/)

---

**Last Updated**: 2026-03-17
