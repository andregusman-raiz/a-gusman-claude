import * as React from "react"
import { Send, Code2, Briefcase, PlaySquare, Camera } from "lucide-react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

interface Column {
  title: string
  links: Array<{ label: string; href: string }>
}

const COLUMNS: Column[] = [
  {
    title: "Produto",
    links: [
      { label: "Recursos", href: "#" },
      { label: "Preços", href: "#" },
      { label: "Integrações", href: "#" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Carreiras", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidade", href: "#" },
      { label: "Termos", href: "#" },
      { label: "LGPD", href: "#" },
    ],
  },
]

const SOCIALS = [
  { icon: Send, href: "#", label: "Send" },
  { icon: Camera, href: "#", label: "Camera" },
  { icon: Code2, href: "#", label: "GitHub" },
  { icon: Briefcase, href: "#", label: "LinkedIn" },
  { icon: PlaySquare, href: "#", label: "YouTube" },
]

export default function BigLogoBrand({
  brand = "Raiz",
  tagline = "Construído para times que querem ir longe.",
  className,
}: {
  brand?: string
  tagline?: string
  className?: string
}) {
  return (
    <footer
      className={cn(
        "border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <a
              href="/"
              aria-label={`${brand} - página inicial`}
              className="inline-block text-neutral-900 dark:text-neutral-50"
            >
              <span className="block text-6xl font-black tracking-tight sm:text-7xl lg:text-8xl">
                {brand}
              </span>
            </a>
            <p className="mt-4 max-w-md text-lg text-neutral-600 dark:text-neutral-400">
              {tagline}
            </p>
            <ul className="mt-6 flex flex-wrap items-center gap-2">
              {SOCIALS.map((s) => {
                const Icon = s.icon
                return (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      aria-label={s.label}
                      className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="grid grid-cols-3 gap-8 lg:col-span-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-neutral-200 py-6 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          © {new Date().getFullYear()} {brand}. Feito com cuidado.
        </div>
      </div>
    </footer>
  )
}
