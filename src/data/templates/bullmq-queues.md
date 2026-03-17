# BullMQ 任务队列模板

## 技术栈

### 核心技术
- **BullMQ**: 高性能 Node.js 任务队列
- **Redis**: 消息代理和存储后端
- **TypeScript**: 类型安全
- **ioredis**: Redis 客户端

### 消息队列功能
- **任务调度**: 延迟任务、定时任务、Cron 表达式
- **优先级队列**: 按优先级处理任务
- **重试机制**: 指数退避、自定义重试策略
- **并发控制**: 限制消费者并发数
- **任务进度**: 实时进度跟踪和报告
- **事件驱动**: 任务生命周期事件

### 配套工具
- **Bull Board**: 队列监控仪表板
- **@bullmq/flower**: 队列可视化工具
- **Cron**: 定时任务调度

## 项目结构

```
bullmq-project/
├── src/
│   ├── queues/                    # 队列定义
│   │   ├── index.ts              # 队列导出
│   │   ├── email.queue.ts        # 邮件队列
│   │   ├── video.queue.ts        # 视频处理队列
│   │   ├── report.queue.ts       # 报告生成队列
│   │   └── notification.queue.ts # 通知队列
│   ├── workers/                   # 消费者
│   │   ├── index.ts              # Worker 导出
│   │   ├── email.worker.ts       # 邮件处理
│   │   ├── video.worker.ts       # 视频处理
│   │   └── report.worker.ts      # 报告生成
│   ├── jobs/                      # 任务定义
│   │   ├── email.job.ts          # 邮件任务
│   │   ├── video.job.ts          # 视频任务
│   │   └── types.ts              # 任务类型
│   ├── producers/                 # 生产者
│   │   ├── email.producer.ts     # 邮件生产者
│   │   └── video.producer.ts     # 视频生产者
│   ├── config/
│   │   ├── redis.config.ts       # Redis 配置
│   │   └── queue.config.ts       # 队列配置
│   ├── utils/
│   │   ├── logger.ts             # 日志工具
│   │   └── retry.ts              # 重试策略
│   └── app.ts                     # 应用入口
├── dashboard/                     # Bull Board 仪表板
│   └── server.ts
├── scripts/
│   ├── seed-jobs.ts              # 测试任务脚本
│   └── clean-queues.ts           # 清理队列
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## 代码模式

### 1. 基础配置

```typescript
// src/config/redis.config.ts
import Redis, { RedisOptions } from 'ioredis';

const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    if (times > 3) {
      console.error('Redis connection failed');
      return null;
    }
    return Math.min(times * 200, 2000);
  },
};

// 用于 BullMQ 的连接
export const connection = new Redis(redisOptions);

// 用于订阅事件的连接
export const eventConnection = new Redis(redisOptions);

export default redisOptions;
```

```typescript
// src/config/queue.config.ts
import { QueueOptions } from 'bullmq';

export const defaultQueueOptions: QueueOptions = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      count: 1000,
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 5000,
    },
  },
};

export const queueNames = {
  email: 'email-queue',
  video: 'video-processing-queue',
  report: 'report-generation-queue',
  notification: 'notification-queue',
} as const;
```

### 2. 队列定义

```typescript
// src/queues/email.queue.ts
import { Queue } from 'bullmq';
import { defaultQueueOptions, queueNames } from '../config/queue.config';
import { EmailJobData } from '../jobs/types';

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType: string;
  }>;
}

export interface EmailJobResult {
  success: boolean;
  messageId?: string;
  error?: string;
  sentAt: Date;
}

export const emailQueue = new Queue<EmailJobData, EmailJobResult>(
  queueNames.email,
  {
    ...defaultQueueOptions,
    streams: {
      events: {
        maxLen: 10000,
      },
    },
  }
);

// 监听队列事件
emailQueue.on('error', (error) => {
  console.error('Email queue error:', error);
});

emailQueue.on('waiting', (jobId) => {
  console.log(`Job ${jobId} is waiting`);
});

