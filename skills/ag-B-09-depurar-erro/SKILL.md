---
name: ag-B-09-depurar-erro
description: "Diagnostica e corrige bugs. Le errors-log.md antes de comecar para nao repetir tentativas que ja falharam. Use quando algo nao funciona, da erro, quebrou, trava, build falha, ou qualquer comportamento inesperado."
model: opus
argument-hint: "[erro ou descricao do problema]"
disable-model-invocation: true
---

# ag-B-09 — Depurar Erro

Spawn the `ag-B-09-depurar-erro` agent to diagnose and fix bugs using root cause analysis.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-B-09-depurar-erro`
- `mode`: `bypassPermissions`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Dynamic Context
- **Errors known**: !`head -30 docs/ai-state/errors-log.md 2>/dev/null || echo "none"`

## Prompt Template

```
Projeto: [CWD or user-provided path]
Erro: [error message or description from $ARGUMENTS]
Contexto: [when it happens, what changed, environment]

Fluxo: Reproduzir → Isolar → Diagnosticar → Corrigir → Verificar.
- Ler errors-log.md ANTES de comecar (nao repetir tentativas falhadas)
- Encontrar causa raiz, NAO apenas sintoma
- Verificar SEMPRE se existem multiplas causas independentes
- Max 2 tentativas de fix por causa — escalar ao usuario se nao resolver
- Registrar diagnostico e resolucao em errors-log.md
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user that the debug agent is running
- Reads errors-log.md to avoid repeating failed attempts
- Follows root-cause-debugging.md protocol

## Decision Tree: Classifying the Bug

```
BUG REPORTADO
├── Fix aplicado mas bug persiste? → DEPLOY GAP
│   ├── Verificar: build atual reflete o codigo?
│   ├── Verificar: cache (CDN, browser, server) invalidado?
│   ├── Verificar: processo reiniciado apos deploy?
│   └── Verificar: deploy foi para o ambiente correto (prod vs staging)?
│
├── Bug aparece em camadas diferentes? → MULTI-LAYER BUG
│   ├── Frontend: componente renderiza dado errado?
│   ├── Backend: API retorna valor incorreto?
│   ├── Config: variavel de ambiente ausente ou errada?
│   └── → Rastrear da UI ate banco — corrigir TODAS as camadas
│
├── Funciona para alguns users mas nao outros? → PERMISSION/ACL BUG
│   ├── RLS policy inconsistente entre tabelas relacionadas?
│   ├── Role/claim ausente no JWT?
│   ├── Middleware valida permissao diferente da query?
│   └── → Auditar toda a cadeia: JWT → middleware → RLS → query
│
└── Bug unico e isolado? → SINGLE-CAUSE BUG
    └── Fluxo padrao: Reproduzir → Root Cause → Fix → Verificar
```

## Multi-Cause Investigation Protocol

Apos corrigir a primeira causa raiz, SEMPRE executar:

```
1. O fix eliminou completamente o erro ou apenas reduziu?
   → Se apenas reduziu: existe causa adicional independente

2. Mapear todos os caminhos de codigo que poderiam produzir o mesmo sintoma:
   - Caminho A: [causa 1] → verificar se foi corrigido
   - Caminho B: [causa 2] → verificar se existe
   - Caminho C: [causa 3] → verificar se existe

3. Para cada causa identificada:
   - Corrigir independentemente
   - Verificar individualmente
   - Documentar no errors-log.md como causa separada

4. Fix considerado completo SOMENTE quando:
   - Cenario original nao reproduz mais
   - Variacoes do cenario tambem nao reproduzem
   - Nenhum caminho alternativo para o bug existe
```

## Deploy Gap Checklist

Quando fix foi aplicado mas bug ainda aparece em producao:

```
[ ] git log --oneline -5  → commit do fix esta no historico?
[ ] CI/CD pipeline → build passou? deploy completou?
[ ] curl -I <url> → headers mostram versao/timestamp atualizado?
[ ] Hard refresh (Ctrl+Shift+R) → elimina cache do browser?
[ ] CDN purge necessario? (Vercel: automatic, outros: manual)
[ ] Server-side cache? (Redis, in-memory) → invalidar ou reiniciar
[ ] Environment correto? (VERCEL_ENV, NODE_ENV, APP_ENV)
[ ] Feature flag desabilitando o fix em prod?
[ ] Multiple replicas? → rolling deploy pode manter versao antiga por minutos
```

## Multi-Layer Bug: Rastreamento Completo

Para bugs que envolvem frontend + backend + config:

