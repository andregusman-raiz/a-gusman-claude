# SOL-002 — Controle Digital Item-a-Item do Estoque Volante (4 Carros)

**Processo**: Almoxarifado (estoque, ferramentas, reposicao, inventario)
**Nivel**: N1 (planilha estruturada) → N2 (integracao futura com TOTVS)
**Prioridade**: Consolidacao (Fase 2)
**Timeline**: Semanas 2-4 (planilha N1); integracao TOTVS em fase posterior
**Responsavel**: Fabiane (coordena) + Sephora (registra) + TI (N2 futuro)
**Resolve**: RC-002 (4 carros funcionam como depositos moveis sem rastreio de item individual — qual item esta em qual carro, vinculado a qual ticket)

**ROI estimado**: Rastreabilidade 100% dos itens nos carros. Inventario de veiculos realizado mensalmente. Rateio baseado em dados reais.

---

## Descricao

Substituir a planilha de controle atual por uma estrutura com colunas: item, categoria, quantidade, carro (1/2/3/4), ticket de origem, unidade destino, data saida, data retorno previsto, status (em transito / devolvido / perdido). Cada movimento de item para/de carro registra o ticket vinculado.

**Acoes**:
1. Auditar conteudo atual dos 4 carros (inventario inicial — ver SOL-003)
2. Criar planilha estruturada (Google Sheets ou Excel compartilhado) com as colunas definidas
3. Definir rotina: ao carregar item no carro, Sephora registra na planilha com ticket de origem
4. Ao retornar item, registra devolucao
5. Reposicao quinzenal (sextas): fecha ciclo, gera relatorio de itens sem retorno
6. Vincular planilha ao rateio mensal: contabilidade recebe relatorio por unidade com base nos tickets registrados
7. (N2 — fase futura) Integrar planilha ao TOTVS via exportacao padronizada ou API

**Riscos**:
- Adesao dos 3 supervisores ao registro (carro deles = responsabilidade deles)
- Mitigacao: supervisora coordenadora responsavel pelo carro 1; supervisores responsaveis pelos seus; Fabiane audita quinzenalmente

**Ferramentas**: Google Sheets ou Excel (N1), TOTVS FV para registro patrimonial (N1 config), API TOTVS para integracao futura (N2)

---

## Plano de Implementacao

**Nivel**: N1 → N2 | **Timeline**: Semanas 2-4 | **Resolve**: RC-002

### Responsaveis

- Principal: Fabiane (coordena)
- Executor: Sephora (registros) + supervisores (responsaveis pelos seus carros)
- N2 futuro: TI + Fabiane

### Pre-requisitos

- SOL-003 concluido (inventario zero dos carros realizado)
- Reuniao com os 3 supervisores para definir responsabilidades
- Acesso de todos os supervisores ao documento compartilhado

### Estrutura da Planilha de Estoque Volante

| Campo | Descricao |
|-------|-----------|
| Item | Nome do item |
| Categoria | Eletrico / Civil / Hidraulico / Ferramenta / EPI |
| Carro | 1 (Coord) / 2 (Sup A) / 3 (Sup B) / 4 (Sup C) |
| Quantidade | Quantidade atual no carro |
| Ticket de origem | Numero do ticket que gerou a saida do almoxarifado para o carro |
| Unidade destino | Unidade onde o item sera usado |
| Data saida almox | Data que saiu do almoxarifado para o carro |
| Data uso | Data que saiu do carro para uso na unidade |
| Data retorno carro | Data que voltou para o carro (se voltou) |
| Status | No carro / Em uso na unidade / Devolvido ao almox / Nao devolvido |

### Plano de Acao

| Semana | Atividade | Responsavel |
|--------|-----------|-------------|
| Sem 2, Dia 1 | Criar planilha estruturada e compartilhar com supervisores | Sephora |
| Sem 2, Dia 2 | Reuniao com supervisores: explicar estrutura, responsabilidades e rotina | Fabiane |
| Sem 2, Dia 3-5 | Lancar inventario zero dos carros na planilha (resultado do SOL-003) | Sephora + supervisores |
| Sem 3 | Primeiro ciclo completo: supervisores registram cada saida e retorno | Supervisores |
| Sem 3 | Sephora audita aderencia (verifica se registros estao sendo feitos) | Sephora |
| Sem 4 | Primeiro relatorio quinzenal de estoque volante para rateio | Sephora + Fabiane |
| Sem 4 | Definir formato de exportacao para contabilidade | Fabiane |
| Mes 2+ | Avaliar integracao com TOTVS (N2): exportar planilha padronizada ou API | TI + Fabiane |

### Rotina de Reposicao Quinzenal (Sextas-Feiras)

1. Sephora gera relatorio de itens consumidos por carro na quinzena (da planilha)
2. Sephora verifica estoque fisico vs registrado (mini-inventario)
3. Reposicao: carros abastecidos com base no relatorio de consumo
4. Planilha atualizada com saldos pos-reposicao
5. Relatorio enviado para Fabiane para acompanhamento

### Validacoes Pos-Implementacao

- [ ] Inventario zero dos 4 carros registrado na planilha
- [ ] Supervisores registrando movimentos (auditoria apos 1 semana)
- [ ] Primeiro relatorio quinzenal gerado
- [ ] Rateio mensal do mes seguinte baseado nos dados da planilha

### KPIs de Acompanhamento

| KPI | Baseline | Meta 30 dias | Meta 60 dias | Meta 90 dias |
|-----|---------|--------------|--------------|--------------|
| Movimentos de itens nos carros com registro | ~20% | 60% | 85% | >90% |
| Rastreabilidade itens nos carros | ~20% | 70% | 90% | >95% |
