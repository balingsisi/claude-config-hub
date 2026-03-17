# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Payload CMS Application
**Type**: Headless Content Management System
**Tech Stack**: Payload CMS 3.0 + Next.js + PostgreSQL
**Goal**: Production-ready headless CMS with custom admin panel and frontend

---

## Tech Stack

### Core
- **CMS**: Payload CMS 3.0
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3+
- **Database**: PostgreSQL 15+

### Services
- **Storage**: Local filesystem or S3
- **Email**: Resend / SendGrid
- **Search**: Payload built-in or Algolia
- **Cache**: Redis (optional)

### Development
- **Package Manager**: pnpm
- **Linting**: ESLint + Prettier
- **Testing**: Jest + Payload Testing Utilities

---

## Project Structure

```
payload-cms/
├── src/
│   ├── collections/
│   │   ├── Posts/
│   │   │   ├── index.ts
│   │   │   ├── hooks.ts
│   │   │   └── access.ts
│   │   ├── Media/
│   │   │   ├── index.ts
│   │   │   └── access.ts
│   │   ├── Users/
│   │   │   ├── index.ts
│   │   │   └── access.ts
│   │   ├── Categories/
│   │   ├── Tags/
│   │   └── Pages/
│   ├── globals/
│   │   ├── Header/
│   │   │   └── index.ts
│   │   ├── Footer/
│   │   └── Settings/
│   ├── blocks/
│   │   ├── Hero/
│   │   │   ├── index.ts
│   │   │   └── Component.tsx
│   │   ├── Content/
│   │   ├── Gallery/
│   │   ├── CallToAction/
│   │   └── Features/
│   ├── fields/
│   │   ├── slug.ts
│   │   ├── seo.ts
│   │   └── link.ts
│   ├── hooks/
│   │   ├── revalidate.ts
│   │   ├── populateSlug.ts
│   │   └── index.ts
│   ├── access/
│   │   ├── isAdmin.ts
│   │   ├── isPublished.ts
│   │   └── isLoggedIn.ts
│   ├── plugins/
│   │   └── index.ts
│   ├── payload.config.ts
│   └── server.ts
├── public/
│   └── assets/
├── .env
├── .env.example
└── package.json

frontend/ (Next.js)
├── src/
│   ├── app/
│   │   ├── (frontend)/
│   │   │   ├── page.tsx
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   └── [...slug]/
│   │   │       └── page.tsx
│   │   └── api/
│   │       └── revalidate/
│   │           └── route.ts
│   ├── lib/
│   │   ├── payload/
│   │   │   ├── client.ts
│   │   │   └── queries.ts
│   │   └── utils.ts
│   ├── components/
│   │   ├── blocks/
│   │   │   ├── Hero.tsx
│   │   │   ├── Content.tsx
│   │   │   └── Gallery.tsx
│   │   └── ui/
│   └── providers/
└── next.config.js
```

---

## Coding Rules

### 1. Collection Definition

```typescript
// src/collections/Posts/index.ts
import { CollectionConfig } from "payload";
import { slugField } from "@/fields/slug";
import { seoField } from "@/fields/seo";
import { authenticated } from "@/access/isLoggedIn";
import { isAdmin } from "@/access/isAdmin";
import { revalidatePost } from "./hooks";

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "publishedAt", "author"],
    group: "Content",
    description: "Blog posts and articles",
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return {
        status: { equals: "published" },
        publishedAt: { less_than: new Date().toISOString() },
      };
    },
    create: authenticated,
    update: ({ req }) => {
      if (req.user?.role === "admin") return true;
      return {
        author: { equals: req.user?.id },
      };
    },
    delete: isAdmin,
  },
  hooks: {
    afterChange: [revalidatePost],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      index: true,
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      required: true,
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Scheduled", value: "scheduled" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "excerpt",
      type: "textarea",
      admin: {
        rows: 3,
      },
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      filterOptions: {
        mimeType: { contains: "image" },
      },
    },
    {
      name: "content",
      type: "richText",
      required: true,
    },
    {
      name: "blocks",
      type: "blocks",
      blocks: ["hero", "content", "gallery", "callToAction"],
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
      admin: {
        position: "sidebar",
      },
    },
    ...slugField("title"),
    ...seoField(),
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "relatedPosts",
      type: "relationship",
      relationTo: "posts",
      hasMany: true,
      filterOptions: ({ id }) => ({
        id: { not_equals: id },
      }),
    },
  ],
};
```

