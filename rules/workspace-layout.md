---
description: "Layout canônico do ~/Claude pós-reorg 2026-06-21 — onde cada coisa mora; impede sujeira no root e binários em repo"
paths:
  - "*"
  - "*.png"
  - "*.jpeg"
  - "*.jpg"
  - "*.pdf"
---

# Workspace Layout — onde cada coisa mora

> Reorg definitiva 2026-06-21. Plano: `docs/workspace/PLANO-reorganizacao-definitiva-claude-2026-06-21.md`.
> Enforcement: `.gitignore` (raiz + global `~/.gitignore_global`) + hook `workspace-hygiene-guard.sh` + housekeeping `workspace-housekeep.sh`.

## Estrutura top-level canônica

| Pasta | Conteúdo | Versionado? |
|---|---|---|
| `.claude/` | harness (repo a-gusman-claude) | sim (repo próprio) |
| `GitHub-raiz/` | repos com remote `Raiz-Educacao-SA/*` | cada repo |
| `GitHub-pessoal/` | repos com remote `andregusman-raiz/*` | cada repo |
| `Projetos/` | locais sem remote + `Projetos/_vendor/` (clones de terceiros) | cada repo |
| `conhecimento/` (=`assets/`) | knowledge-base + design-library | repo próprio |
| `docs/` | toda doc gerada (specs, diagnosticos, workspace, ai-state) | sim |
| `dados/` | datasets, dumps, dados de negócio | NÃO (gitignored) |
| `artefatos/` | screenshots, renders, saídas geradas | NÃO (gitignored) |
| `_quarentena/` | buffer pré-delete (TTL 30d) | NÃO |

## Regras de colocação (onde salvar)

1. **Nada solto no root** do workspace. Root só aceita config (`CLAUDE.md`, `AGENTS.md`, `package.json`, `.gitignore`, etc.).
2. **Screenshot/imagem/render** → `artefatos/screenshots/<projeto>/`. NUNCA no root nem dentro de repo de código.
3. **Dataset/dump/CSV de fonte** → `dados/<fonte>/`. NUNCA dentro de repo de código (externalizar + gitignore).
4. **Doc gerada** (SPEC/PRD/ADR/diagnóstico/relatório/plano) → `docs/<sub>/` ou `docs/workspace/<projeto>/` (regra `docs-location`).
5. **Repo novo** → bucket por owner do remote: org Raiz → `GitHub-raiz/`; conta pessoal → `GitHub-pessoal/`; sem remote → `Projetos/`.
6. **Binário pesado gerado** (*.glb/*.3mf/*.mp4/scrapes) → `dados/` ou storage externo, sempre gitignored. Nunca commitar no `.git` do repo.

## Classificação de repo (por FATO, não tema)

Owner do remote decide o bucket (verificável via `git remote get-url origin`), **não** o nome/tema do projeto. Repo "da Raiz" hospedado em conta pessoal vai para `GitHub-pessoal/`.

## Zona de exclusão

Projetos rodando em outro terminal NÃO são tocados por reorg/limpeza. Conferir antes de mover/limpar.

## Anti-regressão

- `.gitignore` raiz cobre todos os buckets pesados → shadow-git não snapshota GB.
- `~/.gitignore_global` cobre node_modules/caches/build em todo repo.
- `workspace-hygiene-guard.sh` (PreToolUse Write) bloqueia arquivo solto no root e imagem fora de `artefatos/`. Bypass: `WORKSPACE_HYGIENE_DISABLED=1`.
- `workspace-housekeep.sh` (semanal) limpa caches, move soltos→quarentena, reporta drift.

## ⚠ ANTES de mover/renomear um repo: checar dependências de path absoluto

Mover um repo quebra qualquer coisa com path hardcoded. Pré-checagem obrigatória:

1. **Daemons launchd**: `grep -rlE "Claude/(GitHub|projetos|GitHub-raiz|GitHub-pessoal|Projetos)/<repo>" ~/Library/LaunchAgents/`. Para cada `.plist` afetado: editar o path → reload (`launchctl unload && launchctl load`). Backup antes.
2. **Python `.venv`**: o venv tem **paths absolutos** nos shebangs de `bin/*` e no editable install (`site-packages/*.pth`). Após mover, corrigir: loop por `bin/*` + `sed` do path antigo→novo (NÃO usar `grep -r` — falha com os symlinks do venv; iterar arquivos direto). Validar `bin/<entrypoint> --help`.
3. **Outros**: cron (`crontab -l`), symlinks (`.shared`, claude_obsidian), configs com path absoluto.

Incidente de referência: reorg 2026-06-21 quebrou 9 daemons + venv do escuta (corrigidos). Ver [[feedback_mover_repo_quebra_daemon_venv]].
