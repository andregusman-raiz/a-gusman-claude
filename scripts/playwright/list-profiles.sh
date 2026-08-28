#!/usr/bin/env bash
# list-profiles.sh — lista todos profiles persistentes Playwright + status.

BASE="$HOME/.cache/playwright-claude"
REGISTRY="$HOME/.claude/scripts/playwright/profiles.json"

if [[ ! -d "$BASE" ]]; then
    echo "Sem profiles em $BASE"
    exit 0
fi

echo "Profiles persistentes em $BASE:"
echo ""
printf "%-22s %-10s %-20s %s\n" "PROFILE" "SIZE" "UPDATED" "URL"
printf "%-22s %-10s %-20s %s\n" "----------------------" "----------" "--------------------" "---"

for dir in "$BASE"/*/; do
    name=$(basename "$dir")
    [[ "$name" == *.tmp ]] && continue
    size=$(du -sh "$dir" 2>/dev/null | awk '{print $1}' || echo "?")
    cookies_file="$dir/Default/Cookies"
    if [[ -f "$cookies_file" ]]; then
        updated=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$cookies_file" 2>/dev/null || echo "?")
    else
        updated="(sem cookies)"
    fi
    url=""
    if [[ -f "$REGISTRY" ]]; then
        url=$(/usr/bin/python3 -c "import json,sys; d=json.load(open('$REGISTRY')); print(d.get('$name', {}).get('url', ''))" 2>/dev/null)
    fi
    printf "%-22s %-10s %-20s %s\n" "$name" "$size" "$updated" "${url:-(não registrado)}"
done

if [[ -f "$REGISTRY" ]]; then
    echo ""
    echo "Registry: $REGISTRY"
fi
