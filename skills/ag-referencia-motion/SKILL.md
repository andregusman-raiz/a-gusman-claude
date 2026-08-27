---
name: ag-referencia-motion
description: "Motion/animação de UI: gate de frequência, 3 curvas canônicas, durações <300ms, springs, interruptibilidade, 13 receitas prontas (RECIPES.md). Carregar ANTES de animar qualquer componente, revisar motion ou escolher lib de animação."
metadata:
  filePattern:
    - "**/*animation*"
    - "**/*motion*"
    - "**/*transition*"
    - "**/globals.css"
  priority: 84
  cache_policy:
    enabled: true
    marker_after: "## Bibliotecas — qual usar quando"
---

# Motion — Referência canônica de animação de UI

> Destilado de `emilkowalski/skills` (Emil Kowalski — criador de Sonner/Vaul, animations.dev; MIT © 2026 Emil Kowalski)
> adaptado para a stack Raiz (Next.js + Tailwind + shadcn/Radix).
> Tokens machine-readable: `~/Claude/assets/design-library/tokens/motion.json`.
> Receitas com código pronto: `RECIPES.md` nesta pasta.
> Complementa §9 do design system (`assets/design-library/UI_UX/raiz-educacao-design-system.md`).

Premissa: "agents don't have great taste" — os erros de motion são pequenos e sistemáticos
(`ease-in` em entrada, `transition: all`, animar atalho de teclado). Esta skill cataloga os erros e as correções com valores exatos. **Produzir zero animação às vezes é o resultado correto.**

---

## Regra zero — Gate de frequência (decidir SE anima, antes de COMO)

| Frequência da ação | Decisão |
|---|---|
| 100+×/dia (atalho de teclado, command palette, tab switch de trabalho) | **Nunca animar** (Raycast não anima open/close — correto) |
| Dezenas/dia (hover, navegação de lista, expandir painel) | Remover ou quase-imperceptível (≤150ms) |
| Ocasional (modal, drawer, toast, dropdown) | Animação padrão |
| Raro/primeira vez (onboarding, empty state, sucesso, celebração) | Único lugar do "delight budget" |

**Ação iniciada por teclado = desqualificador automático.** Quem usa teclado quer velocidade.

## Propósito — nomear 1 ou não animar

Válidos: feedback de interação | consistência espacial (de onde veio/para onde vai) | indicação de estado | prevenir "teleporte" (mudança brusca de layout) | explicação (só marketing/onboarding) | delight (só tier raro).
**"Fica bonito" não é propósito.**

---

## Easing — 3 curvas canônicas

