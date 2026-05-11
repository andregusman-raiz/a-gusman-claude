"use client";

import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { Shield, AlertTriangle, CheckCircle, MessageSquare, FileText, ArrowRight } from "lucide-react";

const RISK_CATEGORIES = [
  { name: "Legal", score: 0.72, color: "bg-red-400" },
  { name: "Financeiro", score: 0.45, color: "bg-orange-400" },
  { name: "Operacional", score: 0.3, color: "bg-yellow-400" },
  { name: "Compliance", score: 0.6, color: "bg-purple-400" },
  { name: "Contraparte", score: 0.25, color: "bg-blue-400" },
  { name: "Estratégico", score: 0.15, color: "bg-teal-400" },
  { name: "Reputacional", score: 0.1, color: "bg-green-400" },
];

const ROUNDS = [
  { round: 1, action: "proposal", actor: "rAIz (interno)", content: "Proposta inicial com cláusula de reajuste anual pelo IGPM + 2%", date: "20/03" },
  { round: 2, action: "counter_proposal", actor: "Fornecedor (externo)", content: "Contraproposta: reajuste pelo IPCA + 3%, prazo de 36 meses", date: "22/03" },
  { round: 3, action: "comment", actor: "Jurídico (interno)", content: "IPCA + 3% é aceitável, mas prazo máximo deve ser 24 meses", date: "23/03" },
  { round: 4, action: "counter_proposal", actor: "rAIz (interno)", content: "Aceitar IPCA + 3%, prazo 24 meses, multa rescisória de 2 mensalidades", date: "24/03" },
  { round: 5, action: "accepted", actor: "Fornecedor (externo)", content: "Termos aceitos. Enviar para assinatura digital.", date: "25/03" },
];

const ACTION_STYLES: Record<string, { icon: typeof MessageSquare; color: string; bg: string }> = {
  proposal: { icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" },
  counter_proposal: { icon: ArrowRight, color: "text-orange-400", bg: "bg-orange-500/10" },
  comment: { icon: MessageSquare, color: "text-zinc-400", bg: "bg-zinc-500/10" },
  accepted: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
  rejected: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
};

export default function ContractLifecyclePage() {
  const overallScore = 0.48;
  return (
    <SolutionLayout id="contract-lifecycle" title="Negotiation Flow + Risk Matrix" source="raiz-platform" category="Workflow">
      <p className="mb-6 text-sm text-muted-foreground">
        Negociação → AI risk matrix 3×3 → 7 categorias de risco → rounds tipados → aprovação → assinatura.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Risk Analysis */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-medium"><Shield className="h-4 w-4 text-[var(--raiz-orange)]" /> AI Risk Analysis</div>

          {/* Overall score gauge */}
          <div className="mt-4 flex items-center gap-6">
            <div className="relative h-24 w-24">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--raiz-orange)" strokeWidth="8" strokeDasharray={`${overallScore * 251} 251`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold" style={{ color: "var(--raiz-orange)" }}>{Math.round(overallScore * 100)}</span>
                <span className="text-[9px] text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Risco Médio-Alto</p>
              <p className="text-xs text-muted-foreground">3 preocupações principais identificadas</p>
              <p className="text-xs text-muted-foreground">Confiança AI: 87%</p>
            </div>
          </div>

          {/* Category bars */}
          <div className="mt-4 space-y-2">
            {RISK_CATEGORIES.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3">
                <span className="w-24 text-xs text-muted-foreground">{cat.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full transition-all", cat.color)} style={{ width: `${cat.score * 100}%`, opacity: 0.7 }} />
                </div>
                <span className="w-8 text-right font-mono text-xs text-muted-foreground">{Math.round(cat.score * 100)}</span>
              </div>
            ))}
          </div>

          {/* Risk matrix 3x3 */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Matriz Impacto × Probabilidade</p>
            <div className="grid grid-cols-4 gap-px text-[9px]">
              <div />
              {["Baixo", "Médio", "Alto"].map((l) => <div key={l} className="text-center text-muted-foreground">{l}</div>)}
              {["Alto", "Médio", "Baixo"].map((impact, row) => (
                <>
                  <div key={`l-${row}`} className="flex items-center text-muted-foreground">{impact}</div>
                  {[0, 1, 2].map((col) => {
                    const risk = (row === 0 && col >= 1) || (row <= 1 && col === 2);
                    const hasItem = (row === 0 && col === 1) || (row === 1 && col === 2);
                    return (
                      <div key={`${row}-${col}`} className={cn("flex h-10 items-center justify-center rounded", risk ? "bg-red-500/10" : col + row >= 2 ? "bg-yellow-500/10" : "bg-green-500/10")}>
                        {hasItem && <div className="h-2.5 w-2.5 rounded-full bg-[var(--raiz-orange)]" />}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>

        {/* Negotiation Panel */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-medium">Negociação — Contrato Serviços TI</h3>
          <p className="mt-1 text-xs text-muted-foreground">5 rounds · Aceito em 25/03</p>

          <div className="mt-4 relative ml-3 border-l border-border pl-6 space-y-4">
            {ROUNDS.map((r) => {
              const style = ACTION_STYLES[r.action];
              const Icon = style.icon;
              return (
                <div key={r.round} className="relative">
                  <div className={cn("absolute -left-[calc(1.5rem+0.5px)] top-1 flex h-5 w-5 items-center justify-center rounded-full", style.bg)}>
                    <Icon className={cn("h-3 w-3", style.color)} />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{r.actor}</span>
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", style.bg, style.color)}>
                        {r.action.replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{r.date}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{r.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SolutionLayout>
  );
}
