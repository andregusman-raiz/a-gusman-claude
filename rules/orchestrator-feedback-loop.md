# Orchestrator Feedback Loop

## Objetivo
Garantir que o sistema aprenda com sessões longas, evitando que aprendizados sejam perdidos
entre conversas. Funciona como complemento ao MEMORY.md (que é manual/seletivo).

## Quando disparar retrospectiva sugestiva

ag-0-orquestrador deve sugerir `/ag-retrospectiva` ao usuário quando QUALQUER sinal abaixo:

1. **>= 5 machines invocadas** na sessão atual (build → test → fix → deploy → audit, etc.)
2. **>= 3 PRs criados** no dia atual
3. **Sessão > 4 horas ativas** (heurística por mtime de session-state.json)
4. **>= 2 falhas de CI consecutivas** (sinal de friction não resolvida)
5. **Usuário pergunta "estou indo bem?"** ou similar

## Como detectar

Script canonical:
```bash
bash ~/Claude/.claude/scripts/session-retro-check.sh
# Exit 1 = sugerir retrospectiva. Exit 0 = ainda não.
```

ag-0 pode rodar isso no Quality Gate (Step 8 do checklist) quando notar conclusão de tarefa grande.

## Output sugestivo (não imposto)

Padrão: ag-0 propõe, usuário aceita ou pula.

```
> Notei que esta sessão acumulou X machines + Y PRs.
> Sugiro pipeline de fim:
>   /ag-retrospectiva  — destilar decisões/falhas/tempo
>   /ag-insights       — tokens/custo/trends
>   /ag-thinkback      — replay decisões questionáveis
>
> Roda agora ou pula?
```

## Persistência dos aprendizados

Output do `/ag-retrospectiva` deve atualizar:
- `~/Claude/.claude/projects/-Users-andregusmandeoliveira-Claude/memory/feedback_*.md`
- `~/Claude/.claude/docs/ai-state/session-YYYY-MM-DD-<slug>.md` (handoff)

Se usuário diz "agora chega" / "encerrar" / "fim" → ag-0 sugere automaticamente.

### Integração com --full

O modo `--full` do ag-0-orquestrador inclui **Fase 7 FINALIZE** como gatilho automático de retrospectiva ao final do pipeline. Quando `--full` conclui todos os PRs:

1. `/ag-retrospectiva` é invocado automaticamente (sem precisar do `session-retro-check.sh`)
2. Output alimenta `feedback_*.md` + handoff `session-YYYY-MM-DD.md`
3. Padrões identificados nas 7 fases (especialmente decisões do BRAINSTORM e aprendizados do TDD) devem ser priorizados no update de MEMORY

Referência: seção `## Modo --full` em `~/.claude/skills/ag-0-orquestrador/SKILL.md`.

## Anti-padrões

- NÃO rodar retrospectiva automaticamente sem perguntar
- NÃO empilhar sugestões em sessões curtas (<5 machines)
- NÃO duplicar feedback já em MEMORY.md (consultar antes de escrever)

## Integração com hooks (futuro)

Idealmente o Stop hook do Claude Code rodaria `session-retro-check.sh --quiet` e injetaria sugestão
no fechamento da sessão. Por ora, ag-0 invoca manualmente no Quality Gate.
