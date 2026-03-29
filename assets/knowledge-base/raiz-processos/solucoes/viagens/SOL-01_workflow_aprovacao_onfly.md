# SOL-01 — Configurar Workflow de Aprovacao por Faixa de Valor no OnFly

**Processo**: Viagens & Mobilidade (OnFly + Uber)
**Nivel**: N1 — Configuracao nativa na plataforma
**Prioridade**: Quick Win pos-gate (Fase 1, pos-CR5)
**Timeline**: 3-5 dias apos gate CR5
**Responsavel**: Maressa + TI
**Resolve**: CR1 (aprovacao manual via WhatsApp sem registro formal no sistema)
**Condicional**: Sim — aguarda definicao da renovacao contratual OnFly (gate CR5, prazo 2026-03-23)

---

## Descricao

Configurar no painel de administracao do OnFly o workflow de aprovacao com as faixas de alcada:
- Reservas ate R$800: aprovacao automatica (sem necessidade de aprovacao manual)
- Reservas acima de R$800: notificacao para Andre Gusman com aprovacao IN-APP (nao via WhatsApp)

O objetivo e mover a aprovacao para dentro do sistema, com registro formal e rastreabilidade completa.

**Acoes**:
1. Verificar com OnFly se a versao contratada suporta configuracao de workflow de aprovacao por faixa de valor
2. Mapear alcadas: definir limites exatos junto com Andre Gusman e Maressa
3. Configurar no painel admin do OnFly: gateway condicional por valor + notificacao in-app para aprovador
4. Testar com 3-5 reservas piloto (valores abaixo e acima de R$800)
5. Comunicar time sobre nova forma de aprovacao (nao mais via WhatsApp)
6. Monitorar por 2 semanas e ajustar se necessario

**KPIs de sucesso**:
- % de aprovacoes registradas no sistema (meta: 100% em 30 dias)
- Tempo medio de aprovacao (meta: <2h vs atual indeterminado)
- Zero aprovacoes via WhatsApp (meta em 30 dias)

**Riscos**:
- OnFly pode nao suportar workflow de aprovacao na versao atual (mitigacao: verificar antes; se nao suportar, acionar SOL-02 ou SOL-06)
- Resistencia do Andre em mudar canal de aprovacao (mitigacao: demonstrar que aprovacao in-app e mais rapida)

---

## Plano de Implementacao

**Nivel**: N1 | **Timeline**: 3-5 dias pos-gate | **Resolve**: CR1

### Gate Obrigatorio

**Responsavel**: Maressa + Andre Gusman
**Prazo**: Ate 2026-03-23 (1 semana)
**Criterios de compatibilidade do OnFly**:
1. Custo dentro do budget aprovado para viagens corporativas
2. Suporte a workflow de aprovacao configuravel por faixa de valor
3. API disponivel para integracao com ZIV/Ticket Raiz

### Responsaveis

- Principal: Maressa (negocio)
- Executor: TI (configuracao)
- Aprovador das alcadas: Andre Gusman

### Alcadas a Configurar

| Faixa de Valor | Fluxo de Aprovacao |
|---------------|-------------------|
| Ate R$800 | Aprovacao automatica (registrada no sistema) |
| Acima de R$800 | Notificacao in-app para Andre Gusman; aguarda aprovacao no sistema |
| Urgencia (<7 dias antecedencia) | Diretor da area + Andre Gusman |

### Plano de Acao

| Dia | Atividade |
|-----|-----------|
| Dia 1 | Verificar com suporte OnFly se versao atual suporta configuracao de workflow por faixa de valor; obter documentacao de admin |
| Dia 1 | Confirmar alcadas exatas com Andre Gusman (R$800 ou outro valor?) e documentar formalmente |
| Dia 2 | Configurar gateway condicional no painel admin do OnFly; configurar notificacoes in-app para aprovador |
| Dia 3 | Testar: 3 reservas piloto (1 abaixo de R$800, 1 acima, 1 urgente) com Sarah ou Kevin |
| Dia 4 | Comunicar time sobre nova forma de aprovacao (email formal de Maressa): aprovacoes serao SOMENTE no sistema, nao mais via WhatsApp |
| Dia 5 | Ativar para todos os usuarios; monitorar por 5 dias uteis |

### Pre-requisitos

- Gate CR5 definido como "OnFly compativel"
- Acesso de administrador ao painel OnFly
- Alcadas aprovadas por Andre Gusman e Maressa

### Validacoes Pos-Ativacao

- [ ] Reserva abaixo de R$800 aprovada automaticamente e registrada no sistema com log
- [ ] Reserva acima de R$800 gera notificacao in-app para Andre; aprovacao registrada
- [ ] Nenhuma reserva sendo aprovada via WhatsApp (monitorar por 2 semanas)
- [ ] Time de contratos confirmou entendimento do novo processo

### Plano de Rollback

**Condicao**: Se OnFly nao suportar configuracao ou se gerar erro em producao
**Acao**: Desativar configuracao e reverter ao processo manual; acionar avaliacao de SOL-02 ou SOL-06
**Responsavel**: TI
**Tempo**: 30 minutos

### KPIs de Acompanhamento

| KPI | Baseline | Meta 30 dias | Meta 90 dias |
|-----|---------|--------------|--------------|
| Aprovacoes registradas no sistema OnFly | ~0% | 100% | 100% |
| Tempo medio de aprovacao de reserva | Indefinido | <2h | <1h |
| Aprovacoes via WhatsApp | ~100% | 0% | 0% |
