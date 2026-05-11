# Layers Education — Notifications API

> Base URL: `https://api.layers.digital`
> Authentication: Bearer Token
> Required Header: `Community-Id` (string)

---

## Visao Geral

O servico de Notificacoes da Layers permite enviar mensagens via dois canais:
- **Push Notifications** — Aparecem em apps mobile/tablet ou browsers web para usuarios logados
- **E-mail** — Alcanca usuarios nos enderecos registrados

Quatro configuracoes principais:
1. **Segmentacao de publico-alvo** — Direcionar por topicos e perfis de acesso
2. **Selecao de canal** — Push, email, ou ambos simultaneamente
3. **Acoes de clique** — Especificar qual portal abre ao interagir
4. **Agendamento** — Entrega imediata ou em data/hora programada

---

## Endpoint Principal

### POST /v2/notification/send — Enviar Notificacao por Publico-Alvo

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer SEU_TOKEN`
- `Community-Id: escola-exemplo`

**Request Body Completo:**
```json
{
  "targets": {
    "topics": [
      {
        "kind": "user|member|group",
        "community": "string",
        "id": "string",
        "name": "string",
        "alias": "string",
        "email": "string"
      }
    ],
    "roles": ["admin", "guardian", "student"]
  },
  "title": "Titulo da Notificacao",
  "body": "Corpo da notificacao",
  "action": {
    "path": "/?postId=123456",
    "portalAlias": "@admin:layers-comunicados",
    "type": "portal"
  },
  "scheduleDate": "2030-09-07T15:50-03:00",
  "channels": {
    "pushNotification": {
      "title": "Titulo customizado para push",
      "body": "Corpo customizado para push"
    },
    "email": {
      "title": "Titulo customizado para email",
      "body": "Corpo customizado para email",
      "actionLabel": "Texto do botao de acao",
      "backgroundUrl": "string"
    }
  }
}
```

**Response (200):** Notificacoes enviadas ou agendadas com sucesso.

---

## Segmentacao de Publico-Alvo (targets)

Ao enviar notificacoes, `roles` e `topics` dentro de `targets` devem ser especificados simultaneamente.

### Tipos de Topico (targets.topics)

#### 1. User — Usuarios individuais
```json
// Por ID:
{ "kind": "user", "id": "61087e1a608106241d30a8aa" }
// Por email:
{ "kind": "user", "email": "maria@exemplo.com" }
```

#### 2. Member — Membros individuais dentro de grupos
```json
{ "kind": "member", "alias": "aluno-joao-silva" }
```

#### 3. Group — Grupos/turmas inteiras
```json
{ "kind": "group", "alias": "turma-3a" }
```

### Multiplos Topicos
Combinar diferentes tipos em uma unica notificacao:
```json
[
  { "kind": "group", "alias": "turma-3a" },
  { "kind": "user", "email": "diretor@exemplo.com" }
]
```

### Filtro por Roles (targets.roles)
Ao direcionar members ou groups, especificar roles e obrigatorio. Filtra quais tipos de usuario recebem:
```json
"roles": ["guardian"]
```
Garante que apenas pais/responsaveis recebam a mensagem.

---

## Canais de Notificacao (channels)

### Apenas Push
```json
{
  "channels": {
    "pushNotification": {
      "title": "Titulo push",
      "body": "Corpo push"
    }
  }
}
```

### Apenas Email
```json
{
  "channels": {
    "email": {
      "title": "Titulo email",
      "body": "Corpo email",
      "actionLabel": "Ver detalhes",
      "backgroundUrl": "https://cdn.exemplo.com/bg.png"
    }
  }
}
```

### Push + Email Simultaneo
```json
{
  "channels": {
    "pushNotification": { "title": "Alerta rapido", "body": "Confira" },
    "email": { "title": "Informacao detalhada", "body": "Detalhes completos...", "actionLabel": "Abrir" }
  }
}
```

**Comportamento padrao:** Quando `channels` e omitido, o sistema envia apenas push notification.

Cada canal permite `title` e `body` independentes que sobrescrevem o conteudo root-level.

---

## Acoes de Clique (action)

### 1. Navegacao para Portal
Redireciona para um portal dentro do ecossistema Layers:
```json
{
  "action": {
    "type": "portal",
    "portalAlias": "@admin:layers-financeiro",
    "path": "/payable/123"
  }
}
```

### 2. Redirecionamento Externo
Direciona para websites externos:
```json
{
  "action": {
    "type": "external",
    "path": "https://forms.exemplo.com/pesquisa-2025"
  }
}
```

---

## Agendamento (scheduleDate)

Especificar `scheduleDate` com formato ISO8601 incluindo timezone:

```json
{
  "scheduleDate": "2025-10-24T12:00:00-03:00"
}
```

Quando omitido, a notificacao e enviada imediatamente.

---

## Exemplo Completo

```bash
curl -X POST https://api.layers.digital/v2/notification/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Community-Id: escola-exemplo" \
  -d '{
    "targets": {
      "topics": [{ "kind": "group", "alias": "turma-3a" }],
      "roles": ["guardian"]
    },
    "title": "Reuniao de Pais",
    "body": "A reuniao sera dia 24/10 as 12h",
    "action": {
      "path": "/agenda",
      "portalAlias": "@agenda",
      "type": "portal"
    },
    "scheduleDate": "2025-10-24T12:00:00-03:00"
  }'
```
