# OpenAI API 开发模板

## 技术栈

- **核心**: OpenAI API
- **客户端**: openai (官方 Node.js SDK)
- **功能**: Chat Completions, Embeddings, Images, Audio, Assistants
- **框架**: Next.js / Node.js
- **流式**: Server-Sent Events / Web Streams

## 项目结构

```
openai-project/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts        # 聊天 API
│   │   ├── embeddings/
│   │   │   └── route.ts        # 嵌入向量
│   │   ├── images/
│   │   │   └── route.ts        # 图像生成
│   │   ├── audio/
│   │   │   └── route.ts        # 音频处理
│   │   └── assistants/
│   │       └── route.ts        # Assistant API
│   └── page.tsx
├── lib/
│   openai/
│   │   ├── client.ts           # OpenAI 客户端
│   │   ├── chat.ts             # 聊天功能
│   │   ├── embeddings.ts       # 嵌入向量
│   │   ├── images.ts           # 图像生成
│   │   ├── audio.ts            # 音频处理
│   │   └── assistants.ts       # Assistant API
│   └── utils.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### OpenAI 客户端配置

```typescript
// lib/openai/client.ts
import OpenAI from 'openai';

// 基础客户端
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID, // 可选
  project: process.env.OPENAI_PROJECT_ID, // 可选
});

// 配置选项
export const config = {
  defaultModel: 'gpt-4o',
  fastModel: 'gpt-4o-mini',
  embeddingModel: 'text-embedding-3-small',
  imageModel: 'dall-e-3',
  whisperModel: 'whisper-1',
  ttsModel: 'tts-1',
};

// 模型映射
export const models = {
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
  'gpt-4-turbo': 'gpt-4-turbo-preview',
  'gpt-3.5-turbo': 'gpt-3.5-turbo',
  'o1': 'o1-preview',
  'o1-mini': 'o1-mini',
};
```

### Chat Completions

```typescript
// lib/openai/chat.ts
import openai, { config } from './client';

// 基础聊天
export async function chat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model: string = config.defaultModel
) {
  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 4096,
  });

  return response.choices[0].message;
}

// 流式聊天
export async function* streamChat(
  messages: Array<{ role: string; content: string }>,
  model: string = config.defaultModel
) {
  const stream = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 4096,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

// 带函数调用的聊天
export async function chatWithFunctions(
  messages: Array<{ role: string; content: string }>,
  functions: any[]
) {
  const response = await openai.chat.completions.create({
    model: config.defaultModel,
    messages,
    functions,
    function_call: 'auto',
  });

  const message = response.choices[0].message;

  // 如果有函数调用
  if (message.function_call) {
    const functionName = message.function_call.name;
    const functionArgs = JSON.parse(message.function_call.arguments);

    return {
      type: 'function_call',
      function: functionName,
      arguments: functionArgs,
    };
  }

  return {
    type: 'message',
    content: message.content,
  };
}

// Vision (图像理解)
export async function visionChat(
  text: string,
  imageUrl: string,
  model: string = 'gpt-4o'
) {
  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: 'auto', // 'low', 'high', 'auto'
            },
          },
        ],
      },
    ],
    max_tokens: 1000,
  });

  return response.choices[0].message.content;
}

