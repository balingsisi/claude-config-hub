# Upstash Redis 开发模板

## 技术栈

- **核心**: @upstash/redis (Serverless Redis)
- **平台**: Upstash Cloud / 自托管 Redis
- **运行时**: Node.js / Edge Runtime / Bun / Deno
- **类型系统**: TypeScript 5.x
- **集成**: Next.js / Hono / Remix / Astro

## 项目结构

```
upstash-redis-project/
├── src/
│   ├── lib/
│   │   ├── redis.ts           # Redis 客户端配置
│   │   └── cache.ts           # 缓存封装
│   ├── services/
│   │   ├── session.ts         # 会话管理
│   │   ├── rate-limiter.ts    # 速率限制
│   │   ├── pubsub.ts          # 发布订阅
│   │   └── queue.ts           # 消息队列
│   ├── hooks/
│   │   └── use-cache.ts       # React Hooks
│   ├── middleware/
│   │   └── rate-limit.ts      # 中间件
│   └── types/
│       └── index.ts
├── scripts/
│   └── seed.ts                # 初始化脚本
├── .env.local
├── wrangler.toml              # Cloudflare Workers 配置
├── package.json
└── tsconfig.json
```

## 代码模式

### 客户端配置

```typescript
// src/lib/redis.ts
import { Redis } from '@upstash/redis';

// 标准 Redis 客户端
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 多区域配置
export const redisUs = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL_US!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN_US!,
});

export const redisEu = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL_EU!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN_EU!,
});

// Cloudflare Workers / Edge Runtime
export const edgeRedis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
  // 自动检测 Edge 环境
  edgeRuntime: true,
});

// 本地开发（使用自托管 Redis）
export const localRedis = new Redis({
  url: 'http://localhost:6379',
  token: '', // 本地开发不需要 token
});
```

### 基础操作

```typescript
// 字符串操作
await redis.set('user:1', { name: 'John', email: 'john@example.com' });
await redis.set('counter', 0, { ex: 3600 }); // 1小时过期
await redis.set('session:abc', 'data', { nx: true }); // 仅当不存在时设置

const user = await redis.get<User>('user:1');
const counter = await redis.incr('counter');
const exists = await redis.exists('user:1');
const ttl = await redis.ttl('session:abc');

// 批量操作
await redis.mset({
  'user:1:name': 'John',
  'user:1:email': 'john@example.com',
  'user:1:role': 'admin',
});

const values = await redis.mget('user:1:name', 'user:1:email');

// 删除
await redis.del('user:1');
await redis.del(['user:1:name', 'user:1:email']);

// 过期时间
await redis.expire('user:1', 3600); // 1小时后过期
await redis.persist('user:1'); // 移除过期时间
```

### 哈希操作

```typescript
// 哈希操作
await redis.hset('user:1', {
  name: 'John',
  email: 'john@example.com',
  role: 'admin',
  loginCount: 0,
});

const user = await redis.hgetall<UserData>('user:1');
const name = await redis.hget('user:1', 'name');
const fields = await redis.hkeys('user:1');
const values = await redis.hvals('user:1');

// 增量
await redis.hincrby('user:1', 'loginCount', 1);

// 条件设置
await redis.hsetnx('user:1', 'createdAt', new Date().toISOString());

// 删除字段
await redis.hdel('user:1', 'tempField');
```

### 列表操作

```typescript
// 列表操作
await redis.lpush('queue:tasks', 'task1', 'task2', 'task3');
await redis.rpush('queue:tasks', 'task4');

const task = await redis.lpop('queue:tasks');
const task = await redis.rpop('queue:tasks');

const range = await redis.lrange('queue:tasks', 0, 9); // 前10个
const length = await redis.llen('queue:tasks');

// 阻塞弹出（需要特殊配置）
const result = await redis.blpop('queue:tasks', 5); // 5秒超时

// 裁剪列表
await redis.ltrim('logs:recent', 0, 99); // 保留最近100条
```

### 集合操作

