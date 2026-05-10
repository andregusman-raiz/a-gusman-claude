---
name: ag-2-corrigir
description: "Maquina autonoma de correcao. Bugs, erros TypeScript, tech debt — auto-detecta modo, diagnostica, corrige, verifica em loop convergente. Produz PR com fix verificado."
model: sonnet
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
                     └───────┘  (convergencia: max 3 cycles — Definition of Done CLAUDE.md)
```

### Emissao de Phase Tags (observabilidade)

Emitir linha de status a cada transicao de fase:

```
[ASSESS ✓] modo=bug ciclos_max=3
[DIAGNOSE ✓] causa_raiz="null ref em adapter" confianca=alta hipoteses=3
[FIX →] aplicando fix em 2 arquivos...
[VERIFY ✓] typecheck=0 lint=0 tests=8/8 ciclo=1/3
[SHIP ✓] branch=fix/X PR=#43
```

Se VERIFY falha: `[VERIFY ✗] ciclo=2/3 erros=3 → voltando para FIX`

1. **ASSESS**: Auto-detecta modo (bug/tipos/batch/debt/triage), estima volume
2. **DIAGNOSE**: Causa raiz, categoriza, prioriza (ag-depurar-erro se obscuro). Listar 3+ hipoteses concorrentes (Deep Reasoning Directive).
3. **FIX**: Corrige (ag-corrigir-bugs/B-53 conforme modo). Loop convergente.
4. **VERIFY**: Typecheck + lint + testes. Se red → volta para FIX.
5. **SHIP**: PR com diagnostico e evidencia.

### ReasoningBank — Fix Strategy Persistence

Ao encerrar fix bem-sucedido (VERIFY verde), extrair e persistir o pattern:

```bash
# Append em meridian-kb/fix-strategies.json (criar se nao existe)
FIX_ENTRY=$(python3 -c "
import json, sys, datetime
entry = {
  'ts': '$(date -u +%Y-%m-%dT%H:%M:%SZ)',
  'sintoma': 'SINTOMA_AQUI',
  'causa_raiz': 'CAUSA_AQUI',
  'fix_aplicado': 'FIX_AQUI',
  'arquivos': [],
  'modo': 'MODO_AQUI',
  'ciclos': 1
}
print(json.dumps(entry))
")
mkdir -p meridian-kb
STRATEGIES_FILE="meridian-kb/fix-strategies.json"
if [ -f "\$STRATEGIES_FILE" ]; then
  python3 -c "
import json
with open('\$STRATEGIES_FILE') as f:
  data = json.load(f)
data['strategies'].append(\$FIX_ENTRY)
with open('\$STRATEGIES_FILE', 'w') as f:
  json.dump(data, f, indent=2)
"
else
  echo '{ \"strategies\": [\$FIX_ENTRY] }' > "\$STRATEGIES_FILE"
fi
```

**ANTES de diagnosticar:** Buscar fix similar em `meridian-kb/fix-strategies.json` por sintoma/causa. Se match encontrado, usar como hipotese inicial (confianca elevada).

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
- **Convergente**: FIX ↔ VERIFY loop ate green (max 3 cycles). VERIFY OBRIGATORIO roda typecheck + lint + test (Definition of Done CLAUDE.md). Apos 3 ciclos red, parar e reportar.
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
