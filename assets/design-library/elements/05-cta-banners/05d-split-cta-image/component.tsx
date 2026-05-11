import { ArrowRight, Sparkles } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface SplitCTAImageProps {
  eyebrow?: string
  title?: string
  subtitle?: string
  primaryCta?: { label: string; onClick?: () => void }
  secondaryCta?: { label: string; onClick?: () => void }
  imageAlt?: string
  className?: string
}

export default function SplitCTAImage({
  eyebrow = "Disponível agora",
  title = "Transforme seu time em 30 dias",
  subtitle = "Onboarding guiado, templates prontos e suporte dedicado.",
  primaryCta = { label: "Agendar demonstração" },
  secondaryCta = { label: "Ver preços" },
  imageAlt = "Ilustração do produto",
  className,
}: SplitCTAImageProps) {
  return (
    <section
      className={cn(
        "w-full bg-white px-6 py-16 dark:bg-slate-950 md:py-24",
        className
      )}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 md:p-12 lg:grid-cols-2 lg:gap-16">
        <div>
          {eyebrow && (
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {eyebrow}
            </span>
          )}
          <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
            {title}
          </h2>
          <p className="mt-4 max-w-lg text-pretty text-base text-slate-600 dark:text-slate-400 md:text-lg">
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
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-50 dark:hover:bg-slate-900"
            >
              {secondaryCta.label}
            </button>
          </div>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-tr from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
          <div className="flex h-full items-center justify-center">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300" aria-label={imageAlt}>
              [ Ilustração / Screenshot ]
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