```typescript
// 集合操作
await redis.sadd('user:1:tags', 'typescript', 'react', 'nodejs');
await redis.sadd('user:2:tags', 'python', 'django', 'nodejs');

const tags = await redis.smembers('user:1:tags');
const isMember = await redis.sismember('user:1:tags', 'typescript');

const count = await redis.scard('user:1:tags');

// 移除
await redis.srem('user:1:tags', 'deprecated-tag');

// 集合运算
const common = await redis.sinter('user:1:tags', 'user:2:tags');
const all = await redis.sunion('user:1:tags', 'user:2:tags');
const diff = await redis.sdiff('user:1:tags', 'user:2:tags');
```

### 有序集合

```typescript
// 有序集合（排行榜）
await redis.zadd('leaderboard', { score: 100, member: 'user1' });
await redis.zadd('leaderboard', [
  { score: 95, member: 'user2' },
  { score: 88, member: 'user3' },
  { score: 120, member: 'user4' },
]);

// 获取排名（从高到低）
const top10 = await redis.zrange('leaderboard', 0, 9, { rev: true });
const withScores = await redis.zrange('leaderboard', 0, 9, {
  rev: true,
  withScores: true,
});

// 获取成员排名
const rank = await redis.zrank('leaderboard', 'user1');
const score = await redis.zscore('leaderboard', 'user1');

// 范围查询
const highScores = await redis.zrangebyscore('leaderboard', 90, 100);

// 增量
await redis.zincrby('leaderboard', 10, 'user1');

// 移除
await redis.zrem('leaderboard', 'user2');
await redis.zremrangebyrank('leaderboard', 0, -11); // 保留前10
```

### 缓存封装

```typescript
// src/lib/cache.ts
import { redis } from './redis';

interface CacheOptions {
  ttl?: number;        // 过期时间（秒）
  staleWhileRevalidate?: number; // 后台刷新时间
}

export class CacheService {
  private prefix: string;

  constructor(prefix: string = 'cache') {
    this.prefix = prefix;
  }

  private key(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get<T>(this.key(key));
    return data;
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 3600; // 默认1小时
    await redis.set(this.key(key), value, { ex: ttl });
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  async delete(key: string): Promise<void> {
    await redis.del(this.key(key));
  }

  async deletePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(`${this.prefix}:${pattern}`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  }

  // 缓存装饰器模式
  wrap<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    keyGenerator: (...args: Parameters<T>) => string,
    options: CacheOptions = {}
  ): T {
    return (async (...args: Parameters<T>) => {
      const key = keyGenerator(...args);
      return this.getOrSet(key, () => fn(...args), options);
    }) as T;
  }
}

// 使用示例
const userCache = new CacheService('users');

const user = await userCache.getOrSet(
  `profile:${userId}`,
  async () => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  },
  { ttl: 300 } // 5分钟
);
```

### 会话管理

```typescript
// src/services/session.ts
import { redis } from '../lib/redis';
import { nanoid } from 'nanoid';

interface SessionData {
  userId: string;
  email: string;
  role: string;
  createdAt: number;
  lastAccessAt: number;
}

export class SessionService {
  private prefix = 'session';
  private ttl = 7 * 24 * 3600; // 7天

  async create(data: Omit<SessionData, 'createdAt' | 'lastAccessAt'>): Promise<string> {
    const sessionId = nanoid(32);
    const now = Date.now();

    await redis.set(
      `${this.prefix}:${sessionId}`,
      {
        ...data,
        createdAt: now,
        lastAccessAt: now,
      },
      { ex: this.ttl }
    );

    return sessionId;
  }

  async get(sessionId: string): Promise<SessionData | null> {
    const data = await redis.get<SessionData>(`${this.prefix}:${sessionId}`);
    
    if (data) {
      // 更新最后访问时间并延长过期
      await redis.set(
        `${this.prefix}:${sessionId}`,
        { ...data, lastAccessAt: Date.now() },
        { ex: this.ttl }
      );
    }

    return data;
  }

  async update(sessionId: string, data: Partial<SessionData>): Promise<void> {
    const existing = await this.get(sessionId);
    if (!existing) return;

    await redis.set(
      `${this.prefix}:${sessionId}`,
      { ...existing, ...data },
      { ex: this.ttl }
    );
  }

  async destroy(sessionId: string): Promise<void> {
    await redis.del(`${this.prefix}:${sessionId}`);
  }

  async destroyAll(userId: string): Promise<void> {
    // 需要维护用户会话索引
    const sessionIds = await redis.smembers(`user:sessions:${userId}`);
    if (sessionIds.length > 0) {
      await redis.del(sessionIds.map((id) => `${this.prefix}:${id}`));
      await redis.del(`user:sessions:${userId}`);
    }
  }
}
```

