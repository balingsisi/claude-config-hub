# Trigger.dev 后台任务处理

## 技术栈

- **核心库**: @trigger.dev/sdk, @trigger.dev/react
- **框架**: Next.js / Express / NestJS
- **数据库**: PostgreSQL / Redis
- **队列**: Trigger.dev Cloud / 自托管
- **集成**: Resend, OpenAI, Slack, Stripe 等
- **类型**: TypeScript

## 项目结构

```
trigger-dev-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── trigger/
│   │   │       └── route.ts        # Trigger.dev 端点
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── jobs/                        # 任务定义
│   │   ├── email.ts                # 邮件发送任务
│   │   ├── reports.ts              # 报表生成任务
│   │   ├── sync.ts                 # 数据同步任务
│   │   ├── notifications.ts        # 通知任务
│   │   └── scheduled.ts            # 定时任务
│   ├── triggers/                    # 触发器定义
│   │   ├── webhooks.ts             # Webhook 触发
│   │   ├── schedules.ts            # 定时触发
│   │   └── events.ts               # 事件触发
│   ├── lib/
│   │   ├── trigger.ts              # Trigger 客户端配置
│   │   ├── integrations.ts         # 第三方集成
│   │   └── utils.ts
│   └── components/
│       ├── JobStatus.tsx           # 任务状态组件
│       └── TriggerButton.tsx       # 触发按钮
├── trigger.config.ts               # Trigger.dev 配置
├── package.json
└── tsconfig.json
```

## 代码模式

### Trigger 客户端配置

```typescript
// src/lib/trigger.ts
import { TriggerClient } from "@trigger.dev/sdk";

export const client = new TriggerClient({
  id: "my-app",
  apiKey: process.env.TRIGGER_API_KEY!,
  verbose: true,
  baseUrl: process.env.TRIGGER_BASE_URL,
});

// 或者使用 Next.js 集成
export const triggerClient = new TriggerClient({
  id: "nextjs-app",
  apiKey: process.env.TRIGGER_API_KEY!,
});
```

### 基础任务定义

```typescript
// src/jobs/email.ts
import { client } from "@/lib/trigger";
import { eventTrigger } from "@trigger.dev/sdk";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

// 定义任务 Schema
const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
});

// 定义任务
client.defineJob({
  id: "send-email",
  name: "发送邮件",
  version: "0.1.0",
  trigger: eventTrigger({
    name: "send.email",
    schema: emailSchema,
  }),
  integrations: {
    resend: {
      id: "resend",
      api: "resend",
    },
  },
  run: async (payload, io, ctx) => {
    // 使用 io.logger 记录日志
    await io.logger.info("开始发送邮件", { to: payload.to });

    try {
      // 发送邮件
      const response = await io.resend.sendEmail("send-email", {
        to: payload.to,
        from: "noreply@example.com",
        subject: payload.subject,
        html: payload.html,
      });

      await io.logger.info("邮件发送成功", { id: response.id });

      return { success: true, id: response.id };
    } catch (error) {
      await io.logger.error("邮件发送失败", { error });
      throw error;
    }
  },
});
```

### 定时任务

```typescript
// src/jobs/scheduled.ts
import { client } from "@/lib/trigger";
import { cronTrigger } from "@trigger.dev/sdk";

// 每小时执行的任务
client.defineJob({
  id: "hourly-cleanup",
  name: "每小时清理",
  version: "0.1.0",
  trigger: cronTrigger({
    cron: "0 * * * *", // 每小时整点
  }),
  run: async (payload, io, ctx) => {
    await io.logger.info("开始清理任务");

    // 清理过期数据
    const deletedCount = await io.runTask(
      "cleanup-expired-data",
      async () => {
        // 数据库清理逻辑
        const result = await db.userSessions.deleteMany({
          where: {
            expiresAt: { lt: new Date() },
          },
        });
        return result.count;
      }
    );

    await io.logger.info("清理完成", { deletedCount });

    return { deletedCount };
  },
});

// 每天凌晨 2 点执行的报表任务
client.defineJob({
  id: "daily-report",
  name: "每日报表",
  version: "0.1.0",
  trigger: cronTrigger({
    cron: "0 2 * * *", // 每天 2:00 AM
  }),
  run: async (payload, io, ctx) => {
    // 生成报表
    const report = await io.runTask("generate-report", async () => {
      const users = await db.user.count();
      const orders = await db.order.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      return { users, orders };
    });

    // 发送邮件通知
    await io.sendEvent("notify-admin", {
      name: "send.email",
      payload: {
        to: "admin@example.com",
        subject: "每日报表",
        html: `
          <h1>每日报表</h1>
          <p>用户总数: ${report.users}</p>
          <p>今日订单: ${report.orders}</p>
        `,
      },
    });

    return report;
  },
});
```

