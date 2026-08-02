# 08 — Melhores Praticas (Licoes de 155+ Sessoes)

> Padroes de sucesso e erros recorrentes extraidos de uso real intensivo.

---

## Categoria 1: Prevencao de Erros

### 1.1 Ler Antes de Agir

**Erro**: Assumir que sabe o conteudo de um arquivo baseado no nome ou contexto anterior.
**Regra**: SEMPRE ler o conteudo real antes de diagnosticar ou corrigir.

```
ERRADO: "Esse arquivo provavelmente tem um bug na funcao X..."
CERTO:  Ler o arquivo → identificar o bug → corrigir
```

### 1.2 lint-staged e Rei

**Erro**: Commitar sem validar lint, e lint-staged REVERTER todas as mudancas staged.
**Regra**: Pre-validar typecheck + lint ANTES de commitar.

```bash
# SEMPRE antes de commit:
npx tsc --noEmit
npx eslint --fix --max-warnings=0 [arquivos]
# So entao: git add + git commit
```

**Por que e critico**: lint-staged nao apenas bloqueia o commit — ele REVERTE todas as mudancas staged. Isso significa que voce pode perder trabalho se nao pre-validar.

### 1.3 Nunca git stash

**Erro**: Usar `git stash` como forma rapida de salvar trabalho.
**Regra**: Usar WIP commits em branch dedicada.

```bash
# ERRADO:
git stash

# CERTO:
git checkout -b wip/meu-trabalho
git add [arquivos]
git commit -m "wip: progresso parcial"
```

**Por que**: Stash e volatil, facil de perder com `stash drop`, e nao tem historico. WIP commits tem historico, podem ser revertidos, e sao visiveis no log.

### 1.4 Nunca --no-verify

**Erro**: Bypassar hooks de pre-commit quando lint falha.
**Regra**: Corrigir os erros de lint, nao bypassar.

```bash
# ERRADO:
git commit --no-verify -m "fix: coisa"

# CERTO:
npx eslint --fix [arquivo]
# Corrigir erros restantes manualmente
git add [arquivo]
git commit -m "fix: coisa"
```

### 1.5 Nunca git add -A

**Erro**: Adicionar todos os arquivos de uma vez, incluindo .env, credenciais, binarios.
**Regra**: Listar cada arquivo explicitamente.

```bash
# ERRADO:
git add -A
git add .

# CERTO:
git add src/services/auth.ts src/components/Login.tsx
```

---

## Categoria 2: Protecao de Trabalho

### 2.1 Commits Incrementais

**Regra**: Commitar a cada 3-5 fixes em batch. Nunca acumular mais de 5.

```
Fix 1 → Fix 2 → Fix 3 → COMMIT → Fix 4 → Fix 5 → COMMIT → ...
```

### 2.2 Commit de Emergencia

**Regra**: Se API error, rate limit, ou qualquer instabilidade → commit IMEDIATO.

```bash
git add [tudo que foi feito]
git commit -m "wip: progresso parcial - X de Y completos"
```

### 2.3 Estado Persistente

**Regra**: Salvar progresso em `docs/ai-state/session-state.json` a cada 20 actions.

Beneficio: Se a sessao cair, voce pode retomar exatamente de onde parou.

### 2.4 Registro de Erros

**Regra**: Registrar todo erro diagnosticado em `docs/ai-state/errors-log.md`.

Formato:
```markdown
## [Data] — [Titulo]
**Sintoma:** O que aparece
**Causa raiz:** Por que acontece
**Tentativas falhas:** O que NAO funcionou
**Solucao:** O que resolveu
**Licao:** O que aprender para o futuro
```

---

## Categoria 3: Qualidade de Codigo

### 3.1 Typecheck Obrigatorio

Rodar typecheck antes de QUALQUER commit. Zero tolerancia a erros.

### 3.2 Lint Zero Warnings

ESLint com `--max-warnings=0`. Warnings viram erros em producao.

### 3.3 Testes Antes de Refatorar

ag-P-05 (Refactorer) RECUSA refatorar sem testes existentes. Isso previne regressoes silenciosas.

### 3.4 Codigo Minimo

Fazer a correcao solicitada, nao "melhorar" codigo ao redor. Fix minimo e focado.

---

## Categoria 4: Comunicacao com o Claude Code

### 4.1 Seja Especifico

```
ERRADO: "Corrija os bugs"
CERTO:  "Corrija o bug de null pointer em src/services/auth.ts:45 quando user.email e undefined"
```

### 4.2 Forneca Contexto

