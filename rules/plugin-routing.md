# Plugin vs Agent Routing

## Principio
Plugins sao atalhos rapidos. Agents sao pipelines com quality gates.
Usar o certo para cada situacao.

## Regras de Preferencia

### Git: ag-versionar-codigo sobre /commit
- `/commit` e `/commit-push-pr` do plugin commit-commands NAO tem branch-guard nem lint-staged awareness
- Para projetos com branch protection → SEMPRE usar ag-versionar-codigo
- `/commit` plugin aceitavel apenas para: repos sem protecao, quick fixes em branch ja criada
- `/clean_gone` do plugin e seguro — nao tem equivalente em agents

### Code Review: depende do tamanho
- < 10 arquivos, review rapido → `/code-review` ou `/review-pr`
- 10+ arquivos, review completo → ag-revisar-codigo (Teams paired)
- Review + security audit → ag-revisar-codigo + ag-verificar-seguranca (pipeline ag-0-orquestrador)

### Deploy: depende do risco
- Preview/staging rapido → `/deploy` (vercel plugin)
- Producao com pipeline → ag-pipeline-deploy (8 etapas com recovery)
- NUNCA plugin para producao sem CI verde

### Feature: depende da complexidade
- Feature isolada, sem pipeline QA → `/feature-dev`
- Feature com spec + testes + review → ag-especificar-solucao → ag-planejar-execucao → ag-implementar-codigo (pipeline ag-0-orquestrador)
