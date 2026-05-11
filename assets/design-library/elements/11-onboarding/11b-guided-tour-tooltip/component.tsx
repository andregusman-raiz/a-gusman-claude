"use client"

import * as React from "react"
import { ArrowRight, Check, X } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

interface TourStep {
  id: string
  targetLabel: string
  title: string
  description: string
  placement?: "top" | "bottom" | "left" | "right"
}

interface GuidedTourTooltipProps {
  steps?: TourStep[]
  className?: string
}

const DEFAULT_STEPS: TourStep[] = [
  {
    id: "nav",
    targetLabel: "Navegacao principal",
    title: "Navegue com facilidade",
    description: "Use o menu lateral para acessar dashboards, relatorios e configuracoes.",
    placement: "right",
  },
  {
    id: "search",
    targetLabel: "Busca global",
    title: "Encontre qualquer coisa",
    description: "Aperte Cmd+K para abrir a busca em qualquer tela.",
    placement: "bottom",
  },
  {
    id: "profile",
    targetLabel: "Seu perfil",
    title: "Personalize sua experiencia",
    description: "Configure preferencias, temas e notificacoes no menu do perfil.",
    placement: "left",
  },
]

export default function GuidedTourTooltip({ steps = DEFAULT_STEPS, className }: GuidedTourTooltipProps) {
  const [started, setStarted] = React.useState(false)
  const [idx, setIdx] = React.useState(0)
  const [done, setDone] = React.useState(false)

  const step = steps[idx]
  const isLast = idx === steps.length - 1

  const next = () => {
    if (isLast) {
      setDone(true)
      setStarted(false)
    } else {
      setIdx((i) => i + 1)
    }
  }

  const reset = () => {
    setIdx(0)
    setDone(false)
    setStarted(false)
  }

  return (
    <div
      className={cn(
        "relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      {/* Mock app surface */}
      <div className="grid grid-cols-3 gap-4">
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "relative rounded-xl border p-6 text-center transition-all",
              started && i === idx
                ? "border-emerald-500 bg-white shadow-lg ring-4 ring-emerald-500/20 dark:bg-slate-950"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
            )}
          >
            <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{s.targetLabel}</p>

            {started && i === idx && (
              <div
                role="dialog"
                aria-labelledby={`tour-title-${s.id}`}
                className={cn(
                  "absolute z-10 w-64 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-xl dark:border-slate-700 dark:bg-slate-950",
                  s.placement === "bottom" && "left-1/2 top-full mt-3 -translate-x-1/2",
                  s.placement === "right" && "left-full top-1/2 ml-3 -translate-y-1/2",
                  s.placement === "left" && "right-full top-1/2 mr-3 -translate-y-1/2",
                  (!s.placement || s.placement === "top") && "bottom-full left-1/2 mb-3 -translate-x-1/2"
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {idx + 1} / {steps.length}
                  </span>
                  <button
                    onClick={reset}
                    aria-label="Fechar tour"
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <h4 id={`tour-title-${s.id}`} className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {s.title}
                </h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{s.description}</p>
                <button
                  onClick={next}
                  className="mt-3 inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  {isLast ? (
                    <>
                      Finalizar <Check className="h-3 w-3" />
                    </>
                  ) : (
                    <>
                      Proximo <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {done ? "Tour concluido — voce ja pode explorar sozinho." : "Quer um tour guiado pelos principais recursos?"}
        </p>
        {!started && !done && (
          <button
            onClick={() => setStarted(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Comecar tour <ArrowRight className="h-4 w-4" />
          </button>
        )}
        {done && (
          <button
            onClick={reset}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Refazer
          </button>
        )}
      </div>
    </div>
  )
}
