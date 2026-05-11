# Fase D — Detalhamento de Implementacao

> Produzir plano de implementacao executavel para cada solucao escolhida na Fase S2 — tao detalhado que qualquer pessoa de TI consiga seguir sem assistencia do Claude Code.

---

## Contexto

A Fase D transforma recomendacoes arquiteturais em instrucoes passo-a-passo. E a fase mais delicada do PRISM-Lite porque exige que o detalhamento seja **consistente** com a documentacao oficial e **verificavel** contra a KB.

**Principio**: O output deve ser um documento autocontido. Um analista de TI que nunca usou Claude Code deve conseguir implementar a melhoria seguindo apenas o documento gerado.

**Niveis de detalhamento por sistema**:

| Sistema | O que detalhar | Formato |
|---------|---------------|---------|
| TOTVS RM — Formula Visual | Gatilho, tipo de FV, atividades na sequencia, SQL, campos, condicoes, tratamento de excecao | Passo-a-passo com menu > submenu > campo |
| TOTVS RM — Parametro | Localizacao do parametro, valor atual, valor desejado, impacto | Caminho de menu + valor |
| TOTVS RM — Job Scheduler | Processo a executar, cron expression, parametros | Config JSON-like |
| Zeev — Processo | Desenho BPMN, etapas, gateways, tarefas de servico, formularios | Descricao de cada elemento |
| Zeev — Formulario | Campos, tipos, validacoes, condicionais, layout | Lista de campos com specs |
| Zeev — Integracao REST | URL, metodo, headers, body, mapeamento de campos, tratamento de erro | Curl-like + mapeamento |
| Zeev — Regra de Negocio | Condicao, acao, escopo, prioridade | Regra em linguagem natural + config |
| HubSpot — Workflow | Trigger, acoes, branches, delays, goals | Fluxo descritivo com configs |
| HubSpot — Pipeline | Stages, automacoes por stage, deal properties | Tabela de stages |
| n8n — Workflow | JSON exportavel, nodes, credentials, webhooks, error handling | JSON + diagrama |

---

## Input Esperado

- Arquivo `S2_pesquisa_profunda.md` do ciclo atual (output da Fase S2)
- Knowledge Base completa (mesma da Fase S2)
- Acesso ao Swagger Zeev: `https://raizeducacao.zeev.it/api/2/docs/`
- Versao TOTVS RM: 12.1.2502

---

## Prompt para Claude Code

