# Dub Short Links Template

## Tech Stack
- dub v0.x (dub.co SDK)
- Next.js 14+
- TypeScript 5+

## Core Patterns

### Client Setup
```typescript
import { Dub } from "dub";

const dub = new Dub({
  token: process.env.DUB_API_KEY,
});

// Or with project ID
const dub = new Dub({
  token: process.env.DUB_API_KEY,
  projectId: "xxx",
});
```

### Create Short Link
```typescript
import { Dub } from "dub";

const dub = new Dub();

export async function createShortLink(url: string, options?: {
  key?: string;
  domain?: string;
  expiresAt?: Date;
}) {
  const link = await dub.links.create({
    url,
    key: options?.key,
    domain: options?.domain || "dub.sh",
    expiresAt: options?.expiresAt,
  });

  return link;
}

// Usage
const shortLink = await createShortLink("https://example.com/very/long/url", {
  key: "my-custom-key",
});
console.log(shortLink.shortLink); // https://dub.sh/my-custom-key
```

### Retrieve Link
```typescript
export async function getLink(linkId: string) {
  const link = await dub.links.get({
    linkId,
  });

  return link;
}

// Get by external ID
export async function getLinkByExternalId(externalId: string) {
  const link = await dub.links.get({
    externalId,
  });

  return link;
}
```

### List Links
```typescript
export async function listLinks(options?: {
  domain?: string;
  tagId?: string;
  search?: string;
}) {
  const { result } = await dub.links.list({
    domain: options?.domain,
    tagId: options?.tagId,
    search: options?.search,
  });

  return result;
}
```

### Update Link
```typescript
export async function updateLink(linkId: string, updates: {
  url?: string;
  key?: string;
  title?: string;
  description?: string;
}) {
  const link = await dub.links.update({
    linkId,
    url: updates.url,
    key: updates.key,
    title: updates.title,
    description: updates.description,
  });

  return link;
}
```

### Delete Link
```typescript
export async function deleteLink(linkId: string) {
  await dub.links.delete({
    linkId,
  });

  return { deleted: true };
}
```

### Analytics
```typescript
export async function getLinkAnalytics(linkId: string) {
  const analytics = await dub.analytics.retrieve({
    linkId,
    interval: "30d",
  });

  return analytics;
}

// Click events
export async function getClickEvents(linkId: string) {
  const events = await dub.analytics.clicks({
    linkId,
  });

  return events;
}
```

### QR Code Generation
```typescript
export async function generateQRCode(linkId: string, options?: {
  size?: number;
  level?: "L" | "M" | "Q" | "H";
}) {
  const qr = await dub.qr.get({
    linkId,
    size: options?.size || 256,
    level: options?.level || "M",
  });

  return qr;
}

// Get QR code URL directly
const qrUrl = `https://api.dub.co/qr/${linkId}?size=512`;
```

### Tags Management
```typescript
// Create tag
export async function createTag(name: string, color?: string) {
  const tag = await dub.tags.create({
    name,
    color: color || "gray",
  });

  return tag;
}

// Assign tag to link
export async function assignTagToLink(linkId: string, tagId: string) {
  const link = await dub.links.update({
    linkId,
    tagIds: [tagId],
  });

  return link;
}
```

### Webhook Handling
```typescript
import { Webhook } from "dub/utils/webhook";

export async function handleWebhook(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("dub-signature")!;

  const webhook = new Webhook(process.env.DUB_WEBHOOK_SECRET!);

  try {
    const event = webhook.verify(body, signature);

    switch (event.type) {
      case "link.created":
        console.log("Link created:", event.data);
        break;
      case "link.clicked":
        console.log("Link clicked:", event.data);
        break;
      case "link.updated":
        console.log("Link updated:", event.data);
        break;
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }
}
```

### Next.js Integration
```typescript
// app/api/shorten/route.ts
import { Dub } from "dub";
import { NextResponse } from "next/server";

const dub = new Dub();

export async function POST(request: Request) {
  const { url, key } = await request.json();

  const link = await dub.links.create({
    url,
    key,
  });

  return NextResponse.json(link);
}

// app/api/links/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const link = await dub.links.get({
    linkId: params.id,
  });

  return NextResponse.json(link);
}
```

## Common Commands

```bash
npm install dub

# Development
npm run dev

# Deploy
vercel deploy
```

## Environment Setup

```env
DUB_API_KEY=dub_xxx
DUB_WEBHOOK_SECRET=whsec_xxx
```

## API Response Types
```typescript
interface Link {
  id: string;
  domain: string;
  key: string;
  url: string;
  shortLink: string;
  qrCode: string;
  title: string | null;
  description: string | null;
  image: string | null;
  clicks: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}
```

## Related Resources
- [Dub Documentation](https://dub.co/docs)
- [API Reference](https://dub.co/docs/api-reference)
- [SDK Reference](https://dub.co/docs/sdks)
- [Dub Dashboard](https://app.dub.co/)
