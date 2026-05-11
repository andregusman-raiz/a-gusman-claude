import { Quote, ArrowRight } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface CenteredQuoteCTAProps {
  quote?: string
  authorName?: string
  authorRole?: string
  authorAvatar?: string
  ctaLabel?: string
  onCtaClick?: () => void
  className?: string
}

export default function CenteredQuoteCTA({
  quote = "Depois que adotamos a plataforma, nosso time de produto ficou três vezes mais rápido. É o tipo de ferramenta que você não consegue mais viver sem.",
  authorName = "Marina Silva",
  authorRole = "Head de Produto, Acme",
  authorAvatar,
  ctaLabel = "Comece a sua história",
  onCtaClick,
  className,
}: CenteredQuoteCTAProps) {
  return (
    <section
      className={cn(
        "w-full bg-white px-6 py-20 dark:bg-slate-950 md:py-28",
        className
      )}
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <Quote
          className="mb-6 h-10 w-10 text-indigo-500/30 dark:text-indigo-400/40"
          aria-hidden="true"
        />

        <blockquote className="text-balance text-2xl font-medium leading-relaxed text-slate-900 dark:text-slate-50 md:text-3xl lg:text-4xl">
          "{quote}"
        </blockquote>

        <figcaption className="mt-8 flex items-center gap-3">
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorName}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-sm font-bold text-white"
            >
              {authorName.split(" ").map(n => n[0]).slice(0, 2).join("")}
            </div>
          )}
          <div className="text-left">
            <p className="font-semibold text-slate-900 dark:text-slate-50">{authorName}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{authorRole}</p>
          </div>
        </figcaption>

        <button
          onClick={onCtaClick}
          className="mt-12 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
