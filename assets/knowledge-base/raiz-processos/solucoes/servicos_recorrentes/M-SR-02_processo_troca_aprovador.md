# M-SR-02 — Processo Formal de Atualizacao de Aprovador na Troca de Responsavel

**Processo**: servicos_recorrentes
**Nivel**: N1
**Prioridade**: Quick Win (P1)
**Timeline**: 1 semana (processo) + 2 semanas (configuracao Zeev)
**Responsavel**: Raquel Pereira (Suprimentos) + RH/DP (trigger de notificacao)
**Resolve**: RC-SR-01 (troca de responsavel manual)

---

## Descricao

**RC Atacada**: RC-SR-01 (troca de responsavel manual)
**Nivel**: N1 — Processo + configuracao Zeev
**Responsavel**: Raquel Pereira (Suprimentos) + RH/DP (trigger de notificacao)
**Prazo estimado**: 1 semana (processo) + 2 semanas (configuracao Zeev)

**O que fazer**:
Criar checklist obrigatorio no processo de offboarding/troca de cargo de responsavel de unidade:
1. RH/DP notifica Suprimentos (Raquel Pereira) via email padrao no dia da mudanca
2. Raquel atualiza o aprovador no fluxo Zeev da unidade afetada em ate 24h
3. Confirma para o novo responsavel que esta ativo e instruido no sistema

**Template de email RH -> Suprimentos**:
"Mudanca de responsavel de unidade: Unidade [X], saindo [Nome], entrando [Nome], data de inicio [D]. Favor atualizar aprovador no sistema de pedidos."

**Contingencia**: enquanto novo responsavel nao e ativado (primeiros dias), pedidos da unidade sobem para o aprovador do nivel acima (supervisor de unidade ou Fabiane Soares).

**Resultado esperado**:
- Zero pedidos parados por aprovador desatualizado
- SLA de atualizacao: 24h apos notificacao do RH

**Priorizacao**:

| Campo | Detalhe |
|-------|---------|
| Impacto | Alto |
| Esforco | Baixo |
| Prioridade | P1 |
| Responsavel | Raquel + RH/DP |
| Prazo | 3 semanas |

---

## Plano de Implementacao

### Contexto do Sprint

**Sprint 1 — Wins Rapidos** (Marco - Abril 2026)
**Tarefa 1.3** no plano de implementacao

**Responsavel**: Raquel Pereira (processo) + RH/DP (trigger)
**Prazo**: Semana de 31/marco/2026
**Dependencias**: Nenhuma

### Passos

1. Raquel documenta o processo atual de atualizacao de aprovador no Zeev (quais campos, onde clicar)
2. Criar template de email padrao para RH/DP enviar a Suprimentos quando houver mudanca de responsavel de unidade:
   - Assunto: [SUPRIMENTOS] Mudanca de responsavel — Unidade [X]
   - Corpo: Unidade, Nome que sai, Nome que entra, Data de inicio do novo responsavel
3. Raquel alinha com RH/DP sobre o processo (reuniao de 30 min)
4. Configurar no Zeev: aprovador temporario (Fabiane Soares) para a unidade durante o periodo de transicao
5. Testar: simular uma troca e verificar que pedidos sao roteados corretamente

**Regra de backup**: durante transicao (novo responsavel nao ativo), pedidos sobem para Fabiane Soares como aprovador substituto.

**Criterio de conclusao**: Template de email criado, RH/DP alinhados, backup configurado no Zeev, processo documentado em 1 pagina.

### Metrica de Sucesso

| Metrica | Baseline | Meta 6 meses |
|--------|---------|-------------|
| Pedidos parados por aprovador desatualizado | Desconhecido (recorrente) | Zero |

### Dependencias Criticas

Nenhuma dependencia tecnica. Depende apenas de alinhamento entre Suprimentos e RH/DP.
