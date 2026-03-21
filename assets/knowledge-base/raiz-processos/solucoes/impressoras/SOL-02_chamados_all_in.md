# SOL-02 — Padronizar Chamados All In com SLA Tracking

**Processo**: Gestao de Impressoras (Locadas e Proprias) — Raiz Educacao
**Nivel**: N1 (configuracao nativa no sistema de Tickets)
**Prioridade**: Quick Win
**Timeline**: 3-5 dias uteis | Prazo: 15/abr/2026
**Responsavel**: Maressa (processo) + responsavel pelo sistema de Tickets (config)
**Resolve**: CR-01

---

## Descricao

Padronizar que TODA escola RJ abre chamado de impressora locada pelo sistema de Tickets Raiz (nao diretamente na All In). O ticket Raiz notifica a All In automaticamente e rastreia SLA. Se All In nao resolve em X horas, alerta automatico ao time.

**Posicao na Matriz Impacto x Esforco**: Esforco BAIXO / Impacto ALTO — Quick Win

**Importancia estrategica**: SOL-02 gera o baseline de SLA All In necessario para exigir nivel superior no contrato RICOH (SOL-07). Tambem habilita alertas de SLA via n8n (SOL-03).

### ROI / Impacto Esperado

| Solucao | Causa Raiz Resolvida | Impacto Esperado | Prazo |
|---------|---------------------|-----------------|-------|
| SOL-02 (Chamados padronizados) | CR-01 | SLA All In mensuravel | Abr/2026 |

### Riscos

- All In pode resistir ao novo canal — negociar como parte do contrato vigente
- Escolas podem continuar usando canais informais — comunicacao e acompanhamento necessarios

---

## Plano de Implementacao

### Pre-requisitos

- Acesso de administrador ao sistema de Tickets (Facilities/Contratos)
- SLA contratual All In consultado (tempo de atendimento prometido em contrato)
- Lista de escolas RJ com All In: Rocha Miranda, QI Tijuca, As Pereira, SAP e demais

### Plano Detalhado

| Dia | Atividade | Responsavel |
|-----|-----------|-------------|
| Dia 1 | Consultar contrato All In: extrair SLA prometido (tempo 1a resposta e resolucao) | Maressa |
| Dia 1-2 | Criar categoria "Impressora Locada — All In" no sistema de Tickets com campos: escola, equipamento, tipo de problema | Responsavel Tickets |
| Dia 2 | Configurar SLA no ticket com base no contrato (ex: 4h resposta, 24h resolucao) | Responsavel Tickets |
| Dia 3 | Configurar escalonamento: se SLA vencer sem resolucao → notificar Maressa e Sarah automaticamente | Responsavel Tickets |
| Dia 3-4 | Comunicar escolas RJ: novo fluxo de abertura de chamado (Tickets Raiz, nao direto na All In) | Maressa |
| Dia 4 | Treinar All In para aceitar chamados via sistema (ou configurar integracao de notificacao para All In) | Maressa + All In |
| Dia 5 | Go-live piloto com 2 escolas (Rocha Miranda + QI Tijuca) | Maressa |
| Semana 2 | Expandir para todas as escolas RJ | Maressa |

Passos adicionais (S_melhorias):
1. Criar categoria "Impressora Locada — All In" no sistema de Tickets
2. Configurar SLA: tempo de primeira resposta e tempo de resolucao (baseado no contrato All In)
3. Configurar escalonamento automatico: se SLA violado → notificar Maressa/Sarah
4. Comunicar escolas RJ (Rocha Miranda, QI Tijuca, As Pereira, SAP e demais) sobre novo fluxo
5. Treinamento rapido do time All In para aceitar chamados via sistema

### Checklist de Validacao Pos-Go-Live

- [ ] Categoria "Impressora Locada — All In" ativa no Tickets
- [ ] SLA configurado de acordo com contrato
- [ ] Escalonamento automatico funcionando (testar com chamado simulado)
- [ ] Pelo menos 3 chamados reais processados pelo novo fluxo sem problemas
- [ ] Maressa recebe alerta de SLA vencido nos testes
- [ ] Escolas piloto confirmam que conseguem abrir chamados pelo Tickets

### Plano de Rollback

Se escolas nao conseguirem usar o novo fluxo ou All In nao receber chamados: manter fluxo anterior temporariamente e corrigir configuracao antes de reativar.

---

## Metricas de Sucesso

- 100% dos chamados RJ abertura via Ticket (meta: 4 semanas apos go-live)
- Taxa de SLA cumprido All In mensuravel no sistema
- Tempo medio de atendimento All In calculavel com dados

---

## Dependencias Entre Solucoes

```
SOL-02 (Chamados padronizados)
  → SOL-03 depende de SOL-02 (API Tickets para alertas SLA)
  → SOL-07 depende de SOL-02 (baseline SLA All In para exigir do RICOH)

SOL-01 e SOL-02 sao independentes entre si — podem ser executados em paralelo.
```

---

## Contexto no Roadmap

**Imediato — Abril/2026 (Semanas 1-2)**

```
Abr/2026
SOL-02 >>
```
