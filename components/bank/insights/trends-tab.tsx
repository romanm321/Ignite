'use client'

import { useState } from 'react'
import { Check, Coins, Gauge, PiggyBank, Receipt, Repeat, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrendAction, TrendItem } from '@/lib/insights'
import type { FlexibleCategory } from '@/lib/insights'
import { useBank } from '../bank-provider'
import { BudgetSheet } from './sheets'
import type { InsightsTab } from './types'
import { useInsights } from './use-insights'

const icons: Record<TrendItem['icon'], LucideIcon> = {
  down: TrendingDown,
  up: TrendingUp,
  repeat: Repeat,
  vault: PiggyBank,
  coins: Coins,
  bills: Receipt,
  pace: Gauge,
}

const tones: Record<TrendItem['tone'], { chip: string; bar: string }> = {
  good: { chip: 'bg-accent text-accent-foreground', bar: 'bg-primary' },
  watch: { chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-400', bar: 'bg-amber-500' },
  info: { chip: 'bg-muted text-foreground', bar: 'bg-foreground/60' },
}

function Compare({ previous, now, tone, format }: { previous: number; now: number; tone: TrendItem['tone']; format: (n: number) => string }) {
  const max = Math.max(previous, now, 1)
  const rows = [
    { label: 'Last month', value: previous, bar: 'bg-muted-foreground/30' },
    { label: 'This month', value: now, bar: tones[tone].bar },
  ]
  return (
    <dl className="mt-3 flex flex-col gap-1.5 rounded-2xl bg-muted/60 p-3">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3 text-xs">
          <dt className="w-[74px] shrink-0 text-muted-foreground">{r.label}</dt>
          <dd className="flex min-w-0 flex-1 items-center gap-2">
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-background">
              <span className={cn('block h-full rounded-full', r.bar)} style={{ width: `${(r.value / max) * 100}%` }} />
            </span>
            <span className="tabular w-14 shrink-0 text-right font-mono font-medium">{format(r.value)}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function TrendList({ items, onTab }: { items: TrendItem[]; onTab: (tab: InsightsTab) => void }) {
  const { vaults, payees, dispatch, notify } = useBank()
  const { showWhole } = useInsights()
  const [done, setDone] = useState<string[]>([])
  const [budgetFor, setBudgetFor] = useState<FlexibleCategory | null>(null)

  const run = (item: TrendItem, action: TrendAction) => {
    const key = `${item.id}:${action.kind}`
    const finish = () => setDone((d) => [...d, key])
    switch (action.kind) {
      case 'vaultMove':
        dispatch({ type: 'vaultTransfer', vaultId: action.vaultId, amount: action.amount })
        notify(`${showWhole(action.amount)} moved to ${vaults.find((v) => v.id === action.vaultId)?.name ?? 'your vault'}`)
        return finish()
      case 'vaultBill':
        dispatch({ type: 'vaultBillPayee', vaultId: action.vaultId, payeeId: action.payeeId, on: true })
        notify(`${payees.find((p) => p.id === action.payeeId)?.name ?? 'Bill'} will be paid from ${vaults.find((v) => v.id === action.vaultId)?.name ?? 'your vault'}`)
        return finish()
      case 'roundUps':
        dispatch({ type: 'roundUpsVault', vaultId: action.vaultId })
        notify('Round-ups are on')
        return finish()
      case 'budget':
        return setBudgetFor(action.category)
      case 'subs':
        return dispatch({ type: 'overlay', overlay: 'subscriptions' })
      case 'openVault':
        return dispatch({ type: 'openVault', id: action.vaultId })
      case 'createVault':
        return dispatch({ type: 'startVaultFlow', kind: 'savings' })
      case 'tab':
        return onTab(action.tab)
    }
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const Icon = icons[item.icon]
          return (
            <li key={item.id}>
              <article className="rounded-3xl bg-card p-5">
                <div className="flex items-start gap-3">
                  <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', tones[item.tone].chip)}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-lg font-bold leading-snug">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                  </div>
                </div>
                {item.compare && <Compare {...item.compare} tone={item.tone} format={showWhole} />}
                {item.actions.length > 0 && (
                  <div className={cn('mt-4 grid gap-2', item.actions.length === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
                    {item.actions.map((a, i) => {
                      const isDone = done.includes(`${item.id}:${a.kind}`)
                      return (
                        <button
                          key={a.label}
                          type="button"
                          disabled={isDone}
                          onClick={() => run(item, a)}
                          className={cn(
                            'flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold',
                            isDone
                              ? 'bg-accent text-accent-foreground'
                              : i === 0
                                ? 'border-2 border-forest text-forest active:bg-muted'
                                : 'bg-muted active:bg-muted/70',
                          )}
                        >
                          {isDone ? (
                            <>
                              <Check className="size-4" aria-hidden /> Done
                            </>
                          ) : (
                            a.label
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </article>
            </li>
          )
        })}
      </ul>
      {budgetFor && <BudgetSheet category={budgetFor} onClose={() => setBudgetFor(null)} />}
    </>
  )
}

export function TrendsTab({ onTab }: { onTab: (tab: InsightsTab) => void }) {
  const { trends, isNew } = useInsights()
  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-sm text-muted-foreground">
        {isNew ? 'Tips show up as you spend and save.' : 'What changed, and what to do.'}
      </p>
      <TrendList items={trends} onTab={onTab} />
    </div>
  )
}
