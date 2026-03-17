# OpenTelemetry 分布式追踪模板

## 技术栈

- **追踪标准**: OpenTelemetry (OTel)
- **语言支持**: JavaScript, TypeScript, Node.js, Python, Go, Java
- **导出器**: OTLP, Jaeger, Zipkin, Prometheus
- **后端**: Jaeger, Grafana Tempo, AWS X-Ray, Honeycomb
- **集成**: Express, Fastify, NestJS, gRPC, HTTP

## 项目结构

```
project/
├── src/
│   ├── instrumentation/
│   │   ├── index.ts           # 主入口初始化
│   │   ├── tracer.ts          # Tracer 配置
│   │   ├── meter.ts           # Meter 配置
│   │   ├── logger.ts          # Logger 配置
│   │   └── middleware.ts      # Express 中间件
│   ├── traces/
│   │   └── custom-spans.ts    # 自定义 span
│   ├── metrics/
│   │   └── custom-metrics.ts  # 自定义指标
│   └── app.ts
├── otel-collector-config.yaml # Collector 配置
├── docker-compose.yml         # 本地开发环境
└── package.json
```

## 代码模式

### 基础初始化

```typescript
// src/instrumentation/index.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: 'my-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
  }),
  
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
  }),
  
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
    }),
    exportIntervalMillis: 10000,
  }),
  
  logRecordProcessor: new BatchLogRecordProcessor(
    new OTLPLogExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
    })
  ),
  
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // 禁用文件系统追踪
      },
    }),
  ],
});

// 启动 SDK
sdk.start();

// 优雅关闭
process.on('SIGTERM', async () => {
  try {
    await sdk.shutdown();
    console.log('OpenTelemetry SDK shut down');
  } catch (error) {
    console.error('Error shutting down OpenTelemetry SDK', error);
  }
  process.exit(0);
});

export { sdk };
```

### Tracer 配置

```typescript
// src/instrumentation/tracer.ts
import { trace, Tracer, Span, SpanStatusCode, context, Context } from '@opentelemetry/api';

export class TracingService {
  private tracer: Tracer;

  constructor(serviceName: string) {
    this.tracer = trace.getTracer(serviceName, '1.0.0');
  }

  // 创建 span
  startSpan(name: string, options?: { parent?: Span }) {
    return this.tracer.startSpan(name, {
      parent: options?.parent,
    });
  }

  // 活跃 span
  getActiveSpan(): Span | undefined {
    return trace.getActiveSpan();
  }

  // 设置 span 属性
  setSpanAttributes(span: Span, attributes: Record<string, any>) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }

  // 记录错误
  recordError(span: Span, error: Error) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  }

  // 包装异步函数
  async traceAsync<T>(
    name: string,
    fn: () => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T> {
    const span = this.tracer.startSpan(name);
    
    try {
      const result = await context.with(
        trace.setSpan(context.active(), span),
        fn
      );
      
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      this.recordError(span, error as Error);
      throw error;
    } finally {
      if (attributes) {
        this.setSpanAttributes(span, attributes);
      }
      span.end();
    }
  }
}

export const tracingService = new TracingService('my-service');
```

### Express 中间件

```typescript
// src/instrumentation/middleware.ts
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { Request, Response, NextFunction } from 'express';

const tracer = trace.getTracer('express-middleware', '1.0.0');

export function tracingMiddleware(req: Request, res: Response, next: NextFunction) {
  const span = tracer.startSpan(`${req.method} ${req.route?.path || req.path}`, {
    attributes: {
      'http.method': req.method,
      'http.url': req.originalUrl,
      'http.host': req.hostname,
      'http.scheme': req.protocol,
      'http.user_agent': req.get('user-agent'),
    },
  });

  // 添加到请求对象
  (req as any).span = span;

  // 响应完成时结束 span
  res.on('finish', () => {
    span.setAttributes({
      'http.status_code': res.statusCode,
      'http.response_size': res.get('content-length'),
    });

    if (res.statusCode >= 400) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: `HTTP ${res.statusCode}`,
      });
    } else {
      span.setStatus({ code: SpanStatusCode.OK });
    }

    span.end();
  });

  next();
}

// 提取 trace context
export function extractTraceContext(req: Request): Context | undefined {
  const traceparent = req.get('traceparent');
  if (!traceparent) return undefined;

  return traceparent;
}
```

### 自定义 Spans

