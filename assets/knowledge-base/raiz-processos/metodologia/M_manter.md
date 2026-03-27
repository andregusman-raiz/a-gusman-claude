# Fase M — Manter

> Comparar antes e depois, medir resultados reais e alimentar o proximo ciclo de melhoria.

---

## Contexto

A fase Manter fecha o ciclo PRISM e abre o proximo. Seu objetivo e responder: **"As melhorias funcionaram? O que aprendemos?"**

Esta fase so deve ser executada **apos a implementacao das melhorias** da Fase S (pelo menos a Onda 1). Ela re-ingere dados atualizados, recalcula as mesmas metricas da Fase R e compara com o baseline para medir o impacto real.

Alem de medir, esta fase identifica efeitos colaterais (melhorias que criaram novos problemas), melhorias que nao surtiram efeito, e oportunidades para o proximo ciclo. Isso garante melhoria continua em vez de esforcos pontuais.

---

## Input Esperado

- Arquivo `R_fluxos.md` do ciclo anterior (metricas baseline)
- Arquivo `S_melhorias.md` do ciclo anterior (melhorias implementadas)
- Arquivos `.jsonl` **atualizados** em `dados/processados/` (dados pos-melhoria)
- Informacao sobre quais melhorias foram de fato implementadas

---

## Prompt para Claude Code

```
Voce e um analista de processos organizacionais. Execute a Fase M (Manter) do PRISM-Lite.

PROCESSO ALVO: [PROCESSO]
PROCESS_HINT: [PROCESS_HINT]
CICLO ANTERIOR: [CICLO_DIR_ANTERIOR]
DIRETORIO DE DADOS ATUALIZADOS: dados/processados/
DIRETORIO DO CICLO ATUAL: [CICLO_DIR]

INSTRUCOES:

1. LER INPUTS DO CICLO ANTERIOR
   Leia os seguintes arquivos do ciclo anterior:
   - [CICLO_DIR_ANTERIOR]/R_fluxos.md → metricas baseline e gaps originais
   - [CICLO_DIR_ANTERIOR]/S_melhorias.md → melhorias priorizadas e metas

   Extraia:
   - Todas as metricas baseline da Fase R
   - Lista de melhorias com seus KPIs e metas
   - Gaps originais identificados

2. RE-INGERIR DADOS ATUALIZADOS
   Leia os arquivos .jsonl atualizados em dados/processados/.
   Filtre por process_hint == "[PROCESS_HINT]".
   Use SOMENTE registros com timestamp POSTERIOR ao ciclo anterior
   para garantir que sao dados pos-melhoria.

   Confirme o periodo dos dados novos:
   - Data inicio: [primeiro timestamp pos-ciclo anterior]
   - Data fim: [ultimo timestamp disponivel]
   - Total de registros novos: N

3. RECALCULAR METRICAS
   Calcule as MESMAS metricas da Fase R usando os dados pos-melhoria:

   a) Tempo de ciclo (cycle time):
      - Media, mediana, minimo, maximo

   b) Taxa de retrabalho:
      - % de instancias com retorno a etapa anterior

   c) Tempo de espera:
      - Media entre etapas

   d) Volume:
      - Instancias por mes

   e) Outras metricas que foram usadas como KPI nas melhorias

   IMPORTANTE: Usar a mesma metodologia de calculo da Fase R para
   garantir comparabilidade.

4. COMPARAR ANTES x DEPOIS
   Para cada metrica, monte a comparacao:
   - Valor baseline (Fase R do ciclo anterior)
   - Valor atual (recalculado)
   - Variacao absoluta e percentual
   - Meta definida na Fase S
   - Meta atingida? SIM/NAO/PARCIAL

5. AVALIAR CADA MELHORIA
   Para cada melhoria da Fase S:

   a) Status de implementacao: Implementada | Parcial | Nao implementada | Abandonada
   b) Se implementada:
      - KPI atingiu a meta? Comparar baseline → meta → real
      - Evidencia nos dados de que a melhoria funcionou
      - Efeitos colaterais (positivos ou negativos)
   c) Se nao implementada:
      - Motivo (se conhecido)
      - Recomendacao: manter no proximo ciclo? reformular? descartar?

6. IDENTIFICAR O QUE FUNCIONOU E O QUE NAO FUNCIONOU
   Agrupe as melhorias em categorias:

   FUNCIONOU: Melhorias com meta atingida ou superada
   - [lista com evidencia]

   FUNCIONOU PARCIALMENTE: Melhoria visivel mas meta nao atingida
   - [lista com evidencia e analise de por que nao atingiu 100%]

   NAO FUNCIONOU: Nenhuma melhoria mensuravel
   - [lista com hipoteses de por que nao funcionou]

   EFEITO COLATERAL: Problemas novos criados pelas melhorias
   - [lista com descricao e impacto]

7. DEFINIR FOCO DO PROXIMO CICLO
   Com base na analise:

   a) Gaps que persistem: quais problemas originais continuam?
   b) Gaps novos: problemas que nao existiam antes
   c) Melhorias para re-planejar: as que nao funcionaram
   d) Sugestao de proximo processo a analisar (se este estiver estavel)
   e) Ajustes na metodologia: alguma fase precisa de mais dados? fontes faltantes?

8. SALVAR OUTPUT
   Salve o resultado como [CICLO_DIR]/M_comparativo.md usando o template abaixo.
```

