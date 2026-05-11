"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Home, Users, BookOpen, Settings, BarChart3, ChevronRight, ChevronDown, Search, Menu, X, Bell, ChevronsUpDown, Command, FileText, Hash, Inbox, Calendar, HelpCircle, LogOut } from "lucide-react";

// ─── Sidebar ────────────────────────────────────────────────────────────────
export function SidebarPreview() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("Dashboard");
  const sections = [
    { title: "Gestão", items: [{ icon: Home, label: "Dashboard", badge: 0 }, { icon: Users, label: "Secretaria", badge: 3 }, { icon: BookOpen, label: "Pedagógico", badge: 0 }] },
    { title: "Sistema", items: [{ icon: BarChart3, label: "Relatórios", badge: 0 }, { icon: Settings, label: "Configurações", badge: 0 }] },
  ];
  return (
    <div className="flex h-72 overflow-hidden rounded-lg border border-border">
      <aside className={cn("flex shrink-0 flex-col border-r border-border bg-zinc-900 transition-all duration-200", collapsed ? "w-14" : "w-52")}>
        <div className="flex h-12 items-center justify-between border-b border-zinc-800 px-3">
          {!collapsed && <span className="text-sm font-bold text-[var(--raiz-orange)]">App</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="rounded p-1 text-zinc-400 hover:bg-zinc-800"><Menu className="h-4 w-4" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {sections.map(s => (
            <div key={s.title} className="mb-3">
              {!collapsed && <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-widest text-zinc-600">{s.title}</p>}
              {s.items.map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.label} onClick={() => setActive(item.label)} className={cn("flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs transition-colors", active === item.label ? "bg-[var(--raiz-orange)]/10 text-[var(--raiz-orange)]" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200")}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <><span className="flex-1 text-left">{item.label}</span>{item.badge > 0 && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--raiz-orange)] text-[9px] font-bold text-white">{item.badge}</span>}</>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 items-center justify-center bg-background text-xs text-muted-foreground">{active} — {collapsed ? "colapsada" : "expandida"}</div>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────
export function TabsPreview() {
  const [active, setActive] = useState("overview");
  const tabs = [{ id: "overview", label: "Visão Geral" }, { id: "analytics", label: "Analytics" }, { id: "reports", label: "Relatórios" }, { id: "settings", label: "Configurações" }];
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex border-b border-border">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} className={cn("relative px-4 py-2.5 text-sm font-medium transition-colors", active === t.id ? "text-[var(--raiz-orange)]" : "text-muted-foreground hover:text-foreground")}>
            {t.label}
            {active === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--raiz-orange)]" />}
          </button>
        ))}
      </div>
      <div className="p-4 text-sm text-muted-foreground">Conteúdo da tab: <span className="font-medium text-foreground">{tabs.find(t => t.id === active)?.label}</span></div>
    </div>
  );
}

// ─── Command Palette (cmdk) ─────────────────────────────────────────────────
export function CommandPalettePreview() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(true);
  const items = [
    { group: "Navegação", items: [{ icon: Home, label: "Dashboard", shortcut: "⌘D" }, { icon: Users, label: "Alunos", shortcut: "⌘A" }, { icon: BarChart3, label: "Relatórios", shortcut: "⌘R" }] },
    { group: "Ações", items: [{ icon: FileText, label: "Novo documento", shortcut: "⌘N" }, { icon: Calendar, label: "Agendar reunião", shortcut: "⌘M" }] },
  ];
  const filtered = items.map(g => ({ ...g, items: g.items.filter(i => !query || i.label.toLowerCase().includes(query.toLowerCase())) })).filter(g => g.items.length > 0);
  const [selected, setSelected] = useState(0);

  return (
    <div className="mx-auto max-w-md">
      <p className="mb-2 text-center text-xs text-muted-foreground">Pressione <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd></p>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground" placeholder="Buscar comandos..." value={query} onChange={e => { setQuery(e.target.value); setSelected(0); }} autoFocus />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">ESC</kbd>
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum resultado</p>}
          {filtered.map((g, gi) => (
            <div key={g.group}>
              <p className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground">{g.group}</p>
              {g.items.map((item, ii) => {
                const Icon = item.icon;
                const idx = filtered.slice(0, gi).reduce((s, gr) => s + gr.items.length, 0) + ii;
                return (
                  <div key={item.label} onMouseEnter={() => setSelected(idx)} className={cn("flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm", idx === selected ? "bg-[var(--raiz-orange)]/10 text-[var(--raiz-orange)]" : "text-foreground")}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{item.shortcut}</kbd>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Breadcrumb ─────────────────────────────────────────────────────────────
export function BreadcrumbPreview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 text-sm">
        <a href="#" className="text-muted-foreground hover:text-foreground">Home</a>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
        <a href="#" className="text-muted-foreground hover:text-foreground">Secretaria</a>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
        <a href="#" className="text-muted-foreground hover:text-foreground">Alunos</a>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
        <span className="font-medium text-foreground">João Silva</span>
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        <Home className="h-3.5 w-3.5 text-muted-foreground" />
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
        <span className="text-muted-foreground">...</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
        <span className="rounded bg-muted px-2 py-0.5 text-xs">Turmas</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
        <span className="font-medium">3º Ano A</span>
      </div>
    </div>
  );
}

// ─── Accordion ──────────────────────────────────────────────────────────────
export function AccordionPreview() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([0]));
  const items = [
    { title: "Como faço matrícula?", content: "O processo de matrícula pode ser feito online pelo portal ou presencialmente na secretaria. Documentos necessários: RG, CPF, comprovante de residência." },
    { title: "Qual o horário de funcionamento?", content: "De segunda a sexta, das 7h às 18h. Aos sábados, das 8h às 12h para atividades extracurriculares." },
    { title: "Como acessar o boletim?", content: "Acesse o Portal do Aluno com seu RA e senha. O boletim é atualizado após cada período de avaliação." },
  ];
  const toggle = (i: number) => setOpenItems(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; });

  return (
    <div className="rounded-lg border border-border divide-y divide-border">
      {items.map((item, i) => (
        <div key={i}>
          <button onClick={() => toggle(i)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/20">
            {item.title}
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", openItems.has(i) && "rotate-180")} />
          </button>
          {openItems.has(i) && <div className="px-4 pb-3 text-sm text-muted-foreground">{item.content}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── Dropdown Menu ──────────────────────────────────────────────────────────
export function DropdownMenuPreview() {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex justify-center py-4">
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Opções ▾</button>
        {open && (
          <div className="absolute left-0 top-full z-10 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-xl">
            <div className="p-1">
              {[{ icon: FileText, label: "Novo documento", shortcut: "⌘N" }, { icon: Users, label: "Convidar membro", shortcut: "⌘I" }].map(item => {
                const Icon = item.icon;
                return <button key={item.label} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"><Icon className="h-4 w-4 text-muted-foreground" />{item.label}<span className="ml-auto font-mono text-[10px] text-muted-foreground">{item.shortcut}</span></button>;
              })}
            </div>
            <div className="border-t border-border p-1">
              <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-red-400 hover:bg-red-500/10"><LogOut className="h-4 w-4" /> Sair</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tree View ──────────────────────────────────────────────────────────────
interface TreeNode { id: string; label: string; children?: TreeNode[]; }

export function TreeViewPreview() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["src", "components"]));
  const [selected, setSelected] = useState("page.tsx");
  const toggle = (id: string) => setExpanded(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const tree: TreeNode[] = [
    { id: "src", label: "src", children: [
      { id: "app", label: "app", children: [{ id: "page.tsx", label: "page.tsx" }, { id: "layout.tsx", label: "layout.tsx" }] },
      { id: "components", label: "components", children: [{ id: "ui", label: "ui", children: [{ id: "button.tsx", label: "button.tsx" }, { id: "card.tsx", label: "card.tsx" }] }] },
      { id: "lib", label: "lib", children: [{ id: "utils.ts", label: "utils.ts" }] },
    ]},
    { id: "package.json", label: "package.json" },
  ];

  const renderNode = (node: TreeNode, depth: number): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    return (
      <div key={node.id}>
        <button onClick={() => { if (hasChildren) toggle(node.id); setSelected(node.id); }} className={cn("flex w-full items-center gap-1 rounded px-1 py-1 text-xs hover:bg-muted/30", selected === node.id && "bg-[var(--raiz-orange)]/10 text-[var(--raiz-orange)]")} style={{ paddingLeft: depth * 16 + 4 }}>
          {hasChildren ? <ChevronRight className={cn("h-3 w-3 shrink-0 transition-transform", isExpanded && "rotate-90")} /> : <span className="w-3" />}
          <span>{hasChildren ? "📁" : "📄"} {node.label}</span>
        </button>
        {hasChildren && isExpanded && node.children!.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card p-2">{tree.map(n => renderNode(n, 0))}</div>
  );
}

// ─── Drawer (Vaul) ──────────────────────────────────────────────────────────
export function DrawerPreview() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative h-64 overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex h-full items-center justify-center">
        <button onClick={() => setOpen(true)} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "var(--raiz-orange)" }}>Abrir Drawer</button>
      </div>
      {/* Drawer overlay */}
      {open && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />}
      {/* Drawer panel */}
      <div className={cn("absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-border bg-card transition-transform duration-300", open ? "translate-y-0" : "translate-y-full")}>
        <div className="flex justify-center py-2"><div className="h-1 w-10 rounded-full bg-muted-foreground/20" /></div>
        <div className="px-4 pb-6">
          <h3 className="text-sm font-semibold">Configurações</h3>
          <p className="mt-1 text-xs text-muted-foreground">Painel deslizante de baixo — ideal para mobile</p>
          <div className="mt-4 space-y-2">
            {["Perfil", "Notificações", "Tema", "Sair"].map(item => (
              <button key={item} className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted">{item}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ─────────────────────────────────────────────────────────────
export function PaginationPreview() {
  const [page, setPage] = useState(3);
  const total = 12;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-1">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-30 hover:bg-muted">← Anterior</button>
        {[1, 2, 3, "...", 11, 12].map((p, i) => (
          <button key={i} onClick={() => typeof p === "number" && setPage(p)} className={cn("h-9 w-9 rounded-md text-sm font-medium", p === page ? "text-white" : "border border-border hover:bg-muted", typeof p !== "number" && "cursor-default")} style={p === page ? { backgroundColor: "var(--raiz-orange)" } : {}}>
            {p}
          </button>
        ))}
        <button onClick={() => setPage(Math.min(total, page + 1))} disabled={page === total} className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-30 hover:bg-muted">Próximo →</button>
      </div>
      <p className="text-center text-xs text-muted-foreground">Página {page} de {total} — 120 resultados</p>
    </div>
  );
}
