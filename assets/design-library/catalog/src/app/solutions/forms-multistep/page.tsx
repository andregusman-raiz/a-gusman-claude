"use client";

import { useState } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, AlertCircle, Eye, EyeOff, Calculator } from "lucide-react";

const FIELD_TYPES = [
  "text", "select", "radio", "checkbox", "currency", "rating",
  "table", "user-picker", "cep", "cpf", "cnpj", "file", "date", "formula",
];

interface Field {
  name: string;
  type: string;
  label: string;
  value: string | number | boolean;
  required?: boolean;
  options?: string[];
  mask?: boolean;
  formula?: string;
}

const STEPS: Array<{ id: string; label: string; fields: Field[] }> = [
  { id: "dados", label: "Dados Básicos", fields: [
    { name: "titulo", type: "text", label: "Título da Solicitação", required: true, value: "Compra de Material Didático" },
    { name: "categoria", type: "select", label: "Categoria", required: true, options: ["Material", "Serviço", "Equipamento"], value: "Material" },
    { name: "prioridade", type: "radio", label: "Prioridade", options: ["Baixa", "Média", "Alta", "Urgente"], value: "Média" },
    { name: "valor", type: "currency", label: "Valor Estimado", value: "R$ 4.500,00" },
  ]},
  { id: "detalhes", label: "Detalhes", fields: [
    { name: "fornecedor", type: "text", label: "Fornecedor", value: "Editora Moderna" },
    { name: "cnpj", type: "cnpj", label: "CNPJ", value: "60.765.976/0001-07", mask: true },
    { name: "cep", type: "cep", label: "CEP de Entrega", value: "90010-000", mask: true },
    { name: "data_entrega", type: "date", label: "Data Prevista", value: "2026-04-15" },
    { name: "urgente", type: "checkbox", label: "Entrega urgente (+15%)", value: false },
  ]},
  { id: "aprovacao", label: "Aprovação", fields: [
    { name: "aprovador", type: "user-picker", label: "Aprovador", value: "Maria Santos" },
    { name: "orcamento", type: "file", label: "Orçamento (PDF)", value: "orcamento_moderna.pdf" },
    { name: "total_imposto", type: "formula", label: "Total c/ Imposto (13%)", formula: "valor * 1.13", value: "R$ 5.085,00" },
    { name: "avaliacao", type: "rating", label: "Prioridade (1-5)", value: 3 },
  ]},
];

export default function FormsMultistepPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const step = STEPS[currentStep];

  return (
    <SolutionLayout id="forms-multistep" title="Dynamic Form Engine" source="ticket-raiz" category="Forms">
      <p className="mb-6 text-sm text-muted-foreground">
        Schema carregado do DB por step. Zod construído em runtime. 14+ tipos de campo. Visibility rules per-field.
      </p>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Step indicator */}
        <div className="space-y-1">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                i === currentStep ? "bg-orange-500/10 text-orange-400" : i < currentStep ? "text-green-400" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                i === currentStep ? "bg-orange-500 text-white" : i < currentStep ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground",
              )}>
                {i < currentStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              {s.label}
            </button>
          ))}

          <div className="mt-4 rounded-lg border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">14 tipos suportados:</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {FIELD_TYPES.map((t) => (
                <span key={t} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{step.label}</h3>
            <span className="text-xs text-muted-foreground">Step {currentStep + 1}/{STEPS.length}</span>
          </div>

          <div className="mt-4 space-y-4">
            {step.fields.map((field) => (
              <div key={field.name}>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                  {field.label}
                  {"required" in field && field.required && <span className="text-red-400">*</span>}
                  {field.type === "formula" && <Calculator className="h-3.5 w-3.5 text-orange-400" />}
                  {"mask" in field && field.mask && <span className="rounded bg-blue-500/10 px-1 text-[10px] text-blue-400">mask</span>}
                </label>

                {field.type === "text" || field.type === "currency" || field.type === "cep" || field.type === "cpf" || field.type === "cnpj" || field.type === "date" ? (
                  <input
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={String(field.value)}
                    readOnly
                  />
                ) : field.type === "select" ? (
                  <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                    {field.options?.map((o) => <option key={String(o)}>{String(o)}</option>)}
                  </select>
                ) : field.type === "radio" ? (
                  <div className="flex gap-3">
                    {field.options?.map((o) => (
                      <label key={String(o)} className={cn(
                        "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm cursor-pointer",
                        o === field.value ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-border",
                      )}>
                        <div className={cn("h-3 w-3 rounded-full border-2", o === field.value ? "border-orange-500 bg-orange-500" : "border-muted-foreground")} />
                        {String(o)}
                      </label>
                    ))}
                  </div>
                ) : field.type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <div className={cn("h-4 w-4 rounded border", field.value ? "border-orange-500 bg-orange-500" : "border-border")}>
                      {field.value && <Check className="h-3 w-3 text-white" />}
                    </div>
                    {field.label}
                  </label>
                ) : field.type === "rating" ? (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className={cn("h-8 w-8 rounded-md flex items-center justify-center text-sm font-bold cursor-pointer",
                        n <= Number(field.value) ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"
                      )}>{n}</div>
                    ))}
                  </div>
                ) : field.type === "user-picker" ? (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/20 text-[10px] font-bold text-orange-400">MS</div>
                    {String(field.value)}
                  </div>
                ) : field.type === "file" ? (
                  <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                    📎 {String(field.value)}
                  </div>
                ) : field.type === "formula" ? (
                  <div className="flex items-center gap-2 rounded-md border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-sm">
                    <Calculator className="h-4 w-4 text-orange-400" />
                    <span className="font-mono">{String(field.value)}</span>
                    <span className="text-xs text-muted-foreground">= {field.formula}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="rounded-md border border-border px-4 py-2 text-sm disabled:opacity-40"
            >
              Voltar
            </button>
            <button
              onClick={() => setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))}
              className="flex items-center gap-1.5 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              {currentStep === STEPS.length - 1 ? "Enviar" : "Próximo"} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </SolutionLayout>
  );
}
