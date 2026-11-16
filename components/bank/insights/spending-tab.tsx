'use client'

import { useState } from 'react'
import { ChevronRight, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/lib/bank-data'
import { categoryOf, daysAgo, flexibleCategories, isSpend } from '@/lib/insights'
import { useBank } from '../bank-provider'
import { SectionHeader } from '../primitives'
import { CategorySheet } from './sheets'
import { useInsights } from './use-insights'

type Lens = 'cycle' | 'month'

function ChangeChip({ change }: { change: number }) {
  if (change === 0) return <span className="text-xs text-muted-foreground">No change</span>
  return (
    <span className={cn('text-xs font-medium', change < 0 ? 'text-primary' : 'text-amber-700 dark:text-amber-400')}>
      {change > 0 ? '+' : ''}
      {change}% vs last month
    </span>
  )
}

function LensToggle({ lens, onChange }: { lens: Lens; onChange: (l: Lens) => void }) {
  const options: { id: Lens; label: string }[] = [
    { id: 'cycle', label: 'This payday' },
    { id: 'month', label: 'Last 30 days' },
  ]
  return (
    <div role="group" aria-label="Spending period" className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={lens === o.id}
          onClick={() => onChange(o.id)}
          className={cn('h-11 rounded-xl text-sm font-semibold transition-colors', lens === o.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function MonthLens() {
  const { month, showWhole } = useInsights()
  const total = month.flexibleTotal + month.committedTotal
  const committedPct = total > 0 ? Math.round((month.committedTotal / total) * 100) : 0
  const max = Math.max(...month.flexible.map((r) => r.amount), 1)

  if (total === 0) {
    return (
      <p className="rounded-3xl bg-card p-5 text-sm text-muted-foreground">
        No spending to show yet. Once you start using your account, you will see where it goes here.
      </p>
    )
  }

  return (
    <>
      <section aria-labelledby="split-h" className="rounded-3xl bg-card p-4">
        <h3 id="split-h" className="font-semibold">
          Committed vs flexible
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{committedPct}% of what goes out is already spoken for.</p>
        <div className="mt-3 flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${committedPct} percent committed, ${100 - committedPct} percent flexible`}>
          <span className="h-full bg-forest" style={{ width: `${committedPct}%` }} />
          <span className="h-full bg-lime" style={{ width: `${100 - committedPct}%` }} />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="flex items-center gap-2 text-muted-foreground">
              <span className="size-2.5 rounded-full bg-forest" aria-hidden /> Committed
            </dt>
            <dd className="tabular font-mono text-lg font-semibold">{showWhole(month.committedTotal)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-muted-foreground">
              <span className="size-2.5 rounded-full bg-lime" aria-hidden /> Flexible
            </dt>
            <dd className="tabular font-mono text-lg font-semibold">{showWhole(month.flexibleTotal)}</dd>
          </div>
        </dl>
        <ul className="mt-3 divide-y border-t">
          {month.committedRows.map((r) => (
            <li key={r.label} className="flex min-h-11 items-center justify-between text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="tabular font-mono">{showWhole(r.amount)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="flex-h" className="flex flex-col gap-3">
        <SectionHeader id="flex-h" title="Flexible spending" />
        <ul className="divide-y overflow-hidden rounded-3xl bg-card">
          {month.flexible.map((r) => (
            <li key={r.category} className="px-4 py-3">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{r.category}</span>
                <span className="tabular font-mono font-semibold">{showWhole(r.amount)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(r.amount / max) * 100}%` }} />
              </div>
              <p className="mt-1.5">
                <ChangeChip change={r.change} />
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

function CycleLens() {
  const { cycle, budgetRows, show, showWhole } = useInsights()
  const rows = flexibleCategories.filter((c) => cycle.spentByCategory[c] > 0 || budgetRows.some((b) => b.category === c && b.limit > 0))

  return (
    <section aria-labelledby="cycle-spend-h" className="rounded-3xl bg-card p-4">
      <h3 id="cycle-spend-h" className="text-sm text-muted-foreground">
        Flexible spending since {cycle.lastPayday}
      </h3>
      <p className="tabular font-mono text-3xl font-semibold">{show(cycle.spent)}</p>
      {cycle.hasPaycheck && (
        <p className="mt-0.5 text-sm text-muted-foreground">
          of {showWhole(cycle.room)} you have after vaults and bills. Rent and subscriptions are not counted here.
        </p>
      )}
      {rows.length === 0 ? (
        <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">Nothing spent yet this payday.</p>
      ) : (
        <ul className="mt-3 divide-y border-t">
          {rows.map((c) => {
            const limit = budgetRows.find((b) => b.category === c)?.limit ?? 0
            const spent = cycle.spentByCategory[c]
            return (
              <li key={c} className="py-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">{c}</span>
                  <span className="tabular font-mono text-sm">
                    <span className="font-semibold">{show(spent)}</span>
                    {limit > 0 && <span className="text-muted-foreground"> of {showWhole(limit)}</span>}
                  </span>
                </div>
                {limit > 0 && (
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className={cn('h-full rounded-full', spent > limit ? 'bg-amber-500' : 'bg-primary')} style={{ width: `${Math.min(100, (spent / limit) * 100)}%` }} />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function Categorize() {
  const { transactions, categoryOverrides } = useBank()
  const { show } = useInsights()
  const [editing, setEditing] = useState<Transaction | null>(null)
  const recent = transactions.filter((t) => isSpend(t) && daysAgo(t.when) <= 30).slice(0, 8)

  if (recent.length === 0) return null

  return (
    <section aria-labelledby="cat-h" className="flex flex-col gap-3">
      <SectionHeader id="cat-h" title="Check the categories" />
      <p className="-mt-1 px-1 text-sm text-muted-foreground">Tap a purchase to change its category.</p>
      <ul className="divide-y overflow-hidden rounded-3xl bg-card">
        {recent.map((t) => {
          const category = categoryOf(t, categoryOverrides)
          const fixed = categoryOverrides[t.merchant] !== undefined
          return (
            <li key={t.id}>
              <button type="button" onClick={() => setEditing(t)} aria-label={`${t.merchant}, ${category}. Change category`} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{t.merchant}</span>
                  <span className="block text-xs text-muted-foreground">{t.when}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="tabular font-mono text-sm font-semibold">{show(Math.abs(t.amount))}</span>
                  <span className={cn('flex h-6 items-center gap-1 rounded-full px-2 text-xs font-medium', fixed ? 'bg-accent text-accent-foreground' : 'bg-muted')}>
                    {category}
                    <Pencil className="size-3" aria-hidden />
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>
      {editing && <CategorySheet transaction={editing} onClose={() => setEditing(null)} />}
    </section>
  )
}

export function SpendingTab() {
  const { cycle } = useInsights()
  const [lens, setLens] = useState<Lens>(cycle.hasPaycheck ? 'cycle' : 'month')

  return (
    <>
      <LensToggle lens={lens} onChange={setLens} />
      {lens === 'cycle' ? <CycleLens /> : <MonthLens />}
      <Categorize />
    </>
  )
}
