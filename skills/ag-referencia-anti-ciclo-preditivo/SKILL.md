---
name: ag-referencia-anti-ciclo-preditivo
description: "30+ regras anti-ciclo para sistemas preditivos (classificacao, regressao, forecasting, anomaly, scoring, recommendation). Derivadas de diagnostico ultra-hard de 13 ciclos falhos em projeto preditivo real. Reference skill carregada on-demand."
context: fork
---

# Anti-Ciclo Preditivo — Regras Universais

> 30 regras derivadas de diagnostico pos-mortem de um sistema preditivo que consumiu 6 meses e 13 iteracoes sem confirmar sinal preditivo. Custo de descobrir cada regra = ~2 semanas de ciclo real. Aplicaveis a qualquer projeto: churn, inadimplencia, fraud, forecasting, scoring, anomaly, recommendation.

**Escopo:** compoe com `~/Claude/CLAUDE.md` (workspace) e CLAUDE.md local do projeto.

**Quando carregar:** inicio de qualquer projeto preditivo, antes de treinar modelo, antes de declarar "sinal detectado", antes de deploy de pipeline preditivo.

---

## Navegacao

- [I — Epistemologia (M1-M10)](#i--epistemologia-m1-m10)
- [II — Arquitetura (M11-M15)](#ii--arquitetura-m11-m15)
- [III — Decisao (R1-R3)](#iii--decisao-r1-r3)
- [IV — Data Coverage (DC1-DC3)](#iv--data-coverage-dc1-dc3)
- [V — Multi-segmento (S1-S3)](#v--multi-segmento-s1-s3)
- [VI — Particoes/Populacoes (P1-P3)](#vi--particoesparticoes-p1-p3)
- [VII — Metodologia (M16-M18)](#vii--metodologia-m16-m18)
- [VIII — Ground-truth (G1-G3)](#viii--ground-truth-g1-g3)
- [IX — Adversariais (A1-A3)](#ix--adversariais-a1-a3)
- [X — Meta-regra de composicao (tiers + 5 criticas)](#x--meta-regra-de-composicao)
- [Apendice A — Mapa sintoma → regra](#apendice-a--mapa-sintoma--regra)
- [Apendice B — Enforcement roadmap](#apendice-b--enforcement-roadmap)
- [Apendice C — Aplicacao em projetos Raiz](#apendice-c--aplicacao-em-projetos-raiz)

---

## Vocabulario agnostico

| Termo | Significado |
|---|---|
| **Sinal preditivo** | Lift estatisticamente significativo de um modelo/estrategia sobre baseline trivial |
| **Ground-truth observavel** | Valor real do target, acessivel apenas apos o instante de decisao T-0 |
| **Baseline forte** | Modelo simples (regressao linear, heuristica de negocio, regra de ouro) + fonte de referencia externa confiavel |
| **Walkforward / OOT** | Validacao temporal onde treino usa apenas dados <T e teste usa dados >=T |
| **Kill-criterion** | Criterio pre-registrado de abandono do projeto (threshold + amostra minima + CI) |
| **Null test** | Teste com labels embaralhadas / assignment aleatorio para calibrar noise floor |
| **Noise floor** | Magnitude de efeito produzida sob hipotese nula (zero sinal) por artefato matematico |
| **Metrica primaria** | Metrica que define sucesso do projeto (ROI, F1, recall@K, precision, AUC, Brier, log-loss, etc) |
| **Metrica de calibracao** | Metrica que mede "quao bem-calibradas sao as probabilidades" (Brier, log-loss, ECE, reliability) |
| **Ciclo N** | N-esima iteracao de "vou melhorar o sistema"; ciclos tipicos sao 2-4 semanas cada |

---

## I — Epistemologia (M1-M10)

### M1 — Pre-registered Falsification Contract (PFC)

**Texto:** Antes de iniciar qualquer analise/fase, escrever em `specs/<analysis>-PFC.md`:
- "Espero X"
- "Se encontrar Y, isso falsifica a tese"
- "Se encontrar Z, confirma"
- "Considero resultado positivo **somente apos** Y-check executado e negativo"

**Gatilho:** inicio de fase que produzira report de viabilidade (backtest, modelo, feature study, pilot).

**Enforcement:** gate CI — nenhum report positivo aceito como `CERTIFIED` sem PFC commitado ANTES. Hook de pre-commit verifica existencia de PFC referenciado. Sem PFC → report marcado `UNCERTIFIED`.

**Ciclos prevenidos:** todo padrao "resultado positivo aceito sem esforco simetrico de falsificacao".

---

### M2 — Walkforward-First Rule

**Texto:** Metrica agregada (ROI, AUC, Brier, F1, recall) so pode ser reportada se calculada em regime walkforward-safe (ou OOT holdout). Toda funcao de backtest **deve** ter flag `walkforward=True` obrigatorio e default. Modo `walkforward=False` exige justificativa + aviso: `DESCRIPTIVE ONLY, NOT PREDICTIVE`.

**Gatilho:** qualquer script que computa metrica agregada de modelo.

**Enforcement:** hook PR bloqueia merge se script de backtest/replay nao tem flag walkforward.

---

### M3 — Look-Ahead Inspection Gate (LAIG)

**Texto:** Para cada feature, target, ou fonte de ground-truth num pipeline, responder em comentario obrigatorio:
> "No instante T-0 (decisao), esta quantidade e observavel?"

- Sim → OK
- Nao → feature/fonte e `future_info` — pipeline nao pode usa-la
- "Depende" → suspeita, tratar como `future_info` por default

**Gatilho:** toda PR que toca pipeline/model/replay/target definition.

**Enforcement:** checklist obrigatorio em PR template. Reviewer marca cada feature nova com LAIG tag. Hook bloqueia merge sem secao "LAIG audit" no corpo.

**Exemplo generico:** usar `valor_acordo_fechado` para predizer probabilidade de pagamento. LAIG: "esse valor e observavel no T-0?" → NAO, e posterior. Bloqueado.

**Ciclos prevenidos:** o padrao mais toxico — look-ahead silencioso que infla metrica.

---

### M4 — Goalpost Lock

**Texto:** Thresholds de gate (CI95_low, metrica minima, AUC minimo, Bonferroni N, p-value) sao escritos no ADR **antes** de rodar o teste. Relaxar threshold durante ou apos teste exige novo ADR que declara explicitamente: "estou mudando o gate porque o teste falhou, e isto reduz a confianca desta descoberta".

**Gatilho:** qualquer mudanca de threshold em scripts/gates/ADRs/test config.

**Enforcement:** script `scripts/audit_goalposts.py` extrai gates de cada ADR e diff contra codigo. Se gates diminuiram sem novo ADR → bloqueio de commit.

---

### M5 — Null Hypothesis Promotion Parity

**Texto:** Para cada teste, declarar ex-ante o resultado sob hipotese nula (placebo, shuffle labels, random assignment). Reportar numero esperado sob H0 com mesma prominencia que resultado observado. Reports devem ter, em ordem:
1. Observed result
2. H0 expected result
3. P-value + Bonferroni threshold
4. Diferenca observed - H0 em unidades naturais

**Gatilho:** qualquer report de viabilidade.

**Enforcement:** template `reports/TEMPLATE_viability.md`. Reviewer rejeita reports sem secao H0.

---

### M6 — Sunk-Cost Declaration

**Texto:** Quando uma fase e declarada "ARQUIVAR" ou kill-criterion evocado, o proximo commit no mesmo dominio exige flag `--override-archived-verdict` com justificativa em ADR: "por que a decisao de arquivar esta sendo revista, qual evidencia NOVA surgiu".

**Gatilho:** deteccao de palavra `ARQUIVAR` / `non-viable` / `FAILURE_CRITERION` / `kill-criterion` em ADR/report.

**Enforcement:** hook detecta ADR com palavra e bloqueia commits subsequentes no mesmo scope sem ADR de override.

**Padrao toxico prevenido:** "nova metodologia salvadora" que reabre fase arquivada sem evidencia nova — apenas troca a linguagem do fracasso.

---

### M7 — Premissa-Raiz Verification Cadence

**Texto:** A cada 3 ciclos (ou 8 semanas, o que vier primeiro), executar explicitamente:
- "Sob dados/dominio atuais, qual o prior de que exista sinal preditivo detectavel?"
- Responder em numeros: "com base em literatura [refs], em dominios similares, prior de sinal >+X e estimado em **Y%**"
- Se prior < 30%, todo teste futuro deve ter forca estatistica para superar prior × likelihood, nao apenas p-value

**Gatilho:** passagem de 3 ciclos ou 8 semanas desde ultima verificacao.

**Enforcement:** arquivo `docs/specs/premissa-raiz-log.md` com cadence obrigatoria. Ciclo sem entry no log nao pode iniciar nova fase.

---

### M8 — Agnostic Result Language Enforcement

**Texto:** Banir dos reports:
- "REAL SIGNAL indicated"
- "BREAKTHROUGH"
- "MASSIVE"
- "CONFIRMED"
- "sinal robusto" (quando n<500)
- "promissor" (sem null test)

Substituir por:
- "Results consistent with signal ≥+X under assumption Y"
- "Further tests (Z, W) required to discriminate signal from noise"

**Gatilho:** escrita de qualquer report de resultado.

**Enforcement:** linter de report bloqueia frases banidas.

---

### M9 — Cross-Lens Sign-Off

**Texto:** Achados positivos de uma lente so sao promovidos se validados por ≥2 lentes ortogonais:
- Statistical (walkforward) + Economic (bootstrap do impacto) + Operational (pilot)
- Uma so nao basta; duas correlatas (recall e hit rate medindo a mesma coisa) nao contam como 2

**Gatilho:** claim de "sinal detectado" em qualquer report.

**Enforcement:** report inclui secao "Cross-lens validation: [X, Y, Z]". Revisao manual verifica ortogonalidade.

---

### M10 — Time-to-Falsification Budget

**Texto:** Cada fase recebe orcamento fixo: **X dias para construir, Y dias para falsificar**. `Y / (X+Y) >= 0.4`. Sem orcamento de falsificacao pre-alocado, fase nao pode comecar. Se Y estoura sem falsificar, resultado e `INCOMPLETE — did not attempt full falsification`.

**Gatilho:** kickoff de nova fase.

**Enforcement:** ADR de fase inclui secao "Time budget" com split build/falsify explicito.

---

## II — Arquitetura (M11-M15)

### M11 — Independence Audit between Layers

**Texto:** Cada arquitetura com decomposicao em camadas prova via data lineage que nenhuma feature-fonte aparece em ambos os lados de um suposto "dual gate" ou "consensus filter". Audit commitada em ADR; PR hook valida.

**Gatilho:** toda arquitetura multi-camada nova (pipeline com ≥2 estagios de predicao/validacao).

**Enforcement:** arquivo `docs/architecture/<pipeline>-lineage.md` obrigatorio. PR que modifica pipeline multi-camada sem update do lineage e bloqueada.

**Exemplo:** pipeline de fraud detection com camada de regras + camada ML. Se ambas leem a mesma feature-fonte de upstream, "dual-gate" e teatro — gates nao sao independentes, apenas redundantes.

---

### M12 — Portfolio/Pipeline Stress Test

**Texto:** Antes de pilot/shadow-mode, simular 10k cenarios com correlacao realista inter-predicao. Pior caso (drawdown, false-positive storm, cascata de acoes) em percentil 95 <= limite operacional. Se violado, ajustar sizing/rate-limit antes de go-live.

**Gatilho:** qualquer deploy de pipeline que gera acao operacional (alertas, decisoes, alocacoes).

**Enforcement:** script `scripts/pipeline_stress_test.py` obrigatorio antes de ativacao. Output `reports/stress_test_*.json` referenciado em PR de ativacao.

---

### M13 — Assumption Coverage Ledger

**Texto:** Toda camada de pipeline mantem `assumptions.md` listando premissas com status:
- TESTADA
- PARCIAL
- NUNCA-TESTADA
- FALSIFICADA

PR que modifica camada sem atualizar ledger e bloqueado. Proporcao FALSIFICADA+NUNCA-TESTADA visivel em dashboard.

**Gatilho:** toda PR que toca camada multi-layer.

**Enforcement:** hook CI le `assumptions.md`. Se proporcao NUNCA-TESTADA+FALSIFICADA > 50%, warning critico em PR.

---

### M14 — Target Change Requires ADR + New Kill-Criterion

**Texto:** Trocar target primario (ex: target A → target B) exige ADR `target-change-*.md` com:
- Nova formulacao (definicao matematica)
- LAIG-check (M3)
- Amostra minima (power calc)
- Kill-criterion pre-registrado (M1)
- Sunk-cost declaration (M6) se ocorrer apos kill-criterion anterior

**Gatilho:** qualquer mudanca em definicao de target.

**Enforcement:** hook detecta mudanca em target e bloqueia commit sem ADR matching.

---

### M15 — Architecture Alternative Ledger

**Texto:** Toda revisao arquitetural cataloga ≥5 alternativas com pros/cons/custo. Escolher sem catalogo publico e forbidden.

**Gatilho:** mudanca arquitetural significativa.

**Enforcement:** ADR de arquitetura inclui secao "Alternativas consideradas" com ≥5 opcoes. Reviewer rejeita ADR sem catalogo.

---

## III — Decisao (R1-R3)

### R1 — Grid Search Obrigatorio antes de "Production Defaults"

**Texto:** Qualquer parametro com impacto em metrica primaria (threshold, fracao, cap, strategy) DEVE ter grid search documentado em ADR antes de ser declarado "production default". Default de construtor **nao** e otimizacao. Convencao de literatura **nao** substitui grid no dataset alvo. Se grid nao foi feito, documentar como `# TODO: grid search pending`.

**Gatilho:** qualquer parametro numerico em pipeline que afete decisao operacional.

**Enforcement:** hook detecta literal numerico em params e exige comentario `# grid: <ADR-ref>` ou `# TODO: grid search pending`.

---

### R2 — Null-Floor + Bonferroni Obrigatorios em Claim de Metrica-de-Calibracao+

**Texto:** Qualquer claim de metrica de calibracao positiva (Brier gain, log-loss drop, AUC lift) DEVE ser validado contra:

1. **Noise-floor correction** (via Monte Carlo sob null no dataset real — medir bias matematico que aparece mesmo com zero sinal)
2. **Bonferroni adjustment** (α_indiv = α/N configs testadas)
3. **Null test via random resampling** (≥1000 trials)
4. **CI95 exclusivo de zero** E n_observacoes >= 500

Metrica-de-calibracao+ sem metrica-primaria+ (ex: AUC+ sem precision@K+ util) e teatro de tail-effect. Comunicar como "sinal descritivo" nao "edge validado".

**Gatilho:** report contendo metrica de calibracao em conclusao.

**Enforcement:** linter rejeita report com claim positivo sem secao de noise-floor + Bonferroni.

---

### R3 — Defaults Herdados de Observacao com Look-Ahead — PROIBIDOS

**Texto:** Defaults operacionais estabelecidos por observacao em replay/backtest sem walkforward honesto sao **proibidos** em producao. Em walkforward real, podem ser o PIOR subset. So usar apos re-validacao especifica em cada dataset/particao.

**Gatilho:** uso de flag/filtro que foi "estabelecido empiricamente" sem walkforward.

**Enforcement:** documentacao explicita desaconselhando uso. Flag permanece para compatibilidade apenas com warning.

---

## IV — Data Coverage (DC1-DC3)

### DC1 — Feature Computada ≠ Feature Ativa

**Texto:** Antes de implementar nova feature, verificar se ela ja existe no schema mas nao esta no feature-set ativo do modelo.

**Gatilho:** proposta de nova feature em PR.

**Enforcement:** checklist em PR template: "verifiquei que feature nao existe ainda no schema". Comando sugerido:
```bash
grep -rn "<feature_name>" scripts/ engine_*/ model/
```

---

### DC2 — Temporal Audit Obrigatorio em Tabelas com `snapshot_at` / `captured_at`

**Texto:** Para qualquer tabela com coluna temporal:
1. Rodar: `SELECT COUNT(DISTINCT EXTRACT(HOUR FROM snapshot_at)) FROM <tabela>`
2. Se `n_distinct_hours = 1` → suspeito de scraping derivado, nao real-time
3. Verificar campo `derived_from` se existir
4. So usar como rolling de eventos passados se look-ahead nao for descartavel

**Gatilho:** ingestao ou uso de qualquer tabela com coluna de timestamp.

**Enforcement:** script `scripts/audit_snapshot_temporal.py` obrigatorio antes de incluir tabela em features.

---

### DC3 — Bug Check: Features NULL em 100% Apesar de Fonte Preenchida

**Texto:** Ao computar nova feature, checar se ela nao esta NULL em 100% dos casos apesar da fonte estar preenchida. Comando:
```sql
SELECT COUNT(<col>), COUNT(*) FROM <schema>.<tabela>;
```
Se `COUNT(col) = 0` mas fonte tem dados, ETL esta quebrado.

**Gatilho:** novo report que usa feature recentemente injetada.

**Enforcement:** hook CI checa coverage de features declaradas ativas. Warning critico se `coverage < 1%`.

---

## V — Multi-segmento (S1-S3)

### S1 — Segment Triage First

**Texto:** Antes de rodar pipeline em segmento X, verificar que X tem ≥N observacoes com ground-truth historico. Se nao tem, segmento e NAO-TESTAVEL e nao justifica build de pipeline — dead end estrutural.

N tipico: 1000 para classificacao binaria com prevalencia >10%; 500 para regressao.

**Gatilho:** proposta de expandir pipeline para novo segmento/cohort/mercado.

**Enforcement:** script `scripts/check_segment_coverage.py` obrigatorio antes de PR que adiciona suporte a segmento.

---

### S2 — Structural-Cost Gate for Signal Claims

**Texto:** Qualquer claim de sinal em segmento Y deve superar custo estrutural (spread, ruido de medicao, custo operacional). Se `observed_lift <= structural_cost`, claim esta dentro do spread — nao e sinal real, e microestrutura.

**Gatilho:** report de viabilidade de segmento.

**Enforcement:** template inclui secao "Structural cost accounting".

---

### S3 — Metrica-A+ ≠ Metrica-B+ (Enforcement de metrica primaria)

**Texto:** NUNCA reportar metrica secundaria positiva (AUC+, Brier+) como sinal de valor sem reportar metrica primaria (ROI, precision@K, recall util) no mesmo n. Se primaria CI95 cruza 0 ou e negativa, secundaria+ e teatro.

**Gatilho:** report contendo metrica secundaria.

**Enforcement:** linter rejeita report com metrica secundaria+ sem secao de metrica primaria ex-post.

**Padrao tipico prevenido:** celebrar "AUC 0.75!" sem reportar que precision@top10% e 12% vs 10% de baseline — diferenca nao-acionavel operacionalmente.

---

## VI — Particoes/Populacoes (P1-P3)

### P1 — Benchmark Forte Obrigatorio

**Texto:** Particao/populacao so e testavel se tem referencia forte (ground-truth de qualidade + baseline human-level ou regulatory) com ≥500 observacoes cobertas. Sem benchmark forte, analise e descritiva, nao prescritiva.

**Gatilho:** proposta de expandir para particao/populacao nova sem baseline conhecido.

**Enforcement:** check de coverage como S1 mas para particoes. Documentar benchmark em ADR.

---

### P2 — Artifact Decomposition Check

**Texto:** Antes de celebrar gap alto (efeito t-stat > 20) entre fonte primaria e consenso, controlar por qualidade diferencial das fontes. Gap pode ser artefato de fontes de baixa qualidade no consenso, nao sinal. Verificacao: decompor gap em "qualidade da fonte" vs "sinal residual".

**Gatilho:** claim de gap alto em nova particao.

**Enforcement:** report inclui secao "Gap decomposition: quality vs signal".

---

### P3 — Drift Temporal Audit

**Texto:** Antes de modelar com sample ≥3 eras (≥5 anos), checar drift temporal em metrica de calibracao. Se metrica mudou ≥10% ou prevalencia do target mudou ≥5pp, treinar apenas em era recente (ultimos 2-3 anos) ou modelar regime change explicitamente.

**Gatilho:** qualquer modelo treinado em sample ≥5 anos.

**Enforcement:** report de modelo inclui secao "Era stability check".

---

## VII — Metodologia (M16-M18)

### M16 — Methodology Swap Requires PFC + Baseline Parity

**Texto:** Trocar familia metodologica (LGBM → Neural → Bayesian → Ensemble → RL) exige ADR com PFC (M1) + baseline forte rodado ANTES da familia nova.

**Baseline forte =** modelo simples (regressao linear/logistica) + heuristica de negocio + benchmark externo de referencia.

Se familia nova nao supera baseline por:
- Brier delta ≥0.003 **ou**
- Metrica primaria com CI95 exclusivo

→ familia e arquivada com verdict. Nao iterar na familia nova esperando "melhorar".

**Gatilho:** proposta de mudar familia de modelo.

**Enforcement:** ADR de mudanca de familia inclui secao "Baseline results" com numeros ANTES de rodar familia nova. Hook CI rejeita PR sem baseline.

**Padrao toxico prevenido:** "nova metodologia salvadora" — troca de linguagem do fracasso sem evidencia nova.

---

### M17 — Null Test Mandatory for Metric-Primary+ Claims

**Texto:** Qualquer claim de metrica primaria > 0 em ensemble, stacking, ou consensus-filter precisa de null shuffle test (N≥30 permutacoes) reportado junto. Observed vs null distribution com CI95. Se observed nao excluir null CI95, claim e rejeitada.

**Gatilho:** report com claim de metrica primaria+ em ensemble/consensus.

**Enforcement:** linter detecta "ensemble" + claim positivo e exige secao "Null test".

---

### M18 — Anomaly/Regime Detection Needs Orthogonality Proof

**Texto:** Claim de "anomalia detectada" ou "regime ineficiente identificado" requer proof of orthogonality a features de forca do caso base. Test: anomaly-flag + (top 10% da feature dominante) overlap < 30%. Se ≥30%, flag e heterocedasticidade confound (nao novo signal), arquivada.

**Gatilho:** modelo de anomaly detection ou regime identification.

**Enforcement:** report inclui secao "Orthogonality to dominant features". Overlap com top-decile da feature dominante reportado explicitamente.

**Padrao toxico prevenido:** celebrar confound de "valor alto" ou "volume alto" como edge — so esta identificando tails, nao padroes.

---

## VIII — Ground-truth (G1-G3)

### G1 — Heteroscedasticity Control em "Erro Preditivo"

**Texto:** Toda analise que modela brier/cross-entropy/erro-absoluto de probabilidades como target deve reportar:

1. AUC/MAE do modelo full (mercado + features)
2. AUC/MAE do modelo market-only baseline (so features derivadas de ground-truth)
3. AUC/MAE do modelo non-market (so features independentes)
4. Se signal cai para ~0 no non-market, reportar explicitamente "signal e heterocedasticidade trivial, nao exploravel"
5. **Obrigatorio:** stratified test dentro de cada bin da feature dominante (5 bins recomendados). Effect que nao sobrevive estratificacao e artefato.

**Gatilho:** modelo cujo target e funcao de probabilidade de ground-truth.

**Enforcement:** template de report de modelo inclui 5 variantes obrigatorias.

---

### G2 — Confounding Check para Segmentos Nicho

**Texto:** Antes de propor estrategia baseada em segmento nicho (ex: "clientes tipo X", "eventos de manager change", "casos pos-regulatorio"):
1. Calcular feature dominante (media/prevalencia) do segmento vs rest_of_universe
2. Se `delta > 0.05` (5pp/5%), segmento e confounded com a feature dominante
3. Teste obrigatorio stratificado: dentro de cada bin da feature dominante, segmento ainda mostra delta significativo com Bonferroni N × T?
4. Se nao, NAO usar como feature de selecao

**Gatilho:** proposta de estrategia segmentada.

**Enforcement:** ADR de nova estrategia segmentada inclui tabela stratified.

**Incidente de referencia:** analise tipica encontra 30+ segmentos com p<Bonferroni em analise marginal, 0 sobrevivem estratificacao.

---

### G3 — Cross-Source Parity Check (nao assumir "fonte X e o professor")

**Texto:** Antes de arquitetar sistema que trata fonte X como ground-truth absoluto, calcular:
1. Metrica de calibracao de X no overlap com segunda fonte Y
2. Paired t-test entre os dois
3. Se `|delta| < 0.005` em Brier (consistente com ruido cross-sectional), duas fontes sao intercambiaveis — arquitetura **nao deve privilegiar** uma.

**Gatilho:** arquitetura que usa uma fonte como ground-truth soberano.

**Enforcement:** ADR de arquitetura inclui secao "Cross-source parity check".

---

## IX — Adversariais (A1-A3)

### A1 — Timestamp Fidelity Check

**Texto:** Nunca confiar em flags temporais (`is_first_observation`, `is_last_observation`, `is_opening`, `is_closing`) sem metadado real de timestamp. Exigir `captured_at` real e filtrar por quanto antes do evento o dado foi capturado. Definir "first" = capturado ≥Xh pre-evento (X especifico do dominio); everything else e "late" (categoria diferente).

Para provar "fonte X lagueia fonte Y", provar com timestamps distintos (nao sinteticos/imputados).

**Gatilho:** qualquer sistema que depende de flags temporais.

**Enforcement:** check obrigatorio:
```sql
SELECT EXTRACT(EPOCH FROM (captured_at - event_time))/3600 AS hours_before
FROM <tabela>
WHERE <flag>=true
GROUP BY ...;
```
Se >50% tem `hours_before < 1h` → flag e sintetica, tratar como "late".

**Incidente de referencia:** premissa fundacional do projeto ("fonte A e mais rapida que fonte B") virou nao-testavel quando auditoria revelou 100% dos pares com gap=0h — timestamps imputados, nao reais.

---

### A2 — Noise-Floor-Corrected Threshold

**Texto:** Substituir threshold absoluto de metrica por threshold noise-floor-corrigido. Para cada metrica, medir via Monte Carlo (≥10k trials) qual o valor da metrica sob null (zero sinal) no proprio dataset real. Threshold minimo de deteccao deve ser ≥ 2 × noise floor.

Para metricas com transformacao nao-linear (log-odds, ratios, diferencas de probabilidades), Jensen bias pode criar floor positivo sob null.

**Gatilho:** qualquer kill-criterion ou success criterion que usa threshold de metrica.

**Enforcement:** review de ADR rejeita thresholds definidos "por convencao" sem medicao de noise floor no dataset.

**Incidente de referencia:** kill-criterion original de "+0.2%" estava dentro do noise floor (+0.12-0.23% sob null). Threshold de sucesso virou sorte, nao criterio.

---

### A3 — Power Calc + Bootstrap 1000x Obrigatorios

**Texto:** Reportar MDE (minimum detectable effect) em cada estudo. "N=X observacoes e suficiente para detectar sinal de Y com Z% power" — **ANTES** de comecar, nao depois. Bootstrap 1000x obrigatorio para qualquer verdict de viabilidade — nao apenas ponto unico. Distribuicao P(metrica>0) comunica risco real.

**Gatilho:** inicio de qualquer fase / declaracao de verdict.

**Enforcement:** ADR de fase inclui secao "Power analysis" com MDE tabelado. Reports de viabilidade incluem secao "Bootstrap distribution".

**Incidente de referencia:** n=1615 observacoes → power = 4.5% para detectar efeito de +1%. Universo total (5416 observacoes) nunca poderia confirmar efeitos sub-3%. 6 meses em dominio estruturalmente subpowered.

---

## X — Meta-regra de composicao

### Como aplicar as 30 regras sem paralisia

**Principio:** nem toda regra aplica a toda tarefa. Selecao por **risco do output**.

### Classificacao da tarefa (3 tiers)

**Tier 1 — Baixo risco (exploracao, prototipagem):**
- Regras ativas: M1 (PFC leve) + M3 (LAIG) + M8 (agnostic language) + DC1 (feature check)
- Pular: M9 cross-lens, M10 time budget, M12 stress test
- Justificativa: explorar exige velocidade; PFC leve evita aceitar positivo sem criterio

**Tier 2 — Medio risco (implementacao de feature/pipeline):**
- Obrigatorios: **Tier 1** + M2 (walkforward) + M4 (goalpost lock) + M11 (independence) + M13 (assumption ledger) + R1 (grid search) + M16 (baseline parity) + G1 (heterocedasticidade)
- Recomendados: M15 (architecture alternatives), DC2 (temporal audit), DC3 (NULL check)
- Justificativa: implementacao cria codigo que roda decisao; validacao simetrica obrigatoria

**Tier 3 — Alto risco (pilot/shadow-mode/live):**
- Obrigatorios: **Tier 2** + M12 (stress test) + R2 (null-floor + Bonferroni) + R3 (no-look-ahead defaults) + S3 (metrica-A ≠ metrica-B) + M17 (null test) + A1 (timestamp fidelity) + A2 (noise-floor threshold) + A3 (power + bootstrap)
- Justificativa: deploy move recursos (decisoes, dinheiro, clientes) — todos os guards estruturais ativos

---

### 5 regras CRITICAS inegociaveis (falha = bloqueio)

Essas 5 sao obrigatorias **sempre**, em qualquer tier:

1. **M1 — Pre-registered Falsification Contract** — escrever criterio de falsificacao ANTES do teste
2. **M3 — Look-Ahead Inspection Gate** — toda feature responde "observavel em T-0?"
3. **M11 — Independence Audit** — camadas provam lineage nao-overlapping
4. **M16 — Baseline Parity** — baseline simples + heuristica ANTES de modelo complexo
5. **A2 — Noise-Floor-Corrected Threshold** — threshold de deteccao ≥ 2× noise floor medido

Se falhar em aplicar qualquer uma das 5, tarefa nao pode declarar resultado positivo. Hook CI bloqueia.

---

### Workflow sugerido

1. **Kickoff de fase:** escrever PFC (M1) + Power calc (A3) + selecionar Tier → lista de regras ativas
2. **Durante build:** M3 em cada PR (LAIG), M8 em cada report (agnostic language), M13 update assumption ledger
3. **Pre-declaracao de resultado:** rodar checklist de regras Tier-matching. Se falhar qualquer, status = `UNCERTIFIED`
4. **Pre-deploy:** Tier 3 completo + M4 goalpost lock + M10 time budget review
5. **Pos-fase (a cada 3 ciclos):** M7 premissa-raiz re-quantificacao

---

### Quando AGENT decide (modo autonomo)

Se Claude Code esta executando em `/loop` ou autonomo:
- Detectar tier da tarefa pelo escopo (commit em `model/`, `engine_*/`, `pipeline/` = Tier 2/3; report = Tier 2; analise exploratoria = Tier 1)
- Rodar checklist de regras ativas antes de declarar completude
- Se resultado e positivo mas regra critica falha, declarar `UNCERTIFIED — [regra X pendente]` e retornar
- Se resultado e negativo, mesmo sem regras completas, aceitar como valido (null e sempre valido)

---

### Conflitos entre regras

- **M4 (goalpost lock) vs R1 (grid search):** resolucao → grid so permitido ANTES de declarar resultado; depois e goalpost-moving
- **M10 (time budget) vs Tier 1 (exploracao):** resolucao → Tier 1 pula M10
- **M6 (sunk-cost declaration) vs refactor limpo:** resolucao → refactor que nao muda semantica de targets/gates e exempt; qualquer mudanca que toca decisao exige M6

---

### Protocolo Rewrite + Routing (herda de workspace)

Antes de tarefa nao-trivial, emitir preamble:
```
**Rewrite:** [intent condensado]
**Rota:** [ferramenta] — [justificativa]
**Tier:** [1/2/3] — regras ativas: [lista]
**Executando.**
```

---

## Apendice A — Mapa sintoma → regra

Sintomas comuns em projetos preditivos e quais regras os teriam prevenido:

| Sintoma | Regras aplicaveis |
|---|---|
| "Modelo passou em teste mas falhou em producao" | M2 (walkforward), M3 (LAIG) |
| "AUC subiu mas metrica primaria nao melhorou" | S3 (metrica-A ≠ metrica-B), M17 (null test) |
| "Iteramos 5+ ciclos e sinal nunca estabiliza" | M7 (premissa-raiz), M6 (sunk-cost) |
| "Dual-gate passa mas producao falha" | M11 (independence audit) |
| "Threshold continua sendo ajustado para 'destravar'" | M4 (goalpost lock) |
| "Familia de modelo X supera anterior por pouco" | M16 (baseline parity) |
| "Segmento nicho com p<0.001 mas estranho" | G2 (confounding), M18 (ortogonalidade) |
| "Feature 'revolucionaria' detectada em sample grande" | M5 (null parity), A2 (noise floor) |
| "Backtest +50% mas pilot -10%" | M3 (LAIG), A1 (timestamp fidelity) |
| "Modelo melhora em metrica de calibracao, sem impacto operacional" | S3, R2 (null-floor correction) |
| "Amostra grande mas sinal 'sutil' recorrente" | A3 (power calc), A2 (noise floor) |
| "Feature-set explode, overfitting suspeito" | M13 (assumption ledger), DC1 (feature check) |

---

## Apendice B — Enforcement roadmap (ordem de implementacao)

**Semana 1 (fast wins):**
- M8 linter (agnostic language) — 1h
- S3 linter (metrica-A ≠ metrica-B) — 1h
- DC3 coverage check (NULL detection) — 2h
- A2 noise-floor threshold doc — 30min

**Semana 2 (template updates):**
- PFC template (M1) — 4h
- Report template com H0 parity (M5) — 2h
- Viability report template com power + bootstrap (A3) — 3h

**Semana 3 (hooks CI):**
- Goalpost diff check (M4) — 4h
- Sunk-cost detection (M6) — 4h
- Walkforward flag requirement (M2) — 3h

**Semana 4+ (estruturais):**
- Independence audit lineage tool (M11) — 1 semana
- Assumption ledger schema + dashboard (M13) — 1 semana
- Pipeline stress test framework (M12) — 1 semana

---

## Apendice C — Aplicacao em projetos Raiz

Exemplos concretos de como as regras se aplicam a projetos do workspace. **Estes sao exemplos, nao fonte da verdade** — cada projeto mantem sua propria aplicacao em CLAUDE.md local.

### raiz-data-engine — predicao de inadimplencia
- **M3 LAIG:** `valor_acordo_fechado`, `data_acordo_assinado` nao sao observaveis no T-0 da predicao. Features bloqueadas.
- **DC2 temporal audit:** verificar se `ultima_atualizacao` em tabelas HubSpot/Layers reflete timestamp real ou e derivado de sync batch (look-ahead sutil).
- **A3 power calc:** n=41K clientes com historico de 18 meses, MDE de default de 2%, power=80% exige estratificacao por pipeline (empresarial vs particular).

### raiz-platform — predicao de churn
- **M16 Baseline parity:** LogReg + heuristica "ultimo login > 60d" + regra "NPS < 7" ANTES de XGBoost. Se LGBM nao supera Brier delta ≥0.003, arquivar familia.
- **M7 premissa-raiz:** "existe sinal de churn preditivel alem de sazonalidade letiva e eventos de cobranca? Qual prior?" — responder com numeros antes do ciclo 3.
- **G1 heterocedasticidade:** verificar se "erro preditivo" de churn nao colapsa em "clientes proximos do limite de parcelas vencidas" (= tail da feature dominante).

### HubSpot — deal scoring preditivo
- **A3 power:** n=335K deals historicos, MDE de conversao 2%, power=80% — estratificar por pipeline (empresarial/particular/EaD). Subsegmentos podem ser subpowered.
- **G2 confounding:** antes de celebrar "deals com lead_source X convertem 3x mais", verificar se feature dominante (`deal_amount`) explica o delta.
- **M11 independence:** se pipeline combina score HubSpot + modelo interno, provar via lineage que features de origem nao overlap.

### Matriculas — forecasting de demanda
- **M7 premissa-raiz:** "existe sinal preditivo de matriculas alem de (sazonalidade + historico de rechurn + eventos conhecidos)? Qual prior externo?"
- **P3 drift:** 2020-2021 (pandemia) = regime different. Treinar so em 2022+ ou modelar regime change explicitamente.
- **DC2 temporal:** `data_matricula_efetivada` — verificar se reflete timestamp real do evento ou timestamp de sync batch.

### Folha salarial — anomaly detection
- **M18 ortogonalidade:** anomaly-flag nao pode overlapar >30% com `valor_alto` (top 10%). Se overlap > 30%, flag so esta identificando tails.
- **G2 confounding:** antes de celebrar "anomalia em eventos tipo X", estratificar por `valor_total_competencia` em 5 bins. Effect precisa sobreviver em cada bin.
- **M12 stress test:** simular false-positive storm — se pipeline gera 200 alertas/dia, operacional quebra. Rate-limit antes de go-live.

### Sophia educacional — predicao de nota
- **M11 Independence:** se features vem de 2+ modelos upstream (engajamento + frequencia), provar data lineage nao-overlapping.
- **A3 power:** n por curso/turma pode ser baixo. Stratificar power calc por cohort.
- **M16 Baseline:** media historica da turma + nota do ano anterior como baseline antes de qualquer RNN/XGB.

### Benchmark SaaS (ag-10) — scoring comparativo
- **M4 Goalpost lock:** thresholds de "superior/inferior/paridade" escritos ANTES do benchmark rodar. Relaxar apos ver numeros = red flag.
- **M5 H0 parity:** "o que veriamos se app e baseline fossem identicos?" — reportar ao lado do observado.
- **M17 null test:** shuffle labels entre `app` e `baseline`, reportar distribuicao null do Parity Index.

### Lead scoring (layers + HubSpot)
- **G3 cross-source parity:** `hubspot_lead_score` vs `lead_raiz_custom_score` — se delta em Brier < 0.005, fontes sao intercambiaveis; nao privilegiar uma como ground-truth.
- **DC1 feature check:** verificar se features de comportamento ja existem em `layers_*` mas nao estao no feature-set do modelo.
- **S1 triage:** segmentos com n<500 em historico validado → dead end; nao buildar pipeline especifico.

### Vestibular — predicao de aprovacao
- **S1 triage:** por curso, verificar n≥500 historico de candidatos e notas antes de pipeline por curso.
- **P1 benchmark:** nota de corte oficial como baseline forte + media historica do candidato como baseline simples.
- **A1 timestamp:** `simulados_realizados` — verificar `captured_at` distingue tentativas reais vs backfill.

### Zeev — predicao de SLA
- **DC2 temporal audit:** `deadline_atualizado_em` — suspeito de look-ahead se reflete ultimo update e nao quando deadline original foi setado.
- **M16 Baseline:** regra "SLA medio historico do fluxo" + "analista alocado x categoria" como baseline antes de GBM.
- **A2 noise floor:** qual o Brier de predizer "vai atrasar" com zero sinal (base rate + random)? Threshold de deteccao ≥ 2× essa base.

---

## Integracao com agents/machines do workspace

- **ag-1-construir** (ao criar feature preditiva): verificar Tier 2 obrigatorios antes de implementar
- **ag-4-teste-final** (QAT de modelo): rodar null test (M17) + stratified test (G2) como gates
- **ag-7-qualidade** (5D QA): adicionar dimensao PREDICTIVE quando projeto treina modelo
- **ag-9-auditar** (Fortress): incluir audit de premissa-raiz (M7) e independence (M11)

---

**Fim da skill.**
