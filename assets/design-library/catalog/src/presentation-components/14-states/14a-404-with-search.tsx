"use client"

import * as React from "react"
import { Search, Home, BookOpen, MessageCircle, FileText, Compass, Mail } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

interface NotFoundSearchProps {
  className?: string
  onSearch?: (q: string) => void
}

const USEFUL_LINKS = [
  { label: "Pagina inicial", href: "/", icon: Home },
  { label: "Documentacao", href: "/docs", icon: BookOpen },
  { label: "Blog", href: "/blog", icon: FileText },
  { label: "Ajuda", href: "/help", icon: MessageCircle },
  { label: "Explorar", href: "/explore", icon: Compass },
  { label: "Contato", href: "/contato", icon: Mail },
]

export default function NotFoundWithSearch({ className, onSearch }: NotFoundSearchProps) {
  const [query, setQuery] = React.useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(query)
  }

  return (
    <section
      role="alert"
      aria-labelledby="nf-title"
      className={cn(
        "flex min-h-[70vh] w-full items-center justify-center bg-white px-4 py-16 dark:bg-slate-950",
        className
      )}
    >
      <div className="w-full max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          Erro 404
        </p>
        <h1 id="nf-title" className="mt-3 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
          Pagina nao encontrada
        </h1>
        <p className="mx-auto mt-3 max-w-md text-slate-600 dark:text-slate-400">
          A pagina que voce procura pode ter sido movida ou nao existe. Use a busca ou os atalhos abaixo.
        </p>

        <form onSubmit={submit} className="relative mx-auto mt-8 max-w-md">
          <label htmlFor="nf-search" className="sr-only">
            Buscar no site
          </label>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          />
          <input
            id="nf-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar no site..."
            className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500"
          />
        </form>

        <div className="mt-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">
            Links uteis
          </p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {USEFUL_LINKS.map((l) => {
              const Icon = l.icon
              return (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {l.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
