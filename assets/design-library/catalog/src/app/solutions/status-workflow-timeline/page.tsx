"use client";

import { useState } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Send, RotateCcw, Clock, AlertCircle, UserCheck } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendente: { label: "Pendente", color: "text-zinc-400", bg: "bg-zinc-500/10" },
  em_andamento: { label: "Em Andamento", color: "text-blue-400", bg: "bg-blue-500/10" },
  em_revisao: { label: "Em Revisão", color: "text-purple-400", bg: "bg-purple-500/10" },
  entregue: { label: "Entregue", color: "text-green-400", bg: "bg-green-500/10" },
  rejeitada: { label: "Rejeitada", color: "text-red-400", bg: "bg-red-500/10" },
  devolvida: { label: "Devolvida", color: "text-orange-400", bg: "bg-orange-500/10" },
  cancelada: { label: "Cancelada", color: "text-zinc-500", bg: "bg-zinc-500/10" },
};

const TIMELINE = [
  { date: "27/03 09:15", user: "Sistema", from: null, to: "pendente", note: "Solicitação criada automaticamente — Auditoria 2026.1" },
  { date: "27/03 10:30", user: "João Silva (Gestor)", from: "pendente", to: "em_andamento", note: "Atribuído para equipe financeira" },
  { date: "28/03 14:20", user: "Maria Santos (Operador)", from: "em_andamento", to: "em_revisao", note: "Documentação completa. 3 evidências anexadas." },
  { date: "28/03 16:45", user: "Carlos Pereira (Auditor)", from: "em_revisao", to: "devolvida", note: "Faltam comprovantes do mês de janeiro. Reenviar com documentação completa." },
  { date: "29/03 09:00", user: "Maria Santos (Operador)", from: "devolvida", to: "em_revisao", note: "Comprovantes de janeiro adicionados. Total: 5 evidências." },
  { date: "29/03 11:30", user: "Carlos Pereira (Auditor)", from: "em_revisao", to: "entregue", note: "Aprovado. Documentação completa e conforme." },
];

const TRANSITIONS: Record<string, Array<{ target: string; label: string; icon: React.ElementType; variant: string }>> = {
  pendente: [{ target: "em_andamento", label: "Iniciar Trabalho", icon: Send, variant: "default" }],
  em_andamento: [
    { target: "em_revisao", label: "Enviar p/ Revisão", icon: UserCheck, variant: "default" },
    { target: "cancelada", label: "Cancelar", icon: XCircle, variant: "destructive" },
  ],
  em_revisao: [
    { target: "entregue", label: "Aprovar", icon: CheckCircle, variant: "default" },
    { target: "devolvida", label: "Devolver", icon: RotateCcw, variant: "outline" },
    { target: "rejeitada", label: "Rejeitar", icon: XCircle, variant: "destructive" },
  ],
  devolvida: [{ target: "em_revisao", label: "Reenviar", icon: Send, variant: "default" }],
};

export default function StatusWorkflowPage() {
  const [currentStatus, setCurrentStatus] = useState("em_revisao");
  const st = STATUS_CONFIG[currentStatus];
  const actions = TRANSITIONS[currentStatus] ?? [];

  return (
    <SolutionLayout id="status-workflow-timeline" title="Status Machine + Audit Trail" source="auditoria-raiz" category="Workflow">
      <p className="mb-6 text-sm text-muted-foreground">
        State machine com role gates, 7 statuses, motivo obrigatório para rejeições, e audit trail visual.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Workflow Actions */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-muted-foreground">Solicitação #SOL-2026-0047</h3>
          <p className="mt-1 font-semibold">Demonstrações Contábeis — Balanço Patrimonial</p>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", st.bg, st.color)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", st.color.replace("text-", "bg-"))} />
              {st.label}
            </span>
          </div>

          {actions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {actions.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.target}
                    onClick={() => setCurrentStatus(a.target)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      a.variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
                      a.variant === "destructive" && "bg-red-500/10 text-red-400 hover:bg-red-500/20",
                      a.variant === "outline" && "border border-border hover:bg-accent",
                    )}
                  >
                    <Icon className="h-4 w-4" /> {a.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Status badges demo */}
          <div className="mt-6 border-t border-border pt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Todos os status:</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(STATUS_CONFIG).map(([key, s]) => (
                <button
                  key={key}
                  onClick={() => setCurrentStatus(key)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
                    s.bg, s.color,
                    currentStatus === key && "ring-1 ring-offset-1 ring-offset-background",
                    currentStatus === key && s.color.replace("text-", "ring-"),
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", s.color.replace("text-", "bg-"))} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-medium">Audit Trail</h3>
          <div className="relative ml-3 border-l border-border pl-6">
            {TIMELINE.map((entry, i) => {
              const toSt = STATUS_CONFIG[entry.to];
              const fromSt = entry.from ? STATUS_CONFIG[entry.from] : null;
              return (
                <div key={i} className="relative pb-6 last:pb-0">
                  <div className={cn(
                    "absolute -left-[calc(1.5rem+0.5px)] top-1 h-3 w-3 rounded-full border-2 border-background",
                    toSt.color.replace("text-", "bg-"),
                  )} />
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{entry.user}</p>
                    <p className="shrink-0 font-mono text-xs text-muted-foreground">{entry.date}</p>
                  </div>
                  {fromSt && (
                    <p className="mt-0.5 text-xs">
                      <span className={fromSt.color}>{fromSt.label}</span>
                      <span className="text-muted-foreground"> → </span>
                      <span className={toSt.color}>{toSt.label}</span>
                    </p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">{entry.note}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SolutionLayout>
  );
}
