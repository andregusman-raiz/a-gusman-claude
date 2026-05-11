# M-CA-04 — Alerta de Vencimento Contrato Goni + Acompanhamento Alvara POA

**Processo**: cantinas
**Nivel**: N1
**Prioridade**: Quick Win (P1)
**Timeline**: 1 semana
**Responsavel**: Sarah Firmo (Contratos)
**Resolve**: RC-CA-06 (Goni sem alerta, alvara POA sem acompanhamento)

---

## Descricao

**RC Atacada**: RC-CA-06 (Goni sem alerta, alvara POA sem acompanhamento)
**Nivel**: N1 — Configuracao TOTVS + processo
**Responsavel**: Sarah Firmo (Contratos)
**Prazo estimado**: 1 semana

**O que fazer**:
1. Cadastrar contrato Goni no TOTVS Gestao de Contratos com alerta de vencimento a 90 dias e 30 dias
2. No cadastro: vincular as unidades POA afetadas + datas de vencimento dos Alvaras de Saude de cada unidade
3. Criar rotina anual no calendario de Sarah: 60 dias antes do vencimento do Alvara de cada unidade POA → verificar se Goni tem contrato vigente e documentacao atualizada → acionar Goni para preparar dossia de renovacao
4. Checklist de renovacao de Alvara POA:
   - Contrato Goni vigente: sim/nao
   - Documentos de Goni atualizados (CRM, certificados): sim/nao
   - Protocolo de renovacao junto a Vigilancia Sanitaria aberto: sim/nao
   - Data de vencimento do novo Alvara: [data]

**Resultado esperado**:
- Zero risco de interdicao de cantinas POA por vencimento de contrato com Goni
- Alvara de Saude de todas as unidades POA renovado dentro do prazo
- Processo documentado e rastreavel no TOTVS

**Priorizacao**:

| Campo | Detalhe |
|-------|---------|
| Impacto | Alto |
| Esforco | Baixo |
| Prioridade | P1 |
| Responsavel | Sarah |
| Prazo | 1 semana |

---

## Plano de Implementacao

### Contexto do Sprint

**Sprint 1 — Controle Financeiro Imediato** (Marco - Abril 2026)
**Tarefa 1.1** no plano de implementacao — primeira tarefa a ser executada

**Responsavel**: Sarah Firmo (Contratos)
**Prazo**: Semana de 17/marco/2026
**Dependencias**: Acesso ao TOTVS Gestao de Contratos

### Passos

1. Localizar contrato Goni no TOTVS (ou criar o cadastro se nao existir)
2. Configurar alerta de vencimento: 90 dias antes (Sarah) e 30 dias antes (Sarah + Marissa)
3. No cadastro do contrato, adicionar campo personalizado: "Unidades POA vinculadas" com lista das unidades e datas de vencimento de cada Alvara de Saude
4. Criar evento recorrente no Google Calendar de Sarah: "Acompanhamento Alvara Saude POA" — data de 60 dias antes do vencimento de cada alvara
5. Criar checklist de renovacao de alvara (documento de 1 pagina): contrato Goni vigente / documentos CRM atualizados / protocolo Vigilancia Sanitaria aberto / nova data de vencimento

**Criterio de conclusao**: Contrato Goni no TOTVS com alertas ativos. Calendario com datas de vencimento dos alvaras de todas as unidades POA.

### Checklist de Renovacao de Alvara POA

```
CHECKLIST RENOVACAO ALVARA DE SAUDE — CANTINAS POA
Unidade: [nome]
Data de vencimento do Alvara atual: [data]
Data limite para protocolo de renovacao: [data - 30 dias]

[ ] 1. Contrato Goni vigente (nao vencido)
[ ] 2. Documentos de Goni atualizados:
    [ ] CRM do responsavel tecnico
    [ ] Certificados de treinamento (manipulacao de alimentos)
    [ ] Exames medicos periodicos dos funcionarios
[ ] 3. Protocolo de renovacao aberto na Vigilancia Sanitaria
    Nr do protocolo: [numero]
    Data de abertura: [data]
[ ] 4. Nova data de vencimento prevista: [data]

Responsavel: Sarah Firmo
Data da verificacao: [data]
```

### Metrica de Sucesso

| Metrica | Baseline | Meta |
|--------|---------|------|
| Contrato Goni com alerta TOTVS | Nao | Sim |
| Alvara POA monitorado | Nao | Sim + alvara POA monitorado |
| Risco de interdicao de cantinas POA | Presente | Eliminado |