export default emailQueue;
```

```typescript
// src/queues/video.queue.ts
import { Queue } from 'bullmq';
import { defaultQueueOptions, queueNames } from '../config/queue.config';

export interface VideoJobData {
  videoId: string;
  inputPath: string;
  outputPath: string;
  format: 'mp4' | 'webm' | 'avi';
  quality: 'low' | 'medium' | 'high' | '4k';
  options?: {
    width?: number;
    height?: number;
    bitrate?: number;
    codec?: string;
  };
}

export interface VideoJobResult {
  success: boolean;
  outputPath?: string;
  duration?: number;
  fileSize?: number;
  error?: string;
}

export const videoQueue = new Queue<VideoJobData, VideoJobResult>(
  queueNames.video,
  {
    ...defaultQueueOptions,
    defaultJobOptions: {
      ...defaultQueueOptions.defaultJobOptions,
      attempts: 2,
      timeout: 30 * 60 * 1000, // 30 minutes
    },
  }
);

export default videoQueue;
```

### 3. 消费者（Worker）

```typescript
// src/workers/email.worker.ts
import { Worker, Job } from 'bullmq';
import { connection } from '../config/redis.config';
import { EmailJobData, EmailJobResult } from '../queues/email.queue';
import { sendEmail } from '../services/email.service';
import { logger } from '../utils/logger';

export class EmailWorker {
  private worker: Worker<EmailJobData, EmailJobResult>;

  constructor() {
    this.worker = new Worker<EmailJobData, EmailJobResult>(
      'email-queue',
      async (job: Job<EmailJobData>) => {
        logger.info(`Processing email job ${job.id}`, {
          to: job.data.to,
          subject: job.data.subject,
        });

        try {
          // 更新进度
          job.updateProgress(10);

          const result = await sendEmail({
            to: job.data.to,
            subject: job.data.subject,
            template: job.data.template,
            context: job.data.context,
            attachments: job.data.attachments,
          });

          job.updateProgress(100);

          logger.info(`Email sent successfully`, {
            jobId: job.id,
            messageId: result.messageId,
          });

          return {
            success: true,
            messageId: result.messageId,
            sentAt: new Date(),
          };
        } catch (error) {
          logger.error(`Email job failed`, {
            jobId: job.id,
            error: error.message,
          });

          throw error; // 触发重试
        }
      },
      {
        connection,
        concurrency: 5, // 同时处理5个任务
        limiter: {
          max: 100, // 每分钟最多100个任务
          duration: 60000,
        },
      }
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.worker.on('completed', (job: Job, result: EmailJobResult) => {
      logger.info(`Job ${job.id} completed`, { result });
    });

    this.worker.on('failed', (job: Job | undefined, error: Error) => {
      logger.error(`Job ${job?.id} failed`, { error: error.message });
    });

    this.worker.on('error', (error: Error) => {
      logger.error('Worker error', { error: error.message });
    });

    this.worker.on('stalled', (jobId: string) => {
      logger.warn(`Job ${jobId} stalled`);
    });

    this.worker.on('progress', (job: Job, progress: number) => {
      logger.info(`Job ${job.id} progress: ${progress}%`);
    });
  }

  async start() {
    logger.info('Email worker started');
    await this.worker.waitUntilReady();
  }

  async stop() {
    logger.info('Stopping email worker...');
    await this.worker.close();
  }
}

export default new EmailWorker();
```

```typescript
// src/workers/video.worker.ts
import { Worker, Job } from 'bullmq';
import { connection } from '../config/redis.config';
import { VideoJobData, VideoJobResult } from '../queues/video.queue';
import { transcodeVideo } from '../services/video.service';
import { logger } from '../utils/logger';

export class VideoWorker {
  private worker: Worker<VideoJobData, VideoJobResult>;

