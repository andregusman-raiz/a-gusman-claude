import * as React from "react"
import { Quote } from "lucide-react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

const LOGOS = [
  "Quantum",
  "Oliva",
  "Verde",
  "Norte",
  "Ponto",
  "Largo",
  "Íris",
  "Porto",
]

export interface LogoWallPlusQuoteProps {
  quote?: string
  name?: string
  role?: string
  company?: string
  className?: string
}

export default function LogoWallPlusQuote({
  quote = "Raiz se tornou parte essencial da forma como operamos. O time não imagina voltar.",
  name = "Eduarda Lima",
  role = "COO",
  company = "Ponto",
  className,
}: LogoWallPlusQuoteProps) {
  return (
    <section
      aria-label="Clientes e depoimento"
      className={cn("bg-white py-20 dark:bg-neutral-950", className)}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Confiado por times líderes
          </p>
        </div>

        <ul className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
          {LOGOS.map((logo) => (
            <li
              key={logo}
              className="flex items-center justify-center text-lg font-semibold tracking-tight text-neutral-400 grayscale transition-all hover:text-neutral-900 hover:grayscale-0 dark:text-neutral-600 dark:hover:text-neutral-50"
            >
              {logo}
            </li>
          ))}
        </ul>

        <figure className="mx-auto mt-16 max-w-3xl rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-900 sm:p-12">
          <Quote
            className="mx-auto mb-6 h-8 w-8 text-neutral-300 dark:text-neutral-700"
            aria-hidden
          />
          <blockquote className="text-xl font-medium leading-relaxed text-neutral-900 sm:text-2xl dark:text-neutral-50">
            &ldquo;{quote}&rdquo;
          </blockquote>
          <figcaption className="mt-8 text-sm text-neutral-600 dark:text-neutral-400">
            <span className="font-semibold text-neutral-900 dark:text-neutral-50">
              {name}
            </span>
            {" · "}
            {role}, {company}
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
