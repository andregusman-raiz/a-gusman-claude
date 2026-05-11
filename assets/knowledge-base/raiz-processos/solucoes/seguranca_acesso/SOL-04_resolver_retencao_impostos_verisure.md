# SOL-04 — Resolver Retencao de Impostos Verisure

**Processo**: Seguranca e Acesso (CFTV, Alarmes, Catracas)
**Nivel**: N1 — Renegociacao contratual e/ou processo financeiro; config TOTVS (N1)
**Prioridade**: Quick Win / Acao Imediata (Fase 1)
**Timeline**: 2-3 semanas
**Responsavel**: Gestao de Utilidades (principal) + Financeiro + Contabilidade; executor TOTVS: TI
**Resolve**: CR-04 (impostos nao retidos), CR-05 (pagamento sem baixa automatica)

---

## Descricao

Duas abordagens em paralelo:
(a) Incluir clausula de retencao no proximo aditivo contratual com Verisure
(b) Implementar processo compensatorio no financeiro para reter e recolher os impostos que o fornecedor nao retém

**Acoes**:
1. Levantar com financeiro o passivo atual de impostos nao retidos (quanto, desde quando)
2. Consultar contabilidade sobre o processo correto de compensacao retroativa
3. Contatar Verisure para incluir retencao no contrato (aditivo ou nova clausula)
4. Se Verisure nao aceitar clausula → implementar processo interno de retencao pelo financeiro
5. Para pagamentos futuros: configurar no TOTVS alerta de retencao obrigatoria para CNPJ Verisure
6. Resolver CR-05 em paralelo: exigir PIX com chave rastreavel ou boleto como forma de pagamento

**Nivel TOTVS**: Verificar se TOTVS RM suporta configuracao de retencao automatica por fornecedor (N1 de config)

---

## Plano de Implementacao

**Nivel**: N1 (processo + TOTVS config) | **Timeline**: 2-3 semanas | **Resolve**: CR-04, CR-05

### Pre-requisitos

- Acesso ao financeiro para levantamento de passivo
- Consulta contabilidade sobre processo de retencao/compensacao

### Responsaveis

- Principal: Gestao de Utilidades
- Apoio: Financeiro + Contabilidade
- Executor TOTVS: TI (se necessario config no sistema)

### Plano de Acao

| Semana | Atividade |
|--------|-----------|
| Semana 1, Dia 1-3 | Financeiro levanta passivo: quanto nao foi retido, desde quando, quais impostos (ISS, PIS, COFINS, CSLL) |
| Semana 1, Dia 4-5 | Contabilidade define caminho: compensacao retroativa ou ajuste nas proximas NFs |
| Semana 2, Dia 1-3 | Contatar Verisure: solicitar inclusao de clausula de retencao no proximo aditivo |
| Semana 2, Dia 4-5 | Se Verisure aceitar: encaminhar para juridico redigir aditivo |
| Semana 2, Dia 4-5 | Se Verisure nao aceitar: implementar processo interno de retencao pelo financeiro |
| Semana 3 | Implementar no TOTVS: alerta de retencao obrigatoria para CNPJ da Verisure |

### Para CR-05 (Pagamento sem Baixa)

- Semana 2: solicitar Verisure PIX com chave rastreavel ou boleto bancario
- Semana 3: configurar no TOTVS a conciliacao para a nova forma de pagamento

### Validacoes de Sucesso

- [ ] Passivo fiscal levantado e reportado para contabilidade
- [ ] Proximo pagamento com retencao executada
- [ ] TOTVS com alerta de retencao configurado para CNPJ Verisure
- [ ] Pagamento Verisure via boleto ou PIX rastreavel

### KPIs de Acompanhamento

| KPI | Baseline | Meta Fase 1 | Meta Fase 2 |
|-----|---------|------------|------------|
| Impostos retidos Verisure | 0% retencao | Em regularizacao | 100% retencao |
