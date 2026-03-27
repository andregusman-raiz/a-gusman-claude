---
name: ag-referencia-seguranca-rules
description: "Regras inegociaveis de seguranca: RLS, audit trail, LGPD, mascaramento PII, niveis de permissao. Reference skill carregado on-demand."
context: fork
---

# Seguranca — Regras Inegociaveis

## Banco de Dados
- **RLS** (Row Level Security) ativo em TODAS as tabelas, sem excecao
- **Audit trail** obrigatorio: tabela `audit_logs` com JSONB (quem, o que, quando, onde, resultado)
- Migrations sequenciais — nunca pular numeracao
- Indices desde o inicio (nao como afterthought)

## Dados
- **NUNCA logar**: password, token, secret, apiKey, creditCard, PII
- **LGPD**: Base legal para cada tratamento, direito ao esquecimento, minimizacao de dados
- Mascaramento automatico de PII em contexto de IA

## Niveis de Permissao (quando aplicavel)

| Nivel | Acesso |
|-------|--------|
| superadmin | Acesso total, gerencia usuarios |
| core_team | Projetos internos |
| external_agent | Projetos atribuidos |
| client | Somente leitura |

## Checklist de Seguranca para Novas Features

1. RLS policies definidas para todas as tabelas novas?
2. Audit log implementado para operacoes sensiveis?
3. PII mascarado em logs e contexto de IA?
4. Base legal LGPD documentada para tratamento de dados?
5. Secrets em env vars (nunca hardcoded)?
6. Input validation com Zod em todos os endpoints?

> Playbook detalhado: `.claude/Playbooks/04_Seguranca_By_Design.md`
