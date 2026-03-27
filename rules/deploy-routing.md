---
description: "Guia de roteamento de deploy — qual caminho usar quando"
paths:
  - "**/*"
---

# Deploy Routing

## Arvore de Decisao

```
Quer fazer deploy?
├── Preview (testar antes de producao)
│   ├── Via feature branch push → automatico (Vercel Git Integration)
│   └── Manual → ag-pipeline-deploy --preview
│
├── Producao
│   ├── Caminho padrao → ag-pipeline-deploy (pipeline completo 8 etapas + canary)
│   ├── Deploy automatico → git push origin master → Vercel Git Integration
│   │   (pre-deploy-gate.sh no buildCommand executa typecheck + lint + test)
│   └── PROIBIDO → vercel --prod manual sem pipeline
│
└── Rollback
    └── ag-publicar-deploy rollback (SEMPRE com aprovacao do usuario)
```

## Caminho Padrao (RECOMENDADO para todo deploy)
1. Feature branch com commits limpos
2. `gh pr create` → preview deploy automatico (Vercel Git Integration)
3. Verificar preview URL gerada automaticamente pela Vercel
4. Merge PR em master → Vercel Git Integration dispara build automatico
5. Build executa: `bash scripts/pre-deploy-gate.sh && npm run build`
6. pre-deploy-gate.sh: typecheck → lint → test (falha = build abortado)

## Quando usar ag-pipeline-deploy (pipeline manual)
- Deploy com pipeline completo (8 etapas: env-check → typecheck → lint → test → build → deploy → smoke → canary)
- Repo sem Vercel Git Integration configurado
- Precisa de controle granular sobre cada etapa
- Debug de falhas no pipeline automatico
- Primeiro deploy de um projeto novo
- Deploy com notificacao n8n + Sentry release

## Credential Preflight (antes de ag-pipeline-deploy ou ag-versionar-codigo com modo pr/release)
```bash
bash ~/Claude/.claude/scripts/credential-preflight.sh [path-do-projeto]
```
Exit 2 = PARAR. Credenciais invalidas = deploy vai falhar.

```bash
vercel whoami   # Verificar autenticacao CLI
```

## NUNCA
- `vercel --prod` direto sem nenhum pipeline
- Deploy com testes falhando
- Deploy sem preview primeiro (quando possivel)
- Deploy sem saber como fazer rollback
- Deploy sexta a noite ou fim de semana (a menos que seja hotfix critico)
- Referenciar deploy-gate.yml, preview-deploy.yml, ci.yml como gate de deploy (removidos)
