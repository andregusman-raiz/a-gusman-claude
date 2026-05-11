# SOL-04 — Rastreabilidade de Insumos Proprias no TOTVS

**Processo**: Gestao de Impressoras (Locadas e Proprias) — Raiz Educacao
**Nivel**: N1 (configuracao nativa TOTVS)
**Prioridade**: Quick Win
**Timeline**: 1-2 semanas (config + treinamento) | Prazo: 30/abr/2026
**Responsavel**: Samara (pedidos) + TI TOTVS (config de campos)
**Resolve**: CR-03 (custo de insumos proprias sem rastreio)

---

## Descricao

Adicionar campo obrigatorio "Escola/Equipamento" no pedido de insumos de impressora no TOTVS. Ao fechar o pedido, vincular ao equipamento cadastrado. Criar relatorio mensal de consumo por escola/equipamento.

**Posicao na Matriz Impacto x Esforco**: Esforco BAIXO / Impacto ALTO — Quick Win

### ROI / Impacto Esperado

| Solucao | Causa Raiz Resolvida | Impacto Esperado | Prazo |
|---------|---------------------|-----------------|-------|
| SOL-04 (Insumos TOTVS) | CR-03 | Custo real proprias rastreado | Abr/2026 |

---

## Plano de Implementacao

### Pre-requisitos

- Acesso de administrador ao TOTVS RM (modulo Compras)
- Lista de modelos de impressoras proprias por escola e regiao
- Politica de Compras POL-COMP-001 disponivel (para alinhar com processo existente)

### Plano Detalhado

| Dia | Atividade | Responsavel |
|-----|-----------|-------------|
| Dia 1-2 | Verificar no TOTVS RM: possibilidade de campo customizado na ordem de compra para categoria "Insumos Impressora" | TI TOTVS |
| Dia 3 | Criar campos obrigatorios: "Escola" (lista de selecao) e "Equipamento/Modelo" (lista ou texto) | TI TOTVS |
| Dia 3-4 | Treinar Samara e equipe de Compras no novo preenchimento (maximo 30 min) | Samara + TI TOTVS |
| Dia 5 | Go-live: primeiros pedidos com campos preenchidos | Samara |
| Semana 3-4 | Criar relatorio TOTVS: consumo de insumos por escola/mes | TI TOTVS + Maressa |

Passos adicionais (S_melhorias):
1. Verificar se TOTVS permite campo customizado na ordem de compra (sim — RM Compras)
2. Adicionar campo "Escola" e campo "Equipamento/Modelo" como obrigatorios para categoria "Insumos Impressora"
3. Treinar Samara e equipe de Compras no novo fluxo (30 min)
4. Criar relatorio TOTVS: consumo de insumos por escola/mes
5. Revisar com Maressa apos primeiro mes para calibrar

### Checklist de Validacao Pos-Go-Live

- [ ] Campos "Escola" e "Equipamento/Modelo" obrigatorios para categoria insumos impressora
- [ ] Samara consegue preencher sem dificuldade (testar com 3 pedidos reais)
- [ ] Relatorio mensal de consumo por escola disponivel no TOTVS
- [ ] Historico de consumo dos ultimos pedidos retroativamente identificado (se possivel)

### Plano de Rollback

Tornar campos opcionais (nao excluir) se gerar atrito excessivo no processo. Retomar como obrigatorio apos treinamento adicional.

---

## Metricas de Sucesso

- 100% dos pedidos de insumo com escola/equipamento preenchido (apos 30 dias do go-live)
- Relatorio mensal de custo de insumos por escola disponivel

---

## Dependencias Entre Solucoes

```
SOL-04 e SOL-05 sao independentes — podem ser executados em paralelo.
```

---

## Contexto no Roadmap

**Imediato — Abril/2026 (Semanas 1-3)**

```
Abr/2026
SOL-04 >>>
```
