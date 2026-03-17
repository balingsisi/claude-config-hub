# Faker.js Template

## Project Overview

Faker.js - Generate massive amounts of fake (but realistic) data for testing and development. Perfect for populating databases, creating mock APIs, and testing UIs.

## Tech Stack

- **Library**: Faker.js 8+ (Community Edition)
- **Language**: TypeScript
- **Use Cases**: Database seeding, Mock APIs, UI testing, Demo data
- **Integration**: Jest, Vitest, MSW, Prisma

## Project Structure

```
faker-project/
├── src/
│   ├── seeders/
│   │   ├── user.seeder.ts      # User data seeder
│   │   ├── product.seeder.ts   # Product data seeder
│   │   └── order.seeder.ts     # Order data seeder
│   ├── factories/
│   │   ├── user.factory.ts     # User factory
│   │   ├── product.factory.ts  # Product factory
│   │   └── order.factory.ts    # Order factory
│   ├── mocks/
│   │   ├── api.mock.ts         # API mocks
│   │   └── database.mock.ts    # Database mocks
│   ├── locales/
│   │   └── en_US/
│   │       └── custom.ts       # Custom locale data
│   └── utils/
│       ├── seed.ts             # Seeding utilities
│       └── export.ts           # Export utilities
├── prisma/
│   └── schema.prisma           # Prisma schema
├── tests/
│   └── factories.test.ts       # Factory tests
├── package.json
└── tsconfig.json
```

## Key Patterns

### 1. Basic Setup

```typescript
// src/utils/faker.ts
import { faker } from '@faker-js/faker';

// Set locale
faker.locale = 'en_US';

// Set seed for reproducible results
faker.seed(123);

// Create custom faker instance
export const customFaker = new Faker({
  locale: [fakerEN, fakerZH_CN],
});

export { faker };
```

### 2. User Factory

```typescript
// src/factories/user.factory.ts
import { faker } from '@faker-js/faker';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  birthDate: Date;
  role: 'admin' | 'user' | 'moderator';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function createUser(overrides: Partial<User> = {}): User {
  const now = new Date();
  
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    username: faker.internet.username(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    avatar: faker.image.avatar(),
    phone: faker.phone.number(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
    },
    birthDate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
    role: faker.helpers.arrayElement(['admin', 'user', 'moderator']),
    isVerified: faker.datatype.boolean(),
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: now,
    ...overrides,
  };
}

export function createUsers(count: number, overrides: Partial<User> = {}): User[] {
  return Array.from({ length: count }, () => createUser(overrides));
}

// Builder pattern for complex objects
export class UserBuilder {
  private user: Partial<User> = {};

  withRole(role: User['role']) {
    this.user.role = role;
    return this;
  }

  withVerified(isVerified: boolean) {
    this.user.isVerified = isVerified;
    return this;
  }

  withEmail(email: string) {
    this.user.email = email;
    return this;
  }

  build(): User {
    return createUser(this.user);
  }
}
```

### 3. Product Factory

```typescript
// src/factories/product.factory.ts
import { faker } from '@faker-js/faker';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  sku: string;
  stock: number;
  images: string[];
  rating: number;
  reviews: number;
  tags: string[];
  specifications: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
}

export function createProduct(overrides: Partial<Product> = {}): Product {
  const categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'];
  const category = overrides.category || faker.helpers.arrayElement(categories);

  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
    category,
    brand: faker.company.name(),
    sku: faker.string.alphanumeric(10).toUpperCase(),
    stock: faker.number.int({ min: 0, max: 1000 }),
    images: Array.from(
      { length: faker.number.int({ min: 1, max: 5 }) },
      () => faker.image.url()
    ),
    rating: parseFloat(faker.number.float({ min: 1, max: 5, fractionDigits: 1 }).toFixed(1)),
    reviews: faker.number.int({ min: 0, max: 500 }),
    tags: faker.helpers.arrayElements(
      ['trending', 'bestseller', 'new', 'sale', 'featured'],
      { min: 1, max: 3 }
    ),
    specifications: {
      weight: `${faker.number.int({ min: 100, max: 5000 })}g`,
      dimensions: `${faker.number.int({ min: 10, max: 100 })}x${faker.number.int({ min: 10, max: 100 })}x${faker.number.int({ min: 10, max: 100 })} cm`,
      color: faker.color.human(),
      material: faker.word.noun(),
    },
    isActive: faker.datatype.boolean({ probability: 0.9 }),
    createdAt: faker.date.past({ years: 2 }),
    ...overrides,
  };
}

export function createProducts(count: number, overrides: Partial<Product> = {}): Product[] {
  return Array.from({ length: count }, () => createProduct(overrides));
}
```

### 4. Order Factory

