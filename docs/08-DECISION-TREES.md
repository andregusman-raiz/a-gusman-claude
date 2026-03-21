# 09 — Arvores de Decisao

> Quando usar cada agent, skill e workflow.

---

## 1. Arvore Principal: "O Que Voce Quer Fazer?"

```
Voce quer...

├── ENTENDER algo
│   ├── Codebase desconhecido → /discovery (skill) ou ag-M-00
│   ├── Bug especifico → ag-P-04 (debugger)
│   └── Decisoes de design → ag-B-09 (reviewer)
│
├── PLANEJAR algo
│   ├── Feature nova → /design (skill) → task_plan.md
│   ├── Diagnosticar bugs → /diagnose-bugs (skill) → bug-fix-plan.md
│   └── Projeto novo → ag-P-01 (scaffolder)
│
├── CONSTRUIR algo
│   ├── Feature com spec → ag-P-03 (builder) seguindo SPEC.md
│   ├── Task < 30 min → ag-P-03 (quick mode)
│   └── Projeto do zero → ag-P-01 → ag-P-02 → ag-P-03
│
├── CORRIGIR algo
│   ├── 1 bug simples → /fix-and-commit (skill)
│   ├── 3-5 bugs → /batch-fix (skill)
│   ├── 6+ bugs independentes → /parallel-fix (skill)
│   └── Bug complexo → ag-P-04 (debugger) → ag-P-03 (fix)
│
├── TESTAR algo
│   ├── Unit/integration → ag-P-07 ou /testing (skill)
│   └── E2E no browser → ag-B-08 ou /e2e-testing (skill)
│
├── REVISAR algo
│   ├── Codigo → ag-B-09 (reviewer)
│   ├── Seguranca → ag-B-10 ou /security-audit (skill)
│   └── UX → ag-B-11 ou /ux-review (skill)
│
├── REFATORAR algo
│   └── ag-P-07 (testes primeiro) → ag-P-05 (refatorar) → ag-P-07 (re-testar)
│
├── MIGRAR dados
│   └── ag-Q-12 ou /migration (skill)
│
├── DEPLOYAR algo
│   ├── Pipeline completo → /deploy-pipeline (skill)
│   └── Deploy com monitoring → /deploy (skill) ou ag-Q-13
│
└── DOCUMENTAR algo
    └── ag-Q-14 ou /documentation (skill)
```

---

## 2. Arvore de Correcao de Bugs

```
Quantos bugs?

├── 1 bug
│   ├── Simples (< 30 min) → /fix-and-commit
│   └── Complexo (investigacao necessaria) → ag-P-04 → /fix-and-commit
│
├── 2-5 bugs
│   ├── Mesmos arquivos → /batch-fix (mesmo sprint)
│   └── Arquivos diferentes → /batch-fix (sprints separados)
│
├── 6-20 bugs
│   ├── Independentes (modulos diferentes) → /parallel-fix
│   └── Dependentes (mesmos arquivos) → /batch-fix sequencial
│
└── 20+ bugs
    └── /diagnose-bugs primeiro → /parallel-fix em ondas
```

---

## 3. Arvore de Inicio de Sessao

```
Ao abrir Claude Code:

1. Existe docs/ai-state/session-state.json recente?
   ├── Sim → Oferecer retomar
   │         "Encontrei sessao anterior: [descricao]. Retomar?"
   └── Nao → Sessao nova

2. Usuario quer...
   ├── "execute", "fix", "implemente" → EXECUTAR DIRETO
   ├── "planeje", "desenhe" → ENTRAR EM PLAN MODE
   ├── "analise", "entenda" → SKILL DISCOVERY
   └── "deploy" → SKILL DEPLOY-PIPELINE

3. Complexidade da tarefa?
   ├── < 30 min, escopo claro → QUICK MODE (sem spec)
   ├── 30 min - 2h → SPEC simplificado
   └── > 2h → SDD completo (PRD → SPEC → Execucao → Review)
```

---

## 4. Arvore de Modelo (Custo vs Qualidade)

```
Que tipo de tarefa?

├── Lookup/scan simples → Haiku ($)
│   Exemplos: buscar arquivo, listar imports, verificar nome
│
├── Implementacao padrao → Sonnet ($$)
│   Exemplos: implementar feature, corrigir bug, criar testes
│
└── Analise profunda → Opus ($$$)
    Exemplos: arquitetura, refatoracao complexa, review de design
```

Mapeamento por agent:

