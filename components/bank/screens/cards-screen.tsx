'use client'

import { SubNav, accountsSubNav } from '../nav'
import { BenefitsHeader } from '../relationship/benefits-header'
import { RewardsOffers } from '../relationship/rewards-offers'

export function CardsScreen() {
  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-8">
      <BenefitsHeader />
      <SubNav label="Benefits sections" items={accountsSubNav} />

      <div className="flex flex-col gap-6 px-4 pt-2">
        <RewardsOffers />
      </div>
    </div>
  )
}
