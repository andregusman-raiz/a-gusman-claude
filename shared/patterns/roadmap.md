# Roadmap Patterns (Cross-Project)

## Convencao de IDs

### Formato: `MODULE-TYPE-NNN`

**Tipos:**
- `BUG` — Bug fix
- `FEAT` — Nova feature
- `IMP` — Melhoria/improvement

**Modulos** (definir por projeto no CLAUDE.md local):
Exemplo raiz-platform: CH, WS, CS, SM, AU, AN, BI, RL, RG, PG, GW, HS, CL, LT, DP, TV, WA, AD, GL, IF
Exemplo rAIz-AI-Prof: QS, MR, PR, LP, PEI, MM, TX, AS, BN, OM, GM, AD, LLM, UI, DB

## Lifecycle

```
intake → triage → backlog → sprint → planning → in-progress → verification → done
```

| Estagio | Significado |
|---------|-------------|
| intake | Item registrado, sem avaliacao |
| triage | Avaliado, priorizado (P0-P3) |
| backlog | Aprovado, aguardando sprint |
| sprint | Alocado em sprint especifica |
| planning | Em planejamento (PRD/SPEC) |
| in-progress | Em desenvolvimento |
| verification | Implementado, aguardando validacao |
| done | Validado e mergeado |

## Sizing

| Size | Estimativa | Requer |
|------|-----------|--------|
| S | < 2h | Nada (quick fix) |
| M | 2-8h | PRD |
| L | 8-20h | PRD + SPEC |
| XL | > 20h | PRD + SPEC + aprovacao |

## Estrutura de Pastas

```
roadmap/
├── README.md              # Convencoes deste projeto
├── backlog.md             # Lista priorizada unica
├── roadmap.md             # Visao trimestral (opcional)
├── sprints/
│   ├── SPRINT-YYYY-WNN.md # Sprint semanal
│   └── archive/           # Sprints passados
├── items/
│   ├── bugs/              # BUG items ativos
│   ├── features/          # FEAT items ativos
│   ├── improvements/      # IMP items ativos
│   └── archive/           # Items concluidos
├── specs/
│   └── ITEM-ID/           # PRD + SPEC por item
│       ├── PRD.md
│       └── SPEC.md
├── reports/
│   ├── diagnostics/       # Relatorios de diagnostico
│   └── validation/        # Relatorios de validacao
└── templates/             # Templates locais (opcionais)
```

## Templates

### Backlog Entry
```markdown
### MODULE-TYPE-NNN: Titulo curto
- **Priority:** P0|P1|P2|P3
- **Size:** S|M|L|XL
- **Status:** intake|triage|backlog|sprint|in-progress|verification|done
- **Sprint:** YYYY-WNN (quando alocado)
- **Description:** Uma linha descrevendo o problema/feature
- **Acceptance Criteria:**
  - [ ] Criterio 1
  - [ ] Criterio 2
```

### Sprint File
```markdown
# Sprint YYYY-WNN

**Periodo:** DD/MM - DD/MM
**Capacidade:** N items
**Foco:** [tema principal]

## Items

| ID | Titulo | Size | Status | Owner |
|----|--------|------|--------|-------|
| XX-BUG-001 | ... | S | done | ag-26 |
| XX-FEAT-002 | ... | M | in-progress | ag-08 |

## Metricas
- Velocity: N pontos
- Items concluidos: N/N
- Blockers: [lista]

## Retrospectiva
- O que funcionou: ...
- O que melhorar: ...
```

### PRD Template
```markdown
# PRD: MODULE-TYPE-NNN — Titulo

## Problema
[O que esta errado ou faltando]

## Escopo
[O que esta incluido e EXCLUIDO]

## Requisitos
1. [Req funcional]
2. [Req nao-funcional]

## Metricas de Sucesso
- [Como saber que deu certo]

## Riscos
- [O que pode dar errado]
```

### SPEC Template
```markdown
# SPEC: MODULE-TYPE-NNN — Titulo

**Max 200 linhas.** Se maior, dividir em sub-SPECs.

## Decisoes Tecnicas
- [Stack, patterns, trade-offs]

## Arquitetura
- [Diagrama ou descricao de componentes]

## Interfaces
- [APIs, schemas, contratos]

## Plano de Implementacao
1. [Passo 1]
2. [Passo 2]

## Edge Cases
- [Cenarios nao-obvios]

## Testes
- [O que testar e como]
```
