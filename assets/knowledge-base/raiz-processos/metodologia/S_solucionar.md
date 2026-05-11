# Fase S — Solucionar

> Priorizar problemas e recomendar melhorias concretas com dono, KPI, risco e cronograma.

---

## Contexto

A fase Solucionar transforma diagnosticos em acoes. Usando a analise de causa raiz da Fase I, esta fase cria um portfolio de melhorias priorizadas por impacto e esforco.

O objetivo nao e criar um plano perfeito, mas um plano **pragmatico**: identificar quick wins que geram resultado rapido e melhorias estruturais que resolvem causas sistemicas. Cada melhoria e documentada como um "card" autocontido com tudo que um responsavel precisa para executar.

---

## Input Esperado

- Arquivo `I_causas_raiz.md` do ciclo atual (output da Fase I)
- Arquivo `R_fluxos.md` do ciclo atual (para referencia de metricas baseline)
- Arquivo `P_inventario.md` do ciclo atual (para referencia de atores)

---

## Prompt para Claude Code

```
Voce e um analista de processos organizacionais. Execute a Fase S (Solucionar) do PRISM-Lite.

PROCESSO ALVO: [PROCESSO]
PROCESS_HINT: [PROCESS_HINT]
CAUSAS RAIZ (Fase I): [CICLO_DIR]/I_causas_raiz.md
FLUXOS (Fase R): [CICLO_DIR]/R_fluxos.md
INVENTARIO (Fase P): [CICLO_DIR]/P_inventario.md
DIRETORIO DO CICLO: [CICLO_DIR]

INSTRUCOES:

1. LER INPUTS
   Leia I_causas_raiz.md para obter os problemas priorizados, causas raiz e impactos.
   Leia R_fluxos.md para referencia das metricas baseline.
   Leia P_inventario.md para referencia dos atores e papeis.

1b. CONSULTAR KNOWLEDGE BASE DE SISTEMAS (OBRIGATORIO)
   ANTES de propor qualquer melhoria que envolva TOTVS RM, Zeev ou HubSpot:
   - Buscar na knowledge base (knowledge/) documentacao oficial do sistema relevante
   - Para Zeev: consultar knowledge/zeev/kb/ (374 paginas de docs) e knowledge/zeev/specs/endpoints.jsonl (98 endpoints API)
   - Para TOTVS RM: consultar knowledge/totvs/specs/totvs_rm_specs.jsonl (263 specs, 1053 endpoints)
   - Para HubSpot: consultar knowledge/hubspot/ (quando disponivel)

   Cada recomendacao que envolver um desses sistemas DEVE incluir:
   - Referencia a doc oficial (URL ou path do KB)
   - Endpoint especifico da API (quando aplicavel)
   - Parametros de configuracao reais (nao genericos)
   - Limitacoes conhecidas documentadas

   Se a knowledge base NAO tiver informacao suficiente, indicar "Necessita validacao com documentacao do fornecedor" no campo de riscos.

2. GERAR MELHORIAS CANDIDATAS
   Para cada problema (ou grupo de problemas com causa raiz comum), proponha
   1 a 3 melhorias possiveis. Para cada melhoria:

   - Descricao clara do que fazer (acao, nao intencao)
   - Tipo: Quick Win | Melhoria Estrutural | Automacao | Mudanca de Politica | Treinamento
   - Qual causa raiz resolve (referencia a Fase I)
   - Qual gap resolve (referencia a Fase R)

   REGRAS:
   - Melhorias devem ser ACIONAVEIS (algo que alguem pode fazer, nao "melhorar a comunicacao")
   - Cada melhoria deve ter resultado mensuravel
   - Preferir melhorias simples a complexas
   - Se uma melhoria resolve multiplos problemas, destacar isso

3. CLASSIFICAR IMPACTO E ESFORCO
   Para cada melhoria candidata, avalie:

   IMPACTO (1 a 5):
   5 = Elimina problema P0/P1, economia >20 dias/mes ou >R$10k/mes
   4 = Reduz significativamente problema P0/P1, economia 10-20 dias/mes
   3 = Resolve problema P2, economia 5-10 dias/mes
   2 = Melhora problema P2/P3, economia 1-5 dias/mes
   1 = Melhoria marginal, <1 dia/mes

   ESFORCO (1 a 5):
   1 = Implementavel em <1 dia, sem dependencia, sem custo
   2 = 1-5 dias, uma pessoa, custo minimo
   3 = 1-2 semanas, equipe pequena, custo moderado
   4 = 2-4 semanas, multiplas equipes ou aprovacao necessaria
   5 = >1 mes, projeto dedicado, custo significativo ou mudanca organizacional

4. MONTAR MATRIZ IMPACTO x ESFORCO
   Posicione cada melhoria na matriz:

   - Quick Wins: Impacto >= 3 E Esforco <= 2 → PRIORIDADE MAXIMA
   - Projetos estrategicos: Impacto >= 4 E Esforco >= 3 → PLANEJAR
   - Melhorias incrementais: Impacto <= 2 E Esforco <= 2 → FAZER SE SOBRAR TEMPO
   - Desperdicio de esforco: Impacto <= 2 E Esforco >= 3 → NAO FAZER

5. CRIAR CARDS DE MELHORIA
   Para cada melhoria priorizada (Quick Wins + Projetos estrategicos), crie um card:

   CARD DE MELHORIA:
   - ID: M[N]
   - Titulo: [nome descritivo da melhoria]
   - Tipo: Quick Win | Melhoria Estrutural | Automacao | Mudanca de Politica | Treinamento
   - Problema(s) resolvido(s): P[N], P[N]
   - Descricao: [o que fazer, passo a passo, em 3-5 bullet points]
   - Dono sugerido: [papel/pessoa — baseado nos atores do P_inventario.md]
   - KPI de sucesso: [metrica mensuravel + meta]
     Ex: "Tempo de ciclo reduzido de 15 dias (baseline) para 8 dias"
     Ex: "Taxa de retrabalho reduzida de 30% para <10%"
   - Baseline atual: [valor atual da metrica, extraido de R_fluxos.md]
   - Meta: [valor alvo pos-melhoria]
   - Riscos: [o que pode dar errado na implementacao]
   - Mitigacao: [como reduzir cada risco]
   - Timeline: [estimativa de prazo para implementacao]
   - Dependencias: [outras melhorias ou pre-requisitos]

6. DEFINIR SEQUENCIA DE IMPLEMENTACAO
   Ordene as melhorias em ondas:

   - Onda 1 (imediata, 0-2 semanas): Quick Wins
   - Onda 2 (curto prazo, 2-6 semanas): Melhorias com dependencias resolvidas
   - Onda 3 (medio prazo, 6-12 semanas): Projetos estruturais

   Justifique a ordem com base em dependencias e impacto acumulado.

7. ESTIMAR RETORNO TOTAL
   Some o impacto estimado de todas as melhorias priorizadas:
   - Tempo total recuperavel: N dias/mes
   - Custo total evitavel: R$ N/mes (quando quantificavel)
   - Riscos eliminados: [listar]

8. SALVAR OUTPUT
   Salve o resultado como [CICLO_DIR]/S_melhorias.md usando o template abaixo.
```

