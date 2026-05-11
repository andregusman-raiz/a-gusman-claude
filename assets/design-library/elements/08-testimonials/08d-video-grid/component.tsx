import * as React from "react"
import { Play } from "lucide-react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

interface VideoTestimonial {
  name: string
  role: string
  company: string
  duration: string
  gradient: string
}

const VIDEOS: VideoTestimonial[] = [
  {
    name: "Ana Pereira",
    role: "Head de Operações",
    company: "Quantum",
    duration: "1:42",
    gradient: "from-amber-400 to-pink-500",
  },
  {
    name: "Bruno Santos",
    role: "CTO",
    company: "Oliva",
    duration: "2:15",
    gradient: "from-sky-400 to-indigo-500",
  },
  {
    name: "Carla Melo",
    role: "Diretora de Produto",
    company: "Verde",
    duration: "1:08",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    name: "Diego Ferraz",
    role: "Eng. de Software",
    company: "Norte",
    duration: "3:02",
    gradient: "from-violet-400 to-fuchsia-500",
  },
]

export default function VideoGrid({
  className,
}: {
  className?: string
}) {
  return (
    <section
      aria-labelledby="video-heading"
      className={cn("bg-white py-20 dark:bg-neutral-950", className)}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2
            id="video-heading"
            className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50"
          >
            Ouça dos próprios clientes
          </h2>
          <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400">
            Casos reais em vídeo. Sem script.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {VIDEOS.map((v, i) => (
            <li key={i}>
              <button
                type="button"
                aria-label={`Assistir depoimento de ${v.name}, ${v.company}`}
                className="group block w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left transition-shadow hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div
                  className={cn(
                    "relative aspect-video w-full bg-gradient-to-br",
                    v.gradient
                  )}
                >
                  <div className="absolute inset-0 bg-black/20 transition-opacity group-hover:bg-black/30" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-neutral-900 shadow-lg transition-transform group-hover:scale-110">
                      <Play className="ml-1 h-6 w-6 fill-current" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
                    {v.duration}
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                    {v.name}
                  </div>
                  <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {v.role} · {v.company}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
