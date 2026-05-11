"use client"

import * as React from "react"
import { ChevronRight, ChevronDown, Check } from "lucide-react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

export interface Crumb {
  label: string
  href?: string
}

export interface BreadcrumbNavProps {
  crumbs?: Crumb[]
  siblings?: string[]
}

const DEFAULT_CRUMBS: Crumb[] = [
  { label: "Projetos", href: "#" },
  { label: "Raiz Platform", href: "#" },
  { label: "Configurações", href: "#" },
  { label: "Integrações" },
]

const DEFAULT_SIBLINGS = ["Integrações", "Webhooks", "API Keys", "Logs"]

export default function BreadcrumbNav({
  crumbs = DEFAULT_CRUMBS,
  siblings = DEFAULT_SIBLINGS,
}: BreadcrumbNavProps) {
  const [open, setOpen] = React.useState(false)
  const lastIdx = crumbs.length - 1

  return (
    <header className="w-full border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto flex max-w-7xl items-center px-4 py-3 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex items-center gap-1 text-sm">
            {crumbs.map((crumb, i) => {
              const isLast = i === lastIdx
              return (
                <li key={i} className="flex items-center gap-1">
                  {i > 0 && (
                    <span
                      aria-hidden
                      className="text-neutral-400 dark:text-neutral-600"
                    >
                      /
                    </span>
                  )}
                  {isLast ? (
                    <div className="relative">
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-haspopup="menu"
                        aria-current="page"
                        onClick={() => setOpen((s) => !s)}
                        onBlur={() => setTimeout(() => setOpen(false), 200)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-neutral-900 hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-900"
                      >
                        {crumb.label}
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 transition-transform",
                            open && "rotate-180"
                          )}
                        />
                      </button>
                      {open && (
                        <ul
                          role="menu"
                          className="absolute left-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-950"
                        >
                          {siblings.map((s) => (
                            <li key={s} role="none">
                              <button
                                type="button"
                                role="menuitem"
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
                              >
                                {s === crumb.label && (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                <span className={s === crumb.label ? "" : "pl-5"}>
                                  {s}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <a
                      href={crumb.href}
                      className="rounded-md px-2 py-1 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
                    >
                      {crumb.label}
                    </a>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>

        <a
          href="#"
          className="ml-4 inline-flex h-8 items-center rounded-md bg-neutral-900 px-3 text-xs font-medium text-white dark:bg-neutral-50 dark:text-neutral-900"
        >
          Salvar
        </a>
      </div>
    </header>
  )
}

// unused ChevronRight kept for consumers who prefer `›` divider
void ChevronRight
