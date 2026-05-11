"use client"

import * as React from "react"
import { Search, Command } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

interface Post {
  id: string
  title: string
  excerpt: string
  tag: string
}

interface SearchFirstProps {
  posts?: Post[]
  className?: string
}

const DEFAULT_POSTS: Post[] = [
  { id: "1", title: "Introducao ao AI Gateway", excerpt: "Multi-provider, failover e cost tracking em uma API unificada.", tag: "IA" },
  { id: "2", title: "Server Components na pratica", excerpt: "Quando usar RSC, Server Actions e Client Components.", tag: "Next.js" },
  { id: "3", title: "Design tokens em Figma Variables", excerpt: "Light/dark modes e temas multi-marca.", tag: "Design" },
  { id: "4", title: "RLS avancado no Supabase", excerpt: "Policies multi-tenant sem impacto em performance.", tag: "Backend" },
  { id: "5", title: "Observabilidade com Sentry e OTEL", excerpt: "Traces distribuidos para debugar producao.", tag: "DevOps" },
  { id: "6", title: "TypeScript strict mode em legacy", excerpt: "Migracao incremental sem quebrar a app.", tag: "TypeScript" },
]

export default function SearchFirst({ posts = DEFAULT_POSTS, className }: SearchFirstProps) {
  const [query, setQuery] = React.useState("")

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return posts
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tag.toLowerCase().includes(q)
    )
  }, [query, posts])

  return (
    <section className={cn("w-full bg-slate-50 py-16 dark:bg-slate-950", className)}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
            O que voce quer aprender hoje?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-400">
            Pesquise por palavra-chave, tag ou autor. Encontre em segundos.
          </p>
        </div>

        <div className="relative mx-auto max-w-2xl">
          <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2">
            <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar artigos, tutoriais, cases..."
            aria-label="Buscar conteudo"
            className="w-full rounded-2xl border border-slate-200 bg-white py-5 pl-14 pr-20 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500"
          />
          <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs text-slate-500 sm:flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <Command className="h-3 w-3" /> K
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-500">
          {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
          {query && (
            <>
              {" "}para <strong className="text-slate-700 dark:text-slate-300">{query}</strong>
            </>
          )}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {filtered.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Nenhum resultado encontrado. Tente outra palavra-chave.
              </p>
            </div>
          ) : (
            filtered.map((p) => (
              <a
                key={p.id}
                href={`#post-${p.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-emerald-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-400"
              >
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {p.tag}
                </span>
                <h3 className="mt-2 text-base font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-slate-50 dark:group-hover:text-emerald-400">
                  {p.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{p.excerpt}</p>
              </a>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
