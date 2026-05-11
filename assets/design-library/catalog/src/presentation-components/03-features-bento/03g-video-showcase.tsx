import type React from "react"
import { Play, Zap, Shield, BarChart3, Users } from "lucide-react"

interface MiniFeature {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

interface VideoShowcaseProps {
  videoPosterUrl?: string
  videoLabel?: string
  features?: MiniFeature[]
  title?: string
  subtitle?: string
  onPlay?: () => void
}

const DEFAULT_FEATURES: MiniFeature[] = [
  {
    icon: Zap,
    title: "Deploy em 45s",
    description: "Do commit à produção em menos de 1 minuto.",
  },
  {
    icon: Shield,
    title: "Enterprise security",
    description: "SOC 2 Type II, LGPD e criptografia AES-256.",
  },
  {
    icon: BarChart3,
    title: "Analytics real-time",
    description: "Dashboards que atualizam enquanto você observa.",
  },
  {
    icon: Users,
    title: "Colaboração ao vivo",
    description: "Presença, cursores, comentários. Como o Figma.",
  },
]

export default function VideoShowcase({
  videoPosterUrl = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
  videoLabel = "Veja em 2 minutos",
  features = DEFAULT_FEATURES,
  title = "Entenda em 2 minutos",
  subtitle = "Uma demo rápida do que torna a plataforma diferente",
  onPlay,
}: VideoShowcaseProps) {
  return (
    <section className="bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">{subtitle}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.5fr_1fr]">
          <div className="grid grid-cols-1 gap-4 content-start">
            {features.slice(0, 2).map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800"
                >
                  <Icon
                    className="h-5 w-5 text-slate-700 dark:text-slate-300"
                    aria-hidden="true"
                  />
                  <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {f.description}
                  </p>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={onPlay}
            aria-label={videoLabel}
            className="group relative aspect-video overflow-hidden rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800"
            style={{
              backgroundImage: `url(${videoPosterUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/20 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-2xl transition group-hover:scale-110 dark:bg-slate-50">
                <Play
                  className="h-7 w-7 translate-x-0.5 text-slate-900 fill-current"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div className="absolute bottom-4 left-4 text-left">
              <span className="rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-slate-900 backdrop-blur-sm dark:bg-slate-950/80 dark:text-slate-50">
                {videoLabel}
              </span>
            </div>
          </button>

          <div className="grid grid-cols-1 gap-4 content-start">
            {features.slice(2, 4).map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800"
                >
                  <Icon
                    className="h-5 w-5 text-slate-700 dark:text-slate-300"
                    aria-hidden="true"
                  />
                  <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {f.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
