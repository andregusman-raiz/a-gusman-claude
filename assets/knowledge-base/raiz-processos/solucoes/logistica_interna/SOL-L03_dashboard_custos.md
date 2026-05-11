# SOL-L03 — Dashboard Mensal de Custos Logisticos por Area

**Processo**: Logistica Interna (Malote + Frete + Motoboy) — Raiz Educacao
**Nivel**: N1 (planilha manual) → N2 (integracao Ticket → controle)
**Prioridade**: Consolidacao
**Timeline**: Semanas 3-6 (planilha N1); Mes 2-3 (automacao N2) | Prazo: Semana 4 (primeiro relatorio)
**Responsavel**: Maressa (owner)
**Resolve**: RC-L03

---

## Descricao

Criar visao consolidada mensal que mostra: custo total de frete + motoboy por area, comparativo vs orcamento, tendencia dos ultimos 3 meses. Ponto de partida e uma planilha alimentada manualmente a partir do Ticket. Fase 2 e a integracao automatica (N2).

**Posicao na Matriz Impacto x Esforco**: Esforco MEDIO / Impacto ALTO — Consolidacao

**Campos necessarios no chamado (Ticket)**:
- Area solicitante (responsavel pelo custo)
- Tipo: frete / motoboy
- Valor estimado ou real (pos-servico)
- Natureza: mobiliario / consumo / CAPEX / eventos / descarte

### ROI / Impacto Esperado

| Solucao | Causa Raiz Resolvida | Impacto Esperado | Prazo |
|---------|---------------------|-----------------|-------|
| SOL-L03 (Dashboard custos) | RC-L03 | Gestao com visibilidade de custo logistico por area; primeiro relatorio apresentado no mes 1 | Semana 4 |

---

## Pre-requisitos

- SOL-L02 operacional (formulario de motoboy com campo de custo ativo)
- Acesso aos chamados historicos dos ultimos 3 meses no Ticket
- Contrato de frete com valores mensais por area/natureza

---

## Plano de Implementacao

### Fase N1 — Planilha Manual (Semanas 3-4)

| Semana | Atividade |
|--------|-----------|
| Semana 3 | Auditar chamados dos ultimos 3 meses: extrair area, tipo (frete/motoboy), valor, natureza |
| Semana 3 | Criar planilha: abas Por Mes / Por Area / Acumulado vs Orcamento |
| Semana 4 | Apresentar primeiro relatorio em reuniao de gestao |
| Semana 4 | Definir responsavel pelo preenchimento semanal |

**Campos minimos por chamado** (a ser incluido no formulario do Ticket):
- Area solicitante (responsavel pelo custo)
- Tipo: frete / motoboy
- Natureza: mobiliario / consumo / CAPEX / eventos / descarte
- Valor real (preenchido pos-servico)

### Fase N2 — Integracao Ticket → Controle (Mes 2-3)

Pre-requisito: modelo de dados validado com 30 dias de operacao.

Opcoes por nivel de complexidade:
1. Ticket → Google Sheets via Zapier/Make (mais rapido, sem TI)
2. Ticket API → planilha interna (medio prazo)
3. Ticket → Power BI / dashboard dedicado (se gestao demandar)

### Passos Criticos (S_melhorias)

1. Auditar chamados dos ultimos 3 meses para reconstituir baseline por area
2. Criar planilha de controle com abas: Por Mes, Por Area, Acumulado vs Orcamento
3. Definir responsavel pelo preenchimento semanal (Maressa ou analista)
4. Apresentar primeiro relatorio em reuniao mensal de gestao (30 dias)
5. Apos validar modelo, avaliar integracao automatica Ticket → planilha/Power BI (N2)

---

## Criterios de Validacao Pos-Implementacao

- [ ] Relatorio mensal gerado e apresentado para gestao no mes 1
- [ ] Campos de custo adicionados ao formulario de frete e motoboy no Ticket
- [ ] Baseline de 3 meses reconstructido para comparativo
- [ ] Meta: gestao com visibilidade de custo por area antes do fechamento mensal

---

## KPI de Sucesso

- Relatorio mensal gerado e apresentado para gestao a partir do mes 1
- Custo logistico visivel por area: 0% → 100% (manual no mes 1, automatizado no mes 2-3)

---

## Contexto no Roadmap

**Fase 2 — Consolidacao (Semanas 3-6)**

```
Semana 1    Semana 2    Semana 3    Semana 4    Mes 2+
                        [SOL-L03: Planilha custos ───]→[Automacao N2]
```

**Dependencias**:
- SOL-L02 deve estar operacional (formulario com campo de area solicitante e custo)
- SOL-L06 depende de SOL-L03 (consolida dados automaticamente apos 30 dias de modelo validado)
