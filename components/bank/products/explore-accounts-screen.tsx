'use client'

import { useState } from 'react'
import { Check, ChevronRight, Star } from 'lucide-react'
import { OverlayFrame } from '@/components/bank/overlay'
import { useBank } from '@/components/bank/bank-provider'
import { PerkIcon } from '@/components/bank/products/perk-icon'
import { compareRows, segments, type SegmentId } from '@/lib/segments'
import { products } from '@/lib/offers'
import { cn } from '@/lib/utils'

const heroStats: Record<SegmentId, { value: string; label: string }[]> = {
  student: [
    { value: '$0', label: 'monthly fees' },
    { value: '$100', label: 'SafetyNet buffer' },
    { value: '$100', label: 'grad bonus' },
  ],
  complete: [
    { value: '5.10%', label: 'savings interest' },
    { value: '1.5x', label: 'card points' },
    { value: '$750', label: 'welcome bonus' },
  ],
  'growth-savings': [
    { value: '4.60%', label: 'interest' },
    { value: '$0', label: 'monthly fee' },
    { value: '20', label: 'Vaults' },
  ],
}

const tabLabels: Record<SegmentId, string> = { student: 'Student', complete: 'Complete', 'growth-savings': 'Savings' }

export function ExploreAccountsScreen() {
  const { owned: ownedIds, drafts, accounts, dispatch } = useBank()
  const [active, setActive] = useState<SegmentId>('student')
  const segment = segments[active]
  const product = products[active]
  const savingsAccount = accounts.find((a) => a.id === 'sav' || a.id === 'sav-new')
  const owned = active === 'growth-savings' ? !!savingsAccount : ownedIds.includes(active)
  const draft = drafts[active]

  const primaryAction = () => {
    if (owned) {
      dispatch({ type: 'overlay', overlay: null })
      dispatch({ type: 'openAccount', id: active === 'growth-savings' ? (savingsAccount?.id ?? null) : active })
    } else {
      dispatch({ type: 'startOnboarding', productId: active })
    }
  }

  return (
    <OverlayFrame title="Find your account" onBack={() => dispatch({ type: 'overlay', overlay: null })}>
      <div className="flex flex-col gap-5 px-5 pt-2">
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Different chapter, different needs. Pick the one that fits where you are right now. You can switch anytime.
        </p>

        <div role="tablist" aria-label="Account type" className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
          {(Object.keys(tabLabels) as SegmentId[]).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active === id}
              onClick={() => setActive(id)}
              className={cn(
                'flex h-11 items-center justify-center gap-1 rounded-xl px-1 text-sm font-semibold transition-colors',
                active === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              {tabLabels[id]}
              {(id === 'growth-savings' ? !!savingsAccount : ownedIds.includes(id)) && <Check className="size-3.5 text-primary" aria-label="You have this" />}
            </button>
          ))}
        </div>

        <section
          aria-labelledby="segment-hero"
          className={cn(
            'flex flex-col gap-4 rounded-3xl p-5',
            active === 'complete' ? 'bg-forest text-forest-foreground' : 'bg-lime text-lime-foreground',
          )}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{segment.who}</p>
            <h2 id="segment-hero" className="mt-1 text-balance text-2xl font-semibold leading-tight">
              {product.name}
            </h2>
            <p className="mt-2 text-pretty text-sm leading-relaxed opacity-80">{segment.pitch}</p>
          </div>
          <dl className="grid grid-cols-3 gap-2">
            {heroStats[active].map((s) => (
              <div
                key={s.label}
                className={cn('rounded-2xl p-3', active === 'complete' ? 'bg-white/10' : 'bg-white/50')}
              >
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-lg font-semibold tabular-nums leading-none">{s.value}</dd>
                <dd className="mt-1 text-xs leading-snug opacity-75">{s.label}</dd>
              </div>
            ))}
          </dl>
          <button
            type="button"
            onClick={primaryAction}
            className={cn(
              'flex h-12 items-center justify-center gap-1 rounded-xl font-semibold',
              active === 'complete' ? 'bg-shield text-shield-foreground' : 'bg-forest text-forest-foreground',
            )}
          >
            {owned ? 'Go to my account' : draft ? 'Pick up where you left off' : 'Open in about 60 seconds'}
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </section>

        <section aria-labelledby="perks-heading" className="flex flex-col gap-3">
          <h2 id="perks-heading" className="text-lg font-semibold">
            {active === 'student' ? 'Made for campus life' : active === 'growth-savings' ? 'Made for saving' : 'Made for building wealth'}
          </h2>
          <ul className="flex flex-col gap-2">
            {segment.perks.map((perk) => (
              <li key={perk.title} className="flex gap-3 rounded-2xl border bg-card p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lime">
                  <PerkIcon icon={perk.icon} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">{perk.title}</h3>
                    {perk.firstAt && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-lime px-2 py-0.5 text-[11px] font-semibold text-lime-foreground">
                        <Star className="size-3" aria-hidden /> Only at TD
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">{perk.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="compare-heading" className="flex flex-col gap-3">
          <h2 id="compare-heading" className="text-lg font-semibold">
            How they stack up
          </h2>
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full min-w-[30rem] text-left text-sm">
              <caption className="sr-only">Compare Everyday, Student, Complete checking and Growth Savings</caption>
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th scope="col" className="p-3 font-medium">
                    <span className="sr-only">Feature</span>
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Everyday
                  </th>
                  <th scope="col" className={cn('p-3 font-semibold', active === 'student' && 'bg-accent text-foreground')}>
                    Student
                  </th>
                  <th scope="col" className={cn('p-3 font-semibold', active === 'complete' && 'bg-accent text-foreground')}>
                    Complete checking
                  </th>
                  <th scope="col" className={cn('p-3 font-semibold', active === 'growth-savings' && 'bg-accent text-foreground')}>
                    Growth Savings
                  </th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row.label} className="border-b last:border-0">
                    <th scope="row" className="p-3 text-xs font-medium text-muted-foreground">
                      {row.label}
                    </th>
                    <td className="p-3 text-xs">{row.everyday}</td>
                    <td className={cn('p-3 text-xs font-medium', active === 'student' && 'bg-accent')}>{row.student}</td>
                    <td className={cn('p-3 text-xs font-medium', active === 'complete' && 'bg-accent')}>{row.complete}</td>
                    <td className={cn('p-3 text-xs font-medium', active === 'growth-savings' && 'bg-accent')}>{row.savings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Rates are variable and can change. Bonuses need qualifying activity within 60 days. Complete fee waived with
            $5,000 in monthly deposits or $25,000 across TD accounts.
          </p>
        </section>
      </div>
    </OverlayFrame>
  )
}
