"use client";

import { useState } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, Send, Clock, CheckCircle, AlertCircle, Edit3 } from "lucide-react";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", limit: 2200, color: "bg-pink-500" },
  { id: "linkedin", label: "LinkedIn", limit: 3000, color: "bg-blue-600" },
  { id: "twitter", label: "Twitter/X", limit: 280, color: "bg-zinc-700" },
  { id: "facebook", label: "Facebook", limit: 63206, color: "bg-blue-500" },
  { id: "tiktok", label: "TikTok", limit: 2200, color: "bg-zinc-900" },
];

const DAYS = Array.from({ length: 35 }, (_, i) => {
  const day = i - 5;
  return { num: day > 0 && day <= 31 ? day : null, posts: day === 3 ? [{ platform: "instagram", status: "published" }] : day === 7 ? [{ platform: "linkedin", status: "scheduled" }, { platform: "twitter", status: "draft" }] : day === 12 ? [{ platform: "instagram", status: "pending_approval" }] : day === 15 ? [{ platform: "facebook", status: "failed" }] : day === 20 ? [{ platform: "linkedin", status: "scheduled" }] : [] };
});

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-400", pending_approval: "bg-yellow-400", scheduled: "bg-blue-400", published: "bg-green-400", failed: "bg-red-400",
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-pink-500", linkedin: "bg-blue-600", twitter: "bg-zinc-600", facebook: "bg-blue-500",
};

export default function SocialMediaPublisherPage() {
  const [content, setContent] = useState("Novas vagas abertas para o ano letivo 2027! Garanta a matrícula do seu filho na melhor escola da região.");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(["instagram", "linkedin"]));

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeLimit = Math.min(...PLATFORMS.filter((p) => selectedPlatforms.has(p.id)).map((p) => p.limit));
  const pct = Math.round((content.length / activeLimit) * 100);

  return (
    <SolutionLayout id="social-media-publisher" title="Content Calendar + Composer" source="raiz-platform" category="Tools">
      <p className="mb-6 text-sm text-muted-foreground">
        Calendário mensal com post pills + compositor com char limits por plataforma (mais restritivo prevalece).
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Calendar */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <button className="rounded-md p-1 text-muted-foreground hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm font-semibold">Março 2026</span>
            <button className="rounded-md p-1 text-muted-foreground hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs text-muted-foreground border-b border-border">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {DAYS.map((day, i) => (
              <div key={i} className={cn("min-h-[72px] border-b border-r border-border p-1.5 text-xs", !day.num && "bg-muted/20")}>
                {day.num && <span className="text-muted-foreground">{day.num}</span>}
                <div className="mt-1 space-y-0.5">
                  {day.posts.map((p, j) => (
                    <div key={j} className="flex items-center gap-1">
                      <span className={cn("h-1.5 w-1.5 rounded-full", PLATFORM_COLORS[p.platform])} />
                      <span className={cn("h-1 w-4 rounded-full", STATUS_COLORS[p.status])} />
                    </div>
                  ))}
                </div>
                {day.num && day.posts.length === 0 && (
                  <button className="mt-2 flex h-5 w-5 items-center justify-center rounded border border-dashed border-border opacity-0 transition-opacity hover:border-[var(--raiz-orange)]/40 group-hover:opacity-100">
                    <Plus className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 border-t border-border px-4 py-2">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className={cn("h-2 w-2 rounded-full", color)} />
                {status.replace("_", " ")}
              </div>
            ))}
          </div>
        </div>

        {/* Post Composer */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="flex items-center gap-2 text-sm font-medium"><Edit3 className="h-4 w-4 text-[var(--raiz-orange)]" /> Novo Post</h3>

          {/* Platforms */}
          <div className="mt-3">
            <p className="mb-1.5 text-xs text-muted-foreground">Plataformas</p>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    selectedPlatforms.has(p.id) ? "bg-[var(--raiz-orange)]/15 text-[var(--raiz-orange)]" : "bg-muted text-muted-foreground",
                  )}
                >
                  {p.label} <span className="opacity-50">({p.limit})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Conteúdo</p>
              <span className={cn("text-xs font-mono", pct > 90 ? "text-red-400" : pct > 70 ? "text-yellow-400" : "text-muted-foreground")}>
                {content.length}/{activeLimit}
              </span>
            </div>
            <textarea
              className="mt-1 w-full rounded-md border border-border bg-background p-3 text-sm"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={activeLimit}
            />
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full transition-all", pct > 90 ? "bg-red-400" : pct > 70 ? "bg-yellow-400" : "bg-[var(--raiz-orange)]")} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">Limite mais restritivo: {PLATFORMS.find((p) => p.limit === activeLimit)?.label}</p>
          </div>

          {/* Schedule */}
          <div className="mt-3">
            <p className="mb-1.5 text-xs text-muted-foreground">Agendar</p>
            <input type="datetime-local" className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm" defaultValue="2026-03-28T09:00" />
          </div>

          {/* Approval */}
          <label className="mt-3 flex items-center gap-2 text-xs">
            <div className="h-4 w-4 rounded border border-[var(--raiz-orange)] bg-[var(--raiz-orange)]">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
            </div>
            Requer aprovação
          </label>

          <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: "var(--raiz-orange)" }}>
            <Send className="h-4 w-4" /> Agendar Post
          </button>
        </div>
      </div>
    </SolutionLayout>
  );
}
