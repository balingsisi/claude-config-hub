# Pinecone 向量数据库开发模板

## 技术栈

- **核心**: Pinecone Vector Database
- **客户端**: @pinecone-database/pinecone
- **嵌入模型**: OpenAI Embeddings / Cohere Embeddings
- **框架**: Next.js / Node.js
- **类型**: TypeScript

## 项目结构

```
pinecone-project/
├── app/
│   ├── api/
│   │   ├── embeddings/
│   │   │   └── route.ts        # 生成嵌入向量
│   │   ├── search/
│   │   │   └── route.ts        # 向量搜索
│   │   └── upsert/
│   │       └── route.ts        # 插入向量
│   └── page.tsx
├── lib/
│   ├── pinecone/
│   │   ├── client.ts           # Pinecone 客户端
│   │   ├── index.ts            # 索引管理
│   │   └── operations.ts       # CRUD 操作
│   ├── embeddings/
│   │   ├── openai.ts           # OpenAI 嵌入
│   │   └── cohere.ts           # Cohere 嵌入
│   └── utils.ts
├── scripts/
│   ├── seed.ts                 # 批量导入数据
│   └── migrate.ts              # 数据迁移
├── package.json
└── tsconfig.json
```

## 代码模式

### Pinecone 客户端配置

```typescript
// lib/pinecone/client.ts
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export default pinecone;

// lib/pinecone/index.ts
import pinecone from './client';

export async function getOrCreateIndex(indexName: string, dimension: number = 1536) {
  const existingIndexes = await pinecone.listIndexes();
  const indexNames = existingIndexes.indexes?.map(i => i.name) || [];

  if (!indexNames.includes(indexName)) {
    await pinecone.createIndex({
      name: indexName,
      dimension,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
    });

    // 等待索引初始化
    await new Promise(resolve => setTimeout(resolve, 60000));
  }

  return pinecone.index(indexName);
}

export async function deleteIndex(indexName: string) {
  await pinecone.deleteIndex(indexName);
}

export async function describeIndex(indexName: string) {
  return await pinecone.describeIndex(indexName);
}
```

### 嵌入向量生成

```typescript
// lib/embeddings/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });

  return response.data.map(item => item.embedding);
}

// lib/embeddings/cohere.ts
import Cohere from 'cohere-ai';

const cohere = new Cohere.Client(process.env.COHERE_API_KEY!);

export async function generateCohereEmbedding(texts: string[]): Promise<number[][]> {
  const response = await cohere.embed({
    texts,
    model: 'embed-english-v3.0',
    input_type: 'search_document',
  });

  return response.body.embeddings;
}
```

### 向量操作

```typescript
// lib/pinecone/operations.ts
import { getOrCreateIndex } from './index';
import { generateEmbedding } from '../embeddings/openai';
import { RecordMetadata } from '@pinecone-database/pinecone';

interface VectorMetadata extends RecordMetadata {
  text: string;
  source: string;
  timestamp: number;
  [key: string]: string | number | boolean | string[] | null;
}

// 插入单个向量
export async function upsertVector(
  id: string,
  text: string,
  metadata: Omit<VectorMetadata, 'text' | 'timestamp'>,
  indexName: string = 'default'
) {
  const index = await getOrCreateIndex(indexName);
  const embedding = await generateEmbedding(text);

  await index.upsert([
    {
      id,
      values: embedding,
      metadata: {
        ...metadata,
        text,
        timestamp: Date.now(),
      },
    },
  ]);
}

// 批量插入向量
export async function upsertVectors(
  items: Array<{
    id: string;
    text: string;
    metadata: Omit<VectorMetadata, 'text' | 'timestamp'>;
  }>,
  indexName: string = 'default',
  batchSize: number = 100
) {
  const index = await getOrCreateIndex(indexName);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const texts = batch.map(item => item.text);
    const embeddings = await generateEmbeddings(texts);

    const vectors = batch.map((item, idx) => ({
      id: item.id,
      values: embeddings[idx],
      metadata: {
        ...item.metadata,
        text: item.text,
        timestamp: Date.now(),
      },
    }));

    await index.upsert(vectors);
  }
}

// 向量搜索
export async function queryVectors(
  query: string,
  topK: number = 10,
  filter?: Record<string, any>,
  indexName: string = 'default'
) {
  const index = await getOrCreateIndex(indexName);
  const queryEmbedding = await generateEmbedding(query);

  const results = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    filter,
  });

  return results.matches;
}

// 获取向量
export async function fetchVector(id: string, indexName: string = 'default') {
  const index = await getOrCreateIndex(indexName);
  const results = await index.fetch([id]);
  return results.records[id];
}

// 删除向量
export async function deleteVector(id: string, indexName: string = 'default') {
  const index = await getOrCreateIndex(indexName);
  await index.deleteOne(id);
}

// 批量删除
export async function deleteVectors(ids: string[], indexName: string = 'default') {
  const index = await getOrCreateIndex(indexName);
  await index.deleteMany(ids);
}

// 按条件删除
export async function deleteByFilter(
  filter: Record<string, any>,
  indexName: string = 'default'
) {
  const index = await getOrCreateIndex(indexName);
  await index.deleteMany(filter);
}

// 更新向量元数据
export async function updateVectorMetadata(
  id: string,
  metadata: Partial<VectorMetadata>,
  indexName: string = 'default'
) {
  const index = await getOrCreateIndex(indexName);
  await index.update({
    id,
    metadata,
  });
}
```

