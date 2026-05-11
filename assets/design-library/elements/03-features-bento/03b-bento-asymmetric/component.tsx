import { Zap, Shield, BarChart3, Users, Globe, Sparkles } from "lucide-react"

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ")

interface BentoAsymmetricProps {
  title?: string
  subtitle?: string
}

export default function BentoAsymmetric({
  title = "Pensado nos mínimos detalhes",
  subtitle = "Cada feature feita para você entregar mais rápido",
}: BentoAsymmetricProps) {
  const tileBase = cn(
    "rounded-2xl p-6 ring-1 ring-slate-200 bg-white",
    "dark:ring-slate-800 dark:bg-slate-950"
  )

  return (
    <section className="bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-[auto_auto] auto-rows-fr">
          {/* Hero tile — large */}
          <div
            className={cn(
              tileBase,
              "md:col-span-2 md:row-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 ring-indigo-500 text-white"
            )}
          >
            <Sparkles className="h-6 w-6 opacity-90" aria-hidden="true" />
            <h3 className="mt-4 text-2xl font-bold">IA que entende seu contexto</h3>
            <p className="mt-2 text-indigo-100 text-sm">
              Assistente integrado que aprende padrões do seu time e sugere ações
              contextuais. Reduz 60% do tempo em tarefas repetitivas.
            </p>
            <div className="mt-8 rounded-xl bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/20">
              <div className="text-xs font-mono text-indigo-200">
                &gt; sugerir próxima ação
              </div>
              <div className="mt-1 text-sm">
                "Criar relatório mensal a partir dos dados de Abril"
              </div>
            </div>
          </div>

          {/* Stat tile */}
          <div className={cn(tileBase, "md:col-span-2")}>
            <BarChart3
              className="h-5 w-5 text-slate-700 dark:text-slate-300"
              aria-hidden="true"
            />
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-900 dark:text-slate-50">
                99.99%
              </span>
              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                ↑ uptime
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Infra redundante em 3 continentes, monitorada em tempo real.
            </p>
          </div>

          {/* Image-like tile */}
          <div
            className={cn(
              tileBase,
              "relative overflow-hidden bg-slate-900 text-white ring-slate-900 dark:bg-slate-50 dark:text-slate-900 dark:ring-slate-50"
            )}
          >
            <Globe
              className="absolute -right-8 -bottom-8 h-40 w-40 opacity-10"
              aria-hidden="true"
            />
            <Globe className="h-5 w-5" aria-hidden="true" />
            <h3 className="mt-3 text-base font-semibold">Edge global</h3>
            <p className="mt-1 text-sm opacity-80">
              50+ regiões, latência &lt; 50ms em qualquer ponto do planeta.
            </p>
          </div>

          {/* Feature tile */}
          <div className={tileBase}>
            <Shield
              className="h-5 w-5 text-slate-700 dark:text-slate-300"
              aria-hidden="true"
            />
            <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">
              SOC 2 Type II
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Audit anual, LGPD-ready, criptografia AES-256.
            </p>
          </div>

          {/* Feature tile */}
          <div className={tileBase}>
            <Users
              className="h-5 w-5 text-slate-700 dark:text-slate-300"
              aria-hidden="true"
            />
            <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">
              Colaboração em tempo real
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Presença ao vivo, cursores, comentários.
            </p>
          </div>

          {/* Wide tile */}
          <div className={cn(tileBase, "md:col-span-2")}>
            <Zap
              className="h-5 w-5 text-amber-500 dark:text-amber-400"
              aria-hidden="true"
            />
            <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">
              Deploy em 45 segundos
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Do commit à produção. Build paralelo, cache inteligente, rollback
              instantâneo.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