---

## Template de Output

```markdown
# M — Comparativo Antes/Depois: [PROCESSO]

**Data do ciclo**: YYYY-MM-DD
**Ciclo anterior**: [CICLO_DIR_ANTERIOR]
**Periodo baseline**: DD/MM/YYYY a DD/MM/YYYY
**Periodo pos-melhoria**: DD/MM/YYYY a DD/MM/YYYY
**Melhorias implementadas**: N de N planejadas

---

## 1. Comparativo de Metricas

| Metrica | Baseline (Fase R) | Meta (Fase S) | Valor Atual | Variacao | Meta Atingida? |
|---------|-------------------|---------------|-------------|----------|----------------|
| Tempo de ciclo (media) | N dias | N dias | N dias | -N dias (-N%) | SIM/NAO/PARCIAL |
| Tempo de ciclo (mediana) | N dias | — | N dias | -N dias (-N%) | — |
| Taxa de retrabalho | N% | N% | N% | -N pp | SIM/NAO/PARCIAL |
| Tempo de espera medio | N dias | N dias | N dias | -N dias (-N%) | SIM/NAO/PARCIAL |
| Volume mensal | N/mes | — | N/mes | +/-N | — |
| [Outras metricas] | ... | ... | ... | ... | ... |

**Resumo**: [1-2 frases sobre o resultado geral — melhorou/piorou/estavel]

---

## 2. Avaliacao por Melhoria

| Melhoria | Problema | Gap Origem | Metrica Antes | Metrica Depois | Variacao |
|----------|----------|-----------|---------------|----------------|----------|

### M[N]: [Titulo da Melhoria]

| Campo | Detalhe |
|-------|---------|
| **Status** | Implementada / Parcial / Nao implementada / Abandonada |
| **KPI** | [nome da metrica] |
| **Baseline** | [valor] |
| **Meta** | [valor] |
| **Real** | [valor] |
| **Resultado** | Meta atingida / Parcial / Nao atingida |

**Evidencia nos dados**:
- [Descricao da evidencia com referencia a registros]

**Efeitos colaterais**:
- [Positivos ou negativos, se houver]

---

[Repetir bloco para cada melhoria]

---

## 3. O Que Funcionou

| # | Melhoria | Resultado | Fator de Sucesso |
|---|----------|-----------|-----------------|
| 1 | M[N]: [titulo] | [resultado quantificado] | [por que funcionou] |
| ... | ... | ... | ... |

**Licoes aprendidas (positivas)**:
- [licao 1]
- [licao 2]

---

## 4. O Que Nao Funcionou

| # | Melhoria | Resultado | Hipotese |
|---|----------|-----------|---------|
| 1 | M[N]: [titulo] | [resultado ou "sem melhoria"] | [por que nao funcionou] |
| ... | ... | ... | ... |

**Licoes aprendidas (negativas)**:
- [licao 1]
- [licao 2]

---

## 5. Efeitos Colaterais

| # | Descricao | Origem | Impacto | Acao Necessaria |
|---|-----------|--------|---------|-----------------|
| 1 | [efeito nao previsto] | M[N] | [positivo/negativo + impacto] | [acao] |
| ... | ... | ... | ... | ... |

---

## 6. Foco do Proximo Ciclo

### Gaps que persistem
| Gap Original | Status | Recomendacao |
|-------------|--------|-------------|
| G[N]: [descricao] | Parcialmente resolvido | Re-analisar na Fase I |
| G[N]: [descricao] | Sem melhoria | Reformular abordagem |

### Gaps novos identificados
| # | Descricao | Evidencia | Severidade Estimada |
|---|-----------|-----------|---------------------|
| GN1 | [descricao] | [fonte.jsonl] | P0/P1/P2/P3 |

### Melhorias para re-planejar
| ID Original | Melhoria | Nova Abordagem Sugerida |
|------------|----------|------------------------|
| M[N] | [titulo] | [sugestao reformulada] |

### Recomendacao geral
- [ ] Continuar ciclo PRISM neste processo (gaps persistem)
- [ ] Processo estabilizado — mover para monitoramento passivo
- [ ] Iniciar ciclo PRISM em processo relacionado: [sugestao]

### Ajustes metodologicos
- [Sugestoes de ajuste no proprio PRISM para proximos ciclos]
- [Fontes adicionais a incluir]
- [Metricas adicionais a rastrear]

---

## 7. Resumo Executivo

**Em 1 paragrafo**: [Resumo do resultado do ciclo PRISM completo — o que foi feito,
o que melhorou, o que falta, proximo passo recomendado. Escrito para apresentar
a stakeholders nao-tecnicos.]

---

## [N]. Plano de Monitoramento Continuo

Metricas a serem acompanhadas apos o encerramento deste ciclo:

| Metrica | Baseline (pre) | Atual (pos) | Alvo | Threshold de Alerta | Frequencia | Owner |
|---------|---------------|------------|------|---------------------|-----------|-------|
| Cycle time | [N dias] | [N dias] | [N dias] | > [N dias] → escalar | Semanal | [papel] |
| Retrabalho | [N%] | [N%] | [N%] | > [N%] → investigar | Mensal | [papel] |

**Check de sustentabilidade**:
- [ ] Revisao aos 3 meses: metricas mantidas? (agendar para DD/MM/YYYY)
- [ ] Revisao aos 6 meses: beneficios consolidados? (agendar para DD/MM/YYYY)

**Criterio de regressao**: Se qualquer metrica retornar a >80% do valor baseline por 2 semanas consecutivas, abrir novo ciclo PRISM-Lite focado nesse problema.
```

---

## Criterio de Done

A fase M esta concluida quando:

- [ ] Dados pos-melhoria ingeridos e filtrados (periodo claro e distinto do baseline)
- [ ] Mesmas metricas da Fase R recalculadas com mesma metodologia
- [ ] Tabela comparativa antes/depois preenchida com variacao e status da meta
- [ ] Cada melhoria da Fase S avaliada individualmente (implementada ou nao)
- [ ] Secao "O que funcionou" com evidencias e fatores de sucesso
- [ ] Secao "O que nao funcionou" com hipoteses
- [ ] Efeitos colaterais documentados
- [ ] Foco do proximo ciclo definido (gaps persistentes, novos, melhorias a reformular)
- [ ] Resumo executivo escrito em linguagem acessivel
- [ ] Plano de monitoramento continuo definido com metricas, thresholds e owners
- [ ] Checks de sustentabilidade agendados (3 e 6 meses)
- [ ] Arquivo `M_comparativo.md` salvo no diretorio do ciclo
