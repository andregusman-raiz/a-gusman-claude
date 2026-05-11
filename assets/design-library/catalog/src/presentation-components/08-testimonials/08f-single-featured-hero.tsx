import * as React from "react"
import { Quote, TrendingUp, Clock, Users } from "lucide-react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

interface Metric {
  icon: React.ComponentType<{ className?: string }>
  value: string
  label: string
}

const METRICS: Metric[] = [
  { icon: TrendingUp, value: "+240%", label: "Produtividade do time" },
  { icon: Clock, value: "-75%", label: "Tempo em tarefas manuais" },
  { icon: Users, value: "12×", label: "Adoção em 30 dias" },
]

export interface SingleFeaturedHeroProps {
  name?: string
  role?: string
  company?: string
  initials?: string
  quote?: string
  gradient?: string
  className?: string
}

export default function SingleFeaturedHero({
  name = "Carla Melo",
  role = "Diretora de Produto",
  company = "Verde",
  initials = "CM",
  quote = "Raiz mudou a forma como nosso time opera. Em 3 meses, o que antes era planilha e Slack virou processo previsível. A clareza para tomar decisão foi o ganho maior.",
  gradient = "from-indigo-500 via-purple-500 to-pink-500",
  className,
}: SingleFeaturedHeroProps) {
  return (
    <section
      aria-label={`Depoimento de ${name}, ${company}`}
      className={cn("bg-white py-20 dark:bg-neutral-950", className)}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            <div
              aria-hidden
              className={cn(
                "relative min-h-[280px] bg-gradient-to-br lg:col-span-2",
                gradient
              )}
            >
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid h-32 w-32 place-items-center rounded-full bg-white/20 backdrop-blur-md text-4xl font-bold text-white shadow-xl">
                  {initials}
                </div>
              </div>
            </div>

            <div className="p-8 lg:col-span-3 lg:p-12">
              <Quote
                className="mb-6 h-8 w-8 text-neutral-300 dark:text-neutral-700"
                aria-hidden
              />
              <blockquote className="text-xl font-medium leading-relaxed text-neutral-900 sm:text-2xl dark:text-neutral-50">
                &ldquo;{quote}&rdquo;
              </blockquote>

              <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
                <div className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                  {name}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {role} · {company}
                </div>
              </div>

              <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {METRICS.map((m, i) => {
                  const Icon = m.icon
                  return (
                    <li
                      key={i}
                      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
                    >
                      <Icon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                      <div className="mt-2 text-xl font-bold text-neutral-900 dark:text-neutral-50">
                        {m.value}
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                        {m.label}
                      </div>
                    </li>
                  )
                })}
              </ul>

              <a
                href="#case"
                className="mt-8 inline-flex h-10 items-center rounded-md bg-neutral-900 px-5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Ler caso completo
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
