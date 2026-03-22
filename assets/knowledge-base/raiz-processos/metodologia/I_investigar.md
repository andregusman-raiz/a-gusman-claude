# Fase I — Investigar

> Analise de causa raiz para cada gap identificado, com classificacao de severidade e estimativa de impacto.

---

## Contexto

A fase Investigar transforma observacoes em diagnosticos. Enquanto a Fase R identifica **o que** esta divergente, esta fase descobre **por que** esta divergente.

Cada gap da Fase R e submetido a uma analise de causa raiz usando a tecnica dos 5 Porques (5 Whys), cruzando evidencias de multiplas fontes. O resultado e uma lista priorizada de problemas com severidade, causa raiz, evidencias e estimativa de impacto.

Esta fase exige rigor: afirmacoes sem evidencia nos dados devem ser sinalizadas como hipoteses, nao como conclusoes.

---

## Input Esperado

- Arquivo `R_fluxos.md` do ciclo atual (output da Fase R)
- Arquivo `P_inventario.md` do ciclo atual (para referencia de fontes)
- Arquivos `.jsonl` filtrados pelo processo alvo (para aprofundamento)

---

## Prompt para Claude Code

```
Voce e um analista de processos organizacionais. Execute a Fase I (Investigar) do PRISM-Lite.

PROCESSO ALVO: [PROCESSO]
PROCESS_HINT: [PROCESS_HINT]
FLUXOS (Fase R): [CICLO_DIR]/R_fluxos.md
INVENTARIO (Fase P): [CICLO_DIR]/P_inventario.md
DIRETORIO DE DADOS: dados/processados/
DIRETORIO DO CICLO: [CICLO_DIR]

INSTRUCOES:

1. LER INPUTS
   Leia R_fluxos.md para obter a lista de gaps e metricas baseline.
   Leia P_inventario.md para referencia das fontes e atores.

2. ANALISE 5 PORQUES PARA CADA GAP
   Para cada gap listado na tabela de gaps do R_fluxos.md:

   a) Enuncie o problema de forma clara e especifica
   b) Aplique a tecnica dos 5 Porques:
      - Por que 1: [resposta baseada em dados]
      - Por que 2: [aprofundamento]
      - Por que 3: [aprofundamento]
      - Por que 4: [aprofundamento]
      - Por que 5: [causa raiz identificada]

      REGRAS dos 5 Porques:
      - Cada "por que" deve ser respondido com evidencia de dados quando possivel
      - Se a evidencia vier de diagnosticos (entrevistas), cite a fonte
      - Se nao houver evidencia, marque como "[HIPOTESE]" e sugira como validar
      - Pode parar antes de 5 se a causa raiz for evidente
      - Pode ir alem de 5 se necessario

   c) Identifique a CAUSA RAIZ final (ultimo "por que" respondido)

3. CRUZAMENTO DE FONTES
   Para cada problema, cruze informacoes de pelo menos 2 fontes diferentes:
   - Zeev diz X, emails confirmam/contradizem?
   - TOTVS mostra Y, Zeev mostra Z — consistente?
   - Diagnostico diz W, dados confirmam?

   Documente concordancias e discordancias entre fontes.

4. CLASSIFICACAO DE SEVERIDADE
   Classifique cada problema:

   | Severidade | Criterio |
   |-----------|---------|
   | P0 — Critico | Impacto financeiro direto, risco legal/compliance, ou processo completamente quebrado |
   | P1 — Alto | Impacto significativo em tempo/custo, afeta multiplos atores, recorrente |
   | P2 — Medio | Impacto moderado, solucao alternativa existe mas e ineficiente |
   | P3 — Baixo | Incomodo operacional, impacto limitado, baixa frequencia |

4b. SCORING DE CONFIANCA
   Para cada causa raiz identificada, atribua um score de confianca:

   | Confianca | Criterio |
   |-----------|----------|
   | 90-100% | Evidencia quantitativa de 3+ fontes concordantes |
   | 70-89% | Evidencia de 2 fontes + confirmacao qualitativa (diagnosticos) |
   | 50-69% | Evidencia de 1 fonte quantitativa OU 2+ fontes qualitativas |
   | 30-49% | Apenas evidencia qualitativa (entrevistas) sem dados |
   | <30% | Hipotese sem evidencia — marcar como [HIPOTESE] |

   O score de confianca sera usado pela Fase S para ajustar risco das melhorias.
   Causas com confianca < 50% devem ter plano de validacao antes de gerar melhoria.

5. ESTIMATIVA DE IMPACTO
   Para cada problema, estime o impacto em:

   a) Tempo: horas/dias perdidos por instancia do processo
      - Calculo: [tempo real - tempo esperado] * [volume mensal]
      - Exemplo: "3 dias extras por instancia * 15 instancias/mes = 45 dias/mes desperdicados"

   b) Custo (quando possivel):
      - Custo de retrabalho (horas * custo/hora estimado)
      - Custo de atraso (penalidades, oportunidade perdida)
      - Custo direto (se dados TOTVS disponiveis)

   c) Risco:
      - Risco de compliance
      - Risco reputacional
      - Risco operacional

   Se nao for possivel quantificar, use escala qualitativa (alto/medio/baixo)
   e justifique.

6. IDENTIFICAR PADROES TRANSVERSAIS
   Apos analisar todos os gaps individualmente, identifique:
   - Causas raiz que aparecem em multiplos gaps (causa sistemica)
   - Atores sobrecarregados (aparecem em muitos problemas)
   - Etapas que concentram problemas
   - Padroes temporais (problemas pioram em certos periodos?)

7. SALVAR OUTPUT
   Salve o resultado como [CICLO_DIR]/I_causas_raiz.md usando o template abaixo.
```

