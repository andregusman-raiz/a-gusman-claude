"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, BarChart3, Box, Package, Palette, Layers } from "lucide-react";

// Import all data sources
import { elements, foundationLibraries } from "@/lib/elements-data";
import { modules } from "@/lib/modules-data";

// Solutions data (simplified — ids + names + categories)
const solutions = [
  { id: "dashboard-kpi", name: "Metric Cards + Sparklines", cat: "Data Display" },
  { id: "table-filters-export", name: "Data Table + Filtros + Export", cat: "Data Display" },
  { id: "forms-multistep", name: "Dynamic Form Engine", cat: "Forms" },
  { id: "status-workflow-timeline", name: "Status Machine + Audit Trail", cat: "Workflow" },
  { id: "app-shell-sidebar", name: "App Shell Responsivo", cat: "Layout" },
  { id: "workflow-builder", name: "Visual Flow Designer", cat: "Workflow" },
  { id: "chat-ai-streaming", name: "Chat Interface + Streaming", cat: "AI" },
  { id: "pageflip-3d", name: "Document Viewer 3D", cat: "Media" },
  { id: "qr-designer", name: "Interactive Code Generator", cat: "Tools" },
  { id: "code-editor", name: "Embedded Code Editor", cat: "Tools" },
  { id: "dragdrop-virtual-scroll", name: "Kanban Board + Virtual List", cat: "Data Display" },
  { id: "document-generation", name: "Multi-Format Export Engine", cat: "Export" },
  { id: "rag-knowledge-base", name: "Document Pipeline Manager", cat: "AI" },
  { id: "social-media-publisher", name: "Content Calendar + Composer", cat: "Tools" },
  { id: "bi-data-explorer", name: "Interactive Chart Builder", cat: "Data Display" },
  { id: "meeting-transcript-ai", name: "Speaker Timeline + AI Summary", cat: "AI" },
  { id: "contract-lifecycle", name: "Negotiation Flow + Risk Matrix", cat: "Workflow" },
  { id: "content-studio-ai", name: "Rich Content Studio", cat: "AI" },
  { id: "litigation-case-manager", name: "Case Manager + AI Copilot", cat: "Legal" },
  { id: "data-catalog-governance", name: "API Factory + Data Catalog", cat: "Tools" },
  { id: "ai-app-builder", name: "AI Build Pipeline + Preview", cat: "AI" },
  { id: "tv-realtime-counter", name: "Fullscreen Counter Display", cat: "Data Display" },
  { id: "skill-assessment-profiler", name: "Radar Chart + Profile Report", cat: "Data Display" },
  { id: "contractor-management", name: "Multi-Step Onboarding + Import", cat: "Forms" },
];

const pages = [
  { id: "/", name: "Home — Soluções", cat: "Navegação" },
  { id: "/elements", name: "Elementos UI", cat: "Navegação" },
  { id: "/foundations", name: "Libraries de Fundação", cat: "Navegação" },
  { id: "/modules", name: "Módulos Funcionais", cat: "Navegação" },
  { id: "/tokens", name: "Design Tokens", cat: "Navegação" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigate = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="fixed left-1/2 top-[20%] w-full max-w-lg -translate-x-1/2">
        <Command className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl" shouldFilter={true}>
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input placeholder="Buscar soluções, elementos, módulos, tokens..." className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground" autoFocus />
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">ESC</kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">Nenhum resultado encontrado</Command.Empty>

            <Command.Group heading="Navegação">
              {pages.map(p => (
                <Command.Item key={p.id} value={`${p.name} ${p.cat}`} onSelect={() => navigate(p.id)} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-[var(--raiz-orange)]/10 data-[selected=true]:text-[var(--raiz-orange)]">
                  <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {p.name}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading={`Soluções (${solutions.length})`}>
              {solutions.map(s => (
                <Command.Item key={s.id} value={`${s.name} ${s.cat} solução`} onSelect={() => navigate(`/solutions/${s.id}`)} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-[var(--raiz-orange)]/10 data-[selected=true]:text-[var(--raiz-orange)]">
                  <BarChart3 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1">{s.name}</span>
                  <span className="text-[10px] text-muted-foreground">{s.cat}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading={`Elementos (${elements.length})`}>
              {elements.slice(0, 30).map(e => (
                <Command.Item key={e.id} value={`${e.name} ${e.lib} ${e.category} ${e.tags.join(" ")} elemento`} onSelect={() => navigate(`/elements/${e.id}`)} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-[var(--raiz-orange)]/10 data-[selected=true]:text-[var(--raiz-orange)]">
                  <Box className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1">{e.name}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{e.lib}</span>
                </Command.Item>
              ))}
              {elements.slice(30).map(e => (
                <Command.Item key={e.id} value={`${e.name} ${e.lib} ${e.category} ${e.tags.join(" ")} elemento`} onSelect={() => navigate(`/elements/${e.id}`)} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-[var(--raiz-orange)]/10 data-[selected=true]:text-[var(--raiz-orange)]">
                  <Box className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1">{e.name}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{e.lib}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading={`Fundação (${foundationLibraries.length})`}>
              {foundationLibraries.map(l => (
                <Command.Item key={l.id} value={`${l.name} ${l.tags.join(" ")} fundação library`} onSelect={() => navigate(`/foundations/${l.id}`)} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-[var(--raiz-orange)]/10 data-[selected=true]:text-[var(--raiz-orange)]">
                  <Palette className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1">{l.name}</span>
                  <span className="text-[10px] text-muted-foreground">{l.componentCount}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading={`Módulos (${modules.length})`}>
              {modules.map(m => (
                <Command.Item key={m.id} value={`${m.name} ${m.source} ${m.category} ${m.tags.join(" ")} módulo`} onSelect={() => navigate(`/modules/${m.id}`)} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-[var(--raiz-orange)]/10 data-[selected=true]:text-[var(--raiz-orange)]">
                  <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1">{m.name}</span>
                  <span className="text-[10px] text-muted-foreground">{m.source}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