// 结构化输出 (JSON Mode)
export async function structuredChat<T>(
  messages: Array<{ role: string; content: string }>,
  schema?: any
) {
  const response = await openai.chat.completions.create({
    model: config.defaultModel,
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content!) as T;
}

// 对话历史管理
export class ConversationManager {
  private messages: Array<{ role: string; content: string }> = [];
  private maxTokens: number;

  constructor(systemPrompt?: string, maxTokens: number = 4000) {
    this.maxTokens = maxTokens;
    if (systemPrompt) {
      this.messages.push({ role: 'system', content: systemPrompt });
    }
  }

  addMessage(role: 'user' | 'assistant', content: string) {
    this.messages.push({ role, content });
    this.truncateIfNeeded();
  }

  private truncateIfNeeded() {
    // 简单的 token 估算和截断
    let totalLength = this.messages.reduce((sum, msg) => sum + msg.content.length, 0);
    
    while (totalLength > this.maxTokens * 4 && this.messages.length > 1) {
      // 移除最早的非系统消息
      const indexToRemove = this.messages.findIndex(m => m.role !== 'system');
      if (indexToRemove !== -1) {
        const removed = this.messages.splice(indexToRemove, 1)[0];
        totalLength -= removed.content.length;
      } else {
        break;
      }
    }
  }

  getMessages() {
    return [...this.messages];
  }

  async chat(userMessage: string) {
    this.addMessage('user', userMessage);
    
    const response = await chat(this.messages);
    
    if (response.content) {
      this.addMessage('assistant', response.content);
    }
    
    return response;
  }
}
```

### Embeddings

```typescript
// lib/openai/embeddings.ts
import openai, { config } from './client';

// 单个文本嵌入
export async function generateEmbedding(
  text: string,
  model: string = config.embeddingModel
) {
  const response = await openai.embeddings.create({
    model,
    input: text,
  });

  return {
    embedding: response.data[0].embedding,
    tokens: response.usage.total_tokens,
  };
}

// 批量嵌入
export async function generateEmbeddings(
  texts: string[],
  model: string = config.embeddingModel
) {
  const response = await openai.embeddings.create({
    model,
    input: texts,
  });

  return {
    embeddings: response.data.map(item => item.embedding),
    totalTokens: response.usage.total_tokens,
  };
}

// 余弦相似度
export function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// 搜索最相似的文本
export async function searchSimilarTexts(
  query: string,
  corpus: string[],
  topK: number = 5
) {
  const queryEmbedding = await generateEmbedding(query);
  const corpusEmbeddings = await generateEmbeddings(corpus);

  const similarities = corpusEmbeddings.embeddings.map((embedding, idx) => ({
    index: idx,
    text: corpus[idx],
    similarity: cosineSimilarity(queryEmbedding.embedding, embedding),
  }));

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}
```

### Image Generation

```typescript
// lib/openai/images.ts
import openai, { config } from './client';

// 生成图像
export async function generateImage(
  prompt: string,
  options: {
    model?: string;
    size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
    n?: number;
  } = {}
) {
  const response = await openai.images.generate({
    model: options.model || config.imageModel,
    prompt,
    size: options.size || '1024x1024',
    quality: options.quality || 'standard',
    style: options.style || 'vivid',
    n: options.n || 1,
  });

  return response.data.map(img => ({
    url: img.url,
    revisedPrompt: img.revised_prompt,
  }));
}

// 图像编辑
export async function editImage(
  image: Buffer,
  prompt: string,
  mask?: Buffer
) {
  const response = await openai.images.edit({
    model: 'dall-e-2',
    image,
    prompt,
    mask,
    size: '1024x1024',
    n: 1,
  });

  return response.data[0].url;
}

// 图像变体
export async function createImageVariation(image: Buffer) {
  const response = await openai.images.createVariation({
    model: 'dall-e-2',
    image,
    n: 1,
    size: '1024x1024',
  });

  return response.data[0].url;
}
```

### Audio Processing

```typescript
// lib/openai/audio.ts
import openai from './client';
import fs from 'fs';

// 语音转文字 (Whisper)
export async function transcribeAudio(
  audioFile: string | Buffer,
  options: {
    language?: string;
    prompt?: string;
    responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
    temperature?: number;
  } = {}
) {
  const file = typeof audioFile === 'string' 
    ? fs.createReadStream(audioFile) 
    : audioFile;

  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: options.language,
    prompt: options.prompt,
    response_format: options.responseFormat || 'json',
    temperature: options.temperature || 0,
  });

  return response;
}

// 翻译音频
export async function translateAudio(audioFile: string | Buffer) {
  const file = typeof audioFile === 'string' 
    ? fs.createReadStream(audioFile) 
    : audioFile;

  const response = await openai.audio.translations.create({
    model: 'whisper-1',
    file,
  });

  return response.text;
}

