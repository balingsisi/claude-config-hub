# Redis 缓存模板

## 技术栈

- **Redis**: Redis 7.x
- **客户端**: ioredis / redis / node-redis
- **缓存策略**: Cache-aside / Write-through / Write-behind
- **消息队列**: Redis Streams / Pub/Sub
- **会话存储**: Express Session / Connect Redis
- **速率限制**: Redis-based Rate Limiting
- **分布式锁**: Redlock
- **监控**: RedisInsight / Prometheus Redis Exporter

## 项目结构

```
redis-cache/
├── src/
│   ├── cache/                 # 缓存模块
│   │   ├── client.ts         # Redis 客户端配置
│   │   ├── manager.ts        # 缓存管理器
│   │   ├── strategies.ts     # 缓存策略
│   │   └── decorators.ts     # 缓存装饰器
│   ├── queue/                # 队列模块
│   │   ├── producer.ts       # 生产者
│   │   ├── consumer.ts       # 消费者
│   │   └── types.ts          # 类型定义
│   ├── pubsub/               # 发布订阅
│   │   ├── publisher.ts
│   │   ├── subscriber.ts
│   │   └── channels.ts
│   ├── lock/                 # 分布式锁
│   │   ├── redlock.ts
│   │   └── mutex.ts
│   ├── rate-limit/           # 速率限制
│   │   ├── limiter.ts
│   │   └── middleware.ts
│   ├── session/              # 会话管理
│   │   └── store.ts
│   ├── scripts/              # Lua 脚本
│   │   ├── rate-limiter.lua
│   │   └── distributed-lock.lua
│   └── utils/
│       └── helpers.ts
├── config/
│   ├── redis.conf            # Redis 配置
│   └── sentinel.conf         # Sentinel 配置
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## 代码模式

### Redis 客户端配置

```typescript
// src/cache/client.ts
import Redis from 'ioredis';
import { Logger } from 'winston';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
  enableOfflineQueue?: boolean;
  connectTimeout?: number;
  lazyConnect?: boolean;
  retryStrategy?: (times: number) => number | null;
}

const defaultConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  keyPrefix: process.env.REDIS_PREFIX || 'app:',
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  connectTimeout: 10000,
  lazyConnect: false,
  retryStrategy: (times: number) => {
    if (times > 10) {
      console.error('Redis connection failed after 10 retries');
      return null; // 停止重试
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

class RedisClient {
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;
  private logger: Logger;

  constructor(config: Partial<RedisConfig> = {}) {
    const finalConfig = { ...defaultConfig, ...config };

    // 主客户端
    this.client = new Redis(finalConfig);
    
    // 订阅客户端（需要单独连接）
    this.subscriber = new Redis(finalConfig);
    
    // 发布客户端
    this.publisher = new Redis(finalConfig);

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // 主客户端事件
    this.client.on('connect', () => {
      console.log('Redis client connected');
    });

    this.client.on('ready', () => {
      console.log('Redis client ready');
    });

    this.client.on('error', (error) => {
      console.error('Redis client error:', error);
    });

    this.client.on('close', () => {
      console.warn('Redis client connection closed');
    });

    this.client.on('reconnecting', () => {
      console.log('Redis client reconnecting...');
    });

    // 订阅客户端事件
    this.subscriber.on('error', (error) => {
      console.error('Redis subscriber error:', error);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  getPublisher(): Redis {
    return this.publisher;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.ping();
      return response === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.client.quit(),
      this.subscriber.quit(),
      this.publisher.quit(),
    ]);
  }
}

// 单例模式
let redisInstance: RedisClient | null = null;

export function getRedisClient(config?: Partial<RedisConfig>): RedisClient {
  if (!redisInstance) {
    redisInstance = new RedisClient(config);
  }
  return redisInstance;
}

export const redis = getRedisClient().getClient();
export const redisSubscriber = getRedisClient().getSubscriber();
export const redisPublisher = getRedisClient().getPublisher();

// Redis Cluster 配置
export function createRedisCluster(nodes: Array<{ host: string; port: number }>) {
  return new Redis.Cluster(nodes, {
    scaleReads: 'slave',
    maxRedirections: 16,
    retryDelayOnFailover: 100,
    retryDelayOnClusterDown: 100,
    enableReadyCheck: true,
    slotsRefreshTimeout: 1000,
    clusterRetryStrategy: (times: number) => {
      if (times > 10) {
        return null;
      }
      return Math.min(times * 100, 3000);
    },
  });
}

// src/cache/manager.ts
import { redis } from './client';

export interface CacheOptions {
  ttl?: number;              // 过期时间（秒）
  prefix?: string;           // 键前缀
  serialize?: boolean;       // 是否序列化
  compress?: boolean;        // 是否压缩
}

class CacheManager {
  private defaultTTL = 3600; // 1 小时

  /**
   * 获取缓存
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const fullKey = this.getFullKey(key, options?.prefix);
      const value = await redis.get(fullKey);

      if (!value) {
        return null;
      }

      if (options?.serialize !== false) {
        return JSON.parse(value) as T;
      }

      return value as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * 设置缓存
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key, options?.prefix);
      const ttl = options?.ttl || this.defaultTTL;

      const serialized = options?.serialize !== false
        ? JSON.stringify(value)
        : String(value);

      if (ttl > 0) {
        await redis.setex(fullKey, ttl, serialized);
      } else {
        await redis.set(fullKey, serialized);
      }

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string, prefix?: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key, prefix);
      await redis.del(fullKey);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * 批量删除（模式匹配）
   */
  async delPattern(pattern: string, prefix?: string): Promise<number> {
    try {
      const fullPattern = this.getFullKey(pattern, prefix);
      const keys = await redis.keys(fullPattern);
      
      if (keys.length === 0) {
        return 0;
      }

      await redis.del(...keys);
      return keys.length;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string, prefix?: string): Promise<boolean> {
    const fullKey = this.getFullKey(key, prefix);
    const result = await redis.exists(fullKey);
    return result === 1;
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, ttl: number, prefix?: string): Promise<boolean> {
    const fullKey = this.getFullKey(key, prefix);
    const result = await redis.expire(fullKey, ttl);
    return result === 1;
  }

  /**
   * 获取剩余过期时间
   */
  async ttl(key: string, prefix?: string): Promise<number> {
    const fullKey = this.getFullKey(key, prefix);
    return await redis.ttl(fullKey);
  }

  /**
   * 自增
   */
  async incr(key: string, prefix?: string): Promise<number> {
    const fullKey = this.getFullKey(key, prefix);
    return await redis.incr(fullKey);
  }

  /**
   * 自增指定值
   */
  async incrBy(key: string, increment: number, prefix?: string): Promise<number> {
    const fullKey = this.getFullKey(key, prefix);
    return await redis.incrby(fullKey, increment);
  }

  /**
   * 自减
   */
  async decr(key: string, prefix?: string): Promise<number> {
    const fullKey = this.getFullKey(key, prefix);
    return await redis.decr(fullKey);
  }

  /**
   * 获取多个键
   */
  async mget<T>(keys: string[], prefix?: string): Promise<(T | null)[]> {
    const fullKeys = keys.map(key => this.getFullKey(key, prefix));
    const values = await redis.mget(...fullKeys);
    
    return values.map(value => {
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    });
  }

  /**
   * 设置多个键
   */
  async mset(items: Record<string, any>, ttl?: number, prefix?: string): Promise<boolean> {
    try {
      const pipeline = redis.pipeline();
      
      Object.entries(items).forEach(([key, value]) => {
        const fullKey = this.getFullKey(key, prefix);
        const serialized = JSON.stringify(value);
        
        if (ttl && ttl > 0) {
          pipeline.setex(fullKey, ttl, serialized);
        } else {
          pipeline.set(fullKey, serialized);
        }
      });

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * 获取并设置（如果不存在）
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // 先尝试从缓存获取
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // 执行函数获取数据
    const value = await fn();
    
    // 设置缓存
    await this.set(key, value, options);
    
    return value;
  }

  /**
   * 生成完整键名
   */
  private getFullKey(key: string, prefix?: string): string {
    if (prefix) {
      return `${prefix}:${key}`;
    }
    return key;
  }
}

export const cacheManager = new CacheManager();

// src/cache/strategies.ts
import { cacheManager } from './manager';

/**
 * Cache-Aside 策略
 * 应用程序负责维护缓存
 */
export class CacheAsideStrategy {
  async get<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await cacheManager.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    await cacheManager.set(key, data, { ttl });
    
    return data;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await cacheManager.set(key, value, { ttl });
  }

  async delete(key: string): Promise<void> {
    await cacheManager.del(key);
  }
}

/**
 * Write-Through 策略
 * 写入数据库时同时写入缓存
 */
export class WriteThroughStrategy {
  async write<T>(
    key: string,
    value: T,
    writeFn: (value: T) => Promise<void>,
    ttl?: number
  ): Promise<void> {
    // 先写入数据库
    await writeFn(value);
    
    // 再写入缓存
    await cacheManager.set(key, value, { ttl });
  }

  async read<T>(key: string, readFn: () => Promise<T>, ttl?: number): Promise<T> {
    return await cacheManager.getOrSet(key, readFn, { ttl });
  }
}

/**
 * Write-Behind 策略
 * 先写入缓存，异步写入数据库
 */
export class WriteBehindStrategy {
  private writeQueue: Map<string, any> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(private flushMs: number = 5000) {
    this.startFlushTimer();
  }

  async write<T>(
    key: string,
    value: T,
    ttl?: number
  ): Promise<void> {
    // 立即写入缓存
    await cacheManager.set(key, value, { ttl });
    
    // 加入写队列
    this.writeQueue.set(key, value);
  }

  async flush(writeFn: (items: Map<string, any>) => Promise<void>): Promise<void> {
    if (this.writeQueue.size === 0) {
      return;
    }

    const items = new Map(this.writeQueue);
    this.writeQueue.clear();

    try {
      await writeFn(items);
    } catch (error) {
      console.error('Write-behind flush error:', error);
      // 重新加入队列
      items.forEach((value, key) => {
        this.writeQueue.set(key, value);
      });
    }
  }

  private startFlushTimer() {
    this.flushInterval = setInterval(() => {
      // 触发刷新事件
      this.emit('flush');
    }, this.flushMs);
  }

  private emit(event: string) {
    // 事件发射逻辑
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
  }
}

// src/cache/decorators.ts
import { cacheManager } from './manager';

/**
 * 缓存装饰器
 */
export function Cacheable(key: string, ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // 生成缓存键（包含参数）
      const cacheKey = `${key}:${JSON.stringify(args)}`;

      // 尝试从缓存获取
      const cached = await cacheManager.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 存入缓存
      await cacheManager.set(cacheKey, result, { ttl });

      return result;
    };

    return descriptor;
  };
}

/**
 * 缓存清除装饰器
 */
export function CacheEvict(key: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 清除缓存
      await cacheManager.delPattern(`${key}:*`);

      return result;
    };

    return descriptor;
  };
}
```

### 消息队列

```typescript
// src/queue/producer.ts
import { redis } from '../cache/client';

