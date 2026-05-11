# Serviços Relacionados ao Layers Portal

## Visão Geral

O Layers Portal se integra com diversos outros serviços da plataforma Layers. Este documento apresenta uma visão geral de cada um.

---

## 1. Notificações

### Descrição
Sistema de notificações que permite enviar mensagens para usuários através de múltiplos canais.

### Canais Disponíveis

| Canal | Descrição |
|-------|-----------|
| **Push Notifications** | Notificações no celular/tablet (app) ou navegador |
| **Email** | Enviado para endereços cadastrados na Layers |

### Capacidades

- **Segmentação de Público**: Direcionar por tópicos (usuário, membro, turma) e perfis de acesso
- **Seleção de Canal**: Push, email ou ambos simultaneamente
- **Ações de Clique**: Definir comportamento ao clicar na notificação
- **Agendamento**: Enviar imediatamente ou agendar para data/hora específica

### Exemplo de Uso com Portal

```javascript
// No seu backend, após ação no portal
async function notificarUsuario(userId, mensagem) {
  await fetch('https://api.layers.digital/v1/notifications/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LAYERS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      target: { userId },
      channels: ['push', 'email'],
      title: 'Notificação do Portal',
      body: mensagem,
      action: {
        type: 'portal',
        portalId: 'meu-portal'
      }
    })
  });
}
```

---

## 2. API Hub

### Descrição
Sistema de comunicação estruturada entre apps através de **actions** - um protocolo que define formatos de comunicação.

### Tipos de Comunicação

#### Request & Respond (Síncrono)
Apps que desejam consumir informações enviam requisições para apps provedores.

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Consumidor  │────▶│   Layers    │────▶│   Provedor   │
│   (Portal)   │◀────│   API Hub   │◀────│    (ERP)     │
└──────────────┘     └─────────────┘     └──────────────┘
```

**Fluxo:**
1. Consumidor descobre provedores via `/v1/services/discover/:action`
2. Consumidor envia POST com payload
3. Layers adiciona `context` e `secret`, encaminha ao provedor
4. Provedor retorna dados no formato especificado
5. Layers repassa resposta ao consumidor

#### Publish & Subscribe (Assíncrono)
Apps publicam eventos urgentes que Layers distribui aos assinantes.

**Fluxo:**
1. Publicador chama `POST /services/publish/:action`
2. Layers encaminha mensagem aos assinantes
3. Assinante chama action relevante para obter dados atualizados

### Actions Disponíveis

Alguns exemplos de actions disponíveis:

| Action | Descrição |
|--------|-----------|
| `getGrades` | Obter notas acadêmicas |
| `getAttendance` | Obter frequência |
| `getSchedule` | Obter horários |
| `getFinancial` | Obter informações financeiras |
| `getCalendarEvents` | Obter eventos do calendário |

---

## 3. Sincronização de Dados

### Descrição
Serviço de sincronização e normalização de dados entre sistemas externos e a plataforma Layers.

### Modelos de Sincronização

| Modelo | Descrição |
|--------|-----------|
| **Importação** | Traz dados de sistemas externos para Layers |
| **Exportação** | Distribui dados processados para parceiros |

### Tipos de API

#### Sincronização Incremental
Obtém apenas registros modificados recentemente:

- Usuários atualizados
- Membros atualizados
- Grupos atualizados
- Componentes atualizados

```javascript
// Exemplo: obter usuários atualizados desde última sincronização
const response = await fetch(
  `https://api.layers.digital/v1/sync/users/updated?since=${ultimaSincronizacao}`,
  {
    headers: {
      'Authorization': `Bearer ${LAYERS_TOKEN}`
    }
  }
);
const usuarios = await response.json();
```

#### Sincronização Total
Atualização completa dos dados:

1. Preparar sincronização: `POST /v1/sync/prepare`
2. Executar sincronização completa
3. Verificar status: `GET /v1/sync/status`

---

## 4. Apps Visualizadores

### Descrição
Aplicativos pré-construídos pela Layers, integrados com ERPs para visualização de dados normalizados.

### Apps Disponíveis

| App | Descrição |
|-----|-----------|
| **Notas Acadêmicas** | Visualização de notas e boletins |
| **Visão Financeira** | Informações de cobranças e pagamentos |
| **Frequência** | Registros de presença |
| **Registros Acadêmicos** | Histórico acadêmico |
| **Visão de Horários** | Grade de horários |
| **Ficha Médica** | Informações de saúde |
| **Calendário** | Eventos e compromissos |
| **Relatórios** | Relatórios diversos |
| **Entrada e Saída** | Controle de acesso |

### Integração com Portal

Seu portal pode complementar os apps visualizadores ou consumir dados através do API Hub.

```javascript
// Exemplo: redirecionar para app visualizador
function verNotas() {
  LayersPortal("go", {
    app: "notas-academicas"
  });
}
```

---

## 5. Pagamentos

### Descrição
Serviço para gerenciar e processar transações financeiras na plataforma.

### Funcionalidades

- Gerenciamento de lojas
- Catálogo de produtos
- Processamento de transações
- Cotação de frete
- Inventário

### APIs Disponíveis

| Endpoint | Descrição |
|----------|-----------|
| Prover Tabs de loja | Gerenciar abas da loja |
| Prover Itens da tab | Gerenciar produtos |
| Prover cotação de frete | Calcular custos de entrega |

---

## Diagrama de Integração

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PLATAFORMA LAYERS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐                 │
│  │    PORTAL     │   │    API HUB    │   │   SYNC DATA   │                 │
│  │  (Seu App)    │   │               │   │               │                 │
│  └───────┬───────┘   └───────┬───────┘   └───────┬───────┘                 │
│          │                   │                   │                          │
│          │                   ▼                   ▼                          │
│          │           ┌───────────────────────────────────┐                  │
│          │           │        DADOS NORMALIZADOS         │                  │
│          │           └───────────────────────────────────┘                  │
│          │                   │                                              │
│          ▼                   ▼                                              │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐                 │
│  │   NOTIFICA-   │   │     APPS      │   │   PAGAMENTOS  │                 │
│  │     ÇÕES      │   │ VISUALIZADORES│   │               │                 │
│  └───────────────┘   └───────────────┘   └───────────────┘                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                        ┌───────────────────┐
                        │    USUÁRIO FINAL  │
                        │   (Web / Mobile)  │
                        └───────────────────┘
```