```typescript
// src/factories/order.factory.ts
import { faker } from '@faker-js/faker';
import { createProduct, Product } from './product.factory';
import { createUser, User } from './user.factory';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  user: User;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  shippingAddress: User['address'];
  createdAt: Date;
  updatedAt: Date;
}

export function createOrderItem(product?: Product): OrderItem {
  const prod = product || createProduct();
  const quantity = faker.number.int({ min: 1, max: 5 });
  
  return {
    id: faker.string.uuid(),
    productId: prod.id,
    productName: prod.name,
    quantity,
    price: prod.price,
    total: quantity * prod.price,
  };
}

export function createOrder(overrides: Partial<Order> = {}): Order {
  const user = overrides.user || createUser();
  const items = overrides.items || 
    Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => createOrderItem());
  
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.1;
  const shipping = subtotal > 100 ? 0 : 10;
  const total = subtotal + tax + shipping;

  const statuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  
  const createdAt = faker.date.past({ years: 1 });
  const updatedAt = faker.date.between({ from: createdAt, to: new Date() });

  return {
    id: faker.string.uuid(),
    orderNumber: `ORD-${faker.string.numeric(8)}`,
    user,
    items,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    shipping: parseFloat(shipping.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    status: faker.helpers.arrayElement(statuses),
    paymentMethod: faker.helpers.arrayElement(['credit_card', 'paypal', 'bank_transfer']),
    shippingAddress: user.address,
    createdAt,
    updatedAt,
    ...overrides,
  };
}

export function createOrders(count: number, overrides: Partial<Order> = {}): Order[] {
  return Array.from({ length: count }, () => createOrder(overrides));
}
```

### 5. Database Seeder

```typescript
// src/seeders/user.seeder.ts
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { createUsers } from '../factories/user.factory';

const prisma = new PrismaClient();

export async function seedUsers(count: number = 100) {
  console.log(`Seeding ${count} users...`);
  
  // Clear existing users
  await prisma.user.deleteMany({});
  
  // Create users
  const users = createUsers(count);
  
  // Insert into database
  await prisma.user.createMany({
    data: users.map((user) => ({
      ...user,
      address: JSON.stringify(user.address),
    })),
  });
  
  console.log(`✓ Seeded ${count} users`);
  
  return users;
}

// src/seeders/product.seeder.ts
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { createProducts } from '../factories/product.factory';

const prisma = new PrismaClient();

export async function seedProducts(count: number = 500) {
  console.log(`Seeding ${count} products...`);
  
  await prisma.product.deleteMany({});
  
  const products = createProducts(count);
  
  await prisma.product.createMany({
    data: products.map((product) => ({
      ...product,
      images: JSON.stringify(product.images),
      tags: JSON.stringify(product.tags),
      specifications: JSON.stringify(product.specifications),
    })),
  });
  
  console.log(`✓ Seeded ${count} products`);
  
  return products;
}

// src/seeders/order.seeder.ts
import { PrismaClient } from '@prisma/client';
import { createOrders } from '../factories/order.factory';

const prisma = new PrismaClient();

export async function seedOrders(count: number = 200) {
  console.log(`Seeding ${count} orders...`);
  
  await prisma.order.deleteMany({});
  
  // Get existing users and products
  const users = await prisma.user.findMany();
  const products = await prisma.product.findMany();
  
  if (users.length === 0 || products.length === 0) {
    throw new Error('Users and products must be seeded first');
  }
  
  const orders = [];
  
  for (let i = 0; i < count; i++) {
    const user = faker.helpers.arrayElement(users);
    const orderItems = [];
    
    // Create order items from existing products
    const itemCount = faker.number.int({ min: 1, max: 5 });
    for (let j = 0; j < itemCount; j++) {
      const product = faker.helpers.arrayElement(products);
      const quantity = faker.number.int({ min: 1, max: 3 });
      
      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity,
        price: product.price,
        total: quantity * product.price,
      });
    }
    
    orders.push({
      userId: user.id,
      items: JSON.stringify(orderItems),
      total: orderItems.reduce((sum, item) => sum + item.total, 0),
      status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered']),
      createdAt: faker.date.past({ years: 1 }),
    });
  }
  
  await prisma.order.createMany({ data: orders });
  
  console.log(`✓ Seeded ${count} orders`);
}

// src/seed.ts
import { seedUsers } from './seeders/user.seeder';
import { seedProducts } from './seeders/product.seeder';
import { seedOrders } from './seeders/order.seeder';

async function main() {
  console.log('🌱 Starting database seeding...\n');
  
  try {
    await seedUsers(100);
    await seedProducts(500);
    await seedOrders(200);
    
    console.log('\n✅ Database seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
```

### 6. Mock API

