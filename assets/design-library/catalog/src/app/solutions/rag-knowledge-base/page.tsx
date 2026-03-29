"use client";

import { useState, useEffect } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { Folder, FileText, Upload, BarChart3, Search, RefreshCw, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";

const FOLDERS = [
  { id: "f1", name: "Regulamentos Internos", docCount: 12, activeCount: 10 },
  { id: "f2", name: "Contratos Educacionais", docCount: 8, activeCount: 8 },
  { id: "f3", name: "Políticas de RH", docCount: 15, activeCount: 13 },
];

const DOCUMENTS = [
  { id: "d1", name: "Regimento Escolar 2026.pdf", status: "active", pages: 42, chunks: 128, updatedAt: "27/03 14:30" },
  { id: "d2", name: "Manual do Professor v3.docx", status: "active", pages: 28, chunks: 84, updatedAt: "26/03 10:15" },
  { id: "d3", name: "Política de Bolsas.pdf", status: "processing", pages: 15, chunks: 0, updatedAt: "27/03 15:45" },
  { id: "d4", name: "Calendário Acadêmico.xlsx", status: "pending", pages: 3, chunks: 0, updatedAt: "27/03 15:50" },
  { id: "d5", name: "Código de Conduta.pdf", status: "failed", pages: 8, chunks: 0, updatedAt: "27/03 12:00" },
];

const STATUS_MAP: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  active: { icon: CheckCircle, color: "text-green-400", label: "Ativo" },
  processing: { icon: Loader2, color: "text-blue-400", label: "Processando" },
  pending: { icon: Clock, color: "text-yellow-400", label: "Pendente" },
  failed: { icon: AlertCircle, color: "text-red-400", label: "Falhou" },
};

export default function RagKnowledgeBasePage() {
  const [view, setView] = useState<"list" | "folder">("list");
  const [selectedFolder, setSelectedFolder] = useState(FOLDERS[0]);
  const [filter, setFilter] = useState<"all" | "active" | "processing">("all");
  const [search, setSearch] = useState("");
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!polling) return;
    const id = setInterval(() => {}, 3000);
    return () => clearInterval(id);
  }, [polling]);

  const filtered = DOCUMENTS.filter((d) => {
    if (filter === "active" && d.status !== "active") return false;
    if (filter === "processing" && d.status !== "processing" && d.status !== "pending") return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <SolutionLayout id="rag-knowledge-base" title="Document Pipeline Manager" source="raiz-platform" category="AI">
      <p className="mb-6 text-sm text-muted-foreground">
        Upload → processing pipeline → folder org. Auto-polling 3s enquanto docs estão processando.
      </p>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar — folders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Pastas</h3>
            <button className="rounded-md p-1 text-muted-foreground hover:bg-muted"><Folder className="h-4 w-4" /></button>
          </div>
          {FOLDERS.map((f) => (
            <button
              key={f.id}
              onClick={() => { setSelectedFolder(f); setView("folder"); }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                selectedFolder.id === f.id && view === "folder" ? "border-[var(--raiz-orange)]/40 bg-[var(--raiz-orange)]/5" : "border-border hover:border-[var(--raiz-orange)]/20",
              )}
            >
              <Folder className="h-5 w-5 shrink-0 text-[var(--raiz-orange)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.activeCount}/{f.docCount} ativos</p>
              </div>
            </button>
          ))}

          {/* Stats */}
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-sm font-medium"><BarChart3 className="h-4 w-4 text-[var(--raiz-teal)]" /> Stats</div>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Total docs</span><span className="font-mono">35</span></div>
              <div className="flex justify-between"><span>Total chunks</span><span className="font-mono">1.284</span></div>
              <div className="flex justify-between"><span>Processando</span><span className="font-mono text-blue-400">2</span></div>
            </div>
          </div>
        </div>

        {/* Main — documents */}
        <div className="rounded-xl border border-border bg-card">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input className="h-8 rounded-md border border-border bg-background pl-8 pr-3 text-sm" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              {(["all", "active", "processing"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={cn("rounded-md px-2.5 py-1 text-xs font-medium", filter === f ? "bg-[var(--raiz-orange)]/10 text-[var(--raiz-orange)]" : "text-muted-foreground")}>
                  {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Em processo"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {polling && <span className="flex items-center gap-1 text-xs text-blue-400"><RefreshCw className="h-3 w-3 animate-spin" /> Polling 3s</span>}
              <button className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white" style={{ backgroundColor: "var(--raiz-orange)" }}>
                <Upload className="h-3.5 w-3.5" /> Upload
              </button>
            </div>
          </div>

          {/* Document list */}
          <div className="divide-y divide-border">
            {filtered.map((doc) => {
              const st = STATUS_MAP[doc.status];
              const Icon = st.icon;
              return (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.pages} páginas · {doc.chunks > 0 ? `${doc.chunks} chunks` : "aguardando"}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{doc.updatedAt}</span>
                  <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", st.color, `${st.color.replace("text-", "bg-")}/10`)}>
                    <Icon className={cn("h-3 w-3", doc.status === "processing" && "animate-spin")} /> {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SolutionLayout>
  );
}
