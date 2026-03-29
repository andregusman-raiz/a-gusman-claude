"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { foundationLibraries } from "@/lib/elements-data";
import { cn } from "@/lib/utils";
import { ExportButton, CopySpecButton } from "@/components/export-button";
import { ArrowLeft, Sun, Moon, ExternalLink, Copy, Check, Package, Globe, Star, GitBranch, Box, Shield, Paintbrush, Accessibility } from "lucide-react";

// Library-specific details
const LIBRARY_DETAILS: Record<string, { strengths: string[]; bestFor: string[]; caution?: string; install: string; example: string }> = {
  "shadcn-ui": {
    strengths: ["Código é seu — copy-paste, não dependência", "Tailwind CSS nativo", "Componentes customizáveis", "CLI para adicionar componentes", "Registros customizáveis"],
    bestFor: ["Projetos Next.js/React", "Quando você quer controle total do código", "Dark mode com CSS variables", "Projetos com Tailwind"],
    install: "npx shadcn@latest init",
    example: `npx shadcn@latest add button card dialog\nimport { Button } from "@/components/ui/button"`,
  },
  "radix-ui": {
    strengths: ["Acessibilidade AAA out-of-the-box", "Headless — sem estilo imposto", "Composable — cada primitivo é independente", "Focus management e keyboard nav automáticos"],
    bestFor: ["Base para design systems custom", "Quando acessibilidade é prioridade", "Projetos que precisam de comportamento sem estilo"],
    caution: "Sinais de manutenção reduzida em 2025-2026. Monitorar React Aria como alternativa.",
    install: "npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu",
    example: `import * as Dialog from "@radix-ui/react-dialog"\n<Dialog.Root>\n  <Dialog.Trigger>Open</Dialog.Trigger>\n  <Dialog.Content>...</Dialog.Content>\n</Dialog.Root>`,
  },
  "react-aria": {
    strengths: ["A mais rigorosa em WCAG (Adobe)", "Hooks-based — máxima flexibilidade", "Suporte a mobile/touch nativo", "i18n e RTL built-in"],
    bestFor: ["Projetos com requisitos rígidos de acessibilidade", "Alternativa ao Radix UI", "Aplicações mobile-first"],
    install: "npm install react-aria-components",
    example: `import { Button, Dialog } from "react-aria-components"\n<Button onPress={() => {}}>Click me</Button>`,
  },
  "mantine": {
    strengths: ["100+ componentes prontos", "Hooks utilitários (useForm, useDisclosure, etc.)", "Dark mode nativo", "Notifications, modals, drawer built-in"],
    bestFor: ["MVPs e protótipos rápidos", "Quando precisa de tudo numa library", "Projetos que não usam Tailwind"],
    install: "npm install @mantine/core @mantine/hooks",
    example: `import { Button, TextInput, Modal } from "@mantine/core"\n<TextInput label="Nome" placeholder="João" />`,
  },
  "mui": {
    strengths: ["Material Design completo", "Ecossistema enorme (Data Grid, Date Pickers, Charts)", "Temas extensivos", "Joy UI como alternativa mais leve"],
    bestFor: ["Enterprise apps", "Quando Material Design é o padrão", "Projetos que precisam de Data Grid avançado"],
    install: "npm install @mui/material @emotion/react @emotion/styled",
    example: `import { Button, TextField } from "@mui/material"\n<TextField label="Nome" variant="outlined" />`,
  },
  "ant-design": {
    strengths: ["Enterprise-grade com i18n completo", "RTL support nativo", "Ant Design Pro (admin templates)", "Ant Design Charts"],
    bestFor: ["Aplicações enterprise com i18n", "Projetos que precisam de RTL", "Admin dashboards complexos"],
    install: "npm install antd",
    example: `import { Button, Table, Form } from "antd"\n<Table dataSource={data} columns={columns} />`,
  },
  "heroui": {
    strengths: ["Tailwind CSS nativo (como shadcn)", "React Aria como base (acessibilidade)", "Variantes automáticas", "Animações suaves built-in"],
    bestFor: ["Projetos Tailwind que querem componentes prontos", "Alternativa mais bonita ao shadcn", "Quando quer React Aria sem configurar manualmente"],
    install: "npm install @heroui/react",
    example: `import { Button, Card } from "@heroui/react"\n<Button color="primary" variant="shadow">Click</Button>`,
  },
  "daisyui": {
    strengths: ["Plugin Tailwind — zero JavaScript", "Classes semânticas (btn, card, modal)", "Funciona com qualquer framework (não só React)", "Temas com CSS variables"],
    bestFor: ["Projetos multi-framework (React, Vue, Svelte, etc.)", "Quando quer componentes Tailwind sem JS", "Protótipos ultra-rápidos"],
    install: "npm install daisyui",
    example: `// tailwind.config.js\nplugins: [require("daisyui")]\n\n<button class="btn btn-primary">Click</button>`,
  },
};

