"use client"

import { useState } from "react"
import { ChevronDown, type LucideIcon, Zap, Shield, BarChart3, Users, Globe, Sparkles } from "lucide-react"

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ")

interface AccordionFeature {
  icon: LucideIcon
  title: string
  summary: string
  details: string
}

interface AccordionListProps {
  features?: AccordionFeature[]
  title?: string
}

const DEFAULT_FEATURES: AccordionFeature[] = [
  {
    icon: Zap,
    title: "Performance em primeiro lugar",
    summary: "Respostas em milissegundos",
    details:
      "Edge caching, build paralelo, CDN global. Nosso p99 de latência fica abaixo de 50ms em 85% das regiões — monitorado em tempo real e publicado mensalmente no status page.",
  },
  {
    icon: Shield,
    title: "Segurança enterprise-grade",
    summary: "SOC 2 Type II + LGPD",
    details:
      "Criptografia AES-256 em repouso e TLS 1.3 em trânsito. Audit trail imutável, SAML/SCIM, 2FA obrigatório para admins. Pentests trimestrais com relatório público.",
  },
  {
    icon: BarChart3,
    title: "Analytics sem setup",
    summary: "Dashboards que funcionam out-of-the-box",
    details:
      "Conecte sua fonte de dados e veja métricas em minutos. SQL editor integrado, export CSV/XLSX, alertas no Slack quando thresholds são ultrapassados.",
  },
  {
    icon: Users,
    title: "Colaboração em tempo real",
    summary: "Time inteiro no mesmo projeto",
    details:
      "Presença ao vivo, cursores, comentários inline, @menções. Notificações centralizadas e permissões granulares por projeto, pasta ou arquivo.",
  },
  {
    icon: Globe,
    title: "Edge global",
    summary: "50+ regiões no mundo",
    details:
      "Deploy automático em todas as regiões da Vercel/AWS. Failover automático, latência mínima, compliance com residência de dados por país (LGPD, GDPR, CCPA).",
  },
  {
    icon: Sparkles,
    title: "IA integrada",
    summary: "Assistente que aprende seu contexto",
    details:
      "Sugestões contextuais, auto-complete inteligente, geração de relatórios a partir de prompts em PT-BR. Modelo fine-tunado no seu domínio de negócio.",
  },
]

export default function AccordionList({
  features = DEFAULT_FEATURES,
  title = "Features em detalhe",
}: AccordionListProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          {title}
        </h2>

        <div className="mt-10 divide-y divide-slate-200 rounded-2xl ring-1 ring-slate-200 dark:divide-slate-800 dark:ring-slate-800">
          {features.map((f, idx) => {
            const Icon = f.icon
            const open = openIdx === idx
            return (
              <div key={f.title}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : idx)}
                  aria-expanded={open}
                  aria-controls={`accordion-${idx}`}
                  className="flex w-full items-center gap-4 px-6 py-5 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-inset dark:hover:bg-slate-900 dark:focus:ring-slate-50"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                      {f.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {f.summary}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 flex-shrink-0 text-slate-400 transition-transform",
                      open && "rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </button>
                {open && (
                  <div
                    id={`accordion-${idx}`}
                    className="px-6 pb-6 pl-[4.25rem]"
                  >
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {f.details}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
