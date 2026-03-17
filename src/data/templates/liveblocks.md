# Liveblocks 实时协作模板

## 技术栈

### 核心技术
- **@liveblocks/client**: Liveblocks 客户端
- **@liveblocks/react**: React 集成
- **TypeScript**: 类型安全

### 认证方式
- **JWT**: 自定义认证
- **NextAuth.js**: Next.js 认证
- **Clerk**: 用户认证
- **Auth0**: 企业认证

### 功能特性
- 实时光标
- 实时选择
- 文本协作
- 状态同步
- 房间管理
- 权限控制

## 项目结构

```
liveblocks-project/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...liveblocks]/
│   │   │           └── route.ts    # 认证端点
│   │   ├── room/
│   │   │   └── [id]/
│   │   │       └── page.tsx        # 房间页面
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── collab/
│   │   │   ├── Cursor.tsx
│   │   │   ├── Cursors.tsx
│   │   │   ├── Selection.tsx
│   │   │   └── Presence.tsx
│   │   ├── editor/
│   │   │   ├── CollaborativeEditor.tsx
│   │   │   └── Toolbar.tsx
│   │   └── ui/
│   │       ├── Avatar.tsx
│   │       └── Badge.tsx
│   ├── hooks/
│   │   ├── useCollaborativeState.ts
│   │   └── useRoomPresence.ts
│   ├── lib/
│   │   ├── liveblocks.ts
│   │   └── auth.ts
│   ├── types/
│   │   └── liveblocks.ts
│   └── middleware.ts
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── liveblocks.config.ts
```

## 核心代码模式

### 1. 配置文件

```typescript
// liveblocks.config.ts
import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

export const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
});

// 定义 Presence 类型（每个用户的状态）
export type Presence = {
  cursor: { x: number; y: number } | null;
  selection: string | null;
  editing: string | null;
};

// 定义 Storage 类型（持久化的共享状态）
export type Storage = {
  // 协作文档
  document: LiveObject<{
    title: string;
    content: string;
    blocks: LiveList<Block>;
  }>;
  // 画板元素
  shapes: LiveMap<string, Shape>;
  // 任务列表
  tasks: LiveList<Task>;
};

// 定义用户元数据
export type UserMeta = {
  id: string;
  info: {
    name: string;
    email: string;
    avatar: string;
    color: string;
  };
};

// 定义房间事件
export type RoomEvent = {
  type: "notification";
  message: string;
  userId: string;
};

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useOthers,
  useOthersMapped,
  useOthersListener,
  useBroadcastEvent,
  useEventListener,
  useErrorListener,
  useStorage,
  useObject,
  useMap,
  useList,
  useBatch,
  useHistory,
  useUndo,
  useRedo,
  useMutation,
  useSelf,
  useStatus,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);

// 辅助类型
interface Block {
  id: string;
  type: "text" | "heading" | "image";
  content: string;
}

interface Shape {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
}
```

### 2. 认证端点

```typescript
// src/app/api/auth/[...liveblocks]/route.ts
import { Liveblocks } from "@liveblocks/node";
import { NextRequest } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  // 获取当前用户（从 session 或 token）
  const user = await getCurrentUser(request);

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 创建 Liveblocks session
  const session = liveblocks.prepareSession(
    user.id,
    {
      userInfo: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        color: user.color,
      },
    }
  );

  // 设置房间权限
  // 根据用户角色授予不同权限
  const rooms = getUserRooms(user.id);
  
  for (const room of rooms) {
    if (room.role === "admin") {
      session.allow(room.id, session.FULL_ACCESS);
    } else if (room.role === "editor") {
      session.allow(room.id, session.READ_WRITE);
    } else {
      session.allow(room.id, session.READ_ONLY);
    }
  }

  // 授权特定房间
  const { roomId } = await request.json();
  session.allow(roomId, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new Response(JSON.stringify(body), { status });
}

async function getCurrentUser(request: NextRequest) {
  // 实现你的认证逻辑
  // 示例：从 NextAuth 获取用户
  return {
    id: "user-1",
    name: "张三",
    email: "zhangsan@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
    color: "#FF6B6B",
  };
}

function getUserRooms(userId: string) {
  // 返回用户可访问的房间
  return [{ id: "room-1", role: "admin" }];
}
```

