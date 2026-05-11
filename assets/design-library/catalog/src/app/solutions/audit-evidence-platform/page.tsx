"use client";

import { useState } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";
import { Upload, FileCheck, AlertCircle, Clock, CheckCircle2, XCircle, Sparkles, FileText } from "lucide-react";

interface Evidence {
  id: string;
  name: string;
  status: "analyzing" | "approved" | "needs-revision" | "pending";
  aiScore: number | null;
  aiFeedback: string | null;
  uploadedAt: string;
}

interface ApprovalStep {
  label: string;
  status: "done" | "current" | "pending" | "rejected";
  actor: string;
  date: string | null;
  comment: string | null;
}

const evidences: Evidence[] = [
  { id: "1", name: "Laudo_Estrutural_Bloco_A.pdf", status: "approved", aiScore: 92, aiFeedback: "Documento completo. Todas as seções obrigatórias presentes. Assinatura do engenheiro verificada.", uploadedAt: "2026-03-25 14:30" },
  { id: "2", name: "Alvara_Funcionamento_2026.pdf", status: "approved", aiScore: 88, aiFeedback: "Alvará válido até 12/2026. CNPJ conferido. Atividades compatíveis com o cadastro.", uploadedAt: "2026-03-25 15:10" },
  { id: "3", name: "AVCB_Bombeiros.pdf", status: "needs-revision", aiScore: 45, aiFeedback: "ATENÇÃO: Documento vencido (validade: 01/2026). Necessário renovação urgente.", uploadedAt: "2026-03-26 09:00" },
  { id: "4", name: "Certificado_Acessibilidade.pdf", status: "analyzing", aiScore: null, aiFeedback: null, uploadedAt: "2026-03-27 08:45" },
];

const approvalSteps: ApprovalStep[] = [
  { label: "Upload de Evidências", status: "done", actor: "Maria Silva", date: "2026-03-25", comment: "4 documentos enviados" },
  { label: "Análise AI Automática", status: "done", actor: "Sistema AI", date: "2026-03-25", comment: "3/4 analisados. Score médio: 75" },
  { label: "Revisão do Coordenador", status: "current", actor: "Carlos Souza", date: null, comment: "Aguardando revisão do AVCB" },
  { label: "Aprovação Final", status: "pending", actor: "Diretoria", date: null, comment: null },
];

