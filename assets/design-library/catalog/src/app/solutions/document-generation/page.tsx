"use client";

import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { FileText, FileSpreadsheet, FileDown, ArrowRight, Download, Layers } from "lucide-react";

const FORMATS = [
  { id: "pdf", label: "PDF", icon: FileDown, color: "text-red-400", bg: "bg-red-500/10", lib: "jsPDF + jspdf-autotable", features: ["Header branded", "Metadata grid", "Striped data table", "Receipt links", "Paginated footer"] },
  { id: "docx", label: "Word", icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10", lib: "docx (programmatic API)", features: ["Teal header cells", "Shaded alternate rows", "Structured sections", "Custom styles"] },
  { id: "xlsx", label: "Excel", icon: FileSpreadsheet, color: "text-green-400", bg: "bg-green-500/10", lib: "SheetJS (xlsx)", features: ["Sheet formatada (Consulta)", "Sheet raw JSON", "aoa_to_sheet", "Auto column width"] },
];

const PIPELINE_STEPS = [
  { label: "ConsultaResult", desc: "Dados brutos da consulta" },
  { label: "flattenData()", desc: "Normaliza objetos aninhados" },
  { label: "formatKey()", desc: "snake_case → Título Legível" },
  { label: "getMetadata()", desc: "Extrai tipo, data, CNPJ" },
  { label: "buildFilename()", desc: "consulta_12345_2026-03-27" },
];

export default function DocumentGenerationPage() {
  return (
    <SolutionLayout id="document-generation" title="Multi-Format Export Engine" source="raiz-docs" category="Export">
      <p className="mb-6 text-sm text-muted-foreground">
        Pipeline compartilhado (common.ts) → 3 exporters com branding. Lazy-loaded via dynamic import.
      </p>

      {/* Shared pipeline */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Layers className="h-4 w-4 text-orange-400" />
          Pipeline compartilhado (common.ts)
        </div>
        <div className="mt-4 flex items-center gap-1 overflow-x-auto">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-1">
              <div className="shrink-0 rounded-lg border border-border bg-background px-3 py-2 text-center">
                <p className="font-mono text-xs font-medium text-orange-400">{step.label}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{step.desc}</p>
              </div>
              {i < PIPELINE_STEPS.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />}
            </div>
          ))}
        </div>
      </div>

      {/* Format cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {FORMATS.map((fmt) => {
          const Icon = fmt.icon;
          return (
            <div key={fmt.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className={cn("flex items-center gap-3 border-b border-border p-4", fmt.bg)}>
                <Icon className={cn("h-8 w-8", fmt.color)} />
                <div>
                  <p className="font-semibold">{fmt.label}</p>
                  <p className="text-xs text-muted-foreground">{fmt.lib}</p>
                </div>
              </div>

              {/* Mock document preview */}
              <div className="p-4">
                {fmt.id === "pdf" && (
                  <div className="rounded border border-border bg-white p-3 text-zinc-800">
                    <div className="h-2 w-full rounded bg-orange-500" />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[8px] font-bold text-orange-600">rAIz Educação</span>
                      <span className="text-[7px] text-zinc-400">27/03/2026</span>
                    </div>
                    <div className="mt-2 space-y-0.5">
                      {[1, 2, 3].map((r) => (
                        <div key={r} className={cn("flex gap-1 px-1 py-0.5 text-[6px]", r % 2 === 0 ? "bg-zinc-50" : "")}>
                          <span className="w-16 font-medium">Campo {r}</span>
                          <span className="text-zinc-500">Valor exemplo {r}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 border-t border-zinc-200 pt-1 text-center text-[6px] text-zinc-400">Página 1/1</div>
                  </div>
                )}
                {fmt.id === "docx" && (
                  <div className="rounded border border-border bg-white p-3 text-zinc-800">
                    <p className="text-[8px] font-bold">Relatório de Consulta</p>
                    <div className="mt-2">
                      <div className="flex text-[6px]">
                        <span className="w-20 bg-teal-600 px-1 py-0.5 font-bold text-white">Campo</span>
                        <span className="flex-1 bg-teal-600 px-1 py-0.5 font-bold text-white">Valor</span>
                      </div>
                      {[1, 2, 3].map((r) => (
                        <div key={r} className={cn("flex text-[6px]", r % 2 === 0 ? "bg-teal-50" : "")}>
                          <span className="w-20 px-1 py-0.5 font-medium">Campo {r}</span>
                          <span className="flex-1 px-1 py-0.5 text-zinc-600">Valor {r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {fmt.id === "xlsx" && (
                  <div className="rounded border border-border bg-white p-3">
                    <div className="flex gap-px text-[6px]">
                      <span className="rounded-t bg-green-600 px-2 py-0.5 text-white">Consulta</span>
                      <span className="rounded-t bg-zinc-200 px-2 py-0.5 text-zinc-500">Raw JSON</span>
                    </div>
                    <div className="border border-zinc-200">
                      <div className="grid grid-cols-3 bg-zinc-100 text-[6px] font-bold text-zinc-600">
                        <span className="border-r border-zinc-200 px-1 py-0.5">A</span>
                        <span className="border-r border-zinc-200 px-1 py-0.5">B</span>
                        <span className="px-1 py-0.5">C</span>
                      </div>
                      {[1, 2, 3].map((r) => (
                        <div key={r} className="grid grid-cols-3 text-[6px] text-zinc-600">
                          <span className="border-r border-t border-zinc-200 px-1 py-0.5">Campo {r}</span>
                          <span className="border-r border-t border-zinc-200 px-1 py-0.5">Valor</span>
                          <span className="border-t border-zinc-200 px-1 py-0.5">OK</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <ul className="mt-3 space-y-1">
                  {fmt.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={cn("h-1 w-1 rounded-full", fmt.color.replace("text-", "bg-"))} /> {f}
                    </li>
                  ))}
                </ul>

                <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-border py-2 text-xs font-medium hover:bg-muted">
                  <Download className="h-3.5 w-3.5" /> Baixar {fmt.label}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </SolutionLayout>
  );
}
