"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  ExternalLink,
  ImageIcon,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PRESENTATION_CATEGORIES,
  PRESENTATION_VARIANTS,
  getVariant,
} from "@/lib/presentation-data";
import { PRESENTATION_PRESETS, getPresetById } from "@/lib/presentation-presets";
import { analyzeImage, type AnalyzeResponse, type RedesignClassification } from "./actions";

const MAX_BYTES = 5 * 1024 * 1024;

type Tab = "upload" | "url";

function confidenceColor(level: "high" | "medium" | "low"): string {
  if (level === "high") return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300";
  if (level === "medium") return "bg-amber-500/20 text-amber-700 dark:text-amber-300";
  return "bg-rose-500/20 text-rose-700 dark:text-rose-300";
}

function findCategoryByVariant(variantId: string) {
  const v = getVariant(variantId);
  if (!v) return PRESENTATION_CATEGORIES[3];
  return (
    PRESENTATION_CATEGORIES.find((c) => c.id === v.categoryId) ??
    PRESENTATION_CATEGORIES[3]
  );
}

function findVariant(id: string) {
  return (
    PRESENTATION_VARIANTS.find((v) => v.id === id) ?? PRESENTATION_VARIANTS[0]
  );
}

export function RedesignClient({ demoMode }: { demoMode: boolean }) {
  const [tab, setTab] = useState<Tab>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  function pickFile(f: File | null) {
    setLocalError(null);
    setResult(null);
    if (!f) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (!f.type.startsWith("image/")) {
      setLocalError("Arquivo não é imagem.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setLocalError(
        `Imagem muito grande (${(f.size / 1024 / 1024).toFixed(1)}MB). Máximo 5MB.`,
      );
      return;
    }
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    pickFile(f);
  }

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onAnalyze() {
    if (!file) {
      setLocalError("Selecione uma imagem primeiro.");
      return;
    }
    setLocalError(null);
    const fd = new FormData();
    fd.append("image", file);
    startTransition(async () => {
      const res = await analyzeImage(fd);
      setResult(res);
    });
  }

  function copyPrompt() {
    if (!result || !result.ok) return;
    navigator.clipboard.writeText(result.prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const canAnalyze = !!file && !isPending;

  return (
    <div className="space-y-6">
      {/* Input card */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
          <button
            onClick={() => setTab("upload")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === "upload"
                ? "bg-[var(--raiz-orange-light)]/30 text-[var(--raiz-orange)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Upload image
          </button>
          <button
            onClick={() => setTab("url")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === "url"
                ? "bg-[var(--raiz-orange-light)]/30 text-[var(--raiz-orange)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Paste URL
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
              soon
            </span>
          </button>
        </div>

        {tab === "upload" ? (
          <div className="space-y-3">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className={cn(
                "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-10 text-center transition-colors",
                "hover:border-[var(--raiz-orange)]/50 hover:bg-[var(--raiz-orange-light)]/10",
                previewUrl && "border-solid bg-muted/30 py-4",
              )}
            >
              {previewUrl ? (
                <div className="relative w-full max-w-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-[320px] w-full rounded-lg object-contain"
                  />
                  <button
                    onClick={clearFile}
                    aria-label="Remover imagem"
                    className="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow hover:bg-background"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <p className="mt-2 truncate text-center text-[11px] text-muted-foreground">
                    {file?.name} · {((file?.size ?? 0) / 1024).toFixed(0)} KB
                  </p>
                </div>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
                  <p className="text-sm font-medium">
                    Arraste a imagem aqui, ou clique para escolher
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    PNG, JPEG, WEBP ou GIF · até 5MB
                  </p>
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="mt-1 flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-[var(--raiz-orange)]/50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Escolher arquivo
                  </button>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">
                Análise via Claude multimodal. Nenhum dado é armazenado.
              </p>
              <button
                onClick={onAnalyze}
                disabled={!canAnalyze}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors",
                  canAnalyze
                    ? "bg-[var(--raiz-orange)] text-white hover:bg-[var(--raiz-orange)]/90"
                    : "cursor-not-allowed bg-muted text-muted-foreground",
                )}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" /> Analyze
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Análise por URL em breve
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground/80">
              Por enquanto, tire um screenshot da página e use a aba “Upload
              image”.
            </p>
          </div>
        )}

        {localError && (
          <p
            role="alert"
            className="mt-3 rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300"
          >
            {localError}
          </p>
        )}
      </section>

      {/* Loading */}
      {isPending && (
        <section className="rounded-2xl border border-border bg-card p-6 text-center">
          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-[var(--raiz-orange)]" />
          <p className="text-sm font-medium">Analyzing with Claude...</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            ~3-10s. Classificando layout, estilo e tom.
          </p>
        </section>
      )}

      {/* Result */}
      {result && !isPending && (
        <ResultCard
          result={result}
          demoMode={demoMode}
          copied={copied}
          onCopy={copyPrompt}
        />
      )}
    </div>
  );
}

function ResultCard({
  result,
  demoMode,
  copied,
  onCopy,
}: {
  result: AnalyzeResponse;
  demoMode: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  if (!result.ok) {
    return (
      <section className="rounded-2xl border border-rose-500/40 bg-rose-500/5 p-5">
        <h2 className="text-sm font-semibold text-rose-700 dark:text-rose-300">
          Erro na análise
        </h2>
        <p className="mt-1 text-xs text-rose-700/80 dark:text-rose-300/80">
          {result.error}
        </p>
      </section>
    );
  }

  const c = result.classification;
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--raiz-orange-light)]/30 px-2.5 py-1 text-[11px] font-semibold text-[var(--raiz-orange)]">
            {c.category}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold",
              confidenceColor(c.confidence),
            )}
          >
            confidence: {c.confidence}
          </span>
          {c.voice && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              {c.voice}
            </span>
          )}
          {result.mode === "demo" && (
            <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              demo mode
            </span>
          )}
        </div>

        {c.structure && (
          <p className="mb-4 text-sm text-foreground/90">{c.structure}</p>
        )}

        <SuggestedVariantBlock classification={c} />
        <AlternativesBlock alternatives={c.alternatives} />
        <PresetBlock presetId={c.preset} />

        {c.notes && (
          <p className="mt-4 rounded-md border-l-2 border-amber-500 bg-amber-500/5 px-3 py-2 text-[11px] text-muted-foreground">
            {c.notes}
          </p>
        )}
      </div>

      <PromptBlock prompt={result.prompt} copied={copied} onCopy={onCopy} />

      {demoMode && (
        <p className="text-center text-[11px] text-muted-foreground">
          Essa classificação foi gerada em demo mode. Configure
          ANTHROPIC_API_KEY para análise real.
        </p>
      )}
    </section>
  );
}

