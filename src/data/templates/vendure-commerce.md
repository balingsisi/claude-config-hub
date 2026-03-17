# Vendure - TypeScript 电商框架

现代、可扩展的 Headless 电商框架，基于 Node.js 和 TypeScript，专为构建企业级电商平台设计。

## 技术栈

- **核心**: Vendure 2.x
- **语言**: TypeScript 5.x
- **数据库**: PostgreSQL / MySQL / SQLite
- **ORM**: TypeORM
- **API**: GraphQL
- **运行时**: Node.js 18+
- **缓存**: Redis
- **搜索**: Elasticsearch / OpenSearch（可选）

## 项目结构

```
vendure-project/
├── src/
│   ├── index.ts               # 应用入口
│   ├── vendure-config.ts      # Vendure 配置
│   ├── api/
│   │   ├── extensions/        # API 扩展
│   │   │   ├── custom-fields.ts
│   │   │   └── custom-resolvers.ts
│   │   └── plugins/           # 自定义插件
│   │       ├── reviews/
│   │       ├── wishlist/
│   │       └── recommendations/
│   ├── config/
│   │   ├── database.ts        # 数据库配置
│   │   ├── auth.ts            # 认证配置
│   │   ├── payment.ts         # 支付配置
│   │   └── shipping.ts        # 配送配置
│   ├── entity/                # 自定义实体
│   │   ├── custom-product.ts
│   │   └── custom-customer.ts
│   ├── service/               # 自定义服务
│   │   ├── inventory.service.ts
│   │   └── notification.service.ts
│   ├── job-queue/             # 后台任务
│   │   ├── email.job.ts
│   │   └── sync.job.ts
│   ├── middleware/            # 中间件
│   │   ├── auth.middleware.ts
│   │   └── logging.middleware.ts
│   └── util/                  # 工具函数
│       ├── price-calculator.ts
│       └── stock-reserver.ts
├── migrations/                # 数据库迁移
├── plugins/                   # 本地插件
├── tests/
│   ├── e2e/
│   └── integration/
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## 核心代码模式

### 1. 基础配置 (src/vendure-config.ts)

```typescript
import {
  AssetServerPlugin,
  configureDefaultProcessors,
  DefaultJobQueuePlugin,
  DefaultSearchPlugin,
  VendureConfig,
} from '@vendure/core';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { bullmqQueue } from '@vendure/bullmq-job-queue-plugin';
import { ElasticsearchPlugin } from '@vendure/elasticsearch-plugin';
import { path } from 'path';

import { connection } from './config/database';
import { authOptions } from './config/auth';
import { paymentMethods } from './config/payment';
import { shippingMethods } from './config/shipping';
import { CustomFields } from './api/extensions/custom-fields';

const IS_PROD = process.env.NODE_ENV === 'production';

export const config: VendureConfig = {
  apiOptions: {
    port: Number(process.env.PORT) || 3000,
    adminApiPath: 'admin-api',
    shopApiPath: 'shop-api',
    adminApiPlayground: IS_PROD ? false : { settings: { 'request.credentials': 'include' } },
    shopApiPlayground: IS_PROD ? false : { settings: { 'request.credentials': 'include' } },
    adminApiDebug: !IS_PROD,
    shopApiDebug: !IS_PROD,
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
    apolloServerPlugins: [],
  },

  authOptions,

  dbConnectionOptions: {
    ...connection,
    synchronize: false, // 生产环境必须为 false
    logging: !IS_PROD,
    migrations: [path.join(__dirname, './migrations/*.ts')],
  },

  paymentOptions: {
    paymentMethodHandlers: paymentMethods,
  },

  shippingOptions: {
    shippingCalculators: shippingMethods,
  },

  customFields: {
    ...CustomFields,
  },

  plugins: [
    // 资源服务器
    AssetServerPlugin.init({
      route: 'assets',
      assetUploadDir: path.join(__dirname, '../assets'),
      assetStorageStrategyFactory: () => {
        // 可配置 S3、GCS 等
        return new LocalAssetStorageStrategy();
      },
      processors: configureDefaultProcessors({
        imageOptimization: {
          enabled: true,
          quality: 80,
        },
      }),
    }),

    // 管理后台 UI
    AdminUiPlugin.init({
      route: 'admin',
      port: 3002,
      app: {
        compile: {
          watchMode: !IS_PROD,
        },
      },
    }),

    // 任务队列
    IS_PROD
      ? bullmqQueue({
          connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
          },
        })
      : DefaultJobQueuePlugin,

    // 搜索插件
    process.env.ELASTICSEARCH_URL
      ? ElasticsearchPlugin.init({
          host: process.env.ELASTICSEARCH_URL!,
          port: Number(process.env.ELASTICSEARCH_PORT) || 9200,
        })
      : DefaultSearchPlugin,
  ],
};
```

### 2. 认证配置 (src/config/auth.ts)

```typescript
import { AuthenticationOptions, defaultAuthentication } from '@vendure/core';
import { PassportAuthenticationStrategy } from '@vendure/core';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';