---

## Template de Output

```markdown
# S — Melhorias Priorizadas: [PROCESSO]

**Data do ciclo**: YYYY-MM-DD
**Referencias**: I_causas_raiz.md, R_fluxos.md, P_inventario.md
**Problemas analisados**: N
**Melhorias propostas**: N (N priorizadas, N descartadas)

---

## 1. Matriz Impacto x Esforco

```
IMPACTO
  5 |           [M3]           [M7]
  4 |     [M1]          [M5]
  3 |  [M2]       [M6]
  2 |                         [M8]
  1 |        [M4]
    +---+---+---+---+---+---
      1   2   3   4   5  ESFORCO
```

| ID | Melhoria | Impacto | Esforco | Quadrante |
|----|----------|---------|---------|-----------|
| M1 | [titulo] | 4 | 2 | Quick Win |
| M2 | [titulo] | 3 | 1 | Quick Win |
| M3 | [titulo] | 5 | 3 | Projeto Estrategico |
| M4 | [titulo] | 1 | 2 | Fazer se sobrar tempo |
| M5 | [titulo] | 4 | 3 | Projeto Estrategico |
| M6 | [titulo] | 3 | 3 | Avaliar |
| M7 | [titulo] | 5 | 5 | Projeto Estrategico |
| M8 | [titulo] | 2 | 4 | Nao fazer |

---

## 2. Cards de Melhoria

### M[N]: [Titulo da Melhoria]
- **Problema resolvido**: P[N] (de I_causas_raiz.md)
- **Gap de origem**: G[N] (de R_fluxos.md)

| Campo | Detalhe |
|-------|---------|
| **Tipo** | Quick Win / Melhoria Estrutural / Automacao / Mudanca de Politica / Treinamento |
| **Problema(s)** | P[N], P[N] |
| **Impacto** | [N]/5 |
| **Esforco** | [N]/5 |
| **Dono sugerido** | [Papel/pessoa] |
| **Timeline** | [N dias/semanas] |

**Descricao (o que fazer)**:
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]
4. [Passo 4] (se necessario)
5. [Passo 5] (se necessario)

**KPI de sucesso**:
- Metrica: [nome da metrica]
- Baseline atual: [valor — de R_fluxos.md]
- Meta: [valor alvo]
- Como medir: [metodo de medicao]

**Riscos e mitigacao**:
| Risco | Probabilidade | Mitigacao |
|-------|-------------|-----------|
| [risco 1] | Alta/Media/Baixa | [acao] |
| [risco 2] | Alta/Media/Baixa | [acao] |

**Referencia doc oficial** (quando envolver TOTVS RM, Zeev ou HubSpot):
- Sistema: [TOTVS RM | Zeev | HubSpot]
- Doc: [URL ou path da pagina no KB]
- Endpoint: [METHOD /path — se aplicavel]
- Config: [parametro ou menu especifico]
- Limitacoes: [restricoes documentadas]

**Dependencias**: [M[N] ou nenhuma]

---

[Repetir card para cada melhoria priorizada]

---

## 3. Sequencia de Implementacao

### Onda 1 — Imediata (0-2 semanas)
| ID | Melhoria | Dono | Prazo |
|----|----------|------|-------|
| M[N] | [titulo] | [dono] | [data] |
| M[N] | [titulo] | [dono] | [data] |

**Impacto esperado da Onda 1**: [tempo/custo recuperado]

### Onda 2 — Curto Prazo (2-6 semanas)
| ID | Melhoria | Dono | Prazo | Dependencia |
|----|----------|------|-------|-------------|
| M[N] | [titulo] | [dono] | [data] | M[N] |

**Impacto acumulado apos Onda 2**: [tempo/custo]

### Onda 3 — Medio Prazo (6-12 semanas)
| ID | Melhoria | Dono | Prazo | Dependencia |
|----|----------|------|-------|-------------|
| M[N] | [titulo] | [dono] | [data] | M[N], M[N] |

**Impacto acumulado apos Onda 3**: [tempo/custo]

---

## 4. Retorno Estimado

| Metrica | Situacao Atual | Meta Pos-Melhorias | Reducao |
|---------|---------------|-------------------|---------|
| Tempo de ciclo | N dias | N dias | -N dias (-N%) |
| Taxa de retrabalho | N% | N% | -N pp |
| Tempo de espera | N dias | N dias | -N dias |
| Custo/instancia | R$ N | R$ N | -R$ N (-N%) |

**Retorno total estimado**:
- Tempo recuperado: N dias/mes
- Custo evitavel: R$ N/mes
- Riscos eliminados: [lista]

---

## 5. Melhorias Descartadas

| ID | Melhoria | Motivo de Descarte |
|----|----------|--------------------|
| M[N] | [titulo] | Esforco desproporcional ao impacto |
| ... | ... | ... |

---

## 6. Proximos Passos

1. Validar melhorias com stakeholders (especialmente donos sugeridos)
2. Implementar Onda 1 (quick wins)
3. Agendar Fase M apos implementacao da Onda 1 (sugestao: [data])
4. [Outros passos especificos ao processo]
```

---

## Criterio de Done

A fase S esta concluida quando:

- [ ] Todas as causas raiz da Fase I tem pelo menos 1 melhoria candidata
- [ ] Cada melhoria candidata tem impacto (1-5) e esforco (1-5) avaliados
- [ ] Matriz impacto x esforco montada com quadrantes identificados
- [ ] Cards de melhoria criados para todos os Quick Wins e Projetos Estrategicos
- [ ] Cada card tem: dono, KPI com baseline e meta, riscos, timeline
- [ ] Sequencia de implementacao em ondas definida
- [ ] Retorno total estimado calculado
- [ ] Melhorias descartadas listadas com justificativa
- [ ] Arquivo `S_melhorias.md` salvo no diretorio do ciclo
