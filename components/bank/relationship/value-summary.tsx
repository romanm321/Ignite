'use client'

import { BadgeDollarSign, CreditCard, Headset, Lock, Percent, Receipt, Wallet, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPct, formatWhole, loanSavings, sampleLoan } from '@/lib/relationship'
import { SectionHeader } from '../primitives'
import { useBank } from '../bank-provider'
import { useRelationship } from './use-relationship'

type Row = { id: string; icon: LucideIcon; label: string; detail: string; value: number | null; locked: boolean }

export function ValueSummary() {
  const rel = useRelationship()
  const { streetSafe } = useBank()
  const { tier, next, current, ctx } = rel
  const locked = `Unlocks at ${(next ?? tier).name}`

  const rows: Row[] = [
    {
      id: 'apy',
      icon: Percent,
      label: 'Extra savings interest',
      detail: tier.apyBoost ? `+${formatPct(tier.apyBoost)} on ${formatWhole(ctx.savings)} in savings` : locked,
      value: current.apy,
      locked: !tier.apyBoost,
    },
    {
      id: 'card',
      icon: CreditCard,
      label: 'Card earn boost',
      detail: tier.cardBoost ? `+${formatPct(tier.cardBoost)} back on everything you charge` : locked,
      value: current.card,
      locked: !tier.cardBoost,
    },
    {
      id: 'debit',
      icon: Wallet,
      label: 'Debit cash back',
      detail: `${formatPct(tier.debitRate)} back on everyday debit spending`,
      value: current.debit,
      locked: false,
    },
    {
      id: 'lending',
      icon: BadgeDollarSign,
      label: 'Lending discount',
      detail: tier.loanDiscount
        ? `${formatPct(tier.loanDiscount)} off APR · saves ${formatWhole(loanSavings(tier.loanDiscount))} on a ${formatWhole(sampleLoan.principal)} loan`
        : locked,
      value: null,
      locked: !tier.loanDiscount,
    },
    {
      id: 'fees',
      icon: Receipt,
      label: 'Fee waivers',
      detail: tier.fees,
      value: current.fees,
      locked: !tier.monthlyFeeWaived,
    },
    {
      id: 'service',
      icon: Headset,
      label: 'Service',
      detail: `${tier.service} · ${tier.banker}`,
      value: null,
      locked: false,
    },
  ]

  return (
    <section aria-labelledby="value-h" className="flex flex-col gap-3">
      <SectionHeader id="value-h" title="What TD gives me" />
      <div className="overflow-hidden rounded-3xl bg-card">
        <div className="bg-accent px-4 py-4">
          <p className="text-xs font-medium text-accent-foreground/80">{tier.name} benefits, worth about</p>
          <p className="tabular font-mono text-3xl font-semibold text-accent-foreground">
            {streetSafe ? '••••' : formatWhole(current.total)}
            <span className="ml-1 font-sans text-base font-medium">a year</span>
          </p>
          <p className="mt-1 text-xs text-accent-foreground/80">Estimated from your balances and recent spending.</p>
        </div>

        <ul className="divide-y">
          {rows.map((r) => (
            <li key={r.id} className="flex min-h-16 items-center gap-3 px-4 py-3">
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl',
                  r.locked ? 'bg-muted text-muted-foreground' : 'bg-muted text-lime',
                )}
              >
                <r.icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{r.label}</span>
                <span className="block text-xs text-muted-foreground">{r.detail}</span>
              </span>
              {r.locked ? (
                <Lock className="size-4 shrink-0 text-muted-foreground" aria-label="Locked" />
              ) : r.value !== null ? (
                <span className="tabular shrink-0 font-mono font-semibold">{streetSafe ? '••••' : `${formatWhole(r.value)}/yr`}</span>
              ) : null}
            </li>
          ))}
        </ul>

        {next && rel.upcoming && (
          <p className="border-t bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{next.name}</span> would add about {formatWhole(rel.uplift)} a year, plus{' '}
            {next.unlock}.
          </p>
        )}
      </div>
    </section>
  )
}