export const authOptions: AuthenticationOptions = {
  sessionDuration: '30d',
  tokenMethod: 'bearer',
  requireVerification: true,

  // 自定义密码验证
  passwordValidationStrategy: {
    validate: (password: string) => {
      const minLength = 8;
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);

      if (password.length < minLength) {
        return '密码长度至少为 ' + minLength + ' 位';
      }
      if (!hasUppercase || !hasLowercase || !hasNumber) {
        return '密码必须包含大写字母、小写字母和数字';
      }
      return true;
    },
  },

  // 认证策略
  authenticationOptions: {
    ...defaultAuthentication,
    strategies: [
      // 邮箱密码登录
      new PassportAuthenticationStrategy({
        name: 'local',
        strategy: LocalStrategy,
        verifyCallback: async (email, password, done) => {
          // 自定义验证逻辑
          return done(null, { email, password });
        },
      }),

      // Google 登录
      new PassportAuthenticationStrategy({
        name: 'google',
        strategy: GoogleStrategy,
        strategyOptions: {
          clientID: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          callbackURL: '/api/auth/google/callback',
        },
        verifyCallback: async (accessToken, refreshToken, profile, done) => {
          // 处理 Google 登录
          return done(null, profile);
        },
      }),
    ],
  },
};
```

### 3. 支付配置 (src/config/payment.ts)

```typescript
import {
  PaymentMethodHandler,
  CreatePaymentResult,
  SettlePaymentResult,
} from '@vendure/core';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Stripe 支付处理器
export const stripePaymentHandler = new PaymentMethodHandler({
  code: 'stripe-payment',
  description: 'Stripe 支付',
  args: {
    apiKey: { type: 'string', defaultValue: process.env.STRIPE_SECRET_KEY },
    webhookSecret: { type: 'string' },
  },

  async createPayment(
    order,
    args,
    ctx
  ): Promise<CreatePaymentResult> {
    const amount = Math.round(order.totalWithTax / 100); // 转换为最小单位

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: order.currencyCode,
        metadata: {
          orderId: order.id,
          orderCode: order.code,
        },
      });

      return {
        amount: order.totalWithTax,
        transactionId: paymentIntent.id,
        state: 'Authorized' as const,
        metadata: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        },
      };
    } catch (error: any) {
      return {
        amount: order.totalWithTax,
        state: 'Declined' as const,
        errorMessage: error.message,
      };
    }
  },

  async settlePayment(order, payment, args, ctx): Promise<SettlePaymentResult> {
    try {
      const paymentIntent = await stripe.paymentIntents.capture(
        payment.transactionId
      );

      if (paymentIntent.status === 'succeeded') {
        return { success: true };
      }

      return {
        success: false,
        errorMessage: '支付确认失败',
      };
    } catch (error: any) {
      return {
        success: false,
        errorMessage: error.message,
      };
    }
  },

  async cancelPayment(order, payment, args, ctx) {
    try {
      await stripe.paymentIntents.cancel(payment.transactionId);
      return { success: true };
    } catch (error: any) {
      return { success: false, errorMessage: error.message };
    }
  },

  async refundPayment(order, payment, args, ctx) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: payment.transactionId,
        amount: Math.round(payment.amount / 100),
      });

      return {
        success: refund.status === 'succeeded',
        transactionId: refund.id,
      };
    } catch (error: any) {
      return { success: false, errorMessage: error.message };
    }
  },
});