```typescript
// src/mocks/api.mock.ts
import { faker } from '@faker-js/faker';
import { http, HttpResponse, delay } from 'msw';
import { createUsers } from '../factories/user.factory';
import { createProducts } from '../factories/product.factory';
import { createOrders } from '../factories/order.factory';

const API_BASE = 'https://api.example.com';

// Generate data once
const users = createUsers(50);
const products = createProducts(100);
const orders = createOrders(30);

export const handlers = [
  // Users
  http.get(`${API_BASE}/users`, async () => {
    await delay(200);
    return HttpResponse.json({
      data: users,
      total: users.length,
    });
  }),

  http.get(`${API_BASE}/users/:id`, async ({ params }) => {
    await delay(100);
    const user = users.find((u) => u.id === params.id);
    
    if (!user) {
      return new HttpResponse(null, { status: 404 });
    }
    
    return HttpResponse.json(user);
  }),

  // Products
  http.get(`${API_BASE}/products`, async ({ request }) => {
    await delay(300);
    
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    let filtered = products;
    
    if (category) {
      filtered = products.filter((p) => p.category === category);
    }
    
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    
    return HttpResponse.json({
      data: paginated,
      total: filtered.length,
      page,
      limit,
    });
  }),

  http.get(`${API_BASE}/products/:id`, async ({ params }) => {
    await delay(150);
    const product = products.find((p) => p.id === params.id);
    
    if (!product) {
      return new HttpResponse(null, { status: 404 });
    }
    
    return HttpResponse.json(product);
  }),

  // Orders
  http.get(`${API_BASE}/orders`, async () => {
    await delay(250);
    return HttpResponse.json({
      data: orders,
      total: orders.length,
    });
  }),

  http.post(`${API_BASE}/orders`, async ({ request }) => {
    await delay(400);
    
    const body = await request.json();
    const newOrder = createOrders(1, body)[0];
    
    return HttpResponse.json(newOrder, { status: 201 });
  }),

  // Search
  http.get(`${API_BASE}/search`, async ({ request }) => {
    await delay(200);
    
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() || '';
    
    const results = {
      products: products.filter((p) => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      ).slice(0, 5),
      users: users.filter((u) =>
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      ).slice(0, 5),
    };
    
    return HttpResponse.json(results);
  }),
];
```

### 7. Testing with Faker

```typescript
// tests/factories.test.ts
import { describe, test, expect, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { createUser, createUsers, UserBuilder } from '../src/factories/user.factory';
import { createProduct } from '../src/factories/product.factory';
import { createOrder } from '../src/factories/order.factory';

describe('User Factory', () => {
  beforeEach(() => {
    faker.seed(123); // Reset seed for consistent tests
  });

  test('should create a valid user', () => {
    const user = createUser();
    
    expect(user).toBeDefined();
    expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(['admin', 'user', 'moderator']).toContain(user.role);
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  test('should override properties', () => {
    const user = createUser({
      email: 'custom@example.com',
      role: 'admin',
    });
    
    expect(user.email).toBe('custom@example.com');
    expect(user.role).toBe('admin');
  });

  test('should create multiple users', () => {
    const users = createUsers(10);
    
    expect(users).toHaveLength(10);
    expect(new Set(users.map((u) => u.id)).size).toBe(10); // All unique
  });

  test('should use builder pattern', () => {
    const user = new UserBuilder()
      .withRole('admin')
      .withVerified(true)
      .withEmail('admin@test.com')
      .build();
    
    expect(user.role).toBe('admin');
    expect(user.isVerified).toBe(true);
    expect(user.email).toBe('admin@test.com');
  });
});

describe('Product Factory', () => {
  test('should create valid product', () => {
    const product = createProduct();
    
    expect(product).toBeDefined();
    expect(product.price).toBeGreaterThan(0);
    expect(product.rating).toBeGreaterThanOrEqual(1);
    expect(product.rating).toBeLessThanOrEqual(5);
    expect(product.images.length).toBeGreaterThan(0);
  });

  test('should create product with specific category', () => {
    const product = createProduct({ category: 'Electronics' });
    
    expect(product.category).toBe('Electronics');
  });
});

describe('Order Factory', () => {
  test('should create valid order', () => {
    const order = createOrder();
    
    expect(order).toBeDefined();
    expect(order.items.length).toBeGreaterThan(0);
    expect(order.total).toBe(order.subtotal + order.tax + order.shipping);
    expect(order.orderNumber).toMatch(/^ORD-\d{8}$/);
  });

  test('should calculate totals correctly', () => {
    const order = createOrder({
      items: [
        { id: '1', productId: 'p1', productName: 'Product 1', quantity: 2, price: 50, total: 100 },
        { id: '2', productId: 'p2', productName: 'Product 2', quantity: 1, price: 30, total: 30 },
      ],
    });
    
    expect(order.subtotal).toBe(130);
  });
});

// Performance test
describe('Performance', () => {
  test('should generate 10000 users quickly', () => {
    const start = Date.now();
    const users = createUsers(10000);
    const duration = Date.now() - start;
    
    expect(users).toHaveLength(10000);
    expect(duration).toBeLessThan(1000); // Should complete in < 1 second
  });
});
```