export interface QueueMessage {
  id?: string;
  data: any;
  timestamp?: number;
  priority?: number;
}

class QueueProducer {
  constructor(private queueName: string) {}

  /**
   * 添加消息到队列
   */
  async add(data: any, options?: { priority?: number; delay?: number }): Promise<string> {
    const message: QueueMessage = {
      data,
      timestamp: Date.now(),
      priority: options?.priority || 0,
    };

    const messageStr = JSON.stringify(message);

    if (options?.delay && options.delay > 0) {
      // 延迟队列（使用 sorted set）
      const score = Date.now() + options.delay;
      await redis.zadd(`${this.queueName}:delayed`, score, messageStr);
      return `delayed:${score}`;
    } else if (options?.priority && options.priority > 0) {
      // 优先级队列（使用 sorted set）
      await redis.zadd(
        `${this.queueName}:priority`,
        -options.priority,
        messageStr
      );
      return `priority:${Date.now()}`;
    } else {
      // 普通队列（使用 list）
      await redis.lpush(this.queueName, messageStr);
      return `msg:${Date.now()}`;
    }
  }

  /**
   * 批量添加消息
   */
  async addBulk(items: any[]): Promise<number> {
    const pipeline = redis.pipeline();
    
    items.forEach(item => {
      const message: QueueMessage = {
        data: item,
        timestamp: Date.now(),
      };
      pipeline.lpush(this.queueName, JSON.stringify(message));
    });

    await pipeline.exec();
    return items.length;
  }

