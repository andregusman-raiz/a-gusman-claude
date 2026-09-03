#!/usr/bin/env bash
# secret-read-guard.sh — PreToolUse Read|Edit|Write: bloqueia ficheiros de segredo (.env*, *.pem, *.key, ~/.ssh, **/secrets/**).
# POR QUE (03/09, Claude Code 2.1.259): as regras `permissions.deny: Read(**/.env*)`, `Read(**/*.pem)`... (de 03/2026) passaram a
# fazer o motor de permissoes PERGUNTAR ao dono em todo Bash com `cd ...; grep/cat ficheiro` — "a Read() deny rule is configured;
# only you can approve" — mesmo em bypass. 209 comandos desse formato so hoje, em 12 terminais: cada um parava um papel ate
# alguem carregar Yes. A proteccao passa para aqui (deterministica, sem prompt); `bash-guards.sh` ja cobre cat/grep de segredos.
# Bypass: SECRET_GUARD_DISABLED=1.
[ "${SECRET_GUARD_DISABLED:-}" = "1" ] && exit 0
IN=$(cat); FP=$(printf '%s' "$IN" | python3 -c "import sys,json
try: d=json.load(sys.stdin); print((d.get('tool_input') or {}).get('file_path') or (d.get('tool_input') or {}).get('path') or '')
except Exception: print('')" 2>/dev/null)
[ -z "$FP" ] && exit 0
case "$FP" in
  *"/.env"|*"/.env."*|".env"|".env."*|*".pem"|*".key"|"$HOME/.ssh/"*|*"/.ssh/"*|*"/secrets/"*)
    echo "BLOCKED (secret-read-guard): '$FP' e' ficheiro de segredo — nao se le nem se edita a partir de uma sessao. Bypass pontual: SECRET_GUARD_DISABLED=1." >&2; exit 2;;
esac
exit 0
