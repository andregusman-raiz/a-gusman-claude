# Híbrido Fable + Codex — SPEC como contrato

> Fluxo: **Fable pensa, Codex constrói, Claude revisa.** O handoff nunca é conversa — é SPEC em arquivo.
> Racional: quotas independentes (Claude + ChatGPT); Fable caro/raro para decisões, GPT-5.5 xhigh para a maratona de edits.

## Fluxo canônico

```
1. SPEC   → Fable (/ag-especificar-solucao, /ag-depurar-erro, /ag-avaliar-arquitetura)
            Saída: <repo>/docs/specs/SPEC-<slug>.md
2. BUILD  → codex --profile build exec (gpt-5.5 + xhigh; profile em ~/.codex/build.config.toml)
3. REVIEW → Claude (pr-review-toolkit:code-reviewer, sonnet/opus) — quem revisa ≠ quem escreveu
```

## Requisitos da SPEC (sem isso, NÃO faz handoff)

- **Decisões fechadas**: arquitetura, nomes, contratos, schema — zero "a definir"
- **Critérios de aceite verificáveis** (comando + resultado esperado)
- **Gates do repo** explícitos (typecheck/lint/test do projeto)
- **Escopo negativo**: o que NÃO tocar

## Prompt-template de handoff (canônico)

```bash
codex --profile build exec "Implemente docs/specs/SPEC-X.md À RISCA.
Não altere decisões de arquitetura. Se encontrar ambiguidade ou a SPEC
conflitar com o código, PARE e liste as dúvidas — não improvise.
Ao final: rode <gates do repo> e reporte o resultado real (falhas incluídas)."
```

Atalho: `cbuild <spec-path>` (script `.claude/scripts/codex-build.sh`) monta esse prompt.

## Quando usar híbrido vs Claude direto

| Cenário | Rota |
|---|---|
| Feature/refactor multi-arquivo com SPEC fechada | Híbrido (Fable→Codex→Claude) |
| Fix pontual, ajuste 1-2 arquivos | Claude direto (ag-2) |
| Exploração/diagnóstico sem SPEC | Claude (nunca Codex — ele implementa, não investiga) |
| Quota ChatGPT esgotada | Fallback EXPLÍCITO para sonnet (avisar; nunca troca silenciosa) |

## Regras inegociáveis

1. **Codex nunca decide arquitetura.** Ambiguidade na SPEC → devolve perguntas, não improvisa (cláusula no prompt + AGENTS.md).
2. **Review sempre por Claude** — o autor não revisa o próprio diff.
3. **Gates rodam nos dois pontos**: Codex roda ao final do build; Claude re-roda no review (não confiar em "passou" reportado).
4. **SPEC fraca = handoff bloqueado.** Sem critérios de aceite verificáveis, volta para a fase de spec.
5. Commits do Codex seguem as mesmas convenções (conventional commits EN, feature branch + PR).

## Config

- Profile: `~/.codex/build.config.toml` (`gpt-5.5` + `model_reasoning_effort = "xhigh"`). Formato novo do codex-cli ≥0.142: profile = arquivo separado, NÃO `[profiles.x]` no config.toml.
- `gpt-5.5-codex` NÃO é suportado em conta ChatGPT (erro 400) — usar `gpt-5.5`.
- Default global segue `medium` (asks do gusman-os não queimam quota).
