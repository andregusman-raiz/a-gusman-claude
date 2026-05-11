# Infosimples API — Documentação Geral

> Versão da API: 2.2.35 (25/02/2026)
> Conta: Raiz Educacao S.A. (ia.raizeducacao@raizeducacao.com.br)
> Tipo: Pré-paga | Franquia mínima: R$ 100/mês

---

## Visão Geral

A Infosimples é uma plataforma de APIs de automação de consultas em portais governamentais brasileiros. Funciona via RPA otimizado — a API automatiza a navegação nos sites de origem e retorna os dados estruturados em JSON.

- **916+ APIs disponíveis** (consultas públicas e privadas)
- **Modelo**: Pay-per-use + franquia mínima mensal
- **OpenAPI spec**: `openapi-infosimples-v2.json` (1.1MB, 916 endpoints)
- **Swagger UI**: https://api.infosimples.com/consultas/docs/openapi/swagger

---

## Formato de Requisição

| Campo | Valor |
|-------|-------|
| **Método HTTP** | `POST` |
| **URL** | `https://api.infosimples.com/api/v2/consultas/{servico}` |
| **Content-Type** | `application/x-www-form-urlencoded` |
| **Retorno** | JSON |

### Parâmetros Comuns (todos os endpoints)

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `token` | Sim | Chave de acesso da API |
| `timeout` | Não | Duração máxima em segundos (min: 15, max: 600) |
| `ignore_site_receipt` | Não | Quando `1`, campo `site_receipts` retorna vazio |

---

## Estrutura de Resposta

```json
{
  "code": 200,
  "code_message": "A requisição foi processada com sucesso.",
  "data": [ { /* dados estruturados */ } ],
  "data_count": 1,
  "errors": [],
  "site_receipts": ["https://..."],
  "header": {
    "api_version": "v2",
    "api_version_full": "2.2.35-...",
    "product": "Consultas",
    "service": "caixa/regularidade",
    "parameters": { "cnpj": "..." },
    "client_name": "Raiz Educacao S.A.",
    "token_name": "Raiz Educacao S.A.",
    "billable": true,
    "price": "0.2",
    "requested_at": "2026-03-25T...",
    "elapsed_time_in_milliseconds": 3000,
    "remote_ip": "...",
    "signature": "..."
  }
}
```

### Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `code` | number | Código de resposta |
| `code_message` | string | Mensagem do código |
| `data` | array | Dados da consulta (sempre array) |
| `data_count` | number | Quantidade de resultados |
| `errors` | array | Mensagens de erro (sempre array) |
| `site_receipts` | array | URLs dos PDFs/HTMLs (7 dias) |
| `header` | object | Metadados da requisição |

---

## Códigos de Resposta

| Código | Descrição | Cobra? |
|--------|-----------|--------|
| **200** | Requisição processada com sucesso | Sim |
| **600** | Erro inesperado (será analisado) | Não |
| **601** | Token inválido | Não |
| **602** | Serviço na URL inválido | Não |
| **603** | Token sem autorização para o serviço | Não |
| **604** | Consulta não validada antes da pesquisa | Não |
| **605** | Timeout excedido | Não |
| **606** | Parâmetros obrigatórios não enviados | Sim |
| **607** | Parâmetro(s) inválido(s) | Sim |
| **608** | Parâmetros recusados pelo site de origem | Sim |
| **609** | Tentativas de consulta excedidas | Não |
| **610** | Falha em resolver CAPTCHA | Não |
| **611** | Dados incompletos no site de origem | Sim |
| **612** | Consulta sem dados no site de origem | Sim |
| **613** | Consulta bloqueada pelo servidor de origem | Não |
| **614** | Erro inesperado com site de origem | Não |
| **615** | Site de origem indisponível | Não |
| **617** | Sobrecarga de uso do serviço | Não |
| **618** | Site de origem sobrecarregado | Não |
| **619** | Parâmetro sofreu alteração no site de origem | Sim |
| **620** | Erro permanente do site de origem | Sim |
| **621** | Erro ao gerar arquivo de visualização | Não |
| **622** | Consulta repetida demais (possível loop) | Não |

