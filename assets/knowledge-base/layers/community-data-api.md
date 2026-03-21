# Layers Education — Community Data API

> Base URL: `https://api.layers.digital`
> Authentication: Bearer Token (HTTP)
> Required Header: `community-id` (string) — Identificador da comunidade

---

## Visao Geral

A Community Data API fornece endpoints para gerenciar usuarios, membros, grupos, matriculas (enrollments), componentes, tags, periodos e permissoes de uma comunidade na plataforma Layers.

---

## Users (Usuarios)

### GET /v1/users — Listar Usuarios

Retorna contas de acesso de usuarios.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| createdAt | string | Data de criacao do documento |
| updateAt | string | Data da ultima modificacao |
| status | string | ACTIVE, INVITED ou INACTIVE |
| active | boolean | true = ativo, false = deletado |
| roles | string | Nivel de permissao do usuario |

**Response (200):**
```json
{
  "total": 10,
  "hits": [
    {
      "_id": "string",
      "createdAt": "2020-01-01T00:00:00.000Z",
      "updatedAt": "2020-01-01T00:00:00.000Z",
      "active": true,
      "community": "test",
      "status": "ACTIVE",
      "invitationCount": 2,
      "email": "luke@starwars.com",
      "name": "Gabriel Raniere",
      "roles": ["guardian", "professor"],
      "address": {
        "code": "01414-001",
        "state": "SP",
        "city": "Sao Caetano do Sul",
        "district": "Centro",
        "address": "Rua Para",
        "number": "79"
      }
    }
  ]
}
```

### GET /v1/users/{userId} — Visualizar Usuario

Retorna informacoes de um usuario especifico.

**Path Parameters:**
- `userId` (string, required) — Identificador do usuario

**Response (200):** Mesmo schema do objeto usuario acima.

### GET /v1/users/search — Buscar Usuarios

Busca usuarios com texto livre e filtros.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| createdAt | string | Data de criacao |
| updateAt | string | Data da ultima modificacao |
| status | string | ACTIVE, INVITED ou INACTIVE |
| roles | string | Filtro de role/permissao |
| q | string | Busca por nome, email ou alias |
| emails | array | Lista de emails para busca direcionada |

**Response (200):**
```json
{
  "total": 1,
  "hits": [
    {
      "_id": "string",
      "createdAt": "2020-01-01T00:00:00.000Z",
      "updatedAt": "2020-01-01T00:00:00.000Z",
      "active": true,
      "community": "test",
      "status": "ACTIVE",
      "invitationCount": 2,
      "email": "string",
      "name": "string",
      "roles": [],
      "address": { "code": "", "state": "", "city": "", "district": "", "address": "", "number": "" }
    }
  ]
}
```

---

## Members (Membros)

Membros representam entidades do mundo real dentro de comunidades (tipicamente alunos em contextos educacionais). Cada membro possui um identificador unico e nome.

### GET /v1/members — Listar Membros

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| createdAt | string | Data de criacao |
| updateAt | string | Data da ultima modificacao |
| active | boolean | true = ativo, false = deletado |
| alias | string | Identificador na Layers |
| name | string | Nome do membro |

**Response (200):** Array de objetos membro.
```json
[
  {
    "_id": "12345678",
    "createdAt": "2020-01-01T00:00:00.000Z",
    "updatedAt": "2020-01-01T00:00:00.000Z",
    "active": true,
    "community": "test",
    "access": [
      {
        "permissions": ["guardian"],
        "user": "string"
      }
    ],
    "name": "Gabriel Raniere",
    "alias": "abc123d",
    "birth": "2010-04-10T00:00:00.000Z"
  }
]
```

Resultados ordenados por data de criacao.

### GET /v1/members/{memberId} — Visualizar Membro

**Path Parameters:**
- `memberId` (string, required)

**Response (200):** Mesmo schema do objeto membro.

### GET /v1/members/search — Buscar Membros

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| createdAt | string | Data de criacao |
| updateAt | string | Data da ultima modificacao |
| status | string | ACTIVE, INVITED ou INACTIVE |
| active | boolean | Estado do documento |
| alias | string | Identificador na Layers |
| q | string | Busca por nome ou alias |

**Response (200):**
```json
{
  "total": 1,
  "hits": [
    {
      "_id": "12345678",
      "createdAt": "2020-01-01T00:00:00.000Z",
      "updatedAt": "2020-01-01T00:00:00.000Z",
      "active": true,
      "community": "test",
      "access": [{ "permissions": ["guardian"], "user": "string" }],
      "name": "Gabriel Raniere",
      "alias": "abc123d",
      "birth": "2010-04-10T00:00:00.000Z"
    }
  ]
}
```

---

## Groups (Grupos)

Grupos sao agregacoes de membros — representam turmas ou cohorts em contextos academicos.

