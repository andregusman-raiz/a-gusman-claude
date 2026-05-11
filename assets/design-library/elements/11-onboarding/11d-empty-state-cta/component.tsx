"use client"

import * as React from "react"
import { Plus, BookOpen } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

interface EmptyStateCtaProps {
  title?: string
  description?: string
  primaryLabel?: string
  secondaryLabel?: string
  onPrimary?: () => void
  onSecondary?: () => void
  className?: string
}

export default function EmptyStateCta({
  title = "Comece por aqui",
  description = "Crie seu primeiro projeto para visualizar dashboards, importar dados e convidar seu time.",
  primaryLabel = "Criar primeiro projeto",
  secondaryLabel = "Ver documentacao",
  onPrimary,
  onSecondary,
  className,
}: EmptyStateCtaProps) {
  return (
    <div
      className={cn(
        "flex w-full max-w-lg flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-950",
        className
      )}
    >
      <svg
        viewBox="0 0 160 120"
        aria-hidden="true"
        className="mb-6 h-28 w-auto text-slate-300 dark:text-slate-700"
      >
        <defs>
          <linearGradient id="es-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <rect x="10" y="20" width="140" height="90" rx="8" fill="url(#es-grad)" />
        <rect x="22" y="36" width="60" height="8" rx="3" className="fill-slate-400 dark:fill-slate-600" />
        <rect x="22" y="52" width="110" height="4" rx="2" className="fill-slate-400/60 dark:fill-slate-600/60" />
        <rect x="22" y="62" width="90" height="4" rx="2" className="fill-slate-400/60 dark:fill-slate-600/60" />
        <rect x="22" y="72" width="100" height="4" rx="2" className="fill-slate-400/60 dark:fill-slate-600/60" />
        <circle cx="118" cy="90" r="14" className="fill-emerald-500" />
        <path d="M113 90h10M118 85v10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-400">{description}</p>

      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onPrimary}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" /> {primaryLabel}
        </button>
        <button
          type="button"
          onClick={onSecondary}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
        >
          <BookOpen className="h-4 w-4" /> {secondaryLabel}
        </button>
      </div>
    </div>
  )
}
