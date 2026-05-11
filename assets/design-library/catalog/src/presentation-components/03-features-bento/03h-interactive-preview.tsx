"use client"

import { useState } from "react"
import type React from "react"
import {
  BarChart3,
  Users,
  Zap,
  Shield,
  Globe,
} from "lucide-react"

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ")

interface Feature {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  previewCaption: string
  accentFrom?: string
  accentTo?: string
}

interface InteractivePreviewProps {
  features?: Feature[]
  title?: string
  subtitle?: string
}

const DEFAULT_FEATURES: Feature[] = [
  {
    id: "analytics",
    icon: BarChart3,
    title: "Dashboards em tempo real",
    description: "Métricas que refletem o que está acontecendo agora.",
    previewCaption: "analytics.live-preview.png",
    accentFrom: "from-indigo-500",
    accentTo: "to-purple-600",
  },
  {
    id: "collab",
    icon: Users,
    title: "Colaboração ao vivo",
    description: "Presença, cursores e comentários como em Figma.",
    previewCaption: "collab.cursors.png",
    accentFrom: "from-emerald-500",
    accentTo: "to-teal-600",
  },
  {
    id: "deploy",
    icon: Zap,
    title: "Deploy instantâneo",
    description: "Do push ao live em menos de 1 minuto.",
    previewCaption: "deploy.pipeline.png",
    accentFrom: "from-amber-500",
    accentTo: "to-orange-600",
  },
  {
    id: "security",
    icon: Shield,
    title: "Enterprise security",
    description: "SOC 2, SSO, SAML, audit logs completos.",
    previewCaption: "security.audit.png",
    accentFrom: "from-rose-500",
    accentTo: "to-red-600",
  },
  {
    id: "edge",
    icon: Globe,
    title: "Edge global",
    description: "50+ regiões, latência mínima em qualquer lugar.",
    previewCaption: "edge.map.png",
    accentFrom: "from-sky-500",
    accentTo: "to-blue-600",
  },
]

export default function InteractivePreview({
  features = DEFAULT_FEATURES,
  title = "Explore cada feature",
  subtitle = "Passe o mouse ou toque para ver o preview",
}: InteractivePreviewProps) {
  const [activeId, setActiveId] = useState(features[0].id)
  const active = features.find((f) => f.id === activeId) ?? features[0]
  const ActiveIcon = active.icon

  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.5fr]">
          <ul className="space-y-2" role="tablist">
            {features.map((f) => {
              const Icon = f.icon
              const isActive = f.id === activeId
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls="feature-preview"
                    onMouseEnter={() => setActiveId(f.id)}
                    onFocus={() => setActiveId(f.id)}
                    onClick={() => setActiveId(f.id)}
                    className={cn(
                      "flex w-full items-start gap-4 rounded-xl p-4 text-left ring-1 transition",
                      isActive
                        ? "bg-slate-50 ring-slate-900 dark:bg-slate-900 dark:ring-slate-50"
                        : "bg-white ring-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:ring-slate-800 dark:hover:bg-slate-900"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
                        isActive
                          ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {f.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                        {f.description}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>

          <div
            id="feature-preview"
            role="tabpanel"
            className={cn(
              "relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br ring-1 ring-slate-200 dark:ring-slate-800 transition",
              active.accentFrom,
              active.accentTo
            )}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <ActiveIcon
                className="h-32 w-32 text-white/30"
                aria-hidden="true"
              />
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-lg bg-white/90 px-4 py-2.5 backdrop-blur-sm dark:bg-slate-950/80">
              <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                {active.previewCaption}
              </span>
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                {active.title}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
