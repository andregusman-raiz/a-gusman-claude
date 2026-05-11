# SOL-02 — Integracao OnFly com ZIV (Ticket Raiz)

**Processo**: Viagens & Mobilidade (OnFly + Uber)
**Nivel**: N2 — Integracao nativa entre sistemas
**Prioridade**: Pos-gate (Fase 2, pos-SOL-01)
**Timeline**: 2-3 semanas apos gate CR5 e SOL-01
**Responsavel**: TI + Maressa
**Resolve**: CR1 (rastreabilidade da aprovacao no sistema de tickets corporativo)
**Condicional**: Sim — aguarda gate CR5 e depende de SOL-01

---

## Descricao

Integrar o fluxo de solicitacao de viagens com o ZIV (Ticket Raiz) para que:
- Solicitacao de viagem no OnFly gere ticket automatico no ZIV
- Aprovacao/rejeicao no ZIV reflita no OnFly (ou vice-versa)
- Todo o historico de aprovacao seja rastreavel no sistema de tickets

Esta solucao e o "desejo ideal" mencionado no levantamento do setor: "Desejo: automacao OnFly ↔ ZIV".

**Acoes**:
1. Mapear API disponivel do OnFly (verificar documentacao de integracao com a equipe de suporte)
2. Mapear API do ZIV (Ticket Raiz) para criacao e atualizacao de tickets
3. Definir fluxo: qual sistema e o master de aprovacao (ZIV → OnFly ou OnFly → ZIV)
4. Desenvolver middleware de integracao (recomendado: n8n para reducao de custo de desenvolvimento)
5. Testar em ambiente de staging com dados reais anonimizados
6. Piloto com 10 reservas reais
7. Ativar para todos os fluxos

**KPIs de sucesso**:
- 100% das solicitacoes de viagem com ticket correspondente no ZIV
- Aprovacao refletida automaticamente entre sistemas em <5 minutos
- Zero registros manuais duplicados

**Riscos**:
- API do OnFly pode ter limitacoes (mitigacao: consultar documentacao ou suporte antes de iniciar)
- Custo de desenvolvimento se API nao tiver integracao nativa (mitigacao: usar n8n como middleware)

---

## Plano de Implementacao

**Nivel**: N2 | **Timeline**: 2-3 semanas pos-SOL-01 | **Resolve**: CR1

### Responsaveis

- Principal: TI (desenvolvimento)
- Apoio: Maressa (validacao de negocio)

### Pre-requisitos

- SOL-01 funcionando em producao
- API do OnFly documentada e acessivel (verificar com suporte OnFly)
- API do ZIV/Ticket Raiz documentada e acessivel
- Ambiente de staging disponivel para testes

### Fluxo Alvo

```
Colaborador solicita viagem no OnFly
    → OnFly gera evento via webhook
    → Middleware cria ticket no ZIV com dados da reserva
    → Se valor >R$800: ticket vai para fila de aprovacao do Andre no ZIV
    → Aprovacao no ZIV envia confirmacao de volta ao OnFly via API
    → OnFly confirma a reserva automaticamente
```

### Plano de Acao

| Semana | Atividade |
|--------|-----------|
| Semana 1 | Mapear APIs (endpoints, autenticacao, payloads); definir sistema master de aprovacao |
| Semana 1 | Criar especificacao tecnica: quais campos transitar entre sistemas, tratamento de erros, SLA de sincronia |
| Semana 2 | Desenvolver middleware (recomendado: n8n para reducao de custo de desenvolvimento) |
| Semana 2 | Testes de integracao em staging com dados reais anonimizados |
| Semana 3 | Revisao com Maressa e Sarah: fluxo de negocio esta correto? |
| Semana 3 | Piloto com 10 reservas reais; monitorar tickets gerados no ZIV |
| Semana 3 | Ativar para producao completa; monitorar por 1 semana |

### Validacoes Pos-Implementacao

- [ ] 100% das solicitacoes de viagem geram ticket no ZIV
- [ ] Aprovacao no ZIV reflete no OnFly em menos de 5 minutos
- [ ] Campos obrigatorios presentes: solicitante, data, destino, valor, justificativa
- [ ] Erros de integracao geram alerta automatico (nao silenciosos)
- [ ] 10 casos reais revisados por Maressa com dados corretos

### Plano de Rollback

**Condicao**: Erro de sincronia afetando operacao real ou dados incorretos em producao
**Acao**: Desativar integracao; processo manual enquanto correcao e desenvolvida
**Responsavel**: TI
**Tempo**: 1-4 horas

### KPIs de Acompanhamento

| KPI | Baseline | Meta 30 dias | Meta 90 dias |
|-----|---------|--------------|--------------|
| Solicitacoes com ticket correspondente no ZIV | ~0% | 100% | 100% |
| Sincronia de aprovacao entre sistemas | Inexistente | <5 minutos | <5 minutos |
| Registros manuais duplicados | Frequentes | 0 | 0 |
