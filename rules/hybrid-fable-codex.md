# Híbrido Fable + Codex — SPEC como contrato

> Fluxo: **Fable pensa, Codex constrói, Claude revisa e simplifica.** O handoff nunca é conversa — é SPEC em arquivo.
> Racional: quotas independentes (Claude + ChatGPT); Fable caro/raro para decisões; Codex ~3-10x mais token-eficiente para a maratona de edits — mas escreve ~150-300% do código necessário e segue instruções ao pé da letra (inclusive as destrutivas). O fluxo existe para explorar as forças e conter as fraquezas dos dois.

## Fluxo canônico (4 fases + juiz)

```
1.  SPEC     → Fable (/ag-especificar-solucao, /ag-depurar-erro, /ag-avaliar-arquitetura)
               Saída: <repo>/docs/specs/SPEC-<slug>.md
1b. JUDGE    → Codex-juiz via MCP (/ag-adversario Ato 2, read-only, loop APPROVED/REVISE)
               Obrigatório para SPEC de 3+ arquivos. Fable NÃO julga a própria SPEC
               (viés comprovado de auto-aprovação — não critica trabalho que ele mesmo fez).
2.  BUILD    → cbuild <spec> — codex --profile build exec em WORKTREE ISOLADO
3.  REVIEW   → Claude (pr-review-toolkit:code-reviewer, sonnet/opus) — autor ≠ revisor; re-roda gates
4.  SIMPLIFY → Claude: passe de minimalidade no diff aprovado ("qual o menor diff que resolve?
               o que dá para deletar?"). NÃO opcional: Codex superproduz código por natureza.
```

## Dois canais Codex (papéis distintos, não colidem)

| Canal | Fase | Papel | Escrita? |
|---|---|---|---|
| MCP `mcp__codex__codex`/`codex-reply` | 1b (entre spec e plan) | Juiz adversarial do `ag-adversario` (sandbox read-only, approval never) | nunca |
| CLI `codex --profile build exec` (via `cbuild`) | 2 (build) | Executor da SPEC em sessão própria (sobrevive ao Claude) | só no worktree |

## Requisitos da SPEC (spec-lint do cbuild BLOQUEIA sem isso)

- **Decisões fechadas**: arquitetura, nomes, contratos, schema — zero "a definir"/"TBD"
- **Critérios de aceite verificáveis** (comando + resultado esperado)
- **Gates do repo** explícitos (typecheck/lint/test do projeto)
- **Escopo negativo**: o que NÃO tocar

## Guardrails anti-destrutivos (cbuild injeta SEMPRE no prompt)

Codex executa instruções literalmente — há casos públicos documentados de `rm -rf` no $HOME e drop de banco de produção sob goals agressivos. A literalidade joga a favor: cláusula escrita = enforcement real nele.

- NUNCA deletar/mover arquivos fora do worktree do repo
- NUNCA tocar banco, infra, secrets ou serviços externos (nem "para testar")
- NUNCA `git push --force`, `reset --hard` em branch compartilhada, `rm -rf`
- Ação irreversível ou fora do escopo da SPEC → PARE e pergunte

## Handoff

Atalho canônico: `cbuild [--dry-run] [--no-worktree] <spec-path> [gates]` (`.claude/scripts/codex-build.sh`):

1. **spec-lint**: exige critérios de aceite + escopo negativo; "TBD/a definir" bloqueia (relax: `CBUILD_LINT_RELAX=1`)
2. **worktree isolado**: `.codex/worktrees/<slug>` + branch `codex/<slug>` (copia a SPEC se ainda não commitada)
3. **prompt canônico** com guardrails anti-destrutivos injetados
4. **re-verificação local**: cbuild re-roda os gates no worktree ao final (não confia no "passou" do Codex)
5. **log auditável**: append em `~/.codex/handoffs.jsonl` (spec, repo, branch, exit codes)

## Quando usar híbrido vs Claude direto

| Cenário | Rota |
|---|---|
| Feature/refactor multi-arquivo com SPEC fechada | Híbrido (Fable→Codex→Claude) |
| Tarefa longa/persistente (horas de retry até convergir) | Codex — stamina + compaction melhores, custo ~1/3 |
| "Tanto faz quem faz" (tarefa média, qualquer um resolve) | Codex primeiro (poupa quota Claude); escala se falhar |
| Fix pontual, ajuste 1-2 arquivos | Claude direto (ag-2) |
| Design/UI do zero, mocks, decisão visual | Claude — nunca Codex (compliance com design system ok, criação não) |
| "Quero que MERGE com diff mínimo" | Claude direto, ou Codex + SIMPLIFY obrigatório |
| Exploração/diagnóstico sem SPEC | Claude (nunca Codex — ele implementa, não investiga) |
| Quota ChatGPT esgotada | Fallback EXPLÍCITO para sonnet (avisar; nunca troca silenciosa) |

## Regras inegociáveis

1. **Codex nunca decide arquitetura.** Ambiguidade na SPEC → devolve perguntas, não improvisa (cláusula no prompt + AGENTS.md).
2. **Autor ≠ revisor, nos DOIS sentidos**: Fable não julga a própria SPEC (→ juiz Codex, fase 1b); Codex não revisa o próprio diff (→ review Claude, fase 3).
3. **Gates rodam nos dois pontos**: Codex ao final do build; cbuild re-roda localmente (mecânico, não disciplina).
4. **SPEC fraca = handoff bloqueado** (spec-lint do cbuild).
5. **Build SEMPRE em worktree isolado** — nunca no working tree ativo (`--no-worktree` só em repo dedicado/descartável).
6. **SIMPLIFY antes de merge** de qualquer build Codex não-trivial.
7. Commits do Codex seguem as mesmas convenções (conventional commits EN, feature branch + PR).

## Config

- Profile build: `~/.codex/build.config.toml` (`gpt-5.6-sol` + `model_reasoning_effort = "xhigh"`). Formato codex-cli ≥0.142: profile = arquivo separado, NÃO `[profiles.x]` no config.toml.
- Variantes `-codex` (ex: `gpt-5.5-codex`) NÃO são suportadas em conta ChatGPT (erro 400) — usar o modelo base.
- Default global (`~/.codex/config.toml`): `model_reasoning_effort = "medium"` — asks avulsos e gusman-os não queimam quota; `xhigh` SÓ no profile build (verificado 2026-07-18).
