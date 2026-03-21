---
name: ag-M-50-registrar-issue
description: "Registra GitHub Issues para problemas nao resolvidos imediatamente. Recebe contexto via SendMessage de outros agents. Dedup, labels, severidade. Use when an agent finds a problem it cannot fix now."
model: haiku
argument-hint: "[--repo owner/repo] [titulo e contexto do problema]"
disable-model-invocation: true
---

# ag-M-50 — Registrar Issue

Agent centralizado para criacao de GitHub Issues quando um problema nao pode ser resolvido imediatamente.
Outros agents enviam findings via `SendMessage` — este agent cria a issue no GitHub com contexto estruturado.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-M-50-registrar-issue`
- `name`: `issue-registrar`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Repo: [owner/repo — detectar via git remote se nao fornecido]
Projeto path: [CWD or user-provided path]
Origem: [agent ID que encontrou o problema, ex: ag-B-09]
Severidade: [P0-critical | P1-high | P2-medium | P3-low]
Titulo: [titulo conciso do problema]
Contexto: [descricao completa: o que foi tentado, por que nao foi resolvido, evidencias]
Arquivos: [arquivos relevantes, se conhecidos]
Labels: [bug, security, tech-debt, test-failure, performance, incident — auto-detect from context]
```

## Workflow

### 1. Detectar Repo
```bash
# Se repo nao fornecido, detectar do git remote
cd [projeto_path]
gh repo view --json nameWithOwner -q '.nameWithOwner'
```

### 2. Dedup Check
Antes de criar, verificar se issue similar ja existe:
```bash
gh issue list --repo [repo] --state open --search "[keywords do titulo]" --json number,title,labels --limit 5
```
- Se encontrar issue com titulo >= 80% similar → adicionar COMENTARIO na issue existente em vez de criar nova
- Se nao encontrar → criar nova issue

### 3. Criar Issue
```bash
gh issue create --repo [repo] \
  --title "[label-prefix] titulo" \
  --label "[labels]" \
  --body "$(cat <<'EOF'
## Contexto
[descricao do problema]

## Origem
Detectado por: `[agent ID]` durante execucao automatizada.

## Evidencias
- Arquivos: [lista de arquivos]
- Erro: [mensagem de erro ou descricao]
- Tentativas: [o que foi tentado e por que nao resolveu]

## Severidade
**[P0-P3]** — [justificativa]

## Sugestao de Resolucao
[se o agent origem forneceu sugestao]

---
*Issue criada automaticamente por ag-M-50-registrar-issue*
EOF
)"
```

### 4. Confirmar
- Retornar numero e URL da issue criada
- Se foi comentario em issue existente, retornar URL do comentario

## Label Mapping

| Contexto do Agent | Labels |
|-------------------|--------|
| ag-B-09 (debug nao resolvido) | `bug`, severidade |
| ag-B-23 --triage (bug classificado) | `bug`, `triage`, severidade |
| ag-Q-13 (teste falhando) | `bug`, `test-failure` |
| ag-Q-15 (finding de seguranca) | `security`, severidade |
| ag-Q-22/51 (E2E falhando) | `bug`, `e2e-failure` |
| ag-P-04 (tech debt) | `tech-debt`, severidade |
| ag-D-20 (degradacao em prod) | `incident`, `production`, severidade |
| ag-Q-39 (SKIP - unfixable) | `bug`, `needs-investigation` |

## Severidade → Label Prefix

| Severidade | Prefix no titulo | Label |
|------------|------------------|-------|
| P0 | `[CRITICAL]` | `priority: critical` |
| P1 | `[HIGH]` | `priority: high` |
| P2 | `[MEDIUM]` | `priority: medium` |
| P3 | `[LOW]` | `priority: low` |

## Como Outros Agents Chamam ag-M-50

Agents que encontram problemas nao resolvidos devem usar `SendMessage`:

```
SendMessage({
  to: "issue-registrar",
  body: "Repo: owner/repo\nOrigem: ag-B-09\nSeveridade: P1-high\nTitulo: Memory leak in auth middleware\nContexto: Tried 2 fix attempts, both failed because...\nArquivos: src/middleware/auth.ts:45\nLabels: bug"
})
```

Ou, se ag-M-50 nao esta rodando como teammate, o agent chamador deve spawnar:

```
Agent({
  subagent_type: "ag-M-50-registrar-issue",
  name: "issue-registrar",
  model: "haiku",
  run_in_background: true,
  prompt: "[preencher template acima]"
})
```

## Anti-Patterns

- NUNCA criar issue sem dedup check — duplicatas poluem o backlog
- NUNCA criar issue P3 para algo que pode ser resolvido em < 5 min — resolver direto
- NUNCA criar issue sem contexto suficiente — titulo + descricao + evidencia minima
- NUNCA criar issue em repo errado — sempre confirmar via `gh repo view`
- NUNCA criar labels que nao existem no repo — usar apenas labels existentes ou omitir

## Quality Gate

- [ ] Dedup check executado (nao criou duplicata)?
- [ ] Issue tem titulo claro e descritivo?
- [ ] Issue tem contexto suficiente para alguem resolver sem o agent?
- [ ] Severidade justificada?
- [ ] Labels corretas para o tipo de problema?
- [ ] Repo correto confirmado?