---

## Boas Práticas de Integração

### 1. Use o serviço apropriado para cada necessidade

| Necessidade | Serviço Recomendado |
|-------------|---------------------|
| Exibir dados em tempo real | API Hub (Request/Respond) |
| Receber atualizações imediatas | API Hub (Pub/Sub) |
| Sincronizar base de dados | Sincronização de Dados |
| Alertar usuários | Notificações |
| Vender produtos | Pagamentos |

### 2. Combine serviços para melhor UX

```javascript
// Exemplo: Portal que combina múltiplos serviços

// 1. Autenticar via Portal
LayersPortal.on("connected", async (data) => {
  // 2. Buscar dados via API Hub
  const notas = await buscarNotasViaAPIHub(data.userId);

  // 3. Exibir no portal
  renderizarNotas(notas);

  // 4. Notificar se houver nova nota
  if (temNotaNova(notas)) {
    await enviarNotificacao(data.userId, "Nova nota disponível!");
  }
});
```

### 3. Mantenha dados sincronizados

```javascript
// Sincronização periódica
async function sincronizarDados() {
  const ultimaSync = localStorage.getItem('ultimaSync');

  const dadosAtualizados = await fetch(
    `https://api.layers.digital/v1/sync/incremental?since=${ultimaSync}`
  );

  await processarDados(dadosAtualizados);

  localStorage.setItem('ultimaSync', new Date().toISOString());
}

// Executar a cada 5 minutos
setInterval(sincronizarDados, 5 * 60 * 1000);
```

---

## Links para Documentação Completa

- [Notificações](https://developers.layers.education/content/notification/)
- [API Hub](https://developers.layers.education/content/api-hub/)
- [Sincronização de Dados](https://developers.layers.education/content/data-sync/)
- [Apps Visualizadores](https://developers.layers.education/content/apps-visualizadores/)
- [Pagamentos](https://developers.layers.education/content/pagamentos/)
- [Developer Center](https://developers.layers.education/)

---

## Suporte

- **Email**: suporte@layers.education
- **Plataforma**: https://id.layers.digital
- **Status**: https://status.layers.digital
