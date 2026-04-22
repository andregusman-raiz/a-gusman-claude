# Playbook 12 — Power User Skills (ADR-0001 P2.5)

> **Status:** referência power-user. Skills úteis mas não citadas em routing padrão.
> **Motivo da criação:** diagnóstico 2026-04-22 identificou skills órfãs que são úteis mas estavam invisíveis. Este playbook resgata e documenta para adoção opcional.

---

## Skills órfãs documentadas

### `/ag-buscar-voos`
- **Use case:** busca de passagens aéreas via Google Flights (fast-flights)
- **Não é domínio Raiz** — skill de uso pessoal do desenvolvedor
- **Quando usar:** "busca voos GRU → MAD" / "passagens BHZ → LIS dezembro"

### `/ag-insights`
- **Use case:** métricas de sessão/projeto (tokens gastos, trends, health)
- **Quando usar:** "quantos tokens já gastei esta semana?" / "qual projeto consome mais?"

### `/ag-advisor`
- **Use case:** análise proativa — sugere melhorias sem ser pedido
- **Quando usar:** "me dá sugestões sobre o estado do projeto X"
- **Modo:** spawn em background durante sessão longa

### `/ag-rebobinar`
- **Use case:** undo estruturado com preview e backup
- **Quando usar:** "desfaz as últimas N mudanças mas me mostra preview primeiro"

### `/ag-thinkback`
- **Use case:** replay de decisões — "por que decidimos X?"
- **Quando usar:** antes de reverter uma decisão, entender contexto original

### `/ag-teleportar`
- **Use case:** switch inteligente entre projetos (preserva contexto mental)
- **Quando usar:** mudar de ~/raiz-platform para ~/chamada-app sem perder foco

### `/ag-destilar`
- **Use case:** comprime documentos grandes (TOTVS KB, Design Library, SPECs) mantendo 100% da info
- **Quando usar:** KB > 1000 linhas que precisa caber em contexto
- **Substitui:** Read manual de arquivo gigante + Edit

### `/ag-retrospectiva`
- **Use case:** análise pós-sessão (o que funcionou, o que falhou, lessons learned)
- **Quando usar:** final de sessão longa com múltiplas decisões

### `/ag-criar-skill`, `/ag-criar-agente`, `/ag-melhorar-agentes`
- **Use case:** meta — criar novas skills/agents, refatorar existentes
- **Quando usar:** após identificar gap no ecossistema
- **Gate:** seguir ADR-0001 (preferir usar skill oficial antes de criar custom)

### `/ag-mesa-redonda`
- **Use case:** debate multi-agente (PM/Arquiteto/QA/Security) sobre decisão técnica
- **Output:** decisão + rationale + dissenting opinions → ADR
- **Inspiração:** Party Mode do BMAD-METHOD
- **Quando usar:** decisão arquitetural com 2+ alternativas válidas

### `/ag-adversario`
- **Use case:** adversarial review — tenta quebrar o design antes do build
- **Quando usar:** ENTRE spec e plan. Antes de implementar, descobrir edge cases
- **Inspiração:** BMAD edge-case-hunter

### `/ag-planejar-incorporacao`, `/ag-incorporar-modulo`, `/ag-mapear-integracao`
- **Use case:** roadmap de incorporação de sistemas externos
- **Quando usar:** modo `integrate` de `ag-1-construir` (raramente usado)

---

## Quando NÃO usar power-user skills

- Para fluxos padrão (build/fix/deploy/test) use as 13 machines (`ag-0` a `ag-12`)
- Para expertise on-demand use reference skills (`/ag-referencia-*`)
- Para plugins oficiais use canonicals (Vercel, Sentry, Figma, etc — ver ADR-0001)

---

## Meta-fluxo de criação de novos agents/skills

Se necessário criar nova skill/agent:

1. Verificar se **plugin oficial** já cobre (Vercel/Sentry/Figma/Chrome/Supabase/Railway)
2. Se não: **consolidar em machine existente** antes de criar nova
3. Se necessidade clara de nova skill: usar `/ag-criar-skill` ou `/ag-criar-agente`
4. Novo agent/skill DEVE seguir ADR-0001 (não duplicar skills em `agents/` — já deprecado)
5. Adicionar ao CLAUDE.md ou rules relevantes para descoberta

---

## Referências

- Diagnostic report: `~/Claude/docs/diagnosticos/2026-04-22-ag-x-diagnostic-report.md`
- ADR: `~/Claude/.claude/shared/adr/ADR-0001-consolidacao-pos-opus-47.md`
- Execution plan: `~/Claude/docs/diagnosticos/2026-04-22-execution-plan.md`
