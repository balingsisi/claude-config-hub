# Convex Realtime Backend Platform

## 技术栈

- **Convex**: 实时后端即服务平台
- **React/Next.js**: 前端框架
- **TypeScript**: 类型安全
- **Convex Auth**: 内置认证系统
- **Convex Storage**: 文件存储

## 项目结构

```
convex-app/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── (auth)/
│   │       ├── login/
│   │       └── signup/
│   ├── components/          # React组件
│   │   ├── ui/
│   │   └── features/
│   └── lib/
│       └── utils.ts
├── convex/                  # Convex后端
│   ├── _generated/          # 自动生成的类型
│   ├── schema.ts            # 数据库Schema
│   ├── users.ts             # 用户相关函数
│   ├── messages.ts          # 消息函数
│   ├── auth.config.ts       # 认证配置
│   └── http.ts              # HTTP actions
├── public/
├── next.config.js
├── convex.json
├── package.json
└── tsconfig.json
```

## 代码模式

### Schema定义

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  messages: defineTable({
    userId: v.id("users"),
    body: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_created", ["createdAt"]),

  channels: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
  }),
});
```

### Query（查询）

```typescript
// convex/messages.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

// 获取所有消息
export const list = query({
  args: {
    channelId: v.id("channels"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(args.limit ?? 50);

    // 填充用户信息
    const messagesWithUsers = await Promise.all(
      messages.map(async (message) => {
        const user = await ctx.db.get(message.userId);
        return {
          ...message,
          user,
        };
      })
    );

    return messagesWithUsers;
  },
});

// 实时订阅示例
export const subscribe = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    // 自动实时更新
    return await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(100);
  },
});
```

### Mutation（变更）

```typescript
// convex/messages.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// 发送消息
export const send = mutation({
  args: {
    channelId: v.id("channels"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    // 获取当前用户
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // 创建消息
    const messageId = await ctx.db.insert("messages", {
      userId: identity.subject as any,
      channelId: args.channelId,
      body: args.body,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

// 删除消息
export const remove = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    await ctx.db.delete(args.messageId);
    return { success: true };
  },
});
```

### Action（副作用操作）

```typescript
// convex/http.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// HTTP Action
export const webhook = action({
  args: {
    event: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    // 可以调用外部API
    const response = await fetch("https://api.example.com/webhook", {
      method: "POST",
      body: JSON.stringify(args),
    });

    // 可以调用内部函数
    await ctx.runMutation(api.messages.send, {
      channelId: args.data.channelId,
      body: "Webhook received!",
    });

    return { success: true };
  },
});

// 定时任务
export const scheduledCleanup = action({
  args: {},
  handler: async (ctx) => {
    // 清理过期数据
    const oldMessages = await ctx.runQuery(api.messages.getOld, {});
    for (const msg of oldMessages) {
      await ctx.runMutation(api.messages.remove, { messageId: msg._id });
    }
  },
});
```

### 前端集成

```typescript
// src/app/page.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Chat() {
  // 实时查询（自动更新）
  const messages = useQuery(api.messages.list, {
    channelId: "channel123",
  });

  // 变更函数
  const sendMessage = useMutation(api.messages.send);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    await sendMessage({
      channelId: "channel123",
      body: formData.get("message") as string,
    });
  };

  if (messages === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <ul>
        {messages.map((msg) => (
          <li key={msg._id}>
            <strong>{msg.user?.name}:</strong> {msg.body}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit}>
        <input name="message" />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

### 认证配置

```typescript
// convex/auth.config.ts
import { defineSchema, defineTable } from "convex/server";
import { Auth } from "convex/server";

export default {
  // 认证提供者
  providers: [
    {
      domain: "https://your-app.clerk.accounts.dev",
      applicationID: "your-app-id",
    },
  ],
};

// 在函数中使用认证
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
  },
});
```

### 文件上传

```typescript
// convex/files.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 生成上传URL
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// 保存文件引用
export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("files", {
      storageId: args.storageId,
      name: args.name,
      uploadedAt: Date.now(),
    });
  },
});

// 获取文件URL
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
```

## 最佳实践

### 1. Schema设计

```typescript
// ✅ 合理的索引
defineTable({
  userId: v.id("users"),
  status: v.string(),
  createdAt: v.number(),
})
  .index("by_user_status", ["userId", "status"])  // 复合索引
  .index("by_created", ["createdAt"]);

// ✅ 使用可选字段
defineTable({
  title: v.string(),
  description: v.optional(v.string()),  // 可选
  tags: v.optional(v.array(v.string())),
});
```

### 2. 错误处理

```typescript
export const safeMutation = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    
    if (!item) {
      throw new Error("Item not found");
    }

    // 检查权限
    const userId = await ctx.auth.getUserIdentity();
    if (item.ownerId !== userId?.subject) {
      throw new Error("Forbidden");
    }

    return item;
  },
});
```

### 3. 批量操作

```typescript
// ✅ 使用批量操作
export const batchInsert = mutation({
  args: {
    items: v.array(v.object({
      name: v.string(),
      value: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const item of args.items) {
      const id = await ctx.db.insert("items", item);
      ids.push(id);
    }
    return ids;
  },
});
```

### 4. 缓存策略

```typescript
// 使用自定义函数减少查询
export const getDashboard = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // 并行查询
    const [user, messages, notifications] = await Promise.all([
      ctx.db.get(args.userId),
      ctx.db.query("messages").withIndex("by_user", q => q.eq("userId", args.userId)).take(10),
      ctx.db.query("notifications").withIndex("by_user", q => q.eq("userId", args.userId)).collect(),
    ]);

    return { user, messages, notifications };
  },
});
```

### 5. 分页

```typescript
export const paginatedList = query({
  args: {
    channelId: v.id("channels"),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { cursor, limit = 20 } = args;

    const results = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .paginate({
        cursor: cursor ?? null,
        numItems: limit,
      });

    return {
      messages: results.page,
      nextCursor: results.continueCursor,
      hasMore: !results.isDone,
    };
  },
});
```

## 常用命令

```bash
# 安装CLI
npm install -g convex

# 初始化项目
npx convex dev

# 登录
npx convex login

# 开发模式（自动同步）
npx convex dev

# 部署到生产
npx convex deploy

# 查看数据
npx convex run messages:list

# 执行mutation
npx convex run messages:send '{"body":"Hello"}'

# 查看日志
npx convex logs

# 重置数据库
npx convex dashboard

# 环境变量
npx convex env set OPENAI_API_KEY your-key
```

## 部署配置

### convex.json

```json
{
  "project": "your-project-name",
  "team": "your-team-name",
  "prodUrl": "https://your-app.convex.cloud",
  "functions": "convex/"
}
```

### Next.js配置

```typescript
// next.config.js
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  env: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  },
};

module.exports = nextConfig;
```

### 环境变量

```bash
# .env.local
NEXT_PUBLIC_CONVEX_URL=https://your-app.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

### Vercel部署

```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel --prod

# 环境变量在Vercel Dashboard设置
```

### 自托管（Docker）

```dockerfile
# 前端Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_CONVEX_URL=${CONVEX_URL}
```

### Scheduled Functions

```typescript
// convex/cron.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 每小时执行
crons.hourly(
  "cleanup",
  { hourUTC: 0, minuteUTC: 0 },
  internal.tasks.cleanup
);

// 每天执行
crons.daily(
  "daily-report",
  { hourUTC: 9, minuteUTC: 0 },
  internal.reports.generateDaily
);

// 每周执行
crons.weekly(
  "weekly-summary",
  { dayOfWeek: "Monday", hourUTC: 9, minuteUTC: 0 },
  internal.reports.weeklySummary
);

export default crons;
```

### HTTP Actions配置

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Webhook端点
http.route({
  path: "/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    await ctx.runAction(internal.webhooks.handle, {
      event: body.event,
      data: body.data,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
```

## 性能优化

```typescript
// 1. 使用索引
.index("by_user_created", ["userId", "createdAt"])

// 2. 限制查询数量
.take(100)

// 3. 使用分页
.paginate({ cursor, numItems: 20 })

// 4. 避免N+1查询
const messages = await ctx.db.query("messages").collect();
const userIds = [...new Set(messages.map(m => m.userId))];
const users = await Promise.all(
  userIds.map(id => ctx.db.get(id))
);
const userMap = Object.fromEntries(users.map(u => [u._id, u]));

// 5. 使用内部调用
await ctx.runMutation(internal.messages.send, args);
```
