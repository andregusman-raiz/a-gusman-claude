"use client";

import { useState } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { GripVertical, BarChart3, PieChart, TrendingUp, Table2, Columns3, Plus, Trash2, Settings2 } from "lucide-react";

const DIMENSIONS = [
  { name: "Região", type: "nominal" as const },
  { name: "Categoria", type: "nominal" as const },
  { name: "Período", type: "temporal" as const },
  { name: "Segmento", type: "nominal" as const },
  { name: "Status", type: "ordinal" as const },
];

const MEASURES = [
  { name: "Receita", type: "quantitative" as const },
  { name: "Quantidade", type: "quantitative" as const },
  { name: "Ticket Médio", type: "quantitative" as const },
  { name: "Taxa Conversão", type: "quantitative" as const },
  { name: "NPS", type: "quantitative" as const },
];

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  nominal: { label: "Abc", color: "text-blue-400 bg-blue-500/15" },
  ordinal: { label: "Ord", color: "text-purple-400 bg-purple-500/15" },
  quantitative: { label: "#", color: "text-green-400 bg-green-500/15" },
  temporal: { label: "T", color: "text-orange-400 bg-orange-500/15" },
};

const CHART_TYPES = [
  { id: "bar", icon: BarChart3, label: "Barras" },
  { id: "line", icon: TrendingUp, label: "Linha" },
  { id: "pie", icon: PieChart, label: "Pizza" },
  { id: "table", icon: Table2, label: "Tabela" },
];

const BAR_DATA = [
  { label: "Norte", value: 78 },
  { label: "Nordeste", value: 92 },
  { label: "Centro-Oeste", value: 45 },
  { label: "Sudeste", value: 100 },
  { label: "Sul", value: 68 },
];