  constructor() {
    this.worker = new Worker<VideoJobData, VideoJobResult>(
      'video-processing-queue',
      async (job: Job<VideoJobData>) => {
        const { videoId, inputPath, outputPath, format, quality, options } = job.data;

        logger.info(`Starting video transcoding`, {
          jobId: job.id,
          videoId,
          format,
          quality,
        });

        try {
          const result = await transcodeVideo({
            inputPath,
            outputPath,
            format,
            quality,
            options,
            onProgress: (progress: number) => {
              job.updateProgress(progress);
            },
          });

          logger.info(`Video transcoding completed`, {
            jobId: job.id,
            videoId,
            outputPath: result.outputPath,
            duration: result.duration,
          });

          return {
            success: true,
            outputPath: result.outputPath,
            duration: result.duration,
            fileSize: result.fileSize,
          };
        } catch (error) {
          logger.error(`Video transcoding failed`, {
            jobId: job.id,
            videoId,
            error: error.message,
          });

          throw error;
        }
      },
      {
        connection,
        concurrency: 2, // 视频处理较重，限制并发
      }
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.worker.on('completed', (job: Job, result: VideoJobResult) => {
      logger.info(`Video job ${job.id} completed`);
    });

    this.worker.on('failed', (job: Job | undefined, error: Error) => {
      if (job?.attemptsMade === job?.opts.attempts) {
        logger.error(`Video job ${job?.id} failed permanently`, {
          error: error.message,
        });
        // 通知用户处理失败
        // notifyVideoProcessingFailed(job.data.videoId);
      }
    });
  }

  async start() {
    logger.info('Video worker started');
    await this.worker.waitUntilReady();
  }

  async stop() {
    await this.worker.close();
  }
}

export default new VideoWorker();
```

### 4. 生产者（Producer）

```typescript
// src/producers/email.producer.ts
import { emailQueue, EmailJobData } from '../queues/email.queue';
import { v4 as uuidv4 } from 'uuid';

export class EmailProducer {
  /**
   * 发送欢迎邮件
   */
  static async sendWelcomeEmail(userId: string, email: string, name: string) {
    const job = await emailQueue.add(
      'send-welcome',
      {
        to: email,
        subject: 'Welcome to Our Platform!',
        template: 'welcome',
        context: {
          name,
          loginUrl: `${process.env.APP_URL}/login`,
        },
      },
      {
        jobId: `welcome-${userId}-${Date.now()}`,
        priority: 10, // 高优先级
      }
    );

    return job.id;
  }

  /**
   * 发送验证邮件
   */
  static async sendVerificationEmail(
    email: string,
    verificationToken: string
  ) {
    const job = await emailQueue.add(
      'send-verification',
      {
        to: email,
        subject: 'Verify Your Email Address',
        template: 'email-verification',
        context: {
          verificationUrl: `${process.env.APP_URL}/verify?token=${verificationToken}`,
        },
      },
      {
        jobId: `verification-${uuidv4()}`,
        priority: 5,
        attempts: 5, // 验证邮件多尝试几次
      }
    );

    return job.id;
  }

  /**
   * 批量发送邮件
   */
  static async sendBulkEmails(
    recipients: Array<{ email: string; name: string }>,
    subject: string,
    template: string,
    context: Record<string, any>
  ) {
    const jobs = recipients.map((recipient, index) => ({
      name: 'send-bulk',
      data: {
        to: recipient.email,
        subject,
        template,
        context: { ...context, name: recipient.name },
      },
      opts: {
        delay: index * 100, // 错开100ms，避免发送过快
        priority: 1, // 低优先级
      },
    }));

    const batchJobs = await emailQueue.addBulk(jobs);
    return batchJobs.map((job) => job.id);
  }

  /**
   * 发送带附件的邮件
   */
  static async sendEmailWithAttachment(
    email: string,
    subject: string,
    template: string,
    context: Record<string, any>,
    attachment: Buffer,
    filename: string
  ) {
    const job = await emailQueue.add(
      'send-with-attachment',
      {
        to: email,
        subject,
        template,
        context,
        attachments: [
          {
            filename,
            content: attachment,
            contentType: 'application/pdf',
          },
        ],
      },
      {
        jobId: `attachment-${uuidv4()}`,
        priority: 3,
      }
    );

    return job.id;
  }

