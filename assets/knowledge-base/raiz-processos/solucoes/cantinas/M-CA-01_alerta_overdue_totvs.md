# M-CA-01 — Automacao de Alerta de Overdue de Cantinas via TOTVS

**Processo**: cantinas
**Nivel**: N1
**Prioridade**: Quick Win (P1)
**Timeline**: 2 semanas
**Responsavel**: Erika (Real Estate, execucao) + Sarah/Marissa (suporte contratual)
**Resolve**: RC-CA-01 (overdue em planilha manual)

---

## Descricao

**RC Atacada**: RC-CA-01 (overdue em planilha manual)
**Nivel**: N1 — Configuracao nativa TOTVS RM (modulo Financeiro / Contas a Receber)
**Responsavel**: Erika (Real Estate, execucao) + Sarah/Marissa (suporte contratual)
**Prazo estimado**: 2 semanas

**O que fazer**:
Migrar o controle de overdue de cantinas da planilha ("OVERDUE SUBLOCACAO E CANTINAS") para o TOTVS RM:
1. Cadastrar cada contrato de cantina (modelo A Receber) como cliente/devedor recorrente no TOTVS Contas a Receber
2. Configurar lancamento recorrente mensal com data de vencimento por contrato
3. Ativar alertas automaticos: D+1 para Erika (email), D+5 para Marissa (email), D+10 para Marcelle (copy)
4. O controle passa a ser visual no TOTVS: verde (em dia), amarelo (atraso 1-5 dias), vermelho (atraso >5 dias)

**Acao imediata enquanto configuracao nao concluida**:
Adicionar coluna de status RAG na planilha atual com formula automatica baseada na data de pagamento esperada vs. data atual.

**Resultado esperado**:
- Identificacao de inadimplencia no D+1 (vs. hoje: identificacao na proxima revisao manual, indefinida)
- Reducao de risco sobre os R$92k/mes de receita de cantinas
- Cobranca tempestiva: menos atrito com cantineiro vs. cobranca acumulada tardia

**Priorizacao**:

| Campo | Detalhe |
|-------|---------|
| Impacto | Alto |
| Esforco | Baixo |
| Prioridade | P1 |
| Responsavel | Erika + Marissa |
| Prazo | 2 semanas |

---

## Plano de Implementacao

### Contexto do Sprint

**Sprint 1 — Controle Financeiro Imediato** (Marco - Abril 2026)
**Tarefa 1.3** no plano de implementacao

**Responsavel**: Erika (execucao) + Marissa (validacao parametros)
**Prazo**: Semana de 24/marco/2026
**Dependencias**: TOTVS RM modulo Financeiro / Contas a Receber

### Passos

1. Verificar se contratos de cantinas (modelo A Receber) ja estao no TOTVS Contas a Receber; se nao, cadastrar
2. Parametrizar lancamento recorrente mensal: data de vencimento por contrato (acordar com cada cantineiro se ha data padrao de pagamento)
3. Configurar alertas de inadimplencia:
   - D+1 apos vencimento: alerta para Erika (email automatico do TOTVS)
   - D+5 apos vencimento: alerta para Marissa
   - D+10 apos vencimento: alerta para Marcelle (copy)
4. Manter planilha OVERDUE SUBLOCACAO E CANTINAS durante periodo de transicao (ate TOTVS confirmado funcionando)
5. Adicionar formula RAG na planilha de transicao: Verde (pago), Amarelo (1-5 dias atraso), Vermelho (>5 dias)

**Criterio de conclusao**: TOTVS com lancamentos de cantinas configurados. Alerta de teste recebido por Erika. Planilha com status RAG ativo.

### Metrica de Sucesso

| Metrica | Baseline | Meta 3 meses | Meta 6 meses |
|--------|---------|-------------|-------------|
| Inadimplencia identificada em ate D+1 | Nao (revisao manual indefinida) | Sim (100% contratos) | Sim (100% contratos) |
| Contratos A Receber no TOTVS | 0% | 100% | 100% |

### Dependencias Criticas

| Dependencia | Risco | Mitigacao |
|------------|-------|----------|
| Acesso de Erika ao TOTVS Financeiro/C.Receber | Medio | Verificar permissoes antes de iniciar; se necessario, abrir chamado de acesso |
| Conformidade dos contratos A Receber no TOTVS | Incerto | Erika verifica no inicio da tarefa |