### Webhook 触发

```typescript
// src/triggers/webhooks.ts
import { client } from "@/lib/trigger";
import { webhookTrigger } from "@trigger.dev/sdk";

// Stripe Webhook
client.defineJob({
  id: "stripe-webhook",
  name: "Stripe Webhook 处理",
  version: "0.1.0",
  trigger: webhookTrigger({
    webhook: "stripe",
    eventName: "payment_intent.succeeded",
    filter: {
      type: ["payment_intent"],
    },
  }),
  run: async (payload, io, ctx) => {
    await io.logger.info("收到 Stripe 支付成功事件", {
      paymentIntentId: payload.id,
    });

    // 更新订单状态
    await io.runTask("update-order", async () => {
      await db.order.update({
        where: { paymentIntentId: payload.id },
        data: { status: "PAID" },
      });
    });

    // 发送确认邮件
    await io.sendEvent("send-confirmation", {
      name: "send.email",
      payload: {
        to: payload.receipt_email,
        subject: "支付成功",
        html: `<p>您的支付已成功处理，金额: ${payload.amount / 100} ${payload.currency}</p>`,
      },
    });

    return { success: true };
  },
});
```

### 任务依赖和流程

```typescript
// src/jobs/order-fulfillment.ts
import { client } from "@/lib/trigger";
import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

const orderSchema = z.object({
  orderId: z.string(),
  userId: z.string(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number(),
    })
  ),
});

client.defineJob({
  id: "order-fulfillment",
  name: "订单履行流程",
  version: "0.1.0",
  trigger: eventTrigger({
    name: "order.created",
    schema: orderSchema,
  }),
  run: async (payload, io, ctx) => {
    // 步骤 1: 验证库存
    const inventory = await io.runTask("check-inventory", async () => {
      const results = await Promise.all(
        payload.items.map(async (item) => {
          const product = await db.product.findUnique({
            where: { id: item.productId },
          });
          return {
            productId: item.productId,
            available: product?.stock ?? 0,
            required: item.quantity,
          };
        })
      );

      const insufficient = results.filter((r) => r.available < r.required);
      if (insufficient.length > 0) {
        throw new Error(`库存不足: ${JSON.stringify(insufficient)}`);
      }

      return results;
    });

    // 步骤 2: 扣减库存
    await io.runTask("deduct-inventory", async () => {
      await Promise.all(
        payload.items.map((item) =>
          db.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
            },
          })
        )
      );
    });

    // 步骤 3: 创建发货记录
    const shipment = await io.runTask("create-shipment", async () => {
      return await db.shipment.create({
        data: {
          orderId: payload.orderId,
          status: "PENDING",
          items: {
            create: payload.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
      });
    });

    // 步骤 4: 发送通知
    await io.sendEvent("notify-user", {
      name: "send.email",
      payload: {
        to: "user@example.com",
        subject: "订单已确认",
        html: `<p>您的订单 ${payload.orderId} 已确认，正在准备发货。</p>`,
      },
    });

    // 步骤 5: 触发后续任务
    await io.sendEvent("trigger-shipping", {
      name: "shipping.prepare",
      payload: {
        shipmentId: shipment.id,
        orderId: payload.orderId,
      },
    });

    return { shipmentId: shipment.id };
  },
});
```

### 使用 OpenAI 集成

