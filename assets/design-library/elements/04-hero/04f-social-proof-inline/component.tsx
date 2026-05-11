import { ArrowRight, Star } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface SocialProofInlineHeroProps {
  title?: string
  subtitle?: string
  primaryCta?: { label: string; onClick?: () => void }
  logos?: string[]
  companiesCount?: string
  className?: string
}

export default function SocialProofInlineHero({
  title = "A plataforma que 500+ empresas escolheram",
  subtitle = "De startups a grandes corporações, equipes entregam mais com a gente.",
  primaryCta = { label: "Começar grátis" },
  logos = ["Acme", "Nubank", "iFood", "Stone", "Loft", "QuintoAndar"],
  companiesCount = "500+ empresas confiam",
  className,
}: SocialProofInlineHeroProps) {
  return (
    <section
      className={cn(
        "w-full bg-white px-6 py-20 dark:bg-slate-950 md:py-28",
        className
      )}
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex" aria-label="Avaliação 4.9 de 5 estrelas">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
            ))}
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            4.9/5 · 2.300 avaliações
          </span>
        </div>

        <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-lg text-slate-600 dark:text-slate-400">
          {subtitle}
        </p>
        <button
          onClick={primaryCta.onClick}
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {primaryCta.label}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-16 border-t border-slate-200 pt-10 dark:border-slate-800">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {companiesCount}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0">
          {logos.map((logo) => (
            <span
              key={logo}
              className="text-lg font-bold text-slate-700 dark:text-slate-300"
              aria-label={`Logo ${logo}`}
            >
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
