# Autenticação e Tokens

> Mecanismo de autenticação do Zeev: service token → impersonation → temporary token. Garante RLS (Row-Level Security).

---

## Conceitos-Chave

- Service token: permanente, URL-encoded, usado para iniciar impersonation
- Impersonation: POST /tokens/impersonate/{email} → temporaryToken (8min cache)
- Cada usuário impersonado só vê seus próprios dados
- Retry: 2x em 401 (token expirado) + 5xx
- Env vars: ZEEV_NATIVE_API_URL, ZEEV_SERVICE_TOKEN

---

## Endpoints (4)

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/2/tokens` | Obter o dados e token temporário da pessoa autenticada atualmente |
| POST | `/api/2/tokens` | Obter token temporário a partir de usuário e senha |
| GET | `/api/2/tokens/impersonate/{userid}` | Personificar e obter o token temporário de outra pessoa a partir de seu código ( |
| GET | `/api/2/tokens/impersonate/{username}` | Personificar e obter o token temporário de outra pessoa a partir de seu username |

---

## Integração raiz-platform

Implementado: zeev-proxy.service.ts com token cache, retry, impersonation completa.

Ver `unified/integration.json` para routes, env vars e agent tool actions.
