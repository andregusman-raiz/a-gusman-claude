"use client"

import { useState } from "react"
import {
  Check,
  type LucideIcon,
  UserRound,
  Briefcase,
  Link as LinkIcon,
} from "lucide-react"

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ")

interface Tab {
  id: string
  label: string
  icon: LucideIcon
  title: string
  description: string
  bullets: string[]
}

interface TabSwitcherProps {
  tabs?: Tab[]
  sectionTitle?: string
}

const DEFAULT_TABS: Tab[] = [
  {
    id: "perfil",
    label: "Por Perfil",
    icon: UserRound,
    title: "Feito para cada papel",
    description:
      "Do PM ao dev, do designer ao CEO — cada perfil tem sua view otimizada.",
    bullets: [
      "PM: roadmap e prioridades",
      "Dev: código e deploys",
      "Designer: comentários e revisão",
      "CEO: KPIs executivos",
    ],
  },
  {
    id: "uso",
    label: "Por Uso",
    icon: Briefcase,
    title: "Encaixa no seu fluxo",
    description:
      "Daily standup, review trimestral, planejamento de sprint — templates para cada ritual.",
    bullets: [
      "Stand-ups automáticos",
      "Review de sprint em 1 clique",
      "OKR tracking integrado",
      "Retrospectiva colaborativa",
    ],
  },
  {
    id: "integracao",
    label: "Por Integração",
    icon: LinkIcon,
    title: "Funciona com suas ferramentas",
    description:
      "Slack, GitHub, Figma, Linear, Notion, Jira. Setup em minutos, sem zaps, sem middleware.",
    bullets: [
      "100+ integrações nativas",
      "Webhooks customizáveis",
      "API REST + GraphQL",
      "SDKs para 6 linguagens",
    ],
  },
]

export default function TabSwitcher({
  tabs = DEFAULT_TABS,
  sectionTitle = "Explore do seu jeito",
}: TabSwitcherProps) {
  const [active, setActive] = useState(tabs[0].id)
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0]
  const ActiveIcon = activeTab.icon

  return (
    <section className="bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-900">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          {sectionTitle}
        </h2>

        <div
          role="tablist"
          aria-label="Categorias de features"
          className="mt-8 mx-auto flex w-fit items-center gap-1 rounded-full bg-slate-200 p-1 dark:bg-slate-800"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.id === active
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActive(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition",
                  isActive
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-50"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div
          id={`panel-${activeTab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab.id}`}
          className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2"
        >
          <div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900">
              <ActiveIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {activeTab.title}
            </h3>
            <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
              {activeTab.description}
            </p>
            <ul className="mt-5 space-y-2">
              {activeTab.bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                >
                  <Check className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 ring-1 ring-slate-300 dark:from-slate-800 dark:to-slate-900 dark:ring-slate-700">
            <div className="absolute inset-0 flex items-center justify-center">
              <ActiveIcon
                className="h-24 w-24 text-slate-400/50 dark:text-slate-600/50"
                aria-hidden="true"
              />
            </div>
            <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-white/90 px-4 py-3 backdrop-blur-sm dark:bg-slate-950/80">
              <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                preview.{activeTab.id}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
