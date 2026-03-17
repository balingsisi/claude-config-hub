# LlamaIndex 模板

数据框架，用于构建 LLM 应用，专注于数据连接和索引。

## 技术栈

- **核心**: LlamaIndex / LlamaIndex.TS
- **运行时**: Node.js / Python / Bun
- **向量数据库**: Pinecone / Weaviate / Chroma / Qdrant
- **LLM 提供商**: OpenAI / Anthropic / Cohere / Azure
- **框架集成**: Next.js / Express / FastAPI

## 项目结构

```
llamaindex-app/
├── src/
│   ├── indices/             # 索引定义
│   │   ├── vector-index.ts
│   │   └── summary-index.ts
│   ├── engines/             # 查询引擎
│   │   ├── chat-engine.ts
│   │   └── query-engine.ts
│   ├── readers/             # 数据读取器
│   │   ├── pdf-reader.ts
│   │   ├── web-reader.ts
│   │   └── database-reader.ts
│   ├── retrievers/          # 检索器
│   │   ├── vector-retriever.ts
│   │   └── hybrid-retriever.ts
│   ├── embeddings/          # 嵌入模型
│   │   └── openai-embed.ts
│   ├── node-parser/         # 节点解析器
│   │   └── sentence-splitter.ts
│   ├── storage/             # 存储层
│   │   ├── vector-store.ts
│   │   └── doc-store.ts
│   └── utils/
│       └── transformers.ts
├── tests/
├── llamaindex.config.ts
├── .env
└── package.json
```

## 代码模式

### 索引创建

```typescript
import { VectorStoreIndex, SimpleDirectoryReader } from 'llamaindex';

// 从目录加载文档
const reader = new SimpleDirectoryReader();
const documents = await reader.loadData('./data');

// 创建向量索引
const index = await VectorStoreIndex.fromDocuments(documents);

// 持久化索引
await index.storageContext.persist('./storage');
```

### 查询引擎

```typescript
import { VectorStoreIndex } from 'llamaindex';

// 创建查询引擎
const queryEngine = index.asQueryEngine({
  similarityTopK: 3,
  responseMode: 'compact',
});

const response = await queryEngine.query('文档中提到了什么?');
console.log(response.response);
console.log(response.sourceNodes); // 源节点
```

### 聊天引擎

```typescript
import { ContextChatEngine } from 'llamaindex';

// 创建聊天引擎（带记忆）
const chatEngine = new ContextChatEngine({
  retriever: index.asRetriever(),
  chatHistory: [],
});

const response = await chatEngine.chat('你好，我是张三');
const response2 = await chatEngine.chat('我叫什么名字?'); // 会记住上下文
```

### 自定义 LLM

```typescript
import { OpenAI } from 'llamaindex';

const llm = new OpenAI({
  model: 'gpt-4-turbo-preview',
  temperature: 0.7,
  maxTokens: 2000,
});

const index = await VectorStoreIndex.fromDocuments(documents, {
  serviceContext: { llm },
});
```

### 自定义嵌入模型

```typescript
import { OpenAIEmbedding } from 'llamaindex';

const embedModel = new OpenAIEmbedding({
  model: 'text-embedding-3-small',
  embedBatchSize: 100,
});

const index = await VectorStoreIndex.fromDocuments(documents, {
  serviceContext: { embedModel },
});
```

### 节点解析器

```typescript
import { SentenceSplitter } from 'llamaindex';

const splitter = new SentenceSplitter({
  chunkSize: 1024,
  chunkOverlap: 200,
});

const nodes = await splitter.getNodesFromDocuments(documents);
```

### 向量存储集成

```typescript
import { PineconeVectorStore } from 'llamaindex';
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const vectorStore = new PineconeVectorStore({
  pinecone,
  indexName: 'my-index',
  namespace: 'production',
});

const index = await VectorStoreIndex.fromVectorStore(vectorStore);
```

### RAG（检索增强生成）

```typescript
import { VectorStoreIndex, SimpleDirectoryReader, ResponseMode } from 'llamaindex';

// 加载文档
const documents = await new SimpleDirectoryReader().loadData('./documents');

// 创建索引
const index = await VectorStoreIndex.fromDocuments(documents);

// 创建查询引擎（带相似度阈值）
const queryEngine = index.asQueryEngine({
  similarityTopK: 5,
  responseMode: ResponseMode.COMPACT,
  nodePostprocessors: [
    {
      similarityCutoff: 0.7, // 相似度阈值
    },
  ],
});

const response = await queryEngine.query('什么是机器学习?');
console.log(response.response);
```

### 流式响应

```typescript
const queryEngine = index.asQueryEngine();

const stream = await queryEngine.query('解释量子计算', {
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### 自定义提示模板

```typescript
import { PromptTemplate } from 'llamaindex';

