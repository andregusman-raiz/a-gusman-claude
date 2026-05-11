"use client"

import * as React from "react"
import { Check, Circle } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

interface Task {
  id: string
  title: string
  description: string
}

interface ChecklistProgressProps {
  title?: string
  subtitle?: string
  tasks?: Task[]
  className?: string
}

const DEFAULT_TASKS: Task[] = [
  { id: "1", title: "Crie sua conta", description: "Preencha os dados basicos e confirme o email." },
  { id: "2", title: "Conecte sua primeira fonte de dados", description: "Importe CSV ou conecte uma API." },
  { id: "3", title: "Convide seu time", description: "Adicione ate 3 colaboradores no plano gratuito." },
  { id: "4", title: "Configure seu primeiro dashboard", description: "Escolha um template pronto ou comece do zero." },
  { id: "5", title: "Publique seu primeiro relatorio", description: "Compartilhe com stakeholders via link seguro." },
]

export default function ChecklistProgress({
  title = "Primeiros passos",
  subtitle = "Complete as tarefas abaixo para configurar sua conta.",
  tasks = DEFAULT_TASKS,
  className,
}: ChecklistProgressProps) {
  const [done, setDone] = React.useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const percent = Math.round((done.size / tasks.length) * 100)

  return (
    <div
      className={cn(
        "w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950",
        className
      )}
    >
      <div className="px-6 pt-6 pb-4">
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {done.size}/{tasks.length}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
        <div
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso de onboarding"
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out dark:bg-emerald-400"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ul className="divide-y divide-slate-100 dark:divide-slate-900">
        {tasks.map((task) => {
          const checked = done.has(task.id)
          return (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => toggle(task.id)}
                aria-pressed={checked}
                className={cn(
                  "flex w-full items-start gap-4 px-6 py-4 text-left transition-colors",
                  "hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-slate-900"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                    checked
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                  )}
                >
                  {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : <Circle className="h-3 w-3 opacity-0" />}
                </span>
                <div className="flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium text-slate-900 transition-colors dark:text-slate-100",
                      checked && "text-slate-500 line-through dark:text-slate-500"
                    )}
                  >
                    {task.title}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{task.description}</p>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
