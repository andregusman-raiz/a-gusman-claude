# S-07 — Prompt IA Multi-Itens: Continuar Projeto P1

**Processo**: Suprimentos (Compras e Cotacao)
**Nivel**: N2 — Evolucao de integracao existente (BI + TI)
**Prioridade**: Estrategico / Transformacao
**Timeline**: 4-8 semanas apos retomada (estimado: 2026-05-01 a 2026-06-27)
**Responsavel**: BI + Michelle Chaves (maior usuaria) + Fabiane Soares (validacao)
**Resolve**: CR-04 (IA limitada a 1 item)

---

## Descricao

**Impacto**: ALTO | **Esforco**: ALTO

O Projeto P1 entregou o painel de fornecedor e a integracao basica. A parte de IA multi-itens nao foi concluida por limitacao tecnica de prompt. Retomada:

**Abordagem 1 — Prompt em lote (mais rapido)**:
- BI testa prompt que recebe lista de itens e retorna lista de precos
- Formato: JSON com array de itens e quantidades
- Modelo: GPT-4o ou Claude Sonnet (avaliar custo/qualidade)

**Abordagem 2 — Cotacao assistida com IA por categoria (intermediario)**:
- IA agrupa itens por categoria (ex.: limpeza, escritorio)
- Para cada categoria, busca preco unitario de referencia
- Michelle valida e finaliza pedido no e-commerce

**Quem define**: BI (responsavel pelo P1) com input de Michelle (maior usuario da funcionalidade). Fabiane valida expectativa de resultado.

**Cuidado**: Nao bloquear este projeto esperando a solucao perfeita. Se abordagem 1 resolver 70% dos pedidos, ja e ganho real. Lancar iterativamente.

**Criterio de sucesso iterativo**: nao esperar solucao perfeita. Se IA resolve 70% dos pedidos multi-itens da curva C, Michelle ganha ~3h/dia para outras atividades.

---

## Plano de Implementacao

**Responsavel**: BI + Michelle Chaves (maior usuaria) + Fabiane (validacao)
**Prazo**: 6-8 semanas apos retomada (estimado: 2026-05-01 a 2026-06-27)
**Dependencia**: BI retoma P1; Michelle disponibiliza tempo para testes

### Passos

1. BI e Michelle mapeiam os tipos de pedido mais frequentes (categorias e volumes tipicos)
2. BI testa abordagem de prompt em lote:
   - Entrada: JSON com lista de itens e quantidades
   - Saida: lista de precos de referencia por fornecedor
3. Michelle testa com 10 pedidos reais (nao urgentes) — mede tempo de cotacao manual vs. IA
4. Se abordagem 1 resolver 70%+ dos casos: ativar em producao para pedidos curva C
5. BI documenta limitacoes: quais categorias a IA nao cobre bem (ex.: servicos com visita tecnica)
6. Revisao com Fabiane: expectativa de resultado vs. realidade

### Validacoes de Sucesso

- [ ] IA gera cotacao completa para pedido com 10+ itens em < 2 min (vs. 20-30 min manual)
- [ ] Acuracia de preco: dentro de 15% do melhor preco encontrado por pesquisa manual
- [ ] Michelle relata reducao de tempo de cotacao em > 50% para pedidos curva C

### Responsaveis

| Papel | Pessoa |
|-------|--------|
| Responsavel principal | BI |
| Executores | BI + Michelle Chaves |
| Aprovador | Fabiane Soares |

### Dependencias e Riscos

| Dependencia Critica | Risco | Mitigacao |
|---------------------|-------|-----------|
| BI retoma P1 | Solucao tecnica nao encontrada | Iterar com abordagem por categoria se lote falhar |
