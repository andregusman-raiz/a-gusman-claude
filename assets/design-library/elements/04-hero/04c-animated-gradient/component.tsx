import { ArrowRight } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface AnimatedGradientHeroProps {
  title?: string
  subtitle?: string
  primaryCta?: { label: string; onClick?: () => void }
  className?: string
}

export default function AnimatedGradientHero({
  title = "O futuro do seu negócio começa aqui",
  subtitle = "Inteligência, velocidade e elegância em uma só plataforma.",
  primaryCta = { label: "Começar gratuitamente" },
  className,
}: AnimatedGradientHeroProps) {
  return (
    <section
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden bg-slate-950 px-6 py-28 md:py-36",
        className
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="blob blob-a absolute -left-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-indigo-500 opacity-40 blur-3xl" />
        <div className="blob blob-b absolute -right-32 top-1/3 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-500 opacity-40 blur-3xl" />
        <div className="blob blob-c absolute bottom-[-10rem] left-1/3 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 opacity-30 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
        <h1 className="text-balance text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-lg text-slate-300 md:text-xl">
          {subtitle}
        </p>
        <button
          onClick={primaryCta.onClick}
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-slate-900 shadow-xl transition hover:scale-[1.02] hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {primaryCta.label}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <style jsx>{`
        @keyframes float-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, 40px) scale(1.1); }
        }
        @keyframes float-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 60px) scale(0.95); }
        }
        @keyframes float-c {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, -40px) scale(1.05); }
        }
        .blob-a { animation: float-a 12s ease-in-out infinite; }
        .blob-b { animation: float-b 14s ease-in-out infinite; }
        .blob-c { animation: float-c 16s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .blob-a, .blob-b, .blob-c { animation: none; }
        }
      `}</style>
    </section>
  )
}
