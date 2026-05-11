# S1 — Calendario Automatico de Enxoval

**Processo**: Enxoval de novas unidades escolares
**Nivel**: N1 — Configuracao no Ticket (checklist com datas relativas)
**Prioridade**: Critico (Fase 1 — Agosto 2026)
**Timeline**: 2 semanas (design + deploy) | Pre-requisito: S3 completo
**Responsavel**: Priscila (regras de negocio) + Administrador Ticket (configuracao) | Aprovacao: Fabiane
**Resolve**: C1 (inicio tardio do processo de enxoval; compras emergenciais de dezembro por falta de calendario estruturado)

**ROI estimado**: Processo inicia em agosto/setembro para unidades que abrem em fevereiro do ano seguinte. Fim das compras emergenciais de dezembro. Deadline P0: ativa ate agosto 2026 para impactar ciclo de expansoes 2027.

---

## Descricao

Criar no Ticket um tipo de solicitacao "Enxoval — Nova Unidade" com marcos temporais calculados retroativamente a partir da data de inauguracao prevista.

**Logica de datas**:

| Marco | Quando | Responsavel |
|-------|--------|-------------|
| Abertura do projeto de enxoval | D-150 (5 meses antes) | Priscila |
| Levantamento de necessidades (todas as areas) | D-140 | Priscila + areas |
| Envio checklist completo para compras | D-120 (4 meses antes) | Priscila |
| Pedido de marcenaria (lead time 60d+) | D-110 | Compras |
| Pedido de brinquedos (lead time 90d) | D-110 | Compras |
| Pedido CFTV/Alarme/Catraca | D-90 | Manutencao/TI |
| Pedido material TI | D-90 | TI |
| Pedido cantina (contrato) | D-90 | Compras |
| Acompanhamento obra (dependencias fisicas) | D-60 | Arquitetura |
| Entrega marcenaria instalada | D-30 | Compras |
| Entrega brinquedos instalados | D-21 | Compras |
| Comunicacao visual CMEF instalada | D-14 | CMEF |
| Vistoria final — entrega da chave | D-0 | Fabiane |

**Alerta automatico**: Ticket envia notificacao para Priscila e Fabiane quando qualquer marco ultrapassar a data sem conclusao.

**Gatilho de criacao (futuro N2)**: Quando contrato de locacao de nova unidade for assinado no TOTVS → Ticket cria automaticamente o projeto de enxoval.

**Resultado esperado**: Processo inicia em agosto/setembro para unidades que abrem em fevereiro do ano seguinte — fim das compras emergenciais de dezembro.

---

## Plano de Implementacao

**Nivel**: N1 | **Timeline**: 2 semanas | **Resolve**: C1
**Pre-requisito**: S3 (checklist) implantado e validado

### Responsaveis

- **Owner das regras**: Priscila + Fabiane
- **Configuracao**: Administrador do Ticket
- **Aprovacao das datas**: Fabiane

### Pre-requisitos

- S3 (checklist) implantado e validado
- Acesso de administrador ao Ticket
- Definicao das datas limite aprovada por Fabiane

### Plano de Acao

1. Definir a data de referencia: "data prevista de inauguracao" — campo que Priscila preenche ao criar o projeto
2. Calcular os marcos relativos a partir dessa data (D-150, D-120, D-110, etc.) conforme tabela acima
3. Configurar alertas automaticos no Ticket: email para Priscila e Fabiane quando marco estiver a 7 dias de vencer sem conclusao
4. Configurar alerta de escalada: se marco vencer sem conclusao, notificar tambem Fabiane diretamente
5. Criar dashboard de "Enxovais em andamento" com status de cada marco por unidade
6. Teste piloto: criar projeto ficticio de enxoval e simular passagem do tempo para validar alertas

### Timeline

| Semana | Atividade |
|--------|-----------|
| Semana 1 | Design dos marcos, validacao das datas com Fabiane |
| Semana 1 | Configuracao no Ticket em ambiente de teste |
| Semana 2 | Teste com projeto piloto ficticio |
| Semana 2 | Ajustes e deploy — comunicacao para o time |

### Validacoes Pos-Implementacao

- [ ] Criar projeto de teste com inauguracao em 6 meses e confirmar que todos os marcos foram criados com datas corretas
- [ ] Simular marco vencendo e confirmar que alerta foi enviado para Priscila e Fabiane
- [ ] Confirmar que Fabiane consegue ver status de todos os enxovais ativos em uma tela
- [ ] Priscila usa o calendario em pelo menos 1 projeto real antes de declarar completo

### KPIs de Acompanhamento

| KPI | Baseline | Meta (90 dias apos S1+S2+S3) |
|-----|---------|------|
| % pedidos enxoval chegando antes de outubro | ~0% | > 90% |
| Compras emergenciais spot em dezembro/janeiro | Recorrente | Zero |
| Pedidos chegando em dezembro | Sempre | Nunca |
| Risco de unidade nao pronta | Alto | Baixo |
| Stress do time em dezembro/janeiro | Critico | Eliminado |
