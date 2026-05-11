import * as React from "react"
import { Plus } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

interface EmptyStateIllustrationProps {
  title?: string
  description?: string
  ctaLabel?: string
  onCta?: () => void
  className?: string
}

export default function EmptyStateIllustration({
  title = "Nada por aqui ainda",
  description = "Voce ainda nao criou nenhum registro. Comece criando o primeiro e os itens aparecerao aqui.",
  ctaLabel = "Criar primeiro registro",
  onCta,
  className,
}: EmptyStateIllustrationProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center py-12 text-center",
        className
      )}
    >
      {/* Lotus illustration */}
      <svg
        viewBox="0 0 160 140"
        aria-hidden="true"
        className="mb-6 h-32 w-auto"
      >
        <defs>
          <linearGradient id="petal" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="petal-side" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Water */}
        <ellipse cx="80" cy="122" rx="64" ry="6" className="fill-slate-200 dark:fill-slate-800" />
        <ellipse cx="80" cy="118" rx="50" ry="4" className="fill-slate-300 dark:fill-slate-700" opacity="0.6" />

        {/* Side petals */}
        <path
          d="M35 110 Q 20 75 60 70 Q 70 90 50 110 Z"
          fill="url(#petal-side)"
          stroke="#059669"
          strokeWidth="1"
          strokeOpacity="0.3"
        />
        <path
          d="M125 110 Q 140 75 100 70 Q 90 90 110 110 Z"
          fill="url(#petal-side)"
          stroke="#059669"
          strokeWidth="1"
          strokeOpacity="0.3"
        />

        {/* Center petals */}
        <path
          d="M80 35 Q 55 55 62 108 Q 80 100 80 35 Z"
          fill="url(#petal)"
          stroke="#059669"
          strokeWidth="1"
          strokeOpacity="0.4"
        />
        <path
          d="M80 35 Q 105 55 98 108 Q 80 100 80 35 Z"
          fill="url(#petal)"
          stroke="#059669"
          strokeWidth="1"
          strokeOpacity="0.4"
        />

        {/* Center dot */}
        <circle cx="80" cy="95" r="5" className="fill-amber-400" />
      </svg>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-400">{description}</p>

      <button
        type="button"
        onClick={onCta}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        <Plus className="h-4 w-4" /> {ctaLabel}
      </button>
    </div>
  )
}
