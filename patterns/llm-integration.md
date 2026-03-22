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

---

## RAG Pipeline Completo

```
Query → Embedding → Vector Search → Re-ranking → Context Assembly → LLM → Response
```

### 1. Chunking
- **Tamanho**: 500-1000 tokens por chunk
- **Overlap**: 10-15% entre chunks adjacentes
- **Limites semanticos**: respeitar paragrafos, secoes, headers
- **Metadata**: incluir fonte, pagina, secao em cada chunk

### 2. Embedding
- **Modelo**: text-embedding-3-small (custo) ou text-embedding-3-large (qualidade)
- **Batch processing**: embeddings em lotes de 100-500
- **Dimensoes**: 1536 (small) ou 3072 (large) — verificar limite do vector DB

### 3. Indexacao
- **HNSW**: rapido, aproximado, bom para producao (pgvector, Pinecone)
- **IVFFlat**: mais preciso, mais lento, bom para datasets menores
- **Hybrid**: combinar vector index + full-text index (GIN) na mesma tabela

### 4. Busca Hibrida
```
score_final = alpha * vector_score + (1 - alpha) * keyword_score
```
- Vector search: captura semantica (sinonimos, contexto)
- Full-text search: captura exata (nomes, codigos, termos tecnicos)
- **Re-ranking**: cross-encoder para reordenar top-N resultados

### 5. Context Assembly
- Ordenar chunks por relevancia
- Limitar contexto total (70-80% do token budget para context, 20-30% para resposta)
- Incluir metadata para o LLM (fonte, data, tipo)

## Prompt Management (Versionamento)

```
prompts/
├── order-summary/
│   ├── v1.0.md    # versao original
│   ├── v1.1.md    # ajuste de tom
│   └── v2.0.md    # reestruturacao
└── config.json    # versao ativa, % de trafego
```

- Cada prompt tem versao semantica
- **A/B testing**: 10% trafego para nova versao, comparar metricas (qualidade, latencia, custo)
- **Rollback imediato** se metricas degradarem
- **Armazenar fora do codigo**: DB, config service, ou arquivo versionado separado
- **Template variables** com validacao — nao aceitar template sem variavel obrigatoria

## Model Serving Strategies

| Estrategia | Descricao | Risco | Quando |
|-----------|-----------|-------|--------|
| Canary | 5-10% trafego no novo modelo | Baixo | Default para mudancas |
| Shadow | Novo modelo processa em paralelo, sem servir | Zero | Avaliar qualidade sem risco |
| Blue/Green | Switch instantaneo entre versoes | Medio | Mudancas com rollback rapido |

## Otimizacao de Custos (Consolidado)

| Tecnica | Economia | Implementacao |
|---------|----------|---------------|
| Roteamento por complexidade | 40-60% | Classificador haiku/sonnet/opus |
| Cache semantico | 20-40% | Redis + similarity threshold 0.95 |
| Compressao de contexto | 10-30% | Sumarizar chunks antigos do historico |
| Batch requests | 10-20% | Agrupar requests similares em janela de tempo |
| Client-side inference (WebLLM) | 100% | Tasks leves no browser, zero API calls |

---

## Client-Side Inference (WebLLM)

### Quando Usar
- Autocomplete, classificacao, extracao de entidades — tasks leves
- PWAs que precisam funcionar offline
- Privacidade: dados nunca saem do browser
- Custo: zero tokens de API

### Quando NAO Usar
- Raciocinio complexo, analise profunda, codigo
- Contexto > 4K tokens (modelos pequenos tem janela limitada)
- Dispositivos sem WebGPU (fallback necessario)

### Setup Basico
```typescript
// src/lib/llm/webllm.ts
import { CreateMLCEngine } from '@mlc-ai/web-llm';

let engine: any = null;

export async function initWebLLM() {
  if (engine) return engine;
  engine = await CreateMLCEngine('Phi-3.5-mini-instruct-q4f16_1-MLC', {
    initProgressCallback: (progress) => {
      console.log(`Loading model: ${(progress.progress * 100).toFixed(0)}%`);
    },
  });
  return engine;
}

export async function classifyLocal(text: string, categories: string[]): Promise<string> {
  const llm = await initWebLLM();
  const response = await llm.chat.completions.create({
    messages: [
      { role: 'system', content: `Classify into one of: ${categories.join(', ')}. Reply with ONLY the category.` },
      { role: 'user', content: text },
    ],
    temperature: 0,
    max_tokens: 50,
  });
  return response.choices[0].message.content.trim();
}
```

### Modelos Recomendados por Caso

| Caso | Modelo | Tamanho | Requisito |
|------|--------|---------|-----------|
| Classificacao, autocomplete | Phi-3.5-mini | ~2GB VRAM | WebGPU (Chrome 113+) |
| Embeddings simples | Gemma-2B | ~1.5GB | WebGPU |
| Conversacao basica | Llama-3.2-1B | ~1GB | WebGPU |

### Fallback Pattern
```typescript
async function smartClassify(text: string, categories: string[]) {
  // Tentar client-side primeiro (gratis, rapido)
  if ('gpu' in navigator) {
    try {
      return await classifyLocal(text, categories);
    } catch { /* fallback to API */ }
  }
  // Fallback para API (custo, mas funciona em qualquer browser)
  return await classifyViaAPI(text, categories);
}
```

---

## Inference.sh Runtime (Agent Execution)

### O Que E
Runtime de producao para agents AI com execucao duravel, observabilidade, e 150+ integracoes pre-prontas. Alternativa/complemento ao Vercel Workflow DevKit.

### Quando Considerar
- Agents que precisam de durabilidade (checkpoint, retry, replay)
- Multi-agent systems com orquestracao complexa
- Precisa de 150+ tools pre-prontas (sem implementar cada integracao)
- Observabilidade de agent steps nativa

### Diferenca vs Vercel Workflow DevKit

| Aspecto | Inference.sh | Vercel WDK |
|---------|-------------|------------|
| Vendor | inference.sh | Vercel |
| Lock-in | API-based, portavel | Tight Vercel integration |
| Tools pre-prontas | 150+ | Voce cria as suas |
| Deploy | Workers (cloud/self-hosted) | Vercel Functions |
| UI Components | ui.inference.sh | AI Elements |
| Custo | Free tier + paid | Vercel pricing |

### Recomendacao
- **Projetos Vercel-first** → Workflow DevKit (melhor integracao)
- **Multi-cloud / self-hosted** → Inference.sh (mais portavel)
- **UI components de agent** → Usar os de ambos conforme necessidade
