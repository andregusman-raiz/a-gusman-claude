# AI/UI Component Stack (Cross-Project)

## Principio: Layered Component Architecture

Cada camada resolve um problema especifico. Nao reinventar o que ja existe.

```
Layer 0: Tailwind CSS          — utility classes, responsive, dark mode
Layer 1: shadcn/ui             — base primitives (Button, Card, Dialog, Form, Table)
Layer 2: AI Elements           — AI-native components (Message, Tool, Reasoning, Workflow)
Layer 3: Cult UI               — animated components, effects, marketing UI
Layer 4: Tool UI               — AI tool call renderers (approval, charts, progress)
Layer 5: HextaUI               — pre-composed blocks, alternative themes
Layer 6: Inference.sh UI       — agent runtime components (durable execution UI)
Layer 7: WebLLM                — client-side LLM inference (offline, zero cost)
```

## Stack Completa por Cenario

### Chat AI (padrao)
```
shadcn/ui (base) + AI Elements (Message, Conversation, PromptInput) + AI SDK useChat
```
- Instalacao: `npx shadcn@latest init` + `npx ai-elements@latest` + `npm install ai @ai-sdk/react`
- Server: `streamText()` + `toUIMessageStreamResponse()`
- Client: `useChat({ transport: new DefaultChatTransport({ api }) })`
- NUNCA renderizar AI text como `{text}` — sempre `<Message>` ou `<MessageResponse>`

### Chat AI com Tool Calls
```
shadcn/ui + AI Elements (Message, Tool) + Tool UI (renderers especificos)
```
- AI Elements fornece `<Tool>` generico
- Tool UI fornece 25+ renderers especializados: aprovacao, tabelas, charts, progresso
- Cada Tool UI component tem schema Zod para validacao

### Dashboard / Admin Panel
```
shadcn/ui (Table, Card, Tabs, Form) + HextaUI (blocks compostos) + Cult UI (animacoes sutis)
```
- HextaUI para composicoes maiores (form sections, stat cards, filter panels)
- Cult UI para micro-animacoes (Animated Number, Direction Aware Tabs)

### Landing Page / Marketing
```
shadcn/ui (base) + Cult UI (Hero effects, Logo Carousel, Gradient Heading)
```
- Cult UI: Hero Dithering, Liquid Metal, Fractal Grid, 3D Carousel
- Para sites premium: Shader Lens Blur, LightBoard, Text Animate

### Agent com Aprovacao Humana
```
shadcn/ui + AI Elements (Workflow Canvas) + Inference.sh UI (Agent, Tool lifecycle)
```
- Inference.sh UI: pending -> progress -> approval -> results
- Widgets declarativos (JSON -> UI automatico)
- Human-in-the-loop nativo

### PWA / Offline AI
```
shadcn/ui + WebLLM (inference no browser via WebGPU)
```
- Modelos pequenos: Phi-3-mini (~2GB), Gemma-2B (~1.5GB)
- API compativel com OpenAI (streaming, function calling, JSON mode)
- Zero custo de API, privacidade total
- Requisito: WebGPU (Chrome 113+, Edge 113+)

### Workflow Visual
```
shadcn/ui + AI Elements (Canvas, Node, Edge, Connection, Controls)
```
- Para visualizar execucao de agents, pipelines, DAGs
- Composavel com Tool UI para renderizar outputs de cada step

---

## Instalacao Quick Reference

```bash
# Layer 1: shadcn/ui (base — obrigatorio)
npx shadcn@latest init

# Layer 2: AI Elements (obrigatorio para qualquer AI text)
npx ai-elements@latest

# Layer 3: Cult UI (registry-based, copy-paste)
# Visitar cult-ui.com e copiar componente desejado para seu projeto

# Layer 4: Tool UI
npm install tool-ui

# Layer 5: HextaUI (registry-based)
# Visitar hextaui.com e copiar componente/block desejado

# Layer 6: Inference.sh UI (registry-based)
# Visitar ui.inference.sh e instalar via shadcn registry

# Layer 7: WebLLM
npm install @mlc-ai/web-llm
```

---

## Decision Matrix

| Preciso de... | Use | NAO use |
|---------------|-----|---------|
| Botao, Card, Dialog, Form | shadcn/ui | Cult UI, raw HTML |
| Mensagem de chat AI | AI Elements `<Message>` | `<p>{text}</p>` |
| Markdown AI (nao-chat) | AI Elements `<MessageResponse>` | react-markdown manual |
| Tool call como UI bonita | Tool UI (renderer especifico) | JSON.stringify no chat |
| Animacao de hero section | Cult UI (Hero Dithering, etc) | CSS animation manual |
| Numero animado (dashboard) | Cult UI `<AnimatedNumber>` | framer-motion manual |
| Agent com approval flow | Inference.sh UI `<Agent>` | Build from scratch |
| Autocomplete offline | WebLLM + input custom | API call para task trivial |
| Workflow/pipeline visual | AI Elements (Canvas+Node) | React Flow from scratch |
| Block composto (dashboard) | HextaUI | Montar do zero com shadcn |

---

## Compatibilidade

Todas as libs sao compativeis entre si pois compartilham base:
- **Tailwind CSS** — sistema de styling
- **Radix UI** — primitivas de acessibilidade
- **shadcn/ui** — componentes base

Conflitos conhecidos: nenhum. Todas sao additive (adicionam componentes, nao sobrescrevem).

---

## Anti-Patterns

- NUNCA instalar Cult UI ou Tool UI SEM shadcn/ui como base
- NUNCA usar WebLLM para tarefas que precisam de raciocinio complexo (use AI Gateway)
- NUNCA renderizar AI text como raw string — sempre AI Elements
- NUNCA criar componente de chart custom se Tool UI ja tem um renderer
- NUNCA usar Inference.sh UI apenas pelos componentes — so faz sentido se usar o runtime tambem
- NUNCA misturar sistemas de temas (ficar com shadcn/ui CSS vars, nao adicionar sistema paralelo)

---

## Links

| Lib | Site | GitHub |
|-----|------|--------|
| shadcn/ui | ui.shadcn.com | github.com/shadcn-ui/ui |
| AI Elements | elements.ai-sdk.dev | — |
| Cult UI | cult-ui.com | github.com/nolly-studio/cult-ui |
| Tool UI | tool-ui.com | github.com/assistant-ui/tool-ui |
| HextaUI | hextaui.com | github.com/preetsuthar17/HextaUI |
| Inference.sh UI | ui.inference.sh | — |
| WebLLM | webllm.mlc.ai | github.com/mlc-ai/web-llm |
