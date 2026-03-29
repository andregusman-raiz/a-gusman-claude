---
id: content-studio-ai
name: AI Content Studio (Editor + Slides + Images)
category: AI
source: raiz-platform
complexity: Muito Alta
tags: [content, editor, slides, images, tiptap, infographic, ai]
---

# AI Content Studio

## What it solves
Interactive multi-output AI content creation: rich text, infographics, images with edit canvas, presentation slides, and data charts.

## Best implementations
- `~/Claude/GitHub/raiz-platform/src/components/content-studio/TiptapEditor.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/content-studio/ImageEditCanvas.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/content-studio/InfographicCreator.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/content-studio/presentation/editor/SlideCanvas.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/content-studio/presentation/editor/SlideNavigator.tsx`

## Key features
- **Tiptap editor**: rich text with AI suggestions
- **Image edit canvas**: in-browser lightweight image editor (not just generator)
- **Slide builder**: typed content blocks (text, bullets, image, chart, table) + speaker notes
- **Infographic creator**: AI-generated visual layouts
- **AI chat side panel**: iterate on content with AI alongside editor

## Slide Types
```ts
type ContentBlockType = 'text' | 'bullets' | 'image' | 'chart' | 'table';

interface SlideContent {
  id: string;
  title: string;
  blocks: ContentBlock[];
  speakerNotes: string;
}

interface SlideCanvasProps {
  slide: SlideContent;
  onChange: (slide: SlideContent) => void;
  readOnly?: boolean;
}
```

## Dependencies
- @tiptap/react (rich text)
- Canvas API (image editing)
- AI generation service
