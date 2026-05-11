"use client"

import { useState, useEffect } from "react"
import { Clock, ArrowRight } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface CountdownUrgencyCTAProps {
  title?: string
  subtitle?: string
  targetDate?: Date
  ctaLabel?: string
  onCtaClick?: () => void
  className?: string
}

interface TimeLeft {
  hours: number
  minutes: number
  seconds: number
}

function computeTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now())
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  return { hours, minutes, seconds }
}

export default function CountdownUrgencyCTA({
  title = "Oferta termina em breve",
  subtitle = "Garanta 40% de desconto nos primeiros 3 meses — esta promoção expira hoje.",
  targetDate = new Date(Date.now() + 1000 * 60 * 60 * 6),
  ctaLabel = "Aproveitar agora",
  onCtaClick,
  className,
}: CountdownUrgencyCTAProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(computeTimeLeft(targetDate))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(computeTimeLeft(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  const pad = (n: number) => String(n).padStart(2, "0")

  return (
    <section
      className={cn(
        "w-full bg-gradient-to-br from-rose-600 to-red-600 px-6 py-16 text-white md:py-20",
        className
      )}
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
          <Clock className="h-3 w-3" aria-hidden="true" />
          Termina em breve
        </span>

        <h2 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-pretty text-base text-white/90 md:text-lg">
          {subtitle}
        </p>

        <div
          className="mt-8 flex items-center gap-3 md:gap-5"
          role="timer"
          aria-live="polite"
          aria-label={`${timeLeft.hours} horas, ${timeLeft.minutes} minutos, ${timeLeft.seconds} segundos restantes`}
        >
          {[
            { value: pad(timeLeft.hours), label: "Horas" },
            { value: pad(timeLeft.minutes), label: "Min" },
            { value: pad(timeLeft.seconds), label: "Seg" },
          ].map((unit, i, arr) => (
            <div key={unit.label} className="flex items-center gap-3 md:gap-5">
              <div className="flex flex-col items-center">
                <div className="rounded-lg bg-white/15 px-4 py-3 text-3xl font-bold tabular-nums backdrop-blur md:px-6 md:py-4 md:text-5xl">
                  {unit.value}
                </div>
                <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/80">
                  {unit.label}
                </span>
              </div>
              {i < arr.length - 1 && <span className="text-3xl font-bold text-white/40 md:text-5xl">:</span>}
            </div>
          ))}
        </div>

        <button
          onClick={onCtaClick}
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-rose-700 shadow-xl transition hover:scale-[1.02] hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          {ctaLabel}
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
