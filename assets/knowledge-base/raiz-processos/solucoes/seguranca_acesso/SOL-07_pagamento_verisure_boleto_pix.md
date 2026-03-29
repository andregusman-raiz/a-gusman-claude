# SOL-07 — Resolver Pagamento Verisure (Boleto ou PIX Rastreavel)

**Processo**: Seguranca e Acesso (CFTV, Alarmes, Catracas)
**Nivel**: N1 — Renegociacao contratual
**Prioridade**: Consolidacao (Fase 2)
**Timeline**: 2-3 semanas
**Responsavel**: Gestao de Utilidades + Financeiro + TI (config TOTVS)
**Resolve**: CR-05 (deposito bancario sem baixa automatica no TOTVS)

---

## Descricao

Exigir da Verisure forma de pagamento compativel com o fluxo do TOTVS (boleto bancario ou PIX com chave rastreavel). Eliminar deposito bancario sem baixa automatica.

**Acoes**:
1. Verificar se TOTVS RM suporta conciliacao automatica via boleto (N1 config TOTVS)
2. Solicitar formalmente a Verisure mudanca para boleto ou PIX rastreavel
3. Incluir no proximo aditivo contratual clausula de forma de pagamento
4. Configurar no TOTVS o fornecedor Verisure para conciliacao automatica

**Nota**: Esta solucao complementa SOL-04 — ambas tratam da relacao financeira com Verisure. SOL-04 foca na retencao de impostos; SOL-07 foca na forma de pagamento e conciliacao automatica.

---

## Plano de Implementacao

**Nivel**: N1 | **Timeline**: 2-3 semanas

### Responsaveis

- Principal: Gestao de Utilidades
- Apoio: Financeiro + TI (config TOTVS)

### Passos

1. Verificar se TOTVS RM suporta conciliacao automatica via boleto (N1 config TOTVS)
2. Solicitar formalmente a Verisure mudanca para boleto ou PIX rastreavel
3. Incluir no proximo aditivo contratual clausula de forma de pagamento
4. Configurar no TOTVS o fornecedor Verisure para conciliacao automatica
