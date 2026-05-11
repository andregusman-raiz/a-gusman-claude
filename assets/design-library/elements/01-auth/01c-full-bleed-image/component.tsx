"use client"

import { useState } from "react"
import { Mail, Lock, ArrowRight } from "lucide-react"

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ")

interface FullBleedImageAuthProps {
  onSubmit?: (data: { email: string; password: string }) => void
  onSignUp?: () => void
  brand?: string
  backgroundUrl?: string
}

export default function FullBleedImageAuth({
  onSubmit,
  onSignUp,
  brand = "rAIz",
  backgroundUrl = "https://images.unsplash.com/photo-1535063406830-27b4030bc6a1?auto=format&fit=crop&w=2400&q=80",
}: FullBleedImageAuthProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.({ email, password })
  }

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-950/60 to-slate-950/80" />

      <div className="relative flex min-h-screen items-center justify-end px-4 py-12 sm:px-8 lg:px-20">
        <div
          className={cn(
            "w-full max-w-md rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-md",
            "ring-1 ring-white/20 dark:bg-slate-950/90 dark:ring-white/10"
          )}
        >
          <div>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-50">
              {brand}
            </span>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Acesse a plataforma
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Entre para continuar de onde parou
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                E-mail
              </label>
              <div className="relative mt-1">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com"
                  className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-slate-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Senha
              </label>
              <div className="relative mt-1">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-slate-50"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Entrar
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Não tem conta?{" "}
            <button
              type="button"
              onClick={onSignUp}
              className="font-medium text-slate-900 hover:underline dark:text-slate-50"
            >
              Criar agora
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
