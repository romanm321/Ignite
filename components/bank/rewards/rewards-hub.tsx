'use client'

import { useMemo, useState } from 'react'
import { Gift, Plane, ShoppingBag, ShoppingCart, Utensils, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/bank-data'
import { POINTS_PER_DOLLAR, STATEMENT_CLOSES, earnRules, formatRate, rewardFor } from '@/lib/rewards'
import { accountOf, useBank } from '../bank-provider'
import { OverlayFrame, PrimaryButton } from '../overlay'
import { Pill, SectionHeader } from '../primitives'
import { TransactionRow } from '../transactions/transaction-row'
import { RedeemSheet } from './redeem-sheet'

const ruleIcon: Record<string, LucideIcon> = {
  Dining: Utensils,
  Groceries: ShoppingCart,
  Travel: Plane,
  other: ShoppingBag,
}

export function RewardsHub() {
  const { rewardsId, rewardsBalance, accounts, transactions, streetSafe, dispatch } = useBank()
  const [redeeming, setRedeeming] = useState(false)
  const cards = accounts.filter((a) => a.kind === 'credit')
  const card = cards.find((a) => a.id === rewardsId)

  const earned = useMemo(
    () =>
      transactions
        .filter((t) => accountOf(t) === rewardsId)
        .map((t) => ({ txn: t, reward: rewardFor(t, rewardsId ?? '') }))
        .filter((r) => r.reward !== null),
    [transactions, rewardsId],
  )

  if (!card) return null

  const show = (n: number) => (streetSafe ? '••••' : formatMoney(n))
  const pending = earned.reduce((s, r) => s + (r.reward?.amount ?? 0), 0)
  const spend = earned.reduce((s, r) => s + Math.abs(r.txn.amount), 0)
  const avgRate = spend ? (pending / spend) * 100 : 0
  const points = Math.round(rewardsBalance * POINTS_PER_DOLLAR)

  return (
    <>
      <OverlayFrame title="Rewards Hub" onBack={() => dispatch({ type: 'openRewards', id: null })}>
        <div className="flex flex-col gap-5 px-4">
          {cards.length > 1 && (
            <div role="group" aria-label="Choose card" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              {cards.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={c.id === card.id}
                  onClick={() => dispatch({ type: 'openRewards', id: c.id })}
                  className={cn(
                    'h-11 shrink-0 rounded-xl px-4 text-sm font-medium',
                    c.id === card.id ? 'bg-forest text-forest-foreground' : 'bg-card',
                  )}
                >
                  {c.name} ··{c.mask}
                </button>
              ))}
            </div>
          )}

          <section aria-labelledby="rewards-balance-h" className="rounded-3xl bg-forest p-5 text-forest-foreground">
            <div className="flex items-center justify-between">
              <p id="rewards-balance-h" className="text-sm opacity-80">
                Cash back available
              </p>
              <Pill className="bg-lime text-lime-foreground">
                <Gift className="size-3" aria-hidden /> {card.name.replace(/^TD /, '')}
              </Pill>
            </div>
            <p className="tabular mt-2 font-mono text-4xl font-semibold tracking-tight">{show(rewardsBalance)}</p>
            <p className="mt-1 text-sm opacity-80">
              {streetSafe ? '••••' : points.toLocaleString()} TD Points · {POINTS_PER_DOLLAR} points = $1
            </p>
            <PrimaryButton
              onClick={() => setRedeeming(true)}
              disabled={rewardsBalance < 1}
              className="mt-5 bg-lime text-lime-foreground"
            >
              Redeem cash back
            </PrimaryButton>
          </section>

          <dl className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-card p-4">
              <dt className="text-xs text-muted-foreground">Pending this statement</dt>
              <dd className="tabular mt-1 font-mono text-xl font-semibold">{show(pending)}</dd>
              <dd className="text-xs text-muted-foreground">Posts {STATEMENT_CLOSES}</dd>
            </div>
            <div className="rounded-2xl bg-card p-4">
              <dt className="text-xs text-muted-foreground">Your average rate</dt>
              <dd className="tabular mt-1 font-mono text-xl font-semibold">{avgRate.toFixed(1)}%</dd>
              <dd className="text-xs text-muted-foreground">On {show(spend)} of purchases</dd>
            </div>
          </dl>

          <section aria-labelledby="earn-h" className="flex flex-col gap-3">
            <SectionHeader id="earn-h" title="How you earn" />
            <ul className="divide-y overflow-hidden rounded-3xl bg-card">
              {earnRules(card.id).map((r) => {
                const Icon = ruleIcon[r.category] ?? ShoppingBag
                return (
                  <li key={r.category} className="flex min-h-16 items-center gap-3 px-4 py-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Icon className="size-[18px]" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{r.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {r.category === 'other' ? 'Bills, shopping, transport and more' : 'Every purchase in this category'}
                      </span>
                    </span>
                    <span className="tabular font-mono text-lg font-semibold">{formatRate(r.rate)}</span>
                  </li>
                )
              })}
            </ul>
          </section>

          <section aria-labelledby="earned-h" className="flex flex-col gap-3">
            <SectionHeader
              id="earned-h"
              title="Earned on purchases"
              action={<span className="text-xs text-muted-foreground">{earned.length} this statement</span>}
            />
            {earned.length > 0 ? (
              <ul className="divide-y overflow-hidden rounded-3xl bg-card">
                {earned.map(({ txn, reward }) => (
                  <li key={txn.id}>
                    <TransactionRow txn={txn} masked={streetSafe} reward={reward} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-3xl bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                No purchases yet this statement. Your next purchase starts earning right away.
              </p>
            )}
          </section>

          <p className="text-pretty text-xs text-muted-foreground">
            Cash back posts to your balance when your statement closes. Payments, refunds, transfers, cash advances and
            fees don&apos;t earn rewards. Redeem from $1 as a statement credit or a deposit to checking.
          </p>
        </div>
      </OverlayFrame>
      {redeeming && <RedeemSheet card={card} onClose={() => setRedeeming(false)} />}
    </>
  )
}
