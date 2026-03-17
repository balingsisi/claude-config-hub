# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Medusa E-commerce Platform
**Type**: Headless Commerce Backend
**Tech Stack**: MedusaJS 2.0 + PostgreSQL + Redis + Next.js Storefront
**Goal**: Production-ready headless e-commerce platform with multi-region support

---

## Tech Stack

### Core
- **Framework**: MedusaJS 2.0
- **Language**: TypeScript 5.3+
- **Runtime**: Node.js 20+
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+

### Services
- **Payments**: Stripe, PayPal
- **Shipping**: Custom fulfillment providers
- **Storage**: MinIO / S3
- **Search**: Meilisearch / Algolia
- **Email**: SendGrid / Resend

### Frontend
- **Storefront**: Next.js 14 (App Router)
- **Admin**: Medusa Admin Dashboard
- **UI**: Tailwind CSS + shadcn/ui

### Development
- **Package Manager**: pnpm
- **Testing**: Jest + Medusa Testing Utils
- **Linting**: ESLint + Prettier

---

## Project Structure

```
medusa-backend/
├── src/
│   ├── modules/
│   │   ├── product/
│   │   │   ├── models/
│   │   │   │   └── product.ts
│   │   │   ├── services/
│   │   │   │   └── product.service.ts
│   │   │   ├── workflows/
│   │   │   │   └── create-product.ts
│   │   │   └── index.ts
│   │   ├── order/
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   └── workflows/
│   │   ├── customer/
│   │   ├── payment/
│   │   ├── fulfillment/
│   │   └── inventory/
│   ├── workflows/
│   │   ├── definitions/
│   │   │   └── order-placed.ts
│   │   └── hooks/
│   │       └── order-hooks.ts
│   ├── subscribers/
│   │   ├── order-subscriber.ts
│   │   └── product-subscriber.ts
│   ├── api/
│   │   ├── routes/
│   │   │   ├── admin/
│   │   │   │   └── custom/
│   │   │   └── store/
│   │   │       └── products/
│   │   │           └── [id]/route.ts
│   │   └── middlewares/
│   │       └── auth.ts
│   ├── jobs/
│   │   ├── inventory-sync.ts
│   │   └── order-confirmation.ts
│   └── loaders/
│       └── index.ts
├── .medusa/
│   └── server-config.ts
├── medusa-config.ts
├── medusa-config.prod.ts
└── package.json

storefront/
├── src/
│   ├── app/
│   │   ├── (main)/
│   │   │   ├── page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [handle]/
│   │   │   │       └── page.tsx
│   │   │   ├── categories/
│   │   │   │   └── [handle]/page.tsx
│   │   │   └── cart/
│   │   │       └── page.tsx
│   │   ├── (checkout)/
│   │   │   ├── checkout/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── address/
│   │   │   │   ├── shipping/
│   │   │   │   └── payment/
│   │   │   └── order/
│   │   │       └── [id]/page.tsx
│   │   └── api/
│   │       └── webhooks/
│   │           └── medusa/route.ts
│   ├── lib/
│   │   ├── medusa/
│   │   │   ├── client.ts
│   │   │   └── cart.ts
│   │   └── hooks/
│   │       ├── use-cart.ts
│   │       └── use-products.ts
│   ├── modules/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── products/
│   │   └── layout/
│   └── types/
│       └── global.ts
└── medusa.config.ts
```

---

## Coding Rules

### 1. Medusa Module Definition

```typescript
// src/modules/product/models/product.ts
import { model } from "@medusajs/framework/utils";
import { ProductVariant } from "./product-variant";

export const Product = model.define("product", {
  id: model.id({ prefix: "prod" }).primaryKey(),
  title: model.text(),
  handle: model.text().unique(),
  description: model.text().nullable(),
  subtitle: model.text().nullable(),
  isGiftcard: model.boolean().default(false),
  status: model.enum(["published", "draft", "proposed", "rejected"]).default("draft"),
  thumbnail: model.text().nullable(),
  weight: model.number().nullable(),
  length: model.number().nullable(),
  height: model.number().nullable(),
  width: model.number().nullable(),
  hsCode: model.text().nullable(),
  originCountry: model.text().nullable(),
  midCode: model.text().nullable(),
  material: model.text().nullable(),
  metadata: model.json().nullable(),
  variants: model.hasMany(() => ProductVariant),
});

// src/modules/product/index.ts
import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import { ProductService } from "./services/product.service";

export const PRODUCT_MODULE = "productModule";

export default ModuleProvider(PRODUCT_MODULE, {
  services: [ProductService],
});
```

### 2. Product Service

