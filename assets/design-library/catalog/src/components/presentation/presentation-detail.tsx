"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Copy,
  Check,
  Code2,
  FileText,
  Maximize2,
  Minimize2,
  Sparkles,
  ChevronDown,
  Palette,
  Contrast,
} from "lucide-react";
import { COMPONENT_REGISTRY } from "@/presentation-components/registry";
import { cn } from "@/lib/utils";
import {
  PRESENTATION_PRESETS,
  DEFAULT_PRESET_ID,
  getPresetById,
  getPresetWrapperClass,
} from "@/lib/presentation-presets";

const PRESET_STORAGE_KEY = "glowui-preset";

type Sibling = { id: string; name: string; slug: string };

type PromptTarget = "claude" | "cursor" | "v0";

const PROMPT_TARGETS: { value: PromptTarget; label: string; hint: string }[] = [
  { value: "claude", label: "Claude / Generic", hint: "Markdown estruturado" },
  { value: "cursor", label: "Cursor", hint: "Com context tags" },
  { value: "v0", label: "v0 / Lovable", hint: "Visual-first, conciso" },
];

function extractWhenToUse(spec: string): string {
  // Extrai o primeiro bloco "## Quando usar" (ou variações) do spec.md
  const patterns = [
    /##\s*Quando usar[\s\S]*?(?=\n##\s|$)/i,
    /##\s*When to use[\s\S]*?(?=\n##\s|$)/i,
    /##\s*Uso[\s\S]*?(?=\n##\s|$)/i,
  ];
  for (const p of patterns) {
    const m = spec.match(p);
    if (m) {
      return m[0]
        .replace(/^##\s*(Quando usar|When to use|Uso)\s*/i, "")
        .trim()
        .slice(0, 600);
    }
  }
  // Fallback: primeiras 3 linhas não-vazias pós-título
  const lines = spec
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  return lines.slice(0, 3).join(" ").slice(0, 400) || "Layout base documentado no spec interno.";
}

function layoutHintFromId(id: string): string {
  const lower = id.toLowerCase();
  if (lower.includes("split")) return "Layout 50/50 desktop, stack vertical no mobile";
  if (lower.includes("centered")) return "Conteúdo centralizado, max-width controlado";
  if (lower.includes("full-bleed")) return "Full-width, sem max-width, edge-to-edge";
  if (lower.includes("bento")) return "Grid assimétrico (bento), 2-3 colunas no desktop";
  if (lower.includes("grid")) return "Grid responsivo, colunas adaptativas por breakpoint";
  if (lower.includes("sidebar")) return "Sidebar fixo à esquerda, conteúdo à direita";
  if (lower.includes("floating")) return "Elemento flutuante (pill/card), sticky ou fixo";
  if (lower.includes("sticky")) return "Sticky ou fixed no viewport";
  if (lower.includes("marquee")) return "Scroll horizontal infinito (marquee animation)";
  if (lower.includes("masonry")) return "Masonry/Pinterest grid";
  if (lower.includes("accordion")) return "Lista vertical colapsável (accordion)";
  if (lower.includes("tab")) return "Navegação por tabs com conteúdo dinâmico";
  if (lower.includes("carousel")) return "Carrossel horizontal com paginação";
  if (lower.includes("stacked")) return "Empilhamento vertical mobile-first";
  if (lower.includes("wizard") || lower.includes("multi-step"))
    return "Multi-step com progresso entre etapas";
  return "Layout conforme descrição abaixo";
}

function buildPrompt(
  target: PromptTarget,
  args: {
    variantId: string;
    variantName: string;
    categoryTitle: string;
    whenToUse: string;
    layoutHint: string;
    presetId: string;
  },
): string {
  const { variantId, variantName, categoryTitle, whenToUse, layoutHint, presetId } = args;
  const preset = getPresetById(presetId);
  const presetBlock =
    presetId !== DEFAULT_PRESET_ID && preset.promptHint
      ? `\n\n## Style preset: ${preset.name}\n${preset.description}\n\n${preset.promptHint}`
      : "";

  const core = `# Build: ${variantName}

## Contexto
Você é um designer senior implementando uma seção de ${categoryTitle} para um projeto Next.js + Tailwind + shadcn/ui.

## Layout base
${whenToUse}

## Descrição estrutural
${layoutHint}.

## Design tokens (rAIz Educação)
- Cor primária: laranja #FF6D00 (--raiz-orange)
- Cor secundária: teal #006E6A (--raiz-teal)
- Radius: 0.75rem (rounded-xl)
- Font: Inter (sans-serif)
- Dark mode via class strategy

## Stack
- React 19 + TypeScript strict
- Tailwind v4
- lucide-react para ícones
- Componentes shadcn/ui quando aplicável
- Mobile-first, "md:" e "lg:" para breakpoints

## Entregável
1 arquivo \`component.tsx\` self-contained. Props tipadas. Dark mode. Acessibilidade (aria-*, focus rings). Placeholder content em PT-BR.

## Referência
Esta é uma adaptação do layout "${variantId}" do nosso design library interno.${presetBlock}`;

  if (target === "cursor") {
    return `<<context>>
You are helping a senior designer implement a reusable ${categoryTitle} section. The codebase uses Next.js 16 App Router, Tailwind v4, and shadcn/ui. Favor Server Components; use "use client" only for interactivity. All copy in pt-BR.
<</context>>

${core}`;
  }

  if (target === "v0") {
    return `Construa a seção "${variantName}" (${categoryTitle}).

Layout: ${layoutHint}.
${whenToUse}

Stack: Next.js + Tailwind + shadcn/ui + lucide-react.
Cores: primary laranja #FF6D00, secondary teal #006E6A.
Radius rounded-xl. Dark mode via class. Mobile-first.
Conteúdo em PT-BR, placeholder realista (não lorem).
Entregue 1 componente .tsx self-contained, tipado, acessível.${presetBlock}`;
  }

  return core;
}

export function PresentationDetail({
  variantId,
  variantName,
  categoryTitle,
  categoryColor,
  componentSource,
  specSource,
  siblings,
}: {
  variantId: string;
  variantName: string;
  categoryTitle: string;
  categoryColor: string;
  componentSource: string;
  specSource: string;
  siblings: Sibling[];
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [specOpen, setSpecOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [previewDark, setPreviewDark] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [promptTarget, setPromptTarget] = useState<PromptTarget>("claude");
  const [targetMenuOpen, setTargetMenuOpen] = useState(false);
  const targetMenuRef = useRef<HTMLDivElement | null>(null);
  const [presetId, setPresetId] = useState<string>(DEFAULT_PRESET_ID);
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);
  const presetMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  // Load preset from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(PRESET_STORAGE_KEY);
      if (stored && PRESENTATION_PRESETS.some((p) => p.id === stored)) {
        setPresetId(stored);
      }
    } catch {
      // ignore storage errors (private mode, etc)
    }
  }, []);

  // Persist preset changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PRESET_STORAGE_KEY, presetId);
    } catch {
      // ignore
    }
  }, [presetId]);

  useEffect(() => {
    if (!presetMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        presetMenuRef.current &&
        !presetMenuRef.current.contains(e.target as Node)
      ) {
        setPresetMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [presetMenuOpen]);

  useEffect(() => {
    if (!targetMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        targetMenuRef.current &&
        !targetMenuRef.current.contains(e.target as Node)
      ) {
        setTargetMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [targetMenuOpen]);

  const Component = useMemo(() => {
    return COMPONENT_REGISTRY[variantId];
  }, [variantId]);

  const copyCode = () => {
    navigator.clipboard.writeText(componentSource).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const copyAsPrompt = () => {
    const prompt = buildPrompt(promptTarget, {
      variantId,
      variantName,
      categoryTitle,
      whenToUse: extractWhenToUse(specSource),
      layoutHint: layoutHintFromId(variantId),
      presetId,
    });
    navigator.clipboard.writeText(prompt).then(() => {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    });
  };

  const activeTarget =
    PROMPT_TARGETS.find((t) => t.value === promptTarget) ?? PROMPT_TARGETS[0];
  const activePreset = getPresetById(presetId);
  const presetWrapperClass = getPresetWrapperClass(presetId);

  return (
    <main className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={cn("h-3 w-3 rounded-full", categoryColor)} />
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              {variantName}
            </h1>
            <p className="text-xs text-muted-foreground">
              {categoryTitle} · <span className="font-mono">{variantId}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Copy as AI prompt — split button */}
          <div
            ref={targetMenuRef}
            className="relative flex items-stretch overflow-hidden rounded-lg border border-[var(--raiz-orange)]/40 bg-[var(--raiz-orange-light)]/20"
          >
            <button
              onClick={copyAsPrompt}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[var(--raiz-orange)] transition-colors hover:bg-[var(--raiz-orange-light)]/40"
              title={`Copiar prompt (${activeTarget.label})`}
            >
              {promptCopied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copiado
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Copy as AI prompt
                </>
              )}
            </button>
            <div className="w-px self-stretch bg-[var(--raiz-orange)]/30" />
            <button
              onClick={() => setTargetMenuOpen((o) => !o)}
              className="flex items-center gap-0.5 px-2 text-[var(--raiz-orange)] transition-colors hover:bg-[var(--raiz-orange-light)]/40"
              aria-label="Select prompt target"
              aria-haspopup="menu"
              aria-expanded={targetMenuOpen}
            >
              <span className="text-[10px] font-medium opacity-70">
                {activeTarget.label.split(" ")[0]}
              </span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {targetMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-40 mt-1 w-60 overflow-hidden rounded-lg border border-border bg-card shadow-lg"
              >
                {PROMPT_TARGETS.map((t) => (
                  <button
                    key={t.value}
                    role="menuitemradio"
                    aria-checked={promptTarget === t.value}
                    onClick={() => {
                      setPromptTarget(t.value);
                      setTargetMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-xs transition-colors hover:bg-accent",
                      promptTarget === t.value && "bg-accent",
                    )}
                  >
                    <div>
                      <div className="font-semibold">{t.label}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {t.hint}
                      </div>
                    </div>
                    {promptTarget === t.value && (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--raiz-orange)]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Style preset dropdown */}
          <div ref={presetMenuRef} className="relative">
            <button
              onClick={() => setPresetMenuOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              aria-label="Select style preset"
              aria-haspopup="menu"
              aria-expanded={presetMenuOpen}
              title={`Preset: ${activePreset.name}`}
            >
              <Palette className="h-3.5 w-3.5" />
              <span className="max-w-[120px] truncate">{activePreset.name}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
            {presetMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-40 mt-1 w-72 overflow-hidden rounded-lg border border-border bg-card shadow-lg"
              >
                {PRESENTATION_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    role="menuitemradio"
                    aria-checked={presetId === p.id}
                    onClick={() => {
                      setPresetId(p.id);
                      setPresetMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-2.5 text-left text-xs transition-colors hover:bg-accent",
                      presetId === p.id && "bg-accent",
                    )}
                  >
                    <span
                      className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-full border border-border"
                      style={{ backgroundColor: p.previewColor }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-[10px] leading-snug text-muted-foreground">
                        {p.description}
                      </div>
                    </div>
                    {presetId === p.id && (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--raiz-orange)]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setPreviewDark((p) => !p)}
            aria-label={`Tema do preview: ${previewDark ? "mudar para claro" : "mudar para escuro"}`}
            aria-pressed={previewDark}
            title="Tema isolado do preview (não afeta a página)"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Contrast className="h-3.5 w-3.5" />
            Tema do preview: {previewDark ? "escuro" : "claro"}
          </button>
          <button
            onClick={() => setFullscreen((f) => !f)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {fullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
            {fullscreen ? "Reduzir" : "Expandir"}
          </button>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg border border-border p-2 hover:bg-accent"
            aria-label="Tema da página (global)"
            title="Tema da página inteira"
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Preview */}
      <section
        className={cn(
          "overflow-hidden rounded-xl border border-border",
          fullscreen && "fixed inset-0 z-50 rounded-none",
        )}
      >
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Preview ao vivo
          </span>
          {fullscreen && (
            <button
              onClick={() => setFullscreen(false)}
              className="rounded-md border border-border px-2 py-1 text-xs"
            >
              Fechar
            </button>
          )}
        </div>
        <div
          data-preview-root
          className={cn(
            "relative min-h-[500px] overflow-auto",
            previewDark ? "dark bg-slate-950" : "bg-white",
            fullscreen && "min-h-[calc(100vh-40px)]",
            presetWrapperClass,
          )}
        >
          {Component ? (
            <Component />
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Componente não encontrado no registry: {variantId}
            </div>
          )}
        </div>
      </section>

      {/* Code */}
      <section className="mt-5 overflow-hidden rounded-xl border border-border">
        <button
          onClick={() => setCodeOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 bg-muted/40 px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            <span className="text-sm font-semibold">Código-fonte</span>
            <span className="font-mono text-[11px] text-muted-foreground">
              component.tsx
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              onClick={(e) => {
                e.stopPropagation();
                copyCode();
              }}
              className="flex cursor-pointer items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium hover:bg-accent"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copiar
                </>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {codeOpen ? "Ocultar" : "Mostrar"}
            </span>
          </div>
        </button>
        {codeOpen && (
          <pre className="max-h-[600px] overflow-auto bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
            <code>{componentSource}</code>
          </pre>
        )}
      </section>

      {/* Spec */}
      <section className="mt-5 overflow-hidden rounded-xl border border-border">
        <button
          onClick={() => setSpecOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 bg-muted/40 px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-semibold">Spec</span>
            <span className="font-mono text-[11px] text-muted-foreground">
              spec.md
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {specOpen ? "Ocultar" : "Mostrar"}
          </span>
        </button>
        {specOpen && (
          <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap bg-card p-5 font-mono text-xs leading-relaxed text-foreground">
            {specSource}
          </pre>
        )}
      </section>

      {/* Siblings */}
      {siblings.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            Outras variantes em {categoryTitle}
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {siblings.map((s) => (
              <Link
                key={s.id}
                href={`/presentation/${s.slug}/${s.id}`}
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs transition-colors hover:border-[var(--raiz-orange)]/50 hover:bg-[var(--raiz-orange-light)]/20"
              >
                <div className="truncate font-medium hover:text-[var(--raiz-orange)]">
                  {s.name}
                </div>
                <div className="truncate font-mono text-[10px] text-muted-foreground">
                  {s.id}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
