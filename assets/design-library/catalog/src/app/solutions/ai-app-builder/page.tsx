"use client";

import { useState } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { Rocket, CheckCircle, Loader2, Circle, AlertCircle, ExternalLink, Play } from "lucide-react";

const STEPS = [
  { id: 1, label: "Analisar Intent", status: "done", duration: "3s" },
  { id: 2, label: "Gerar SPEC", status: "done", duration: "8s" },
  { id: 3, label: "Planejar Arquitetura", status: "done", duration: "5s" },
  { id: 4, label: "Scaffold Projeto", status: "done", duration: "4s" },
  { id: 5, label: "Implementar Features", status: "running", duration: "45s..." },
  { id: 6, label: "Testes + Lint", status: "pending", duration: "" },
  { id: 7, label: "Build Produção", status: "pending", duration: "" },
  { id: 8, label: "Deploy", status: "pending", duration: "" },
];

const STATUS_ICONS: Record<string, { icon: typeof CheckCircle; color: string }> = {
  done: { icon: CheckCircle, color: "text-green-400" },
  running: { icon: Loader2, color: "text-blue-400" },
  pending: { icon: Circle, color: "text-muted-foreground/30" },
  error: { icon: AlertCircle, color: "text-red-400" },
};

export default function AiAppBuilderPage() {
  const [showDecision, setShowDecision] = useState(true);

  return (
    <SolutionLayout id="ai-app-builder" title="AI Build Pipeline + Preview" source="raiz-platform" category="AI">
      <p className="mb-6 text-sm text-muted-foreground">
        Wizard → spec AI → multi-step build pipeline → decision checkpoints → embedded preview → deploy.
      </p>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Pipeline progress */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium"><Rocket className="h-4 w-4 text-[var(--raiz-orange)]" /> Build Pipeline</div>
          <p className="mt-1 text-xs text-muted-foreground">Dashboard Matrículas — Step 5/8</p>

          <div className="mt-4 space-y-1">
            {STEPS.map((step) => {
              const st = STATUS_ICONS[step.status];
              const Icon = st.icon;
              return (
                <div key={step.id} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 transition-colors", step.status === "running" && "bg-blue-500/5")}>
                  <Icon className={cn("h-4 w-4 shrink-0", st.color, step.status === "running" && "animate-spin")} />
                  <span className={cn("flex-1 text-sm", step.status === "pending" ? "text-muted-foreground/50" : "")}>{step.label}</span>
                  {step.duration && <span className="font-mono text-[10px] text-muted-foreground">{step.duration}</span>}
                </div>
              );
            })}
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full transition-all" style={{ width: "56%", backgroundColor: "var(--raiz-orange)" }} />
          </div>
          <p className="mt-1 text-center text-[10px] text-muted-foreground">56% completo · ~30s restantes</p>

          {/* Decision checkpoint */}
          {showDecision && (
            <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
              <p className="text-xs font-medium text-yellow-400">Decisão necessária</p>
              <p className="mt-1 text-xs text-muted-foreground">Usar Recharts ou Chart.js para os gráficos?</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => setShowDecision(false)} className="flex-1 rounded-md bg-[var(--raiz-orange)] py-1.5 text-xs font-medium text-white">Recharts</button>
                <button onClick={() => setShowDecision(false)} className="flex-1 rounded-md border border-border py-1.5 text-xs">Chart.js</button>
              </div>
            </div>
          )}
        </div>

        {/* Embedded preview */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-sm font-medium">Preview — Dashboard Matrículas</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-green-400"><span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> Live</span>
              <button className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"><ExternalLink className="mr-1 inline h-3 w-3" />Abrir</button>
              <button className="rounded-md px-2 py-1 text-xs font-medium text-white" style={{ backgroundColor: "var(--raiz-orange)" }}><Play className="mr-1 inline h-3 w-3" />Deploy</button>
            </div>
          </div>

          {/* Mock embedded app */}
          <div className="bg-zinc-950 p-6">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              {/* Mock topbar */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-sm font-bold text-[var(--raiz-orange)]">Dashboard Matrículas</span>
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded bg-zinc-800" />
                  <div className="h-6 w-6 rounded-full bg-zinc-800" />
                </div>
              </div>
              {/* Mock KPIs */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[{ label: "Total", value: "2.847" }, { label: "Meta", value: "2.800" }, { label: "Δ", value: "+3.2%" }].map((kpi) => (
                  <div key={kpi.label} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                    <p className="text-[10px] text-zinc-500">{kpi.label}</p>
                    <p className="text-lg font-bold text-zinc-300">{kpi.value}</p>
                  </div>
                ))}
              </div>
              {/* Mock chart */}
              <div className="mt-4 flex items-end gap-2 h-24">
                {[65, 72, 58, 80, 75, 85, 90, 82].map((v, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{ height: `${v}%`, backgroundColor: "var(--raiz-orange)", opacity: 0.5 + i * 0.05 }} />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[8px] text-zinc-600">
                {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago"].map((m) => <span key={m}>{m}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SolutionLayout>
  );
}