```typescript
// src/jobs/ai-content.ts
import { client } from "@/lib/trigger";
import { eventTrigger } from "@trigger.dev/sdk";
import { OpenAI } from "@trigger.dev/openai";
import { z } from "zod";

const openai = new OpenAI({
  id: "openai",
  apiKey: process.env.OPENAI_API_KEY!,
});

const contentSchema = z.object({
  topic: z.string(),
  style: z.enum(["formal", "casual", "technical"]),
  length: z.number().optional(),
});

client.defineJob({
  id: "generate-content",
  name: "AI 内容生成",
  version: "0.1.0",
  trigger: eventTrigger({
    name: "content.generate",
    schema: contentSchema,
  }),
  integrations: {
    openai,
  },
  run: async (payload, io, ctx) => {
    await io.logger.info("开始生成内容", { topic: payload.topic });

    // 生成内容
    const completion = await io.openai.chat.completions.create(
      "generate-content",
      {
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `你是一个专业的内容创作者。写作风格: ${payload.style}`,
          },
          {
            role: "user",
            content: `请写一篇关于"${payload.topic}"的文章，大约 ${payload.length || 500} 字。`,
          },
        ],
      }
    );

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("内容生成失败");
    }

    // 保存内容
    await io.runTask("save-content", async () => {
      await db.article.create({
        data: {
          topic: payload.topic,
          content,
          style: payload.style,
          generatedAt: new Date(),
        },
      });
    });

    return { content };
  },
});
```

### 批量处理

```typescript
// src/jobs/batch-processing.ts
import { client } from "@/lib/trigger";
import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

const batchSchema = z.object({
  userIds: z.array(z.string()),
  action: z.enum(["email", "notification"]),
});

client.defineJob({
  id: "batch-user-action",
  name: "批量用户操作",
  version: "0.1.0",
  trigger: eventTrigger({
    name: "batch.user.action",
    schema: batchSchema,
  }),
  run: async (payload, io, ctx) => {
    const { userIds, action } = payload;

    // 使用 backgroundFetch 并行处理
    const results = await io.backgroundFetch<{
      success: boolean;
      userId: string;
    }>(
      "batch-process",
      `${process.env.NEXT_PUBLIC_URL}/api/users/batch`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds, action }),
      },
      { timeout: 60000 } // 60 秒超时
    );

    // 或者使用循环处理（适合需要顺序执行的场景）
    const processedUsers = [];
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];

      const result = await io.runTask(`process-user-${i}`, async () => {
        const user = await db.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          return { success: false, userId, error: "User not found" };
        }

        if (action === "email") {
          // 发送邮件
          await sendEmail(user.email, "批量通知", "...");
        } else {
          // 发送通知
          await sendNotification(user.id, "批量通知");
        }

        return { success: true, userId };
      });

      processedUsers.push(result);
    }

    return {
      total: userIds.length,
      processed: processedUsers.filter((r) => r.success).length,
    };
  },
});
```

### 错误处理和重试

```typescript
// src/jobs/resilient-task.ts
import { client } from "@/lib/trigger";
import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

client.defineJob({
  id: "resilient-task",
  name: "容错任务",
  version: "0.1.0",
  trigger: eventTrigger({
    name: "resilient.task",
    schema: z.object({ data: z.string() }),
  }),
  run: async (payload, io, ctx) => {
    // 配置重试的任务
    const result = await io.runTask(
      "unstable-operation",
      async () => {
        // 模拟可能失败的操作
        const response = await fetch("https://api.example.com/unstable", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
      },
      {
        // 重试配置
        retry: {
          maxAttempts: 5,
          factor: 2, // 指数退避因子
          minTimeoutInMs: 1000, // 最小等待时间
          maxTimeoutInMs: 30000, // 最大等待时间
          randomize: true, // 随机化等待时间
        },
        // 超时配置
        timeoutInMs: 10000,
      }
    );

    // 使用 try-catch 捕获错误
    try {
      await io.runTask("risky-operation", async () => {
        // 可能失败的操作
      });
    } catch (error) {
      await io.logger.error("操作失败，但任务继续", { error });
      // 记录错误但不中断任务
    }

    return result;
  },
});
```

### Next.js API 路由

```typescript
// src/app/api/trigger/route.ts
import { client } from "@/lib/trigger";
import "../../../jobs/email";
import "../../../jobs/reports";
import "../../../jobs/scheduled";

export const { POST, GET } = client.createHandler({
  baseUrl: process.env.TRIGGER_BASE_URL,
});
```

### 前端触发任务

