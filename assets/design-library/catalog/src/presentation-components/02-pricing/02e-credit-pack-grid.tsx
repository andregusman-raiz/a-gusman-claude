import { Zap, Check } from "lucide-react"

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ")

interface Pack {
  credits: number
  price: number
  pricePerCredit?: number
  popular?: boolean
  bonus?: string
}

interface CreditPackGridProps {
  packs?: Pack[]
  title?: string
  subtitle?: string
  onSelect?: (credits: number, price: number) => void
}

const DEFAULT_PACKS: Pack[] = [
  { credits: 100, price: 10 },
  { credits: 300, price: 27, bonus: "10% off" },
  { credits: 600, price: 50, bonus: "17% off", popular: true },
  { credits: 1500, price: 120, bonus: "20% off" },
  { credits: 5000, price: 375, bonus: "25% off" },
  { credits: 15000, price: 1000, bonus: "33% off" },
]

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default function CreditPackGrid({
  packs = DEFAULT_PACKS,
  title = "Compre créditos de IA",
  subtitle = "Sem assinatura. Pague só pelo que usar. Créditos nunca expiram.",
  onSelect,
}: CreditPackGridProps) {
  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3">
          {packs.map((pack) => {
            const perCredit = pack.pricePerCredit ?? pack.price / pack.credits
            return (
              <button
                key={pack.credits}
                type="button"
                onClick={() => onSelect?.(pack.credits, pack.price)}
                className={cn(
                  "relative flex flex-col rounded-xl p-6 text-left ring-1 transition hover:shadow-lg",
                  pack.popular
                    ? "bg-slate-900 ring-slate-900 dark:bg-slate-50 dark:ring-slate-50"
                    : "bg-white ring-slate-200 hover:ring-slate-300 dark:bg-slate-950 dark:ring-slate-800 dark:hover:ring-slate-700"
                )}
              >
                {pack.popular && (
                  <span className="absolute -top-2 right-4 rounded-full bg-indigo-500 px-2 py-0.5 text-xs font-semibold text-white">
                    Popular
                  </span>
                )}
                <Zap
                  className={cn(
                    "h-5 w-5",
                    pack.popular
                      ? "text-amber-300 dark:text-amber-600"
                      : "text-amber-500 dark:text-amber-400"
                  )}
                  aria-hidden="true"
                />
                <div
                  className={cn(
                    "mt-3 text-3xl font-bold",
                    pack.popular
                      ? "text-white dark:text-slate-900"
                      : "text-slate-900 dark:text-slate-50"
                  )}
                >
                  {pack.credits.toLocaleString("pt-BR")}
                </div>
                <div
                  className={cn(
                    "text-xs uppercase tracking-wider",
                    pack.popular
                      ? "text-slate-300 dark:text-slate-600"
                      : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  créditos
                </div>

                <div className="mt-6 flex items-baseline gap-1">
                  <span
                    className={cn(
                      "text-xl font-semibold",
                      pack.popular
                        ? "text-white dark:text-slate-900"
                        : "text-slate-900 dark:text-slate-50"
                    )}
                  >
                    {formatBRL(pack.price)}
                  </span>
                </div>
                <div
                  className={cn(
                    "text-xs",
                    pack.popular
                      ? "text-slate-300 dark:text-slate-600"
                      : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  {formatBRL(perCredit)} por crédito
                </div>

                {pack.bonus && (
                  <span
                    className={cn(
                      "mt-3 inline-flex items-center gap-1 self-start rounded-full px-2 py-0.5 text-xs font-semibold",
                      pack.popular
                        ? "bg-emerald-400 text-emerald-950"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    )}
                  >
                    <Check className="h-3 w-3" />
                    {pack.bonus}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">
          Créditos são debitados conforme o uso. 1 crédito ≈ 1.000 tokens.
        </p>
      </div>
    </section>
  )
}
