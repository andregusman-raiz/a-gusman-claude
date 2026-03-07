# 04 — Referencia Completa de Skills

> 15 skills executaveis para workflows especificos.

---

## Arvore de Decisao

```
Quantos fixes/tarefas?
  ├── 1 fix simples → /fix-and-commit
  ├── 3-5 bugs sequenciais → /batch-fix
  ├── 6+ bugs independentes → /parallel-fix
  └── Diagnosticar sem executar → /diagnose-bugs

Que tipo de trabalho?
  ├── Testes unitarios → /testing
  ├── Testes E2E → /e2e-testing
  ├── Deploy completo → /deploy-pipeline
  ├── Deploy com monitoring → /deploy
  ├── Migracao de banco → /migration
  ├── Auditoria de seguranca → /security-audit
  ├── Especificar feature → /design
  ├── Explorar codebase → /discovery
  ├── Documentacao → /documentation
  └── Review UX → /ux-review
```

---

## 1. fix-and-commit

Pipeline atomico: implementar fix → validar → commitar.

Crie `.claude/skills/fix-and-commit/SKILL.md`:

```markdown
---
description: "Pipeline completo: implementar fix, validar qualidade, commitar. Garante que lint-staged nunca rejeita."
---

# Skill: Fix and Commit

## Fluxo Obrigatorio

### 1. Implementar
- Fazer a correcao solicitada
- Manter mudancas minimas e focadas

### 2. Validar Types
npx tsc --noEmit (ou equivalente na sua stack)
- Se erros nos arquivos tocados → corrigir ANTES de prosseguir
- Se erros pre-existentes em outros arquivos → ignorar

### 3. Validar Lint
npx eslint --fix --max-warnings=0 [arquivos modificados] (ou equivalente)
- --fix aplica auto-corrections primeiro
- Se warnings restantes → corrigir manualmente

### 4. Stage
git add [arquivos especificos]
- NUNCA git add -A ou git add .
- Listar cada arquivo explicitamente

### 5. Commit
git commit -m "tipo(escopo): descricao concisa"
- Conventional commits: feat/fix/refactor/docs/test/chore
- Se lint-staged rejeitar → ler o erro, corrigir, retry (max 3x)
- NUNCA usar --no-verify

### 6. Reportar
Commitado: [hash curto] tipo(escopo): descricao
Arquivos: [lista]

## Proibicoes
- NUNCA --no-verify
- NUNCA git add -A
- NUNCA commitar .env ou secrets
```

---

## 2. batch-fix

Multi-bug fixes com checkpoints e commits incrementais.

Crie `.claude/skills/batch-fix/SKILL.md`:

```markdown
---
description: "Corrigir batch de bugs com checkpoints automaticos. Commits incrementais a cada 3 fixes. Nunca perder trabalho."
---

# Skill: Batch Fix

## Fluxo

### 1. Intake — Ler e Classificar
- Ler a lista de bugs (de arquivo, mensagem, ou pasta)
- SEMPRE ler conteudo real — NUNCA resumir de memoria
- Classificar: Modulo | Severidade (P0-P3) | Dependencia
- Agrupar bugs que tocam os mesmos arquivos

### 2. Planejar Sprints
- Dividir em sprints de 3-5 bugs cada
- P0 primeiro, depois agrupar por modulo

### 3. Executar Sprint (repetir)
Para cada sprint de 3-5 bugs:
a. Implementar cada fix
b. Validar: typecheck + lint
c. Commit incremental com lista dos bugs corrigidos
d. Reportar progresso

### 4. Summary Final
Tabela com todos os bugs, status, commit hash, arquivos.

## Regras de Protecao
- NUNCA acumular mais de 5 fixes sem commit
- Se API error → commit IMEDIATO
- Se lint-staged rejeitar → corrigir e retry (max 3x)
- Se bug requer mudanca arquitetural → parar e reportar
```

---

## 3. parallel-fix

Bug fixes paralelos com isolamento total por worktree.

Crie `.claude/skills/parallel-fix/SKILL.md`:

```markdown
---
description: "Corrigir bugs em paralelo com isolamento por worktree. Cada agent em branch separada, validation gates, coordinator merge apenas branches verdes."
---

# Skill: Parallel Fix (Worktree Isolation)

## Quando Usar
- 6+ bugs independentes em modulos diferentes
- Overhead de parallel se justifica

## Fluxo

### Fase 1 — Setup e Classificacao
1. Ler todos os bugs
2. Classificar por modulo/diretorio
3. Verificar independencia (se overlap → merge grupos)
4. Criar branch coordinator: git checkout -b fix/batch-YYYY-MM-DD

### Fase 2 — Spawn Agents Paralelos
Para cada grupo, spawn Task agent com:
- Lista EXPLICITA de arquivos permitidos
- Instrucao: implementar, validar (typecheck+lint), commitar
- NUNCA modificar arquivos fora do escopo

### Fase 3 — Collect e Validate
Aguardar agents, verificar sucesso e commits.

### Fase 4 — Merge Coordinator
- Merge branches verdes
- Se conflict trivial → resolver. Se complexo → reportar
- Validation final: typecheck + lint + test

### Fase 5 — Report
Tabela com grupos, agents, bugs, status, commits.

## Regras
- Max 5 agents paralelos
- Max 8 bugs por agent
- Se < 6 bugs → usar /batch-fix
- Ownership exclusivo (sem overlap de arquivos)
- Nunca force merge
```