```typescript
// src/components/TriggerButton.tsx
"use client";

import { useState } from "react";
import { useToast } from "@/hooks/useToast";

interface TriggerButtonProps {
  eventName: string;
  payload: any;
  label: string;
}

export function TriggerButton({
  eventName,
  payload,
  label,
}: TriggerButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTrigger = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: eventName,
          payload,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to trigger task");
      }

      toast({
        title: "任务已触发",
        description: "任务正在后台运行",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "触发失败",
        description: "无法启动任务",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleTrigger} disabled={loading}>
      {loading ? "处理中..." : label}
    </button>
  );
}
```

### React Hook 集成

```typescript
// src/hooks/useTrigger.ts
import { useTriggerClient } from "@trigger.dev/react";
import { client } from "@/lib/trigger";

export function useTrigger() {
  const triggerClient = useTriggerClient(client);

  const triggerEvent = async (eventName: string, payload: any) => {
    try {
      const result = await triggerClient.sendEvent({
        name: eventName,
        payload,
      });

      return { success: true, id: result.id };
    } catch (error) {
      return { success: false, error };
    }
  };

  return { triggerEvent };
}

// 使用示例
function MyComponent() {
  const { triggerEvent } = useTrigger();

  const handleSendEmail = async () => {
    await triggerEvent("send.email", {
      to: "user@example.com",
      subject: "测试邮件",
      html: "<p>这是一封测试邮件</p>",
    });
  };

  return <button onClick={handleSendEmail}>发送邮件</button>;
}
```

## 最佳实践

### 1. 任务设计原则

```typescript
// ✅ 任务应该幂等
client.defineJob({
  id: "idempotent-task",
  name: "幂等任务",
  version: "0.1.0",
  trigger: eventTrigger({ name: "idempotent.task" }),
  run: async (payload, io, ctx) => {
    // 检查是否已处理
    const existing = await io.runTask("check-existing", async () => {
      return await db.task.findUnique({
        where: { eventId: ctx.event.id },
      });
    });

    if (existing) {
      await io.logger.info("任务已处理，跳过");
      return existing;
    }

    // 处理任务
    const result = await io.runTask("process", async () => {
      return await db.task.create({
        data: {
          eventId: ctx.event.id,
          status: "COMPLETED",
        },
      });
    });

    return result;
  },
});
```

### 2. 使用 IO 包装器

```typescript
// ✅ 使用 io.runTask 包装数据库操作
await io.runTask("db-operation", async () => {
  return await db.user.create({ data: payload });
});

// ✅ 使用 io.sendEvent 触发其他任务
await io.sendEvent("trigger-next", {
  name: "next.task",
  payload: { previousId: result.id },
});

// ✅ 使用 io.wait 延迟执行
await io.wait("delay-1s", 1);
```

### 3. 日志和监控

```typescript
// ✅ 使用结构化日志
await io.logger.info("用户创建成功", {
  userId: user.id,
  email: user.email,
});

// ✅ 记录关键指标
await io.logger.info("任务完成", {
  duration: Date.now() - ctx.event.timestamp,
  recordsProcessed: count,
});
```

### 4. 环境变量管理

```typescript
// trigger.config.ts
export default {
  project: "my-project",
  // 开发环境
  environments: {
    development: {
      env: {
        DATABASE_URL: process.env.DEV_DATABASE_URL,
        RESEND_API_KEY: process.env.DEV_RESEND_API_KEY,
      },
    },
    // 生产环境
    production: {
      env: {
        DATABASE_URL: process.env.PROD_DATABASE_URL,
        RESEND_API_KEY: process.env.PROD_RESEND_API_KEY,
      },
    },
  },
};
```

## 常用命令

```bash
# 安装 SDK
npm install @trigger.dev/sdk @trigger.dev/react

# 安装集成
npm install @trigger.dev/resend @trigger.dev/openai
npm install @trigger.dev/slack @trigger.dev/stripe

# 初始化项目
npx trigger.dev@latest init

# 开发模式
npx trigger.dev@latest dev

# 部署
npx trigger.dev@latest deploy

# 查看日志
npx trigger.dev@latest logs

# 列出任务
npx trigger.dev@latest jobs list

# 手动触发任务
npx trigger.dev@latest trigger send.email '{"to":"user@example.com"}'
```

## 配置文件

