"use client"

import * as React from "react"
import { Cookie, X } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

interface CookieBannerProps {
  className?: string
  policyHref?: string
  onAcceptAll?: () => void
  onCustomize?: () => void
  onDismiss?: () => void
}

export default function CookieBannerGdpr({
  className,
  policyHref = "/privacy",
  onAcceptAll,
  onCustomize,
  onDismiss,
}: CookieBannerProps) {
  const [visible, setVisible] = React.useState(true)

  if (!visible) return null

  const handleAccept = () => {
    onAcceptAll?.()
    setVisible(false)
  }

  const handleCustomize = () => {
    onCustomize?.()
  }

  const handleClose = () => {
    onDismiss?.()
    setVisible(false)
  }

  return (
    <div
      role="region"
      aria-label="Consentimento de cookies"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4",
        className
      )}
    >
      <div className="mx-auto max-w-6xl rounded-xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
          <div className="flex items-start gap-3 sm:flex-1">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Cookie className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-300">
              <p className="font-medium text-slate-900 dark:text-slate-50">
                Respeitamos sua privacidade
              </p>
              <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                Usamos cookies para analisar uso e melhorar sua experiencia. Veja nossa{" "}
                <a
                  href={policyHref}
                  className="font-medium text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400"
                >
                  politica de privacidade
                </a>
                .
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleCustomize}
              className="order-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:order-1"
            >
              Customizar
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="order-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 sm:order-2"
            >
              Aceitar cookies
            </button>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar banner"
            className="absolute right-2 top-2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 sm:relative sm:right-auto sm:top-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
