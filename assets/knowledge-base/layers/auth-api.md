# Layers Education — Authentication & SSO API

> Base URL: `https://api.layers.digital`
> Identity URL: `https://id.layers.digital`

---

## Visao Geral

A Layers fornece duas abordagens de autenticacao complementares:

1. **OAuth2** — Usado quando requer consentimento de escopo e Bearer tokens para consumo de APIs
2. **Sessions (Portais)** — Usado para abrir/validar portais autenticados, embutidos ou externos

---

## OAuth2

### Fluxo Authorization Code

#### Passo 1: Redirecionar Usuario para Login

Construir URL de autorizacao direcionando usuario para `https://id.layers.digital`:

```
https://id.layers.digital/?client_id=myApp&redirect_uri=https://myApp.com/callback&response_type=code&scope=openid profile fullname email
```

**Parametros da URL:**
| Parameter | Value | Notes |
|-----------|-------|-------|
| client_id | ID do seu app | Obrigatorio |
| response_type | `code` | Unico valor aceito atualmente |
| redirect_uri | URL de callback | Deve corresponder exatamente a URI pre-configurada |
| scope | Escopos separados por espaco | Obrigatorio |
| state | Mensagem customizada | Opcional; retornado com o token |

#### Passo 2: Receber Authorization Code

Apos login e concessao de permissoes, o usuario e redirecionado para:
```
https://{{redirect_uri}}?code={{code}}
```

#### Passo 3: Trocar Code por Access Token

**Endpoint:** `POST https://api.layers.digital/oauth/token`

**Content-Type:** `application/x-www-form-urlencoded`

**Request Body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| grant_type | string | Sim | `authorization_code` |
| client_id | string | Sim | Identificador do app na Layers |
| code | string | Sim | Authorization code recebido |
| redirect_uri | string | Sim | Deve corresponder exatamente a URI configurada |

**Exemplo cURL:**
```bash
curl -X POST https://api.layers.digital/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=seu-client-id" \
  -d "code=codigo-de-autorizacao" \
  -d "redirect_uri=https://seu-app.com/callback"
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "state": "opcional-state-passado-na-autorizacao"
}
```

**Notas de implementacao:**
- Authorization codes sao de uso unico e tempo limitado
- `redirect_uri` deve corresponder exatamente ao valor configurado e ao da requisicao de autorizacao
- O access token e um JWT

---

### Escopos OAuth2

| Scope | Acesso Concedido |
|-------|-----------------|
| `openid` | `account.id` |
| `profile` | `account.createdAt`, `account.updatedAt`, `account.language`, `account.timezone`, `account.firstName` |
| `fullname` | `account.name` |
| `email` | `account.email` |
| `related.communities` | Detalhes de comunidade (nome, icone, logo, idioma, timezone, geolocalizacao, cor, timestamps); informacoes do usuario dentro de comunidades (lastSeenAt, id, timestamps, alias, roles, permissions) |
| `related.groups` | Identificadores e metadados de grupo; informacoes de matricula incluindo kind, entity e timestamps |
| `related.members` | Identificacao do membro, nome e timestamps |
| `related.members.groups` | Detalhes de grupo e dados de matricula para membros |

---

### GET /v1/oauth/account/info — Informacoes de Conta

Retorna informacoes da conta do usuario. Dados retornados dependem do escopo do app e do parametro `includes`.

**Authorization:** OAuth2 (Authorization Code Flow)

**Query Parameters:**
- `includes` (string, optional) — ex: `"groups"` — Especifica informacoes adicionais

**Response (200):**
```json
{
  "createdAt": "string",
  "updatedAt": "string",
  "language": "pt-BR",
  "timezone": "America/Sao_Paulo",
  "firstName": "Joao",
  "id": "string",
  "lastName": "Silva",
  "name": "Joao Silva",
  "communities": [
    {
      "color": "#53d0e9",
      "community": "demo-escola",
      "icon": "https://cdn.layers.digital/admin/uploads/.../icon.png",
      "name": "Colegio Walter White"
    }
  ]
}
```

### GET /v1/oauth/user/info — Informacoes de Usuario

Retorna informacoes do usuario na comunidade. Dados dependem do escopo e do `includes`.

**Authorization:** OAuth2

**Response (200):** Inclui:
- Objeto usuario (ID, timestamps, alias, roles, permissions)
- Objeto comunidade (cor, icone, nome)
- Array de grupos com detalhes de matricula
- Array de membros com informacoes de grupo associadas

---

## Sessions (Portais)

### Autenticacao via URL

Adequada para aplicacoes SSR. O portal deve ter a feature "forward-session" habilitada.

Quando usuarios acessam um portal pela Layers, parametros de autenticacao sao adicionados como query string:

**Parametros de autenticacao:**
| Parameter | Description |
|-----------|-------------|
| `layers_session` | Identificador da sessao do usuario |
| `layers_community_id` | Identificador da comunidade |
| `layers_user_id` | Identificador unico do usuario na Layers |

**Exemplo de implementacao (Node.js/Express):**
```javascript
app.get('/portal', async (req, res) => {
  const { layers_session, layers_community_id, layers_user_id } = req.query;

  try {
    await validateSession(layers_session, layers_community_id, layers_user_id);
    // Sessao valida, continuar processamento
  } catch (e) {
    // Sessao invalida, apresentar erro
  }
});
```

### Validacao de Sessao

**Endpoint:** `GET https://api.layers.digital/v1/sso/session/validate`

**Query Parameters:**
- `session` — Token de sessao
- `community` — ID da comunidade
- `userId` — ID do usuario

**Headers:**
- `Authorization: Bearer [TOKEN_DE_APLICACAO]`

**Response:**
- HTTP 200 — Sessao valida
- Qualquer outro status — Sessao invalida

```bash
curl -X GET "https://api.layers.digital/v1/sso/session/validate?session=SESSION&community=COMMUNITY&userId=USER_ID" \
  -H "Authorization: Bearer [TOKEN_DE_APLICACAO]"
```

> SEGURANCA: Sempre valide sessoes via API antes de confiar nos parametros da URL.

---

## Autenticacao de Usuario (Federation)

### POST /v1/federation/auth — Gerar Link de Redirecionamento Autenticado

**Request Body:**
```json
{
  "email": "string",
  "community": "comunidade-demo",
  "ip": "177.184.250.29",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0",
  "location": "/account"
}
```

**Response (200):**
```json
{
  "url": "https://app.layers.education/@comunidade-demo/auth?token=token&location=/portal/meu-portal"
}
```

---

## SDK JavaScript (Portais)

A biblioteca LayersPortal.js permite que apps recebam eventos para:
- Notificacoes de app ready
- Atualizacoes de status de conexao
- Gerenciamento de acesso pela Layers

### Configuracao

Apps devem ser registrados e ter a feature "portais" habilitada. Devem fornecer URL apontando para pagina usando a biblioteca LayersPortal.js.

---

## App Maker API (Gerenciamento de Instalacoes)

### POST /open-api/appmaker/operations/approve — Aprovar Instalacao
### GET /open-api/appmaker/operations/getInstallation — Ver Instalacao
### PUT /open-api/appmaker/operations/updateInstallation — Atualizar Instalacao
### GET /open-api/appmaker/operations/listInstallations — Listar Instalacoes

Todos requerem Bearer Token.
