# Playbook — Prompt de Diagnóstico + Melhoria UX/UI

> Prompt universal para qualquer projeto. Colar no Claude Code na raiz do projeto-alvo.
> Orquestra: ag-11-ux-ui (motor de busca + anti-slop) + ag-referencia-motion (Never Ship) +
> ag-referencia-design-presentation (taxonomia 86 layouts) + tokens Raiz + UX-QAT visual.
> Preencher os campos entre <>. Modos: default interativo | `--autonomo` (aplica P0/P1 sem parar) | `--diagnostico-only` (para na Fase 2).

---

```
Faça um diagnóstico completo de UX/UI deste projeto e depois aplique as melhorias aprovadas.

## Parâmetros
- Projeto: <nome> — rodando em <URL ou porta localhost; se não estiver rodando, suba o dev server>
- Páginas-chave a auditar: <lista de rotas; se vazio, descubra as 3-5 rotas principais navegando>
- Identidade: <produto Raiz (tokens --raiz-*) | marca própria: <tokens/hex> | sem identidade definida — proponha direção>
- Modo: <interativo | --autonomo | --diagnostico-only>

## Setup (antes de qualquer análise)
1. Carregue as skills: /ag-referencia-motion (sempre) e, se houver landing/marketing/auth, /ag-referencia-design-presentation. Se as skills não estiverem disponíveis neste projeto, leia direto:
   - ~/Claude/.claude/skills/ag-referencia-motion/SKILL.md (+ RECIPES.md)
   - ~/Claude/assets/design-library/tokens/*.json (colors, typography, spacing, radii, motion)
   - ~/Claude/assets/design-library/UI_UX/raiz-educacao-design-system.md
2. Detecte a stack (package.json) e rode o motor do ag-11 para baseline das regras:
   python3 ~/Claude/.claude/skills/ag-11-ux-ui/scripts/search.py "<tipo de produto>" --design-system
   python3 ~/Claude/.claude/skills/ag-11-ux-ui/scripts/search.py "animation accessibility contrast" --domain ux
3. Navegue as páginas-chave via Playwright MCP (browser_navigate + browser_snapshot; screenshot só onde pixel importa). Capture em 375px e 1440px.

## FASE 1 — Diagnóstico (READ-ONLY — nenhum edit nesta fase)
Audite as 6 dimensões. Todo finding = arquivo:linha + regra violada + severidade (P0 quebra uso / P1 fere identidade ou a11y / P2 polish) + fix proposto em 1 linha.

D1 IDENTIDADE/TOKENS — cores hardcoded fora dos tokens, fontes genéricas (Inter/Roboto/Arial = P1), radius/sombras inconsistentes, border+shadow combinados em cards, dark mode quebrado.
D2 LAYOUT — hierarquia visual, spacing fora do grid 4px, container widths misturados, responsivo em 375/768/1024/1440, conteúdo atrás de navbar fixa, horizontal scroll mobile.
D3 INTERAÇÃO — clicáveis sem cursor-pointer, sem hover/focus feedback, touch targets <44px, botões sem estado loading/disabled, estados vazios/erro ausentes, hover-only em ação primária.
D4 MOTION — rode os greps do audit: `transition: all`, `ease-in`, `@keyframes` em toast/toggle, `scale(0)`, `animate={{ x`, `animate={{ y`, ausência de `prefers-reduced-motion`, `transform-origin: center` em popover, animação de width/height/top/left, animação em ação de teclado/alta frequência. Valide contra o checklist "Never Ship" (14 itens) da /ag-referencia-motion. Liste também 2-4 oportunidades de motion AUSENTE (press feedback, teleporte de estado, entrada de grupo sem stagger) — e no mínimo 2 candidatos REJEITADOS pelo gate de frequência, com a razão.
D5 ACESSIBILIDADE — contraste (4.5:1 texto normal), aria-label em botões de ícone, labels em forms, ordem de tab, skip link, alt text, cor como único indicador.
D6 ANTI-AI-SLOP — a interface tem direção estética comprometida ou é "default AI"? Fonte genérica, gradiente roxo sobre branco, fundo branco/cinza sólido sem atmosfera, paleta tímida distribuída, tudo igual a qualquer SaaS. Nomeie a direção atual e a direção recomendada em 1 frase cada.

Score por dimensão (0-100, começa em 100, P0 −20, P1 −10, P2 −3) + score geral (média).

## FASE 2 — Priorização
Tabela única rankeada por impacto÷esforço: | # | Dim | Finding | Onde | Sev | Fix | Esforço |
- Modo interativo/diagnostico-only: PARE aqui e apresente. Aguarde escolha (all / P0+P1 / números).
- Modo --autonomo: aplique P0+P1 automaticamente; P2 só lista.

## FASE 3 — Melhoria
- Feature branch (nunca commit em main). Batches de máx 5 arquivos; após cada batch: typecheck + lint do projeto + git diff --stat.
- Motion: use as receitas prontas de ~/Claude/.claude/skills/ag-referencia-motion/RECIPES.md (curvas: --ease-out cubic-bezier(0.23, 1, 0.32, 1) | --ease-in-out cubic-bezier(0.77, 0, 0.175, 1) | --ease-drawer cubic-bezier(0.32, 0.72, 0, 1)). Registre as curvas como tokens CSS no globals — nunca valores soltos repetidos. reduced-motion e hover-gating saem JUNTO com cada animação adicionada.
- Toast → Sonner; drawer mobile → Vaul; ⌘K → cmdk; número animado → NumberFlow. Não reimplementar à mão. Qualquer lib nova: 1 linha de justificativa.
- SÓ apresentação/interação — nenhuma mudança de comportamento, lógica de negócio, rotas ou dados. Zero dados mock. Na dúvida se um fix muda comportamento: não aplique, reporte.

## FASE 4 — Verificação e entrega
1. Re-navegue as páginas tocadas (Playwright, 375px e 1440px) e compare com os snapshots da Fase 0.
2. Re-rode o checklist Never Ship + re-score as 6 dimensões.
3. Rode os gates do projeto (typecheck/lint/test).
4. Relatório final: tabela | Before | After | Why | por mudança (formato obrigatório — nunca lista "Before:/After:"), score antes → depois por dimensão, o que NÃO foi feito e por quê, e os P2 restantes como backlog.
Critério de aceite: zero P0 remanescente, score geral ≥ 85, gates verdes, nenhum comportamento alterado.
```

---

## Notas de uso

- **Projeto fora do workspace Raiz**: o prompt já tem fallback por path absoluto (item 1 do Setup) — funciona mesmo sem as skills registradas.
- **Marca própria (não-Raiz)**: preencher o campo Identidade com os tokens do cliente; D1 audita contra eles em vez dos `--raiz-*`.
- **Rodar só o diagnóstico periodicamente**: usar `--diagnostico-only` e guardar o relatório como baseline; a Fase 2 vira backlog.
- **Escalar para pipeline completo**: findings estruturais grandes (redesign, novo design system) → sair deste prompt e rotear `/ag-11-ux-ui` (design) ou `/ag-0-orquestrador --full`.
- Fonte dos padrões de motion: emilkowalski/skills (MIT), incorporado em `/ag-referencia-motion` (2026-08-14).
