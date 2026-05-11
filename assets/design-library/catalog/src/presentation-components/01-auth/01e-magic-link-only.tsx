"use client"

import { useState } from "react"
import { Mail, Sparkles, CheckCircle2 } from "lucide-react"

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ")

interface MagicLinkAuthProps {
  onSendLink?: (email: string) => void
  brand?: string
}

export default function MagicLinkAuth({
  onSendLink,
  brand = "rAIz",
}: MagicLinkAuthProps) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSendLink?.(email)
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 dark:bg-slate-50">
            <Sparkles className="h-6 w-6 text-white dark:text-slate-900" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-slate-50">
            {brand}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Entre sem senha, usando um link mágico
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                E-mail
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com"
                  className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Enviar link mágico
            </button>
            <p className="text-center text-xs text-slate-500 dark:text-slate-500">
              Vamos enviar um e-mail com o link para entrar
            </p>
          </form>
        ) : (
          <div
            className={cn(
              "mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center",
              "dark:border-emerald-900 dark:bg-emerald-950/40"
            )}
            role="status"
          >
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            <h2 className="mt-3 text-base font-semibold text-emerald-900 dark:text-emerald-100">
              Link enviado!
            </h2>
            <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
              Verifique sua caixa de entrada em <strong>{email}</strong> e clique no
              link para entrar.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-4 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-300"
            >
              Enviar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
