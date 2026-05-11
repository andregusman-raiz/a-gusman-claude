---
id: chat-ai-streaming
name: AI Chat with Streaming and Tool Calls
category: ai
source: automata
complexity: high
---

# AI Chat with Streaming

## What it solves
Chat interface with AI streaming responses, structured tool-call extraction from message parts, and live side-panel preview of generated artifacts.

## Best implementation
- **Chat Panel**: `~/Claude/GitHub/automata/components/chat/chat-panel.tsx`
- **Messages**: `~/Claude/GitHub/automata/components/chat/chat-messages.tsx`
- **Input**: `~/Claude/GitHub/automata/components/chat/chat-input.tsx`
- **API Route**: `~/Claude/GitHub/automata/app/api/chat/route.ts`

## Key features
- **AI SDK v6**: `useChat` with `DefaultChatTransport` for clean transport separation
- **Tool call extraction**: traverses `msg.parts` to extract structured objects from tool results
- **Live artifact preview**: sticky side panel shows generated Recipe in real-time
- **Status guard**: input disabled during `streaming` or `submitted`
- **Run orchestration**: save artifact + execute via API + 3s polling for step progress
- **Streaming protocol**: SSE via `toUIMessageStreamResponse()`

## Props interface
```ts
interface ChatPanelProps {
  conversationId: string;
  initialMessages?: UIMessage[];
}
```

## Key patterns
```ts
// Transport setup (v6 pattern)
const transport = new DefaultChatTransport({
  api: '/api/chat',
  body: { conversationId }
});
const { messages, sendMessage, status } = useChat({ id, messages, transport });

// Tool call extraction from parts
const recipe = useMemo(() => {
  for (const msg of [...messages].reverse()) {
    for (const part of msg.parts) {
      if (part.type === 'tool-result' && part.toolName === 'createRecipe') {
        return part.result as Recipe;
      }
    }
  }
}, [messages]);
```

## Dependencies
- ai, @ai-sdk/react (useChat, DefaultChatTransport, UIMessage)
- Server: streamText + toUIMessageStreamResponse
