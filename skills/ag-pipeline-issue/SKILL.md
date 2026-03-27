---
name: ag-pipeline-issue
description: "Pipeline Issue→SPEC→Build→Verify→Test. Toda GitHub Issue gera SPEC antes de implementar, e toda implementacao e verificada contra a SPEC e testada. Use when starting work on a GitHub Issue."
model: sonnet
argument-hint: "[issue number ou URL] [--repo owner/repo]"
disable-model-invocation: true
---

# ag-pipeline-issue — Issue Pipeline

Pipeline obrigatorio para trabalho baseado em GitHub Issues.
Garante que toda issue tem SPEC, toda implementacao e verificada contra a SPEC, e toda entrega e testada.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-pipeline-issue`
- `mode`: `auto`
- `run_in_background`: `false`
- `prompt`: Compose from template below + $ARGUMENTS

**NOTE**: NOT background — orchestrator needs to coordinate sequential steps.

## Prompt Template

```
Issue: [issue number, URL, ou descricao]
Repo: [owner/repo — detectar via git remote se nao fornecido]
Projeto path: [CWD or user-provided path]

Executar pipeline completo: Fetch Issue → SPEC → Plan → Build → Verify → Test → Close.
Seguir TODAS as fases sequencialmente. NUNCA pular fase.
```

---

## Pipeline: 7 Fases

### Fase 0: Fetch Issue
Carregar contexto completo da issue do GitHub.

```bash
gh issue view [number] --json title,body,labels,assignees,comments
```

Extrair:
- **Titulo**: o que resolver
- **Body**: contexto, criterios de aceitacao, screenshots
- **Labels**: classificacao (bug, feature, tech-debt, security, etc)
- **Comentarios**: contexto adicional, discussoes

Se a issue nao tem criterios de aceitacao claros:
- Inferir do contexto e documentar na SPEC
- Marcar como `[INFERRED]` para review do usuario

### Fase 1: SPEC (ag-especificar-solucao)

Criar SPEC tecnica baseada na issue. Spawnar ag-especificar-solucao:

```
Agent({
  subagent_type: "ag-especificar-solucao",
  mode: "auto",
  run_in_background: false,
  prompt: "Feature/Problema: [titulo + body da issue #N]
Escopo: [extraido da issue]
Issue ref: #[number]

Criar SPEC tecnica implementavel. A SPEC DEVE incluir:
1. Referencia a issue: GitHub Issue #[number]
2. Criterios de aceitacao (extraidos ou inferidos da issue)
3. Interface/comportamento esperado
4. Edge cases
5. O que NAO esta no escopo (OOS)
6. Checklist de verificacao (cada item verificavel independentemente)

Salvar em: docs/specs/issue-[number]-spec.md
Max 200 linhas."
})
```

**Output**: `docs/specs/issue-[number]-spec.md`

**Gate**: SPEC existe e tem checklist de verificacao? Se nao → falha.

### Fase 2: Plan (ag-planejar-execucao)

Quebrar SPEC em tarefas atomicas. Spawnar ag-planejar-execucao:

```
Agent({
  subagent_type: "ag-planejar-execucao",
  mode: "auto",
  run_in_background: false,
  prompt: "Projeto: [path]
SPEC: docs/specs/issue-[number]-spec.md
Issue ref: #[number]

Quebrar SPEC em task_plan.md com tarefas atomicas, dependencias e estimativas.
Incluir fase de testes como tasks explicitas no plano.
Salvar em: docs/specs/issue-[number]-plan.md"
})
```

**Output**: `docs/specs/issue-[number]-plan.md`

**Gate**: Plano tem tasks de teste? Se nao → adicionar antes de prosseguir.

### Fase 3: Branch + Build (ag-versionar-codigo + ag-implementar-codigo)

Criar branch e implementar:

```bash
# Criar branch vinculada a issue
git checkout -b feat/issue-[number]-[slug] origin/main
```

Spawnar ag-implementar-codigo:
```
Agent({
  subagent_type: "ag-implementar-codigo",
  mode: "bypassPermissions",
  run_in_background: true,
  isolation: "worktree",
  prompt: "Projeto: [path]
Branch: feat/issue-[number]-[slug]
Scope: docs/specs/issue-[number]-plan.md

Implementar seguindo o plano. Re-ler plano a cada 10 acoes.
SPEC de referencia: docs/specs/issue-[number]-spec.md
Issue ref: #[number]"
})
```

**Gate**: Build completou com self-check passando? Se nao → ag-depurar-erro para debug.

### Fase 4: Verify vs SPEC (ag-validar-execucao)

Verificacao independente: implementacao cobre TODOS os itens da SPEC?

```
Agent({
  subagent_type: "ag-validar-execucao",
  mode: "auto",
  run_in_background: false,
  prompt: "Projeto: [path]
Plano/SPEC: docs/specs/issue-[number]-spec.md

Carregar a SPEC original e verificar item por item:
- Cada criterio de aceitacao implementado?
- Cada edge case tratado?
- Cada item do checklist de verificacao atendido?

Reportar: Total | Done | Parcial | Faltando
Se FALTANDO > 0 → listar exatamente o que falta."
})
```

**Gate**: Faltando == 0 E Parcial == 0?
- Se sim → prosseguir para Fase 5
- Se nao → retornar ao ag-implementar-codigo com lista do que falta (max 1 iteracao)
- Se apos 1 iteracao ainda incompleto → reportar ao usuario

### Fase 5: Test (ag-testar-codigo + ag-testar-e2e)

Criar e rodar testes cobrindo a SPEC:

```
Agent({
  subagent_type: "ag-testar-codigo",
  mode: "bypassPermissions",
  run_in_background: true,
  prompt: "Projeto: [path]
Scope: arquivos modificados em feat/issue-[number]-[slug]
Framework: auto-detect
Modo: pos-implementacao (Green)
SPEC ref: docs/specs/issue-[number]-spec.md

Criar testes que validem CADA criterio de aceitacao da SPEC.
Cada criterio da SPEC deve ter pelo menos 1 teste correspondente.
Rodar suite completa e reportar resultado."
})
```

Para issues com componentes de UI, rodar E2E em paralelo:
```
Agent({
  subagent_type: "ag-testar-e2e",
  mode: "bypassPermissions",
  run_in_background: true,
  prompt: "Projeto: [path]
Scope: fluxos de UI afetados pela issue #[number]
SPEC ref: docs/specs/issue-[number]-spec.md"
})
```

**Gate**: Todos os testes passam?
- Se sim → prosseguir para Fase 6
- Se nao → ag-depurar-erro para debug dos testes falhando (max 2 tentativas)
- Se persistir → ag-registrar-issue para registrar issue com teste falhando

### Fase 6: PR + Close

Criar PR linkando a issue e com evidencia de verificacao:

```bash
git push -u origin feat/issue-[number]-[slug]

