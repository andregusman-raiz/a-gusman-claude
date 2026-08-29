#!/usr/bin/env bash
# wrapper: logica real em de-pr-queue-guard.py (anti falso-positivo de heredoc)
#
# F0b (SPEC-metodologia-cockpit-2026-08-28.md §7.3 item 3): trazido para o
# repo a-gusman-claude (~/Claude/.claude/hooks/) -- antes so existia em
# ~/.claude/hooks/ (fora de qualquer repo, sem historico/PR/review). Caminho
# agora e RELATIVO a este arquivo (nao mais $HOME/.claude/hooks fixo) para
# que a copia do repo exec a copia do repo, nao a antiga fora do repo.
#
# GAP DECLARADO: ~/.claude/settings.json (global, FORA deste repo) ainda
# aponta para `bash ~/.claude/hooks/de-pr-queue-guard.sh` -- o arquivo
# antigo fora do repo. Nao foi editado (nem apagado) por esta PR: editar
# arquivo fora do worktree e proibido pelas regras desta entrega. Para este
# hook corrigido entrar em vigor, alguem com acesso a $HOME precisa trocar
# esse comando para `bash ~/Claude/.claude/hooks/de-pr-queue-guard.sh` (o
# mesmo padrao ja usado para scripts/, que e symlink para o repo).
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec /usr/bin/env python3 "$DIR/de-pr-queue-guard.py"
