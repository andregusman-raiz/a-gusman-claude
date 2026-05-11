const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface Stat {
  value: string
  label: string
  hint?: string
}

export interface HorizontalRowStatsProps {
  stats?: Stat[]
  className?: string
}

const defaultStats: Stat[] = [
  { value: "500+", label: "Empresas atendidas" },
  { value: "98%", label: "Satisfação dos clientes" },
  { value: "24/7", label: "Suporte em português" },
  { value: "15 min", label: "Tempo médio de setup" },
]

export default function HorizontalRowStats({
  stats = defaultStats,
  className,
}: HorizontalRowStatsProps) {
  return (
    <section
      className={cn(
        "w-full bg-white px-6 py-16 dark:bg-slate-950 md:py-20",
        className
      )}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4 md:divide-x md:divide-slate-200 md:dark:divide-slate-800">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center px-6 text-center"
            >
              <div className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-5xl lg:text-6xl">
                {stat.value}
              </div>
              <div className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400 md:text-base">
                {stat.label}
              </div>
              {stat.hint && (
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                  {stat.hint}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