### 2. Custom Fields

```typescript
// src/fields/slug.ts
import { Field } from "payload";

type SlugFieldOptions = {
  source: string;
  prefix?: string;
};

export const slugField = (source: string, options?: SlugFieldOptions): Field[] => [
  {
    name: "slug",
    type: "text",
    index: true,
    admin: {
      position: "sidebar",
      readOnly: true,
    },
    hooks: {
      beforeValidate: [
        ({ value, data, operation }) => {
          if (operation === "create" || operation === "update") {
            if (data[source] && !value) {
              const slug = data[source]
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
              return options?.prefix ? `${options.prefix}/${slug}` : slug;
            }
          }
          return value;
        },
      ],
    },
  },
];

// src/fields/seo.ts
import { Field } from "payload";

export const seoField = (): Field[] => [
  {
    name: "seo",
    type: "group",
    admin: {
      position: "sidebar",
    },
    fields: [
      {
        name: "title",
        type: "text",
        admin: {
          placeholder: "Leave empty to use default title",
        },
      },
      {
        name: "description",
        type: "textarea",
        admin: {
          rows: 3,
          placeholder: "Leave empty to use default description",
        },
      },
      {
        name: "image",
        type: "upload",
        relationTo: "media",
      },
      {
        name: "noIndex",
        type: "checkbox",
        defaultValue: false,
        admin: {
          description: "Prevent search engines from indexing this page",
        },
      },
      {
        name: "noFollow",
        type: "checkbox",
        defaultValue: false,
      },
    ],
  },
];

// src/fields/link.ts
import { Field } from "payload";

export const linkField = (name = "link"): Field => ({
  name,
  type: "group",
  fields: [
    {
      name: "type",
      type: "radio",
      defaultValue: "reference",
      options: [
        { label: "Internal Link", value: "reference" },
        { label: "Custom URL", value: "custom" },
      ],
    },
    {
      name: "reference",
      type: "relationship",
      relationTo: ["pages", "posts"],
      admin: {
        condition: (_, siblingData) => siblingData?.type === "reference",
      },
    },
    {
      name: "url",
      type: "text",
      admin: {
        condition: (_, siblingData) => siblingData?.type === "custom",
      },
    },
    {
      name: "label",
      type: "text",
      required: true,
    },
    {
      name: "newTab",
      type: "checkbox",
      defaultValue: false,
    },
  ],
});
```

### 3. Blocks Definition

```typescript
// src/blocks/Hero/index.ts
import { Block } from "payload";
import { linkField } from "@/fields/link";

export const HeroBlock: Block = {
  slug: "hero",
  interfaceName: "HeroBlock",
  fields: [
    {
      name: "type",
      type: "select",
      defaultValue: "fullWidth",
      options: [
        { label: "Full Width", value: "fullWidth" },
        { label: "Split", value: "split" },
        { label: "Minimal", value: "minimal" },
      ],
    },
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "subtitle",
      type: "text",
    },
    {
      name: "description",
      type: "richText",
    },
    {
      name: "backgroundType",
      type: "select",
      defaultValue: "image",
      options: [
        { label: "Image", value: "image" },
        { label: "Video", value: "video" },
        { label: "Color", value: "color" },
      ],
    },
    {
      name: "backgroundImage",
      type: "upload",
      relationTo: "media",
      admin: {
        condition: (_, siblingData) => siblingData?.backgroundType === "image",
      },
    },
    {
      name: "backgroundColor",
      type: "text",
      admin: {
        condition: (_, siblingData) => siblingData?.backgroundType === "color",
      },
    },
    linkField("primaryLink"),
    linkField("secondaryLink"),
  ],
};

// src/blocks/Content/index.ts
import { Block } from "payload";

export const ContentBlock: Block = {
  slug: "content",
  interfaceName: "ContentBlock",
  fields: [
    {
      name: "layout",
      type: "select",
      defaultValue: "single",
      options: [
        { label: "Single Column", value: "single" },
        { label: "Two Columns", value: "twoColumns" },
        { label: "Three Columns", value: "threeColumns" },
      ],
    },
    {
      name: "content",
      type: "richText",
      required: true,
    },
    {
      name: "columnTwo",
      type: "richText",
      admin: {
        condition: (_, siblingData) =>
          ["twoColumns", "threeColumns"].includes(siblingData?.layout),
      },
    },
    {
      name: "columnThree",
      type: "richText",
      admin: {
        condition: (_, siblingData) => siblingData?.layout === "threeColumns",
      },
    },
  ],
};

// src/blocks/index.ts
export const blocks = [HeroBlock, ContentBlock];
```

