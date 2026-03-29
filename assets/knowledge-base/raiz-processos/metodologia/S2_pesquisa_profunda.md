# Fase S2 — Pesquisa Profunda de Solucoes

> Investigar TODAS as alternativas de solucao para cada melhoria priorizada, usando multi-agentes especializados por sistema e a knowledge base completa. Produzir tabela comparativa rankeada.

---

## Contexto

A fase S2 existe porque a Fase S prioriza e recomenda, mas nao investiga profundamente as opcoes de implementacao. A S2 usa processamento intensivo (multi-agentes, Opus) para extrair o maximo de conhecimento da KB e produzir alternativas concretas e comparaveis.

**Principio fundamental**: A solucao deve priorizar o que ja existe nos sistemas da empresa. So propor ferramentas externas quando os sistemas nativos comprovadamente nao resolvem.

**Hierarquia obrigatoria de solucoes** (investigar nesta ordem):
```
Nivel 1: Configuracao nativa do sistema (sem codigo)
         TOTVS RM: parametros, Formula Visual, Job Scheduler
         Zeev: gateway, SLA, formulario, regra de negocio
         HubSpot: workflow, pipeline, automation
         → Investigar PRIMEIRO. Se resolve, parar aqui.

Nivel 2: Integracao nativa entre sistemas (API REST/SOAP)
         TOTVS FV → API Zeev | Zeev Tarefa de Servico → API TOTVS
         HubSpot Workflow → Webhook → Zeev/TOTVS
         → Investigar se N1 nao resolve sozinho.

Nivel 3: Orquestracao via n8n (middleware low-code)
         n8n como hub de integracao quando N1+N2 nao bastam
         Ex: TOTVS event → n8n → Zeev + HubSpot + Email
         → So propor se justificado (multiplos sistemas, logica complexa)

Nivel 4: RPA ou solucao de mercado
         Automacao de UI quando nao ha API
         Software especializado quando gap e grande demais
         → Ultimo recurso. Justificar por que N1-N3 nao servem.
```

---

## Input Esperado

- Arquivo `S_melhorias.md` do ciclo atual (output da Fase S)
- Knowledge Base completa:
  - `knowledge/zeev/kb/zeev_kb.jsonl` (374 paginas de documentacao)
  - `knowledge/zeev/specs/endpoints.jsonl` (98 endpoints API)
  - `knowledge/zeev/blog.jsonl` (580 artigos)
  - `knowledge/totvs/specs/totvs_rm_specs.jsonl` (263 specs, 1053 endpoints)
  - `knowledge/totvs/tdn/totvs_tdn.jsonl` (187 paginas)
  - `knowledge/totvs/suporte/totvs_central.jsonl` (300 artigos)
  - `knowledge/hubspot/specs/hubspot_specs.jsonl` (72 specs, 867 endpoints)
  - `knowledge/hubspot/kb/` e `knowledge/hubspot/guides/` (quando disponiveis)
- Versao do TOTVS RM: 12.1.2502 (proximas: 12.1.2510, 12.1.2602)
- Instancia Zeev: raizeducacao.zeev.it

---

## Prompt para Claude Code

