# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Temporal Workflow Orchestration
**Type**: Workflow Engine & Orchestration
**Tech Stack**: Temporal + TypeScript + Go SDK
**Goal**: Build reliable, scalable long-running workflows with durable execution

---

## Tech Stack

### Core
- **Workflow Engine**: Temporal Server 1.21+
- **SDK**: TypeScript SDK 1.8+ or Go SDK 1.24+
- **Language**: TypeScript 5.3+ or Go 1.21+
- **Architecture**: Event-sourced, Durable execution

### Temporal Components
- **Server**: Temporal Server (Cluster)
- **Worker**: Worker process executing workflows/activities
- **Client**: Temporal Client for starting workflows
- **CLI**: Temporal CLI (tctl)

### Infrastructure
- **Persistence**: PostgreSQL, MySQL, Cassandra
- **Visibility**: PostgreSQL, MySQL, Elasticsearch
- **Message Queue**: Temporal internal queue
- **Deployment**: Docker, Kubernetes

### Development
- **Package Manager**: npm or pnpm
- **Testing**: Jest + Time Skipping
- **Monitoring**: Temporal Web UI, Prometheus
- **Linting**: ESLint + Prettier

---

## Code Standards

### TypeScript Rules
- Use strict mode
- Define workflow interfaces with types
- Use deterministic code in workflows
- Enable strict null checks

```typescript
// ✅ Good
import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

interface WorkflowInput {
  orderId: string;
  customerId: string;
  amount: number;
}

interface WorkflowOutput {
  orderId: string;
  status: 'completed' | 'failed';
}

const { processPayment, sendEmail, updateInventory } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '30s',
});

export async function orderWorkflow(
  input: WorkflowInput
): Promise<WorkflowOutput> {
  // Deterministic workflow code
  const payment = await processPayment(input.orderId, input.amount);

  if (payment.success) {
    await updateInventory(input.orderId);
    await sendEmail(input.customerId, 'Order confirmed');
    return { orderId: input.orderId, status: 'completed' };
  }

  return { orderId: input.orderId, status: 'failed' };
}

// ❌ Bad
export async function orderWorkflow(input: any): Promise<any> {
  // Non-deterministic code
  const random = Math.random(); // ❌ Not deterministic
  const date = new Date(); // ❌ Not deterministic

  // No type safety
  const result = await someActivity(input.data);
  return result;
}
```

### Naming Conventions
- **Workflows**: PascalCase with Workflow suffix (`OrderWorkflow`, `PaymentWorkflow`)
- **Activities**: camelCase (`processPayment`, `sendEmail`)
- **Signals**: camelCase (`updateOrder`, `cancelOrder`)
- **Queries**: camelCase (`getOrderStatus`, `getPaymentInfo`)
- **Files**: kebab-case (`order-workflow.ts`, `payment-activities.ts`)

### File Organization
```
src/
├── workflows/             # Workflow definitions
│   ├── order-workflow.ts
│   ├── payment-workflow.ts
│   └── notification-workflow.ts
├── activities/           # Activity implementations
│   ├── payment-activities.ts
│   ├── email-activities.ts
│   └── inventory-activities.ts
├── signals/              # Signal definitions
│   ├── order-signals.ts
│   └── payment-signals.ts
├── queries/              # Query definitions
│   ├── order-queries.ts
│   └── payment-queries.ts
├── workers/              # Worker setup
│   ├── worker.ts
│   └── worker-options.ts
├── client/               # Temporal client
│   ├── client.ts
│   └── starter.ts
├── types/               # TypeScript types
│   ├── workflow-types.ts
│   └── activity-types.ts
└── index.ts             # Entry point
```

---

## Architecture Patterns

### Workflow Structure
- Single responsibility per workflow
- Use activities for side effects
- Implement proper error handling
- Use signals for external updates

```typescript
// workflows/order-workflow.ts
import {
  proxyActivities,
  defineSignal,
  defineQuery,
  setHandler,
  sleep,
} from '@temporalio/workflow';
import type * as activities from '../activities';

export const cancelSignal = defineSignal<[reason: string]>('cancel');
export const statusQuery = defineQuery<string>('status');

interface OrderState {
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  orderId: string;
  customerId: string;
  amount: number;
  cancelReason?: string;
}

const { processPayment, sendEmail, updateInventory, refundPayment } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '30s',
    retryPolicy: {
      initialInterval: '1s',
      maximumInterval: '10s',
      maximumAttempts: 3,
    },
  });

export async function orderWorkflow(input: {
  orderId: string;
  customerId: string;
  amount: number;
}): Promise<OrderState> {
  const state: OrderState = {
    status: 'pending',
    orderId: input.orderId,
    customerId: input.customerId,
    amount: input.amount,
  };

  // Set up signal handler
  setHandler(cancelSignal, (reason: string) => {
    if (state.status === 'pending' || state.status === 'processing') {
      state.status = 'cancelled';
      state.cancelReason = reason;
    }
  });

  // Set up query handler
  setHandler(statusQuery, () => state.status);

  // Process payment
  state.status = 'processing';
  const payment = await processPayment(input.orderId, input.amount);

  // Check if cancelled during processing
  if (state.status === 'cancelled') {
    await refundPayment(input.orderId);
    return state;
  }

  if (!payment.success) {
    state.status = 'completed';
    await sendEmail(input.customerId, 'Payment failed');
    return state;
  }

  // Update inventory
  await updateInventory(input.orderId);

  // Send confirmation
  await sendEmail(input.customerId, 'Order confirmed');

  state.status = 'completed';
  return state;
}
```

