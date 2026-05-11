"use client";

import { useState } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Share2 } from "lucide-react";

const PAGES = Array.from({ length: 8 }, (_, i) => ({
  num: i + 1,
  color: ["bg-orange-900/30", "bg-teal-900/30", "bg-blue-900/30", "bg-purple-900/30", "bg-pink-900/30", "bg-amber-900/30", "bg-cyan-900/30", "bg-green-900/30"][i],
  title: ["Capa", "Sumário", "Capítulo 1", "Capítulo 2", "Capítulo 3", "Galeria", "Contato", "Contracapa"][i],
}));

export default function PageflipPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);

  return (
    <SolutionLayout id="pageflip-3d" title="Document Viewer 3D" source="fliphtml-raiz" category="Media">
      <p className="mb-6 text-sm text-muted-foreground">
        page-flip library via dynamic import. Spread (desktop) / portrait (mobile). Zoom, fullscreen, analytics beacon.
      </p>

      <div className="overflow-hidden rounded-xl border border-border bg-zinc-950">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
          <span className="text-sm font-medium">Catálogo Raiz 2026</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800"><ZoomOut className="h-4 w-4" /></button>
            <span className="w-12 text-center text-xs text-zinc-400">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(2, zoom + 0.25))} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800"><ZoomIn className="h-4 w-4" /></button>
            <div className="mx-1 h-4 w-px bg-zinc-800" />
            <button className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800"><Maximize2 className="h-4 w-4" /></button>
            <button className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800"><Share2 className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Book viewer */}
        <div className="flex items-center justify-center py-8" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
          <button onClick={() => setCurrentPage(Math.max(0, currentPage - 2))} disabled={currentPage === 0} className="rounded-full p-2 text-zinc-500 hover:bg-zinc-800 disabled:opacity-20">
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Spread pages */}
          <div className="flex" style={{ perspective: "1200px" }}>
            {[currentPage, currentPage + 1].map((pi) => {
              const page = PAGES[pi];
              if (!page) return <div key={pi} className="h-64 w-48" />;
              return (
                <div
                  key={pi}
                  className={cn(
                    "flex h-64 w-48 flex-col items-center justify-center border border-zinc-800 text-zinc-400 transition-transform duration-500",
                    page.color,
                    pi === currentPage ? "rounded-l-md origin-right" : "rounded-r-md origin-left",
                  )}
                  style={{ boxShadow: pi === currentPage ? "inset -2px 0 8px rgba(0,0,0,0.3)" : "inset 2px 0 8px rgba(0,0,0,0.3)" }}
                >
                  <span className="text-2xl font-bold opacity-20">{page.num}</span>
                  <span className="mt-2 text-sm">{page.title}</span>
                </div>
              );
            })}
          </div>

          <button onClick={() => setCurrentPage(Math.min(PAGES.length - 2, currentPage + 2))} disabled={currentPage >= PAGES.length - 2} className="rounded-full p-2 text-zinc-500 hover:bg-zinc-800 disabled:opacity-20">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Thumbnails */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-zinc-800 px-4 py-2">
          {PAGES.map((p, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i % 2 === 0 ? i : i - 1)}
              className={cn(
                "flex h-10 w-7 shrink-0 items-center justify-center rounded text-[9px] font-bold transition-all",
                p.color,
                (i === currentPage || i === currentPage + 1) ? "ring-2 ring-orange-500 scale-110" : "opacity-50 hover:opacity-80",
              )}
            >
              {p.num}
            </button>
          ))}
        </div>
      </div>
    </SolutionLayout>
  );
}
