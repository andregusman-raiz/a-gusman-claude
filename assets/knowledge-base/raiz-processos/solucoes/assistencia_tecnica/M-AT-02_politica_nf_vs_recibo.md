# M-AT-02 — Politica de NF vs. Recibo com Limite de Valor

**Processo**: assistencia_tecnica
**Nivel**: N1
**Prioridade**: Quick Win (P1)
**Timeline**: 2 semanas
**Responsavel**: Marissa Mello (definicao) + Financeiro (validacao fiscal) + Sarah (comunicacao a prestadores)
**Resolve**: RC-AT-02 (AT sem NF, so recibo, risco fiscal)

---

## Descricao

**RC Atacada**: RC-AT-02 (AT sem NF, so recibo, risco fiscal)
**Nivel**: N1 — Politica interna + processo de lancamento no TOTVS
**Responsavel**: Marissa Mello (definicao) + Financeiro (validacao fiscal) + Sarah (comunicacao a prestadores)
**Prazo estimado**: 2 semanas

**O que fazer**:
Definir e publicar politica clara de documentacao fiscal para servicos de AT:

**Regras propostas**:
- Ate R$300: aceita recibo (campos obrigatorios: CNPJ ou CPF, descricao do servico, valor e data)
- De R$301 a R$2.000: NF obrigatoria; se prestador nao emite NF, Sarah aprova excecao documentada + justificativa formal
- Acima de R$2.000: NF obrigatoria sem excecao; se prestador nao emite, buscar outro prestador

**Processo de lancamento no TOTVS por tipo**:
- Recibo (ate R$300): lancado em "despesa operacional menor" com documento digitalizado em anexo
- Recibo com excecao aprovada: lancamento especial com aprovacao de Marissa como campo obrigatorio
- NF: processo padrao de lancamento (ja existente)

**Comunicacao a prestadores**:
Sarah informa a prestadores homologados (atuais e novos de JF) que o requisito de NF e condicao para permanencia no cadastro. Para o patamar ate R$300, recibo e aceito como excecao operacional.

**Resultado esperado**:
- Reducao do risco fiscal em AT (servicos com NF aumentam de estimativa de 20% para 80%)
- Processo de lancamento claro para o Financeiro (elimina workaround atual de "lancamento manual como outros")
- Linha de corte documentada como politica formal

**Priorizacao**:

| Campo | Detalhe |
|-------|---------|
| Impacto | Alto |
| Esforco | Baixo |
| Prioridade | P1 |
| Responsavel | Marissa + Financeiro + Sarah |
| Prazo | 2 semanas |

---

## Plano de Implementacao

### Contexto do Sprint

**Sprint 1 — Emergencias de Controle e Compliance** (Marco - Abril 2026)
**Tarefa 1.3** no plano de implementacao

**Responsavel**: Marissa Mello (definicao) + Financeiro (validacao fiscal)
**Prazo**: Semana de 24/marco/2026
**Dependencias**: Validacao pelo Financeiro (reuniao de 30 minutos suficiente)

### Passos

1. Marissa redige politica interna de 1 pagina: "Documentacao Fiscal em Assistencia Tecnica":
   - Ate R$300: aceita recibo (CNPJ ou CPF, descricao, valor, data)
   - R$301 a R$2.000: NF obrigatoria; excecao aprovada por Sarah com justificativa documentada
   - Acima de R$2.000: NF obrigatoria sem excecao

2. Reuniao de 30 minutos com Financeiro para validar do ponto de vista fiscal (confirmar que recibo ate R$300 e aceito para lancamento)

3. Definir com Financeiro o codigo de lancamento no TOTVS para cada situacao:
   - Recibo normal: codigo de lancamento [X]
   - Recibo com excecao: codigo [Y] + aprovacao Marissa em campo
   - NF: codigo padrao ja existente

4. Sarah comunica a politica a todos os prestadores de AT ativos no cadastro (email)

5. Adicionar campo no formulario Zeev de chamado AT: "Prestador emite NF? Sim / Nao / Apenas recibo"

**Criterio de conclusao**: Politica aprovada por Financeiro. Lancamentos no TOTVS definidos. Comunicado enviado a prestadores ativos.

### Tabela de Regras de Documentacao Fiscal

| Faixa de Valor | Documento aceito | Processo TOTVS | Aprovacao necessaria |
|---------------|------------------|---------------|---------------------|
| Ate R$300 | Recibo (com CNPJ/CPF + descricao + valor + data) | Despesa operacional menor | Nenhuma (lancamento direto) |
| R$301 a R$2.000 | NF obrigatoria | Processo padrao | Sarah (excecao documentada se sem NF) |
| Acima de R$2.000 | NF obrigatoria sem excecao | Processo padrao | N/A (sem excecao possivel) |

### Metrica de Sucesso

| Metrica | Baseline | Meta 1 mes | Meta 3 meses |
|--------|---------|-----------|-------------|
| Servicos AT com NF | <20% (estimado) | 50% | 80% |
| Lancamentos AT sem codigo definido | Recorrente | Zero | Zero |

### Dependencias Criticas

| Dependencia | Risco | Mitigacao |
|------------|-------|----------|
| Validacao fiscal da politica de recibo pelo Financeiro | Baixo | Reuniao de 30 min suficiente |
| Encontrar prestadores qualificados em JF que emitam NF | Alto | Busca ampla (10 opcoes) para ter margem de selecao; aceitar MEI como alternativa valida |
