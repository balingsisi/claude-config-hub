# NestJS Microservices - 企业级微服务架构

NestJS 是一个用于构建高效、可扩展的 Node.js 服务器端应用程序的框架。本模板专注于微服务架构模式，包含服务间通信、事件驱动、分布式追踪等企业级特性。

## 技术栈

- **核心**: NestJS 10+, TypeScript 5+
- **传输层**: TCP, Redis, NATS, RabbitMQ, Kafka, gRPC
- **消息模式**: Request-Response, Event-Based
- **服务发现**: Consul, etcd
- **配置管理**: @nestjs/config, Consul KV
- **API 网关**: NestJS Gateway, Kong, Traefik
- **可观测性**: OpenTelemetry, Prometheus, Grafana, Jaeger
- **数据库**: TypeORM, Prisma, Mongoose (每个服务独立)
- **认证**: JWT, OAuth2, @nestjs/passport

## 项目结构

```
nestjs-microservices/
├── apps/                           # 微服务应用
│   ├── api-gateway/                # API 网关
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   └── proxy/
│   │   │   ├── guards/
│   │   │   ├── filters/
│   │   │   └── main.ts
│   │   └── tsconfig.app.json
│   ├── user-service/               # 用户服务
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── entities/
│   │   │   ├── dto/
│   │   │   ├── events/
│   │   │   └── main.ts
│   │   └── tsconfig.app.json
│   ├── order-service/              # 订单服务
│   ├── product-service/            # 产品服务
│   └── notification-service/       # 通知服务
├── libs/                           # 共享库
│   ├── common/                     # 通用工具
│   │   ├── src/
│   │   │   ├── decorators/
│   │   │   ├── interceptors/
│   │   │   ├── filters/
│   │   │   ├── pipes/
│   │   │   └── utils/
│   │   └── tsconfig.lib.json
│   ├── database/                   # 数据库配置
│   ├── messaging/                  # 消息工具
│   └── telemetry/                  # 可观测性
├── proto/                          # gRPC 协议定义
│   ├── user.proto
│   ├── order.proto
│   └── product.proto
├── docker/                         # Docker 配置
│   ├── api-gateway.Dockerfile
│   ├── user-service.Dockerfile
│   └── docker-compose.yml
├── k8s/                            # Kubernetes 配置
│   ├── deployments/
│   ├── services/
│   └── configmaps/
├── nest-cli.json                   # Nest CLI 配置
├── tsconfig.json                   # TypeScript 配置
└── package.json
```

## 代码模式

### 服务配置

```typescript
// apps/user-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { UserModule } from './user.module';
import { AllExceptionsFilter } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.HOST || '0.0.0.0',
        port: parseInt(process.env.PORT, 10) || 3001,
      },
    },
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen();
  Logger.log(`User service is running on TCP port ${process.env.PORT || 3001}`);
}

bootstrap();
```

### 微服务控制器

```typescript
// apps/user-service/src/controllers/user.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, EventPattern } from '@nestjs/microservices';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Request-Response 模式
  @MessagePattern({ cmd: 'create_user' })
  async create(@Payload() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @MessagePattern({ cmd: 'find_user' })
  async findOne(@Payload() data: { id: string }) {
    return this.userService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'find_all_users' })
  async findAll(@Payload() data: { page: number; limit: number }) {
    return this.userService.findAll(data.page, data.limit);
  }

  @MessagePattern({ cmd: 'update_user' })
  async update(@Payload() data: { id: string; updateUserDto: UpdateUserDto }) {
    return this.userService.update(data.id, data.updateUserDto);
  }

  @MessagePattern({ cmd: 'delete_user' })
  async remove(@Payload() data: { id: string }) {
    return this.userService.remove(data.id);
  }

  // Event-Based 模式
  @EventPattern('user_created')
  async handleUserCreated(data: { userId: string; email: string }) {
    // 处理用户创建事件（如发送欢迎邮件）
    console.log('User created:', data);
  }

  @EventPattern('order_placed')
  async handleOrderPlaced(data: { userId: string; orderId: string }) {
    // 更新用户订单历史
    await this.userService.addOrderToHistory(data.userId, data.orderId);
  }
}
```

### 服务实现

