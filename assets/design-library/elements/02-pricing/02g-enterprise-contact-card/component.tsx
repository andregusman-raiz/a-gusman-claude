import { Check, Building2, ArrowRight } from "lucide-react"

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ")

interface Tier {
  name: string
  price?: string
  description: string
  features: string[]
  cta: string
  highlighted?: boolean
  isEnterprise?: boolean
}

interface EnterpriseContactCardProps {
  tiers?: Tier[]
  title?: string
  onSelect?: (tier: string) => void
}

const DEFAULT_TIERS: Tier[] = [
  {
    name: "Starter",
    price: "R$ 29",
    description: "Para começar",
    features: ["5 projetos", "10GB", "Suporte e-mail"],
    cta: "Começar",
  },
  {
    name: "Pro",
    price: "R$ 79",
    description: "Times pequenos",
    features: ["Ilimitado", "100GB", "Analytics", "Prioritário"],
    cta: "Escolher Pro",
    highlighted: true,
  },
  {
    name: "Business",
    price: "R$ 299",
    description: "Empresas médias",
    features: ["Tudo do Pro", "500GB", "SSO", "Audit logs"],
    cta: "Escolher Business",
  },
  {
    name: "Enterprise",
    description: "Organizações grandes",
    features: [
      "Tudo do Business",
      "SLA 99.99%",
      "Infra dedicada",
      "CSM dedicado",
      "Compliance custom",
    ],
    cta: "Falar com vendas",
    isEnterprise: true,
  },
]

export default function EnterpriseContactCard({
  tiers = DEFAULT_TIERS,
  title = "Do time solo à enterprise",
  onSelect,
}: EnterpriseContactCardProps) {
  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          {title}
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "flex flex-col rounded-2xl p-6 ring-1",
                tier.isEnterprise
                  ? "bg-gradient-to-br from-indigo-600 to-purple-700 ring-indigo-500 text-white"
                  : tier.highlighted
                    ? "bg-slate-900 ring-slate-900 dark:bg-slate-50 dark:ring-slate-50"
                    : "bg-white ring-slate-200 dark:bg-slate-950 dark:ring-slate-800"
              )}
            >
              <div className="flex items-center gap-2">
                {tier.isEnterprise && (
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                )}
                <h3
                  className={cn(
                    "text-lg font-semibold",
                    tier.isEnterprise
                      ? "text-white"
                      : tier.highlighted
                        ? "text-white dark:text-slate-900"
                        : "text-slate-900 dark:text-slate-50"
                  )}
                >
                  {tier.name}
                </h3>
              </div>
              <p
                className={cn(
                  "mt-1 text-sm",
                  tier.isEnterprise
                    ? "text-indigo-100"
                    : tier.highlighted
                      ? "text-slate-300 dark:text-slate-600"
                      : "text-slate-600 dark:text-slate-400"
                )}
              >
                {tier.description}
              </p>

              <div className="mt-4 min-h-[3rem]">
                {tier.price ? (
                  <>
                    <span
                      className={cn(
                        "text-3xl font-bold",
                        tier.highlighted
                          ? "text-white dark:text-slate-900"
                          : "text-slate-900 dark:text-slate-50"
                      )}
                    >
                      {tier.price}
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        tier.highlighted
                          ? "text-slate-300 dark:text-slate-600"
                          : "text-slate-500 dark:text-slate-400"
                      )}
                    >
                      /mês
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-white">
                    Sob consulta
                  </span>
                )}
              </div>

              <ul className="mt-4 space-y-2 flex-1 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check
                      className={cn(
                        "h-4 w-4 flex-shrink-0 mt-0.5",
                        tier.isEnterprise
                          ? "text-emerald-300"
                          : tier.highlighted
                            ? "text-emerald-400 dark:text-emerald-600"
                            : "text-emerald-600 dark:text-emerald-400"
                      )}
                    />
                    <span
                      className={cn(
                        tier.isEnterprise
                          ? "text-indigo-50"
                          : tier.highlighted
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
                  "mt-6 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold",
                  tier.isEnterprise
                    ? "bg-white text-indigo-700 hover:bg-indigo-50"
                    : tier.highlighted
                      ? "bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
                      : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
                )}
              >
                {tier.cta}
                {tier.isEnterprise && (
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
