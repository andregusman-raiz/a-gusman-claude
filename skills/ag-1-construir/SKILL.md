---
name: ag-1-construir
description: "Maquina autonoma de construcao. Feature, refactor, UI, issue, integracao, otimizacao — recebe objetivo, entrega PR pronto. Padrao MERIDIAN: fases, convergencia, state, self-healing."
model: opus
context: fork
argument-hint: "[objetivo ou issue #N] [--resume] [--skip-review] [--audit-only]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage
metadata:
  filePattern: "construir-state.json"
  bashPattern: "construir"
  priority: 98
---

# CONSTRUIR — Maquina Autonoma de Construcao

## Invocacao

```
/construir adicionar autenticacao com Clerk           # Feature
/construir issue #42                                   # Issue pipeline
/construir refatorar extrair modulo de auth            # Refactor
/construir otimizar queries do dashboard               # Optimize
/construir ui redesign do dashboard                    # UI/UX
/construir integrar sistema SophiA                     # Incorporacao
/construir --resume                                    # Retomar run
/construir --audit-only adicionar feature X            # So SPEC, sem build
```

## O que faz

Executa construcao completa AUTONOMA em 6 fases:

```
ASSESS → SPEC → PLAN → BUILD → VERIFY → REVIEW → SHIP
                         ↑        │
                         └────────┘  (convergencia: max 2 cycles)
```

1. **ASSESS**: Detecta modo (feature/issue/refactor/optimize/ui/integrate), size gate
2. **SPEC**: Cria especificacao tecnica (ag-especificar-solucao internamente)
3. **PLAN**: Cria plano de execucao (ag-planejar-execucao internamente, skip para Size S)
4. **BUILD**: Implementa (ag-implementar-codigo/B-10/B-11/B-52/I-35 conforme modo)
5. **VERIFY**: Verifica completude vs SPEC + testes (ag-validar-execucao + ag-testar-codigo). Loop convergente.
6. **REVIEW**: Code review (ag-revisar-codigo, +ag-verificar-seguranca se 10+ arquivos, +ag-revisar-ux se UI)
7. **SHIP**: Branch + PR com referencia a SPEC

## Modos (auto-detectados)

| Modo | Sinais | Agents internos |
|------|--------|-----------------|
| feature | default, "adicionar", "implementar" | ag-especificar-solucao → ag-planejar-execucao → ag-implementar-codigo |
| issue | "issue #N", "ticket" | gh fetch → ag-especificar-solucao → ag-planejar-execucao → ag-implementar-codigo |
| refactor | "refatorar", "renomear", "extrair" | ag-especificar-solucao minimal → ag-refatorar-codigo |
| optimize | "otimizar", "performance", "lento" | ag-especificar-solucao minimal → ag-otimizar-codigo |
| ui | "ui", "design", "tela", "layout" | ag-11-desenhar → ag-planejar-execucao → ag-implementar-codigo |
| integrate | "integrar", "incorporar", "due diligence" | ag-avaliar-software → ag-mapear-integracao → ag-planejar-incorporacao → ag-incorporar-modulo |

## Propriedades MERIDIAN

- **Autonomo**: nao para para perguntar (exceto Size XL para aprovacao)
- **Convergente**: VERIFY ↔ BUILD loop ate spec 100% (max 2 cycles)
- **State persistente**: `construir-state.json` — resume de onde parou
- **Self-healing**: falha → alternativa → documenta → continua
- **Artifacts**: SPEC, Plan, PR, testes

## Output

```
CONSTRUIR COMPLETO
  Modo: [feature/issue/...]
  Branch: [feat/...]
  PR: [url]
  SPEC: [docs/specs/...]
  Ciclos: [N]
  Completude: [X/Y]
  Testes: [N pass]
```

## Quando usar

- "adicionar feature X" → /construir
- "resolver issue #42" → /construir issue #42
- "refatorar modulo Y" → /construir refatorar Y
- "dashboard esta lento" → /construir otimizar dashboard
- "redesign da tela Z" → /construir ui Z
- "integrar sistema W" → /construir integrar W
