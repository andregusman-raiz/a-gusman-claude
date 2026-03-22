# Fase P — Perceber

> Inventariar os dados disponiveis para o processo alvo e formar uma visao panoramica inicial.

---

## Contexto

A fase Perceber e o ponto de entrada de todo ciclo PRISM. Seu objetivo e responder: **"O que sabemos sobre este processo e qual a qualidade desse conhecimento?"**

Antes de analisar qualquer problema, precisamos entender o territorio. Esta fase varre todas as fontes de dados disponiveis (`dados/processados/*.jsonl`), filtra pelo processo alvo, e produz um inventario estruturado.

A qualidade da analise nas fases seguintes depende diretamente da qualidade do inventario desta fase. Um inventario ruim gera conclusoes ruins.

---

## Input Esperado

- Arquivos `.jsonl` em `dados/processados/` (um ou mais das 6 fontes possiveis)
- Nome/identificador do processo alvo (campo `process_hint` nos registros)
- Diretorio do ciclo ja criado em `ciclos/`

---

## Prompt para Claude Code

```
Voce e um analista de processos organizacionais. Execute a Fase P (Perceber) do PRISM-Lite.

PROCESSO ALVO: [PROCESSO]
PROCESS_HINT: [PROCESS_HINT]
DIRETORIO DE DADOS: dados/processados/
DIRETORIO DO CICLO: [CICLO_DIR]

INSTRUCOES:

1. VARREDURA DE FONTES
   Leia cada arquivo .jsonl disponivel em dados/processados/:
   - emails.jsonl
   - zeev.jsonl
   - totvs.jsonl
   - hubspot.jsonl
   - politicas.jsonl
   - diagnosticos.jsonl

   Para cada arquivo que existir, filtre os registros onde process_hint == "[PROCESS_HINT]".
   Se o arquivo nao existir, registre como "Fonte nao disponivel".

2. CONTAGEM E PERIODO
   Para cada fonte com registros encontrados, calcule:
   - Total de registros
   - Data do registro mais antigo (timestamp min)
   - Data do registro mais recente (timestamp max)
   - Periodo coberto em dias

3. IDENTIFICACAO DE ATORES
   Extraia todos os valores unicos do campo "actors" de todos os registros filtrados.
   Agrupe por papel/funcao quando possivel (ex: "Joao Silva - Compras" e "Maria Santos - Compras" → papel "Compras").
   Liste cada ator com: nome, papel inferido, quantidade de registros em que aparece.

4. AVALIACAO DE QUALIDADE
   Para cada fonte, avalie:
   - Completude: % de campos preenchidos (id, timestamp, title, content, actors)
   - Consistencia: timestamps em ordem logica? actors preenchidos?
   - Cobertura: o periodo cobre o suficiente para analise? (minimo sugerido: 90 dias)
   Atribua nota: ALTA (>80% completude, boa cobertura), MEDIA (50-80%), BAIXA (<50%).

5. OBSERVACOES INICIAIS
   Com base na varredura, liste de 3 a 5 observacoes iniciais. Exemplos:
   - "Emails concentrados em 2 atores, sugerindo gargalo de comunicacao"
   - "Zeev tem 45 instancias mas TOTVS so 12 transacoes — possivel desconexao"
   - "Nenhuma politica documentada para este processo"
   - "Diagnosticos mencionam retrabalho frequente na etapa de aprovacao"
   NAO tire conclusoes definitivas — apenas sinalize padroes para investigacao.

6. SALVAR OUTPUT
   Salve o resultado completo como [CICLO_DIR]/P_inventario.md usando o template abaixo.
```

---

## Template de Output