| Model | Agents |
|-------|--------|
| Haiku | ag-M-00 (orquestrador) |
| Sonnet | ag-P-01, ag-P-02, ag-P-06, ag-P-07, ag-B-08, ag-B-10, ag-B-11, ag-Q-12, ag-Q-13, ag-Q-14 |
| Opus | ag-P-03 (builder), ag-P-04 (debugger), ag-P-05 (refactorer), ag-B-09 (reviewer), ag-M-99 |

---

## 5. Arvore de Pipeline por Tipo de Trabalho

### Feature Nova

```
/design → SPEC.md
  → ag-P-03 (builder) → codigo
    → ag-P-06 (validador) → completude
      → ag-P-07 (tester) → testes
        → ag-B-09 (reviewer) → review
          → /fix-and-commit → commit final
```

### Bug Fix

```
ag-P-04 (debugger) → causa raiz
  → ag-P-03 (fix minimo)
    → ag-P-07 (teste de regressao)
      → /fix-and-commit
```

### Refatoracao

```
ag-P-07 (testes existentes passam?) → se nao: CRIAR testes primeiro
  → ag-P-05 (refatorar UMA coisa por vez)
    → ag-P-07 (testes ainda passam?)
      → Repetir ate concluir
```

### Deploy

```
ag-P-06 (validar completude)
  → ag-P-07 (testes passam?)
    → ag-B-10 (seguranca OK?)
      → ag-Q-12 (migrations prontas?)
        → /deploy-pipeline (pipeline completo)
          → ag-Q-14 (documentar release)
```

### Projeto Novo

```
ag-P-01 (scaffold)
  → ag-P-02 (ambiente)
    → /design (spec da primeira feature)
      → ag-P-03 (builder)
        → ag-P-07 (testes)
          → ag-B-10 (seguranca)
            → ag-Q-13 (deploy)
              → ag-Q-14 (documentacao)
```

---

## 6. Arvore de Recovery (Quando Algo Deu Errado)

```
O que aconteceu?

├── Commit foi rejeitado por lint-staged
│   → Ler output de erro
│   → Corrigir lint errors
│   → Re-stage e re-commit (NAO usar --no-verify)
│
├── Build falhou por OOM
│   → Setar NODE_OPTIONS=--max-old-space-size=8192
│   → Re-rodar build
│
├── Testes falhando apos mudanca
│   → Ler output dos testes
│   → Corrigir root cause (nao a assertion)
│   → Re-rodar apenas testes que falharam
│
├── Deploy falhou
│   → Ler logs: vercel logs --follow
│   → Identificar causa (env var? bundle size? timeout?)
│   → Se critico em prod → rollback: vercel rollback
│
├── Merge conflict
│   → Resolver conflito no branch (nao na main)
│   → Rodar testes apos resolucao
│   → Commitar resolucao
│
├── Perdi trabalho (git stash drop, reset --hard)
│   → git reflog (pode recuperar commits recentes)
│   → Se session-state.json existe → saber o que foi feito
│   → Re-implementar usando session-state como guia
│
└── Contexto ficou confuso (respostas genericas)
    → Salvar estado em session-state.json
    → /clear
    → Retomar de onde parou
```

---

## 7. Resumo Rapido: Qual Skill/Agent Usar

| Situacao | Acao |
|----------|------|
| "Nao sei por onde comecar" | `/ag-M-00` (orquestrador) |
| "Preciso entender esse codigo" | `/discovery` |
| "Quero planejar uma feature" | `/design` |
| "Implemente isso" | `ag-P-03` (builder) |
| "Tem um bug aqui" | `ag-P-04` → `/fix-and-commit` |
| "Corrige esses 5 bugs" | `/batch-fix` |
| "Corrige esses 15 bugs" | `/parallel-fix` |
| "Classifica esses bugs sem corrigir" | `/diagnose-bugs` |
| "Crie testes" | `/testing` ou `ag-P-07` |
| "Teste no browser" | `/e2e-testing` ou `ag-B-08` |
| "Revise esse codigo" | `ag-B-09` (reviewer) |
| "Verifique seguranca" | `/security-audit` ou `ag-B-10` |
| "Revise a UX" | `/ux-review` ou `ag-B-11` |
| "Refatore isso" | `ag-P-05` (precisa de testes antes) |
| "Faca o deploy" | `/deploy-pipeline` |
| "Documente isso" | `/documentation` ou `ag-Q-14` |