```typescript
// apps/user-service/src/services/user.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = await this.userRepository.create(createUserDto);

    // 发布用户创建事件
    this.orderClient.emit('user_created', {
      userId: user.id,
      email: user.email,
      createdAt: user.createdAt,
    });

    return user;
  }

  async findOne(id: string): Promise<User> {
    // 缓存优先
    const cachedUser = await this.cacheManager.get<User>(`user:${id}`);
    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.userRepository.findOne(id);
    if (user) {
      await this.cacheManager.set(`user:${id}`, user, 3600); // 1小时缓存
    }
    return user;
  }

  async findAll(page = 1, limit = 10): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.userRepository.findAll(page, limit);
    return { users, total };
  }

  async update(id: string, updateUserDto: Partial<User>): Promise<User> {
    const user = await this.userRepository.update(id, updateUserDto);
    await this.cacheManager.del(`user:${id}`);
    return user;
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.remove(id);
    await this.cacheManager.del(`user:${id}`);
  }

  async addOrderToHistory(userId: string, orderId: string): Promise<void> {
    // 调用订单服务获取订单详情
    const order = await firstValueFrom(
      this.orderClient.send({ cmd: 'find_order' }, { id: orderId }),
    );

    await this.userRepository.addOrderToHistory(userId, order);
  }
}
```

### 模块配置

```typescript
// apps/user-service/src/user.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';
import { User } from './entities/user.entity';

@Module({
  imports: [
    // 数据库
    TypeOrmModule.forFeature([User]),
    
    // 缓存
    CacheModule.register({
      ttl: 3600,
      max: 100,
    }),
    
    // 其他微服务客户端
    ClientsModule.register([
      {
        name: 'ORDER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ORDER_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.ORDER_SERVICE_PORT, 10) || 3002,
        },
      },
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'notification_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
```

### API 网关

```typescript
// apps/api-gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  // Swagger 文档
  const config = new DocumentBuilder()
    .setTitle('Microservices API')
    .setDescription('API Gateway for microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
  Logger.log(`API Gateway running on port ${process.env.PORT || 3000}`);
}

bootstrap();
```

```typescript
// apps/api-gateway/src/modules/proxy/proxy.controller.ts
import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('users')
export class UserProxyController {
  private userClient: ClientProxy;

  constructor() {
    this.userClient = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: process.env.USER_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.USER_SERVICE_PORT, 10) || 3001,
      },
    });
  }

  @Post()
  async create(@Body() createUserDto: any) {
    return firstValueFrom(
      this.userClient.send({ cmd: 'create_user' }, createUserDto),
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.userClient.send({ cmd: 'find_user' }, { id }),
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return firstValueFrom(
      this.userClient.send({ cmd: 'find_all_users' }, { page: 1, limit: 10 }),
    );
  }
}
```

### Redis 传输层

```typescript
// 使用 Redis 作为消息代理
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD,
    },
  },
);
```

### RabbitMQ 事件总线

```typescript
// libs/messaging/src/rabbitmq.module.ts
import { Module, DynamicModule } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

export interface RabbitMQModuleOptions {
  name: string;
  queue: string;
  urls: string[];
}

@Module({})
export class RabbitMQModule {
  static register(options: RabbitMQModuleOptions): DynamicModule {
    return {
      module: RabbitMQModule,
      imports: [
        ClientsModule.register([
          {
            name: options.name,
            transport: Transport.RMQ,
            options: {
              urls: options.urls,
              queue: options.queue,
              queueOptions: {
                durable: true,
              },
            },
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}

// 使用
@Module({
  imports: [
    RabbitMQModule.register({
      name: 'EVENT_BUS',
      queue: 'events_queue',
      urls: ['amqp://localhost:5672'],
    }),
  ],
})
export class OrderModule {}
```

### gRPC 服务

```protobuf
// proto/user.proto
syntax = "proto3";

package user;

service UserService {
  rpc CreateUser (CreateUserRequest) returns (UserResponse);
  rpc FindUser (FindUserRequest) returns (UserResponse);
  rpc FindAllUsers (FindAllRequest) returns (UserListResponse);
}

message CreateUserRequest {
  string email = 1;
  string name = 2;
  string password = 3;
}

message FindUserRequest {
  string id = 1;
}

message FindAllRequest {
  int32 page = 1;
  int32 limit = 2;
}

message UserResponse {
  string id = 1;
  string email = 2;
  string name = 3;
  string createdAt = 4;
}

message UserListResponse {
  repeated UserResponse users = 1;
  int32 total = 2;
}
```