```markdown
# P — Inventario de Dados: [PROCESSO]

**Data do ciclo**: YYYY-MM-DD
**Process hint**: [PROCESS_HINT]

---

## 1. Fontes Disponiveis

| Fonte | Arquivo | Registros | Periodo | Cobertura (dias) | Qualidade |
|-------|---------|-----------|---------|-------------------|-----------|
| Emails | emails.jsonl | N | DD/MM/YYYY a DD/MM/YYYY | N dias | ALTA/MEDIA/BAIXA |
| Zeev (BPM) | zeev.jsonl | N | DD/MM/YYYY a DD/MM/YYYY | N dias | ALTA/MEDIA/BAIXA |
| TOTVS (ERP) | totvs.jsonl | N | DD/MM/YYYY a DD/MM/YYYY | N dias | ALTA/MEDIA/BAIXA |
| HubSpot (CRM) | hubspot.jsonl | N | DD/MM/YYYY a DD/MM/YYYY | N dias | ALTA/MEDIA/BAIXA |
| Politicas | politicas.jsonl | N | — | — | ALTA/MEDIA/BAIXA |
| Diagnosticos | diagnosticos.jsonl | N | DD/MM/YYYY a DD/MM/YYYY | N dias | ALTA/MEDIA/BAIXA |

**Total de registros**: N
**Fontes nao disponiveis**: [listar]

---

## 2. Atores Identificados

| Ator | Papel/Funcao | Registros | Fontes |
|------|-------------|-----------|--------|
| Nome | Papel inferido | N | emails, zeev |
| ... | ... | ... | ... |

**Total de atores unicos**: N
**Papeis/funcoes identificados**: [listar]

---

## 3. Qualidade dos Dados

| Fonte | Completude (%) | Consistencia | Cobertura | Nota Final |
|-------|---------------|-------------|-----------|------------|
| Emails | X% | OK/Problemas | Adequada/Insuficiente | ALTA/MEDIA/BAIXA |
| ... | ... | ... | ... | ... |

**Problemas de qualidade encontrados**:
- [descrever cada problema]

---

## 4. Observacoes Iniciais

1. **[Titulo da observacao]**: [Descricao com referencia a dados]
2. **[Titulo da observacao]**: [Descricao com referencia a dados]
3. **[Titulo da observacao]**: [Descricao com referencia a dados]
4. **[Titulo da observacao]** (opcional): [Descricao]
5. **[Titulo da observacao]** (opcional): [Descricao]

---

## 5. Recomendacao para Proxima Fase

- Dados suficientes para prosseguir com Fase R? SIM/NAO
- Fontes adicionais recomendadas: [listar se aplicavel]
- Alertas: [qualquer risco ou limitacao relevante]
```

---

## Quality Gate (Go/No-Go para Fase R)

Antes de prosseguir para a Fase R, verificar criterios minimos:

| Criterio | Minimo Aceitavel | Status |
|----------|-----------------|--------|
| Fontes com dados | >= 2 fontes com registros | |
| Volume total | >= 50 registros | |
| Timestamps preenchidos | >= 90% dos registros | |
| Cobertura temporal | >= 30 dias | |
| Atores identificados | >= 3 atores unicos | |

**Decisao:**
- [ ] **GO** — Todos os criterios atendem o minimo. Prosseguir para Fase R.
- [ ] **GO COM RESSALVAS** — 1-2 criterios abaixo do minimo, mas dados suficientes para analise parcial. Documentar limitacoes.
- [ ] **NO-GO** — Dados insuficientes. Acao: [coletar mais dados de X fonte / aguardar Y dias / entrevistar Z pessoa]

---

## Criterio de Done

A fase P esta concluida quando:

- [ ] Todos os arquivos `.jsonl` disponiveis foram varridos
- [ ] Tabela de fontes preenchida com contagens, periodos e qualidade
- [ ] Lista de atores extraida e agrupada por papel
- [ ] Qualidade avaliada por fonte com nota ALTA/MEDIA/BAIXA
- [ ] Minimo de 3 observacoes iniciais documentadas com base em dados
- [ ] Recomendacao explicita de prosseguir ou nao para Fase R
- [ ] Arquivo `P_inventario.md` salvo no diretorio do ciclo
- [ ] Quality Gate avaliado (GO, GO COM RESSALVAS, ou NO-GO)
