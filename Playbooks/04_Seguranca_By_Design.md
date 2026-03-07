# Playbook 04: Seguranca By Design

> Seguranca nao e feature. E alicerce.

## Principios

1. **Defense in depth** — multiplas camadas de protecao
2. **Least privilege** — minimo acesso necessario
3. **Fail secure** — em caso de duvida, negar acesso
4. **Audit everything** — registrar tudo para rastreabilidade

## 4 Niveis de Permissao

| Nivel | Role | Acesso |
|-------|------|--------|
| 0 | superadmin | Acesso total, gerencia usuarios |
| 1 | core_team | Projetos internos, cria projetos |
| 2 | external_agent | Apenas projetos atribuidos |
| 3 | client | Somente leitura, sem dados sensiveis |

## Checklist de Seguranca

### Autenticacao
- [ ] Senhas com hash (bcrypt/argon2)
- [ ] 2FA disponivel (TOTP)
- [ ] Session tokens com expiracao
- [ ] Rate limiting em login (max 5 tentativas/min)

### Autorizacao
- [ ] RLS ativo em TODAS as tabelas
- [ ] Endpoints protegidos por middleware de auth
- [ ] Verificacao de ownership em CRUD
- [ ] Roles validadas no backend

### Dados
- [ ] **NUNCA logar**: password, token, secret, apiKey, creditCard, PII
- [ ] Env vars para configuracao sensivel
- [ ] HTTPS obrigatorio
- [ ] Encriptacao em repouso para dados sensiveis

### Headers HTTP

```typescript
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
};
```

## LGPD Compliance

- [ ] Base legal definida para cada tratamento
- [ ] Politica de privacidade acessivel
- [ ] Consentimento registrado com timestamp
- [ ] Direito ao esquecimento implementado
- [ ] Exportacao de dados do usuario (DSAR)
- [ ] Minimizacao de dados

## Audit Trail

Campos obrigatorios: **Quem** (user_id), **O que** (action + table + record), **Quando** (timestamp), **Onde** (IP), **Resultado** (old/new data).

## Resposta a Incidentes

1. **Detectar**: Monitorar logs e alertas
2. **Conter**: Isolar sistema afetado
3. **Investigar**: Analisar audit trail
4. **Corrigir**: Aplicar fix e fechar vulnerabilidade
5. **Comunicar**: Notificar afetados (LGPD: 72h para ANPD)
6. **Prevenir**: Documentar e criar controle preventivo