### Retentativas recomendadas

- **Retry**: 605 (timeout), 609, 610, 613, 614, 615, 617, 618
- **Não retry**: 606, 607, 608, 611, 612, 619, 620
- **Limite**: Máximo 3 tentativas por consulta

---

## Endpoint de Conta (saldo/consumo)

| Campo | Valor |
|-------|-------|
| **Método** | `GET` (ou POST) |
| **URL** | `https://api.infosimples.com/api/admin/account` |
| **Custo** | Gratuito |

### Parâmetros

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `token` | Sim | Chave de acesso |

### Resposta

```json
{
  "code": 200,
  "data": [{
    "name": "Raiz Educacao S.A.",
    "type": "Pessoa jurídica",
    "cnpj": "00000000000000",
    "cpf": null,
    "prepaid": true,
    "balance": 191.98,
    "balance_threshold": 11.11,
    "dynamic_price": false,
    "base_price": 0.2,
    "min_bill": 100,
    "default_timeout": 600,
    "current_bill": 100,
    "current_usage": 33.02
  }]
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | string | Nome do titular |
| `type` | string | PJ ou PF |
| `prepaid` | boolean | Pré-paga? |
| `balance` | float | Saldo disponível (pré-paga) |
| `balance_threshold` | float | Limiar para alerta de saldo baixo |
| `base_price` | float | Preço base por consulta |
| `min_bill` | float | Franquia mínima mensal |
| `current_bill` | float | Fatura do mês (pós-paga) |
| `current_usage` | float | Consumo no mês atual |

---

## Integrações Avançadas

### API Assíncrona
- Doc: https://api.infosimples.com/consultas/docs/assincrona
- Para processamento em lotes ou monitoramentos

### Criptografia de Parâmetros
- Doc: https://api.infosimples.com/consultas/docs/criptografia
- Parâmetros podem ser encriptados

### Certificados Digitais (A1/A3)
- Doc: https://api.infosimples.com/consultas/docs/certificados
- Para APIs que exigem certificado digital PKCS12

### API Status
- Doc: https://api.infosimples.com/consultas/docs/api-status
- Status e informações de um serviço

---

## Boas Práticas

1. **Nunca integrar no frontend** — CORS bloqueado intencionalmente
2. **Configurar timeout do HTTP client** maior que o timeout da API
3. **Verificar campo `errors`** sempre — contém detalhes específicos
4. **Nunca repassar `errors` para usuários finais** — pode conter menções à Infosimples
5. **Limite de retentativas** — máximo 3, com delay entre elas
6. **Monitorar saldo** via endpoint `/api/admin/account` (gratuito)
7. **Baixar `site_receipts`** em 7 dias — expiram após esse prazo

---

## Catálogo de APIs Relevantes para FGTS

| Serviço | Endpoint | Preço Adicional | Uso |
|---------|----------|-----------------|-----|
| CRF (Regularidade FGTS) | `caixa/regularidade` | R$ 0,06/chamada | Monitor de CRF |
| FGTS / Guia de Arrecadação | `fgts/guia` | R$ 0,06/chamada | Consulta guias |
| FGTS / Guia Rápida (GFD) | `fgts/guia-rapida` | R$ 0,06/chamada | Emissão de GFD |
| Receita Federal / CNPJ | `receita-federal/cnpj` | Padrão | Dados empresa |
| Receita Federal / CPF | `receita-federal/cpf` | Padrão | Dados pessoa |
| CND Federal | `receita-federal/certidao-federal` | Padrão | Certidão negativa |
| TST / Débitos Trabalhistas | `tst/certidao-debitos` | Padrão | CNDT |
| Dataprev / FAP | `dataprev/fap` | Padrão | Fator acidentário |
| Dataprev / Qualificação | `dataprev/qualificacao` | Padrão | Qualificação cadastral |
| eCAC / DCTF Web | `ecac/dctf-web` | Padrão | Declarações federais |
| eCAC / Situação Fiscal | `ecac/situacao-fiscal` | Padrão | Situação fiscal |

**Preço base**: R$ 0,20/consulta (conta Raiz Educacao) + preço adicional quando aplicável