```
Voce e um arquiteto de solucoes especializado em sistemas corporativos (ERP, BPM, CRM).
Execute a Fase S2 (Pesquisa Profunda de Solucoes) do PRISM-Lite.

PROCESSO ALVO: [PROCESSO]
MELHORIAS PRIORIZADAS (Fase S): [CICLO_DIR]/S_melhorias.md
KNOWLEDGE BASE: knowledge/ (Zeev KB + API, TOTVS specs + TDN + Central, HubSpot specs)
VERSAO TOTVS RM: 12.1.2502
INSTANCIA ZEEV: raizeducacao.zeev.it
DIRETORIO DO CICLO: [CICLO_DIR]

INSTRUCOES:

1. LER MELHORIAS PRIORIZADAS
   Leia S_melhorias.md para obter a lista de melhorias Quick Win e Projetos Estrategicos.
   Para cada melhoria, anote: problema resolvido, descricao, sistemas envolvidos.

2. PARA CADA MELHORIA — LANCJAR PESQUISA MULTI-AGENTE
   Lance agentes em paralelo, um por sistema envolvido:

   AGENTE TOTVS RM (quando sistema envolvido):
   - Buscar na KB: knowledge/totvs/specs/, knowledge/totvs/tdn/, knowledge/totvs/suporte/
   - Keywords de busca: extrair do problema (ex: "boleto" → buscar boleto, remessa, registro)
   - Para cada achado relevante: extrair endpoint, parametros, limitacoes, versao minima
   - Investigar Formula Visual: gatilhos disponiveis, atividades relevantes, exemplos
   - Investigar Job Scheduler: se aplicavel para automacao em lote
   - VERIFICAR compatibilidade com versao 12.1.2502

   AGENTE ZEEV (quando sistema envolvido):
   - Buscar na KB: knowledge/zeev/kb/, knowledge/zeev/specs/, knowledge/zeev/blog.jsonl
   - Para cada achado: extrair configuracao, endpoint, parametros
   - Investigar: Tarefa de Servico, Gateway Condicional, SLA, Formularios, Regras de Negocio
   - Verificar se solucao e zero-codigo (config) ou requer desenvolvimento

   AGENTE HUBSPOT (quando sistema envolvido):
   - Buscar na KB: knowledge/hubspot/specs/, knowledge/hubspot/kb/, knowledge/hubspot/guides/
   - Investigar: Workflows, Pipelines, Automation, Custom Properties
   - Verificar tier necessario (Free, Starter, Pro, Enterprise)

   AGENTE N8N (quando N1+N2 nao bastam):
   - Pesquisar templates e nodes relevantes via web
   - Investigar conectores TOTVS, Zeev, HubSpot
   - Propor arquitetura de workflow

3. SINTETIZAR ALTERNATIVAS
   Para cada melhoria, monte tabela comparativa:

   | Criterio        | Solucao A (Nativo) | Solucao B (Integracao) | Solucao C (n8n) |
   |-----------------|--------------------|-----------------------|-----------------|
   | Nivel           | N1                 | N2                    | N3              |
   | Descricao       | [resumo]           | [resumo]              | [resumo]        |
   | Viabilidade     | Alta/Media/Baixa   | Alta/Media/Baixa      | Alta/Media/Baixa|
   | Esforco         | N dias             | N dias                | N dias          |
   | Custo           | R$ 0 / baixo / medio | R$ X              | R$ X            |
   | Risco           | Alto/Medio/Baixo   | Alto/Medio/Baixo      | Alto/Medio/Baixo|
   | Manutenibilidade| Alta/Media/Baixa   | Alta/Media/Baixa      | Alta/Media/Baixa|
   | Versao minima   | 12.1.XX            | N/A                   | N/A             |
   | Refs KB         | [N docs]           | [N docs]              | [N docs]        |

   RECOMENDACAO: [Solucao X — justificativa em 2-3 frases]

4. PARA CADA ALTERNATIVA VIAVEL — DETALHAR COMPONENTES
   Para solucoes de Nivel 1 e 2 (nativas), detalhar:
   - Endpoints especificos com parametros
   - Configuracoes necessarias (menu > submenu > opcao)
   - Pre-requisitos (versao, modulo, permissao)
   - Limitacoes documentadas

   Para solucoes de Nivel 3 (n8n), detalhar:
   - Nodes necessarios
   - Fluxo do workflow (trigger → processamento → output)
   - Credentials necessarias
   - Webhooks/triggers

5. IDENTIFICAR SINERGIAS
   Verificar se melhorias podem ser agrupadas numa unica implementacao.
   Ex: M-05 (rastreabilidade) + M-09 (finalizacao Zeev) = 1 integracao bidirecional.

6. SALVAR OUTPUT
   Salvar como [CICLO_DIR]/S2_pesquisa_profunda.md usando o template abaixo.
```