function SuggestedVariantBlock({
  classification,
}: {
  classification: RedesignClassification;
}) {
  const variant = findVariant(classification.suggestedVariant);
  const category = findCategoryByVariant(classification.suggestedVariant);
  return (
    <div className="mb-4">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Suggested variant
      </h3>
      <Link
        href={`/presentation/${category.slug}/${variant.id}`}
        className="flex items-center justify-between gap-3 rounded-xl border border-[var(--raiz-orange)]/40 bg-[var(--raiz-orange-light)]/10 px-4 py-3 transition-colors hover:border-[var(--raiz-orange)]/70 hover:bg-[var(--raiz-orange-light)]/20"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", category.color)} />
            <span className="truncate text-sm font-semibold">{variant.name}</span>
          </div>
          <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
            {variant.id}
          </p>
        </div>
        <span className="flex items-center gap-1 rounded-md bg-[var(--raiz-orange)]/10 px-2 py-1 text-[11px] font-medium text-[var(--raiz-orange)]">
          Abrir
          <ExternalLink className="h-3 w-3" />
        </span>
      </Link>
    </div>
  );
}

function AlternativesBlock({ alternatives }: { alternatives: string[] }) {
  if (!alternatives.length) return null;
  return (
    <div className="mb-4">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Alternatives
      </h3>
      <div className="grid gap-2 sm:grid-cols-3">
        {alternatives.map((id) => {
          const v = findVariant(id);
          const cat = findCategoryByVariant(id);
          return (
            <Link
              key={id}
              href={`/presentation/${cat.slug}/${v.id}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs transition-colors hover:border-[var(--raiz-orange)]/50 hover:bg-[var(--raiz-orange-light)]/10"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{v.name}</div>
                <div className="truncate font-mono text-[10px] text-muted-foreground">
                  {v.id}
                </div>
              </div>
              <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/50" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function PresetBlock({ presetId }: { presetId: string }) {
  const preset = getPresetById(presetId);
  const fallback = PRESENTATION_PRESETS[0];
  const p = preset ?? fallback;
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Suggested preset
      </h3>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
        <span
          className="h-5 w-5 shrink-0 rounded-full border border-border"
          style={{ backgroundColor: p.previewColor }}
        />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold">{p.name}</div>
          <div className="truncate text-[11px] text-muted-foreground">
            {p.description}
          </div>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {p.id}
        </span>
      </div>
    </div>
  );
}

function PromptBlock({
  prompt,
  copied,
  onCopy,
}: {
  prompt: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Prompt pronto</h3>
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--raiz-orange)]/40 bg-[var(--raiz-orange-light)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--raiz-orange)] transition-colors hover:bg-[var(--raiz-orange-light)]/40"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copiado
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copiar
            </>
          )}
        </button>
      </div>
      <textarea
        readOnly
        value={prompt}
        className="h-64 w-full resize-y rounded-lg border border-border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--raiz-orange)]/30"
      />
      <p className="mt-2 text-[11px] text-muted-foreground">
        Cole em Claude, Cursor, v0 ou Lovable. O preset e a variante já estão
        embutidos.
      </p>
    </div>
  );
}