### API 路由

```typescript
// app/api/upsert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { upsertVector, upsertVectors } from '@/lib/pinecone/operations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 单个插入
    if (body.id && body.text) {
      await upsertVector(body.id, body.text, body.metadata || {}, body.indexName);
      return NextResponse.json({ success: true, id: body.id });
    }

    // 批量插入
    if (body.items && Array.isArray(body.items)) {
      await upsertVectors(body.items, body.indexName);
      return NextResponse.json({ 
        success: true, 
        count: body.items.length 
      });
    }

    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Upsert error:', error);
    return NextResponse.json(
      { error: 'Failed to upsert vectors' },
      { status: 500 }
    );
  }
}

// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryVectors } from '@/lib/pinecone/operations';

export async function POST(req: NextRequest) {
  try {
    const { query, topK = 10, filter, indexName } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const results = await queryVectors(query, topK, filter, indexName);

    return NextResponse.json({
      results: results.map(match => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata,
      })),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search vectors' },
      { status: 500 }
    );
  }
}

// app/api/embeddings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding, generateEmbeddings } from '@/lib/embeddings/openai';

export async function POST(req: NextRequest) {
  try {
    const { text, texts } = await req.json();

    if (texts && Array.isArray(texts)) {
      const embeddings = await generateEmbeddings(texts);
      return NextResponse.json({ embeddings });
    }

    if (text) {
      const embedding = await generateEmbedding(text);
      return NextResponse.json({ embedding });
    }

    return NextResponse.json(
      { error: 'Text or texts is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Embedding error:', error);
    return NextResponse.json(
      { error: 'Failed to generate embeddings' },
      { status: 500 }
    );
  }
}
```

### 数据导入脚本

```typescript
// scripts/seed.ts
import { upsertVectors } from '../lib/pinecone/operations';
import fs from 'fs';
import path from 'path';

interface Document {
  id: string;
  text: string;
  source: string;
  category?: string;
}

async function loadDocuments(dataPath: string): Promise<Document[]> {
  const files = fs.readdirSync(dataPath);
  const documents: Document[] = [];

  for (const file of files) {
    const filePath = path.join(dataPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // 简单的分块策略
    const chunks = splitIntoChunks(content, 500);

    chunks.forEach((chunk, idx) => {
      documents.push({
        id: `${file}-${idx}`,
        text: chunk,
        source: file,
        category: path.extname(file).slice(1),
      });
    });
  }

  return documents;
}

function splitIntoChunks(text: string, maxTokens: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  for (const word of words) {
    currentChunk.push(word);
    if (currentChunk.length >= maxTokens) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

async function main() {
  const dataPath = process.argv[2] || './data';
  const indexName = process.argv[3] || 'documents';

  console.log(`Loading documents from ${dataPath}...`);
  const documents = await loadDocuments(dataPath);
  console.log(`Found ${documents.length} document chunks`);

  console.log(`Upserting to Pinecone index: ${indexName}...`);
  await upsertVectors(
    documents.map(doc => ({
      id: doc.id,
      text: doc.text,
      metadata: {
        source: doc.source,
        category: doc.category || 'unknown',
      },
    })),
    indexName
  );

  console.log('Done!');
}

main().catch(console.error);
```

