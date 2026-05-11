import { Check } from "lucide-react"

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ")

interface Tier {
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  cta: string
  highlighted?: boolean
}

interface Classic3TierProps {
  tiers?: Tier[]
  title?: string
  subtitle?: string
  onSelect?: (tier: string) => void
}

const DEFAULT_TIERS: Tier[] = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    description: "Para começar e explorar",
    features: ["Até 3 projetos", "1GB de armazenamento", "Suporte comunidade"],
    cta: "Começar grátis",
  },
  {
    name: "Pro",
    price: "R$ 79",
    period: "/mês",
    description: "Para times pequenos",
    features: [
      "Projetos ilimitados",
      "50GB de armazenamento",
      "Suporte prioritário",
      "Integrações avançadas",
      "Analytics",
    ],
    cta: "Começar Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "R$ 299",
    period: "/mês",
    description: "Para organizações",
    features: [
      "Tudo do Pro",
      "SSO + SAML",
      "Armazenamento ilimitado",
      "Suporte 24/7",
      "Onboarding dedicado",
    ],
    cta: "Falar com vendas",
  },
]

export default function Classic3Tier({
  tiers = DEFAULT_TIERS,
  title = "Planos simples e transparentes",
  subtitle = "Escolha o plano que melhor atende seu time.",
  onSelect,
}: Classic3TierProps) {
  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-2xl p-8 ring-1 transition",
                tier.highlighted
                  ? "bg-slate-900 ring-slate-900 shadow-2xl dark:bg-slate-50 dark:ring-slate-50 md:scale-105"
                  : "bg-white ring-slate-200 dark:bg-slate-950 dark:ring-slate-800"
              )}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white">
                  Popular
                </span>
              )}

              <h3
                className={cn(
                  "text-lg font-semibold",
                  tier.highlighted
                    ? "text-white dark:text-slate-900"
                    : "text-slate-900 dark:text-slate-50"
                )}
              >
                {tier.name}
              </h3>
              <p
                className={cn(
                  "mt-1 text-sm",
                  tier.highlighted
                    ? "text-slate-300 dark:text-slate-600"
                    : "text-slate-600 dark:text-slate-400"
                )}
              >
                {tier.description}
              </p>

              <div className="mt-6">
                <span
                  className={cn(
                    "text-4xl font-bold tracking-tight",
                    tier.highlighted
                      ? "text-white dark:text-slate-900"
                      : "text-slate-900 dark:text-slate-50"
                  )}
                >
                  {tier.price}
                </span>
                {tier.period && (
                  <span
                    className={cn(
                      "text-sm",
                      tier.highlighted
                        ? "text-slate-300 dark:text-slate-600"
                        : "text-slate-500 dark:text-slate-500"
                    )}
                  >
                    {tier.period}
                  </span>
                )}
              </div>

              <ul className="mt-6 space-y-3 flex-1">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm">
                    <Check
                      className={cn(
                        "h-4 w-4 flex-shrink-0 mt-0.5",
                        tier.highlighted
                          ? "text-emerald-400 dark:text-emerald-600"
                          : "text-emerald-600 dark:text-emerald-400"
                      )}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        tier.highlighted
                          ? "text-slate-100 dark:text-slate-800"
                          : "text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => onSelect?.(tier.name)}
                className={cn(
                  "mt-8 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition",
                  tier.highlighted
                    ? "bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
                    : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
                )}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
