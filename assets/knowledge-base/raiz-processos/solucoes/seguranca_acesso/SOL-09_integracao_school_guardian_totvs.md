# SOL-09 — Ativar Integracao TOTVS para Catracas School Guardian (RJ Botafogo/Marapendi)

**Processo**: Seguranca e Acesso (CFTV, Alarmes, Catracas)
**Nivel**: N2 — Integracao nativa via empresa contratada
**Prioridade**: Consolidacao (Fase 2)
**Timeline**: 2-4 semanas pos-ativacao TI (depende de SOL-02)
**Responsavel**: TI + Gestao de Utilidades
**Resolve**: CR-10 (parcial — carga manual de atualizacao de cadastros), CR-11

---

## Descricao

School Guardian ja e parceira TOTVS com integracao automatica. Apos ativacao pela TI (SOL-02), configurar integracao para RJ Botafogo e Marapendi primeiro (menor esforco, maior retorno imediato).

**Acoes**:
1. Apos TI ativar o contrato de integracao (SOL-02): contatar empresa responsavel pela integracao
2. Configurar School Guardian para receber dados do TOTVS em tempo real (matriculas, inadimplentes)
3. Testar fluxo: aluno matriculado no TOTVS → acesso liberado na catraca em < 1 hora
4. Validar fluxo de bloqueio: aluno inadimplente/cancelado → acesso bloqueado automaticamente
5. Expandir para demais unidades com sistemas compativeis

**Dependencia**: SOL-02 concluido

---

## Plano de Implementacao

**Nivel**: N2 | **Timeline**: 2-4 semanas pos-ativacao TI | **Resolve**: CR-10 (parcial), CR-11

### Responsaveis

- Principal: TI
- Apoio: Gestao de Utilidades

### Passos

1. Apos TI ativar o contrato de integracao (SOL-02): contatar empresa responsavel pela integracao
2. Configurar School Guardian para receber dados do TOTVS em tempo real (matriculas, inadimplentes)
3. Testar fluxo: aluno matriculado no TOTVS → acesso liberado na catraca em < 1 hora
4. Validar fluxo de bloqueio: aluno inadimplente/cancelado → acesso bloqueado automaticamente
5. Expandir para demais unidades com sistemas compativeis

### Validacoes Pos-Ativacao

- [ ] Sistema de catraca recebe dados do TOTVS em tempo real
- [ ] Aluno matriculado = acesso liberado em < 1 hora
- [ ] Aluno inadimplente = acesso bloqueado automaticamente

### KPIs de Acompanhamento

| KPI | Baseline | Meta Fase 2 | Meta Fase 3 |
|-----|---------|------------|------------|
| Catracas integradas TOTVS | 0 | RJ configurada | Expansao geral |
