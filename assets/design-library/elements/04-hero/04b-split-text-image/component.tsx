import { ArrowRight, PlayCircle } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface SplitTextImageHeroProps {
  title?: string
  subtitle?: string
  primaryCta?: { label: string; onClick?: () => void }
  secondaryCta?: { label: string; onClick?: () => void }
  imageAlt?: string
  className?: string
}

export default function SplitTextImageHero({
  title = "O dashboard que sua equipe vai querer abrir todo dia",
  subtitle = "Métricas em tempo real, relatórios que se explicam sozinhos e colaboração que realmente funciona.",
  primaryCta = { label: "Teste grátis por 14 dias" },
  secondaryCta = { label: "Ver demo de 2 minutos" },
  imageAlt = "Captura de tela do produto",
  className,
}: SplitTextImageHeroProps) {
  return (
    <section
      className={cn(
        "w-full bg-white px-6 py-20 dark:bg-slate-950 md:py-28",
        className
      )}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={primaryCta.onClick}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {primaryCta.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={secondaryCta.onClick}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-slate-900"
            >
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              {secondaryCta.label}
            </button>
          </div>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 shadow-2xl dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="flex h-full items-center justify-center">
            <span
              className="text-sm font-medium text-slate-500 dark:text-slate-400"
              aria-label={imageAlt}
            >
              [ Screenshot do dashboard ]
            </span>
          </div>
          <div className="absolute left-4 top-4 flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
        </div>
      </div>
    </section>
  )
}
