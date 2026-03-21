---
description: "Guia rapido de decisao — qual agent usar para cada situacao"
paths:
  - "**/*"
---

# Agent Decision Guide — Quick Reference

## Eu quero...

### Comecar algo novo
- **Projeto novo** → ag-P-01 (scaffold) → ag-P-02 (ambiente)
- **Entender codebase** → ag-P-03 (explorar)
- **Pesquisar alternativas** → ag-P-05 (referencia)
- **Escrever spec** → ag-P-06 (especificar) → ag-P-07 (planejar)

### Construir
- **Implementar feature** → ag-B-08 (construir)
- **Refatorar** → ag-B-10 (refatorar)
- **Otimizar performance** → ag-B-11 (otimizar)

### Corrigir bugs
- **1 bug** → ag-B-09 (depurar) ou ag-B-23 --fix (fix + verificar)
- **2-5 bugs** → ag-B-23 --batch (bugfix em sprints)
- **6+ bugs** → ag-B-23 --parallel (bugfix paralelo com Teams)
- **Triagem sem executar** → ag-B-23 --triage (diagnosticar)

### Construir (avancado)
- **Builder + Validator concorrente** → ag-B-50 (construir-validado)
- **Design UI/UX** → ag-B-52 (design-ui-ux)

### Testar e validar
- **Testes unitarios** → ag-Q-13
- **Testes E2E** → ag-Q-22
- **E2E suite completa em batches** → ag-Q-51 (testar-e2e-batch)
- **Teste exploratorio** → ag-Q-36
- **Ciclo completo test-fix-retest** → ag-Q-39
- **Validar que tudo foi implementado** → ag-Q-12
- **Code review** → ag-Q-14
- **Security audit** → ag-Q-15
- **UX review rapido** → ag-Q-16

### Deploy
- **Deploy simples** → ag-D-19
- **Pipeline completo** → ag-D-27
- **Smoke test pos-deploy** → ag-D-38
- **Monitorar producao** → ag-D-20
- **Migration de banco** → ag-D-17

### Documentar
- **Docs do projeto** → ag-W-21
- **Gerar documentos Office** → ag-W-29
- **Organizar arquivos** → ag-W-30

### Incorporar software externo
- **Avaliar** → ag-I-32 → ag-I-33 → ag-I-34 → ag-I-35 (pipeline sequencial)

### Trabalhar em GitHub Issue
- **Resolver issue #N** → ag-M-51 (issue-pipeline): Issue→SPEC→Build→Verify→Test→PR

### Meta / Skills
- **Criar/melhorar skill** → ag-M-49 (criar-skill)
- **Melhorar agentes existentes** → ag-M-99
- **Registrar issue para problema nao resolvido** → ag-M-50 (registrar-issue)
- **Pipeline issue completo** → ag-M-51 (issue-pipeline)

### Referencia (on-demand, context-only)
- **Next.js/React patterns** → ag-R-53 | **TypeScript** → ag-R-54 | **Python** → ag-R-55
- **Supabase/PostgreSQL** → ag-R-56 | **Quality gates** → ag-R-57
- **SDD methodology** → ag-R-58 | **Security rules** → ag-R-59

### Plugins (atalhos rapidos)
- **Code review rapido** → `/code-review` ou `/review-pr`
- **Commit rapido** (sem branch-guard) → `/commit` ou `/commit-push-pr`
- **Feature self-contained** → `/feature-dev`
- **Deploy rapido** → `/deploy` (vercel plugin)
- **Limpar branches** → `/clean_gone`
- **Auditar CLAUDE.md** → `/revise-claude-md`
- **Criar hooks ad-hoc** → `/hookify`
- **Erros em producao** → `/seer` (sentry)
- **Resumo Slack** → `/summarize-channel`, `/standup`
- **Scaffold Agent SDK** → `/new-sdk-app`
- **Design de Figma** → `implement-design` (figma skill)

## Regra de ouro
Na duvida, use `/ag-M-00-orquestrar` — ele classifica a intencao e seleciona o agent certo.
Plugins para atalhos rapidos. Agents para pipelines com quality gates.
