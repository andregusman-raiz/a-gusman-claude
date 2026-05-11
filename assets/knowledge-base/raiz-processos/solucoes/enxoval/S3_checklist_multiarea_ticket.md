# S3 — Checklist Multi-area Padrao no Ticket

**Processo**: Enxoval de novas unidades escolares
**Nivel**: N1 — Template de checklist no Ticket (configuracao nativa)
**Prioridade**: Pre-requisito critico (deve ser o PRIMEIRO a ser implantado)
**Timeline**: 1 semana
**Responsavel**: Priscila (conteudo) + Administrador Ticket (configuracao)
**Resolve**: C3 (ausencia de visibilidade multi-area; itens esquecidos; "telefone quebrado" entre areas)

**ROI estimado**: Fim do "telefone quebrado" entre areas. Status de enxoval visivel em tempo real por todos os envolvidos. Pre-requisito que desbloqueia S1 e S2.

---

## Descricao

Criar template de checklist de enxoval no Ticket com todas as categorias, responsavel fixo por area e dependencias mapeadas.

**Template de checklist (por categoria)**:

| # | Categoria | Itens | Area Responsavel | Depende de |
|---|-----------|-------|-----------------|------------|
| 1 | Mobiliario sala de aula | Mesas aluno, cadeiras, lousa, armarios | Compras + Arquitetura | Medicao obra pronta |
| 2 | Mobiliario administrativo | Mesas, cadeiras, estantes, arquivos | Compras | Planta administrativa aprovada |
| 3 | Mobiliario pedagogico | Estantes, tapetes, paineis | Compras | Layout pedagogico definido |
| 4 | CFTV | Cameras, DVR, monitor | Manutencao | Passagem de cabos na obra |
| 5 | Alarme | Sensores, central, teclado | Manutencao | Eletrica completa |
| 6 | Catraca | Hardware + software + cadastro | TI + Manutencao | CFTV instalado |
| 7 | Brinquedos | Parque externo, brinquedos internos | Compras | Area externa entregue |
| 8 | Material esportivo | Bolas, coletes, cones, tatames | Compras | Quadra/sala pronta |
| 9 | Material TI | Computadores, impressoras, tablets | TI | Rede e eletrica prontas |
| 10 | Contrato cantina | Empresa, equipamentos, estoque inicial | Compras | Cozinha entregue pela obra |
| 11 | Fretes | Movimentacoes de materiais entre locais | Logistica | Conforme cronograma de entregas |
| 12 | Comunicacao visual | Faixas, placas, adesivos CMEF | CMEF | Layout final aprovado |
| 13 | Estrutura provisoria (se aplicavel) | Container/sala temp, mobiliario, impressora | Arquitetura + Compras | Aprovacao do local |

**Cada item do checklist contem**:
- Status (pendente / em andamento / concluido)
- Data prevista
- Data realizada
- Responsavel (pessoa, nao area)
- Observacoes / link para ticket de compra

**Visibilidade**: Fabiane ve o status de todas as 13 categorias em uma tela. Qualquer item atrasado aparece em vermelho automaticamente.

**Resultado esperado**: Fim do "telefone quebrado" entre areas. Status de enxoval visivel em tempo real por todos os envolvidos.

---

## Plano de Implementacao

**Nivel**: N1 | **Timeline**: 1 semana | **Resolve**: C3
**Pre-requisito para**: S1 (Calendario automatico)

### Responsaveis

- **Owner do conteudo**: Priscila
- **Aprovador**: Fabiane
- **Configuracao no sistema**: Administrador do Ticket
- **Revisao por area**: cada responsavel de area valida seus itens

### Pre-requisitos

- Acesso de administrador ao Ticket
- Validacao do checklist com todas as areas (TI, Manutencao, CMEF, Compras, Arquitetura)

### Plano de Acao

1. Priscila lista todas as categorias de enxoval com base na experiencia acumulada
2. Workshop de 2h com representantes de cada area (TI, Manutencao, CMEF, Compras, Arquitetura) para validar e completar a lista
3. Mapear dependencias entre categorias (quais precisam de obra pronta, quais sao independentes)
4. Administrador do Ticket cria o template com campos: categoria, responsavel, data prevista, status, observacoes, link para ticket de compra
5. Teste com Priscila usando dados de uma unidade recente (retroativamente) para validar a estrutura
6. Deploy e treinamento do time (30min)

### Timeline

| Dia | Atividade |
|-----|-----------|
| Dia 1 | Priscila redige lista inicial de categorias e itens |
| Dia 2 | Workshop com areas para validar e completar |
| Dia 3 | Administrador Ticket configura template |
| Dia 4 | Priscila testa com dados de unidade recente |
| Dia 5 | Ajustes e deploy — comunicacao para todas as areas |

### Validacoes Pos-Implementacao

- [ ] Template cobre todas as 13 categorias do escopo
- [ ] Cada categoria tem responsavel de area mapeado
- [ ] Dependencias criticas estao documentadas (ex: CFTV antes de catraca)
- [ ] Priscila consegue criar um projeto de enxoval completo em menos de 15 minutos
- [ ] Fabiane consegue ver o status geral de todas as categorias em uma tela

### KPIs de Acompanhamento

| KPI | Baseline | Meta |
|-----|---------|------|
| Areas com items atrasados no checklist (sem alerta) | Frequente | Zero |
| Tempo para Fabiane ter visibilidade do status de enxoval | Horas/dias | Imediato (Ticket) |
