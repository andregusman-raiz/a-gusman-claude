"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowLeft, Sun, Moon, ExternalLink } from "lucide-react";
import { ExportButton, CopySpecButton } from "@/components/export-button";

interface ElementLayoutProps {
  id: string;
  name: string;
  lib: string;
  repo: string;
  category: string;
  subcategory: string;
  desc?: string;
  tags?: string[];
  code?: string;
  children: React.ReactNode;
}

export function ElementLayout({ id, name, lib, repo, category, subcategory, desc, tags, code, children }: ElementLayoutProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const exportData = {
    type: "element",
    id, name, lib,
    repo: `https://${repo}`,
    category, subcategory,
    description: desc || "",
    tags: tags || [],
    install: repo.includes("github.com") ? `npm install ${lib.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, "")}` : `npx shadcn@latest add ${id}`,
    ...(code ? { codeExample: code } : {}),
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link href="/elements" className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Elementos
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{category} &middot; {subcategory}</p>
            <h1 className="text-lg font-semibold">{name}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{lib}</span>
            <a href={`https://${repo}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[var(--raiz-orange)]">
              <ExternalLink className="h-3 w-3" /> Repo
            </a>
            <ExportButton data={exportData} filename={`element-${id}`} />
            <CopySpecButton data={exportData} />
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-lg border border-border p-1.5 hover:bg-accent">
              {mounted ? (theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />) : <Sun className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-6">{children}</main>
    </div>
  );
}
