# Qdrant 向量数据库开发模板

## 技术栈

- **核心**: Qdrant (向量数据库)
- **客户端**: @qdrant/js-client-rest
- **Embeddings**: OpenAI / Cohere / 自定义模型
- **框架**: Next.js / Express / Fastify
- **语言**: TypeScript 5.x

## 项目结构

```
qdrant-project/
├── src/
│   ├── lib/
│   │   ├── qdrant.ts          # Qdrant 客户端
│   │   └── embeddings.ts      # Embedding 服务
│   ├── services/
│   │   ├── collection.ts      # 集合管理
│   │   ├── vectors.ts         # 向量操作
│   │   └── search.ts          # 搜索服务
│   ├── routes/
│   │   ├── collections.ts
│   │   ├── vectors.ts
│   │   └── search.ts
│   └── index.ts
├── scripts/
│   ├── seed.ts                # 初始化数据
│   └── migrate.ts             # 迁移脚本
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## 代码模式

### 客户端配置

```typescript
// src/lib/qdrant.ts
import { QdrantClient } from '@qdrant/js-client-rest';

// 标准 HTTP 客户端
export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
});

// 云端 Qdrant
export const qdrantCloud = new QdrantClient({
  url: process.env.QDRANT_CLOUD_URL,
  apiKey: process.env.QDRANT_CLOUD_API_KEY,
});

// 本地开发
export const qdrantLocal = new QdrantClient({
  host: 'localhost',
  port: 6333,
});

// gRPC 客户端（更高性能）
export const qdrantGrpc = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
  grpc: true,
});
```

### 集合管理

```typescript
// src/services/collection.ts
import { qdrant } from '../lib/qdrant';
import { Distance, VectorParams } from '@qdrant/js-client-rest';

export class CollectionService {
  // 创建集合
  async create(name: string, vectorSize: number = 1536) {
    await qdrant.createCollection(name, {
      vectors: {
        size: vectorSize,
        distance: Distance.Cosine,
      },
      // 可选：量化配置（减少内存占用）
      quantization_config: {
        scalar: {
          type: 'int8',
          quantile: 0.99,
          always_ram: true,
        },
      },
      // 可选：HNSW 配置
      hnsw_config: {
        m: 16,
        ef_construct: 100,
      },
    });
  }

  // 创建带多个向量的集合
  async createMultiVector(name: string) {
    await qdrant.createCollection(name, {
      vectors: {
        text: { size: 1536, distance: Distance.Cosine },
        image: { size: 512, distance: Distance.Cosine },
      },
    });
  }

  // 获取集合信息
  async getInfo(name: string) {
    return qdrant.getCollection(name);
  }

  // 列出所有集合
  async list() {
    const { collections } = await qdrant.getCollections();
    return collections;
  }

  // 删除集合
  async delete(name: string) {
    await qdrant.deleteCollection(name);
  }

  // 更新集合参数
  async update(name: string, params: Partial<VectorParams>) {
    await qdrant.updateCollection(name, {
      vectors: params,
      hnsw_config: {
        ef_construct: 200,
      },
    });
  }

  // 创建索引
  async createPayloadIndex(
    collectionName: string,
    fieldName: string,
    fieldSchema: 'keyword' | 'integer' | 'float' | 'bool' | 'geo' | 'text' | 'datetime'
  ) {
    await qdrant.createPayloadIndex(collectionName, {
      field_name: fieldName,
      field_schema: fieldSchema,
    });
  }
}
```

### 向量操作

```typescript
// src/services/vectors.ts
import { qdrant } from '../lib/qdrant';
import { PointStruct, Filter, FieldCondition } from '@qdrant/js-client-rest';

interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

export class VectorService {
  private collection: string;

  constructor(collection: string) {
    this.collection = collection;
  }

  // 插入单个向量
  async upsert(id: string, vector: number[], payload: Record<string, any>) {
    await qdrant.upsert(this.collection, {
      wait: true,
      points: [
        {
          id,
          vector,
          payload,
        },
      ],
    });
  }

