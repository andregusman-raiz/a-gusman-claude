# Gotchas e Lições Aprendidas — HubSpot

---

## Autenticação

1. **Access token expira em 30min** — implementar refresh automático
2. **Refresh token expira em 6 meses** — monitorar e alertar antes
3. **Scopes são imutáveis** — mudar scopes requer nova autorização do usuário
4. **Private app tokens não expiram** mas não suportam OAuth flows (sem refresh)

## Rate Limits

5. **100 req/10s é POR APP** não por endpoint — cuidado com chamadas paralelas
6. **429 retorna Retry-After header** — respeitar (não fazer backoff arbitrário)
7. **Search é mais restritivo** — 5 req/s, limite diário separado
8. **Batch reduz consumo de rate limit** — 1 batch = 1 request (não 100)

## Dados

9. **Contact dedup por email** — criar contato com email existente retorna o existente
10. **Properties têm tipos estritos** — enviar string em campo numérico = erro silencioso
11. **Custom objects precisam de schema** — criar schema antes de criar records
12. **Associations têm tipos** — COMPANY_TO_CONTACT é diferente de CONTACT_TO_COMPANY
13. **Timestamps em UTC milliseconds** — não ISO 8601 (converter na aplicação)

## Webhooks

14. **Webhooks são batched** — chegam em lotes a cada ~5 segundos
15. **Retry até 10 vezes** — se endpoint falha, HubSpot continua tentando
16. **Verificar signature** — X-HubSpot-Signature previne spoofing
17. **Mesma propriedade pode gerar múltiplos eventos** — dedup por objectId + timestamp

## Paginação

18. **NUNCA usar offset para datasets grandes** — cursor (after) é obrigatório
19. **Limit máximo varia por endpoint** — alguns aceitam 200, outros só 100
20. **Search retorna max 10K results** — usar filtros para refinar

## Integração raiz-platform

21. **Social media sync é POST** — não GET (envia dados para HubSpot)
22. **Escalate cria ticket** — não contato (cuidado com o objeto target)
23. **Webhook handler precisa retornar 200 rápido** — processar async
