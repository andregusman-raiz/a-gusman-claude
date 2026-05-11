"use client"

import * as React from "react"
import { Clock, User } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

interface ReadingLayoutProps {
  title?: string
  author?: string
  readingTime?: string
  date?: string
  className?: string
}

const SECTIONS = [
  { id: "intro", label: "Introducao" },
  { id: "context", label: "Contexto historico" },
  { id: "principles", label: "Principios fundamentais" },
  { id: "patterns", label: "Padroes de implementacao" },
  { id: "tradeoffs", label: "Trade-offs comuns" },
  { id: "conclusion", label: "Conclusao" },
]

export default function ReadingLayout({
  title = "A arte de escrever componentes sustentaveis",
  author = "Clara Mendes",
  readingTime = "8 min de leitura",
  date = "18 abr 2026",
  className,
}: ReadingLayoutProps) {
  const [active, setActive] = React.useState<string>(SECTIONS[0].id)

  return (
    <article className={cn("relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8", className)}>
      <div className="flex flex-col gap-12 lg:flex-row">
        {/* Main column */}
        <div className="mx-auto w-full max-w-2xl">
          <header className="mb-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Engenharia
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
              {title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4" /> {author}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {readingTime}
              </span>
              <span>{date}</span>
            </div>
          </header>

          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="mb-10 scroll-mt-24">
              <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {s.label}
              </h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
                Conteudo de exemplo para a secao {s.label}. Os melhores artigos tecnicos equilibram profundidade
                conceitual com exemplos praticos. Aqui entraria paragrafos reais com codigo, diagramas e citacoes.
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
                Um segundo paragrafo para simular densidade de leitura real. Fontes serif sao recomendadas para
                colunas longas; aqui usamos a sans-serif do sistema para manter neutro.
              </p>
            </section>
          ))}
        </div>

        {/* TOC sticky */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">
              Nesta pagina
            </p>
            <nav aria-label="Indice do artigo">
              <ul className="space-y-1 border-l border-slate-200 dark:border-slate-800">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={() => setActive(s.id)}
                      className={cn(
                        "-ml-px block border-l-2 px-4 py-1.5 text-sm transition-colors",
                        active === s.id
                          ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                          : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-100"
                      )}
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>
      </div>
    </article>
  )
}
