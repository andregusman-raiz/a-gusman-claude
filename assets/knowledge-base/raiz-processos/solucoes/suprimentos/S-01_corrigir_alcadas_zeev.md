# S-01 — Corrigir Alcadas de Aprovacao no Zeev

**Processo**: Suprimentos (Compras e Cotacao)
**Nivel**: N1 — Configuracao nativa no Zeev BPM
**Prioridade**: Quick Win
**Timeline**: 1-2 dias
**Responsavel**: TI (admin Zeev) + validacao de Fabiane Soares
**Resolve**: CR-01 (alcadas erradas), parte de RC-005 (gargalo aprovacao)

---

## Descricao

**Impacto**: CRITICO | **Esforco**: BAIXO

No editor de workflows do Zeev, adicionar gateway condicional na etapa "Aprovacao":
- Se `valor_pedido < 5000`: saltar etapa de aprovacao (auto-aprovar) e ir direto para "Pedido ao Fornecedor"
- Se `valor_pedido >= 5000 AND valor_pedido <= 10000`: aprovacao pelo Diretor da Unidade ou Coordenacao de Suprimentos
- Se `valor_pedido > 10000`: escalar para CEO (conforme Politica Rev.02 §16.3)

Adicionar notificacao informativa (ciencia, nao aprovacao) para Fabiane em pedidos auto-aprovados.

**ROI estimado**: 60% dos pedidos eliminam etapa de aprovacao. Cycle time cai de 10,7 para estimados 5-6 dias. Fabiane libera 2-3 horas/dia de fila de aprovacao.

**Pre-requisito**: Acesso de administrador ao Zeev (admin panel). Validar com Fabiane a faixa de valores atual da fila dela.

**Rollback**: Reverter gateway condicional no painel admin do Zeev. Tempo: 15 min.

---

## Plano de Implementacao

**Responsavel**: TI (admin Zeev) + validacao de Fabiane Soares
**Prazo**: 2026-03-18 (2 dias uteis)
**Dependencia**: Acesso de admin ao Zeev (confirmar com TI quem tem)

### Passos

1. TI documenta workflow atual de aprovacao no Zeev (screenshot + export — antes de qualquer mudanca)
2. TI adiciona gateway condicional na etapa "Aprovacao":
   - `valor < 5000`: skip aprovacao, ir para "Pedido ao Fornecedor" + notificacao informativa para Fabiane
   - `5000 <= valor <= 10000`: aprovacao Diretor da Unidade ou Coordenacao de Suprimentos
   - `valor > 10000`: escalar para CEO (conforme POL-COMP-001 §16.3)
3. TI testa com 3 pedidos piloto em homologacao (se disponivel) ou em horario de baixo uso
4. Fabiane valida que pedidos abaixo de 5k estao passando sem aprovacao
5. TI ativa em producao + monitora por 48h

### Validacoes de Sucesso

- [ ] Pedido de teste com valor R$ 3.000 aprovado automaticamente sem passar por Fabiane
- [ ] Pedido de teste com valor R$ 7.000 chega para aprovacao do Diretor/Coordenacao
- [ ] Fabiane confirma que nao recebe mais pedidos abaixo de 5k para aprovar

### Rollback

Reverter gateway no painel admin Zeev. Tempo: 15 min.

---

## Impacto Consolidado (apos S-01 + S-02 + S-03)

| Metrica | Antes | Estimado pos-implementacao | Melhoria |
|---------|-------|--------------------------|----------|
| Cycle time medio | 10,7 dias | 5-6 dias | -45% |
| Tempo de aprovacao | 4,3 dias (media) | 0-1 dia | -75% |
| Pedidos sem rastreabilidade | ~30% | < 5% | -83% |
| Tempo Fabiane em triagem | ~3h/dia | ~1h/semana | -90% |
| Conformidade com politica | ~60% | > 95% | +58% |
