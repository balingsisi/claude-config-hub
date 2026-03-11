# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Next.js E-commerce Platform
**Type**: Fullstack E-commerce Application
**Tech Stack**: Next.js 14 + TypeScript + Stripe + Sanity CMS
**Goal**: Production-ready online store with payments, inventory, and CMS

---

## Tech Stack

### Core
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3+
- **Styling**: Tailwind CSS 3.4+

### Backend Services
- **CMS**: Sanity.io
- **Payments**: Stripe
- **Email**: Resend
- **Storage**: Cloudinary

### Development
- **Package Manager**: pnpm
- **Linting**: ESLint + Prettier
- **Testing**: Vitest + Playwright

---

## Project Structure

```
src/
├── app/
│   ├── (shop)/
│   │   ├── page.tsx              # Homepage
│   │   ├── products/
│   │   │   ├── page.tsx          # Product listing
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Product detail
│   │   ├── categories/
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   └── search/
│   │       └── page.tsx
│   ├── (checkout)/
│   │   ├── cart/
│   │   │   └── page.tsx
│   │   └── checkout/
│   │       ├── page.tsx
│   │       └── success/
│   │           └── page.tsx
│   ├── (account)/
│   │   ├── login/
│   │   ├── register/
│   │   ├── orders/
│   │   └── profile/
│   ├── api/
│   │   ├── checkout/
│   │   │   └── route.ts          # Stripe checkout
│   │   ├── webhooks/
│   │   │   └── stripe/
│   │   │       └── route.ts
│   │   └── cart/
│   │       └── route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── shop/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── AddToCart.tsx
│   │   └── CartDrawer.tsx
│   ├── checkout/
│   │   ├── CheckoutForm.tsx
│   │   └── OrderSummary.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Navigation.tsx
├── lib/
│   ├── sanity/
│   │   ├── client.ts
│   │   └── queries.ts
│   ├── stripe/
│   │   ├── client.ts
│   │   └── config.ts
│   └── cart/
│       ├── context.tsx
│       └── actions.ts
├── types/
│   ├── product.ts
│   ├── cart.ts
│   └── order.ts
└── hooks/
    ├── useCart.ts
    └── useCheckout.ts
sanity/
├── schemas/
│   ├── product.ts
│   ├── category.ts
│   └── order.ts
└── sanity.config.ts
```

---

## Coding Rules

### 1. Product Data Model

```typescript
// src/types/product.ts
export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: ProductImage[];
  category: Category;
  inventory: Inventory;
  variants?: ProductVariant[];
  featured: boolean;
  tags: string[];
  seo?: {
    title?: string;
    description?: string;
  };
}

export interface ProductImage {
  _key: string;
  asset: {
    _ref: string;
    url: string;
  };
  alt: string;
}

export interface Inventory {
  quantity: number;
  trackQuantity: boolean;
  allowBackorder: boolean;
}

export interface ProductVariant {
  _key: string;
  name: string;
  sku: string;
  price: number;
  inventory: Inventory;
  options: VariantOption[];
}

export interface VariantOption {
  name: string;
  value: string;
}
```

### 2. Sanity CMS Integration

```typescript
// src/lib/sanity/client.ts
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
});

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: any) {
  return builder.image(source);
}

// src/lib/sanity/queries.ts
import { groq } from 'next-sanity';
import { sanityClient } from './client';

export async function getProducts() {
  return sanityClient.fetch(`
    *[_type == "product"] {
      _id,
      name,
      slug,
      description,
      price,
      "images": images[]{ asset->{url}, alt },
      "category": category->{ name, slug },
      featured,
      tags
    }
  `);
}

export async function getProductBySlug(slug: string) {
  return sanityClient.fetch(`
    *[_type == "product" && slug.current == $slug][0] {
      _id,
      name,
      slug,
      description,
      price,
      compareAtPrice,
      "images": images[]{ asset->{url}, alt },
      "category": category->{ name, slug },
      inventory,
      variants,
      featured,
      tags,
      seo
    }
  `, { slug });
}

export async function getFeaturedProducts() {
  return sanityClient.fetch(`
    *[_type == "product" && featured == true] {
      _id,
      name,
      slug,
      price,
      "images": images[]{ asset->{url}, alt }
    } | order(_createdAt desc)[0...8]
  `);
}

export async function getCategories() {
  return sanityClient.fetch(`
    *[_type == "category"] {
      _id,
      name,
      slug,
      description,
      "productCount": count(*[_type == "product" && category._ref == ^._id])
    }
  `);
}
```

### 3. Shopping Cart Context

