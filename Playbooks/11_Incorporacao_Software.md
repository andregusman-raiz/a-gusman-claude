# Playbook 11: Incorporacao de Software

> Incorporar e transformar: do standalone ao simbiotico, sem quebrar nada no caminho.

## Filosofia

Incorporacao de software externo ao rAIz Platform segue o principio do Strangler Fig:
sistemas coexistem, funcionalidades migram gradualmente, e o legado so e desativado
quando o novo esta 100% validado. NUNCA big bang. SEMPRE incremental.

## Modelo de Maturidade (5 Niveis)

| Nivel | Nome | Descricao | Exemplo |
|-------|------|-----------|---------|
| L1 | **Standalone** | Sistemas independentes, sem integracao | Dois apps separados |
| L2 | **Conectado** | SSO/auth compartilhado, navegacao cruzada | Login unico, link entre apps |
| L3 | **Federado** | ACL unificada, API Gateway, dados sincronizados via CDC | Dados fluem entre sistemas |
| L4 | **Unificado** | Design system unico, DB consolidado, monorepo, release unificado | Uma experiencia visual |
| L5 | **Simbiotico** | Domain model compartilhado, features co-evoluem, indistinguivel | Um unico produto |

**Regra**: Cada incorporacao define seu nivel-alvo. Nem tudo precisa chegar a L5.

## Fases do Processo

```
Fase 0: Due Diligence → Fase 1: Planejamento → Fase 2: Coexistencia
→ Fase 3: Federacao → Fase 4: Unificacao → Fase 5: Simbiose
```

### Fase 0 — Due Diligence (ag-32)

Avaliacao tecnica ANTES de decidir incorporar:

- [ ] Stack e compatibilidade (Next.js? TS? Supabase? Outro DB?)
- [ ] Qualidade de codigo (testes, tipos, linting, debito tecnico)
- [ ] Modelo de dados (schema, normalizacao, PII, RLS)
- [ ] Seguranca (auth, secrets, deps vulneraveis, OWASP)
- [ ] API surface (REST/GraphQL, versionamento, documentacao)
- [ ] Licenciamento (open source, proprietario, restricoes)
- [ ] Complexidade de integracao (score 1-5 por dimensao)

**Output**: `incorporation/[nome]/due-diligence-report.md` com score e recomendacao Go/No-Go.

### Fase 1 — Planejamento (ag-34)

Criar roadmap de incorporacao com fases e milestones:

- [ ] Definir nivel-alvo de integracao (L1-L5)
- [ ] Mapear dimensoes de integracao (ag-33)
- [ ] Identificar modulos a incorporar (priorizar por valor)
- [ ] Criar task_plan por modulo com dependencias
- [ ] Definir feature flags para controle de rollout
- [ ] Estabelecer metricas de sucesso por fase

**Output**: `incorporation/[nome]/roadmap.md` + `incorporation/[nome]/integration-map.md`

### Fase 2 — Coexistencia (L1 → L2)

Minimo viavel: ambos sistemas funcionam, usuario navega entre eles.

- [ ] SSO/Auth compartilhado (Supabase Auth como source of truth)
- [ ] Navegacao cruzada (links/redirects entre sistemas)
- [ ] Feature flags configurados (sistema externo = off por padrao)
- [ ] Monitoramento de ambos (ag-20)
- [ ] Zero mudancas no rAIz Platform core

**Padrao**: Anti-Corruption Layer (ACL) entre sistemas.

### Fase 3 — Federacao (L2 → L3)

Dados fluem, controle de acesso e unificado:

- [ ] API Gateway/BFF roteando entre sistemas
- [ ] CDC (Change Data Capture) para sync de dados
- [ ] RLS unificado (mesmas policies aplicam a ambos)
- [ ] Contract testing entre sistemas (Pact)
- [ ] Schema migration strategy definida
- [ ] Canary deployment para features migradas

**Padrao**: Strangler Fig — roteamento gradual de endpoints.

### Fase 4 — Unificacao (L3 → L4)

Uma experiencia, um deploy, um codebase:

- [ ] Design tokens unificados (cores, tipografia, espacamento)
- [ ] Componentes UI migrados para design system do rAIz
- [ ] Database consolidado (schema merge completado)
- [ ] Monorepo ou merge de repositorios
- [ ] Pipeline CI/CD unificado
- [ ] Testes E2E cobrindo fluxos cross-system

### Fase 5 — Simbiose (L4 → L5)

Indistinguivel — o sistema incorporado E o rAIz Platform:

- [ ] Domain model compartilhado
- [ ] Features co-evoluem (backlog unificado)
- [ ] Legacy code removido (Strangler Fig completo)
- [ ] Documentacao unificada
- [ ] Release cycle unico

