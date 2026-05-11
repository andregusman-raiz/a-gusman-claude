import { Check, X } from "lucide-react"

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ")

interface FeatureRow {
  name: string
  values: (boolean | string)[]
}

interface ComparisonTableProps {
  tiers?: { name: string; price: string; cta: string; highlighted?: boolean }[]
  features?: FeatureRow[]
  title?: string
  onSelect?: (tier: string) => void
}

const DEFAULT_TIERS = [
  { name: "Free", price: "R$ 0", cta: "Começar" },
  { name: "Pro", price: "R$ 79", cta: "Escolher Pro", highlighted: true },
  { name: "Business", price: "R$ 199", cta: "Escolher Business" },
]

const DEFAULT_FEATURES: FeatureRow[] = [
  { name: "Projetos", values: ["3", "Ilimitados", "Ilimitados"] },
  { name: "Armazenamento", values: ["1GB", "50GB", "500GB"] },
  { name: "Usuários", values: ["1", "10", "Ilimitados"] },
  { name: "Suporte prioritário", values: [false, true, true] },
  { name: "SSO / SAML", values: [false, false, true] },
  { name: "API access", values: [false, true, true] },
  { name: "Analytics avançado", values: [false, true, true] },
  { name: "Audit logs", values: [false, false, true] },
  { name: "Onboarding dedicado", values: [false, false, true] },
]

function renderValue(v: boolean | string) {
  if (v === true)
    return <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mx-auto" aria-label="Incluído" />
  if (v === false)
    return <X className="h-5 w-5 text-slate-300 dark:text-slate-700 mx-auto" aria-label="Não incluído" />
  return (
    <span className="text-sm text-slate-700 dark:text-slate-300 block text-center">
      {v}
    </span>
  )
}

export default function ComparisonTable({
  tiers = DEFAULT_TIERS,
  features = DEFAULT_FEATURES,
  title = "Compare os planos",
  onSelect,
}: ComparisonTableProps) {
  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h2>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th scope="col" className="text-left pb-4 pr-4 w-1/3">
                  <span className="sr-only">Feature</span>
                </th>
                {tiers.map((tier) => (
                  <th
                    key={tier.name}
                    scope="col"
                    className={cn(
                      "pb-4 px-4 align-top",
                      tier.highlighted && "bg-slate-50 dark:bg-slate-900 rounded-t-xl"
                    )}
                  >
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      {tier.name}
                    </div>
                    <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {tier.price}
                      <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                        /mês
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelect?.(tier.name)}
                      className={cn(
                        "mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold",
                        tier.highlighted
                          ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
                          : "bg-white text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-50 dark:ring-slate-700 dark:hover:bg-slate-900"
                      )}
                    >
                      {tier.cta}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feat, idx) => (
                <tr
                  key={feat.name}
                  className={cn(
                    "border-t border-slate-200 dark:border-slate-800",
                    idx % 2 === 1 && "bg-slate-50/50 dark:bg-slate-900/30"
                  )}
                >
                  <th
                    scope="row"
                    className="py-4 pr-4 text-left text-sm font-medium text-slate-900 dark:text-slate-200"
                  >
                    {feat.name}
                  </th>
                  {feat.values.map((v, i) => (
                    <td
                      key={i}
                      className={cn(
                        "py-4 px-4",
                        tiers[i]?.highlighted && "bg-slate-50 dark:bg-slate-900"
                      )}
                    >
                      {renderValue(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
