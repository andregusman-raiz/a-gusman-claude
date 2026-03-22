# Realtime Communication

## Decision Matrix

| Criterio | WebSocket | SSE | Long Polling | Supabase Realtime |
|----------|-----------|-----|--------------|-------------------|
| Direcao | Bidirecional | Server → Client | Server → Client | Bidirecional |
| Protocolo | ws:// | HTTP | HTTP | WebSocket (interno) |
| Reconexao | Manual | Automatica | Manual | Automatica |
| Complexidade | Alta | Baixa | Baixa | Muito baixa |
| Escalabilidade | Redis Pub/Sub | Nativa | Polling = carga | Managed |
| Melhor para | Chat, games, collab | Notifications, feeds | Legacy, firewalls | Supabase apps |

## WebSocket

### Quando Usar
- Comunicacao bidirecional frequente (chat, colaboracao em tempo real, gaming)
- Baixa latencia critica (<50ms)
- Volume alto de mensagens

### Implementacao Base
```typescript
// Server (Next.js custom server ou standalone)
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    // Broadcast para todos conectados
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  });

  // Heartbeat para detectar conexoes mortas
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
});

// Ping interval
setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30_000);
```

### Escala Horizontal com Redis Pub/Sub
```typescript
import Redis from 'ioredis';

const pub = new Redis();
const sub = new Redis();

// Cada instancia do server subscreve ao canal
sub.subscribe('chat');
sub.on('message', (channel, message) => {
  // Broadcast para clientes LOCAIS deste server
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

// Ao receber mensagem de um cliente, publicar no Redis
wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    pub.publish('chat', data.toString());
  });
});
```

### Sticky Sessions
Em ambientes com load balancer, garantir que reconexoes vao para o mesmo server:
- **Cookie-based**: load balancer seta cookie na primeira conexao
- **IP hash**: load balancer roteia por IP (problemas com NAT)
- **Redis**: state compartilhado, qualquer server atende (RECOMENDADO)

## SSE (Server-Sent Events)

### Quando Usar
- Dados fluem APENAS do server para o client (notifications, feeds, streaming de IA)
- Reconexao automatica desejavel
- Simplicidade > bidirecionalidade

### Implementacao
```typescript
// app/api/events/route.ts (Next.js)
export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(
          `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        ));
      };

      // Enviar eventos periodicamente ou sob demanda
      const interval = setInterval(() => {
        send('heartbeat', { time: Date.now() });
      }, 15_000);

      // Cleanup ao desconectar
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
```

### Reconexao Automatica
- Browser reconecta automaticamente com `Last-Event-ID`
- Server usa o ID para reenviar eventos perdidos
```typescript
// Incluir ID em cada evento
controller.enqueue(encoder.encode(
  `id: ${eventId}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`
));
```

## Supabase Realtime

### Channels
```typescript
const channel = supabase.channel('room1');

// Broadcast (qualquer dado, sem persistencia)
channel.on('broadcast', { event: 'cursor' }, (payload) => {
  updateCursor(payload);
});

// Presence (quem esta online)
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  updateOnlineUsers(state);
});

// Postgres Changes (dados persistidos)
channel.on('postgres_changes',
  { event: 'INSERT', schema: 'public', table: 'messages' },
  (payload) => { addMessage(payload.new); }
);

channel.subscribe();
```

### Quando Usar Cada
| Feature | Uso | Persistencia |
|---------|-----|-------------|
| Broadcast | Cursores, typing indicators | Nao |
| Presence | Lista de usuarios online | Nao |
| Postgres Changes | Novos dados, updates | Sim (DB) |

## Anti-Patterns
- **Polling quando deveria ser push**: 1000 clientes polling a cada 1s = 1000 req/s desnecessarias
- **WebSocket para dados unidirecionais**: SSE e mais simples e tem reconexao automatica
- **Sem heartbeat**: conexoes "zombie" acumulam. Sempre implementar ping/pong.
- **Sem backpressure**: server envia mais rapido do que client processa. Implementar flow control.
- **WebSocket em Vercel**: Vercel nao suporta WebSocket nativo. Usar Supabase Realtime, Pusher, ou Ably.
- **Sem rate limiting em mensagens**: cliente malicioso envia 1000 msgs/s. Limitar no server.
