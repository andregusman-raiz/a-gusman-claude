import { Check, Star } from "lucide-react"

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ")

interface Tier {
  name: string
  price: string
  description: string
  features: string[]
  cta: string
  highlighted?: boolean
}

interface StackedMobileFirstProps {
  tiers?: Tier[]
  title?: string
  onSelect?: (tier: string) => void
}

const DEFAULT_TIERS: Tier[] = [
  {
    name: "Free",
    price: "R$ 0",
    description: "Para começar",
    features: ["3 projetos", "1GB", "Comunidade"],
    cta: "Começar grátis",
  },
  {
    name: "Pro",
    price: "R$ 49",
    description: "Para profissionais",
    features: [
      "Projetos ilimitados",
      "50GB",
      "Suporte prioritário",
      "Analytics",
    ],
    cta: "Assinar Pro",
    highlighted: true,
  },
  {
    name: "Team",
    price: "R$ 149",
    description: "Para times",
    features: ["Tudo do Pro", "Usuários ilimitados", "SSO", "Admin dashboard"],
    cta: "Assinar Team",
  },
]

export default function StackedMobileFirst({
  tiers = DEFAULT_TIERS,
  title = "Planos pensados para o seu bolso",
  onSelect,
}: StackedMobileFirstProps) {
  return (
    <section className="bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-slate-900">
      <div className="mx-auto max-w-md">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h2>

        <div className="mt-8 space-y-4">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={cn(
                "relative rounded-2xl p-6 ring-1",
                tier.highlighted
                  ? "bg-slate-900 ring-slate-900 dark:bg-slate-50 dark:ring-slate-50"
                  : "bg-white ring-slate-200 dark:bg-slate-950 dark:ring-slate-800"
              )}
            >
              {tier.highlighted && (
                <span className="absolute -top-2 right-4 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-amber-950">
                  <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                  Mais popular
                </span>
              )}

              <div className="flex items-baseline justify-between">
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
                <div
                  className={cn(
                    "text-2xl font-bold",
                    tier.highlighted
                      ? "text-white dark:text-slate-900"
                      : "text-slate-900 dark:text-slate-50"
                  )}
                >
                  {tier.price}
                  <span
                    className={cn(
                      "text-xs font-normal",
                      tier.highlighted
                        ? "text-slate-300 dark:text-slate-600"
                        : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    /mês
                  </span>
                </div>
              </div>
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

              <ul className="mt-4 space-y-1.5 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        tier.highlighted
                          ? "text-emerald-400 dark:text-emerald-600"
                          : "text-emerald-600 dark:text-emerald-400"
                      )}
                    />
                    <span
                      className={cn(
                        tier.highlighted
                          ? "text-slate-100 dark:text-slate-800"
                          : "text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => onSelect?.(tier.name)}
                className={cn(
                  "mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold",
                  tier.highlighted
                    ? "bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
                    : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
                )}
              >
                {tier.cta}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
