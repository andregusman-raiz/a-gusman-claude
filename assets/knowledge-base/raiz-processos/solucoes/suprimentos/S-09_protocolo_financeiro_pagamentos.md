# S-09 — Protocolo Financeiro: Painel Compartilhado de Prioridade de Pagamentos

**Processo**: Suprimentos (Compras e Cotacao)
**Nivel**: N2 — Integracao de dados entre Suprimentos e Financeiro (Etapa 1: planilha; Etapa 2: TOTVS)
**Prioridade**: Consolidacao
**Timeline**: 1-2 semanas (solucao inicial em planilha); Etapa 2 apos S-06
**Responsavel**: Fabiane Soares + responsavel do Financeiro; aprovador Marcelle Gaudard
**Resolve**: CRE-02 (financeiro adia pagamentos sem comunicar Suprimentos), CRE-01 (adiantamentos)

---

## Descricao

**Impacto**: MEDIO | **Esforco**: MEDIO (Etapa 1 = BAIXO)

**Etapa 1 — Solucao imediata (planilha)**:
- Fabiane e Financeiro definem criterio de prioridade de pagamentos: urgente (fornecedor com restriction para faturamento, vencimento em 48h), normal, postergavel
- Suprimentos preenche coluna de prioridade em planilha compartilhada de pagamentos
- Financeiro consulta planilha antes de decidir quais pagamentos adiar
- Reuniao quinzenal entre Fabiane e Financeiro para revisar lista de adiados e realinhar prioridades

**Etapa 2 — Solucao integrada (TOTVS)**:
- Apos S-06 estar implementado, o TOTVS passa a ter campo de prioridade visivel para o Financeiro
- Financeiro agenda pagamentos no TOTVS com data comprometida visivel para Suprimentos
- Alertas automaticos ao Suprimentos quando pagamento e adiado (n8n trigger)

**Para adiantamentos (CRE-01)**:
- Objetivo de medio prazo: homologar mais fornecedores curva C para faturamento CNPJ (reduzir dependencia de adiantamento)
- NIMBI (S-05) ja resolve parte disso: marketplace com faturamento corporativo elimina adiantamentos para categorias cobertas

---

## Plano de Implementacao

**Responsavel**: Fabiane Soares + responsavel do Financeiro
**Prazo**: 2026-03-27 (primeira semana de consolidacao)
**Dependencia**: Reuniao de alinhamento entre Fabiane e Financeiro

### Passos

1. Fabiane e Financeiro agendam reuniao de 1h para definir protocolo
2. Definir criterios de prioridade:
   - P1 (urgente): fornecedor com historico de restricao de CNPJ, vencimento em 48h, fornecedor estrategico unico
   - P2 (normal): vencimento em 5-10 dias, multiplos fornecedores disponiveis
   - P3 (postergavel): vencimento acima de 10 dias, fornecedor flexivel
3. Suprimentos preenche coluna de prioridade na planilha de pagamentos existente ("CONTROLE DE PAGAMENTOS ADIADOS") antes de enviar para o Financeiro
4. Reuniao quinzenal (Fabiane + Financeiro): revisar lista de adiados, realinhar prioridades, resolver pendencias de prestacao de contas de adiantamentos
5. Regra: Financeiro nao adia P1 sem comunicar Fabiane com antecedencia de 24h

### Etapa 2 (apos S-06 implementado)

- TOTVS passa a ter campo de prioridade visivel para o Financeiro
- Financeiro agenda pagamentos no TOTVS com data comprometida visivel para Suprimentos
- Alertas automaticos ao Suprimentos quando pagamento e adiado (n8n trigger)

### Validacoes de Sucesso

- [ ] Protocolo documentado e assinado pelas duas areas
- [ ] Zero pedidos de fornecedor cobrado diretamente no Suprimentos sem que Fabiane soubesse que o pagamento havia sido adiado (meta: por 30 dias consecutivos)

### Responsaveis

| Acao | Responsavel Principal | Executores | Aprovador |
|------|----------------------|-----------|-----------|
| Protocolo pagamentos | Fabiane Soares | Financeiro | Marcelle Gaudard |