## 最佳实践

### 1. 命名空间管理

```typescript
// lib/pinecone/namespaces.ts
import { getOrCreateIndex } from './index';

export async function queryNamespace(
  query: string,
  namespace: string,
  topK: number = 10
) {
  const index = await getOrCreateIndex('default');
  const indexWithNamespace = index.namespace(namespace);
  
  const queryEmbedding = await generateEmbedding(query);
  
  return indexWithNamespace.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });
}

export async function upsertToNamespace(
  vectors: Array<{ id: string; values: number[]; metadata: any }>,
  namespace: string
) {
  const index = await getOrCreateIndex('default');
  const indexWithNamespace = index.namespace(namespace);
  
  await indexWithNamespace.upsert(vectors);
}
```

### 2. 元数据过滤

```typescript
// 使用元数据过滤
const results = await queryVectors(query, 10, {
  category: { $eq: 'documentation' },
  timestamp: { $gte: Date.now() - 7 * 24 * 60 * 60 * 1000 }, // 最近7天
});

// 复杂过滤
const complexFilter = {
  $and: [
    { category: { $in: ['docs', 'tutorials'] } },
    { language: { $eq: 'typescript' } },
  ],
};
```

### 3. 批处理优化

```typescript
// lib/pinecone/batch.ts
import { upsertVectors } from './operations';

export async function batchUpsertFromFile(
  filePath: string,
  indexName: string,
  batchSize: number = 100
) {
  const stream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  let batch: any[] = [];

  for await (const line of rl) {
    const item = JSON.parse(line);
    batch.push(item);

    if (batch.length >= batchSize) {
      await upsertVectors(batch, indexName, batchSize);
      batch = [];
    }
  }

  // 处理剩余的批次
  if (batch.length > 0) {
    await upsertVectors(batch, indexName, batchSize);
  }
}
```

### 4. 错误处理和重试

```typescript
// lib/pinecone/retry.ts
import { upsertVectors } from './operations';

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${i + 1} failed:`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, backoffMs * Math.pow(2, i))
        );
      }
    }
  }

  throw lastError!;
}

// 使用
export async function safeUpsert(items: any[], indexName: string) {
  return retryWithBackoff(() => upsertVectors(items, indexName));
}
```

## 常用命令

```bash
# 安装依赖
npm install @pinecone-database/pinecone

# 可选：嵌入模型
npm install openai cohere-ai

# 运行导入脚本
ts-node scripts/seed.ts ./data documents

# 创建索引（通过代码）
ts-node -e "import('./lib/pinecone/index').then(m => m.getOrCreateIndex('my-index', 1536))"

# 删除索引（通过代码）
ts-node -e "import('./lib/pinecone/index').then(m => m.deleteIndex('my-index'))"
```

## 部署配置

### 环境变量

```bash
# .env.local
PINECONE_API_KEY=xxx-xxx-xxx-xxx
PINECONE_ENVIRONMENT=us-east-1-aws

# 嵌入模型
OPENAI_API_KEY=sk-xxx
COHERE_API_KEY=xxx
```

### Next.js 配置

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@pinecone-database/pinecone'],
  },
};

module.exports = nextConfig;
```

### 监控和日志

```typescript
// lib/pinecone/monitoring.ts
export async function getIndexStats(indexName: string) {
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pinecone.index(indexName);
  
  const stats = await index.describeIndexStats();
  
  return {
    dimension: stats.dimension,
    indexFullness: stats.indexFullness,
    totalRecordCount: stats.totalRecordCount,
    namespaces: stats.namespaces,
  };
}
```

## 扩展资源

- [Pinecone 官方文档](https://docs.pinecone.io/)
- [Pinecone JavaScript SDK](https://github.com/pinecone-io/pinecone-ts-client)
- [向量数据库最佳实践](https://docs.pinecone.io/docs/best-practices)
- [元数据过滤指南](https://docs.pinecone.io/docs/metadata-filtering)
- [命名空间使用](https://docs.pinecone.io/docs/namespaces)