```typescript
// src/modules/product/services/product.service.ts
import { MedusaError, Modules } from "@medusajs/framework/utils";
import {
  createProductWorkflow,
  updateProductWorkflow,
  deleteProductWorkflow,
} from "@medusajs/core-flows";
import { ProductService } from "@medusajs/medusa";

type InjectedDependencies = {
  [Modules.PRODUCT]: ProductModuleService;
};

export default class CustomProductService extends ProductService {
  protected productModuleService: ProductModuleService;

  constructor({ productModuleService }: InjectedDependencies) {
    super({ productModuleService });
    this.productModuleService = productModuleService;
  }

  async retrieveByHandle(handle: string) {
    const [product] = await this.productModuleService.list(
      { handle },
      { relations: ["variants", "images", "categories", "tags"] }
    );

    if (!product) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product with handle ${handle} not found`
      );
    }

    return product;
  }

  async searchProducts(query: string, limit = 20, offset = 0) {
    const { rows, metadata } = await this.productModuleService.listAndCount(
      {
        $or: [
          { title: { $ilike: `%${query}%` } },
          { description: { $ilike: `%${query}%` } },
        ],
      },
      {
        skip: offset,
        take: limit,
        relations: ["variants", "images"],
      }
    );

    return { products: rows, count: metadata.count };
  }

  async getProductsByCategory(categoryId: string) {
    return await this.productModuleService.list(
      { categories: { id: categoryId } },
      { relations: ["variants", "images", "categories"] }
    );
  }
}
```

### 3. Custom Workflow

```typescript
// src/modules/product/workflows/create-product.ts
import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";

type CreateProductInput = {
  title: string;
  handle: string;
  description?: string;
  isGiftcard?: boolean;
  thumbnail?: string;
  variants?: CreateVariantInput[];
};

type CreateVariantInput = {
  title: string;
  sku: string;
  prices: { amount: number; currencyCode: string }[];
  inventoryQuantity?: number;
};

const validateProductInputStep = createStep(
  "validate-product-input",
  async (input: CreateProductInput) => {
    if (!input.title || input.title.length < 3) {
      throw new Error("Product title must be at least 3 characters");
    }

    if (!input.handle || !/^[a-z0-9-]+$/.test(input.handle)) {
      throw new Error("Product handle must be lowercase alphanumeric with hyphens");
    }

    return StepResponse.pass(input);
  }
);

const createProductStep = createStep(
  "create-product",
  async (input: CreateProductInput, { container }) => {
    const productModule = container.resolve(Modules.PRODUCT);

    const product = await productModule.create({
      title: input.title,
      handle: input.handle,
      description: input.description,
      is_giftcard: input.isGiftcard || false,
      thumbnail: input.thumbnail,
      status: "draft",
    });

    return new StepResponse(product, product.id);
  },
  async (productId, { container }) => {
    const productModule = container.resolve(Modules.PRODUCT);
    await productModule.delete(productId);
  }
);

const createVariantsStep = createStep(
  "create-variants",
  async (
    input: { productId: string; variants: CreateVariantInput[] },
    { container }
  ) => {
    const productModule = container.resolve(Modules.PRODUCT);
    const pricingModule = container.resolve(Modules.PRICING);

    const variants = await Promise.all(
      input.variants.map(async (variant, index) => {
        const createdVariant = await productModule.createVariants({
          product_id: input.productId,
          title: variant.title,
          sku: variant.sku,
          options: {},
        });

        // Create prices
        await Promise.all(
          variant.prices.map((price) =>
            pricingModule.createPriceSetMoneyAmount({
              price_set_id: createdVariant.price_set_id,
              money_amount_id: price.amount.toString(),
              currency_code: price.currencyCode,
            })
          )
        );

        return createdVariant;
      })
    );

    return new StepResponse(variants);
  }
);

