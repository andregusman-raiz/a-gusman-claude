"use client"

import { useState, FormEvent } from "react"
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface EmailCaptureInlineCTAProps {
  title?: string
  subtitle?: string
  placeholder?: string
  ctaLabel?: string
  onSubmit?: (email: string) => void
  disclaimer?: string
  className?: string
}

export default function EmailCaptureInlineCTA({
  title = "Receba novidades toda semana",
  subtitle = "Insights, novidades de produto e conteúdo exclusivo direto no seu email.",
  placeholder = "seu@email.com",
  ctaLabel = "Começar",
  onSubmit,
  disclaimer = "Sem spam. Cancele quando quiser.",
  className,
}: EmailCaptureInlineCTAProps) {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email) return
    onSubmit?.(email)
    setSubmitted(true)
  }

  return (
    <section
      className={cn(
        "w-full bg-slate-50 px-6 py-16 dark:bg-slate-900 md:py-20",
        className
      )}
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
          {title}
        </h2>
        <p className="mt-3 text-pretty text-base text-slate-600 dark:text-slate-400 md:text-lg">
          {subtitle}
        </p>

        {submitted ? (
          <div className="mt-8 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Inscrição confirmada! Bem-vindo(a).
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row"
          >
            <div className="relative flex-1">
              <Mail
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={placeholder}
                aria-label="Endereço de email"
                className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-slate-50 dark:focus:ring-slate-50/10"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        )}

        {disclaimer && !submitted && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
            {disclaimer}
          </p>
        )}
      </div>
    </section>
  )
}
