# Anthropic API 开发模板

## 技术栈

- **核心**: Anthropic Claude API
- **客户端**: @anthropic-ai/sdk (官方 Node.js SDK)
- **模型**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **框架**: Next.js / Node.js
- **流式**: Server-Sent Events / Web Streams

## 项目结构

```
anthropic-project/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts        # 聊天 API
│   │   ├── stream/
│   │   │   └── route.ts        # 流式响应
│   │   ├── vision/
│   │   │   └── route.ts        # 视觉理解
│   │   └── tools/
│   │       └── route.ts        # 工具调用
│   └── page.tsx
├── lib/
│   anthropic/
│   │   ├── client.ts           # Anthropic 客户端
│   │   ├── chat.ts             # 聊天功能
│   │   ├── tools.ts            # 工具定义
│   │   ├── vision.ts           # 视觉功能
│   │   └── prompts.ts          # 提示词模板
│   └── utils.ts
├── package.json
└── tsconfig.json
```

## 代码模式

### Anthropic 客户端配置

```typescript
// lib/anthropic/client.ts
import Anthropic from '@anthropic-ai/sdk';

// 基础客户端
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 模型配置
export const config = {
  defaultModel: 'claude-3-5-sonnet-20241022',
  opusModel: 'claude-3-opus-20240229',
  haikuModel: 'claude-3-5-haiku-20241022',
  maxTokens: 4096,
};

// 模型映射
export const models = {
  'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022',
  'claude-3-opus': 'claude-3-opus-20240229',
  'claude-3.5-haiku': 'claude-3-5-haiku-20241022',
};

// 根据任务选择模型
export function selectModel(task: 'fast' | 'balanced' | 'powerful'): string {
  const modelMap = {
    fast: config.haikuModel,
    balanced: config.defaultModel,
    powerful: config.opusModel,
  };
  return modelMap[task];
}
```

### Chat Completions

```typescript
// lib/anthropic/chat.ts
import anthropic, { config } from './client';

// 基础消息
export async function chat(
  messages: Array<{
    role: 'user' | 'assistant';
    content: string | any[];
  }>,
  systemPrompt?: string,
  model: string = config.defaultModel
) {
  const response = await anthropic.messages.create({
    model,
    max_tokens: config.maxTokens,
    system: systemPrompt,
    messages,
  });

  return {
    content: response.content,
    stopReason: response.stop_reason,
    usage: response.usage,
  };
}

// 流式消息
export async function* streamChat(
  messages: Array<{ role: 'user' | 'assistant'; content: string | any[] }>,
  systemPrompt?: string,
  model: string = config.defaultModel
) {
  const stream = anthropic.messages.stream({
    model,
    max_tokens: config.maxTokens,
    system: systemPrompt,
    messages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}

// 完整的流式响应对象
export async function streamChatWithMetadata(
  messages: Array<{ role: 'user' | 'assistant'; content: string | any[] }>,
  systemPrompt?: string,
  model: string = config.defaultModel
) {
  const stream = anthropic.messages.stream({
    model,
    max_tokens: config.maxTokens,
    system: systemPrompt,
    messages,
  });

  const finalMessage = await stream.finalMessage();

  return {
    content: finalMessage.content,
    stopReason: finalMessage.stop_reason,
    usage: finalMessage.usage,
    id: finalMessage.id,
    model: finalMessage.model,
  };
}

// 多轮对话管理
export class ConversationManager {
  private messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  private systemPrompt?: string;
  private model: string;

  constructor(systemPrompt?: string, model: string = config.defaultModel) {
    this.systemPrompt = systemPrompt;
    this.model = model;
  }

  addUserMessage(content: string) {
    this.messages.push({ role: 'user', content });
  }

  addAssistantMessage(content: string) {
    this.messages.push({ role: 'assistant', content });
  }

  getMessages() {
    return [...this.messages];
  }

  async sendMessage(userMessage: string) {
    this.addUserMessage(userMessage);

    const response = await chat(this.messages, this.systemPrompt, this.model);
    
    const textContent = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('');

    if (textContent) {
      this.addAssistantMessage(textContent);
    }

    return {
      message: textContent,
      usage: response.usage,
    };
  }

  async *streamMessage(userMessage: string) {
    this.addUserMessage(userMessage);

    let fullResponse = '';

    for await (const chunk of streamChat(this.messages, this.systemPrompt, this.model)) {
      fullResponse += chunk;
      yield chunk;
    }

    this.addAssistantMessage(fullResponse);
  }

  clearHistory() {
    this.messages = [];
  }
}

// 预计算缓存（Prompt Caching）
export async function chatWithCaching(
  messages: Array<{ role: 'user' | 'assistant'; content: string | any[] }>,
  systemPrompt?: string,
  model: string = config.defaultModel
) {
  const response = await anthropic.messages.create({
    model,
    max_tokens: config.maxTokens,
    system: systemPrompt
      ? [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ]
      : undefined,
    messages: messages.map((msg, idx) => ({
      ...msg,
      // 为长消息添加缓存控制
      cache_control:
        idx === messages.length - 1 && typeof msg.content === 'string' && msg.content.length > 1000
          ? { type: 'ephemeral' }
          : undefined,
    })),
  });

  return {
    content: response.content,
    usage: response.usage,
    cacheCreationInputTokens: (response.usage as any).cache_creation_input_tokens || 0,
    cacheReadInputTokens: (response.usage as any).cache_read_input_tokens || 0,
  };
}
```

