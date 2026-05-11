"use client"

import { useState } from "react"
import { Check } from "lucide-react"

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ")

interface Tier {
  name: string
  monthly: number
  annual: number
  description: string
  features: string[]
  highlighted?: boolean
}

interface MonthlyAnnualToggleProps {
  tiers?: Tier[]
  title?: string
  onSelect?: (tier: string, cycle: "monthly" | "annual") => void
}

const DEFAULT_TIERS: Tier[] = [
  {
    name: "Starter",
    monthly: 29,
    annual: 23,
    description: "Para times começando",
    features: ["5 projetos", "10GB storage", "Suporte via e-mail"],
  },
  {
    name: "Growth",
    monthly: 79,
    annual: 59,
    description: "Para times escalando",
    features: [
      "Projetos ilimitados",
      "100GB storage",
      "Suporte prioritário",
      "Analytics",
    ],
    highlighted: true,
  },
  {
    name: "Scale",
    monthly: 199,
    annual: 149,
    description: "Para organizações",
    features: [
      "Tudo do Growth",
      "SSO + SAML",
      "Audit logs",
      "Onboarding dedicado",
    ],
  },
]

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default function MonthlyAnnualToggle({
  tiers = DEFAULT_TIERS,
  title = "Escolha seu plano",
  onSelect,
}: MonthlyAnnualToggleProps) {
  const [cycle, setCycle] = useState<"monthly" | "annual">("annual")

  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          {title}
        </h2>

        <div
          role="tablist"
          aria-label="Ciclo de cobrança"
          className="mt-8 mx-auto inline-flex items-center gap-1 rounded-full bg-slate-100 p-1 dark:bg-slate-800"
        >
          <button
            role="tab"
            aria-selected={cycle === "monthly"}
            onClick={() => setCycle("monthly")}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              cycle === "monthly"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-50"
                : "text-slate-600 dark:text-slate-400"
            )}
          >
            Mensal
          </button>
          <button
            role="tab"
            aria-selected={cycle === "annual"}
            onClick={() => setCycle("annual")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition",
              cycle === "annual"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-50"
                : "text-slate-600 dark:text-slate-400"
            )}
          >
            Anual
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              -20%
            </span>
          </button>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {tiers.map((tier) => {
            const price = cycle === "monthly" ? tier.monthly : tier.annual
            const savings = tier.monthly - tier.annual
            return (
              <div
                key={tier.name}
                className={cn(
                  "relative flex flex-col rounded-2xl p-8 ring-1",
                  tier.highlighted
                    ? "bg-slate-900 ring-slate-900 shadow-2xl dark:bg-slate-50 dark:ring-slate-50"
                    : "bg-white ring-slate-200 dark:bg-slate-950 dark:ring-slate-800"
                )}
              >
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
                    {formatBRL(price)}
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
                </div>
                {cycle === "annual" && (
                  <span
                    className={cn(
                      "mt-2 inline-flex self-start rounded-full px-2 py-0.5 text-xs font-semibold",
                      tier.highlighted
                        ? "bg-emerald-400 text-emerald-950"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    )}
                  >
                    Economize {formatBRL(savings)}/mês
                  </span>
                )}

                <ul className="mt-6 space-y-2 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check
                        className={cn(
                          "h-4 w-4 flex-shrink-0 mt-0.5",
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
                  onClick={() => onSelect?.(tier.name, cycle)}
                  className={cn(
                    "mt-8 w-full rounded-lg px-4 py-2.5 text-sm font-semibold",
                    tier.highlighted
                      ? "bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
                      : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
                  )}
                >
                  Escolher {tier.name}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
