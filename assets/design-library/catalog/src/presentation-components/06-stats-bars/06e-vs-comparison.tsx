import { Check, Minus } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface ComparisonStat {
  label: string
  market: string
  us: string
}

export interface VsComparisonStatsProps {
  title?: string
  subtitle?: string
  marketLabel?: string
  usLabel?: string
  stats?: ComparisonStat[]
  className?: string
}

const defaultStats: ComparisonStat[] = [
  { label: "Tempo médio de setup", market: "2 semanas", us: "15 minutos" },
  { label: "Tempo de resposta do suporte", market: "48 horas", us: "2 minutos" },
  { label: "Integrações disponíveis", market: "20", us: "120+" },
  { label: "NPS médio", market: "45", us: "82" },
]

export default function VsComparisonStats({
  title = "Por que equipes migram para a gente",
  subtitle = "Comparamos nós com a média do mercado. Os números falam por si.",
  marketLabel = "Média do mercado",
  usLabel = "Com a gente",
  stats = defaultStats,
  className,
}: VsComparisonStatsProps) {
  return (
    <section
      className={cn(
        "w-full bg-slate-50 px-6 py-16 dark:bg-slate-900 md:py-24",
        className
      )}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-pretty text-base text-slate-600 dark:text-slate-400 md:text-lg">
            {subtitle}
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-3 bg-white dark:bg-slate-950">
            <div className="border-b border-slate-200 p-4 dark:border-slate-800" />
            <div className="flex items-center justify-center gap-2 border-b border-slate-200 bg-slate-100 p-4 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
              <Minus className="h-4 w-4" aria-hidden="true" />
              {marketLabel}
            </div>
            <div className="flex items-center justify-center gap-2 border-b border-slate-900 bg-slate-900 p-4 text-sm font-semibold text-slate-50 dark:border-slate-50 dark:bg-slate-50 dark:text-slate-900">
              <Check className="h-4 w-4" aria-hidden="true" />
              {usLabel}
            </div>
          </div>

          {stats.map((stat, i) => (
            <div
              key={i}
              className={cn(
                "grid grid-cols-3 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950",
                i === 0 && "border-t-0"
              )}
            >
              <div className="p-5 text-sm font-medium text-slate-700 dark:text-slate-300 md:text-base">
                {stat.label}
              </div>
              <div className="flex items-center justify-center bg-slate-50 p-5 text-center text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400 md:text-base">
                {stat.market}
              </div>
              <div className="flex items-center justify-center bg-emerald-50 p-5 text-center text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 md:text-base">
                {stat.us}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
