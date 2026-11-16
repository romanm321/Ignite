'use client'

import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { Pill } from '../primitives'
import type { InsightsTab } from './types'
import { useInsights } from './use-insights'

function CycleCard({ onTab }: { onTab: (tab: InsightsTab) => void }) {
  const { dispatch } = useBank()
  const { cycle, show, showWhole } = useInsights()

  if (!cycle.hasPaycheck) {
    return (
      <section aria-labelledby="cycle-h" className="rounded-3xl bg-card p-5">
        <h3 id="cycle-h" className="font-semibold">
          Your first payday starts your cycle
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Set up direct deposit and Tedi tracks your bills, spending and savings from payday to payday, so you always know what is safe to spend.
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: 'askTedi', prompt: 'Help me set up direct deposit' })}
          className="mt-4 h-12 w-full rounded-xl bg-forest text-sm font-semibold text-forest-foreground"
        >
          Set up direct deposit
        </button>
      </section>
    )
  }

  const parts = [
    { id: 'vaults', label: 'Saved to vaults', amount: cycle.sorted, bar: 'bg-sky-300' },
    { id: 'bills', label: 'Bills due', amount: cycle.committedTotal, bar: 'bg-white/75' },
    { id: 'spent', label: 'Spent so far', amount: cycle.spent, bar: 'bg-white/30' },
    { id: 'left', label: 'Left to spend', amount: Math.max(0, cycle.left), bar: 'bg-lime' },
  ]
  const over = cycle.left < 0

  return (
    <section aria-labelledby="cycle-h" className="rounded-3xl bg-forest p-5 text-forest-foreground">
      <div className="flex items-center justify-between gap-2">
        <h3 id="cycle-h" className="text-sm text-forest-foreground/70">
          Payday to payday · {cycle.lastPayday} to {cycle.nextPayday}
        </h3>
        <Pill className="bg-lime text-lime-foreground">
          Day {cycle.dayOfCycle} of {cycle.length}
        </Pill>
      </div>

      <p className="mt-4 text-sm text-forest-foreground/70">{over ? 'Over your room by' : 'Safe to spend until payday'}</p>
      <p className="tabular font-mono text-4xl font-semibold">{show(Math.abs(cycle.left))}</p>
      <p className="mt-1 text-sm text-lime">
        {over ? `Ease off ${cycle.daysLeft} days to payday` : `About ${showWhole(cycle.perDay)} a day for ${cycle.daysLeft} days`}
      </p>

      <div
        className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full bg-white/10"
        role="img"
        aria-label={`Your ${showWhole(cycle.paycheck)} paycheck: ${parts.map((p) => `${showWhole(p.amount)} ${p.label.toLowerCase()}`).join(', ')}`}
      >
        {parts
          .filter((p) => p.amount > 0)
          .map((p) => (
            <span key={p.id} className={cn('h-full', p.bar)} style={{ width: `${Math.max(1.5, (p.amount / cycle.paycheck) * 100)}%` }} />
          ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {parts.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-forest-foreground/80">
              <span className={cn('size-2.5 shrink-0 rounded-full', p.bar)} aria-hidden />
              {p.label}
            </span>
            <span className="tabular font-mono">{showWhole(p.amount)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-forest-foreground/60">
        From your {showWhole(cycle.paycheck)} paycheck. Rent, bills and subscriptions are kept apart from everyday spending.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onTab('bills')} className="h-11 rounded-xl border border-white/20 text-sm font-semibold">
          See bills due
        </button>
        <button type="button" onClick={() => onTab('spending')} className="h-11 rounded-xl bg-white/15 text-sm font-semibold">
          See spending
        </button>
      </div>
    </section>
  )
}

export function OverviewTab({ onTab }: { onTab: (tab: InsightsTab) => void }) {
  return <CycleCard onTab={onTab} />
}
