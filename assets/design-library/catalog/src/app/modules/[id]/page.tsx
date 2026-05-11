"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { modules, MODULE_CAT_COLORS } from "@/lib/modules-data";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Sun, Moon, ExternalLink, Copy, Check, FileCode, Database,
  Package, Tag, Shield, Zap, GitBranch, Server, Lock, Bell, Eye,
  BarChart3, Bot, RefreshCw, Workflow, Upload, FileDown, Search,
  Clock, AlertTriangle, CheckCircle, Settings, Key, Globe, Cpu,
} from "lucide-react";
import { ExportButton, CopySpecButton } from "@/components/export-button";

// ─── Module-specific interactive previews ───────────────────────────────────

function AuthRbacPreview() {
  const [role, setRole] = useState("admin");
  const roles = ["superadmin", "admin", "core_team", "external_agent", "client"];
  const modules = ["Chat", "Workspaces", "Content Studio", "Analytics", "Admin", "Billing"];
  const access: Record<string, boolean[]> = {
    superadmin: [true, true, true, true, true, true],
    admin: [true, true, true, true, true, false],
    core_team: [true, true, true, true, false, false],
    external_agent: [true, true, false, false, false, false],
    client: [true, false, false, false, false, false],
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {roles.map(r => (
          <button key={r} onClick={() => setRole(r)} className={cn("rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors", r === role ? "bg-[var(--raiz-orange)]/15 text-[var(--raiz-orange)]" : "text-muted-foreground hover:bg-muted")}>{r}</button>
        ))}
      </div>
      <div className="rounded-lg border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-muted/20 px-3 py-2 text-[10px] font-medium text-muted-foreground">
          <span>Módulo</span>{roles.map(r => <span key={r} className={cn("text-center", r === role && "text-[var(--raiz-orange)]")}>{r.split("_")[0]}</span>)}
        </div>
        {modules.map((mod, mi) => (
          <div key={mod} className="grid grid-cols-7 items-center border-b border-border/50 px-3 py-1.5 text-xs">
            <span>{mod}</span>
            {roles.map((r, ri) => (
              <span key={r} className="text-center">
                {access[r][mi] ? <CheckCircle className={cn("mx-auto h-3.5 w-3.5", r === role ? "text-[var(--raiz-orange)]" : "text-green-400/50")} /> : <span className="text-muted-foreground/20">—</span>}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function LlmRouterPreview() {
  const [task, setTask] = useState("chat");
  const tasks = [
    { id: "chat", label: "Chat simples", model: "claude-haiku-4.5", cost: "$0.001", tier: "fast" },
    { id: "analysis", label: "Análise complexa", model: "claude-sonnet-4.6", cost: "$0.015", tier: "balanced" },
    { id: "code", label: "Geração de código", model: "claude-opus-4.6", cost: "$0.075", tier: "powerful" },
    { id: "vision", label: "Análise de imagem", model: "gpt-5.4-vision", cost: "$0.025", tier: "balanced" },
  ];
  const selected = tasks.find(t => t.id === task)!;
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {tasks.map(t => (
          <button key={t.id} onClick={() => setTask(t.id)} className={cn("rounded-lg border px-3 py-2 text-xs transition-all", t.id === task ? "border-[var(--raiz-orange)]/40 bg-[var(--raiz-orange)]/5" : "border-border hover:border-[var(--raiz-orange)]/20")}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Modelo selecionado</p>
          <p className="mt-0.5 font-mono text-sm font-bold" style={{ color: "var(--raiz-orange)" }}>{selected.model}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Tier</p>
          <span className={cn("mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
            selected.tier === "fast" ? "bg-green-500/10 text-green-400" : selected.tier === "balanced" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
          )}>{selected.tier}</span>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Custo/req</p>
          <p className="mt-0.5 font-mono text-sm">{selected.cost}</p>
        </div>
      </div>
    </div>
  );
}

function WorkflowPreview() {
  const [status, setStatus] = useState("em_andamento");
  const states = [
    { id: "pendente", label: "Pendente", color: "bg-zinc-400" },
    { id: "em_andamento", label: "Em Andamento", color: "bg-blue-400" },
    { id: "em_revisao", label: "Em Revisão", color: "bg-purple-400" },
    { id: "aprovado", label: "Aprovado", color: "bg-green-400" },
    { id: "rejeitado", label: "Rejeitado", color: "bg-red-400" },
  ];
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {states.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2">
          <button onClick={() => setStatus(s.id)} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all", s.id === status ? `${s.color}/20 ring-2 ring-offset-1 ring-offset-background` : "bg-muted text-muted-foreground")}>
            <span className={cn("h-2 w-2 rounded-full", s.color)} /> {s.label}
          </button>
          {i < states.length - 1 && <span className="text-muted-foreground/30">→</span>}
        </div>
      ))}
    </div>
  );
}

function CachePreview() {
  const layers = [
    { name: "Redis (primary)", hit: true, latency: "2ms", ttl: "60s" },
    { name: "LRU Memory (fallback)", hit: false, latency: "0.1ms", ttl: "30s" },
    { name: "Database (source)", hit: true, latency: "45ms", ttl: "—" },
  ];
  return (
    <div className="space-y-2">
      {layers.map((l, i) => (
        <div key={l.name} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold", i === 0 ? "bg-[var(--raiz-orange)]/10 text-[var(--raiz-orange)]" : i === 1 ? "bg-blue-500/10 text-blue-400" : "bg-muted text-muted-foreground")}>L{i + 1}</span>
          <div className="flex-1">
            <p className="text-sm font-medium">{l.name}</p>
            <p className="text-[10px] text-muted-foreground">TTL: {l.ttl} · Latência: {l.latency}</p>
          </div>
          {l.hit ? <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">HIT</span> : <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-400">MISS</span>}
        </div>
      ))}
    </div>
  );
}

function AuditTrailPreview() {
  const events = [
    { time: "15:30:22", user: "André G.", action: "update", entity: "Contrato #C-012", module: "CLM", detail: "Status: rascunho → em_revisao" },
    { time: "15:28:10", user: "Maria S.", action: "create", entity: "Solicitação #SOL-047", module: "Auditoria", detail: "Nova solicitação criada" },
    { time: "15:25:45", user: "Sistema", action: "sync", entity: "Funcionários", module: "TOTVS", detail: "Delta sync: 12 updated, 0 new" },
    { time: "15:20:00", user: "Carlos P.", action: "delete", entity: "Evidência #EV-89", module: "Auditoria", detail: "Arquivo removido (duplicata)" },
  ];
  const actionColors: Record<string, string> = { create: "text-green-400", update: "text-blue-400", delete: "text-red-400", sync: "text-purple-400" };
  return (
    <div className="rounded-lg border border-border">
      <div className="border-b border-border bg-muted/20 px-3 py-2 text-[10px] font-medium text-muted-foreground">Audit Log — Últimas 4 ações</div>
      {events.map((ev, i) => (
        <div key={i} className="flex items-start gap-3 border-b border-border/50 px-3 py-2.5 text-xs hover:bg-muted/10">
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{ev.time}</span>
          <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium", `${actionColors[ev.action]}/10`, actionColors[ev.action])}>{ev.action}</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{ev.entity}</p>
            <p className="text-muted-foreground">{ev.detail}</p>
          </div>
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px]">{ev.module}</span>
        </div>
      ))}
    </div>
  );
}

function GenericModulePreview({ module: mod }: { module: typeof modules[0] }) {
  const iconMap: Record<string, typeof Shield> = {
    "Auth & Acesso": Shield, "AI / LLM": Bot, "Data Sync": RefreshCw, "API Management": Globe,
    "Workflow": Workflow, "Infraestrutura": Server, "Comunicação": Bell, "Compliance": Eye,
    "Observabilidade": BarChart3, "Automação": Cpu, "Gamification & UX": Zap,
    "Lifecycle Management": Clock, "Security": Lock, "Integração": GitBranch,
  };
  const Icon = iconMap[mod.category] || Settings;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-xl border border-border bg-gradient-to-r from-muted/30 to-transparent p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--raiz-orange)", opacity: 0.15 }}>
          <Icon className="h-7 w-7" style={{ color: "var(--raiz-orange)" }} />
        </div>
        <div>
          <h2 className="text-lg font-bold">{mod.name}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{mod.desc}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium"><FileCode className="h-4 w-4" style={{ color: "var(--raiz-orange)" }} /> Arquivos-chave</div>
          <div className="mt-3 space-y-1.5">
            {mod.keyFiles.map(f => (
              <div key={f} className="flex items-center gap-2 rounded bg-muted/30 px-2 py-1.5">
                <FileCode className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                <code className="truncate font-mono text-[10px] text-muted-foreground">{f}</code>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium"><Database className="h-4 w-4" style={{ color: "var(--raiz-teal)" }} /> Dependências</div>
          <div className="mt-3 space-y-1.5">
            {mod.deps.length > 0 ? mod.deps.map(d => (
              <div key={d} className="flex items-center gap-2 rounded bg-muted/30 px-2 py-1.5 text-xs">
                <Package className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                {d}
              </div>
            )) : <p className="text-xs text-muted-foreground">Zero dependências externas</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Preview router ─────────────────────────────────────────────────────────

const INTERACTIVE_PREVIEWS: Record<string, React.ComponentType> = {
  "auth-rbac-sso": AuthRbacPreview,
  "llm-router": LlmRouterPreview,
  "approval-workflow": WorkflowPreview,
  "bpmn-engine": WorkflowPreview,
  "cache-layer": CachePreview,
  "audit-trail": AuditTrailPreview,
};

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ModuleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const mod = modules.find(m => m.id === id);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mod) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Módulo não encontrado: {id}</div>;

  const cc = MODULE_CAT_COLORS[mod.category];
  const InteractivePreview = INTERACTIVE_PREVIEWS[mod.id];
  const similar = modules.filter(m => m.category === mod.category && m.id !== mod.id).slice(0, 4);

  const exportData = {
    type: "module", id: mod.id, name: mod.name, category: mod.category,
    source: mod.source, sourceRepo: `https://github.com/${mod.sourceRepo}`,
    description: mod.desc, keyFiles: mod.keyFiles, dependencies: mod.deps,
    extractable: mod.extractable, tags: mod.tags,
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link href="/modules" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Módulos</Link>
          <div className="h-4 w-px bg-border" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{mod.category}</p>
            <h1 className="text-lg font-semibold">{mod.name}</h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", mod.extractable === "sim" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400")}>
              {mod.extractable === "sim" ? "Extraível" : "Parcial"}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium" style={{ color: "var(--raiz-teal)" }}>{mod.source}</span>
            <ExportButton data={exportData} filename={`module-${mod.id}`} />
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
            {/* Interactive Preview or Generic */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="border-b border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                {InteractivePreview ? "Preview — Interativo" : "Overview"}
              </div>
              <div className="p-5">
                {InteractivePreview ? <InteractivePreview /> : <GenericModulePreview module={mod} />}
              </div>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm leading-relaxed">{mod.desc}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {mod.tags.map(tag => <span key={tag} className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{tag}</span>)}
              </div>
            </div>

            {/* Key files (if interactive preview shown, show files here too) */}
            {InteractivePreview && (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-sm font-medium"><FileCode className="h-4 w-4" style={{ color: "var(--raiz-orange)" }} /> Arquivos-chave</div>
                <div className="mt-3 space-y-1.5">
                  {mod.keyFiles.map(f => (
                    <div key={f} className="flex items-center gap-2 rounded bg-muted/30 px-3 py-2">
                      <FileCode className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                      <code className="truncate font-mono text-xs text-muted-foreground">{f}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dependencies */}
            {InteractivePreview && mod.deps.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-sm font-medium"><Database className="h-4 w-4" style={{ color: "var(--raiz-teal)" }} /> Dependências</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {mod.deps.map(d => <span key={d} className="rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs">{d}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-medium">Detalhes</h3>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Fonte</span><span className="font-medium" style={{ color: "var(--raiz-teal)" }}>{mod.source}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span className={cc.text}>{mod.category}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Extraível</span><span className={mod.extractable === "sim" ? "text-green-400" : "text-yellow-400"}>{mod.extractable === "sim" ? "Sim" : "Parcialmente"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Arquivos</span><span>{mod.keyFiles.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Dependências</span><span>{mod.deps.length || "Zero"}</span></div>
              </div>
              <a href={`https://github.com/${mod.sourceRepo}`} target="_blank" rel="noopener noreferrer" className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium hover:bg-muted">
                <ExternalLink className="h-3 w-3" /> Ver no GitHub
              </a>
            </div>

            {similar.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-medium">Similares</h3>
                <div className="mt-3 space-y-2">
                  {similar.map(s => (
                    <Link key={s.id} href={`/modules/${s.id}`} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs hover:border-[var(--raiz-orange)]/20 transition-colors">
                      <span className={cn("h-2 w-2 rounded-full", MODULE_CAT_COLORS[s.category].dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{s.name}</p>
                        <p className="truncate text-muted-foreground">{s.source}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
