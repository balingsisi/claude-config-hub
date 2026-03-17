# Inngest Event-Driven Workflows Template

## Tech Stack
- inngest v3.x
- @inngest/middleware-logger v3.x
- TypeScript 5+
- Node.js 18+

## Core Patterns

### Basic Function Definition
```typescript
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "demo/hello.world" },
  async ({ event, step }) => {
    const name = event.data.name;

    await step.run("greet", async () => {
      console.log(`Hello, ${name}!`);
      return { greeted: true };
    });

    return { message: `Hello, ${name}!` };
  }
);
```

### Inngest Client Setup
```typescript
// client.ts
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "my-app",
  eventKey: process.env.INNGEST_EVENT_KEY!,
});
```

### Multi-Step Workflow
```typescript
export const orderWorkflow = inngest.createFunction(
  { id: "order-workflow" },
  { event: "order/created" },
  async ({ event, step }) => {
    const { orderId, customerId } = event.data;

    // Step 1: Validate order
    const order = await step.run("validate-order", async () => {
      const response = await fetch(`/api/orders/${orderId}`);
      return response.json();
    });

    // Step 2: Check inventory
    const inventory = await step.run("check-inventory", async () => {
      const response = await fetch(`/api/inventory/check`, {
        method: "POST",
        body: JSON.stringify({ items: order.items }),
      });
      return response.json();
    });

    // Step 3: Process payment
    if (inventory.available) {
      await step.run("process-payment", async () => {
        // Payment logic
      });
    }

    // Step 4: Send confirmation
    await step.run("send-confirmation", async () => {
      await fetch("/api/email/send", {
        method: "POST",
        body: JSON.stringify({
          to: customerId,
          template: "order-confirmation",
        }),
      });
    });

    return { orderId, status: "completed" };
  }
);
```

### Sleep and Wait
```typescript
export const delayedNotification = inngest.createFunction(
  { id: "delayed-notification" },
  { event: "user/signed-up" },
  async ({ event, step }) => {
    const { userId, email } = event.data;

    // Wait 24 hours
    await step.sleep("wait-24h", "24h");

    // Check if user is still active
    const isActive = await step.run("check-activity", async () => {
      const response = await fetch(`/api/users/${userId}/activity`);
      const data = await response.json();
      return data.active;
    });

    if (!isActive) {
      await step.run("send-engagement-email", async () => {
        await fetch("/api/email/send", {
          method: "POST",
          body: JSON.stringify({
            to: email,
            template: "engagement",
          }),
        });
      });
    }

    return { sent: !isActive };
  }
);
```

### Event Trigger
```typescript
// From your API route or app code
import { inngest } from "./client";

// Trigger an event
await inngest.send({
  name: "order/created",
  data: {
    orderId: "ord_123",
    customerId: "cus_456",
    items: [{ productId: "prod_1", quantity: 2 }],
  },
});

// Batch events
await inngest.send([
  { name: "user/created", data: { userId: "1" } },
  { name: "user/created", data: { userId: "2" } },
]);
```

### Serve Functions (Next.js App Router)
```typescript
// app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { helloWorld, orderWorkflow, delayedNotification } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve(inngest, [
  helloWorld,
  orderWorkflow,
  delayedNotification,
]);
```

### Serve Functions (Express)
```typescript
import { serve } from "inngest/express";
import { inngest } from "./client";
import { helloWorld, orderWorkflow } from "./functions";

const app = express();

app.use(
  "/api/inngest",
  serve(inngest, [helloWorld, orderWorkflow])
);
```

### Cron Jobs
```typescript
export const dailyCleanup = inngest.createFunction(
  { id: "daily-cleanup" },
  { cron: "0 0 * * *" }, // Every day at midnight
  async ({ step }) => {
    await step.run("cleanup-expired-sessions", async () => {
      const response = await fetch("/api/cleanup/sessions", {
        method: "POST",
      });
      return response.json();
    });

    await step.run("cleanup-old-logs", async () => {
      const response = await fetch("/api/cleanup/logs", {
        method: "POST",
      });
      return response.json();
    });

    return { cleanup: "completed" };
  }
);
```

### Conditional Branching with waitForEvent
```typescript
export const paymentFlow = inngest.createFunction(
  { id: "payment-flow" },
  { event: "payment/initiated" },
  async ({ event, step }) => {
    const { paymentId } = event.data;

    // Wait for confirmation event or timeout
    const confirmation = await step.waitForEvent(
      "wait-for-confirmation",
      {
        event: "payment/confirmed",
        timeout: "30m",
        if: `async.data.paymentId == "${paymentId}"`,
      }
    );

    if (confirmation) {
      await step.run("complete-payment", async () => {
        // Process confirmed payment
      });
      return { status: "completed" };
    }

    await step.run("cancel-payment", async () => {
      // Cancel expired payment
    });
    return { status: "cancelled" };
  }
);
```

## Common Commands

```bash
npm install inngest

# Start Inngest Dev Server
npx inngest-cli@latest dev

# Start with Next.js
npx inngest-cli@latest dev --no-discovery -u http://localhost:3000/api/inngest

# Deploy to Inngest Cloud
npx inngest-cli@latest deploy
```

## Environment Setup

```env
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=your-signing-key
```

## Related Resources
- [Inngest Documentation](https://www.inngest.com/docs)
- [Step Functions](https://www.inngest.com/docs/functions/step-functions)
- [Cron Jobs](https://www.inngest.com/docs/functions/cron-jobs)
- [Inngest Cloud](https://app.inngest.com/)
