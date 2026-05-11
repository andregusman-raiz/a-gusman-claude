# S-05 — Desbloqueio NIMBI: SLA de 5 Dias Uteis para Juridico

**Processo**: Suprimentos (Compras e Cotacao)
**Nivel**: N1 — Gestao de dependencia (sem sistema)
**Prioridade**: Consolidacao
**Timeline**: Desbloqueio em 1 semana; onboarding 2-3 meses apos contrato
**Responsavel**: Marcelle Gaudard (Coordenacao) + Juridico; Michelle Chaves (operacao NIMBI)
**Resolve**: CR-05 (NIMBI bloqueado no Juridico)

---

## Descricao

**Impacto**: ALTO | **Esforco**: MEDIO

Etapa 1 — Desbloqueio imediato:
- Marcelle (Coordenacao) escalona internamente: ticket de contrato NIMBI precisa de resposta do Juridico em 5 dias uteis
- Definir ponto de contato no Juridico com ownership do processo
- Remover clausulas de integracao com Ticket (ja acordado com Sabrina/TI) para reduzir escopo e agilizar analise

Etapa 2 — Apos aprovacao do contrato:
- Iniciar onboarding da NIMBI (estimativa: 2-3 meses para "virada de chave")
- Fase inicial: categorias prioritarias alem das 4 ja cobertas pela BR Supply
- Processo NIMBI funcionara "a parte" do Ticket (sem integracao de sistema por ora)
- Michelle assume operacao do Marketplace NIMBI para curva C e parte da B

Etapa 3 — Consolidacao:
- Reducao de pedidos spot (objetivo: -30% em 6 meses)
- Avaliacao de integracao NIMBI-Ticket em revisao semestral (quando o P1 estiver estavel)

**Cuidado**: A decisao de nao integrar NIMBI com Ticket agora foi pedido da TI (Sabrina). Nao reverter essa decisao sem alinhamento com TI. O processo paralelo e intencional no curto prazo.

---

## Plano de Implementacao

**Responsavel**: Marcelle Gaudard (Coordenacao) — escalona; Juridico — executa
**Prazo**: Resposta do Juridico em ate 5 dias uteis apos escalona (estimado: 2026-03-31)
**Dependencia**: Marcelle deve escalonar formalmente (nao via Ticket aberto sem follow-up)

### Passos

1. Marcelle identifica o responsavel no Juridico pelo ticket de analise contratual NIMBI (ja enviado)
2. Marcelle define SLA: resposta em 5 dias uteis com uma de tres saidas: (a) aprovado, (b) aprovado com ressalvas especificas, (c) rejeitado com motivo
3. Remover das clausulas os itens de integracao com Ticket (ja acordado com Sabrina/TI — isso reduz escopo e agiliza analise juridica)
4. Apos aprovacao: Marcelle e Fabiane iniciam onboarding NIMBI (2-3 meses estimados)
5. Michelle assume operacao do Marketplace NIMBI como responsavel (compras spot curva C)

### Timeline Pos-Aprovacao

- Mes 1 de onboarding: cadastro de categorias prioritarias (alem das 4 da BR Supply)
- Mes 2: primeiros pedidos via NIMBI; Fabiane acompanha Michelle
- Mes 3: operacao independente; medir reducao de pedidos spot

### Validacoes de Sucesso

- [ ] Contrato NIMBI aprovado pelo Juridico ate 2026-03-31
- [ ] Onboarding iniciado ate 2026-04-07
- [ ] Primeiros 10 pedidos via NIMBI ate 2026-05-15

### Responsaveis

| Acao | Responsavel Principal | Executores | Aprovador |
|------|----------------------|-----------|-----------|
| Escalona Juridico | Marcelle Gaudard | Juridico | Marcelle Gaudard |
| Onboarding NIMBI | Marcelle + Fabiane | Michelle Chaves | Marcelle Gaudard |

### Dependencias e Riscos

| Dependencia Critica | Risco | Mitigacao |
|---------------------|-------|-----------|
| Resposta do Juridico | Juridico atrasado sem SLA | Marcelle escalona com deadline formal |