```typescript
// apps/user-service/src/main.ts (gRPC)
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import { UserModule } from './user.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'user',
        protoPath: join(__dirname, '../../../proto/user.proto'),
        url: `${process.env.HOST || '0.0.0.0'}:${process.env.PORT || 3001}`,
      },
    },
  );

  await app.listen();
}
bootstrap();

// gRPC 控制器
@Controller()
export class UserGrpcController {
  constructor(private readonly userService: UserService) {}

  @GrpcMethod('UserService', 'CreateUser')
  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    return this.userService.create(data);
  }

  @GrpcMethod('UserService', 'FindUser')
  async findUser(data: FindUserRequest): Promise<UserResponse> {
    return this.userService.findOne(data.id);
  }
}
```

### 分布式追踪 (OpenTelemetry)

```typescript
// libs/telemetry/src/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
});

const metricReader = new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
  }),
  exportIntervalMillis: 10000,
});

export const sdk = new NodeSDK({
  traceExporter,
  metricReader,
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: process.env.SERVICE_NAME || 'nestjs-service',
});

// 在 main.ts 中初始化
import { sdk } from '@app/telemetry';

async function bootstrap() {
  // 启动追踪
  await sdk.start();
  
  // ... 应用启动代码
  
  // 优雅关闭
  process.on('SIGTERM', async () => {
    await app.close();
    await sdk.shutdown();
  });
}
```

### 健康检查

```typescript
// apps/user-service/src/health/health.controller.ts
import { Controller } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () =>
        this.microservice.pingCheck('redis', {
          transport: Transport.REDIS,
          options: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT, 10),
          },
        }),
    ]);
  }
}
```

## 最佳实践

### 1. 服务边界设计

```typescript
// 按业务能力划分服务
// ✅ 好：单一职责
- user-service: 用户认证、资料管理
- order-service: 订单处理、状态管理
- product-service: 产品目录、库存
- notification-service: 通知、邮件、短信

// ❌ 避免：按技术层划分
- frontend-service
- backend-service
- database-service
```

### 2. 数据库隔离

```typescript
// 每个服务独立的数据库连接
// apps/user-service/src/user.module.ts
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.USER_DB_HOST,
  port: parseInt(process.env.USER_DB_PORT, 10),
  username: process.env.USER_DB_USER,
  password: process.env.USER_DB_PASSWORD,
  database: process.env.USER_DB_NAME,
  entities: [User],
  synchronize: false,
}),

// apps/order-service/src/order.module.ts
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.ORDER_DB_HOST,
  port: parseInt(process.env.ORDER_DB_PORT, 10),
  username: process.env.ORDER_DB_USER,
  password: process.env.ORDER_DB_PASSWORD,
  database: process.env.ORDER_DB_NAME,
  entities: [Order],
  synchronize: false,
}),
```

### 3. 幂等性处理

```typescript
// 使用幂等键防止重复处理
@Injectable()
export class OrderService {
  async processOrder(orderData: any, idempotencyKey: string): Promise<Order> {
    // 检查是否已处理
    const existing = await this.orderRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return existing; // 返回已存在的订单
    }

    // 处理订单
    const order = await this.orderRepository.create({
      ...orderData,
      idempotencyKey,
    });

    return order;
  }
}

// 控制器
@MessagePattern({ cmd: 'process_order' })
async processOrder(
  @Payload() data: { orderData: any; idempotencyKey: string },
) {
  return this.orderService.processOrder(data.orderData, data.idempotencyKey);
}
```

### 4. 熔断和重试

```typescript
// libs/common/src/interceptors/circuit-breaker.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError, of } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
  private failureCount = 0;
  private readonly threshold = 5;
  private readonly timeout = 30000; // 30秒
  private lastFailureTime: number | null = null;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 检查熔断状态
    if (this.failureCount >= this.threshold) {
      const now = Date.now();
      if (this.lastFailureTime && now - this.lastFailureTime < this.timeout) {
        return throwError(() => new HttpException('Service Unavailable', 503));
      }
      this.failureCount = 0; // 重置
    }

    return next.handle().pipe(
      retry(3), // 重试3次
      catchError((error) => {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        return throwError(() => error);
      }),
    );
  }
}
```

