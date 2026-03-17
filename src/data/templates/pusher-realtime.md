# Pusher 实时通信模板

## 技术栈

- **Pusher**: 实时消息推送服务
- **Pusher JS**: 客户端 SDK
- **Server SDK**: 服务端 SDK (Node.js/Python/Go/PHP)
- **Webhooks**: 事件回调
- **Presence Channels**: 在线状态

## 项目结构

```
pusher-app/
├── client/
│   ├── src/
│   │   ├── pusher/
│   │   │   ├── client.ts        # Pusher 客户端
│   │   │   ├── channels.ts      # 频道管理
│   │   │   └── events.ts        # 事件定义
│   │   ├── hooks/
│   │   │   ├── useChannel.ts
│   │   │   ├── usePresence.ts
│   │   │   └── useEvent.ts
│   │   ├── components/
│   │   │   ├── Chat.tsx
│   │   │   ├── UserList.tsx
│   │   │   └── Notification.tsx
│   │   └── App.tsx
│   └── package.json
├── server/
│   ├── src/
│   │   ├── pusher/
│   │   │   ├── server.ts        # Pusher 服务端
│   │   │   ├── auth.ts          # 认证中间件
│   │   │   └── webhooks.ts      # Webhook 处理
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── chat.ts
│   │   │   └── notification.ts
│   │   └── index.ts
│   └── package.json
└── docker-compose.yml
```

## 代码模式

### 服务端配置

```typescript
// server/src/pusher/server.ts
import Pusher from 'pusher';

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER || 'mt1',
  useTLS: true,
});

// 触发事件
export async function triggerEvent(
  channel: string,
  event: string,
  data: unknown
) {
  try {
    await pusher.trigger(channel, event, data);
    console.log(`Event "${event}" sent to channel "${channel}"`);
  } catch (error) {
    console.error('Pusher trigger error:', error);
    throw error;
  }
}

// 批量触发事件
export async function triggerBatch(
  events: Array<{ channel: string; name: string; data: unknown }>
) {
  try {
    await pusher.triggerBatch(events);
  } catch (error) {
    console.error('Pusher batch trigger error:', error);
    throw error;
  }
}
```

### 频道认证

```typescript
// server/src/pusher/auth.ts
import { pusher } from './server.ts';
import { verify } from 'jsonwebtoken';

export async function authenticateChannel(
  socketId: string,
  channelName: string,
  userId: string,
  userData?: object
) {
  // 验证用户是否有权限访问此频道
  const isPrivateChannel = channelName.startsWith('private-');
  const isPresenceChannel = channelName.startsWith('presence-');

  if (isPrivateChannel || isPresenceChannel) {
    // 检查用户权限
    const hasAccess = await checkUserAccess(userId, channelName);
    
    if (!hasAccess) {
      throw new Error('Unauthorized');
    }
  }

  if (isPresenceChannel) {
    // Presence 频道需要用户信息
    const authResponse = pusher.authorizeChannel(socketId, channelName, {
      user_id: userId,
      user_info: userData || { name: 'Anonymous' },
    });
    return authResponse;
  }

  // Private 频道认证
  const authResponse = pusher.authenticate(socketId, channelName);
  return authResponse;
}

async function checkUserAccess(userId: string, channelName: string): Promise<boolean> {
  // 实现权限检查逻辑
  // 例如：检查用户是否属于该聊天室
  return true;
}
```

### 认证路由

```typescript
// server/src/routes/auth.ts
import { Router } from 'express';
import { authenticateChannel } from '../pusher/auth.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = Router();

// Pusher 频道认证
router.post('/pusher/auth', authMiddleware, async (req, res) => {
  try {
    const { socket_id, channel_name } = req.body;
    const userId = req.user.id;
    const userData = {
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
    };

    const authResponse = await authenticateChannel(
      socket_id,
      channel_name,
      userId,
      userData
    );

    res.json(authResponse);
  } catch (error) {
    res.status(403).json({ error: 'Forbidden' });
  }
});

export default router;
```

### 客户端配置

```typescript
// client/src/pusher/client.ts
import Pusher from 'pusher-js';

Pusher.logToConsole = process.env.NODE_ENV === 'development';

export const pusherClient = new Pusher(process.env.REACT_APP_PUSHER_KEY!, {
  cluster: process.env.REACT_APP_PUSHER_CLUSTER || 'mt1',
  authEndpoint: `${process.env.REACT_APP_API_URL}/api/pusher/auth`,
  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  },
});

// 连接状态
pusherClient.connection.bind('connected', () => {
  console.log('Pusher connected');
});

pusherClient.connection.bind('disconnected', () => {
  console.log('Pusher disconnected');
});

pusherClient.connection.bind('error', (err: Error) => {
  console.error('Pusher connection error:', err);
});
```

### React Hooks

