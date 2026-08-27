# ADR-0003 — Cockpit de registro dos terminais = gusman-os `/fleet`; cmux fica com a status-board de exemplo

- **Data**: 2026-08-27
- **Status**: aceita (execução do plano `docs/workspace/PLANO-cmux-064-cockpit-terminais-2026-08-27.md`)
- **Contexto**: o update do cmux 0.62.2 → 0.64.22 trouxe Feed, Dock, custom sidebars (Swift, beta), diff viewer com comentários e custom commands. Ao mesmo tempo o gusman-os já tinha `/fleet` (adopt/new/open/respawn/restore/send/handoff/kill/schedules), a réplica `/cmux`, o deck Ulanzi com tela cmux e o canal WhatsApp; a Onda 6 (#261–265) mergeou e #348/#349 (fila visível + auto-descoberta de workspaces) estão abertos. Manter dois cockpits (sidebar Swift própria no cmux e o gusman-os) duplicaria estado e esforço — a avaliação de 27/08 já dizia "não os dois".

## Decisão

1. **gusman-os `/fleet` é o cockpit de registro** (remoto, WhatsApp, deck, agendas). A fonte de identidade que ele deve adotar é `docs/ai-state/terminais/registry.json` (papel → tier/agent/UUID/session_id/cwd/frente) — PR futuro em gusman-os: ler o registry em vez de descobrir só pelo socket do cmux.
2. **No cmux** ficam apenas: Feed (Ctrl-4 / `cmux rpc feed.list`) como entrada de "Precisa de você" do RESUMO, Dock global (`feed tui` + `lazygit`), a **status-board de exemplo** (`~/.config/cmux/sidebars/status-board.swift`, sem código próprio) e as ações customizadas do `+` que chamam `terminal-open.sh <PAPEL>`.
3. **Não** se escreve sidebar Swift própria; **não** se instala AgentHUD (sem licença, autor único) nem multiagents/agent-mail; `cmux send` não é barramento agente→agente (só nudge/broadcast humano).
4. `autoResumeAgentSessions` fica **false permanente** — a retomada é por lote e por papel via `terminal-open.sh` (cap 15 sessões = 10 Claude + 5 Codex, decisão do dono 27/08 18:50; `memory_pressure` ≥ 20% livre entre aberturas).
5. Identidade e endereçamento de terminal são por **papel/registry + UUID** (0.64 não usa mais `workspace:N` como id estável); ordens vão por `terminal-send.sh <PAPEL>` (≤ 600 chars — `cmux send` trunca; conteúdo longo vai em arquivo) e o que muda decisão vai em arquivo antes da mensagem (`ALERTAS.md`, `PEDIDOS.md`, `ORDENS.md`, `AUTORIZACOES.md`, `DECISOES-PENDENTES.md`).

## Consequências

- Uma única visão de frota (gusman-os) com dados vindos do registry + liveness (`terminais-liveness.sh`, launchd 10 min) — o RESUMO e o watchdog já consomem os mesmos arquivos.
- Custo: gusman-os precisa de um PR para adotar o registry; até lá o `/fleet` continua descobrindo pelo socket (funciona, mas sem papel/tier).
- Revisão: 30 dias após o merge de #348/#349, ou se a status-board de exemplo se mostrar insuficiente — aí a decisão é evoluir o gusman-os, nunca abrir a frente Swift.

Relacionadas: ADR-0001 (consolidação pós-Opus 4.7), ADR-0002 (transição Fable 5), memória `reference_cmux_064_papeis_registry_e_uuid`.
