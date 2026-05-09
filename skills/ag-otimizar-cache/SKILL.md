---
name: ag-otimizar-cache
description: "Audita machines ag-*.md e reference skills em .claude/skills/ identificando candidatos a cache_control: ephemeral. Reporta tokens estimados antes/depois. Injeta markers no modo --apply."
model: sonnet
context: fork
argument-hint: "[--dry-run | --apply] [skill:ag-1-construir | all]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
metadata:
  filePattern: "cache-audit-*.md,cache-audit-*.json"
  priority: 70
cache_policy:
  enabled: false
  reason: "skill curta, invocacao esporadica — cache nao vale"
---

# AG-OTIMIZAR-CACHE — Auditor de Prompt Cache

## Invocacao

```
/ag-otimizar-cache                        # Dry-run: reporta candidatos (default)
/ag-otimizar-cache --dry-run              # Explicito — so reporta, nao altera
/ag-otimizar-cache --apply                # Aplica markers nos arquivos
/ag-otimizar-cache skill:ag-1-construir   # Audita apenas 1 skill
/ag-otimizar-cache all                    # Audita todas as machines + reference skills
```

## O que faz

Auditoria em 3 fases:

```
SCAN -> ANALYZE -> REPORT [-> APPLY se --apply]
```

1. **SCAN**: Lista todas as skills em `~/.claude/skills/ag-*/SKILL.md` + `ag-referencia-*/SKILL.md`
2. **ANALYZE**: Para cada skill, calcula tamanho, identifica blocos estaticos, detecta candidatos
3. **REPORT**: Relatorio com tokens estimados antes/depois por skill
4. **APPLY** (so com `--apply`): Injeta markers `<!-- cache_control: ephemeral -->` nos pontos corretos

## Criterios de candidato (ver prompt-cache-policy.md)

Uma skill e candidata se:
- Corpo SKILL.md >= 300 linhas de instrucoes
- Tem bloco estatico longo (tabelas, checklists, pipelines) antes de secao dinamica
- Invocada frequentemente (machines principais: ag-0 a ag-9, ag-meridian, ag-sentinel, ag-fortress)
- NAO tem `cache_policy.enabled: false` no frontmatter

## Estimativa de tokens

Heuristica: `tokens ≈ chars / 4` (aproximacao conservadora para PT-BR + codigo misto).

Calculo de economia:
```
tokens_cacheados = tokens(bloco antes do marker)
tokens_nao_cacheados = tokens(bloco apos o marker)
economia_por_hit = tokens_cacheados × custo_input  (custo de cache hit < custo de input normal)
break_even = 2 invocacoes dentro de 5 min
```

Obs: valores exatos dependem da API Anthropic — esta skill reporta estimativas por heuristica.

## Ponto de insercao do marker

O marker vai IMEDIATAMENTE apos o ultimo bloco estatico e ANTES de qualquer secao dinamica.

Sinais de "secao dinamica" (interrompe o bloco cacheavel):
- Secoes com `{PROJECT_ROOT}`, `{ARGS}`, `{USER_INPUT}`
- Secoes de "Invocacao" com exemplos variaveis
- Secoes de "Output" com placeholders de run

Sinais de "bloco estatico" (bom para cache):
- Tabelas de mapeamento fixas (modes, fases, agents internos)
- Pipelines com fases numeradas
- Checklists de quality gates
- KB inline (Design Library, TOTVS, stack decisions)

## Lista canonical auditada

Skills auditadas em `--dry-run all`:

```
Machines principais:
  ag-0-orquestrador, ag-1-construir, ag-2-corrigir, ag-3-entregar
  ag-4-teste-final, ag-5-documentos, ag-6-iniciar, ag-7-qualidade
  ag-8-seguranca, ag-9-auditar, ag-10-benchmark-software
  ag-11-ux-ui, ag-12-sql-totvs-zeev, ag-13-limpar-codigo

Wrappers:
  ag-meridian, ag-sentinel, ag-fortress

Reference skills:
  ag-referencia-stack-decisions, ag-referencia-sdd
  ag-referencia-anti-cycle, ag-referencia-roteamento
  ag-referencia-seguranca-rules, ag-referencia-design-presentation
```

## Formato do relatorio (dry-run)

```
CACHE AUDIT — YYYY-MM-DD

Candidatos identificados: N

| Skill | Linhas | Tokens est. | Bloco cacheavel | Economia/hit | Status |
|-------|--------|-------------|-----------------|--------------|--------|
| ag-1-construir | 420 | ~4.200 | Ate "Pre-Load: TOTVS" (ln 280) | ~2.800 tok | CANDIDATO |
| ag-7-qualidade | 380 | ~3.800 | Ate "Invocacao" (ln 310) | ~3.100 tok | CANDIDATO |
| ag-2-corrigir  | 72  | ~720   | — | — | PEQUENO (skip) |

Nao candidatos (< 300 linhas ou cache_policy.enabled: false): N skills

Para aplicar: /ag-otimizar-cache --apply
```

## Protocolo apply (so com --apply)

1. Para cada candidato: Read o SKILL.md atual
2. Identificar o ponto de insercao (ultimo bloco estatico, antes de secao dinamica)
3. Adicionar `cache_policy` no frontmatter YAML se nao existir
4. Inserir `<!-- cache_control: ephemeral -->` no corpo, na linha correta
5. Verificar que o arquivo ainda e Markdown valido (sem quebrar frontmatter)
6. Reportar: arquivo editado + linha exata do marker

**NUNCA** remover conteudo. **NUNCA** reordenar secoes. Apenas inserir o marker.

## Anti-patterns detectados e reportados

Adicionalmente, reportar se encontrar:
- Timestamps hardcoded em blocos que seriam cacheados
- Paths absolutos de projeto em blocos estaticos
- IDs dinamicos (issue #N, PR #N) misturados em blocos longos
- Skills com `cache_policy.enabled: true` mas < 300 linhas (candidato a `false`)

## Output

```
CACHE AUDIT COMPLETO
  Modo: [dry-run | apply]
  Skills auditadas: [N]
  Candidatos: [N]
  Markers inseridos: [N] (se --apply)
  Tokens estimados cacheados: [N total]
  Economia estimada/sessao tipica: [N tokens]
  Relatorio: docs/diagnosticos/cache-audit-YYYY-MM-DD.md (se projeto ativo)
             ou output inline (se workspace .claude/)
  Anti-patterns detectados: [N]
```

## Referencias

- `~/Claude/.claude/rules/prompt-cache-policy.md` — politica completa, criterios, anti-patterns
- Anthropic docs: prompt caching com cache_control: ephemeral (TTL 5min)
- `cost-optimization.md` — model routing (complementar a esta skill)
