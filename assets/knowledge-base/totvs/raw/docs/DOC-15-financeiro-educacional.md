# DOC 15 — Módulo Financeiro Educacional

> Tabelas financeiras do TOTVS RM que se integram com o módulo educacional.
> Fonte: API Legada TOTVS, TDN, Fórum RM.
> Data: 2026-03-22

---

## 1. Visão Geral — Fluxo Financeiro

```
SHABILITACAOALUNO (aluno no curso)
    │
    └── SCONTRATO (contrato educacional)
            │
            ├── SPARCELA (parcelas/mensalidades)
            │       │
            │       └── SLAN (ponte educacional→financeiro)
            │               │
            │               └── FLAN (lançamento financeiro — módulo F)
            │                       │
            │                       ├── FLANBAIXA (pagamentos)
            │                       └── FBOL (boletos)
            │
            └── SBOLSAALUNO (bolsas concedidas)
                    │
                    └── SBOLSALAN (desconto aplicado por lançamento)
```

---

## 2. SCONTRATO — Contrato Educacional

**PK**: `CODCOLIGADA; RA; IDPERLET; CODCONTRATO`
**DataServer**: EduContratoData

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| CODCOLIGADA | Int16 | Sim | Coligada |
| RA | String(20) | Sim | FK → SALUNO.RA |
| IDPERLET | Int32 | Sim | FK → SPLETIVO.IDPERLET |
| CODCONTRATO | Int32 | Sim | Código do contrato |
| IDHABILITACAOFILIAL | Int32 | Não | FK → SHabilitacaoFilial |
| CODPLANOPGTO | Int32 | Não | Plano de pagamento |
| DTCONTRATO | DateTime | Não | Data do contrato |
| DIAVENCIMENTO | Int32 | Não | Dia de vencimento |
| TIPOCONTRATO | String | Não | Tipo do contrato |
| VALORSERVICO | Decimal | Não | Valor do serviço |
| DESCONTO | Decimal | Não | Desconto (%) |
| VALORBOLSA | Decimal | Não | Valor da bolsa aplicada |

**Regras de Negócio**:
- Criado automaticamente ao confirmar matrícula (quando SSTATUS.PLEXIGECONTRATO = 'S')
- Cancelado quando matrícula muda para status com SSTATUS.PLCANCELACONTRATO = 'S'
- Status: ativo, pendente_assinatura, encerrado, cancelado (via API REST: `/api/financeiro/v1/fcfo`)
- Encerramento automático ao final do ano letivo
- Rematrícula gera **novo** contrato para o período seguinte

---

## 3. SPARCELA — Parcelas / Mensalidades

**PK**: `CODCOLIGADA; IDPARCELA`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| CODCOLIGADA | Int16 | Sim | Coligada |
| IDPARCELA | Int32 | Sim | ID da parcela |
| RA | String(20) | Sim | FK → SALUNO.RA |
| CODCONTRATO | Int32 | Sim | FK → SCONTRATO |
| CODSERVICO | Int32 | Não | FK → SSERVICO (tipo de cobrança) |
| IDPERLET | Int32 | Não | FK → SPLETIVO |
| PARCELA | Int32 | Não | Número da parcela |
| COTA | Int32 | Não | Cota (quando parcelado) |
| DTVENCIMENTO | DateTime | Não | Data de vencimento |
| VALOR | Decimal | Não | Valor da parcela |

---

## 4. SSERVICO — Serviços Educacionais

**PK**: `CODCOLIGADA; CODSERVICO`

Define os tipos de cobrança (ex: Mensalidade, Taxa de Matrícula, Material Didático).

---

## 5. SLAN — Ponte Educacional → Financeiro

Vincula parcelas educacionais (SPARCELA) a lançamentos financeiros (FLAN).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| CODCOLIGADA | Int16 | Coligada |
| IDLAN | Int32 | FK → FLAN.IDLAN |
| IDPARCELA | Int32 | FK → SPARCELA.IDPARCELA |

---

## 6. FLAN — Lançamento Financeiro (Módulo F)

**PK**: `CODCOLIGADA; IDLAN`
**Tabela do módulo financeiro (Fluxus), não do educacional.**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| CODCOLIGADA | Int16 | Coligada |
| IDLAN | Int32 | ID do lançamento |
| CODCFO | String(25) | Responsável financeiro |
| RA | String(20) | Matrícula do aluno |
| COMPETENCIA | String(7) | Competência (YYYY-MM) |
| DTVENCIMENTO | DateTime | Data de vencimento |
| VALORORIGINAL | Decimal(15,4) | Valor original |
| VALORDESCONTO | Decimal(15,4) | Valor de desconto |
| VALORPAGO | Decimal(15,4) | Valor pago |
| **STATUSLAN** | **Int** | **0=Aberto, 1=Baixado(pago), 2=Cancelado** |
| DTPAGAMENTO | DateTime | Data do pagamento |

**API REST**:
- `GET /api/financeiro/v1/flan?codColigada={id}&codAluno={ra}` — listar parcelas
- `GET /api/financeiro/v1/flan?status=vencida&codColigada={id}` — parcelas vencidas
- Query params: `codColigada` (obrigatório), `codAluno`, `status` (em_dia, vencida, paga, renegociada), `competenciaInicio`, `competenciaFim`, `page`, `pageSize`

