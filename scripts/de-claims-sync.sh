#!/usr/bin/env bash
# de-claims-sync.sh — reconcilia claims.json com o estado real do PR no GitHub.
set -euo pipefail

REPO="${REPO:-Raiz-Educacao-SA/raiz-data-engine}"
Q="$HOME/Claude/docs/ai-state/de-pr-queue"
CLAIMS="$Q/claims.json"

usage() {
  cat <<'EOF'
Uso: de-claims-sync.sh [--apply]

Reconcilia docs/ai-state/de-pr-queue/claims.json com o estado real do PR
no GitHub (gh pr view --json state,mergedAt,isDraft), para claims com
'pr' numerico e status ainda nao terminal
(merged/closed/cancelado-dedup/closed-nao-remendar).

  GitHub state=MERGED -> status=merged, synced_at=<ISO>
  GitHub state=CLOSED (nao merged) -> status=closed, synced_at=<ISO>

Tambem lista claims ativos (status nao terminal) sem campo 'frente'.

Default: dry-run, so imprime a tabela de mudancas propostas.
--apply: grava claims.json (faz backup claims.json.bak-<timestamp> ANTES,
sempre, mesmo sem mudancas a aplicar). Nunca remove claims.
EOF
}

APPLY=0
for a in "$@"; do
  case "$a" in
    --help|-h) usage; exit 0 ;;
    --apply) APPLY=1 ;;
    *) echo "arg desconhecido: $a" >&2; exit 2 ;;
  esac
done

[[ -f "$CLAIMS" ]] || { echo "claims.json nao encontrado: $CLAIMS" >&2; exit 1; }
command -v gh >/dev/null || { echo "gh CLI nao encontrado no PATH" >&2; exit 1; }

REPO="$REPO" CLAIMS="$CLAIMS" APPLY="$APPLY" python3 <<'PYEOF'
import json, os, subprocess, sys, time

REPO = os.environ["REPO"]
CLAIMS = os.environ["CLAIMS"]
APPLY = os.environ["APPLY"] == "1"
TERMINAL = {"merged", "closed", "cancelado-dedup", "closed-nao-remendar"}

with open(CLAIMS) as f:
    data = json.load(f)

claims = data.get("claims", {})
changes = []
sem_frente = []
errors = []

for branch, c in claims.items():
    pr = c.get("pr")
    status = c.get("status")
    if status not in TERMINAL and "frente" not in c:
        sem_frente.append((branch, pr, status))
    if not isinstance(pr, int) or status in TERMINAL:
        continue
    try:
        r = subprocess.run(
            ["gh", "pr", "view", str(pr), "-R", REPO, "--json", "state,mergedAt,isDraft"],
            capture_output=True, text=True, timeout=20,
        )
        if r.returncode != 0:
            errors.append((branch, pr, r.stderr.strip()[:200]))
            continue
        info = json.loads(r.stdout)
    except Exception as e:
        errors.append((branch, pr, str(e)))
        continue

    gh_state = info.get("state")
    new_status = None
    if gh_state == "MERGED":
        new_status = "merged"
    elif gh_state == "CLOSED":
        new_status = "closed"
    if new_status and new_status != status:
        changes.append((branch, pr, status, new_status))

now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

print(f"claims ativos (status nao-terminal): {sum(1 for c in claims.values() if c.get('status') not in TERMINAL)}")
print()
print("== mudancas propostas (gh pr view) ==")
if not changes:
    print("(nenhuma)")
for branch, pr, old, new in changes:
    print(f"  {branch}  PR#{pr}  {old} -> {new}")

print()
print("== claims ativos sem 'frente' ==")
if not sem_frente:
    print("(nenhum)")
for branch, pr, status in sem_frente:
    print(f"  {branch}  PR#{pr}  status={status}")

if errors:
    print()
    print("== erros gh pr view (nao aplicados) ==")
    for branch, pr, err in errors:
        print(f"  {branch}  PR#{pr}  ERRO: {err}")

if not APPLY:
    print()
    print("[dry-run] nada gravado. Rode com --apply para persistir as mudancas acima.")
    sys.exit(0)

backup_path = f"{CLAIMS}.bak-{int(time.time())}"
with open(CLAIMS) as f:
    raw = f.read()
with open(backup_path, "w") as f:
    f.write(raw)
print()
print(f"backup gravado: {backup_path}")

for branch, pr, old, new in changes:
    claims[branch]["status"] = new
    claims[branch]["synced_at"] = now_iso

data["claims"] = claims
with open(CLAIMS, "w") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")

print(f"claims.json atualizado com {len(changes)} mudanca(s).")
PYEOF
