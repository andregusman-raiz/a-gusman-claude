# Bypass Ops — operação humana dos guards (NÃO auto-carregado)

> Movido do CLAUDE.md em 2026-06-11 (auditoria de segurança): documentar a chave de bypass
> no contexto que o próprio agente lê torna o guard auto-bypassável (inclusive sob prompt
> injection). Este arquivo é consulta HUMANA / on-demand deliberada.
> Nota técnica: `export VAR=1` dentro de um Bash tool call NÃO propaga ao processo do hook —
> bypasses de env var só funcionam exportados no shell que LANÇA o claude (ou via settings env).

| Guard | Evento | Bypass |
|---|---|---|
| completion-gate.py | Stop | `COMPLETION_GATE_DISABLED=1` |
| gap-acceptance-guard.py | Stop | `GAP_GUARD_DISABLED=1` |
| orq-goal-guard.sh | Stop | `ORQ_GOAL_GUARD_DISABLED=1` ou flag one-shot `docs/ai-state/orq-goal-bypass.flag` (exige permission prompt — NÃO allowlistar) |
| bash-guards.sh (via pre-bash-dispatch) | PreToolUse Bash | `BASH_GUARDS_DISABLED=1` |
| stack-deny-list.sh / new-project-guard.sh | PreToolUse Bash | `STACK_GUARD_BYPASS=1` (ADR obrigatória p/ tornar permanente) |
| config-guard.sh (via pre-write-dispatch) | PreToolUse Write | `CONFIG_GUARD_DISABLED=1` |
| gha-guard.sh (via pre-write-dispatch) | PreToolUse Write/Edit | `GHA_GUARD_DISABLED=1` |
| pdf-read-guard.sh | PreToolUse Read | `PDF_GUARD_DISABLED=1` (sessão) / `PDF_VISUAL=1` (pontual) |
| docs-location-guard.sh | PreToolUse Write | `DOCS_GUARD_DISABLED=1` |
| memory-guard.sh | PreToolUse TeamCreate | — (sem bypass; reduzir teammates) |