  // 批量插入
  async upsertBatch(points: PointStruct[]) {
    // 分批处理（每批最多 100 个）
    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      await qdrant.upsert(this.collection, {
        wait: true,
        points: batch,
      });
    }
  }

  // 使用 UUID 作为 ID
  async upsertWithUUID(vector: number[], payload: Record<string, any>) {
    const id = crypto.randomUUID();
    await this.upsert(id, vector, payload);
    return id;
  }

  // 删除向量
  async delete(ids: string[]) {
    await qdrant.delete(this.collection, {
      wait: true,
      points: ids,
    });
  }

  // 根据条件删除
  async deleteByFilter(filter: Filter) {
    await qdrant.delete(this.collection, {
      wait: true,
      filter,
    });
  }

  // 获取向量
  async get(id: string) {
    const result = await qdrant.retrieve(this.collection, {
      ids: [id],
      with_vector: true,
      with_payload: true,
    });
    return result[0];
  }

  // 批量获取
  async getBatch(ids: string[]) {
    return qdrant.retrieve(this.collection, {
      ids,
      with_vector: true,
      with_payload: true,
    });
  }

  // 更新 payload
  async updatePayload(id: string, payload: Record<string, any>) {
    await qdrant.setPayload(this.collection, {
      wait: true,
      payload,
      points: [id],
    });
  }

  // 删除 payload 字段
  async deletePayloadFields(id: string, fields: string[]) {
    await qdrant.deletePayload(this.collection, {
      wait: true,
      keys: fields,
      points: [id],
    });
  }

  // 统计数量
  async count(filter?: Filter) {
    const result = await qdrant.count(this.collection, {
      filter,
      exact: true,
    });
    return result.count;
  }

  // 滚动遍历所有点
  async scroll(offset?: string, limit: number = 100) {
    return qdrant.scroll(this.collection, {
      offset,
      limit,
      with_vector: true,
      with_payload: true,
    });
  }
}
```

### 语义搜索

```typescript
// src/services/search.ts
import { qdrant } from '../lib/qdrant';
import { Filter, FieldCondition, RangeCondition, MatchValue } from '@qdrant/js-client-rest';

export class SearchService {
  private collection: string;

  constructor(collection: string) {
    this.collection = collection;
  }

  // 基础向量搜索
  async search(
    vector: number[],
    options: {
      limit?: number;
      scoreThreshold?: number;
      withPayload?: boolean;
      withVector?: boolean;
    } = {}
  ) {
    const { limit = 10, scoreThreshold, withPayload = true, withVector = false } = options;

    return qdrant.search(this.collection, {
      vector,
      limit,
      score_threshold: scoreThreshold,
      with_payload: withPayload,
      with_vector: withVector,
    });
  }

  // 带过滤条件的搜索
  async searchWithFilter(
    vector: number[],
    filter: Filter,
    options: { limit?: number } = {}
  ) {
    return qdrant.search(this.collection, {
      vector,
      filter,
      limit: options.limit || 10,
      with_payload: true,
    });
  }

  // 混合搜索（向量 + 关键词）
  async hybridSearch(
    vector: number[],
    text: string,
    options: {
      limit?: number;
      fusionMethod?: 'rrf' | 'dbsf';
    } = {}
  ) {
    // 向量搜索结果
    const vectorResults = await this.search(vector, { limit: options.limit || 10 });

    // 全文搜索结果（需要 text 索引）
    const textResults = await qdrant.scroll(this.collection, {
      with_payload: true,
      limit: options.limit || 10,
    });

    // 融合排序
    return this.fuseResults(vectorResults, textResults.points, options.fusionMethod || 'rrf');
  }