  /**
   * 延迟发送邮件
   */
  static async scheduleEmail(
    email: string,
    subject: string,
    template: string,
    context: Record<string, any>,
    delay: number // 毫秒
  ) {
    const job = await emailQueue.add(
      'send-scheduled',
      {
        to: email,
        subject,
        template,
        context,
      },
      {
        delay, // 延迟执行
        priority: 2,
      }
    );

    return job.id;
  }
}

export default EmailProducer;
```

### 5. 定时任务（Cron）

```typescript
// src/jobs/scheduled.jobs.ts
import { QueueScheduler } from 'bullmq';
import { emailQueue } from '../queues/email.queue';
import { connection } from '../config/redis.config';
import { logger } from '../utils/logger';

// 创建定时任务调度器
export class ScheduledJobs {
  private schedulers: QueueScheduler[] = [];

  /**
   * 设置每日报告任务
   */
  setupDailyReport() {
    const scheduler = new QueueScheduler(queueNames.report, {
      connection,
    });

    // 使用 repeat 选项创建定时任务
    emailQueue.add(
      'daily-report',
      {
        to: 'admin@example.com',
        subject: 'Daily Activity Report',
        template: 'daily-report',
        context: {},
      },
      {
        repeat: {
          pattern: '0 9 * * *', // 每天9:00
          tz: 'Asia/Shanghai',
        },
        jobId: 'daily-report-job',
      }
    );

    this.schedulers.push(scheduler);
    logger.info('Daily report job scheduled');
  }

  /**
   * 设置每周清理任务
   */
  setupWeeklyCleanup() {
    emailQueue.add(
      'weekly-cleanup',
      {
        task: 'cleanup-old-data',
      },
      {
        repeat: {
          pattern: '0 2 * * 0', // 每周日凌晨2点
        },
        jobId: 'weekly-cleanup-job',
      }
    );

    logger.info('Weekly cleanup job scheduled');
  }

  /**
   * 设置每小时健康检查
   */
  setupHealthCheck() {
    emailQueue.add(
      'health-check',
      {
        task: 'check-system-health',
      },
      {
        repeat: {
          pattern: '0 * * * *', // 每小时
        },
        jobId: 'health-check-job',
      }
    );

    logger.info('Health check job scheduled');
  }

  /**
   * 取消定时任务
   */
  async cancelScheduledJob(jobId: string) {
    const jobs = await emailQueue.getRepeatableJobs();
    const job = jobs.find((j) => j.id === jobId);
    
    if (job) {
      await emailQueue.removeRepeatableByKey(job.key);
      logger.info(`Cancelled scheduled job: ${jobId}`);
    }
  }

  /**
   * 列出所有定时任务
   */
  async listScheduledJobs() {
    const jobs = await emailQueue.getRepeatableJobs();
    return jobs.map((job) => ({
      id: job.id,
      name: job.name,
      pattern: job.pattern,
      nextRun: new Date(job.next),
      lastRun: job.last ? new Date(job.last) : null,
    }));
  }

  async stopAll() {
    await Promise.all(this.schedulers.map((s) => s.close()));
    logger.info('All schedulers stopped');
  }
}

export default new ScheduledJobs();
```

### 6. 任务进度追踪

```typescript
// src/utils/progress-tracker.ts
import { Job } from 'bullmq';

export class ProgressTracker {
  private job: Job;
  private totalSteps: number;
  private currentStep: number = 0;

  constructor(job: Job, totalSteps: number) {
    this.job = job;
    this.totalSteps = totalSteps;
  }

  async next(stepName: string) {
    this.currentStep++;
    const progress = Math.round((this.currentStep / this.totalSteps) * 100);
    
    await this.job.updateProgress(progress);
    await this.job.log(`Step ${this.currentStep}: ${stepName}`);
    
    console.log(`Job ${this.job.id} - ${stepName} (${progress}%)`);
  }