const statusConfig = {
  approved: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", label: "Aprovado" },
  "needs-revision": { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10", label: "Revisão" },
  analyzing: { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10", label: "Analisando..." },
  pending: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted", label: "Pendente" },
};

const stepStatusConfig = {
  done: { color: "bg-green-500", text: "text-green-500", ring: "ring-green-500/20" },
  current: { color: "bg-[var(--raiz-orange)]", text: "text-[var(--raiz-orange)]", ring: "ring-[var(--raiz-orange)]/20" },
  pending: { color: "bg-muted-foreground/30", text: "text-muted-foreground", ring: "" },
  rejected: { color: "bg-red-500", text: "text-red-500", ring: "ring-red-500/20" },
};

export default function AuditEvidencePlatformPage() {
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>("3");
  const selected = evidences.find((e) => e.id === selectedEvidence);
  const overallScore = Math.round(evidences.filter((e) => e.aiScore !== null).reduce((sum, e) => sum + e.aiScore!, 0) / evidences.filter((e) => e.aiScore !== null).length);

  return (
    <SolutionLayout id="audit-evidence-platform" title="Evidence Audit + AI Analysis" source="Salvaguarda-next" category="Workflow">
      <p className="mb-6 text-sm text-muted-foreground">
        Upload de evidências com análise AI de qualidade, cadeia de aprovação multi-etapa, geração PDF assíncrona, e score de compliance.
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Evidence list */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Evidências ({evidences.length})</h3>

          {/* Upload zone */}
          <div className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-muted-foreground transition-colors hover:border-[var(--raiz-orange)]/50 hover:text-[var(--raiz-orange)]">
            <Upload className="h-4 w-4" />
            <span className="text-xs">Arraste ou clique para enviar</span>
          </div>

          {evidences.map((ev) => {
            const cfg = statusConfig[ev.status];
            const Icon = cfg.icon;
            return (
              <button key={ev.id} onClick={() => setSelectedEvidence(ev.id)}
                className={`w-full rounded-lg border p-3 text-left transition-all ${selectedEvidence === ev.id ? "border-[var(--raiz-orange)] bg-[var(--raiz-orange)]/5" : "border-border hover:border-border/80"}`}>
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{ev.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>
                        <Icon className="h-2.5 w-2.5" /> {cfg.label}
                      </span>
                      {ev.aiScore !== null && (
                        <span className={`text-[10px] font-mono ${ev.aiScore >= 80 ? "text-green-500" : ev.aiScore >= 60 ? "text-amber-500" : "text-red-500"}`}>
                          AI: {ev.aiScore}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* AI Analysis panel */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-purple-400" /> Análise AI
          </h3>

          {selected ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium">{selected.name}</p>

              {selected.aiScore !== null ? (
                <>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="relative h-16 w-16">
                      <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="3" />
                        <circle cx="18" cy="18" r="16" fill="none"
                          stroke={selected.aiScore >= 80 ? "#22c55e" : selected.aiScore >= 60 ? "#eab308" : "#ef4444"}
                          strokeWidth="3" strokeDasharray={`${selected.aiScore} 100`} strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{selected.aiScore}</span>
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${selected.aiScore >= 80 ? "text-green-500" : selected.aiScore >= 60 ? "text-amber-500" : "text-red-500"}`}>
                        {selected.aiScore >= 80 ? "Aprovado" : selected.aiScore >= 60 ? "Revisão Necessária" : "Crítico"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Score de conformidade</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-muted/30 p-3">
                    <p className="text-xs leading-relaxed text-muted-foreground">{selected.aiFeedback}</p>
                  </div>
                </>
              ) : (
                <div className="mt-4 flex flex-col items-center gap-2 py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                  <p className="text-xs text-muted-foreground">Analisando documento...</p>
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-blue-400" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
              Selecione uma evidência
            </div>
          )}

          {/* Overall compliance */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">Score Geral de Compliance</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${overallScore >= 80 ? "text-green-500" : "text-amber-500"}`}>{overallScore}%</span>
              <span className="text-xs text-muted-foreground">({evidences.filter((e) => e.status === "approved").length}/{evidences.length} aprovados)</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${overallScore}%` }} />
            </div>
          </div>
        </div>

        {/* Approval chain */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Cadeia de Aprovação</h3>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="relative space-y-6">
              {approvalSteps.map((step, i) => {
                const cfg = stepStatusConfig[step.status];
                return (
                  <div key={i} className="relative flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full ${cfg.color} ${cfg.ring ? `ring-4 ${cfg.ring}` : ""}`} />
                      {i < approvalSteps.length - 1 && (
                        <div className={`h-full w-0.5 ${step.status === "done" ? "bg-green-500/30" : "bg-border"}`} />
                      )}
                    </div>
                    <div className="-mt-0.5 flex-1 pb-4">
                      <p className={`text-xs font-semibold ${cfg.text}`}>{step.label}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{step.actor}</p>
                      {step.date && <p className="text-[10px] text-muted-foreground/50">{step.date}</p>}
                      {step.comment && (
                        <p className="mt-1 rounded bg-muted/30 p-1.5 text-[10px] text-muted-foreground">{step.comment}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button className="w-full rounded-lg px-4 py-2 text-xs font-semibold text-white" style={{ backgroundColor: "var(--raiz-orange)" }}>
            Gerar Relatório PDF
          </button>
        </div>
      </div>
    </SolutionLayout>
  );
}