---

## 4. diagnose-bugs

Diagnostico e classificacao SEM executar fixes.

Crie `.claude/skills/diagnose-bugs/SKILL.md`:

```markdown
---
description: "Diagnosticar bugs a partir de documentos/pasta. Ler conteudo real, classificar, gerar plano de sprints. NAO executar fixes."
---

# Skill: Diagnose Bugs

## Fluxo
### 1. Descoberta — Ler TUDO (conteudo real, nunca de memoria)
### 2. Catalogar: ID, Titulo, Modulo, Severidade (P0-P3), Arquivos, Tipo, Complexidade (S/M/L)
### 3. Agrupar por modulo e dependencias
### 4. Gerar plano de sprints de 3-5 bugs
### 5. Salvar em docs/ai-state/bug-fix-plan.md
### 6. Reportar opcoes: executar sprint 1? revisar plano? ajustar prioridades?

## Regras
- NUNCA executar fixes — apenas diagnosticar
- NUNCA resumir de memoria
- NUNCA assumir sem ler arquivo fonte
```

---

## 5. testing

Testes unitarios e de integracao (NAO E2E).

Crie `.claude/skills/testing/SKILL.md`:

```markdown
---
description: "Criar testes unitarios e de integracao provando que codigo funciona E falha corretamente. NAO para E2E — use e2e-testing."
---

# Skill: Testing (Unit + Integration)

## TDD com AI
1. Escrever testes ANTES da implementacao
2. Confirmar que testes FALHAM
3. Commitar testes separadamente
4. Implementar ate passarem
5. NUNCA modificar testes durante implementacao

## O Que Testar
- Happy path | Error path | Edge cases | Integration

## NAO Testar
- Condicoes do type checker, getters triviais, libs de terceiros, E2E

## Checklist por Teste
- Inputs parametrizados
- Descricao coincide com assercao
- Assercoes fortes (toEqual nao toBeGreaterThanOrEqual)
- Edge cases: strings vazias, arrays vazios, limites

## Organizacao
- Unit: *.spec.ts no mesmo diretorio
- Integration: *.integration.ts separado
```

---

## 6. e2e-testing

Testes Playwright com APIs reais.

Crie `.claude/skills/e2e-testing/SKILL.md`:

```markdown
---
description: "Testes E2E com Playwright como usuario real. APIs reais, nao mocks."
---

# Skill: E2E Testing (Playwright)

## APIS REAIS, NAO MOCKS

## Seletores: Accessibility-First
1. getByRole → 2. getByLabel → 3. getByText → 4. getByTestId → NUNCA CSS

## Testar Como Humano Real
- Double-click submit | Back durante loading | Acentos/emojis
- Teclado | Mobile 375x667 | Campo vazio + submit
- XSS em text fields | Sessao expirada

## Capturar: console errors, page errors, HTTP 4xx/5xx
## Output: docs/ai-state/e2e-report.md
```

---

## 7. deploy

Deploy controlado com smoke test e monitoring.

Crie `.claude/skills/deploy/SKILL.md`:

```markdown
---
description: "Deploy controlado com smoke test e rollback."
---

# Skill: Deploy + Monitoring

## Pre-condicoes (TODAS obrigatorias)
Testes passam | Audit sem criticos | Codigo versionado | Migracoes prontas | Env vars configuradas

## Fluxo
Verificar → Build → Deploy staging → Smoke test → Deploy prod → Smoke test → Monitoring

Se smoke test falha → rollback automatico.

## Monitoring Pos-Deploy (2h)
Error rate | Latencia P50/P95/P99 | Logs | Recursos | Health endpoints
```

---

## 8. deploy-pipeline

Pipeline autonomo end-to-end com auto-recovery.

Crie `.claude/skills/deploy-pipeline/SKILL.md`:

```markdown
---
description: "Pipeline autonomo end-to-end: env check, typecheck, lint, test, build, deploy, smoke test. Auto-recovery em cada etapa."
---

# Skill: Deploy Pipeline

## Principio
NAO parar em erros — diagnosticar e corrigir (max 3 tentativas por etapa).

## Etapas
1. **Env Check** — Node version, variaveis de ambiente
2. **TypeCheck** — Se erros, corrigir e re-rodar
3. **Lint** — --fix primeiro, corrigir restante
4. **Test** — Se falhas, corrigir root cause
5. **Build** — OOM protection, bundle size check
6. **Deploy** — Executar deploy na plataforma
7. **Smoke Test** — Verificar routes criticas
8. **Report** — Tabela com status de cada etapa

## Regras
- NUNCA usar --no-verify
- Se etapas 2-3 falham apos 3 tentativas → PARAR
- Se etapa 5 falha → NUNCA deploy com build quebrado
- Cada fix durante pipeline → commit descritivo
```