export default function BiDataExplorerPage() {
  const [chartType, setChartType] = useState("bar");
  const [rowsEncoding, setRowsEncoding] = useState("Região");
  const [colsEncoding, setColsEncoding] = useState("Receita");
  const [colorEncoding, setColorEncoding] = useState("");

  return (
    <SolutionLayout id="bi-data-explorer" title="Interactive Chart Builder" source="raiz-platform" category="Data Display">
      <p className="mb-6 text-sm text-muted-foreground">
        Drag-and-drop fields para construir qualquer visualização. Auto-infer tipos (nominal/ordinal/quantitative/temporal). SSR-safe dynamic import.
      </p>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex" style={{ height: 520 }}>
          {/* Fields panel */}
          <div className="w-52 shrink-0 overflow-y-auto border-r border-border bg-muted/20 p-3">
            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Dimensões</p>
              <div className="mt-2 space-y-1">
                {DIMENSIONS.map((f) => {
                  const badge = TYPE_BADGE[f.type];
                  return (
                    <div key={f.name} className="group flex cursor-grab items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-xs transition-colors hover:border-blue-500/30 active:cursor-grabbing">
                      <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/20 group-hover:text-muted-foreground" />
                      <span className={cn("flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold", badge.color)}>{badge.label}</span>
                      <span className="flex-1">{f.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Medidas</p>
              <div className="mt-2 space-y-1">
                {MEASURES.map((f) => {
                  const badge = TYPE_BADGE[f.type];
                  return (
                    <div key={f.name} className="group flex cursor-grab items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-xs transition-colors hover:border-green-500/30 active:cursor-grabbing">
                      <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/20 group-hover:text-muted-foreground" />
                      <span className={cn("flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold", badge.color)}>{badge.label}</span>
                      <span className="flex-1">{f.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-dashed border-border p-2 text-center">
              <Plus className="mx-auto h-4 w-4 text-muted-foreground/30" />
              <p className="mt-1 text-[9px] text-muted-foreground">Drop field aqui para filtrar</p>
            </div>
          </div>

          {/* Main area */}
          <div className="flex flex-1 flex-col">
            {/* Encoding shelves */}
            <div className="space-y-0 border-b border-border">
              {/* Rows shelf */}
              <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2">
                <span className="w-14 text-[10px] font-medium text-muted-foreground">Rows</span>
                <div className="flex items-center gap-1.5 rounded-md border border-blue-500/20 bg-blue-500/5 px-2.5 py-1 text-xs">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-blue-500/15 text-[8px] font-bold text-blue-400">Abc</span>
                  <select className="border-0 bg-transparent text-xs text-blue-400 focus:outline-none" value={rowsEncoding} onChange={(e) => setRowsEncoding(e.target.value)}>
                    {DIMENSIONS.map((d) => <option key={d.name} className="text-foreground bg-background">{d.name}</option>)}
                  </select>
                  <Trash2 className="h-3 w-3 cursor-pointer text-muted-foreground/40 hover:text-red-400" />
                </div>
              </div>
              {/* Columns shelf */}
              <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2">
                <span className="w-14 text-[10px] font-medium text-muted-foreground">Columns</span>
                <div className="flex items-center gap-1.5 rounded-md border border-green-500/20 bg-green-500/5 px-2.5 py-1 text-xs">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-green-500/15 text-[8px] font-bold text-green-400">#</span>
                  <select className="border-0 bg-transparent text-xs text-green-400 focus:outline-none" value={colsEncoding} onChange={(e) => setColsEncoding(e.target.value)}>
                    {MEASURES.map((m) => <option key={m.name} className="text-foreground bg-background">{m.name}</option>)}
                  </select>
                  <Settings2 className="h-3 w-3 cursor-pointer text-muted-foreground/40 hover:text-foreground" />
                  <Trash2 className="h-3 w-3 cursor-pointer text-muted-foreground/40 hover:text-red-400" />
                </div>
              </div>
              {/* Color shelf */}
              <div className="flex items-center gap-2 px-4 py-2">
                <span className="w-14 text-[10px] font-medium text-muted-foreground">Color</span>
                {colorEncoding ? (
                  <div className="flex items-center gap-1.5 rounded-md border border-purple-500/20 bg-purple-500/5 px-2.5 py-1 text-xs">
                    <span className="text-purple-400">{colorEncoding}</span>
                    <Trash2 className="h-3 w-3 cursor-pointer text-muted-foreground/40 hover:text-red-400" onClick={() => setColorEncoding("")} />
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-border px-2.5 py-1 text-[10px] text-muted-foreground/40">
                    Drop dimensão aqui
                  </div>
                )}
                <div className="ml-auto flex items-center gap-1">
                  {CHART_TYPES.map((ct) => {
                    const Icon = ct.icon;
                    return (
                      <button key={ct.id} onClick={() => setChartType(ct.id)} title={ct.label} className={cn("rounded-md p-1.5 transition-colors", chartType === ct.id ? "bg-[var(--raiz-orange)]/10 text-[var(--raiz-orange)]" : "text-muted-foreground hover:bg-muted")}>
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Chart area */}
            <div className="flex-1 p-6">
              {chartType === "bar" && (
                <div className="flex h-full items-end gap-6 px-4 pb-8">
                  {BAR_DATA.map((bar) => (
                    <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{bar.value}%</span>
                      <div className="relative w-full overflow-hidden rounded-t-lg transition-all duration-700" style={{ height: `${bar.value * 2.8}px` }}>
                        <div className="absolute inset-0" style={{ backgroundColor: "var(--raiz-orange)", opacity: 0.6 }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground">{bar.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {chartType === "line" && (
                <svg className="h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
                  {/* Grid */}
                  {[40, 80, 120, 160].map((y) => <line key={y} x1="40" y1={y} x2="380" y2={y} stroke="currentColor" strokeOpacity="0.05" />)}
                  {/* Line */}
                  <polyline points="60,80 140,40 220,110 300,60 380,90" fill="none" stroke="var(--raiz-orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Area under */}
                  <polygon points="60,80 140,40 220,110 300,60 380,90 380,180 60,180" fill="var(--raiz-orange)" fillOpacity="0.08" />
                  {/* Dots */}
                  {[[60,80],[140,40],[220,110],[300,60],[380,90]].map(([x,y], i) => (
                    <g key={i}>
                      <circle cx={x} cy={y} r="5" fill="var(--raiz-orange)" opacity="0.8" />
                      <circle cx={x} cy={y} r="2" fill="white" />
                    </g>
                  ))}
                  {/* Labels */}
                  {["Norte","Nordeste","C-Oeste","Sudeste","Sul"].map((l, i) => (
                    <text key={l} x={60 + i * 80} y="196" textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity="0.4">{l}</text>
                  ))}
                </svg>
              )}
              {chartType === "pie" && (
                <div className="flex h-full items-center justify-center gap-8">
                  <svg className="h-52 w-52" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="var(--raiz-orange)" strokeWidth="18" strokeDasharray="78 161" strokeDashoffset="0" opacity="0.8" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="var(--raiz-teal)" strokeWidth="18" strokeDasharray="55 184" strokeDashoffset="-78" opacity="0.7" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#3B82F6" strokeWidth="18" strokeDasharray="35 204" strokeDashoffset="-133" opacity="0.6" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#A855F7" strokeWidth="18" strokeDasharray="30 209" strokeDashoffset="-168" opacity="0.5" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="18" strokeDasharray="41 198" strokeDashoffset="-198" opacity="0.15" />
                  </svg>
                  <div className="space-y-2 text-xs">
                    {[{l:"Sudeste",c:"var(--raiz-orange)",v:"33%"},{l:"Nordeste",c:"var(--raiz-teal)",v:"23%"},{l:"Sul",c:"#3B82F6",v:"15%"},{l:"Norte",c:"#A855F7",v:"12%"},{l:"Centro-Oeste",c:"currentColor",v:"17%"}].map((item) => (
                      <div key={item.l} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded" style={{ backgroundColor: item.c, opacity: 0.7 }} />
                        <span className="w-20">{item.l}</span>
                        <span className="font-mono text-muted-foreground">{item.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {chartType === "table" && (
                <div className="overflow-hidden rounded-lg border border-border">
                  <div className="grid grid-cols-4 bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
                    <span>{rowsEncoding}</span><span>{colsEncoding}</span><span>Quantidade</span><span>% Total</span>
                  </div>
                  {BAR_DATA.map((b) => (
                    <div key={b.label} className="grid grid-cols-4 border-t border-border px-4 py-2.5 text-sm hover:bg-muted/20">
                      <span className="font-medium">{b.label}</span>
                      <span className="font-mono text-muted-foreground">R$ {(b.value * 12500).toLocaleString()}</span>
                      <span className="font-mono text-muted-foreground">{(b.value * 34).toLocaleString()}</span>
                      <span className="font-mono text-muted-foreground">{b.value}%</span>
                    </div>
                  ))}
                  <div className="grid grid-cols-4 border-t border-border bg-muted/20 px-4 py-2 text-xs font-semibold">
                    <span>Total</span>
                    <span className="font-mono">R$ {BAR_DATA.reduce((s, b) => s + b.value * 12500, 0).toLocaleString()}</span>
                    <span className="font-mono">{BAR_DATA.reduce((s, b) => s + b.value * 34, 0).toLocaleString()}</span>
                    <span className="font-mono">100%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SolutionLayout>
  );
}
