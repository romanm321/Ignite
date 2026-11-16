'use client'

import { useState } from 'react'
import { BadgeDollarSign, ChevronRight, CreditCard, Landmark, TrendingUp, type LucideIcon } from 'lucide-react'
import { customer } from '@/lib/bank-data'
import { formatPct, formatWhole, loanPayment } from '@/lib/relationship'
import { SectionHeader } from '../primitives'
import { BottomSheet, PrimaryButton } from '../overlay'
import { useBank } from '../bank-provider'
import { useRelationship } from './use-relationship'

type Pick = { id: string; icon: LucideIcon; title: string; badge: string; reason: string; perk: string; cta: string; run: () => void }

const BASE_APR = 9.49

export function NextBestProducts() {
  const { customerType, invest, owned, accounts, dispatch } = useBank()
  const rel = useRelationship()
  const [loanOpen, setLoanOpen] = useState(false)

  const score = customer.creditScore
  const isExisting = customerType === 'existing'
  const prequal = score >= 740 ? 25000 : 15000
  const apr = BASE_APR - rel.tier.loanDiscount
  const hasCd = accounts.some((a) => /CD/i.test(a.name))
  const picks: Pick[] = []

  if (isExisting && score >= 670) {
    picks.push({
      id: 'loan',
      icon: BadgeDollarSign,
      title: `Personal loan up to ${formatWhole(prequal)}`,
      badge: 'Pre-qualified',
      reason: `Based on your ${score} score. Checking won't affect it.`,
      perk: `${formatPct(apr)} APR${rel.tier.loanDiscount ? `, ${formatPct(rel.tier.loanDiscount)} lower with your ${rel.tier.name} discount` : ''}`,
      cta: 'See my offer',
      run: () => setLoanOpen(true),
    })
  }

  if (!invest.opened && !owned.includes('auto-invest')) {
    picks.push({
      id: 'invest',
      icon: TrendingUp,
      title: 'TD Auto Invest from $5',
      badge: 'Ready for you',
      reason: rel.ctx.savings > 0 ? `You keep ${formatWhole(rel.ctx.savings)} in savings. Put a little of it to work.` : 'A managed portfolio built around your goals.',
      perk: rel.next ? `Investing counts toward ${rel.next.name}` : 'We keep it balanced for you',
      cta: 'Start investing',
      run: () => dispatch({ type: 'startOnboarding', productId: 'auto-invest' }),
    })
  }

  if (!hasCd && !owned.includes('step-cd')) {
    picks.push({
      id: 'cd',
      icon: Landmark,
      title: 'TD Step Rate CD',
      badge: 'Ready for you',
      reason: 'Lock in a rate while you build your balance.',
      perk: 'Up to 4.25% interest. Counts toward your status.',
      cta: 'Open a CD',
      run: () => dispatch({ type: 'startOnboarding', productId: 'step-cd' }),
    })
  }

  if (!isExisting && !owned.includes('double-up')) {
    picks.push({
      id: 'card',
      icon: CreditCard,
      title: 'TD Double Up Card',
      badge: 'Pre-approved',
      reason: "You're pre-approved for up to $8,000 with a soft check.",
      perk: '2% cash back on everything, $0 annual fee',
      cta: 'See my card',
      run: () => dispatch({ type: 'startOnboarding', productId: 'double-up' }),
    })
  }

  if (picks.length === 0) return null

  return (
    <section aria-labelledby="nbp-h" className="flex flex-col gap-3">
      <SectionHeader id="nbp-h" title="Next best for you" />
      <ul className="flex flex-col gap-3">
        {picks.map((p) => (
          <li key={p.id} className="rounded-3xl bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-forest text-lime">
                <p.icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <span className="inline-flex rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">{p.badge}</span>
                <p className="mt-1 font-semibold leading-snug">{p.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{p.reason}</p>
                <p className="mt-1.5 text-sm font-medium text-primary">{p.perk}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={p.run}
              className="mt-3 flex h-12 w-full items-center justify-center gap-1 rounded-xl border text-sm font-semibold"
            >
              {p.cta} <ChevronRight className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      {loanOpen && (
        <BottomSheet
          title="Your personal loan offer"
          description="You’re pre-qualified. Nothing is applied for yet."
          onClose={() => setLoanOpen(false)}
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-forest p-4 text-forest-foreground">
              <p className="text-xs text-forest-foreground/70">You could borrow up to</p>
              <p className="tabular font-mono text-3xl font-semibold">{formatWhole(prequal)}</p>
              <p className="mt-1 text-sm text-lime">
                {formatPct(apr)} APR · {rel.tier.name} relationship pricing
              </p>
            </div>
            <ul className="divide-y rounded-2xl bg-muted/60">
              <li className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">{formatWhole(10000)} over 36 months</span>
                <span className="tabular font-mono font-semibold">{formatWhole(loanPayment(10000, apr, 36))}/mo</span>
              </li>
              <li className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">Origination fee</span>
                <span className="font-semibold">$0</span>
              </li>
              <li className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">Funds arrive</span>
                <span className="font-semibold">Same day in checking</span>
              </li>
            </ul>
            <PrimaryButton
              onClick={() => {
                setLoanOpen(false)
                dispatch({ type: 'askTedi', prompt: 'I want to apply for my pre-qualified personal loan' })
              }}
            >
              Apply with Tedi
            </PrimaryButton>
          </div>
        </BottomSheet>
      )}
    </section>
  )
}