  /**
   * 获取队列长度
   */
  async length(): Promise<number> {
    return await redis.llen(this.queueName);
  }
}

export const createQueueProducer = (queueName: string) => new QueueProducer(queueName);

// src/queue/consumer.ts
import { redis } from '../cache/client';

interface QueueConsumerOptions {
  interval?: number;       // 轮询间隔（毫秒）
  batchSize?: number;      // 每次处理的消息数量
  visibilityTimeout?: number; // 可见性超时（秒）
}

class QueueConsumer {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private queueName: string,
    private handler: (data: any) => Promise<void>,
    private options: QueueConsumerOptions = {}
  ) {
    this.options = {
      interval: 1000,
      batchSize: 10,
      visibilityTimeout: 30,
      ...options,
    };
  }

  /**
   * 开始消费
   */
  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.process();
  }

  /**
   * 停止消费
   */
  async stop() {
    this.isRunning = false;
    
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 处理消息
   */
  private async process() {
    while (this.isRunning) {
      try {
        // 从队列获取消息
        const messages = await this.fetchMessages();

        if (messages.length === 0) {
          // 队列为空，等待一段时间
          await this.sleep(this.options.interval!);
          continue;
        }

        // 处理消息
        await Promise.all(
          messages.map(msg => this.processMessage(msg))
        );
      } catch (error) {
        console.error('Queue consumer error:', error);
        await this.sleep(5000); // 错误后等待 5 秒
      }
    }
  }

  /**
   * 获取消息
   */
  private async fetchMessages(): Promise<QueueMessage[]> {
    const pipeline = redis.pipeline();
    
    for (let i = 0; i < this.options.batchSize!; i++) {
      pipeline.rpop(this.queueName);
    }

    const results = await pipeline.exec();
    const messages: QueueMessage[] = [];

    results?.forEach(([err, result]) => {
      if (!err && result) {
        try {
          messages.push(JSON.parse(result as string));
        } catch (e) {
          console.error('Parse message error:', e);
        }
      }
    });

    return messages;
  }

  /**
   * 处理单条消息
   */
  private async processMessage(message: QueueMessage) {
    try {
      await this.handler(message.data);
    } catch (error) {
      console.error('Message handler error:', error);
      // 可以选择重新入队或记录到死信队列
      await this.handleFailedMessage(message, error);
    }
  }

  /**
   * 处理失败的消息
   */
  private async handleFailedMessage(message: QueueMessage, error: any) {
    // 重新入队（可以设置最大重试次数）
    await redis.lpush(`${this.queueName}:failed`, JSON.stringify({
      ...message,
      error: error.message,
      failedAt: Date.now(),
    }));
  }

  /**
   * 休眠
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
      this.intervalId = setTimeout(resolve, ms);
    });
  }
}

export const createQueueConsumer = (
  queueName: string,
  handler: (data: any) => Promise<void>,
  options?: QueueConsumerOptions
) => new QueueConsumer(queueName, handler, options);
```

### 发布订阅

```typescript
// src/pubsub/publisher.ts
import { redisPublisher } from '../cache/client';

class Publisher {
  /**
   * 发布消息
   */
  async publish(channel: string, message: any): Promise<number> {
    const messageStr = typeof message === 'string'
      ? message
      : JSON.stringify(message);
    
    return await redisPublisher.publish(channel, messageStr);
  }

  /**
   * 批量发布
   */
  async publishBulk(channel: string, messages: any[]): Promise<void> {
    const pipeline = redisPublisher.pipeline();
    
    messages.forEach(message => {
      const messageStr = typeof message === 'string'
        ? message
        : JSON.stringify(message);
      pipeline.publish(channel, messageStr);
    });

    await pipeline.exec();
  }
}

export const publisher = new Publisher();

// src/pubsub/subscriber.ts
import { redisSubscriber } from '../cache/client';

type MessageHandler = (message: any, channel: string) => void;

class Subscriber {
  private handlers: Map<string, Set<MessageHandler>> = new Map();

  constructor() {
    redisSubscriber.on('message', (channel: string, message: string) => {
      this.handleMessage(channel, message);
    });

    redisSubscriber.on('pmessage', (pattern: string, channel: string, message: string) => {
      this.handleMessage(channel, message, pattern);
    });
  }

