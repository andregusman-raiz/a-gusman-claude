"use client"

import { useState } from "react"
import { Mail, User, Building2, Check, ArrowRight, ArrowLeft } from "lucide-react"

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ")

interface MultiStepWizardProps {
  onComplete?: (data: {
    email: string
    name: string
    company: string
    code: string
  }) => void
  brand?: string
}

const STEPS = [
  { id: 1, title: "E-mail", description: "Confirme seu e-mail" },
  { id: 2, title: "Dados", description: "Conte sobre você" },
  { id: 3, title: "Verificação", description: "Código de 6 dígitos" },
]

export default function MultiStepWizard({
  onComplete,
  brand = "rAIz",
}: MultiStepWizardProps) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [code, setCode] = useState("")

  const next = () => setStep((s) => Math.min(3, s + 1))
  const prev = () => setStep((s) => Math.max(1, s - 1))
  const submit = () => onComplete?.({ email, name, company, code })

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {brand}
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-50">
            Criar sua conta
          </h1>
        </div>

        <ol className="flex items-center justify-between mb-8" aria-label="Progresso">
          {STEPS.map((s, idx) => {
            const active = s.id === step
            const done = s.id < step
            return (
              <li key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
                      done
                        ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                        : active
                          ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    {done ? <Check className="h-4 w-4" /> : s.id}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      active || done
                        ? "text-slate-900 dark:text-slate-50"
                        : "text-slate-500 dark:text-slate-500"
                    )}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2",
                      done
                        ? "bg-slate-900 dark:bg-slate-50"
                        : "bg-slate-200 dark:bg-slate-800"
                    )}
                  />
                )}
              </li>
            )
          })}
        </ol>

        <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Qual seu e-mail?
              </h2>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com"
                  aria-label="E-mail"
                  className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Conte sobre você
              </h2>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  aria-label="Nome"
                  className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                />
              </div>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Empresa"
                  aria-label="Empresa"
                  className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Digite o código
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Enviamos um código de 6 dígitos para {email || "seu e-mail"}
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                aria-label="Código de verificação"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-center text-2xl font-mono tracking-widest dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              />
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={prev}
              disabled={step === 1}
              className="flex items-center gap-1 text-sm font-medium text-slate-600 disabled:opacity-40 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <button
              type="button"
              onClick={step === 3 ? submit : next}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {step === 3 ? "Finalizar" : "Continuar"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
