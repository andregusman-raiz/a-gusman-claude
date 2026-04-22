# Predictive Systems — Guard Rails

> Quando projeto treina modelo, faz predicao, classifica, ou forecasting: invocar `/ag-referencia-anti-ciclo-preditivo`.

## Quando aplicar (gatilhos)

**Palavras-chave no prompt:**
- "modelo", "modelar", "predizer", "prever", "forecast", "forecasting"
- "classificar", "classificador", "scoring", "score"
- "churn", "inadimplencia", "default", "fraud", "anomaly"
- "recomendacao", "recommender", "ranking"
- "treinar", "fit", "backtest", "walkforward"

**Arquivos/paths:**
- `model/`, `models/`, `engine_*/`, `pipeline/`
- `*.pkl`, `*.joblib`, `*.onnx`
- `predictions/`, `scoring/`, `forecasting/`
- Jupyter notebooks com `sklearn`, `xgboost`, `lightgbm`, `pytorch`, `tensorflow`

**Comandos/tooling:**
- `pytest tests/model/`, `pytest tests/predictions/`
- `python train.py`, `python backtest.py`, `python replay.py`

## Acao

1. Invocar `/ag-referencia-anti-ciclo-preditivo` para carregar 30 regras + tier selector
2. Detectar tier da tarefa:
   - **Tier 1** (exploracao, prototipagem): 4 regras ativas
   - **Tier 2** (implementacao de feature/pipeline): 12 regras ativas
   - **Tier 3** (pilot/shadow-mode/live): todas as 30
3. Aplicar as **5 CRITICAS** inegociaveis em qualquer tier:
   - **M1** — Pre-registered Falsification Contract (PFC) antes do teste
   - **M3** — Look-Ahead Inspection Gate (LAIG) em cada feature/target
   - **M11** — Independence Audit entre camadas do pipeline
   - **M16** — Baseline Parity (modelo simples + heuristica ANTES de complexo)
   - **A2** — Noise-Floor-Corrected Threshold (≥ 2× noise floor medido)

## Bloqueios automaticos

Se qualquer uma das 5 criticas falhar:
- Resultado positivo → status = `UNCERTIFIED`, nao declarar edge
- Hook CI bloqueia merge de report de viabilidade sem PFC commitado
- Hook CI bloqueia PR que adiciona modelo sem baseline parity

## Composicao com regras globais

- Herda `root-cause-debugging.md` (analisar causa raiz antes de fix)
- Herda `edit-persistence-safety.md` (git diff apos edicoes)
- Herda `fix-verification.md` (adaptar: verificar sinal preditivo end-to-end, nao so metrica isolada)
- Herda protocolo Rewrite + Routing (anunciar Tier escolhido + regras ativas)

## Integracao com machines

- **ag-1-construir** ao criar feature preditiva: Tier 2 obrigatorio
- **ag-4-teste-final** em modelos: null test + stratified test como gates
- **ag-7-qualidade**: adicionar dimensao PREDICTIVE quando ha modelo
- **ag-9-auditar**: incluir audit de premissa-raiz (M7) + independence (M11)

## Referencia completa

Skill: `/ag-referencia-anti-ciclo-preditivo`
Historico do projeto-fonte: `~/Claude/GitHub/betting-prediction/reports/ANTI_CYCLE_RULES.md`
SPEC original de transformacao: `~/Claude/docs/specs/anti-ciclo-preditivo/SPEC.md`