export const createProductWithVariantsWorkflow = createWorkflow(
  "create-product-with-variants",
  (input: CreateProductInput) => {
    const validatedInput = validateProductInputStep(input);
    const product = createProductStep(validatedInput);

    if (input.variants?.length) {
      createVariantsStep({ productId: product.id, variants: input.variants });
    }

    return new WorkflowResponse(product);
  }
);
```

### 4. Order Subscriber

```typescript
// src/subscribers/order-subscriber.ts
import { Subscriber, SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { Modules } from "@medusajs/framework/utils";

type OrderPlacedEvent = {
  id: string;
  order: {
    id: string;
    email: string;
    total: number;
    items: any[];
    shipping_address: any;
  };
};

export default class OrderSubscriber implements Subscriber {
  private notificationService: any;

  constructor({ notificationService }) {
    this.notificationService = notificationService;
  }

  async handleOrderPlaced({ data }: SubscriberArgs<OrderPlacedEvent>) {
    const { order } = data;

    // Send order confirmation email
    await this.notificationService.send({
      to: order.email,
      template: "order-confirmation",
      data: {
        orderId: order.id,
        items: order.items,
        total: order.total,
        shippingAddress: order.shipping_address,
      },
    });

    // Update inventory
    for (const item of order.items) {
      // Inventory update logic here
    }

    // Track analytics
    // await this.analyticsService.track("order_placed", { ... });
  }

  async handleOrderShipped({ data }: SubscriberArgs<{ id: string }>) {
    // Handle shipping notification
  }

  async handleOrderDelivered({ data }: SubscriberArgs<{ id: string }>) {
    // Handle delivery notification and review request
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.shipment_created", "order.delivered"],
  context: {
    subscriberId: "order-subscriber",
  },
};
```

### 5. Custom API Route

```typescript
// src/api/routes/store/products/[id]/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params;
  const productModule = req.scope.resolve(Modules.PRODUCT);

  const product = await productModule.retrieve(id, {
    relations: [
      "variants",
      "variants.prices",
      "images",
      "categories",
      "tags",
      "options",
      "options.values",
    ],
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  // Get inventory for each variant
  const inventoryModule = req.scope.resolve(Modules.INVENTORY);
  const inventoryItems = await Promise.all(
    product.variants.map(async (variant) => {
      const inventory = await inventoryModule.retrieve(variant.inventory_item_id);
      return {
        variant_id: variant.id,
        quantity: inventory.stocked_quantity,
      };
    })
  );

  return res.json({
    product,
    inventory: inventoryItems,
  });
}

export async function POST(
  req: MedusaRequest<{
    variant_id: string;
    quantity: number;
  }>,
  res: MedusaResponse
) {
  // Custom endpoint to add to cart, etc.
  const { variant_id, quantity } = req.body;

  // Validation
  if (!variant_id || !quantity || quantity < 1) {
    return res.status(400).json({ message: "Invalid request" });
  }

  // Add to cart logic here

  return res.json({ success: true });
}
```

### 6. Storefront Client

```typescript
// storefront/src/lib/medusa/client.ts
import Medusa from "@medusajs/js-sdk";

const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

export const medusa = new Medusa({
  baseUrl: backendUrl,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
});

export const getProduct = async (handle: string) => {
  const { products } = await medusa.store.product.list({
    handle,
    limit: 1,
    fields: "*variants,*variants.prices,*images,*categories",
  });

  return products[0];
};

export const getProducts = async ({
  limit = 20,
  offset = 0,
  categoryId,
}: {
  limit?: number;
  offset?: number;
  categoryId?: string;
} = {}) => {
  const query: any = { limit, offset };

  if (categoryId) {
    query.category_id = [categoryId];
  }

  const { products, count } = await medusa.store.product.list({
    ...query,
    fields: "*variants,*variants.prices,*thumbnail",
  });

  return { products, count };
};

export const createCart = async () => {
  const { cart } = await medusa.store.cart.create({
    region_id: process.env.NEXT_PUBLIC_DEFAULT_REGION_ID!,
  });
  return cart;
};

export const addToCart = async (cartId: string, variantId: string, quantity: number) => {
  const { cart } = await medusa.store.cart.lineItem.create(cartId, {
    variant_id: variantId,
    quantity,
  });
  return cart;
};

export const updateCart = async (cartId: string, data: any) => {
  const { cart } = await medusa.store.cart.update(cartId, data);
  return cart;
};

export const completeCart = async (cartId: string) => {
  const { order } = await medusa.store.cart.complete(cartId);
  return order;
};
```

### 7. Storefront Cart Hook

```typescript
// storefront/src/lib/hooks/use-cart.ts
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  createCart,
  addToCart as addToCartApi,
  updateCart as updateCartApi,
  completeCart as completeCartApi,
} from "@/lib/medusa/client";

interface CartItem {
  id: string;
  variant_id: string;
  product_title: string;
  variant_title: string;
  thumbnail: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Cart {
  id: string | null;
  items: CartItem[];
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  total: number;
}

interface CartState {
  cart: Cart;
  isLoading: boolean;
  initCart: () => Promise<void>;
  addItem: (variantId: string, quantity: number) => Promise<void>;
  updateItem: (lineItemId: string, quantity: number) => Promise<void>;
  removeItem: (lineItemId: string) => Promise<void>;
  completeCart: () => Promise<string | null>;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      cart: {
        id: null,
        items: [],
        subtotal: 0,
        tax_total: 0,
        shipping_total: 0,
        total: 0,
      },
      isLoading: false,

      initCart: async () => {
        const currentCartId = get().cart.id;
        if (currentCartId) return;

        set({ isLoading: true });
        try {
          const cart = await createCart();
          set({ cart: { ...cart, id: cart.id } });
        } catch (error) {
          console.error("Failed to init cart:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      addItem: async (variantId: string, quantity: number) => {
        const cartId = get().cart.id;
        if (!cartId) {
          await get().initCart();
        }

        set({ isLoading: true });
        try {
          const cart = await addToCartApi(cartId!, variantId, quantity);
          set({ cart });
        } catch (error) {
          console.error("Failed to add item:", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateItem: async (lineItemId: string, quantity: number) => {
        const cartId = get().cart.id;
        if (!cartId) return;

        set({ isLoading: true });
        try {
          if (quantity === 0) {
            await get().removeItem(lineItemId);
          } else {
            const cart = await updateCartApi(cartId, {
              line_items: [{ id: lineItemId, quantity }],
            });
            set({ cart });
          }
        } catch (error) {
          console.error("Failed to update item:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (lineItemId: string) => {
        const cartId = get().cart.id;
        if (!cartId) return;

        set({ isLoading: true });
        try {
          const cart = await updateCartApi(cartId, {
            line_items: [{ id: lineItemId, quantity: 0 }],
          });
          set({ cart });
        } catch (error) {
          console.error("Failed to remove item:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      completeCart: async () => {
        const cartId = get().cart.id;
        if (!cartId) return null;

        set({ isLoading: true });
        try {
          const order = await completeCartApi(cartId);
          // Reset cart
          set({
            cart: {
              id: null,
              items: [],
              subtotal: 0,
              tax_total: 0,
              shipping_total: 0,
              total: 0,
            },
          });
          return order.id;
        } catch (error) {
          console.error("Failed to complete cart:", error);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "medusa-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ cart: { id: state.cart.id } }),
    }
  )
);
```

---

## Medusa Configuration

```typescript
// medusa-config.ts
import { Modules, defineConfig } from "@medusajs/framework/utils";
import { moduleDefinition } from "@medusajs/medusa";

export const config = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: [process.env.STOREFRONT_URL!],
      adminCors: [process.env.ADMIN_URL!],
      authCors: [process.env.ADMIN_URL!],
    },
  },
  modules: {
    [Modules.PRODUCT]: {
      definition: moduleDefinition,
      options: {
        providers: [],
      },
    },
    [Modules.ORDER]: {
      definition: moduleDefinition,
    },
    [Modules.PAYMENT]: {
      definition: moduleDefinition,
      options: {
        providers: [
          {
            resolve: "@medusajs/payment-stripe",
            options: {
              config: {
                stripe: {
                  apiKey: process.env.STRIPE_API_KEY,
                  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
                },
              },
            },
          },
        ],
      },
    },
    [Modules.FULFILLMENT]: {
      definition: moduleDefinition,
    },
  },
  plugins: [
    {
      resolve: "@medusajs/admin",
      options: {
        serve: true,
        path: "/app",
      },
    },
  ],
});
```

---

## Environment Variables

```bash
# .env

# Database
DATABASE_URL=postgres://user:password@localhost:5432/medusa

# Redis
REDIS_URL=redis://localhost:6379

# JWT & Cookie Secret
JWT_SECRET=your-jwt-secret
COOKIE_SECRET=your-cookie-secret

# Medusa
MEDUSA_BACKEND_URL=http://localhost:9000
STOREFRONT_URL=http://localhost:3000
ADMIN_URL=http://localhost:9000/app

# Stripe
STRIPE_API_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Publishable Key (generated by Medusa)
MEDUSA_PUBLISHABLE_KEY=pk_xxx

# Email
SENDGRID_API_KEY=sg_xxx
SENDGRID_FROM_EMAIL=noreply@example.com

# Search (Optional)
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=xxx

# Storage (Optional)
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx
S3_BUCKET=medusa-uploads
S3_ENDPOINT=xxx
```

---

## Common Commands

```bash
# Development
medusa develop
medusa start

# Build
medusa build

# Database
medusa db:migrate
medusa db:seed

# Create admin user
medusa user --email admin@example.com --password secret

# Generate migrations
medusa migration:generate

# Run jobs
medusa jobs:run

# Testing
medusa test
medusa test:e2e

# CLI
medusa --help
medusa new my-store --with-storefront

# Docker
docker-compose up -d

# Production
medusa start --prod
```

---

## Deployment Checklist

- [ ] Configure PostgreSQL and Redis
- [ ] Set up Stripe webhook endpoint
- [ ] Configure CORS for storefront and admin
- [ ] Enable SSL/HTTPS
- [ ] Set up file storage (S3/MinIO)
- [ ] Configure email provider
- [ ] Set up search indexing
- [ ] Configure rate limiting
- [ ] Enable error monitoring (Sentry)
- [ ] Set up CDN for static assets
- [ ] Configure backup for database
- [ ] Test payment flow
- [ ] Test order fulfillment
- [ ] Configure multi-region if needed
