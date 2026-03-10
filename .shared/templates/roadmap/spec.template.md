# SPEC: {MODULE}-{TYPE}-{NNN} — {Titulo}

**Item:** {ID}
**PRD:** `roadmap/specs/{ID}/PRD.md`
**Autor:** {Nome}
**Data:** {YYYY-MM-DD}
**Status:** draft | review | approved

> **Max 200 linhas.** Se maior, dividir em sub-SPECs.

---

## 1. Visao Tecnica

{Resumo de 2-3 frases da abordagem tecnica escolhida}

## 2. Arquitetura

### 2.1 Componentes Afetados

| Componente | Tipo | Mudanca |
|------------|------|---------|
| {path/to/file} | novo/modificar/remover | {Descricao} |

### 2.2 Diagrama

```
{Diagrama ASCII se necessario}
```

## 3. Schema / Tipos

```typescript
// Novos tipos ou interfaces
interface {Nome} {
  {campo}: {tipo};
}
```

## 4. API / Endpoints

| Metodo | Path | Body | Response |
|--------|------|------|----------|
| POST | /api/... | `{ ... }` | `{ ... }` |

## 5. Banco de Dados

### Migrations

```sql
-- Se aplicavel
```

### RLS Policies

```sql
-- Se aplicavel
```

## 6. Plano de Implementacao

| Passo | Descricao | Estimativa |
|-------|-----------|------------|
| 1 | {Desc} | {Xh} |
| 2 | {Desc} | {Xh} |

## 7. Edge Cases

- {Cenario nao-obvio 1}
- {Cenario nao-obvio 2}

## 8. Testes

| Tipo | Descricao | Criterio |
|------|-----------|----------|
| Smoke | {O que verificar} | {Pass/Fail} |
| Unit | {Funcao/modulo} | {Valor esperado} |
| E2E | {Fluxo do usuario} | {Resultado esperado} |
| Access | {Role sem permissao} | {403/redirect} |

## 9. Rollback Plan

{Como reverter se der errado}
