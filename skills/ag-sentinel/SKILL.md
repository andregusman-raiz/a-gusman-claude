---
name: ag-sentinel
description: "Maquina autonoma de seguranca, load testing e LGPD. 6 dimensoes, modo hybrid, convergencia SSS >= 80. Security Certificate + Load Report + Fix PR."
model: opus
context: fork
argument-hint: "[URL ou path] [--threshold N] [--audit-only] [--resume] [--mode defensive|hybrid|offensive]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage
metadata:
  filePattern: "sentinel-*.json,sentinel-*.md"
  bashPattern: "sentinel"
  priority: 95
---

# SENTINEL — Maquina Autonoma de Seguranca

## Invocacao

```
/sentinel https://app.example.com              # Producao (DEFENSIVE auto)
/sentinel ~/Claude/GitHub/raiz-platform         # Local (OFFENSIVE auto)
/sentinel https://preview-xyz.vercel.app        # Staging (HYBRID auto)
/sentinel ~/Claude/GitHub/fgts-platform --threshold 90
/sentinel https://app.example.com --audit-only
/sentinel --resume
/sentinel ~/Claude/GitHub/raiz-platform --mode defensive  # Override modo
```

## O que faz

Executa security + performance + compliance AUTONOMO em 5 fases:

1. **RECON** — Mapeia superficie de ataque (endpoints, auth, headers, deps)
2. **SIEGE** — Testa 6 dimensoes:
   - S1-SHIELD: Headers, CORS, cookies, HTTPS
   - S2-GATES: Auth bypass, session, RBAC
   - S3-WALLS: Injection (SQL, XSS, CMD), validacao
   - S4-VAULT: Secrets, .env, git history, deps
   - S5-STRESS: Load test k6 (5-200 VUs)
   - S6-GUARD: LGPD, PII, audit trail
3. **ARMOR** — Hardening + fix de vulnerabilidades
4. **CONVERGE** — Calcula SSS, loop ate >= threshold
5. **CERTIFY** — Security Certificate, Load Report, Fix PR, issues

## Modo Hybrid

| Ambiente | Modo | Payloads | Load Test |
|----------|------|----------|-----------|
| Producao | DEFENSIVE | Nenhum | Smoke (5 VUs) |
| Staging | HYBRID | Leves | Load (50 VUs) |
| Local | OFFENSIVE | Completos | Full (200 VUs) |

## Execucao

```
Agent({
  subagent_type: "ag-sentinel",
  prompt: "{input do usuario}",
  run_in_background: true,
  mode: "auto"
})
```

## Ferramentas Externas (opcionais)

| Ferramenta | Proposito | Install |
|-----------|-----------|---------|
| k6 | Load testing | `brew install k6` |
| trufflehog | Secrets em git | `brew install trufflehog` |
| semgrep | SAST analysis | `pip3 install semgrep` |

Se ausentes: degraded mode (grep manual) ou SKIP da dimensao.

## Artefatos Produzidos

| Artefato | Arquivo |
|----------|---------|
| Security Certificate | `docs/sentinel-certificate-YYYY-MM-DD.md` |
| Load Test Report | `docs/sentinel-load-report-YYYY-MM-DD.md` |
| Fix PR | GitHub PR com hardening |
| Baselines | `sentinel-baselines.json` |
| State (recovery) | `sentinel-state.json` |
| KB Update | `~/.claude/shared/sentinel-kb/` |
| Issues backlog | GitHub Issues label `sentinel-finding` |
