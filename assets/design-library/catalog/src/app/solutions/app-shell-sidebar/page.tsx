"use client";

import { useState } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, BookOpen, DollarSign, BarChart3,
  Settings, Bell, ChevronRight, Home, Menu, X, Moon, Sun,
  GraduationCap, MessageSquare, PanelLeftClose, PanelLeft,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    title: "Gestão",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/", active: true },
      { icon: Users, label: "Secretaria", href: "/secretaria", badge: 3 },
      { icon: BookOpen, label: "Pedagógico", href: "/pedagogico" },
    ],
  },
  {
    title: "Acadêmico",
    items: [
      { icon: GraduationCap, label: "Acadêmico", href: "/academico" },
      { icon: DollarSign, label: "Financeiro", href: "/financeiro" },
      { icon: MessageSquare, label: "Comunicação", href: "/comunicacao" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { icon: BarChart3, label: "Relatórios", href: "/relatorios" },
      { icon: Settings, label: "Configurações", href: "/config" },
    ],
  },
];

export default function AppShellPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <SolutionLayout id="app-shell-sidebar" title="App Shell Responsivo" source="sophia-educacional-frontend" category="Layout">
      <p className="mb-6 text-sm text-muted-foreground">
        Sidebar colapsável com 3 modos (mobile/tablet/desktop), breadcrumbs inteligentes, section grouping e badge support.
      </p>

      {/* Preview container */}
      <div className={cn("overflow-hidden rounded-xl border border-border", darkMode ? "bg-zinc-950" : "bg-white")}>
        <div className="flex h-[520px]">
          {/* Sidebar */}
          <aside
            className={cn(
              "flex shrink-0 flex-col border-r transition-all duration-200",
              darkMode ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-50",
              collapsed ? "w-16" : "w-56",
            )}
          >
            {/* Logo */}
            <div className={cn("flex h-14 items-center border-b px-4", darkMode ? "border-zinc-800" : "border-zinc-200")}>
              {!collapsed && (
                <span className={cn("text-sm font-bold", darkMode ? "text-orange-400" : "text-orange-600")}>
                  SophiA
                </span>
              )}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className={cn("ml-auto rounded-md p-1.5 transition-colors", darkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-200 text-zinc-500")}
              >
                {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto p-2">
              {NAV_SECTIONS.map((section) => (
                <div key={section.title} className="mb-3">
                  {!collapsed && (
                    <p className={cn("mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest", darkMode ? "text-zinc-600" : "text-zinc-400")}>
                      {section.title}
                    </p>
                  )}
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className={cn(
                          "group flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors cursor-pointer",
                          item.active
                            ? darkMode ? "bg-orange-500/10 text-orange-400" : "bg-orange-50 text-orange-600"
                            : darkMode ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </nav>
          </aside>

          {/* Main content area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Topbar */}
            <header className={cn(
              "flex h-14 items-center justify-between border-b px-4",
              darkMode ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-white",
            )}>
              <div className="flex items-center gap-2">
                <select className={cn(
                  "rounded-md border px-2 py-1 text-xs",
                  darkMode ? "border-zinc-700 bg-zinc-800 text-zinc-300" : "border-zinc-200 bg-white text-zinc-700",
                )}>
                  <option>Colégio QI — Matriz</option>
                  <option>Raiz Sul — Canoas</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={cn("rounded-md p-2", darkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500")}
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button className={cn("relative rounded-md p-2", darkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500")}>
                  <Bell className="h-4 w-4" />
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-orange-500" />
                </button>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold", darkMode ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600")}>
                  AG
                </div>
              </div>
            </header>

            {/* Breadcrumbs */}
            <div className={cn("flex items-center gap-1.5 border-b px-4 py-2 text-xs", darkMode ? "border-zinc-800/50 text-zinc-500" : "border-zinc-100 text-zinc-400")}>
              <Home className="h-3 w-3" />
              <ChevronRight className="h-3 w-3" />
              <span className={darkMode ? "text-zinc-300" : "text-zinc-700"}>Dashboard</span>
            </div>

            {/* Content placeholder */}
            <div className={cn("flex-1 overflow-auto p-6", darkMode ? "bg-zinc-950" : "bg-zinc-50")}>
              <div className={cn("rounded-lg border-2 border-dashed p-8 text-center", darkMode ? "border-zinc-800 text-zinc-600" : "border-zinc-200 text-zinc-400")}>
                <LayoutDashboard className="mx-auto h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm font-medium">Conteúdo da página</p>
                <p className="mt-1 text-xs">Sidebar {collapsed ? "colapsada (64px)" : "expandida (224px)"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SolutionLayout>
  );
}
