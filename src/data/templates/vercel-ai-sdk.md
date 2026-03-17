# Vercel AI SDK 开发模板

## 技术栈

- **核心**: Vercel AI SDK (ai package)
- **AI 提供商**: OpenAI / Anthropic / Cohere / Mistral
- **框架**: Next.js App Router / React
- **UI 组件**: @ai-sdk/react
- **流式传输**: Server-Sent Events / Web Streams

## 项目结构

```
vercel-ai-sdk-project/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts        # 聊天 API
│   │   ├── completion/
│   │   │   └── route.ts        # 文本补全
│   │   └── generate/
│   │       └── route.ts        # 内容生成
│   ├── chat/
│   │   └── page.tsx            # 聊天页面
│   └── layout.tsx
├── components/
│   ├── chat/
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessages.tsx
│   │   └── ChatContainer.tsx
│   └── ui/
│       └── Button.tsx
├── lib/
│   ├── ai/
│   │   ├── providers.ts        # AI 提供商配置
│   │   ├── tools.ts            # AI 工具定义
│   │   └── prompts.ts          # 提示词模板
│   └── utils.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### AI 提供商配置

```typescript
// lib/ai/providers.ts
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { cohere } from '@ai-sdk/cohere';
import { mistral } from '@ai-sdk/mistral';

// OpenAI 配置
export const openaiProvider = openai({
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: 'strict',
});

// Anthropic 配置
export const anthropicProvider = anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 默认模型
export const defaultModel = openai('gpt-4o');
export const fastModel = openai('gpt-4o-mini');
export const claudeModel = anthropic('claude-3-5-sonnet-20241022');

// 模型映射
export const models = {
  'gpt-4o': openai('gpt-4o'),
  'gpt-4o-mini': openai('gpt-4o-mini'),
  'claude-3.5-sonnet': anthropic('claude-3-5-sonnet-20241022'),
  'claude-3-opus': anthropic('claude-3-opus-20240229'),
  'command-r': cohere('command-r'),
  'mistral-large': mistral('mistral-large-latest'),
};

export function getModel(modelId: string) {
  return models[modelId] ?? defaultModel;
}
```

### 聊天 API (流式)

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { systemPrompt } from '@/lib/ai/prompts';

export const maxDuration = 60; // 最长执行时间

export async function POST(req: Request) {
  const { messages, modelId } = await req.json();
  
  const result = streamText({
    model: getModel(modelId || 'gpt-4o'),
    system: systemPrompt,
    messages,
    temperature: 0.7,
    maxTokens: 4096,
    onFinish: ({ text, finishReason, usage }) => {
      console.log('Stream finished:', { finishReason, usage });
    },
  });

  return result.toDataStreamResponse();
}
```

### 聊天 API (工具调用)

```typescript
// app/api/chat-with-tools/route.ts
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/providers';

// 定义工具
const weatherTool = tool({
  description: '获取指定城市的当前天气',
  parameters: z.object({
    city: z.string().describe('城市名称'),
  }),
  execute: async ({ city }) => {
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${city}`
    );
    const data = await response.json();
    return {
      city: data.location.name,
      temperature: data.current.temp_c,
      condition: data.current.condition.text,
    };
  },
});

const searchTool = tool({
  description: '搜索网络获取最新信息',
  parameters: z.object({
    query: z.string().describe('搜索查询'),
  }),
  execute: async ({ query }) => {
    // 实现搜索逻辑
    const results = await searchWeb(query);
    return results;
  },
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: getModel('gpt-4o'),
    messages,
    tools: {
      weather: weatherTool,
      search: searchTool,
    },
    maxSteps: 5, // 最大工具调用步数
  });

  return result.toDataStreamResponse();
}
```

### React 聊天组件

```typescript
// components/chat/ChatContainer.tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

interface ChatContainerProps {
  modelId?: string;
  conversationId?: string;
}

export function ChatContainer({ modelId = 'gpt-4o', conversationId }: ChatContainerProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    reload,
  } = useChat({
    api: '/api/chat',
    body: {
      modelId,
      conversationId,
    },
    initialMessages: [], // 可以从数据库加载历史消息
    onFinish: (message) => {
      console.log('Message finished:', message);
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  return (
    <div className="flex flex-col h-full">
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
      />
      
      {error && (
        <div className="p-4 bg-red-50 text-red-600">
          Error: {error.message}
        </div>
      )}
      
      <ChatInput
        input={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onStop={stop}
        onReload={reload}
      />
    </div>
  );
}

// components/chat/ChatMessages.tsx
import { Message } from 'ai';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        message.role === 'user' ? (
          <UserMessage key={message.id} message={message} />
        ) : (
          <AssistantMessage key={message.id} message={message} />
        )
      ))}
      
      {isLoading && (
        <div className="flex items-center gap-2 text-gray-500">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span>Thinking...</span>
        </div>
      )}
    </div>
  );
}

// components/chat/ChatInput.tsx
import { FormEvent } from 'react';

interface ChatInputProps {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onStop: () => void;
  onReload: () => void;
}

export function ChatInput({
  input,
  onChange,
  onSubmit,
  isLoading,
  onStop,
  onReload,
}: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="p-4 border-t">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={onChange}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        
        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        )}
        
        <button
          type="button"
          onClick={onReload}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Retry
        </button>
      </div>
    </form>
  );
}
```

### 文本补全

```typescript
// app/api/completion/route.ts
import { streamText } from 'ai';
import { getModel } from '@/lib/ai/providers';

export async function POST(req: Request) {
  const { prompt, modelId } = await req.json();

  const result = streamText({
    model: getModel(modelId || 'gpt-4o-mini'),
    prompt,
    temperature: 0.7,
    maxTokens: 1000,
  });

  return result.toDataStreamResponse();
}

