"use client";

import { useState } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, MousePointer, Eye, Target, BarChart3 } from "lucide-react";

interface MetricBenchmark {
  label: string;
  value: number;
  format: string;
  benchmarkLow: number;
  benchmarkHigh: number;
  icon: typeof TrendingUp;
  trend: number;
}

interface Campaign {
  name: string;
  platform: "Meta" | "Google" | "TikTok";
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
  cpl: number;
}

const metrics: MetricBenchmark[] = [
  { label: "ROAS", value: 4.2, format: "x", benchmarkLow: 3.0, benchmarkHigh: 5.0, icon: DollarSign, trend: 12.5 },
  { label: "CPL", value: 28.50, format: "R$", benchmarkLow: 20, benchmarkHigh: 40, icon: Target, trend: -8.3 },
  { label: "CTR", value: 3.8, format: "%", benchmarkLow: 2.0, benchmarkHigh: 5.0, icon: MousePointer, trend: 5.1 },
  { label: "CPC", value: 1.45, format: "R$", benchmarkLow: 0.80, benchmarkHigh: 2.50, icon: Eye, trend: -3.2 },
];

const campaigns: Campaign[] = [
  { name: "Matrícula 2026 — Lookalike", platform: "Meta", spend: 12500, impressions: 450000, clicks: 17100, conversions: 438, roas: 5.2, cpl: 28.50 },
  { name: "Marca Institucional", platform: "Google", spend: 8200, impressions: 320000, clicks: 9600, conversions: 192, roas: 3.8, cpl: 42.70 },
  { name: "Pós-Graduação — Retargeting", platform: "Meta", spend: 4800, impressions: 120000, clicks: 5400, conversions: 162, roas: 6.1, cpl: 29.60 },
  { name: "Vestibular — Gen Z", platform: "TikTok", spend: 3200, impressions: 680000, clicks: 20400, conversions: 96, roas: 2.4, cpl: 33.30 },
  { name: "Open Campus — Busca", platform: "Google", spend: 5600, impressions: 180000, clicks: 7200, conversions: 216, roas: 4.5, cpl: 25.90 },
];

const platformColors: Record<string, string> = {
  Meta: "#1877F2",
  Google: "#34A853",
  TikTok: "#FE2C55",
};

function BenchmarkBar({ value, low, high }: { value: number; low: number; high: number }) {
  const range = high - low;
  const fullRange = range * 2;
  const offset = low - range * 0.5;
  const position = Math.min(100, Math.max(0, ((value - offset) / fullRange) * 100));
  const lowPos = ((low - offset) / fullRange) * 100;
  const highPos = ((high - offset) / fullRange) * 100;

  return (
    <div className="relative mt-2 h-2 w-full rounded-full bg-muted">
      <div className="absolute h-full rounded-full bg-green-500/20" style={{ left: `${lowPos}%`, width: `${highPos - lowPos}%` }} />
      <div className="absolute top-1/2 h-3.5 w-1 -translate-y-1/2 rounded-full bg-foreground" style={{ left: `${position}%` }} />
    </div>
  );
}

export default function AdPerformanceAnalyticsPage() {
  const [budgetAlert] = useState(true);
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const budgetLimit = 40000;

  return (
    <SolutionLayout id="ad-performance-analytics" title="Ad Campaign Analytics + Alerts" source="ad-insights-hub" category="Data Display">
      <p className="mb-6 text-sm text-muted-foreground">
        Dashboard multi-plataforma (Meta/Google/TikTok) com benchmark bands para ROAS/CPL/CTR, alertas de budget, e views por role.
      </p>

      {/* Budget alert */}
      {budgetAlert && totalSpend / budgetLimit > 0.8 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <span className="font-semibold text-amber-500">Alerta de Budget</span>
            <span className="text-muted-foreground"> — {((totalSpend / budgetLimit) * 100).toFixed(0)}% do orçamento mensal consumido (R$ {(totalSpend / 1000).toFixed(1)}K de R$ {(budgetLimit / 1000).toFixed(0)}K)</span>
          </div>
        </div>
      )}

      {/* Metric cards with benchmark */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          const inRange = m.value >= m.benchmarkLow && m.value <= m.benchmarkHigh;
          const above = m.value > m.benchmarkHigh;
          return (
            <div key={m.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
                <Icon className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold">
                  {m.format === "R$" && "R$ "}{m.value}{m.format === "%" && "%"}{m.format === "x" && "x"}
                </span>
                <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${m.trend > 0 ? "text-green-500" : "text-red-500"}`}>
                  {m.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {m.trend > 0 ? "+" : ""}{m.trend}%
                </span>
              </div>
              <BenchmarkBar value={m.value} low={m.benchmarkLow} high={m.benchmarkHigh} />
              <div className="mt-1 flex justify-between text-[9px] text-muted-foreground/50">
                <span>Abaixo</span>
                <span className={inRange ? "font-semibold text-green-500" : above ? "text-blue-400" : "text-amber-500"}>
                  {inRange ? "Dentro da meta" : above ? "Acima" : "Abaixo"}
                </span>
                <span>Acima</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Campaign table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold">Campanhas Ativas</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{campaigns.length}</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-[10px] font-medium text-muted-foreground">
              <th className="px-4 py-2 text-left">Campanha</th>
              <th className="px-3 py-2 text-left">Plataforma</th>
              <th className="px-3 py-2 text-right">Gasto</th>
              <th className="px-3 py-2 text-right">Conversões</th>
              <th className="px-3 py-2 text-right">ROAS</th>
              <th className="px-3 py-2 text-right">CPL</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => (
              <tr key={i} className="border-b border-border/50 text-xs hover:bg-muted/10">
                <td className="px-4 py-2.5 font-medium">{c.name}</td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: `${platformColors[c.platform]}15`, color: platformColors[c.platform] }}>
                    {c.platform}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">R$ {(c.spend / 1000).toFixed(1)}K</td>
                <td className="px-3 py-2.5 text-right font-mono">{c.conversions}</td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`font-mono font-semibold ${c.roas >= 4 ? "text-green-500" : c.roas >= 3 ? "text-amber-500" : "text-red-500"}`}>
                    {c.roas}x
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">R$ {c.cpl.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SolutionLayout>
  );
}