### 速率限制

```typescript
// src/services/rate-limiter.ts
import { redis } from '../lib/redis';

interface RateLimitConfig {
  windowMs: number;    // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  prefix?: string;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const key = `${this.config.prefix || 'ratelimit'}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // 使用 Lua 脚本保证原子性
    const result = await redis.eval(
      `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local window_start = tonumber(ARGV[2])
      local max_requests = tonumber(ARGV[3])
      local window_ms = tonumber(ARGV[4])

      -- 清理过期的请求
      redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

      -- 获取当前窗口内的请求数
      local current = redis.call('ZCARD', key)

      if current < max_requests then
        -- 添加新请求
        redis.call('ZADD', key, now, now .. '-' .. math.random())
        redis.call('PEXPIRE', key, window_ms)
        return {1, max_requests, max_requests - current - 1, now + window_ms}
      else
        -- 获取最早的请求时间
        local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')[2]
        return {0, max_requests, 0, tonumber(oldest) + window_ms}
      end
      `,
      [key],
      [now, windowStart, this.config.maxRequests, this.config.windowMs]
    );

    const [success, limit, remaining, resetAt] = result as [number, number, number, number];

    return {
      success: success === 1,
      limit,
      remaining,
      resetAt,
    };
  }

  async reset(identifier: string): Promise<void> {
    const key = `${this.config.prefix || 'ratelimit'}:${identifier}`;
    await redis.del(key);
  }
}

// 使用示例
const apiLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1分钟
  maxRequests: 100,
  prefix: 'api',
});

const result = await apiLimiter.check('user:123');
if (!result.success) {
  throw new Error(`Rate limit exceeded. Reset at ${new Date(result.resetAt)}`);
}
```

### 发布订阅

```typescript
// src/services/pubsub.ts
import { Redis } from '@upstash/redis';

// 发布者
export const publisher = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 订阅者（需要单独连接）
export const subscriber = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export class PubSubService {
  // 发布消息
  async publish(channel: string, message: any): Promise<number> {
    return publisher.publish(channel, JSON.stringify(message));
  }

  // 订阅频道（注意：Upstash Redis 订阅有限制）
  async subscribe(channels: string[], handler: (channel: string, message: any) => void) {
    // Upstash Redis 的订阅通过 WebSocket 实现
    // 需要使用专门的订阅客户端
    console.log(`Subscribing to: ${channels.join(', ')}`);
    // 实现取决于具体使用场景
  }
}

// 实时通知示例
export class NotificationService {
  private channel = 'notifications';

  async notify(userId: string, notification: any) {
    await publisher.publish(
      this.channel,
      { userId, ...notification, timestamp: Date.now() }
    );
  }

  async broadcast(message: any) {
    await publisher.publish(this.channel, {
      type: 'broadcast',
      ...message,
      timestamp: Date.now(),
    });
  }
}
```

### 消息队列

```typescript
// src/services/queue.ts
import { redis } from '../lib/redis';

interface QueueMessage<T = any> {
  id: string;
  data: T;
  createdAt: number;
  attempts: number;
}

export class QueueService<T = any> {
  private queueKey: string;
  private processingKey: string;

