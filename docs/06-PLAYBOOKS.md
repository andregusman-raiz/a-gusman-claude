# 07 — Playbooks de Metodologia

> 10 playbooks extraidos de pratica real para guiar desenvolvimento com IA.

---

## Indice

| # | Playbook | Quando Usar |
|---|----------|-------------|
| 01 | **Spec Driven Development (SDD)** | Toda feature nova, refatoracao, bug complexo |
| 02 | **Checklist de Projeto** | Iniciando projeto novo |
| 03 | **Database-First** | Qualquer mudanca que envolva dados |
| 04 | **Seguranca by Design** | Sempre (nao opcional) |
| 05 | **Otimizacao de Custos IA** | Escolher modelo certo para cada tarefa |
| 06 | **Desenvolvimento Paralelo** | Feature grande com multiplos desenvolvedores |
| 07 | **Quality Assurance** | Pipeline de validacao |
| 08 | **Gestao de Memoria e Contexto** | Sessoes longas |
| 09 | **Integracao de MCPs** | Usar ferramentas externas |
| 10 | **Automacao de Workflows** | Automacoes com n8n, webhooks, etc. |

---

## 01. Spec Driven Development (SDD)

**Principio**: 80% planejamento, 20% execucao.

### Fluxo

```
PRD.md → [Limpar Contexto] → SPEC.md → Execucao → Review
```

### PRD (Product Requirements Document)

Template:

```markdown
# PRD - [Nome da Feature]

## Contexto
Descricao do problema atual. Por que esta mudanca e necessaria.

## Requisitos de Negocio
- [ ] Requisito 1
- [ ] Requisito 2

## Arquivos Relevantes
- /src/components/...
- /src/services/...

## Criterios de Aceite
- [ ] Funcionalidade X opera corretamente
- [ ] Performance dentro de Y ms
- [ ] Testes passando
```

### SPEC (Technical Specification)

Template:

```markdown
# SPEC - [Nome da Feature]

## Baseado em
- PRD: [referencia]

## Mudancas no Banco de Dados
(se aplicavel)

## Mudancas em Arquivos
### /src/services/userService.ts
- Linha 45: Adicionar validacao
- Linha 78-82: Implementar logging

## Comandos a Executar
typecheck, lint, test

## Criterios de Conclusao
- [ ] Migrations aplicadas
- [ ] Testes passando
- [ ] Lint sem erros
```

### Regra dos 200 Linhas
Se SPEC > 200 linhas → dividir em SPEC_1.md, SPEC_2.md, etc.

### Anti-Patterns
1. Pular planejamento ("demora muito" = ERRADO)
2. Planejar no terminal (use interface web)
3. SPECs genericos (inclua numeros de linha)
4. Ignorar limpeza de contexto
5. Pular o review

---

## 02. Checklist de Projeto Novo

8 fases para iniciar um projeto completo:

1. **Modelo de Negocio**: definir problema, persona, metricas
2. **Estrutura**: scaffolding com ag-P-01
3. **Database**: diagrama → aprovacao → schema → migrations (Playbook 03)
4. **Backend**: APIs, services, repositories
5. **Frontend**: componentes, pages, hooks
6. **Seguranca**: auth, RLS, audit (Playbook 04)
7. **Testes**: unit + integration + E2E
8. **Deploy**: CI/CD pipeline (Playbooks 07, deploy skill)

---

## 03. Database-First

**Principio**: "O banco deve ser desenhado e aprovado ANTES de qualquer linha de codigo."

### Fluxo

```
Requisitos → Diagrama → Aprovacao → Schema → Migrations → APIs → Frontend
```

### Checklist de Aprovacao

**Estrutura**: Entidades, relacionamentos, cardinalidades, nomes snake_case
**Tipos**: Tipos apropriados, precisao decimal, VARCHAR sizing, enums
**Constraints**: PKs, FKs (ON DELETE), UNIQUE, NOT NULL, CHECK
**Performance**: Indices para queries frequentes, compostos, particionamento
**Seguranca**: Campos sensiveis, RLS, audit trail

### Convencoes

| Elemento | Convencao | Exemplo |
|----------|-----------|---------|
| Tabelas | snake_case, plural | order_items |
| Colunas | snake_case | created_at |
| PKs | id | id |
| FKs | {tabela}_id | user_id |
| Indices | idx_{tabela}_{coluna} | idx_users_email |

