# Plano: Corrigir Data Engine para Análise Completa de Funil

## Contexto
A análise de funil de captação revelou que a data-engine tem gaps críticos: contacts com 0 rows (topo do funil invisível), `hs_analytics_source` não syncado, bug no `kpi_time_in_stage`, `unidade` não usado como filial, e faltam KPIs essenciais (waterfall, cohort, YoY). O objetivo é tornar a engine capaz de gerar TODAS as análises do Excel que montamos, de forma automatizada e otimizada.

## Arquivos a Modificar

### 1. Model — `raiz_data_engine/db/models.py` (linhas 733-752)
- **HubSpotContact**: adicionar `analytics_source` (String 50), `analytics_source_detail` (Text)
- **HubSpotDeal**: adicionar `unidade` (String 200), index `ix_hs_deal_unidade`
- Adicionar `closed_lost_reason` (Text) ao HubSpotDeal (futuro-proof)
- Adicionar `is_closed_won` (Boolean) e `is_closed` (Boolean) ao HubSpotDeal

### 2. Adapter — `raiz_data_engine/dominio/adapters/hubspot_crm.py`
- **CONTACT_PROPERTIES** (linha 175): adicionar `hs_analytics_source`, `hs_analytics_source_data_1`, `hs_analytics_source_data_2`
- **DEAL_PROPERTIES_BASE** (linha 126): adicionar `unidade`, `hs_is_closed_won`, `hs_is_closed`, `closed_lost_reason`
- **Pendente SC** (stages): adicionar `hs_v2_date_entered_103557519` (Pendente Sócio-Construtivista)
- **adapt_deal()** (linha 197): mapear `unidade`, `is_closed_won`, `is_closed`, `closed_lost_reason`
- **adapt_contact()**: mapear `analytics_source`, `analytics_source_detail`

### 3. Bug Fix — `raiz_data_engine/dominio/hubspot/kpis.py` (linhas 217-329)
- **kpi_time_in_stage**: corrigir para usar `kv.value->>'entered'` timestamps ao invés de `kv.value->>'ms'` (que não existe). Calcular duração entre stages consecutivos usando diferença de timestamps entered.

### 4. Novos KPIs — `raiz_data_engine/dominio/hubspot/kpis.py`
Adicionar 5 novos KPIs:

- **kpi_funnel_waterfall**: Funil stage-a-stage real usando `stage_times` JSONB. Conta deals que PASSARAM por cada stage (não snapshot). Conversão stage N → stage N+1. Filtros: pipeline, marca, filial, date_range.

- **kpi_contact_funnel**: Funil de contacts por lifecycle_stage com conversão. Filtros: source, date_range. Retorna Lead→MQL→SQL→Oportunidade→Cliente + desistentes/desqualificados.

- **kpi_source_attribution_real**: Source attribution real usando `hubspot_contact.analytics_source`. Agrupa contacts por source × lifecycle_stage. Substitui o proxy atual que usa pipeline/deal_type.

- **kpi_cohort**: Cohort mensal — contacts criados no mês X agrupados por lifecycle_stage atual. Filtros: date_range.

- **kpi_yoy**: Comparação ciclo-a-ciclo. Recebe 2 date ranges, retorna métricas lado-a-lado: volume, won, conversion, cycle_time, ticket_medio. Filtros: marca, filial, pipeline.

### 5. Rotas — `raiz_data_engine/api/hubspot.py`
Adicionar endpoints para os 5 novos KPIs:
- `GET /hubspot/kpis/funnel-waterfall`
- `GET /hubspot/kpis/contact-funnel`
- `GET /hubspot/kpis/source-real`
- `GET /hubspot/kpis/cohort`
- `GET /hubspot/kpis/yoy`

### 6. Sync Fix — `raiz_data_engine/dominio/hubspot/provider.py`
- Verificar que `fetch_hubspot_contacts()` usa as novas CONTACT_PROPERTIES
- Verificar que `upsert_hubspot_contacts()` mapeia os novos campos
- O hash do contact deve incluir `analytics_source`

### 7. Migration — `migrations/`
- Criar migration para adicionar colunas novas: `ALTER TABLE hubspot_contact ADD COLUMN analytics_source ...`
- Criar migration para HubSpotDeal: `ALTER TABLE hubspot_deal ADD COLUMN unidade ...`

## Ordem de Execução
1. Migration (adicionar colunas)
2. Model (atualizar SQLAlchemy)
3. Adapter (properties + mapping)
4. Sync fix (contact/deal provider)
5. Bug fix (kpi_time_in_stage)
6. Novos KPIs
7. Novas rotas
8. Trigger sync manual para popular novos campos
9. Verificar com queries que dados estão corretos

## Verificação
1. `POST /hubspot/sync` — trigger sync completo
2. `SELECT COUNT(*) FROM hubspot_contact WHERE analytics_source IS NOT NULL` — deve ter >0 após sync
3. `SELECT COUNT(*) FROM hubspot_deal WHERE unidade IS NOT NULL` — deve ter >0
4. `GET /hubspot/kpis/contact-funnel` — deve retornar lifecycle stages com counts
5. `GET /hubspot/kpis/funnel-waterfall?pipeline=39696414` — deve retornar stage-a-stage real
6. `GET /hubspot/kpis/time-in-stage?pipeline=39696414` — deve retornar tempo real (não fallback)
7. `GET /hubspot/kpis/source-real` — deve retornar contacts por hs_analytics_source
8. `GET /hubspot/kpis/cohort?date_from=2025-07-01&date_to=2026-04-01` — deve retornar cohort mensal
9. Rodar testes: `cd ~/Claude/GitHub/raiz-data-engine && bun run test`
