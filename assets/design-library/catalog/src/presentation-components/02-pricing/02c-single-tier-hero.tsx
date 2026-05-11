import { Check, Sparkles } from "lucide-react"

interface SingleTierHeroProps {
  title?: string
  subtitle?: string
  price?: string
  period?: string
  features?: string[]
  cta?: string
  badge?: string
  onSelect?: () => void
}

export default function SingleTierHero({
  title = "Um plano. Tudo incluído.",
  subtitle = "Sem limites artificiais. Sem letras miúdas. Cancele quando quiser.",
  price = "R$ 49",
  period = "/mês",
  features = [
    "Projetos ilimitados",
    "Usuários ilimitados",
    "500GB de armazenamento",
    "Suporte prioritário 24/7",
    "Todas as integrações",
    "API sem limites",
    "SSO + SAML",
    "Audit logs completos",
  ],
  cta = "Começar agora",
  badge = "Oferta de lançamento",
  onSelect,
}: SingleTierHeroProps) {
  return (
    <section className="bg-slate-50 py-20 px-4 sm:px-6 lg:px-8 dark:bg-slate-900">
      <div className="mx-auto max-w-2xl text-center">
        {badge && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {badge}
          </span>
        )}
        <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
          {title}
        </h2>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">{subtitle}</p>

        <div className="mt-10 flex items-baseline justify-center gap-1">
          <span className="text-7xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {price}
          </span>
          <span className="text-xl text-slate-500 dark:text-slate-400">{period}</span>
        </div>

        <button
          type="button"
          onClick={onSelect}
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 text-base font-semibold text-white shadow-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {cta}
        </button>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
          14 dias grátis · sem cartão de crédito
        </p>

        <ul className="mt-12 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
          {features.map((feat) => (
            <li
              key={feat}
              className="flex items-start gap-2 rounded-lg bg-white px-4 py-3 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800"
            >
              <Check
                className="h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">{feat}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
