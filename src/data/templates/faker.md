# Faker.js 测试数据生成模板

## 技术栈

- **Faker.js**: 8.x (测试数据生成)
- **TypeScript**: 5.x
- **测试框架**: Vitest / Jest
- **数据库**: Prisma / TypeORM / Drizzle
- **Mock工具**: MSW (Mock Service Worker)

## 项目结构

```
src/
├── factories/                 # 数据工厂
│   ├── user.factory.ts       # 用户工厂
│   ├── product.factory.ts    # 产品工厂
│   ├── order.factory.ts      # 订单工厂
│   ├── post.factory.ts       # 文章工厂
│   └── index.ts              # 工厂导出
├── fixtures/                  # 静态测试数据
│   ├── users.fixture.ts      # 用户数据
│   ├── products.fixture.ts   # 产品数据
│   └── index.ts              # 数据导出
├── seeders/                   # 数据库填充
│   ├── user.seeder.ts        # 用户填充
│   ├── product.seeder.ts     # 产品填充
│   ├── database.seeder.ts    # 主填充器
│   └── index.ts              # 填充导出
├── mocks/                     # Mock数据
│   ├── handlers/             # MSW handlers
│   │   ├── user.handler.ts   # 用户handler
│   │   └── product.handler.ts # 产品handler
│   ├── data/                 # Mock数据
│   │   └── mockData.ts
│   └── server.ts             # Mock服务器
├── utils/                     # 工具函数
│   ├── faker.utils.ts        # Faker工具
│   ├── locale.utils.ts       # 本地化工具
│   └── sequence.utils.ts     # 序列生成
└── __tests__/               # 测试
    ├── factories/
    ├── seeders/
    └── utils/
```

## 代码模式

### 基础配置

```typescript
// utils/faker.utils.ts
import { faker } from '@faker-js/faker/locale/zh_CN';

// 配置中文环境
export const fakerCN = faker;

// 配置英文环境
import { faker as fakerEN } from '@faker-js/faker/locale/en';
export { fakerEN };

// 自定义种子（可重现的数据）
export function seedFaker(seed: number) {
  faker.seed(seed);
  return faker;
}

// 重置种子
export function resetFakerSeed() {
  faker.seed();
}

// 使用示例
const seededFaker = seedFaker(12345);
const userName1 = seededFaker.person.fullName(); // 每次运行都是相同的结果

resetFakerSeed();
const userName2 = faker.person.fullName(); // 每次运行都不同
```

### 数据工厂模式

