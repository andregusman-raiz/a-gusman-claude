import { ArrowDown } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface TypographyGiantHeroProps {
  words?: string[]
  tagline?: string
  ctaLabel?: string
  onCtaClick?: () => void
  className?: string
}

export default function TypographyGiantHero({
  words = ["Design.", "Código.", "Produto."],
  tagline = "Feito para quem entrega.",
  ctaLabel = "Continuar",
  onCtaClick,
  className,
}: TypographyGiantHeroProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-white px-6 py-12 dark:bg-slate-950 md:px-12",
        className
      )}
    >
      <header className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
          2026 — Ed. 01
        </span>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {tagline}
        </span>
      </header>

      <div className="flex flex-1 flex-col justify-center">
        {words.map((word, i) => (
          <h1
            key={i}
            className="leading-[0.9] tracking-tighter text-slate-900 dark:text-slate-50"
            style={{
              fontSize: "clamp(3.5rem, 14vw, 14rem)",
              fontWeight: 800,
            }}
          >
            {word}
          </h1>
        ))}
      </div>

      <footer className="flex items-end justify-between">
        <p className="max-w-md text-pretty text-base text-slate-600 dark:text-slate-400 md:text-lg">
          Uma plataforma sem distrações, pensada pela obsessão com o detalhe.
        </p>
        <button
          onClick={onCtaClick}
          className="group inline-flex items-center gap-3 rounded-full border border-slate-900 bg-transparent px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:border-slate-50 dark:text-slate-50 dark:hover:bg-slate-50 dark:hover:text-slate-900"
        >
          {ctaLabel}
          <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
        </button>
      </footer>
    </section>
  )
}
