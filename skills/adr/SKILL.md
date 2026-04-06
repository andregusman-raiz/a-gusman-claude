---
name: adr
description: "Criar ADR (Architecture Decision Record) para registrar decisoes tecnicas com contexto, alternativas e trade-offs. Trigger quando usuario quer registrar decisao, escolha de tecnologia, ou trade-off arquitetural."
model: sonnet
argument-hint: "[decisao ou titulo]"
metadata:
  filePattern: "**/adr/**,ADR-*.md"
  bashPattern: "adr|architecture.decision|decisao.*arquitet"
  priority: 70
---

# ADR Writer Skill

Criar ADRs (Architecture Decision Records) padronizados — registro permanente de decisoes tecnicas com contexto, alternativas e consequencias.

> ADR responde "POR QUE escolhemos X em vez de Y". E um registro historico, nao um documento de planejamento.

## Naming Convention

- Projeto: `docs/adr/ADR-{NNN}-{slug}.md`
- Workspace: `.claude/shared/adr/ADR-{NNN}-{slug}.md`
- Numero auto-incrementado a partir do ultimo ADR existente no diretorio

## Auto-Incremento

```bash
# Detectar proximo numero
LAST=$(ls docs/adr/ADR-*.md 2>/dev/null | sort -V | tail -1 | grep -oP 'ADR-\K\d+')
NEXT=$(printf "%03d" $((${LAST:-0} + 1)))
```

## Template: ADR

```markdown
# ADR-{NNN}: [Titulo da Decisao]

**Data:** YYYY-MM-DD
**Status:** Proposto | Aceito | Rejeitado | Substituido por ADR-{NNN}
**PRD:** (link se aplicavel)
**SPEC:** (link se aplicavel)

## Contexto

[Por que essa decisao e necessaria? Qual problema ou trade-off motivou a discussao?
2-4 frases com contexto suficiente para alguem entender daqui a 6 meses.]

## Opcoes Consideradas

### Opcao A: [Nome]
- **Pros**: [vantagens]
- **Cons**: [desvantagens]
- **Custo**: [esforco estimado]

### Opcao B: [Nome]
- **Pros**: [vantagens]
- **Cons**: [desvantagens]
- **Custo**: [esforco estimado]

### Opcao C: [Nome] (se aplicavel)
- **Pros**: [vantagens]
- **Cons**: [desvantagens]
- **Custo**: [esforco estimado]

## Decisao

Escolhemos **Opcao [X]** porque [rationale principal em 1-2 frases].

## Consequencias

### Positivas
- [beneficio 1]
- [beneficio 2]

### Negativas
- [custo/limitacao 1]
- [custo/limitacao 2]

### Riscos Mitigados
- [risco que essa decisao reduz]
```

## Workflow

1. Criar diretorio `docs/adr/` se nao existir
2. Detectar proximo numero de ADR (auto-incremento)
3. Gerar slug a partir do titulo (lowercase, hifens, max 50 chars)
4. Preencher template com contexto, opcoes e decisao
5. Salvar em `docs/adr/ADR-{NNN}-{slug}.md`

## Quando Criar ADR

| Cenario | ADR? |
|---------|------|
| Escolha de stack/framework | Sim |
| Escolha entre 2+ abordagens arquiteturais | Sim |
| Troca de dependencia significativa | Sim |
| Decisao de modelagem de dados | Sim |
| Bug fix ou refactor trivial | Nao |
| Escolha de naming convention | Nao (vai em CLAUDE.md) |
| Feature sem decisao tecnica relevante | Nao |

## Regras

1. ADR e PERMANENTE — nunca deletar, apenas marcar como "Substituido por ADR-NNN"
2. ADR max 60 linhas — registro conciso, nao documento extenso
3. Sempre listar pelo menos 2 opcoes com trade-offs (senao nao e decisao, e fato)
4. Contexto deve ser compreensivel por alguem que nao participou da discussao
5. Decisao deve ter rationale explicito (nao "porque sim")
6. Se SPEC ja documenta a decisao — ADR referencia a SPEC, nao duplica

## Anti-Patterns

| Anti-Pattern | Exemplo | Correcao |
|-------------|---------|----------|
| ADR sem opcoes | "Decidimos usar Postgres" | Listar alternativas: Postgres vs MySQL vs Supabase |
| ADR como tutorial | "Para configurar, faca X, Y, Z..." | Foco na DECISAO, nao na implementacao |
| ADR retroativo sem contexto | "Usamos React" (sem dizer por que) | Reconstruir contexto: "Em 2026-03 precisavamos de SSR..." |
| ADR para nao-decisao | "Usamos TypeScript" (sem alternativa real) | So criar ADR quando ha trade-off real |
| ADR longo demais | 200 linhas com detalhes de implementacao | Max 60 linhas, detalhes vao na SPEC |
