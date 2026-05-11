"use client"

import * as React from "react"
import { AlertCircle, RotateCw, Bug, ChevronDown } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

interface ErrorBoundaryCardProps {
  title?: string
  message?: string
  errorDetails?: string
  digest?: string
  onRetry?: () => void
  onReport?: () => void
  className?: string
}

export default function ErrorBoundaryCard({
  title = "Algo deu errado",
  message = "Encontramos um problema ao carregar esta secao. Voce pode tentar novamente ou reportar o erro ao nosso time.",
  errorDetails = "TypeError: Cannot read properties of undefined (reading 'map')",
  digest,
  onRetry,
  onReport,
  className,
}: ErrorBoundaryCardProps) {
  const [showDetails, setShowDetails] = React.useState(false)

  return (
    <div
      role="alert"
      aria-labelledby="err-title"
      className={cn(
        "mx-auto w-full max-w-md rounded-2xl border border-red-200 bg-red-50/50 p-6 text-center shadow-sm dark:border-red-900/50 dark:bg-red-950/20",
        className
      )}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>

      <h3 id="err-title" className="text-lg font-semibold text-slate-900 dark:text-slate-50">
        {title}
      </h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{message}</p>

      {errorDetails && (
        <div className="mt-4 text-left">
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            aria-expanded={showDetails}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <ChevronDown
              className={cn("h-3 w-3 transition-transform", showDetails && "rotate-180")}
            />
            {showDetails ? "Ocultar detalhes tecnicos" : "Ver detalhes tecnicos"}
          </button>
          {showDetails && (
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-left text-[11px] text-slate-200 dark:bg-slate-950">
              <code>{errorDetails}</code>
              {digest && (
                <span className="mt-2 block text-slate-500">
                  Digest: <span className="text-slate-400">{digest}</span>
                </span>
              )}
            </pre>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <RotateCw className="h-4 w-4" /> Tentar novamente
        </button>
        <button
          type="button"
          onClick={onReport}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Bug className="h-4 w-4" /> Reportar problema
        </button>
      </div>
    </div>
  )
}