### 4. Access Control

```typescript
// src/access/isAdmin.ts
import { Access } from "payload";

export const isAdmin: Access = ({ req: { user } }) => {
  return user?.role === "admin";
};

// src/access/isLoggedIn.ts
import { Access } from "payload";

export const authenticated: Access = ({ req: { user } }) => {
  return !!user;
};

// src/access/isPublished.ts
import { Access } from "payload";

export const isPublishedOrAdmin: Access = ({ req: { user } }) => {
  if (user?.role === "admin") return true;

  return {
    or: [
      {
        status: { equals: "published" },
        publishedAt: { less_than: new Date().toISOString() },
      },
    ],
  };
};
```

### 5. Hooks

```typescript
// src/collections/Posts/hooks.ts
import { CollectionAfterChangeHook } from "payload";
import { revalidatePath, revalidateTag } from "next/cache";

export const revalidatePost: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  operation,
}) => {
  if (operation === "create" || operation === "update") {
    const path = `/blog/${doc.slug}`;
    revalidatePath(path);
    revalidateTag("posts");
  }

  if (operation === "update" && previousDoc?.slug !== doc?.slug) {
    const oldPath = `/blog/${previousDoc.slug}`;
    revalidatePath(oldPath);
  }

  return doc;
};

// src/hooks/populateSlug.ts
import { FieldHook } from "payload";

export const formatSlug = (val: string): string =>
  val
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const populateSlug: FieldHook = ({ value, data, operation }) => {
  if (operation === "create" || operation === "update") {
    if (data?.title && !value) {
      return formatSlug(data.title);
    }
  }
  return value;
};
```

### 6. Payload Config

```typescript
// src/payload.config.ts
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { webpackBundler } from "@payloadcms/bundler-webpack";
import path from "path";
import { Posts } from "./collections/Posts";
import { Media } from "./collections/Media";
import { Users } from "./collections/Users";
import { Categories } from "./collections/Categories";
import { Tags } from "./collections/Tags";
import { Pages } from "./collections/Pages";
import { Header } from "./globals/Header";
import { Footer } from "./globals/Footer";
import { Settings } from "./globals/Settings";
import { plugins } from "./plugins";

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3000",
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
    meta: {
      titleSuffix: " | CMS",
      favicon: "/favicon.ico",
    },
  },
  collections: [Posts, Media, Users, Categories, Tags, Pages],
  globals: [Header, Footer, Settings],
  editor: lexicalEditor({}),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),
  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, "generated-schema.graphql"),
  },
  plugins: plugins,
  cors: [
    process.env.PAYLOAD_PUBLIC_SERVER_URL,
    process.env.PAYLOAD_PUBLIC_FRONTEND_URL,
  ].filter(Boolean),
  csrf: [
    process.env.PAYLOAD_PUBLIC_SERVER_URL,
    process.env.PAYLOAD_PUBLIC_FRONTEND_URL,
  ].filter(Boolean),
});
```

### 7. Frontend Client

