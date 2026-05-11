"use client"

import { useState } from "react"
import { Mail, Lock, ArrowRight } from "lucide-react"

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ")

interface CenteredCardAuthProps {
  onSubmit?: (data: { email: string; password: string }) => void
  onForgotPassword?: () => void
  onSignUp?: () => void
  brand?: string
}

export default function CenteredCardAuth({
  onSubmit,
  onForgotPassword,
  onSignUp,
  brand = "rAIz",
}: CenteredCardAuthProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.({ email, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-12 dark:bg-slate-900">
      <div
        className={cn(
          "w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200",
          "dark:bg-slate-950 dark:ring-slate-800"
        )}
      >
        <div className="text-center">
          <span className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {brand}
          </span>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Bem-vindo de volta
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Entre com suas credenciais
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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

          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700"
            />
            Lembrar de mim
          </label>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 dark:focus:ring-slate-50 dark:focus:ring-offset-slate-950"
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
  )
}
