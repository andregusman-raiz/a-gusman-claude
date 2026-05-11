"use client"

import * as React from "react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

export interface TransparentHoverSolidProps {
  brand?: string
  links?: Array<{ label: string; href: string }>
  threshold?: number
}

const DEFAULT_LINKS = [
  { label: "Produto", href: "#" },
  { label: "Recursos", href: "#" },
  { label: "Preços", href: "#" },
  { label: "Contato", href: "#" },
]

export default function TransparentHoverSolid({
  brand = "Raiz",
  links = DEFAULT_LINKS,
  threshold = 50,
}: TransparentHoverSolidProps) {
  const [solid, setSolid] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => {
      setSolid(window.scrollY > threshold)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [threshold])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        solid
          ? "border-b border-neutral-200 bg-white/90 backdrop-blur-lg shadow-sm dark:border-neutral-800 dark:bg-neutral-950/90"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav
        aria-label="Principal"
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8"
      >
        <a
          href="/"
          className={cn(
            "text-lg font-semibold transition-colors",
            solid
              ? "text-neutral-900 dark:text-neutral-50"
              : "text-white"
          )}
        >
          {brand}
        </a>

        <ul className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  solid
                    ? "text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
                    : "text-white/90 hover:text-white"
                )}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#signup"
          className={cn(
            "inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-all",
            solid
              ? "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
              : "bg-white text-neutral-900 hover:bg-white/90"
          )}
        >
          Começar grátis
        </a>
      </nav>
    </header>
  )
}