  private fuseResults(vectorResults: any[], textResults: any[], method: string) {
    // Reciprocal Rank Fusion
    if (method === 'rrf') {
      const scores = new Map<string, number>();
      const k = 60;

      vectorResults.forEach((r, i) => {
        const id = r.id as string;
        scores.set(id, (scores.get(id) || 0) + 1 / (k + i + 1));
      });

      textResults.forEach((r, i) => {
        const id = r.id as string;
        scores.set(id, (scores.get(id) || 0) + 1 / (k + i + 1));
      });

      return [...scores.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id, score]) => ({ id, score }));
    }

    // 其他融合方法...
    return vectorResults;
  }

  // 推荐搜索（基于已有的点）
  async recommend(
    positiveIds: string[],
    negativeIds: string[] = [],
    options: {
      limit?: number;
      scoreThreshold?: number;
    } = {}
  ) {
    return qdrant.recommend(this.collection, {
      positive: positiveIds,
      negative: negativeIds,
      limit: options.limit || 10,
      score_threshold: options.scoreThreshold,
      with_payload: true,
    });
  }

  // 发现搜索（使用示例对）
  async discover(
    pairs: { positive: string; negative: string }[],
    target: string,
    options: { limit?: number } = {}
  ) {
    return qdrant.discover(this.collection, {
      target,
      context: pairs.map((p) => ({
        positive: p.positive,
        negative: p.negative,
      })),
      limit: options.limit || 10,
      with_payload: true,
    });
  }

  // 分组搜索
  async searchGroups(
    vector: number[],
    groupBy: string,
    options: {
      limit?: number;
      groupSize?: number;
    } = {}
  ) {
    return qdrant.searchGroups(this.collection, {
      vector,
      group_by: groupBy,
      limit: options.limit || 10,
      group_size: options.groupSize || 3,
      with_payload: true,
    });
  }

  // 多向量搜索
  async searchMultipleVectors(
    vectors: { name: string; vector: number[] }[],
    options: { limit?: number } = {}
  ) {
    return qdrant.search(this.collection, {
      vector: vectors.reduce((acc, { name, vector }) => {
        acc[name] = vector;
        return acc;
      }, {} as Record<string, number[]>),
      limit: options.limit || 10,
      with_payload: true,
    });
  }
}

// 过滤条件构建器
export class FilterBuilder {
  private conditions: any[] = [];

  must(condition: FieldCondition) {
    this.conditions.push({ must: condition });
    return this;
  }

  mustNot(condition: FieldCondition) {
    this.conditions.push({ must_not: condition });
    return this;
  }

  should(condition: FieldCondition) {
    this.conditions.push({ should: condition });
    return this;
  }

  build(): Filter {
    return {
      must: this.conditions.filter((c) => c.must).map((c) => c.must),
      must_not: this.conditions.filter((c) => c.must_not).map((c) => c.must_not),
      should: this.conditions.filter((c) => c.should).map((c) => c.should),
    };
  }
}

// 使用示例
const filter = new FilterBuilder()
  .must({
    key: 'category',
    match: { value: 'technology' },
  })
  .must({
    key: 'price',
    range: { lte: 100 },
  })
  .should({
    key: 'featured',
    match: { value: true },
  })
  .build();
