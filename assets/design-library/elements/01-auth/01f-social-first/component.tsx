"use client"

import { useState } from "react"
import { Mail } from "lucide-react"

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ")

interface SocialFirstAuthProps {
  onGoogle?: () => void
  onGithub?: () => void
  onEmailSubmit?: (email: string) => void
  brand?: string
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.48-1.13 2.73-2.4 3.58v2.97h3.88c2.27-2.09 3.57-5.17 3.57-8.79z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.93l-3.88-2.97c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.71-4.95H1.28v3.07C3.25 21.31 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31V6.62H1.28C.47 8.24 0 10.06 0 12s.47 3.76 1.28 5.38l4.01-3.07z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.28 6.62l4.01 3.07C6.23 6.86 8.88 4.75 12 4.75z"
      />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg
      className="h-5 w-5 text-slate-900 dark:text-slate-50"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8 0 3.2.8.8 1.3 1.9 1.3 3.1 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.2.9 2.3v3.4c0 .3.2.7.8.6A12 12 0 0 0 12 .3z" />
    </svg>
  )
}

export default function SocialFirstAuth({
  onGoogle,
  onGithub,
  onEmailSubmit,
  brand = "rAIz",
}: SocialFirstAuthProps) {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onEmailSubmit?.(email)
  }

  const socialBtn = cn(
    "flex w-full items-center justify-center gap-3 rounded-lg border bg-white px-4 py-3 text-sm font-semibold",
    "border-slate-300 text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900",
    "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Entrar no {brand}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Escolha uma forma rápida de entrar
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <button type="button" onClick={onGoogle} className={socialBtn}>
            <GoogleIcon />
            Continuar com Google
          </button>
          <button type="button" onClick={onGithub} className={socialBtn}>
            <GithubIcon />
            Continuar com GitHub
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-50 px-3 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              ou
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
              aria-label="E-mail"
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Continuar com e-mail
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
          Ao continuar, você concorda com nossos{" "}
          <a href="#" className="underline hover:text-slate-900 dark:hover:text-slate-50">
            Termos
          </a>{" "}
          e{" "}
          <a href="#" className="underline hover:text-slate-900 dark:hover:text-slate-50">
            Privacidade
          </a>
          .
        </p>
      </div>
    </div>
  )
}
