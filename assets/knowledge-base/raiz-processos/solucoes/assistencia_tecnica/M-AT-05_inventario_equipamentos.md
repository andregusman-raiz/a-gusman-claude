# M-AT-05 — Inventario de Equipamentos por Unidade para Manutencao Preventiva

**Processo**: assistencia_tecnica
**Nivel**: N1 (planilha inicial) -> N2 (integracao TOTVS Patrimonio)
**Prioridade**: Consolidacao (P3)
**Timeline**: 45-60 dias para levantamento inicial
**Responsavel**: Mariana Santos (Suprimentos/Manutencao, lead) + Erika (Real Estate, validacao por unidade)
**Resolve**: RC-AT-05 (sem inventario, manutencao 100% corretiva)

---

## Descricao

**RC Atacada**: RC-AT-05 (sem inventario, manutencao 100% corretiva)
**Nivel**: N1 (planilha inicial) → N2 (integracao TOTVS Patrimonio)
**Responsavel**: Mariana Santos (Suprimentos/Manutencao, lead) + Erika (Real Estate, validacao por unidade)
**Prazo estimado**: 45-60 dias para levantamento inicial

**O que fazer**:

**Fase 1 — Levantamento (45 dias)**:
Solicitar a cada responsavel de unidade que preencha formulario Google Forms de inventario de equipamentos:
- Tipo (geladeira, micro-ondas, lava-jato, forno, balcao termico, outros)
- Marca / Modelo / Nr de serie (se disponivel; estimativa se nao)
- Ano de aquisicao (estimado se necessario)
- Condicao atual: Bom / Desgastado / Problema recorrente
- Historico de consertos (descrever informalmente)

**Fase 2 — Cadastro centralizado (Google Sheets)**:
- Uma linha por equipamento por unidade
- Colunas: Unidade | Tipo | Marca | Modelo | Ano | Condicao | Ultimo conserto | Custo | Prestador | Recomendacao (preventiva / troca)

**Fase 3 — Manutencao preventiva (futuro, pos-inventario)**:
- Com inventario disponivel: contratar visita preventiva anual para geladeiras com mais de 5 anos (maior risco de falha)
- Parametro de substituicao: mais de 3 consertos em 24 meses = recomendacao de troca (custo de manutencao recorrente supera depreciacao de equipamento novo)

**Resultado esperado**:
- Visibilidade completa do parque de equipamentos (hoje inexistente)
- Decisoes de comprar vs. consertar baseadas em dados objetivos
- Reducao estimada de 20-30% no custo de AT corretiva com introducao de manutencao preventiva

**Priorizacao**:

| Campo | Detalhe |
|-------|---------|
| Impacto | Medio |
| Esforco | Medio |
| Prioridade | P3 |
| Responsavel | Mariana + Erika |
| Prazo | 60 dias (ate 30/setembro/2026) |

---

## Plano de Implementacao

### Contexto do Sprint

**Sprint 3 — Visibilidade e Preventiva** (Julho - Setembro 2026)
**Tarefa 3.1** no plano de implementacao

**Responsavel**: Mariana Santos (Suprimentos/Manutencao) + Erika (Real Estate, validacao)
**Prazo**: 30/setembro/2026
**Dependencias**: Nenhuma (trabalho independente)

### Passos

1. **Julho**: Mariana cria formulario Google Forms "Inventario de Equipamentos da Unidade":
   - Campos: Unidade / Tipo de Equipamento / Marca / Modelo / Nr Serie (se disponivel) / Ano aproximado / Condicao (Bom/Desgastado/Com problema) / Historico de consertos (texto livre) / Frequencia de falhas

2. **Julho**: Mariana envia formulario para responsaveis de todas as unidades com prazo de 20 dias

3. **Agosto**: Mariana consolida as respostas em planilha "Inventario de Equipamentos" com uma linha por equipamento

4. **Agosto**: Para equipamentos marcados como "Com problema" ou "Desgastado", Mariana avalia: consertar ou substituir? (criterio: mais de 3 consertos em 24 meses = recomendacao de troca)

5. **Setembro**: Erika revisa o inventario junto com Mariana por unidade

6. **Setembro**: Identificar os 5-10 equipamentos mais criticos que devem ter manutencao preventiva anual programada

**Criterio de conclusao**: Inventario completo de pelo menos 80% das unidades. Planilha consolidada com recomendacoes por equipamento.

### Piloto de Manutencao Preventiva (pos-inventario)

Selecionar 2-3 unidades para piloto de visita preventiva anual de geladeiras com mais de 5 anos.
Contratar com um dos prestadores homologados (M-AT-04).
Avaliar custo/beneficio antes de expandir para todas as unidades.

### Estrutura da Planilha de Inventario

```
Colunas:
Unidade | Tipo | Marca | Modelo | Nr Serie | Ano | Condicao | Ultimo conserto | Custo ultimo conserto | Prestador | Nr consertos (24 meses) | Recomendacao
```

**Criterio de recomendacao**:
- 0-1 consertos em 24 meses + condicao Bom: Manutencao preventiva anual
- 2 consertos em 24 meses + condicao Desgastado: Avaliar troca no proximo orcamento
- 3+ consertos em 24 meses: Recomendacao de troca imediata

### Metrica de Sucesso

| Metrica | Baseline | Meta 3 meses | Meta 6 meses |
|--------|---------|-------------|-------------|
| Equipamentos com inventario | Zero | Zero (levantamento em andamento) | 80% das unidades |
| Decisoes de compra vs. conserto baseadas em dados | Inexistente | Baseline disponivel | Sim (criterio aplicado) |
| Reducao estimada AT corretiva (com preventiva) | — | — | 20-30% (piloto) |

### Dependencias Criticas

| Dependencia | Risco | Mitigacao |
|------------|-------|----------|
| Engajamento dos responsaveis de unidade para preencher formulario | Medio | Formulario simples (menos de 5 min por equipamento) + prazo claro de 20 dias |
| Prestadores homologados disponiveis para preventiva (M-AT-04) | Medio | Piloto so ocorre apos homologacao de JF (Sprint 2) |