```typescript
// frontend/src/lib/payload/client.ts
import { unstable_cache } from "next/cache";

const PAYLOAD_API = process.env.NEXT_PUBLIC_PAYLOAD_API_URL || "http://localhost:3000/api";

type Where = {
  [key: string]: {
    equals?: string | number | boolean;
    not_equals?: string | number | boolean;
    contains?: string;
    in?: (string | number)[];
    all?: (string | number)[];
    greater_than?: number;
    less_than?: number;
  };
};

export async function payloadFetch<T>(
  collection: string,
  options?: {
    id?: string;
    where?: Where;
    sort?: string;
    limit?: number;
    page?: number;
    depth?: number;
  }
): Promise<T> {
  const searchParams = new URLSearchParams();

  if (options?.where) {
    Object.entries(options.where).forEach(([key, value]) => {
      Object.entries(value).forEach(([operator, operand]) => {
        if (operand !== undefined) {
          searchParams.append(`where[${key}][${operator}]`, String(operand));
        }
      });
    });
  }

  if (options?.sort) searchParams.append("sort", options.sort);
  if (options?.limit) searchParams.append("limit", String(options.limit));
  if (options?.page) searchParams.append("page", String(options.page));
  if (options?.depth !== undefined) searchParams.append("depth", String(options.depth));

  const url = options?.id
    ? `${PAYLOAD_API}/${collection}/${options.id}`
    : `${PAYLOAD_API}/${collection}?${searchParams.toString()}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${collection}: ${res.statusText}`);
  }

  const json = await res.json();
  return options?.id ? json : json.docs || json;
}

export const getPost = unstable_cache(
  async (slug: string) => {
    const posts = await payloadFetch<Post>("posts", {
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
    });
    return posts[0];
  },
  ["post"],
  { tags: ["posts"], revalidate: 60 }
);

export const getPosts = unstable_cache(
  async (limit = 10, page = 1) => {
    return payloadFetch<Post[]>("posts", {
      where: {
        status: { equals: "published" },
        publishedAt: { less_than: new Date().toISOString() },
      },
      sort: "-publishedAt",
      limit,
      page,
      depth: 1,
    });
  },
  ["posts"],
  { tags: ["posts"], revalidate: 60 }
);
```

### 8. Revalidation API

```typescript
// frontend/src/app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path");
  const tag = request.nextUrl.searchParams.get("tag");

  if (path) {
    revalidatePath(path);
  }

  if (tag) {
    revalidateTag(tag);
  }

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
```

---

## Environment Variables

```bash
# .env

# Database
DATABASE_URI=postgres://user:password@localhost:5432/payload

# Payload
PAYLOAD_SECRET=your-secret-key-min-32-chars
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
PAYLOAD_PUBLIC_FRONTEND_URL=http://localhost:3001

# Email (Optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_FROM_ADDRESS=noreply@example.com

# Storage (Optional - S3)
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx
S3_BUCKET=my-bucket
S3_REGION=us-east-1
S3_ENDPOINT=xxx

# Revalidation
REVALIDATION_SECRET=your-revalidation-secret

# Node
NODE_ENV=development
```

---

## Common Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Start production
pnpm start

# Generate types
pnpm generate:types

# Generate GraphQL schema
pnpm generate:graphql

# Create admin user
pnpm create-admin admin@example.com

# Database migration
pnpm payload migrate:create
pnpm payload migrate

# Export data
pnpm payload export --collection posts --output backup.json

# Import data
pnpm payload import --collection posts --input backup.json

# Reset database
pnpm payload reset

# Testing
pnpm test
pnpm test:watch
```

---

## Deployment Checklist

- [ ] Configure PostgreSQL database
- [ ] Set secure PAYLOAD_SECRET (32+ chars)
- [ ] Configure CORS and CSRF origins
- [ ] Set up email provider
- [ ] Configure file storage (S3 recommended)
- [ ] Set up revalidation webhook
- [ ] Enable SSL/HTTPS
- [ ] Configure rate limiting
- [ ] Set up error monitoring (Sentry)
- [ ] Configure backup for database
- [ ] Set up CDN for media files
- [ ] Test access control rules
- [ ] Review public API exposure
- [ ] Configure caching headers
