import {
  Zap,
  Shield,
  Users,
  BarChart3,
  Lock,
  Rocket,
  Bell,
  Globe,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

interface IconGrid3x3Props {
  features?: Feature[]
  title?: string
  subtitle?: string
}

const DEFAULT_FEATURES: Feature[] = [
  { icon: Zap, title: "Performance", description: "Respostas em milissegundos, não segundos." },
  { icon: Shield, title: "Segurança", description: "SOC 2, LGPD e criptografia end-to-end." },
  { icon: Users, title: "Colaboração", description: "Time inteiro trabalhando no mesmo projeto." },
  { icon: BarChart3, title: "Analytics", description: "Dashboards em tempo real com métricas claras." },
  { icon: Lock, title: "Privacidade", description: "Seus dados sempre criptografados, nunca vazam." },
  { icon: Rocket, title: "Deploy rápido", description: "Do commit à produção em menos de 1 minuto." },
  { icon: Bell, title: "Alertas", description: "Notificações inteligentes no canal certo." },
  { icon: Globe, title: "Global", description: "Edge network em 50+ regiões ao redor do mundo." },
  { icon: Sparkles, title: "IA integrada", description: "Assistente que entende seu domínio de negócio." },
]

export default function IconGrid3x3({
  features = DEFAULT_FEATURES,
  title = "Tudo que seu time precisa",
  subtitle = "Features que fazem diferença no dia a dia",
}: IconGrid3x3Props) {
  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">{subtitle}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="group">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white transition group-hover:scale-105 dark:bg-slate-50 dark:text-slate-900">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-50">
                  {f.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {f.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