### Anti-Patterns
- Comecar pelo frontend
- Criar tabelas ad-hoc
- Ignorar indices
- Esquecer audit trail
- RLS como afterthought

---

## 04. Seguranca by Design

### Niveis de Permissao

Defina niveis de acesso para sua aplicacao:

| Nivel | Acesso |
|-------|--------|
| admin | Acesso total |
| editor | CRUD nos recursos permitidos |
| viewer | Somente leitura |
| guest | Acesso publico limitado |

### Regras Inegociaveis

- **NUNCA logar**: password, token, secret, apiKey, creditCard
- Audit logging em todas operacoes CRUD
- Validacao de input em todas as APIs
- Sanitizacao de output (prevenir XSS)
- Rate limiting em endpoints publicos
- CORS restritivo (nao *)

### LGPD/Privacy

- Base legal definida para cada tratamento de dados
- Direito ao esquecimento implementado
- Minimizacao — coletar apenas o necessario
- Mascaramento de PII em contexto de IA

---

## 05. Otimizacao de Custos IA

### Selecao de Modelo

| Tarefa | Modelo Recomendado | Custo |
|--------|-------------------|-------|
| Planejamento, arquitetura | Opus | $$$ |
| Implementacao, debug | Sonnet | $$ |
| Lookups simples, scans | Haiku | $ |
| Formatacao, naming | Haiku | $ |

### Regras de Economia

1. Use Haiku para tasks que nao precisam de raciocinio complexo
2. Use Sonnet para implementacao padrao
3. Reserve Opus para decisoes arquiteturais e analise profunda
4. Limpe contexto entre fases (contexto cheio = respostas piores = mais tokens)
5. Seja especifico nos prompts (menos ambiguidade = menos tokens)

---

## 06. Desenvolvimento Paralelo

### Multi-Branch Strategy

```
main
  ├── feat/user-auth (agent 1)
  ├── feat/dashboard (agent 2)
  ├── feat/api-routes (agent 3)
  ├── fix/bug-batch (agent 4)
  └── refactor/services (agent 5)
```

### Regras

- Cada branch tem ownership exclusivo de arquivos
- Merge frequente da main para branches (evitar divergencia)
- Merge para main apenas com testes passando
- Resolver conflitos no branch, nao na main

---

## 07. Quality Assurance Pipeline

### Pipeline Completo

```
TypeCheck → Lint → Unit Tests → Integration Tests → Security Audit → E2E → Deploy
```

### Comando Universal

```bash
# Verificacao minima (rodar sempre)
[typecheck] && [lint] && [test]

# Verificacao completa (rodar antes de deploy)
[typecheck] && [lint] && [test] && [security-audit] && [e2e] && [build]
```

---

## 08. Gestao de Memoria e Contexto

### Problema

IA acumula contexto como humanos acumulam cansaco mental. Contexto cheio = respostas genericas.

### Solucao: Limpar Entre Fases

1. Fase de planejamento (PRD) → Salvar em arquivo → /clear
2. Fase de spec (SPEC) → Salvar em arquivo → /clear
3. Fase de execucao → Carregar SPEC → Executar
4. Fase de review → Carregar diff → Revisar

### Estado Persistente

Usar `docs/ai-state/session-state.json` para persistir progresso entre sessoes:

1. Salvar a cada 20 actions
2. Re-ler plano a cada 30 actions
3. Oferecer retomar sessao anterior
4. Sugerir /clear quando contexto > 60k tokens

---

## 09. Integracao de MCPs

### MCPs Disponiveis (Exemplos)

| MCP | Uso |
|-----|-----|
| GitHub | Commits, PRs, issues, releases |
| Filesystem | Leitura/escrita de arquivos |
| Browser | Automacao de browser |
| Memory | Persistencia de contexto |

### Regras de MCP

- Um MCP por vez (nunca paralelo)
- Validar output antes de prosseguir
- Se MCP falha → fallback para CLI

---

## 10. Automacao de Workflows

### Principios

- **Idempotencia**: executar 2x = mesmo resultado que 1x
- **Error handling**: retry + exponential backoff + logging + dead letter queue
- **Monitoramento**: alertas em falhas, dashboard de status

### Pattern de Automacao

```
Trigger → Validar Input → Processar → Verificar Output → Notificar
                                                            ↓
                                                     Se falha: retry (max 3x)
                                                            ↓
                                                     Se falha: dead letter queue
```
