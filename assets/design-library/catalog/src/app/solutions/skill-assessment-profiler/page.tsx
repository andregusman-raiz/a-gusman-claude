"use client";

import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { Target, Brain, FileText, Printer } from "lucide-react";

const SKILLS = [
  { name: "Comunicação", value: 78, median: 65 },
  { name: "Liderança", value: 85, median: 60 },
  { name: "Colaboração", value: 72, median: 70 },
  { name: "Resiliência", value: 90, median: 55 },
  { name: "Criatividade", value: 65, median: 68 },
  { name: "Empatia", value: 88, median: 62 },
  { name: "Organização", value: 70, median: 72 },
  { name: "Pensamento Crítico", value: 82, median: 58 },
];

const COGNITIVE = [
  { cat: "Verbal", score: 85, median: 70 },
  { cat: "Numérico", score: 72, median: 68 },
  { cat: "Abstrato", score: 90, median: 65 },
  { cat: "Espacial", score: 65, median: 60 },
  { cat: "Memória", score: 78, median: 72 },
];

function RadarChart() {
  const cx = 120, cy = 120, r = 90;
  const n = SKILLS.length;
  const points = SKILLS.map((s, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const dist = (s.value / 100) * r;
    return { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist };
  });
  const medianPoints = SKILLS.map((s, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const dist = (s.median / 100) * r;
    return { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist };
  });

  return (
    <svg viewBox="0 0 240 240" className="h-full w-full">
      {/* Grid circles */}
      {[25, 50, 75, 100].map((pct) => (
        <circle key={pct} cx={cx} cy={cy} r={(pct / 100) * r} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.5" />
      ))}
      {/* Axis lines */}
      {SKILLS.map((_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(angle) * r} y2={cy + Math.sin(angle) * r} stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.5" />;
      })}
      {/* Median polygon */}
      <polygon points={medianPoints.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="4 4" />
      {/* Value polygon */}
      <polygon points={points.map((p) => `${p.x},${p.y}`).join(" ")} fill="var(--raiz-orange)" fillOpacity="0.15" stroke="var(--raiz-orange)" strokeWidth="1.5" />
      {/* Dots + labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="var(--raiz-orange)" />
          <text
            x={cx + Math.cos((Math.PI * 2 * i) / n - Math.PI / 2) * (r + 15)}
            y={cy + Math.sin((Math.PI * 2 * i) / n - Math.PI / 2) * (r + 15)}
            textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="currentColor" fillOpacity="0.5"
          >
            {SKILLS[i].name}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function SkillAssessmentPage() {
  return (
    <SolutionLayout id="skill-assessment-profiler" title="Radar Chart + Profile Report" source="skillcert-raiz" category="Data Display">
      <p className="mb-6 text-sm text-muted-foreground">
        Radar chart SVG custom (15 skills) + bar chart com median line + AI narrative report (Gemini).
      </p>

      {/* Hero */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-zinc-900 to-zinc-800 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold" style={{ backgroundColor: "var(--raiz-orange)", color: "white" }}>AG</div>
          <div>
            <h2 className="text-xl font-bold">André Gusman</h2>
            <p className="text-sm text-muted-foreground">Avaliação Socioemocional + Cognitiva — Mar 2026</p>
          </div>
          <div className="ml-auto flex gap-3">
            {[{ label: "Score Geral", value: "82", color: "var(--raiz-orange)" }, { label: "Percentil", value: "P91", color: "var(--raiz-teal)" }, { label: "Nível", value: "Avançado", color: "#2D9E6B" }].map((m) => (
              <div key={m.label} className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-center">
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                <p className="text-lg font-bold" style={{ color: m.color }}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Radar chart */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium"><Target className="h-4 w-4 text-[var(--raiz-orange)]" /> Competências Socioemocionais</div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-6 rounded" style={{ backgroundColor: "var(--raiz-orange)", opacity: 0.4 }} /> Aluno</span>
              <span className="flex items-center gap-1"><span className="h-0 w-6 border-t border-dashed border-muted-foreground" /> Mediana</span>
            </div>
          </div>
          <div className="h-64">
            <RadarChart />
          </div>
        </div>

        {/* Bar chart */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium"><Brain className="h-4 w-4 text-[var(--raiz-teal)]" /> Performance Cognitiva</div>
          <div className="mt-4 space-y-3">
            {COGNITIVE.map((c) => (
              <div key={c.cat}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{c.cat}</span>
                  <span className="font-mono">{c.score}</span>
                </div>
                <div className="relative mt-1 h-5 overflow-hidden rounded-md bg-muted">
                  <div className="h-full rounded-md" style={{ width: `${c.score}%`, backgroundColor: "var(--raiz-teal)", opacity: 0.6 }} />
                  <div className="absolute top-0 h-full w-px bg-muted-foreground/50" style={{ left: `${c.median}%` }} title={`Mediana: ${c.median}`} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">Linha tracejada = mediana da turma</p>
        </div>
      </div>

      {/* AI Report */}
      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4 text-[var(--raiz-orange)]" /> Relatório Narrativo AI</div>
          <button className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"><Printer className="h-3 w-3" /> Imprimir</button>
        </div>
        <div className="mt-3 rounded-lg bg-muted/20 p-4 text-sm text-muted-foreground leading-relaxed">
          <p>André demonstra um perfil socioemocional <strong className="text-foreground">acima da média</strong> em praticamente todas as dimensões avaliadas. Destaque para <strong className="text-foreground">Resiliência (90)</strong> e <strong className="text-foreground">Empatia (88)</strong>, ambas significativamente acima da mediana da turma.</p>
          <p className="mt-2">No aspecto cognitivo, <strong className="text-foreground">Raciocínio Abstrato (90)</strong> é o ponto mais forte, sugerindo facilidade com resolução de problemas complexos e pensamento conceitual.</p>
          <p className="mt-2">Área de desenvolvimento: <strong className="text-foreground">Criatividade (65)</strong> ficou abaixo da mediana (68). Recomenda-se atividades de estimulação criativa e projetos abertos.</p>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">Gerado por Gemini · Modelo: gemini-2.5-flash · Confiança: 92%</p>
      </div>
    </SolutionLayout>
  );
}