  constructor(name: string) {
    this.queueKey = `queue:${name}`;
    this.processingKey = `queue:${name}:processing`;
  }

  // 添加任务
  async enqueue(data: T, options: { priority?: number } = {}): Promise<string> {
    const id = nanoid(16);
    const message: QueueMessage<T> = {
      id,
      data,
      createdAt: Date.now(),
      attempts: 0,
    };

    const score = options.priority ?? Date.now();
    await redis.zadd(this.queueKey, { score, member: JSON.stringify(message) });

    return id;
  }

  // 获取任务（带超时锁定）
  async dequeue(timeout: number = 30000): Promise<QueueMessage<T> | null> {
    const now = Date.now();

    // 获取最早的任务
    const items = await redis.zrange(this.queueKey, 0, 0);
    if (!items || items.length === 0) return null;

    const messageStr = items[0] as string;
    const message: QueueMessage<T> = JSON.parse(messageStr);

    // 移动到处理队列
    await redis.zrem(this.queueKey, messageStr);
    await redis.zadd(this.processingKey, {
      score: now + timeout,
      member: messageStr,
    });

    return message;
  }

  // 确认完成
  async ack(messageId: string): Promise<void> {
    const items = await redis.zrange(this.processingKey, 0, -1);
    for (const item of items) {
      const message: QueueMessage<T> = JSON.parse(item as string);
      if (message.id === messageId) {
        await redis.zrem(this.processingKey, item);
        break;
      }
    }
  }

  // 任务失败，重新入队
  async nack(messageId: string, maxAttempts: number = 3): Promise<void> {
    const items = await redis.zrange(this.processingKey, 0, -1);
    for (const item of items) {
      const message: QueueMessage<T> = JSON.parse(item as string);
      if (message.id === messageId) {
        await redis.zrem(this.processingKey, item);
        
        if (message.attempts < maxAttempts) {
          message.attempts++;
          await redis.zadd(this.queueKey, {
            score: Date.now(),
            member: JSON.stringify(message),
          });
        }
        break;
      }
    }
  }

  // 恢复超时任务
  async recoverTimedOut(): Promise<number> {
    const now = Date.now();
    const items = await redis.zrangebyscore(this.processingKey, '-inf', now);
    
    for (const item of items) {
      const message: QueueMessage<T> = JSON.parse(item as string);
      await redis.zrem(this.processingKey, item);
      await redis.zadd(this.queueKey, {
        score: Date.now(),
        member: JSON.stringify({ ...message, attempts: message.attempts + 1 }),
      });
    }

    return items.length;
  }
}

// 使用示例
const emailQueue = new QueueService<EmailData>('emails');

// 生产者
await emailQueue.enqueue({
  to: 'user@example.com',
  subject: 'Welcome',
  template: 'welcome',
});

