'use client'

import { Baby, ChevronRight } from 'lucide-react'
import { customer } from '@/lib/bank-data'
import { VaultsSection, VaultsSummary } from '../vaults/vaults-section'
import { InvestEntryCard } from '../invest/invest-entry-card'
import { useBank } from '../bank-provider'
import { Pill, ScreenHeader, SectionHeader } from '../primitives'
import { TediButton } from '../nav'
import { InlineOffer } from '../marketing/placements'
import { ExploreAccountsCard } from '../products/explore-accounts-card'

export function GrowScreen() {
  const { dispatch } = useBank()
  const scorePct = (customer.creditScore - 300) / 550

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-8">
      <ScreenHeader title="Grow" subtitle="Save, invest & build credit" right={<TediButton />} />

      <div className="flex flex-col gap-6 px-4 pt-2">
        <button
          type="button"
          onClick={() => dispatch({ type: 'overlay', overlay: 'family' })}
          className="flex items-center gap-3 rounded-3xl border bg-card p-4 text-left"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-lime text-lime-foreground">
            <Baby className="size-5" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">TD Family accounts</span>
            <span className="block text-sm text-muted-foreground">Teen cards with parental controls & allowance</span>
          </span>
          <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
        </button>

        <VaultsSummary />

        <VaultsSection />

        <ExploreAccountsCard />

        <section aria-labelledby="credit-h" className="flex items-center gap-4 rounded-3xl bg-card p-4">
          <div
            className="relative flex size-20 shrink-0 items-center justify-center rounded-full"
            style={{ background: `conic-gradient(var(--primary) ${scorePct * 360}deg, var(--muted) 0deg)` }}
            role="img"
            aria-label={`Credit score ${customer.creditScore} out of 850`}
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-card font-mono text-xl font-semibold">
              {customer.creditScore}
            </span>
          </div>
          <div className="flex-1">
            <h2 id="credit-h" className="font-semibold">
              Credit score: Very good
            </h2>
            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
              Up 18 points since June. Keep usage under 10% to reach 760.
            </p>
            <Pill className="mt-2 bg-accent text-accent-foreground">Unlocks pre-approved offers</Pill>
          </div>
        </section>

        <section aria-labelledby="invest-h" className="flex flex-col gap-3">
          <SectionHeader id="invest-h" title="Investing" />
          <InvestEntryCard />
          <InlineOffer offerId="inline-invest-grow" productId="auto-invest" cta="Start with $5" className="px-1">
            Prefer hands-off? TD Auto Invest builds and rebalances a portfolio for you.
          </InlineOffer>
        </section>

      </div>
    </div>
  )
}
