'use client'

import { useMemo, useState } from 'react'
import { BadgeDollarSign, ChevronDown, CreditCard, PiggyBank, Receipt, Tag, Wallet, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { benefitsFor, formatWhole, loanSavings, tiers, type Tier } from '@/lib/relationship'
import { useBank } from '../bank-provider'
import { BigAmount } from '../big-amount'
import { useSavingsHome } from '../vaults/use-savings-home'
import { TierLadder } from './tier-ladder'
import { TierProgress, UnlockPanel } from './status-card'
import { useEarnings } from './use-earnings'
import { useRelationship } from './use-relationship'

type Driver = { id: string; label: string; icon: LucideIcon; amount: (tier: Tier) => number }

/** Shown in the savings account, so a saver sees what the base rate is already worth. */
const SAVINGS_RATE = 4.6
const CD_RATE = 4.25

const outlineButton =
  'flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border-2 border-forest text-sm font-semibold text-forest outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary active:bg-muted'

export function BenefitsValue({ enrolled }: { enrolled: string[] }) {
  const rel = useRelationship()
  const { accounts, streetSafe } = useBank()
  const savingsHome = useSavingsHome()
  const earnings = useEarnings(enrolled)
  const [open, setOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const selectedIndex = picked ?? rel.tierIndex
  const selected = tiers[selectedIndex]
  const show = (n: number) => (streetSafe ? '••••' : formatWhole(n))

  const drivers = useMemo<Driver[]>(() => {
    const cd = accounts.filter((a) => a.kind === 'savings' && /CD/i.test(a.name)).reduce((s, a) => s + a.balance, 0)
    const savings = savingsHome.total || rel.ctx.savings
    const baseInterest = (savings * SAVINGS_RATE) / 100 + (cd * CD_RATE) / 100
    const baseCard = (rel.ctx.cardSpend * 12 * 2) / 100
    const deals = earnings.offers * 12
    return [
      { id: 'interest', label: 'Savings interest', icon: PiggyBank, amount: (t) => baseInterest + benefitsFor(t, rel.ctx).apy },
      { id: 'card', label: 'Card cash back', icon: CreditCard, amount: (t) => baseCard + benefitsFor(t, rel.ctx).card },
      { id: 'debit', label: 'Debit cash back', icon: Wallet, amount: (t) => benefitsFor(t, rel.ctx).debit },
      { id: 'deals', label: 'Deals and offers', icon: Tag, amount: () => deals },
      { id: 'fees', label: 'Fees saved', icon: Receipt, amount: (t) => benefitsFor(t, rel.ctx).fees },
      { id: 'lending', label: 'Lower loan rates', icon: BadgeDollarSign, amount: (t) => loanSavings(t.loanDiscount) / 5 },
    ]
  }, [accounts, savingsHome.total, rel.ctx, earnings.offers])

  const currentTotal = drivers.reduce((s, d) => s + d.amount(rel.tier), 0)
  const selectedTotal = drivers.reduce((s, d) => s + d.amount(selected), 0)
  const difference = selectedTotal - currentTotal
  const comparing = selectedIndex !== rel.tierIndex

  return (
    <section aria-labelledby="value-summary-h" className="overflow-hidden rounded-3xl bg-card">
      <div className="bg-sky-200 px-5 pb-5 pt-5 text-sky-950">
        <p id="value-summary-h" className="font-medium">
          Value TD gives you
        </p>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <BigAmount value={show(currentTotal)} className="text-5xl" />
          <span className="text-lg font-light">a year</span>
        </p>
      </div>

      <div className="p-5">
      <p className="text-sm leading-relaxed text-muted-foreground">Interest, cash back, deals and fees we skip, across all you have with TD.</p>

      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="value-breakdown" className={cn(outlineButton, 'mt-4')}>
        {open ? 'See less' : 'See details'}
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div id="value-breakdown" className="mt-4 flex flex-col gap-4">
          <div>
            <div role="radiogroup" aria-label="Relationship tier" className="grid grid-cols-4 gap-0.5 rounded-xl bg-muted p-0.5">
              {tiers.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={i === selectedIndex}
                  onClick={() => setPicked(i)}
                  className={cn(
                    'flex h-9 items-center justify-center gap-1 rounded-[10px] text-sm font-semibold transition-colors',
                    i === selectedIndex ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                  )}
                >
                  {t.name}
                  {i === rel.tierIndex && (
                    <>
                      <span aria-hidden className="size-1.5 rounded-full bg-primary" />
                      <span className="sr-only">Your tier</span>
                    </>
                  )}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm" aria-live="polite">
              {comparing ? (
                difference >= 0 ? (
                  <>
                    At <span className="font-semibold">{selected.name}</span> you&apos;d get{' '}
                    <span className="tabular font-mono font-semibold">{show(selectedTotal)}</span> a year,{' '}
                    <span className="font-semibold text-primary">{show(difference)} more</span> than today.
                  </>
                ) : (
                  <>
                    At <span className="font-semibold">{selected.name}</span> it would be{' '}
                    <span className="tabular font-mono font-semibold">{show(selectedTotal)}</span> a year, {show(Math.abs(difference))} less than today.
                  </>
                )
              ) : (
                <span className="text-muted-foreground">Your {rel.tier.name} tier today. Pick another to see what it adds.</span>
              )}
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {drivers.map((d) => {
              const now = d.amount(rel.tier)
              const then = d.amount(selected)
              const share = selectedTotal ? (then / selectedTotal) * 100 : 0
              const extra = Math.max(then - now, 0)
              // Illustrative: a sliver of extra value always shows, so a small gain is still visible next to a large base.
              const extraShare = extra > 0 ? Math.max((extra / then) * 100, 8) : 0
              const solid = then > 0 ? 100 - extraShare : 0
              return (
                <li key={d.id}>
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-lime">
                      <d.icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{d.label}</span>
                    {comparing && extra > 0 && <span className="shrink-0 text-xs font-semibold text-primary">+{show(extra)}</span>}
                    <span className="tabular shrink-0 font-mono text-sm font-semibold">{show(then)}</span>
                  </div>
                  <div
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
                    role="img"
                    aria-label={`${d.label}: ${Math.round(share)}% of your total value${extra > 0 ? `, ${formatWhole(extra)} more at ${selected.name}` : ''}`}
                  >
                    <div className="flex h-full overflow-hidden rounded-full transition-[width] duration-500" style={{ width: `${Math.max(share, then > 0 ? 3 : 0)}%` }}>
                      <span className="h-full bg-primary" style={{ width: `${solid}%` }} />
                      <span
                        className="h-full flex-1 bg-lime"
                        style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgb(255 255 255 / 0.55) 0 3px, transparent 3px 6px)' }}
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Estimated from your balances and recent spending. Striped bars show what you&apos;d add by reaching that tier. Rates can change.
          </p>
        </div>
      )}

      <div className="mt-5 border-t pt-5">
        <TierProgress />
        <button
          type="button"
          onClick={() => setCompareOpen((o) => !o)}
          aria-expanded={compareOpen}
          aria-controls="compare-tiers"
          className={cn(outlineButton, 'mt-4')}
        >
          {compareOpen ? 'Hide tiers' : 'Compare tiers'}
          <ChevronDown className={cn('size-4 transition-transform', compareOpen && 'rotate-180')} aria-hidden />
        </button>
        {compareOpen && (
          <div id="compare-tiers" className="mt-4 flex flex-col gap-5">
            <UnlockPanel />
            <TierLadder />
          </div>
        )}
      </div>
      </div>
    </section>
  )
}