// 消费者
const message = await emailQueue.dequeue();
if (message) {
  try {
    await sendEmail(message.data);
    await emailQueue.ack(message.id);
  } catch (error) {
    await emailQueue.nack(message.id);
  }
}
```

## 最佳实践

### 1. 键命名规范

```typescript
// 推荐的键命名模式
const KEY_PATTERNS = {
  // 用户相关
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:${id}:profile`,
  userSessions: (id: string) => `user:${id}:sessions`,
  
  // 缓存
  cache: (namespace: string, key: string) => `cache:${namespace}:${key}`,
  
  // 排行榜
  leaderboard: (game: string) => `leaderboard:${game}`,
  
  // 限流
  ratelimit: (type: string, id: string) => `ratelimit:${type}:${id}`,
  
  // 锁
  lock: (resource: string) => `lock:${resource}`,
};
```

### 2. 管道与批处理

```typescript
// 使用管道减少网络往返
import { Pipeline } from '@upstash/redis';

const pipeline = redis.pipeline();

pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
pipeline.get('key1');
pipeline.incr('counter');

const results = await pipeline.exec();
// results: ['OK', 'OK', 'value1', 1]
```

### 3. 分布式锁

```typescript
// src/services/lock.ts
import { redis } from '../lib/redis';
import { randomUUID } from 'crypto';

export class DistributedLock {
  private prefix = 'lock';
  private defaultTtl = 10000; // 10秒

  async acquire(
    resource: string,
    ttl: number = this.defaultTtl
  ): Promise<string | null> {
    const key = `${this.prefix}:${resource}`;
    const token = randomUUID();

    const result = await redis.set(key, token, {
      nx: true,
      px: ttl,
    });

    return result === 'OK' ? token : null;
  }

  async release(resource: string, token: string): Promise<boolean> {
    const key = `${this.prefix}:${resource}`;

    // 使用 Lua 脚本保证原子性
    const result = await redis.eval(
      `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
      `,
      [key],
      [token]
    );

    return result === 1;
  }

  async withLock<T>(
    resource: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const token = await this.acquire(resource, ttl);
    if (!token) {
      throw new Error(`Failed to acquire lock for ${resource}`);
    }

    try {
      return await fn();
    } finally {
      await this.release(resource, token);
    }
  }
}
```

### 4. 监控与指标

```typescript
// src/lib/redis-monitor.ts
import { redis } from './redis';

export async function getRedisMetrics() {
  const info = await redis.info('memory');
  const dbsize = await redis.dbsize();

  return {
    connectedClients: extractMetric(info, 'connected_clients'),
    usedMemory: extractMetric(info, 'used_memory_human'),
    keys: dbsize,
    hitRate: await calculateHitRate(),
  };
}

async function calculateHitRate(): Promise<number> {
  const stats = await redis.info('stats');
  const hits = extractMetric(stats, 'keyspace_hits');
  const misses = extractMetric(stats, 'keyspace_misses');
  
  const total = hits + misses;
  return total > 0 ? hits / total : 0;
}
```

## 常用命令

```bash
# 安装
npm install @upstash/redis

# CLI 操作
upstash redis cli

# 查看数据库信息
upstash redis info

# 监控
upstash redis monitor

# 备份
upstash redis backup create

# 恢复
upstash redis backup restore <backup-id>
```

## 部署配置

### Next.js 集成

```typescript
// app/api/rate-limit/route.ts
import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  const key = `ratelimit:${ip}`;
  const requests = await redis.incr(key);
  
  if (requests === 1) {
    await redis.expire(key, 60); // 1分钟窗口
  }
  
  if (requests > 100) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
  
  return NextResponse.json({ success: true });
}
```

### Cloudflare Workers

```typescript
// src/index.ts
import { Redis } from '@upstash/redis/cloudflare';
import { Hono } from 'hono';

type Bindings = {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/api/data', async (c) => {
  const redis = new Redis({
    url: c.env.UPSTASH_REDIS_REST_URL,
    token: c.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const cached = await redis.get('data');
  if (cached) {
    return c.json(cached);
  }

  const data = await fetchData();
  await redis.set('data', data, { ex: 60 });

  return c.json(data);
});

export default app;
```

### 环境变量

```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# 多区域
UPSTASH_REDIS_REST_URL_US=https://us-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN_US=xxx
UPSTASH_REDIS_REST_URL_EU=https://eu-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN_EU=xxx
```

### Vercel Edge Config

```typescript
// vercel.json
{
  "crons": [{
    "path": "/api/cleanup",
    "schedule": "0 * * * *"
  }]
}

// app/api/cleanup/route.ts
export async function GET() {
  // 每小时清理过期缓存
  const keys = await redis.keys('cache:*');
  // ... 清理逻辑
  return Response.json({ cleaned: keys.length });
}
```

## 扩展资源

- [Upstash Redis 文档](https://upstash.com/docs/redis)
- [Upstash Redis SDK](https://github.com/upstash/upstash-redis)
- [Redis 命令参考](https://redis.io/commands)
- [Upstash 定价](https://upstash.com/pricing)
- [最佳实践指南](https://upstash.com/docs/redis/bestpractices/overview)
