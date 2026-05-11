"use client";

import { useState, useEffect } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";

export default function TvRealtimeCounterPage() {
  const [count, setCount] = useState(2841);
  const [celebrating, setCelebrating] = useState(false);
  const target = 3000;
  const pct = (count / target) * 100;

  useEffect(() => {
    const id = setInterval(() => {
      setCount((prev) => {
        const next = prev + Math.floor(Math.random() * 3);
        if (next % 50 === 0 && next !== prev) setCelebrating(true);
        return Math.min(next, target);
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (celebrating) {
      const t = setTimeout(() => setCelebrating(false), 2000);
      return () => clearTimeout(t);
    }
  }, [celebrating]);

  return (
    <SolutionLayout id="tv-realtime-counter" title="Fullscreen Counter Display" source="cmef-contador-matriculas" category="Data Display">
      <p className="mb-6 text-sm text-muted-foreground">
        Fullscreen TV display. Contador gigante (18rem), SVG progress ring, rocket + confetti em milestones. Polling 5s.
      </p>

      {/* TV Preview */}
      <div className={`relative overflow-hidden rounded-xl border border-border bg-zinc-950 transition-transform ${celebrating ? "animate-pulse" : ""}`}>
        <div className="flex flex-col items-center justify-center py-16">
          {/* Progress ring */}
          <div className="relative">
            <svg className="h-64 w-64 -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="85" fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="12" />
              <circle
                cx="100" cy="100" r="85" fill="none"
                stroke="var(--raiz-orange)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${pct * 5.34} 534`}
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-7xl font-black tabular-nums tracking-tight" style={{ color: "var(--raiz-orange)" }}>
                {count.toLocaleString()}
              </span>
              <span className="mt-1 text-lg text-zinc-500">matrículas 2026</span>
            </div>
          </div>

          {/* Meta */}
          <div className="mt-6 flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-zinc-600">Meta</p>
              <p className="text-xl font-bold text-zinc-400">{target.toLocaleString()}</p>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="text-center">
              <p className="text-xs text-zinc-600">Progresso</p>
              <p className="text-xl font-bold" style={{ color: "var(--raiz-orange)" }}>{pct.toFixed(1)}%</p>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="text-center">
              <p className="text-xs text-zinc-600">Faltam</p>
              <p className="text-xl font-bold text-zinc-400">{(target - count).toLocaleString()}</p>
            </div>
          </div>

          {/* Rocket animation zone */}
          {celebrating && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <span className="text-6xl animate-bounce">🚀</span>
              {Array.from({ length: 20 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute text-2xl"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`,
                    animationDelay: `${i * 0.1}s`,
                    animation: "ping 1s ease-out forwards",
                    opacity: 0.8,
                  }}
                >
                  {["🎉", "🎊", "⭐", "✨"][i % 4]}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 bg-zinc-900/50 px-4 py-2 text-center text-[10px] text-zinc-600">
          Polling TOTVS API a cada 5 segundos · font-size: 18rem no real · CSS animations (zero JS libs) · Pure HTML/CSS/JS
        </div>
      </div>
    </SolutionLayout>
  );
}
