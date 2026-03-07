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
│   ├── Via PR → automatico (preview-deploy.yml dispara ao criar PR)
│   └── Manual → /ag-19 preview
│
├── Producao
│   ├── Caminho padrao → merge PR em main (deploy-gate.yml automatico)
│   ├── Validacao extra → /ag-27 (pipeline completo 8 etapas)
│   └── PROIBIDO → vercel --prod manual sem pipeline
│
└── Rollback
    └── /ag-19 rollback (SEMPRE com aprovacao do usuario)
```

## Caminho Padrao (RECOMENDADO para todo deploy)
1. Feature branch com commits limpos
2. `gh pr create` → preview deploy automatico (se configurado)
3. Verificar preview URL no comentario do PR
4. Merge PR em main → deploy-gate.yml automatico
5. deploy-gate.yml: lint → typecheck → test → build → deploy → smoke
6. Se smoke falha → auto-rollback

## Quando usar ag-27 (pipeline manual)
- Repo sem CI/CD configurado (ex: raiz-agent-dashboard)
- Precisa de controle granular sobre cada etapa
- Debug de falhas no pipeline automatico
- Primeiro deploy de um projeto novo

## NUNCA
- `vercel --prod` direto sem nenhum pipeline
- Deploy com testes falhando
- Deploy sem preview primeiro (quando possivel)
- Deploy sem saber como fazer rollback
- Deploy sexta a noite ou fim de semana (a menos que seja hotfix critico)
