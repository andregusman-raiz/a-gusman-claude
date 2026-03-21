---
name: ag-X-46-buscar-voos
description: "Busca passagens aereas reais via Google Flights (fast-flights). Retorna tabela com cia, horarios, duracao e precos em BRL. Use when searching for flights, airfare, or travel options."
model: haiku
argument-hint: "[origem] [destino] [data ida] [data volta]"
disable-model-invocation: true
---

# ag-X-46 — Buscar Voos

Spawn the `ag-X-46-buscar-voos` agent to search real-time flight prices via Google Flights.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-X-46-buscar-voos`
- `mode`: `auto`
- `run_in_background`: `false`
- `prompt`: Compose from template below + $ARGUMENTS

**NOTE**: NOT background — user needs to see flight results immediately.

## Prompt Template

```
Origem: [IATA code, e.g. GRU, CGH, SDU, GIG, BSB]
Destino: [IATA code]
Data ida: [YYYY-MM-DD]
Data volta: [YYYY-MM-DD, optional]


Buscar voos reais via fast-flights (Google Flights).
Apresentar resultados em tabela: Cia | Saida | Chegada | Duracao | Paradas | Preco BRL.
Ordenar por preco (menor primeiro).
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- Do NOT run in background — results are needed immediately
- Requires `fast-flights` Python package (auto-installs if missing)
- Data source: Google Flights via Protobuf (no API key needed)
