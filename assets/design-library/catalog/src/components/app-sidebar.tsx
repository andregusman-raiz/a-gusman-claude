"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Box, Layers, Package, Palette, Sun, Moon,
  Search, PanelLeftClose, PanelLeft, ChevronRight, Home,
} from "lucide-react";

import { elements, foundationLibraries } from "@/lib/elements-data";
import { modules } from "@/lib/modules-data";

const NAV = [
  { href: "/", label: "Soluções", icon: LayoutDashboard, count: 24, color: "var(--raiz-orange)" },
  { href: "/elements", label: "Elementos", icon: Box, count: elements.length, color: "#3B82F6" },
  { href: "/foundations", label: "Fundação", icon: Layers, count: foundationLibraries.length, color: "#A855F7" },
  { href: "/modules", label: "Módulos", icon: Package, count: modules.length, color: "#2D9E6B" },
  { href: "/tokens", label: "Tokens", icon: Palette, count: 0, color: "var(--raiz-teal)" },
];

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => setMounted(true), []);

  const activeNav = NAV.find(n => n.href === "/" ? pathname === "/" : pathname.startsWith(n.href));

  // Breadcrumb
  const crumbs: Array<{ label: string; href: string }> = [];
  if (activeNav && activeNav.href !== "/") {
    crumbs.push({ label: activeNav.label, href: activeNav.href });
  }
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 1) {
    crumbs.push({ label: segments[segments.length - 1], href: pathname });
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={cn("sticky top-0 flex h-screen shrink-0 flex-col border-r border-border transition-all duration-200", collapsed ? "w-16" : "w-52")}>
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-border px-3">
          {!collapsed && (
            <Link href="/" className="flex items-baseline gap-0.5">
              <span className="text-lg font-black tracking-tight" style={{ color: "var(--raiz-orange)" }}>RAIZ</span>
              <span className="text-[10px] font-normal tracking-widest" style={{ color: "var(--raiz-teal)" }}>edu</span>
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {NAV.map(item => {
            const Icon = item.icon;
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  isActive ? "text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                style={isActive ? { backgroundColor: item.color, opacity: 0.9 } : {}}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.count > 0 && (
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", isActive ? "bg-white/20" : "bg-muted")}>
                        {item.count}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-2 space-y-1">
          {!collapsed && (
            <button
              onClick={() => {
                const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
                document.dispatchEvent(event);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-muted"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Buscar</span>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[8px]">⌘K</kbd>
            </button>
          )}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-muted"
          >
            {mounted ? (theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />) : <Sun className="h-3.5 w-3.5" />}
            {!collapsed && <span>{mounted && theme === "dark" ? "Modo claro" : "Modo escuro"}</span>}
          </button>
        </div>

        {/* Stats bar (collapsed = hidden) */}
        {!collapsed && (
          <div className="border-t border-border px-3 py-2">
            <div className="flex items-center justify-between text-[9px] text-muted-foreground">
              <span>Total</span>
              <span className="font-bold" style={{ color: "var(--raiz-orange)" }}>{24 + elements.length + foundationLibraries.length + modules.length}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="flex h-full">
                <div style={{ width: `${(24 / 208) * 100}%`, backgroundColor: "var(--raiz-orange)" }} />
                <div style={{ width: `${(elements.length / 208) * 100}%`, backgroundColor: "#3B82F6" }} />
                <div style={{ width: `${(foundationLibraries.length / 208) * 100}%`, backgroundColor: "#A855F7" }} />
                <div style={{ width: `${(modules.length / 208) * 100}%`, backgroundColor: "#2D9E6B" }} />
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Breadcrumbs */}
        {crumbs.length > 0 && (
          <div className="flex items-center gap-1.5 border-b border-border/50 px-6 py-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground"><Home className="h-3 w-3" /></Link>
            {crumbs.map((crumb, i) => (
              <div key={crumb.href} className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                {i === crumbs.length - 1 ? (
                  <span className="font-medium text-foreground">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-foreground">{crumb.label}</Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