```typescript
// src/traces/custom-spans.ts
import { trace, SpanStatusCode, Span } from '@opentelemetry/api';

const tracer = trace.getTracer('custom-operations');

// 数据库查询
export async function traceDatabaseQuery<T>(
  query: string,
  fn: () => Promise<T>
): Promise<T> {
  const span = tracer.startSpan('db.query', {
    attributes: {
      'db.system': 'postgresql',
      'db.statement': query,
      'db.operation': 'query',
    },
  });

  try {
    const result = await fn();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message,
    });
    throw error;
  } finally {
    span.end();
  }
}

// HTTP 请求
export async function traceHttpRequest(
  url: string,
  method: string,
  fn: () => Promise<Response>
) {
  const span = tracer.startSpan('http.request', {
    attributes: {
      'http.url': url,
      'http.method': method,
    },
  });

  try {
    const response = await fn();
    span.setAttributes({
      'http.status_code': response.status,
    });
    span.setStatus({ code: SpanStatusCode.OK });
    return response;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message,
    });
    throw error;
  } finally {
    span.end();
  }
}

// 子 span
export function createChildSpan(parent: Span, name: string) {
  const ctx = trace.setSpan(context.active(), parent);
  return tracer.startSpan(name, {}, ctx);
}
```

### Metrics 配置

```typescript
// src/instrumentation/meter.ts
import { metrics, Meter, Counter, Histogram, UpDownCounter } from '@opentelemetry/api';

export class MetricsService {
  private meter: Meter;
  private requestCounter: Counter;
  private requestDuration: Histogram;
  private activeConnections: UpDownCounter;

  constructor(serviceName: string) {
    this.meter = metrics.getMeter(serviceName, '1.0.0');

    // 请求计数器
    this.requestCounter = this.meter.createCounter('requests_total', {
      description: 'Total number of requests',
      unit: '1',
    });

    // 请求延迟直方图
    this.requestDuration = this.meter.createHistogram('request_duration_ms', {
      description: 'Request duration in milliseconds',
      unit: 'ms',
    });

    // 活跃连接数
    this.activeConnections = this.meter.createUpDownCounter('active_connections', {
      description: 'Number of active connections',
      unit: '1',
    });
  }

  // 记录请求
  recordRequest(method: string, path: string, statusCode: number) {
    this.requestCounter.add(1, {
      'http.method': method,
      'http.route': path,
      'http.status_code': statusCode,
    });
  }

  // 记录延迟
  recordLatency(method: string, path: string, duration: number) {
    this.requestDuration.record(duration, {
      'http.method': method,
      'http.route': path,
    });
  }

  // 增加连接
  incrementConnection() {
    this.activeConnections.add(1);
  }

  // 减少连接
  decrementConnection() {
    this.activeConnections.add(-1);
  }
}

export const metricsService = new MetricsService('my-service');
```

### 自定义指标

```typescript
// src/metrics/custom-metrics.ts
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('custom-metrics');

// 业务指标
export const orderCounter = meter.createCounter('orders_total', {
  description: 'Total number of orders',
  unit: '1',
});

export const revenueTotal = meter.createCounter('revenue_total', {
  description: 'Total revenue in dollars',
  unit: 'USD',
});

export const activeUsers = meter.createUpDownCounter('active_users', {
  description: 'Number of active users',
  unit: '1',
});

export const cacheHitRate = meter.createHistogram('cache_hit_rate', {
  description: 'Cache hit rate',
  unit: '%',
});

// 使用示例
export function recordOrder(amount: number, currency: string) {
  orderCounter.add(1, { currency });
  revenueTotal.add(amount, { currency });
}

export function recordCacheHit(hit: boolean) {
  cacheHitRate.record(hit ? 100 : 0);
}
```

### Logs 配置

```typescript
// src/instrumentation/logger.ts
import { logs, Logger, LogRecord } from '@opentelemetry/api-logs';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';

export class LoggingService {
  private logger: Logger;

  constructor(serviceName: string) {
    this.logger = logs.getLogger(serviceName, '1.0.0');
  }

  info(message: string, attributes?: Record<string, any>) {
    this.logger.emit({
      severityNumber: 9,
      severityText: 'INFO',
      body: message,
      attributes,
    });
  }

  error(message: string, error?: Error, attributes?: Record<string, any>) {
    this.logger.emit({
      severityNumber: 17,
      severityText: 'ERROR',
      body: message,
      attributes: {
        ...attributes,
        'error.type': error?.name,
        'error.message': error?.message,
        'error.stack': error?.stack,
      },
    });
  }

  warn(message: string, attributes?: Record<string, any>) {
    this.logger.emit({
      severityNumber: 13,
      severityText: 'WARN',
      body: message,
      attributes,
    });
  }

  debug(message: string, attributes?: Record<string, any>) {
    this.logger.emit({
      severityNumber: 5,
      severityText: 'DEBUG',
      body: message,
      attributes,
    });
  }
}

export const loggingService = new LoggingService('my-service');
```

## 最佳实践

### 1. 采样策略