  async complete() {
    await this.job.updateProgress(100);
    await this.job.log('Job completed successfully');
  }
}

// 使用示例
async function processVideoJob(job: Job) {
  const tracker = new ProgressTracker(job, 5);
  
  await tracker.next('Downloading video');
  // ... 下载逻辑
  
  await tracker.next('Extracting audio');
  // ... 提取音频
  
  await tracker.next('Transcoding');
  // ... 转码
  
  await tracker.next('Uploading to storage');
  // ... 上传
  
  await tracker.next('Updating database');
  // ... 更新数据库
  
  await tracker.complete();
}
```

### 7. 重试策略

```typescript
// src/utils/retry.ts
import { BackoffStrategy } from 'bullmq';

export const retryStrategies = {
  /**
   * 指数退避
   */
  exponential: {
    type: 'exponential' as const,
    delay: 1000,
  },

  /**
   * 固定延迟
   */
  fixed: {
    type: 'fixed' as const,
    delay: 5000,
  },

  /**
   * 自定义重试延迟
   */
  custom: (attemptsMade: number): number => {
    const delays = [1000, 5000, 15000, 60000, 300000]; // 1s, 5s, 15s, 1m, 5m
    return delays[Math.min(attemptsMade, delays.length - 1)];
  },
};

/**
 * 条件重试
 */
export function shouldRetry(error: Error, attemptsMade: number): boolean {
  // 网络错误重试
  if (error.message.includes('ECONNREFUSED')) {
    return attemptsMade < 5;
  }

  // 速率限制错误，等待更长时间
  if (error.message.includes('429')) {
    return attemptsMade < 3;
  }

  // 业务逻辑错误不重试
  if (error.message.includes('Invalid email')) {
    return false;
  }

  return attemptsMade < 3;
}
```

## 最佳实践

### 1. 队列设计

```typescript
// ✅ 按业务领域分离队列
const emailQueue = new Queue('email-queue');
const videoQueue = new Queue('video-queue');
const reportQueue = new Queue('report-queue');

// ✅ 使用有意义的任务名称
await emailQueue.add('send-welcome', data);
await emailQueue.add('send-verification', data);

// ✅ 设置合理的 TTL
const queue = new Queue('my-queue', {
  defaultJobOptions: {
    removeOnComplete: {
      count: 1000, // 保留最近1000个完成的任务
      age: 24 * 3600, // 或24小时内的
    },
    removeOnFail: {
      count: 5000, // 保留更多失败任务用于调试
    },
  },
});

// ❌ 避免在任务数据中存储大量数据
// 应该存储引用 ID，让 worker 去数据库获取完整数据
await queue.add('process-video', {
  videoId: '123', // ✅
  // videoBuffer: largeBuffer // ❌
});
```

### 2. 错误处理

```typescript
// ✅ 区分可重试和不可重试错误
class RetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryableError';
  }
}

class FatalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FatalError';
  }
}

const worker = new Worker('my-queue', async (job) => {
  try {
    // 处理逻辑
  } catch (error) {
    if (error instanceof FatalError) {
      // 不重试，直接失败
      throw new Error(error.message);
    }
    // 可重试错误
    throw error;
  }
});

// ✅ 记录详细的错误信息
worker.on('failed', (job, error) => {
  logger.error('Job failed', {
    jobId: job?.id,
    jobName: job?.name,
    data: job?.data,
    attemptsMade: job?.attemptsMade,
    error: {
      message: error.message,
      stack: error.stack,
    },
  });
});
```

### 3. 并发控制

```typescript
// ✅ 根据任务类型设置合适的并发数
const emailWorker = new Worker('email-queue', processor, {
  concurrency: 10, // 邮件发送可以高并发
  limiter: {
    max: 100, // 但要限制速率
    duration: 60000,
  },
});

const videoWorker = new Worker('video-queue', processor, {
  concurrency: 2, // 视频处理消耗资源多，限制并发
});

// ✅ 动态调整并发
worker.on('drained', () => {
  // 队列为空时可以增加并发
  if (worker.concurrency < 20) {
    worker.concurrency += 5;
  }
});

