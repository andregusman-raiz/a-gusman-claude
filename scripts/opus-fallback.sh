#!/bin/bash
# opus-fallback.sh — SHIM de compatibilidade (2026-06-11).
# A logica vive em model-fallback.sh (cadeia fable->opus->sonnet, ADR-0002).
# Comandos legados (fallback/off/enable/on/auto/status) sao aceitos pelo novo script.
exec bash "$HOME/.claude/scripts/model-fallback.sh" "${1:-status}"
