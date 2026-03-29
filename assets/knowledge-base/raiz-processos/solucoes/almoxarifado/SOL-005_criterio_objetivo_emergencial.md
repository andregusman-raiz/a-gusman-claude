# SOL-005 — Criterio Objetivo para Classificacao Emergencial

**Processo**: Almoxarifado (estoque, ferramentas, reposicao, inventario)
**Nivel**: N1 — Politica de processo com validacao no Ticket
**Prioridade**: Consolidacao (Fase 2)
**Timeline**: Semanas 2-3 (depende de SOL-001)
**Responsavel**: Fabiane + gestores de manutencao + TI (config campo condicional)
**Resolve**: RC-006 (supervisores auto-classificam solicitacoes como emergenciais sem criterio objetivo, transformando urgencia em rotina e sobrecarregando a equipe)

**ROI estimado**: Reducao de 40-60% de solicitacoes emergenciais espurias. Melhor planejamento de estoque. Sephora e Pedro com tempo para atividades estruturantes (inventario, rateio).

---

## Descricao

Definir e publicar criterios objetivos para classificacao emergencial: (a) equipamento parado que impede funcionamento de unidade escolar, (b) risco de seguranca imediata (vazamento, curto, etc.), (c) prazo de contrato com penalidade em menos de 24h. Qualquer outra situacao e Normal. Ao marcar emergencial no Ticket, o campo de justificativa (criado no SOL-001) exige a selecao de um dos 3 criterios.

**Acoes**:
1. Fabiane define os 3 criterios com exemplos concretos (validar com coordenadores de manutencao)
2. Atualizar formulario do Ticket: campo condicional de justificativa mostra lista dos 3 criterios (selecao obrigatoria ao marcar emergencial)
3. Criar relatorio mensal: % de tickets emergenciais vs total, por unidade
4. Fabiane audita mensalmente: casos fora dos criterios sao registrados e devolvidos como Normal
5. Apos 3 meses: apresentar dados para reuniao com supervisores (feedback com dados)

**Riscos**:
- Supervisores de manutencao podem criar pressao para liberar emergencial
- Mitigacao: criterio documentado e publico remove subjetividade da decisao de Fabiane

**Ferramentas**: Sistema de Ticket (campo condicional com lista), planilha de relatorio mensal

---

## Plano de Implementacao

**Nivel**: N1 | **Timeline**: Semanas 2-3 | **Resolve**: RC-006

### Responsaveis

- Principal: Fabiane (define criterios e audita)
- Configuracao: TI (campo condicional no Ticket)
- Validacao: coordenadores de manutencao
- Aprovador: Coordenadora do almoxarifado

### Pre-requisitos

- SOL-001 implementado (formulario com campo condicional de justificativa ja ativo)
- Reuniao com supervisores de manutencao para alinhar criterios

### Criterios Objetivos Propostos para Emergencial

1. Equipamento ou sistema parado que impede funcionamento de unidade escolar (ex: ar-condicionado central em verao, sistema eletrico do laboratorio)
2. Risco de seguranca imediata: vazamento de gas, curto eletrico com risco de incendio, quebra estrutural
3. Prazo contratual com penalidade em menos de 24h (contrato ativo, multa documentada)

### Plano de Acao

| Semana | Atividade | Responsavel |
|--------|-----------|-------------|
| Sem 2, Dia 1 | Fabiane prepara proposta de criterios com exemplos concretos | Fabiane |
| Sem 2, Dia 2 | Reuniao de 30min com supervisores de manutencao para validar criterios | Fabiane + supervisores |
| Sem 2, Dia 3 | TI atualiza campo condicional do Ticket com lista dos 3 criterios (selecao obrigatoria) | TI |
| Sem 2, Dia 4 | Teste com 3 solicitacoes piloto (normal, emergencial valido, emergencial invalido) | Fabiane + Sephora |
| Sem 3 | Publicar criterios em comunicado formal para todos os solicitantes | Fabiane |
| Mensal | Relatorio: % emergenciais por unidade/supervisor, auditoria de criterios | Fabiane |

### Validacoes Pos-Implementacao

- [ ] Campo condicional exige selecao de criterio para tickets emergenciais
- [ ] Nenhum ticket emergencial sem criterio valido processado apos ativacao
- [ ] Relatorio mensal gerado no primeiro mes
- [ ] Reducao mensuravel de tickets emergenciais no segundo mes

### KPIs de Acompanhamento

| KPI | Baseline | Meta 30 dias | Meta 60 dias | Meta 90 dias |
|-----|---------|--------------|--------------|--------------|
| % tickets emergenciais no total | ~40% estimado | Baseline estabelecido | -20pp | <15% |
