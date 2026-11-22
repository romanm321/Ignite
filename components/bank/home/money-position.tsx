'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { useInsights } from '../insights/use-insights'
import { BottomSheet, PrimaryButton } from '../overlay'

const whole = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

function dueText(days: number) {
  return days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`
}

/** Safe to spend for the current paycheck, sitting in the hero. Tapping it shows exactly how it's worked out. */
export function SafeToSpend({ masked, embedded = false }: { masked: boolean; embedded?: boolean }) {
  const { accounts, dispatch } = useBank()
  const { cycle } = useInsights()
  const [open, setOpen] = useState(false)
  if (!cycle.hasPaycheck) return null

  const money = (n: number) => (masked ? '••••' : whole(n))
  const { paycheck, sorted, committed, committedTotal, spent, left, perDay, daysLeft, dayOfCycle, length, room, spentByCategory } = cycle
  const over = left < 0
  const checking = accounts.find((a) => a.id === 'chk')

  const parts = [
    { key: 'saved', label: 'Saved for you', amount: sorted, color: 'bg-lime' },
    { key: 'bills', label: 'Bills coming', amount: committedTotal, color: 'bg-sky-300' },
    { key: 'spent', label: 'Spent so far', amount: spent, color: 'bg-amber-300' },
    { key: 'left', label: 'Left to spend', amount: Math.max(0, left), color: 'bg-white/25' },
  ]
  const total = parts.reduce((sum, p) => sum + p.amount, 0) || 1

  const math = [
    { label: 'Last paycheck', amount: paycheck, sign: '' },
    { label: 'Saved to your Vaults', amount: sorted, sign: '−' },
    { label: `Bills before payday (${committed.length})`, amount: committedTotal, sign: '−' },
    { label: 'Spent since payday', amount: spent, sign: '−' },
  ]

  const expectedSpend = room * Math.min(1, dayOfCycle / length)
  const gap = expectedSpend - spent
  const topCategories = Object.entries(spentByCategory)
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
  const paceDetail =
    gap >= 0
      ? `You’re ${masked ? 'a little' : whole(gap)} under your usual pace. Nice.`
      : `You’re ${masked ? 'a little' : whole(-gap)} over your usual pace${topCategories[0] ? `, mostly ${topCategories[0][0].toLowerCase()}` : ''}.`

  const bar = (className: string) => (
    <div
      role="img"
      aria-label={`Your paycheck so far. ${parts.map((p) => `${p.label} ${masked ? 'hidden' : whole(p.amount)}`).join(', ')}`}
      className={cn('flex gap-0.5 overflow-hidden rounded-full', className)}
    >
      {parts.map((p) => (
        <span key={p.key} className={cn('h-full min-w-0.5 rounded-full', p.color)} style={{ width: `${(p.amount / total) * 100}%` }} />
      ))}
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${over ? 'Over your plan by' : 'Safe to spend'} ${money(Math.abs(left))}. Payday in ${daysLeft} days. See how it’s worked out`}
        className={cn(
          'flex w-full flex-col gap-1.5 px-4 py-2 text-left text-forest-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-white active:opacity-90',
          // Inside an account card it is a lighter panel of the same green, so it reads as part of the card.
          embedded ? 'rounded-2xl bg-white/10 active:bg-white/15' : 'rounded-3xl border border-white bg-forest shadow-card',
        )}
      >
        <span className="flex items-baseline gap-2.5 leading-none">
          <span className="text-sm text-forest-foreground">{over ? 'Over plan by' : 'Safe to spend'}</span>
          <span className={cn('tabular font-mono text-xl font-semibold leading-none', over ? 'text-amber-300' : 'text-lime')}>
            {money(Math.abs(left))}
          </span>
        </span>
        <span className="flex items-center gap-3">
          <span className="min-w-0 flex-1">{bar('h-2 w-full')}</span>
          <ChevronRight className="size-4 shrink-0 text-forest-foreground/70" aria-hidden />
        </span>
        <span className="flex items-baseline gap-2 text-xs leading-none">
          <span className="text-forest-foreground/70">Payday</span>
          <span className="text-sm font-semibold text-forest-foreground">
            in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
          </span>
        </span>
      </button>

      {open && (
        <BottomSheet title="How safe to spend works" description={paceDetail} onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl bg-forest p-4 text-forest-foreground">
              <p className="text-xs font-medium text-forest-foreground/70">{over ? 'Over your plan by' : 'Safe to spend'}</p>
              <p className={cn('tabular font-mono text-3xl font-semibold', over ? 'text-amber-300' : 'text-lime')}>{money(Math.abs(left))}</p>
              <p className="mt-1 text-sm text-forest-foreground/75">
                {over ? 'Ease up a little before payday.' : `About ${money(perDay)} a day for ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}.`}
              </p>
              {bar('mt-3 h-3')}
            </div>

            <div>
              <h3 className="px-1 pb-2 text-sm font-semibold">How we work it out</h3>
              <ul className="divide-y rounded-2xl bg-muted/60">
                {math.map((row) => (
                  <li key={row.label} className="flex min-h-12 items-center justify-between gap-3 px-4 text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="tabular font-mono font-semibold">
                      {row.sign}
                      {money(row.amount)}
                    </span>
                  </li>
                ))}
                <li className="flex min-h-12 items-center justify-between gap-3 px-4 text-sm">
                  <span className="font-semibold">{over ? 'Over your plan' : 'Safe to spend'}</span>
                  <span className={cn('tabular font-mono font-semibold', over ? 'text-destructive' : 'text-primary')}>
                    {over ? '−' : ''}
                    {money(Math.abs(left))}
                  </span>
                </li>
              </ul>
              {checking && (
                <p className="px-1 pt-2 text-xs leading-relaxed text-muted-foreground">
                  Why not your checking balance of {money(checking.balance)}? Most of it is already spoken for, so this only counts
                  this paycheck after savings, bills and what you’ve spent.
                </p>
              )}
            </div>

            {committed.length > 0 && (
              <div>
                <h3 className="px-1 pb-2 text-sm font-semibold">Coming out before payday</h3>
                <ul className="divide-y rounded-2xl bg-muted/60">
                  {committed.slice(0, 4).map((c) => (
                    <li key={c.id} className="flex min-h-12 items-center justify-between gap-3 px-4 py-2 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{c.name}</span>
                        <span className="block text-xs text-muted-foreground">{dueText(c.dueIn)}</span>
                      </span>
                      <span className="tabular font-mono font-semibold">{money(c.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <PrimaryButton
              onClick={() => {
                setOpen(false)
                dispatch({ type: 'openInsights', tab: 'spending' })
              }}
            >
              See all insights
            </PrimaryButton>
          </div>
        </BottomSheet>
      )}
    </>
  )
}
