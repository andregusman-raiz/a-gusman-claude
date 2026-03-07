# Playbook 08: Gestao de Memoria e Contexto

> Context Window = RAM. Filesystem = Disco. Use ambos sabiamente.

## Problema

O context window e limitado (~200K tokens). Conforme a sessao cresce, qualidade degrada.

## Principios

1. **Disco e persistente** — salvar estado no filesystem
2. **Contexto minimo** — carregar apenas o necessario
3. **Sessoes focadas** — uma tarefa por sessao
4. **Regra dos 60%** — se contexto > 60%, considerar nova sessao

## Persistent State (Disco)

| Arquivo | Proposito | Frequencia |
|---------|-----------|-----------|
| `session-state.json` | Estado do workflow | A cada 5 acoes |
| `findings.md` | Descobertas | Quando ha novidades |
| `errors-log.md` | Erros e solucoes | Por erro |
| `task_plan.md` | Plano de execucao | Inicio de tarefa |
| `SPEC.md` | Especificacao | Fase de design |

### Regra dos 5/10
- A cada **5 tool calls**: salvar estado
- A cada **10 tool calls**: reler o plano

## Quando Limpar Contexto

- Contexto > 60% da janela
- Mudanca de tarefa/projeto
- Apos completar um workflow
- Quando comeca a "esquecer" instrucoes

## Como Limpar

1. Salvar estado em session-state.json
2. Salvar descobertas em findings.md
3. Iniciar nova sessao
4. Carregar apenas: CLAUDE.md + session-state + tarefa atual

## O que Carregar na Nova Sessao

**Obrigatorio**: CLAUDE.md (automatico), session-state.json, task_plan.md

**Opcional**: findings.md, errors-log.md, SPEC.md

## Anti-Patterns

| Anti-Pattern | Solucao |
|-------------|---------|
| Sessao infinita | Nova sessao a cada workflow |
| Carregar tudo | Apenas o necessario |
| Nao salvar estado | Regra dos 5/10 |
| Re-explorar | Usar findings.md |
| Historico longo | Condensar ou nova sessao |
