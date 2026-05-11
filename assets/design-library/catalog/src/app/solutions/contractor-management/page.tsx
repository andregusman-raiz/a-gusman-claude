"use client";

import { useState } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { UserCheck, FileText, Upload, CheckCircle, AlertCircle, Search, Building2 } from "lucide-react";

const STEPS_FORM = [
  { id: 1, label: "CNPJ", done: true },
  { id: 2, label: "Dados Pessoais", done: true },
  { id: 3, label: "Bancários", done: false },
  { id: 4, label: "Benefícios", done: false },
  { id: 5, label: "Contrato", done: false },
];

const PJ_LIST = [
  { name: "Maria Consultoria Ltda", cnpj: "12.345.678/0001-90", status: "active", paymentPending: false, area: "Pedagógico" },
  { name: "Carlos TI Services", cnpj: "98.765.432/0001-10", status: "active", paymentPending: true, area: "Tecnologia" },
  { name: "Ana Coaching ME", cnpj: "55.444.333/0001-22", status: "onboarding", paymentPending: false, area: "RH" },
  { name: "Pedro Manutenção", cnpj: "11.222.333/0001-44", status: "inactive", paymentPending: false, area: "Infraestrutura" },
];

const CSV_PREVIEW = [
  { cnpj: "12.345.678/0001-90", nome: "Maria Consultoria", valor: "R$ 8.500", valid: true },
  { cnpj: "98.765.432/0001-10", nome: "Carlos TI", valor: "R$ 12.000", valid: true },
  { cnpj: "INVALIDO", nome: "Empresa X", valor: "R$ 5.000", valid: false },
  { cnpj: "55.444.333/0001-22", nome: "Ana Coaching", valor: "R$ 6.200", valid: true },
];

export default function ContractorManagementPage() {
  const [tab, setTab] = useState<"list" | "register" | "import">("list");

  return (
    <SolutionLayout id="contractor-management" title="Multi-Step Onboarding + Import" source="sistema-gestao-pj-raiz" category="Forms">
      <p className="mb-6 text-sm text-muted-foreground">
        Onboarding multi-section (CNPJ → dados → banco → benefícios → contrato) + pagamentos RPA/NF + bulk CSV import.
      </p>

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-1 rounded-lg border border-border bg-card p-1">
        {[
          { key: "list" as const, label: "Prestadores", icon: UserCheck },
          { key: "register" as const, label: "Cadastro", icon: FileText },
          { key: "import" as const, label: "Importar CSV", icon: Upload },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={cn("flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors", tab === t.key ? "bg-[var(--raiz-orange)]/10 text-[var(--raiz-orange)]" : "text-muted-foreground hover:text-foreground")}>
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      {tab === "list" && (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input className="h-8 rounded-md border border-border bg-background pl-8 pr-3 text-sm" placeholder="Buscar por nome ou CNPJ..." />
            </div>
          </div>
          <div className="divide-y divide-border">
            {PJ_LIST.map((pj) => (
              <div key={pj.cnpj} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"><Building2 className="h-4 w-4 text-muted-foreground" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{pj.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{pj.cnpj} · {pj.area}</p>
                </div>
                <div className="flex items-center gap-2">
                  {pj.paymentPending && <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[9px] font-medium text-yellow-400">Pgto pendente</span>}
                  <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium",
                    pj.status === "active" ? "bg-green-500/10 text-green-400" : pj.status === "onboarding" ? "bg-blue-500/10 text-blue-400" : "bg-zinc-500/10 text-zinc-400"
                  )}>{pj.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registration form */}
      {tab === "register" && (
        <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
          {/* Step indicator */}
          <div className="space-y-1">
            {STEPS_FORM.map((s) => (
              <div key={s.id} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm", s.id === 3 ? "bg-[var(--raiz-orange)]/10 text-[var(--raiz-orange)]" : s.done ? "text-green-400" : "text-muted-foreground/50")}>
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", s.id === 3 ? "bg-[var(--raiz-orange)] text-white" : s.done ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground")}>
                  {s.done ? <CheckCircle className="h-3.5 w-3.5" /> : s.id}
                </span>
                {s.label}
              </div>
            ))}
          </div>

          {/* Current step: Bancários */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold">Dados Bancários</h3>
            <p className="mt-1 text-xs text-muted-foreground">Conta para depósito dos pagamentos</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 text-sm font-medium">Banco</label>
                <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option>001 - Banco do Brasil</option><option>341 - Itaú</option><option>033 - Santander</option><option>104 - Caixa</option>
                </select>
              </div>
              <div>
                <label className="mb-1 text-sm font-medium">Tipo de Conta</label>
                <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option>Conta Corrente</option><option>Conta Poupança</option>
                </select>
              </div>
              <div>
                <label className="mb-1 text-sm font-medium">Agência</label>
                <input className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="0001" defaultValue="3456" />
              </div>
              <div>
                <label className="mb-1 text-sm font-medium">Conta</label>
                <input className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="12345-6" defaultValue="78901-2" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 text-sm font-medium">Chave PIX</label>
                <input className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="CNPJ, email ou telefone" defaultValue="12.345.678/0001-90" />
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button className="rounded-md border border-border px-4 py-2 text-sm">Voltar</button>
              <button className="rounded-md px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "var(--raiz-orange)" }}>Próximo: Benefícios</button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import */}
      {tab === "import" && (
        <div className="space-y-4">
          <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border py-12">
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm font-medium">Arraste o CSV ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground">Formato: CNPJ, Nome, Valor, Tipo (RPA/NF)</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-medium">Preview — pagamentos_marco.csv</span>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-400">3 válidos</span>
                <span className="text-red-400">1 erro</span>
              </div>
            </div>
            <div className="divide-y divide-border">
              {CSV_PREVIEW.map((row, i) => (
                <div key={i} className={cn("grid grid-cols-[1fr_1fr_100px_60px] items-center gap-4 px-4 py-2 text-sm", !row.valid && "bg-red-500/5")}>
                  <span className={cn("font-mono text-xs", !row.valid && "text-red-400")}>{row.cnpj}</span>
                  <span>{row.nome}</span>
                  <span className="font-mono text-xs">{row.valor}</span>
                  {row.valid ? <CheckCircle className="h-4 w-4 text-green-400" /> : <AlertCircle className="h-4 w-4 text-red-400" />}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-xs text-muted-foreground">4 linhas · 1 com erro (será ignorada)</span>
              <button className="rounded-md px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "var(--raiz-orange)" }}>Importar 3 válidos</button>
            </div>
          </div>
        </div>
      )}
    </SolutionLayout>
  );
}
