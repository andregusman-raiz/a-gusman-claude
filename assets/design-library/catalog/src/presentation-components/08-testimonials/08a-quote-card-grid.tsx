import * as React from "react"
import { Quote } from "lucide-react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

interface Testimonial {
  quote: string
  name: string
  role: string
  company: string
  initials: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "A produtividade do time dobrou depois que migramos. A curva de aprendizado é praticamente zero.",
    name: "Ana Pereira",
    role: "Head de Operações",
    company: "Quantum",
    initials: "AP",
  },
  {
    quote: "O suporte responde em minutos. Nunca vi isso em ferramenta SaaS dessa categoria.",
    name: "Bruno Santos",
    role: "CTO",
    company: "Oliva",
    initials: "BS",
  },
  {
    quote: "Substituímos 4 ferramentas por uma. Custo caiu 60% e o time está mais feliz.",
    name: "Carla Melo",
    role: "Diretora de Produto",
    company: "Verde",
    initials: "CM",
  },
  {
    quote: "Dashboard intuitivo, API robusta. Integramos em uma tarde.",
    name: "Diego Ferraz",
    role: "Eng. de Software",
    company: "Norte",
    initials: "DF",
  },
  {
    quote: "A melhor decisão de ferramentaria do ano. Recomendo para qualquer time de 10+ pessoas.",
    name: "Eduarda Lima",
    role: "COO",
    company: "Ponto",
    initials: "EL",
  },
  {
    quote: "Interface moderna, performance excelente. Faz a concorrência parecer ultrapassada.",
    name: "Felipe Rocha",
    role: "VP Engenharia",
    company: "Largo",
    initials: "FR",
  },
]

export default function QuoteCardGrid({
  className,
}: {
  className?: string
}) {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className={cn("bg-white py-20 dark:bg-neutral-950", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2
            id="testimonials-heading"
            className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50"
          >
            Times que confiam na gente
          </h2>
          <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400">
            Histórias reais de quem usa Raiz todos os dias.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <li key={i}>
              <figure className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                <Quote
                  className="mb-4 h-5 w-5 text-neutral-400 dark:text-neutral-600"
                  aria-hidden
                />
                <blockquote className="flex-1 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                  <div
                    aria-hidden
                    className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {t.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {t.name}
                    </div>
                    <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {t.role} · {t.company}
                    </div>
                  </div>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