// 支付宝支付处理器
export const alipayPaymentHandler = new PaymentMethodHandler({
  code: 'alipay-payment',
  description: '支付宝支付',
  args: {
    appId: { type: 'string' },
    privateKey: { type: 'string' },
    alipayPublicKey: { type: 'string' },
  },

  async createPayment(order, args, ctx): Promise<CreatePaymentResult> {
    // 支付宝支付逻辑
    return {
      amount: order.totalWithTax,
      state: 'Authorized',
      metadata: {
        // 支付宝返回的支付链接
        payUrl: 'https://openapi.alipay.com/gateway.do?...',
      },
    };
  },

  async settlePayment(order, payment, args, ctx): Promise<SettlePaymentResult> {
    // 确认支付
    return { success: true };
  },
});

export const paymentMethods = [
  stripePaymentHandler,
  alipayPaymentHandler,
];
```

### 4. 配送配置 (src/config/shipping.ts)

```typescript
import {
  ShippingCalculator,
  ShippingLine,
  Order,
  CurrencyCode,
} from '@vendure/core';

// 固定费率配送
export const flatRateShippingCalculator = new ShippingCalculator({
  code: 'flat-rate-shipping',
  description: '固定费率配送',
  args: {
    rate: { type: 'int', defaultValue: 1000, ui: { component: 'currency-input' } },
    taxRate: { type: 'int', defaultValue: 0 },
    freeShippingThreshold: { type: 'int', defaultValue: 50000 },
  },

  calculate: async (order, args) => {
    // 超过阈值免运费
    if (order.subTotal >= args.freeShippingThreshold) {
      return {
        price: 0,
        taxRate: args.taxRate,
        priceIncludesTax: true,
      };
    }

    return {
      price: args.rate,
      taxRate: args.taxRate,
      priceIncludesTax: true,
    };
  },
});

// 按重量计算配送
export const weightBasedShippingCalculator = new ShippingCalculator({
  code: 'weight-based-shipping',
  description: '按重量计算运费',
  args: {
    baseRate: { type: 'int', defaultValue: 800 },
    perKgRate: { type: 'int', defaultValue: 200 },
    freeShippingThreshold: { type: 'int', defaultValue: 100000 },
  },

  calculate: async (order, args) => {
    if (order.subTotal >= args.freeShippingThreshold) {
      return { price: 0, taxRate: 0, priceIncludesTax: true };
    }

    // 计算订单总重量
    const totalWeight = order.lines.reduce((sum, line) => {
      const weight = (line.productVariant.customFields as any).weight || 0;
      return sum + weight * line.quantity;
    }, 0);

    const shippingCost = args.baseRate + Math.ceil(totalWeight) * args.perKgRate;

    return {
      price: shippingCost,
      taxRate: 0,
      priceIncludesTax: true,
    };
  },
});

// 分区配送
export const zoneBasedShippingCalculator = new ShippingCalculator({
  code: 'zone-based-shipping',
  description: '分区配送',
  args: {
    domesticRate: { type: 'int', defaultValue: 500 },
    internationalRate: { type: 'int', defaultValue: 2000 },
  },

  calculate: async (order, args) => {
    const shippingAddress = order.shippingAddress;
    const isDomestic = shippingAddress?.countryCode === 'CN';

    return {
      price: isDomestic ? args.domesticRate : args.internationalRate,
      taxRate: 0,
      priceIncludesTax: true,
    };
  },
});

export const shippingMethods = [
  flatRateShippingCalculator,
  weightBasedShippingCalculator,
  zoneBasedShippingCalculator,
];
```

### 5. 自定义字段 (src/api/extensions/custom-fields.ts)

```typescript
import { CustomFields } from '@vendure/core';

