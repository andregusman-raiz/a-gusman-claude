# Gotchas: Enterprise ERP / SOAP Integration

> Armadilhas reais encontradas integrando com TOTVS RM Cloud (2026).
> Aplicável a qualquer integração com ERP enterprise via SOAP/REST.

---

## Token de Curta Duração

**Problema**: Tokens JWT de ERPs enterprise frequentemente expiram em minutos (300s no TOTVS RM), não horas.
**Sintoma**: Funciona no primeiro request, falha nos seguintes. 401 intermitente.
**Fix**: Cache do token com auto-refresh 30s antes de expirar. Nunca confiar no `maxAge` do cookie — o token real no ERP pode já ter expirado.

## Campos da API ≠ Documentação

**Problema**: Documentação TOTVS diz `CodColigada`, API retorna `companyCode`. Campos são PascalCase na doc, camelCase na prática.
**Sintoma**: Todos os campos retornam `undefined` ou `0`.
**Fix**: Sempre fazer 1 request real e imprimir o JSON completo antes de mapear. Usar fallback: `data.companyCode ?? data.CodColigada ?? data.codColigada ?? 0`

## SOAP Path Errado = 404 Silencioso

**Problema**: O path do SOAP DataServer não é `/wsDataServer/MEX` nem `/wsDataServer/MEXService.svc`.
**Sintoma**: GET retorna 200 (página info), POST retorna 404.
**Fix**: Consultar o WSDL em `/wsDataServer/mex?singleWsdl` para descobrir os endpoints reais. No TOTVS Cloud: `/wsDataServer/IwsDataServer`.

## ID Parcial = 500 Internal Server Error

**Problema**: Endpoints que aceitam `{id}` no path esperam um ID composto (ex: `2|2|1|1032`), não apenas o código simples (`1032`).
**Sintoma**: 500 genérico sem mensagem de erro útil.
**Fix**: Usar o `internalId` completo retornado pelo endpoint de contexto. URL-encode o `|` como `%7C`.

## ReadView Funciona, ReadRecord Também, Mas São Diferentes

**Problema**: `ReadView` retorna lista filtrada, `ReadRecord` busca por primary key. Alguns DataServers têm bug no ReadView mas funcionam no ReadRecord (e vice-versa).
**Sintoma**: ReadView retorna erro interno, mas o DataServer funciona para SaveRecord.
**Fix**: Se ReadView falha, tentar ReadRecord com PKs individuais. Mais lento mas contorna bugs do DataServer.

## SaveRecord Aceita Silenciosamente Dados Inválidos

**Problema**: SOAP SaveRecord pode retornar "sucesso" (result vazio) mas não gravar nada.
**Sintoma**: App mostra "Salvo!", mas dados não persistem.
**Fix**: Sempre fazer ReadRecord após SaveRecord para confirmar. Verificar que campos obrigatórios (como IDHORARIOTURMA) têm valores reais, não zeros.

## SaveRecord com Texto no Result ≠ Sempre Erro

**Problema**: `<SaveRecordResult>` com conteúdo pode ser:
- Primary key do registro criado (sucesso!)
- Stack trace de erro (falha)

**Fix**: Verificar se o result contém marcadores de erro (`"at RM."`, `"Exception"`, `"erro"`) antes de tratar como falha. Primary keys são strings simples sem stack trace.

## SOAP HTML-Encoded Dentro de XML

**Problema**: Resposta SOAP vem com XML dentro de XML, encodado com `&lt;` e `&gt;`.
**Sintoma**: Parser não encontra tags. Regex não matcha nada.
**Fix**: Decodificar antes de parsear:
```typescript
xml.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&#xD;/g, '')
```

## Firewall TOTVS Cloud Bloqueia IPs de Cloud Pública

**Problema**: SOAP funciona do localhost mas falha da Vercel/AWS/GCP.
**Sintoma**: Timeout ou conexão recusada apenas em produção, funciona em dev.
**Fix**: Hospedar backend na mesma rede do ERP (VPS, Docker no mesmo datacenter) ou solicitar whitelist de IP ranges da cloud.

## Subqueries SQL Bloqueadas em Filtros SOAP

**Problema**: DataServers SOAP aceitam filtros SQL simples (`CAMPO=VALOR`) mas bloqueiam subqueries (`IN (SELECT ...)`).
**Sintoma**: "Instruções SQL proibidas"
**Fix**: Fazer queries separadas e join client-side. Ou usar `wsConsultaSQL` com sentença SQL pré-cadastrada pelo admin.

## Env Vars com Newline Quebram Auth

**Problema**: `vercel env add VAR production <<< "valor"` adiciona `\n` ao final do valor.
**Sintoma**: Auth retorna 400 "Usuário ou Senha inválidos" mesmo com credenciais corretas. Debug mostra `"host":"https://...8051\n"`.
**Fix**: Usar `printf '%s' 'valor' | vercel env add VAR production` — o `%s` sem `\n` evita o newline. NUNCA usar `<<<`, `echo`, ou heredoc para env vars com secrets.

## Bulk SOAP = Token Expira no Meio

**Problema**: 28 ReadRecords sequenciais levam ~30s. Token de 300s pode expirar durante a operação.
**Sintoma**: Primeiros requests OK, últimos falham com 401.
**Fix**: Renovar token antes de cada batch. Usar batches paralelos (Promise.all) para reduzir tempo total. Probe com amostra antes de checar todos.