  /**
   * 订阅频道
   */
  async subscribe(channel: string, handler: MessageHandler): Promise<void> {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      await redisSubscriber.subscribe(channel);
    }

    this.handlers.get(channel)!.add(handler);
  }

  /**
   * 模式订阅
   */
  async psubscribe(pattern: string, handler: MessageHandler): Promise<void> {
    const key = `pattern:${pattern}`;
    
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set());
      await redisSubscriber.psubscribe(pattern);
    }

    this.handlers.get(key)!.add(handler);
  }

  /**
   * 取消订阅
   */
  async unsubscribe(channel: string, handler?: MessageHandler): Promise<void> {
    const handlers = this.handlers.get(channel);
    
    if (!handlers) {
      return;
    }

    if (handler) {
      handlers.delete(handler);
    } else {
      handlers.clear();
    }

    if (handlers.size === 0) {
      await redisSubscriber.unsubscribe(channel);
      this.handlers.delete(channel);
    }
  }

  /**
   * 处理消息
   */
  private handleMessage(channel: string, message: string, pattern?: string) {
    const key = pattern ? `pattern:${pattern}` : channel;
    const handlers = this.handlers.get(key);

    if (!handlers) {
      return;
    }

    let parsedMessage: any;
    try {
      parsedMessage = JSON.parse(message);
    } catch {
      parsedMessage = message;
    }

    handlers.forEach(handler => {
      try {
        handler(parsedMessage, channel);
      } catch (error) {
        console.error('Message handler error:', error);
      }
    });
  }
}

export const subscriber = new Subscriber();
```

### 分布式锁

```typescript
// src/lock/redlock.ts
import { redis } from '../cache/client';

export interface LockOptions {
  ttl: number;           // 锁过期时间（毫秒）
  retryDelay?: number;   // 重试延迟
  maxRetries?: number;   // 最大重试次数
}

class Redlock {
  private defaultOptions: LockOptions = {
    ttl: 10000,          // 10 秒
    retryDelay: 200,
    maxRetries: 10,
  };

  /**
   * 获取锁
   */
  async acquire(
    resource: string,
    options?: Partial<LockOptions>
  ): Promise<string | null> {
    const opts = { ...this.defaultOptions, ...options };
    const key = `lock:${resource}`;
    const value = `${Date.now()}:${Math.random()}`;

    let retries = 0;

    while (retries < opts.maxRetries!) {
      const result = await redis.set(key, value, 'PX', opts.ttl, 'NX');

      if (result === 'OK') {
        return value;
      }

      retries++;
      await this.sleep(opts.retryDelay!);
    }

    return null;
  }

  /**
   * 释放锁
   */
  async release(resource: string, value: string): Promise<boolean> {
    const key = `lock:${resource}`;

    // 使用 Lua 脚本确保原子性
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await redis.eval(script, 1, key, value);
    return result === 1;
  }

