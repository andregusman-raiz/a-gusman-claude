---
id: document-generation
name: Multi-Format Document Export (PDF + Word + Excel)
category: export
source: raiz-docs
complexity: medium
---

# Document Generation

## What it solves
Export structured data to PDF, Word, and Excel with consistent branding, shared data pipeline, and lazy-loaded libraries.

## Best implementation
- **PDF**: `~/Claude/projetos/raiz-docs/src/lib/export/export-pdf.ts`
- **Word**: `~/Claude/projetos/raiz-docs/src/lib/export/export-docx.ts`
- **Excel**: `~/Claude/projetos/raiz-docs/src/lib/export/export-xlsx.ts`
- **Common**: `~/Claude/projetos/raiz-docs/src/lib/export/common.ts`
- **UI**: `~/Claude/projetos/raiz-docs/src/components/consulta/export-buttons.tsx`

## Key features
- **Shared data pipeline**: `common.ts` provides `flattenData`, `formatKey`, `buildFilename`, `getMetadata` used by all three
- **PDF**: jsPDF + jspdf-autotable — branded header bar, metadata grid, striped data table, receipt links, paginated footer
- **Word**: `docx` library programmatic API — teal header cells, shaded alternating rows, structured sections
- **Excel**: SheetJS `aoa_to_sheet` — two sheets (formatted Consulta + raw JSON for power users)
- **Lazy loading**: all exporters loaded via dynamic `import()` from ExportButtons component
- **Identical output**: all three formats produce same structured data, just different rendering

## Interface
```ts
function exportPdf(result: ConsultaResult): void
function exportDocx(result: ConsultaResult): Promise<void>
function exportXlsx(result: ConsultaResult): void
```

## Dependencies
- jspdf + jspdf-autotable (PDF)
- docx + file-saver (Word)
- xlsx / SheetJS (Excel)
- All lazy-loaded via dynamic import()
