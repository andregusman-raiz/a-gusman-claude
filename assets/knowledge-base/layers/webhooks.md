# Layers Education — Webhooks

> Webhooks sao parte do modulo de Pagamentos (E-commerce)
> Configuracao via painel: E-commerce > Settings > Webhooks

---

## Visao Geral

Webhooks notificam sistemas externos quando eventos especificos de e-commerce ocorrem dentro de uma comunidade. O sistema suporta criacao, monitoramento, reenvio e politica de retentativas automaticas.

---

## Eventos Disponiveis

### Sales Events
| Evento | Trigger |
|--------|---------|
| `sale.created` | Quando uma venda e criada |
| `sale.confirmed` | Quando uma nova venda e confirmada |
| `sale.approved` | Quando uma venda e aprovada |
| `sale.paid` | Quando uma venda e totalmente paga |
| `sale.viewed` | Quando uma fatura e visualizada |
| `sale.failed` | Quando uma transacao de venda falha |
| `sale.payment_status_updated` | Quando o status de pagamento muda |
| `sale.comment` | Quando um comentario e registrado em uma venda |
| `sale.email` | Quando um email e enviado ao cliente |
| `sale.refund_request` | Quando uma solicitacao de reembolso e criada |
| `sale.refund_success` | Quando um reembolso e concluido |
| `sale.cancel_request` | Quando uma solicitacao de cancelamento ocorre (vendas recorrentes) |
| `sale.cancel_success` | Quando um cancelamento e aprovado |
| `sale.voucher_approved` | Quando uma venda baseada em voucher e aprovada |

### Transaction Events
| Evento | Trigger |
|--------|---------|
| `transaction.created` | Quando uma transacao e criada |

### Billing/Payable Events
| Evento | Trigger |
|--------|---------|
| `payable.created` | Quando uma entrada de cobranca e criada |
| `payable.updated` | Quando o status de cobranca e atualizado |

### Cart Events
| Evento | Trigger |
|--------|---------|
| `checkout.abandoned` | Quando um carrinho permanece inativo por 30 minutos |

---

## Entity ID

O Entity ID e o identificador unico da entidade associada ao evento de webhook.

**Tipos de entidade por evento:**
| Topico | Entity ID |
|--------|-----------|
| `sale.*` | Sales ID |
| `transaction.*` | Transaction ID |
| `payable.*` | Charge ID |
| `checkout.*` | Cart ID |

O Entity ID aparece em dois locais na interface de webhooks:
1. Coluna "Entity ID" na tabela da aba Historico
2. Painel de detalhes de despachos individuais

Usuarios podem filtrar historico de webhook usando Entity ID na barra de busca avancada.

---

## Criacao de Webhook

### Via Interface
1. Acessar aba **E-commerce** na Layers
2. Navegar para **Settings** no menu lateral
3. Selecionar aba **Webhooks**
4. Clicar em **"+ Novo webhook"**

### Campos de Configuracao
| Campo | Descricao |
|-------|-----------|
| Nome do webhook | Identificador; padrao = hostname da URL se omitido |
| URL de envio | Endpoint que recebera os dados do webhook |
| Chave de autenticidade | Secret key para autenticacao |
| Eventos | Selecionar eventos desejados para trigger |

Clicar em **"Criar"** para finalizar.

---

## Politica de Retentativas

**Maximo de tentativas:** 9

| Tentativa | Intervalo Aproximado |
|-----------|---------------------|
| 1 | Imediata |
| 2 | ~2 minutos |
| 3 | ~10 minutos |
| 4 | ~30 minutos |
| 5 | ~1 hora |
| 6 | ~3 horas |
| 7 | ~4 horas |
| 8 | ~6 horas |
| 9 | ~10 horas |

**Jitter aplicado:** Fator de aleatoriedade em cada intervalo para prevenir picos de carga simultaneos.

**Limite maximo:** Intervalo entre tentativas nao pode exceder 24 horas.

**Condicoes de falha:**
- Servidor retorna codigos HTTP de erro (4xx ou 5xx)
- Servidor indisponivel ou sem resposta
- Requisicao excede timeout de 30 segundos
- Webhook destino esta inativo

**Status final:** Apos 9 tentativas sem sucesso, a entrega e marcada como **failed**. Reenvio manual permanece disponivel.

---

## Reenvio de Webhooks

### Metodo 1: Via Historico da Venda (mais rapido)
1. Acessar aba E-commerce
2. Abrir detalhes da venda
3. Localizar evento na secao "Historico"
4. Clicar "Reenviar webhook"

Reenvia para todos os webhooks ativos inscritos naquele tipo de evento.

### Metodo 2: Via Tela de Configuracao

Navegar para E-commerce > Settings > Webhooks > aba Historico

**Reenvio individual:**
- Clicar icone de refresh na coluna "Acoes"
- Ou abrir painel de detalhes (icone olho) e clicar "Reenviar"

**Reenvio em massa:**
- Selecionar multiplas entradas com checkboxes
- Barra de acao aparece com contagem de selecao
- Clicar "Reenviar selecionados (X)"
- **Limite maximo: 100 webhooks por operacao**

---

## Permissoes

| Permissao | Acesso |
|-----------|--------|
| `webhook` | Criar, editar, inativar e testar webhooks (acesso total) |
| `webhook:read` | Visualizar lista e detalhes de webhooks (somente leitura) |
| `webhookAttempt:read` | Acessar aba Historico; buscar e visualizar detalhes de tentativas |
| `webhookAttempt:resend` | Reenviar webhooks (individual, em massa, ou via historico de venda) |

---

## Notas

- Webhooks inativos nao processam reenvios
- Reenvio via historico de venda dispara todos os webhooks ativos inscritos
- Reenvio via tela de configuracao direciona tentativas especificas por URL
- Painel de detalhes mostra request/response para diagnostico
