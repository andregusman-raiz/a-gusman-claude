import { Check, X } from "lucide-react"

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ")

interface ComparisonItem {
  label: string
  us: boolean | string
  them: boolean | string
}

interface ComparisonVsProps {
  items?: ComparisonItem[]
  title?: string
  subtitle?: string
  ourLabel?: string
  theirLabel?: string
}

const DEFAULT_ITEMS: ComparisonItem[] = [
  { label: "Setup em minutos", us: true, them: false },
  { label: "Deploy global por padrão", us: true, them: false },
  { label: "Integração com Slack/GitHub", us: true, them: true },
  { label: "Suporte 24/7", us: true, them: false },
  { label: "SSO + SAML", us: true, them: "Só enterprise" },
  { label: "Preço transparente", us: true, them: false },
  { label: "API + SDKs oficiais", us: true, them: "Limitada" },
  { label: "Migrator automático", us: true, them: false },
]

function cell(v: boolean | string, ok: boolean) {
  if (v === true)
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
        <Check className="h-4 w-4" aria-hidden="true" />
        Sim
      </div>
    )
  if (v === false)
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
        <X className="h-4 w-4" aria-hidden="true" />
        Não
      </div>
    )
  return (
    <div
      className={cn(
        "text-sm",
        ok ? "text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-500"
      )}
    >
      {v}
    </div>
  )
}

export default function ComparisonVs({
  items = DEFAULT_ITEMS,
  title = "Por que escolher a gente",
  subtitle = "O que você ganha mudando hoje",
  ourLabel = "rAIz",
  theirLabel = "Concorrente",
}: ComparisonVsProps) {
  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800">
          <div className="grid grid-cols-[1fr_auto_auto] bg-slate-50 dark:bg-slate-900">
            <div className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Feature
            </div>
            <div className="px-6 py-4 text-center text-sm font-bold text-slate-900 dark:text-slate-50">
              {ourLabel}
            </div>
            <div className="px-6 py-4 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
              {theirLabel}
            </div>
          </div>

          {items.map((it, idx) => (
            <div
              key={it.label}
              className={cn(
                "grid grid-cols-[1fr_auto_auto] border-t border-slate-200 dark:border-slate-800",
                idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/30"
              )}
            >
              <div className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                {it.label}
              </div>
              <div className="px-6 py-4 bg-slate-900/[0.02] dark:bg-slate-50/[0.02]">
                {cell(it.us, true)}
              </div>
              <div className="px-6 py-4">{cell(it.them, false)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
