"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertTriangle, Info, AlertCircle, Loader2 } from "lucide-react";

// ─── Toast (Sonner) ─────────────────────────────────────────────────────────
export function ToastPreview() {
  const [toasts, setToasts] = useState([
    { id: 1, type: "success", title: "Salvo com sucesso", desc: "Documento atualizado", visible: true },
    { id: 2, type: "error", title: "Erro ao enviar", desc: "Tente novamente em 30s", visible: true },
    { id: 3, type: "info", title: "Nova versão disponível", desc: "v2.4.1 — clique para atualizar", visible: true },
  ]);
  const icons = { success: CheckCircle, error: AlertCircle, info: Info, warning: AlertTriangle };
  const colors = { success: "text-green-400", error: "text-red-400", info: "text-blue-400", warning: "text-yellow-400" };

  return (
    <div className="flex flex-col items-end gap-2 p-4">
      <button onClick={() => setToasts(prev => [...prev, { id: Date.now(), type: "success", title: "Novo toast!", desc: "Criado agora", visible: true }])} className="mb-2 rounded-lg px-3 py-1.5 text-xs font-medium text-white" style={{ backgroundColor: "var(--raiz-orange)" }}>
        + Adicionar toast
      </button>
      {toasts.filter(t => t.visible).map(t => {
        const Icon = icons[t.type as keyof typeof icons];
        return (
          <div key={t.id} className="flex w-80 items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-lg animate-in slide-in-from-right">
            <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", colors[t.type as keyof typeof colors])} />
            <div className="flex-1">
              <p className="text-sm font-medium">{t.title}</p>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </div>
            <button onClick={() => setToasts(prev => prev.map(x => x.id === t.id ? { ...x, visible: false } : x))} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Alert Banner ───────────────────────────────────────────────────────────
export function AlertPreview() {
  const alerts = [
    { type: "info", icon: Info, title: "Informação", desc: "O sistema será atualizado amanhã às 6h.", color: "border-blue-500/20 bg-blue-500/5", iconColor: "text-blue-400" },
    { type: "success", icon: CheckCircle, title: "Sucesso", desc: "Matrícula confirmada com sucesso.", color: "border-green-500/20 bg-green-500/5", iconColor: "text-green-400" },
    { type: "warning", icon: AlertTriangle, title: "Atenção", desc: "Prazo de entrega de documentos expira em 3 dias.", color: "border-yellow-500/20 bg-yellow-500/5", iconColor: "text-yellow-400" },
    { type: "error", icon: AlertCircle, title: "Erro", desc: "Falha ao processar pagamento. Verifique os dados.", color: "border-red-500/20 bg-red-500/5", iconColor: "text-red-400" },
  ];
  return (
    <div className="space-y-3">
      {alerts.map(a => {
        const Icon = a.icon;
        return (
          <div key={a.type} className={cn("flex items-start gap-3 rounded-lg border p-3", a.color)}>
            <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", a.iconColor)} />
            <div><p className="text-sm font-semibold">{a.title}</p><p className="text-xs text-muted-foreground">{a.desc}</p></div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Modal / Dialog ─────────────────────────────────────────────────────────
export function ModalPreview() {
  const [open, setOpen] = useState(true);
  return (
    <div className="relative h-72 overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex h-full items-center justify-center">
        <button onClick={() => setOpen(true)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">Abrir modal</button>
      </div>
      {open && (
        <>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Confirmar exclusão</h3>
              <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted">Cancelar</button>
              <button onClick={() => setOpen(false)} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">Excluir</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Loading Spinner ────────────────────────────────────────────────────────
export function SpinnerPreview() {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs text-muted-foreground">Variações</p>
        <div className="flex items-center gap-6">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--raiz-orange)]" />
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-[var(--raiz-orange)]" />
          <div className="flex gap-1">{[0, 1, 2].map(i => <div key={i} className="h-3 w-3 animate-bounce rounded-full" style={{ backgroundColor: "var(--raiz-orange)", animationDelay: `${i * 0.15}s`, opacity: 0.5 + i * 0.2 }} />)}</div>
          <div className="relative h-8 w-8"><div className="absolute inset-0 animate-ping rounded-full bg-[var(--raiz-orange)] opacity-20" /><div className="absolute inset-2 rounded-full bg-[var(--raiz-orange)] opacity-60" /></div>
        </div>
      </div>
      <div>
        <p className="mb-3 text-xs text-muted-foreground">Tamanhos</p>
        <div className="flex items-end gap-4">
          {[4, 6, 8, 10, 12].map(s => <Loader2 key={s} className="animate-spin text-[var(--raiz-orange)]" style={{ width: s * 4, height: s * 4 }} />)}
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--raiz-orange)]" />
        <div><p className="text-sm font-medium">Processando...</p><p className="text-xs text-muted-foreground">Aguarde enquanto salvamos os dados</p></div>
      </div>
    </div>
  );
}
