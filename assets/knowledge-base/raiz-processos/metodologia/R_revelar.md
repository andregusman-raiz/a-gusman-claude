# Fase R — Revelar

> Reconstruir o fluxo REAL do processo comparando com o fluxo formal e identificar lacunas.

---

## Contexto

A fase Revelar responde a pergunta central da melhoria de processos: **"Como este processo realmente funciona, e onde isso diverge de como deveria funcionar?"**

Organizacoes frequentemente tem dois processos: o documentado (formal) e o praticado (real). As divergencias entre eles sao onde moram os problemas — retrabalho, gargalos, decisoes informais, atalhos e etapas fantasma.

Esta fase usa os dados inventariados na Fase P para reconstruir ambos os fluxos e mapear as lacunas com evidencias concretas. Tambem calcula metricas baseline que serao usadas na Fase M para comparacao pos-melhoria.

---

## Input Esperado

- Arquivo `P_inventario.md` do ciclo atual (output da Fase P)
- Arquivos `.jsonl` filtrados pelo processo alvo
- Conhecimento do `process_hint` e dos atores identificados

---

## Prompt para Claude Code

```
Voce e um analista de processos organizacionais. Execute a Fase R (Revelar) do PRISM-Lite.

PROCESSO ALVO: [PROCESSO]
PROCESS_HINT: [PROCESS_HINT]
INVENTARIO (Fase P): [CICLO_DIR]/P_inventario.md
DIRETORIO DE DADOS: dados/processados/
DIRETORIO DO CICLO: [CICLO_DIR]

INSTRUCOES:

1. LER INVENTARIO
   Leia o arquivo P_inventario.md para entender quais fontes estao disponiveis,
   quantos registros existem, e quais atores foram identificados.

2. MAPEAR FLUXO FORMAL
   Usando os registros de fonte "politicas" e "zeev" (se disponiveis):
   - Extraia as etapas documentadas/configuradas do processo
   - Identifique a sequencia oficial de passos
   - Liste aprovadores/responsaveis formais por etapa
   - Documente SLAs ou prazos definidos (se houver)
   Se nao houver politicas ou Zeev, registre: "Fluxo formal nao documentado"
   e use diagnosticos (entrevistas) como fonte alternativa.

   Represente o fluxo como lista numerada:
   1. [Etapa] → Responsavel → Prazo esperado
   2. [Etapa] → Responsavel → Prazo esperado
   ...

3. MAPEAR FLUXO REAL
   Usando TODOS os registros disponiveis (emails, totvs, hubspot, diagnosticos, zeev):
   - Reconstrua a sequencia real de eventos usando timestamps
   - Identifique quem realmente executa cada etapa (pode diferir do formal)
   - Detecte etapas que existem na pratica mas nao no formal (etapas fantasma)
   - Detecte etapas formais que sao puladas na pratica
   - Identifique loops (idas e vindas entre etapas)
   - Identifique bifurcacoes (caminhos alternativos informais)

   Represente o fluxo real como lista numerada, anotando divergencias:
   1. [Etapa] → Quem realmente faz → Tempo real medio
      ⚠ Divergencia: [descricao]
   ...

4. IDENTIFICAR GAPS (LACUNAS)
   Compare os dois fluxos e liste cada divergencia encontrada:
   - Etapas formais que nao acontecem na pratica
   - Etapas informais que nao estao documentadas
   - Responsaveis diferentes do previsto
   - Prazos reais vs. prazos formais
   - Aprovacoes que sao bypassadas
   - Comunicacoes laterais (ex: emails resolvendo o que deveria ser workflow)

   Para cada gap, cite a EVIDENCIA nos dados:
   - "emails.jsonl registros #X, #Y mostram que Joao aprova em vez de Maria"
   - "zeev.jsonl mostra SLA de 3 dias, mas timestamps em totvs.jsonl mostram media de 11 dias"

5. CALCULAR METRICAS BASELINE
   Com base nos dados, calcule as seguintes metricas (quando possivel):

   a) Tempo de ciclo (cycle time):
      - Tempo medio do inicio ao fim do processo (usar timestamps)
      - Tempo mediano
      - Tempo minimo e maximo

   b) Taxa de retrabalho (rework rate):
      - % de instancias que voltam a uma etapa anterior
      - Etapas com mais retrabalho

   c) Tempo de espera (waiting time):
      - Tempo medio entre etapas (tempo parado)
      - Etapas com maior tempo de espera

   d) Volume:
      - Instancias por mes
      - Tendencia (crescente/estavel/decrescente)

   e) Outras metricas relevantes ao processo:
      - Taxa de aprovacao/rejeicao (se aplicavel)
      - Custo medio por instancia (se dados TOTVS disponiveis)

   Se alguma metrica nao for calculavel por falta de dados, registre
   como "Nao calculavel — [motivo]" e sugira como obter o dado.

6. SALVAR OUTPUT
   Salve o resultado completo como [CICLO_DIR]/R_fluxos.md usando o template abaixo.
```

