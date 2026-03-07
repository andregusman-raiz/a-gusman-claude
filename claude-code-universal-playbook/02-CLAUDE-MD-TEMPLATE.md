# CLAUDE.md — Template Universal

> Copie este arquivo para a raiz do seu projeto como `CLAUDE.md` e personalize as secoes marcadas com `[CUSTOMIZE]`.

---

# CLAUDE.md - [CUSTOMIZE: Nome do Projeto]

## Visao Geral

**[CUSTOMIZE: Nome]** - [CUSTOMIZE: descricao em 1-2 linhas].
[CUSTOMIZE: Stack principal] | [CUSTOMIZE: Framework] | [CUSTOMIZE: Linguagem] | [CUSTOMIZE: Database].
UI: [CUSTOMIZE: CSS framework] | Testing: [CUSTOMIZE: test runner] | Deploy: [CUSTOMIZE: plataforma] | Cache: [CUSTOMIZE: se aplicavel].

---

## Comandos Essenciais

```bash
# Desenvolvimento
[CUSTOMIZE: comando para dev server]

# Build
[CUSTOMIZE: comando para build]

# Testes
[CUSTOMIZE: comando para testes]
[CUSTOMIZE: comando para teste especifico]

# Qualidade
[CUSTOMIZE: comando para lint]
[CUSTOMIZE: comando para format]
[CUSTOMIZE: comando para typecheck]
```

---

## Execucao Autonoma via CLI

> **REGRA OBRIGATORIA**: O Claude Code DEVE executar todas as operacoes de infraestrutura diretamente via CLI. NUNCA solicitar que o usuario execute manualmente.

### Comportamento Esperado

1. **Testes**: Executar diretamente, nao pedir ao usuario
2. **Build**: Executar diretamente
3. **Deploy**: Executar quando solicitado
4. **Git**: Usar `gh` para PRs, issues, e releases

### Proibicoes

- NUNCA pedir ao usuario para executar comandos de CLI
- NUNCA sugerir que o usuario faca deploy manualmente
- NUNCA instruir o usuario a rodar testes
- NUNCA delegar operacoes de infraestrutura

---

## Padroes de Codigo

### Naming Conventions

[CUSTOMIZE: suas convencoes de naming]

### [CUSTOMIZE: Linguagem]

[CUSTOMIZE: regras especificas da linguagem]

### Formatacao

[CUSTOMIZE: regras de formatacao — prettier, eslint, black, etc.]

### Git

- Commits semanticos: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Branch naming: `feature/`, `fix/`, `refactor/`
- NUNCA usar `--no-verify` em commits
- NUNCA usar `git add -A` — listar arquivos especificos
- NUNCA usar `git stash` sem confirmacao — preferir WIP commit

---

## Metodologia SDD (Spec Driven Development)

> Principio 80/20: 80% planejamento, 20% execucao.

**Fluxo obrigatorio**: `PRD.md -> SPEC.md -> Execucao -> Review`

- **PRD**: Problema, escopo, requisitos, metricas de sucesso
- **SPEC**: Plano tecnico (max 200 linhas, dividir se maior)
- **Execucao**: Implementar seguindo o SPEC exatamente
- **Review**: Validar contra criterios, documentar decisoes

### Quando usar SDD

| Cenario | SDD? |
|---------|------|
| Nova feature | Sim |
| Bug fix complexo | Sim (simplificado) |
| Refatoracao | Sim |
| Hotfix urgente | Nao (documentar depois) |
| Tarefa < 30 min com escopo claro | Nao (Quick Mode) |

---

## Database-First

> "O banco deve ser desenhado e aprovado ANTES de qualquer linha de codigo."

**Fluxo**: `Requisitos -> Diagrama -> Aprovacao -> Schema -> Migrations -> APIs -> Frontend`

### Regras Criticas

- Audit trail obrigatorio
- Migrations sequenciais (nunca pular numeracao)
- Indices desde o inicio (nao como afterthought)

---

## Seguranca

### Regras Inegociaveis

- **NUNCA logar**: password, token, secret, apiKey, creditCard
- Audit logging em todas operacoes CRUD
- Validacao de input em todas as APIs
- Sanitizacao de output (prevenir XSS)

---

## Verificacao (Obrigatoria Pos-Execucao)

### Checklist Minimo

```bash
[CUSTOMIZE: comando typecheck] && [CUSTOMIZE: comando lint] && [CUSTOMIZE: comando test]
```

### Criterios de "Done"

- Codigo compila sem erros
- Testes existentes nao quebram
- Novos testes para novo codigo
- Commits semanticos
- Sem warnings ignorados

---

## Operacoes Perigosas (SEMPRE Confirmar com Usuario)

| Operacao | Risco | Alternativa Segura |
|----------|-------|--------------------|
| `git stash` | Perda de trabalho | WIP commit em branch |
| `git reset --hard` | Perda irreversivel | Criar branch backup |
| `git push --force` | Sobrescreve remoto | `--force-with-lease` |
| `git checkout .` | Descarta mudancas | Commit ou branch primeiro |

### Regras Inegociaveis de Git

- **NUNCA** usar `git stash` sem confirmacao explicita
- **NUNCA** usar `--no-verify` em commits
- **NUNCA** usar `git add -A` ou `git add .`
- Antes de qualquer operacao destrutiva: confirmar com usuario

---

## Execucao vs Planejamento

- Quando usuario diz "execute", "faca", "implemente", "fix" → **EXECUTE diretamente**
- Plan mode APENAS quando explicitamente pedido: "planeje", "monte um plano"
- Tarefas < 30 min com escopo claro → Quick Mode (sem plano, sem spec)
- Bugfix de arquivo unico → execute direto
- Quando usuario diz "nao pare", "continue", "termine" → continue sem pedir confirmacao

---

## Convencoes Criticas (Nao Desviar)

### Commits Incrementais

- Em batch de bugs/fixes: commitar a cada 3-5 correcoes, nao acumular
- Se API error ou rate limit → commit IMEDIATO de tudo que foi feito
- Prefixo `wip:` e aceitavel para commits intermediarios
- NUNCA acumular mais de 5 mudancas sem commit

### Analise e Diagnostico

- SEMPRE ler conteudo real dos arquivos — NUNCA resumir de memoria
- Quando pedido para analisar pasta → `ls` primeiro, depois ler arquivos
- Quando pedido para diagnosticar bugs → ler os arquivos de bug, nao assumir

---

## Gotchas & Troubleshooting

[CUSTOMIZE: Liste os problemas especificos do seu projeto aqui]

- **lint-staged rollback**: lint-staged REVERTE todas as mudancas staged se ESLint falhar. Corrigir lint ANTES de commitar, nunca --no-verify
- **Context window**: Se respostas ficam genericas, limpar contexto (nova sessao)
- **Env vars**: Nunca hardcode secrets. Usar `.env.local` para dev

---

## Documentacao Hierarquica

### Subdiretorios com CLAUDE.md

[CUSTOMIZE: Se seu projeto tem sub-modulos, crie CLAUDE.md em cada um]

Exemplo:
```
src/lib/db/CLAUDE.md      — Instrucoes especificas de database
src/lib/api/CLAUDE.md     — Instrucoes especificas de API
src/components/CLAUDE.md  — Instrucoes especificas de componentes
```
