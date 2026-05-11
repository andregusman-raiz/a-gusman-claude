"use client"

import * as React from "react"
import { ChevronDown, Zap, Layers, BarChart3, Lock, Workflow, Users } from "lucide-react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

interface MegaItem {
  label: string
  href: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

interface MegaCategory {
  title: string
  items: MegaItem[]
}

const CATEGORIES: MegaCategory[] = [
  {
    title: "Plataforma",
    items: [
      { label: "Workflows", href: "#", description: "Automatize processos repetitivos", icon: Workflow },
      { label: "Analytics", href: "#", description: "Dashboards e métricas em tempo real", icon: BarChart3 },
      { label: "Integrações", href: "#", description: "Conecte com 100+ ferramentas", icon: Layers },
    ],
  },
  {
    title: "Soluções",
    items: [
      { label: "Para times", href: "#", description: "Colaboração multi-usuário", icon: Users },
      { label: "Segurança", href: "#", description: "SSO, SOC2, auditoria", icon: Lock },
      { label: "Performance", href: "#", description: "Latência sub-100ms global", icon: Zap },
    ],
  },
]

export default function MegaMenu() {
  const [open, setOpen] = React.useState(false)

  return (
    <header className="w-full border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <nav
        aria-label="Principal"
        className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
      >
        <a
          href="/"
          className="text-lg font-semibold text-neutral-900 dark:text-neutral-50"
        >
          Raiz
        </a>

        <ul className="hidden items-center gap-6 md:flex">
          <li className="relative">
            <button
              type="button"
              aria-expanded={open}
              aria-haspopup="true"
              onClick={() => setOpen((s) => !s)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              className="inline-flex items-center gap-1 text-sm font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
            >
              Produtos
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  open && "rotate-180"
                )}
              />
            </button>
          </li>
          <li>
            <a href="#" className="text-sm font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50">
              Preços
            </a>
          </li>
          <li>
            <a href="#" className="text-sm font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50">
              Documentação
            </a>
          </li>
        </ul>

        <a
          href="#"
          className="inline-flex h-9 items-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white dark:bg-neutral-50 dark:text-neutral-900"
        >
          Começar
        </a>

        {open && (
          <div
            role="menu"
            aria-label="Produtos"
            className="absolute left-0 right-0 top-full z-50 mt-2 border-t border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 md:grid-cols-2 sm:px-6 lg:px-8">
              {CATEGORIES.map((cat) => (
                <div key={cat.title}>
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    {cat.title}
                  </h3>
                  <ul className="space-y-3">
                    {cat.items.map((item) => {
                      const Icon = item.icon
                      return (
                        <li key={item.label}>
                          <a
                            role="menuitem"
                            href={item.href}
                            className="flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
                          >
                            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-300" />
                            <div>
                              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                {item.label}
                              </div>
                              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                                {item.description}
                              </div>
                            </div>
                          </a>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
