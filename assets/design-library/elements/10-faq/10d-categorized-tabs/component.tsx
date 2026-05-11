"use client"

import * as React from "react"
import { Plus, CreditCard, Package, LifeBuoy } from "lucide-react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

interface QA {
  q: string
  a: string
}

interface Category {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  items: QA[]
}

const CATEGORIES: Category[] = [
  {
    id: "billing",
    label: "Cobrança",
    icon: CreditCard,
    items: [
      { q: "Como funciona o período de teste?", a: "14 dias grátis com todos os recursos, sem cartão de crédito." },
      { q: "Posso cancelar a qualquer momento?", a: "Sim, em 1 clique. Acesso até o fim do ciclo pago." },
      { q: "Oferecem nota fiscal?", a: "Sim, emissão automática em todo pagamento via PIX, boleto ou cartão." },
      { q: "Tem desconto anual?", a: "Sim. 20% off pagando anualmente." },
    ],
  },
  {
    id: "product",
    label: "Produto",
    icon: Package,
    items: [
      { q: "Quais integrações estão disponíveis?", a: "Mais de 100 integrações nativas + API aberta + webhooks." },
      { q: "Existe limite de usuários?", a: "Não. Usuários ilimitados em todos os planos." },
      { q: "Posso exportar meus dados?", a: "Sim, a qualquer momento em JSON ou CSV." },
    ],
  },
  {
    id: "support",
    label: "Suporte",
    icon: LifeBuoy,
    items: [
      { q: "Qual o tempo de resposta?", a: "Chat em até 5 minutos. Email em até 2 horas em horário comercial." },
      { q: "Tem suporte em português?", a: "Sim, 100% brasileiro." },
      { q: "Oferecem onboarding?", a: "Onboarding guiado nos planos Business e Enterprise." },
    ],
  },
]

export default function CategorizedTabs({
  className,
}: {
  className?: string
}) {
  const [tab, setTab] = React.useState(CATEGORIES[0].id)
  const [open, setOpen] = React.useState<string | null>(null)
  const current = CATEGORIES.find((c) => c.id === tab)!

  return (
    <section
      aria-labelledby="faq-tabs-heading"
      className={cn("bg-white py-20 dark:bg-neutral-950", className)}
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2
            id="faq-tabs-heading"
            className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50"
          >
            Perguntas frequentes
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Categorias"
          className="mb-6 flex flex-wrap items-center justify-center gap-2"
        >
          {CATEGORIES.map((c) => {
            const Icon = c.icon
            const active = tab === c.id
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${c.id}`}
                id={`tab-${c.id}`}
                onClick={() => setTab(c.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-900"
                    : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                )}
              >
                <Icon className="h-4 w-4" />
                {c.label}
              </button>
            )
          })}
        </div>

        <div
          role="tabpanel"
          id={`panel-${current.id}`}
          aria-labelledby={`tab-${current.id}`}
        >
          <ul className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {current.items.map((qa, i) => {
              const key = `${current.id}-${i}`
              const isOpen = open === key
              return (
                <li key={key}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : key)}
                    className="flex w-full items-center justify-between py-4 text-left"
                  >
                    <span className="pr-4 text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {qa.q}
                    </span>
                    <Plus
                      className={cn(
                        "h-4 w-4 shrink-0 text-neutral-500 transition-transform",
                        isOpen && "rotate-45"
                      )}
                      aria-hidden
                    />
                  </button>
                  {isOpen && (
                    <div className="pb-4 pr-8 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {qa.a}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
