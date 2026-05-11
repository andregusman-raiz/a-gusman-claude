import * as React from "react"
import { Star } from "lucide-react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

interface Testimonial {
  quote: string
  name: string
  role: string
  company: string
  initials: string
  rating?: number
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "A produtividade do time dobrou. A curva de aprendizado é zero.",
    name: "Ana Pereira",
    role: "Head de Operações",
    company: "Quantum",
    initials: "AP",
    rating: 5,
  },
  {
    quote: "Substituímos 4 ferramentas por uma. Custo caiu 60%, time mais feliz, processos mais claros, e o suporte é simplesmente incrível em todos os canais.",
    name: "Carla Melo",
    role: "Diretora de Produto",
    company: "Verde",
    initials: "CM",
    rating: 5,
  },
  {
    quote: "Integramos em uma tarde.",
    name: "Diego Ferraz",
    role: "Eng. de Software",
    company: "Norte",
    initials: "DF",
  },
  {
    quote: "A melhor decisão de ferramentaria do ano. Recomendo para qualquer time de 10+ pessoas que busca reduzir fricção.",
    name: "Eduarda Lima",
    role: "COO",
    company: "Ponto",
    initials: "EL",
    rating: 5,
  },
  {
    quote: "Interface moderna. Faz a concorrência parecer ultrapassada.",
    name: "Felipe Rocha",
    role: "VP Engenharia",
    company: "Largo",
    initials: "FR",
    rating: 4,
  },
  {
    quote: "Suporte responde em minutos. Inacreditável.",
    name: "Gabriela Tavares",
    role: "PM",
    company: "Íris",
    initials: "GT",
  },
  {
    quote: "A API é robusta, bem documentada, e os webhooks nunca falharam. Time técnico aprovou no primeiro dia.",
    name: "Heitor Vasconcelos",
    role: "Tech Lead",
    company: "Porto",
    initials: "HV",
    rating: 5,
  },
  {
    quote: "Performance brilhante.",
    name: "Isadora Nunes",
    role: "CTO",
    company: "Foco",
    initials: "IN",
  },
]

export default function MasonryGrid({
  className,
}: {
  className?: string
}) {
  return (
    <section
      aria-labelledby="masonry-heading"
      className={cn("bg-neutral-50 py-20 dark:bg-neutral-900", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2
            id="masonry-heading"
            className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50"
          >
            O que nossos clientes falam
          </h2>
        </div>

        <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={i}
              className="mb-4 break-inside-avoid rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
            >
              {t.rating ? (
                <div className="mb-3 flex gap-0.5" aria-label={`${t.rating} de 5 estrelas`}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={cn(
                        "h-4 w-4",
                        j < (t.rating ?? 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-neutral-300 dark:text-neutral-700"
                      )}
                    />
                  ))}
                </div>
              ) : null}
              <blockquote className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                <div
                  aria-hidden
                  className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
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
          ))}
        </div>
      </div>
    </section>
  )
}
