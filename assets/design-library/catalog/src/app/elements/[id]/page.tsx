"use client";

import { useParams } from "next/navigation";
import { ElementLayout } from "@/components/elements/element-layout";
import { ElementMiniPreview } from "@/components/elements/element-mini-preview";
import { ElementInteractivePreview, hasInteractivePreview } from "@/components/elements/previews";
import { elements } from "@/lib/elements-data";
import { cn } from "@/lib/utils";
import { ExternalLink, Copy, Check, Package, Tag } from "lucide-react";
import { useState } from "react";

export default function ElementDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const el = elements.find((e) => e.id === id);
  const [copied, setCopied] = useState(false);

  if (!el) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Elemento não encontrado: {id}</div>;
  }

  const installCmd = el.repo.includes("github.com")
    ? `npm install ${el.lib.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, "")}`
    : `npx shadcn@latest add ${el.id}`;

  const similar = elements.filter((e) => e.category === el.category && e.id !== el.id).slice(0, 4);

  const copyInstall = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ElementLayout id={el.id} name={el.name} lib={el.lib} repo={el.repo} category={el.category} subcategory={el.subcategory} desc={el.desc} tags={el.tags} code={el.code}>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main */}
        <div className="space-y-6">
          {/* Preview */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
              Preview {hasInteractivePreview(el.id) ? "— Interativo" : "— Esquemático"}
            </div>
            <div className="p-6">
              {hasInteractivePreview(el.id) ? (
                <ElementInteractivePreview id={el.id} />
              ) : (
                <div className="flex items-center justify-center">
                  <div className="h-40 w-72"><ElementMiniPreview type={el.preview} /></div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm leading-relaxed">{el.desc}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {el.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{tag}</span>
              ))}
            </div>
          </div>

          {/* Install */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-medium"><Package className="h-4 w-4" style={{ color: "var(--raiz-orange)" }} /> Instalação</div>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-zinc-950 px-4 py-2.5 font-mono text-xs text-zinc-300">{installCmd}</code>
              <button onClick={copyInstall} className="shrink-0 rounded-md border border-border p-2 hover:bg-muted">
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </button>
            </div>
          </div>

          {/* Code example */}
          {el.code && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-medium"><Tag className="h-4 w-4" style={{ color: "var(--raiz-teal)" }} /> Exemplo de uso</div>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-300">{el.code}</pre>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Info */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium">Detalhes</h3>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Library</span><span className="font-medium">{el.lib}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span>{el.category}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Subcategoria</span><span>{el.subcategory}</span></div>
            </div>
            <a href={`https://${el.repo}`} target="_blank" rel="noopener noreferrer" className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium hover:bg-muted">
              <ExternalLink className="h-3 w-3" /> Ver no GitHub
            </a>
          </div>

          {/* Similar */}
          {similar.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-medium">Similares</h3>
              <div className="mt-3 space-y-2">
                {similar.map((s) => (
                  <a key={s.id} href={`/elements/${s.id}`} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs hover:border-[var(--raiz-orange)]/20 transition-colors">
                    <div className="h-6 w-10 shrink-0"><ElementMiniPreview type={s.preview} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{s.name}</p>
                      <p className="truncate text-muted-foreground">{s.lib}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ElementLayout>
  );
}
