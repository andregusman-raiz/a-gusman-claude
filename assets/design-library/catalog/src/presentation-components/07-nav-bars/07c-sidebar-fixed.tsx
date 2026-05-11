import * as React from "react"
import {
  Home,
  BarChart3,
  Users,
  Settings,
  FileText,
  Bell,
  LogOut,
} from "lucide-react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  active?: boolean
}

const NAV: NavItem[] = [
  { label: "Início", href: "#", icon: Home, active: true },
  { label: "Relatórios", href: "#", icon: BarChart3 },
  { label: "Clientes", href: "#", icon: Users },
  { label: "Documentos", href: "#", icon: FileText },
  { label: "Notificações", href: "#", icon: Bell },
  { label: "Configurações", href: "#", icon: Settings },
]

export interface SidebarFixedProps {
  userName?: string
  userEmail?: string
  brand?: string
}

export default function SidebarFixed({
  userName = "Ana Silva",
  userEmail = "ana@raiz.app",
  brand = "Raiz",
}: SidebarFixedProps) {
  return (
    <aside
      aria-label="Navegação principal"
      className="flex h-screen w-64 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
    >
      <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-neutral-900 text-sm font-bold text-white dark:bg-neutral-50 dark:text-neutral-900">
          {brand.charAt(0)}
        </span>
        <span className="font-semibold text-neutral-900 dark:text-neutral-50">
          {brand}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    item.active
                      ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            {userName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
              {userName}
            </div>
            <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
              {userEmail}
            </div>
          </div>
          <button
            type="button"
            aria-label="Sair"
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