```typescript
// client/src/hooks/useChannel.ts
import { useEffect, useState } from 'react';
import { pusherClient } from '../pusher/client';

export function useChannel(channelName: string) {
  const [channel, setChannel] = useState<Pusher.Channel | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');

  useEffect(() => {
    const ch = pusherClient.subscribe(channelName);

    ch.bind('pusher:subscription_succeeded', () => {
      setStatus('connected');
      setChannel(ch);
    });

    ch.bind('pusher:subscription_error', () => {
      setStatus('failed');
    });

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [channelName]);

  return { channel, status };
}
```

```typescript
// client/src/hooks/useEvent.ts
import { useEffect } from 'react';

export function useEvent(
  channel: Pusher.Channel | null,
  eventName: string,
  callback: (data: any) => void
) {
  useEffect(() => {
    if (!channel) return;

    channel.bind(eventName, callback);

    return () => {
      channel.unbind(eventName, callback);
    };
  }, [channel, eventName, callback]);
}
```

```typescript
// client/src/hooks/usePresence.ts
import { useEffect, useState } from 'react';

interface PresenceMember {
  id: string;
  info: {
    name: string;
    email?: string;
    avatar?: string;
  };
}

export function usePresence(channelName: string) {
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const [me, setMe] = useState<PresenceMember | null>(null);

  useEffect(() => {
    const channel = pusherClient.subscribe(channelName);

    channel.bind('pusher:subscription_succeeded', (membersList: any) => {
      const allMembers: PresenceMember[] = [];
      membersList.each((member: PresenceMember) => {
        allMembers.push(member);
      });
      setMembers(allMembers);
      setMe(membersList.me);
    });

    channel.bind('pusher:member_added', (member: PresenceMember) => {
      setMembers((prev) => [...prev, member]);
    });

    channel.bind('pusher:member_removed', (member: PresenceMember) => {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    });

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [channelName]);

  return { members, me };
}
```

### 聊天组件

```typescript
// client/src/components/Chat.tsx
import React, { useState, useEffect } from 'react';
import { useChannel } from '../hooks/useChannel';
import { useEvent } from '../hooks/useEvent';

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export function Chat({ roomId, userId }: { roomId: string; userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const { channel, status } = useChannel(`presence-chat-${roomId}`);

  useEvent(channel, 'new-message', (message: Message) => {
    setMessages((prev) => [...prev, message]);
  });

  const sendMessage = async () => {
    if (!input.trim()) return;

    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          roomId,
          message: input,
        }),
      });

      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat Room: {roomId}</h2>
        <span className={`status ${status}`}>{status}</span>
      </div>

      <div className="messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.userId === userId ? 'own' : 'other'}`}
          >
            <strong>{msg.userName}: </strong>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
