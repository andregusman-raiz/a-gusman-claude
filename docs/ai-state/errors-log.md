# Errors Log

> Registro de erros diagnosticados, tentativas falhas e solucoes aplicadas.
> Agentes DEVEM consultar este log ANTES de tentar fixes para evitar repeticao.
> Agentes DEVEM registrar aqui quando um fix falha ou um erro e resolvido.

## Como registrar

```markdown
### [YYYY-MM-DD] ag-XX: Descricao curta do erro
- **Contexto**: O que estava sendo feito
- **Erro**: Mensagem de erro ou comportamento inesperado
- **Causa raiz**: Por que aconteceu
- **Tentativas**:
  1. [FALHOU] Descricao da tentativa e por que falhou
  2. [OK] Descricao do que resolveu
- **Status**: RESOLVIDO | ABERTO | WORKAROUND
- **Projeto**: nome-do-projeto
```

## Categorias

### Build / TypeCheck
<!-- Erros de npm run build, tsc --noEmit, prerender -->

### Deploy / CI
<!-- Erros de vercel, github actions, pipeline -->

### Database / Migrations
<!-- Erros de supabase, RLS, migrations -->

### Runtime / Bugs
<!-- Erros em tempo de execucao, bugs reportados -->

### Config / Environment
<!-- Erros de .env, config corrompido, secrets -->

---