export const CustomFields: CustomFields = {
  Product: [
    {
      name: 'brand',
      type: 'string',
      nullable: true,
      label: [{ languageCode: 'zh', value: '品牌' }],
    },
    {
      name: 'material',
      type: 'string',
      nullable: true,
      label: [{ languageCode: 'zh', value: '材质' }],
    },
    {
      name: 'countryOfOrigin',
      type: 'string',
      nullable: true,
      label: [{ languageCode: 'zh', value: '原产地' }],
    },
    {
      name: 'warrantyMonths',
      type: 'int',
      defaultValue: 12,
      label: [{ languageCode: 'zh', value: '保修期（月）' }],
    },
    {
      name: 'isFeatured',
      type: 'boolean',
      defaultValue: false,
      label: [{ languageCode: 'zh', value: '是否精选' }],
    },
    {
      name: 'seoTitle',
      type: 'localeString',
      nullable: true,
      label: [{ languageCode: 'zh', value: 'SEO 标题' }],
    },
    {
      name: 'seoDescription',
      type: 'localeString',
      nullable: true,
      label: [{ languageCode: 'zh', value: 'SEO 描述' }],
    },
  ],

  ProductVariant: [
    {
      name: 'weight',
      type: 'float',
      defaultValue: 0,
      label: [{ languageCode: 'zh', value: '重量（kg）' }],
    },
    {
      name: 'dimensions',
      type: 'object',
      nullable: true,
      label: [{ languageCode: 'zh', value: '尺寸' }],
      fields: [
        { name: 'length', type: 'float' },
        { name: 'width', type: 'float' },
        { name: 'height', type: 'float' },
      ],
    },
    {
      name: 'barcode',
      type: 'string',
      nullable: true,
      unique: true,
      label: [{ languageCode: 'zh', value: '条形码' }],
    },
    {
      name: 'lowStockThreshold',
      type: 'int',
      defaultValue: 10,
      label: [{ languageCode: 'zh', value: '低库存阈值' }],
    },
  ],

  Customer: [
    {
      name: 'phoneNumber',
      type: 'string',
      nullable: true,
      label: [{ languageCode: 'zh', value: '手机号' }],
    },
    {
      name: 'birthday',
      type: 'datetime',
      nullable: true,
      label: [{ languageCode: 'zh', value: '生日' }],
    },
    {
      name: 'gender',
      type: 'string',
      nullable: true,
      label: [{ languageCode: 'zh', value: '性别' }],
    },
    {
      name: 'membershipLevel',
      type: 'string',
      defaultValue: 'bronze',
      label: [{ languageCode: 'zh', value: '会员等级' }],
      options: [
        { value: 'bronze' },
        { value: 'silver' },
        { value: 'gold' },
        { value: 'platinum' },
      ],
    },
    {
      name: 'points',
      type: 'int',
      defaultValue: 0,
      label: [{ languageCode: 'zh', value: '积分' }],
    },
  ],

  Order: [
    {
      name: 'giftMessage',
      type: 'string',
      nullable: true,
      label: [{ languageCode: 'zh', value: '礼品留言' }],
    },
    {
      name: 'invoiceNumber',
      type: 'string',
      nullable: true,
      label: [{ languageCode: 'zh', value: '发票号' }],
    },
    {
      name: 'source',
      type: 'string',
      defaultValue: 'web',
      label: [{ languageCode: 'zh', value: '订单来源' }],
    },
  ],
};
```

### 6. 自定义插件 - 评价系统 (src/api/plugins/reviews/reviews-plugin.ts)

```typescript
import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { AdminUiExtension } from '@vendure/admin-ui-plugin';
import { Review } from './entities/review.entity';
import { ReviewService } from './services/review.service';
import { ReviewResolver } from './resolvers/review.resolver';
import { shopApiExtensions, adminApiExtensions } from './api/api-extensions';

@VendurePlugin({
  imports: [PluginCommonModule],
  entities: [Review],
  providers: [ReviewService],
  shopApiExtensions: {
    schema: shopApiExtensions,
    resolvers: [ReviewResolver],
  },
  adminApiExtensions: {
    schema: adminApiExtensions,
    resolvers: [ReviewResolver],
  },
  compatibility: '^2.0.0',
})
export class ReviewsPlugin {}

// 实体定义
@Entity()
export class Review {
  constructor(input?: Partial<Review>) {
    if (input) {
      Object.assign(this, input);
    }
  }

  @PrimaryGeneratedId()
  id: ID;

  @Column() title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column() rating: number;

  @ManyToOne(() => Product)
  product: Product;

  @ManyToOne(() => Customer)
  author: Customer;

