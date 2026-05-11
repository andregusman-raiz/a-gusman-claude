"use client"

import * as React from "react"
import { Search, FileText, Users, Settings, Home, X } from "lucide-react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

interface Command {
  id: string
  label: string
  group: string
  icon: React.ComponentType<{ className?: string }>
}

const COMMANDS: Command[] = [
  { id: "home", label: "Ir para início", group: "Navegação", icon: Home },
  { id: "docs", label: "Abrir documentos", group: "Navegação", icon: FileText },
  { id: "users", label: "Gerenciar usuários", group: "Navegação", icon: Users },
  { id: "settings", label: "Configurações", group: "Navegação", icon: Settings },
  { id: "new-doc", label: "Criar novo documento", group: "Ações", icon: FileText },
  { id: "invite", label: "Convidar membro", group: "Ações", icon: Users },
]

export default function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((s) => !s)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const filtered = COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  )
  const groups = Array.from(new Set(filtered.map((c) => c.group)))

  return (
    <>
      <header className="w-full border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="/" className="font-semibold text-neutral-900 dark:text-neutral-50">
            Raiz
          </a>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir paleta de comandos"
            className="inline-flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-700"
          >
            <Search className="h-4 w-4" />
            <span>Buscar...</span>
            <kbd className="ml-4 rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-[10px] font-mono font-semibold dark:border-neutral-700 dark:bg-neutral-800">
              ⌘K
            </kbd>
          </button>

          <a
            href="#"
            className="inline-flex h-9 items-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white dark:bg-neutral-50 dark:text-neutral-900"
          >
            Entrar
          </a>
        </nav>
      </header>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Paleta de comandos"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[15vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <Search className="h-4 w-4 text-neutral-500" />
              <input
                autoFocus
                type="text"
                placeholder="Pesquisar..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-50"
                aria-label="Pesquisar comandos"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  Nenhum resultado
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group} className="mb-3">
                    <div className="px-2 py-1 text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      {group}
                    </div>
                    <ul>
                      {filtered
                        .filter((c) => c.group === group)
                        .map((c) => {
                          const Icon = c.icon
                          return (
                            <li key={c.id}>
                              <button
                                type="button"
                                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
                              >
                                <Icon className="h-4 w-4 text-neutral-500" />
                                {c.label}
                              </button>
                            </li>
                          )
                        })}
                    </ul>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-neutral-200 bg-neutral-50 px-4 py-2 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
              <kbd className="rounded border border-neutral-300 bg-white px-1.5 py-0.5 font-mono dark:border-neutral-700 dark:bg-neutral-800">
                ↵
              </kbd>
              <span>para selecionar</span>
              <kbd className="ml-auto rounded border border-neutral-300 bg-white px-1.5 py-0.5 font-mono dark:border-neutral-700 dark:bg-neutral-800">
                esc
              </kbd>
              <span>para fechar</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
