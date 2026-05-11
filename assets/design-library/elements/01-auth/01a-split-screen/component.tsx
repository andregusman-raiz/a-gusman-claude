"use client"

import { useState } from "react"
import { Mail, Lock, ArrowRight, Sparkles } from "lucide-react"

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ")

interface SplitScreenAuthProps {
  onSubmit?: (data: { email: string; password: string }) => void
  onForgotPassword?: () => void
  onSignUp?: () => void
  brand?: string
  heroTitle?: string
  heroSubtitle?: string
}

export default function SplitScreenAuth({
  onSubmit,
  onForgotPassword,
  onSignUp,
  brand = "rAIz",
  heroTitle = "Construa mais rápido com IA",
  heroSubtitle = "Plataforma unificada para times de produto que querem velocidade sem perder qualidade.",
}: SplitScreenAuthProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.({ email, password })
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-slate-950">
      <div className="flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md space-y-8">
          <div>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-50">
              {brand}
            </span>
            <h1 className="mt-8 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Entrar na sua conta
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Bem-vindo de volta. Digite suas credenciais.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-slate-50 dark:focus:ring-slate-50/10"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Senha
                </label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
                >
                  Esqueceu?
                </button>
              </div>
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
                  className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-slate-50 dark:focus:ring-slate-50/10"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 dark:focus:ring-slate-50 dark:focus:ring-offset-slate-950"
            >
              Entrar
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
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

      <div className="relative hidden lg:flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="relative max-w-lg px-12 text-white">
          <Sparkles className="h-10 w-10 mb-6 opacity-90" aria-hidden="true" />
          <h2 className="text-4xl font-bold tracking-tight">{heroTitle}</h2>
          <p className="mt-4 text-lg text-white/80">{heroSubtitle}</p>
          <div
            className={cn(
              "mt-10 flex items-center gap-3 rounded-xl bg-white/10 p-4",
              "backdrop-blur-sm ring-1 ring-white/20"
            )}
          >
            <div className="h-10 w-10 rounded-full bg-white/20" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">Mariana Silva</p>
              <p className="text-xs text-white/70">
                "Reduzi em 60% o tempo de setup de novos projetos."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