export default function FoundationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const lib = foundationLibraries.find(l => l.id === id);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!lib) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Library não encontrada: {id}</div>;

  const details = LIBRARY_DETAILS[lib.id];
  const others = foundationLibraries.filter(l => l.id !== lib.id);

  const exportData = {
    type: "foundation-library", id: lib.id, name: lib.name,
    repo: `https://${lib.repo}`, scope: lib.scope,
    componentCount: lib.componentCount, description: lib.desc, tags: lib.tags,
    ...(details ? {
      strengths: details.strengths, bestFor: details.bestFor,
      install: details.install, codeExample: details.example,
      ...(details.caution ? { caution: details.caution } : {}),
    } : {}),
  };

  const copyInstall = () => {
    if (details) { navigator.clipboard.writeText(details.install); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link href="/foundations" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Fundação</Link>
          <div className="h-4 w-px bg-border" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Library de Fundação</p>
            <h1 className="text-lg font-semibold">{lib.name}</h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{lib.componentCount}</span>
            <a href={`https://${lib.repo}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[var(--raiz-orange)]">
              <ExternalLink className="h-3 w-3" /> GitHub
            </a>
            <ExportButton data={exportData} filename={`foundation-${lib.id}`} />
            <CopySpecButton data={exportData} />
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-lg border border-border p-1.5 hover:bg-accent">
              {mounted ? (theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />) : <Sun className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            {/* Hero */}
            <div className="rounded-xl border border-border bg-gradient-to-r from-[var(--raiz-orange)]/5 to-transparent p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--raiz-orange)]/10">
                  <Package className="h-8 w-8" style={{ color: "var(--raiz-orange)" }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: "var(--raiz-orange)" }}>{lib.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{lib.desc}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{lib.scope}</p>
                </div>
              </div>
            </div>

            {details && (
              <>
                {/* Strengths */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="flex items-center gap-2 text-sm font-medium"><Star className="h-4 w-4" style={{ color: "var(--raiz-orange)" }} /> Pontos fortes</h3>
                  <ul className="mt-3 space-y-2">
                    {details.strengths.map(s => (
                      <li key={s} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Best for */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="flex items-center gap-2 text-sm font-medium"><Paintbrush className="h-4 w-4" style={{ color: "var(--raiz-teal)" }} /> Melhor para</h3>
                  <ul className="mt-3 space-y-2">
                    {details.bestFor.map(b => (
                      <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "var(--raiz-teal)" }} /> {b}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Caution */}
                {details.caution && (
                  <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                    <h3 className="flex items-center gap-2 text-sm font-medium text-yellow-400"><Shield className="h-4 w-4" /> Atenção</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{details.caution}</p>
                  </div>
                )}

                {/* Install */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="flex items-center gap-2 text-sm font-medium"><Box className="h-4 w-4" style={{ color: "var(--raiz-orange)" }} /> Instalação</h3>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-zinc-950 px-4 py-2.5 font-mono text-xs text-zinc-300">{details.install}</code>
                    <button onClick={copyInstall} className="shrink-0 rounded-md border border-border p-2 hover:bg-muted">
                      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                {/* Example */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="flex items-center gap-2 text-sm font-medium"><GitBranch className="h-4 w-4" style={{ color: "var(--raiz-teal)" }} /> Exemplo de uso</h3>
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-300">{details.example}</pre>
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-medium">Detalhes</h3>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Componentes</span><span className="font-bold" style={{ color: "var(--raiz-orange)" }}>{lib.componentCount}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Escopo</span><span>{lib.scope}</span></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {lib.tags.map(tag => <span key={tag} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{tag}</span>)}
              </div>
              <a href={`https://${lib.repo}`} target="_blank" rel="noopener noreferrer" className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium hover:bg-muted">
                <Globe className="h-3 w-3" /> Ver no GitHub
              </a>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-medium">Outras Libraries</h3>
              <div className="mt-3 space-y-2">
                {others.map(o => (
                  <Link key={o.id} href={`/foundations/${o.id}`} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs transition-colors hover:border-[var(--raiz-orange)]/20">
                    <span className="font-medium" style={{ color: "var(--raiz-orange)" }}>{o.name}</span>
                    <span className="text-muted-foreground">{o.componentCount}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