### 5. 配置管理

```typescript
// apps/user-service/src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    name: process.env.DATABASE_NAME || 'user_db',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  services: {
    order: {
      host: process.env.ORDER_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.ORDER_SERVICE_PORT, 10) || 3002,
    },
  },
});

// 使用
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
  ],
})
export class UserModule {}
```

## 常用命令

### 开发

```bash
# 安装依赖
npm install

# 开发模式（单个服务）
npm run start:dev user-service

# 开发模式（所有服务）
npm run start:dev

# 构建
npm run build

# 生产模式
npm run start:prod

# 生成资源
nest g module apps/user-service/src/modules/profile
nest g service apps/user-service/src/services/user
nest g controller apps/user-service/src/controllers/user
```

### 测试

```bash
# 单元测试
npm run test

# 单个服务测试
npm run test -- --testPathPattern=user-service

# E2E 测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
```

### Docker

```bash
# 构建镜像
docker-compose build

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f user-service

# 停止服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

### Kubernetes

```bash
# 应用配置
kubectl apply -f k8s/

# 查看服务状态
kubectl get pods -l app=user-service

# 查看日志
kubectl logs -f deployment/user-service

# 扩容
kubectl scale deployment user-service --replicas=3

# 端口转发（调试）
kubectl port-forward svc/user-service 3001:3001
```

## 部署配置

### Docker Compose

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  # API 网关
  api-gateway:
    build:
      context: ..
      dockerfile: docker/api-gateway.Dockerfile
    ports:
      - "3000:3000"
    environment:
      - USER_SERVICE_HOST=user-service
      - USER_SERVICE_PORT=3001
      - ORDER_SERVICE_HOST=order-service
      - ORDER_SERVICE_PORT=3002
    depends_on:
      - user-service
      - order-service
    networks:
      - microservices-network

  # 用户服务
  user-service:
    build:
      context: ..
      dockerfile: docker/user-service.Dockerfile
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - DATABASE_HOST=user-db
      - DATABASE_PORT=5432
      - DATABASE_USER=postgres
      - DATABASE_PASSWORD=postgres
      - DATABASE_NAME=user_db
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - ORDER_SERVICE_HOST=order-service
      - ORDER_SERVICE_PORT=3002
    depends_on:
      - user-db
      - redis
    networks:
      - microservices-network

  # 订单服务
  order-service:
    build:
      context: ..
      dockerfile: docker/order-service.Dockerfile
    ports:
      - "3002:3002"
    environment:
      - PORT=3002
      - DATABASE_HOST=order-db
      - DATABASE_PORT=5432
      - DATABASE_USER=postgres
      - DATABASE_PASSWORD=postgres
      - DATABASE_NAME=order_db
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - order-db
      - rabbitmq
    networks:
      - microservices-network

  # 数据库
  user-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=user_db
    volumes:
      - user-db-data:/var/lib/postgresql/data
    networks:
      - microservices-network

  order-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=order_db
    volumes:
      - order-db-data:/var/lib/postgresql/data
    networks:
      - microservices-network

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - microservices-network

  # RabbitMQ
  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    networks:
      - microservices-network

volumes:
  user-db-data:
  order-db-data:

networks:
  microservices-network:
    driver: bridge
```

### Kubernetes 部署

```yaml
# k8s/deployments/user-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  labels:
    app: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
        - name: user-service
          image: registry.example.com/user-service:latest
          ports:
            - containerPort: 3001
          env:
            - name: PORT
              valueFrom:
                configMapKeyRef:
                  name: user-service-config
                  key: port
            - name: DATABASE_HOST
              valueFrom:
                configMapKeyRef:
                  name: user-service-config
                  key: database-host
            - name: DATABASE_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: user-service-secret
                  key: database-password
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
  ports:
    - port: 3001
      targetPort: 3001
  type: ClusterIP
```

## 相关资源

- [NestJS 官方文档](https://docs.nestjs.com/)
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [NestJS CLI](https://docs.nestjs.com/cli/overview)
- [OpenTelemetry NestJS](https://opentelemetry.io/docs/instrumentation/js/getting-started/nodejs/)
- [Microservices Pattern](https://microservices.io/patterns/)
- [NestJS Realworld Example](https://github.com/lujakob/nestjs-realworld-example-app)