```
Voce e um engenheiro de implementacao de sistemas corporativos.
Execute a Fase D (Detalhamento de Implementacao) do PRISM-Lite.

PROCESSO ALVO: [PROCESSO]
PESQUISA PROFUNDA (Fase S2): [CICLO_DIR]/S2_pesquisa_profunda.md
KNOWLEDGE BASE: knowledge/ (completa)
VERSAO TOTVS RM: 12.1.2502
INSTANCIA ZEEV: raizeducacao.zeev.it
DIRETORIO DO CICLO: [CICLO_DIR]

INSTRUCOES:

1. LER SOLUCOES ESCOLHIDAS
   Leia S2_pesquisa_profunda.md. Para cada melhoria, identifique:
   - Solucao recomendada (e fallback)
   - Componentes tecnicos listados
   - Endpoints e configs identificados
   - Pre-requisitos e limitacoes

2. PARA CADA SOLUCAO — DETALHAR IMPLEMENTACAO
   Seguir o template de detalhamento especifico ao sistema:

   === TOTVS RM: FORMULA VISUAL ===

   a) CRIAR FORMULA VISUAL
      - Menu: Ambiente > Formula Visual > Gerenciador de Formulas
      - Tipo: [Sequencial / Fluxograma]
      - Opcao "Executa em API (POCO)": [Sim/Nao]
      - Nome: [nome descritivo]
      - Descricao: [proposito]

   b) CONFIGURAR GATILHO
      - Tipo: [Antes de Salvar / Apos Salvar / Antes de Atualizar / etc.]
      - Tabela/API alvo: [nome da tabela ou API]
      - Condicao de disparo: [quando a FV deve executar]

   c) MONTAR SEQUENCIA DE ATIVIDADES
      Para cada atividade na FV:
      - Tipo: [Executar Consulta SQL / Se/Senao / Executar Requisicao REST / etc.]
      - Configuracao:
        - SQL: [query exata com parametros]
        - REST: [URL, metodo, headers, body com placeholders]
        - Condicao: [expressao logica]
      - Output: [variavel que recebe o resultado]
      - Erro: [tratamento com "Tratar Excecao"]

   d) TESTAR
      - Cenario de teste: [dados de entrada]
      - Resultado esperado: [o que deve acontecer]
      - Como verificar: [onde olhar no sistema]

   === ZEEV: PROCESSO / INTEGRACAO ===

   a) CONFIGURAR INTEGRACAO
      - Menu: Administracao > Integracoes > Nova Integracao
      - Nome: [nome descritivo]
      - Tipo: [REST / SOAP / SQL]
      - URL base: [URL do sistema externo]
      - Autenticacao: [tipo + onde configurar credenciais]

   b) CONFIGURAR TAREFA DE SERVICO
      - No processo BPMN, adicionar Tarefa de Servico
      - Associar a integracao criada no passo (a)
      - Mapear campos: [campo Zeev] → [campo API]
      - Configurar tratamento de erro: [timeout, retry, fallback]

   c) CONFIGURAR GATEWAY (quando aplicavel)
      - Tipo: [Exclusivo XOR / Paralelo AND / Inclusivo OR]
      - Condicoes por ramo: [campo] [operador] [valor]
      - Ramo default: [qual]

   d) CONFIGURAR SLA (quando aplicavel)
      - Etapa: [nome da etapa]
      - Prazo: [N horas/dias]
      - Alertas: [% do prazo → acao]
      - Escalonamento: [para quem, apos quanto tempo]

   e) TESTAR
      - Criar instancia de teste
      - Verificar que integracao dispara
      - Verificar que dados fluem corretamente

   === N8N: WORKFLOW ===

   a) ESTRUTURA DO WORKFLOW
      - Trigger: [Webhook / Cron / Event]
      - Nodes: [lista ordenada com tipo e config]
      - Error handling: [Error Trigger node]

   b) JSON DO WORKFLOW
      Gerar JSON exportavel (ou pseudo-JSON com a estrutura).
      Para cada node:
      - Tipo: [HTTP Request / Code / IF / etc.]
      - Parametros principais
      - Credentials necessarias

   c) CONFIGURAR CREDENTIALS
      - [nome]: [tipo] — [onde obter]

   d) TESTAR
      - Execucao manual com dados de teste
      - Verificar logs

3. VERIFICACAO DE CONSISTENCIA (OBRIGATORIO)
   Para cada detalhe tecnico no plano, verificar contra a KB:

   CHECKLIST DE CONSISTENCIA:
   - [ ] Endpoint existe na KB? (buscar no JSONL de specs)
   - [ ] Parametros estao corretos? (comparar com spec)
   - [ ] Versao do TOTVS suporta? (verificar versao minima)
   - [ ] Autenticacao documentada? (verificar tipo de auth)
   - [ ] Limitacoes conhecidas? (buscar na Central/TDN)
   - [ ] Caminho de menu existe? (verificar na documentacao)

   Se algum item NAO passar na verificacao:
   - Marcar com [VERIFICAR] no documento
   - Explicar o que precisa ser validado manualmente
   - Sugerir como validar (ex: "testar no ambiente de homologacao")

4. GERAR CRONOGRAMA DE IMPLEMENTACAO
   Para cada melhoria detalhada, estimar:
   - Tempo de configuracao
   - Tempo de teste
   - Tempo de deploy/go-live
   - Responsavel sugerido
   - Dependencias entre melhorias

5. GERAR CHECKLIST DE ROLLBACK
   Para cada implementacao:
   - Como reverter se algo der errado
   - O que fazer backup antes de comecar
   - Ponto de nao-retorno (se existir)

6. SALVAR OUTPUT
   Salvar como [CICLO_DIR]/D_implementacao.md usando o template abaixo.
```

---

## Template de Output

