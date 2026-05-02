---
name: ag-login-persistente
description: Setup de logins persistentes para todos os projetos rodados via Playwright. Profile isolado por projeto em ~/.cache/playwright-claude/. Reusa cookies/sessao entre runs do Claude Code, evita relogar.
context: fork
user-invocable: true
---

# Skill: Login Persistente Cross-Project

Sistema de profiles persistentes do Chromium para evitar relogar manualmente
em cada projeto a cada sessao do Claude Code.

## Quando ativar

- User pede "abre [projeto] sem precisar logar de novo"
- Setup inicial de QAT manual em projeto novo
- Mais de 1 projeto sendo testado por dia (cada login custa 30-60s)
- Externos como Supabase Studio, Vercel, HubSpot consultados regularmente

## Arquitetura

```
~/.cache/playwright-claude/
├── <projeto>/         # 1 profile Chromium por projeto
│   ├── Default/       # cookies, localStorage, indexedDB
│   ├── First Run      # marker
│   └── ...            # outros arquivos do Chromium
└── README.md
```

Por projeto, o Chromium guarda:
- Cookies (incluindo session/auth tokens)
- localStorage / sessionStorage
- IndexedDB
- Service workers
- Cache (acelera runs subsequentes)

## Projetos configurados (16 default)

### Apps locais (localhost)
| Projeto | Porta | Auth |
|---------|-------|------|
| example-platform | 3000 | Supabase Auth |
| example-prof | 3001 | NextAuth |
| example-automata | 3002 | — |
| edu-frontend | 3003 | TOTVS Auth |
| edu-portal | 3004 | — |
| fin-platform | 3005 | — |
| agent-dashboard | 4200 | — |
| attendance-app | 3001 | TOTVS |
| payroll-app | 3000 | Supabase |
| bi-app | 3000 | — |

### Producao
| Servico | URL |
|---------|-----|
| jusraiz | app.jusraiz.com |

### Externos
| Servico | URL |
|---------|-----|
| supabase-studio | supabase.com/dashboard |
| vercel-dashboard | vercel.com/dashboard |
| hubspot | app.hubspot.com |
| github | github.com |
| sentry | sentry.io |

## SSO Google centralizado (recomendado)

**1 login no Google → todas apps OAuth-Google autenticadas automaticamente.**

Profile compartilhado: `~/.cache/playwright-claude/google-sso/`

### Setup inicial (1x apenas)

```bash
# 1. Login no Google
bash ~/Claude/.claude/scripts/playwright-persistent-login.sh --google
# → abre accounts.google.com, faz login, fecha browser
```

### Uso diario (auto-OAuth)

```bash
# Auto-clica "Sign in with Google" usando sessao Google ja logada
bash ~/Claude/.claude/scripts/playwright-persistent-login.sh --sso example-platform
bash ~/Claude/.claude/scripts/playwright-persistent-login.sh --sso supabase-studio
bash ~/Claude/.claude/scripts/playwright-persistent-login.sh --sso vercel-dashboard
bash ~/Claude/.claude/scripts/playwright-persistent-login.sh --sso hubspot
bash ~/Claude/.claude/scripts/playwright-persistent-login.sh --sso jusraiz
```

### Apps com SSO Google suportado

| App | OAuth Google |
|-----|--------------|
| example-platform | Supabase Auth → Google |
| example-prof | NextAuth → Google |
| edu-portal | Google OAuth |
| jusraiz | Google OAuth (prod) |
| payroll-app | Supabase Auth → Google |
| bi-app | Google OAuth |
| supabase-studio | Google nativo |
| vercel-dashboard | Google nativo |
| hubspot | Google nativo |
| sentry | Google nativo |
| example-automata, fin-platform, agent-dashboard | Conforme implementacao |

### Apps SEM SSO Google (auth proprio)

| App | Auth |
|-----|------|
| edu-frontend | TOTVS Auth (LDAP/AD) |
| attendance-app | TOTVS Auth |
| github | GitHub Auth (SSO opcional via SAML/Okta, nao Google) |

Para essas, usar profile isolado:
```bash
bash playwright-persistent-login.sh edu-frontend
```

### Como funciona o auto-OAuth

1. Script abre app com profile `google-sso/` (cookies Google ja presentes)
2. Detecta botao "Sign in with Google" / "Continue with Google" usando regex em PT/EN
3. Clica → Google reconhece a sessao → redireciona de volta autenticado
4. Sem intervencao manual

### Quando o auto-click NAO encontra o botao

Acontece se app tem layout customizado. Acoes:
- Logar manualmente uma vez nesse app — sessao persiste no profile google-sso
- Ou abrir issue para adicionar pattern especifico em `tryClickGoogleLogin`

### TypeScript helper para SSO Google

```ts
import { loginViaGoogleSso } from '~/Claude/.claude/shared/templates/e2e/persistent-context.helper';

// Atalho — equivalente a launchPersistentContext({ googleSso: true, autoGoogleLogin: true })
const { context, page, googleSsoTriggered } = await loginViaGoogleSso('example-platform');

if (googleSsoTriggered) {
  // Auto-click funcionou, aguardar redirect pos-OAuth
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
}

// Pronto — autenticado
await page.goto('http://localhost:3000/admin/users');
```

