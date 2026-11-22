'use client'

import { useState } from 'react'
import { ShieldCheck, TrendingUp } from 'lucide-react'
import { customer, formatMoney } from '@/lib/bank-data'
import { creditBand, creditHistory } from '@/lib/everyday-data'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { OverlayFrame } from '../overlay'
import { SectionHeader, Switch } from '../primitives'

const MIN = 300
const MAX = 850

function Gauge({ score }: { score: number }) {
  const pct = (score - MIN) / (MAX - MIN)
  const r = 90
  const arc = Math.PI * r
  return (
    <svg viewBox="0 0 200 110" className="w-full max-w-[260px]" aria-hidden>
      <path d="M10 100 A90 90 0 0 1 190 100" fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={14} strokeLinecap="round" />
      <path
        d="M10 100 A90 90 0 0 1 190 100"
        fill="none"
        stroke="var(--lime)"
        strokeWidth={14}
        strokeLinecap="round"
        strokeDasharray={arc}
        strokeDashoffset={arc * (1 - pct)}
        className="transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  )
}

export function CreditScreen() {
  const { accounts, creditMonitoring, dispatch, notify } = useBank()
  const score = customer.creditScore
  const band = creditBand(score)
  const delta = score - creditHistory[creditHistory.length - 2].score
  const card = accounts.find((a) => a.kind === 'credit')
  const owed = Math.abs(card?.balance ?? 0)
  const limit = card?.limit ?? 1
  const [payDown, setPayDown] = useState(0)
  const util = owed / limit
  const newUtil = Math.max(0, owed - payDown) / limit
  const estGain = Math.min(25, Math.round((util - newUtil) * 100 * 1.4))
  const low = Math.min(...creditHistory.map((h) => h.score)) - 6
  const high = Math.max(...creditHistory.map((h) => h.score))

  const factors = [
    { name: 'On-time payments', value: '100%', rating: 'Excellent', good: true, tip: '38 months without a miss. Chef’s kiss.' },
    { name: 'Credit used', value: `${Math.round(util * 100)}%`, rating: util < 0.3 ? 'Great' : 'Could improve', good: util < 0.3, tip: 'Under 30% is the sweet spot. Under 10% is even sweeter.' },
    { name: 'Age of credit', value: '6 yrs 4 mo', rating: 'Good', good: true, tip: 'Keep older accounts open. Time does the work.' },
    { name: 'Hard inquiries', value: '1', rating: 'Great', good: true, tip: 'Checking your score here never counts as one.' },
    { name: 'Credit mix', value: '3 types', rating: 'Good', good: true, tip: 'Cards, auto and student loans. Nicely balanced.' },
  ]

  return (
    <OverlayFrame title="Credit score" onBack={() => dispatch({ type: 'overlay', overlay: null })}>
      <div className="flex flex-col gap-6 px-5">
        <section className="flex flex-col items-center rounded-[14px] bg-forest px-5 pb-6 pt-7 text-center text-forest-foreground">
          <div className="relative flex w-full justify-center">
            <Gauge score={score} />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
              <p className="text-[52px] font-semibold leading-none tracking-tight tabular-nums">{score}</p>
              <p className="mt-1 text-sm font-semibold text-lime">{band.label}</p>
            </div>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-sm font-medium">
            <TrendingUp className="size-4 text-lime" aria-hidden />
            Up {delta} points since last month
          </p>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-forest-foreground/80">{band.note}</p>
          <p className="mt-3 text-xs text-forest-foreground/60">TransUnion VantageScore 3.0 · Updated Oct 24 · Checking won&apos;t hurt your score</p>
        </section>

        <section aria-labelledby="trend">
          <SectionHeader id="trend" title="Your 6-month glow-up" />
          <div className="flex h-36 items-end gap-2 rounded-2xl bg-card p-4" role="img" aria-label={`Score rose from ${creditHistory[0].score} to ${score} over 6 months`}>
            {creditHistory.map((h, i) => (
              <div key={h.month} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[11px] font-medium tabular-nums text-muted-foreground">{h.score}</span>
                <div
                  className={cn('w-full rounded-t-lg', i === creditHistory.length - 1 ? 'bg-primary' : 'bg-primary/25')}
                  style={{ height: `${((h.score - low) / (high - low)) * 64 + 12}px` }}
                />
                <span className="text-xs text-muted-foreground">{h.month}</span>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="factors">
          <SectionHeader id="factors" title="What's shaping it" />
          <ul className="flex flex-col divide-y overflow-hidden rounded-2xl bg-card">
            {factors.map((f) => (
              <li key={f.name} className="flex flex-col gap-1 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{f.name}</p>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                      f.good ? 'bg-accent text-accent-foreground' : 'bg-destructive/10 text-destructive',
                    )}
                  >
                    {f.rating} · {f.value}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{f.tip}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="whatif" className="flex flex-col gap-3 rounded-2xl bg-card p-4">
          <h2 id="whatif" className="font-semibold">
            What if I paid down my Double Up Card?
          </h2>
          <label className="flex flex-col gap-2">
            <span className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pay down</span>
              <span className="font-semibold tabular-nums">{formatMoney(payDown)}</span>
            </span>
            <input
              type="range"
              min={0}
              max={Math.round(owed)}
              step={50}
              value={payDown}
              onChange={(e) => setPayDown(Number(e.target.value))}
              className="h-11 w-full accent-primary"
            />
          </label>
          <p className="text-pretty text-sm leading-relaxed">
            {estGain > 0 ? (
              <>
                Your utilization drops to <strong>{Math.round(newUtil * 100)}%</strong>, which could add about{' '}
                <strong className="text-primary">+{estGain} points</strong> within a month or two.
              </>
            ) : (
              'Slide to see how paying down your balance could boost your score.'
            )}
          </p>
        </section>

        <section className="flex items-center gap-3 rounded-2xl bg-card p-4">
          <ShieldCheck className="size-6 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-medium">Free credit monitoring</p>
            <p className="text-sm text-muted-foreground">We&apos;ll tell you about new accounts, inquiries and big changes.</p>
          </div>
          <Switch
            checked={creditMonitoring}
            label="Free credit monitoring"
            onChange={(on) => {
              dispatch({ type: 'creditMonitoring', on })
              if (on) dispatch({ type: 'alertPrefs', patch: { creditScore: true } })
              notify(on ? 'Monitoring on. We’ve got eyes on your credit 24/7.' : 'Credit monitoring paused')
            }}
          />
        </section>
      </div>
    </OverlayFrame>
  )
}