### 3. 房间入口

```tsx
// src/app/room/[id]/page.tsx
import { RoomProvider } from "@/liveblocks.config";
import { CollaborativeEditor } from "@/components/editor/CollaborativeEditor";
import { auth } from "@clerk/nextjs";

interface RoomPageProps {
  params: { id: string };
}

export default function RoomPage({ params }: RoomPageProps) {
  const { id } = params;
  const { userId } = auth();

  if (!userId) {
    return <div>请先登录</div>;
  }

  return (
    <RoomProvider id={id} initialPresence={{ cursor: null, selection: null }}>
      <div className="h-screen flex flex-col">
        <header className="border-b p-4">
          <h1 className="text-xl font-bold">协作房间: {id}</h1>
        </header>
        <main className="flex-1 overflow-hidden">
          <CollaborativeEditor />
        </main>
      </div>
    </RoomProvider>
  );
}
```

### 4. 实时光标

```tsx
// src/components/collab/Cursor.tsx
import { useMyPresence, useOthers } from "@/liveblocks.config";

export function Cursors() {
  const others = useOthers();

  return (
    <>
      {others.map(({ connectionId, presence, info }) => {
        if (!presence.cursor) return null;

        return (
          <Cursor
            key={connectionId}
            x={presence.cursor.x}
            y={presence.cursor.y}
            color={info.color}
            name={info.name}
          />
        );
      })}
    </>
  );
}

interface CursorProps {
  x: number;
  y: number;
  color: string;
  name: string;
}

function Cursor({ x, y, color, name }: CursorProps) {
  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      {/* 光标 SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="drop-shadow-md"
      >
        <path
          d="M5.5 3.5L19 12L12 13.5L10 20.5L5.5 3.5Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
      
      {/* 名称标签 */}
      <div
        className="absolute left-4 top-4 px-2 py-1 rounded text-white text-xs font-medium whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  );
}

// 使用示例
export function useCursorTracking() {
  const [myPresence, updateMyPresence] = useMyPresence();

  const handlePointerMove = (e: React.PointerEvent) => {
    updateMyPresence({
      cursor: {
        x: e.clientX,
        y: e.clientY,
      },
    });
  };

  const handlePointerLeave = () => {
    updateMyPresence({ cursor: null });
  };

  return { handlePointerMove, handlePointerLeave };
}
```

### 5. 协作编辑器

```tsx
// src/components/editor/CollaborativeEditor.tsx
"use client";

import { useCallback, useState } from "react";
import {
  useMutation,
  useStorage,
  useSelf,
  useOthers,
} from "@/liveblocks.config";
import { Cursors } from "../collab/Cursors";
import { useCursorTracking } from "../collab/Cursor";

export function CollaborativeEditor() {
  const { handlePointerMove, handlePointerLeave } = useCursorTracking();
  
  const document = useStorage((root) => root.document);
  const [localContent, setLocalContent] = useState(document?.content || "");

  // 更新文档内容
  const updateContent = useMutation(({ storage }, content: string) => {
    const doc = storage.get("document");
    doc?.set("content", content);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    updateContent(newContent);
  };

  // 显示在线用户
  const others = useOthers();
  const self = useSelf();

  return (
    <div
      className="relative h-full p-4"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* 在线用户列表 */}
      <div className="absolute top-4 right-4 flex -space-x-2">
        {others.map(({ connectionId, info }) => (
          <div
            key={connectionId}
            className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: info.color }}
            title={info.name}
          >
            {info.name.charAt(0)}
          </div>
        ))}
      </div>

      {/* 编辑器 */}
      <div className="max-w-4xl mx-auto">
        <input
          type="text"
          value={document?.title || ""}
          onChange={(e) => {
            useMutation(({ storage }, title) => {
              storage.get("document")?.set("title", title);
            })(e.target.value);
          }}
          className="text-2xl font-bold mb-4 w-full border-none outline-none"
          placeholder="文档标题"
        />
        
        <textarea
          value={document?.content || localContent}
          onChange={handleChange}
          className="w-full h-[calc(100vh-200px)] resize-none border rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="开始协作编辑..."
        />
      </div>

      {/* 实时光标 */}
      <Cursors />
    </div>
  );
}
```

