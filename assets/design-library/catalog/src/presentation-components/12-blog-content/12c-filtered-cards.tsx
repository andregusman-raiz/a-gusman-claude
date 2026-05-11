"use client"

import * as React from "react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

type Category = "Todos" | "Tutorial" | "Noticia" | "Case" | "Opiniao"

interface Post {
  id: string
  title: string
  excerpt: string
  date: string
  category: Exclude<Category, "Todos">
}

interface FilteredCardsProps {
  posts?: Post[]
  className?: string
}

const CATEGORIES: Category[] = ["Todos", "Tutorial", "Noticia", "Case", "Opiniao"]

const DEFAULT_POSTS: Post[] = [
  { id: "1", title: "Tutorial: configurando Next.js 16 com cache components", excerpt: "Passo a passo completo para migrar de unstable_cache.", date: "18 abr 2026", category: "Tutorial" },
  { id: "2", title: "Anunciamos integracao com Supabase Realtime", excerpt: "Agora voce pode ouvir mudancas em tempo real direto do dashboard.", date: "16 abr 2026", category: "Noticia" },
  { id: "3", title: "Como a Layers reduziu churn em 30%", excerpt: "Estudo de caso completo com metricas reais.", date: "12 abr 2026", category: "Case" },
  { id: "4", title: "Por que abandonamos microservicos", excerpt: "Reflexao apos 3 anos consolidando em monolito modular.", date: "10 abr 2026", category: "Opiniao" },
  { id: "5", title: "Tutorial: RLS avancado no Supabase", excerpt: "Policies multi-tenant sem perder performance.", date: "08 abr 2026", category: "Tutorial" },
  { id: "6", title: "Release v2.5: nova API de webhooks", excerpt: "Retry automatico e logs auditavel.", date: "05 abr 2026", category: "Noticia" },
]

export default function FilteredCards({ posts = DEFAULT_POSTS, className }: FilteredCardsProps) {
  const [active, setActive] = React.useState<Category>("Todos")

  const filtered = React.useMemo(() => {
    if (active === "Todos") return posts
    return posts.filter((p) => p.category === active)
  }, [active, posts])

  return (
    <section className={cn("w-full bg-slate-50 py-12 dark:bg-slate-950", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Todos os artigos</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Filtre por tipo de conteudo.</p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por categoria">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={active === c}
              onClick={() => setActive(c)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                active === c
                  ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
            Nenhum artigo na categoria <strong>{active}</strong>.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <a
                key={p.id}
                href={`#post-${p.id}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="aspect-video w-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700" />
                <div className="flex flex-1 flex-col p-5">
                  <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {p.category}
                  </span>
                  <h3 className="mt-2 text-base font-semibold leading-snug text-slate-900 transition-colors group-hover:text-emerald-600 dark:text-slate-50 dark:group-hover:text-emerald-400">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{p.excerpt}</p>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">{p.date}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
