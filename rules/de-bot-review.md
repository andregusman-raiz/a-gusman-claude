---
description: "Resposta a review do raiz-pr-bot-aws — classificar antes de agir; calibração medida; anti-dismissal; migrations forward-only"
paths:
  - "**/raiz-data-engine/**"
---

# Bot Review (raiz-pr-bot-aws) — Playbook Operacional

> Fonte canônica: `~/Claude/docs/ai-state/de-pr-queue/BOT-REVIEW-BEST-PRACTICES.md` (auditoria de 301 CRs, PRs #6100–#6340) + `QUEUE.md` regras 0.5/0.6/5.5/7.
> Triage automático de um PR: `bash ~/.claude/scripts/de-cr-triage.sh <pr>`.

## Ao receber CHANGES_REQUESTED: classificar ANTES de tocar código

| Classe | Como reconhecer | Ação obrigatória |
|---|---|---|
| **MECÂNICO** (52% das reviews) | CI vermelho alheio ao diff: despertador vencido, billing GHA, flake conhecido, branch behind, conflito de merge | Curar a CAUSA (renovar decisão via coordenador / `update-branch` / aguardar) + re-request review. NUNCA "consertar" código para vermelho que não é do seu diff |
| **SUBSTANTIVO com arquivo:linha** | Aponta arquivo/linha concretos | Calibração medida: 5/5 reais, zero falso positivo → corrigir DIRETO, sem contestar |
| **SUBSTANTIVO por inferência** | Suposição sobre arquitetura/fluxo, sem arquivo:linha | Calibração medida: 4/5 ERRADAS → ler o código relevante ANTES de obedecer; se refutável, contestar no thread com evidência concreta (trecho, teste, log) |
| **REFUTADO-REPETIDO** | Mesmo CR substantivo mantido após contestação fundamentada | Rota via coordenador (regra 0.6), uma decisão por vez — nunca dismissal unilateral |

## Inegociáveis

1. ⛔ **NUNCA dismissar review do bot por conta própria** — nem CR obviamente mecânico. Dismissal é ação admin regida pela regra 0.6: sempre via coordenador (claude-80) com autorização explícita do dono. Classificar certo NÃO dá autoridade para dismissar.
2. ⛔ **NUNCA editar migration Alembic já mergeada** — sempre revision sucessora forward-only (`YYYYMMDD_HHMM-NNN_slug.py`, NNN = head+1 livre) com `downgrade()` não-destrutivo. Hook `de-migration-immutability-guard` bloqueia a edição; bypass `DE_MIGRATION_GUARD_BYPASS=1` só com autorização do dono.
3. **Regra dos 3 ciclos**: 3 rodadas substantivas sem convergir → parar de patchar incrementalmente e voltar para SPEC/redesign (casos #6306 e #6301).
4. **Evidência de gate só vale no MESMO head/SHA** sob review — gate verde em head anterior não conta.
5. **Rota/endpoint novo** = auth server-side comprovada no MESMO head, com teste bloqueante ("a app cuida disso" não é aceito).
6. **Escrita concorrente/refresh/redelivery** = idempotência + exclusão mútua (advisory lock) DEMONSTRADAS — "não deveria acontecer" não é prova.
7. **Sanitizar segredos/PII ANTES de persistir** qualquer exceção/stderr/log em ledger.
8. **Governança/DPO-Legal** não fecha como "resolvido" sem aprovação humana registrada e verificável no head.
9. **Antes de abrir PR**: `bash ~/.claude/scripts/de-pr-preflight.sh --fast` (inclui despertador vencido + colisão de NNN Alembic + overlap de arquivos vs PRs abertos).
10. ⛔ **1 frente = 1 PR-trem vivo (teto 2)** — regra 8 do QUEUE.md: trabalho novo da frente ANEXA ao PR aberto (push na branch + re-request review); PR novo do mesmo tema é exceção autorizada pelo coordenador. Claim declara `frente`; hook bloqueia `gh pr create` acima do teto.
