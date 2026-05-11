# Automation

> Workflows e automações: ações customizadas, triggers, sequences.

---

## Specs OpenAPI (2 specs, 26 endpoints)

| Spec | Endpoints | Tamanho | Descrição |
|------|-----------|---------|-----------|
| actions_v4 | 18 | 87KB | Automation Actions V4 |
| automation_v4 | 8 | 260KB | Automation Automation V4 |

---

## Regras e Padrões

- Workflows: trigger-based (quando contato muda stage, etc.)
- Custom actions: ações programáticas dentro de workflows
- Delay, branch, send email, create task como ações built-in
- Webhooks como ações em workflows (POST para URL)

---

## Integração raiz-platform

Ver `unified/integration.json` para routes, types, env vars e OAuth scopes configurados.

*Specs OpenAPI completos em `raw/specs/` — usar para implementação detalhada de endpoints.*
