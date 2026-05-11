import { ArrowRight } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface VideoAutoplayBgHeroProps {
  videoSrc?: string
  posterSrc?: string
  title?: string
  subtitle?: string
  primaryCta?: { label: string; onClick?: () => void }
  className?: string
}

export default function VideoAutoplayBgHero({
  videoSrc = "/hero-bg.mp4",
  posterSrc,
  title = "Uma nova forma de criar",
  subtitle = "Veja seu projeto ganhar vida em tempo real.",
  primaryCta = { label: "Conhecer a plataforma" },
  className,
}: VideoAutoplayBgHeroProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-[80vh] w-full items-center justify-center overflow-hidden bg-slate-950 px-6 py-24",
        className
      )}
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        poster={posterSrc}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/60 to-slate-950"
      />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Ao vivo agora
        </span>
        <h1 className="text-balance text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-lg text-slate-200 md:text-xl">
          {subtitle}
        </p>
        <button
          onClick={primaryCta.onClick}
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {primaryCta.label}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
