"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";
import { Sun, Moon, Check, Download, X, Search, Filter, ExternalLink, ArrowLeft } from "lucide-react";
import { elements, foundationLibraries, ELEMENT_CATEGORIES, ELEMENT_CAT_COLORS, type ElementCategory } from "@/lib/elements-data";
import { ElementMiniPreview } from "@/components/elements/element-mini-preview";
import { cn } from "@/lib/utils";

export default function ElementsPage() {
  return <Suspense><ElementsContent /></Suspense>;
}

function ElementsContent() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  useEffect(() => setMounted(true), []);
  const [search, setSearch] = useState(initialQ);
  const [activeCategory, setActiveCategory] = useState<ElementCategory | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return elements.filter((e) => {
      if (activeCategory && e.category !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return e.name.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q) || e.lib.toLowerCase().includes(q) || e.tags.some((t) => t.includes(q));
      }
      return true;
    });
  }, [search, activeCategory]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const exportSelected = () => {
    const elementData = elements.filter((e) => selected.has(e.id)).map((e) => ({
      type: "element" as const, id: e.id, name: e.name, category: e.category, subcategory: e.subcategory,
      lib: e.lib, repo: `https://${e.repo}`, description: e.desc, tags: e.tags,
    }));
    const libData = foundationLibraries.filter((l) => selected.has(`lib:${l.id}`)).map((l) => ({
      type: "foundation-library" as const, id: l.id, name: l.name, scope: l.scope,
      repo: `https://${l.repo}`, description: l.desc, componentCount: l.componentCount, tags: l.tags,
    }));
    const data = [...libData, ...elementData];
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `elements-selection-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  // Group by subcategory within active category
  const grouped = useMemo(() => {
    if (!activeCategory) return null;
    const groups: Record<string, typeof filtered> = {};
    for (const el of filtered) {
      if (!groups[el.subcategory]) groups[el.subcategory] = [];
      groups[el.subcategory].push(el);
    }
    return groups;
  }, [filtered, activeCategory]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-black tracking-tight" style={{ color: "var(--raiz-orange)" }}>RAIZ</span>
              <span className="text-sm font-normal tracking-widest" style={{ color: "var(--raiz-teal)" }}>educação</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Elementos UI</h1>
              <p className="text-xs text-muted-foreground">{elements.length} componentes best-in-class</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">Soluções</Link>
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
            <input className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground" placeholder="Buscar por nome, lib, tag..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button onClick={() => setActiveCategory(null)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${!activeCategory ? "text-white" : "text-muted-foreground hover:text-foreground"}`} style={!activeCategory ? { backgroundColor: "var(--raiz-orange)" } : {}}>
              Todas ({elements.length})
            </button>
            {ELEMENT_CATEGORIES.map((cat) => {
              const cc = ELEMENT_CAT_COLORS[cat];
              const count = elements.filter((e) => e.category === cat).length;
              if (count === 0) return null;
              return (
                <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeCategory === cat ? `${cc.bg} ${cc.text}` : "text-muted-foreground hover:text-foreground"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${cc.dot}`} /> {cat} <span className="opacity-50">({count})</span>
                </button>
              );
            })}
          </div>
          {(search || activeCategory) && (
            <button onClick={() => { setSearch(""); setActiveCategory(null); }} className="shrink-0 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          )}
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

        {/* Foundation Libraries */}
        {!activeCategory && !search && (
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-semibold">Fundação</span>
              <span className="text-xs text-muted-foreground">— Libraries abrangentes que cobrem dezenas de componentes cada</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {foundationLibraries.map((lib) => {
                const isSelected = selected.has(`lib:${lib.id}`);
                return (
                  <div key={lib.id} className={cn("group relative rounded-lg border bg-card p-3 transition-all hover:shadow-md", isSelected ? "border-[var(--raiz-orange)]" : "border-border hover:border-[var(--raiz-orange)]/30")}>
                    <button onClick={() => toggleSelect(`lib:${lib.id}`)} className={cn("absolute left-2 top-2 z-10 flex h-4 w-4 items-center justify-center rounded transition-all", isSelected ? "text-white" : "border border-border bg-background opacity-0 group-hover:opacity-100")} style={isSelected ? { backgroundColor: "var(--raiz-orange)" } : {}}>
                      {isSelected && <Check className="h-2.5 w-2.5" />}
                    </button>
                    <a href={`https://${lib.repo}`} target="_blank" rel="noopener noreferrer">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold" style={{ color: "var(--raiz-orange)" }}>{lib.name}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground">{lib.componentCount}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{lib.desc}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {lib.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{tag}</span>
                          ))}
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground/30" />
                      </div>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Grouped view when category selected */}
        {grouped ? (
          Object.entries(grouped).map(([sub, els]) => (
            <div key={sub} className="mb-8">
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{sub}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {els.map((el) => <ElementCard key={el.id} el={el} selected={selected.has(el.id)} onToggle={() => toggleSelect(el.id)} />)}
              </div>
            </div>
          ))
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((el) => <ElementCard key={el.id} el={el} selected={selected.has(el.id)} onToggle={() => toggleSelect(el.id)} />)}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Filter className="mx-auto h-8 w-8 opacity-30" />
            <p className="mt-2 text-sm">Nenhum elemento encontrado</p>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">{filtered.length} de {elements.length} elementos</p>
      </main>
    </div>
  );
}

// ─── Card component ─────────────────────────────────────────────────────────

function ElementCard({ el, selected, onToggle }: { el: typeof elements[0]; selected: boolean; onToggle: () => void }) {
  const cc = ELEMENT_CAT_COLORS[el.category];
  return (
    <div className={cn("group relative overflow-hidden rounded-lg border bg-card transition-all duration-200 hover:shadow-md", selected ? "ring-2" : "border-border hover:border-[var(--raiz-orange)]/30")} style={selected ? { borderColor: "var(--raiz-orange)", outlineColor: "var(--raiz-orange)" } : {}}>
      <button onClick={onToggle} className={cn("absolute left-2 top-2 z-10 flex h-4 w-4 items-center justify-center rounded transition-all", selected ? "text-white" : "border border-border bg-background opacity-0 group-hover:opacity-100")} style={selected ? { backgroundColor: "var(--raiz-orange)" } : {}}>
        {selected && <Check className="h-2.5 w-2.5" />}
      </button>

      <Link href={`/elements/${el.id}`} className="block">
        <div className="h-20 border-b border-border bg-muted/20 px-4 py-2">
          <ElementMiniPreview type={el.preview} />
        </div>
        <div className="p-3">
          <div className="flex items-center gap-1.5">
            <span className={cn("h-1 w-1 rounded-full", cc.dot)} />
            <span className="text-[10px] text-muted-foreground">{el.subcategory}</span>
          </div>
          <p className="mt-0.5 text-sm font-semibold leading-tight transition-colors group-hover:text-[var(--raiz-orange)]">{el.name}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{el.desc}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{el.lib}</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground/30" />
          </div>
        </div>
      </Link>
    </div>
  );
}
