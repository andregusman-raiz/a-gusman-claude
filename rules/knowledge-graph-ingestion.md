# Knowledge Graph Ingestion Protocol

## Quando Usar

Agentes DEVEM criar entities/relations no Knowledge Graph MCP em momentos-chave:

| Momento | Entity Type | Agente Responsavel |
|---------|------------|-------------------|
| Decisao arquitetural tomada | ArchDecision | ag-06, ag-07 |
| Bug resolvido com causa raiz | BugResolution | ag-09 |
| Modulo novo criado | Module | ag-08 |
| Dependencia entre modulos descoberta | Relation (depends_on) | ag-03, ag-04 |
| Tech debt identificado | TechDebt | ag-04, ag-14 |
| Deploy realizado | DeployEvent | ag-27 |

## Como Usar

### 1. Criar Entities
```
mcp__knowledge-graph__create_entities(entities: [
  { "name": "auth-module", "entityType": "Module", "observations": ["Next.js App Router", "Supabase Auth", "RLS enabled"] }
])
```

### 2. Criar Relations
```
mcp__knowledge-graph__create_relations(relations: [
  { "from": "dashboard-page", "to": "auth-module", "relationType": "depends_on" }
])
```

### 3. Adicionar Observacoes a Entity Existente
```
mcp__knowledge-graph__add_observations(observations: [
  { "entityName": "auth-module", "contents": ["Bug fix: token refresh race condition (2026-03-07)"] }
])
```

### 4. Consultar Antes de Decidir
```
mcp__knowledge-graph__search_nodes(query: "auth")
mcp__knowledge-graph__open_nodes(names: ["auth-module"])
```

## Regras

- NUNCA duplicar entities — `search_nodes` antes de `create_entities`
- Observations devem ser FACTUAIS (datas, commits, resultados), nao opinativas
- Relations representam dependencias REAIS do codigo, nao hipoteticas
- Entity names em kebab-case: `auth-module`, `login-bug-2026-03`
- Usar `read_graph` com moderacao (retorna tudo — pode ser grande)

## Agentes que DEVEM Ingerir

- **ag-09** (depurar): Criar BugResolution apos resolver bug com causa raiz
- **ag-06** (especificar): Criar ArchDecision para cada decisao na SPEC
- **ag-04** (analisar): Criar TechDebt e Module relations ao analisar codebase
- **ag-27** (deploy): Criar DeployEvent apos deploy bem-sucedido
