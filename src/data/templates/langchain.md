# LangChain 模板

AI/LLM 应用开发框架，支持多语言（Python、JavaScript/TypeScript）。

## 技术栈

- **核心**: LangChain / LangChain.js
- **运行时**: Node.js / Python / Bun
- **向量数据库**: Pinecone / Weaviate / Chroma / Qdrant
- **LLM 提供商**: OpenAI / Anthropic / Cohere / Hugging Face
- **框架集成**: Next.js / Express / FastAPI

## 项目结构

```
langchain-app/
├── src/
│   ├── chains/              # 链定义
│   │   ├── qa-chain.ts
│   │   └── summary-chain.ts
│   ├── agents/              # 代理
│   │   ├── research-agent.ts
│   │   └── tools/
│   ├── retrievers/          # 检索器
│   │   ├── vector-store.ts
│   │   └── hybrid.ts
│   ├── prompts/             # 提示模板
│   │   ├── system-prompts.ts
│   │   └── few-shot.ts
│   ├── memory/              # 记忆系统
│   │   ├── buffer-memory.ts
│   │   └── vector-memory.ts
│   ├── embeddings/          # 嵌入模型
│   │   └── openai-embed.ts
│   ├── loaders/             # 文档加载器
│   │   ├── pdf-loader.ts
│   │   └── web-loader.ts
│   └── utils/
│       └── text-splitter.ts
├── tests/
├── langchain.config.ts
├── .env
└── package.json
```

## 代码模式

### 链（Chain）定义

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

const model = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
});

const prompt = PromptTemplate.fromTemplate(`
  你是一个专业的助手。
  
  上下文: {context}
  问题: {question}
  
  请提供详细准确的回答。
`);

const chain = RunnableSequence.from([
  {
    context: (input) => input.context,
    question: (input) => input.question,
  },
  prompt,
  model,
  new StringOutputParser(),
]);

const response = await chain.invoke({
  context: '相关背景信息...',
  question: '具体问题?',
});
```

### RAG（检索增强生成）

```typescript
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { RetrievalQAChain } from 'langchain/chains';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';

// 加载文档
const loader = new PDFLoader('./docs/guide.pdf');
const docs = await loader.load();

// 文本分割
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const splitDocs = await splitter.splitDocuments(docs);

// 创建向量存储
const embeddings = new OpenAIEmbeddings();
const vectorStore = await MemoryVectorStore.fromDocuments(
  splitDocs,
  embeddings
);

// 创建 RAG 链
const qaChain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
  returnSourceDocuments: true,
});

const result = await qaChain.invoke({ query: '文档中提到了什么?' });
console.log(result.sourceDocuments); // 源文档
```

### Agent（代理）

```typescript
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { pull } from 'langchain/hub';
import { DynamicTool } from '@langchain/core/tools';

// 定义工具
const calculatorTool = new DynamicTool({
  name: 'calculator',
  description: '用于数学计算。输入数学表达式，返回计算结果。',
  func: async (input: string) => {
    return eval(input).toString();
  },
});

const searchTool = new DynamicTool({
  name: 'search',
  description: '搜索网络信息。输入搜索关键词。',
  func: async (input: string) => {
    // 实现搜索逻辑
    return `搜索结果: ${input}`;
  },
});

// 创建代理
const prompt = await pull('hwchase17/openai-functions-agent');
const agent = await createOpenAIFunctionsAgent({
  llm: model,
  tools: [calculatorTool, searchTool],
  prompt,
});

const agentExecutor = new AgentExecutor({
  agent,
  tools: [calculatorTool, searchTool],
  verbose: true,
});

const result = await agentExecutor.invoke({
  input: '计算 25 * 4 + 10',
});
```

### 记忆系统

```typescript
import { BufferMemory } from 'langchain/memory';
import { ConversationChain } from 'langchain/chains';

const memory = new BufferMemory({
  returnMessages: true,
  memoryKey: 'chat_history',
});

const chain = new ConversationChain({
  llm: model,
  memory,
});

