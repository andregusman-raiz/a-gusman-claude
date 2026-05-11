import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Zap } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface CardStat {
  icon: React.ReactNode
  value: string
  label: string
  trend: { direction: "up" | "down"; value: string }
}

export interface CardBasedStatsProps {
  title?: string
  subtitle?: string
  stats?: CardStat[]
  className?: string
}

const defaultStats: CardStat[] = [
  {
    icon: <Users className="h-5 w-5" aria-hidden="true" />,
    value: "12.4k",
    label: "Usuários ativos",
    trend: { direction: "up", value: "+18.3%" },
  },
  {
    icon: <DollarSign className="h-5 w-5" aria-hidden="true" />,
    value: "R$ 2.3M",
    label: "Receita mensal",
    trend: { direction: "up", value: "+12.1%" },
  },
  {
    icon: <Activity className="h-5 w-5" aria-hidden="true" />,
    value: "98.7%",
    label: "Uptime",
    trend: { direction: "up", value: "+0.2%" },
  },
  {
    icon: <Zap className="h-5 w-5" aria-hidden="true" />,
    value: "140ms",
    label: "Latência média",
    trend: { direction: "down", value: "-8.4%" },
  },
]

export default function CardBasedStats({
  title = "Números que contam nossa história",
  subtitle = "Atualizados em tempo real para você acompanhar.",
  stats = defaultStats,
  className,
}: CardBasedStatsProps) {
  return (
    <section
      className={cn(
        "w-full bg-white px-6 py-16 dark:bg-slate-950 md:py-20",
        className
      )}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-pretty text-base text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => {
            const TrendIcon = stat.trend.direction === "up" ? TrendingUp : TrendingDown
            const trendColor =
              stat.trend.direction === "up"
                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950"
                : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950"

            return (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {stat.icon}
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                      trendColor
                    )}
                  >
                    <TrendIcon className="h-3 w-3" aria-hidden="true" />
                    {stat.trend.value}
                  </span>
                </div>
                <div className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