```typescript
// factories/user.factory.ts
import { faker } from '@faker-js/faker/locale/zh_CN';
import type { User, UserRole, UserStatus } from '@/types/user';

// 定义工厂类型
type UserFactoryInput = Partial<User> & {
  override?: Partial<User>;
};

// 基础用户工厂
export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    username: faker.internet.username(),
    password: faker.internet.password({ length: 12 }),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    avatar: faker.image.avatar(),
    phone: faker.phone.number(),
    role: faker.helpers.arrayElement(['admin', 'user', 'moderator'] as UserRole[]),
    status: faker.helpers.arrayElement(['active', 'inactive', 'banned'] as UserStatus[]),
    bio: faker.lorem.paragraph(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      country: faker.location.country(),
      zipCode: faker.location.zipCode(),
    },
    preferences: {
      theme: faker.helpers.arrayElement(['light', 'dark']),
      language: faker.helpers.arrayElement(['zh-CN', 'en-US']),
      notifications: faker.datatype.boolean(),
    },
    createdAt: faker.date.past({ years: 2 }),
    updatedAt: faker.date.recent({ days: 30 }),
    ...overrides,
  };
}

// 创建管理员用户
export function createAdminUser(overrides: Partial<User> = {}): User {
  return createUser({
    role: 'admin',
    status: 'active',
    ...overrides,
  });
}

// 创建批量用户
export function createUsers(count: number, overrides: Partial<User> = {}): User[] {
  return Array.from({ length: count }, () => createUser(overrides));
}

// 使用序列生成唯一值
let userSequence = 0;
export function createUserWithSequence(overrides: Partial<User> = {}): User {
  userSequence++;
  return createUser({
    email: `user${userSequence}@example.com`,
    username: `user${userSequence}`,
    ...overrides,
  });
}

// factories/product.factory.ts
import { faker } from '@faker-js/faker/locale/zh_CN';
import type { Product, ProductCategory, ProductVariant } from '@/types/product';

export function createProduct(overrides: Partial<Product> = {}): Product {
  const basePrice = faker.number.int({ min: 10, max: 1000 });
  
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: basePrice,
    salePrice: faker.datatype.boolean() ? basePrice * 0.8 : undefined,
    sku: faker.string.alphanumeric({ length: 10, casing: 'upper' }),
    barcode: faker.string.numeric({ length: 13 }),
    category: faker.helpers.arrayElement([
      'electronics',
      'clothing',
      'books',
      'home',
      'sports',
    ] as ProductCategory[]),
    tags: faker.helpers.arrayElements(
      ['popular', 'new', 'sale', 'featured', 'trending'],
      { min: 1, max: 3 }
    ),
    images: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
      faker.image.url({ width: 400, height: 400 })
    ),
    stock: faker.number.int({ min: 0, max: 1000 }),
    rating: {
      average: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
      count: faker.number.int({ min: 0, max: 500 }),
    },
    variants: createProductVariants(faker.number.int({ min: 0, max: 3 })),
    isActive: faker.datatype.boolean({ probability: 0.8 }),
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent({ days: 7 }),
    ...overrides,
  };
}

export function createProductVariant(): ProductVariant {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productMaterial(),
    sku: faker.string.alphanumeric({ length: 8, casing: 'upper' }),
    price: faker.number.int({ min: 10, max: 500 }),
    stock: faker.number.int({ min: 0, max: 100 }),
    attributes: {
      color: faker.color.human(),
      size: faker.helpers.arrayElement(['S', 'M', 'L', 'XL', 'XXL']),
    },
  };
}

export function createProductVariants(count: number): ProductVariant[] {
  return Array.from({ length: count }, createProductVariant);
}

export function createProducts(count: number, overrides: Partial<Product> = {}): Product[] {
  return Array.from({ length: count }, () => createProduct(overrides));
}

// factories/order.factory.ts
import { faker } from '@faker-js/faker/locale/zh_CN';
import type { Order, OrderItem, OrderStatus } from '@/types/order';
import { createProduct } from './product.factory';

export function createOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  const product = createProduct();
  const quantity = faker.number.int({ min: 1, max: 5 });

  return {
    id: faker.string.uuid(),
    productId: product.id,
    product,
    quantity,
    unitPrice: product.price,
    totalPrice: product.price * quantity,
    ...overrides,
  };
}

export function createOrder(overrides: Partial<Order> = {}): Order {
  const items = Array.from(
    { length: faker.number.int({ min: 1, max: 5 }) },
    () => createOrderItem()
  );

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const shippingCost = faker.number.int({ min: 0, max: 50 });
  const tax = subtotal * 0.1;
  const total = subtotal + shippingCost + tax;

  return {
    id: faker.string.uuid(),
    orderNumber: faker.string.numeric({ length: 10 }),
    userId: faker.string.uuid(),
    items,
    shippingAddress: {
      recipient: faker.person.fullName(),
      phone: faker.phone.number(),
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      zipCode: faker.location.zipCode(),
    },
    billingAddress: {
      recipient: faker.person.fullName(),
      phone: faker.phone.number(),
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      zipCode: faker.location.zipCode(),
    },
    subtotal,
    shippingCost,
    tax,
    discount: faker.datatype.boolean() ? faker.number.int({ min: 5, max: 50 }) : 0,
    total,
    status: faker.helpers.arrayElement([
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ] as OrderStatus[]),
    paymentMethod: faker.helpers.arrayElement(['credit_card', 'paypal', 'bank_transfer']),
    paymentStatus: faker.helpers.arrayElement(['pending', 'paid', 'refunded']),
    notes: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent({ days: 7 }),
    ...overrides,
  };
}

export function createOrders(count: number, overrides: Partial<Order> = {}): Order[] {
  return Array.from({ length: count }, () => createOrder(overrides));
}
```

### 高级工厂模式

