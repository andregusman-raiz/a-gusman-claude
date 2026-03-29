---
id: table-filters-export
name: Data Table with Filters and Export
category: data-display
source: salarios-platform + auditoria-raiz
complexity: high
---

# Data Table with Filters and Export

## What it solves
Display tabular data with sophisticated filtering (multi-select, search, URL-persisted state) and multi-format export (Excel with styled sheets).

## Best implementations
- **Table + Filters**: `~/Claude/GitHub/salarios-platform/src/components/funcionarios/funcionarios-table.tsx` (221 lines)
- **Global Filters**: `~/Claude/GitHub/salarios-platform/src/components/dashboard/global-filters.tsx` (220 lines)
- **Employee Filters**: `~/Claude/GitHub/salarios-platform/src/components/funcionarios/employee-filters.tsx` (152 lines)
- **Export Button**: `~/Claude/GitHub/salarios-platform/src/components/ui/export-button.tsx`
- **Multi-sheet Excel**: `~/Claude/GitHub/auditoria-raiz/src/app/api/export-excel/route.ts`
- **Multi-select dropdown**: `~/Claude/GitHub/fgts-platform/src/components/dashboard/multi-select.tsx` (140 lines)

## Key features
- **Dual-layer filtering**: tab-based quick filters + global multi-select bar
- **URL-persisted state**: filters stored in `useSearchParams` (shareable, back-button friendly)
- **Debounced server-side search** (300ms) for 10K+ records
- **Grid-based rendering** (CSS grid, not HTML table) for better performance
- **Adaptive columns**: auto-hide empty columns based on data
- **Multi-format export**: Excel (ExcelJS with styled headers, multiple sheets), PDF, CSV
- **Filter badge**: "X filtro(s) ativo(s)" indicator
- **Situacao styles**: CSS variable-driven status colors per row

## Layout structure
```
┌──────────────────────────────────────┐
│ [Coligada ▼] [Filial ▼] [Período ▼] │  ← Global filters
│ 3 filtros ativos                [X]  │
├──────────────────────────────────────┤
│ 🔍 Buscar...    [Todos|Admin|Prof]   │  ← Tab filters + search
│                          [Exportar]  │
├──────────────────────────────────────┤
│ Nome    │ Cargo  │ Seção │ Situação  │
│─────────┼────────┼───────┼──────────│
│ João S. │ Coord. │ Adm   │ ● Ativo  │
│ Maria L.│ Prof.  │ Ped   │ ● Férias │
├──────────────────────────────────────┤
│ ◀ Anterior    Página 1/5   Próximo ▶│
└──────────────────────────────────────┘
```

## Dependencies
- ExcelJS (multi-sheet styled export)
- useSearchParams, useRouter (Next.js)
- lucide-react, shadcn/ui (Select, Popover)
