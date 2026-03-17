# Weaviate 向量数据库开发模板

## 技术栈

- **核心**: Weaviate Vector Database
- **客户端**: weaviate-ts-client
- **嵌入模型**: OpenAI / Cohere / Local
- **框架**: Next.js / Node.js
- **GraphQL**: Weaviate GraphQL API

## 项目结构

```
weaviate-project/
├── app/
│   ├── api/
│   │   ├── search/
│   │   │   └── route.ts        # 向量搜索
│   │   ├── objects/
│   │   │   └── route.ts        # 对象管理
│   │   └── schema/
│   │       └── route.ts        # Schema 管理
│   └── page.tsx
├── lib/
│   weaviate/
│   │   ├── client.ts           # Weaviate 客户端
│   │   ├── schema.ts           # Schema 定义
│   │   ├── operations.ts       # CRUD 操作
│   │   └── graphql.ts          # GraphQL 查询
│   ├── embeddings/
│   │   ├── openai.ts           # OpenAI 嵌入
│   │   └── local.ts            # 本地嵌入模型
│   └── utils.ts
├── scripts/
│   ├── setup-schema.ts         # 初始化 Schema
│   └── import-data.ts          # 导入数据
├── docker-compose.yml          # 本地 Weaviate
├── package.json
└── tsconfig.json
```

## 代码模式

### Weaviate 客户端配置

```typescript
// lib/weaviate/client.ts
import weaviate from 'weaviate-ts-client';

// 连接到 Weaviate Cloud
export const client = weaviate.client({
  scheme: 'https',
  host: process.env.WEAVIATE_HOST!,
  apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
  headers: {
    'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY!,
  },
});

// 连接到本地 Weaviate
export const localClient = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080',
});

// 带嵌入模块的客户端
export const clientWithModules = weaviate.client({
  scheme: 'https',
  host: process.env.WEAVIATE_HOST!,
  apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
  headers: {
    'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY!,
    'X-Cohere-Api-Key': process.env.COHERE_API_KEY!,
  },
});
```

### Schema 定义

```typescript
// lib/weaviate/schema.ts
import { client } from './client';

// 文档类定义
export const documentClass = {
  class: 'Document',
  description: 'A text document with metadata',
  vectorizer: 'text2vec-openai',
  moduleConfig: {
    'text2vec-openai': {
      model: 'ada',
      modelVersion: '002',
      type: 'text',
    },
  },
  properties: [
    {
      name: 'title',
      dataType: ['text'],
      description: 'Title of the document',
    },
    {
      name: 'content',
      dataType: ['text'],
      description: 'Main content of the document',
      moduleConfig: {
        'text2vec-openai': {
          skip: false,
          vectorizePropertyName: false,
        },
      },
    },
    {
      name: 'category',
      dataType: ['text'],
      description: 'Category of the document',
    },
    {
      name: 'tags',
      dataType: ['text[]'],
      description: 'Tags associated with the document',
    },
    {
      name: 'url',
      dataType: ['text'],
      description: 'Source URL of the document',
    },
    {
      name: 'publishedAt',
      dataType: ['date'],
      description: 'Publication date',
    },
  ],
};

// 创建 Schema
export async function createSchema() {
  try {
    // 检查类是否已存在
    const schema = await client.schema.getter().do();
    const classNames = schema.classes?.map(c => c.class) || [];

    if (!classNames.includes('Document')) {
      await client.schema
        .classCreator()
        .withClass(documentClass)
        .do();
      console.log('Schema created successfully');
    } else {
      console.log('Schema already exists');
    }
  } catch (error) {
    console.error('Error creating schema:', error);
    throw error;
  }
}

// 删除 Schema
export async function deleteSchema(className: string = 'Document') {
  await client.schema
    .classDeleter()
    .withClassName(className)
    .do();
  console.log(`Schema ${className} deleted`);
}

// 获取 Schema 信息
export async function getSchema() {
  return await client.schema.getter().do();
}
```

### 对象操作