Os built-ins CSS (`ease-out`, `ease-in-out`) são fracos demais para UI. Usar os tokens:

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* entrada/saída de elementos — default UI */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* elemento se movendo/morphing NA tela */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* curva iOS de drawer/sheet (a do Vaul) */
```

Árvore de decisão:

| Situação | Curva |
|---|---|
| Elemento entrando OU saindo | `--ease-out` |
| Elemento movendo/transformando na tela | `--ease-in-out` |
| Hover / mudança de cor | `ease` (built-in serve) |
| Movimento constante (marquee, progresso, spinner) | `linear` |
| Em dúvida | `--ease-out` |

**NUNCA `ease-in` em UI** — atrasa exatamente o momento que o usuário observa. `ease-out` 200ms *parece* mais rápido que `ease-in` 200ms. Curva nova: pegar de easing.dev / easings.co, **nunca inventar valores que "parecem familiares"**.

## Durações — UI sempre <300ms

| Elemento | Duração |
|---|---|
| Press de botão | 100–160ms |
| Tooltip, popover pequeno | 125–200ms |
| Dropdown, select, menu | 150–250ms |
| Modal | 200–300ms |
| Drawer/sheet | 300–500ms (`--ease-drawer`) |
| Marketing/explicativo (scroll reveal) | pode ser maior (600ms) |

Exit ≠ enter: saída pode (e deve) ser mais rápida que a entrada — ex. enter 250ms, exit 200ms.

---

## Fisicalidade

- **Nunca `scale(0)`** — nada no mundo real aparece do nada. Entrar de `scale(0.9–0.97)` + `opacity: 0`.
- **`transform-origin` no trigger** para popover/dropdown/tooltip/menu (Radix expõe `--radix-popper-transform-origin`; Base UI, `var(--transform-origin)`). **Modais são isentos** — ficam centered, `transform-origin: center`.
- **Press de botão**: `:active { transform: scale(0.97) }` + `transition: transform 160ms var(--ease-out)`. Faixa sutil 0.95–0.98. `scale()` escala os filhos junto — é feature, não bug.

## Performance — só `transform` e `opacity`

- Animar **apenas `transform` e `opacity`** (GPU). `width/height/margin/padding/top/left` disparam layout+paint. `clip-path` é a quarta propriedade sancionada. `height` tolerado só em accordion (200ms máx, custa layout por frame).
- **`transition: all` = proibido sempre.** Listar propriedades explícitas.
- **Framer Motion: shorthands `x`/`y`/`scale` NÃO são hardware-accelerated** (rAF na main thread, derrubam frames sob carga). Usar a string completa: `animate={{ transform: "translateX(100px)" }}`.
- **Nunca dirigir transform de filho via CSS variable no pai** (`setProperty('--x')` no pai recalcula estilo de todos os filhos) — setar `element.style.transform` direto.
- CSS/WAAPI > JS sob carga (rodam fora da main thread). WAAPI = controle JS com performance CSS:
  `el.animate([...], { duration: 200, fill: 'forwards', easing: 'cubic-bezier(0.23, 1, 0.32, 1)' })`.
- Escada de ferramentas (usar a mais barata que resolve): CSS transition → `@starting-style` → CSS animation → WAAPI → Motion (só quando precisa de spring/layout/exit/gesto).
- Percentuais em `translate()` são relativos ao próprio elemento (`translateY(100%)` = própria altura — como Vaul esconde o drawer). Preferir % a px.

## Interruptibilidade

- **Transitions retargetam do valor atual; keyframes reiniciam do zero.** Qualquer coisa disparada em sequência rápida (toast, toggle, hover) usa `transition`, nunca `@keyframes`.
- Entrada sem JS: `@starting-style`. Com Radix/shadcn: animar via `data-[state=open]`/`data-[state=closed]`.
- Gestos usam **springs** (carregam a velocidade do release na interrupção — CSS não).
- "Exit the way it entered" — saída pelo mesmo caminho da entrada torna swipe-to-dismiss espacialmente óbvio.

## Springs (gestos e Motion)

- Recomendado (estilo Apple): `{ type: "spring", duration: 0.5, bounce: 0.2 }`.
- Bounce 0.1–0.3; **evitar bounce na maioria da UI** — reservar para drag-to-dismiss/playful.
- Parâmetros Apple (damping ratio / response): Move/PiP = `1.0 / 0.4` | Rotação = `0.8 / 0.4` | Drawer = `0.8 / 0.3`. Default web: `{ type: 'spring', bounce: 0, duration: 0.4 }`; `bounce: 0.2` só quando o gesto carregou momentum.
- **Dismiss por velocity**: `velocity = |swipeAmount| / elapsedMs`; dismiss se passou do threshold **ou** `velocity > 0.11` (flick basta).
- **Projeção de momentum** (escolher snap point): `project(v, d = 0.998) = (v/1000) * d / (1 - d)`; snap para o ponto mais próximo de `current + project(releaseVelocity)`.
- **Rubber-band** em boundary: `(overshoot * dim * 0.55) / (dim + 0.55 * |overshoot|)`.

## Polish

- **Timing assimétrico**: fase deliberada lenta, resposta do sistema rápida (hold-to-confirm: press 2s `linear`, release 200ms `--ease-out`; progresso nunca tem easing).
- **Stagger**: 30–80ms entre itens (default 50ms), `translateY(8px)` + fade 300ms `--ease-out`. Decorativo — nunca bloquear interação. Tudo-de-uma-vez em entrada de grupo = finding.
- **Blur para mascarar crossfade**: quando dois estados sobrepostos "não assentam", `filter: blur(2px)` + `opacity: 0.7` durante a transição (200ms) funde os dois em uma transformação percebida. Blur <20px (caro no Safari).
- **Perceived performance**: spinner mais rápido faz o load *parecer* menor; tooltips instantâneos após o primeiro (`[data-instant] { transition-duration: 0ms }`).
- **Coesão**: motion herda a personalidade do produto (Sonner usa `ease` 400ms de propósito — elegante; dashboard profissional = crisp e rápido). Consolidar curvas nos tokens — 5 cubic-beziers digitados à mão quase iguais = finding.

## Acessibilidade

- `prefers-reduced-motion: reduce` = **menos e mais gentil, não zero**: manter opacity/cor, remover movimento (slide → cross-fade). Em JS: `useReducedMotion()` e branch dos valores.
- Hover gated: `@media (hover: hover) and (pointer: fine)` — touch dispara hover falso no tap. Exceção: `:active` não precisa de gate (press é real no touch).
- Reduced-motion e hover gating saem **junto** com a animação, não "depois".

---

## Checklist "Never Ship" (bloqueia entrega)

1. `transition: all`
2. `scale(0)` ou fade puro sem transform de entrada
3. `ease-in` em qualquer transição de UI
4. Animação em ação iniciada por teclado / 100+×dia
5. >300ms em UI funcional sem justificativa
6. `transform-origin: center` em popover/dropdown ancorado
7. `@keyframes` em elemento re-disparável (toast, toggle)
8. Animação de propriedade de layout (width/height/top/left/margin)
9. Framer Motion shorthands (`x`, `y`, `scale`) em componente sob carga
10. CSS var no pai dirigindo transform de filho
11. Sem `prefers-reduced-motion`
12. Hover não-gated (`@media (hover: hover)`)
13. Timing simétrico em press-and-release deliberado (hold-to-confirm)
14. Entrada de grupo tudo-de-uma-vez (sem stagger)

**Hierarquia remedial** (preferir os primeiros): 1 deletar a animação → 2 reduzir → 3 corrigir easing → 4 corrigir origem/fisicalidade → 5 tornar interruptível → 6 mover para GPU → 7 timing assimétrico → 8 polish (blur/stagger/spring) → 9 a11y/coesão.
Em dúvida se o motion está certo: **o movimento mais forte costuma ser deletá-lo.**

## Debugging de feel

Slow motion 2–5× no DevTools (Animations panel), frame-by-frame, device real para gestos (Safari remote), e rever no dia seguinte com olhos frescos.

---

## Bibliotecas — qual usar quando

Checar `package.json` primeiro; se já usa competidor, sinalizar antes de trocar. Uma lib por necessidade:

| Necessidade | Lib |
|---|---|
| Primitives acessíveis (dropdown, dialog, popover) | Radix via shadcn/ui (padrão Raiz); base-ui em projeto novo sem shadcn |
| Toasts | **Sonner** (nunca toast à mão) |
| Drawer mobile | **Vaul** |
| ⌘K / command palette | **cmdk** |
| Animação geral React (spring/layout/exit/gesto) | **motion** (Framer Motion) — hover/fade simples é CSS puro |
| Números animados | **NumberFlow** |
| OTP input | **input-otp** |
| Virtualização 1000+ rows | **Virtuoso** |
| DnD | **dnd kit** |

<!-- cache_control: ephemeral -->

## Integração com o sistema Raiz

- **Tokens**: `assets/design-library/tokens/motion.json` (curvas, durações, springs, stagger) — source of truth machine-readable.
- **Receitas prontas**: `RECIPES.md` nesta pasta — 13 padrões com código (button press, dropdown, tooltip, modal, drawer, toast, accordion, stagger, hold-to-confirm, tab indicator, scroll reveal, drag-to-dismiss, WAAPI).
- **Prose canonical**: design-system.md §9 (resumo executivo; esta skill é a referência completa).
- **Machine wrapper**: `/ag-11-ux-ui` (Step 5 Motion aponta para cá).
- **Review de motion**: usar o Checklist Never Ship como gate em `/ag-4-teste-final` UX-QAT e PRs de UI.
- Nota de adaptação: receitas originais assumem Base UI (`[data-starting-style]`); com Radix/shadcn usar `data-[state=open]`/`data-[state=closed]` + `--radix-popper-transform-origin`.
