# SOL-001 — Campos Obrigatorios e Validacao no Ticket

**Processo**: Almoxarifado (estoque, ferramentas, reposicao, inventario)
**Nivel**: N1 — Configuracao nativa no sistema de Ticket
**Prioridade**: Quick Win (Fase 1)
**Timeline**: Dias 1-5 uteis
**Responsavel**: TI + Fabiane
**Resolve**: RC-001 (tickets chegam com descricao incompleta, sem classificacao adequada, obrigando supervisao a devolver e retrabalhar)

**ROI estimado**: Eliminar 20-30% de tickets devolvidos. Economia de 1-2 dias por ticket e liberacao de 1-2h/semana da supervisora de triagem corretiva.

---

## Descricao

Reconfigurar o formulario do Ticket para tornar obrigatorios os campos: coligada, unidade, descricao do item (com lista de categorias: eletrico/civil/hidraulico/ferramenta/EPI), quantidade, classificacao (normal/emergencial) e justificativa de emergencia (campo condicional — aparece apenas se emergencial selecionado).

**Acoes**:
1. Mapear todos os campos atualmente existentes no formulario de Ticket
2. Levantar com Fabiane a lista de categorias padrao de itens (eletrico/civil/hidraulico/etc.)
3. Configurar campos como obrigatorios no sistema (impede envio sem preenchimento)
4. Adicionar campo condicional: "Justificativa de emergencia" — visivel apenas quando classificacao = emergencial
5. Definir SLA visivel no formulario: normal = ate 15h D-1 para retirada no dia seguinte; emergencial = justificativa obrigatoria
6. Testar com 5 solicitacoes piloto
7. Comunicar mudanca a todos os solicitantes (supervisores de manutencao)

**Riscos**:
- Resistencia de supervisores acostumados a formulario livre
- Mitigacao: treinamento rapido (30min) + template pre-preenchido por unidade

**Ferramentas**: Sistema de Ticket nativo — configuracao de formulario (sem codigo)

---

## Plano de Implementacao

**Nivel**: N1 | **Timeline**: Dias 1-5 uteis | **Resolve**: RC-001

### Responsaveis

- Principal: TI (configurar formulario)
- Apoio: Fabiane (validar campos)
- Aprovador: Coordenadora do almoxarifado

### Pre-requisitos

- Acesso de administrador ao sistema de Ticket
- Lista validada de categorias de itens (Fabiane fornece)
- Lista de coligadas e unidades ativas no sistema

### Plano de Acao

| Dia | Atividade | Responsavel |
|-----|-----------|-------------|
| Dia 1 | Fabiane lista as categorias padrao de itens e os criterios de emergencial | Fabiane |
| Dia 1 | TI mapeia estrutura atual do formulario de Ticket (screenshot/export) | TI |
| Dia 2 | TI configura campos obrigatorios: coligada, unidade, descricao, categoria (lista), quantidade, classificacao | TI |
| Dia 2 | TI adiciona campo condicional: "Justificativa de emergencia" (visivel apenas se emergencial) | TI |
| Dia 3 | Fabiane e Sephora testam com 5 solicitacoes piloto (normais e emergenciais) | Fabiane + Sephora |
| Dia 4 | Ajustes com base no teste | TI |
| Dia 5 | Comunicado para todos os solicitantes (supervisores de manutencao) com instrucoes | Fabiane |

### Validacoes Pos-Implementacao

- [ ] Testar envio de Ticket sem cada campo obrigatorio — sistema deve bloquear
- [ ] Testar envio de Ticket emergencial sem justificativa — sistema deve bloquear
- [ ] Verificar que tickets normais continuam fluindo sem obstaculos
- [ ] Confirmar que Sephora consegue identificar categoria na triagem sem perguntar ao solicitante

### Plano de Rollback

- Procedimento: reverter campos para configuracao anterior no painel de admin do Ticket
- Condicao: solicitacoes bloqueadas por erro de configuracao > 2h em horario de operacao
- Responsavel: TI
- Tempo estimado: 30 minutos

### KPIs de Acompanhamento

| KPI | Baseline | Meta 30 dias | Meta 60 dias | Meta 90 dias |
|-----|---------|--------------|--------------|--------------|
| Tickets devolvidos por descricao incompleta | ~25% | <15% | <8% | <5% |
