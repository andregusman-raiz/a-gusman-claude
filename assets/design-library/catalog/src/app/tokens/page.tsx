"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowLeft, Sun, Moon, Copy, Check } from "lucide-react";
import { useState } from "react";

// ─── Data ───────────────────────────────────────────────────────────────────

const BRAND_COLORS = [
  { name: "Raiz Orange", hex: "#F7941D", var: "--raiz-orange", usage: "CTA, active state, badges, accents" },
  { name: "Raiz Orange Dark", hex: "#D97B10", var: "--raiz-orange-dark", usage: "Hover, pressed" },
  { name: "Raiz Orange Light", hex: "#FDE8C8", var: "--raiz-orange-light", usage: "Background tint alerts" },
  { name: "Raiz Teal", hex: "#5BB5A2", var: "--raiz-teal", usage: "Accent, secondary" },
  { name: "Raiz Teal Dark", hex: "#3D9A87", var: "--raiz-teal-dark", usage: "Hover teal" },
  { name: "Raiz Teal Light", hex: "#D4EFE9", var: "--raiz-teal-light", usage: "Background tint info" },
];

const SEMANTIC_COLORS = [
  { name: "Background", hex: "#F8F9FA", hexDark: "#0a0a0a", usage: "App background" },
  { name: "Surface", hex: "#FFFFFF", hexDark: "#1a1a1a", usage: "Cards, panels" },
  { name: "Foreground", hex: "#1A202C", hexDark: "#fafafa", usage: "Text primary" },
  { name: "Muted", hex: "#718096", hexDark: "#a1a1aa", usage: "Text secondary" },
  { name: "Border", hex: "#E2E8F0", hexDark: "rgba(255,255,255,0.1)", usage: "Borders, dividers" },
  { name: "Sidebar", hex: "#1E2433", hexDark: "#1a1a1a", usage: "Sidebar background" },
];

const STATUS_COLORS = [
  { name: "Success", hex: "#2D9E6B", usage: "Confirmations, active" },
  { name: "Warning", hex: "#E8A820", usage: "Alerts, limits" },
  { name: "Danger", hex: "#DC3545", usage: "Errors, deletions" },
  { name: "Info", hex: "#3B82F6", usage: "Neutral metrics" },
];

const TYPOGRAPHY = [
  { token: "text-xs", size: "10-11px", weight: "400-600", lh: "1.4-1.5", usage: "Labels, micro-copy" },
  { token: "text-sm", size: "13-14px", weight: "400-500", lh: "1.5", usage: "Nav items, body compact" },
  { token: "text-base", size: "16px", weight: "400-500", lh: "1.6", usage: "Body standard, form labels" },
  { token: "text-xl", size: "20px", weight: "600", lh: "1.3", usage: "Page titles (h1)" },
  { token: "text-2xl", size: "24px", weight: "700", lh: "1.2", usage: "Section titles" },
  { token: "text-[30px]", size: "30px", weight: "700", lh: "1.0", usage: "Large KPI values" },
];

const SPACING = [
  { token: "0.5", px: "2px", usage: "Icon-text gap inline" },
  { token: "1", px: "4px", usage: "Compact element gaps" },
  { token: "2", px: "8px", usage: "Chips, badges padding" },
  { token: "3", px: "12px", usage: "Nav item padding" },
  { token: "4", px: "16px", usage: "Card content (standard)" },
  { token: "5", px: "20px", usage: "Card header" },
  { token: "6", px: "24px", usage: "Section gaps" },
  { token: "8", px: "32px", usage: "Large block gaps" },
];

const RADII = [
  { token: "--radius-sm", px: "4.8px", usage: "Chips, badges, inputs" },
  { token: "--radius-md", px: "6.4px", usage: "Buttons" },
  { token: "--radius-lg", px: "8px", usage: "Cards (standard)" },
  { token: "--radius-xl", px: "11.2px", usage: "Highlight cards" },
  { token: "--radius-2xl", px: "14.4px", usage: "Modals" },
];

// ─── Components ─────────────────────────────────────────────────────────────

