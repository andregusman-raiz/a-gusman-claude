"use client"

import * as React from "react"
import { Plus } from "lucide-react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

interface QA {
  q: string
  a: string
}

const QAS: QA[] = [
  {
    q: "Como funciona o período de teste?",
    a: "Você tem 14 dias grátis com acesso completo a todos os recursos. Não pedimos cartão de crédito no cadastro.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim. Você pode cancelar direto pelo painel em um clique. O acesso permanece até o fim do ciclo pago.",
  },
  {
    q: "Como é feita a migração de outras ferramentas?",
    a: "Oferecemos importadores para os principais concorrentes. Para casos complexos, nosso time ajuda na migração sem custo adicional.",
  },
  {
    q: "Existe limite de usuários?",
    a: "Não. Todos os planos suportam usuários ilimitados. Você paga apenas pelo volume de uso definido no plano.",
  },
  {
    q: "Os dados ficam onde?",
    a: "Infraestrutura na AWS São Paulo com replicação em Virgínia. Criptografia em trânsito e em repouso. Conforme LGPD.",
  },
  {
    q: "Vocês oferecem suporte em português?",
    a: "Sim. Time 100% brasileiro, atendimento por chat, email e videochamada em horário comercial.",
  },
  {
    q: "Posso exportar meus dados?",
    a: "A qualquer momento, em JSON ou CSV. Exportação completa inclusive em planos gratuitos.",
  },
]

export default function AccordionVertical({
  className,
}: {
  className?: string
}) {
  const [open, setOpen] = React.useState<number | null>(0)

  return (
    <section
      aria-labelledby="faq-heading"
      className={cn("bg-white py-20 dark:bg-neutral-950", className)}
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2
            id="faq-heading"
            className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50"
          >
            Perguntas frequentes
          </h2>
          <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400">
            Não achou o que procurava? Fale com a gente.
          </p>
        </div>

        <ul className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {QAS.map((qa, i) => {
            const isOpen = open === i
            return (
              <li key={i}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-trigger-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between py-5 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
                >
                  <span className="pr-4 text-base font-medium text-neutral-900 dark:text-neutral-50">
                    {qa.q}
                  </span>
                  <Plus
                    className={cn(
                      "h-5 w-5 shrink-0 text-neutral-500 transition-transform",
                      isOpen && "rotate-45"
                    )}
                    aria-hidden
                  />
                </button>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${i}`}
                  hidden={!isOpen}
                  className="pb-5 pr-8 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400"
                >
                  {qa.a}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
