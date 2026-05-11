import { ArrowRight } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface FullBleedGradientCTAProps {
  title?: string
  subtitle?: string
  ctaLabel?: string
  onCtaClick?: () => void
  className?: string
}

export default function FullBleedGradientCTA({
  title = "Pronto para começar?",
  subtitle = "Junte-se a milhares de equipes que entregam mais com a gente.",
  ctaLabel = "Começar gratuitamente",
  onCtaClick,
  className,
}: FullBleedGradientCTAProps) {
  return (
    <section
      className={cn(
        "relative w-full overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 px-6 py-20 md:py-24",
        className
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
          {title}
        </h2>
        <p className="mt-4 max-w-2xl text-pretty text-lg text-white/90 md:text-xl">
          {subtitle}
        </p>
        <button
          onClick={onCtaClick}
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-10 py-5 text-base font-bold text-slate-900 shadow-2xl transition hover:scale-[1.03] hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          {ctaLabel}
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
