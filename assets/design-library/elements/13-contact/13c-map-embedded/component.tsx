"use client"

import * as React from "react"
import { MapPin, Send } from "lucide-react"

const cn = (...xs: any[]) => xs.filter(Boolean).join(" ")

interface MapEmbeddedProps {
  className?: string
  mapSrc?: string
}

export default function MapEmbedded({ className, mapSrc }: MapEmbeddedProps) {
  const [form, setForm] = React.useState({ name: "", email: "", message: "" })
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section className={cn("w-full bg-white py-16 dark:bg-slate-950", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            Venha nos visitar
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Nosso escritorio fica no coracao da Barra. Marque uma visita ou envie uma mensagem.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Map */}
          <div className="lg:col-span-3">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
              {mapSrc ? (
                <iframe
                  src={mapSrc}
                  title="Mapa da localizacao do escritorio"
                  className="h-full min-h-[420px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div
                  role="img"
                  aria-label="Mapa placeholder da sede"
                  className="flex aspect-[4/3] w-full flex-col items-center justify-center bg-[linear-gradient(135deg,theme(colors.slate.100)_25%,transparent_25%,transparent_50%,theme(colors.slate.100)_50%,theme(colors.slate.100)_75%,transparent_75%,transparent)] bg-[size:20px_20px] text-slate-500 dark:bg-[linear-gradient(135deg,theme(colors.slate.800)_25%,transparent_25%,transparent_50%,theme(colors.slate.800)_50%,theme(colors.slate.800)_75%,transparent_75%,transparent)] dark:text-slate-400"
                >
                  <MapPin className="h-10 w-10 text-emerald-500" />
                  <p className="mt-3 text-sm font-medium">Mapa aqui</p>
                  <p className="mt-0.5 text-xs">Substitua por iframe do Google Maps ou Mapbox</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
              <p className="font-medium text-slate-900 dark:text-slate-100">Av. das Americas, 1.000</p>
              <p>Sala 404 — Barra da Tijuca, Rio de Janeiro — RJ</p>
              <p>CEP: 22640-904</p>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">Envie uma mensagem</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Retornamos em ate 1 dia util.</p>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="m-name" className="sr-only">
                  Nome
                </label>
                <input
                  id="m-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>
              <div>
                <label htmlFor="m-email" className="sr-only">
                  Email
                </label>
                <input
                  id="m-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>
              <div>
                <label htmlFor="m-message" className="sr-only">
                  Mensagem
                </label>
                <textarea
                  id="m-message"
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Como podemos ajudar?"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>
            </div>

            {submitted ? (
              <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                Mensagem enviada.
              </p>
            ) : (
              <button
                type="submit"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                <Send className="h-4 w-4" /> Enviar
              </button>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}
