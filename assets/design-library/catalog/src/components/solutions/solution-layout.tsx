"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import { ExportButton, CopySpecButton } from "@/components/export-button";
import { SOLUTION_SPECS } from "@/lib/export-specs";

interface SolutionLayoutProps {
  id: string;
  title: string;
  source: string;
  category: string;
  children: React.ReactNode;
}

export function SolutionLayout({ id, title, source, category, children }: SolutionLayoutProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const spec = SOLUTION_SPECS[id];
  const exportData = spec ? {
    type: "solution",
    id,
    name: title,
    category,
    source,
    sourceRepo: `https://github.com/${spec.sourceRepo}`,
    specUrl: spec.specUrl,
    specRaw: spec.specRaw,
    keyFiles: spec.keyFiles,
    dependencies: spec.dependencies,
    stackUsed: spec.stackUsed,
  } : { type: "solution", id, name: title, category, source };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Catálogo
          </Link>
          <div className="h-4 w-px bg-border" />
          <div>
            <p className="text-xs text-muted-foreground">{category} — <code style={{ color: "var(--raiz-orange)" }}>{id}</code></p>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Fonte: <span className="text-foreground">{source}</span></span>
            <ExportButton data={exportData} filename={`solution-${id}`} />
            <CopySpecButton data={exportData} />
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg border border-border p-1.5 transition-colors hover:bg-accent"
            >
              {mounted ? (theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />) : <Sun className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-6">
        {children}
      </main>
    </div>
  );
}
