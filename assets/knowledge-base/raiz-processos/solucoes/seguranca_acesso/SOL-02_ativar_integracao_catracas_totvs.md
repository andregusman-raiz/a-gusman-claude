# SOL-02 — Cobrar TI para Ativar Integracao Catracas-TOTVS

**Processo**: Seguranca e Acesso (CFTV, Alarmes, Catracas)
**Nivel**: N1 — Ativacao de contrato existente
**Prioridade**: Quick Win / Acao Imediata (Fase 1)
**Timeline**: 3-5 dias uteis para iniciar; ativacao estimada D+10 a D+15
**Responsavel**: Gestao de Utilidades (cobranca) — executor: TI; Aprovador: Coordenador de Utilidades + Gestor de TI
**Resolve**: CR-11, CR-10 (parcial)

---

## Descricao

Integracao ja contratada (R$1.500/ano). Nao ha desenvolvimento necessario — apenas ativacao tecnica pelo TI. Escalar com prazo formal.

**Acoes**:
1. Enviar email formal para TI com prazo de ativacao (sugestao: 10 dias uteis)
2. Copiar gestao imediata e diretoria de operacoes
3. Solicitar cronograma detalhado de ativacao por regiao (POA, JF, RJ)
4. Acompanhar semanalmente com registro no Zeev
5. Se prazo nao for cumprido → escalar para C-level

**Custo**: Zero — ja pago (R$1.500/ano)

**Impacto pos-ativacao**: Elimina CR-10 (carga manual) para unidades com sistema compativel

---

## Plano de Implementacao

**Nivel**: N1 | **Timeline**: 5 dias uteis | **Resolve**: CR-11

### Pre-requisitos

- Contrato de integracao ja assinado (R$1.500/ano)
- Acesso: responsavel Utilidades com autoridade para escalar para TI

### Responsaveis

- Principal: Gestao de Utilidades (cobranca)
- Executor: TI (ativacao tecnica)
- Aprovador: Coordenador de Utilidades + Gestor de TI

### Plano de Acao

| Dia | Atividade |
|-----|-----------|
| D+1 | Enviar email formal para TI com: (a) numero do contrato, (b) valor pago, (c) prazo de ativacao solicitado = D+10, (d) copia para gestao |
| D+3 | Reuniao de alinhamento com TI para entender bloqueios |
| D+5 | TI entrega cronograma de ativacao por regiao |
| D+10 | Inicio da ativacao (POA ou JF primeiro) |
| D+15 | Validacao com unidade piloto |

### Validacoes Pos-Ativacao

- [ ] Sistema de catraca recebe dados do TOTVS em tempo real
- [ ] Aluno matriculado = acesso liberado em < 1 hora
- [ ] Aluno inadimplente = acesso bloqueado automaticamente
- [ ] Sem carga manual de base

### Escalada

Se TI nao entregar cronograma em D+5 → escalar para Diretoria de Operacoes

### KPIs de Acompanhamento

| KPI | Baseline | Meta Fase 1 | Meta Fase 2 |
|-----|---------|------------|------------|
| Catracas integradas TOTVS | 0 (aguardando TI) | Ativada | RJ configurada |
| Carga manual catracas | Alta (Hikvision) | Reduzida | Baixa |
