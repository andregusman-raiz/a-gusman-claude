# M8 — n8n: Orquestracao de Alertas Multicanal

**Processo**: real_estate
**Nivel**: N3
**Prioridade**: Estrategico
**Timeline**: 8-12 semanas (Onda 3)
**Responsavel**: TI / Erika Souza
**Resolve**: P1, P2, P3, P5 (escala de N1 para N3)

---

## Descricao

- **Problema resolvido**: Todos os problemas de alertas — escala das automacoes de N1 (Apps Script) para N3 (n8n multicanal)
- **Gap de origem**: Apps Script limitado a email; necessidade de alertas via Slack, integracoes com outros sistemas

| Campo | Detalhe |
|-------|---------|
| **Tipo** | Projeto Estrategico |
| **Problema(s)** | P1, P3, P5, P7 (consolidados) |
| **Impacto** | 4/5 |
| **Esforco** | 4/5 |
| **Dono sugerido** | TI / Erika Souza |
| **Timeline** | 8-12 semanas (Onda 3) |

**Descricao (o que fazer)**:

Substituir ou complementar os Apps Script da Onda 1 com workflows no n8n para:
1. Alertas via email E Slack (multicanal)
2. Integracao com TOTVS ou outros sistemas de dados
3. Orquestracao centralizada de todos os alertas (seguros, IPTU, contratos, cantinas, overdue)
4. Dashboard de status em tempo real

**Quando escalar para N3 (n8n)**:
- Volume de alertas exceder 50 emails/dia
- Precisar de alertas no Slack alem de email
- Precisar de integracao com TOTVS ou outros sistemas
- O n8n ja esta disponivel em https://n8n.raizeducacao.com.br
- Os scripts Apps Script servem como documentacao funcional para a migracao para n8n

**KPI de sucesso**:
- Todos os alertas de M1, M3, M6, M7 orquestrados via n8n
- Alertas chegando em Slack alem de email
- Zero dependencia de Apps Script para alertas criticos

**Dependencias**: M1 (alertas configurados), M2 (SLA Juridico), M9 (dashboard) devem estar operacionais antes

---

## Plano de Implementacao

### Visao Geral

- **Solucao**: n8n workflows substituindo/complementando Apps Script
- **Nivel**: N3
- **Sistema(s)**: n8n (https://n8n.raizeducacao.com.br) + Google Sheets + Slack + email
- **Esforco estimado**: 4-6 semanas de configuracao e testes
- **Responsavel sugerido**: TI + Erika Souza

### Pre-Requisitos

| # | Pre-requisito |
|---|--------------|
| 1 | M1 (Apps Script) funcionando e validado |
| 2 | M2 (SLA Juridico) ativo |
| 3 | M9 (Dashboard) operacional |
| 4 | Acesso ao n8n da Raiz (https://n8n.raizeducacao.com.br) |
| 5 | Credenciais de integracao Google Sheets no n8n |
| 6 | Webhook ou bot Slack configurado para canal de alertas |

### Workflows a Criar

1. **Workflow: Alertas de Seguros** — replica logica do alertas_seguros.gs mas envia via Slack + email
2. **Workflow: Alertas de Contratos** — replica alertas_contratos.gs com multicanal
3. **Workflow: Alertas IPTU** — integra dados da planilha SITUACAO GERAL IPTU
4. **Workflow: Ciclo Cantinas** — alertas do ciclo Jun-Nov
5. **Workflow: Cobranca Overdue** — replica cobrarOverdue() com escalonamento automatico

### Posicao no Cronograma

| Semana | Implementacao | Responsavel | Dependencia |
|--------|--------------|-------------|-------------|
| 8-12 | Onda 3: n8n multicanal | TI + Erika | M1, M2, M9 |

### Rollback

Reativar os Apps Script da Onda 1. Os scripts sao mantidos como backup documentado.
