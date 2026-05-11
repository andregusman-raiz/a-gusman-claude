import * as React from "react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

export interface NavLink {
  label: string
  href: string
}

export interface LogoLinksCtaProps {
  brand?: string
  links?: NavLink[]
  ctaLabel?: string
  ctaHref?: string
  className?: string
}

const DEFAULT_LINKS: NavLink[] = [
  { label: "Produto", href: "#produto" },
  { label: "Recursos", href: "#recursos" },
  { label: "Preços", href: "#precos" },
  { label: "Clientes", href: "#clientes" },
  { label: "Contato", href: "#contato" },
]

export default function LogoLinksCta({
  brand = "Raiz",
  links = DEFAULT_LINKS,
  ctaLabel = "Começar grátis",
  ctaHref = "#signup",
  className,
}: LogoLinksCtaProps) {
  return (
    <header
      className={cn(
        "w-full border-b border-neutral-200 bg-white/80 backdrop-blur",
        "dark:border-neutral-800 dark:bg-neutral-950/80",
        className
      )}
    >
      <nav
        aria-label="Principal"
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
      >
        <a
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-neutral-50"
          aria-label={`${brand} - início`}
        >
          <span className="grid h-8 w-8 place-items-center rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
            {brand.charAt(0)}
          </span>
          <span className="hidden sm:inline">{brand}</span>
        </a>

        <ul className="hidden items-center gap-6 md:flex" role="menubar">
          {links.map((l) => (
            <li key={l.href} role="none">
              <a
                role="menuitem"
                href={l.href}
                className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="#login"
            className="hidden text-sm font-medium text-neutral-600 hover:text-neutral-900 sm:inline dark:text-neutral-400 dark:hover:text-neutral-50"
          >
            Entrar
          </a>
          <a
            href={ctaHref}
            className="inline-flex h-9 items-center justify-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {ctaLabel}
          </a>
        </div>
      </nav>
    </header>
  )
}