await chain.invoke({ input: '你好，我是张三' });
await chain.invoke({ input: '我叫什么名字?' }); // 会记住上下文
```

### 自定义输出解析器

```typescript
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';

const schema = z.object({
  name: z.string().describe('产品名称'),
  price: z.number().describe('产品价格'),
  features: z.array(z.string()).describe('产品特性'),
});

const parser = StructuredOutputParser.fromZodSchema(schema);

const prompt = PromptTemplate.fromTemplate(`
  从用户输入中提取产品信息。
  
  {format_instructions}
  
  用户输入: {user_input}
`);

const chain = prompt.pipe(model).pipe(parser);

const result = await chain.invoke({
  user_input: 'iPhone 15 售价 5999，特点是轻薄、拍照强、续航久',
  format_instructions: parser.getFormatInstructions(),
});
```

## 最佳实践

### 1. 环境变量管理

```typescript
// config/llm.ts
import { ChatOpenAI } from '@langchain/openai';
import { Anthropic } from '@langchain/anthropic';

export function getLLM(provider: string = 'openai') {
  switch (provider) {
    case 'openai':
      return new ChatOpenAI({
        modelName: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
      });
    case 'anthropic':
      return new Anthropic({
        modelName: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
      });
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}
```

### 2. 流式输出

```typescript
import { CallbackHandler } from 'langchain/langchain';

const streamHandler = new CallbackHandler({
  handleLLMNewToken(token: string) {
    process.stdout.write(token);
  },
});

const chain = prompt.pipe(model);
const stream = await chain.stream(
  { question: '解释量子计算' },
  { callbacks: [streamHandler] }
);

for await (const chunk of stream) {
  // 处理流式输出
}
```

### 3. 错误处理与重试

```typescript
import { RetryChain } from 'langchain/chains';

const chainWithRetry = new RetryChain({
  chain: baseChain,
  maxRetries: 3,
  retryOn: (error) => {
    return error.message.includes('rate limit');
  },
});
```

### 4. 缓存机制

```typescript
import { InMemoryCache } from 'langchain/cache';
import { SQLiteCache } from 'langchain/cache/sqlite';

const cache = new SQLiteCache('./cache.db');
const model = new ChatOpenAI({
  cache,
  modelName: 'gpt-4',
});
```

## 常用命令

```bash
# 安装
npm install langchain @langchain/openai @langchain/anthropic

# 安装向量数据库
npm install @langchain/pinecone @langchain/weaviate

# 安装文档加载器
npm install @langchain/community pdf-parse

# 安装嵌入模型
npm install @langchain/openai

# 运行开发服务器
npm run dev

# 测试
npm test

# 评估链性能
npx langchain-eval evaluate --chain ./src/chains/qa-chain.ts
```

## 部署配置

### Vercel 部署

```json
// vercel.json
{
  "functions": {
    "api/chat.ts": {
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
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=xxx
LANGCHAIN_PROJECT=my-project
```

## 常见问题

### Token 限制处理

```typescript
import { TokenTextSplitter } from 'langchain/text_splitter';

const splitter = new TokenTextSplitter({
  encodingName: 'cl100k_base',
  chunkSize: 4000,
  chunkOverlap: 200,
});
```

### 成本优化

```typescript
// 使用更便宜的模型处理简单任务
const cheapModel = new ChatOpenAI({ modelName: 'gpt-3.5-turbo' });
const expensiveModel = new ChatOpenAI({ modelName: 'gpt-4' });

// 根据任务复杂度选择模型
const chain = RunnableBranch.from([
  [(x) => x.complex, expensiveModel],
  [(x) => !x.complex, cheapModel],
  cheapModel,
]);
```

### 调试技巧

```typescript
import { LangChainTracer } from 'langchain/handlers';

const tracer = new LangChainTracer();

const result = await chain.invoke(input, {
  callbacks: [tracer],
});
```

## 相关资源

- [LangChain 官方文档](https://python.langchain.com/docs/)
- [LangChain.js 文档](https://js.langchain.com/docs/)
- [LangSmith 调试平台](https://www.langchain.com/langsmith)
- [模板库](https://github.com/langchain-ai/langchain/tree/master/templates)
