import * as React from "react"
import { Send, Code2, Briefcase, PlaySquare } from "lucide-react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

interface FooterColumn {
  title: string
  links: Array<{ label: string; href: string }>
}

const COLUMNS: FooterColumn[] = [
  {
    title: "Produto",
    links: [
      { label: "Recursos", href: "#" },
      { label: "Integrações", href: "#" },
      { label: "Preços", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "Roadmap", href: "#" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Carreiras", href: "#" },
      { label: "Imprensa", href: "#" },
      { label: "Contato", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidade", href: "#" },
      { label: "Termos", href: "#" },
      { label: "Cookies", href: "#" },
      { label: "Segurança", href: "#" },
      { label: "LGPD", href: "#" },
    ],
  },
  {
    title: "Recursos",
    links: [
      { label: "Documentação", href: "#" },
      { label: "Central de ajuda", href: "#" },
      { label: "Comunidade", href: "#" },
      { label: "Status", href: "#" },
      { label: "API", href: "#" },
    ],
  },
]

const SOCIALS = [
  { icon: Send, href: "#", label: "Send" },
  { icon: Code2, href: "#", label: "GitHub" },
  { icon: Briefcase, href: "#", label: "LinkedIn" },
  { icon: PlaySquare, href: "#", label: "YouTube" },
]

export default function MultiColumnSitemap({
  brand = "Raiz",
  className,
}: {
  brand?: string
  className?: string
}) {
  return (
    <footer
      className={cn(
        "border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <a
              href="/"
              className="flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-neutral-50"
            >
              <span className="grid h-8 w-8 place-items-center rounded-md bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900">
                {brand.charAt(0)}
              </span>
              {brand}
            </a>
            <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
              A plataforma moderna para times que querem crescer rápido.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-neutral-200 pt-8 dark:border-neutral-800 sm:flex-row sm:items-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            © {new Date().getFullYear()} {brand}. Todos os direitos reservados.
          </p>
          <ul className="flex items-center gap-2">
            {SOCIALS.map((s) => {
              const Icon = s.icon
              return (
                <li key={s.label}>
                  <a
                    href={s.href}
                    aria-label={s.label}
                    className="grid h-8 w-8 place-items-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </footer>
  )
}
