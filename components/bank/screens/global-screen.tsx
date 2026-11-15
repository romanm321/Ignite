'use client'

import { useState } from 'react'
import { ArrowDown, BellRing, ChevronLeft, Wifi } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { STREET_SAFE_CAP, useBank } from '../bank-provider'
import { Pill, SectionHeader } from '../primitives'

const esims = [
  { country: 'Japan', data: '10 GB · 15 days', price: 12 },
  { country: 'Europe (39 countries)', data: '20 GB · 30 days', price: 19 },
  { country: 'Mexico', data: '5 GB · 7 days', price: 7 },
]

export function GlobalScreen() {
  const { wallets, streetSafe, dispatch, notify } = useBank()
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('JPY')
  const [amount, setAmount] = useState('500')

  const fromW = wallets.find((w) => w.code === from)!
  const toW = wallets.find((w) => w.code === to)!
  const value = Number(amount) || 0
  const rate = toW.perUsd / fromW.perUsd
  const received = value * rate
  const usdValue = value / fromW.perUsd
  const overCap = streetSafe && usdValue > STREET_SAFE_CAP
  const invalid = value <= 0 || value > fromW.balance || from === to || overCap

  function exchange() {
    if (invalid) return
    dispatch({ type: 'convert', from, to, amount: value })
    notify(`Exchanged ${formatMoney(value, from)} → ${formatMoney(received, to)}`)
  }

  return (
    <div className="no-scrollbar absolute inset-0 z-30 overflow-y-auto bg-background pb-8 animate-in slide-in-from-right-8 fade-in">
      <header className="sticky top-0 z-10 flex items-center gap-2 bg-background/90 px-2 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => dispatch({ type: 'overlay', overlay: null })}
          aria-label="Back"
          className="flex size-11 items-center justify-center rounded-full"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </button>
        <h1 className="text-lg font-semibold">Global money</h1>
      </header>

      <div className="flex flex-col gap-6 px-4">
        <section aria-labelledby="fx-h" className="rounded-3xl bg-forest p-4 text-forest-foreground">
          <div className="flex items-center justify-between">
            <h2 id="fx-h" className="font-semibold">
              Exchange
            </h2>
            <Pill className="bg-lime text-lime-foreground">Interbank rate · $0 fee</Pill>
          </div>

          <div className="mt-4 rounded-2xl bg-white/10 p-3">
            <div className="flex items-center gap-2">
              <label htmlFor="fx-from" className="sr-only">
                From currency
              </label>
              <select
                id="fx-from"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-11 rounded-xl bg-white/15 px-3 text-base font-semibold text-forest-foreground [&>option]:text-foreground"
              >
                {wallets.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code}
                  </option>
                ))}
              </select>
              <label htmlFor="fx-amount" className="sr-only">
                Amount to exchange
              </label>
              <input
                id="fx-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                className="tabular h-11 min-w-0 flex-1 bg-transparent text-right font-mono text-2xl font-semibold outline-none"
              />
            </div>
            <p className="mt-1 text-right text-xs text-forest-foreground/70">
              Balance {formatMoney(fromW.balance, from)}
            </p>
          </div>

          <div className="-my-3 flex justify-center">
            <button
              type="button"
              aria-label="Swap currencies"
              onClick={() => {
                setFrom(to)
                setTo(from)
              }}
              className="relative z-10 flex size-11 items-center justify-center rounded-full bg-lime text-lime-foreground ring-4 ring-forest"
            >
              <ArrowDown className="size-5" aria-hidden />
            </button>
          </div>

          <div className="rounded-2xl bg-white/10 p-3">
            <div className="flex items-center gap-2">
              <label htmlFor="fx-to" className="sr-only">
                To currency
              </label>
              <select
                id="fx-to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-11 rounded-xl bg-white/15 px-3 text-base font-semibold text-forest-foreground [&>option]:text-foreground"
              >
                {wallets.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code}
                  </option>
                ))}
              </select>
              <output className="tabular min-w-0 flex-1 truncate text-right font-mono text-2xl font-semibold" aria-live="polite">
                {formatMoney(received, to)}
              </output>
            </div>
            <p className="mt-1 text-right text-xs text-forest-foreground/70">
              1 {from} = {rate.toFixed(to === 'JPY' ? 2 : 4)} {to}
            </p>
          </div>

          {overCap && (
            <p className="mt-3 text-sm text-lime">Street Safe is on — exchanges are capped at ${STREET_SAFE_CAP}.</p>
          )}

          <button
            type="button"
            onClick={exchange}
            disabled={invalid}
            className="mt-4 h-12 w-full rounded-xl bg-shield font-semibold text-shield-foreground disabled:opacity-40"
          >
            Exchange now
          </button>
          <button
            type="button"
            onClick={() => notify(`We'll alert you when 1 ${from} hits ${(rate * 1.01).toFixed(2)} ${to}`)}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 text-sm font-medium text-forest-foreground/80"
          >
            <BellRing className="size-4" aria-hidden /> Set a rate alert
          </button>
        </section>

        <section aria-labelledby="wallets2-h" className="flex flex-col gap-3">
          <SectionHeader id="wallets2-h" title="Your wallets" />
          <ul className="divide-y overflow-hidden rounded-3xl bg-card">
            {wallets.map((w) => (
              <li key={w.code} className="flex min-h-16 items-center gap-3 px-4 py-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-muted text-xs font-bold">
                  {w.code}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{w.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {w.code === 'USD' ? 'Home currency' : `1 USD = ${w.perUsd} ${w.code}`}
                  </p>
                </div>
                <p className="tabular font-mono font-semibold">{formatMoney(w.balance, w.code)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="esim-h" className="flex flex-col gap-3">
          <SectionHeader id="esim-h" title="Travel eSIM" action={<Pill className="bg-accent text-accent-foreground">No roaming fees</Pill>} />
          <ul className="flex flex-col gap-2">
            {esims.map((e) => (
              <li key={e.country} className="flex items-center gap-3 rounded-2xl bg-card p-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-lime">
                  <Wifi className="size-5" aria-hidden />
                </span>
                <div className="flex-1">
                  <p className="font-medium">{e.country}</p>
                  <p className="text-xs text-muted-foreground">{e.data}</p>
                </div>
                <button
                  type="button"
                  onClick={() => notify(`${e.country} eSIM installed. It activates when you land.`)}
                  className="h-11 rounded-xl bg-shield px-4 text-sm font-semibold text-shield-foreground"
                >
                  ${e.price}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