worker.on('error', (error) => {
  // 出错时减少并发
  if (worker.concurrency > 1) {
    worker.concurrency -= 1;
  }
});
```

### 4. 监控和可观测性

```typescript
// ✅ 使用 Bull Board 监控
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(videoQueue),
  ],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// ✅ 导出 Prometheus 指标
import { collectDefaultMetrics, Registry } from 'prom-client';

const register = new Registry();
collectDefaultMetrics({ register });

// 队列指标
const queueMetrics = {
  waiting: new Gauge({
    name: 'bullmq_waiting_jobs',
    help: 'Number of waiting jobs',
    labelNames: ['queue'],
    registers: [register],
  }),
  active: new Gauge({
    name: 'bullmq_active_jobs',
    help: 'Number of active jobs',
    labelNames: ['queue'],
    registers: [register],
  }),
};

// 定期更新指标
setInterval(async () => {
  const counts = await emailQueue.getJobCounts();
  queueMetrics.waiting.set({ queue: 'email' }, counts.waiting);
  queueMetrics.active.set({ queue: 'email' }, counts.active);
}, 10000);
```

### 5. 优雅关闭

```typescript
// src/app.ts
import emailWorker from './workers/email.worker';
import videoWorker from './workers/video.worker';
import { emailQueue, videoQueue } from './queues';

async function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received, shutting down gracefully...`);

  try {
    // 1. 停止接受新任务
    console.log('Pausing queues...');
    await Promise.all([
      emailQueue.pause(),
      videoQueue.pause(),
    ]);

    // 2. 等待当前任务完成
    console.log('Waiting for workers to finish...');
    await Promise.all([
      emailWorker.stop(),
      videoWorker.stop(),
    ]);

    // 3. 关闭队列连接
    console.log('Closing queues...');
    await Promise.all([
      emailQueue.close(),
      videoQueue.close(),
    ]);

    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

## 常用命令

```bash
# 安装依赖
npm install bullmq ioredis
npm install -D @types/node

# Bull Board（监控面板）
npm install @bull-board/api @bull-board/express

# 启动 Redis（Docker）
docker run -d -p 6379:6379 redis:7-alpine

# 启动应用
npm run dev

# 启动 Worker
npm run worker

# 运行测试
npm test

# 查看 Redis 中的队列
redis-cli KEYS "bull:*"

# 清空队列
redis-cli FLUSHDB

# 查看队列长度
redis-cli LLEN "bull:email-queue:wait"
```

## 部署配置

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      redis:
        condition: service_healthy
    command: npm run start

  worker:
    build: .
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - WORKER_CONCURRENCY=5
    depends_on:
      redis:
        condition: service_healthy
    command: npm run worker
    deploy:
      replicas: 2 # 运行2个 worker 实例

  dashboard:
    build: .
    ports:
      - "3001:3001"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      redis:
        condition: service_healthy
    command: npm run dashboard

volumes:
  redis_data:
```

### Kubernetes Deployment

```yaml
# k8s-worker-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bullmq-worker
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bullmq-worker
  template:
    metadata:
      labels:
        app: bullmq-worker
    spec:
      containers:
      - name: worker
        image: your-registry/bullmq-worker:latest
        env:
        - name: REDIS_HOST
          value: "redis-service"
        - name: REDIS_PORT
          value: "6379"
        - name: WORKER_CONCURRENCY
          value: "5"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### PM2 配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'api',
      script: 'dist/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        REDIS_HOST: 'localhost',
      },
    },
    {
      name: 'email-worker',
      script: 'dist/workers/email.worker.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'email',
      },
    },
    {
      name: 'video-worker',
      script: 'dist/workers/video.worker.js',
      instances: 1,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'video',
      },
    },
  ],
};
```

## 参考资源

- [BullMQ 官方文档](https://docs.bullmq.io/)
- [BullMQ GitHub](https://github.com/taskforcesh/bullmq)
- [Bull Board](https://github.com/felixmosh/bull-board)
- [Redis 最佳实践](https://redis.io/docs/management/optimization/)
- [任务队列设计模式](https://docs.bullmq.io/guide/patterns)