const qaPrompt = new PromptTemplate({
  template: `你是一个专业的助手，根据上下文回答问题。
  
上下文:
{context}

问题: {question}

请提供准确详细的回答。`,
  inputVariables: ['context', 'question'],
});

const queryEngine = index.asQueryEngine({
  textQaTemplate: qaPrompt,
});
```

## 最佳实践

### 1. 服务上下文配置

```typescript
import { serviceContextFromDefaults, OpenAI, OpenAIEmbedding } from 'llamaindex';

const serviceContext = serviceContextFromDefaults({
  llm: new OpenAI({ model: 'gpt-4-turbo-preview' }),
  embedModel: new OpenAIEmbedding({ model: 'text-embedding-3-small' }),
  chunkSize: 1024,
  chunkOverlap: 200,
});

const index = await VectorStoreIndex.fromDocuments(documents, {
  serviceContext,
});
```

### 2. 增量索引更新

```typescript
// 加载现有索引
const storageContext = await storageContextFromDefaults({
  persistDir: './storage',
});
const index = await VectorStoreIndex.init({
  storageContext,
});

// 添加新文档
const newDocs = await new SimpleDirectoryReader().loadData('./new-data');
for (const doc of newDocs) {
  await index.insertDocument(doc);
}

// 持久化更新
await storageContext.persist();
```

### 3. 混合检索

```typescript
import { VectorIndexRetriever, SummaryIndexRetriever } from 'llamaindex';

// 向量检索器
const vectorRetriever = new VectorIndexRetriever({
  index,
  similarityTopK: 3,
});

// 关键词检索器
const summaryRetriever = new SummaryIndexRetriever({
  index,
});

// 组合检索器
const retriever = {
  retrieve: async (query: string) => {
    const vectorNodes = await vectorRetriever.retrieve(query);
    const summaryNodes = await summaryRetriever.retrieve(query);
    return [...vectorNodes, ...summaryNodes];
  },
};
```

### 4. 元数据过滤

```typescript
import { MetadataFilters } from 'llamaindex';

const filters: MetadataFilters = {
  filters: [
    {
      key: 'category',
      value: 'technical',
    },
    {
      key: 'year',
      value: 2024,
      operator: '>=',
    },
  ],
};

const queryEngine = index.asQueryEngine({
  filters,
});
```

### 5. 错误处理

```typescript
try {
  const response = await queryEngine.query(query);
} catch (error) {
  if (error.message.includes('rate limit')) {
    // 重试逻辑
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return await queryEngine.query(query);
  }
  throw error;
}
```

## 常用命令

```bash
# 安装
npm install llamaindex

# 安装向量数据库
npm install @pinecone-database/pinecone

# 安装文档加载器
npm install simple-git pdf-parse

# 运行开发服务器
npm run dev

# 测试
npm test

# 索引文档
npx llamaindex index ./data --output ./storage

# 查询索引
npx llamaindex query --index ./storage "你的问题"
```

## 部署配置

### Vercel 部署

```json
// vercel.json
{
  "functions": {
    "api/query.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "env": {
    "OPENAI_API_KEY": "@openai-api-key",
    "PINECONE_API_KEY": "@pinecone-api-key"
  }
}
```

### Docker 部署

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
ENV OPENAI_API_KEY=""

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### 环境变量

```bash
# .env.example
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
PINECONE_API_KEY=xxx
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX=my-index

# 可选
LLAMAINDEX_DEBUG=true
```

## 常见问题

### 文档大小处理

```typescript
import { SentenceSplitter } from 'llamaindex';

const splitter = new SentenceSplitter({
  chunkSize: 512,
  chunkOverlap: 50,
});

const nodes = await splitter.getNodesFromDocuments(largeDocuments);
```

### 成本优化

```typescript
// 使用更便宜的嵌入模型
const embedModel = new OpenAIEmbedding({
  model: 'text-embedding-3-small', // 比 large 便宜
});

// 缓存嵌入
const storageContext = await storageContextFromDefaults({
  persistDir: './cache',
});
```

### 调试技巧

```typescript
import { setGlobalLogLevel, LogLevel } from 'llamaindex';

setGlobalLogLevel(LogLevel.DEBUG);

// 查看详细的检索过程
const response = await queryEngine.query('测试查询');
console.log(response.sourceNodes);
```

## 相关资源

- [LlamaIndex 官方文档](https://docs.llamaindex.ai/)
- [LlamaIndex.TS 文档](https://ts.llamaindex.ai/)
- [示例代码库](https://github.com/run-llama/LlamaIndexTS/tree/main/examples)
- [LlamaCloud 平台](https://llamacloud.com/)
