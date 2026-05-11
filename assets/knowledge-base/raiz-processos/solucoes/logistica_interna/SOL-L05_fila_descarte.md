# SOL-L05 — Fila de Descarte com SLA de Avaliacao

**Processo**: Logistica Interna (Malote + Frete + Motoboy) — Raiz Educacao
**Nivel**: N1 (categoria + SLA no Ticket)
**Prioridade**: Consolidacao
**Timeline**: 1 semana | Prazo: Semana 2-3
**Responsavel**: Maressa (criacao e monitoramento) + Manutencao (avaliacao)
**Resolve**: RC-L05

---

## Descricao

Criar categoria "Descarte/Redistribuicao" no Ticket com campos: tipo de item, quantidade, localizacao atual, foto, area solicitante. Manutencao tem SLA de 5 dias uteis para avaliar e decidir: redistribuir (para onde) ou descartar (agendar frete). Itens sem decisao em 10 dias uteis sobem para supervisao.

**Posicao na Matriz Impacto x Esforco**: Esforco BAIXO / Impacto MEDIO — Consolidacao

### ROI / Impacto Esperado

| Solucao | Causa Raiz Resolvida | Impacto Esperado | Prazo |
|---------|---------------------|-----------------|-------|
| SOL-L05 (Fila descarte) | RC-L05 | Zero itens em Rocha Miranda com mais de 30 dias sem decisao em 60 dias | Semana 2-3 |

---

## Pre-requisitos

- Acesso de configuracao ao Ticket para criar categoria com SLA
- Alinhamento com gestao de Manutencao sobre o SLA de 5 dias uteis

---

## Plano de Implementacao

| Dia | Atividade |
|-----|-----------|
| Dia 1 | Configurar categoria "Descarte/Redistribuicao" no Ticket com campos: tipo item, qtd, local atual, foto (obrigatorio), area solicitante |
| Dia 2 | Definir SLA no Ticket: Manutencao tem 5 dias uteis para registrar decisao no chamado (redistribuir ou descartar) |
| Dia 3 | Comunicar Manutencao e areas sobre o novo fluxo |
| Dia 5 | Catalogar itens ja em Rocha Miranda sem decisao — abrir chamados retroativos para cada item |
| Semana 3 | Maressa revisa fila: itens sem decisao em 10 dias uteis sao escalados para supervisao |

### Passos Criticos (S_melhorias)

1. Configurar formulario no Ticket: tipo, qtd, local, foto obrigatoria, urgencia
2. SLA manutencao: 5 dias uteis para avaliacao + decisao documentada no chamado
3. Criterio de redistribuicao: manutencao identifica escola/unidade receptora, logistica agenda o frete
4. Criterio de descarte: manutencao aprova, logistica agenda frete para descarte final (nunca acumular em Rocha Miranda sem decisao)
5. Maressa revisa fila semanalmente — itens sem decisao em 10 dias uteis sao escalados

---

## Criterios de Decisao para Manutencao

| Decisao | Criterio | Acao |
|---------|----------|------|
| Redistribuir | Item em boas condicoes, ha unidade receptora | Manutencao indica destino no chamado; Logistica agenda frete |
| Descartar | Item sem condicao de uso ou sem receptor | Manutencao aprova; Logistica agenda frete de descarte |
| Aguardar | Item pendente de avaliacao tecnica | Registrar justificativa e nova data limite no chamado |

**Regra**: Nenhum item fica em Rocha Miranda por mais de 30 dias sem decisao registrada no Ticket.

---

## Criterios de Validacao Pos-Implementacao

- [ ] Formulario de descarte ativo no Ticket
- [ ] SLA configurado (5 dias uteis para Manutencao)
- [ ] Itens atuais sem decisao catalogados e com chamados abertos
- [ ] Meta: zero itens com mais de 30 dias sem decisao em 60 dias

---

## KPI de Sucesso

- Reducao de itens sem decisao em Rocha Miranda em 60 dias
- Meta: zero itens com mais de 30 dias sem status no Ticket

---

## Contexto no Roadmap

**Fase 2 — Consolidacao (Semana 2-3)**

```
Semana 1    Semana 2    Semana 3    Semana 4    Mes 2+
            [SOL-L05: Fila descarte no Ticket ───────]
```

**Dependencias**:
- Independente de SOL-L02 e SOL-L03 — pode ser executado em paralelo com a Fase 2
- SOL-L06 monitora automaticamente via alerta: item sem decisao por 8 dias uteis dispara notificacao para Manutencao + Maressa