---

## Template de Output

```markdown
# R — Fluxos e Lacunas: [PROCESSO]

**Data do ciclo**: YYYY-MM-DD
**Referencia**: P_inventario.md
**Fontes utilizadas nesta fase**: [listar]

---

## 1. Fluxo Formal (Como Deveria Ser)

**Fonte primaria**: [politicas/zeev/diagnosticos/nao documentado]

| # | Etapa | Responsavel Formal | Prazo/SLA | Observacao |
|---|-------|--------------------|-----------|------------|
| 1 | [Nome da etapa] | [Papel/pessoa] | [N dias] | |
| 2 | ... | ... | ... | |
| ... | ... | ... | ... | |

**Total de etapas formais**: N
**Prazo total formal**: N dias

---

## 2. Fluxo Real (Como Realmente Acontece)

**Fontes**: [emails, zeev, totvs, etc.]
**Base de instancias analisadas**: N instancias

| # | Etapa Real | Quem Faz | Tempo Real Medio | Divergencia |
|---|-----------|----------|-----------------|-------------|
| 1 | [Nome da etapa] | [Pessoa/papel] | [N dias] | [Nenhuma / descricao] |
| 2 | ... | ... | ... | ... |
| * | [Etapa fantasma] | [Quem] | [N dias] | Nao existe no fluxo formal |
| ... | ... | ... | ... | ... |

**Total de etapas reais**: N (formal: N)
**Tempo real medio total**: N dias (formal: N dias)

---

## 3. Tabela de Gaps (Lacunas)

| # | Tipo de Gap | Descricao | Impacto Estimado | Evidencia |
|---|------------|-----------|-----------------|-----------|
| G1 | Etapa fantasma | [descricao] | +N dias no ciclo | [fonte.jsonl registros #X, #Y] |
| G2 | Etapa pulada | [descricao] | Risco de [X] | [fonte.jsonl registros #X] |
| G3 | Responsavel divergente | [descricao] | [impacto] | [evidencia] |
| G4 | SLA estourado | [descricao] | +N dias | [evidencia com timestamps] |
| G5 | Comunicacao lateral | [descricao] | [impacto] | [emails.jsonl registros #X] |
| ... | ... | ... | ... | ... |

**Total de gaps identificados**: N

---

## 4. Metricas Baseline

| Metrica | Valor | Base de Calculo | Observacao |
|---------|-------|-----------------|------------|
| Tempo de ciclo (media) | N dias | N instancias | |
| Tempo de ciclo (mediana) | N dias | N instancias | |
| Tempo de ciclo (min) | N dias | | |
| Tempo de ciclo (max) | N dias | | |
| Taxa de retrabalho | N% | N de N instancias | Etapa [X] mais recorrente |
| Tempo de espera medio | N dias | | Maior espera em etapa [X] |
| Volume mensal | N/mes | Periodo de N meses | Tendencia: [crescente/estavel/decrescente] |
| Taxa de aprovacao | N% | | Se aplicavel |
| Custo medio/instancia | R$ N | | Se dados disponiveis |

**Metricas nao calculaveis**:
- [Metrica]: [motivo] — Sugestao: [como obter o dado]

---

## 5. Sintese para Proxima Fase

**Principais achados**:
1. [Achado mais relevante]
2. [Segundo achado]
3. [Terceiro achado]

**Gaps prioritarios para investigacao (Fase I)**:
- G[N]: [justificativa da prioridade]
- G[N]: [justificativa]

**Alertas**:
- [Qualquer limitacao ou risco na analise]
```

---

## Criterio de Done

A fase R esta concluida quando:

- [ ] Fluxo formal mapeado (ou registrado como "nao documentado")
- [ ] Fluxo real reconstruido com base em dados de multiplas fontes
- [ ] Tabela de gaps preenchida com no minimo 3 lacunas (ou justificativa se menos)
- [ ] Cada gap tem evidencia citada com referencia a fonte e registros
- [ ] Metricas baseline calculadas (ou justificadas como nao calculaveis)
- [ ] Gaps priorizados para Fase I
- [ ] Arquivo `R_fluxos.md` salvo no diretorio do ciclo
