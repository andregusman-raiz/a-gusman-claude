"use client";

import { useState } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { GripVertical, Plus, Clock, AlertCircle, CheckCircle, Circle } from "lucide-react";

const COLUMNS = [
  { id: "backlog", label: "Backlog", color: "text-zinc-400", items: [
    { id: "t1", title: "Migrar auth para Clerk", priority: "P1", assignee: "JS" },
    { id: "t2", title: "Refatorar queries folha", priority: "P2", assignee: "ML" },
  ]},
  { id: "doing", label: "Em Progresso", color: "text-blue-400", items: [
    { id: "t3", title: "Dashboard KPI professores", priority: "P0", assignee: "AG", blocked: true },
    { id: "t4", title: "Export Excel multi-sheet", priority: "P1", assignee: "CP" },
  ]},
  { id: "review", label: "Review", color: "text-purple-400", items: [
    { id: "t5", title: "Workflow aprovação", priority: "P1", assignee: "RS" },
  ]},
  { id: "done", label: "Concluído", color: "text-green-400", items: [
    { id: "t6", title: "Seed 111 solicitações", priority: "P2", assignee: "AG" },
    { id: "t7", title: "Status badge component", priority: "P2", assignee: "ML" },
    { id: "t8", title: "Global filters bar", priority: "P1", assignee: "CP" },
  ]},
];

const EVENTS = Array.from({ length: 20 }, (_, i) => ({
  id: `ev-${i}`,
  time: `09:${String(15 + i).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
  type: ["tool_call", "step_complete", "error", "info", "tool_call", "step_complete"][i % 6],
  message: [
    "Executando query PFUNC via DataServer",
    "Step 3/8 concluído — validação OK",
    "Timeout ao conectar TOTVS RM (retry 2/3)",
    "Cache hit: 847 funcionários",
    "Chamando API /rh/v1/employees",
    "Step 4/8 concluído — sync delta",
  ][i % 6],
}));

const TYPE_COLORS: Record<string, string> = {
  tool_call: "text-cyan-400 bg-cyan-500/10",
  step_complete: "text-green-400 bg-green-500/10",
  error: "text-red-400 bg-red-500/10",
  info: "text-zinc-400 bg-zinc-500/10",
};

export default function DragDropPage() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filteredEvents = activeFilter ? EVENTS.filter((e) => e.type === activeFilter) : EVENTS;

  return (
    <SolutionLayout id="dragdrop-virtual-scroll" title="Kanban Board + Virtual List" source="raiz-agent-dashboard" category="Data Display">
      <p className="mb-6 text-sm text-muted-foreground">
        @dnd-kit Kanban com dependency overlay + @tanstack/react-virtual timeline com filter pills.
      </p>

      {/* Kanban */}
      <div className="mb-8 grid grid-cols-4 gap-3">
        {COLUMNS.map((col) => (
          <div key={col.id} className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", col.color.replace("text-", "bg-"))} />
                <span className="text-sm font-medium">{col.label}</span>
                <span className="rounded-full bg-muted px-1.5 text-[10px] font-bold text-muted-foreground">{col.items.length}</span>
              </div>
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="space-y-2 p-2">
              {col.items.map((item) => (
                <div key={item.id} className={cn("group cursor-grab rounded-lg border bg-background p-3 transition-shadow hover:shadow-md", item.blocked ? "border-red-500/30" : "border-border")}>
                  <div className="flex items-start gap-2">
                    <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">{item.title}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold",
                          item.priority === "P0" ? "bg-red-500/10 text-red-400" : item.priority === "P1" ? "bg-orange-500/10 text-orange-400" : "bg-zinc-500/10 text-zinc-400"
                        )}>{item.priority}</span>
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-bold">{item.assignee}</div>
                        {item.blocked && <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Virtual scroll timeline */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <h3 className="text-sm font-medium">Agent Timeline (virtualizada)</h3>
          <div className="flex items-center gap-1.5">
            {Object.entries(TYPE_COLORS).map(([type, colors]) => {
              const count = EVENTS.filter((e) => e.type === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setActiveFilter(activeFilter === type ? null : type)}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                    activeFilter === type ? colors : "bg-muted text-muted-foreground",
                  )}
                >
                  {type.replace("_", " ")} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-[280px] overflow-y-auto">
          {filteredEvents.map((ev) => (
            <div key={ev.id} className="flex items-center gap-3 border-b border-border/50 px-4 py-2 text-sm hover:bg-muted/20">
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{ev.time}</span>
              <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium", TYPE_COLORS[ev.type])}>
                {ev.type}
              </span>
              <span className="text-muted-foreground">{ev.message}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-border px-4 py-1.5 text-[10px] text-muted-foreground">
          {filteredEvents.length} de {EVENTS.length} eventos · useVirtualizer estimateSize=56px · translateY positioning
        </div>
      </div>
    </SolutionLayout>
  );
}
