const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface LogoWallProps {
  title?: string
  logos?: string[]
  className?: string
}

const defaultLogos = [
  "Acme",
  "Nubank",
  "iFood",
  "Stone",
  "Loft",
  "QuintoAndar",
  "Raiz",
  "Kavak",
  "MadeiraMadeira",
  "Zé Delivery",
  "Creditas",
  "Vtex",
]

export default function LogoWall({
  title = "Empresas que confiam na gente",
  logos = defaultLogos,
  className,
}: LogoWallProps) {
  return (
    <section
      className={cn(
        "w-full bg-white px-6 py-14 dark:bg-slate-950 md:py-20",
        className
      )}
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {title}
        </p>

        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {logos.map((logo) => (
            <div
              key={logo}
              className="group flex items-center justify-center"
              aria-label={`Logo ${logo}`}
            >
              <span className="text-lg font-bold text-slate-400 grayscale transition duration-300 group-hover:text-slate-900 group-hover:grayscale-0 dark:text-slate-500 dark:group-hover:text-slate-50 md:text-xl">
                {logo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