```typescript
// trigger.config.ts
import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "my-project-id",
  runtime: "node", // 或 "edge"
  logLevel: "info",
  maxConcurrentRuns: 10,
  repositories: [
    {
      name: "main",
      github: {
        repo: "username/repo",
        branch: "main",
      },
    },
  ],
  integrations: {
    resend: {
      id: "resend",
      api: "resend",
    },
    openai: {
      id: "openai",
      api: "openai",
    },
  },
});
```

## TypeScript 类型

```typescript
// src/types/trigger.ts
import { z } from "zod";

export const EmailSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        content: z.string(),
      })
    )
    .optional(),
});

export const ReportSchema = z.object({
  type: z.enum(["daily", "weekly", "monthly"]),
  recipients: z.array(z.string().email()),
  format: z.enum(["pdf", "csv", "html"]),
});

export type EmailPayload = z.infer<typeof EmailSchema>;
export type ReportPayload = z.infer<typeof ReportSchema>;
```

## 环境变量

```bash
# .env.local
TRIGGER_API_KEY=tr_dev_xxxxxxxxxxxx
TRIGGER_BASE_URL=https://cloud.trigger.dev
NEXT_PUBLIC_TRIGGER_PUBLIC_KEY=pk_xxxxxxxxxxxx

# 集成密钥
RESEND_API_KEY=re_xxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_xxxxxxxxxxxx
SLACK_BOT_TOKEN=xoxb-xxxxxxxxxxxx
```

## 部署配置

```json
// package.json
{
  "scripts": {
    "dev": "next dev & npx trigger.dev@latest dev",
    "build": "next build",
    "start": "next start",
    "trigger:dev": "npx trigger.dev@latest dev",
    "trigger:deploy": "npx trigger.dev@latest deploy"
  },
  "dependencies": {
    "@trigger.dev/sdk": "^2.2.0",
    "@trigger.dev/react": "^2.2.0",
    "@trigger.dev/resend": "^2.2.0",
    "@trigger.dev/openai": "^2.2.0",
    "next": "^14.0.0",
    "react": "^18.2.0"
  }
}
```

### Vercel 部署

```yaml
# vercel.json
{
  "functions": {
    "src/app/api/trigger/route.ts": {
      "maxDuration": 300
    }
  }
}
```

### Docker 部署

```dockerfile
# Dockerfile
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
      - TRIGGER_API_KEY=${TRIGGER_API_KEY}
      - TRIGGER_BASE_URL=${TRIGGER_BASE_URL}
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 性能优化

```typescript
// 1. 并行执行独立任务
const [users, orders, products] = await Promise.all([
  io.runTask("fetch-users", async () => db.user.findMany()),
  io.runTask("fetch-orders", async () => db.order.findMany()),
  io.runTask("fetch-products", async () => db.product.findMany()),
]);

// 2. 批量处理
for (let i = 0; i < items.length; i += 100) {
  const batch = items.slice(i, i + 100);
  await io.runTask(`batch-${i}`, async () => {
    await db.item.createMany({ data: batch });
  });
}

// 3. 使用缓存
const cachedData = await io.runTask("get-cached", async () => {
  const cached = await redis.get("cache-key");
  if (cached) return JSON.parse(cached);

  const data = await fetchData();
  await redis.set("cache-key", JSON.stringify(data), "EX", 3600);
  return data;
});

// 4. 限制并发
const results = await Promise.all(
  items.map((item) =>
    io.runTask(`process-${item.id}`, async () => processItem(item))
  )
);
```

## 监控和告警

```typescript
// 添加监控逻辑
client.defineJob({
  id: "monitored-task",
  name: "受监控任务",
  version: "0.1.0",
  trigger: eventTrigger({ name: "monitored.task" }),
  run: async (payload, io, ctx) => {
    const startTime = Date.now();

    try {
      // 任务逻辑
      const result = await io.runTask("main-task", async () => {
        // ...
      });

      // 记录成功指标
      await io.logger.info("任务成功", {
        duration: Date.now() - startTime,
        resultSize: JSON.stringify(result).length,
      });

      return result;
    } catch (error) {
      // 记录失败并触发告警
      await io.logger.error("任务失败", {
        error,
        duration: Date.now() - startTime,
      });

      // 发送告警通知
      await io.sendEvent("alert", {
        name: "send.slack.notification",
        payload: {
          channel: "#alerts",
          message: `任务失败: ${ctx.run.id}`,
        },
      });

      throw error;
    }
  },
});
```
