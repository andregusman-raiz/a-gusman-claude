# ADR-0002 — Transição do harness para a era Fable 5

- **Status**: Aceita
- **Data**: 2026-06-11
- **Decisores**: Andre Gusman + auditoria 7D multi-agente (workflow harness-overhaul-audit, 37 agentes)
- **Sucede**: ADR-0001 (consolidação pós-Opus 4.7) — NÃO a substitui; ADR-0001 permanece como registro histórico.

## Contexto

O harness inteiro foi desenhado para o mundo Opus/Sonnet: tabela de routing com 3 tiers, 7 skills "Opus por design", mecanismo `opus-on/off`, ADR-0001 ancorado nominalmente em "Opus 4.7 1M context". Em 2026-06 a sessão principal passou a rodar **Fable 5** (`claude-fable-5[1m]`, tier Mythos acima do Opus 4.8), mas havia **zero menções a Fable** em rules/skills/scripts — o routing instruía downgrade ativo da sessão (`/model sonnet`) e as skills deep-reasoning pinavam o segundo melhor modelo.

## Decisão

1. **Tabela de routing de 4 tiers** (haiku/sonnet/opus/fable) — casa única no CLAUDE.md global. Sessão principal fable; subagents default sonnet explícito; opus vira degrau de escalonamento, não design.
2. **9 skills deep-reasoning** (as 7 originais + ag-arquiteto-raiz + ag-auditar-harness) migram para `model: fable` + frontmatter `tier: deep-reasoning`. A frase "Opus por design" sai do vocabulário → "Fable por design".
3. **Fallback em cadeia**: `model-fallback.sh` substitui `opus-fallback.sh` (mantido como shim). `fable-off` (fable→opus), `opus-off` (→sonnet), `fable-on` (restaura). Estado em `~/.claude/state/model-mode.txt`. Lista de skills derivada DINAMICAMENTE do frontmatter (`tier: deep-reasoning`) — o script antigo tinha 7 hardcoded e 9 reais. Spawns hardcoded em corpo de machine (ag-7/8/9/auditar-harness) levam marker `model-fallback:managed` e são cobertos pelo mesmo sed.
4. **Premissas do ADR-0001 confirmadas**: 1M context (Fable também roda `[1m]`), `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=85`, inline KBs e menos reference skills continuam válidos. Só a ancoragem nominal "Opus 4.7" caduca.

## Alternativas descartadas

- **Herdar modelo da sessão nas skills deep-reasoning** (sem pin): falha quando a skill é invocada de dentro de subagent sonnet — perderia o tier topo exatamente nos casos que o justificam.
- **Manter opus como design e fable só na main**: desperdiça o tier Mythos nas tarefas de raciocínio profundo que motivaram o conceito "opus por design".
- **Matar o mecanismo de fallback**: rate limits de Fable existem; a infra (state file + SessionStart auto) já estava madura — evoluir custou menos que recriar.

## Consequências

- Quota Fable passa a ser consumida pelas 9 skills deep-reasoning e pelos engines MERIDIAN/SENTINEL/FORTRESS (aprovado pelo dono em 2026-06-11).
- `opus-mode.txt` é migrado automaticamente para `model-mode.txt` na primeira execução.
- Aliases legados (`opus-off`, `opus-on`, `opus-status`) seguem funcionando via shim + novo script.