## Dimensoes de Integracao

Cada incorporacao deve ser avaliada em 10 dimensoes:

| # | Dimensao | Perguntas-Chave |
|---|----------|-----------------|
| D1 | **Database** | Schemas compativeis? Overlap de entidades? Migration path? |
| D2 | **Auth/ACL** | Mesmo provider? Roles mapeiaveis? RLS compativel? |
| D3 | **API** | REST/GraphQL? Versionamento? Rate limiting? |
| D4 | **UI/UX** | Design system? Componentes reusaveis? Responsividade? |
| D5 | **Config** | Env vars? Feature flags? Secrets management? |
| D6 | **Infra** | Hosting? CDN? Edge functions? Regions? |
| D7 | **Dados** | PII? LGPD? Backup? Retencao? |
| D8 | **Testes** | Cobertura? E2E? Contract tests? |
| D9 | **Deploy** | CI/CD? Preview? Rollback? |
| D10 | **Docs** | API docs? README? ADRs? Onboarding? |

## Governanca (PMO Leve)

### Documentacao por Incorporacao

```
incorporation/
├── [nome-sistema]/
│   ├── due-diligence-report.md    # Fase 0: avaliacao tecnica
│   ├── integration-map.md         # Fase 1: mapa de dimensoes
│   ├── roadmap.md                 # Fase 1: fases e milestones
│   ├── task_plan.md               # Fase 1: tarefas atomicas
│   ├── risk-register.md           # Riscos identificados
│   ├── decisions/                 # ADRs especificos da incorporacao
│   │   └── 0001-auth-strategy.md
│   ├── progress.md                # Status atual por fase/dimensao
│   └── postmortem.md              # Licoes aprendidas (apos conclusao)
```

### Cadencia de Review

| Frequencia | Acao |
|-----------|------|
| A cada modulo migrado | Validacao (ag-12) + Testes (ag-13) |
| A cada fase concluida | Code review (ag-14) + Audit (ag-15) |
| Mensal | Progress review contra roadmap |
| Apos conclusao | Postmortem com licoes |

### Metricas de Acompanhamento

- **Cobertura de integracao**: % das dimensoes resolvidas por fase
- **Incidentes**: Bugs introduzidos pela incorporacao
- **Performance**: Tempo de resposta antes/depois
- **Satisfacao**: UX review scores (ag-16)

## Arvore de Decisao

```
Sistema externo usa Next.js + Supabase?
├── SIM → Integracao facilitada (monorepo viavel em L4)
│   ├── Mesmo schema pattern? → CDC simples
│   └── Schema diferente? → ACL + migration gradual
└── NAO → Stack diferente
    ├── Tem API REST/GraphQL? → BFF como camada de traducao
    └── Acoplado/monolito? → Strangler Fig obrigatorio

Nivel-alvo de integracao?
├── L2 (Conectado) → SSO + links, ~1-2 semanas
├── L3 (Federado) → ACL + CDC + contract tests, ~1-2 meses
├── L4 (Unificado) → Monorepo + design system + DB merge, ~3-6 meses
└── L5 (Simbiotico) → Domain merge completo, ~6-12 meses
```

## Agents do Workflow de Incorporacao

| Agent | Fase | Funcao |
|-------|------|--------|
| ag-32 | 0 | Due diligence tecnica |
| ag-33 | 1 | Mapeamento de dimensoes de integracao |
| ag-34 | 1 | Planejamento do roadmap |
| ag-35 | 2-5 | Execucao de incorporacao modulo a modulo |
| ag-03 | 0 | Exploracao do codebase externo |
| ag-04 | 0 | Analise de debito tecnico do externo |
| ag-06 | 1 | SPEC de cada modulo a incorporar |
| ag-17 | 3-4 | Migrations de schema |
| ag-15 | 2-5 | Auditoria de seguranca pos-incorporacao |

## Anti-Patterns

- **NUNCA** big bang migration (migrar tudo de uma vez)
- **NUNCA** dual-write sem transactional outbox
- **NUNCA** incorporar sem due diligence
- **NUNCA** mudar core do rAIz para acomodar sistema externo (usar ACL)
- **NUNCA** migrar DB sem rollback plan
- **NUNCA** desligar sistema antigo sem periodo de shadow testing
- **NUNCA** assumir que schemas sao compativeis sem verificar

## Quando NAO Incorporar

| Cenario | Alternativa |
|---------|-------------|
| Sistema muito diferente em stack/dominio | API integration (L2 max) |
| Codigo sem testes e sem docs | Reescrever do zero com SPEC |
| Licenca incompativel | Partnership via API |
| Custo de integracao > custo de rebuild | Reconstruir seguindo SDD |
