# S-04 — Validacao Obrigatoria de 3 Cotacoes no Zeev (>R$5k)

**Processo**: Suprimentos (Compras e Cotacao)
**Nivel**: N1 — Configuracao nativa no Zeev BPM
**Prioridade**: Quick Win
**Timeline**: 1 dia
**Responsavel**: TI (admin Zeev) + Fabiane (validar regra); validacao de excecoes: Raquel Pereira
**Resolve**: RC-006 (falta de controle sobre cotacoes — conformidade POL-COMP-001 §3.2)

---

## Descricao

**Impacto**: MEDIO | **Esforco**: BAIXO

No formulario da etapa "Cotacao" no Zeev:
- Adicionar campo "Anexar cotacoes" (upload multiplo) obrigatorio para valores > R$ 5.000
- Configurar regra: se `valor > 5000 AND qtd_anexos < 3`: bloquear avanco para aprovacao com mensagem "Politica exige minimo 3 cotacoes. Anexe os documentos ou justifique."
- Campo de justificativa opcional (para emergencias com 1-2 cotacoes): texto obrigatorio + flag "compra emergencial" que alerta o aprovador

**ROI estimado**: Compliance 100% com POL-COMP-001 §3.2. Reducao de risco de sobrepreco em pedidos acima de R$ 5k.

---

## Plano de Implementacao

**Responsavel**: TI (admin Zeev) + Fabiane (validar regra)
**Prazo**: 2026-03-20 (mesma janela que S-02)
**Dependencia**: Acesso admin Zeev (mesma sessao de config que S-01)

### Passos

1. TI adiciona campo "Anexar cotacoes" (upload multiplo) na etapa "Cotacao" do workflow Zeev
2. Configurar regra: `valor > 5000 AND qtd_anexos < 3` → bloquear avanco com mensagem: "Politica POL-COMP-001 §3.2 exige minimo 3 cotacoes para valores acima de R$ 5.000. Anexe os documentos."
3. Campo de justificativa para excecoes: texto livre obrigatorio + flag "compra emergencial" visivel para o aprovador
4. Raquel Pereira (responsavel por Servicos, alto conhecimento tecnico, bons saves) valida que a regra nao bloqueia cotacoes de servicos com visita tecnica (SLA diferente — pode ter 1-2 cotacoes iniciais antes da visita)

### Validacoes de Sucesso

- [ ] Pedido de teste com 2 cotacoes e valor R$ 8.000 e bloqueado
- [ ] Pedido de teste com 3 cotacoes e valor R$ 8.000 avanca normalmente
- [ ] Raquel confirma que cotacoes de servicos com visita tecnica nao sao bloqueadas indevidamente

### Responsaveis

| Papel | Pessoa |
|-------|--------|
| Responsavel principal | TI |
| Executor | TI |
| Aprovador | Raquel Pereira (validacao de excecao de servicos) |