### 工具调用 (Tool Use)

```typescript
// lib/anthropic/tools.ts
import anthropic, { config } from './client';
import { Tool } from '@anthropic-ai/sdk/resources/messages';

// 定义工具
export const tools: Tool[] = [
  {
    name: 'get_weather',
    description: '获取指定城市的当前天气信息',
    input_schema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: '城市名称，例如：北京、上海',
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: '温度单位',
        },
      },
      required: ['city'],
    },
  },
  {
    name: 'search_web',
    description: '搜索互联网获取最新信息',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索查询',
        },
        num_results: {
          type: 'number',
          description: '返回结果数量',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'execute_code',
    description: '执行 Python 代码',
    input_schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '要执行的 Python 代码',
        },
      },
      required: ['code'],
    },
  },
];

// 工具执行函数
const toolImplementations: Record<string, (input: any) => Promise<string>> = {
  get_weather: async ({ city, unit = 'celsius' }) => {
    // 实际实现会调用天气 API
    return JSON.stringify({
      city,
      temperature: 22,
      unit,
      condition: '晴朗',
    });
  },
  search_web: async ({ query, num_results = 5 }) => {
    // 实际实现会调用搜索 API
    return JSON.stringify({
      results: [
        { title: 'Result 1', url: 'https://example.com/1' },
        { title: 'Result 2', url: 'https://example.com/2' },
      ],
    });
  },
  execute_code: async ({ code }) => {
    // 实际实现会在沙箱环境中执行代码
    return 'Code executed successfully';
  },
};

// 使用工具的聊天
export async function chatWithTools(
  messages: Array<{ role: 'user' | 'assistant'; content: string | any[] }>,
  systemPrompt?: string,
  maxTurns: number = 5
) {
  const conversationMessages = [...messages];

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await anthropic.messages.create({
      model: config.defaultModel,
      max_tokens: config.maxTokens,
      system: systemPrompt,
      messages: conversationMessages,
      tools,
    });

    // 检查是否有工具调用
    const toolUseBlocks = response.content.filter(
      block => block.type === 'tool_use'
    );

    if (toolUseBlocks.length === 0) {
      // 没有工具调用，返回最终响应
      return {
        content: response.content,
        stopReason: response.stop_reason,
        usage: response.usage,
      };
    }

    // 执行工具调用
    const toolResults = await Promise.all(
      toolUseBlocks.map(async (toolBlock: any) => {
        const toolName = toolBlock.name;
        const toolInput = toolBlock.input;

        try {
          const result = await toolImplementations[toolName](toolInput);
          return {
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: result,
          };
        } catch (error) {
          return {
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: `Error: ${error}`,
            is_error: true,
          };
        }
      })
    );

    // 添加助手消息和工具结果到对话
    conversationMessages.push({
      role: 'assistant',
      content: response.content,
    });

    conversationMessages.push({
      role: 'user',
      content: toolResults,
    });
  }

  throw new Error('Max turns exceeded');
}

// 流式工具调用
export async function* streamChatWithTools(
  messages: Array<{ role: 'user' | 'assistant'; content: string | any[] }>,
  systemPrompt?: string
) {
  const conversationMessages = [...messages];

  while (true) {
    const stream = anthropic.messages.stream({
      model: config.defaultModel,
      max_tokens: config.maxTokens,
      system: systemPrompt,
      messages: conversationMessages,
      tools,
    });

    let hasToolUse = false;
    const toolUseBlocks: any[] = [];

    for await (const event of stream) {
      if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
        hasToolUse = true;
        toolUseBlocks.push(event.content_block);
      } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text', content: event.delta.text };
      }
    }

    if (!hasToolUse) {
      break;
    }

    // 执行工具
    const finalMessage = await stream.finalMessage();
    const completeToolUseBlocks = finalMessage.content.filter(
      block => block.type === 'tool_use'
    ) as any[];

    const toolResults = await Promise.all(
      completeToolUseBlocks.map(async (toolBlock) => {
        const result = await toolImplementations[toolBlock.name](toolBlock.input);
        return {
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: result,
        };
      })
    );

    yield { type: 'tool_use', tools: completeToolUseBlocks };

    conversationMessages.push(
      { role: 'assistant', content: finalMessage.content },
      { role: 'user', content: toolResults }
    );
  }
}
```

