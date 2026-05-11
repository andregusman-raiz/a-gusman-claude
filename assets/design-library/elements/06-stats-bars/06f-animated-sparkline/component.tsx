import { TrendingUp } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface SparklineStat {
  value: string
  label: string
  data: number[]
  trend?: string
}

export interface AnimatedSparklineStatsProps {
  stats?: SparklineStat[]
  className?: string
}

const defaultStats: SparklineStat[] = [
  {
    value: "R$ 2.3M",
    label: "Receita recorrente",
    data: [20, 28, 25, 36, 42, 40, 55, 62, 70, 78, 85, 92],
    trend: "+32% vs. ano passado",
  },
  {
    value: "12.4k",
    label: "Usuários ativos",
    data: [35, 40, 38, 45, 52, 58, 56, 65, 70, 75, 82, 88],
    trend: "+18% no trimestre",
  },
  {
    value: "98.7%",
    label: "Uptime",
    data: [95, 96, 97, 96, 98, 97, 98, 99, 98, 99, 99, 98],
    trend: "Estável há 12 meses",
  },
]

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const width = 100
  const height = 32
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * height
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(" ")

  const areaPath = `M0,${height} L${points.replace(/ /g, " L")} L${width},${height} Z`
  const linePath = `M${points.split(" ").join(" L")}`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("h-10 w-full", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkGrad)" />
      <path d={linePath} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function AnimatedSparklineStats({
  stats = defaultStats,
  className,
}: AnimatedSparklineStatsProps) {
  return (
    <section
      className={cn(
        "w-full bg-white px-6 py-16 dark:bg-slate-950 md:py-20",
        className
      )}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {stat.label}
              </div>
              <div className="mt-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {stat.value}
              </div>
              {stat.trend && (
                <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />
                  {stat.trend}
                </div>
              )}
              <div className="mt-4 text-indigo-500 dark:text-indigo-400">
                <Sparkline data={stat.data} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
