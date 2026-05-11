import * as React from "react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

export interface MinimalCopyrightProps {
  brand?: string
  links?: Array<{ label: string; href: string }>
  className?: string
}

const DEFAULT_LINKS = [
  { label: "Privacidade", href: "#" },
  { label: "Termos", href: "#" },
  { label: "Contato", href: "#" },
]

export default function MinimalCopyright({
  brand = "Raiz",
  links = DEFAULT_LINKS,
  className,
}: MinimalCopyrightProps) {
  return (
    <footer
      className={cn(
        "border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950",
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-neutral-500 sm:flex-row sm:px-6 lg:px-8 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid h-5 w-5 place-items-center rounded bg-neutral-900 text-[9px] font-bold text-white dark:bg-neutral-50 dark:text-neutral-900"
          >
            {brand.charAt(0)}
          </span>
          <span>
            © {new Date().getFullYear()} {brand}. Todos os direitos reservados.
          </span>
        </div>

        <ul className="flex items-center gap-4">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="hover:text-neutral-900 dark:hover:text-neutral-50"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
