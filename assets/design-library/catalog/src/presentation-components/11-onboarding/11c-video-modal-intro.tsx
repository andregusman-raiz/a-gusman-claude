"use client"

import * as React from "react"
import { Play, SkipForward, X } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

interface VideoModalIntroProps {
  title?: string
  subtitle?: string
  videoPosterSrc?: string
  videoSrc?: string
  onStart?: () => void
  onSkip?: () => void
  className?: string
}

export default function VideoModalIntro({
  title = "Bem-vindo(a) ao produto",
  subtitle = "Assista ao video de 90 segundos para entender como tirar o melhor proveito.",
  videoPosterSrc,
  videoSrc,
  onStart,
  onSkip,
  className,
}: VideoModalIntroProps) {
  const [open, setOpen] = React.useState(false)

  const handleStart = () => {
    setOpen(false)
    onStart?.()
  }

  const handleSkip = () => {
    setOpen(false)
    onSkip?.()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100",
          className
        )}
      >
        <Play className="h-4 w-4" /> Abrir introducao
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            onClick={handleSkip}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950">
            <button
              onClick={handleSkip}
              aria-label="Fechar"
              className="absolute right-3 top-3 z-10 rounded-full bg-slate-900/50 p-1.5 text-white backdrop-blur transition-colors hover:bg-slate-900/80"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="aspect-video w-full bg-slate-900">
              <video
                className="h-full w-full"
                poster={videoPosterSrc}
                controls
                preload="metadata"
              >
                {videoSrc && <source src={videoSrc} type="video/mp4" />}
                Seu navegador nao suporta video HTML5.
              </video>
            </div>

            <div className="px-6 py-5">
              <h2 id="video-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {title}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={handleSkip}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  <SkipForward className="h-4 w-4" /> Pular introducao
                </button>
                <button
                  onClick={handleStart}
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  Comecar agora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
