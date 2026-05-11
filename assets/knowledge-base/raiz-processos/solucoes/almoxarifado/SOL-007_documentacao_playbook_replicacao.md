# SOL-007 — Documentacao Operacional e Playbook para Replicacao

**Processo**: Almoxarifado (estoque, ferramentas, reposicao, inventario)
**Nivel**: N1 — Documentacao e processo (sem sistema adicional)
**Prioridade**: Transformacao (Fase 3)
**Timeline**: Semanas 5-10 (em paralelo com n8n, sem dependencia)
**Responsavel**: Fabiane (valida) + Pedro Lemos (produz) + Sephora (co-autora)
**Resolve**: RC-005 (processo centralizado em Fabiane; sem documentacao, nao e possivel replicar para POA e JF, nem garantir continuidade operacional)

**ROI estimado**: Risco de continuidade eliminado. Replicacao para POA e JF em 2-3 semanas (em vez de depender de deslocamento de Fabiane). Onboarding de novo almoxarife em 1 semana.

---

## Descricao

Criar documentacao operacional completa do processo de almoxarifado em formato replicavel: POP (Procedimento Operacional Padrao) para cada subprocesso + playbook de implantacao em nova cidade.

**Estrutura do playbook**:
- POP-ALM-001: Abertura e triagem de Ticket (com exemplos de aceitar/recusar)
- POP-ALM-002: Retirada de materiais (checklist fisico)
- POP-ALM-003: Emprestimo e devolucao de ferramentas
- POP-ALM-004: Gestao do estoque volante (carros)
- POP-ALM-005: Reposicao quinzenal (lista por categoria)
- POP-ALM-006: Rateio mensal (passo-a-passo para contabilidade)
- POP-ALM-007: Inventario ciclico (rotina mensal + semestral)
- POP-ALM-008: Kit admissao/demissao
- PLAY-ALM-001: Implantacao em nova cidade (checklist de setup)

**Acoes**:
1. Fabiane e Sephora gravam video de cada subprocesso (shadow do dia-a-dia — 30min por POP)
2. Pedro Lemos transcreve e estrutura os POPs (tarefa de estagiario)
3. Fabiane revisa e valida (nao re-escreve — apenas aprova ou corrige)
4. POPs publicados em local acessivel (Google Drive, Notion, ou wiki interna)
5. Teste de replicacao: alguem de POA executa o POP sem supervisao presencial — Fabiane apenas disponivel para duvidas
6. Ajustar POPs com base no teste
7. Implantacao formal em POA; depois JF

**Riscos**:
- Fabiane pode resistir por percepcao de que documentar reduz seu valor
- Mitigacao: posicionar como crescimento (libera ela de operacional para estrategico)
- Transicao Rocha Miranda → Box Freeway deve ser documentada imediatamente (antes de concluir)

**Ferramentas**: Google Docs/Notion/Wiki, video (Loom ou similar), Google Drive

---

## Plano de Implementacao

**Nivel**: N1 | **Timeline**: Semanas 5-10 | **Resolve**: RC-005

### Responsaveis

- Lider: Fabiane (valida e aprova)
- Produtor: Pedro Lemos (transcreve e estrutura)
- Co-autora: Sephora
- Aprovador: Coordenadora do almoxarifado

### Pre-requisitos

- SOL-001 a SOL-005 implementados (POPs documentam o processo melhorado, nao o antigo)
- Ferramenta de documentacao definida (Google Docs + Google Drive ou Notion)
- Comprometimento de 2h/semana de Fabiane para revisoes

### POPs a Produzir

| POP | Titulo | Prioridade |
|-----|--------|------------|
| POP-ALM-001 | Abertura, triagem e aprovacao de Ticket | Alta |
| POP-ALM-002 | Retirada de materiais e registro | Alta |
| POP-ALM-003 | Emprestimo e devolucao de ferramentas | Alta |
| POP-ALM-004 | Gestao do estoque volante (carros) | Alta |
| POP-ALM-005 | Reposicao quinzenal por categoria | Media |
| POP-ALM-006 | Rateio mensal para contabilidade | Media |
| POP-ALM-007 | Inventario ciclico mensal e semestral | Media |
| POP-ALM-008 | Kit admissao/demissao | Media |
| PLAY-ALM-001 | Implantacao do almoxarifado em nova cidade | Alta (para escala) |

### Plano de Acao

| Semana | Atividade | Responsavel |
|--------|-----------|-------------|
| Sem 5 | Estrutura dos 8 POPs definida; Pedro Lemos cria templates vazios | Pedro Lemos |
| Sem 5-6 | Fabiane e Sephora gravam videos dos subprocessos (Loom) — 30min por POP | Fabiane + Sephora |
| Sem 6-7 | Pedro Lemos transcreve videos e preenche templates dos POPs | Pedro Lemos |
| Sem 7-8 | Fabiane revisa POPs (1 POP por dia, max 30min de revisao cada) | Fabiane |
| Sem 8 | POPs publicados em local acessivel para toda a equipe | Pedro Lemos |
| Sem 8-9 | Teste de replicacao: funcionario de POA executa 2 POPs sem supervisao presencial | POA + Fabiane |
| Sem 9 | Ajustar POPs com base no feedback do teste | Pedro Lemos + Fabiane |
| Sem 9-10 | Criar PLAY-ALM-001: playbook de implantacao em nova cidade | Fabiane |
| Sem 10 | Implantacao formal em POA; cronograma para JF | Coordenadora |

### Alerta — Transicao Rocha Miranda → Box Freeway

Documentar IMEDIATAMENTE o estado atual de Rocha Miranda antes da transicao: inventario fisico completo, ferramentas emprestadas, carros alocados, pendencias. Criar checklist de transferencia patrimonial.

### Validacoes Pos-Implementacao

- [ ] 8 POPs revisados e publicados por Fabiane
- [ ] Teste de replicacao realizado em POA com sucesso (funcionario executa sem suporte presencial)
- [ ] Playbook de nova cidade criado
- [ ] Transicao Rocha Miranda → Box Freeway documentada (checklist de transferencia)

### KPIs de Acompanhamento

| KPI | Baseline | Meta 60 dias | Meta 90 dias |
|-----|---------|--------------|--------------|
| POPs publicados e validados em campo | 0 | 4/8 | 8/8 |
| Cidades com almoxarifado replicado via playbook | 0 | 0 (preparando) | POA implantado |
