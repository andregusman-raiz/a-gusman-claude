"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, Search, Download, MoreHorizontal, Check, X, Clock, AlertCircle, Eye, ChevronLeft, ChevronRight, Copy, ChevronRight as ChevronR } from "lucide-react";

// ─── TanStack Table ─────────────────────────────────────────────────────────
export function TanStackTablePreview() {
  const [sortCol, setSortCol] = useState<string | null>("nome");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const data = [
    { nome: "João Silva", email: "joao@raiz.edu.br", cargo: "Coordenador", status: "ativo" },
    { nome: "Maria Santos", email: "maria@raiz.edu.br", cargo: "Professora", status: "ativo" },
    { nome: "Pedro Lima", email: "pedro@raiz.edu.br", cargo: "Auxiliar", status: "férias" },
    { nome: "Ana Costa", email: "ana@raiz.edu.br", cargo: "Diretora", status: "ativo" },
    { nome: "Carlos Rocha", email: "carlos@raiz.edu.br", cargo: "Professor", status: "afastado" },
    { nome: "Fernanda Souza", email: "fernanda@raiz.edu.br", cargo: "Estagiária", status: "ativo" },
  ];

  const filtered = data.filter(r => !search || r.nome.toLowerCase().includes(search.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => {
    if (!sortCol) return 0;
    const va = a[sortCol as keyof typeof a]; const vb = b[sortCol as keyof typeof b];
    return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
  });
  const paged = sorted.slice(page * 4, (page + 1) * 4);
  const SortIcon = ({ col }: { col: string }) => (
    <span className="ml-1 inline-flex flex-col text-[8px] leading-none">
      <ChevronUp className={cn("h-2.5 w-2.5", sortCol === col && sortDir === "asc" ? "text-[var(--raiz-orange)]" : "text-muted-foreground/30")} />
      <ChevronDown className={cn("h-2.5 w-2.5 -mt-0.5", sortCol === col && sortDir === "desc" ? "text-[var(--raiz-orange)]" : "text-muted-foreground/30")} />
    </span>
  );
  const toggleSort = (col: string) => { if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortCol(col); setSortDir("asc"); } };
  const stColors: Record<string, string> = { ativo: "bg-green-500/10 text-green-400", "férias": "bg-blue-500/10 text-blue-400", afastado: "bg-yellow-500/10 text-yellow-400" };

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/20 px-3 py-2">
        <div className="relative"><Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" /><input className="h-7 w-44 rounded border border-border bg-background pl-7 pr-2 text-xs" placeholder="Filtrar..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <button className="flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] hover:bg-muted"><Download className="h-3 w-3" /> Export</button>
      </div>
      <table className="w-full text-xs">
        <thead><tr className="border-b border-border bg-muted/10">
          {["nome", "email", "cargo", "status"].map(col => (
            <th key={col} className="cursor-pointer px-3 py-2 text-left font-medium text-muted-foreground hover:text-foreground" onClick={() => toggleSort(col)}>
              <span className="flex items-center">{col.charAt(0).toUpperCase() + col.slice(1)}<SortIcon col={col} /></span>
            </th>
          ))}
          <th className="w-8" />
        </tr></thead>
        <tbody>
          {paged.map((r, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
              <td className="px-3 py-2 font-medium">{r.nome}</td>
              <td className="px-3 py-2 text-muted-foreground">{r.email}</td>
              <td className="px-3 py-2 text-muted-foreground">{r.cargo}</td>
              <td className="px-3 py-2"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", stColors[r.status])}>{r.status}</span></td>
              <td className="px-3 py-2"><MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/40" /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-border bg-muted/10 px-3 py-1.5 text-[10px] text-muted-foreground">
        <span>{filtered.length} resultados</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="rounded px-1.5 py-0.5 hover:bg-muted disabled:opacity-30">Anterior</button>
          <span className="px-1">{page + 1}/{Math.ceil(filtered.length / 4)}</span>
          <button onClick={() => setPage(Math.min(Math.ceil(filtered.length / 4) - 1, page + 1))} disabled={page >= Math.ceil(filtered.length / 4) - 1} className="rounded px-1.5 py-0.5 hover:bg-muted disabled:opacity-30">Próximo</button>
        </div>
      </div>
    </div>
  );
}

// ─── AG Grid (Spreadsheet) ──────────────────────────────────────────────────
export function AgGridPreview() {
  const [editCell, setEditCell] = useState<string | null>(null);
  const cols = ["A", "B", "C", "D", "E"];
  const rows = [
    ["Produto", "Qtd", "Preço", "Total", "Status"],
    ["Notebook Dell", "15", "R$ 4.500", "R$ 67.500", "OK"],
    ["Monitor LG 27\"", "30", "R$ 1.200", "R$ 36.000", "OK"],
    ["Teclado Logitech", "50", "R$ 350", "R$ 17.500", "Pendente"],
    ["Mouse Razer", "50", "R$ 280", "R$ 14.000", ""],
    ["Webcam HD", "20", "R$ 450", "R$ 9.000", "OK"],
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="border-b border-border bg-muted/20 px-3 py-1.5 text-[10px] text-muted-foreground">Spreadsheet Grid — clique para editar</div>
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Header row */}
          <div className="grid grid-cols-[40px_repeat(5,1fr)] border-b border-border bg-muted/30">
            <div className="border-r border-border px-2 py-1.5 text-center text-[10px] text-muted-foreground" />
            {cols.map(c => <div key={c} className="border-r border-border px-2 py-1.5 text-center text-[10px] font-bold text-muted-foreground">{c}</div>)}
          </div>
          {rows.map((row, ri) => (
            <div key={ri} className={cn("grid grid-cols-[40px_repeat(5,1fr)]", ri === 0 ? "bg-muted/20 font-medium" : "hover:bg-muted/10")}>
              <div className="border-b border-r border-border px-2 py-1.5 text-center text-[10px] text-muted-foreground">{ri + 1}</div>
              {row.map((cell, ci) => {
                const cellId = `${ri}-${ci}`;
                const isEditing = editCell === cellId;
                return (
                  <div key={ci} className={cn("border-b border-r border-border px-2 py-1.5 text-xs", isEditing && "ring-2 ring-[var(--raiz-orange)] bg-background")} onClick={() => setEditCell(cellId)}>
                    {isEditing ? <input className="w-full bg-transparent text-xs outline-none" defaultValue={cell} autoFocus onBlur={() => setEditCell(null)} /> : cell}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Recharts ───────────────────────────────────────────────────────────────
export function RechartsPreview() {
  const [chartType, setChartType] = useState<"bar" | "line" | "area" | "pie">("bar");
  const data = [
    { name: "Jan", value: 4200 }, { name: "Fev", value: 3800 }, { name: "Mar", value: 5100 },
    { name: "Abr", value: 4600 }, { name: "Mai", value: 5400 }, { name: "Jun", value: 4900 },
  ];
  const max = Math.max(...data.map(d => d.value));

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">Receita Mensal</span>
        <div className="flex gap-1">
          {(["bar", "line", "area", "pie"] as const).map(t => (
            <button key={t} onClick={() => setChartType(t)} className={cn("rounded px-2 py-0.5 text-[10px] font-medium", chartType === t ? "bg-[var(--raiz-orange)]/10 text-[var(--raiz-orange)]" : "text-muted-foreground hover:bg-muted")}>{t}</button>
          ))}
        </div>
      </div>
      <div className="h-40">
        {chartType === "bar" && (
          <div className="flex h-full items-end gap-3">
            {data.map(d => (
              <div key={d.name} className="flex flex-1 flex-col items-center gap-1">
                <span className="font-mono text-[9px] text-muted-foreground">{(d.value / 1000).toFixed(1)}K</span>
                <div className="w-full rounded-t transition-all duration-500" style={{ height: `${(d.value / max) * 100}%`, backgroundColor: "var(--raiz-orange)", opacity: 0.6 }} />
                <span className="text-[10px] text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        )}
        {chartType === "line" && (
          <svg className="h-full w-full" viewBox="0 0 300 120" preserveAspectRatio="none">
            {[30, 60, 90].map(y => <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="currentColor" strokeOpacity="0.05" />)}
            <polyline points={data.map((d, i) => `${i * 56 + 20},${110 - (d.value / max) * 100}`).join(" ")} fill="none" stroke="var(--raiz-orange)" strokeWidth="2" strokeLinecap="round" />
            {data.map((d, i) => <circle key={i} cx={i * 56 + 20} cy={110 - (d.value / max) * 100} r="3" fill="var(--raiz-orange)" />)}
          </svg>
        )}
        {chartType === "area" && (
          <svg className="h-full w-full" viewBox="0 0 300 120" preserveAspectRatio="none">
            <polygon points={`${data.map((d, i) => `${i * 56 + 20},${110 - (d.value / max) * 100}`).join(" ")} 296,115 20,115`} fill="var(--raiz-orange)" fillOpacity="0.1" />
            <polyline points={data.map((d, i) => `${i * 56 + 20},${110 - (d.value / max) * 100}`).join(" ")} fill="none" stroke="var(--raiz-orange)" strokeWidth="2" />
          </svg>
        )}
        {chartType === "pie" && (
          <div className="flex h-full items-center justify-center gap-6">
            <svg className="h-32 w-32" viewBox="0 0 100 100">
              {data.map((d, i) => {
                const total = data.reduce((s, x) => s + x.value, 0);
                const offset = data.slice(0, i).reduce((s, x) => s + (x.value / total) * 251, 0);
                return <circle key={i} cx="50" cy="50" r="40" fill="none" stroke="var(--raiz-orange)" strokeWidth="16" strokeDasharray={`${(d.value / total) * 251} 251`} strokeDashoffset={-offset} opacity={0.3 + i * 0.12} transform="rotate(-90 50 50)" />;
              })}
            </svg>
            <div className="space-y-1">{data.map((d, i) => <div key={i} className="flex items-center gap-1.5 text-[10px]"><span className="h-2 w-2 rounded" style={{ backgroundColor: "var(--raiz-orange)", opacity: 0.3 + i * 0.12 }} />{d.name}</div>)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tremor KPI Cards ───────────────────────────────────────────────────────
export function TremorKpiPreview() {
  const kpis = [
    { title: "Receita", value: "R$ 245K", change: "+12.3%", positive: true },
    { title: "Clientes", value: "1.284", change: "+4.1%", positive: true },
    { title: "Churn", value: "2.4%", change: "-0.8%", positive: true },
    { title: "NPS", value: "78", change: "-2", positive: false },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {kpis.map(k => (
        <div key={k.title} className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-medium text-muted-foreground">{k.title}</p>
          <p className="mt-1 text-xl font-bold">{k.value}</p>
          <div className="mt-1 flex items-center gap-1">
            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", k.positive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>
              {k.change}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: `${60 + Math.random() * 30}%`, backgroundColor: "var(--raiz-orange)", opacity: 0.5 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Badge / Tag / Chip ─────────────────────────────────────────────────────
export function BadgePreview() {
  const badges = [
    { label: "Ativo", variant: "bg-green-500/10 text-green-400 border-green-500/20" },
    { label: "Pendente", variant: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    { label: "Erro", variant: "bg-red-500/10 text-red-400 border-red-500/20" },
    { label: "Info", variant: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    { label: "Default", variant: "bg-muted text-muted-foreground border-border" },
    { label: "3", variant: "bg-[var(--raiz-orange)]/10 text-[var(--raiz-orange)] border-[var(--raiz-orange)]/20" },
  ];
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Badges</p>
        <div className="flex flex-wrap gap-2">
          {badges.map(b => <span key={b.label} className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", b.variant)}>{b.label}</span>)}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Outline</p>
        <div className="flex flex-wrap gap-2">
          {["React", "TypeScript", "Tailwind", "Next.js", "Supabase"].map(t => (
            <span key={t} className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted cursor-pointer">{t}</span>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Removíveis</p>
        <div className="flex flex-wrap gap-2">
          {["Matemática", "Português", "Ciências"].map(t => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">{t}<X className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" /></span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Avatar ─────────────────────────────────────────────────────────────────
export function AvatarPreview() {
  const users = [
    { initials: "AG", color: "bg-[var(--raiz-orange)]", status: "online" },
    { initials: "MS", color: "bg-[var(--raiz-teal)]", status: "online" },
    { initials: "CP", color: "bg-blue-500", status: "away" },
    { initials: "JL", color: "bg-purple-500", status: "offline" },
    { initials: "RS", color: "bg-pink-500", status: "online" },
  ];
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Tamanhos</p>
        <div className="flex items-end gap-3">
          {[6, 8, 10, 12, 14].map((s, i) => (
            <div key={s} className={cn("flex items-center justify-center rounded-full text-white font-bold", users[i].color)} style={{ width: s * 4, height: s * 4, fontSize: s * 1.4 }}>
              {users[i].initials}
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Com status</p>
        <div className="flex items-center gap-3">
          {users.map(u => (
            <div key={u.initials} className="relative">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white", u.color)}>{u.initials}</div>
              <span className={cn("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background", u.status === "online" ? "bg-green-400" : u.status === "away" ? "bg-yellow-400" : "bg-zinc-400")} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Grupo (stack)</p>
        <div className="flex -space-x-2">
          {users.map(u => (
            <div key={u.initials} className={cn("flex h-9 w-9 items-center justify-center rounded-full border-2 border-background text-xs font-bold text-white", u.color)}>{u.initials}</div>
          ))}
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground">+3</div>
        </div>
      </div>
    </div>
  );
}

// ─── Tooltip ────────────────────────────────────────────────────────────────
export function TooltipPreview() {
  const [active, setActive] = useState<number | null>(null);
  const items = [
    { label: "Salvar", tooltip: "Ctrl+S — Salva o documento atual", pos: "top" },
    { label: "Copiar", tooltip: "Ctrl+C — Copia o texto selecionado", pos: "bottom" },
    { label: "Deletar", tooltip: "Ação irreversível!", pos: "right" },
  ];
  return (
    <div className="flex items-center justify-center gap-6 py-8">
      {items.map((item, i) => (
        <div key={i} className="relative" onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
          <button className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">{item.label}</button>
          {active === i && (
            <div className={cn("absolute z-10 w-48 rounded-md bg-zinc-900 px-3 py-2 text-xs text-zinc-100 shadow-lg",
              item.pos === "top" ? "bottom-full left-1/2 mb-2 -translate-x-1/2" :
              item.pos === "bottom" ? "top-full left-1/2 mt-2 -translate-x-1/2" :
              "left-full top-1/2 ml-2 -translate-y-1/2"
            )}>
              {item.tooltip}
              <div className={cn("absolute h-2 w-2 rotate-45 bg-zinc-900",
                item.pos === "top" ? "top-full left-1/2 -mt-1 -translate-x-1/2" :
                item.pos === "bottom" ? "bottom-full left-1/2 -mb-1 -translate-x-1/2" :
                "right-full top-1/2 -mr-1 -translate-y-1/2"
              )} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Timeline ───────────────────────────────────────────────────────────────
export function TimelinePreview() {
  const events = [
    { date: "27/03 15:30", title: "Deploy produção", desc: "v2.4.1 — fix auth middleware", color: "bg-green-400", icon: Check },
    { date: "27/03 14:15", title: "PR aprovado", desc: "#472 — Quality restoration", color: "bg-blue-400", icon: Eye },
    { date: "27/03 10:00", title: "Issue criada", desc: "#480 — Remaining TS errors", color: "bg-[var(--raiz-orange)]", icon: AlertCircle },
    { date: "26/03 18:30", title: "Sprint fechado", desc: "Sprint 2026-W13 — 12/14 tasks", color: "bg-purple-400", icon: Clock },
  ];
  return (
    <div className="relative ml-4 border-l border-border pl-6 space-y-5">
      {events.map((ev, i) => {
        const Icon = ev.icon;
        return (
          <div key={i} className="relative">
            <div className={cn("absolute -left-[calc(1.5rem+5px)] top-1 flex h-5 w-5 items-center justify-center rounded-full", ev.color)}>
              <Icon className="h-3 w-3 text-white" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium">{ev.title}</p>
              <span className="font-mono text-[10px] text-muted-foreground">{ev.date}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{ev.desc}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Code Block (Shiki) ─────────────────────────────────────────────────────
export function CodeBlockPreview() {
  const [copied, setCopied] = useState(false);
  const lines = [
    { tokens: [{ t: "import", c: "#C792EA" }, { t: " { streamText } ", c: "#BFC7D5" }, { t: "from", c: "#C792EA" }, { t: " 'ai'", c: "#C3E88D" }] },
    { tokens: [{ t: "import", c: "#C792EA" }, { t: " { anthropic } ", c: "#BFC7D5" }, { t: "from", c: "#C792EA" }, { t: " '@ai-sdk/anthropic'", c: "#C3E88D" }] },
    { tokens: [{ t: "", c: "" }] },
    { tokens: [{ t: "const", c: "#C792EA" }, { t: " result = ", c: "#BFC7D5" }, { t: "await", c: "#C792EA" }, { t: " streamText({", c: "#BFC7D5" }] },
    { tokens: [{ t: "  model: ", c: "#BFC7D5" }, { t: "'anthropic/claude-sonnet-4.6'", c: "#C3E88D" }, { t: ",", c: "#BFC7D5" }] },
    { tokens: [{ t: "  system: ", c: "#BFC7D5" }, { t: "'Assistente educacional'", c: "#C3E88D" }, { t: ",", c: "#BFC7D5" }] },
    { tokens: [{ t: "})", c: "#BFC7D5" }] },
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-[#1e1e2e]">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1.5">
        <span className="text-[10px] text-zinc-500">route.ts</span>
        <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="rounded p-1 hover:bg-zinc-800">
          {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3 text-zinc-500" />}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-3 font-mono text-xs leading-6">
        {lines.map((line, i) => (
          <div key={i} className="flex">
            <span className="mr-4 w-4 select-none text-right text-zinc-600">{i + 1}</span>
            {line.tokens.map((tok, j) => <span key={j} style={{ color: tok.c }}>{tok.t}</span>)}
          </div>
        ))}
      </pre>
    </div>
  );
}

// ─── Skeleton Loader ────────────────────────────────────────────────────────
export function SkeletonPreview() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Card com skeleton loading</p>
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2.5 w-full animate-pulse rounded bg-muted" />
          <div className="h-2.5 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-2.5 w-3/5 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />
      </div>
      <p className="text-xs text-muted-foreground">Tabela com skeleton</p>
      <div className="rounded-lg border border-border p-3 space-y-2">
        {[1, 2, 3].map(r => (
          <div key={r} className="flex items-center gap-3">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-3 w-40 animate-pulse rounded bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Progress Bar / Circle ──────────────────────────────────────────────────
export function ProgressPreview() {
  const [value, setValue] = useState(68);
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Upload em progresso</span><span className="font-mono">{value}%</span></div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: "var(--raiz-orange)" }} />
        </div>
      </div>
      <div className="flex items-center gap-6">
        {[32, 68, 95].map(v => (
          <div key={v} className="flex flex-col items-center gap-2">
            <div className="relative h-16 w-16">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="5" />
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--raiz-orange)" strokeWidth="5" strokeDasharray={`${v * 1.63} 163`} strokeLinecap="round" opacity={0.7} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{v}%</span>
            </div>
          </div>
        ))}
      </div>
      <input type="range" min="0" max="100" value={value} onChange={e => setValue(Number(e.target.value))} className="w-full accent-[var(--raiz-orange)]" />
    </div>
  );
}

// ─── Step Indicator ─────────────────────────────────────────────────────────
export function StepperPreview() {
  const [current, setCurrent] = useState(2);
  const steps = ["Dados Pessoais", "Endereço", "Documentos", "Revisão", "Confirmação"];
  return (
    <div className="space-y-4">
      {/* Horizontal */}
      <div className="flex items-center">
        {steps.map((s, i) => (
          <div key={i} className="flex flex-1 items-center">
            <button onClick={() => setCurrent(i)} className="flex flex-col items-center gap-1">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                i < current ? "bg-green-500 text-white" : i === current ? "bg-[var(--raiz-orange)] text-white ring-4 ring-[var(--raiz-orange)]/20" : "bg-muted text-muted-foreground"
              )}>
                {i < current ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn("text-[9px]", i <= current ? "text-foreground" : "text-muted-foreground")}>{s}</span>
            </button>
            {i < steps.length - 1 && <div className={cn("mx-1 h-0.5 flex-1", i < current ? "bg-green-500" : "bg-muted")} />}
          </div>
        ))}
      </div>
    </div>
  );
}
