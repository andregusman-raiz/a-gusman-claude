"use client"

import { useEffect, useRef, useState } from "react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface AnimatedStat {
  value: number
  label: string
  suffix?: string
  prefix?: string
  decimals?: number
}

export interface AnimatedCounterStatsProps {
  stats?: AnimatedStat[]
  duration?: number
  className?: string
}

const defaultStats: AnimatedStat[] = [
  { value: 500, label: "Empresas ativas", suffix: "+" },
  { value: 98, label: "NPS médio", suffix: "%" },
  { value: 2.3, label: "Milhões de transações", suffix: "M", decimals: 1 },
  { value: 24, label: "Países atendidos" },
]

function formatNumber(n: number, decimals = 0) {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function Counter({ stat, duration, start }: { stat: AnimatedStat; duration: number; start: boolean }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!start) return
    let raf: number
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(stat.value * eased)
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start, stat.value, duration])

  return (
    <span className="tabular-nums">
      {stat.prefix}
      {formatNumber(current, stat.decimals)}
      {stat.suffix}
    </span>
  )
}

export default function AnimatedCounterStats({
  stats = defaultStats,
  duration = 1600,
  className,
}: AnimatedCounterStatsProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { threshold: 0.3 }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      className={cn(
        "w-full bg-slate-50 px-6 py-16 dark:bg-slate-900 md:py-20",
        className
      )}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-5xl lg:text-6xl">
                <Counter stat={stat} duration={duration} start={visible} />
              </div>
              <div className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400 md:text-base">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
