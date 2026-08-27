# Motion Recipes — 13 padrões com código

> Adaptado de `emilkowalski/skills` (MIT © 2026 Emil Kowalski) para stack Raiz (Tailwind + shadcn/Radix).
> Tokens: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` | `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` | `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`
> Onde o original usa Base UI (`[data-starting-style]`), a versão Radix/shadcn usa `data-[state=open]`/`data-[state=closed]`.

## 1. Button press

```css
.btn {
  transition: transform 160ms var(--ease-out);
}
.btn:active {
  transform: scale(0.97); /* faixa sutil: 0.95–0.98 */
}
```

Sem hover gating — `:active` é press real também no touch. `scale()` escala os filhos junto (feature).

## 2. Dropdown / popover / menu / select

```css
.popover {
  transform-origin: var(--radix-popper-transform-origin); /* Base UI: var(--transform-origin) */
  transition: opacity 200ms var(--ease-out), transform 200ms var(--ease-out);
}
.popover[data-state="closed"] {
  opacity: 0;
  transform: scale(0.95);
}
```

Nunca `transform-origin: center` em elemento ancorado — cresce a partir do trigger.

## 3. Tooltip

Igual ao popover, mas 125ms e `scale(0.97)`. Vizinhos após o primeiro abrem instantâneos:

```css
.tooltip[data-instant] { transition-duration: 0ms; }
```

## 4. Modal

```css
.modal {
  transform-origin: center; /* modal é ISENTO da regra de origin — fica centered */
  transition: opacity 250ms var(--ease-out), transform 250ms var(--ease-out);
}
.modal[data-state="closed"] { opacity: 0; transform: scale(0.96); }
.backdrop { transition: opacity 250ms var(--ease-out); } /* junto = "uma superfície só" */
```

## 5. Drawer / sheet

```css
.drawer {
  transform: translateY(100%); /* % relativo ao próprio elemento — como o Vaul */
  transition: transform 500ms var(--ease-drawer);
}
.drawer[data-state="open"] { transform: translateY(0); }
```

Preferir Vaul a implementar à mão (gesture + snap points inclusos).

## 6. Toast

```css
.toast {
  transition: opacity 400ms ease, transform 400ms ease;
}
@starting-style {
  .toast { opacity: 0; transform: translateY(100%); }
}
```

`ease` e mais lento de propósito (personalidade Sonner — elegante). Transition, nunca keyframes: toasts disparam em sequência e precisam retarget. Em produto Raiz: usar Sonner direto.

## 7. Accordion

```css
.accordion-content {
  overflow: hidden;
  transition: height 200ms var(--ease-out), opacity 200ms var(--ease-out);
}
```

`height` é a exceção tolerada (custa layout por frame → por isso curto, 200ms). Medir altura em JS (`el.scrollHeight`) — não animar para `auto`. Com Radix: `--radix-accordion-content-height`.

## 8. Stagger (entrada de grupo)

```css
.item {
  animation: fadeIn 300ms var(--ease-out) both;
}
.item:nth-child(1) { animation-delay: 50ms; }
.item:nth-child(2) { animation-delay: 100ms; }
.item:nth-child(3) { animation-delay: 150ms; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
}
```

30–80ms entre itens (default 50ms). Decorativo — nunca bloquear interação esperando a cascata.

## 9. Hold to confirm (destrutivo)

```css
.hold-overlay {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 200ms var(--ease-out); /* release: rápido */
}
.btn-hold:active .hold-overlay {
  clip-path: inset(0 0 0 0);
  transition: clip-path 2s linear; /* press: deliberado; progresso NUNCA tem easing */
}
.btn-hold:active { transform: scale(0.97); }
```

Timing assimétrico: fase deliberada lenta, resposta do sistema rápida.

## 10. Tab indicator (transição de cor perfeita)

Duplicar a lista de tabs, estilizar a cópia como ativa, clipar a cópia e animar o clip:

```css
.tabs-active-copy {
  clip-path: inset(0 60% 0 20%); /* ajustado por JS para o tab ativo */
  transition: clip-path 250ms var(--ease-in-out);
}
```

Cores mudam em sincronia perfeita porque é um único elemento sendo revelado.

## 11. Scroll reveal (SÓ marketing/landing)

```css
.reveal {
  clip-path: inset(0 0 100% 0);
  transition: clip-path 600ms var(--ease-in-out);
}
.reveal.in-view { clip-path: inset(0); }
```

```tsx
const inView = useInView(ref, { once: true, margin: "-100px" }); // dispara UMA vez
```

Nunca em app funcional (usuário scrolla dezenas de vezes/dia → gate de frequência mata).

## 12. Drag to dismiss

```tsx
// dismiss por distância OU velocity (flick basta)
const velocity = Math.abs(swipeAmount) / elapsedMs;
if (swipeAmount >= SWIPE_THRESHOLD || velocity > 0.11) dismiss();
```

Regras: `setPointerCapture` + respeitar grab offset (não snapar ao centro) | transform direto no elemento (nunca CSS var no pai) | guard multi-touch (`if (isDragging) return`) | rubber-band no boundary: `(overshoot * dim * 0.55) / (dim + 0.55 * |overshoot|)` | settle com `{ type: "spring", duration: 0.5, bounce: 0.2 }` (spring carrega a velocity do release).

## 13. WAAPI programático (controle JS, performance CSS)

```ts
el.animate(
  [{ transform: "translateY(8px)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }],
  { duration: 200, fill: "forwards", easing: "cubic-bezier(0.23, 1, 0.32, 1)" }
);
```

Roda fora da main thread — usar quando precisa de orquestração JS sem pagar o custo do rAF.

---

## Crossfade com blur (bônus)

Quando dois estados sobrepostos "não assentam" visualmente:

```css
.morphing {
  filter: blur(2px);
  opacity: 0.7;
  transition: filter 200ms ease, opacity 200ms ease;
}
```

O blur funde os dois estados em uma transformação percebida. Manter blur <20px (caro no Safari).

## Reduced motion (padrão de substituição)

```tsx
const reduce = useReducedMotion();
const closedX = reduce ? 0 : "-100%"; // slide vira cross-fade, não vira nada
```

```css
@media (prefers-reduced-motion: reduce) {
  .drawer { transition: opacity 200ms ease; transform: none; }
}
```

Menos e mais gentil, não zero: manter opacity/cor, remover movimento.
