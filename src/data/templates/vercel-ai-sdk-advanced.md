# Vercel AI SDK Template

## Tech Stack
- ai v3.x
- @ai-sdk/openai v0.x
- React 18+
- Next.js 14+

## Core Patterns

### Chat Completion
```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text } = await generateText({
  model: openai('gpt-4-turbo'),
  prompt: 'Explain quantum computing in one paragraph.',
});
```

### Streaming Response
```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = await streamText({
  model: openai('gpt-4-turbo'),
  messages: [{ role: 'user', content: 'Hello!' }],
});

return result.toAIStreamResponse();
```

### React Hook
```typescript
import { useChat } from 'ai/react';

export const ChatComponent = () => {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          {m.role}: {m.content}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
      </form>
    </div>
  );
};
```

### API Route
```typescript
// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages,
  });

  return result.toDataStreamResponse();
}
```

### Tool Calling
```typescript
import { generateText, tool } from 'ai';
import { z } from 'zod';

const { text, toolCalls } = await generateText({
  model: openai('gpt-4-turbo'),
  tools: {
    weather: tool({
      description: 'Get weather for a location',
      parameters: z.object({
        location: z.string(),
      }),
      execute: async ({ location }) => {
        return { temperature: 72, location };
      },
    }),
  },
  prompt: 'What is the weather in San Francisco?',
});
```

## Common Commands

```bash
npm install ai @ai-sdk/openai
npm run dev
```

## Related Resources
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [AI SDK Examples](https://sdk.vercel.ai/examples)
