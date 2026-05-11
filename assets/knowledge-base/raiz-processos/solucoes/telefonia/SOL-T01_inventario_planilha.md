# SOL-T01 — Estruturar Planilha de Inventario com Colunas Padrao e Alertas

**Processo**: Gestao de Telefonia Corporativa
**Nivel**: N1 (config nativa — Google Sheets)
**Prioridade**: Quick Win
**Timeline**: 2 dias uteis
**Responsavel**: Kevin ou Maressa (executa) | Aprovador: Maressa
**Resolve**: RC-T04 (inventario sem controle)

---

## Descricao

Reestruturar a "Planilha Rastreio Telefonia" existente com schema fixo, validacao de dados e formatacao condicional para alertas visuais. Nao e criar do zero — e padronizar o que ja existe.

**Posicao na Matriz Impacto x Esforco**: Esforco BAIXO / Impacto ALTO — Quick Win prioritario

**Importancia estrategica**: SOL-T01 e pre-requisito absoluto para SOL-T05 (integracao ticket) e SOL-T07 (BID Vivo). Sem inventario confiavel, nao e possivel conduzir o BID.

### ROI / Impacto Esperado

| Metrica | Antes | Depois (estimado) | Melhoria |
|---------|-------|-------------------|----------|
| Linhas ativas sem titular rastreado | >10% | < 2% | -80% |
| Tempo para auditar inventario | Dias | Horas | -90% |

---

## Schema Minimo por Linha de Inventario

| Campo | Tipo | Obrigatorio | Observacao |
|-------|------|-------------|------------|
| ID_patrimonio | Texto | Sim | Ex: APP-001, CHI-042 |
| Tipo | Lista | Sim | Aparelho / Chip / Linha |
| Modelo / Operadora | Texto | Sim | Ex: iPhone 13, Vivo |
| IMEI / ICCID / Numero | Texto | Sim | Identificador unico |
| Status | Lista | Sim | Estoque / Ativo / Devolvido / Extraviado |
| Titular_atual | Texto | Condicional | Se Status = Ativo |
| Cargo_titular | Texto | Condicional | Se Status = Ativo |
| Data_entrega | Data | Condicional | Se Status = Ativo |
| Nr_termo_entrega | Texto | Sim | Referencia ao PDF do termo |
| Data_devolucao_prevista | Data | Opcional | Para controle de prazo |
| Data_devolucao_real | Data | Condicional | Se Status = Devolvido |
| Nr_termo_devolucao | Texto | Condicional | Se Status = Devolvido |
| Observacoes | Texto | Nao | Livre |

---

## Alertas via Formatacao Condicional

- Vermelho: Status = Ativo + Titular_atual em branco (linha orfao)
- Amarelo: Data_devolucao_prevista < hoje (prazo vencido)
- Azul: Status = Estoque (disponivel para uso)

---

## Plano de Implementacao

### Pre-requisitos

- Acesso de edicao a "Planilha Rastreio Telefonia"

### Plano Detalhado

| Dia | Atividade |
|-----|-----------|
| Dia 1 | Exportar aba atual como backup ("Inventario_legado_20260316"). Criar nova aba "Inventario_v2" com schema padrao (ver acima). Configurar validacoes de dados (dropdowns: Status, Tipo, Operadora). |
| Dia 2 | Migrar dados existentes para novo schema. Configurar formatacao condicional: vermelho = Ativo sem titular; amarelo = prazo vencido; azul = Estoque disponivel. Compartilhar com time + instrucao de uso. |

Passos adicionais (S_melhorias):
1. Copiar schema acima para nova aba "Inventario_v2"
2. Migrar dados existentes (aparelhos + chips virgens) para novo schema
3. Adicionar validacao de dados (dropdown nos campos Lista)
4. Configurar formatacao condicional para alertas
5. Arquivar aba antiga como "Inventario_legado_YYYYMMDD"
6. Comunicar time sobre novo padrao de lancamento

### Checklist de Validacao

- [ ] Todos os aparelhos do inventario atual migrados com ID_patrimonio
- [ ] Todos os chips virgens registrados com ICCID
- [ ] Todas as linhas ativas com titular preenchido (ou marcadas como "titular desconhecido" para investigar)
- [ ] Alertas visuais funcionando (testar com linha de exemplo)
- [ ] Time confirmou acesso e entendeu o novo schema

### Plano de Rollback

A aba legado e mantida intacta ate fim de abril. Se algo der errado, basta reativar.

---

## KPIs de Acompanhamento

| KPI | Baseline (hoje) | Meta Fase 1 | Meta Fase 2 | Meta Fase 3 |
|-----|----------------|-------------|-------------|-------------|
| % linhas com titular rastreado | < 80% (estimado) | 95% | 98% | 100% |

---

## Contexto no Roadmap

**Fase 1 — Fundacao: Rastreabilidade (Semanas 1-2)**

Executado em paralelo com SOL-T02, SOL-T03, SOL-T04. Sem dependencias tecnicas. Pre-requisito absoluto para SOL-T05 e SOL-T07.

**Dependencias**:
```
SOL-T01 (inventario estruturado) ← prerequisito para SOL-T05 e SOL-T07
```
