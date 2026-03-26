---
name: ag-2-corrigir
description: "Maquina autonoma de correcao. Bugs, erros TypeScript, tech debt — auto-detecta modo, diagnostica, corrige, verifica em loop convergente. Produz PR com fix verificado."
model: opus
context: fork
argument-hint: "[bug ou lista] [--resume] [--skip-pr] [--triage-only]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage
metadata:
  filePattern: "corrigir-state.json,errors-log.md"
  bashPattern: "corrigir"
  priority: 97
---

# CORRIGIR — Maquina Autonoma de Correcao

## Invocacao

```
/corrigir login nao funciona apos Clerk update       # Bug unico
/corrigir tipos                                       # Sweep TypeScript
/corrigir lista: [bug1, bug2, bug3]                  # Batch
/corrigir debt modulo financeiro                      # Tech debt
/corrigir --triage-only erros reportados pelo QA      # So diagnosticar
/corrigir --resume                                    # Retomar
```

## O que faz

Correcao completa AUTONOMA em 4 fases:

```
ASSESS → DIAGNOSE → FIX → VERIFY → (loop ate green) → SHIP
                     ↑       │
                     └───────┘  (convergencia: max 2 cycles)
```

1. **ASSESS**: Auto-detecta modo (bug/tipos/batch/debt/triage), estima volume
2. **DIAGNOSE**: Causa raiz, categoriza, prioriza (ag-depurar-erro se obscuro)
3. **FIX**: Corrige (ag-corrigir-bugs/B-53 conforme modo). Loop convergente.
4. **VERIFY**: Typecheck + lint + testes. Se red → volta para FIX.
5. **SHIP**: PR com diagnostico e evidencia.

## Modos (auto-detectados)

| Modo | Sinais | Agents internos |
|------|--------|-----------------|
| bug | 1 bug claro/obscuro | ag-depurar-erro (debug) + ag-corrigir-bugs --fix |
| tipos | "typecheck", "TS errors" | ag-corrigir-tipos (--fix ou --sweep) |
| batch | lista de bugs, "corrigir todos" | ag-corrigir-bugs --batch ou --parallel |
| debt | "tech debt", "cleanup" | fix direto em batches de 5 |
| triage | "diagnosticar", desconhecido | ag-corrigir-bugs --triage (read-only) |

## Propriedades MERIDIAN

- **Autonomo**: diagnostica e corrige sem perguntar
- **Convergente**: FIX ↔ VERIFY loop ate green (max 2 cycles)
- **State persistente**: `corrigir-state.json` — resume de onde parou
- **Self-healing**: regressao → revert + alternativa
- **Artifacts**: PR com diagnostico, errors-log.md atualizado

## Output

```
CORRIGIR COMPLETO
  Modo: [bug/tipos/batch/debt]
  Branch: [fix/...]
  PR: [url]
  Corrigidos: [X/Y]
  Ciclos: [N]
  Testes: [status]
```