```

### 服务端聊天路由

```typescript
// server/src/routes/chat.ts
import { Router } from 'express';
import { triggerEvent } from '../pusher/server';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { roomId, message } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;

    const messageData = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName,
      text: message,
      timestamp: Date.now(),
    };

    // 广播消息到频道
    await triggerEvent(`presence-chat-${roomId}`, 'new-message', messageData);

    // 保存到数据库
    await saveMessageToDatabase(messageData);

    res.json({ success: true, data: messageData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

async function saveMessageToDatabase(message: any) {
  // 实现数据库保存逻辑
}

export default router;
```

### 通知系统

```typescript
// server/src/routes/notification.ts
import { Router } from 'express';
import { triggerEvent } from '../pusher/server';
import { authMiddleware } from '../middleware/auth';

const router = Router();

export async function sendNotification(
  userId: string,
  notification: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    data?: any;
  }
) {
  await triggerEvent(`private-notifications-${userId}`, 'notification', {
    ...notification,
    timestamp: Date.now(),
    read: false,
  });
}

// 发送通知路由
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { targetUserId, type, title, message, data } = req.body;

    await sendNotification(targetUserId, {
      type,
      title,
      message,
      data,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

export default router;
```

### 客户端通知组件

```typescript
// client/src/components/Notification.tsx
import { useChannel } from '../hooks/useChannel';
import { useEvent } from '../hooks/useEvent';

interface Notification {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export function Notifications({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { channel } = useChannel(`private-notifications-${userId}`);

  useEvent(channel, 'notification', (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);

    // 显示桌面通知
    if (Notification.permission === 'granted') {
      new window.Notification(notification.title, {
        body: notification.message,
      });
    }
  });

  const requestNotificationPermission = () => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  return (
    <div className="notifications">
      <button onClick={requestNotificationPermission}>
        Enable Desktop Notifications
      </button>
      {notifications.map((notif, idx) => (
        <div key={idx} className={`notification ${notif.type}`}>
          <strong>{notif.title}</strong>
          <p>{notif.message}</p>
          <small>{new Date(notif.timestamp).toLocaleTimeString()}</small>
        </div>
      ))}
    </div>
  );
}
```

### Webhook 处理

```typescript
// server/src/pusher/webhooks.ts
import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

// 验证 Webhook 签名
function verifyWebhookSignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.PUSHER_SECRET!)
    .update(body)
    .digest('hex');

  return signature === expectedSignature;
}

router.post('/pusher/webhook', (req, res) => {
  const signature = req.headers['x-pusher-signature'] as string;
  const body = JSON.stringify(req.body);

  if (!verifyWebhookSignature(body, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const events = req.body.events;

  for (const event of events) {
    switch (event.name) {
      case 'channel_occupied':
        console.log(`Channel occupied: ${event.channel}`);
        break;

      case 'channel_vacated':
        console.log(`Channel vacated: ${event.channel}`);
        break;

      case 'member_added':
        console.log(`Member added to ${event.channel}: ${event.user_id}`);
        handleMemberAdded(event.channel, event.user_id);
        break;

      case 'member_removed':
        console.log(`Member removed from ${event.channel}: ${event.user_id}`);
        handleMemberRemoved(event.channel, event.user_id);
        break;

      case 'client_event':
        console.log(`Client event on ${event.channel}: ${event.event}`);
        handleClientEvent(event);
        break;
    }
  }

  res.json({ status: 'ok' });
});

function handleMemberAdded(channel: string, userId: string) {
  // 处理成员加入逻辑
}

function handleMemberRemoved(channel: string, userId: string) {
  // 处理成员离开逻辑
}

function handleClientEvent(event: any) {
  // 处理客户端事件
}

export default router;
```

## 最佳实践

### 1. 频道命名规范

```typescript
// 推荐的频道命名约定
const CHANNELS = {
  // 私有频道（单用户）
  privateUser: (userId: string) => `private-user-${userId}`,
  privateNotifications: (userId: string) => `private-notifications-${userId}`,

  // Presence 频道（多用户，带在线状态）
  presenceChat: (roomId: string) => `presence-chat-${roomId}`,
  presenceGame: (gameId: string) => `presence-game-${gameId}`,

  // 公共频道
  publicFeed: (feedId: string) => `public-feed-${feedId}`,
  publicBroadcast: () => 'public-broadcast',
};
```

### 2. 事件命名规范

```typescript
// 事件类型定义
export const EVENTS = {
  // 聊天相关
  CHAT_NEW_MESSAGE: 'new-message',
  CHAT_TYPING: 'typing',
  CHAT_READ: 'read',

  // 通知相关
  NOTIFICATION_NEW: 'notification',
  NOTIFICATION_READ: 'notification-read',

  // 在线状态
  PRESENCE_JOIN: 'pusher:member_added',
  PRESENCE_LEAVE: 'pusher:member_removed',

  // 用户操作
  USER_UPDATE: 'user-update',
  USER_ONLINE: 'user-online',
};
```

### 3. 错误处理

```typescript
// client/src/pusher/error-handling.ts
export function handlePusherError(error: any) {
  console.error('Pusher error:', error);

  if (error.type === 'WebSocketError') {
    // WebSocket 连接错误
    showNotification('Connection lost. Reconnecting...');
  } else if (error.type === 'AuthError') {
    // 认证失败
    redirectToLogin();
  } else {
    // 其他错误
    showNotification('An error occurred. Please try again.');
  }
}

pusherClient.bind('error', handlePusherError);
```

### 4. 断线重连

```typescript
// client/src/pusher/reconnect.ts
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

pusherClient.connection.bind('disconnected', () => {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    setTimeout(() => {
      pusherClient.connect();
    }, 1000 * reconnectAttempts);
  } else {
    console.error('Max reconnection attempts reached');
  }
});

pusherClient.connection.bind('connected', () => {
  reconnectAttempts = 0;
});
```

### 5. 性能优化

```typescript
// 批量发送事件
const eventQueue: any[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

export function queueEvent(channel: string, event: string, data: any) {
  eventQueue.push({ channel, name: event, data });

  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      triggerBatch(eventQueue);
      eventQueue.length = 0;
      flushTimeout = null;
    }, 100);
  }
}
```

## 常用命令

```bash
# 安装服务端 SDK
npm install pusher

# 安装客户端 SDK
npm install pusher-js

# 本地开发（使用 Pusher 本地模拟器）
npm install -g pusher-cli
pusher channels

# 测试事件触发
pusher channels trigger channel-name event-name '{"message":"Hello"}'
```

## 部署配置

### 环境变量

```env
# .env (Server)
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=mt1

# .env (Client)
REACT_APP_PUSHER_KEY=your-key
REACT_APP_PUSHER_CLUSTER=mt1
```

### Next.js 配置

```javascript
// next.config.js
module.exports = {
  env: {
    NEXT_PUBLIC_PUSHER_KEY: process.env.PUSHER_KEY,
    NEXT_PUBLIC_PUSHER_CLUSTER: process.env.PUSHER_CLUSTER,
  },
};
```

## 资源

- [Pusher 官方文档](https://pusher.com/docs/)
- [Pusher JavaScript SDK](https://github.com/pusher/pusher-js)
- [Pusher Node.js SDK](https://github.com/pusher/pusher-http-node)
- [Pusher Channels](https://pusher.com/docs/channels)
