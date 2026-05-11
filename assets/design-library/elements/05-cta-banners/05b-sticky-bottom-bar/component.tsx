"use client"

import { useState } from "react"
import { ArrowRight, X } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface StickyBottomBarCTAProps {
  message?: string
  ctaLabel?: string
  onCtaClick?: () => void
  dismissible?: boolean
  className?: string
}

export default function StickyBottomBarCTA({
  message = "Experimente gratuitamente por 14 dias — sem cartão de crédito.",
  ctaLabel = "Começar agora",
  onCtaClick,
  dismissible = true,
  className,
}: StickyBottomBarCTAProps) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Banner promocional"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95",
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
        <p className="flex-1 text-sm text-slate-700 dark:text-slate-300">
          {message}
        </p>

        <button
          onClick={onCtaClick}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        {dismissible && (
          <button
            onClick={() => setVisible(false)}
            aria-label="Fechar banner"
            className="shrink-0 rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
