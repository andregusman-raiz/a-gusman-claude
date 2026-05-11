"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

interface Slide {
  quote: string
  name: string
  role: string
  company: string
  initials: string
}

const SLIDES: Slide[] = [
  {
    quote: "Raiz mudou a forma como o time opera. Produtividade saltou em 3 meses.",
    name: "Carla Melo",
    role: "Diretora de Produto",
    company: "Verde",
    initials: "CM",
  },
  {
    quote: "Setup em uma tarde, ROI no primeiro mês. Vale cada centavo.",
    name: "Bruno Santos",
    role: "CTO",
    company: "Oliva",
    initials: "BS",
  },
  {
    quote: "Substituiu 4 ferramentas e cortou 60% do custo. Recomendo.",
    name: "Ana Pereira",
    role: "Head de Operações",
    company: "Quantum",
    initials: "AP",
  },
  {
    quote: "Suporte responde em minutos. Experiência top de linha.",
    name: "Eduarda Lima",
    role: "COO",
    company: "Ponto",
    initials: "EL",
  },
]

export default function CarouselPagination({
  className,
}: {
  className?: string
}) {
  const [index, setIndex] = React.useState(0)
  const total = SLIDES.length

  const prev = () => setIndex((i) => (i - 1 + total) % total)
  const next = () => setIndex((i) => (i + 1) % total)

  const slide = SLIDES[index]

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Depoimentos"
      className={cn("bg-neutral-50 py-20 dark:bg-neutral-900", className)}
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:p-12">
          <Quote
            className="mb-6 h-8 w-8 text-neutral-300 dark:text-neutral-700"
            aria-hidden
          />

          <div
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${total}`}
          >
            <blockquote className="min-h-[120px] text-xl font-medium leading-relaxed text-neutral-900 sm:text-2xl dark:text-neutral-50">
              &ldquo;{slide.quote}&rdquo;
            </blockquote>

            <figcaption className="mt-6 flex items-center gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <div
                aria-hidden
                className="grid h-11 w-11 place-items-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                {slide.initials}
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {slide.name}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {slide.role} · {slide.company}
                </div>
              </div>
            </figcaption>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div
              className="flex items-center gap-1.5"
              role="tablist"
              aria-label="Navegação do carousel"
            >
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Ir para depoimento ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === index
                      ? "w-6 bg-neutral-900 dark:bg-neutral-50"
                      : "w-2 bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prev}
                aria-label="Depoimento anterior"
                className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Próximo depoimento"
                className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
