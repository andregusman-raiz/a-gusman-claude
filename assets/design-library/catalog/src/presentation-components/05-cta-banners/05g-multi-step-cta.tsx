import { Rocket, Play, PhoneCall, ArrowRight, Check } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface MultiStepCTAOption {
  icon: React.ReactNode
  title: string
  description: string
  bullets: string[]
  ctaLabel: string
  onCtaClick?: () => void
  highlighted?: boolean
}

export interface MultiStepCTAProps {
  title?: string
  subtitle?: string
  options?: MultiStepCTAOption[]
  className?: string
}

const defaultOptions: MultiStepCTAOption[] = [
  {
    icon: <Rocket className="h-5 w-5" aria-hidden="true" />,
    title: "Teste grátis",
    description: "14 dias completos, sem cartão.",
    bullets: ["Todas as features", "Suporte por email", "Cancele quando quiser"],
    ctaLabel: "Começar grátis",
  },
  {
    icon: <Play className="h-5 w-5" aria-hidden="true" />,
    title: "Agendar demo",
    description: "30 minutos com um especialista.",
    bullets: ["Walkthrough guiado", "Casos do seu setor", "Q&A personalizado"],
    ctaLabel: "Agendar demo",
    highlighted: true,
  },
  {
    icon: <PhoneCall className="h-5 w-5" aria-hidden="true" />,
    title: "Falar com vendas",
    description: "Para equipes acima de 50 pessoas.",
    bullets: ["Enterprise pricing", "SLA dedicado", "Onboarding customizado"],
    ctaLabel: "Entrar em contato",
  },
]

export default function MultiStepCTA({
  title = "Qual o próximo passo?",
  subtitle = "Escolha o caminho que faz mais sentido para você.",
  options = defaultOptions,
  className,
}: MultiStepCTAProps) {
  return (
    <section
      className={cn(
        "w-full bg-slate-50 px-6 py-20 dark:bg-slate-900 md:py-24",
        className
      )}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-pretty text-base text-slate-600 dark:text-slate-400 md:text-lg">
            {subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {options.map((opt, i) => (
            <div
              key={i}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 transition",
                opt.highlighted
                  ? "border-slate-900 bg-slate-900 text-slate-50 shadow-lg dark:border-slate-50 dark:bg-slate-50 dark:text-slate-900"
                  : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:hover:border-slate-700"
              )}
            >
              {opt.highlighted && (
                <span className="absolute -top-3 right-6 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950">
                  Mais popular
                </span>
              )}

              <div
                className={cn(
                  "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg",
                  opt.highlighted
                    ? "bg-white/10 text-slate-50 dark:bg-slate-900/10 dark:text-slate-900"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300"
                )}
              >
                {opt.icon}
              </div>

              <h3 className="text-xl font-bold">{opt.title}</h3>
              <p
                className={cn(
                  "mt-1 text-sm",
                  opt.highlighted
                    ? "text-slate-300 dark:text-slate-600"
                    : "text-slate-600 dark:text-slate-400"
                )}
              >
                {opt.description}
              </p>

              <ul className="mt-5 space-y-2 text-sm">
                {opt.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={opt.onCtaClick}
                className={cn(
                  "mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition",
                  opt.highlighted
                    ? "bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
                    : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
                )}
              >
                {opt.ctaLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