### Vision (图像理解)

```typescript
// lib/anthropic/vision.ts
import anthropic, { config } from './client';

// 单张图像理解
export async function analyzeImage(
  imageUrl: string,
  prompt: string = '请详细描述这张图片',
  model: string = config.defaultModel
) {
  const response = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'url',
              url: imageUrl,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  });

  return response.content
    .filter(block => block.type === 'text')
    .map(block => (block as any).text)
    .join('');
}

// Base64 图像
export async function analyzeImageBase64(
  imageData: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
  prompt: string
) {
  const response = await anthropic.messages.create({
    model: config.defaultModel,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageData,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  });

  return response.content
    .filter(block => block.type === 'text')
    .map(block => (block as any).text)
    .join('');
}

// 多张图像
export async function analyzeMultipleImages(
  images: Array<{ url?: string; base64?: string; mediaType?: string }>,
  prompt: string
) {
  const imageContents = images.map(img => {
    if (img.url) {
      return {
        type: 'image' as const,
        source: {
          type: 'url' as const,
          url: img.url,
        },
      };
    } else if (img.base64 && img.mediaType) {
      return {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: img.mediaType,
          data: img.base64,
        },
      };
    }
    throw new Error('Image must have either url or base64+mediaType');
  });

  const response = await anthropic.messages.create({
    model: config.defaultModel,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [...imageContents, { type: 'text', text: prompt }],
      },
    ],
  });

  return response.content
    .filter(block => block.type === 'text')
    .map(block => (block as any).text)
    .join('');
}

// 图像对比
export async function compareImages(imageUrl1: string, imageUrl2: string) {
  return analyzeMultipleImages(
    [{ url: imageUrl1 }, { url: imageUrl2 }],
    '请对比这两张图片，描述它们的相似之处和不同之处。'
  );
}

// OCR (文字识别)
export async function extractTextFromImage(imageUrl: string) {
  return analyzeImage(
    imageUrl,
    '请提取图片中的所有文字内容，保持原有的格式和布局。'
  );
}

// 图像问答
export async function imageQA(imageUrl: string, question: string) {
  return analyzeImage(imageUrl, question);
}
```

### Prompt 模板

```typescript
// lib/anthropic/prompts.ts
export const systemPrompts = {
  // 通用助手
  assistant: `你是一个有帮助的AI助手。你的任务是：
- 准确回答用户的问题
- 提供清晰、简洁的解释
- 必要时提供代码示例
- 保持友好和专业的语气`,

  // 代码助手
  codeAssistant: `你是一个专业的编程助手。你的任务是：
- 编写高质量、可维护的代码
- 遵循最佳实践和设计模式
- 添加清晰的注释
- 考虑边界情况和错误处理
- 优化性能和可读性`,

  // 数据分析
  dataAnalyst: `你是一个数据分析专家。你的任务是：
- 分析数据并提取洞察
- 提供清晰的可视化建议
- 识别趋势和异常
- 给出基于数据的建议
- 使用统计学方法验证假设`,

  // 写作助手
  writer: `你是一个专业的写作助手。你的任务是：
- 撰写清晰、引人入胜的内容
- 适应不同的写作风格和语气
- 优化结构和流畅度
- 确保语法和拼写正确
- 提供改进建议`,

  // 技术文档
  techWriter: `你是一个技术文档专家。你的任务是：
- 编写清晰、准确的技术文档
- 使用适当的术语和格式
- 提供代码示例和图表
- 考虑不同技术水平的读者
- 保持文档结构化`,

  // 翻译
  translator: `你是一个专业的翻译助手。你的任务是：
- 准确翻译内容，保持原意
- 适应目标语言的表达习惯
- 保持适当的语气和风格
- 处理专业术语和文化差异
- 提供注释（必要时）`,
};

// 构建 XML 标签格式的提示
export function buildXMLPrompt(
  tag: string,
  content: string,
  attributes?: Record<string, string>
): string {
  const attrs = attributes
    ? ' ' + Object.entries(attributes)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')
    : '';

  return `<${tag}${attrs}>
${content}
</${tag}>`;
}

// 示例：文档问答
export function buildDocumentQA Prompt(
  document: string,
  question: string
): string {
  return `${buildXMLPrompt('document', document)}

Based on the document above, please answer the following question:
${buildXMLPrompt('question', question)}

Provide a detailed answer with quotes from the document when relevant.`;
}

// 示例：少样本学习
export function buildFewShotPrompt(
  examples: Array<{ input: string; output: string }>,
  newInput: string
): string {
  const examplesText = examples
    .map(
      (ex, idx) =>
        `Example ${idx + 1}:
