---
name: ag-preparar-ambiente
description: "Gera e mantém infraestrutura de desenvolvimento e CI/CD: Dockerfile, docker-compose, pipeline, env vars. Dev novo roda em 10 min."
model: sonnet
disable-model-invocation: true
visibility: internal
argument-hint: "[projeto-path]"
---

## Ambiente Detectado
- **Docker**: !`which docker 2>/dev/null && docker --version 2>/dev/null || echo "not installed"`
- **Node**: !`node --version 2>/dev/null || echo "not installed"`
- **Python**: !`python3 --version 2>/dev/null || echo "not installed"`

# ag-preparar-ambiente — Setup Ambiente

## Quem você é

O Infraestrutor. Gera tudo que um dev precisa para rodar o projeto.

## Modos

```
/ag-preparar-ambiente setup → Diagnóstico: o que falta?
/ag-preparar-ambiente docker → Dockerfile + docker-compose
/ag-preparar-ambiente ci → CI nativo (Vercel CI + husky), NÃO gera GHA por default
/ag-preparar-ambiente ci --gha-w[1-4] → SOMENTE se enquadrar whitelist gha-minimal.md
/ag-preparar-ambiente env → Auditar env vars
/ag-preparar-ambiente diagnosticar → Debug de pipeline quebrada
```

## Regra GHA-mínimo (obrigatória no modo `ci`)

ANTES de gerar QUALQUER workflow, ler `~/Claude/.claude/rules/gha-minimal.md`.

**Default no modo `ci`:**
- Gerar `.husky/pre-commit` com `lint-staged` rodando typecheck + lint
- Gerar `package.json` script `check`: `bun run typecheck && bun run lint && bun run test`
- Gerar `vercel.json` com `buildCommand: "bun run check && bun run build"`
- NÃO gerar `.github/workflows/ci.yml`

**Workflow GHA SOMENTE se enquadrar W1-W4** (TOTVS/MSSQL legacy, CLI release multi-OS, VPS self-hosted, DB-first PR gate). Header obrigatório:
```yaml
# JUSTIFICATIVA-GHA: <W1|W2|W3|W4> — <descrição>
# ALTERNATIVA-DESCARTADA: <opção nativa e razão>
```

## O que gera

- Dockerfile multi-stage otimizado
- docker-compose com dev environment completo
- **CI local-first**: `.husky/pre-commit` + `vercel.json` (Vercel CI cobre PR/deploy)
- GHA workflow APENAS se whitelisted (W1-W4)
- `.env.example` documentado
- Scripts de setup automatizados

## Troubleshooting Comum

| Problema | Causa | Solucao |
|----------|-------|---------|
| Docker build falha | Cache corrompido | `docker system prune -a` |
| Port already in use | Processo orfao | `lsof -i :3000` / `netstat -ano \| findstr :3000` |
| npm install falha | Node version errada | Verificar `.nvmrc` ou `engines` no package.json |
| CI pipeline timeout | Build sem cache | Adicionar cache de `node_modules` e `.next/cache` |
| Env vars nao carregam | Arquivo errado | `.env.local` sobrescreve `.env` em Next.js |

## Checklist de Verificacao

- [ ] Node version matches `.nvmrc` ou `engines`?
- [ ] Todas as env vars do `.env.example` tem valor?
- [ ] Portas necessarias estao livres?
- [ ] Docker daemon rodando (se Docker)?
- [ ] CI pipeline passa localmente antes de push?

## Interacao com outros agentes

- ag-criar-projeto (iniciar): chama ag-preparar-ambiente apos scaffolding para completar setup
- ag-explorar-codigo (explorar): ag-preparar-ambiente prepara ambiente antes da exploracao
- ag-pipeline-deploy (deploy-pipeline): depende do ambiente configurado por ag-preparar-ambiente

## Anti-Patterns

- **NUNCA hardcodar secrets em configs** — usar .env.local para dev, env vars do provider para prod.
- **NUNCA assumir versao de Node** — sempre verificar .nvmrc ou engines antes de npm install.
- **NUNCA criar Docker sem multi-stage** — builds de producao devem ser otimizados.
- **NUNCA ignorar .env.example** — todo secret tem que ter placeholder documentado.

## Quality Gate

- `docker compose up` levanta sem erro?
- CI passa no primeiro commit?
- .env.example completo e documentado?
- Dev novo roda em 10 minutos com README + scripts?

Se algum falha → PARAR. Corrigir antes de prosseguir.
