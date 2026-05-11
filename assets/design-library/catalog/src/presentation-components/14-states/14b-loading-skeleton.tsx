import * as React from "react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

interface LoadingSkeletonProps {
  className?: string
}

const Bar = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded bg-slate-200 dark:bg-slate-800", className)} aria-hidden="true" />
)

export default function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn("w-full space-y-6 p-6 sm:p-8", className)}
      role="status"
      aria-label="Carregando conteudo"
      aria-live="polite"
    >
      <span className="sr-only">Carregando...</span>

      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Bar className="h-10 w-10 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Bar className="h-4 w-48" />
            <Bar className="h-3 w-32" />
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <Bar className="h-9 w-24" />
          <Bar className="h-9 w-28" />
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 p-5 dark:border-slate-800"
          >
            <Bar className="h-3 w-24" />
            <Bar className="mt-3 h-8 w-32" />
            <div className="mt-4 flex items-center gap-2">
              <Bar className="h-3 w-12" />
              <Bar className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
          <Bar className="h-3 flex-1" />
          <Bar className="h-3 w-24" />
          <Bar className="h-3 w-20" />
          <Bar className="h-3 w-16" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-900">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="flex flex-1 items-center gap-3">
                <Bar className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Bar className="h-3 w-48" />
                  <Bar className="h-2.5 w-32" />
                </div>
              </div>
              <Bar className="h-4 w-24" />
              <Bar className="h-4 w-20" />
              <Bar className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
