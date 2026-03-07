# 09 — Arvores de Decisao

> Quando usar cada agent, skill e workflow.

---

## 1. Arvore Principal: "O Que Voce Quer Fazer?"

```
Voce quer...

├── ENTENDER algo
│   ├── Codebase desconhecido → /discovery (skill) ou ag-00
│   ├── Bug especifico → ag-04 (debugger)
│   └── Decisoes de design → ag-09 (reviewer)
│
├── PLANEJAR algo
│   ├── Feature nova → /design (skill) → task_plan.md
│   ├── Diagnosticar bugs → /diagnose-bugs (skill) → bug-fix-plan.md
│   └── Projeto novo → ag-01 (scaffolder)
│
├── CONSTRUIR algo
│   ├── Feature com spec → ag-03 (builder) seguindo SPEC.md
│   ├── Task < 30 min → ag-03 (quick mode)
│   └── Projeto do zero → ag-01 → ag-02 → ag-03
│
├── CORRIGIR algo
│   ├── 1 bug simples → /fix-and-commit (skill)
│   ├── 3-5 bugs → /batch-fix (skill)
│   ├── 6+ bugs independentes → /parallel-fix (skill)
│   └── Bug complexo → ag-04 (debugger) → ag-03 (fix)
│
├── TESTAR algo
│   ├── Unit/integration → ag-07 ou /testing (skill)
│   └── E2E no browser → ag-08 ou /e2e-testing (skill)
│
├── REVISAR algo
│   ├── Codigo → ag-09 (reviewer)
│   ├── Seguranca → ag-10 ou /security-audit (skill)
│   └── UX → ag-11 ou /ux-review (skill)
│
├── REFATORAR algo
│   └── ag-07 (testes primeiro) → ag-05 (refatorar) → ag-07 (re-testar)
│
├── MIGRAR dados
│   └── ag-12 ou /migration (skill)
│
├── DEPLOYAR algo
│   ├── Pipeline completo → /deploy-pipeline (skill)
│   └── Deploy com monitoring → /deploy (skill) ou ag-13
│
└── DOCUMENTAR algo
    └── ag-14 ou /documentation (skill)
```

---

## 2. Arvore de Correcao de Bugs

```
Quantos bugs?

├── 1 bug
│   ├── Simples (< 30 min) → /fix-and-commit
│   └── Complexo (investigacao necessaria) → ag-04 → /fix-and-commit
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
| Haiku | ag-00 (orquestrador) |
| Sonnet | ag-01, ag-02, ag-06, ag-07, ag-08, ag-10, ag-11, ag-12, ag-13, ag-14 |
| Opus | ag-03 (builder), ag-04 (debugger), ag-05 (refactorer), ag-09 (reviewer), ag-M |

---

## 5. Arvore de Pipeline por Tipo de Trabalho

### Feature Nova

```
/design → SPEC.md
  → ag-03 (builder) → codigo
    → ag-06 (validador) → completude
      → ag-07 (tester) → testes
        → ag-09 (reviewer) → review
          → /fix-and-commit → commit final
```

### Bug Fix

```
ag-04 (debugger) → causa raiz
  → ag-03 (fix minimo)
    → ag-07 (teste de regressao)
      → /fix-and-commit
```

### Refatoracao

```
ag-07 (testes existentes passam?) → se nao: CRIAR testes primeiro
  → ag-05 (refatorar UMA coisa por vez)
    → ag-07 (testes ainda passam?)
      → Repetir ate concluir
```

### Deploy

```
ag-06 (validar completude)
  → ag-07 (testes passam?)
    → ag-10 (seguranca OK?)
      → ag-12 (migrations prontas?)
        → /deploy-pipeline (pipeline completo)
          → ag-14 (documentar release)
```

### Projeto Novo

```
ag-01 (scaffold)
  → ag-02 (ambiente)
    → /design (spec da primeira feature)
      → ag-03 (builder)
        → ag-07 (testes)
          → ag-10 (seguranca)
            → ag-13 (deploy)
              → ag-14 (documentacao)
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
| "Nao sei por onde comecar" | `/ag00` (orquestrador) |
| "Preciso entender esse codigo" | `/discovery` |
| "Quero planejar uma feature" | `/design` |
| "Implemente isso" | `ag-03` (builder) |
| "Tem um bug aqui" | `ag-04` → `/fix-and-commit` |
| "Corrige esses 5 bugs" | `/batch-fix` |
| "Corrige esses 15 bugs" | `/parallel-fix` |
| "Classifica esses bugs sem corrigir" | `/diagnose-bugs` |
| "Crie testes" | `/testing` ou `ag-07` |
| "Teste no browser" | `/e2e-testing` ou `ag-08` |
| "Revise esse codigo" | `ag-09` (reviewer) |
| "Verifique seguranca" | `/security-audit` ou `ag-10` |
| "Revise a UX" | `/ux-review` ou `ag-11` |
| "Refatore isso" | `ag-05` (precisa de testes antes) |
| "Faca o deploy" | `/deploy-pipeline` |
| "Documente isso" | `/documentation` ou `ag-14` |