### GET /v1/groups — Listar Grupos

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| createdAt | string | Data de criacao |
| active | boolean | true = ativo, false = deletado |
| name | string | Nome do grupo |
| admins.user | string | ID do usuario administrador |
| season | string | Periodo letivo |

**Response (200):** Array de objetos grupo.
```json
[
  {
    "_id": "string",
    "alias": "3A",
    "createdAt": "2020-01-01T00:00:00.000Z",
    "updatedAt": "2020-01-01T00:00:00.000Z",
    "community": "test",
    "name": "Terceiro ano A",
    "tags": [{ "id": "string", "name": "Ensino Fundamental" }],
    "admins": [{ "user": "string" }],
    "active": true,
    "syncedAt": "2020-03-01T00:00:00.000Z",
    "season": "Ano letivo 2020",
    "fields": {
      "@education:basic": {
        "tipo": { "_id": "string", "label": "string" },
        "nivel": { "_id": "string", "label": "string" },
        "periodo": "string"
      }
    }
  }
]
```

### GET /v1/groups/{groupId} — Visualizar Grupo

**Path Parameters:**
- `groupId` (string, required)

**Response (200):** Mesmo schema do objeto grupo.

### GET /v1/groups/search — Buscar Grupos

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Busca por nome ou identificador |
| name | string | Nome do grupo |
| alias | string | Identificador na Layers |
| season | string | Periodo academico |
| active | boolean | Estado do documento |
| createdAt | string | Data de criacao |
| admins.user | string | ID do admin |

**Response (200):**
```json
{
  "total": 1,
  "hits": [
    {
      "_id": "string",
      "alias": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "community": "string",
      "name": "string",
      "tags": [],
      "admins": [],
      "active": true,
      "syncedAt": "string",
      "season": "string",
      "fields": {}
    }
  ]
}
```

---

## Enrollments (Matriculas)

Matriculas formalizam a conexao entre membros e grupos.

### GET /v1/enrollments/search — Buscar Matriculas

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| active | boolean | true = ativo, false = deletado |
| group | string | Identificador do grupo |

**Response (200):**
```json
{
  "total": 1,
  "hits": [
    {
      "_id": "string",
      "createdAt": "2020-01-01T00:00:00.000Z",
      "updatedAt": "2020-01-01T00:00:00.000Z",
      "community": "test",
      "kind": "member",
      "entity": "string",
      "group": "string",
      "active": true
    }
  ]
}
```

**Campos de resposta:**
- `kind`: Tipo da entidade (ex: "member")
- `entity`: Referencia ao identificador da entidade
- `group`: Identificador do grupo

---

## Components (Componentes/Disciplinas)

### GET /v1/components — Listar Componentes

**Response (200):**
```json
{
  "total": 0,
  "hits": [
    {
      "_id": "string",
      "syncedAt": "string",
      "name": "Portugues",
      "alias": "PORT",
      "fields": {
        "@education:basic": {
          "inep": {
            "_id": "string",
            "label": "string"
          }
        }
      }
    }
  ]
}
```

---

## Seasons/Periodos

### GET /v1/season — Listar Periodos

Retorna todos os periodos existentes na comunidade.

**Response (200):**
```json
[
  {
    "_id": "string",
    "name": "2020",
    "createdAt": "string",
    "activatedAt": "string",
    "deactivatedAt": "string"
  }
]
```

---

## Tags

### GET /v1/tags — Listar Tags

**Response (200):**
```json
[
  {
    "_id": "string",
    "name": "Ensino Fundamental",
    "community": "test",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

### GET /v1/tags/search — Buscar Tags

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Busca por nome da tag |

**Response (200):**
```json
{
  "total": 1,
  "hits": [
    {
      "_id": "string",
      "name": "Ensino Fundamental",
      "community": "test",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

---

## Permissions (Permissoes)

### GET /v1/permissions — Listar Permissoes

Lista as permissoes disponiveis na comunidade.

> Permissoes na Layers sao strings no formato `entidade:acao` e governam o acesso a rotas da API. O sistema permite agregacao de permissoes atraves de perfis customizaveis — colecoes de permissoes atribuiveis tanto a aplicacoes quanto a usuarios.

---

## Sync Data Upload

### POST /v1/sync — Upload de Dados para Sincronizacao

Endpoint para envio de dados de sincronizacao.

> Para detalhes completos sobre sincronizacao, consulte `data-sync.md`.

---

## Notas Gerais

- Todos os endpoints requerem Bearer Token no header `Authorization`
- Todos os endpoints requerem `community-id` no header
- Exemplos de codigo disponiveis em: cURL, JavaScript, PHP e Python
- Resultados de listas sao ordenados por data de criacao
- Campos `active: false` indicam documentos deletados logicamente
