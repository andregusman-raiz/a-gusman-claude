# M-CA-02 — Template Padrao de Calculo A Receber com Formula SAP

**Processo**: cantinas
**Nivel**: N1
**Prioridade**: Quick Win (P1)
**Timeline**: 1 semana
**Responsavel**: Erika (criacao e manutencao) + Daniel (apoio)
**Resolve**: RC-CA-03 (calculo manual sem integracao)

---

## Descricao

**RC Atacada**: RC-CA-03 (calculo manual sem integracao)
**Nivel**: N1 — Processo + template padronizado Google Sheets
**Responsavel**: Erika (criacao e manutencao) + Daniel (apoio)
**Prazo estimado**: 1 semana

**O que fazer**:
Criar template padrao mensal de calculo A Receber com:
- Aba por mes: listagem de todas as cantinas (escola / cantineiro / modelo A Receber)
- Campo: nr de alunos matriculados (preenchido apos acesso ao painel de matriculas — unica etapa manual)
- Campo: valor por aluno (fixo conforme contrato, atualizado apenas na renovacao)
- Campo automatico: total mensal = alunos x valor/aluno

**Aba SAP especifica**:
- Linha 1: valor/aluno (igual ao padrao)
- Linha 2: agua/energia = 2% x [valor base SAP do mes] (inserir valor da conta do mes)
- Linha 3: gas = 100% do consumo do mes (inserir nota do gas)
- Total SAP = soma das tres linhas

**Aba de historico**:
- Registro mensal automatico com data, valores e quem preencheu
- Grafico de tendencia mensal para identificar oscilacoes (especialmente SAP com variacao de gas)

**Resultado esperado**:
- Eliminacao de erros de calculo (formula validada vs. calculo manual)
- Historico mensal auditavel
- Calculo SAP padronizado e transparente

**Priorizacao**:

| Campo | Detalhe |
|-------|---------|
| Impacto | Alto |
| Esforco | Baixo |
| Prioridade | P1 |
| Responsavel | Erika + Daniel |
| Prazo | 1 semana |

---

## Plano de Implementacao

### Contexto do Sprint

**Sprint 1 — Controle Financeiro Imediato** (Marco - Abril 2026)
**Tarefa 1.2** no plano de implementacao

**Responsavel**: Erika (criacao) + Daniel (apoio e validacao)
**Prazo**: Semana de 17/marco/2026
**Dependencias**: Acesso ao painel de matriculas e contratos vigentes de cantinas

### Passos

1. Levantar todos os contratos A Receber ativos: escola / cantineiro / valor por aluno / data de vigencia / clausulas especiais
2. Criar planilha Google Sheets "Calculo Mensal Cantinas A Receber" com abas:
   - Aba "Mes Atual": lista de cantinas + campo alunos (entrada manual) + valor/aluno (fixo do contrato) + total calculado automaticamente
   - Aba "SAP": tres linhas (valor/aluno + 2% agua/energia + 100% gas) com formula de total
   - Aba "Historico": registro de todos os meses anteriores (preencher retroativamente os ultimos 6 meses se possivel)
3. Testar com o calculo do mes de marco: comparar resultado com o calculo atual para validar
4. Daniel revisa e confirma precisao do calculo SAP

**Criterio de conclusao**: Template criado, calculo de marco/2026 validado vs. calculo anterior, formula SAP conferida.

### Estrutura do Template

**Aba "Mes Atual"**:
```
Escola | Cantineiro | Modelo | Nr Alunos | Valor/Aluno | Total Mensal | Data Calculo
```

**Aba "SAP"** (calculo especifico Gastroservice):
```
Linha 1: Valor base por aluno: [valor do contrato]
Linha 2: Agua/Energia: 2% x [valor base SAP do mes]
Linha 3: Gas: 100% do consumo = [inserir valor da nota]
Total SAP = Linha 1 + Linha 2 + Linha 3
```

**Aba "Historico"**:
```
Mes | Escola | Total A Receber | Alunos | Valor/Aluno | Preenchido por | Data
```

### Metrica de Sucesso

| Metrica | Baseline | Meta 3 meses |
|--------|---------|-------------|
| Erros de calculo por mes | Desconhecido (manual) | Zero |
| Historico mensal auditavel | Inexistente | 6+ meses de historico |
