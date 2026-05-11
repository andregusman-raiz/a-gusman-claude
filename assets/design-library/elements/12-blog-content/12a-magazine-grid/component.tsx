import * as React from "react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

interface Post {
  id: string
  title: string
  excerpt: string
  date: string
  category: string
  thumb?: string
}

interface MagazineGridProps {
  posts?: Post[]
  className?: string
}

const DEFAULT_POSTS: Post[] = [
  { id: "1", title: "Como estruturar um design system multi-marca", excerpt: "Aprenda a escalar tokens, componentes e temas para multiplos produtos sem perder consistencia.", date: "18 abr 2026", category: "Design" },
  { id: "2", title: "Performance em Next.js 16", excerpt: "Cache components, PPR e streaming SSR na pratica.", date: "15 abr 2026", category: "Engenharia" },
  { id: "3", title: "A nova era dos agentes de IA", excerpt: "MCP, tool use e orquestracao com Claude 4.7.", date: "12 abr 2026", category: "IA" },
  { id: "4", title: "Arquitetura de dados moderna", excerpt: "Data warehouses serverless em 2026.", date: "10 abr 2026", category: "Dados" },
  { id: "5", title: "Design tokens em codigo", excerpt: "Figma Variables e codigo sincronizado.", date: "08 abr 2026", category: "Design" },
  { id: "6", title: "TypeScript para times grandes", excerpt: "Estrategias que escalam em monorepos.", date: "05 abr 2026", category: "Engenharia" },
  { id: "7", title: "Supabase vs Firebase", excerpt: "Comparativo honesto para stacks modernas.", date: "02 abr 2026", category: "Backend" },
  { id: "8", title: "DX como vantagem competitiva", excerpt: "Por que onboarding rapido vira diferencial.", date: "28 mar 2026", category: "Cultura" },
]

export default function MagazineGrid({ posts = DEFAULT_POSTS, className }: MagazineGridProps) {
  const [hero, ...rest] = posts

  return (
    <section className={cn("w-full bg-white py-12 dark:bg-slate-950", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Ultimas do blog</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Ideias, tutoriais e reflexoes do nosso time.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Hero card (span 2) */}
          {hero && (
            <a
              href={`#post-${hero.id}`}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-lg md:col-span-2 md:row-span-2 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 dark:from-slate-800 dark:via-slate-700 dark:to-slate-900 md:aspect-[16/10]" />
              <div className="p-6 md:p-8">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {hero.category}
                </span>
                <h3 className="mt-3 text-2xl font-bold leading-tight text-slate-900 transition-colors group-hover:text-emerald-600 dark:text-slate-50 dark:group-hover:text-emerald-400 md:text-3xl">
                  {hero.title}
                </h3>
                <p className="mt-3 text-slate-600 dark:text-slate-400">{hero.excerpt}</p>
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">{hero.date}</p>
              </div>
            </a>
          )}

          {/* Smaller cards */}
          {rest.map((p) => (
            <a
              key={p.id}
              href={`#post-${p.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="aspect-video w-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700" />
              <div className="flex flex-1 flex-col p-5">
                <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-300">
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
      </div>
    </section>
  )
}