### Activity Implementation
- Side effects only in activities
- Proper error handling and retries
- Idempotent operations
- Heartbeat for long-running activities

```typescript
// activities/payment-activities.ts
import { Context } from '@temporalio/activity';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export async function processPayment(
  orderId: string,
  amount: number
): Promise<PaymentResult> {
  const { heartbeat } = Context.current();

  try {
    // Heartbeat for long-running operations
    heartbeat('Processing payment');

    const response = await fetch('https://api.payment.com/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount }),
    });

    if (!response.ok) {
      throw new Error(`Payment failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      transactionId: result.transactionId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function refundPayment(orderId: string): Promise<void> {
  const response = await fetch('https://api.payment.com/refund', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    throw new Error(`Refund failed: ${response.statusText}`);
  }
}
```

### Worker Configuration
- Configure task queues
- Set appropriate timeouts
- Implement graceful shutdown
- Monitor worker metrics

```typescript
// workers/worker.ts
import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from '../activities';

async function runWorker() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  });

  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    taskQueue: 'order-task-queue',
    activities,
    workflowsPath: require.resolve('../workflows'),
    maxConcurrentActivityTaskExecutions: 10,
    maxConcurrentWorkflowTaskExecutions: 20,
    maxActivitiesPerSecond: 100,
    gracefulShutdownTimeout: '30s',
  });

  await worker.run();
}

runWorker().catch((err) => {
  console.error('Worker failed:', err);
  process.exit(1);
});
```

### Workflow Client
- Start workflows with proper options
- Handle signals and queries
- Implement workflow lifecycle management

```typescript
// client/starter.ts
import { Client, Connection } from '@temporalio/client';
import { orderWorkflow } from '../workflows/order-workflow';

async function startOrderWorkflow(orderId: string, customerId: string, amount: number) {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  });

  const client = new Client({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
  });

  const handle = await client.workflow.start(orderWorkflow, {
    taskQueue: 'order-task-queue',
    workflowId: `order-${orderId}`,
    args: [{ orderId, customerId, amount }],
    workflowExecutionTimeout: '1h',
    workflowRunTimeout: '30m',
    workflowTaskTimeout: '10s',
  });

  console.log(`Started workflow ${handle.workflowId}`);

  // Query workflow status
  const status = await handle.query('status');
  console.log(`Current status: ${status}`);

  // Send signal to cancel
  await handle.signal('cancel', 'Customer requested cancellation');

  // Wait for completion
  const result = await handle.result();
  console.log('Workflow completed:', result);

  return result;
}

export { startOrderWorkflow };
```

---

## Key Constraints

### Determinism
- ✅ Use deterministic code in workflows
- ✅ Use Temporal's APIs for time and random
- ✅ Keep workflow logic simple
- ❌ Don't use `Date.now()`, `Math.random()`
- ❌ Don't use non-deterministic APIs
- ❌ Don't perform I/O in workflows

### Activity Design
- ✅ Make activities idempotent
- ✅ Use proper retry policies
- ✅ Implement heartbeats
- ❌ Don't skip error handling
- ❌ Don't exceed timeout limits
- ❌ Don't assume activities always succeed

### Workflow Lifecycle
- ✅ Handle signals properly
- ✅ Implement queries for visibility
- ✅ Use proper timeouts
- ❌ Don't block indefinitely
- ❌ Don't ignore cancellation signals
- ❌ Don't create infinite loops

---

## Common Commands

### Temporal CLI (tctl)
```bash
# Start workflow
tctl workflow start \
  --task_queue order-task-queue \
  --workflow_type orderWorkflow \
  --workflow_id order-123 \
  --input '{"orderId":"123","customerId":"user456","amount":99.99}'

# Query workflow
tctl workflow query \
  --workflow_id order-123 \
  --query_type status

# Signal workflow
tctl workflow signal \
  --workflow_id order-123 \
  --signal_type cancel \
  --input '"Customer requested cancellation"'

# Cancel workflow
tctl workflow cancel --workflow_id order-123

# Describe workflow
tctl workflow describe --workflow_id order-123

