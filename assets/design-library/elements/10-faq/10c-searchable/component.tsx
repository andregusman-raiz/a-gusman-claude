"use client"

import * as React from "react"
import { Search, ChevronDown } from "lucide-react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

interface QA {
  q: string
  a: string
  tags?: string[]
}

const QAS: QA[] = [
  { q: "Como funciona o teste grátis?", a: "14 dias com acesso completo, sem cartão de crédito.", tags: ["billing"] },
  { q: "Posso cancelar a qualquer momento?", a: "Sim, em 1 clique pelo painel. Sem fidelidade.", tags: ["billing"] },
  { q: "Oferecem desconto para ONG ou educação?", a: "Sim. 40% de desconto com comprovação.", tags: ["billing"] },
  { q: "Como faço integração com webhook?", a: "Configure URLs em Settings > Integrations > Webhooks. Suporta retry automático.", tags: ["api"] },
  { q: "Qual o rate limit da API?", a: "1000 req/min no plano Pro, 10K req/min no Business. Headers incluem X-RateLimit-Remaining.", tags: ["api"] },
  { q: "Onde ficam hospedados meus dados?", a: "AWS São Paulo com replicação em Virgínia. Criptografia em trânsito e repouso.", tags: ["security"] },
  { q: "Vocês são conformes com LGPD?", a: "Sim. Temos DPO, política pública e processo de resposta a solicitações do titular.", tags: ["security"] },
  { q: "Posso exportar todos meus dados?", a: "Sim, em JSON ou CSV, a qualquer momento. Também via API.", tags: ["data"] },
  { q: "Vocês fazem backup automático?", a: "Backup diário com retenção de 30 dias. Point-in-time recovery nos últimos 7 dias.", tags: ["data"] },
  { q: "Como ativo autenticação de dois fatores?", a: "Em Settings > Security. Suportamos TOTP (Google Authenticator, 1Password) e passkeys.", tags: ["security"] },
]

export default function Searchable({
  className,
}: {
  className?: string
}) {
  const [q, setQ] = React.useState("")
  const [open, setOpen] = React.useState<number | null>(null)

  const filtered = QAS.filter(
    (qa) =>
      qa.q.toLowerCase().includes(q.toLowerCase()) ||
      qa.a.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <section
      aria-labelledby="faq-search-heading"
      className={cn("bg-white py-20 dark:bg-neutral-950", className)}
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2
            id="faq-search-heading"
            className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50"
          >
            Perguntas frequentes
          </h2>
          <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400">
            Busque pelo que você precisa.
          </p>
        </div>

        <div className="relative mb-8">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar..."
            aria-label="Pesquisar perguntas frequentes"
            className="w-full rounded-lg border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-50"
          />
        </div>

        {filtered.length === 0 ? (
          <div
            role="status"
            className="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400"
          >
            Nenhuma pergunta encontrada para &ldquo;{q}&rdquo;.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {filtered.map((qa, i) => {
              const isOpen = open === i
              return (
                <li key={i}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between py-4 text-left"
                  >
                    <span className="pr-4 text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {qa.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-neutral-500 transition-transform",
                        isOpen && "rotate-180"
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
        )}

        <p className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          {filtered.length} de {QAS.length} perguntas
        </p>
      </div>
    </section>
  )
}
