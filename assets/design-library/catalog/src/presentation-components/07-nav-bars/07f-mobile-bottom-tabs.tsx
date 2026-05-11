"use client"

import * as React from "react"
import { Home, Search, Plus, Bell, User } from "lucide-react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

interface Tab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  primary?: boolean
}

const TABS: Tab[] = [
  { id: "home", label: "Início", icon: Home },
  { id: "search", label: "Buscar", icon: Search },
  { id: "create", label: "Criar", icon: Plus, primary: true },
  { id: "bell", label: "Notificações", icon: Bell, badge: 3 },
  { id: "user", label: "Perfil", icon: User },
]

export default function MobileBottomTabs() {
  const [active, setActive] = React.useState("home")

  return (
    <nav
      aria-label="Principal"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur md:hidden dark:border-neutral-800 dark:bg-neutral-950/95"
    >
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 pb-safe pt-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.id
          if (tab.primary) {
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  aria-label={tab.label}
                  onClick={() => setActive(tab.id)}
                  className="grid h-12 w-12 place-items-center rounded-full bg-neutral-900 text-white shadow-lg dark:bg-neutral-50 dark:text-neutral-900"
                >
                  <Icon className="h-5 w-5" />
                </button>
              </li>
            )
          }
          return (
            <li key={tab.id}>
              <button
                type="button"
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActive(tab.id)}
                className="relative flex flex-col items-center gap-0.5 px-3 py-2"
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive
                      ? "text-neutral-900 dark:text-neutral-50"
                      : "text-neutral-500 dark:text-neutral-400"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isActive
                      ? "text-neutral-900 dark:text-neutral-50"
                      : "text-neutral-500 dark:text-neutral-400"
                  )}
                >
                  {tab.label}
                </span>
                {tab.badge ? (
                  <span
                    aria-label={`${tab.badge} novas notificações`}
                    className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white"
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