```typescript
// factories/base.factory.ts
import { faker } from '@faker-js/faker';

// 通用工厂基类
export abstract class Factory<T> {
  protected abstract definition(): T;

  create(overrides: Partial<T> = {}): T {
    return {
      ...this.definition(),
      ...overrides,
    };
  }

  createMany(count: number, overrides: Partial<T> = {}): T[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  // 创建关联数据
  createWith<K extends keyof T>(
    key: K,
    factory: () => T[K]
  ): T {
    const data = this.definition();
    return {
      ...data,
      [key]: factory(),
    };
  }
}

// factories/post.factory.ts
import { faker } from '@faker-js/faker/locale/zh_CN';
import { Factory } from './base.factory';
import type { Post, PostComment, PostCategory } from '@/types/post';
import { createUser } from './user.factory';

export class PostFactory extends Factory<Post> {
  protected definition(): Post {
    return {
      id: faker.string.uuid(),
      title: faker.lorem.sentence({ min: 3, max: 8 }),
      slug: faker.lorem.slug({ min: 3, max: 5 }),
      content: faker.lorem.paragraphs({ min: 3, max: 10 }),
      excerpt: faker.lorem.paragraph({ min: 20, max: 50 }),
      author: createUser(),
      category: faker.helpers.arrayElement([
        'technology',
        'lifestyle',
        'travel',
        'food',
        'business',
      ] as PostCategory[]),
      tags: faker.helpers.arrayElements(
        ['javascript', 'typescript', 'react', 'nodejs', 'webdev'],
        { min: 2, max: 5 }
      ),
      coverImage: faker.image.url({ width: 1200, height: 630 }),
      status: faker.helpers.arrayElement(['draft', 'published', 'archived']),
      viewCount: faker.number.int({ min: 0, max: 10000 }),
      likeCount: faker.number.int({ min: 0, max: 1000 }),
      commentCount: faker.number.int({ min: 0, max: 100 }),
      publishedAt: faker.datatype.boolean() ? faker.date.past({ years: 1 }) : undefined,
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent({ days: 30 }),
    };
  }

  // 状态方法
  published(): this {
    return this;
  }

  draft(): this {
    return this;
  }

  // 使用链式调用
  createPublished(overrides: Partial<Post> = {}): Post {
    return this.create({
      status: 'published',
      publishedAt: faker.date.past({ years: 1 }),
      ...overrides,
    });
  }

  createDraft(overrides: Partial<Post> = {}): Post {
    return this.create({
      status: 'draft',
      publishedAt: undefined,
      ...overrides,
    });
  }

  createWithComments(commentCount: number, overrides: Partial<Post> = {}): Post & { comments: PostComment[] } {
    const post = this.create(overrides);
    const comments = this.createComments(commentCount, post.id);
    
    return {
      ...post,
      comments,
      commentCount: comments.length,
    };
  }

  private createComments(count: number, postId: string): PostComment[] {
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      postId,
      author: createUser(),
      content: faker.lorem.paragraph(),
      createdAt: faker.date.past({ years: 1 }),
    }));
  }
}

// 使用示例
const postFactory = new PostFactory();

const singlePost = postFactory.create();
const publishedPost = postFactory.createPublished();
const draftPost = postFactory.createDraft();
const postWithComments = postFactory.createWithComments(5);
const manyPosts = postFactory.createMany(10);
```

### 数据库填充器

```typescript
// seeders/user.seeder.ts
import { faker } from '@faker-js/faker/locale/zh_CN';
import { PrismaClient } from '@prisma/client';
import { createUser } from '@/factories/user.factory';

const prisma = new PrismaClient();

export async function seedUsers(count: number = 50) {
  console.log(`Seeding ${count} users...`);

  const users = Array.from({ length: count }, () => createUser());

  const result = await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  console.log(`Created ${result.count} users`);
  return users;
}

export async function seedAdminUser() {
  const admin = createUser({
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
  });

  const result = await prisma.user.create({
    data: admin,
  });

  console.log('Created admin user:', result.email);
  return result;
}

// seeders/product.seeder.ts
import { faker } from '@faker-js/faker/locale/zh_CN';
import { PrismaClient } from '@prisma/client';
import { createProduct } from '@/factories/product.factory';

const prisma = new PrismaClient();

export async function seedProducts(count: number = 100) {
  console.log(`Seeding ${count} products...`);

  const products = Array.from({ length: count }, () => createProduct());

  for (const product of products) {
    await prisma.product.create({
      data: {
        ...product,
        variants: {
          create: product.variants,
        },
      },
    });
  }

  console.log(`Created ${products.length} products`);
  return products;
}

// seeders/database.seeder.ts
import { seedUsers, seedAdminUser } from './user.seeder';
import { seedProducts } from './product.seeder';

export async function runSeeders() {
  console.log('Starting database seeding...');

  try {
    await seedAdminUser();
    await seedUsers(50);
    await seedProducts(100);

    console.log('Database seeding completed!');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
}

// 清空数据库
export async function cleanDatabase() {
  const prisma = new PrismaClient();
  
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);

  console.log('Database cleaned');
}

// 运行
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeders()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
```

### 测试数据生成

