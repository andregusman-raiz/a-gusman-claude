import { ArrowRight } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface CenteredTextHeroProps {
  eyebrow?: string
  title?: string
  subtitle?: string
  primaryCta?: { label: string; onClick?: () => void }
  secondaryCta?: { label: string; onClick?: () => void }
  className?: string
}

export default function CenteredTextHero({
  eyebrow = "Novidade",
  title = "Construa produtos que as pessoas amam",
  subtitle = "A plataforma completa para equipes que querem entregar mais rápido sem abrir mão da qualidade.",
  primaryCta = { label: "Comece agora" },
  secondaryCta = { label: "Ver demonstração" },
  className,
}: CenteredTextHeroProps) {
  return (
    <section
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden bg-white px-6 py-24 dark:bg-slate-950 md:py-32",
        className
      )}
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        {eyebrow && (
          <span className="mb-6 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {eyebrow}
          </span>
        )}
        <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-6xl lg:text-7xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-lg text-slate-600 dark:text-slate-400 md:text-xl">
          {subtitle}
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={primaryCta.onClick}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {primaryCta.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            onClick={secondaryCta.onClick}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-slate-900"
          >
            {secondaryCta.label}
          </button>
        </div>
      </div>
    </section>
  )
}
