---
id: tv-realtime-counter
name: TV Real-Time Counter Display
category: Data Display
source: cmef-contador-matriculas
complexity: Baixa
tags: [tv, counter, realtime, animation, celebration, fullscreen]
---

# TV Real-Time Counter

## What it solves
Full-screen passive display for TV screens showing a giant animated enrollment counter with milestone celebrations.

## Best implementation
- `https://github.com/Raiz-Educacao-SA/cmef-contador-matriculas/blob/main/contadorMatriculasNovo.html`

## Key features
- **Giant counter**: font-size 18rem, center screen
- **SVG progress ring**: circular stroke-dashoffset animation
- **Animated rocket mascot**: launches on milestones
- **Confetti system**: particle burst on milestone reach
- **Screen shake**: CSS animation on celebration
- **Floating delta popup**: "+5" appears when numbers increase
- **Auto-polling**: TOTVS API every 5 seconds
- **Zero interaction**: designed for passive TV display

## Layout
```
┌─────────────────────────────────────┐
│                                     │
│          [Progress Ring]            │
│          ╔═══════════╗              │
│          ║  2.847    ║  ← 18rem    │
│          ╚═══════════╝              │
│          matrículas 2026            │
│                                     │
│     🚀  (launches on milestone)     │
│     🎊  (confetti on milestone)     │
└─────────────────────────────────────┘
```

## Dependencies
- Pure HTML/CSS/JS (no framework)
- TOTVS API for enrollment data
- CSS animations (no libraries)