```typescript
// lib/weaviate/operations.ts
import { client } from './client';

// 创建对象
export async function createObject(
  className: string,
  properties: Record<string, any>,
  vector?: number[]
) {
  const obj = client.data
    .creator()
    .withClassName(className)
    .withProperties(properties);

  if (vector) {
    obj.withVector(vector);
  }

  const result = await obj.do();
  return result;
}

// 批量创建对象
export async function batchCreateObjects(
  className: string,
  items: Array<{ properties: Record<string, any>; vector?: number[] }>,
  batchSize: number = 100
) {
  const batcher = client.batch.objectsBatcher();

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    batch.forEach(item => {
      const obj = client.data
        .creator()
        .withClassName(className)
        .withProperties(item.properties);
      
      if (item.vector) {
        obj.withVector(item.vector);
      }
      
      batcher.withObject(obj);
    });

    await batcher.do();
    console.log(`Batch ${Math.floor(i / batchSize) + 1} completed`);
  }
}

// 获取对象
export async function getObject(
  className: string,
  id: string,
  additional?: string[]
) {
  let query = client.data
    .getterById()
    .withClassName(className)
    .withId(id);

  if (additional && additional.length > 0) {
    query = query.withAdditional(additional);
  }

  return await query.do();
}

// 更新对象
export async function updateObject(
  className: string,
  id: string,
  properties: Record<string, any>
) {
  await client.data
    .updater()
    .withClassName(className)
    .withId(id)
    .withProperties(properties)
    .do();
}

// 删除对象
export async function deleteObject(className: string, id: string) {
  await client.data
    .deleter()
    .withClassName(className)
    .withId(id)
    .do();
}

// 批量删除
export async function deleteObjects(
  className: string,
  where: { path: string[]; operator: string; valueText?: string; valueNumber?: number }
) {
  await client.batch
    .objectsBatchDeleter()
    .withClassName(className)
    .withWhere(where)
    .do();
}

// 获取对象数量
export async function getObjectCount(className: string) {
  const result = await client.graphql
    .aggregate()
    .withClassName(className)
    .withFields('meta { count }')
    .do();

  return result.data.Aggregate[className][0].meta.count;
}
```

### 向量搜索

```typescript
// lib/weaviate/graphql.ts
import { client } from './client';

// 基础向量搜索
export async function vectorSearch(
  className: string,
  query: string,
  limit: number = 10,
  fields: string[] = ['title', 'content', 'category']
) {
  const result = await client.graphql
    .get()
    .withClassName(className)
    .withFields(`${fields.join(' ')} _additional { id certainty }`)
    .withNearText({ concepts: [query] })
    .withLimit(limit)
    .do();

  return result.data.Get[className];
}

// 带过滤的搜索
export async function searchWithFilter(
  className: string,
  query: string,
  where: any,
  limit: number = 10
) {
  const result = await client.graphql
    .get()
    .withClassName(className)
    .withFields('title content category _additional { id certainty }')
    .withNearText({ concepts: [query] })
    .withWhere(where)
    .withLimit(limit)
    .do();

  return result.data.Get[className];
}

// 混合搜索（向量 + 关键词）
export async function hybridSearch(
  className: string,
  query: string,
  alpha: number = 0.5,
  limit: number = 10
) {
  const result = await client.graphql
    .get()
    .withClassName(className)
    .withFields('title content category _additional { id score }')
    .withHybrid({ query, alpha })
    .withLimit(limit)
    .do();

  return result.data.Get[className];
}

// 语义搜索（使用向量）
export async function semanticSearch(
  className: string,
  vector: number[],
  limit: number = 10
) {
  const result = await client.graphql
    .get()
    .withClassName(className)
    .withFields('title content _additional { id certainty }')
    .withNearVector({ vector })
    .withLimit(limit)
    .do();

  return result.data.Get[className];
}

// 聚合查询
export async function aggregateByCategory(className: string) {
  const result = await client.graphql
    .aggregate()
    .withClassName(className)
    .withFields('category { count topOccurrences { value occurs } }')
    .do();

  return result.data.Aggregate[className];
}

// 分组查询
export async function groupByField(
  className: string,
  field: string,
  groups: number = 10,
  objectsPerGroup: number = 5
) {
  const result = await client.graphql
    .get()
    .withClassName(className)
    .withFields('title content _additional { id }')
    .withGroup({
      type: 'groupBy',
      path: [field],
      groups,
      objectsPerGroup,
    })
    .do();

  return result.data.Get[className];
}

// 生成式搜索（RAG）
export async function generativeSearch(
  className: string,
  query: string,
  prompt: string,
  limit: number = 5
) {
  const result = await client.graphql
    .get()
    .withClassName(className)
    .withFields('title content')
    .withNearText({ concepts: [query] })
    .withLimit(limit)
    .withGenerate({
      singlePrompt: prompt,
    })
    .do();

  return result.data.Get[className];
}
```

