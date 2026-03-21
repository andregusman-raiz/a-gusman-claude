# Plugin vs Agent Routing

## Principio
Plugins sao atalhos rapidos. Agents sao pipelines com quality gates.
Usar o certo para cada situacao.

## Regras de Preferencia

### Git: ag-D-18 sobre /commit
- `/commit` e `/commit-push-pr` do plugin commit-commands NAO tem branch-guard nem lint-staged awareness
- Para projetos com branch protection → SEMPRE usar ag-D-18
- `/commit` plugin aceitavel apenas para: repos sem protecao, quick fixes em branch ja criada
- `/clean_gone` do plugin e seguro — nao tem equivalente em agents

### Code Review: depende do tamanho
- < 10 arquivos, review rapido → `/code-review` ou `/review-pr`
- 10+ arquivos, review completo → ag-Q-14 (Teams paired)
- Review + security audit → ag-Q-14 + ag-Q-15 (pipeline ag-M-00)

### Deploy: depende do risco
- Preview/staging rapido → `/deploy` (vercel plugin)
- Producao com pipeline → ag-D-27 (8 etapas com recovery)
- NUNCA plugin para producao sem CI verde

### Feature: depende da complexidade
- Feature isolada, sem pipeline QA → `/feature-dev`
- Feature com spec + testes + review → ag-P-06 → ag-P-07 → ag-B-08 (pipeline ag-M-00)
