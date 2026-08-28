#!/usr/bin/env bash
# de-memory.sh — gera snapshot denso da "memória" do data-engine para sessões Claude.
# Combina: Knowledge Gateway ao vivo + docs canônicos locais + estado git + control plane.
# Uso: bash ~/Claude/.claude/scripts/de-memory.sh   (saída em docs/ai-state/DE-MEMORY.md)
set -euo pipefail
DE="$HOME/Claude/GitHub/raiz-data-engine"
GW="https://raiz-data-engine-production.up.railway.app"
OUT="$HOME/Claude/docs/ai-state/DE-MEMORY.md"
TS="$(date '+%Y-%m-%d %H:%M')"

# 1. Gateway ao vivo (a memória compilada do DE para LLM)
LLM=$(curl -s --max-time 25 "$GW/v1/knowledge/llm-context" || echo '{}')
COUNTS=$(echo "$LLM" | python3 -c "import json,sys;print(json.dumps(json.load(sys.stdin).get('resource_counts',{})))" 2>/dev/null || echo '{}')
SCHEMA=$(echo "$LLM" | python3 -c "import json,sys;print(json.load(sys.stdin).get('schema_version','?'))" 2>/dev/null || echo '?')

# 2. git
GIT=$(git -C "$DE" log --oneline -8 2>/dev/null || echo 'n/a')
BR=$(git -C "$DE" branch --show-current 2>/dev/null || echo '?')

# 3. CLAUDE.md estado (primeiras linhas de estado)
STATE=$(sed -n '5,40p' "$DE/CLAUDE.md" 2>/dev/null | grep -E '^>' | sed 's/^> //' | head -25 || echo '')

{
echo "# DE-MEMORY — memória viva do data-engine (snapshot)"
echo "> Gerado $TS por de-memory.sh. Recarregue com \`bash ~/Claude/.claude/scripts/de-memory.sh\`."
echo "> Fonte de verdade ao vivo = Knowledge Gateway ($GW). Este arquivo é cache denso para a sessão."
echo
echo "## Pulso (Gateway ao vivo, schema $SCHEMA)"
echo '```json'; echo "$COUNTS" | python3 -m json.tool 2>/dev/null || echo "$COUNTS"; echo '```'
echo
echo "## O que é"
echo "Plataforma canonical de KPIs da Raiz. Fonte única TOTVS RM + Neon + HubSpot + Layers + Zeev. Stack Python 3.12 + FastAPI + SQLAlchemy async + asyncpg + pymssql. Deploy Railway (auto em main). DB primário Neon; TOTVS via Neon Mirror (ADR-041, MSSQL direto OFF em runtime)."
echo
echo "## Arquitetura 4 camadas"
echo "Bronze (raw: scrapers, TOTVS REST/SOAP, BI Raiz) → Prata (dbt fact_*/dim_* em prata.*) → Ouro (KPI Registry, raiz_data_engine/reports/core/registry/) → API (EnvelopeV2 {value_raw,value_formatted})."
echo "Painel = view declarativa do registry (strategy=from_registry, 0 custom). Gate strict S1-S4 BLOCKING."
echo
echo "## Endpoints canônicos (ordem de preferência)"
echo "1. GET /v1/knowledge/llm-context (1º sempre) · /v1/knowledge/index · /v1/agent/contract"
echo "2. GET /v1/kpis/search?q= · /v1/kpis/catalog · /v1/kpis/{id} · /v1/kpis/{id}/value · /v1/kpis/{id}/consumers"
echo "3. GET /v1/agg/canonical/{panel}/{metric} · /v1/manifest/{panel}/contract"
echo "4. GET /reports/<panel>/data (bundle) — LEGADO p/ agentes externos, preferir /v1/agg"
echo "5. POST /query/preflight → /query/execute (source=neon, fallback governado; raw SQL último recurso)"
echo "NUNCA: /api/totvs/query, /api/pbi-raiz/query (deprecados). PII server-side; nunca reformatar value_raw."
echo
echo "## 23 providers (Gateway)"
echo "$LLM" | python3 -c "import json,sys;d=json.load(sys.stdin);print(', '.join(d.get('activation_requirements_summary',{}).get('provider_ids',[])))" 2>/dev/null || true
echo
echo "## Mirrors TOTVS no Neon (runtime)"
echo "PFFINANC→public.pffinanc_mirror · PEVENTO→pevento_mirror · PFUNC→pfunc_mirror · PFUNCAO→pfuncao_mirror · GFORMULA→gformula_mirror. TOTVS MSSQL direto (189.126.153.77:38000, db C3U7RQ_160286_RM_PD) só backfill/admin (GHA, não Railway)."
echo
echo "## Estado do projeto (CLAUDE.md)"
echo "$STATE"
echo
echo "## Git (branch $BR)"
echo '```'; echo "$GIT"; echo '```'
echo
echo "## Caminhos críticos"
echo "- Onboarding: $DE/docs/canonical/PLATFORM_OVERVIEW.md"
echo "- Dicionário 4 camadas: $DE/docs/canonical/data-engine-bronze-prata-ouro-dictionary.md"
echo "- consumers.yaml (115 KPIs × painéis): $DE/docs/canonical/consumers.yaml"
echo "- KPI registry: $DE/raiz_data_engine/reports/core/registry/ (ou kpi_registry/)"
echo "- API: $DE/raiz_data_engine/api/ · reports_v2/<panel>/manifest.yaml"
echo "- ADRs: $DE/docs/adr/ · diagnósticos: $DE/docs/diagnosticos/ · plans: $DE/docs/plans/"
echo "- Control plane (admin, Railway prod, Google SSO): deploy em $DE/control_plane/"
echo "- Skill local: /ag-12-sql-totvs-zeev (TIER −1 Gateway primeiro)"
echo
echo "## Painéis ativos (15+2 consolidados)"
echo "matriculas, inadimplencia, dre_dashboard, faturamento/funnel, beneficios, pessoas_rh, quadro_docente, layers_comunidade, layers_payments, zeev, pesquisa_satisfacao, avaliacoes_inep, educacional, erros_operacionais + painel_kpi_executivo_resumido + painel_resumo_operacional."
echo
echo "## Prefixos KPI Ouro"
echo "M=Matrículas, C=Cobrança/Comercial, E=Endividamento/Educacional, R/F/S=RH/Fin/Satisfação, L/B/Z=Layers/Benefícios/Zeev, I/Q/N=INEP/Quality/NPS, D/A=DRE/Avaliações. Persistir por kpi_id (estável), nunca label_pt."
} > "$OUT"
echo "OK: $OUT ($(wc -l < "$OUT") linhas)"