  /**
   * 延长锁时间
   */
  async extend(
    resource: string,
    value: string,
    ttl: number
  ): Promise<boolean> {
    const key = `lock:${resource}`;

    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("pexpire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;

    const result = await redis.eval(script, 1, key, value, ttl);
    return result === 1;
  }

  /**
   * 使用锁执行函数
   */
  async using<T>(
    resource: string,
    fn: () => Promise<T>,
    options?: Partial<LockOptions>
  ): Promise<T> {
    const lock = await this.acquire(resource, options);

    if (!lock) {
      throw new Error(`Failed to acquire lock for resource: ${resource}`);
    }

    try {
      return await fn();
    } finally {
      await this.release(resource, lock);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const redlock = new Redlock();

// src/lock/mutex.ts
import { redlock } from './redlock';

/**
 * 互斥锁装饰器
 */
export function Mutex(resource: string, options?: Partial<LockOptions>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return await redlock.using(
        resource,
        () => originalMethod.apply(this, args),
        options
      );
    };

    return descriptor;
  };
}
```

### 速率限制

```typescript
// src/rate-limit/limiter.ts
import { redis } from '../cache/client';

export interface RateLimitOptions {
  windowMs: number;      // 时间窗口（毫秒）
  max: number;           // 最大请求数
  keyGenerator?: (...args: any[]) => string;
  skipFailedRequests?: boolean;
}

class RateLimiter {
  /**
   * 滑动窗口限流
   */
  async slidingWindow(
    key: string,
    options: RateLimitOptions
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = now - options.windowMs;

    const script = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local window_start = tonumber(ARGV[2])
      local max = tonumber(ARGV[3])
      local ttl = tonumber(ARGV[4])

      -- 移除过期的请求
      redis.call('ZREMRANGEBYSCORE', key, 0, window_start)

      -- 获取当前窗口内的请求数
      local current = redis.call('ZCARD', key)

      if current < max then
        -- 添加新请求
        redis.call('ZADD', key, now, now .. ':' .. math.random())
        redis.call('PEXPIRE', key, ttl)
        return {1, max - current - 1, 0}
      else
        -- 计算重置时间
        local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        local reset_time = 0
        if oldest[2] then
          reset_time = tonumber(oldest[2]) + ttl - now
        end
        return {0, 0, reset_time}
      end
    `;

    const result = await redis.eval(
      script,
      1,
      `ratelimit:${key}`,
      now,
      windowStart,
      options.max,
      options.windowMs
    ) as [number, number, number];

    const [allowed, remaining, resetTime] = result;

    return {
      allowed: allowed === 1,
      remaining,
      resetTime,
    };
  }

  /**
   * 令牌桶限流
   */
  async tokenBucket(
    key: string,
    options: { capacity: number; refillRate: number; refillInterval: number }
  ): Promise<{ allowed: boolean; remaining: number }> {
    const script = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refill_rate = tonumber(ARGV[2])
      local refill_interval = tonumber(ARGV[3])
      local now = tonumber(ARGV[4])

      local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
      local tokens = tonumber(bucket[1]) or capacity
      local last_refill = tonumber(bucket[2]) or now

      -- 计算需要补充的令牌
      local elapsed = now - last_refill
      local refill_tokens = math.floor(elapsed / refill_interval) * refill_rate

      tokens = math.min(capacity, tokens + refill_tokens)

      if tokens >= 1 then
        tokens = tokens - 1
        redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
        redis.call('PEXPIRE', key, refill_interval * capacity)
        return {1, tokens}
      else
        return {0, tokens}
      end
    `;

    const result = await redis.eval(
      script,
      1,
      `tokenbucket:${key}`,
      options.capacity,
      options.refillRate,
      options.refillInterval,
      Date.now()
    ) as [number, number];

    return {
      allowed: result[0] === 1,
      remaining: result[1],
    };
  }

  /**
   * 漏桶限流
   */
  async leakyBucket(
    key: string,
    options: { capacity: number; leakRate: number }
  ): Promise<{ allowed: boolean; queueSize: number }> {
    const script = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local leak_rate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])

      local bucket = redis.call('HMGET', key, 'queue_size', 'last_leak')
      local queue_size = tonumber(bucket[1]) or 0
      local last_leak = tonumber(bucket[2]) or now

      -- 计算漏出的请求
      local elapsed = now - last_leak
      local leaked = math.floor(elapsed / 1000 * leak_rate)
      queue_size = math.max(0, queue_size - leaked)

      if queue_size < capacity then
        queue_size = queue_size + 1
        redis.call('HMSET', key, 'queue_size', queue_size, 'last_leak', now)
        redis.call('PEXPIRE', key, 60000)
        return {1, queue_size}
      else
        return {0, queue_size}
      end
    `;

    const result = await redis.eval(
      script,
      1,
      `leakybucket:${key}`,
      options.capacity,
      options.leakRate,
      Date.now()
    ) as [number, number];

    return {
      allowed: result[0] === 1,
      queueSize: result[1],
    };
  }
}

export const rateLimiter = new RateLimiter();

// src/rate-limit/middleware.ts
import { Request, Response, NextFunction } from 'express';
import { rateLimiter } from './limiter';

export function createRateLimitMiddleware(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : req.ip || 'unknown';

    const result = await rateLimiter.slidingWindow(key, options);

    // 设置响应头
    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetTime);

    if (!result.allowed) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: result.resetTime,
      });
      return;
    }

    next();
  };
}
```

## 最佳实践

### 1. 键命名规范

```typescript
// 好的键命名
const keys = {
  // 用户缓存
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:${id}:profile`,
  userSession: (id: string) => `user:${id}:session`,
  
  // 列表
  userPosts: (id: string) => `user:${id}:posts`,
  
  // 计数器
  userLikes: (id: string) => `user:${id}:likes`,
  
  // 集合
  userFollowers: (id: string) => `user:${id}:followers`,
  
  // 有序集合
  leaderboard: (game: string) => `leaderboard:${game}`,
  
  // 哈希
  productInfo: (id: string) => `product:${id}:info`,
  
  // 时间序列
  pageViews: (page: string) => `pageviews:${page}`,
};

// 避免
// ❌ 太长
'user_information_data_profile_123'

// ❌ 无意义
'data1', 'temp', 'cache'

// ❌ 特殊字符
'user:info:123:temp!', 'user#123'
```

### 2. 内存优化

```typescript
// 使用 Hash 优化小对象
// ❌ 不好：每个字段一个键
await redis.set('user:1:name', 'John');
await redis.set('user:1:email', 'john@example.com');
await redis.set('user:1:age', '30');

// ✅ 好：使用 Hash
await redis.hset('user:1', {
  name: 'John',
  email: 'john@example.com',
  age: '30',
});

// 使用压缩列表优化小集合
// redis.conf
// hash-max-ziplist-entries 512
// hash-max-ziplist-value 64
// zset-max-ziplist-entries 128
// zset-max-ziplist-value 64

// 使用位图优化布尔值
// 用户在线状态
await redis.setbit('users:online', userId, 1);
const isOnline = await redis.getbit('users:online', userId);

// 使用 HyperLogLog 统计基数
await redis.pfadd('page:unique_visitors', visitorId);
const count = await redis.pfcount('page:unique_visitors');
```

### 3. 连接池管理

```typescript
// 使用连接池
import Redis from 'ioredis';

const pool = new Redis.Cluster(
  [
    { host: 'redis1.example.com', port: 6379 },
    { host: 'redis2.example.com', port: 6379 },
    { host: 'redis3.example.com', port: 6379 },
  ],
  {
    scaleReads: 'slave',
    enableReadyCheck: true,
    maxRedirections: 16,
    retryDelayOnFailover: 100,
    pool: {
      min: 2,
      max: 10,
    },
  }
);

// Pipeline 批量操作
const pipeline = redis.pipeline();
for (let i = 0; i < 1000; i++) {
  pipeline.set(`key:${i}`, `value:${i}`);
}
await pipeline.exec();

// 事务
const result = await redis.multi()
  .set('key1', 'value1')
  .set('key2', 'value2')
  .get('key1')
  .exec();
```

### 4. 错误处理

```typescript
// 重试机制
async function redisWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 100
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        await sleep(delay * (i + 1));
      }
    }
  }
  
  throw lastError;
}

