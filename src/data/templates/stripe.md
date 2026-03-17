# Stripe 支付集成模板

全球领先的支付处理平台，支持多币种、订阅、发票等功能。

## 技术栈

- **核心**: Stripe SDK
- **运行时**: Node.js / TypeScript
- **框架**: Next.js / Express / NestJS
- **前端**: Stripe Elements / React Stripe.js
- **Webhook**: Stripe CLI / 本地测试
- **安全**: 签名验证、幂等性控制

## 项目结构

```
stripe-integration/
├── src/
│   ├── api/
│   │   ├── checkout/          # 结账会话
│   │   │   └── route.ts
│   │   ├── subscriptions/     # 订阅管理
│   │   │   └── route.ts
│   │   ├── webhooks/          # Webhook 处理
│   │   │   └── route.ts
│   │   └── customer/          # 客户管理
│   │       └── route.ts
│   ├── lib/
│   │   ├── stripe.ts          # Stripe 客户端
│   │   ├── subscription.ts    # 订阅逻辑
│   │   └── invoice.ts         # 发票逻辑
│   ├── components/
│   │   ├── CheckoutForm.tsx   # 结账表单
│   │   ├── PricingTable.tsx   # 价格表
│   │   └── PaymentHistory.tsx # 支付历史
│   ├── hooks/
│   │   ├── useStripe.ts
│   │   └── useSubscription.ts
│   └── types/
│       └── stripe.ts
├── stripe/
│   ├── products.yaml          # 产品定义
│   └── prices.yaml            # 价格定义
├── tests/
├── .env.local
└── package.json
```

## 代码模式

### Stripe 客户端初始化

```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
  appInfo: {
    name: 'my-saas-app',
    version: '1.0.0',
  },
});

export async function getStripeCustomerId(userId: string, email: string) {
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0].id;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  return customer.id;
}
```

### Checkout Session（结账会话）

```typescript
// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { priceId, userId, email } = await req.json();

    const customerId = await getStripeCustomerId(userId, email);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

### Webhook 处理

```typescript
// app/api/webhooks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // 处理不同事件
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
      break;
    }

    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCreated(subscription);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentSucceeded(invoice);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailed(invoice);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  // 更新数据库：用户已订阅
  console.log(`User ${userId} completed checkout`);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  // 更新数据库：订阅已创建
  console.log(`Subscription created for user ${userId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  // 更新数据库：订阅已更新（升降级）
  console.log(`Subscription updated for user ${userId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  // 更新数据库：订阅已取消
  console.log(`Subscription deleted for user ${userId}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  // 更新数据库：支付成功
  console.log(`Payment succeeded for customer ${customerId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  // 更新数据库：支付失败，发送提醒
  console.log(`Payment failed for customer ${customerId}`);
}
```

### 订阅管理

```typescript
// lib/subscription.ts
import { stripe } from './stripe';

export async function createPortalSession(customerId: string) {
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
  });

  return portalSession.url;
}

export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return subscription;
}

export async function reactivateSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  return subscription;
}

export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const updatedSubscription = await stripe.subscriptions.update(
    subscriptionId,
    {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'always_invoice',
    }
  );

  return updatedSubscription;
}

export async function getSubscriptionStatus(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  return {
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    plan: subscription.items.data[0].price.nickname,
  };
}
```

### React 前端集成

```typescript
// components/CheckoutForm.tsx
'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from './PaymentForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
  priceId: string;
  userId: string;
  email: string;
}

export default function CheckoutForm({ priceId, userId, email }: CheckoutFormProps) {
  const handleCheckout = async () => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId, email }),
      });

      const { sessionId } = await response.json();

      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };

  return (
    <button onClick={handleCheckout} className="btn-primary">
      订阅
    </button>
  );
}
```

```typescript
// components/PricingTable.tsx
import { stripe } from '@/lib/stripe';

const PRICES = {
  basic: process.env.STRIPE_BASIC_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
};

