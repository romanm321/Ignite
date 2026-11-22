'use client'

import { useId } from 'react'
import { formatMoney } from '@/lib/bank-data'
import { cn } from '@/lib/utils'
import { balanceSeries, dayOfMonth, daysInMonth, estimateEndOfMonth, monthName, spentThisMonth, weeklySpending } from '@/lib/insights-view'
import type { Transaction } from '@/lib/bank-data'
import { useBank } from '../bank-provider'
import { BigAmount } from '../big-amount'

const compact = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '')}k` : `$${Math.round(n)}`)

function useMasked() {
  const { streetSafe } = useBank()
  return (text: string) => (streetSafe ? '••••' : text)
}

/** Balance across the chosen accounts for this month, with a dashed estimate to the end of the month. */
export function BalanceCard({ balance, txns }: { balance: number; txns: Transaction[] }) {
  const gradientId = useId()
  const mask = useMasked()
  const series = balanceSeries(balance, txns)
  const est = estimateEndOfMonth(balance, txns)
  const yMax = Math.max(...series.map((p) => p.value), est, balance, 1) * 1.08
  const flat = balance === 0 && est === 0
  const x = (day: number) => ((day - 1) / (daysInMonth - 1)) * 100
  const y = (v: number) => 100 - (Math.max(v, 0) / yMax) * 100

  const line = series.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.day).toFixed(2)},${y(p.value).toFixed(2)}`).join(' ')
  const last = series[series.length - 1]
  const area = `${line} L${x(last.day)},100 L${x(1)},100 Z`
  const first = series[0]

  return (
    <section aria-labelledby="balance-h" className="overflow-hidden rounded-3xl bg-card">
      <div className="flex items-start justify-between gap-3 bg-sky-200 p-5 text-sky-950">
        <div>
          <h2 id="balance-h" className="font-heading text-xl font-bold leading-tight">
            This month
          </h2>
          <p className="text-sm text-sky-950/70">
            {monthName} 1–{monthName} {daysInMonth}
          </p>
        </div>
        <div className="text-right">
          <BigAmount value={mask(formatMoney(balance))} className="block text-3xl" />
          <p className="mt-1 text-sm text-sky-950/70">Today&apos;s balance</p>
        </div>
      </div>

      <div className="p-5">
      <div className="flex gap-2">
        <div
          className="relative h-36 flex-1"
          role="img"
          aria-label={`Balance this month. Started at ${mask(formatMoney(first.value))}, now ${mask(formatMoney(balance))}, estimated ${mask(formatMoney(est))} by the end of the month.`}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible text-primary">
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 33.3, 66.6, 100].map((g) => (
              <line key={g} x1="0" x2="100" y1={g} y2={g} stroke="currentColor" strokeOpacity="0.1" vectorEffect="non-scaling-stroke" />
            ))}
            {[25, 50, 75].map((g) => (
              <line key={g} y1="0" y2="100" x1={g} x2={g} stroke="currentColor" strokeOpacity="0.08" vectorEffect="non-scaling-stroke" />
            ))}
            <path d={area} fill={`url(#${gradientId})`} />
            <path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <line
              x1={x(last.day)}
              x2="100"
              y1={y(last.value)}
              y2={y(est)}
              stroke="currentColor"
              strokeOpacity="0.5"
              strokeWidth="2"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span aria-hidden className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-primary bg-card" style={{ left: `${x(first.day)}%`, top: `${y(first.value)}%` }} />
          <span aria-hidden className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-primary bg-card" style={{ left: `${x(last.day)}%`, top: `${y(last.value)}%` }} />
        </div>
        <div className="relative h-36 w-14 shrink-0 text-xs text-muted-foreground" aria-hidden>
          {!flat && y(est) > 22 && <span className="absolute right-0 top-0 -translate-y-1/2">{mask(compact(yMax / 1.08))}</span>}
          {!flat && (
            <span className="absolute right-0 -translate-y-1/2 text-right font-medium leading-tight text-primary" style={{ top: `${y(est)}%` }}>
              {mask(compact(est))}
              <br />
              EST
            </span>
          )}
          <span className="absolute bottom-0 right-0 translate-y-1/2">$0</span>
        </div>
      </div>
      <div className="mt-2 flex justify-between pr-16 text-xs text-muted-foreground" aria-hidden>
        <span>
          {monthName} 1
        </span>
        <span>
          {monthName} {daysInMonth}
        </span>
      </div>
      </div>
    </section>
  )
}

/** Spending by week over the last six weeks, with the typical week marked. */
export function SpendingCard({ txns }: { txns: Transaction[] }) {
  const mask = useMasked()
  const weeks = weeklySpending(txns)
  const total = spentThisMonth(txns)
  const max = Math.max(...weeks.map((w) => w.total), 1)
  const avg = weeks.reduce((s, w) => s + w.total, 0) / weeks.length

  return (
    <section aria-labelledby="spend-h" className="overflow-hidden rounded-3xl bg-card">
      <div className="flex items-start justify-between gap-3 bg-sky-200 p-5 text-sky-950">
        <div>
          <h2 id="spend-h" className="font-heading text-xl font-bold leading-tight">
            This month
          </h2>
          <p className="text-sm text-sky-950/70">
            {monthName} 1–{monthName} {dayOfMonth}
          </p>
        </div>
        <div className="text-right">
          <BigAmount value={mask(formatMoney(total))} className="block text-3xl" />
          <p className="mt-1 text-sm text-sky-950/70">Spent</p>
        </div>
      </div>

      <div className="p-5">
      <div className="flex gap-2">
        <div
          className="relative h-36 flex-1"
          role="img"
          aria-label={`Weekly spending. ${weeks.map((w) => `Week of ${w.label}, ${mask(formatMoney(w.total))}`).join('. ')}. Typical week ${mask(formatMoney(avg))}.`}
        >
          {[0, 50, 100].map((g) => (
            <span key={g} aria-hidden className="absolute inset-x-0 border-t border-foreground/10" style={{ top: `${g}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end justify-between gap-2 px-1">
            {weeks.map((w) => (
              <span
                key={w.label}
                className={cn('block flex-1 rounded-md', w.current ? 'bg-primary' : 'bg-primary/35')}
                style={{ height: `${Math.max((w.total / max) * 100, 2)}%` }}
              />
            ))}
          </div>
          <span aria-hidden className="absolute inset-x-0 border-t-2 border-dashed border-primary/60" style={{ bottom: `${(avg / max) * 100}%` }} />
        </div>
        <div className="relative h-36 w-14 shrink-0 text-xs text-muted-foreground" aria-hidden>
          <span className="absolute right-0 top-0 -translate-y-1/2">{mask(compact(max))}</span>
          <span className="absolute right-0 translate-y-1/2 text-right font-medium leading-tight text-primary" style={{ bottom: `${(avg / max) * 100}%` }}>
            {mask(compact(avg))}
            <br />
            AVG
          </span>
        </div>
      </div>
      <div className="mt-2 flex justify-between gap-2 px-1 pr-16 text-center text-xs text-muted-foreground" aria-hidden>
        {weeks.map((w) => (
          <span key={w.label} className={cn('flex-1', w.current && 'font-semibold text-primary')}>
            {w.label}
          </span>
        ))}
      </div>
      <p className="mt-1 text-center text-xs text-muted-foreground">Week starting</p>
      </div>
    </section>
  )
}