### 6. 实时选择高亮

```tsx
// src/components/collab/Selection.tsx
import { useOthers, useMyPresence } from "@/liveblocks.config";

interface SelectableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function SelectableItem({ id, children, className }: SelectableItemProps) {
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();

  // 检查是否有人选中了此项
  const selectedBy = others.find(
    ({ presence }) => presence?.selection === id
  );

  // 检查是否是自己选中
  const isSelectedByMe = myPresence?.selection === id;

  const handleSelect = () => {
    updateMyPresence({ selection: id });
  };

  const handleDeselect = () => {
    updateMyPresence({ selection: null });
  };

  return (
    <div
      className={`relative ${className}`}
      onClick={handleSelect}
      onBlur={handleDeselect}
    >
      {children}
      
      {/* 选中高亮边框 */}
      {selectedBy && (
        <div
          className="absolute inset-0 pointer-events-none border-2 rounded"
          style={{ borderColor: selectedBy.info.color }}
        >
          <div
            className="absolute -top-5 left-0 px-2 py-0.5 text-white text-xs rounded"
            style={{ backgroundColor: selectedBy.info.color }}
          >
            {selectedBy.info.name}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 7. 任务列表协作

```tsx
// src/components/tasks/CollaborativeTasks.tsx
import { useList, useMutation, useSelf, useOthers } from "@/liveblocks.config";
import { useState } from "react";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdBy: string;
}

