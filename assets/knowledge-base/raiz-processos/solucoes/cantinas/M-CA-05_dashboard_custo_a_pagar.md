# M-CA-05 — Dashboard de Custo A Pagar por Aluno por Contrato

**Processo**: cantinas
**Nivel**: N2
**Prioridade**: Consolidacao (P2)
**Timeline**: 30 dias (pronto para abril/2026)
**Responsavel**: Erika + Financeiro (dado de custo) + time BI (se necessario)
**Resolve**: RC-CA-05 (sem visibilidade de custo/aluno no modelo A Pagar)

---

## Descricao

**RC Atacada**: RC-CA-05 (sem visibilidade de custo/aluno no modelo A Pagar)
**Nivel**: N2 — Relatorio TOTVS + planilha consolidada
**Responsavel**: Erika + Financeiro (dado de custo mensal) + time BI (se necessario)
**Prazo estimado**: 30 dias

**O que fazer**:
Criar visao consolidada mensal de custo A Pagar:
- Custo total mensal por contrato: Gastroservice/SAP, Malagueta/Leonardo, Alimentar/Sapereira, Sodexo/Cubo e Global Tree Barra Golfe
- Nr de alunos por unidade (dado do painel de matriculas, ja usado no M-CA-02)
- Custo por aluno/mes calculado automaticamente
- Comparativo vs. repasse previsto na mensalidade (dado do Comercial, obtido na interface de maio M-CA-03)
- Saldo: positivo = margem; negativo = escola subsidiando acima do previsto

**Aba SAP**: tres linhas separadas (custo/aluno + agua/energia + gas mensal) com historico de variacao para identificar meses de pico de gas.

**Atualizacao**: mensal, ate o dia 10 (apos fechamento do mes anterior)
**Revisao**: Erika + Marcelle trimestralmente

**Resultado esperado**:
- Visibilidade de margem por unidade no modelo A Pagar (hoje inexistente)
- Identificacao imediata de contratos deficitarios antes do fechamento anual
- Base quantitativa para a interface com Comercial em maio

**Priorizacao**:

| Campo | Detalhe |
|-------|---------|
| Impacto | Alto |
| Esforco | Medio |
| Prioridade | P2 |
| Responsavel | Erika + Financeiro |
| Prazo | 30 dias (pronto para abr/2026) |

---

## Plano de Implementacao

### Contexto do Sprint

**Sprint 2 — Visibilidade Financeira do Modelo A Pagar** (Abril - Maio 2026)
**Tarefa 2.1** no plano de implementacao

**Responsavel**: Erika + Financeiro (dado de custo mensal)
**Prazo**: 30 de abril/2026
**Dependencias**: Dados de custo mensal dos 4 contratos A Pagar do Financeiro

### Passos

1. **Semana 1 (marco)**: Erika solicita ao Financeiro historico dos ultimos 12 meses de custo por contrato A Pagar:
   - SAP — Gastroservice (incluindo detalhamento agua/energia e gas separados)
   - Colegio Leonardo da Vinci — Malagueta
   - Sapereira — Alimentar
   - Cubo e Global Tree Barra Golfe — Sodexo

2. **Semana 2**: Erika cria planilha "Dashboard Cantinas A Pagar" com:
   - Custo total mensal por contrato (12 meses de historico)
   - Nr de alunos por unidade (do painel de matriculas)
   - Custo por aluno/mes = custo total / nr alunos
   - Campo de repasse previsto na mensalidade (dado a obter do Comercial em abril)
   - Saldo = repasse - custo (positivo = margem; negativo = prejuizo)

3. **Semana 3**: Erika + Marcelle revisam o dashboard e identificam contratos deficitarios

4. **Semana 4**: Dashboard disponivel para a interface com Comercial em maio

**Criterio de conclusao**: Dashboard com dados de 12 meses historicos para os 4 contratos. Saldo (margem/prejuizo) calculado para cada unidade. Pronto para abril.

### Estrutura do Dashboard

```
Contratos A Pagar:
- SAP / Gastroservice
  - Custo total mensal
  - Aba SAP: Linha 1 = custo/aluno | Linha 2 = agua/energia | Linha 3 = gas mensal
  - Nr alunos
  - Custo/aluno/mes
  - Repasse previsto
  - Saldo (margem/prejuizo)

- Colegio Leonardo da Vinci / Malagueta
  [mesma estrutura]

- Sapereira / Alimentar
  [mesma estrutura]

- Cubo e Global Tree Barra Golfe / Sodexo
  [mesma estrutura]
```

**Atualizacao**: mensal, ate dia 10 do mes seguinte
**Revisao**: Erika + Marcelle, trimestral

### Metrica de Sucesso

| Metrica | Baseline | Meta 3 meses |
|--------|---------|-------------|
| Margem por contrato A Pagar calculada | Nao (inexistente) | Sim (historico 12 meses) |
| Visibilidade mensal de saldo | Nao | Sim (atualizado ate dia 10) |
| Base quantitativa para interface Comercial | Nao | Sim (disponivel em abril) |

### Dependencias Criticas

| Dependencia | Risco | Mitigacao |
|------------|-------|----------|
| Disponibilidade do Financeiro para dados historicos A Pagar | Baixo | Solicitar com 2 semanas de antecedencia |
| Dado de repasse previsto na mensalidade (Comercial) | Medio | Obter na interface de maio (M-CA-03) |