// 文字转语音 (TTS)
export async function textToSpeech(
  text: string,
  options: {
    model?: string;
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    speed?: number;
  } = {}
) {
  const response = await openai.audio.speech.create({
    model: options.model || 'tts-1',
    voice: options.voice || 'alloy',
    input: text,
    speed: options.speed || 1.0,
  });

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}

// 流式 TTS
export async function* streamTextToSpeech(
  text: string,
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy'
) {
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice,
    input: text,
    response_format: 'mp3',
  });

  const stream = response.body;
  if (!stream) return;

  const reader = stream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield Buffer.from(value);
  }
}
```

### Assistants API

```typescript
// lib/openai/assistants.ts
import openai from './client';

// 创建 Assistant
export async function createAssistant(
  name: string,
  instructions: string,
  model: string = 'gpt-4o',
  tools: any[] = []
) {
  const assistant = await openai.beta.assistants.create({
    name,
    instructions,
    model,
    tools,
  });

  return assistant;
}

// 创建 Thread
export async function createThread() {
  const thread = await openai.beta.threads.create();
  return thread;
}

// 添加消息到 Thread
export async function addMessage(
  threadId: string,
  content: string,
  role: 'user' | 'assistant' = 'user'
) {
  const message = await openai.beta.threads.messages.create(threadId, {
    role,
    content,
  });

  return message;
}

// 运行 Assistant
export async function runAssistant(
  threadId: string,
  assistantId: string,
  instructions?: string
) {
  let run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    instructions,
  });

  // 等待完成
  while (run.status === 'queued' || run.status === 'in_progress') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    run = await openai.beta.threads.runs.retrieve(threadId, run.id);
  }

  if (run.status === 'completed') {
    // 获取消息
    const messages = await openai.beta.threads.messages.list(threadId);
    return messages.data[0];
  }

  throw new Error(`Run failed with status: ${run.status}`);
}

// 流式 Assistant
export async function* streamAssistant(
  threadId: string,
  assistantId: string
) {
  const stream = await openai.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId,
  });

  for await (const event of stream) {
    if (event.event === 'thread.message.delta') {
      const content = event.data.delta?.content?.[0];
      if (content?.type === 'text') {
        yield content.text?.value || '';
      }
    }
  }
}

// 使用代码解释器
export async function createAssistantWithCodeInterpreter() {
  const assistant = await openai.beta.assistants.create({
    name: 'Code Assistant',
    instructions: 'You are a helpful assistant that can run Python code.',
    model: 'gpt-4o',
    tools: [{ type: 'code_interpreter' }],
  });

  return assistant;
}

// 文件上传
export async function uploadFile(file: Buffer, purpose: 'assistants' | 'vision' = 'assistants') {
  const response = await openai.files.create({
    file,
    purpose,
  });

  return response;
}

// 使用知识库
export async function createAssistantWithFiles(fileIds: string[]) {
  const assistant = await openai.beta.assistants.create({
    name: 'Knowledge Assistant',
    instructions: 'You are a helpful assistant with access to uploaded files.',
    model: 'gpt-4o',
    tools: [{ type: 'file_search' }],
    tool_resources: {
      file_search: {
        vector_store_ids: fileIds,
      },
    },
  });

  return assistant;
}
```

### API 路由

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { streamChat } from '@/lib/openai/chat';

export async function POST(req: NextRequest) {
  const { messages, model } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamChat(messages, model)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// app/api/embeddings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding, generateEmbeddings } from '@/lib/openai/embeddings';

export async function POST(req: NextRequest) {
  const { text, texts } = await req.json();

  if (texts && Array.isArray(texts)) {
    const result = await generateEmbeddings(texts);
    return NextResponse.json(result);
  }

  if (text) {
    const result = await generateEmbedding(text);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Text or texts required' }, { status: 400 });
}

// app/api/images/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/openai/images';

export async function POST(req: NextRequest) {
  const { prompt, size, quality, style } = await req.json();

  const images = await generateImage(prompt, { size, quality, style });

  return NextResponse.json({ images });
}

// app/api/audio/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio, textToSpeech } from '@/lib/openai/audio';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const text = formData.get('text') as string;

  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await transcribeAudio(buffer);
    return NextResponse.json(result);
  }

  if (text) {
    const audioBuffer = await textToSpeech(text);
    return new Response(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  }

  return NextResponse.json({ error: 'File or text required' }, { status: 400 });
}
```