```
ERRADO: "Adicione autenticacao"
CERTO:  "Adicione autenticacao JWT usando bcrypt para hash, com refresh token de 7 dias, no endpoint POST /api/auth/login"
```

### 4.3 Use Commands

```
/ag-M-00 analise este projeto              ← Orquestrador classifica
/ag-P-03 implemente a feature X            ← Builder executa
/ag-P-04 debug o erro em auth.ts           ← Debugger investiga
/ag-P-07 crie testes para services/        ← Tester cria testes
```

### 4.4 Execucao vs Planejamento

| Voce Diz | Claude Faz |
|----------|------------|
| "execute", "faca", "implemente", "fix" | Executa diretamente |
| "planeje", "monte um plano", "desenhe" | Entra em modo planejamento |
| "nao pare", "continue", "termine" | Continua sem pedir confirmacao |

---

## Categoria 5: Organizacao de Projeto

### 5.1 Estrutura de Estado

```
docs/ai-state/
├── session-state.json     ← Progresso da sessao atual
├── errors-log.md          ← Erros encontrados + solucoes
├── validation-report.md   ← Output do ag-P-06
├── e2e-report.md          ← Output do ag-B-08
├── security-report.md     ← Output do ag-B-10
├── bug-fix-plan.md        ← Output do /diagnose-bugs
└── improvements-log.md    ← Output do ag-M-99
```

### 5.2 CLAUDE.md Hierarquico

```
projeto/
├── CLAUDE.md              ← Instrucoes globais do projeto
├── src/
│   ├── lib/
│   │   ├── db/CLAUDE.md   ← Instrucoes de database
│   │   └── api/CLAUDE.md  ← Instrucoes de API
│   └── components/
│       └── CLAUDE.md      ← Instrucoes de componentes
```

Cada sub-CLAUDE.md e carregado quando o Claude trabalha naquele diretorio.

### 5.3 Sprints e Backlog

Para projetos maiores, usar sistema de roadmap:

```
roadmap/
├── backlog.md             ← Backlog priorizado
├── sprints/               ← Um arquivo por sprint
├── items/                 ← Um arquivo por item de trabalho
├── specs/                 ← PRD e SPEC por feature
└── reports/               ← Reports de diagnostico e validacao
```

---

## Categoria 6: Ambiente

### 6.1 Windows Quirks

- **npm/npx no PATH**: Em bash, pode nao estar no PATH. Usar caminho completo.
- **OOM em builds**: SEMPRE usar `NODE_OPTIONS=--max-old-space-size=8192`
- **Windows Defender**: Pode bloquear .next/trace
- **Processos orfaos**: Verificar com `tasklist | findstr claude`

### 6.2 Context Window

- Se respostas ficam genericas → limpar contexto (`/clear`)
- Salvar estado antes de limpar
- Retomar de onde parou apos limpar

### 6.3 Operacoes Perigosas

SEMPRE confirmar com usuario antes de:

| Operacao | Risco |
|----------|-------|
| git stash | Perda de trabalho |
| git reset --hard | Irreversivel |
| git push --force | Sobrescreve remoto |
| git checkout . | Descarta mudancas |
| git clean -f | Deleta untracked |
| Deletar migration | Quebra sequencia |

---

## Categoria 7: Anti-Patterns Fatais

### 7.1 O Loop Infinito de Verificacao

**Problema**: Quality gate detecta pendencia → tenta corrigir → quality gate detecta outra → loop infinito.
**Solucao**: Maximo 2 ciclos de verificacao. Apos 2 ciclos, reportar ao usuario.

### 7.2 Refatoracao Durante Debug

**Problema**: Enquanto debugga um bug, "melhora" codigo ao redor. Introduz novos bugs.
**Solucao**: ag-P-04 faz fix MINIMO. Refatoracao e tarefa separada com ag-P-05.

### 7.3 Otimizar Sem Medir

**Problema**: "Vou otimizar essa query." Sem medir antes e depois.
**Solucao**: Medir → Otimizar → Medir. Sem medicao, nao ha prova de melhoria.

### 7.4 Deploy Sem Testes

**Problema**: "Ta funcionando no meu local, vou deployar."
**Solucao**: Pipeline obrigatorio: typecheck → lint → test → build → deploy.

### 7.5 Ignorar errors-log.md

**Problema**: Bug ja foi diagnosticado antes, mas o agente nao leu o log e tentou as mesmas solucoes falhas.
**Solucao**: ag-P-04 SEMPRE le errors-log.md ANTES de comecar.