Input: ${ex.input}
Output: ${ex.output}`
    )
    .join('\n\n');

  return `Here are some examples:

${examplesText}

Now, please process the following:
Input: ${newInput}
Output:`;
}
```

### API 路由

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { streamChat } from '@/lib/anthropic/chat';

export async function POST(req: NextRequest) {
  const { messages, systemPrompt, model } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamChat(messages, systemPrompt, model)) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
          );
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

// app/api/vision/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/anthropic/vision';

export async function POST(req: NextRequest) {
  const { imageUrl, prompt } = await req.json();

  const result = await analyzeImage(imageUrl, prompt);

  return NextResponse.json({ result });
}

// app/api/tools/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { chatWithTools } from '@/lib/anthropic/tools';

export async function POST(req: NextRequest) {
  const { messages, systemPrompt } = await req.json();

  const result = await chatWithTools(messages, systemPrompt);

  return NextResponse.json(result);
}
```

## 最佳实践

### 1. 错误处理

```typescript
// lib/anthropic/errors.ts
import Anthropic from '@anthropic-ai/sdk';

export async function handleAnthropicCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error('Anthropic API Error:', {
        status: error.status,
        message: error.message,
        type: error.type,
      });

      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (error.status === 401) {
        throw new Error('Invalid API key.');
      }
      if (error.status === 529) {
        throw new Error('Service overloaded. Please try again later.');
      }
    }

    throw error;
  }
}
```

### 2. Token 和成本估算

```typescript
// lib/anthropic/costs.ts
export interface Usage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
}

export function estimateCost(usage: Usage, model: string = 'claude-3.5-sonnet'): number {
  const pricing: Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }> = {
    'claude-3.5-sonnet': {
      input: 3 / 1_000_000,
      output: 15 / 1_000_000,
      cacheWrite: 3.75 / 1_000_000,
      cacheRead: 0.3 / 1_000_000,
    },
    'claude-3-opus': {
      input: 15 / 1_000_000,
      output: 75 / 1_000_000,
      cacheWrite: 18.75 / 1_000_000,
      cacheRead: 1.5 / 1_000_000,
    },
    'claude-3.5-haiku': {
      input: 0.8 / 1_000_000,
      output: 4 / 1_000_000,
      cacheWrite: 1 / 1_000_000,
      cacheRead: 0.08 / 1_000_000,
    },
  };

  const rates = pricing[model] || pricing['claude-3.5-sonnet'];

  const inputCost = usage.inputTokens * rates.input;
  const outputCost = usage.outputTokens * rates.output;
  const cacheWriteCost = (usage.cacheCreationInputTokens || 0) * rates.cacheWrite;
  const cacheReadCost = (usage.cacheReadInputTokens || 0) * rates.cacheRead;

  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}
```

### 3. 重试机制

```typescript
// lib/anthropic/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // 529 (overloaded) 或 429 (rate limit) 时重试
      if (error.status === 529 || error.status === 429) {
        if (i < maxRetries - 1) {
          await new Promise(resolve =>
            setTimeout(resolve, backoffMs * Math.pow(2, i))
          );
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError!;
}
```

### 4. 批处理

```typescript
// lib/anthropic/batch.ts
import pLimit from 'p-limit';

const limit = pLimit(5); // 并发限制

export async function batchProcess(
  items: string[],
  processor: (item: string) => Promise<string>
): Promise<string[]> {
  return Promise.all(
    items.map(item => limit(() => processor(item)))
  );
}

// 批量翻译
export async function batchTranslate(
  texts: string[],
  targetLanguage: string
): Promise<string[]> {
  return batchProcess(texts, async (text) => {
    const response = await chat(
      [{ role: 'user', content: `Translate to ${targetLanguage}: ${text}` }],
      systemPrompts.translator
    );
    return response.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('');
  });
}
```

## 常用命令

```bash
# 安装依赖
npm install @anthropic-ai/sdk

# 开发
npm run dev

# 测试
npm test
```

## 部署配置

### 环境变量

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-xxx
```

### Next.js 配置

```typescript
// next.config.js
const nextConfig = {
  // 增加超时时间
  serverRuntimeConfig: {
    maxDuration: 60,
  },
};

module.exports = nextConfig;
```

## 扩展资源

- [Anthropic API 文档](https://docs.anthropic.com/)
- [Claude API 参考](https://docs.anthropic.com/claude/reference)
- [工具使用指南](https://docs.anthropic.com/claude/docs/tool-use)
- [Vision 指南](https://docs.anthropic.com/claude/docs/vision)
- [Prompt 缓存](https://docs.anthropic.com/claude/docs/prompt-caching)
- [定价](https://www.anthropic.com/pricing)