// 客户端使用
import { useCompletion } from '@ai-sdk/react';

function CompletionDemo() {
  const {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  } = useCompletion({
    api: '/api/completion',
  });

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={input}
        onChange={handleInputChange}
        placeholder="Enter your prompt..."
      />
      <button type="submit" disabled={isLoading}>
        Generate
      </button>
      
      {completion && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          {completion}
        </div>
      )}
    </form>
  );
}
```

### 结构化输出

```typescript
// app/api/generate-object/route.ts
import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/providers';

// 定义输出 Schema
const RecipeSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.string(),
  })),
  steps: z.array(z.string()),
  prepTime: z.string(),
  cookTime: z.string(),
  servings: z.number(),
});

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const { object } = await generateObject({
    model: getModel('gpt-4o'),
    schema: RecipeSchema,
    prompt: `Generate a recipe for: ${prompt}`,
  });

  return Response.json(object);
}

// 流式结构化输出
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const topic = searchParams.get('topic');

  const result = streamObject({
    model: getModel('gpt-4o'),
    schema: z.object({
      title: z.string(),
      sections: z.array(z.object({
        heading: z.string(),
        content: z.string(),
      })),
    }),
    prompt: `Write an article about: ${topic}`,
  });

  return result.toTextStreamResponse();
}
```

### Embeddings

```typescript
// app/api/embed/route.ts
import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

const embeddingModel = openai.embedding('text-embedding-3-small');

export async function POST(req: Request) {
  const { texts } = await req.json();

  // 批量生成嵌入
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
  });

  return Response.json({ embeddings });
}

// 单个文本嵌入
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text');

  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  });

  return Response.json({ embedding });
}
```

### 图像生成

```typescript
// app/api/generate-image/route.ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  // 使用 DALL-E 生成图像描述
  const { text } = await generateText({
    model: openai('gpt-4o'),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Describe an image for: ' + prompt },
        ],
      },
    ],
  });

  // 调用 DALL-E API
  const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: text,
      n: 1,
      size: '1024x1024',
    }),
  });

  const data = await imageResponse.json();
  return Response.json(data);
}
```

## 最佳实践

### 1. 提示词管理

```typescript
// lib/ai/prompts.ts
import { CoreMessage } from 'ai';

export const systemPrompt = `You are a helpful AI assistant with the following capabilities:
- Answer questions accurately and concisely
- Provide code examples when relevant
- Explain complex topics in simple terms

Always be respectful and helpful.`;

export function buildPrompt(template: string, context: Record<string, string>): string {
  return Object.entries(context).reduce(
    (prompt, [key, value]) => prompt.replace(`{{${key}}}`, value),
    template
  );
}

// 对话历史管理
export function truncateMessages(
  messages: CoreMessage[],
  maxTokens: number = 4000
): CoreMessage[] {
  // 实现消息截断逻辑
  let totalTokens = 0;
  const truncated: CoreMessage[] = [];

  for (const message of [...messages].reverse()) {
    const tokens = estimateTokens(message.content as string);
    if (totalTokens + tokens > maxTokens) break;
    totalTokens += tokens;
    truncated.unshift(message);
  }

  return truncated;
}
```

### 2. 错误处理

```typescript
// app/api/chat/route.ts
import { APICallError } from 'ai';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    const result = streamText({
      model: defaultModel,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    if (error instanceof APICallError) {
      console.error('API Error:', {
        statusCode: error.statusCode,
        responseBody: error.responseBody,
      });
      
      return Response.json(
        { error: 'AI service error' },
        { status: error.statusCode || 500 }
      );
    }
    
    throw error;
  }
}
```

### 3. 速率限制

```typescript
// middleware/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 每分钟10次
});

export async function rateLimitMiddleware(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return Response.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    );
  }

  return null;
}
```

### 4. 缓存策略

```typescript
// lib/ai/cache.ts
import { redis } from '@/lib/redis';

export async function getCachedCompletion(
  prompt: string,
  ttl: number = 3600
): Promise<string | null> {
  const key = `completion:${hashPrompt(prompt)}`;
  return redis.get(key);
}

export async function setCachedCompletion(
  prompt: string,
  completion: string,
  ttl: number = 3600
): Promise<void> {
  const key = `completion:${hashPrompt(prompt)}`;
  await redis.set(key, completion, { ex: ttl });
}

function hashPrompt(prompt: string): string {
  // 使用 hash 算法生成唯一 key
  return Buffer.from(prompt).toString('base64').slice(0, 32);
}
```

## 常用命令

```bash
# 安装
npm install ai @ai-sdk/openai @ai-sdk/anthropic

# 其他提供商
npm install @ai-sdk/cohere @ai-sdk/mistral @ai-sdk/google

# React hooks
npm install @ai-sdk/react

# 开发
npm run dev

# 类型检查
tsc --noEmit
```

## 部署配置

### 环境变量

```bash
# .env.local
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
COHERE_API_KEY=xxx
MISTRAL_API_KEY=xxx

# 可选
VERCEL_OIDC_TOKEN=xxx
```

### Next.js 配置

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // 边缘运行时支持
  runtime: 'edge', // 可选
};

module.exports = nextConfig;
```

### Vercel 部署

```json
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

## 扩展资源

- [Vercel AI SDK 文档](https://sdk.vercel.ai/docs)
- [AI SDK GitHub](https://github.com/vercel/ai)
- [支持模型列表](https://sdk.vercel.ai/providers)
- [流式响应指南](https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot)
- [工具调用文档](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling)