  @Column({ default: false })
  isApproved: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 服务
@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review) private reviewRepository: Repository<Review>,
    private listQueryBuilder: ListQueryBuilder
  ) {}

  async create(ctx: RequestContext, input: CreateReviewInput): Promise<Review> {
    const review = new Review({
      ...input,
      author: { id: input.authorId } as any,
      product: { id: input.productId } as any,
      isApproved: false,
    });

    return this.reviewRepository.save(review);
  }

  async findByProduct(
    productId: ID,
    options: ListQueryOptions<Review>
  ): Promise<PaginatedList<Review>> {
    return this.listQueryBuilder
      .build(Review, options)
      .leftJoin('review.product', 'product')
      .leftJoin('review.author', 'author')
      .addSelect(['author.id', 'author.firstName', 'author.lastName'])
      .where('product.id = :productId', { productId })
      .andWhere('review.isApproved = :isApproved', { isApproved: true })
      .getManyAndCount()
      .then(([items, totalItems]) => ({
        items,
        totalItems,
      }));
  }

  async getAverageRating(productId: ID): Promise<number> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.productId = :productId', { productId })
      .andWhere('review.isApproved = :isApproved', { isApproved: true })
      .getRawOne();

    return parseFloat(result.avg) || 0;
  }

  async approve(ctx: RequestContext, reviewId: ID): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new EntityNotFoundError('Review', reviewId);
    }

    review.isApproved = true;
    return this.reviewRepository.save(review);
  }
}
```

### 7. 任务队列 (src/job-queue/email.job.ts)

```typescript
import { JobQueue, JobQueueService } from '@vendure/core';

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

export class EmailService {
  private jobQueue: JobQueue<EmailJobData> | undefined;

  constructor(private jobQueueService: JobQueueService) {}

  async onModuleInit() {
    this.jobQueue = await this.jobQueueService.createQueue({
      name: 'send-email',
      process: async (job) => {
        const { to, subject, template, context } = job.data;

        try {
          // 发送邮件逻辑
          await this.sendEmail(to, subject, template, context);
          
          console.log(`邮件发送成功: ${to}`);
        } catch (error) {
          console.error(`邮件发送失败: ${to}`, error);
          throw error;
        }
      },
    });
  }

  async sendOrderConfirmation(order: Order) {
    await this.jobQueue?.add(
      {
        to: order.customer.emailAddress,
        subject: `订单确认 - ${order.code}`,
        template: 'order-confirmation',
        context: {
          orderCode: order.code,
          orderTotal: order.totalWithTax,
          items: order.lines,
        },
      },
      { retries: 3 }
    );
  }

  async sendShippingNotification(order: Order, trackingNumber: string) {
    await this.jobQueue?.add(
      {
        to: order.customer.emailAddress,
        subject: `您的订单已发货 - ${order.code}`,
        template: 'shipping-notification',
        context: {
          orderCode: order.code,
          trackingNumber,
          shippingAddress: order.shippingAddress,
        },
      },
      { retries: 3 }
    );
  }

  private async sendEmail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>
  ) {
    // 实际的邮件发送逻辑
    // 可以集成 SendGrid、Mailgun、AWS SES 等
  }
}
```

### 8. 库存服务 (src/service/inventory.service.ts)

```typescript
import { Injectable } from '@nestjs/common';
import { 
  RequestContext, 
  ProductVariantService,
  StockLocationService,
  TransactionalConnection,
} from '@vendure/core';

@Injectable()
export class InventoryService {
  constructor(
    private connection: TransactionalConnection,
    private productVariantService: ProductVariantService,
    private stockLocationService: StockLocationService
  ) {}

  /**
   * 检查库存可用性
   */
  async checkStockAvailability(
    ctx: RequestContext,
    productVariantId: ID,
    quantity: number
  ): Promise<{ available: boolean; stockOnHand: number }> {
    const variant = await this.productVariantService.findOne(
      ctx,
      productVariantId
    );

    if (!variant) {
      throw new Error('Product variant not found');
    }

    const stockOnHand = variant.stockOnHand;
    const available = stockOnHand >= quantity;

    return { available, stockOnHand };
  }

  /**
   * 预留库存
   */
  async reserveStock(
    ctx: RequestContext,
    productVariantId: ID,
    quantity: number
  ): Promise<void> {
    await this.connection.startTransaction(ctx);

    try {
      const variant = await this.productVariantService.findOne(
        ctx,
        productVariantId
      );

      if (!variant || variant.stockOnHand < quantity) {
        throw new Error('Insufficient stock');
      }

      // 更新库存
      await this.connection.rawConnection
        .createQueryBuilder()
        .update(ProductVariant)
        .set({
          stockOnHand: () => `stockOnHand - ${quantity}`,
        })
        .where('id = :id', { id: productVariantId })
        .execute();

      await this.connection.commitOpenTransaction(ctx);
    } catch (error) {
      await this.connection.rollBackOpenTransaction(ctx);
      throw error;
    }
  }