### API 路由

```typescript
// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { vectorSearch, searchWithFilter, hybridSearch } from '@/lib/weaviate/graphql';

export async function POST(req: NextRequest) {
  try {
    const { 
      query, 
      className = 'Document',
      type = 'vector',
      filter,
      limit = 10,
      alpha = 0.5 
    } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    let results;

    switch (type) {
      case 'hybrid':
        results = await hybridSearch(className, query, alpha, limit);
        break;
      case 'filter':
        if (!filter) {
          return NextResponse.json(
            { error: 'Filter is required for filtered search' },
            { status: 400 }
          );
        }
        results = await searchWithFilter(className, query, filter, limit);
        break;
      default:
        results = await vectorSearch(className, query, limit);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    );
  }
}

// app/api/objects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createObject, getObject, updateObject, deleteObject } from '@/lib/weaviate/operations';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const className = searchParams.get('className') || 'Document';

  if (!id) {
    return NextResponse.json(
      { error: 'ID is required' },
      { status: 400 }
    );
  }

  const object = await getObject(className, id, ['id', 'certainty']);
  return NextResponse.json({ object });
}

export async function POST(req: NextRequest) {
  try {
    const { className, properties, vector } = await req.json();

    const result = await createObject(className, properties, vector);

    return NextResponse.json({ 
      success: true, 
      id: result.id 
    });
  } catch (error) {
    console.error('Create object error:', error);
    return NextResponse.json(
      { error: 'Failed to create object' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { className, id, properties } = await req.json();

    await updateObject(className, id, properties);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update object error:', error);
    return NextResponse.json(
      { error: 'Failed to update object' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { className, id } = await req.json();

    await deleteObject(className, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete object error:', error);
    return NextResponse.json(
      { error: 'Failed to delete object' },
      { status: 500 }
    );
  }
}
```

### 数据导入脚本

```typescript
// scripts/import-data.ts
import { batchCreateObjects } from '../lib/weaviate/operations';
import { createSchema } from '../lib/weaviate/schema';
import fs from 'fs';
import path from 'path';

interface DataItem {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  url?: string;
}

async function loadData(dataPath: string): Promise<DataItem[]> {
  const files = fs.readdirSync(dataPath);
  const data: DataItem[] = [];

  for (const file of files) {
    const filePath = path.join(dataPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // 简单的文档分块
    const chunks = splitIntoChunks(content, 500);

    chunks.forEach((chunk, idx) => {
      data.push({
        title: `${file} - Part ${idx + 1}`,
        content: chunk,
        category: path.extname(file).slice(1),
        url: `file://${filePath}`,
      });
    });
  }

  return data;
}