```typescript
import { Sampler, SamplingDecision } from '@opentelemetry/sdk-trace-base';

class CustomSampler implements Sampler {
  shouldSample(parameters: any): SamplingDecision {
    // 健康检查不采样
    if (parameters.name?.includes('/health')) {
      return SamplingDecision.NOT_RECORD;
    }

    // 错误 100% 采样
    if (parameters.attributes?.['http.status_code'] >= 400) {
      return SamplingDecision.RECORD_AND_SAMPLED;
    }

    // 其他 10% 采样
    return Math.random() < 0.1
      ? SamplingDecision.RECORD_AND_SAMPLED
      : SamplingDecision.NOT_RECORD;
  }

  toString(): string {
    return 'CustomSampler';
  }
}
```

### 2. 上下文传播

```typescript
import { propagation, context } from '@opentelemetry/api';

// 注入上下文到 HTTP 请求头
export function injectTraceContext(headers: Record<string, string>) {
  propagation.inject(context.active(), headers);
  return headers;
}

// 从 HTTP 请求头提取上下文
export function extractTraceContext(headers: Record<string, string>) {
  return propagation.extract(context.active(), headers);
}

// 使用示例
const headers = {};
injectTraceContext(headers);
// headers 包含 traceparent, tracestate

const ctx = extractTraceContext(headers);
```

### 3. Baggage 传递

```typescript
import { propagation } from '@opentelemetry/api';
import { baggageEntryMetadataFromString } from '@opentelemetry/core';

// 设置 baggage
export function setBaggage(key: string, value: string) {
  const baggage = propagation.getActiveBaggage();
  const newBaggage = baggage?.setEntry(key, {
    value,
    metadata: baggageEntryMetadataFromString('metadata'),
  });
  propagation.setActiveBaggage(newBaggage);
}

// 获取 baggage
export function getBaggage(key: string): string | undefined {
  const baggage = propagation.getActiveBaggage();
  return baggage?.getEntry(key)?.value;
}
```

### 4. 错误处理

```typescript
import { SpanStatusCode } from '@opentelemetry/api';

export function recordSpanError(span: Span, error: Error) {
  span.recordException(error);
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message,
  });
  span.setAttributes({
    'error.type': error.name,
    'error.stack': error.stack,
  });
}
```

## 常用命令

### 安装依赖

```bash
# Node.js SDK
npm install @opentelemetry/sdk-node

# 自动插桩
npm install @opentelemetry/auto-instrumentations-node

# OTLP 导出器
npm install @opentelemetry/exporter-trace-otlp-grpc
npm install @opentelemetry/exporter-metrics-otlp-grpc

# 常用框架插桩
npm install @opentelemetry/instrumentation-express
npm install @opentelemetry/instrumentation-http
npm install @opentelemetry/instrumentation-pg
```

### 环境变量

```bash
# 配置
export OTEL_SERVICE_NAME=my-service
export OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production

# 导出器
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc

# 采样
export OTEL_TRACES_SAMPLER=traceidratio
export OTEL_TRACES_SAMPLER_ARG=0.1

# 指标
export OTEL_METRIC_EXPORT_INTERVAL=10000
```

### Jaeger 本地开发

```bash
# 使用 Docker 启动 Jaeger
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest

# 访问 UI
open http://localhost:16686
```

## 部署配置

### OTLP Collector

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
  memory_limiter:
    limit_mib: 512

exporters:
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true
  prometheus:
    endpoint: 0.0.0.0:9090
  logging:
    loglevel: debug

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [jaeger]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus]
    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=otel-collector:4317
      - OTEL_SERVICE_NAME=my-service
    depends_on:
      - otel-collector

  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"
      - "4318:4318"
    depends_on:
      - jaeger

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
      - "14250:14250"

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
```

### Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  template:
    spec:
      containers:
      - name: app
        image: app:latest
        env:
        - name: OTEL_EXPORTER_OTLP_ENDPOINT
          value: "otel-collector:4317"
        - name: OTEL_SERVICE_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: OTEL_RESOURCE_ATTRIBUTES
          value: "k8s.namespace=$(KUBERNETES_NAMESPACE),k8s.pod=$(KUBERNETES_POD_NAME)"
```

## 监控面板

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "OpenTelemetry Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(requests_total[5m])"
        }]
      },
      {
        "title": "P95 Latency",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(request_duration_ms_bucket[5m]))"
        }]
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(requests_total{http.status_code=~\"5..\"}[5m])"
        }]
      }
    ]
  }
}
```

## 性能影响

1. **采样率**: 生产环境 10%，降低数据量
2. **批量导出**: 减少网络开销
3. **异步处理**: 不阻塞主流程
4. **内存限制**: 防止 OOM
5. **过滤无用 span**: 健康检查、静态资源

## 参考资料

- [OpenTelemetry 官方文档](https://opentelemetry.io/docs/)
- [OTLP 规范](https://opentelemetry.io/docs/specs/otlp/)
- [语义约定](https://opentelemetry.io/docs/specs/semconv/)
- [Jaeger 文档](https://www.jaegertracing.io/docs/)