```
CAMADA UI
└── O componente recebe o dado correto?
    └── Console.log / React DevTools → qual valor chega?

CAMADA API/SERVICE
└── O endpoint retorna o valor correto?
    └── curl / Postman → testar endpoint diretamente

CAMADA NEGOCIO
└── A logica de negocio processa o dado corretamente?
    └── Unit test isolado → confirmar comportamento esperado

CAMADA DADOS
└── O banco retorna o dado correto?
    └── Query direta no banco → confirmar dados em storage

CAMADA CONFIG
└── Variaveis de ambiente corretas?
    └── printenv | grep <VAR> → confirmar valores reais vs esperados

REGRA: Fix incompleto se qualquer camada ainda propaga o erro.
       Documentar cada camada no errors-log.md separadamente.
```

## Permission/ACL Inconsistency Protocol

Para bugs de permissao que afetam apenas alguns usuarios/roles:

```
1. IDENTIFICAR o escopo:
   - Afeta role especifica? (admin, user, guest)
   - Afeta recurso especifico? (tabela, rota, componente)
   - Afeta operacao especifica? (read, write, delete)

2. AUDITAR a cadeia completa:
   JWT/Session → Middleware → Route Guard → API → RLS Policy → Query

3. VERIFICAR consistencia entre camadas:
   - Middleware permite role X? → RLS tambem permite role X?
   - Frontend esconde botao para role Y? → Backend tambem bloqueia para role Y?
   - NUNCA confiar apenas em UI para seguranca

4. TESTAR com usuario real de cada role afetada:
   - Criar token/session com role especifica
   - Executar operacao que falha
   - Confirmar fix para cada role

5. EXEMPLOS de inconsistencias comuns:
   - RLS policy usa auth.uid() mas middleware verifica user_id diferente
   - Role 'editor' tem RLS mas nao tem claim no JWT
   - Tabela A tem RLS correto, tabela B relacionada nao tem
   - Middleware novo adicionado sem atualizar RLS correspondente
```

## Escalacao: Issue para Problemas Nao Resolvidos

Apos esgotar 2 tentativas de fix sem sucesso, ALEM de escalar ao usuario:

1. Spawnar ag-M-50 para registrar GitHub Issue com contexto completo:
```
Agent({
  subagent_type: "ag-M-50-registrar-issue",
  name: "issue-registrar",
  model: "haiku",
  run_in_background: true,
  prompt: "Repo: [detectar via git remote]\nOrigem: ag-B-09\nSeveridade: [P0 se prod, P1 se dev]\nTitulo: [descricao concisa do bug]\nContexto: [erro completo + 2 tentativas de fix + por que falharam]\nArquivos: [arquivos investigados]\nLabels: bug"
})
```
2. Isso garante que o problema nao se perde mesmo se o usuario nao agir imediatamente.

## Output
- Bug(s) corrigido(s) com TODAS as causas raiz documentadas
- docs/ai-state/errors-log.md atualizado (sintoma, causas, tentativas, solucao)
- Deploy verificado: versao com fix ativa em producao
- Teste de regressao sugerido ou criado via ag-Q-13
- **Se nao resolvido**: GitHub Issue criada via ag-M-50 com todo o contexto

## Anti-Patterns
- NUNCA parar na primeira causa — investigar se existem causas independentes adicionais
- NUNCA ignorar Deploy Gap — se bug persiste apos fix, SEMPRE verificar se deploy esta ativo
- NUNCA corrigir sem reproduzir — fix sem reproducao e chute
- NUNCA repetir tentativa que ja falhou — ler errors-log.md ANTES
- NUNCA usar `as any` ou try/catch generico como "fix" — mascara o problema
- NUNCA assumir bug e de camada unica sem rastrear da UI ate o banco
- NUNCA considerar fix de permissao completo sem testar cada role afetada
- NUNCA marcar como resolvido se apenas alguns usuarios estao corrigidos

## Quality Gate
- [ ] Causa raiz identificada (nao apenas sintoma)?
- [ ] Investigou se existem multiplas causas independentes?
- [ ] Rastreou todas as camadas afetadas (UI, API, config, dados)?
- [ ] Verificou consistencia de permissoes em toda a cadeia (JWT → RLS)?
- [ ] Fix resolve o problema sem criar novos?
- [ ] Fix verificado (rodou cenario que falhava)?
- [ ] Deploy Gap descartado (versao com fix esta servindo em prod)?
- [ ] errors-log.md atualizado com TODAS as causas?
