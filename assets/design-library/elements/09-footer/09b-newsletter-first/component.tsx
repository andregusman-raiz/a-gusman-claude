"use client"

import * as React from "react"
import { Mail, ArrowRight } from "lucide-react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

export interface NewsletterFirstProps {
  brand?: string
  className?: string
}

const MINI_LINKS = [
  { label: "Sobre", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Privacidade", href: "#" },
  { label: "Termos", href: "#" },
  { label: "Contato", href: "#" },
]

export default function NewsletterFirst({
  brand = "Raiz",
  className,
}: NewsletterFirstProps) {
  const [email, setEmail] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setSubmitted(true)
  }

  return (
    <footer
      className={cn(
        "border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Mail
            className="mx-auto h-8 w-8 text-neutral-900 dark:text-neutral-50"
            aria-hidden
          />
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Receba atualizações
          </h2>
          <p className="mt-3 text-base text-neutral-600 dark:text-neutral-400">
            Novidades de produto, guias e casos de uso. Um email por semana, sem spam.
          </p>

          {submitted ? (
            <div
              role="status"
              className="mx-auto mt-8 max-w-md rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100"
            >
              Inscrição confirmada. Confira sua caixa de entrada.
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row"
            >
              <label className="sr-only" htmlFor="newsletter-email">
                Email
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                className="flex-1 rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-600 dark:focus:border-neutral-50"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Inscrever
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
          <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
            Cancele a qualquer momento. Leia a nossa{" "}
            <a href="#" className="underline">
              política de privacidade
            </a>
            .
          </p>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 border-t border-neutral-200 pt-8 text-sm dark:border-neutral-800 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-50">
            <span className="grid h-6 w-6 place-items-center rounded bg-neutral-900 text-[10px] text-white dark:bg-neutral-50 dark:text-neutral-900">
              {brand.charAt(0)}
            </span>
            © {new Date().getFullYear()} {brand}
          </div>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {MINI_LINKS.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
