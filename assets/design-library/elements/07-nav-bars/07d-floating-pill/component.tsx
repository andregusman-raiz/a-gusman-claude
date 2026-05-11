import * as React from "react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

export interface FloatingPillProps {
  brand?: string
  links?: Array<{ label: string; href: string }>
  ctaLabel?: string
  className?: string
}

const DEFAULT_LINKS = [
  { label: "Produto", href: "#" },
  { label: "Preços", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Sobre", href: "#" },
]

export default function FloatingPill({
  brand = "Raiz",
  links = DEFAULT_LINKS,
  ctaLabel = "Entrar",
  className,
}: FloatingPillProps) {
  return (
    <div className={cn("sticky top-4 z-40 mx-auto w-full max-w-5xl px-4", className)}>
      <nav
        aria-label="Principal"
        className="mx-auto flex items-center justify-between gap-4 rounded-full border border-neutral-200/80 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-950/70"
      >
        <a
          href="/"
          className="flex items-center gap-2 pl-2 text-sm font-semibold text-neutral-900 dark:text-neutral-50"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-neutral-900 text-[10px] font-bold text-white dark:bg-neutral-50 dark:text-neutral-900">
            {brand.charAt(0)}
          </span>
          {brand}
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#signup"
          className="inline-flex h-8 items-center rounded-full bg-neutral-900 px-4 text-xs font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {ctaLabel}
        </a>
      </nav>
    </div>
  )
}
