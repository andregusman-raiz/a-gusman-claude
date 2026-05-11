import * as React from "react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

interface QA {
  q: string
  a: string
}

const QAS: QA[] = [
  {
    q: "Preciso de cartão de crédito para testar?",
    a: "Não. Você tem 14 dias totalmente grátis, sem pedir cartão. Cadastro com email e pronto.",
  },
  {
    q: "Como funciona o plano de preços?",
    a: "Cobramos por volume de uso. Você só paga pelo que consumir. Sem limites de usuários em nenhum plano.",
  },
  {
    q: "Vocês oferecem suporte técnico?",
    a: "Sim. Chat ao vivo em horário comercial, email 24/7 e videochamada para planos Business e acima.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Criptografia end-to-end, hospedagem AWS SP com replicação em Virgínia. Somos SOC 2 Type II e conformes LGPD.",
  },
  {
    q: "Como migrar de outra ferramenta?",
    a: "Temos importadores prontos para os principais concorrentes. Migração guiada sem custo.",
  },
]

export default function ChatBubble({
  className,
}: {
  className?: string
}) {
  return (
    <section
      aria-labelledby="faq-chat-heading"
      className={cn("bg-neutral-50 py-20 dark:bg-neutral-900", className)}
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2
            id="faq-chat-heading"
            className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50"
          >
            Perguntas frequentes
          </h2>
          <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400">
            Quase uma conversa.
          </p>
        </div>

        <ol className="space-y-6">
          {QAS.map((qa, i) => (
            <li key={i} className="space-y-3">
              <div className="flex items-start justify-end gap-2">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-neutral-900 px-4 py-3 text-sm text-white shadow-sm dark:bg-neutral-50 dark:text-neutral-900">
                  <span className="sr-only">Pergunta: </span>
                  {qa.q}
                </div>
                <div
                  aria-hidden
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  Q
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div
                  aria-hidden
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-semibold text-white"
                >
                  R
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-800 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
                  <span className="sr-only">Resposta: </span>
                  {qa.a}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center text-sm text-neutral-600 dark:text-neutral-400">
          Tem outra pergunta?{" "}
          <a
            href="#"
            className="font-medium text-neutral-900 underline underline-offset-4 dark:text-neutral-50"
          >
            Fale com a gente
          </a>
          .
        </div>
      </div>
    </section>
  )
}