```markdown
# D — Plano de Implementacao: [PROCESSO]

**Data**: YYYY-MM-DD
**Base**: S2_pesquisa_profunda.md
**Versao TOTVS RM**: 12.1.XXXX
**Solucoes detalhadas**: N

---

## Sumario Executivo

[Resumo: N melhorias detalhadas, tempo total estimado, sistemas impactados,
pre-requisitos gerais, ordem de implementacao]

---

## Pre-Requisitos Gerais

| # | Pre-requisito | Status | Como verificar |
|---|--------------|--------|----------------|
| 1 | Acesso admin ao TOTVS RM | [ ] | Login com perfil admin no RM Portal |
| 2 | Acesso admin ao Zeev | [ ] | Login em raizeducacao.zeev.it com superadmin |
| 3 | Token API Zeev permanente | [ ] | Gestao de Pessoas > Tokens > Gerar permanente |
| 4 | Ambiente de homologacao TOTVS | [ ] | Verificar com TI |
| 5 | [outros] | [ ] | [como] |

---

## IMP-[N]: [Titulo] (Melhoria M-[N])

### Visao Geral
- **Solucao**: [nome da alternativa escolhida na S2]
- **Nivel**: N[1-4]
- **Sistema(s)**: [TOTVS RM / Zeev / HubSpot / n8n]
- **Esforco estimado**: [N dias]
- **Responsavel sugerido**: [papel]

### Passo a Passo

#### Passo 1: [Titulo do passo]
**Sistema**: [qual]
**Menu/Caminho**: [Menu > Submenu > Opcao]
**Acao**:
1. [instrucao 1]
2. [instrucao 2]
3. [instrucao 3]

**Configuracao**:
```
[config especifica — SQL, JSON, parametros]
```

**Verificacao**: [como confirmar que o passo foi executado corretamente]

#### Passo 2: [Titulo]
[mesmo formato]

...

### Teste de Validacao

| # | Cenario | Dados de teste | Resultado esperado | Como verificar |
|---|---------|---------------|-------------------|----------------|
| 1 | [cenario normal] | [dados] | [resultado] | [onde olhar] |
| 2 | [cenario de erro] | [dados] | [mensagem de erro] | [onde olhar] |
| 3 | [cenario limite] | [dados] | [resultado] | [onde olhar] |

### Checklist de Consistencia

| # | Verificacao | Status | Ref KB |
|---|------------|--------|--------|
| 1 | Endpoint [X] existe | [OK/VERIFICAR] | [ref] |
| 2 | Versao 12.1.2502 suporta | [OK/VERIFICAR] | [ref] |
| 3 | [outro] | [OK/VERIFICAR] | [ref] |

### Rollback

**Backup antes de iniciar**:
- [ ] [o que fazer backup]

**Como reverter**:
1. [passo de reversao 1]
2. [passo de reversao 2]

**Ponto de nao-retorno**: [descrever ou "N/A"]

---

[Repetir para cada implementacao]

---

## Cronograma Consolidado

| Semana | Implementacao | Sistema | Responsavel | Dependencia |
|--------|--------------|---------|-------------|-------------|
| 1 | IMP-1 | Zeev | [quem] | Nenhuma |
| 1-2 | IMP-2 | TOTVS RM | [quem] | IMP-1 |
| 2-3 | IMP-3 | Zeev + TOTVS | [quem] | IMP-1, IMP-2 |
| 3 | Validacao end-to-end | Todos | [quem] | Todas |

---

## Checklist Final Pre-Go-Live

- [ ] Todos os passos executados em ambiente de homologacao
- [ ] Testes de validacao passando (todos os cenarios)
- [ ] Backups realizados
- [ ] Stakeholders informados
- [ ] Plano de rollback testado
- [ ] Metricas baseline coletadas (para Fase M)
- [ ] Data de go-live definida
```

---

## Criterio de Done

A fase D esta concluida quando:

- [ ] Todas as solucoes escolhidas na S2 tem detalhamento passo-a-passo
- [ ] Cada passo tem: sistema, menu/caminho, acao, configuracao, verificacao
- [ ] Checklist de consistencia executado contra a KB (todos OK ou marcados VERIFICAR)
- [ ] Cenarios de teste definidos para cada implementacao
- [ ] Plano de rollback para cada implementacao
- [ ] Cronograma consolidado com dependencias
- [ ] Checklist pre-go-live completo
- [ ] Arquivo D_implementacao.md salvo no diretorio do ciclo

---

## Notas de Qualidade

### O que torna um bom detalhamento

1. **Reprodutibilidade**: Duas pessoas seguindo o mesmo plano chegam ao mesmo resultado
2. **Verificabilidade**: Cada passo tem um "como verificar" que confirma sucesso
3. **Rastreabilidade**: Cada config tecnica tem referencia a doc oficial na KB
4. **Reversibilidade**: Cada implementacao pode ser revertida
5. **Completude**: Nao ha "pergunte ao fornecedor" — ou detalha ou marca [VERIFICAR]

### Erros comuns a evitar

- Endpoint que existe na spec mas nao esta habilitado na versao do cliente
- Parametro documentado com nome diferente na interface do sistema
- Fluxo que funciona em teste mas falha com dados reais (volumes, caracteres especiais)
- Integracao que funciona pontualmente mas falha em lote (rate limiting, timeout)
- Gatilho de Formula Visual que dispara em cascata (loop infinito)