```typescript
// fixtures/users.fixture.ts
import { faker } from '@faker-js/faker/locale/zh_CN';
import type { User } from '@/types/user';

// 固定测试数据
export const testUsers: User[] = [
  {
    id: '1',
    email: 'admin@test.com',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    email: 'user@test.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    status: 'active',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

// 动态测试数据
export function createTestUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    email: `test-${Date.now()}@test.com`,
    username: `testuser-${Date.now()}`,
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// mocks/data/mockData.ts
import { faker } from '@faker-js/faker/locale/zh_CN';
import { createUsers, createProducts, createOrders } from '@/factories';

// 缓存mock数据（同一测试会话内保持一致）
let cachedUsers: ReturnType<typeof createUsers> | null = null;
let cachedProducts: ReturnType<typeof createProducts> | null = null;
let cachedOrders: ReturnType<typeof createOrders> | null = null;

export function getMockUsers(count = 20) {
  if (!cachedUsers) {
    faker.seed(123); // 固定种子保证一致性
    cachedUsers = createUsers(count);
  }
  return cachedUsers;
}

export function getMockProducts(count = 50) {
  if (!cachedProducts) {
    faker.seed(456);
    cachedProducts = createProducts(count);
  }
  return cachedProducts;
}

export function getMockOrders(count = 30) {
  if (!cachedOrders) {
    faker.seed(789);
    cachedOrders = createOrders(count);
  }
  return cachedOrders;
}

// 重置缓存
export function resetMockData() {
  cachedUsers = null;
  cachedProducts = null;
  cachedOrders = null;
}
```

### MSW Handlers

```typescript
// mocks/handlers/user.handler.ts
import { http, HttpResponse, delay } from 'msw';
import { getMockUsers } from '../data/mockData';

const API_BASE = '/api';

export const userHandlers = [
  // 获取用户列表
  http.get(`${API_BASE}/users`, async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';

    const allUsers = getMockUsers();
    
    let filteredUsers = allUsers;
    if (search) {
      filteredUsers = allUsers.filter(
        (user) =>
          user.email.includes(search) ||
          user.username.includes(search) ||
          user.firstName.includes(search)
      );
    }

    const startIndex = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limit);

    return HttpResponse.json({
      data: paginatedUsers,
      total: filteredUsers.length,
      page,
      limit,
      totalPages: Math.ceil(filteredUsers.length / limit),
    });
  }),

  // 获取单个用户
  http.get(`${API_BASE}/users/:id`, async ({ params }) => {
    await delay(100);

    const { id } = params;
    const users = getMockUsers();
    const user = users.find((u) => u.id === id);

    if (!user) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json({ data: user });
  }),

  // 创建用户
  http.post(`${API_BASE}/users`, async ({ request }) => {
    await delay(300);

    const body = await request.json();
    const newUser = {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return HttpResponse.json({ data: newUser }, { status: 201 });
  }),

  // 更新用户
  http.patch(`${API_BASE}/users/:id`, async ({ params, request }) => {
    await delay(200);

    const { id } = params;
    const body = await request.json();
    const users = getMockUsers();
    const user = users.find((u) => u.id === id);

    if (!user) {
      return new HttpResponse(null, { status: 404 });
    }

    const updatedUser = {
      ...user,
      ...body,
      updatedAt: new Date(),
    };

    return HttpResponse.json({ data: updatedUser });
  }),

  // 删除用户
  http.delete(`${API_BASE}/users/:id`, async ({ params }) => {
    await delay(100);

    const { id } = params;
    const users = getMockUsers();
    const exists = users.some((u) => u.id === id);

    if (!exists) {
      return new HttpResponse(null, { status: 404 });
    }

    return new HttpResponse(null, { status: 204 });
  }),
];

// mocks/server.ts
import { setupServer } from 'msw/node';
import { userHandlers } from './handlers/user.handler';
import { productHandlers } from './handlers/product.handler';

export const server = setupServer(...userHandlers, ...productHandlers);
```

### 测试工具