// 降级策略
class CacheWithFallback {
  async get<T>(key: string): Promise<T | null> {
    try {
      return await cacheManager.get<T>(key);
    } catch (error) {
      console.error('Redis error, using fallback:', error);
      return null; // 降级：返回 null，从数据库读取
    }
  }
}
```

## 常用命令

```bash
# Redis CLI 命令

# 连接
redis-cli                                    # 连接本地 Redis
redis-cli -h host -p port -a password        # 连接远程 Redis
redis-cli -u redis://user:password@host:port # 使用 URL 连接

# 基本操作
SET key value                               # 设置键值
GET key                                     # 获取值
DEL key                                     # 删除键
EXISTS key                                  # 检查键是否存在
EXPIRE key seconds                          # 设置过期时间
TTL key                                     # 查看剩余过期时间
TYPE key                                    # 查看键类型

# 字符串
INCR key                                    # 自增
INCRBY key increment                        # 增加指定值
DECR key                                    # 自减
APPEND key value                            # 追加值
STRLEN key                                  # 获取长度

# 哈希
HSET key field value                        # 设置哈希字段
HGET key field                              # 获取哈希字段
HGETALL key                                 # 获取所有字段
HMSET key field1 value1 field2 value2       # 批量设置
HMGET key field1 field2                     # 批量获取
HDEL key field                              # 删除字段
HEXISTS key field                           # 检查字段是否存在
HKEYS key                                   # 获取所有字段名
HVALS key                                   # 获取所有值
HLEN key                                    # 获取字段数量

