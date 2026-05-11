"use client"

import { useMemo, useState } from "react"
import { Users, Check } from "lucide-react"

interface UsageSliderProps {
  basePrice?: number
  perSeatPrice?: number
  minSeats?: number
  maxSeats?: number
  features?: string[]
  onSelect?: (seats: number, total: number) => void
}

export default function UsageSlider({
  basePrice = 29,
  perSeatPrice = 12,
  minSeats = 1,
  maxSeats = 100,
  features = [
    "Projetos ilimitados",
    "Integrações avançadas",
    "Suporte prioritário",
    "Audit logs",
    "API access",
  ],
  onSelect,
}: UsageSliderProps) {
  const [seats, setSeats] = useState(5)

  const total = useMemo(
    () => basePrice + seats * perSeatPrice,
    [basePrice, perSeatPrice, seats]
  )

  const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            Pague pelo que usa
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            Ajuste o número de usuários e veja o preço em tempo real
          </p>
        </div>

        <div className="mt-10 rounded-2xl bg-slate-50 p-8 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
              <label
                htmlFor="seats"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Usuários
              </label>
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {seats}
            </span>
          </div>

          <input
            id="seats"
            type="range"
            min={minSeats}
            max={maxSeats}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            aria-label="Número de usuários"
            className="mt-4 w-full accent-slate-900 dark:accent-slate-50"
          />
          <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-slate-500">
            <span>{minSeats}</span>
            <span>{maxSeats}</span>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600 dark:text-slate-400">Plataforma base</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-50">
                  {formatBRL(basePrice)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600 dark:text-slate-400">
                  {seats} × {formatBRL(perSeatPrice)}
                </dt>
                <dd className="font-medium text-slate-900 dark:text-slate-50">
                  {formatBRL(seats * perSeatPrice)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex items-baseline justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Total mensal
              </span>
              <span className="text-4xl font-bold text-slate-900 dark:text-slate-50">
                {formatBRL(total)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onSelect?.(seats, total)}
              className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Começar com {seats} usuários
            </button>
          </div>
        </div>

        <ul className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {features.map((feat) => (
            <li
              key={feat}
              className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
            >
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              {feat}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
