"use client";

import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { Scale, FileText, DollarSign, BookOpen, Bot, AlertTriangle, Clock, CheckCircle } from "lucide-react";

const CASES = [
  { id: "C-2026-012", title: "Rescisão Indireta — Ex-funcionário", status: "active", risk: "high", exposure: "R$ 180.000", area: "Trabalhista", updated: "27/03" },
  { id: "C-2026-008", title: "Cobrança Inadimplência — Turma 2024", status: "active", risk: "medium", exposure: "R$ 45.000", area: "Cível", updated: "25/03" },
  { id: "C-2025-034", title: "PROCON — Publicidade Enganosa", status: "settled", risk: "low", exposure: "R$ 12.000", area: "Consumidor", updated: "20/03" },
  { id: "C-2026-015", title: "Acidente em Quadra — Responsabilidade", status: "active", risk: "high", exposure: "R$ 250.000", area: "Cível", updated: "26/03" },
];

const RISK_COLORS: Record<string, { text: string; bg: string }> = {
  high: { text: "text-red-400", bg: "bg-red-500/10" },
  medium: { text: "text-yellow-400", bg: "bg-yellow-500/10" },
  low: { text: "text-green-400", bg: "bg-green-500/10" },
};

export default function LitigationPage() {
  return (
    <SolutionLayout id="litigation-case-manager" title="Case Manager + AI Copilot" source="raiz-platform" category="Legal">
      <p className="mb-6 text-sm text-muted-foreground">
        Gestão de casos jurídicos: cases, estratégia, provisões financeiras, playbooks, AI copilot.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Casos Ativos", value: "3", icon: Scale, color: "var(--raiz-orange)" },
              { label: "Exposição Total", value: "R$ 475K", icon: DollarSign, color: "#DC3545" },
              { label: "Provisão", value: "R$ 280K", icon: AlertTriangle, color: "#E8A820" },
              { label: "Encerrados (YTD)", value: "7", icon: CheckCircle, color: "#2D9E6B" },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color: kpi.color }} />
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  </div>
                  <p className="mt-1 text-lg font-bold">{kpi.value}</p>
                </div>
              );
            })}
          </div>

          {/* Cases table */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-medium">Casos</h3>
            </div>
            <div className="divide-y divide-border">
              {CASES.map((c) => {
                const risk = RISK_COLORS[c.risk];
                return (
                  <div key={c.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-muted-foreground">{c.id}</code>
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", risk.bg, risk.text)}>{c.risk}</span>
                        {c.status === "settled" && <span className="rounded-full bg-green-500/10 px-1.5 py-0.5 text-[9px] font-medium text-green-400">encerrado</span>}
                      </div>
                      <p className="mt-0.5 text-sm font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.area} · Exposição: {c.exposure}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{c.updated}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strategy view mock */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium">Estratégia — C-2026-012</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground">Tese Principal</p>
                <p className="mt-1 text-sm">Inexistência de vínculo subordinado — prestação de serviços autônomos documentada</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground">Probabilidade Condenação</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[35%] rounded-full bg-yellow-400" />
                  </div>
                  <span className="text-sm font-bold text-yellow-400">35%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar — AI Copilot + Playbooks */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><Bot className="h-4 w-4 text-[var(--raiz-orange)]" /> AI Copilot</div>
            <div className="mt-3 space-y-2 text-xs">
              <div className="rounded-lg bg-muted/30 p-2 text-muted-foreground">Baseado nos precedentes do TST, a tese de vínculo subordinado tem 35% de chance de prosperar. Recomendo reforçar documentação de autonomia.</div>
              <div className="rounded-lg p-2 text-white/90" style={{ backgroundColor: "var(--raiz-orange)" }}>Quais são os precedentes mais recentes para este tipo de caso?</div>
            </div>
            <input className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs" placeholder="Pergunte ao copilot..." />
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><BookOpen className="h-4 w-4 text-[var(--raiz-teal)]" /> Playbooks</div>
            <div className="mt-3 space-y-2">
              {["Rescisão Indireta — Defesa", "Cobrança Educacional", "Acidente Escolar", "PROCON — Publicidade"].map((pb) => (
                <div key={pb} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted/20 cursor-pointer">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{pb}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SolutionLayout>
  );
}
