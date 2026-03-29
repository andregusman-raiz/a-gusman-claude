"use client";

import { useState } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { Search, ChevronUp, ChevronDown, Edit3, Check, Mic } from "lucide-react";

const SPEAKERS = [
  { id: "s1", name: "André Gusman", color: "bg-orange-400" },
  { id: "s2", name: "Maria Santos", color: "bg-teal-400" },
  { id: "s3", name: "Carlos Pereira", color: "bg-blue-400" },
];

const SEGMENTS = [
  { speaker: "s1", start: 0, end: 15, text: "Bom dia a todos. Vamos começar a reunião de planejamento do semestre. Maria, pode nos atualizar sobre as matrículas?" },
  { speaker: "s2", start: 16, end: 42, text: "Claro. Fechamos março com 2.847 alunos matriculados, um crescimento de 3,2% em relação ao mesmo período do ano passado. A meta era 2.800, então superamos." },
  { speaker: "s1", start: 43, end: 58, text: "Excelente. E quanto ao financeiro? Carlos, como estamos em relação ao orçamento?" },
  { speaker: "s3", start: 59, end: 89, text: "O custo da folha está em R$ 4,2 milhões, 8% acima do orçado. O principal fator é o reajuste coletivo que veio acima do esperado. Precisamos revisar o orçamento do segundo semestre." },
  { speaker: "s1", start: 90, end: 105, text: "Entendido. Vamos agendar uma revisão orçamentária para a próxima semana. Maria, pode preparar os números de projeção?" },
  { speaker: "s2", start: 106, end: 120, text: "Sim, preparo até sexta. Vou incluir cenários otimista e pessimista para as matrículas do segundo semestre." },
];

const SUMMARY_FORMATS = ["Ata", "Executivo", "Decisões", "Pedagógico", "Comercial"];

const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function MeetingTranscriptPage() {
  const [activeFormat, setActiveFormat] = useState("Ata");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <SolutionLayout id="meeting-transcript-ai" title="Speaker Timeline + AI Summary" source="raiz-platform" category="AI">
      <p className="mb-6 text-sm text-muted-foreground">
        Audio → transcrição → timeline por speaker (8 cores) → AI summary em 5 formatos com auto-detecção.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Transcript Timeline */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-[var(--raiz-orange)]" />
              <span className="text-sm font-medium">Transcrição</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{SEGMENTS.length} segmentos</span>
            </div>
            <div className="relative flex items-center gap-1">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <input className="h-7 w-36 rounded border border-border bg-background pl-6 pr-2 text-xs" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <button className="rounded p-0.5 text-muted-foreground hover:bg-muted"><ChevronUp className="h-3 w-3" /></button>
              <button className="rounded p-0.5 text-muted-foreground hover:bg-muted"><ChevronDown className="h-3 w-3" /></button>
            </div>
          </div>

          {/* Speaker legend */}
          <div className="flex gap-3 border-b border-border px-4 py-2">
            {SPEAKERS.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5 text-xs">
                <span className={cn("h-2.5 w-2.5 rounded-full", s.color)} />
                <span className="text-muted-foreground">{s.name}</span>
              </div>
            ))}
          </div>

          {/* Segments */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-border/50">
            {SEGMENTS.map((seg, i) => {
              const speaker = SPEAKERS.find((s) => s.id === seg.speaker)!;
              const highlighted = searchQuery && seg.text.toLowerCase().includes(searchQuery.toLowerCase());
              return (
                <div key={i} className={cn("group flex gap-3 px-4 py-3 transition-colors hover:bg-muted/20", highlighted && "bg-yellow-500/5")}>
                  <div className="flex shrink-0 flex-col items-center gap-1">
                    <span className={cn("h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white", speaker.color)}>
                      {speaker.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground cursor-pointer hover:text-[var(--raiz-orange)]">{fmtTime(seg.start)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{speaker.name}</span>
                      <span className="text-[10px] text-muted-foreground">{fmtTime(seg.start)} – {fmtTime(seg.end)}</span>
                      <button className="ml-auto rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted">
                        <Edit3 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{seg.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Panel */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-medium">Resumo AI</span>
            <div className="flex items-center gap-1">
              {SUMMARY_FORMATS.map((fmt) => (
                <button key={fmt} onClick={() => setActiveFormat(fmt)} className={cn("rounded-md px-2 py-1 text-[10px] font-medium", activeFormat === fmt ? "bg-[var(--raiz-orange)]/10 text-[var(--raiz-orange)]" : "text-muted-foreground hover:bg-muted")}>
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 space-y-4">
            {activeFormat === "Ata" && <>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">TÍTULO</p>
                <p className="mt-1 text-sm font-medium">Reunião de Planejamento — Semestre 2026.2</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">DATA</p>
                <p className="mt-1 text-sm">27 de março de 2026, 14h00</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">PARTICIPANTES</p>
                <div className="mt-1 flex gap-1.5">
                  {SPEAKERS.map((s) => (
                    <span key={s.id} className="rounded-full bg-muted px-2 py-0.5 text-xs">{s.name}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">DELIBERAÇÕES</p>
                <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" /> Matrículas superaram meta: 2.847 vs 2.800 (+3,2%)</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" /> Custo folha 8% acima do orçado — reajuste coletivo</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" /> Revisão orçamentária agendada para próxima semana</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">PRÓXIMOS PASSOS</p>
                <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                  <li>1. Maria prepara projeções (cenários) até sexta-feira</li>
                  <li>2. Reunião de revisão orçamentária na próxima semana</li>
                </ul>
              </div>
            </>}
            {activeFormat !== "Ata" && (
              <div className="rounded-lg border border-dashed border-border py-12 text-center text-muted-foreground">
                <p className="text-sm">Formato: <span className="font-medium text-[var(--raiz-orange)]">{activeFormat}</span></p>
                <p className="mt-1 text-xs">Type guard auto-detecta formato → renderizador polimórfico</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SolutionLayout>
  );
}
