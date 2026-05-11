# SOL-05 — Implementar Abertura de Chamados no Zeev para CFTV e Alarmes

**Processo**: Seguranca e Acesso (CFTV, Alarmes, Catracas)
**Nivel**: N1 — Config Zeev (formulario de abertura de chamado)
**Prioridade**: Quick Win / Acao Imediata (Fase 1)
**Timeline**: 1 semana
**Responsavel**: Gestao de Utilidades (responsavel pelo processo) + Administrador Zeev (configuracao); Aprovador: Coordenador de Utilidades
**Resolve**: CR-14 (ausencia de canal digital para chamados de manutencao de CFTV e Alarmes)

---

## Descricao

Criar processo no Zeev para abertura e acompanhamento de chamados de manutencao de CFTV e Alarmes. POPs ja existem — falta o canal digital de registro.

**Acoes**:
1. Criar formulario Zeev "Chamado Manutencao Seguranca" com campos: unidade, tipo (CFTV/Alarme), fornecedor, descricao do problema, urgencia
2. Configurar SLA de resposta no proprio Zeev (ex: 4h para critico, 24h para normal)
3. Notificacao automatica ao fornecedor (se Zeev suportar) ou ao responsavel da area para acionar
4. Atualizar POPs de CFTV e Alarmes incluindo etapa obrigatoria de abertura de ticket no Zeev
5. Treinar equipe de operacoes (1 sessao)

**Ferramenta**: Zeev BPM (raizeducacao.zeev.it) — formulario nativo, sem desenvolvimento

---

## Plano de Implementacao

**Nivel**: N1 (config Zeev nativa) | **Timeline**: 1 semana | **Resolve**: CR-14

### Pre-requisitos

- Acesso de administrador ao Zeev (raizeducacao.zeev.it)
- Aprovacao do Coordenador de Utilidades para o novo processo

### Responsaveis

- Principal: Gestao de Utilidades (responsavel pelo processo)
- Executor: Administrador Zeev (criacao do formulario)
- Aprovador: Coordenador de Utilidades

### Plano de Acao

| Dia | Atividade |
|-----|-----------|
| D+1 | Desenhar campos do formulario: unidade, tipo (CFTV/Alarme/Catraca), fornecedor, descricao, urgencia (critico/normal), fotos |
| D+2 | Criar formulario no Zeev + configurar SLA de notificacao |
| D+3 | Configurar notificacao ao responsavel de Utilidades da regiao |
| D+4 | Testar com 2-3 chamados piloto (casos reais ou simulados) |
| D+5 | Comunicar equipe de operacoes e atualizar POPs de CFTV e Alarmes |

### Configuracao de SLA no Zeev

- Urgencia critica: notificacao imediata + alerta se sem resposta em 2h
- Urgencia normal: notificacao + alerta se sem resposta em 24h
- Concluido: solicitar comprovacao (foto ou relatorio do fornecedor)

### Validacoes de Sucesso

- [ ] Formulario criado e funcionando no Zeev
- [ ] POPs de CFTV e Alarmes atualizados com etapa de abertura de ticket
- [ ] Equipe treinada (confirmacao por email)
- [ ] Primeiros 10 chamados registrados no sistema

### KPIs de Acompanhamento

| KPI | Baseline | Meta Fase 1 | Meta Fase 2 |
|-----|---------|------------|------------|
| Chamados CFTV/Alarme rastreados | ~0% (informal) | >80% no Zeev | >95% |
