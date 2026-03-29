"use client";

import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { Play, Square, GitBranch, Timer, Bot, Code, Settings, Undo2, Redo2, Save, Maximize2, ZoomIn, AlertTriangle } from "lucide-react";

const NODE_TYPES = [
  { type: "start", label: "Start", icon: Play, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  { type: "task", label: "Task", icon: Settings, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  { type: "gateway-xor", label: "XOR", icon: GitBranch, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  { type: "ai-task", label: "AI Agent", icon: Bot, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  { type: "script", label: "Script", icon: Code, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
  { type: "timer", label: "Timer", icon: Timer, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  { type: "end", label: "End", icon: Square, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
];

export default function WorkflowBuilderPage() {
  return (
    <SolutionLayout id="workflow-builder" title="Visual Flow Designer" source="ticket-raiz" category="Workflow">
      <p className="mb-6 text-sm text-muted-foreground">
        React Flow com 9 node types, drag-from-palette, undo/redo, autosave, live validation, BPMN XML import/export.
      </p>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div className="flex items-center gap-1">
            <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><Undo2 className="h-4 w-4" /></button>
            <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><Redo2 className="h-4 w-4" /></button>
            <div className="mx-2 h-4 w-px bg-border" />
            <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><ZoomIn className="h-4 w-4" /></button>
            <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><Maximize2 className="h-4 w-4" /></button>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-green-400"><span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Salvo</span>
            <button className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
              <Save className="h-3.5 w-3.5" /> Publicar v3
            </button>
          </div>
        </div>

        <div className="flex h-[420px]">
          {/* Element palette */}
          <div className="w-44 shrink-0 border-r border-border bg-muted/20 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Elementos</p>
            <div className="space-y-1.5">
              {NODE_TYPES.map((n) => {
                const Icon = n.icon;
                return (
                  <div key={n.type} className={cn("flex cursor-grab items-center gap-2 rounded-md border px-2.5 py-2 text-xs font-medium transition-colors hover:bg-muted/50", n.border, n.color)}>
                    <Icon className="h-3.5 w-3.5" /> {n.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Canvas mock */}
          <div className="relative flex-1 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-muted/20 to-background" style={{ backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
            {/* Mock nodes */}
            <div className="absolute left-12 top-[180px] flex h-10 w-10 items-center justify-center rounded-full border-2 border-green-500/40 bg-green-500/10">
              <Play className="h-4 w-4 text-green-400" />
            </div>
            <svg className="absolute left-[68px] top-[198px]" width="60" height="2"><line x1="0" y1="1" x2="60" y2="1" stroke="hsl(var(--border))" strokeWidth="2" /></svg>

            <div className="absolute left-[130px] top-[168px] w-40 rounded-lg border border-blue-500/30 bg-card p-3 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-medium text-blue-400">
                <Settings className="h-3.5 w-3.5" /> Validar Dados
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">Verificar campos obrigatórios</p>
            </div>
            <svg className="absolute left-[270px] top-[190px]" width="40" height="2"><line x1="0" y1="1" x2="40" y2="1" stroke="hsl(var(--border))" strokeWidth="2" /></svg>

            <div className="absolute left-[310px] top-[172px] flex h-14 w-14 rotate-45 items-center justify-center border-2 border-yellow-500/40 bg-yellow-500/10">
              <GitBranch className="h-4 w-4 -rotate-45 text-yellow-400" />
            </div>

            {/* Branch up: AI */}
            <svg className="absolute left-[350px] top-[142px]" width="50" height="40">
              <path d="M0,40 Q25,40 50,0" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
            </svg>
            <div className="absolute left-[400px] top-[108px] w-40 rounded-lg border border-purple-500/30 bg-card p-3 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-medium text-purple-400">
                <Bot className="h-3.5 w-3.5" /> AI: Classificar
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">Claude analisa e classifica</p>
            </div>

            {/* Branch down: Script */}
            <svg className="absolute left-[350px] top-[202px]" width="50" height="40">
              <path d="M0,0 Q25,0 50,40" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
            </svg>
            <div className="absolute left-[400px] top-[228px] w-40 rounded-lg border border-cyan-500/30 bg-card p-3 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-400">
                <Code className="h-3.5 w-3.5" /> Notificar
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">Enviar email + Slack</p>
            </div>

            {/* End nodes */}
            <svg className="absolute left-[540px] top-[130px]" width="30" height="2"><line x1="0" y1="1" x2="30" y2="1" stroke="hsl(var(--border))" strokeWidth="2" /></svg>
            <div className="absolute left-[572px] top-[120px] flex h-10 w-10 items-center justify-center rounded-full border-2 border-red-500/40 bg-red-500/10">
              <Square className="h-3.5 w-3.5 text-red-400" />
            </div>

            <svg className="absolute left-[540px] top-[250px]" width="30" height="2"><line x1="0" y1="1" x2="30" y2="1" stroke="hsl(var(--border))" strokeWidth="2" /></svg>
            <div className="absolute left-[572px] top-[240px] flex h-10 w-10 items-center justify-center rounded-full border-2 border-red-500/40 bg-red-500/10">
              <Square className="h-3.5 w-3.5 text-red-400" />
            </div>

            {/* MiniMap mock */}
            <div className="absolute bottom-3 right-3 h-20 w-32 rounded-md border border-border bg-background/80 p-1">
              <div className="h-full w-full rounded bg-muted/30" />
            </div>
          </div>

          {/* Config panel */}
          <div className="w-52 shrink-0 border-l border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold">Config: Validar Dados</p>
            <div className="mt-3 space-y-3 text-xs">
              <div>
                <label className="text-muted-foreground">Nome</label>
                <input className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-xs" value="Validar Dados" readOnly />
              </div>
              <div>
                <label className="text-muted-foreground">Assignee</label>
                <input className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-xs" value="Operador" readOnly />
              </div>
              <div>
                <label className="text-muted-foreground">Form Schema</label>
                <select className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-xs">
                  <option>validacao_dados_v2</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Validation bar */}
        <div className="flex items-center gap-2 border-t border-border bg-muted/20 px-4 py-2 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
          <span className="text-yellow-400">1 aviso:</span>
          <span className="text-muted-foreground">Gateway XOR sem condição no branch inferior</span>
          <button className="ml-auto text-orange-400 hover:underline">Ir para elemento</button>
        </div>
      </div>
    </SolutionLayout>
  );
}