# 列表
LPUSH key value                             # 左侧插入
RPUSH key value                             # 右侧插入
LPOP key                                    # 左侧弹出
RPOP key                                    # 右侧弹出
LRANGE key start stop                       # 获取范围
LLEN key                                    # 获取长度
LINDEX key index                            # 获取指定索引
LREM key count value                        # 删除元素

# 集合
SADD key member                             # 添加成员
SREM key member                             # 删除成员
SMEMBERS key                                # 获取所有成员
SISMEMBER key member                        # 检查成员是否存在
SCARD key                                   # 获取成员数量
SINTER key1 key2                            # 交集
SUNION key1 key2                            # 并集
SDIFF key1 key2                             # 差集

# 有序集合
ZADD key score member                       # 添加成员
ZREM key member                             # 删除成员
ZRANGE key start stop [WITHSCORES]          # 范围查询（升序）
ZREVRANGE key start stop [WITHSCORES]       # 范围查询（降序）
ZRANK key member                            # 获取排名（升序）
ZREVRANK key member                         # 获取排名（降序）
ZSCORE key member                           # 获取分数
ZCARD key                                   # 获取成员数量
ZINCRBY key increment member                # 增加分数

# 发布订阅
PUBLISH channel message                     # 发布消息
SUBSCRIBE channel                           # 订阅频道
UNSUBSCRIBE channel                         # 取消订阅
PSUBSCRIBE pattern                          # 模式订阅

# 事务
MULTI                                       # 开始事务
EXEC                                        # 执行事务
DISCARD                                     # 取消事务
WATCH key                                   # 监视键

# 持久化
SAVE                                        # 同步保存
BGSAVE                                      # 异步保存
BGREWRITEAOF                                # 重写 AOF

# 信息
INFO                                        # 服务器信息
INFO memory                                 # 内存信息
INFO stats                                  # 统计信息
DBSIZE                                      # 键数量
CLIENT LIST                                 # 客户端列表
MONITOR                                     # 实时监控

# 管理
FLUSHDB                                     # 清空当前数据库
FLUSHALL                                    # 清空所有数据库
CONFIG GET parameter                        # 获取配置
CONFIG SET parameter value                  # 设置配置
SLOWLOG GET                                 # 获取慢查询日志
```

## 部署配置

### Docker Compose

```yaml
# docker-compose.yml
version: '3.9'

services:
  redis:
    image: redis:7-alpine
    container_name: redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: >
      redis-server
      --appendonly yes
      --maxmemory 1gb
      --maxmemory-policy allkeys-lru
      --save 900 1
      --save 300 10
      --save 60 10000
    volumes:
      - redis-data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf:ro
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  redis-sentinel:
    image: redis:7-alpine
    container_name: redis-sentinel
    restart: unless-stopped
    ports:
      - "26379:26379"
    command: redis-sentinel /usr/local/etc/redis/sentinel.conf
    volumes:
      - ./sentinel.conf:/usr/local/etc/redis/sentinel.conf:ro
    depends_on:
      - redis

  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: redis-exporter
    restart: unless-stopped
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=redis://redis:6379
    depends_on:
      - redis

volumes:
  redis-data:
```

### Redis 配置文件

```conf
# redis.conf

# 网络
bind 0.0.0.0
port 6379
protected-mode yes

# 通用
daemonize no
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log
databases 16

# 快照（RDB）
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# AOF 持久化
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# 内存管理
maxmemory 1gb
maxmemory-policy allkeys-lru
maxmemory-samples 5

# 惰性删除
lazyfree-lazy-eviction no
lazyfree-lazy-expire no
lazyfree-lazy-server-del no

# 安全
# requirepass your-strong-password

# 客户端
maxclients 10000
timeout 300

# 慢查询日志
slowlog-log-slower-than 10000
slowlog-max-len 128

# 客户端输出缓冲区
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60

# 频率追踪
hz 10
dynamic-hz yes

# 活跃碎片整理
activedefrag yes
```

## 参考资源

- [Redis 官方文档](https://redis.io/documentation)
- [Redis 命令参考](https://redis.io/commands)
- [ioredis 文档](https://github.com/luin/ioredis)
- [Redis 最佳实践](https://redis.io/topics/admin)
- [Redis 持久化](https://redis.io/topics/persistence)
- [Redis Sentinel](https://redis.io/topics/sentinel)
- [Redis Cluster](https://redis.io/topics/cluster-tutorial)
