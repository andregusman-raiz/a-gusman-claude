# SOL-07 — Plano Estruturado de Migracao All In → RICOH

**Processo**: Gestao de Impressoras (Locadas e Proprias) — Raiz Educacao
**Nivel**: N4 (troca de fornecedor — planejamento estrategico)
**Prioridade**: Estrategico
**Timeline**: Abr-Dez/2026 (execucao piloto jul/ago) | Prazo coordenacao: Dez/2026
**Responsavel**: Maressa (coordenacao) + TI/Kevin (rede/instalacao) + Contratos/Juridico (contrato RICOH)
**Resolve**: CR-05 (All In vencendo em dez/2026 sem substituto preparado)

---

## Descricao

Elaborar plano de migracao completo com marcos, responsaveis, dependencias e criterios de aceitacao para substituicao de All In por RICOH em todas as escolas RJ.

**Posicao na Matriz Impacto x Esforco**: Esforco ALTO / Impacto CRITICO — Estrategico

**Importancia critica**: Sem migracao concluida ate dez/2026, escolas RJ ficam sem impressao em jan/2027 (risco pedagogico).

**Pre-requisitos criticos**:
- SOL-01 operacional (dados de volume para dimensionar contrato RICOH)
- SOL-02 operacional (baseline de SLA All In para exigir nivel superior no RICOH)
- Juridico disponivel para contrato RICOH (mai/jun/2026)
- Orcamento CAPEX/OPEX RICOH aprovado pela gestao

### ROI / Impacto Esperado

| Solucao | Causa Raiz Resolvida | Impacto Esperado | Prazo |
|---------|---------------------|-----------------|-------|
| SOL-07 (Migracao RICOH) | CR-05 | Continuidade operacional jan/2027 | Dez/2026 |

**Impacto financeiro potencial**:
- Evitar multa All In (R$170k): ja garantido pela decisao de manter ate dez/2026 (NUNCA rescindir antes)
- Risco evitado de lacuna operacional jan/2027: priceless (risco pedagogico)

### Riscos

- RICOH com dificuldade de instalar em jan/2027 se contrato assinado tarde
- TI com fila de trabalho em jul/ago — reservar capacidade com antecedencia

---

## Marcos Obrigatorios (S_melhorias)

| Marco | Prazo | Responsavel |
|-------|-------|-------------|
| Proposta RICOH atualizada e aprovada | 30/abr/2026 | Maressa + Contratos |
| Contrato RICOH assinado | 31/mai/2026 | Juridico |
| Mapeamento de rede/TI por escola | 15/jun/2026 | TI (Kevin) |
| Piloto 2 escolas (Rocha Miranda + 1) | 31/jul/2026 | Maressa + RICOH + TI |
| Validacao piloto + ajustes | 31/ago/2026 | Maressa |
| Migracao escolas restantes | Set-Nov/2026 | Maressa + RICOH |
| Go-live completo (parallel run encerrado) | 30/nov/2026 | Maressa |
| Encerramento contrato All In | 31/dez/2026 | Contratos/Juridico |

---

## Plano Detalhado de Implementacao (D_implementacao)

### Marcos e Cronograma

| Marco | Prazo | Responsavel | Status |
|-------|-------|-------------|--------|
| Dados Printwayy RJ disponiveis para dimensionamento RICOH | 30/abr/2026 | Kevin (SOL-01) | Pendente |
| Proposta RICOH atualizada com volumes reais e novo SLA | 30/abr/2026 | Maressa | Pendente |
| Aprovacao interna da proposta RICOH (gestao + financeiro) | 15/mai/2026 | Maressa + Gestao | Pendente |
| Contrato RICOH assinado | 31/mai/2026 | Juridico + Maressa | Pendente |
| Mapeamento de infraestrutura TI por escola RJ (rede, drivers) | 30/jun/2026 | Kevin (TI) | Pendente |
| Comunicacao para escolas RJ sobre migracao (60 dias antes) | 30/jun/2026 | Maressa | Pendente |
| Instalacao e ativacao piloto — Rocha Miranda + QI Tijuca | 31/jul/2026 | Maressa + RICOH + TI | Pendente |
| Validacao piloto (mecanografia funcionando 100%) | 15/ago/2026 | Maressa | Pendente |
| Migracao escolas As Pereira, SAP e demais RJ | Set-Out/2026 | Maressa + RICOH + TI | Pendente |
| Periodo parallel run (All In desligada por escola apos RICOH validado) | Set-Nov/2026 | Maressa | Pendente |
| Encerramento formal All In + entrega equipamentos | 31/dez/2026 | Maressa + Juridico | Pendente |

### Passos Criticos (S_melhorias)

1. Atualizar proposta RICOH com volumes reais (dados Printwayy — SOL-01)
2. Incluir SLA RICOH mais rigoroso que All In (baseline de dados do SOL-02)
3. Definir sequencia de migracao: priorizar Rocha Miranda e QI Tijuca (mecanografia critica)
4. Mapear dependencias TI por escola: ponto de rede, driver, configuracao
5. Planejar insumos iniciais RICOH (estoque de inauguracao por escola)
6. Definir periodo de parallel run (All In + RICOH) para cada escola antes de desligar All In
7. Comunicar escolas com antecedencia de 60 dias antes da migracao delas

---

## Sequencia de Migracao Recomendada

1. Piloto: Rocha Miranda (mecanografia critica — aprendizado de instalacao)
2. QI Tijuca (mecanografia — valida piloto de mecanografia)
3. As Pereira (coloridas pedagogicas)
4. SAP (coloridas pedagogicas)
5. Demais escolas RJ em ordem de criticidade pedagogica

---

## Criterios de Aceitacao por Escola (go/no-go para desligar All In)

- RICOH instalado e imprimindo sem erros por 5 dias consecutivos
- Mecanografia (onde aplicavel): produtividade equivalente ou superior ao All In
- Equipe escolar treinada e confirmando operacao OK
- Insumos iniciais RICOH entregues e estocados
- Chamados RICOH cadastrados no sistema de Tickets Raiz

---

## Checklist de Riscos

- [ ] Confirmar que RICOH cobre TODAS as escolas All In (sem escola descoberta)
- [ ] Clausula contratual: RICOH assume servico a partir de X data — confirmada no contrato
- [ ] Plano de contingencia: o que fazer se RICOH atrasar instalacao? (All In mantida ate resolucao)
- [ ] Multa All In rescisao antecipada: R$170k — NUNCA rescindir antes de dez/2026
- [ ] Insumos RICOH vs. All In sao diferentes — nao reaproveitar toner

---

## Cronograma Visual

```
Abr/2026    Mai/2026    Jun/2026    Jul/2026    Ago/2026   Set-Nov    Dez/2026
SOL-07 piloto RJ >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> encerramento All In
```

---

## Dependencias Entre Solucoes

```
SOL-01 (Printwayy→BI) → SOL-07 depende de SOL-01 (dados de volume RJ para proposta RICOH)
SOL-02 (Chamados padronizados) → SOL-07 depende de SOL-02 (baseline SLA All In para exigir do RICOH)
```
