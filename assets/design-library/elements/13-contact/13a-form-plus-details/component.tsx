"use client"

import * as React from "react"
import { Mail, MapPin, Phone, Clock, Send } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

interface FormPlusDetailsProps {
  className?: string
  onSubmit?: (data: { name: string; email: string; message: string }) => void
}

export default function FormPlusDetails({ className, onSubmit }: FormPlusDetailsProps) {
  const [form, setForm] = React.useState({ name: "", email: "", message: "" })
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(form)
    setSubmitted(true)
  }

  const update = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <section className={cn("w-full bg-slate-50 py-16 dark:bg-slate-950", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            Fale com a gente
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Respondemos em ate 1 dia util. Escolha o canal que preferir.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8"
          >
            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nome
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Seu nome completo"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="voce@empresa.com"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Mensagem
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="Como podemos ajudar?"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {submitted ? (
              <div
                role="status"
                className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
              >
                Mensagem enviada. Respondemos em breve.
              </div>
            ) : (
              <button
                type="submit"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                <Send className="h-4 w-4" /> Enviar mensagem
              </button>
            )}
          </form>

          {/* Contact details */}
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">Canais diretos</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Email</p>
                    <a
                      href="mailto:contato@raiz.com"
                      className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                      contato@raiz.com
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Telefone</p>
                    <a
                      href="tel:+5521999999999"
                      className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                      +55 (21) 99999-9999
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Endereco</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Av. das Americas, 1.000 — Barra da Tijuca, Rio de Janeiro
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Horario</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Seg a Sex, 9h as 18h (BRT)</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white">
              <h3 className="text-base font-semibold">Precisa de suporte urgente?</h3>
              <p className="mt-1 text-sm text-emerald-50">
                Clientes enterprise tem canal prioritario 24/7.
              </p>
              <button className="mt-4 inline-flex items-center rounded-lg bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-white/20">
                Abrir chamado prioritario
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