```

### Embedding 服务

```typescript
// src/lib/embeddings.ts
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class EmbeddingService {
  private model: string;

  constructor(model: string = 'text-embedding-3-small') {
    this.model = model;
  }

  // 单文本嵌入
  async embed(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: this.model,
      input: text,
    });
    return response.data[0].embedding;
  }

  // 批量嵌入
  async embedBatch(texts: string[]): Promise<number[][]> {
    // 分批处理（每批最多 2048 个）
    const batchSize = 100;
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await openai.embeddings.create({
        model: this.model,
        input: batch,
      });
      embeddings.push(...response.data.map((d) => d.embedding));
    }

    return embeddings;
  }

  // 文档嵌入（带分块）
  async embedDocument(
    content: string,
    options: {
      chunkSize?: number;
      overlap?: number;
    } = {}
  ): Promise<{ embedding: number[]; chunk: string; index: number }[]> {
    const { chunkSize = 1000, overlap = 200 } = options;
    const chunks = this.splitText(content, chunkSize, overlap);
    
    const embeddings = await this.embedBatch(chunks);
    
    return chunks.map((chunk, index) => ({
      embedding: embeddings[index],
      chunk,
      index,
    }));
  }

  private splitText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start += chunkSize - overlap;
    }

    return chunks;
  }
}
```

## 最佳实践

### 1. 批量操作

```typescript
// 高效批量插入
async function bulkInsert(documents: Document[], embeddingService: EmbeddingService) {
  const points: PointStruct[] = [];

  // 并行生成嵌入
  const embeddings = await embeddingService.embedBatch(
    documents.map((d) => d.content)
  );

  // 构建点
  documents.forEach((doc, i) => {
    points.push({
      id: doc.id,
      vector: embeddings[i],
      payload: doc.metadata,
    });
  });

  // 批量插入
  const vectorService = new VectorService('documents');
  await vectorService.upsertBatch(points);
}
```

### 2. 增量更新

```typescript
// 智能增量更新
async function incrementalUpdate(
  collection: string,
  documents: Document[],
  embeddingService: EmbeddingService
) {
  const vectorService = new VectorService(collection);

  for (const doc of documents) {
    // 检查是否已存在
    const existing = await vectorService.get(doc.id);

    if (!existing) {
      // 新文档：插入
      const embedding = await embeddingService.embed(doc.content);
      await vectorService.upsert(doc.id, embedding, doc.metadata);
    } else if (doc.metadata.updatedAt > existing.payload?.updatedAt) {
      // 已更新：重新嵌入并更新
      const embedding = await embeddingService.embed(doc.content);
      await vectorService.upsert(doc.id, embedding, doc.metadata);
    }
    // 未变化：跳过
  }
}
```

### 3. 连接池管理

```typescript
// 连接池
import { QdrantClient } from '@qdrant/js-client-rest';

class QdrantPool {
  private clients: QdrantClient[] = [];
  private currentIndex = 0;

  constructor(size: number = 5) {
    for (let i = 0; i < size; i++) {
      this.clients.push(
        new QdrantClient({
          url: process.env.QDRANT_URL,
          apiKey: process.env.QDRANT_API_KEY,
        })
      );
    }
  }

  getClient(): QdrantClient {
    const client = this.clients[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.clients.length;
    return client;
  }
}

export const qdrantPool = new QdrantPool(5);
```

## 常用命令

```bash
# 安装
npm install @qdrant/js-client-rest

# Docker 启动
docker run -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant

# Docker Compose
docker-compose up -d

# 健康检查
curl http://localhost:6333/health

# 查看集合
curl http://localhost:6333/collections

# 查看控制台
open http://localhost:6333/dashboard
```

## 部署配置

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - ./qdrant_storage:/qdrant/storage
    environment:
      - QDRANT_API_KEY=${QDRANT_API_KEY}
    restart: unless-stopped

  # 可选：用于监控
  qdrant-dashboard:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
```

### 环境变量

```bash
# .env
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-api-key
QDRANT_CLOUD_URL=https://xxx-xxx.aws.cloud.qdrant.io
QDRANT_CLOUD_API_KEY=your-cloud-api-key

# OpenAI
OPENAI_API_KEY=sk-xxx
```

### 生产配置

```yaml
# 生产环境 docker-compose
services:
  qdrant:
    image: qdrant/qdrant:v1.7.4
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      - QDRANT_API_KEY=${QDRANT_API_KEY}
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  qdrant_data:
```

## 扩展资源

- [Qdrant 官方文档](https://qdrant.tech/documentation/)
- [Qdrant GitHub](https://github.com/qdrant/qdrant)
- [JavaScript 客户端](https://github.com/qdrant/qdrant-js)
- [API 参考](https://qdrant.github.io/qdrant/redoc/index.html)
- [最佳实践](https://qdrant.tech/articles/vector-search-practice/)