function splitIntoChunks(text: string, maxWords: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  for (const word of words) {
    currentChunk.push(word);
    if (currentChunk.length >= maxWords) {
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
  const className = process.argv[3] || 'Document';

  console.log('Creating schema...');
  await createSchema();

  console.log('Loading data...');
  const data = await loadData(dataPath);
  console.log(`Found ${data.length} items`);

  console.log('Importing to Weaviate...');
  await batchCreateObjects(
    className,
    data.map(item => ({ properties: item })),
    50
  );

  console.log('Import completed!');
}

main().catch(console.error);
```

## 最佳实践

### 1. 多租户架构

```typescript
// lib/weaviate/multi-tenancy.ts
import { client } from './client';

export async function createTenantClass(
  className: string,
  tenantId: string
) {
  await client.schema
    .classCreator()
    .withClass({
      class: `${className}_${tenantId}`,
      ...documentClass,
    })
    .do();
}

export async function searchTenantData(
  className: string,
  tenantId: string,
  query: string
) {
  return await vectorSearch(`${className}_${tenantId}`, query);
}
```

### 2. 向量量化

```typescript
// 配置量化以节省空间
export const quantizedClass = {
  class: 'DocumentQuantized',
  vectorIndexConfig: {
    ef: -1,
    maxConnections: 64,
    quantizer: 'pq',
    pq: {
      centroids: 256,
      segments: 96,
      encoder: {
        type: 'tile',
        distribution: 'log-normal',
      },
    },
  },
  // ... 其他配置
};
```

### 3. 复杂过滤

```typescript
// 复杂的 WHERE 过滤器
const complexFilter = {
  operator: 'And',
  operands: [
    {
      path: ['category'],
      operator: 'Equal',
      valueText: 'documentation',
    },
    {
      operator: 'Or',
      operands: [
        {
          path: ['publishedAt'],
          operator: 'GreaterThan',
          valueDate: '2024-01-01T00:00:00Z',
        },
        {
          path: ['tags'],
          operator: 'ContainsAny',
          valueText: ['featured', 'popular'],
        },
      ],
    },
  ],
};

const results = await searchWithFilter('Document', 'query', complexFilter);
```

### 4. 向量缓存

```typescript
// lib/weaviate/cache.ts
import { redis } from '@/lib/redis';

export async function getCachedVector(key: string): Promise<number[] | null> {
  const cached = await redis.get(`vector:${key}`);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedVector(
  key: string,
  vector: number[],
  ttl: number = 3600
) {
  await redis.set(`vector:${key}`, JSON.stringify(vector), { ex: ttl });
}

export async function searchWithCache(
  className: string,
  query: string,
  limit: number = 10
) {
  // 尝试从缓存获取向量
  let vector = await getCachedVector(query);

  if (!vector) {
    // 生成新向量
    const result = await client.graphql
      .get()
      .withClassName(className)
      .withNearText({ concepts: [query] })
      .withLimit(1)
      .do();

    // 缓存向量
    // 注意：需要从结果中提取向量
    // await setCachedVector(query, vector);
  }

  return await semanticSearch(className, vector!, limit);
}
```

## 本地开发环境

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  weaviate:
    image: semitechnologies/weaviate:latest
    ports:
      - "8080:8080"
    environment:
      QUERY_DEFAULTS_LIMIT: 25
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'
      PERSISTENCE_DATA_PATH: '/var/lib/weaviate'
      DEFAULT_VECTORIZER_MODULE: 'text2vec-openai'
      ENABLE_MODULES: 'text2vec-openai,text2vec-cohere,generative-openai'
      OPENAI_APIKEY: ${OPENAI_API_KEY}
      CLUSTER_HOSTNAME: 'node1'
    volumes:
      - weaviate_data:/var/lib/weaviate

volumes:
  weaviate_data:
```

```bash
# 启动本地 Weaviate
docker-compose up -d

# 查看日志
docker-compose logs -f weaviate

# 停止
docker-compose down
```

## 常用命令

```bash
# 安装依赖
npm install weaviate-ts-client

# 运行设置脚本
ts-node scripts/setup-schema.ts

# 导入数据
ts-node scripts/import-data.ts ./data Document

# 检查 Schema
curl http://localhost:8080/v1/schema

# 检查对象数量
curl http://localhost:8080/v1/objects?class=Document
```

## 部署配置

### 环境变量

```bash
# .env.local
WEAVIATE_HOST=your-cluster.weaviate.cloud
WEAVIATE_API_KEY=your-api-key

# 嵌入模型
OPENAI_API_KEY=sk-xxx
COHERE_API_KEY=xxx
```

### 监控

```typescript
// lib/weaviate/monitoring.ts
export async function getClusterStatus() {
  const meta = await client.misc.metaGetter().do();
  return {
    version: meta.Version,
    hostname: meta.Hostname,
    modules: meta.Modules,
  };
}

export async function getClassStats(className: string) {
  const aggregate = await client.graphql
    .aggregate()
    .withClassName(className)
    .withFields('meta { count }')
    .do();

  return {
    count: aggregate.data.Aggregate[className][0].meta.count,
  };
}
```

## 扩展资源

- [Weaviate 官方文档](https://weaviate.io/developers/weaviate)
- [JavaScript/TypeScript 客户端](https://github.com/weaviate/typescript-client)
- [GraphQL API 文档](https://weaviate.io/developers/weaviate/api/graphql)
- [向量搜索指南](https://weaviate.io/developers/weaviate/search)
- [生成式搜索 RAG](https://weaviate.io/developers/weaviate/search/generative)
