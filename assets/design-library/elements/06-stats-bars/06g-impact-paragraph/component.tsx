const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

export interface ImpactParagraphStatsProps {
  eyebrow?: string
  className?: string
}

export default function ImpactParagraphStats({
  eyebrow = "Nosso impacto em números",
  className,
}: ImpactParagraphStatsProps) {
  return (
    <section
      className={cn(
        "w-full bg-white px-6 py-20 dark:bg-slate-950 md:py-28",
        className
      )}
    >
      <div className="mx-auto max-w-4xl">
        {eyebrow && (
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            {eyebrow}
          </p>
        )}

        <p className="text-balance text-center text-2xl font-medium leading-relaxed text-slate-700 dark:text-slate-300 md:text-3xl md:leading-relaxed lg:text-4xl lg:leading-relaxed">
          Em apenas{" "}
          <Highlight>3 anos</Highlight>, ajudamos mais de{" "}
          <Highlight>500 empresas</Highlight> a automatizar{" "}
          <Highlight>2,3 milhões</Highlight> de processos, gerando uma economia acumulada de{" "}
          <Highlight>R$ 180 milhões</Highlight> para os nossos clientes — com{" "}
          <Highlight>NPS de 82</Highlight> e{" "}
          <Highlight>98% de uptime</Highlight>.
        </p>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Dados consolidados em março de 2026.
        </p>
      </div>
    </section>
  )
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block font-bold text-slate-900 dark:text-slate-50">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-1 -z-10 h-3 bg-indigo-200/60 dark:bg-indigo-400/30"
      />
      {children}
    </span>
  )
}
