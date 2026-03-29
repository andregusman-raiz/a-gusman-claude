# Gotchas e Lições Aprendidas — Zeev

> Consolidação de DOC-4 (Limites) + experiência raiz-platform.

---

## Autenticação

1. **Service token é URL-encoded** — contém `%2B`, `%2F`, etc. Não decodificar.
2. **Temporary token expira em ~10min** — mas cache deve ser 8min (margem).
3. **401 pode ser token expirado OU permissão** — retry com refresh resolve o primeiro.
4. **API Dados usa X-API-Key** — completamente separada da API Nativa (Bearer).

## Limites da API

5. **/assignments/report max 500 items** — paginação incompleta. Para orgs grandes, dados truncados.
6. **Sem form schema** — API retorna formFields preenchidos, mas NÃO o template do formulário.
7. **Sem criação de instances via API** — não é possível abrir solicitações programaticamente.
8. **Sem attachments** — arquivos anexados não são acessíveis via API.
9. **Sem comments** — comentários internos não disponíveis.
10. **Sem BPMN** — definição visual do fluxo não exportável.
11. **Sem webhooks** — sem notificação push de eventos.

## Performance

12. **10s hard timeout** — requests lentos são cortados. Não aumentar.
13. **Token cache é crítico** — sem cache, cada request faz 2 chamadas (impersonate + actual).
14. **API Dados é mais rápida** — não passa por impersonation. Usar quando possível.

## Dados

15. **formFields variam por fluxo** — não há schema fixo. Cada processo tem campos diferentes.
16. **reportLink é só URL** — aponta para relatório nativo no Zeev, sem dados raw.
17. **Fluxos desativados** — /flows/edit retorna TODOS, filtrar "DESATIVADO" no código.
18. **SLA não configurável via API** — definido apenas no painel admin do Zeev.

## Deploy

19. **Staging vs Produção** — URLs diferentes (hmlraizeducacao vs raizeducacao).
20. **Tokens são por ambiente** — token de staging NÃO funciona em produção.
