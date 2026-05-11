"use client";

import { useState } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";
import { ChevronRight, ChevronDown, TrendingUp, TrendingDown, Download, FileSpreadsheet, FileText, Presentation, Sparkles, Eye, EyeOff, BarChart3 } from "lucide-react";

// ─── Reusable Financial Formatting Utils ─────────────────────────────────────
// These are directly extracted from dre-raiz and can be reused in any project.

const fmt = (v: number) => v === 0 ? "—" : Math.round(v).toLocaleString("pt-BR");
const fmtK = (v: number) => v === 0 ? "—" : Math.round(v / 1000).toLocaleString("pt-BR");
const fmtCard = (v: number): string => {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (a >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toFixed(0);
};
const fmtPct = (real: number, base: number): string => {
  if (base === 0) return "—";
  const pct = ((real - base) / Math.abs(base)) * 100;
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
};
const fmtMgPct = (value: number, receita: number): string => {
  if (receita === 0) return "—";
  return `${((value / Math.abs(receita)) * 100).toFixed(1)}%`;
};

// ─── Financial Color System ──────────────────────────────────────────────────
// invertDelta: for cost lines, spending LESS is favorable (green)

const COLORS = {
  receitas: "#1B75BB", custos: "#C0392B", sga: "#D4A044",
  consolidado: "#166534", orcado: "#B0B8C4",
  deltaPositivo: "#10B981", deltaNegativo: "#EF4444",
  accent: "#F44C00", teal: "#7AC5BF",
};

function deltaColor(v: number, invert: boolean): string {
  if (v === 0) return "text-muted-foreground";
  const favorable = invert ? v <= 0 : v >= 0;
  return favorable ? "text-emerald-600" : "text-rose-600";
}

function mgColorClass(value: number, receita: number, isCalc = false): string {
  if (isCalc) return "text-white font-black";
  if (receita === 0) return "text-muted-foreground";
  const pct = value / Math.abs(receita);
  if (pct > 0.05) return "text-emerald-700 font-semibold";
  if (pct > 0) return "text-emerald-600";
  if (pct > -0.50) return "text-rose-600";
  return "text-rose-800 font-semibold";
}

// ─── Data Types ──────────────────────────────────────────────────────────────

interface DreSection {
  id: string;
  label: string;
  tag0: string;
  invertDelta: boolean;
  sectionColor: string;
  rows: { tag01: string; label: string; real: number; orcado: number; a1: number }[];
}

interface CalcRow {
  label: string;
  real: number;
  orcado: number;
  a1: number;
  style: "margem" | "ebitdaSr" | "ebitdaTotal";
}

// ─── Column Visibility Config ────────────────────────────────────────────────

interface ColsVis {
  real: boolean;
  orcado: boolean;
  deltaAbsOrcado: boolean;
  deltaPercOrcado: boolean;
  a1: boolean;
  deltaAbsA1: boolean;
  deltaPercA1: boolean;
  mgReal: boolean;
}

const defaultCols: ColsVis = {
  real: true, orcado: true, deltaAbsOrcado: true, deltaPercOrcado: true,
  a1: true, deltaAbsA1: false, deltaPercA1: false, mgReal: true,
};

// ─── Sample Data ─────────────────────────────────────────────────────────────

const revenueTotal = 13200000;

const sections: DreSection[] = [
  {
    id: "s01", label: "01. RECEITA LÍQUIDA", tag0: "01.", invertDelta: false, sectionColor: COLORS.receitas,
    rows: [
      { tag01: "Mensalidades", label: "Mensalidades", real: 10800000, orcado: 10000000, a1: 9500000 },
      { tag01: "Matrículas", label: "Matrículas", real: 1400000, orcado: 1500000, a1: 1200000 },
      { tag01: "Serviços", label: "Serviços Adicionais", real: 1000000, orcado: 1000000, a1: 800000 },
    ],
  },
  {
    id: "s02", label: "02. CUSTOS VARIÁVEIS", tag0: "02.", invertDelta: true, sectionColor: COLORS.custos,
    rows: [
      { tag01: "Bolsas", label: "Bolsas e Descontos", real: -920000, orcado: -800000, a1: -750000 },
      { tag01: "Impostos", label: "Impostos s/ Receita", real: -400000, orcado: -450000, a1: -380000 },
    ],
  },
  {
    id: "s03", label: "03. CUSTOS FIXOS", tag0: "03.", invertDelta: true, sectionColor: COLORS.custos,
    rows: [
      { tag01: "Folha", label: "Folha de Pagamento", real: -5100000, orcado: -5000000, a1: -4800000 },
      { tag01: "Infra", label: "Infraestrutura", real: -1300000, orcado: -1200000, a1: -1100000 },
      { tag01: "Material", label: "Material Didático", real: -800000, orcado: -800000, a1: -700000 },
    ],
  },
  {
    id: "s04", label: "04. DESPESAS SG&A", tag0: "04.", invertDelta: true, sectionColor: COLORS.sga,
    rows: [
      { tag01: "Admin", label: "Administrativas", real: -850000, orcado: -900000, a1: -800000 },
      { tag01: "Financeiro", label: "Financeiras", real: -550000, orcado: -600000, a1: -500000 },
    ],
  },
];

function computeCalcRows(): CalcRow[] {
  const sum = (idx: number, field: "real" | "orcado" | "a1") => sections[idx].rows.reduce((s, r) => s + r[field], 0);
  const margem = { real: sum(0,"real")+sum(1,"real")+sum(2,"real"), orcado: sum(0,"orcado")+sum(1,"orcado")+sum(2,"orcado"), a1: sum(0,"a1")+sum(1,"a1")+sum(2,"a1") };
  const ebitda = { real: margem.real+sum(3,"real"), orcado: margem.orcado+sum(3,"orcado"), a1: margem.a1+sum(3,"a1") };
  return [
    { label: "MARGEM DE CONTRIBUIÇÃO", ...margem, style: "margem" as const },
    { label: "EBITDA", ...ebitda, style: "ebitdaTotal" as const },
  ];
}
const calcRows = computeCalcRows();

// ─── Waterfall Data Builder ──────────────────────────────────────────────────

function buildWaterfallSteps() {
  const sectionTotals = sections.map((s) => ({
    label: s.label.split(". ")[1],
    real: s.rows.reduce((sum, r) => sum + r.real, 0),
    orcado: s.rows.reduce((sum, r) => sum + r.orcado, 0),
  }));
  return sectionTotals.map((s) => ({
    label: s.label,
    delta: s.real - s.orcado,
    favorable: s.label.startsWith("RECEITA") ? s.real > s.orcado : Math.abs(s.real) < Math.abs(s.orcado),
  }));
}

// ─── CALC ROW STYLES ─────────────────────────────────────────────────────────

const CALC_STYLES = {
  margem: "bg-amber-100 dark:bg-amber-900/30 font-bold",
  ebitdaSr: "bg-muted font-bold",
  ebitdaTotal: "bg-[#F44C00] text-white font-black",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function DreFinancialDashboardPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["s01"]));
  const [cols, setCols] = useState<ColsVis>(defaultCols);
  const [exporting, setExporting] = useState<string | null>(null);
  const [showAiInsight, setShowAiInsight] = useState(true);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleCol = (key: keyof ColsVis) => setCols((p) => ({ ...p, [key]: !p[key] }));

  const fakeExport = (format: string) => {
    setExporting(format);
    setTimeout(() => setExporting(null), 1500);
  };

  const waterfall = buildWaterfallSteps();
  const maxDelta = Math.max(...waterfall.map((w) => Math.abs(w.delta)));

  return (
    <SolutionLayout id="dre-financial-dashboard" title="Financial Drill-Down + Variance" source="dre-raiz" category="Finance">
      <p className="mb-4 text-sm text-muted-foreground">
        DRE/P&amp;L hierárquico com drill-down por seção, variância orçado×realizado com <code className="rounded bg-muted px-1 text-[11px]">invertDelta</code> para custos, export multi-formato, e AI insights.
      </p>

      {/* ── Export Bar ── */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
        <Download className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Exportar:</span>
        {[
          { id: "pptx", icon: Presentation, label: "PPTX", color: "#F44C00" },
          { id: "xlsx", icon: FileSpreadsheet, label: "XLSX", color: "#2D9E6B" },
          { id: "pdf", icon: FileText, label: "PDF", color: "#DC3545" },
          { id: "docx", icon: FileText, label: "DOCX", color: "#3B82F6" },
        ].map(({ id, icon: Icon, label, color }) => (
          <button key={id} onClick={() => fakeExport(id)} disabled={exporting === id}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
            style={{ color }}>
            <Icon className="h-3.5 w-3.5" />
            {exporting === id ? "Exportando..." : label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setShowAiInsight(!showAiInsight)} className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted">
            <Sparkles className="h-3 w-3 text-purple-400" /> AI Insights
            {showAiInsight ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* ── Column Toggles ── */}
      <div className="mb-3 flex flex-wrap items-center gap-1 text-[10px]">
        <span className="text-muted-foreground">Colunas:</span>
        {([
          ["real", "Real"], ["orcado", "Orçado"], ["deltaAbsOrcado", "Δ Abs"], ["deltaPercOrcado", "Δ %"],
          ["a1", "A-1"], ["deltaAbsA1", "Δ A-1 Abs"], ["deltaPercA1", "Δ A-1 %"], ["mgReal", "Mg%"],
        ] as [keyof ColsVis, string][]).map(([key, label]) => (
          <button key={key} onClick={() => toggleCol(key)}
            className={`rounded-full px-2 py-0.5 transition-colors ${cols[key] ? "bg-[var(--raiz-orange)]/15 text-[var(--raiz-orange)]" : "bg-muted text-muted-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── DRE Table (2/3 width) ── */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-[10px] font-semibold text-muted-foreground">
                  <th className="px-3 py-2 text-left">Conta</th>
                  {cols.real && <th className="px-2 py-2 text-right">Real</th>}
                  {cols.orcado && <th className="px-2 py-2 text-right">Orçado</th>}
                  {cols.deltaAbsOrcado && <th className="px-2 py-2 text-right">Δ Abs</th>}
                  {cols.deltaPercOrcado && <th className="px-2 py-2 text-right">Δ %</th>}
                  {cols.a1 && <th className="px-2 py-2 text-right">A-1</th>}
                  {cols.mgReal && <th className="px-2 py-2 text-right">Mg%</th>}
                </tr>
              </thead>
              <tbody>
                {sections.map((section, si) => {
                  const isExpanded = expandedSections.has(section.id);
                  const sectionTotal = { real: section.rows.reduce((s, r) => s + r.real, 0), orcado: section.rows.reduce((s, r) => s + r.orcado, 0), a1: section.rows.reduce((s, r) => s + r.a1, 0) };
                  const dAbs = sectionTotal.real - sectionTotal.orcado;
                  return (
                    <React.Fragment key={section.id}>
                      {/* Section header */}
                      <tr className="border-b border-border bg-muted/30 font-bold hover:bg-muted/50 cursor-pointer" onClick={() => toggleSection(section.id)}>
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-1.5">
                            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: section.sectionColor }} />
                            {section.label}
                          </span>
                        </td>
                        {cols.real && <td className="px-2 py-2 text-right font-mono">{fmtK(sectionTotal.real)}</td>}
                        {cols.orcado && <td className="px-2 py-2 text-right font-mono text-muted-foreground">{fmtK(sectionTotal.orcado)}</td>}
                        {cols.deltaAbsOrcado && <td className={`px-2 py-2 text-right font-mono ${deltaColor(dAbs, section.invertDelta)}`}>{fmtK(dAbs)}</td>}
                        {cols.deltaPercOrcado && <td className={`px-2 py-2 text-right font-mono ${deltaColor(dAbs, section.invertDelta)}`}>{fmtPct(sectionTotal.real, sectionTotal.orcado)}</td>}
                        {cols.a1 && <td className="px-2 py-2 text-right font-mono text-muted-foreground">{fmtK(sectionTotal.a1)}</td>}
                        {cols.mgReal && <td className={`px-2 py-2 text-right font-mono ${mgColorClass(sectionTotal.real, revenueTotal)}`}>{fmtMgPct(sectionTotal.real, revenueTotal)}</td>}
                      </tr>
                      {/* Row detail */}
                      {isExpanded && section.rows.map((row) => {
                        const rd = row.real - row.orcado;
                        return (
                          <tr key={row.tag01} className="border-b border-border/30 hover:bg-muted/10">
                            <td className="py-1.5 pl-10 pr-3 text-muted-foreground">{row.label}</td>
                            {cols.real && <td className="px-2 py-1.5 text-right font-mono">{fmtK(row.real)}</td>}
                            {cols.orcado && <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">{fmtK(row.orcado)}</td>}
                            {cols.deltaAbsOrcado && <td className={`px-2 py-1.5 text-right font-mono ${deltaColor(rd, section.invertDelta)}`}>{fmtK(rd)}</td>}
                            {cols.deltaPercOrcado && <td className={`px-2 py-1.5 text-right font-mono ${deltaColor(rd, section.invertDelta)}`}>{fmtPct(row.real, row.orcado)}</td>}
                            {cols.a1 && <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">{fmtK(row.a1)}</td>}
                            {cols.mgReal && <td className={`px-2 py-1.5 text-right font-mono ${mgColorClass(row.real, revenueTotal)}`}>{fmtMgPct(row.real, revenueTotal)}</td>}
                          </tr>
                        );
                      })}
                      {/* Calc rows after appropriate sections */}
                      {si === 2 && (
                        <tr className={CALC_STYLES.margem}>
                          <td className="px-3 py-2 font-bold">{calcRows[0].label}</td>
                          {cols.real && <td className="px-2 py-2 text-right font-mono">{fmtK(calcRows[0].real)}</td>}
                          {cols.orcado && <td className="px-2 py-2 text-right font-mono">{fmtK(calcRows[0].orcado)}</td>}
                          {cols.deltaAbsOrcado && <td className="px-2 py-2 text-right font-mono">{fmtK(calcRows[0].real - calcRows[0].orcado)}</td>}
                          {cols.deltaPercOrcado && <td className="px-2 py-2 text-right font-mono">{fmtPct(calcRows[0].real, calcRows[0].orcado)}</td>}
                          {cols.a1 && <td className="px-2 py-2 text-right font-mono">{fmtK(calcRows[0].a1)}</td>}
                          {cols.mgReal && <td className="px-2 py-2 text-right font-mono">{fmtMgPct(calcRows[0].real, revenueTotal)}</td>}
                        </tr>
                      )}
                      {si === 3 && (
                        <tr className={CALC_STYLES.ebitdaTotal}>
                          <td className="px-3 py-2">{calcRows[1].label}</td>
                          {cols.real && <td className="px-2 py-2 text-right font-mono">{fmtK(calcRows[1].real)}</td>}
                          {cols.orcado && <td className="px-2 py-2 text-right font-mono">{fmtK(calcRows[1].orcado)}</td>}
                          {cols.deltaAbsOrcado && <td className="px-2 py-2 text-right font-mono">{fmtK(calcRows[1].real - calcRows[1].orcado)}</td>}
                          {cols.deltaPercOrcado && <td className="px-2 py-2 text-right font-mono">{fmtPct(calcRows[1].real, calcRows[1].orcado)}</td>}
                          {cols.a1 && <td className="px-2 py-2 text-right font-mono">{fmtK(calcRows[1].a1)}</td>}
                          {cols.mgReal && <td className="px-2 py-2 text-right font-mono">{fmtMgPct(calcRows[1].real, revenueTotal)}</td>}
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">Valores em milhares R$ • Período: Jan-Mar 2026 • Consolidado</p>
        </div>

        {/* ── Right Panel ── */}
        <div className="space-y-4">
          {/* EBITDA Bridge Waterfall */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <BarChart3 className="h-4 w-4" style={{ color: COLORS.accent }} />
              EBITDA Bridge vs Orçado
            </div>
            <div className="mt-3 space-y-2">
              {waterfall.map((w) => (
                <div key={w.label} className="flex items-center gap-2">
                  <span className="w-24 truncate text-[10px] text-muted-foreground">{w.label}</span>
                  <div className="relative h-4 flex-1 overflow-hidden rounded-sm bg-muted/30">
                    <div className={`absolute left-0 top-0 h-full rounded-sm transition-all ${w.favorable ? "bg-emerald-500/40" : "bg-rose-500/40"}`}
                      style={{ width: `${(Math.abs(w.delta) / maxDelta) * 100}%` }} />
                  </div>
                  <span className={`w-14 text-right font-mono text-[10px] ${w.favorable ? "text-emerald-600" : "text-rose-600"}`}>
                    {w.delta > 0 ? "+" : ""}{fmtCard(w.delta)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights Box */}
          {showAiInsight && (
            <div className="rounded-xl border border-border bg-[#1A2332] p-4 text-white">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-[#F44C00] px-2 py-0.5 text-[9px] font-bold">SÍNTESE IA</span>
              </div>
              <p className="text-xs leading-relaxed text-gray-300">
                Receita líquida superou orçamento em +3.2%, impulsionada por mensalidades (+8.0%). Custos fixos pressionaram
                margem com folha +2.0% acima do plan. EBITDA de R$ 3.28M (+19.3% vs orçado) reflete boa gestão de despesas SG&amp;A
                (-8.3% economia). Risco: bolsas e descontos +15% acima do previsto — monitorar política de bolsas para Q2.
              </p>
              <div className="mt-3 flex gap-2">
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] text-emerald-400">Oportunidade: SG&amp;A</span>
                <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] text-rose-400">Risco: Bolsas</span>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "EBITDA", value: calcRows[1].real, color: COLORS.consolidado },
              { label: "Margem", value: calcRows[0].real, color: COLORS.receitas },
              { label: "Δ Orç", value: calcRows[1].real - calcRows[1].orcado, color: COLORS.deltaPositivo },
              { label: "Mg EBITDA", value: null, pct: fmtMgPct(calcRows[1].real, revenueTotal), color: COLORS.accent },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-border bg-card p-3">
                <div className="h-1 w-8 rounded-full" style={{ backgroundColor: kpi.color }} />
                <p className="mt-2 text-lg font-bold">{kpi.pct || `R$ ${fmtCard(kpi.value!)}`}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SolutionLayout>
  );
}

// React import needed for Fragment
import React from "react";