export function CollaborativeTasks() {
  const tasks = useList("tasks");
  const self = useSelf();
  const others = useOthers();

  const [newTaskText, setNewTaskText] = useState("");

  // 添加任务
  const addTask = useMutation(({ storage }, text: string) => {
    const tasksList = storage.get("tasks");
    tasksList?.push({
      id: `task-${Date.now()}`,
      text,
      completed: false,
      createdBy: self.id,
    });
  }, [self.id]);

  // 切换任务状态
  const toggleTask = useMutation(({ storage }, taskId: string) => {
    const tasksList = storage.get("tasks");
    if (!tasksList) return;

    const index = tasksList.toArray().findIndex((t) => t.id === taskId);
    if (index !== -1) {
      const task = tasksList.get(index);
      tasksList.set(index, {
        ...task,
        completed: !task.completed,
      });
    }
  }, []);

  // 删除任务
  const deleteTask = useMutation(({ storage }, taskId: string) => {
    const tasksList = storage.get("tasks");
    if (!tasksList) return;

    const index = tasksList.toArray().findIndex((t) => t.id === taskId);
    if (index !== -1) {
      tasksList.delete(index);
    }
  }, []);

  const handleAddTask = () => {
    if (newTaskText.trim()) {
      addTask(newTaskText.trim());
      setNewTaskText("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">协作任务列表</h2>

      {/* 在线用户 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-500">在线:</span>
        <div className="flex -space-x-2">
          {others.map(({ connectionId, info }) => (
            <div
              key={connectionId}
              className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-xs"
              style={{ backgroundColor: info.color }}
              title={info.name}
            >
              {info.name.charAt(0)}
            </div>
          ))}
        </div>
      </div>

      {/* 添加任务 */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="添加新任务..."
        />
        <button
          onClick={handleAddTask}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          添加
        </button>
      </div>

      {/* 任务列表 */}
      <ul className="space-y-2">
        {tasks?.map((task, index) => (
          <li
            key={task.id}
            className="flex items-center gap-3 p-3 bg-white border rounded-lg"
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
              className="w-5 h-5"
            />
            <span
              className={`flex-1 ${
                task.completed ? "text-gray-400 line-through" : ""
              }`}
            >
              {task.text}
            </span>
            <button
              onClick={() => deleteTask(task.id)}
              className="text-red-500 hover:text-red-600"
            >
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 8. 广播事件

```tsx
// src/components/collab/Notifications.tsx
import {
  useBroadcastEvent,
  useEventListener,
} from "@/liveblocks.config";
import { useState, useEffect } from "react";

export function Notifications() {
  const broadcast = useBroadcastEvent();
  const [notifications, setNotifications] = useState<
    { id: string; message: string; userId: string }[]
  >([]);

  // 监听事件
  useEventListener(({ event, user }) => {
    if (event.type === "notification") {
      const notification = {
        id: `notif-${Date.now()}`,
        message: event.message,
        userId: user?.id || "",
      };
      
      setNotifications((prev) => [...prev, notification]);

      // 3秒后自动移除
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id)
        );
      }, 3000);
    }
  });

  const sendNotification = (message: string) => {
    broadcast({ type: "notification", message });
  };

  return (
    <div className="fixed bottom-4 right-4 space-y-2">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="px-4 py-3 bg-blue-500 text-white rounded-lg shadow-lg animate-slide-in"
        >
          {notif.message}
        </div>
      ))}

      <button
        onClick={() => sendNotification("有人发送了通知!")}
        className="px-4 py-2 bg-gray-800 text-white rounded-lg"
      >
        发送通知
      </button>
    </div>
  );
}
```

## 最佳实践

### 1. 性能优化

```tsx
// ✅ 使用 useOthersMapped 避免不必要的渲染
const cursorPositions = useOthersMapped(
  (other) => other.presence.cursor
);

// ✅ 使用 shallow 比较
import { shallow } from "@liveblocks/react";
const selection = useStorage(
  (root) => root.document.get("selection"),
  shallow
);

// ✅ 批量更新
useBatch(() => {
  // 多个状态更新会被合并
});
```

### 2. 错误处理

```tsx
// 监听连接错误
useErrorListener((error) => {
  console.error("Liveblocks error:", error);
  // 处理重连逻辑
});
```

### 3. 撤销/重做

```tsx
// 使用 useHistory 进行撤销/重做
function UndoRedoButtons() {
  const history = useHistory();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => history.undo()}
        disabled={!history.canUndo}
      >
        撤销
      </button>
      <button
        onClick={() => history.redo()}
        disabled={!history.canRedo}
      >
        重做
      </button>
    </div>
  );
}
```

## 常用命令

### 安装

```bash
# 安装核心包
npm install @liveblocks/client @liveblocks/react

# 安装 Node.js SDK（用于认证）
npm install @liveblocks/node

# 安装 Clerk 集成（可选）
npm install @clerk/nextjs
```

### 配置

```bash
# 设置环境变量
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_live_xxx
LIVEBLOCKS_SECRET_KEY=sk_live_xxx
```

## 部署配置

### 环境变量

```bash
# .env.local
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_live_xxx
LIVEBLOCKS_SECRET_KEY=sk_live_xxx

# Clerk（如果使用）
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx
```

### 中间件

```typescript
// src/middleware.ts
import { createMiddleware } from "@liveblocks/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // 验证用户身份
  const session = await getSession(request);
  
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/room/:path*"],
};
```

## 相关资源

- [Liveblocks 官方文档](https://liveblocks.io/docs)
- [Liveblocks React 指南](https://liveblocks.io/docs/get-started/react)
- [Liveblocks 示例](https://liveblocks.io/examples)
- [Next.js 集成](https://liveblocks.io/docs/get-started/nextjs)