---

## Template de Output

```markdown
# I — Analise de Causa Raiz: [PROCESSO]

**Data do ciclo**: YYYY-MM-DD
**Referencias**: R_fluxos.md, P_inventario.md
**Gaps analisados**: N

---

## 1. Resumo de Problemas

| # | Gap Origem | Problema | Severidade | Causa Raiz | Confianca | Impacto (Tempo) | Impacto (Custo) | Evidencia |
|---|-----------|---------|-----------|------------|-----------|-----------------|-----------------|-----------|
| P1 | G[N] | [descricao curta] | P0/P1/P2/P3 | [causa raiz em 1 linha] | [N%] | N dias/mes | R$ N/mes | [fontes] |
| P2 | G[N] | ... | ... | ... | ... | ... | ... | ... |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Impacto total estimado**: N dias/mes | R$ N/mes (quando quantificavel)

---

## 2. Analise Detalhada por Problema

### Problema P[N]: [Titulo Descritivo]

**Gap de origem**: G[N] do R_fluxos.md
**Severidade**: P0/P1/P2/P3
**Enunciado**: [Descricao clara e especifica do problema]

**Analise 5 Porques**:

1. **Por que [o problema acontece]?**
   → [Resposta] | Evidencia: [fonte.jsonl #registros]

2. **Por que [resposta anterior]?**
   → [Resposta] | Evidencia: [fonte.jsonl #registros]

3. **Por que [resposta anterior]?**
   → [Resposta] | Evidencia: [fonte] ou [HIPOTESE — validar com: sugestao]

4. **Por que [resposta anterior]?**
   → [Resposta] | Evidencia: [fonte]

5. **Por que [resposta anterior]?**
   → **CAUSA RAIZ**: [descricao da causa raiz]

**Confianca Agregada**: [N%] — Justificativa: [evidencia de N fontes, concordancia X%]

**Cruzamento de fontes**:
- Fonte A ([nome]): [o que diz]
- Fonte B ([nome]): [o que diz]
- Concordancia/Discordancia: [analise]

**Estimativa de impacto**:
- Tempo: [N horas/dias por instancia] * [N instancias/mes] = [total/mes]
- Custo: [calculo ou qualitativo]
- Risco: [descricao]

---

[Repetir bloco para cada problema]

---

## 3. Padroes Transversais

### Causas sistemicas
- **[Causa]**: Aparece nos problemas P[N], P[N], P[N]
  Descricao: [por que e sistemica e nao pontual]

### Atores sobrecarregados
| Ator | Papel | Problemas envolvido | Observacao |
|------|-------|---------------------|------------|
| [Nome] | [Papel] | P[N], P[N] | [ex: gargalo de aprovacao] |

### Etapas criticas
| Etapa | Problemas associados | Tempo total perdido |
|-------|---------------------|---------------------|
| [Etapa] | P[N], P[N] | N dias/mes |

### Padroes temporais
- [Descricao de padroes, se identificados]

---

## 4. Hipoteses a Validar

| # | Hipotese | Como validar | Fonte necessaria |
|---|---------|-------------|-----------------|
| H1 | [hipotese sem evidencia suficiente] | [metodo de validacao] | [dado necessario] |
| ... | ... | ... | ... |

---

## 5. Priorizacao para Fase S

**Ordem sugerida de resolucao (por impacto + viabilidade)**:
1. P[N] — [justificativa: maior impacto, causa clara]
2. P[N] — [justificativa]
3. P[N] — [justificativa]
...

**Dependencias entre problemas**:
- P[N] depende de P[N] (resolver causa sistemica primeiro)
- P[N] e P[N] podem ser resolvidos em paralelo
```

---

## 6. Validacao com Stakeholders (OBRIGATORIO antes de Fase S)

Antes de prosseguir para a Fase S, os achados DEVEM ser apresentados ao(s) dono(s) do processo.

| Problema | Apresentado para | Feedback | Status |
|----------|-----------------|----------|--------|
| P[N] | [nome/papel] | [concordou/discordou/ajustou] | Validado/Ajustado/Invalidado |

**Ajustes pos-validacao**:
- [Descrever mudancas nos achados baseadas no feedback dos stakeholders]

**Desacordos registrados**:
- [Se stakeholder discorda de causa raiz, registrar a visao dele E manter a analise de dados. Ambas vao para Fase S.]
```

---

## Criterio de Done

A fase I esta concluida quando:

- [ ] Todos os gaps da Fase R foram analisados com 5 Porques (ou justificativa para menos)
- [ ] Cada problema tem causa raiz identificada
- [ ] Evidencias citadas com referencia a fonte e registros (ou marcadas como [HIPOTESE])
- [ ] Cruzamento de fontes realizado (minimo 2 fontes por problema quando disponiveis)
- [ ] Severidade P0-P3 atribuida a cada problema
- [ ] Impacto estimado em tempo e/ou custo para cada problema
- [ ] Padroes transversais identificados (causas sistemicas, gargalos)
- [ ] Hipoteses sem evidencia listadas com metodo de validacao
- [ ] Priorizacao sugerida para Fase S
- [ ] Achados apresentados a pelo menos 1 stakeholder do processo
- [ ] Feedback registrado e ajustes incorporados
- [ ] Arquivo `I_causas_raiz.md` salvo no diretorio do ciclo