### 8. Custom Locale

```typescript
// src/locales/en_US/custom.ts
import { Faker } from '@faker-js/faker';

export const customLocale = {
  title: 'Custom English',
  product: {
    category: () => [
      'Electronics',
      'Clothing',
      'Home & Garden',
      'Sports',
      'Books',
      'Toys',
      'Food',
      'Health',
    ],
    condition: () => ['New', 'Used', 'Refurbished', 'Open Box'],
  },
  payment: {
    method: () => ['Credit Card', 'PayPal', 'Bank Transfer', 'Cash on Delivery'],
    status: () => ['Pending', 'Completed', 'Failed', 'Refunded'],
  },
  shipping: {
    carrier: () => ['FedEx', 'UPS', 'DHL', 'USPS', 'Amazon Logistics'],
    status: () => ['Processing', 'Shipped', 'In Transit', 'Out for Delivery', 'Delivered'],
  },
};

// Use custom locale
const customFaker = new Faker({
  locale: [customLocale, 'en'],
});

// Now you can use:
customFaker.product.category(); // 'Electronics'
customFaker.payment.method(); // 'Credit Card'
customFaker.shipping.carrier(); // 'FedEx'
```

### 9. Export Utilities

```typescript
// src/utils/export.ts
import { writeFileSync } from 'fs';
import { join } from 'path';

export function exportToJSON(data: any[], filename: string) {
  const outputPath = join(process.cwd(), 'exports', `${filename}.json`);
  
  writeFileSync(outputPath, JSON.stringify(data, null, 2));
  
  console.log(`✓ Exported ${data.length} records to ${outputPath}`);
}

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => {
        const value = row[h];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');
  
  const outputPath = join(process.cwd(), 'exports', `${filename}.csv`);
  writeFileSync(outputPath, csv);
  
  console.log(`✓ Exported ${data.length} records to ${outputPath}`);
}

export function exportToSQL(data: any[], tableName: string, filename: string) {
  if (data.length === 0) return;
  
  const columns = Object.keys(data[0]);
  const values = data.map((row) => {
    const vals = columns.map((col) => {
      const value = row[col];
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'number') return value;
      if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
      if (value instanceof Date) return `'${value.toISOString()}'`;
      return `'${String(value).replace(/'/g, "''")}'`;
    });
    return `(${vals.join(', ')})`;
  });
  
  const sql = `INSERT INTO ${tableName} (${columns.join(', ')})\nVALUES\n${values.join(',\n')};`;
  
  const outputPath = join(process.cwd(), 'exports', `${filename}.sql`);
  writeFileSync(outputPath, sql);
  
  console.log(`✓ Exported ${data.length} records to ${outputPath}`);
}

// Usage
// const users = createUsers(100);
// exportToJSON(users, 'users');
// exportToCSV(users, 'users');
// exportToSQL(users, 'users', 'users');
```

## Configuration

### package.json

```json
{
  "name": "faker-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "seed": "tsx src/seed.ts",
    "test": "vitest",
    "build": "tsc"
  },
  "dependencies": {
    "@faker-js/faker": "^8.4.0",
    "@prisma/client": "^5.7.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "prisma": "^5.7.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "msw": "^2.0.0"
  }
}
```

## Best Practices

### 1. Use Seeding for Reproducibility

```typescript
// Always seed in tests for predictable results
beforeEach(() => {
  faker.seed(123);
});
```

### 2. Use Factories Over Raw Faker

```typescript
// Bad - scattered faker calls
const user = {
  id: faker.string.uuid(),
  email: faker.internet.email(),
  // ... many more fields
};

// Good - centralized factory
const user = createUser();
```

### 3. Keep Factories Flexible

```typescript
// Allow overrides for test-specific scenarios
const admin = createUser({ role: 'admin', isVerified: true });
```

### 4. Use Builders for Complex Objects

```typescript
const order = new OrderBuilder()
  .withUser(adminUser)
  .withStatus('shipped')
  .withItems(5)
  .build();
```

## Resources

- [Faker.js Documentation](https://fakerjs.dev/)
- [Faker.js GitHub](https://github.com/faker-js/faker)
- [API Reference](https://fakerjs.dev/api/)
- [Localization Guide](https://fakerjs.dev/guide/localization.html)
