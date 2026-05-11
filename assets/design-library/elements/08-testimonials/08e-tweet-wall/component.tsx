import * as React from "react"
import { Heart, MessageCircle, Repeat2 } from "lucide-react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

interface Tweet {
  name: string
  handle: string
  text: string
  likes: number
  retweets: number
  replies: number
  initials: string
  verified?: boolean
  timeAgo: string
}

const TWEETS: Tweet[] = [
  {
    name: "Ana Pereira",
    handle: "@anap",
    text: "Acabei de migrar a operação toda pro @raiz. Economia de 4h/semana por pessoa. Produto absurdamente bem feito.",
    likes: 342,
    retweets: 48,
    replies: 21,
    initials: "AP",
    verified: true,
    timeAgo: "2h",
  },
  {
    name: "Bruno Santos",
    handle: "@bs_dev",
    text: "A API do Raiz é das melhores que já integrei. Docs claras, webhooks estáveis, rate limits generosos. 10/10.",
    likes: 189,
    retweets: 22,
    replies: 8,
    initials: "BS",
    timeAgo: "5h",
  },
  {
    name: "Carla Melo",
    handle: "@carlamelo",
    text: "Time de produto usando Raiz há 3 meses. NPS interno saltou de 7 pra 9. Recomendo.",
    likes: 521,
    retweets: 87,
    replies: 34,
    initials: "CM",
    verified: true,
    timeAgo: "1d",
  },
  {
    name: "Diego Ferraz",
    handle: "@dferraz",
    text: "Setup do Raiz em 8 minutos. Do zero à produção. Primeira vez que um SaaS me surpreendeu assim.",
    likes: 278,
    retweets: 41,
    replies: 15,
    initials: "DF",
    timeAgo: "2d",
  },
  {
    name: "Eduarda Lima",
    handle: "@edu_coo",
    text: "Substituímos Notion + Airtable + Zapier por Raiz. Custo menor, UX melhor, suporte mais rápido.",
    likes: 812,
    retweets: 156,
    replies: 62,
    initials: "EL",
    verified: true,
    timeAgo: "3d",
  },
  {
    name: "Felipe Rocha",
    handle: "@frocha",
    text: "Raiz é o Linear do mundo de operações. Feito por quem entende.",
    likes: 98,
    retweets: 12,
    replies: 4,
    initials: "FR",
    timeAgo: "4d",
  },
]

function formatK(n: number) {
  return n > 999 ? `${(n / 1000).toFixed(1)}K` : n
}

export default function TweetWall({
  className,
}: {
  className?: string
}) {
  return (
    <section
      aria-labelledby="tweets-heading"
      className={cn("bg-neutral-50 py-20 dark:bg-neutral-900", className)}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2
            id="tweets-heading"
            className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50"
          >
            O que dizem por aí
          </h2>
          <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400">
            Comentários reais da comunidade.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TWEETS.map((t, i) => (
            <li key={i}>
              <article className="flex h-full flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950">
                <header className="flex items-start gap-3">
                  <div
                    aria-hidden
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-semibold text-white"
                  >
                    {t.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                        {t.name}
                      </span>
                      {t.verified && (
                        <svg
                          aria-label="Verificado"
                          className="h-4 w-4 text-sky-500"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2l2.39 2.39 3.22-.22.22 3.22L20.22 10l-2.39 2.39.22 3.22-3.22.22L12 18l-2.39-2.39-3.22.22-.22-3.22L3.78 10l2.39-2.39-.22-3.22 3.22-.22L12 2zm-1 12l5-5-1.4-1.4-3.6 3.6-1.6-1.6L8 11l3 3z" />
                        </svg>
                      )}
                    </div>
                    <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {t.handle} · {t.timeAgo}
                    </div>
                  </div>
                </header>

                <p className="flex-1 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                  {t.text}
                </p>

                <footer className="flex items-center gap-6 text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {formatK(t.replies)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Repeat2 className="h-3.5 w-3.5" />
                    {formatK(t.retweets)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    {formatK(t.likes)}
                  </span>
                </footer>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
