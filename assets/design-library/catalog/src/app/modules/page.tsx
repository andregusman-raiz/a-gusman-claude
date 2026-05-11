"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";
import { Sun, Moon, Check, Download, X, Search, Filter, ArrowLeft, ExternalLink, Package, FileCode, Database, Zap } from "lucide-react";
import { modules, MODULE_CATEGORIES, MODULE_CAT_COLORS, type ModuleCategory } from "@/lib/modules-data";
import { cn } from "@/lib/utils";

export default function ModulesPage() {
  return <Suspense><ModulesContent /></Suspense>;
}

function ModulesContent() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  useEffect(() => setMounted(true), []);
  const [search, setSearch] = useState(initialQ);
  const [activeCategory, setActiveCategory] = useState<ModuleCategory | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return modules.filter((m) => {
      if (activeCategory && m.category !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q) || m.source.toLowerCase().includes(q) || m.tags.some((t) => t.includes(q));
      }
      return true;
    });
  }, [search, activeCategory]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const exportSelected = () => {
    const data = modules.filter((m) => selected.has(m.id)).map((m) => ({
      id: m.id, name: m.name, category: m.category, source: m.source,
      description: m.desc, keyFiles: m.keyFiles, dependencies: m.deps, extractable: m.extractable, tags: m.tags,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `modules-selection-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-black tracking-tight" style={{ color: "var(--raiz-orange)" }}>RAIZ</span>
              <span className="text-sm font-normal tracking-widest" style={{ color: "var(--raiz-teal)" }}>educação</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Módulos Funcionais</h1>
              <p className="text-xs text-muted-foreground">{modules.length} módulos reutilizáveis cross-app</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">Soluções</Link>
            <Link href="/elements" className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">Elementos</Link>
            <Link href="/tokens" className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-[var(--raiz-teal)] hover:text-[var(--raiz-teal)]">Tokens</Link>
            {selected.size > 0 && (
              <button onClick={exportSelected} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--raiz-orange)" }}>
                <Download className="h-4 w-4" /> Exportar {selected.size}
              </button>
            )}
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-lg border border-border p-2 hover:bg-accent">
              {mounted ? (theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <Sun className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground" placeholder="Buscar por nome, source, tag..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button onClick={() => setActiveCategory(null)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${!activeCategory ? "text-white" : "text-muted-foreground hover:text-foreground"}`} style={!activeCategory ? { backgroundColor: "var(--raiz-orange)" } : {}}>
              Todos ({modules.length})
            </button>
            {MODULE_CATEGORIES.map((cat) => {
              const cc = MODULE_CAT_COLORS[cat];
              const count = modules.filter((m) => m.category === cat).length;
              if (count === 0) return null;
              return (
                <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeCategory === cat ? `${cc.bg} ${cc.text}` : "text-muted-foreground hover:text-foreground"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${cc.dot}`} /> {cat} <span className="opacity-50">({count})</span>
                </button>
              );
            })}
          </div>
          {(search || activeCategory) && <button onClick={() => { setSearch(""); setActiveCategory(null); }} className="shrink-0 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto max-w-7xl px-6 py-6">
        {selected.size > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm" style={{ borderColor: "var(--raiz-orange)", backgroundColor: "var(--raiz-orange-light)" }}>
            <Check className="h-4 w-4" style={{ color: "var(--raiz-orange)" }} />
            <span>{selected.size} selecionado{selected.size > 1 ? "s" : ""}</span>
            <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Limpar</button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => {
            const cc = MODULE_CAT_COLORS[m.category];
            const isSelected = selected.has(m.id);
            return (
              <div key={m.id} className={cn("group relative overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-lg", isSelected ? "ring-2" : "border-border hover:border-[var(--raiz-orange)]/30")} style={isSelected ? { borderColor: "var(--raiz-orange)", outlineColor: "var(--raiz-orange)" } : {}}>
                {/* Checkbox */}
                <button onClick={() => toggleSelect(m.id)} className={cn("absolute left-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded transition-all", isSelected ? "text-white" : "border border-border bg-background opacity-0 group-hover:opacity-100")} style={isSelected ? { backgroundColor: "var(--raiz-orange)" } : {}}>
                  {isSelected && <Check className="h-3 w-3" />}
                </button>

                <Link href={`/modules/${m.id}`} className="block p-5">
                  {/* Category + extractable */}
                  <div className="flex items-center gap-2">
                    <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", cc.bg, cc.text)}>
                      <span className={cn("h-1 w-1 rounded-full", cc.dot)} /> {m.category}
                    </span>
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", m.extractable === "sim" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400")}>
                      {m.extractable === "sim" ? "Extraível" : "Parcial"}
                    </span>
                  </div>

                  {/* Name + desc */}
                  <h3 className="mt-2 text-sm font-bold leading-tight transition-colors group-hover:text-[var(--raiz-orange)]">{m.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.desc}</p>

                  {/* Source */}
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <Package className="h-3 w-3 text-muted-foreground/50" />
                    <span className="font-medium" style={{ color: "var(--raiz-teal)" }}>{m.source}</span>
                  </div>

                  {/* Key files */}
                  <div className="mt-2 flex items-start gap-2 text-xs">
                    <FileCode className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/50" />
                    <div className="min-w-0">
                      {m.keyFiles.slice(0, 2).map((f) => (
                        <p key={f} className="truncate font-mono text-[10px] text-muted-foreground">{f}</p>
                      ))}
                      {m.keyFiles.length > 2 && <p className="text-[10px] text-muted-foreground/50">+{m.keyFiles.length - 2} more</p>}
                    </div>
                  </div>

                  {/* Deps */}
                  {m.deps.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <Database className="h-3 w-3 text-muted-foreground/50" />
                      <div className="flex flex-wrap gap-1">
                        {m.deps.slice(0, 3).map((d) => (
                          <span key={d} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {m.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Filter className="mx-auto h-8 w-8 opacity-30" />
            <p className="mt-2 text-sm">Nenhum módulo encontrado</p>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">{filtered.length} de {modules.length} módulos</p>
      </main>
    </div>
  );
}
