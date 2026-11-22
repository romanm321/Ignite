'use client'

import { BenefitsHeader } from '../relationship/benefits-header'
import { RewardsOffers } from '../relationship/rewards-offers'

export function RewardsScreen() {
  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-8">
      <BenefitsHeader />

      <div className="flex flex-col gap-6 px-4 pt-2">
        <RewardsOffers />
      </div>
    </div>
  )
}
