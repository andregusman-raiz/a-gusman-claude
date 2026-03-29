"use client";

import { useState } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { Type, Image, BarChart3, Layout, Plus, ChevronLeft, ChevronRight, MessageSquare, Bold, Italic, List, AlignLeft, AlignCenter, Heading } from "lucide-react";

const SLIDES = [
  { id: 1, title: "Resultados 2026.1", blocks: ["text", "bullets"] },
  { id: 2, title: "Matrículas por Unidade", blocks: ["chart"] },
  { id: 3, title: "Próximos Passos", blocks: ["bullets", "image"] },
];

const BLOCK_TYPES = [
  { type: "text", icon: Type, label: "Texto" },
  { type: "bullets", icon: List, label: "Bullets" },
  { type: "image", icon: Image, label: "Imagem" },
  { type: "chart", icon: BarChart3, label: "Gráfico" },
  { type: "table", icon: Layout, label: "Tabela" },
];

export default function ContentStudioPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = SLIDES[activeSlide];

  return (
    <SolutionLayout id="content-studio-ai" title="Rich Content Studio" source="raiz-platform" category="AI">
      <p className="mb-6 text-sm text-muted-foreground">
        Tiptap editor + slide builder com typed blocks + image canvas + infográficos. AI chat side panel.
      </p>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Toolbar */}
        <div className="flex items-center gap-1 border-b border-border px-4 py-2">
          {[Bold, Italic, Heading, AlignLeft, AlignCenter, List].map((Icon, i) => (
            <button key={i} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><Icon className="h-4 w-4" /></button>
          ))}
          <div className="mx-2 h-4 w-px bg-border" />
          {BLOCK_TYPES.map((bt) => {
            const Icon = bt.icon;
            return (
              <button key={bt.type} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted" title={bt.label}>
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>

        <div className="flex h-[440px]">
          {/* Slide navigator */}
          <div className="w-36 shrink-0 border-r border-border bg-muted/20 p-2 space-y-2 overflow-y-auto">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveSlide(i)}
                className={cn(
                  "w-full rounded-lg border p-2 text-left transition-all",
                  i === activeSlide ? "border-[var(--raiz-orange)]/40 bg-[var(--raiz-orange)]/5 shadow-sm" : "border-border hover:border-[var(--raiz-orange)]/20",
                )}
              >
                <div className="flex aspect-[16/9] items-center justify-center rounded bg-background text-[8px] text-muted-foreground">
                  Slide {s.id}
                </div>
                <p className="mt-1 truncate text-[10px] font-medium">{s.title}</p>
              </button>
            ))}
            <button className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border py-3 text-xs text-muted-foreground hover:border-[var(--raiz-orange)]/30">
              <Plus className="h-3 w-3" /> Slide
            </button>
          </div>

          {/* Slide canvas */}
          <div className="flex flex-1 flex-col">
            <div className="flex-1 flex items-center justify-center bg-muted/10 p-8">
              <div className="aspect-[16/9] w-full max-w-xl rounded-lg border border-border bg-background p-8 shadow-lg">
                <h2 className="text-xl font-bold" style={{ color: "var(--raiz-orange)" }}>{slide.title}</h2>
                <div className="mt-4 space-y-3">
                  {slide.blocks.includes("text") && (
                    <p className="text-sm text-muted-foreground">Fechamos o primeiro semestre de 2026 com resultados expressivos em matrículas, retenção e satisfação dos pais.</p>
                  )}
                  {slide.blocks.includes("bullets") && (
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[var(--raiz-orange)]" /> 2.847 matrículas (+3,2%)</li>
                      <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[var(--raiz-orange)]" /> NPS pais: 78 (meta: 75)</li>
                      <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[var(--raiz-orange)]" /> Turnover: 2,4% (melhor histórico)</li>
                    </ul>
                  )}
                  {slide.blocks.includes("chart") && (
                    <div className="flex items-end gap-3 pt-4">
                      {[85, 62, 48, 35, 28].map((v, i) => (
                        <div key={i} className="flex flex-1 flex-col items-center gap-1">
                          <div className="w-full rounded-t" style={{ height: v * 1.2, backgroundColor: "var(--raiz-orange)", opacity: 0.6 + i * 0.05 }} />
                          <span className="text-[8px] text-muted-foreground">U{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {slide.blocks.includes("image") && (
                    <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
                      <Image className="mr-1 h-4 w-4" /> Imagem placeholder
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Speaker notes */}
            <div className="border-t border-border px-4 py-2">
              <p className="text-[10px] font-medium text-muted-foreground">Speaker Notes</p>
              <p className="mt-1 text-xs text-muted-foreground">Destacar o crescimento sustentável. Comparar com benchmark do setor educacional.</p>
            </div>
          </div>

          {/* AI chat panel */}
          <div className="w-56 shrink-0 border-l border-border bg-muted/20 p-3 flex flex-col">
            <div className="flex items-center gap-2 text-xs font-medium"><MessageSquare className="h-3.5 w-3.5 text-[var(--raiz-orange)]" /> AI Assistant</div>
            <div className="mt-3 flex-1 space-y-2 overflow-y-auto text-xs">
              <div className="rounded-lg bg-muted/30 p-2 text-muted-foreground">Sugiro adicionar um gráfico comparativo com o semestre anterior para reforçar o crescimento.</div>
              <div className="rounded-lg p-2" style={{ backgroundColor: "var(--raiz-orange)", color: "white", opacity: 0.8 }}>Gere bullet points com os 5 principais KPIs</div>
              <div className="rounded-lg bg-muted/30 p-2 text-muted-foreground">Aqui estão os 5 KPIs: matrículas, NPS, turnover, custo/aluno, inadimplência...</div>
            </div>
            <input className="mt-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs" placeholder="Pergunte ao AI..." />
          </div>
        </div>
      </div>
    </SolutionLayout>
  );
}