  /**
   * 释放预留库存
   */
  async releaseStock(
    ctx: RequestContext,
    productVariantId: ID,
    quantity: number
  ): Promise<void> {
    await this.connection.rawConnection
      .createQueryBuilder()
      .update(ProductVariant)
      .set({
        stockOnHand: () => `stockOnHand + ${quantity}`,
      })
      .where('id = :id', { id: productVariantId })
      .execute();
  }

  /**
   * 获取低库存警告
   */
  async getLowStockVariants(
    ctx: RequestContext,
    threshold: number = 10
  ): Promise<Array<{ id: ID; name: string; stockOnHand: number }>> {
    const variants = await this.connection.rawConnection
      .getRepository(ProductVariant)
      .createQueryBuilder('variant')
      .leftJoinAndSelect('variant.product', 'product')
      .where('variant.stockOnHand <= :threshold', { threshold })
      .select([
        'variant.id',
        'variant.name',
        'variant.stockOnHand',
        'product.name',
      ])
      .getMany();

    return variants.map((v) => ({
      id: v.id,
      name: `${v.product.name} - ${v.name}`,
      stockOnHand: v.stockOnHand,
    }));
  }
}
```

### 9. 环境变量 (.env.example)

```env
# 应用配置
NODE_ENV=development
PORT=3000
ADMIN_PORT=3002

# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=vendure

# Redis（任务队列）
REDIS_HOST=localhost
REDIS_PORT=6379

# Superadmin
SUPERADMIN_USERNAME=admin
SUPERADMIN_PASSWORD=admin

# Session
COOKIE_SECRET=your-secret-key

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# 支付宝
ALIPAY_APP_ID=xxx
ALIPAY_PRIVATE_KEY=xxx
ALIPAY_PUBLIC_KEY=xxx

# Google OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Elasticsearch（可选）
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_PORT=9200

# 邮件
EMAIL_FROM=noreply@example.com
SENDGRID_API_KEY=xxx

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 10. 应用入口 (src/index.ts)

```typescript
import { bootstrap, ChannelService, LanguageCode } from '@vendure/core';
import { config } from './vendure-config';

async function start() {
  const app = await bootstrap(config);

  // 初始化默认数据
  if (process.argv.includes('--populate')) {
    await populateInitialData(app);
  }

  console.log(`
    🚀 Vendure server started!
    📦 Shop API: http://localhost:${config.apiOptions.port}/shop-api
    🛠️  Admin API: http://localhost:${config.apiOptions.port}/admin-api
    🎛️  Admin UI: http://localhost:3002/admin
  `);
}

async function populateInitialData(app: any) {
  const channelService = app.get(ChannelService);
  const defaultChannel = await channelService.getDefaultChannel();

  // 设置默认语言
  await channelService.update(defaultChannel.id, {
    defaultLanguageCode: LanguageCode.zh,
    availableLanguageCodes: [LanguageCode.zh, LanguageCode.en],
  });

  console.log('✅ 初始数据已填充');
}

start().catch((err) => {
  console.error('Failed to start Vendure server:', err);
  process.exit(1);
});
```

## Vendure 特色功能

### 1. Headless 架构
- 完全分离的前后端
- GraphQL API
- 支持多渠道销售

### 2. 灵活的定价系统
- 多币种支持
- 税费计算
- 促销规则
- 会员价

### 3. 库存管理
- 多仓库支持
- 库存预留
- 低库存警告
- 库存同步

### 4. 订单工作流
- 自定义状态
- 订单拆分
- 部分退款
- 订单修改

### 5. 插件系统
- 评价系统
- 愿望清单
- 推荐引擎
- 支付集成

## 最佳实践

1. **性能优化**
   - 使用 Redis 缓存
   - 启用 Elasticsearch
   - 异步处理邮件

2. **安全配置**
   - 强密码策略
   - API 速率限制
   - SQL 注入防护

3. **扩展性**
   - 自定义插件
   - 微服务架构
   - 水平扩展

4. **国际化**
   - 多语言支持
   - 多货币
   - 税费规则

## 常用命令

```bash
# 创建项目
npx @vendure/create my-store

# 开发模式
npm run dev

# 构建
npm run build

# 数据迁移
npm run migration:run

# 初始数据
npm run populate

# 生产启动
npm run start:prod
```

## 参考资源

- [Vendure 官方文档](https://docs.vendure.io)
- [Vendure GitHub](https://github.com/vendure-ecommerce/vendure)
- [Awesome Vendure](https://github.com/vendure-ecommerce/awesome-vendure)
- [Vendure 中文社区](https://vendure.cn)
