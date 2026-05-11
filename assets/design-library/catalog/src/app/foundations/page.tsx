"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, ArrowLeft, ExternalLink, Check, Download, Package } from "lucide-react";
import { foundationLibraries } from "@/lib/elements-data";
import { cn } from "@/lib/utils";

export default function FoundationsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  useEffect(() => setMounted(true), []);

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const exportSelected = () => {
    const data = foundationLibraries.filter(l => selected.has(l.id)).map(l => ({
      type: "foundation-library", id: l.id, name: l.name, scope: l.scope,
      repo: `https://${l.repo}`, description: l.desc, componentCount: l.componentCount, tags: l.tags,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `foundations-selection-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
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
              <h1 className="text-xl font-bold tracking-tight">Libraries de Fundação</h1>
              <p className="text-xs text-muted-foreground">{foundationLibraries.length} libraries abrangentes — a base do ecossistema</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">Soluções</Link>
            <Link href="/elements" className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">Elementos</Link>
            <Link href="/modules" className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">Módulos</Link>
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

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {foundationLibraries.map(lib => {
            const isSelected = selected.has(lib.id);
            return (
              <div key={lib.id} className={cn("group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg", isSelected ? "border-[var(--raiz-orange)] ring-2" : "border-border hover:border-[var(--raiz-orange)]/30")}>
                <button onClick={() => toggleSelect(lib.id)} className={cn("absolute left-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded transition-all", isSelected ? "text-white" : "border border-border bg-background opacity-0 group-hover:opacity-100")} style={isSelected ? { backgroundColor: "var(--raiz-orange)" } : {}}>
                  {isSelected && <Check className="h-3 w-3" />}
                </button>

                <Link href={`/foundations/${lib.id}`} className="block p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold" style={{ color: "var(--raiz-orange)" }}>{lib.name}</span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{lib.componentCount}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{lib.scope}</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{lib.desc}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {lib.tags.map(tag => <span key={tag} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{tag}</span>)}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground/50">
                    <ExternalLink className="h-3 w-3" /> {lib.repo}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