### Vantagens vs profile isolado

| Aspecto | Google SSO | Profile isolado |
|---------|------------|-----------------|
| Logins manuais | 1 (Google) | N (1 por app) |
| Sessao expirou em todas | renova com 1 login Google | precisa logar em cada |
| Funciona offline | só com sessao em cache | só com sessao em cache |
| Multi-conta Google | 1 conta primaria + outras via add account | N profiles |
| Privacy | 1 profile compartilhado | profiles separados |

## 3 formas de usar (modo isolado, sem SSO)

### 1. Bash CLI (mais simples — QAT manual rapido)

```bash
# Abrir browser persistente em example-platform
bash ~/Claude/.claude/scripts/playwright-persistent-login.sh example-platform

# Com URL customizada
bash ~/Claude/.claude/scripts/playwright-persistent-login.sh example-platform http://localhost:3000/admin/users

# Externos
bash ~/Claude/.claude/scripts/playwright-persistent-login.sh supabase-studio
```

Primeira run: browser abre em modo headed → user faz login → fecha → sessao salva.
Runs subsequentes: ja entra logado.

### 2. TypeScript helper (em test files / scripts ad-hoc)

```ts
import { launchPersistentContext } from '~/Claude/.claude/shared/templates/e2e/persistent-context.helper';

async function explorarAdmin() {
  const { context, page, isFirstRun } = await launchPersistentContext(
    'example-platform',
    { role: 'admin' }  // profile dir vira example-platform-admin/
  );

  if (isFirstRun) {
    console.log('Faca login manualmente. Vou aguardar 5min.');
    await page.waitForURL('**/dashboard', { timeout: 5 * 60_000 });
  }

  // Ja autenticado
  await page.goto('http://localhost:3000/admin/users');
  await page.getByRole('button', { name: 'Adicionar usuario' }).click();
  // ... QAT manual ...

  await context.close();  // sessao persistida
}
```

### 3. Playwright MCP (Claude Code) — config futura

Para o Playwright MCP do Claude Code reusar profile, adicionar em `.mcp.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "args": [
        "--user-data-dir=/Users/andregusmandeoliveira/.cache/playwright-claude/example-platform"
      ]
    }
  }
}
```

Trade-off: 1 profile global por instalacao MCP. Se trocar de projeto, precisa
restart do MCP server. Por isso scripts/helper sao mais flexiveis para multi-projeto.

## Multi-role no mesmo projeto

Se precisar testar como admin E user no mesmo projeto:

```bash
# CLI
bash playwright-persistent-login.sh example-platform-admin
bash playwright-persistent-login.sh example-platform-user
```

```ts
// TypeScript
const adminCtx = await launchPersistentContext('example-platform', { role: 'admin' });
const userCtx = await launchPersistentContext('example-platform', { role: 'user' });
```

Cria diretorios separados: `example-platform-admin/` e `example-platform-user/`.

## Quando NAO usar

- **CI**: usar `storageState` (login fresco por run, nada de race entre tests)
- **Testes E2E reproduziveis**: persistent context perde isolation entre tests
- **Multi-context simultaneo**: nao da pra abrir 2 instancias do mesmo profile
  (Chromium trava com lock)

## Limpeza

```bash
# Sessao expirou em 1 projeto
rm -rf ~/.cache/playwright-claude/example-platform/

# Limpeza geral (forca relogin em todos)
rm -rf ~/.cache/playwright-claude/*/
```

## Avisos

- Profile contem **session tokens** — NUNCA commitar no git
- `~/.cache/` ja esta fora de qualquer repo (cache do sistema)
- Se trocar credenciais (mudou senha, rotou token), limpar profile do projeto
- Chrome 136+ exige profile separado do default do sistema (atendido)
- Para profile de Supabase em dev: pode quebrar se trocar de organizacao

## Comandos uteis

```bash
# Listar profiles existentes + tamanho
du -sh ~/.cache/playwright-claude/*/

# Ver quais sessions estao ativas (cookies)
ls ~/.cache/playwright-claude/example-platform/Default/Cookies 2>/dev/null && \
  echo "example-platform: profile com cookies"

# Limpar profiles >30 dias (raramente usados)
find ~/.cache/playwright-claude -maxdepth 1 -type d -mtime +30 -exec rm -rf {} \;
```

## Integracao com outras skills

- `/ag-referencia-playwright` — patterns canonicos (use storageState em CI)
- `/ag-testar-manual` — QAT exploratorio (preferido com persistent context)
- `/verify-app` — black-box QA (pode usar persistent para nao relogar)
- `/ag-7-qualidade` — QAT autonomo (usa storageState, nao persistent)

## Roadmap

- [ ] Auto-detectar projeto via cwd e abrir profile correto
- [ ] Auto-renovar sessoes Supabase via refresh token antes de expirar
- [ ] Backup/restore de profiles (export para outro Mac)
- [ ] Healthcheck: sessao ainda valida em cada profile?
