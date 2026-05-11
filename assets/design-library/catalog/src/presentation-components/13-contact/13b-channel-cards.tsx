import * as React from "react"
import { LifeBuoy, TrendingUp, Newspaper, ArrowRight } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

interface ChannelCardsProps {
  className?: string
}

const CHANNELS = [
  {
    id: "support",
    icon: LifeBuoy,
    title: "Suporte",
    description:
      "Tem duvida tecnica ou problema com sua conta? Nosso time responde em ate 4h em dias uteis.",
    cta: "Abrir chamado",
    href: "#support",
    accent: "emerald",
  },
  {
    id: "sales",
    icon: TrendingUp,
    title: "Vendas",
    description:
      "Quer conhecer planos enterprise, integracoes customizadas ou pilotos? Fale com o time comercial.",
    cta: "Agendar conversa",
    href: "#sales",
    accent: "blue",
  },
  {
    id: "press",
    icon: Newspaper,
    title: "Imprensa",
    description: "Jornalistas, parceiros de conteudo e analistas: solicite kit de midia e entrevistas.",
    cta: "Falar com comunicacao",
    href: "#press",
    accent: "violet",
  },
]

const ACCENT_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
}

export default function ChannelCards({ className }: ChannelCardsProps) {
  return (
    <section className={cn("w-full bg-white py-16 dark:bg-slate-950", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            Como podemos ajudar?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600 dark:text-slate-400">
            Escolha o canal certo para sua solicitacao. Assim respondemos mais rapido.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {CHANNELS.map((c) => {
            const Icon = c.icon
            return (
              <article
                key={c.id}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div
                  className={cn(
                    "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl",
                    ACCENT_CLASSES[c.accent]
                  )}
                  aria-hidden="true"
                >
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{c.title}</h3>
                <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{c.description}</p>

                <a
                  href={c.href}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 transition-colors group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-400"
                >
                  {c.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