# List workflows
tctl workflow list --query="WorkflowType='orderWorkflow'"
```

### Development
```bash
npm run start          # Start worker
npm run workflow       # Start workflow
npm run test           # Run tests
npm run test:watch     # Watch mode
```

### Testing
```bash
npm test               # Run unit tests
npm run test:coverage  # Coverage report
npm run test:e2e       # Run E2E tests
```

---

## Important Prohibitions

### ❌ Never Do
- Don't use non-deterministic code in workflows
- Don't perform I/O in workflow code
- Don't use native timers (`setTimeout`, `setInterval`)
- Don't ignore activity failures
- Don't skip idempotency checks
- Don't hardcode temporal server address
- Don't commit `.env` files

### ⚠️ Use with Caution
- Long-running activities - use heartbeats
- Large payloads - consider data converters
- High cardinality workflow IDs - may impact performance
- Custom search attributes - requires Elasticsearch

---

## Best Practices

### Workflow Design
- Keep workflows simple and focused
- Use activities for side effects
- Handle failures gracefully
- Implement proper compensation

```typescript
// ✅ Good - Simple workflow with compensation
export async function orderWorkflow(input: OrderInput): Promise<OrderResult> {
  try {
    await processPayment(input);
    await updateInventory(input);
    await sendEmail(input);

    return { success: true };
  } catch (error) {
    // Compensation logic
    await refundPayment(input);
    return { success: false, error: error.message };
  }
}

// ❌ Bad - Complex logic in workflow
export async function complexWorkflow(input: any) {
  // Too much business logic
  const data = await fetch('/api/data'); // ❌ I/O in workflow
  const result = complexCalculation(data); // ❌ Too complex

  return result;
}
```

### Error Handling
- Use retry policies appropriately
- Implement proper error types
- Handle timeouts
- Log errors with context

```typescript
// ✅ Good - Proper error handling
const { processPayment } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30s',
  retryPolicy: {
    initialInterval: '1s',
    backoffCoefficient: 2,
    maximumInterval: '10s',
    maximumAttempts: 3,
    nonRetryableErrorTypes: ['PaymentDeclinedError'],
  },
});

try {
  await processPayment(input);
} catch (error) {
  if (error instanceof PaymentDeclinedError) {
    // Non-retryable error
    await sendEmail(input.customerId, 'Payment declined');
    return { success: false };
  }
  throw error; // Retryable error
}
```

### Time Skipping in Tests
- Use `TestWorkflowEnvironment` for testing
- Skip time in long-running workflow tests
- Mock activities for unit tests

```typescript
// tests/order-workflow.test.ts
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { orderWorkflow } from '../workflows/order-workflow';

describe('OrderWorkflow', () => {
  let testEnv: TestWorkflowEnvironment;

  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  afterAll(async () => {
    await testEnv.close();
  });

  it('should complete order successfully', async () => {
    const { client, nativeConnection } = testEnv;

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue: 'test',
      workflowsPath: require.resolve('../workflows/order-workflow'),
      activities: {
        processPayment: async () => ({ success: true }),
        sendEmail: async () => undefined,
        updateInventory: async () => undefined,
      },
    });

    await worker.runUntil(async () => {
      const result = await client.workflow.execute(orderWorkflow, {
        taskQueue: 'test',
        workflowId: 'test-order-123',
        args: [{ orderId: '123', customerId: 'user456', amount: 99.99 }],
      });

      expect(result.status).toBe('completed');
    });
  });

  it('should handle cancellation', async () => {
    const { client, nativeConnection } = testEnv;

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue: 'test',
      workflowsPath: require.resolve('../workflows/order-workflow'),
      activities: {
        processPayment: async () => {
          await sleep('5s');
          return { success: true };
        },
        sendEmail: async () => undefined,
        updateInventory: async () => undefined,
        refundPayment: async () => undefined,
      },
    });

    await worker.runUntil(async () => {
      const handle = await client.workflow.start(orderWorkflow, {
        taskQueue: 'test',
        workflowId: 'test-order-456',
        args: [{ orderId: '456', customerId: 'user789', amount: 99.99 }],
      });

      // Skip time
      await testEnv.sleep(client, '3s');

      // Send cancel signal
      await handle.signal('cancel', 'Customer cancelled');

      const result = await handle.result();
      expect(result.status).toBe('cancelled');
    });
  });
});
```

---

## Compact Instructions

When using `/compact`, preserve:
- Workflow definition changes
- Activity interface modifications
- Signal/query definitions
- Worker configuration updates
- Test commands and results

Discard:
- Verbose log output
- Exploratory search dead ends
- Redundant confirmation messages

---

## Quick Reference

### File Locations
- Workflows: `src/workflows/*.ts`
- Activities: `src/activities/*.ts`
- Signals: `src/signals/*.ts`
- Queries: `src/queries/*.ts`
- Workers: `src/workers/*.ts`
- Client: `src/client/*.ts`

### Environment Variables
```env
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TASK_QUEUE=order-task-queue
WORKFLOW_TIMEOUT=1h
ACTIVITY_TIMEOUT=30s
```

### Temporal Concepts
```typescript
// Workflow
export async function myWorkflow(input: Input): Promise<Output> {}

// Activity
export async function myActivity(input: Input): Promise<Output> {}

// Signal
export const mySignal = defineSignal<[string]>('mySignal');

// Query
export const myQuery = defineQuery<string>('myQuery');

// Timer
await sleep('30s');

// Condition
await condition(() => someState, '1m');
```

---

**Last Updated**: 2026-03-17
