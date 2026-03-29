---
id: pageflip-3d
name: 3D Page-Flip Document Viewer
category: media
source: fliphtml-raiz
complexity: medium
---

# 3D Page-Flip Viewer

## What it solves
Interactive book/magazine viewer with realistic 3D page-turn animation, responsive layout, zoom, fullscreen, and analytics.

## Best implementation
`~/Claude/projetos/fliphtml-raiz/src/components/flipbook/flipbook-viewer.tsx`

## Key features
- **page-flip library**: loaded via dynamic `import()` (no SSR)
- **Responsive layout**: desktop shows spread pages, mobile uses portrait single-page
- **Aspect ratio from first image**: page dimensions computed dynamically
- **Controls**: prev/next, zoom (0.5x-2x via CSS scale), fullscreen (Fullscreen API)
- **Share**: Web Share API with clipboard fallback
- **Lazy loading**: first 3 pages eager, rest lazy
- **Thumbnail strip**: desktop only, active page highlighted
- **Analytics**: view registration on mount, time-spent + pages-viewed on unmount via `navigator.sendBeacon`

## Dependencies
- page-flip (dynamic import)
- Fullscreen API, Web Share API
- navigator.sendBeacon (analytics)
