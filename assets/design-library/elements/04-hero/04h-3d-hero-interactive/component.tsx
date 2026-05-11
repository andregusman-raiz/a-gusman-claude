"use client"

import { useState } from "react"
import { ArrowRight, Box } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface ThreeDHeroInteractiveProps {
  title?: string
  subtitle?: string
  primaryCta?: { label: string; onClick?: () => void }
  className?: string
}

export default function ThreeDHeroInteractive({
  title = "Crie experiências que ganham vida",
  subtitle = "Arraste o cubo. Mova o mouse. Interaja com um hero que responde ao usuário.",
  primaryCta = { label: "Experimente agora" },
  className,
}: ThreeDHeroInteractiveProps) {
  const [rotation, setRotation] = useState({ x: -20, y: 20 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * -40
    const y = ((e.clientX - rect.left) / rect.width - 0.5) * 40
    setRotation({ x, y })
  }

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden bg-slate-950 px-6 py-20 md:py-28",
        className
      )}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <div>
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
            <Box className="h-3 w-3" aria-hidden="true" />
            Interativo
          </span>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-lg text-pretty text-lg text-slate-300">
            {subtitle}
          </p>
          <button
            onClick={primaryCta.onClick}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            {primaryCta.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div
          onMouseMove={handleMouseMove}
          className="relative flex h-[420px] items-center justify-center"
          style={{ perspective: "1000px" }}
          role="img"
          aria-label="Objeto 3D interativo"
        >
          <div
            className="relative h-48 w-48 transition-transform duration-200 ease-out"
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            }}
          >
            {[
              { t: "translateZ(96px)", bg: "from-indigo-400 to-indigo-600" },
              { t: "translateZ(-96px) rotateY(180deg)", bg: "from-purple-400 to-purple-600" },
              { t: "translateX(96px) rotateY(90deg)", bg: "from-fuchsia-400 to-fuchsia-600" },
              { t: "translateX(-96px) rotateY(-90deg)", bg: "from-pink-400 to-pink-600" },
              { t: "translateY(-96px) rotateX(90deg)", bg: "from-cyan-400 to-cyan-600" },
              { t: "translateY(96px) rotateX(-90deg)", bg: "from-blue-400 to-blue-600" },
            ].map((face, i) => (
              <div
                key={i}
                className={cn(
                  "absolute inset-0 rounded-lg border border-white/20 bg-gradient-to-br shadow-xl",
                  face.bg
                )}
                style={{ transform: face.t, backfaceVisibility: "hidden" }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
