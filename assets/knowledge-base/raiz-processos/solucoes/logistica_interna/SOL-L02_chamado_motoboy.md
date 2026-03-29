# SOL-L02 — Chamado de Motoboy Obrigatorio Antes do Servico

**Processo**: Logistica Interna (Malote + Frete + Motoboy) — Raiz Educacao
**Nivel**: N1 (regra de processo + config Ticket)
**Prioridade**: Quick Win — CRITICO
**Timeline**: 3-5 dias | Prazo: Dias 1-5
**Responsavel**: Maressa (owner)
**Resolve**: RC-L02

---

## Descricao

Estabelecer regra formal de que nenhum motoboy e acionado sem chamado aberto no Ticket previamente. Comunicar Financeiro e DP diretamente. Configurar formulario especifico para motoboy no Ticket com campos obrigatorios: area solicitante, destino, descricao do item, urgencia, responsavel.

**Posicao na Matriz Impacto x Esforco**: Esforco BAIXO / Impacto CRITICO — Quick Win (mais prioritario da fase 1)

**Regra proposta**:
> "A partir de [DATA], todo acionamento de motoboy deve ter chamado aberto no Ticket ANTES da saida. Em casos de urgencia extrema, o chamado pode ser aberto simultaneamente — mas nunca depois da conclusao do servico. Acionamentos sem chamado previo nao serao contabilizados no orcamento da area solicitante, sendo tratados como desvio de processo."

### ROI / Impacto Esperado

| Solucao | Causa Raiz Resolvida | Impacto Esperado | Prazo |
|---------|---------------------|-----------------|-------|
| SOL-L02 (Chamado motoboy) | RC-L02 | > 95% acionamentos com chamado previo em 60 dias; rastreabilidade total de custos | Dias 1-5 |

---

## Pre-requisitos

- Acesso de configuracao ao Ticket para criar categoria e formulario
- Alinhamento com gestores de Financeiro e DP antes do comunicado

---

## Plano de Implementacao

| Dia | Atividade |
|-----|-----------|
| Dia 1 | Alinhamento com gestores de Financeiro e DP: apresentar o desvio atual e a nova regra |
| Dia 2 | Configurar formulario "Motoboy" no Ticket: campos obrigatorios — area solicitante, destino, descricao do item, urgencia (urgente/normal), responsavel pelo custo |
| Dia 3 | Maressa envia comunicado formal para todas as areas com a regra e data de vigencia |
| Dia 4 | Periodo de transicao: chamados retroativos aceitos mas marcados como "nao-conforme" |
| Dia 5 | Validar que formulario esta funcionando corretamente; treinar equipe se necessario |
| Dia 30+ | Relatorio de conformidade: % chamados com Ticket previa; escalar nao-conformidades para gestao |

### Passos Criticos (S_melhorias)

1. Configurar categoria "Motoboy" no Ticket com campos: area, destino, item, urgencia (urgente/normal), responsavel pelo custo
2. Maressa envia comunicado formal para Financeiro e DP com a nova regra e data de vigencia
3. Durante os primeiros 30 dias: chamados retroativos sao aceitos mas registrados como "nao-conforme" para controle
4. Apos 30 dias: chamados sem Ticket previa nao sao atendidos (salvo aprovacao da supervisao)
5. Relatorio mensal de nao-conformidades para gestao das areas

---

## Plano de Rollback

**Condicao**: Se critica operacional real impedir abertura de chamado previo (ex: sistema Ticket fora do ar)
**Acao**: Whitelist temporaria com comunicado de excecao; chamado aberto assim que sistema voltar
**Responsavel**: Maressa
**Tempo**: imediato

---

## Criterios de Validacao Pos-Implementacao

- [ ] Formulario "Motoboy" ativo no Ticket com todos os campos obrigatorios
- [ ] Comunicado enviado e confirmado por Financeiro, DP e demais areas
- [ ] Primeiro relatorio de conformidade gerado apos 30 dias
- [ ] Meta: > 95% chamados com Ticket previa em 60 dias

---

## KPI de Sucesso

- % de acionamentos com chamado previo > 95% em 60 dias
- Baseline estimado atual: ~60% de conformidade

---

## Contexto no Roadmap

**Fase 1 — Quick Win (Dias 1-5) — PRIMEIRO a ser executado**

```
Semana 1    Semana 2    Semana 3    Semana 4    Mes 2+
[SOL-L02: Chamado motoboy — comunicado + config Ticket]
```

**Dependencias**:
- SOL-L06 depende de SOL-L02 (precisam de 30 dias de dados validados para automatizar)
- SOL-L03 se beneficia de SOL-L02 (campos de custo no formulario alimentam o dashboard)
