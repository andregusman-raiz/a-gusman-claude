---
description: "Politica de prompt caching para reducao de custo em machines e skills grandes"
paths:
  - "**/*"
---

# Prompt Cache Policy

## Principio

Blocos de instrucoes ESTATICOS e longos custam tokens a cada invocacao. Claude API suporta
`cache_control: ephemeral` (TTL 5 min) para reusar prefill quando o contexto nao muda.
Esta rule define QUANDO e ONDE marcar blocos para cache.

---

## Quando usar cache_control: ephemeral

### Criterios OBRIGATORIOS (todos devem ser verdadeiros)

1. **Tamanho**: bloco >= 300 linhas de instrucoes (system prompt, skill body, reference carregada)
2. **Estatico**: conteudo NAO varia por invocacao — sem timestamps, IDs, paths dinamicos, dados do usuario
3. **Reusado frequentemente**: skill/machine invocada >= 2x por sessao comum
4. **Antes de conteudo dinamico**: o marker DEVE vir antes da primeira variavel dinamica no prompt

### Ponto de insercao correto

```
[instrucoes estaticas longas]          ← conteudo a ser cacheado
<cache_control: ephemeral />           ← marker AQUI, imediatamente apos o bloco estatico
[contexto dinamico]                    ← nao cacheado (paths, IDs, timestamps, input do usuario)
```

---

## Lista canonical de machines que DEVEM ter cache marker

| Machine / Skill | Motivo | Ponto de insercao sugerido |
|---|---|---|
| `ag-1-construir` | 400+ linhas, design library + TOTVS KB inline | Apos secao "Pre-Load: Design Library" |
| `ag-7-qualidade` (MERIDIAN) | Pipeline 5D completo, checklists longos | Apos secao de dimensoes ALIVE/REAL/WORKS |
| `ag-8-seguranca` (SENTINEL) | 6 dimensoes + LGPD rules | Apos dimensoes estaticas |
| `ag-9-auditar` (FORTRESS) | Orquestra 5 machines, instrucoes extensas | Apos lista de machines + protocolo |
| `ag-0-orquestrador` | Matriz de roteamento completa | Apos matriz de decisao |
| `ag-2-corrigir` | Convergencia loop + diagnostico | Apos modos e protocolo |
| `ag-4-teste-final` | QAT multidimensional | Apos dimensoes de teste |
| `ag-meridian` (wrapper) | Alias de ag-7 | Mesmo que ag-7 |
| `ag-sentinel` (wrapper) | Alias de ag-8 | Mesmo que ag-8 |
| `ag-fortress` (wrapper) | Alias de ag-9 | Mesmo que ag-9 |
| `ag-referencia-stack-decisions` | Reference skill longa | Final do bloco de referencia |
| `ag-referencia-sdd` | SDD methodology longa | Final do bloco de referencia |
| `ag-referencia-anti-cycle` | 30 regras | Final das regras estaticas |

---

## Anti-patterns — NUNCA cachear

| Anti-pattern | Motivo | Alternativa |
|---|---|---|
| Timestamps ou datas no bloco cacheado | Invalida o cache a cada minuto | Mover timestamp para apos o marker |
| IDs de issue/PR/ticket no bloco | Muda por invocacao | Mover para secao de contexto dinamico |
| Paths absolutos do projeto atual | Diferem entre projetos | Usar placeholder `{PROJECT_ROOT}` |
| Resultados de comandos bash | Dinamico por natureza | Sempre apos o marker |
| Estado de sessao (counters, ciclos) | Muda durante a sessao | Sempre apos o marker |
| Blocos < 300 linhas | TTL overhead > ganho | Sem marker — cache nao vale |
| Cache de conteudo que muda por run | Invalida antes do TTL | Verificar: e realmente estatico? |

---

## TTL e custo-beneficio

- **TTL padrao**: 5 minutos (sem opcao de mudar via marker em Claude Code)
- **Break-even**: >= 2 invocacoes dentro de 5 min para o cache valer
- **Quando cache NUNCA vale**: skills invocadas < 1x por sessao (ex: ag-retrospectiva)
- **Heuristica**: se a machine tem > 300 linhas E e o entry-point comum da sessao → cachear

---

## Implementacao em skills (.md com frontmatter)

Adicionar `cache_policy` no frontmatter para documentar a intencao:

```yaml
---
name: ag-1-construir
model: sonnet
cache_policy:
  enabled: true
  marker_after: "Pre-Load: Design Library"
  estimated_tokens: 4500
---
```

O marker textual no corpo da skill:

```markdown
## Pre-Load: Design Library
[... conteudo longo estatico ...]

<!-- cache_control: ephemeral -->

## Invocacao
[... conteudo dinamico por run ...]
```

---

## Auditoria e verificacao

Skill `/ag-otimizar-cache` audita machines e skills identificando candidatos e injetando markers.

- `--dry-run` (default): reporta candidatos + tokens estimados antes/depois
- `--apply`: aplica markers
- Ver `~/Claude/.claude/skills/ag-otimizar-cache/SKILL.md`

---

## Relacao com outras rules

- `cost-optimization.md` — model routing; esta rule e complementar (reduz custo dentro do mesmo modelo)
- `context-management.md` — `/compact` e cache sao ortoganais; ambos reduzem custo mas por mecanismos distintos
- `activation-modes.md` — `--autonomo` aumenta reuso dentro de 1 sessao, beneficia mais do cache

---

## Referencias

- Anthropic docs: prompt caching com `cache_control: ephemeral`
- TTL: 5 minutos (Claude API, 2025)
- Scope: Claude Code usa API internamente — markers sao respeitados quando API suporta
