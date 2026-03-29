---
id: app-shell-sidebar
name: Responsive App Shell (Sidebar + Topbar + Breadcrumbs)
category: layout
source: sophia-educacional-frontend
complexity: medium
---

# Responsive App Shell

## What it solves
Full application layout with collapsible sidebar, responsive topbar, smart breadcrumbs, and three-mode responsive behavior (mobile/tablet/desktop).

## Best implementation
- **App Shell**: `~/Claude/projetos/sophia-educacional-frontend/src/components/layout/app-shell.tsx` (310 lines)
- **Sidebar**: `~/Claude/projetos/sophia-educacional-frontend/src/components/layout/sidebar.tsx` (213 lines)
- **Topbar**: `~/Claude/projetos/sophia-educacional-frontend/src/components/layout/topbar.tsx` (207 lines)

## Key features
- **Three responsive modes**: mobile (<768px: overlay drawer), tablet (768-1279px: icons only 64px), desktop (>=1280px: expanded 224px)
- **AppShellContext**: global layout state without prop drilling
- **Collapsible sidebar**: smooth CSS transitions, icon-only mode with tooltips
- **Section grouping**: visual separators (Gestão, Acadêmico, Sistema)
- **Badge support**: notification counts on nav items
- **Smart breadcrumbs**: 20+ route-to-label mappings, RA/matrícula formatting
- **Skip link**: keyboard accessibility
- **Topbar features**: institution selector, theme toggle, notifications dropdown, user menu
- **Mobile drawer**: full overlay with backdrop-blur, body scroll prevention
- **Z-index hierarchy**: sidebar(40), overlay(30), topbar(50)

## Layout structure
```
Desktop (≥1280px):
┌────────┬───────────────────────────────┐
│ Logo   │ 🏫 Escola ▼  🔔  👤 André ▼ │
│────────│ Home > Secretaria > Alunos    │
│ 📋 Sec │                               │
│ 📚 Ped │   [Page Content]              │
│ 💰 Fin │                               │
│ 📊 Rel │                               │
└────────┴───────────────────────────────┘

Tablet (768-1279px):
┌──┬─────────────────────────────────────┐
│📋│ 🏫 Escola ▼        🔔  👤          │
│📚│ Home > Secretaria                   │
│💰│                                     │
│📊│   [Page Content]                    │
└──┴─────────────────────────────────────┘

Mobile (<768px):
┌─────────────────────────────────────────┐
│ ☰  Logo              🔔  👤            │
│ Home > Secretaria                       │
│                                         │
│   [Page Content]                        │
└─────────────────────────────────────────┘
```

## Dependencies
- next/navigation (usePathname)
- shadcn/ui (Tooltip, DropdownMenu, Sheet)
- lucide-react
- next-themes
