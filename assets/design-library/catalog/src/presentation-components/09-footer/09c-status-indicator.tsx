import * as React from "react"

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
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contato", href: "#" },
    ],
  },
  {
    title: "Recursos",
    links: [
      { label: "Docs", href: "#" },
      { label: "API", href: "#" },
      { label: "Comunidade", href: "#" },
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

export interface StatusIndicatorProps {
  brand?: string
  status?: "operational" | "degraded" | "outage"
  className?: string
}

const STATUS_CONFIG = {
  operational: {
    label: "Todos os sistemas operacionais",
    dot: "bg-green-500",
    ring: "bg-green-500/30",
  },
  degraded: {
    label: "Desempenho reduzido",
    dot: "bg-amber-500",
    ring: "bg-amber-500/30",
  },
  outage: {
    label: "Incidente em andamento",
    dot: "bg-red-500",
    ring: "bg-red-500/30",
  },
} as const

export default function StatusIndicator({
  brand = "Raiz",
  status = "operational",
  className,
}: StatusIndicatorProps) {
  const cfg = STATUS_CONFIG[status]
  return (
    <footer
      className={cn(
        "border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              Plataforma moderna para times em crescimento.
            </p>
          </div>
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

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-800 sm:flex-row sm:items-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            © {new Date().getFullYear()} {brand}. Todos os direitos reservados.
          </p>
          <a
            href="https://status.raiz.app"
            target="_blank"
            rel="noreferrer"
            aria-label={`Status do sistema: ${cfg.label}`}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <span className="relative grid place-items-center">
              <span
                aria-hidden
                className={cn(
                  "absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full opacity-75",
                  cfg.ring
                )}
              />
              <span
                aria-hidden
                className={cn("relative h-2 w-2 rounded-full", cfg.dot)}
              />
            </span>
            {cfg.label}
          </a>
        </div>
      </div>
    </footer>
  )
}