function ColorSwatch({ name, hex, usage, cssVar }: { name: string; hex: string; usage: string; cssVar?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-[var(--raiz-orange)]/30">
      <div className="h-10 w-10 shrink-0 rounded-lg shadow-sm" style={{ backgroundColor: hex }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{name}</p>
          {cssVar && <code className="text-[10px] text-muted-foreground">{cssVar}</code>}
        </div>
        <p className="text-xs text-muted-foreground">{usage}</p>
      </div>
      <button onClick={copy} className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted">
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <code className="shrink-0 font-mono text-xs text-muted-foreground">{hex}</code>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function TokensPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Catálogo
          </Link>
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-lg font-semibold">Design Tokens</h1>
            <p className="text-xs text-muted-foreground">Paleta, tipografia, spacing, radii — rAIz Educação</p>
          </div>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="ml-auto rounded-lg border border-border p-1.5 hover:bg-accent">
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-10">
        {/* Brand colors */}
        <section>
          <h2 className="text-xl font-bold">Cores da Marca</h2>
          <p className="mt-1 text-sm text-muted-foreground">Orange (primária) + Teal (secundária). Clique para copiar hex.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {BRAND_COLORS.map((c) => (
              <ColorSwatch key={c.name} name={c.name} hex={c.hex} usage={c.usage} cssVar={c.var} />
            ))}
          </div>
          {/* Live swatch bar */}
          <div className="mt-4 flex h-12 overflow-hidden rounded-lg">
            {BRAND_COLORS.map((c) => (
              <div key={c.hex} className="flex-1" style={{ backgroundColor: c.hex }} title={c.name} />
            ))}
          </div>
        </section>

        {/* Semantic colors */}
        <section>
          <h2 className="text-xl font-bold">Cores Semânticas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ajustam entre light e dark mode automaticamente.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {SEMANTIC_COLORS.map((c) => (
              <div key={c.name} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                <div className="flex gap-1">
                  <div className="h-10 w-10 rounded-l-lg border border-border" style={{ backgroundColor: c.hex }} title="Light" />
                  <div className="h-10 w-10 rounded-r-lg border border-border" style={{ backgroundColor: c.hexDark }} title="Dark" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.usage}</p>
                  <div className="mt-0.5 flex gap-2 font-mono text-[10px] text-muted-foreground">
                    <span>L: {c.hex}</span>
                    <span>D: {c.hexDark}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Status colors */}
        <section>
          <h2 className="text-xl font-bold">Status / Feedback</h2>
          <div className="mt-4 flex gap-3">
            {STATUS_COLORS.map((c) => (
              <div key={c.name} className="flex flex-1 flex-col items-center gap-2 rounded-lg border border-border bg-card p-4">
                <div className="h-12 w-12 rounded-full" style={{ backgroundColor: c.hex }} />
                <p className="text-sm font-semibold">{c.name}</p>
                <code className="font-mono text-[10px] text-muted-foreground">{c.hex}</code>
                <p className="text-center text-[10px] text-muted-foreground">{c.usage}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-xl font-bold">Tipografia</h2>
          <p className="mt-1 text-sm text-muted-foreground">IBM Plex Sans (interface) + IBM Plex Mono (dados, código).</p>
          <div className="mt-4 space-y-3">
            {TYPOGRAPHY.map((t) => (
              <div key={t.token} className="flex items-baseline gap-4 rounded-lg border border-border bg-card px-4 py-3">
                <code className="w-24 shrink-0 font-mono text-xs" style={{ color: "var(--raiz-orange)" }}>{t.token}</code>
                <span className="w-20 shrink-0 text-xs text-muted-foreground">{t.size}</span>
                <span className="w-20 shrink-0 text-xs text-muted-foreground">w{t.weight}</span>
                <span className="flex-1 text-sm" style={{ fontSize: t.size.includes("-") ? t.size.split("-")[1] : t.size, fontWeight: Number(t.weight.split("-")[0]), lineHeight: t.lh }}>
                  rAIz Educação — {t.usage}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Font Sans</p>
              <p className="mt-2 text-2xl font-bold">IBM Plex Sans</p>
              <p className="mt-1 text-sm text-muted-foreground">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
              <p className="text-sm text-muted-foreground">abcdefghijklmnopqrstuvwxyz 0123456789</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Font Mono</p>
              <p className="mt-2 font-mono text-2xl font-bold">IBM Plex Mono</p>
              <p className="mt-1 font-mono text-sm text-muted-foreground">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
              <p className="font-mono text-sm text-muted-foreground">abcdefghijklmnopqrstuvwxyz 0123456789</p>
            </div>
          </div>
        </section>

        {/* Spacing */}
        <section>
          <h2 className="text-xl font-bold">Spacing</h2>
          <p className="mt-1 text-sm text-muted-foreground">Base 4px. Tailwind tokens.</p>
          <div className="mt-4 space-y-2">
            {SPACING.map((s) => (
              <div key={s.token} className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-2">
                <code className="w-12 shrink-0 font-mono text-xs" style={{ color: "var(--raiz-orange)" }}>{s.token}</code>
                <div className="h-4 rounded" style={{ width: s.px, backgroundColor: "var(--raiz-orange)", opacity: 0.6 }} />
                <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground">{s.px}</span>
                <span className="text-sm text-muted-foreground">{s.usage}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Border radius */}
        <section>
          <h2 className="text-xl font-bold">Border Radius</h2>
          <div className="mt-4 flex flex-wrap gap-4">
            {RADII.map((r) => (
              <div key={r.token} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4">
                <div className="h-16 w-16 border-2 border-[var(--raiz-orange)]" style={{ borderRadius: r.px }} />
                <code className="font-mono text-[10px]" style={{ color: "var(--raiz-orange)" }}>{r.token}</code>
                <span className="text-[10px] text-muted-foreground">{r.px}</span>
                <span className="text-center text-[10px] text-muted-foreground">{r.usage}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Layout dimensions */}
        <section>
          <h2 className="text-xl font-bold">Layout</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Topbar", value: "h-14 (56px)" },
              { label: "Sidebar expandida", value: "w-60 (240px)" },
              { label: "Sidebar colapsada", value: "w-16 (64px)" },
              { label: "Container max", value: "1440px" },
            ].map((d) => (
              <div key={d.label} className="rounded-lg border border-border bg-card p-4 text-center">
                <p className="text-xs text-muted-foreground">{d.label}</p>
                <p className="mt-1 font-mono text-sm font-semibold" style={{ color: "var(--raiz-orange)" }}>{d.value}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
