# Financeiro

> Contratos, lançamentos, boletos, integrações bancárias (BB, Itaú, Santander, EfiPay).

---

## Tags da API (8)

`BancoBrasil`, `Boletos`, `Contratos`, `EfiPay`, `Gerencianet`, `Itau`, `Lancamentos`, `Santander`

## Endpoints (32)

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/v1/BancoBrasil/ProcessarWebhook` |  |
| POST | `/api/v1/BancoBrasil/ProcessarWebhook` |  |
| POST | `/api/v1/EfiPay/ProcessarWebhook` | Realiza chamada do método InformarPagamento no servidor de t |
| POST | `/api/v1/EfiPay/ProcessarWebhook/{idTitulo}` | Realiza chamada do método InformarPagamento no servidor de t |
| POST | `/api/v1/Gerencianet/ProcessarWebhook` | Realiza chamada do método InformarPagamento no servidor de t |
| POST | `/api/v1/Gerencianet/ProcessarWebhook/{idTitulo}` | Realiza chamada do método InformarPagamento no servidor de t |
| POST | `/api/v1/Itau/ProcessarWebhook/boleto` |  |
| POST | `/api/v1/Itau/ProcessarWebhook/pix` |  |
| POST | `/api/v1/Itau/oauth/token` |  |
| GET | `/api/v1/Santander/ProcessarWebhook` |  |
| POST | `/api/v1/Santander/ProcessarWebhook` |  |
| GET | `/api/v1/alunos/{idAluno}/Boletos/{codigoBoleto}` |  |
| GET | `/api/v1/alunos/{idAluno}/Lancamentos` |  |
| GET | `/api/v1/prematricula/Contratos/impressao` |  |
| GET | `/api/v1/prematricula/{idPreMatricula}/Contratos` |  |
| PUT | `/api/v1/prematricula/{idPreMatricula}/Contratos/{idAluno}` |  |
| GET | `/{tenant}/api/v1/BancoBrasil/ProcessarWebhook` |  |
| POST | `/{tenant}/api/v1/BancoBrasil/ProcessarWebhook` |  |
| POST | `/{tenant}/api/v1/EfiPay/ProcessarWebhook` | Realiza chamada do método InformarPagamento no servidor de t |
| POST | `/{tenant}/api/v1/EfiPay/ProcessarWebhook/{idTitulo}` | Realiza chamada do método InformarPagamento no servidor de t |
| POST | `/{tenant}/api/v1/Gerencianet/ProcessarWebhook` | Realiza chamada do método InformarPagamento no servidor de t |
| POST | `/{tenant}/api/v1/Gerencianet/ProcessarWebhook/{idTitulo}` | Realiza chamada do método InformarPagamento no servidor de t |
| POST | `/{tenant}/api/v1/Itau/ProcessarWebhook/boleto` |  |
| POST | `/{tenant}/api/v1/Itau/ProcessarWebhook/pix` |  |
| POST | `/{tenant}/api/v1/Itau/oauth/token` |  |
| GET | `/{tenant}/api/v1/Santander/ProcessarWebhook` |  |
| POST | `/{tenant}/api/v1/Santander/ProcessarWebhook` |  |
| GET | `/{tenant}/api/v1/alunos/{idAluno}/Boletos/{codigoBoleto}` |  |
| GET | `/{tenant}/api/v1/alunos/{idAluno}/Lancamentos` |  |
| GET | `/{tenant}/api/v1/prematricula/Contratos/impressao` |  |
| GET | `/{tenant}/api/v1/prematricula/{idPreMatricula}/Contratos` |  |
| PUT | `/{tenant}/api/v1/prematricula/{idPreMatricula}/Contratos/{id` |  |

---

## Regras

- Contrato = vínculo financeiro responsável×escola (similar a SCONTRATO no TOTVS)
- Lançamentos geram boletos via integração bancária
- 4 bancos suportados: BB, Itaú, Santander, EfiPay/Gerencianet
- Cross-reference TOTVS: Contratos→SCONTRATO, Lançamentos→FLAN

*Swagger completo em `raw/swagger-sophia-v1.json`*
