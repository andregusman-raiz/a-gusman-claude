# SOL-003 — Implementar Inventario Ciclico Mensal com Rotina Fixa

**Processo**: Almoxarifado (estoque, ferramentas, reposicao, inventario)
**Nivel**: N1 — Processo e configuracao de calendario (sem sistema adicional)
**Prioridade**: Quick Win (Fase 1)
**Timeline**: 1 semana para implantar; ciclo 1 na ultima sexta do mes corrente
**Responsavel**: Fabiane + Sephora (+ Pedro Lemos de apoio)
**Resolve**: RC-003 (inventario mensal nao implementado — divergencias acumulam por 6 meses; rateio impreciso)

**ROI estimado**: Detectar divergencias mensalmente (em vez de semestralmente). Rateio baseado em contagem real. Compliance com politica definida.

---

## Descricao

Implantar calendario fixo de inventario ciclico: na ultima sexta de cada mes, Sephora e Pedro Lemos realizam contagem de 1 categoria (rotacao: ferramentas → eletrico → civil → hidraulico → EPI → semestral completo). Resultado registrado em planilha padrao e encaminhado para Fabiane ate o dia seguinte.

**Acoes**:
1. Definir calendario de 12 meses com categorias rotativas (acordo com Fabiane)
2. Criar planilha padrao de inventario: item, codigo TOTVS, quantidade registrada, quantidade contada, divergencia, observacao
3. Inserir compromisso fixo na agenda de Sephora e Pedro Lemos (ultima sexta do mes, 2h dedicadas)
4. Primeiro inventario: realizar contagem geral dos 4 carros (inventario zero — baseline)
5. Criar processo de ajuste: divergencias > 5% reportadas para Fabiane; ajuste no TOTVS ate o 5o dia util do mes seguinte (junto ao rateio)
6. Apos 3 ciclos: revisar se tempo de 2h e suficiente ou precisa de ajuste

**Riscos**:
- Time enxuto pode ter conflito com demandas operacionais na ultima sexta
- Mitigacao: a ultima sexta ja e dia de reposicao quinzenal — aproveitar para inventario da categoria

**Ferramentas**: Planilha padrao (Google Sheets/Excel), TOTVS para ajuste de saldo

---

## Plano de Implementacao

**Nivel**: N1 | **Timeline**: 1 semana + primeiro ciclo no fim do mes | **Resolve**: RC-003

### Responsaveis

- Principal: Fabiane (define e supervisiona)
- Executor: Sephora (executa inventario)
- Apoio: Pedro Lemos (estagiario)
- Aprovador: Coordenadora do almoxarifado

### Pre-requisitos

- Acordo sobre calendario de categorias por mes
- Planilha padrao criada e compartilhada
- Compromisso na agenda de Sephora e Pedro Lemos (ultima sexta do mes, 2h)

### Calendario de Inventario Ciclico (Proposta)

| Mes | Categoria |
|-----|-----------|
| Marco | Ferramentas |
| Abril | Eletrico |
| Maio | Civil |
| Junho | Hidraulico |
| Julho | EPI / EPIs e seguranca |
| Agosto | Estoque volante (carros — 1 carro por mes em rotacao) |
| Setembro | Ferramentas |
| Outubro | Eletrico |
| Novembro | Civil + Hidraulico (pre-recesso) |
| Dezembro/Janeiro | Inventario semestral completo (pos-recesso) |

### Plano de Acao

| Dia | Atividade | Responsavel |
|-----|-----------|-------------|
| Dia 3 | Fabiane e Sephora definem calendario dos 12 meses | Fabiane |
| Dia 3 | Criar planilha padrao de inventario: item, cod. TOTVS, qtd registrada, qtd contada, divergencia, observacao | Sephora |
| Dia 4 | Inserir compromisso fixo na agenda (ultima sexta do mes, 14h-16h) | Fabiane |
| Dia 5 | Realizar inventario zero: contagem baseline de todas as categorias (levantamento inicial) | Sephora + Pedro |
| Dia 7 | Ajustar saldos no TOTVS com base no inventario zero | Sephora + Fabiane |
| Fim do mes | Primeiro ciclo formal: inventario da categoria do mes corrente | Sephora + Pedro |

### Processo de Ajuste Pos-Inventario

1. Divergencia <= 5%: registrar na planilha, nao ajusta o TOTVS neste mes
2. Divergencia > 5%: reportar para Fabiane, ajustar TOTVS ate o 5o dia util do mes seguinte (junto ao rateio)
3. Item com divergencia sistematica (3 meses seguidos): investigar causa raiz especifica

### Validacoes Pos-Implementacao

- [ ] Inventario zero realizado e saldos ajustados no TOTVS
- [ ] Primeiro ciclo mensal concluido no prazo
- [ ] Relatorio enviado para Fabiane no prazo (D+1 apos inventario)
- [ ] Divergencias acima de 5% reportadas e tratadas

### KPIs de Acompanhamento

| KPI | Baseline | Meta 30 dias | Meta 60 dias | Meta 90 dias |
|-----|---------|--------------|--------------|--------------|
| Ciclos de inventario mensal realizados | 0 ciclos/mes | 1/mes | 1/mes | 1/mes (100%) |
| Divergencias detectadas mensalmente | Desconhecido | Baseline estabelecido | Mensurado | Trend de reducao |
