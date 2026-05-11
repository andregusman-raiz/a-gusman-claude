"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Check,
  ExternalLink,
  Moon,
  Palette,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPONENT_REGISTRY } from "@/presentation-components/registry";
import { PreviewErrorBoundary } from "./preview-error-boundary";
import {
  PRESENTATION_PRESETS,
  DEFAULT_PRESET_ID,
  getPresetById,
  getPresetWrapperClass,
} from "@/lib/presentation-presets";
import { getVariant } from "@/lib/presentation-data";

const PRESET_STORAGE_KEY = "glowui-preset";

export type CompareItem = {
  id: string;
  name: string;
  slug: string;
};

function thumbnailSrc(variantId: string, presetId: string): string | null {
  const variant = getVariant(variantId);
  if (!variant) return null;
  return `/thumbnails/${variant.categoryId}/${variantId}.${presetId}.png`;
}

export function CompareView({
  items,
  categoryTitle,
}: {
  items: CompareItem[];
  categoryTitle: string;
}) {
  const [previewsDark, setPreviewsDark] = useState(false);
  const [presetId, setPresetId] = useState<string>(DEFAULT_PRESET_ID);
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);
  const presetMenuRef = useRef<HTMLDivElement | null>(null);
  // Track thumbnails that failed to load → fall back to live render.
  // Keyed by `${variantId}.${presetId}`. Reset during render whenever the
  // preset changes (preferred over an effect; see React docs "You Might Not
  // Need an Effect").
  const [missingThumbs, setMissingThumbs] = useState<Set<string>>(new Set());
  const [lastPresetForThumbs, setLastPresetForThumbs] =
    useState<string>(presetId);
  if (lastPresetForThumbs !== presetId) {
    setLastPresetForThumbs(presetId);
    setMissingThumbs(new Set());
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(PRESET_STORAGE_KEY);
      if (stored && PRESENTATION_PRESETS.some((p) => p.id === stored)) {
        setPresetId(stored);
      }
    } catch {
      // ignore
    }
  }, []);

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

  const activePreset = getPresetById(presetId);
  const presetWrapperClass = getPresetWrapperClass(presetId);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            Compare — {categoryTitle}
          </h1>
          <p className="text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? "variante" : "variantes"} lado
            a lado. Clique em uma para abrir o detalhe.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            onClick={() => setPreviewsDark((p) => !p)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {previewsDark ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
            Previews {previewsDark ? "light" : "dark"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const Component = COMPONENT_REGISTRY[item.id];
          const thumbUrl = thumbnailSrc(item.id, presetId);
          const thumbKey = `${item.id}.${presetId}`;
          const thumbAvailable = thumbUrl !== null && !missingThumbs.has(thumbKey);
          return (
          <article
            key={item.id}
            className="overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-[var(--raiz-orange)]/50"
          >
            <header className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold">
                  {item.name}
                </div>
                <div className="truncate font-mono text-[10px] text-muted-foreground">
                  {item.id}
                </div>
              </div>
              <Link
                href={`/presentation/${item.slug}/${item.id}`}
                className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground hover:border-[var(--raiz-orange)]/50 hover:text-[var(--raiz-orange)]"
                title="Abrir detalhe"
              >
                <ExternalLink className="h-3 w-3" />
              </Link>
            </header>

            <div
              className={cn(
                "relative h-96 overflow-hidden",
                previewsDark ? "dark bg-slate-950" : "bg-white",
                // Only apply preset CSS to live-render fallback. Thumbnails
                // are baked at generation time with the preset already applied.
                !thumbAvailable && presetWrapperClass,
              )}
            >
              {thumbAvailable && thumbUrl ? (
                // Static pre-rendered thumbnail — skip the CSS scaling hack
                // and avoid running the component at runtime entirely.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbUrl}
                  alt={`${item.name} — ${presetId}`}
                  loading="lazy"
                  draggable={false}
                  className="h-full w-full object-cover object-top"
                  onError={() => {
                    setMissingThumbs((prev) => {
                      if (prev.has(thumbKey)) return prev;
                      const next = new Set(prev);
                      next.add(thumbKey);
                      return next;
                    });
                  }}
                />
              ) : (
                <div
                  className="pointer-events-none origin-top-left"
                  style={{
                    transform: "scale(0.6)",
                    width: "166.666%",
                    height: "166.666%",
                  }}
                >
                  <PreviewErrorBoundary variantId={item.id}>
                    {Component ? (
                      <Component />
                    ) : (
                      <div className="flex h-64 items-center justify-center p-4 text-center text-xs text-muted-foreground">
                        Componente ausente no registry: {item.id}
                      </div>
                    )}
                  </PreviewErrorBoundary>
                </div>
              )}
            </div>

            <footer className="border-t border-border px-3 py-2">
              <Link
                href={`/presentation/${item.slug}/${item.id}`}
                className="block rounded-md border border-border bg-background px-2 py-1.5 text-center text-[11px] font-semibold text-muted-foreground transition-colors hover:border-[var(--raiz-orange)]/50 hover:bg-[var(--raiz-orange-light)]/20 hover:text-[var(--raiz-orange)]"
              >
                Select
              </Link>
            </footer>
          </article>
          );
        })}
      </div>
    </>
  );
}
