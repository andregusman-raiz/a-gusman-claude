import * as React from "react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

interface QA {
  q: string
  a: string
}

const QAS: QA[] = [
  {
    q: "Como funciona o período de teste?",
    a: "14 dias grátis com todos os recursos. Não pedimos cartão de crédito no cadastro.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim, cancelamento em 1 clique pelo painel. Sem fidelidade, sem multa.",
  },
  {
    q: "Quais integrações são oferecidas?",
    a: "Mais de 100 integrações nativas, API REST completa e webhooks configuráveis.",
  },
  {
    q: "Os dados estão seguros?",
    a: "Criptografia em trânsito e repouso, SOC 2 Type II, LGPD compliant, AWS SP + Virgínia.",
  },
  {
    q: "Vocês oferecem suporte em português?",
    a: "Sim, 100% brasileiro. Chat, email e videochamada em horário comercial.",
  },
  {
    q: "Existe limite de usuários?",
    a: "Não. Todos os planos incluem usuários ilimitados.",
  },
  {
    q: "Posso exportar meus dados?",
    a: "A qualquer momento, em JSON ou CSV. Também via API.",
  },
  {
    q: "Há desconto anual?",
    a: "Sim, 20% off pagando anualmente. E 40% para ONGs e instituições educacionais.",
  },
]

export default function TwoColumnStatic({
  className,
}: {
  className?: string
}) {
  return (
    <section
      aria-labelledby="faq-static-heading"
      className={cn("bg-neutral-50 py-20 dark:bg-neutral-900", className)}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2
            id="faq-static-heading"
            className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50"
          >
            Perguntas frequentes
          </h2>
          <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400">
            Tudo que você precisa saber, de uma olhada só.
          </p>
        </div>

        <dl className="grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2">
          {QAS.map((qa, i) => (
            <div key={i}>
              <dt className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                {qa.q}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {qa.a}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-16 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Ficou alguma dúvida?{" "}
            <a
              href="#"
              className="font-medium text-neutral-900 underline underline-offset-4 dark:text-neutral-50"
            >
              Fale com a gente
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
