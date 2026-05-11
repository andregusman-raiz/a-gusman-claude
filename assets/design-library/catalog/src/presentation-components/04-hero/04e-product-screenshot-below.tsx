import { ArrowRight } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface ProductScreenshotBelowHeroProps {
  eyebrow?: string
  title?: string
  subtitle?: string
  primaryCta?: { label: string; onClick?: () => void }
  className?: string
}

export default function ProductScreenshotBelowHero({
  eyebrow = "Versão 2.0 disponível",
  title = "Todas as suas métricas em um só lugar",
  subtitle = "Conecte suas fontes de dados em minutos e deixe a análise automatizada fazer o resto.",
  primaryCta = { label: "Teste grátis por 14 dias" },
  className,
}: ProductScreenshotBelowHeroProps) {
  return (
    <section
      className={cn(
        "relative w-full overflow-hidden bg-gradient-to-b from-slate-50 to-white px-6 pt-20 dark:from-slate-900 dark:to-slate-950 md:pt-28",
        className
      )}
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        {eyebrow && (
          <span className="mb-6 inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {eyebrow}
          </span>
        )}
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

      <div className="relative mx-auto mt-16 max-w-6xl md:mt-20">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-[0_50px_100px_-20px_rgba(15,23,42,0.3)] dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <span className="ml-3 text-xs text-slate-500 dark:text-slate-400">app.exemplo.com</span>
          </div>
          <div className="flex h-[calc(100%-2.75rem)] items-center justify-center">
            <span
              className="text-sm font-medium text-slate-500 dark:text-slate-400"
              aria-label="Captura de tela do produto"
            >
              [ Dashboard completo aqui ]
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
