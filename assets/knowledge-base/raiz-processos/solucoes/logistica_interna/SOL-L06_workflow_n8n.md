# SOL-L06 — Consolidacao de Demandas e Alertas via n8n

**Processo**: Logistica Interna (Malote + Frete + Motoboy) — Raiz Educacao
**Nivel**: N3 (orquestracao via n8n)
**Prioridade**: Automacao (Fase 3)
**Timeline**: 3-4 semanas de implementacao | Prazo: Mes 2+ (apos Fase 1 e 2 estabilizarem)
**Responsavel**: TI / Automacao (execucao tecnica) + Maressa (definicao de regras)
**Pre-requisito**: SOL-L02 e SOL-L03 implementados e com dados por pelo menos 30 dias
**Resolve**: RC-L02 (reforca governanca), RC-L03 (automatiza consolidacao)

---

## Descricao

Workflow n8n que:
1. Consolida chamados de logistica do Ticket semanalmente e gera relatorio por area
2. Alerta Maressa quando chamado de motoboy for aberto sem area ou sem responsavel pelo custo
3. Alerta quando item de descarte esta ha mais de 10 dias uteis sem decisao de manutencao
4. Gera resumo semanal automatico de rotas previstas vs realizadas (quando motoristas registrarem tempos)

**Posicao na Matriz Impacto x Esforco**: Esforco MEDIO / Impacto ALTO — Automacao

### ROI / Impacto Esperado

| Solucao | Causa Raiz Resolvida | Impacto Esperado | Prazo |
|---------|---------------------|-----------------|-------|
| SOL-L06 (Workflow n8n) | RC-L02, RC-L03 | Consolidacao automatica de custos; alertas proativos de desvio | Mes 2+ |

---

## Pre-requisitos

- n8n operacional (verificar instancia da Raiz)
- SOL-L02 operacional com pelo menos 30 dias de dados de motoboy
- SOL-L03 operacional com modelo de dados validado (30 dias)
- SOL-L05 operacional (para alertas de descarte parado)
- API ou webhook do Ticket disponivel para integracao

---

## Quando Ativar

Ativar SOL-L06 somente se:
- Volume de chamados de logistica > 40/mes, OU
- Maressa gasta mais de 3h/semana em consolidacao manual, OU
- Gestao solicita relatorio em tempo real (nao tolera latencia da planilha)

---

## Plano de Implementacao

### Workflows Previstos

| Workflow | Gatilho | Acao | Destinatario |
|----------|---------|------|-------------|
| Alerta motoboy sem area | Chamado criado sem campo "area solicitante" | Notificar solicitante para completar | Solicitante |
| Alerta descarte parado | Item sem decisao por 8 dias uteis | Alerta para Manutencao + Maressa | Manutencao + Maressa |
| Relatorio semanal | Toda segunda-feira 8h | Consolidado de chamados da semana anterior | Maressa |
| Alerta orcamento | Custo acumulado da area > 80% do orcamento mensal | Alerta precoce para gestor da area | Gestor da area |

### Passos de Implementacao (S_melhorias)

1. Verificar que SOL-L02 e SOL-L03 estao operacionais com 30 dias de dados
2. Mapear endpoints/webhooks do Ticket para leitura de chamados
3. Implementar Workflow 1: alerta de campo vazio em chamado de motoboy
4. Implementar Workflow 2: alerta de descarte sem decisao em 8 dias uteis
5. Implementar Workflow 3: relatorio semanal consolidado toda segunda-feira 8h
6. Implementar Workflow 4: alerta de orcamento ao atingir 80% do limite mensal por area
7. Testar com dados reais simulados antes de ativar em producao
8. Ativar em producao e monitorar por 2 semanas

---

## Quando Ativar N4 (App de Rastreamento)

Condicoes para avaliar solucao N4:
- Volume > 30 escolas atendidas por semana, OU
- 3+ motoristas efetivos em operacao simultanea, OU
- SLA de entrega com penalidade contratual com escolas

Enquanto essas condicoes nao se aplicam, Google Maps + protocolo de assinatura + registros no Ticket cobrem o nivel de rastreabilidade necessario.

---

## Criterios de Validacao Pos-Implementacao

- [ ] Workflow de alerta motoboy sem area ativo e testado
- [ ] Workflow de alerta descarte parado ativo (gatilho: 8 dias uteis)
- [ ] Relatorio semanal automatico chegando para Maressa toda segunda-feira
- [ ] Alerta de orcamento configurado para todas as areas com orcamento definido
- [ ] Maressa confirma que alertas chegam no canal correto

---

## KPI de Sucesso

- Custo logistico visivel por area: automatizado (meta mes 2-3)
- Chamados sem area solicitante: 0% (alerta corrige em tempo real)
- Itens descarte sem decisao > 8 dias: alertados automaticamente

---

## Contexto no Roadmap

**Fase 3 — Automacao (Mes 2+)**

```
Semana 1    Semana 2    Semana 3    Semana 4    Mes 2+
                                            [SOL-L06: n8n ──────]
```

**Dependencias**:
```
SOL-L02 (Chamado motoboy) → SOL-L06 depende de SOL-L02 (dados de motoboy para alertas)
SOL-L03 (Dashboard custos) → SOL-L06 depende de SOL-L03 (modelo de dados validado)
SOL-L05 (Fila descarte) → SOL-L06 monitora fila de descarte via Ticket
```
