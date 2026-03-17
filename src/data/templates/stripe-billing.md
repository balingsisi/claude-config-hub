# Stripe Billing Template

## Tech Stack
- stripe v14.x
- @stripe/stripe-js v2.x
- @stripe/react-stripe-js v2.x
- React 18+

## Core Patterns

### Server-side Stripe Client
```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});
```

### Create Checkout Session
```typescript
import { stripe } from './client';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId, customerId } = req.body;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.headers.origin}/cancel`,
  });

  res.status(200).json({ sessionId: session.id });
}
```

### Customer Portal
```typescript
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { customerId } = req.body;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${req.headers.origin}/account`,
  });

  res.status(200).json({ url: portalSession.url });
}
```

### React Payment Component
```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <Elements stripe={stripePromise}>{children}</Elements>;
};
```

## Webhook Handler
```typescript
import { buffer } from 'micro';
import { stripe } from './client';

export const config = { api: { bodyParser: false } };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature']!;

  const event = stripe.webhooks.constructEvent(
    buf,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case 'checkout.session.completed':
      // Handle successful checkout
      break;
    case 'customer.subscription.updated':
      // Handle subscription update
      break;
    case 'customer.subscription.deleted':
      // Handle subscription cancellation
      break;
  }

  res.json({ received: true });
}
```

## Common Commands

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

## Related Resources
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Billing](https://stripe.com/docs/billing)
