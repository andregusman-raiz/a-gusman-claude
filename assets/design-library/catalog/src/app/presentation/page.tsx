"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowLeft, Sun, Moon, ExternalLink, LayoutGrid } from "lucide-react";
import {
  PRESENTATION_CATEGORIES,
  PRESENTATION_VARIANTS,
  getVariantsByCategory,
} from "@/lib/presentation-data";

export default function PresentationIndexPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-6 py-4 pl-16 md:flex md:flex-wrap md:items-center md:justify-between md:py-6 md:pl-6">
          <div className="flex min-w-0 items-center gap-3 md:flex-wrap md:gap-x-4 md:gap-y-2">
            <Link
              href="/"
              aria-label="Voltar para início"
              className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex shrink-0 items-baseline gap-0.5">
              <span
                className="text-2xl font-black tracking-tight"
                style={{ color: "var(--raiz-orange)" }}
              >
                RAIZ
              </span>
              <span
                className="text-sm font-normal tracking-widest"
                style={{ color: "var(--raiz-teal)" }}
              >
                educação
              </span>
            </div>
            <div className="hidden h-6 w-px bg-border md:block" />
            <div className="min-w-0 flex-1 md:flex-initial">
              <h1 className="truncate text-base font-bold tracking-tight md:text-xl">
                Presentation Layouts
              </h1>
              <p className="truncate text-[10px] text-muted-foreground md:text-xs">
                {PRESENTATION_VARIANTS.length} variantes em {PRESENTATION_CATEGORIES.length} categorias
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 md:gap-3">
            <Link
              href="/presentation/redesign"
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-[var(--raiz-orange)]/30 hover:text-[var(--raiz-orange)]"
            >
              Redesign
            </Link>
            <Link
              href="/presentation/prompt-guide"
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-[var(--raiz-orange)]/30 hover:text-[var(--raiz-orange)]"
            >
              Prompt Guide
            </Link>
            <Link
              href="/elements"
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Elements
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Soluções
            </Link>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg border border-border p-2 hover:bg-accent"
              aria-label="Toggle theme"
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
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <p className="max-w-3xl text-sm text-muted-foreground">
            86 componentes React prontos para preview ao vivo. Hero sections,
            pricing, auth, onboarding, nav bars e mais. Clique em qualquer
            variante para ver o componente em ação com código-fonte e spec.
          </p>
        </div>

        <div className="grid gap-6">
          {PRESENTATION_CATEGORIES.map((cat) => {
            const variants = getVariantsByCategory(cat.id);
            if (variants.length === 0) return null;
            return (
              <section
                key={cat.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-3 w-3 shrink-0 rounded-full ${cat.color}`}
                    />
                    <div>
                      <h2 className="text-base font-bold tracking-tight">
                        {cat.title}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/presentation/${cat.slug}/compare`}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-[var(--raiz-orange)]/50 hover:bg-[var(--raiz-orange-light)]/20 hover:text-[var(--raiz-orange)]"
                      title={`Comparar todas as variantes de ${cat.title}`}
                    >
                      <LayoutGrid className="h-3 w-3" />
                      Comparar todas
                      <span aria-hidden>→</span>
                    </Link>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {variants.length}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {variants.map((v) => (
                    <Link
                      key={v.id}
                      href={`/presentation/${cat.slug}/${v.id}`}
                      className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs transition-all hover:border-[var(--raiz-orange)]/50 hover:bg-[var(--raiz-orange-light)]/20"
                    >
                      <span className="line-clamp-2 font-medium leading-tight transition-colors group-hover:text-[var(--raiz-orange)]">
                        {v.name}
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-[var(--raiz-orange)]" />
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
