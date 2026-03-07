# 05 — Referencia Completa de Rules

> 7 regras de disciplina que guiam o comportamento dos agents automaticamente.

---

## Como Rules Funcionam

Rules em `.claude/rules/` sao carregadas automaticamente pelo Claude Code quando arquivos no `paths` sao modificados. Elas atuam como disciplinas automaticas — o Claude segue essas regras sem precisar ser lembrado.

---

## 1. gsd.md — Get Shit Done

Crie `.claude/rules/gsd.md`:

```markdown
---
description: "Disciplina de execucao focada - Get Shit Done"
paths:
  - "src/**/*"
  - "app/**/*"
  - "lib/**/*"
  - "packages/**/*"
---

# Protocolo GSD — Get Shit Done

## Principios
1. **Comece pelo mais arriscado** — fail fast, feedback rapido
2. **Progresso visivel** — reporte cada arquivo criado/modificado
3. **Vies para acao** — decisao tecnica menor: decida sozinho. Arquitetural: proponha e peca OK
4. **Tarefas atomicas** — cada passo produz algo que compila
5. **Quick Mode** — tarefas < 30 min com escopo claro: pule plano, implemente direto
6. **Commits incrementais** — commite conforme avanca, nao so no final
```

---

## 2. commit-conventions.md

Crie `.claude/rules/commit-conventions.md`:

```markdown
---
description: "Convencoes de commit e versionamento"
paths:
  - "**/*"
---

# Convencoes de Commit

## Conventional Commits: tipo(escopo): descricao
- feat: nova funcionalidade
- fix: correcao
- refactor: estrutura
- docs: documentacao
- test: testes
- chore: manutencao

## Regras
- Cada commit compila e passa testes
- Um commit por unidade logica (nao por arquivo)
- NAO referencie "Claude" ou "AI" nas mensagens
- Branch naming: feat/nome, fix/nome, refactor/nome
```

---

## 3. incremental-commits.md

Crie `.claude/rules/incremental-commits.md`:

```markdown
---
description: "Protocolo de commits incrementais para proteger trabalho em andamento"
paths:
  - "**/*"
---

# Protocolo de Commits Incrementais

## Regra dos 3-5 Fixes

Quando trabalhando em batch de bugs/fixes/mudancas:

1. Apos cada 3-5 fixes implementados → PARE
2. Rode: typecheck nos arquivos tocados
3. Rode: lint nos arquivos tocados
4. Se ambos passam → commit imediato com mensagem semantica
5. Se falham → corrija ANTES de continuar
6. NUNCA acumule mais de 5 mudancas sem commit

## Em Caso de Instabilidade

Se detectar API error, rate limit, ou qualquer instabilidade:

1. Commit IMEDIATO de todo trabalho em progresso
2. Mensagem: wip: progresso parcial - X de Y completos
3. Melhor um WIP commit do que perder tudo

## Pre-Commit Validation

ANTES de cada git commit:
1. Typecheck → zero erros
2. Lint → zero warnings
3. Se lint-staged rejeitar → corrigir e retry (max 3x)
4. NUNCA usar --no-verify
```

---

## 4. quality-gate.md

Crie `.claude/rules/quality-gate.md`:

```markdown
---
description: "Self-check antes de declarar qualquer trabalho como completo"
paths:
  - "**/*"
---

# Protocolo Quality Gate

## ANTES de declarar trabalho completo:

### 1. Re-ler Objetivo Original
Abra o task_plan.md, SPEC.md, ou a mensagem original.

### 2. Checklist Item por Item
Para CADA item:
- [ ] Implementado? (existe no codigo)
- [ ] Completo? (nao e stub/placeholder)
- [ ] Conectado? (integrado com o resto)

### 3. Contagem
Total: X | Completos: Y | Parciais: Z | Faltando: W
Se W > 0 ou Z > 0 → continue implementando

### 4. Limite de Iteracoes
Maximo 2 ciclos de verificacao completos.
Se apos 2 ciclos ainda houver pendencias → reportar status ao usuario.
NAO entrar em loop infinito.

### 5. Declaracao
"Completei X/Y itens. [Status de pendencias se houver]."
```

