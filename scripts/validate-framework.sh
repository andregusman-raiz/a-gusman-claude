#!/bin/bash
# Validates framework integrity
# Run: bash scripts/validate-framework.sh

set -euo pipefail

ERRORS=0
WARNINGS=0

error() { echo "ERROR: $1"; ERRORS=$((ERRORS+1)); }
warn() { echo "WARN: $1"; WARNINGS=$((WARNINGS+1)); }
ok() { echo "OK: $1"; }

echo "=== Claude Agent System — Framework Validation ==="
echo ""

# 1. Agent frontmatter validation
echo "--- Agents ---"
for f in agents/ag-*.md; do
  name=$(basename "$f" .md)

  # Check frontmatter exists
  if ! head -1 "$f" | grep -q "^---"; then
    error "$name: missing YAML frontmatter"
    continue
  fi

  # Check required fields
  for field in name description model tools; do
    if ! grep -q "^${field}:" "$f"; then
      error "$name: missing required field '$field'"
    fi
  done

  # Check model is valid
  model=$(grep "^model:" "$f" | awk '{print $2}' || true)
  if [[ -n "$model" ]] && ! echo "$model" | grep -qE "^(haiku|sonnet|opus)$"; then
    error "$name: invalid model '$model' (must be haiku|sonnet|opus)"
  fi
done
agent_count=$(ls agents/ag-*.md 2>/dev/null | wc -l | tr -d ' ')
ok "$agent_count agents validated"

# 2. Command-to-agent mapping
echo ""
echo "--- Commands ---"
for f in commands/ag*.md; do
  cmd=$(basename "$f" .md)
  # Extract agent name from command content
  if ! grep -q "agent\|skill" "$f" 2>/dev/null; then
    warn "$cmd: doesn't reference an agent or skill"
  fi
done
cmd_count=$(ls commands/ag*.md 2>/dev/null | wc -l | tr -d ' ')
ok "$cmd_count commands validated"

# 3. Skills have SKILL.md
echo ""
echo "--- Skills ---"
for d in skills/*/; do
  skill=$(basename "$d")
  if [[ ! -f "${d}SKILL.md" ]]; then
    error "skill/$skill: missing SKILL.md"
  fi
done
skill_count=$(find skills -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')
ok "$skill_count skills validated"

# 4. Hooks are executable
echo ""
echo "--- Hooks ---"
for f in hooks/*.sh; do
  if [[ ! -x "$f" ]]; then
    warn "$(basename $f): not executable (run chmod +x)"
  fi
  # Check for syntax errors
  if ! bash -n "$f" 2>/dev/null; then
    error "$(basename $f): syntax error"
  fi
done
hook_count=$(ls hooks/*.sh 2>/dev/null | wc -l | tr -d ' ')
ok "$hook_count hooks validated"

# 5. No hardcoded references
echo ""
echo "--- Hardcoded References ---"
HARDCODED=$(grep -rl "raizeducacao\|andregusman\|rAIz-AI-Prof\|rAIz_AI" \
  agents/ skills/ rules/ hooks/ CLAUDE.md Playbooks/ 2>/dev/null || true)
if [[ -n "$HARDCODED" ]]; then
  for f in $HARDCODED; do
    error "hardcoded reference in: $f"
  done
else
  ok "No hardcoded references found"
fi

# 5.5. Cross-reference: commands -> agents/skills
echo ""
echo "--- Cross-References ---"
for f in commands/ag*.md; do
  cmd=$(basename "$f" .md)
  content=$(cat "$f" 2>/dev/null)

  # Extract agent name from skill reference
  if echo "$content" | grep -q "ag-00-orquestrar\|ag-01-iniciar\|ag-02-setup\|ag-M-melhorar\|ag_skill-creator\|ag-22-testar-e2e\|ag-36-testar-manual\|ag-37-gerar-testes\|ag-38-smoke-vercel"; then
    # Skill-based command - check skill dir exists
    skill_ref=$(echo "$content" | grep -oE 'ag-[0-9]+-[a-z0-9-]+|ag-M-[a-z-]+|ag_skill-creator|ui-ux-pro-max|nextjs-react|python-patterns|supabase-patterns|typescript-patterns' | head -1)
    if [ -n "$skill_ref" ] && [ ! -d "skills/$skill_ref" ]; then
      warn "$cmd: references skill '$skill_ref' but skills/$skill_ref/ not found"
    fi
  fi
done
ok "Cross-references checked"

# 5.6. Agent frontmatter consistency
echo ""
echo "--- Frontmatter Consistency ---"
for f in agents/ag-*.md; do
  name=$(basename "$f" .md)

  # Check maxTurns is present and valid
  max_turns=$(grep "^maxTurns:" "$f" 2>/dev/null | awk '{print $2}' || true)
  if [ -z "$max_turns" ]; then
    warn "$name: missing maxTurns field"
  elif ! echo "$max_turns" | grep -qE '^[0-9]+$'; then
    error "$name: invalid maxTurns '$max_turns' (must be numeric)"
  fi

  # If has TeamCreate in tools, maxTurns should be >= 80
  if grep -q "TeamCreate" "$f" 2>/dev/null && [ -n "$max_turns" ]; then
    if [ "$max_turns" -lt 80 ] 2>/dev/null; then
      warn "$name: has Teams but maxTurns=$max_turns (recommend >= 80)"
    fi
  fi

  # Check disallowedTools don't overlap with tools
  if grep -q "^disallowedTools:" "$f" 2>/dev/null; then
    disallowed=$(sed -n '/^disallowedTools:/,/^[^ -]/p' "$f" | grep "^ *-" | sed 's/.*- //' || true)
    allowed=$(sed -n '/^tools:/,/^[^ -]/p' "$f" | grep "^ *-" | sed 's/.*- //' || true)
    for tool in $disallowed; do
      if echo "$allowed" | grep -q "^${tool}$" 2>/dev/null; then
        error "$name: '$tool' in both tools and disallowedTools"
      fi
    done
  fi
done
ok "Frontmatter consistency checked"

# 6. Rules exist
echo ""
echo "--- Rules ---"
rule_count=$(ls rules/*.md 2>/dev/null | wc -l | tr -d ' ')
ok "$rule_count rules found"

# 7. Playbooks exist
echo ""
echo "--- Playbooks ---"
pb_count=$(ls Playbooks/*.md 2>/dev/null | wc -l | tr -d ' ')
ok "$pb_count playbooks found"

# Summary
echo ""
echo "=== Summary ==="
echo "Agents: $agent_count | Commands: $cmd_count | Skills: $skill_count"
echo "Hooks: $hook_count | Rules: $rule_count | Playbooks: $pb_count"
echo ""
if [[ $ERRORS -gt 0 ]]; then
  echo "RESULT: FAIL ($ERRORS errors, $WARNINGS warnings)"
  exit 1
elif [[ $WARNINGS -gt 0 ]]; then
  echo "RESULT: PASS with warnings ($WARNINGS warnings)"
  exit 0
else
  echo "RESULT: PASS (all checks green)"
  exit 0
fi
