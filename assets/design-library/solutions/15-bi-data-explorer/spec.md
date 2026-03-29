---
id: bi-data-explorer
name: BI Data Explorer (Tableau-like)
category: Data Display
source: raiz-platform
complexity: Muito Alta
tags: [bi, charts, drag-drop, exploration, graphic-walker]
---

# BI Data Explorer

## What it solves
Interactive drag-and-drop chart builder where users create any visualization, not just view pre-built dashboards.

## Best implementations
- `~/Claude/GitHub/raiz-platform/src/components/bi/GraphicWalkerExplorer.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/bi/GraphicWalkerWrapper.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/bi/BiChatPanel.tsx`

## Key features
- **Graphic Walker**: open-source Tableau alternative, drag fields to build charts
- **Data sources**: API, Supabase, or static data
- **Auto field inference**: nominal/ordinal/quantitative/temporal semantic types
- **SSR-safe**: dynamic import with loading fallback
- **AI chat panel**: ask questions about data alongside the explorer
- **PowerBI fallback**: embed wrapper for existing PowerBI dashboards

## Types
```ts
interface DataSourceConfig {
  type: 'api' | 'supabase' | 'static';
  endpoint?: string;
  table?: string;
  query?: Record<string, unknown>;
}

interface FieldSpec {
  fid: string;
  name: string;
  semanticType: 'nominal' | 'ordinal' | 'quantitative' | 'temporal';
  analyticType: 'dimension' | 'measure';
}
```

## Dependencies
- @kanaries/graphic-walker (dynamic import)
- PowerBI embed SDK (optional fallback)
