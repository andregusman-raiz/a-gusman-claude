# S-06 — Webhook Zeev → TOTVS: Integracao Nativa API

**Processo**: Suprimentos (Compras e Cotacao)
**Nivel**: N2 — Integracao nativa entre sistemas (API REST)
**Prioridade**: Estrategico / Transformacao
**Timeline**: 4 semanas (estimado: 2026-05-01 a 2026-05-29)
**Responsavel**: TI (desenvolvimento) + Fabiane Soares (validacao de negocio)
**Resolve**: CR-03 (gap Zeev-TOTVS), CRE-02 (visibilidade de pagamentos)

---

## Descricao

**Impacto**: ALTO | **Esforco**: MEDIO

Configurar webhook no Zeev para disparar ao status "Aprovado":
- Evento: pedido aprovado no Zeev
- Payload: numero do pedido, fornecedor, valor, itens, comprador, data
- Destino: API REST TOTVS RM para criar ordem de compra em status "Em transito/Aguardando recebimento"
- Almoxarifado confirma recebimento fisico → TOTVS atualiza para "Recebido/A pagar"

Beneficio adicional: financeiro passa a enxergar todos os pedidos aprovados no TOTVS em tempo real, com data prevista de pagamento visivel para Suprimentos.

**Stack tecnico**:
- Zeev: webhook nativo (disponivel na versao atual segundo KB)
- TOTVS RM: API REST v12.1.2502 (750 records de documentacao na knowledge base)
- Middleware se necessario: n8n (para transformacao de campos e tratamento de erros)

**Pre-requisito**: Mapear campos entre Zeev e TOTVS com TI. Credenciais de API TOTVS disponiveis. Ambiente de homologacao para testes.

**ROI estimado**: Elimina gap de 3-5 dias entre aprovacao e registro. Reduz 1 pedido multi-fornecedor de 3-4 lancamentos manuais para 1 lancamento automatico.

**Dependencias**: S-01 e S-02 implementados; mapeamento de campos Zeev-TOTVS aprovado com TI.

---

## Plano de Implementacao

**Responsavel**: TI (desenvolvimento) + Fabiane (validacao de negocio)
**Prazo**: 4 semanas apos inicio (estimado: 2026-05-01 a 2026-05-29)
**Dependencia**: S-01 e S-02 implementados; mapeamento de campos Zeev-TOTVS aprovado com TI

### Passos

1. TI mapeia campos: pedido no Zeev → ordem de compra no TOTVS (campos obrigatorios, transformacoes)
2. TI desenvolve webhook no Zeev (evento: status "Aprovado") → chamada API TOTVS RM
3. Usar n8n como middleware se necessario (transformacao de formato JSON, tratamento de erros, retry)
4. Testes em homologacao: 5 pedidos piloto com fornecedores reais
5. Fabiane e Sephora (Almoxarifado) validam que o recebimento fisico atualiza corretamente o TOTVS
6. Rollout gradual: 20% dos pedidos por semana ate 100%
7. Documentar integracao para manutencao futura

### Beneficio para Financeiro

- Todos os pedidos aprovados aparecem no TOTVS com status "A pagar" imediatamente
- Financeiro ve data comprometida + prioridade (alimentada pelo protocolo S-09)
- Elimina gap de 3-5 dias entre aprovacao e registro

### Validacoes de Sucesso

- [ ] Pedido aprovado no Zeev aparece no TOTVS em < 5 minutos
- [ ] Recebimento fisico no almoxarifado atualiza status no TOTVS em < 24h
- [ ] Zero lancamentos manuais duplicados por 2 semanas consecutivas

### Responsaveis

| Papel | Pessoa |
|-------|--------|
| Responsavel principal | TI |
| Executores | TI + n8n |
| Aprovadores | Fabiane Soares + Financeiro |

### Dependencias e Riscos

| Dependencia Critica | Risco | Mitigacao |
|---------------------|-------|-----------|
| API TOTVS disponivel | Complexidade da API TOTVS | n8n como middleware absorve complexidade |
