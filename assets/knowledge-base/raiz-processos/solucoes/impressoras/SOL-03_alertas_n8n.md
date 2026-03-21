# SOL-03 — Alertas Automaticos via n8n (Vencimento Contratos + SLA)

**Processo**: Gestao de Impressoras (Locadas e Proprias) — Raiz Educacao
**Nivel**: N3 (orquestracao via n8n)
**Prioridade**: Consolidacao
**Timeline**: 2-3 semanas | Prazo: 15/mai/2026
**Responsavel**: Kevin (n8n / execucao tecnica) + Maressa (definicao de regras de negocio)
**Resolve**: CR-01 (SLA), CR-05 parcial (contratos)

---

## Descricao

Criar workflows n8n para: (a) alertar com 90/60/30 dias para vencimento de contratos de impressoras (All In dez/2026, Multimidia, Reprocopia); (b) alertar quando chamado All In ultrapassar SLA definido.

**Posicao na Matriz Impacto x Esforco**: Esforco MEDIO / Impacto MEDIO-ALTO

**Pre-requisito**: SOL-02 operacional (para alertas de SLA All In via API Tickets)

### ROI / Impacto Esperado

| Solucao | Causa Raiz Resolvida | Impacto Esperado | Prazo |
|---------|---------------------|-----------------|-------|
| SOL-03 (Alertas n8n) | CR-01, CR-05 | Zero surpresas de contrato | Mai/2026 |

---

## Campos Obrigatorios na Planilha Mestre de Contratos

- Fornecedor
- Regiao
- Escolas cobertas
- Data inicio
- Data vencimento
- Valor mensal
- Multa rescisao
- Responsavel interno
- Status (ativo / em renovacao / encerrando)

---

## Plano de Implementacao

### Pre-requisitos

- n8n operacional em https://n8n.raizeducacao.com.br
- Planilha ou base com datas de vencimento de todos os contratos de impressoras
- Canal de comunicacao definido para alertas (email Maressa ou grupo WhatsApp do time)
- SOL-02 operacional (para alertas de SLA All In)

### Plano Detalhado

| Semana | Atividade | Responsavel |
|--------|-----------|-------------|
| Semana 1 | Criar planilha mestre de contratos: fornecedor, regiao, data vencimento, valor, responsavel | Maressa |
| Semana 1 | Workflow n8n #1: cron diario → le planilha → se vencimento em 90/60/30 dias → envia alerta email/WhatsApp | Kevin |
| Semana 2 | Workflow n8n #2: monitora tickets Raiz (API Tickets) → se ticket aberto > SLA definido sem resolucao → alerta Maressa | Kevin |
| Semana 2 | Testar workflows com datas simuladas (avancar data artificialmente) | Kevin + Maressa |
| Semana 3 | Ajustes baseados em testes + ativar em producao | Kevin |

Passos adicionais (S_melhorias):
1. Mapear todos os contratos de impressoras (datas de vencimento, valores, fornecedor)
2. Criar workflow n8n: cron diario → verifica datas → envia alerta ao responsavel (Maressa)
3. Criar workflow n8n: monitora tickets Raiz por SLA → alerta se vencido
4. Integrar com canal de comunicacao do time (email ou WhatsApp)
5. Testar com datas simuladas antes de ativar em producao

### Checklist de Validacao Pos-Go-Live

- [ ] Alerta de 90 dias disparado corretamente (testar com data simulada)
- [ ] Alerta de 60 dias disparado corretamente
- [ ] Alerta de 30 dias disparado corretamente
- [ ] Alerta de SLA All In disparado quando ticket ultrapassa prazo
- [ ] Maressa recebe alertas no canal correto
- [ ] Planilha mestre com todos os contratos de impressoras preenchida

### Plano de Rollback

Desativar workflows n8n. Processo de acompanhamento manual de contratos retoma temporariamente.

---

## Metricas de Sucesso

- Zero contratos vencendo sem alerta previo
- Alertas de SLA All In chegando dentro de 1h do vencimento

---

## Contexto no Roadmap

**Curto Prazo — Mai/2026 (Semanas 4-5)**

```
Abr/2026    Mai/2026
            SOL-03 >>
```