## 最佳实践

### 1. 错误处理

```typescript
// lib/openai/errors.ts
import { OpenAI } from 'openai';

export async function handleOpenAICall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error:', {
        status: error.status,
        message: error.message,
        code: error.code,
        type: error.type,
      });

      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (error.status === 401) {
        throw new Error('Invalid API key.');
      }
      if (error.code === 'context_length_exceeded') {
        throw new Error('Message too long. Please shorten your input.');
      }
    }

    throw error;
  }
}
```

### 2. 速率限制

```typescript
// lib/openai/rate-limiter.ts
import pLimit from 'p-limit';

const limiters = {
  chat: pLimit(100), // 每分钟100次
  embeddings: pLimit(3000), // 每分钟3000次
  images: pLimit(5), // 每分钟5次
};

export async function rateLimitedChat(messages: any[], model?: string) {
  return limiters.chat(() => chat(messages, model));
}

export async function rateLimitedEmbedding(text: string) {
  return limiters.embeddings(() => generateEmbedding(text));
}

export async function rateLimitedImageGeneration(prompt: string) {
  return limiters.images(() => generateImage(prompt));
}
```

### 3. Token 计数

```typescript
// lib/openai/tokens.ts
import { encoding_for_model } from 'tiktoken';

export function countTokens(text: string, model: string = 'gpt-4o'): number {
  const encoding = encoding_for_model(model as any);
  const tokens = encoding.encode(text);
  encoding.free();
  return tokens.length;
}

export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  model: string = 'gpt-4o'
): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 0.0025 / 1000, output: 0.01 / 1000 },
    'gpt-4o-mini': { input: 0.00015 / 1000, output: 0.0006 / 1000 },
    'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
    'gpt-3.5-turbo': { input: 0.0005 / 1000, output: 0.0015 / 1000 },
  };

  const rates = pricing[model] || pricing['gpt-4o'];
  return inputTokens * rates.input + outputTokens * rates.output;
}
```

### 4. 缓存

```typescript
// lib/openai/cache.ts
import { redis } from '@/lib/redis';

export async function getCachedChat(
  messages: any[]
): Promise<string | null> {
  const key = `chat:${JSON.stringify(messages)}`;
  return redis.get(key);
}

export async function setCachedChat(
  messages: any[],
  response: string,
  ttl: number = 3600
) {
  const key = `chat:${JSON.stringify(messages)}`;
  await redis.set(key, response, { ex: ttl });
}

export async function chatWithCache(
  messages: any[],
  model?: string
): Promise<string> {
  // 尝试从缓存获取
  const cached = await getCachedChat(messages);
  if (cached) return cached;

  // 调用 API
  const response = await chat(messages, model);
  const content = response.content || '';

  // 缓存结果
  await setCachedChat(messages, content);

  return content;
}
```

## 常用命令

```bash
# 安装依赖
npm install openai

# 可选：Token 计数
npm install tiktoken

# 开发
npm run dev

# 测试
npm test
```

## 部署配置

### 环境变量

```bash
# .env.local
OPENAI_API_KEY=sk-xxx
OPENAI_ORG_ID=org-xxx
OPENAI_PROJECT_ID=proj-xxx
```

### Next.js 配置

```typescript
// next.config.js
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['tiktoken'],
  },
  // 增加超时时间（用于流式响应）
  serverRuntimeConfig: {
    maxDuration: 60,
  },
};

module.exports = nextConfig;
```

## 扩展资源

- [OpenAI API 文档](https://platform.openai.com/docs)
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)
- [Chat Completions 指南](https://platform.openai.com/docs/guides/chat)
- [Assistants API](https://platform.openai.com/docs/assistants/overview)
- [定价](https://openai.com/pricing)