---

## 7. FBOL — Boletos

**API REST**:
- `POST /api/financeiro/v1/fbol/segunda-via` — gera 2ª via com multa/juros
- `GET /api/financeiro/v1/fbol?codColigada={id}&idLan={idLan}` — boletos do lançamento

**Response da 2ª via**: `{ linhaDigitavel, codigoBarras, vencimento, valor }`

---

## 8. SBOLSA — Cadastro de Bolsas

**PK**: `CODCOLIGADA; CODBOLSA`
**DataServer**: EduBolsaData

| Campo | Tipo | Obrig. | Default | Descrição |
|-------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | Sim | 1 | Coligada |
| CODBOLSA | String(10) | Sim | 0 | Código da bolsa |
| NOME | String(60) | Sim | — | Nome |
| VALOR | Decimal | Sim | 0 | Percentual ou valor de desconto |
| CODTIPOCURSO | Int16 | Sim | — | FK → STipoCurso |
| **TIPODESC** | String(1) | Sim | **P** | **P=Percentual, V=Valor fixo** |
| CODCFO | String(25) | Não | — | Responsável financeiro |
| FIES | String(1) | Não | 0 | É FIES (S/N) |
| BOLSAFUNC | String(1) | Não | 0 | Bolsa de funcionário (S/N) |
| ATIVA | String(1) | Não | S | Bolsa ativa (S/N) |
| PERMITEALTERARVALOR | String(1) | Não | S | Permite alterar valor (S/N) |
| VERIFICAINADIMPLENCIA | String(1) | Não | S | Verifica inadimplência (S/N) |

---

## 9. SBOLSAALUNO — Bolsas Concedidas ao Aluno

| Campo | Tipo | Descrição |
|-------|------|-----------|
| CODCOLIGADA | Int16 | Coligada |
| RA | String(20) | FK → SALUNO |
| CODBOLSA | String(10) | FK → SBOLSA |
| CODCONTRATO | Int32 | FK → SCONTRATO |
| IDPERLET | Int32 | FK → SPLETIVO |

**Regras**: Máximo 1 bolsa ativa por aluno. Bolsa ativa = `ATIVA = 1` E `DTFIM >= data_atual`.

**API REST**: `GET /api/financeiro/v1/sbolsas?codColigada={id}&ra={ra}&tipo={tipo}&ativa={true/false}`
Tipos: integral, parcial, merito, social, convenio, funcionario.

---

## 10. SBOLSALAN — Bolsa × Lançamento Financeiro

| Campo | Tipo | Descrição |
|-------|------|-----------|
| CODCOLIGADA | Int16 | Coligada |
| CODBOLSA | String(10) | FK → SBOLSA |
| IDLAN | Int32 | FK → FLAN.IDLAN |
| IDPARCELA | Int32 | FK → SPARCELA |
| IDPERLET | Int32 | FK → SPLETIVO |
| VALOR | Decimal | Valor do desconto aplicado |
| VALORBAIXA | Decimal | Valor efetivamente baixado |

---

## 11. Regras de Negócio Financeiro

### RN-FIN-001: Inadimplência
- Parcela vencida: `FLAN.DTVENCIMENTO < GETDATE()` E `FLAN.STATUSLAN = 0`
- Aluno inadimplente: pelo menos 1 parcela vencida
- Faixas aging: até 30d, 31-60d, 61-90d, 91-180d, >180d

### RN-FIN-002: Bolsas
- Máximo 1 bolsa ativa por aluno
- Bolsa ativa: `ATIVA = 1` E `DTFIM >= data_atual`

### RN-FIN-003: Contratos
- Status: ativo, pendente_assinatura, encerrado, cancelado
- Valor anual = parcelas × valor
- Encerramento automático ao final do ano letivo

### RN-FIN-004: Renegociação
- Agrupa 1+ parcelas vencidas em novo parcelamento
- Desconto máximo: 30% (política institucional)
- Fluxo: proposta → em_análise → aprovada/rejeitada → quitada
- Parcelas originais → STATUSLAN permanece 0, mas marcadas como `renegociada`

### RN-FIN-005: 2ª Via de Boleto
- Somente parcelas com STATUSLAN = 0 (em_dia ou vencida)
- Multa: 2% + juros 1% a.m. (pro-rata)
- Validade: 30 dias

### RN-FIN-006: Vínculo Matrícula ↔ Financeiro
- Confirmação de matrícula → cria contrato (quando PLEXIGECONTRATO = 'S')
- Cancelamento de matrícula → rescisão do contrato + multa (quando PLCANCELACONTRATO = 'S')
- Trancamento → pode pausar parcelas (configurável por escola)
- Rematrícula → novo contrato para o período seguinte
- Bloqueio financeiro (PLBLOQFINANC = 'S') impede alterações financeiras

---

*Documento gerado em 2026-03-22. Fonte: API Legada TOTVS + DOC-1 (API Reference) + DOC-4 (Regras de Negócio).*