---

## Template de Output

```markdown
# S2 — Pesquisa Profunda de Solucoes: [PROCESSO]

**Data**: YYYY-MM-DD
**Base**: S_melhorias.md + Knowledge Base (N records, N MB)
**Versao TOTVS RM**: 12.1.XXXX
**Melhorias investigadas**: N

---

## Resumo Executivo

[Paragrafos resumindo: quantas melhorias investigadas, quantas alternativas encontradas,
qual nivel predominante (N1/N2/N3/N4), sinergias identificadas, recomendacao geral]

---

## M-[N]: [Titulo da Melhoria]

### Problema Original
[De I_causas_raiz.md — 2-3 frases]

### Alternativas Investigadas

#### Alternativa A: [Nome] (Nivel [N])
**Sistema(s)**: TOTVS RM / Zeev / HubSpot / n8n
**Descricao**: [O que fazer, em 3-5 bullets]
**Componentes tecnicos**:
- [Endpoint/Config 1]: [descricao + parametros]
- [Endpoint/Config 2]: [descricao + parametros]
**Pre-requisitos**: [versao, modulo, permissao]
**Limitacoes**: [restricoes documentadas na KB]
**Refs KB**: [lista de docs consultados]

#### Alternativa B: [Nome] (Nivel [N])
[Mesmo formato]

#### Alternativa C: [Nome] (Nivel [N])
[Mesmo formato — se aplicavel]

### Tabela Comparativa

| Criterio | Alt A | Alt B | Alt C |
|----------|-------|-------|-------|
| Nivel | N[X] | N[X] | N[X] |
| Viabilidade | [Alta/Media/Baixa] | ... | ... |
| Esforco | [N dias] | ... | ... |
| Custo | [R$ X] | ... | ... |
| Risco | [Alto/Medio/Baixo] | ... | ... |
| Manutenibilidade | [Alta/Media/Baixa] | ... | ... |
| Versao minima | [12.1.XX] | ... | ... |
| Refs KB | [N] | [N] | [N] |

### Recomendacao
**Solucao escolhida**: Alternativa [X]
**Justificativa**: [2-3 frases explicando por que esta e a melhor opcao]
**Alternativa de fallback**: Alternativa [Y] — usar se [condicao]

---

[Repetir para cada melhoria]

---

## Sinergias Identificadas

| Grupo | Melhorias | Implementacao unica | Economia |
|-------|-----------|---------------------|----------|
| [nome] | M-X + M-Y | [descricao] | [dias/custo] |

---

## Mapa de Implementacao

```
Semana 1-2: [M-X] Config nativa Zeev (gateway + SLA)
Semana 2-3: [M-Y + M-Z] Formula Visual TOTVS (integracao bidirecional)
Semana 3-4: [M-W] n8n workflow (orquestracao)
Semana 5:   Validacao end-to-end
```

---

## Riscos Consolidados

| Risco | Impacto | Probabilidade | Mitigacao |
|-------|---------|--------------|-----------|
| [risco] | [alto/medio/baixo] | [alta/media/baixa] | [acao] |
```

---

## Criterio de Done

A fase S2 esta concluida quando:

- [ ] Todas as melhorias priorizadas (Quick Wins + Projetos Estrategicos) tem pelo menos 2 alternativas investigadas
- [ ] Cada alternativa tem endpoints/configs especificos documentados com refs a KB
- [ ] Tabela comparativa montada para cada melhoria com 7 criterios avaliados
- [ ] Recomendacao com justificativa para cada melhoria
- [ ] Sinergias entre melhorias identificadas
- [ ] Mapa de implementacao consolidado
- [ ] Riscos consolidados com mitigacao
- [ ] Compatibilidade com versao TOTVS RM verificada para cada solucao
- [ ] Arquivo S2_pesquisa_profunda.md salvo no diretorio do ciclo
