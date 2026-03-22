# Anti-Patterns Visuais: {{SCREEN_NAME}}

> Cada anti-pattern representa um TIPO DIFERENTE de falha visual.
> O ag-42 usa estes anti-patterns para calibrar o Judge e detectar regressoes.

## AP-1: Overflow Mobile
**Severidade**: P1
**Breakpoint**: 375px
**Descricao**: Container principal excede viewport, scroll horizontal visivel
**Score impacto**: -3 (penalty overflow-horizontal)
**Como detectar**: `scrollWidth > clientWidth` no viewport 375px
**Como corrigir**: `overflow-x: hidden` ou ajustar layout flex/grid

## AP-2: Contraste Insuficiente
**Severidade**: P1
**Breakpoint**: todos
**Descricao**: Texto principal com contraste < 4.5:1 (WCAG AA) ou < 3:1 (large text)
**Score impacto**: -2 (penalty texto-ilegivel)
**Como detectar**: axe-core rule `color-contrast`
**Como corrigir**: Usar cores do design token palette com contraste verificado

## AP-3: Touch Target Pequeno
**Severidade**: P2
**Breakpoint**: 375px, 768px
**Descricao**: Botoes ou links interativos com area < 44x44px
**Score impacto**: -2 (penalty touch-target-pequeno)
**Como detectar**: `element.getBoundingClientRect()` width/height < 44
**Como corrigir**: `min-height: 44px; min-width: 44px` ou padding adequado

## AP-4: Cor Fora do Palette
**Severidade**: P3
**Breakpoint**: todos
**Descricao**: Elemento usa cor que nao pertence ao design token palette
**Score impacto**: -1 (penalty inconsistencia-cor)
**Como detectar**: Comparar `getComputedStyle` com design-tokens.json
**Como corrigir**: Substituir hard-coded color por design token

## AP-5: Layout Shift
**Severidade**: P2
**Breakpoint**: todos
**Descricao**: Elementos mudam de posicao durante carregamento (CLS > 0.1)
**Score impacto**: -1 (penalty layout-shift)
**Como detectar**: PerformanceObserver para `layout-shift` entries
**Como corrigir**: Definir width/height explicitos, usar skeleton loading