---

## 5. persistent-state.md

Crie `.claude/rules/persistent-state.md`:

```markdown
---
description: "Regras de persistencia de estado em disco durante trabalho"
paths:
  - "**/*"
---

# Protocolo de Estado Persistente

## Principio Manus
Context Window = RAM (volatil). Filesystem = Disco (persistente).
Tudo importante vai pro disco DURANTE o trabalho, nao no final.

## Regra dos 20 Actions
A cada 20 tool calls, PARE e:
1. Atualize docs/ai-state/session-state.json com progresso atual
2. Se encontrou erro critico → atualize docs/ai-state/errors-log.md

## Regra de Re-Leitura
A cada 30 tool calls, PARE e:
1. Re-leia o plano (task_plan.md ou SPEC.md)
2. Se desviou → corrija o curso

## Formato session-state.json
{
  "last_updated": "ISO-8601",
  "agent_active": "builder|debugger|etc",
  "task_description": "O que esta sendo feito",
  "progress": {
    "completed": ["item 1"],
    "in_progress": "item atual",
    "remaining": ["item 3"]
  },
  "files_modified": ["path/to/file1.ts"],
  "notes": "Contexto para proxima sessao"
}

## Recuperacao de Sessao
Quando detectar sessao anterior:
1. Ler session-state.json
2. Ler errors-log.md
3. git log --oneline -10
4. Oferecer: "Encontrei sessao anterior. Retomar?"

## Context Reset Protocol
Quando contexto atingir ~60k tokens:
1. Salvar estado em session-state.json
2. Sugerir /clear
3. Apos clear, ler estado e continuar
```

---

## 6. ralph-loop.md

Crie `.claude/rules/ralph-loop.md`:

```markdown
---
description: "Protocolo de refinamento iterativo para convergencia de qualidade"
paths:
  - "docs/**/*"
  - "specs/**/*"
  - "**/*.spec.*"
  - "**/*.test.*"
---

# Protocolo Ralph Loop

## Ciclo CREATE → EVALUATE → REFINE (max 3 iteracoes)
1. **CREATE**: Produza primeira versao
2. **EVALUATE**: Avalie contra criterios definidos
3. **REFINE**: Melhore baseado na avaliacao

## Regras
- **Track best, not latest** — se v3 piorou vs v2, use v2
- **Promessa de completude** — declare O QUE entrega, COMO avalia, QUANDO esta pronto
- **Verification-first** — reproduza o problema ANTES de corrigir. Meca ANTES de otimizar
```

---

## 7. agent-boundaries.md

Crie `.claude/rules/agent-boundaries.md`:

```markdown
---
description: "Regras de ownership de arquivos para agents paralelos"
paths:
  - "**/*"
---

# Protocolo de Boundaries para Agents Paralelos

## Principio
Quando multiplos agents trabalham em paralelo, CADA agent tem ownership exclusivo.

## Regras de Ownership

### 1. Declarar Escopo Antes de Executar
Cada agent recebe:
- Lista EXPLICITA de arquivos que pode modificar
- Lista de arquivos que NAO pode tocar
- Escopo de commits

### 2. Sem Overlap
Se dois agents precisam do mesmo arquivo → NAO paralelizar.

### 3. Arquivos Compartilhados (Read-Only)
- package.json / lock files
- tsconfig.json / configs de build
- middleware / tipos compartilhados / .env

Se agent precisa modificar shared file → reportar ao coordinator.

### 4. Coordinator Responsabilidades
- Dividir tasks em grupos independentes
- Atribuir ownership explicito
- Verificar que nao ha overlap
- Merge apenas branches verdes
- Resolver conflicts

### 5. Validation Gate por Agent
Antes de merge:
- Typecheck passando
- Lint passando
- Commit com mensagem descritiva

### 6. Limites
- Max 5 agents paralelos
- Max 8 arquivos por agent
- Se total < 6 tasks → usar sequencial

## Anti-Patterns
- NUNCA agents sem escopo definido
- NUNCA dois agents no mesmo arquivo
- NUNCA merge branch sem validation
- NUNCA modificar package.json em paralelo
```