```typescript
// src/lib/cart/context.tsx
'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';
import type { Product, ProductVariant } from '@/types/product';

interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; variant?: ProductVariant; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; variantKey?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; variantKey?: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const CartContext = createContext<{
  state: CartState;
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  removeItem: (productId: string, variantKey?: string) => void;
  updateQuantity: (productId: string, variantKey?: string, quantity: number) => void;
  clearCart: () => void;
} | null>(null);

function calculateTotal(items: CartItem[]): number {
  return items.reduce((total, item) => {
    const price = item.variant?.price || item.product.price;
    return total + price * item.quantity;
  }, 0);
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, variant, quantity } = action.payload;
      const variantKey = variant?._key;
      
      const existingIndex = state.items.findIndex(
        item => item.product._id === product._id && 
        (variantKey ? item.variant?._key === variantKey : !item.variant)
      );

      let newItems: CartItem[];
      if (existingIndex >= 0) {
        newItems = [...state.items];
        newItems[existingIndex].quantity += quantity;
      } else {
        newItems = [...state.items, { product, variant, quantity }];
      }

      return {
        items: newItems,
        total: calculateTotal(newItems),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
      };
    }

    case 'REMOVE_ITEM': {
      const { productId, variantKey } = action.payload;
      const newItems = state.items.filter(
        item => !(item.product._id === productId && 
        (variantKey ? item.variant?._key === variantKey : !item.variant))
      );

      return {
        items: newItems,
        total: calculateTotal(newItems),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
      };
    }

    case 'UPDATE_QUANTITY': {
      const { productId, variantKey, quantity } = action.payload;
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { productId, variantKey } });
      }

      const newItems = state.items.map(item => {
        if (item.product._id === productId && 
            (variantKey ? item.variant?._key === variantKey : !item.variant)) {
          return { ...item, quantity };
        }
        return item;
      });

      return {
        items: newItems,
        total: calculateTotal(newItems),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
      };
    }

    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0 };

    case 'LOAD_CART':
      return {
        items: action.payload,
        total: calculateTotal(action.payload),
        itemCount: action.payload.reduce((sum, item) => sum + item.quantity, 0),
      };

    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0,
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: items });
      } catch (e) {
        console.error('Failed to load cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (product: Product, variant?: ProductVariant, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, variant, quantity } });
  };

  const removeItem = (productId: string, variantKey?: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId, variantKey } });
  };

  const updateQuantity = (productId: string, variantKey: string | undefined, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, variantKey, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider value={{ state, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
```

### 4. Stripe Checkout Integration

```typescript
// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sanityClient } from '@/lib/sanity/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-01-01',
});

export async function POST(req: NextRequest) {
  try {
    const { items, customerEmail } = await req.json();

    // Fetch product details from Sanity to verify prices
    const productIds = items.map((item: any) => item.productId);
    const products = await sanityClient.fetch(`
      *[_type == "product" && _id in $ids] {
        _id,
        name,
        price,
        "images": images[0]{ asset->{url} }
      }
    `, { ids: productIds });

    // Create Stripe line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => {
      const product = products.find((p: any) => p._id === item.productId);
      
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            images: product.images ? [product.images.asset.url] : [],
          },
          unit_amount: Math.round(product.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      customer_email: customerEmail,
      metadata: {
        productIds: JSON.stringify(productIds),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

### 5. Stripe Webhook Handler

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sanityClient } from '@/lib/sanity/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-01-01',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Create order in Sanity
    try {
      await sanityClient.create({
        _type: 'order',
        orderId: session.id,
        customerEmail: session.customer_email,
        amount: session.amount_total! / 100,
        currency: session.currency,
        status: 'paid',
        productIds: JSON.parse(session.metadata?.productIds || '[]'),
        createdAt: new Date().toISOString(),
      });

      // Update inventory
      // TODO: Implement inventory update logic
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  }

  return NextResponse.json({ received: true });
}
```

### 6. Product Page Component

```typescript
// src/app/(shop)/products/[slug]/page.tsx
import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getProductBySlug, getProducts } from '@/lib/sanity/queries';
import { urlFor } from '@/lib/sanity/client';
import { AddToCart } from '@/components/shop/AddToCart';
import { ProductGrid } from '@/components/shop/ProductGrid';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  
  if (!product) return { title: 'Product Not Found' };

  return {
    title: product.seo?.title || product.name,
    description: product.seo?.description || product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images.map(img => urlFor(img).url()),
    },
  };
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product: any) => ({ slug: product.slug.current }));
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  // Get related products
  const allProducts = await getProducts();
  const relatedProducts = allProducts
    .filter((p: any) => p._id !== product._id && p.category.slug === product.category?.slug)
    .slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          {product.images.map((image: any, index: number) => (
            <div key={image._key} className="relative aspect-square rounded-lg overflow-hidden">
              <Image
                src={urlFor(image).width(800).height(800).url()}
                alt={image.alt || product.name}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground mt-2">{product.category?.name}</p>
          </div>

          <div className="flex items-baseline gap-4">
            <span className="text-3xl font-bold">${product.price}</span>
            {product.compareAtPrice && (
              <span className="text-xl text-muted-foreground line-through">
                ${product.compareAtPrice}
              </span>
            )}
          </div>

          <p className="text-muted-foreground">{product.description}</p>

          <AddToCart product={product} />

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 bg-muted rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-8">Related Products</h2>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
```

---

## Sanity Schemas

```typescript
// sanity/schemas/product.ts
export default {
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (Rule: any) => Rule.required().min(0),
    },
    {
      name: 'compareAtPrice',
      title: 'Compare at Price',
      type: 'number',
    },
    {
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{ type: 'image' }],
      validation: (Rule: any) => Rule.required().min(1),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'inventory',
      title: 'Inventory',
      type: 'object',
      fields: [
        { name: 'quantity', type: 'number' },
        { name: 'trackQuantity', type: 'boolean' },
        { name: 'allowBackorder', type: 'boolean' },
      ],
    },
    {
      name: 'variants',
      title: 'Variants',
      type: 'array',
      of: [{ type: 'variant' }],
    },
    {
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'text' },
      ],
    },
  ],
};
```

---

## Environment Variables

```bash
# .env.local

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-api-token

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_xxx
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

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Lint
pnpm lint

# Sanity studio
cd sanity && pnpm dev

# Deploy Sanity
sanity deploy

# Stripe CLI (for webhooks)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Deployment Checklist

- [ ] Configure Stripe webhook endpoint in dashboard
- [ ] Set up Sanity CORS and API tokens
- [ ] Configure email templates in Resend
- [ ] Enable image optimization
- [ ] Set up CDN for product images
- [ ] Configure rate limiting
- [ ] Enable analytics (Vercel Analytics / GA4)
- [ ] Test payment flow end-to-end
- [ ] Set up error monitoring (Sentry)
- [ ] Configure backup for Sanity dataset