---

## 9. migration

Migracoes zero-downtime.

Crie `.claude/skills/migration/SKILL.md`:

```markdown
---
description: "Migracao de dados e schema sem perder dados e sem downtime."
---

# Skill: Migration

## Workflow: Planejar → Gerar (no ORM) → Validar (DOWN funciona?) → Testar

## Zero-Downtime Pattern
1. Coluna nullable → 2. Backfill dados → 3. Set NOT NULL

## BLOQUEAR
- DROP COLUMN sem backup → Soft delete primeiro
- ALTER TYPE com dados → Nova coluna → backfill → swap → drop
- NOT NULL sem default em tabela populada → Nullable → backfill → alter
- RENAME COLUMN em prod → Nova coluna → dual write → migrate reads → drop
```

---

## 10. security-audit

Auditoria OWASP Top 10.

Crie `.claude/skills/security-audit/SKILL.md`:

```markdown
---
description: "Auditoria de seguranca: OWASP Top 10, secrets em codigo, deps vulneraveis."
---

# Skill: Security Audit

## Checklist
1. **OWASP Top 10**: Injection, Broken Auth, Sensitive Data, XSS, etc.
2. **Secrets**: Buscar password, secret, api_key, token, private_key no codigo
3. **Deps**: npm audit / pip audit
4. **Permissoes**: CORS, menor privilegio, paths sanitizados, rate limiting
5. **Auth**: Bypass possivel? Token refresh? Password hashing? Session flags?

## Output: docs/ai-state/security-report.md
```

---

## 11. design

Especificacao tecnica + plano de execucao.

Crie `.claude/skills/design/SKILL.md`:

```markdown
---
description: "Especificar solucao tecnica e criar plano de execucao."
---

# Skill: Design (Especificar + Planejar)

## Fase 1: Especificacao
1. Interface do componente (inputs, outputs, comportamento)
2. Fluxos de usuario (happy path + error paths)
3. Estrutura de dados (schemas, tipos)
4. Edge cases (lista explicita)
5. Escopo (DENTRO e FORA)
6. Dependencias

## Fase 2: Plano de Execucao → task_plan.md
- Tarefas atomicas (cada compila)
- Checkpoints verificaveis
- Mais arriscado primeiro (fail fast)
- Plano e living document
```

---

## 12. discovery

Exploracao de codebase desconhecido.

Crie `.claude/skills/discovery/SKILL.md`:

```markdown
---
description: "Explorar e analisar codebase existente. Mapear arquitetura, stack, padroes, divida tecnica."
---

# Skill: Discovery

## Processo
1. **Deteccao de Stack**: package.json, requirements.txt, Cargo.toml, go.mod, etc.
2. **Mapeamento de Estrutura**: diretorios, entry points, configs
3. **Analise de Padroes**: consistencia, divida tecnica, riscos
4. **Output Incremental**: salvar a cada 2 arquivos lidos

## Produtos Finais
- docs/ai-state/project-profile.json — Stack, versoes, dependencias
- docs/ai-state/codebase-map.md — Mapa da arquitetura
- docs/ai-state/findings.md — Descobertas detalhadas
```

---

## 13. documentation

Documentacao que AJUDA.

Crie `.claude/skills/documentation/SKILL.md`:

```markdown
---
description: "Documentacao tecnica que AJUDA. README, API docs com exemplos que FUNCIONAM."
---

# Skill: Documentation

## README.md — Setup em 10 min
O que faz | Como rodar | Como testar | Como contribuir | Arquitetura

## API Docs — Por endpoint
Method + URL | Headers | Request body (exemplo real) | Response (exemplo real) | Erros | curl copiavel

## ADR — Decisoes importantes
Status | Data | Contexto | Decisao | Alternativas descartadas | Consequencias

## Principio: exemplos FUNCIONAM. Copiados do codigo real.
```

---

## 14. ux-review

Review de UX e acessibilidade.

Crie `.claude/skills/ux-review/SKILL.md`:

```markdown
---
description: "Review de UX e acessibilidade."
---

# Skill: UX Review — Usa Ralph Loop

## Checklist
- **Fluxos**: muitos cliques? Ordem logica? Confirmacao em acao destrutiva?
- **Acessibilidade**: contraste WCAG AA 4.5:1? Teclado? Screen reader?
- **Consistencia**: botoes iguais = acoes iguais? Terminologia uniforme?
- **Feedback**: erros ajudam resolver? Loading/empty/success states?
- **Mobile**: funciona 375x667? Touch targets >= 44px? Texto legivel?
```
