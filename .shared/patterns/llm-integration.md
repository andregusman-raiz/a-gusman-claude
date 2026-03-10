# LLM Integration Patterns (Cross-Project)

## Principio: Provider Agnostico

NUNCA acoplar logica de negocio a um provider especifico.
Toda integracao LLM passa por camada de abstracao.

## Provider Abstraction

### Interface Base
```typescript
// src/lib/llm/types.ts
interface LLMProvider {
  id: string;
  name: string;
  chat(params: ChatParams): Promise<ChatResponse>;
  stream(params: ChatParams): AsyncIterable<StreamChunk>;
  countTokens(text: string): number;
  maxContextTokens: number;
  costPer1kInput: number;
  costPer1kOutput: number;
}

interface ChatParams {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: ToolDefinition[];
}

interface ChatResponse {
  content: string;
  usage: { inputTokens: number; outputTokens: number };
  model: string;
  finishReason: 'stop' | 'length' | 'tool_use';
}

interface StreamChunk {
  type: 'text_delta' | 'usage' | 'done';
  text?: string;
  usage?: { inputTokens: number; outputTokens: number };
}
```

### Provider Registry
```typescript
// src/lib/llm/registry.ts
import { AnthropicProvider } from './providers/anthropic';
import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';

const providers: Record<string, LLMProvider> = {
  anthropic: new AnthropicProvider(),
  openai: new OpenAIProvider(),
  gemini: new GeminiProvider(),
};

export function getProvider(id: string): LLMProvider {
  const provider = providers[id];
  if (!provider) throw new Error(`Unknown LLM provider: ${id}`);
  return provider;
}

export function getAllProviders(): LLMProvider[] {
  return Object.values(providers);
}
```

### Anthropic Provider (exemplo)
```typescript
// src/lib/llm/providers/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider implements LLMProvider {
  id = 'anthropic';
  name = 'Anthropic';
  maxContextTokens = 200_000;
  costPer1kInput = 0.003;   // sonnet
  costPer1kOutput = 0.015;  // sonnet

  private client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  async chat(params: ChatParams): Promise<ChatResponse> {
    const response = await this.client.messages.create({
      model: params.model,
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature ?? 0.7,
      system: params.systemPrompt,
      messages: params.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    return {
      content: response.content[0].type === 'text'
        ? response.content[0].text
        : '',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      model: response.model,
      finishReason: response.stop_reason === 'end_turn' ? 'stop' : 'length',
    };
  }

  async *stream(params: ChatParams): AsyncIterable<StreamChunk> {
    const stream = this.client.messages.stream({
      model: params.model,
      max_tokens: params.maxTokens ?? 4096,
      system: params.systemPrompt,
      messages: params.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text_delta', text: event.delta.text };
      }
    }

    const finalMessage = await stream.finalMessage();
    yield {
      type: 'usage',
      usage: {
        inputTokens: finalMessage.usage.input_tokens,
        outputTokens: finalMessage.usage.output_tokens,
      },
    };
    yield { type: 'done' };
  }

  countTokens(text: string): number {
    // Approximation: 1 token ~= 4 chars for Claude
    return Math.ceil(text.length / 4);
  }
}
```

## Model Selection (Cost vs Quality)

### Decision Matrix
| Caso de Uso | Provider | Model | Input $/1K | Output $/1K |
|-------------|----------|-------|------------|-------------|
| Chat simples, classificacao | Anthropic | haiku | $0.00025 | $0.00125 |
| Implementacao, debug | Anthropic | sonnet | $0.003 | $0.015 |
| Arquitetura, analise profunda | Anthropic | opus | $0.015 | $0.075 |
| Embedding | OpenAI | text-embedding-3-small | $0.00002 | — |
| Search + citations | Perplexity | sonar-pro | $0.003 | $0.015 |

### Model Router
```typescript
// src/lib/llm/router.ts
type TaskType = 'classify' | 'summarize' | 'generate' | 'analyze' | 'embed';

interface ModelConfig {
  provider: string;
  model: string;
  maxTokens: number;
}

const MODEL_ROUTES: Record<TaskType, ModelConfig> = {
  classify:  { provider: 'anthropic', model: 'claude-haiku-4-5', maxTokens: 256 },
  summarize: { provider: 'anthropic', model: 'claude-haiku-4-5', maxTokens: 1024 },
  generate:  { provider: 'anthropic', model: 'claude-sonnet-4-5', maxTokens: 4096 },
  analyze:   { provider: 'anthropic', model: 'claude-sonnet-4-5', maxTokens: 8192 },
  embed:     { provider: 'openai', model: 'text-embedding-3-small', maxTokens: 0 },
};

export function getModelForTask(task: TaskType): ModelConfig {
  return MODEL_ROUTES[task];
}
```

## Streaming SSE (Next.js App Router)