export default async function PricingTable() {
  const [basic, pro, enterprise] = await Promise.all([
    stripe.prices.retrieve(PRICES.basic),
    stripe.prices.retrieve(PRICES.pro),
    stripe.prices.retrieve(PRICES.enterprise),
  ]);

  const formatPrice = (price: any) => {
    return (price.unit_amount / 100).toFixed(2);
  };

  return (
    <div className="grid grid-cols-3 gap-8">
      <div className="pricing-card">
        <h3>基础版</h3>
        <p className="price">¥{formatPrice(basic)}/月</p>
        <CheckoutForm priceId={PRICES.basic} userId="user123" email="user@example.com" />
      </div>

      <div className="pricing-card">
        <h3>专业版</h3>
        <p className="price">¥{formatPrice(pro)}/月</p>
        <CheckoutForm priceId={PRICES.pro} userId="user123" email="user@example.com" />
      </div>

      <div className="pricing-card">
        <h3>企业版</h3>
        <p className="price">¥{formatPrice(enterprise)}/月</p>
        <CheckoutForm priceId={PRICES.enterprise} userId="user123" email="user@example.com" />
      </div>
    </div>
  );
}
```

## 最佳实践

### 1. 幂等性控制

```typescript
export async function createSubscription(
  customerId: string,
  priceId: string,
  idempotencyKey: string
) {
  const subscription = await stripe.subscriptions.create(
    {
      customer: customerId,
      items: [{ price: priceId }],
    },
    {
      idempotencyKey,
    }
  );

  return subscription;
}
```

### 2. 错误处理

```typescript
import Stripe from 'stripe';

export async function handleStripeError(error: Stripe.errors.StripeError) {
  switch (error.type) {
    case 'StripeCardError':
      // 卡被拒绝
      console.error('Card declined:', error.message);
      break;

    case 'StripeRateLimitError':
      // 请求频率过高
      console.error('Rate limit exceeded');
      break;

    case 'StripeInvalidRequestError':
      // 请求参数错误
      console.error('Invalid request:', error.param);
      break;

    case 'StripeAuthenticationError':
      // API 密钥错误
      console.error('Authentication failed');
      break;

    default:
      console.error('Stripe error:', error.message);
  }
}
```

### 3. 测试模式切换

```typescript
// lib/stripe-config.ts
export function getStripeClient() {
  const isTestMode = process.env.NODE_ENV !== 'production';

  return new Stripe(
    isTestMode ? process.env.STRIPE_TEST_SECRET_KEY! : process.env.STRIPE_SECRET_KEY!,
    {
      apiVersion: '2024-06-20',
    }
  );
}
```

### 4. 订阅状态同步

```typescript
export async function syncSubscriptionStatus(userId: string, subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await db.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: subscription.status,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      stripePriceId: subscription.items.data[0].price.id,
    },
  });
}
```

## 常用命令

```bash
# 安装 Stripe SDK
npm install stripe @stripe/stripe-js @stripe/react-stripe-js

# 安装 CLI（本地测试 Webhook）
# macOS
brew install stripe/stripe-cli/stripe

# 登录
stripe login

# 转发 Webhook 到本地
stripe listen --forward-to localhost:3000/api/webhooks

# 触发测试事件
stripe trigger checkout.session.completed

# 创建测试产品和价格
stripe products create --name="Pro Plan" --description="Professional subscription"
stripe prices create --product=prod_xxx --unit-amount=9900 --currency=usd --recurring[interval]=month

# 查看客户列表
stripe customers list

# 查看订阅列表
stripe subscriptions list

# 取消订阅
stripe subscriptions cancel sub_xxx

# 导出数据
stripe data export
```

## 部署配置

### 环境变量

```bash
# .env.local
# 测试环境
STRIPE_TEST_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY=pk_test_xxx

# 生产环境
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Webhook 密钥
STRIPE_WEBHOOK_SECRET=whsec_xxx

# 价格 ID
STRIPE_BASIC_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxx
```

### Vercel 部署

```json
// vercel.json
{
  "api": {
    "webhooks": {
      "maxDuration": 10
    }
  }
}
```

### 监控与日志

```typescript
import { logger } from '@/lib/logger';

export async function logStripeEvent(event: Stripe.Event) {
  logger.info('Stripe webhook received', {
    type: event.type,
    id: event.id,
    created: event.created,
    data: event.data.object,
  });
}
```

## 常见问题

### 1. 处理重复支付

```typescript
export async function preventDuplicateCharge(customerId: string, amount: number) {
  const charges = await stripe.charges.list({
    customer: customerId,
    limit: 10,
  });

  const recentCharge = charges.data.find(charge => 
    charge.amount === amount && 
    Date.now() - charge.created * 1000 < 60000 // 1分钟内
  );

  if (recentCharge) {
    throw new Error('Duplicate charge detected');
  }
}
```

### 2. 处理汇率

```typescript
export async function convertCurrency(amount: number, from: string, to: string) {
  // 使用 Stripe 的汇率 API
  const rate = await getExchangeRate(from, to);
  return amount * rate;
}
```

### 3. 退款处理

```typescript
export async function processRefund(paymentIntentId: string, amount?: number) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount, // 可选，不传则全额退款
  });

  return refund;
}
```

## 相关资源

- [Stripe 官方文档](https://stripe.com/docs)
- [Stripe API 参考](https://stripe.com/docs/api)
- [Stripe 示例代码](https://github.com/stripe-samples)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [测试卡号](https://stripe.com/docs/testing)
