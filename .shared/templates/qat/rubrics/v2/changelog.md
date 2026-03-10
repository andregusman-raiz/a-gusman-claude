# QAT Rubrics v2 — Changelog

## Versionamento

Rubricas seguem semver: `MAJOR.MINOR.PATCH`
- **MAJOR**: Mudanca de criterios que invalida baselines anteriores
- **MINOR**: Ajuste de escalas ou pesos que pode impactar scores
- **PATCH**: Correcao de descricao ou typo sem impacto em score

## Historico

### 2.0.0 (2026-03-10) — Initial v2

Todas as rubricas especificas criadas com:
- Escalas detalhadas de 6 niveis (1-2, 3-4, 5, 6-7, 8-9, 10)
- Pesos diferenciados por criterio
- Penalidades especificas por dominio
- Referencia a golden samples e anti-patterns

| Rubrica | ID | Tipo | Dominio | Criterios | Penalidades |
|---------|-----|------|---------|-----------|-------------|
| chat-educacional | chat-educacional-v2 | chat | educacao | 5 (0.25/0.25/0.25/0.15/0.10) | 3 |
| extended-thinking | extended-thinking-v2 | chat | educacao | 5 (0.30/0.25/0.20/0.15/0.10) | 3 |
| rag-query | rag-query-v2 | chat | educacao | 5 (0.35/0.25/0.20/0.15/0.05) | 3 |
| plano-de-aula | plano-de-aula-v2 | chat | educacao | 5 (0.25/0.25/0.25/0.15/0.10) | 3 |
| relatorio-executivo | relatorio-executivo-v2 | presentation | educacao | 5 (0.25/0.25/0.20/0.20/0.10) | 3 |
| geracao-codigo | geracao-codigo-v2 | automation | tecnologia | 5 (0.30/0.25/0.20/0.15/0.10) | 3 |
| imagem-educacional | imagem-educacional-v2 | image | educacao | 5 (0.30/0.25/0.20/0.15/0.10) | 3 |

### Design Decisions

- **5 criterios por rubrica**: Equilibrio entre granularidade e custo de avaliacao
- **Peso max 0.35**: Nenhum criterio domina >35% do score final
- **3 penalidades por rubrica**: Idioma-errado universal + 2 especificas do dominio
- **Tipo base preservado**: Cada rubrica especifica herda de um tipo generico (chat, image, etc.)
- **Golden samples obrigatorios**: Toda rubrica referencia golden sample + anti-patterns

### Migration from v1

Rubricas v1 (em `fixtures/rubrics.template.ts`) continuam funcionando como fallback.
Rubricas v2 sao usadas quando `rubricPath` esta configurado no cenario em `qat.config.ts`.

Prioridade de resolucao:
1. `scenario.rubricPath` → rubrica v2 especifica
2. `rubrics[scenario.type]` → rubrica v1 generica
3. Erro: "Rubrica nao encontrada"