### Route Handler
```typescript
// src/app/api/chat/route.ts
import { getProvider } from '@/lib/llm/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { messages, model, provider: providerId } = await req.json();
  const provider = getProvider(providerId ?? 'anthropic');

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of provider.stream({ model, messages })) {
          const data = `data: ${JSON.stringify(chunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        const errData = `data: ${JSON.stringify({ type: 'error', message: String(error) })}\n\n`;
        controller.enqueue(encoder.encode(errData));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

### Client Hook
```typescript
// src/hooks/useChat.ts
export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (content: string) => {
    const userMsg: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    abortRef.current = new AbortController();
    let assistantText = '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], model: 'claude-sonnet-4-5' }),
        signal: abortRef.current.signal,
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
          const chunk = JSON.parse(line.slice(6));
          if (chunk.type === 'text_delta') {
            assistantText += chunk.text;
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === 'assistant') {
                last.content = assistantText;
              } else {
                updated.push({ role: 'assistant', content: assistantText });
              }
              return updated;
            });
          }
        }
      }
    } finally {
      setIsStreaming(false);
    }
  }, [messages]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { messages, send, stop, isStreaming };
}
```

## Token Budget Management

```typescript
// src/lib/llm/budget.ts
interface TokenBudget {
  maxInputTokens: number;
  maxOutputTokens: number;
  reserveTokens: number; // for system prompt + tools
}

export function fitMessagesToBudget(
  messages: Message[],
  budget: TokenBudget,
  countFn: (text: string) => number
): Message[] {
  const systemReserve = budget.reserveTokens;
  const available = budget.maxInputTokens - systemReserve;

  // Always keep first (system context) and last (user query)
  const first = messages[0];
  const last = messages[messages.length - 1];
  const firstTokens = countFn(first.content);
  const lastTokens = countFn(last.content);

  if (firstTokens + lastTokens > available) {
    // Truncate last message if needed
    return [first, last];
  }

  // Fill middle messages from most recent
  let remaining = available - firstTokens - lastTokens;
  const middle: Message[] = [];

  for (let i = messages.length - 2; i > 0; i--) {
    const tokens = countFn(messages[i].content);
    if (tokens > remaining) break;
    remaining -= tokens;
    middle.unshift(messages[i]);
  }

  return [first, ...middle, last];
}
```

## Fallback Strategy

```typescript
// src/lib/llm/fallback.ts
const FALLBACK_CHAIN: string[] = ['anthropic', 'openai', 'gemini'];

export async function chatWithFallback(
  params: ChatParams,
  modelMap: Record<string, string> // provider -> model name
): Promise<ChatResponse> {
  const errors: Array<{ provider: string; error: string }> = [];

  for (const providerId of FALLBACK_CHAIN) {
    try {
      const provider = getProvider(providerId);
      const model = modelMap[providerId];
      if (!model) continue;

      return await provider.chat({ ...params, model });
    } catch (error) {
      errors.push({ provider: providerId, error: String(error) });
      // Continue to next provider
    }
  }

  throw new Error(
    `All providers failed: ${errors.map(e => `${e.provider}: ${e.error}`).join('; ')}`
  );
}
```

## Prompt Templates

```typescript
// src/lib/llm/prompts.ts
interface PromptTemplate {
  system: string;
  buildUserMessage: (vars: Record<string, string>) => string;
}

const TEMPLATES: Record<string, PromptTemplate> = {
  summarize: {
    system: 'You are a concise summarizer. Output only the summary, no preamble.',
    buildUserMessage: ({ text, maxWords }) =>
      `Summarize the following in ${maxWords ?? '100'} words or less:\n\n${text}`,
  },
  classify: {
    system: 'You are a classifier. Respond with ONLY the category name.',
    buildUserMessage: ({ text, categories }) =>
      `Classify this text into one of: ${categories}\n\nText: ${text}`,
  },
};

export function buildPrompt(
  templateId: string,
  vars: Record<string, string>
): { systemPrompt: string; messages: Message[] } {
  const template = TEMPLATES[templateId];
  if (!template) throw new Error(`Unknown template: ${templateId}`);

  return {
    systemPrompt: template.system,
    messages: [{ role: 'user', content: template.buildUserMessage(vars) }],
  };
}
```

## Error Handling

### Erro por Tipo
| Erro | Status | Acao |
|------|--------|------|
| Rate limit (429) | Retry com backoff | `Retry-After` header, max 3 tentativas |
| Timeout | Retry 1x | Reduzir `maxTokens` na segunda tentativa |
| Context overflow | Trim messages | Usar `fitMessagesToBudget` e retentar |
| Auth error (401) | Fail fast | Logar, nao retentar — credential issue |
| Server error (500+) | Fallback | Trocar provider via fallback chain |

### Rate Limit Handler
```typescript
async function withRateLimit<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      if (error instanceof Error && 'status' in error && (error as any).status === 429) {
        const retryAfter = (error as any).headers?.['retry-after'] ?? 2 ** attempt;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Rate limit exceeded after max retries');
}
```

## NUNCA
- Hardcode API keys no codigo — sempre `process.env`
- Logar prompt completo em producao (PII, custo de storage)
- Ignorar `usage` do response — sempre trackear para billing
- Chamar LLM em Server Component sem cache/revalidate
- Stream sem AbortController — usuario nao consegue cancelar
- Usar `any` para response types — tipar com interfaces acima

## Checklist de Integracao

- [ ] Provider abstraction implementada (nao acoplado)
- [ ] Model routing por task type configurado
- [ ] Streaming com SSE funcionando (POST, nao GET)
- [ ] Token budget management ativo
- [ ] Fallback chain configurada (>= 2 providers)
- [ ] Rate limit handling com retry
- [ ] AbortController no client para cancelamento
- [ ] Usage tracking para billing/monitoring
