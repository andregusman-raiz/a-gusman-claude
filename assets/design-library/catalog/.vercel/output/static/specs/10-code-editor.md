---
id: code-editor
name: Branded Monaco Code Editor
category: tools
source: raiz-platform
complexity: medium
---

# Branded Monaco Editor

## What it solves
Embedded code editor with custom branded themes, auto dark-mode switching, and 30+ language support.

## Best implementation
`~/Claude/GitHub/raiz-platform/src/components/chat/canvas/MonacoCanvas.tsx`

## Key features
- **Dynamic import**: `next/dynamic` + `ssr: false` (no server bundle)
- **Custom themes**: `qi-light` and `qi-dark` with full token colour rules (keywords, strings, functions, types, operators, tags) and editor chrome colours
- **Auto theme switch**: MutationObserver watches `dark` class on `<html>` — no prop drilling
- **30+ languages**: extension-to-Monaco language ID mapping
- **Read-only mode**: disables context menu, suggestions, line highlight
- **Typography**: JetBrains Mono / Fira Code, 1.6 line height
- **Auto layout**: `automaticLayout: true` handles container resize
- **Minimal chrome**: no minimap, no overview ruler, wordWrap on

## Props interface
```ts
interface MonacoCanvasProps {
  code: string;
  language: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  height?: string;
}
```

## Dependencies
- @monaco-editor/react (dynamic import)
- MutationObserver (theme switching)