gh pr create --base main \
  --title "tipo(escopo): descricao — closes #[number]" \
  --body "$(cat <<'EOF'
## Issue
Closes #[number]

## SPEC
Implementado conforme `docs/specs/issue-[number]-spec.md`

## Verificacao (ag-validar-execucao)
- Total: X items | Done: X | Parcial: 0 | Faltando: 0

## Testes
- Unit: X passing
- E2E: X passing (se aplicavel)

## Checklist
- [x] SPEC criada e seguida
- [x] Verificacao vs SPEC: 100% completo
- [x] Testes criados para cada criterio de aceitacao
- [x] Todos os testes passando
- [x] Typecheck + lint passando

---
*Pipeline executado por ag-pipeline-issue*
EOF
)"
```

A issue sera fechada automaticamente pelo `closes #[number]` no merge.

---

## Decisao: Tipo de Issue → Depth da SPEC

| Labels da Issue | SPEC Depth | Plan? | Justificativa |
|-----------------|-----------|-------|---------------|
| `bug` (simples, < 5 arquivos) | minimal (< 50 linhas) | skip | Bug com causa clara, nao precisa plano |
| `bug` (complexo, multi-layer) | full | yes | Bug que precisa investigacao |
| `feature` | full | yes | Feature sempre precisa SPEC completa |
| `tech-debt` | minimal | skip | Refactor com escopo definido |
| `security` (P0/P1) | full | yes | Seguranca precisa rigor |
| `incident` | minimal → full | depends | Hotfix rapido, SPEC retroativa |

Para bugs simples, a SPEC pode ser condensada:
```markdown
# SPEC: Issue #123 — [titulo]
## Problema: [descricao do bug]
## Causa raiz: [a ser preenchida por ag-depurar-erro]
## Fix esperado: [descricao]
## Verificacao:
- [ ] Bug nao reproduz mais
- [ ] Teste de regressao criado
- [ ] Nenhum side effect
```

---

## Hotfix Express (bypass parcial)

Para issues com label `hotfix` ou severidade P0-critical:

1. SPEC minimal criada RETROATIVAMENTE (apos o fix)
2. Build e fix PRIMEIRO (ag-depurar-erro ou ag-corrigir-bugs --fix)
3. Verificacao vs SPEC retroativa
4. Testes obrigatorios (sem bypass)

Fluxo: Fix → SPEC retroativa → Verify → Test → PR

---

## Interacao com ag-registrar-issue

Se durante qualquer fase do pipeline um problema nao resolvido e encontrado:
- ag-implementar-codigo bloqueado → ag-registrar-issue cria issue derivada
- ag-validar-execucao detecta incompletude irresolvivel → ag-registrar-issue cria issue de follow-up
- ag-testar-codigo testes falhando apos retries → ag-registrar-issue cria issue de test failure

Issues derivadas referenciam a issue original: "Derivada de #[number]"

---

## Artefatos Produzidos

| Fase | Artefato | Path |
|------|----------|------|
| SPEC | Especificacao tecnica | `docs/specs/issue-[number]-spec.md` |
| Plan | Plano de execucao | `docs/specs/issue-[number]-plan.md` |
| Build | Codigo implementado | branch `feat/issue-[number]-*` |
| Verify | Report de completude | inline no output do ag-validar-execucao |
| Test | Arquivos de teste | junto ao codigo |
| PR | Pull Request | GitHub PR linkando issue |

---

## Anti-Patterns

- NUNCA implementar sem SPEC — mesmo para bugs simples, criar SPEC minimal
- NUNCA pular verificacao vs SPEC — e a unica garantia de completude
- NUNCA declarar "done" sem testes — testes sao obrigatorios para TODA issue
- NUNCA criar PR sem `closes #N` — issue deve ser fechada automaticamente
- NUNCA fazer SPEC de 300+ linhas — dividir a issue se necessario
- NUNCA reutilizar SPEC de outra issue — cada issue tem sua propria SPEC
- NUNCA apagar SPEC apos merge — SPEC e documentacao permanente

## Quality Gate

- [ ] Issue fetched com contexto completo?
- [ ] SPEC criada com checklist de verificacao?
- [ ] Plano criado com tasks atomicas (se aplicavel)?
- [ ] Build completou com self-check?
- [ ] Verificacao vs SPEC: 0 faltando, 0 parcial?
- [ ] Testes criados para cada criterio de aceitacao?
- [ ] Todos os testes passando?
- [ ] PR criado com `closes #N` e evidencia de verificacao?