```typescript
// utils/test.utils.ts
import { faker } from '@faker-js/faker';

// 生成唯一ID
export function generateUniqueId(prefix = ''): string {
  return `${prefix}${Date.now()}_${faker.string.alphanumeric(8)}`;
}

// 生成测试邮箱
export function generateTestEmail(domain = 'test.com'): string {
  return `test_${Date.now()}_${faker.string.alphanumeric(6)}@${domain}`;
}

// 生成测试电话
export function generateTestPhone(): string {
  return faker.phone.number({ style: 'international' });
}

// 生成随机选择
export function pickRandom<T>(array: T[]): T {
  return faker.helpers.arrayElement(array);
}

// 生成随机子集
export function pickRandomSubset<T>(array: T[], min = 1, max?: number): T[] {
  return faker.helpers.arrayElements(array, {
    min,
    max: max ?? array.length,
  });
}

// 生成布尔值
export function generateBoolean(probability = 0.5): boolean {
  return faker.datatype.boolean({ probability });
}

// 生成日期范围
export function generateDateRange(
  start: Date,
  end: Date
): { start: Date; end: Date } {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomStart = faker.date.between({ from: start, to: end });
  const randomEnd = new Date(
    randomStart.getTime() + faker.number.int({ min: 1, max: endTime - startTime })
  );

  return {
    start: randomStart,
    end: randomEnd > end ? end : randomEnd,
  };
}

// __tests__/factories/user.factory.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createUser, createUsers, createAdminUser } from '@/factories/user.factory';
import { faker } from '@faker-js/faker';

describe('User Factory', () => {
  beforeEach(() => {
    faker.seed(123);
  });

  it('should create a user with default values', () => {
    const user = createUser();

    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('username');
    expect(user.email).toMatch(/@/);
  });

  it('should override default values', () => {
    const user = createUser({
      email: 'custom@example.com',
      role: 'admin',
    });

    expect(user.email).toBe('custom@example.com');
    expect(user.role).toBe('admin');
  });

  it('should create admin user', () => {
    const admin = createAdminUser();

    expect(admin.role).toBe('admin');
    expect(admin.status).toBe('active');
  });

  it('should create multiple users', () => {
    const users = createUsers(5);

    expect(users).toHaveLength(5);
    expect(new Set(users.map((u) => u.id)).size).toBe(5);
  });

  it('should create unique emails', () => {
    const users = createUsers(100);
    const emails = users.map((u) => u.email);
    const uniqueEmails = new Set(emails);

    expect(uniqueEmails.size).toBe(100);
  });
});

// __tests__/seeders/user.seeder.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { seedUsers, seedAdminUser } from '@/seeders/user.seeder';

const prisma = new PrismaClient();

describe('User Seeder', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should seed users to database', async () => {
    const users = await seedUsers(10);

    expect(users).toHaveLength(10);

    const dbUsers = await prisma.user.findMany();
    expect(dbUsers).toHaveLength(10);
  });

  it('should seed admin user', async () => {
    const admin = await seedAdminUser();

    expect(admin.email).toBe('admin@example.com');
    expect(admin.role).toBe('admin');
  });
});

// __tests__/integration/api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { server } from '@/mocks/server';
import { userService } from '@/services/user.service';

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('User API Integration', () => {
  it('should fetch users from mocked API', async () => {
    const result = await userService.getUsers({ page: 1, limit: 10 });

    expect(result.data).toHaveLength(10);
    expect(result.total).toBeGreaterThan(0);
  });

  it('should search users', async () => {
    const result = await userService.getUsers({ search: 'test' });

    expect(result.data.every((user) => 
      user.email.includes('test') || 
      user.username.includes('test')
    )).toBe(true);
  });
});
```

## 配置文件

### package.json

```json
{
  "scripts": {
    "seed": "tsx src/seeders/database.seeder.ts",
    "seed:clean": "tsx src/seeders/database.seeder.ts --clean",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "@faker-js/faker": "^8.4.0",
    "@prisma/client": "^5.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "msw": "^2.0.0",
    "prisma": "^5.0.0",
    "tsx": "^4.0.0",
    "vitest": "^1.0.0"
  }
}
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### tests/setup.ts

```typescript
import { beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '@/mocks/server';

// 启动MSW
beforeAll(() => server.listen());

// 重置handlers
afterEach(() => server.resetHandlers());

// 关闭MSW
afterAll(() => server.close());
```

## 最佳实践

1. **使用种子值**: 在测试中使用 `faker.seed()` 保证数据可重现
2. **工厂模式**: 为复杂对象创建工厂函数
3. **分层设计**: 区分 factories（动态）、fixtures（静态）、seeders（数据库）
4. **类型安全**: 为所有生成数据定义TypeScript类型
5. **关联数据**: 处理好对象之间的引用关系
6. **性能优化**: 使用缓存避免重复生成
7. **本地化**: 根据项目需求选择合适的locale
8. **清理数据**: 测试后清理数据库
9. **Mock分离**: 使用MSW进行API mock
10. **文档化**: 为复杂工厂添加注释说明
