'use client'

import { useRef } from 'react'
import { Baby } from 'lucide-react'
import { VaultsSection, VaultsSummary } from '../vaults/vaults-section'
import { InvestEntryCard } from '../invest/invest-entry-card'
import { InsightsSection } from '../insights/insights-section'
import { useBank, type GrowSection } from '../bank-provider'
import { ScreenHeader } from '../primitives'
import { HeaderActions } from '../nav'
import { InlineOffer } from '../marketing/placements'
import { ExploreAccountsCard } from '../products/explore-accounts-card'
import { GrowSectionNav } from '../grow/grow-section-nav'

function MoreForYou() {
  const { dispatch } = useBank()

  return (
    <div className="flex flex-col gap-3">
      <ExploreAccountsCard />
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => dispatch({ type: 'overlay', overlay: 'family' })}
          className="flex min-h-36 w-full flex-col items-start justify-between gap-3 rounded-3xl bg-card p-4 text-left"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-lime">
            <Baby className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block text-base font-semibold leading-tight">TD Family accounts</span>
            <span className="mt-1 block text-xs leading-snug text-muted-foreground">Cards and allowance for teens</span>
          </span>
        </button>
        <InvestEntryCard />
      </div>
      <InlineOffer offerId="inline-invest-grow" productId="auto-invest" cta="Start with $5" className="px-1">
        Prefer hands-off? TD Auto Invest builds and rebalances a portfolio for you.
      </InlineOffer>
    </div>
  )
}

export function GrowScreen() {
  const { growSection, dispatch } = useBank()
  const scrollerRef = useRef<HTMLDivElement>(null)

  const select = (section: GrowSection) => {
    if (section === growSection) return
    dispatch({ type: 'growSection', section })
    scrollerRef.current?.scrollTo({ top: 0 })
  }

  return (
    <div ref={scrollerRef} className="no-scrollbar absolute inset-0 overflow-y-auto pb-8">
      <ScreenHeader title="Plan" subtitle="Save, invest and plan ahead" right={<HeaderActions />} />
      <GrowSectionNav active={growSection} onSelect={select} />

      <div id="plan-panel" role="tabpanel" aria-labelledby={`plan-tab-${growSection}`} className="flex flex-col gap-6 px-4 pt-2">
        {growSection === 'vaults' && (
          <>
            <VaultsSummary />
            <VaultsSection />
          </>
        )}
        {growSection === 'insights' && <InsightsSection />}
        {growSection === 'accounts' && <MoreForYou />}
      </div>
    </div>
  )
}
