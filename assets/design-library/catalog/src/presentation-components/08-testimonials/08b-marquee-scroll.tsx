import * as React from "react"

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ")

interface Testimonial {
  quote: string
  name: string
  company: string
  initials: string
}

const TESTIMONIALS: Testimonial[] = [
  { quote: "Ferramenta incrível, time adorou.", name: "Ana P.", company: "Quantum", initials: "AP" },
  { quote: "Economia de 60% no custo operacional.", name: "Bruno S.", company: "Oliva", initials: "BS" },
  { quote: "Setup em menos de 10 minutos.", name: "Carla M.", company: "Verde", initials: "CM" },
  { quote: "API simples e bem documentada.", name: "Diego F.", company: "Norte", initials: "DF" },
  { quote: "Suporte responde em minutos.", name: "Eduarda L.", company: "Ponto", initials: "EL" },
  { quote: "A melhor escolha do ano.", name: "Felipe R.", company: "Largo", initials: "FR" },
  { quote: "Performance absurda em produção.", name: "Gabriela T.", company: "Íris", initials: "GT" },
  { quote: "Substituiu 3 ferramentas. Recomendo.", name: "Heitor V.", company: "Porto", initials: "HV" },
]

function Card({ t }: { t: Testimonial }) {
  return (
    <div className="flex w-80 shrink-0 flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-sm text-neutral-700 dark:text-neutral-300">
        &ldquo;{t.quote}&rdquo;
      </p>
      <div className="flex items-center gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
        <div
          aria-hidden
          className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        >
          {t.initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-neutral-900 dark:text-neutral-50">
            {t.name}
          </div>
          <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            {t.company}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MarqueeScroll({
  className,
}: {
  className?: string
}) {
  return (
    <section
      aria-label="Depoimentos"
      className={cn("overflow-hidden bg-white py-20 dark:bg-neutral-950", className)}
    >
      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee-scroll 40s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; }
        }
      `}</style>

      <div className="mx-auto mb-10 max-w-2xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Amado por milhares de times
        </h2>
      </div>

      <div className="relative">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent dark:from-neutral-950"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent dark:from-neutral-950"
          aria-hidden
        />

        <div className="marquee-track flex w-max gap-4">
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <Card key={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}
