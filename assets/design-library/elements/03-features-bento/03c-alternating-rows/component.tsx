import { Check, type LucideIcon, Zap, BarChart3, Users, Shield } from "lucide-react"

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ")

interface Row {
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
  bullets: string[]
}

interface AlternatingRowsProps {
  rows?: Row[]
  title?: string
  subtitle?: string
}

const DEFAULT_ROWS: Row[] = [
  {
    icon: Zap,
    eyebrow: "Velocidade",
    title: "Do ideia ao deploy em minutos",
    description:
      "Scaffold, build e deploy otimizados. Seu time passa mais tempo criando, menos esperando.",
    bullets: [
      "Build paralelo com cache inteligente",
      "Rollback em 1 clique",
      "Preview deploys automáticos",
    ],
  },
  {
    icon: BarChart3,
    eyebrow: "Analytics",
    title: "Decisões baseadas em dados reais",
    description:
      "Dashboards em tempo real conectados direto nos seus eventos. Sem setup, sem consultores.",
    bullets: [
      "Métricas custom com SQL",
      "Alertas inteligentes",
      "Exportação CSV/Excel",
    ],
  },
  {
    icon: Users,
    eyebrow: "Colaboração",
    title: "Time inteiro no mesmo lugar",
    description:
      "Presença ao vivo, comentários, @menções e permissões granulares por projeto.",
    bullets: [
      "Cursores em tempo real",
      "Notificações no Slack",
      "Papéis customizáveis",
    ],
  },
  {
    icon: Shield,
    eyebrow: "Segurança",
    title: "Enterprise-grade por padrão",
    description:
      "SOC 2 Type II, LGPD compliance, SSO e audit logs completos. Seus dados blindados.",
    bullets: [
      "Criptografia AES-256",
      "SAML / SCIM",
      "Audit logs imutáveis",
    ],
  },
]

export default function AlternatingRows({
  rows = DEFAULT_ROWS,
  title = "Como a gente acelera seu time",
  subtitle = "Quatro pilares que transformam produtividade",
}: AlternatingRowsProps) {
  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">{subtitle}</p>
        </div>

        <div className="mt-16 space-y-20">
          {rows.map((row, idx) => {
            const Icon = row.icon
            const reverse = idx % 2 === 1
            return (
              <div
                key={row.title}
                className={cn(
                  "grid grid-cols-1 items-center gap-10 md:grid-cols-2",
                  reverse && "md:[&>*:first-child]:order-2"
                )}
              >
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {row.eyebrow}
                  </div>
                  <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                    {row.title}
                  </h3>
                  <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
                    {row.description}
                  </p>
                  <ul className="mt-5 space-y-2">
                    {row.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                      >
                        <Check className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-slate-200 dark:from-slate-800 dark:to-slate-900 dark:ring-slate-800">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon
                      className="h-20 w-20 text-slate-400/60 dark:text-slate-600/60"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-white/90 px-4 py-3 backdrop-blur-sm ring-1 ring-white/40 dark:bg-slate-950/80 dark:ring-slate-800">
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                      {row.eyebrow.toLowerCase()}.preview
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
