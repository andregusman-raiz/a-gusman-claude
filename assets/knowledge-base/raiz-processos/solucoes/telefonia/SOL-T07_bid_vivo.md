# SOL-T07 — Kit BID Vivo Set/2026 + Consolidacao Excecoes Claro

**Processo**: Gestao de Telefonia Corporativa
**Nivel**: N1/N2 (processo contratual)
**Prioridade**: Estrategico
**Timeline**: Abril → Setembro 2026 (prazo critico: BID em Maio/2026)
**Responsavel**: Maressa + Gestao de Contratos (Owner) | Aprovador: Diretoria
**Resolve**: RC-T05 (contrato vencendo sem BID preparado)

---

## Descricao

Preparar toda a base de dados e documentacao necessaria para conduzir o BID de renovacao/substituicao do contrato Vivo. O BID precisa de inventario real — o que torna SOL-T01 pre-requisito critico.

**Posicao na Matriz Impacto x Esforco**: Esforco ALTO / Impacto ALTO — Estrategico

**Prazo critico**: BID em maio/2026 → preparacao deve iniciar em marco/2026

**Pre-requisito absoluto**: SOL-T01 com inventario completo e confiavel (Abril/2026)

---

## Entregaveis do Kit BID

### 1. Inventario Consolidado (pre-requisito — SOL-T01)

- Total de linhas ativas por categoria (voz, dados, IoT)
- Total de aparelhos por modelo e estado
- Consumo medio mensal por linha (extrair do portal Vivo)
- Distribuicao geografica (SP sede + unidades escolares)

### 2. Mapeamento de Excecoes Claro

- Listar todas as linhas Claro existentes
- Documentar por que sao Claro (cobertura? legado? preferencia?)
- Avaliar se devem migrar para Vivo ou manter como excecao

### 3. Definicao de Requisitos para Novo Contrato

- SLA minimo de suporte
- Cobertura geografica necessaria
- Franquias de dados por perfil de usuario
- Necessidade de MDM (N4 — se escala justificar)
- Condicoes de portabilidade sem multa

**Requisitos minimos do novo contrato (detalhados)**:
- Franquia dados: sugestao 5GB padrao, 15GB para perfis de alta demanda
- Cobertura: obrigatoria nas regioes onde as escolas estao localizadas
- SLA suporte: resposta em 4h para bloqueio de linha, 24h para demais
- Portabilidade: sem multa apos 12 meses
- MDM nativo (avaliar custo-beneficio antes de incluir como requisito obrigatorio)
- Portal de gestao com API para integracao futura

### 4. Processo de BID

- Solicitar proposta para Vivo (renovacao) + Claro + TIM (pelo menos 3)
- Avaliar custo total de ownership (TCO), nao apenas mensalidade
- Envolver juridico para clausulas de SLA e penalidades

### 5. Clausulas a Negociar

- Penalidade por indisponibilidade de rede > 2h
- Flexibilidade para incluir/remover linhas sem burocracia excessiva
- Processo de transferencia de titularidade documentado (para evitar repeticao do RC-T02)

---

## Plano de Implementacao

### Timeline Sugerida (S_melhorias)

| Marco | Data |
|-------|------|
| Inventario completo (SOL-T01) | Abril/2026 |
| Mapeamento excecoes Claro | Abril/2026 |
| RFP enviada para operadoras | 1a semana Maio/2026 |
| Propostas recebidas | 3a semana Maio/2026 |
| Analise e decisao | Junho/2026 |
| Novo contrato assinado | Julho/2026 |
| Migracao/portabilidade | Ago-Set/2026 |

### Plano Detalhado (D_implementacao)

| Marco | Periodo | Entregavel |
|-------|---------|------------|
| Inventario completo | Marco-Abril | Planilha com 100% das linhas, aparelhos e chips mapeados |
| Mapeamento excecoes Claro | Abril | Lista de linhas Claro com justificativa de manutencao ou migracao |
| Relatorio de consumo | Abril | Exportacao do portal Vivo: uso medio por linha nos ultimos 6 meses |
| Definicao de requisitos | Abril-Marco | Documento: franquias, cobertura, SLA, necessidade de MDM |
| RFP enviada | 1a semana Maio | Solicitar proposta para: Vivo, Claro, TIM (minimo 3 operadoras) |
| Propostas recebidas | 3a semana Maio | Avaliar TCO (Total Cost of Ownership) — nao apenas mensalidade |
| Analise comparativa | Junho | Planilha de comparacao: custo, SLA, cobertura, portabilidade |
| Decisao e assinatura | Julho | Contrato novo assinado |
| Migracao/portabilidade | Ago-Set | Migracao gradual sem interrupcao operacional |

### Pre-requisitos para Iniciar Fase 3 (BID)

- [ ] Inventario com 100% das linhas confirmadas (auditoria manual se necessario)
- [ ] Relatorio de consumo extraido do portal Vivo
- [ ] Excecoes Claro mapeadas e decisao tomada (migrar vs manter)
- [ ] Aprovacao da diretoria para conduzir o BID

### Checklist de Validacao

- [ ] Inventario completo e auditado antes de maio/2026
- [ ] Minimo 3 propostas de operadoras recebidas
- [ ] Analise de TCO documentada
- [ ] Decisao aprovada pela diretoria
- [ ] Contrato assinado antes de agosto/2026 (30 dias de buffer antes do vencimento)

---

## KPIs de Acompanhamento

| KPI | Baseline (hoje) | Meta Fase 3 |
|-----|----------------|-------------|
| Contrato renovado | — | Sim (antes set/2026) |

---

## Cronograma Visual (Roadmap Completo)

```
MARCO 2026
Sem 1-2: [SOL-T01] Planilha inventario v2
Sem 1:   [SOL-T02] Termos digitais
Sem 1:   [SOL-T03] SOP desligamento + alinhamento RH
Sem 1:   [SOL-T04] Formulario solicitacao Google Forms
Sem 1+:  [SOL-T06] PARALELO: acao transferencia 6 linhas Vivo ←── URGENTE

ABRIL 2026
Sem 3-6: [SOL-T05] Integracao ticket↔inventario + alertas n8n
Sem 5-6: Inventario completo (prerequisito BID)
         Mapeamento excecoes Claro
         Relatorio de consumo (portal Vivo)

MAIO 2026
Sem 1:   RFP enviada para Vivo + Claro + TIM
Sem 3:   Propostas recebidas

JUNHO 2026
         Analise comparativa + recomendacao

JULHO 2026
         Assinatura contrato novo

AGOSTO-SETEMBRO 2026
         Migracao/portabilidade
Set/2026: Contrato Vivo atual vence → novo contrato em vigor
```

---

## Contexto no Roadmap

**Fase 3 — Estrategico: BID (Abril-Setembro 2026)**

**Dependencias**:
```
SOL-T07 (BID Vivo) ← depende de SOL-T01 completo
```
