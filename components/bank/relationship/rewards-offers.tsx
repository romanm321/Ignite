'use client'

import { useState } from 'react'
import { TdForYou } from '../marketing/placements'
import { UnifiedRewards } from './unified-rewards'
import { RecentEarnings } from './recent-earnings'
import { OffersSection } from './offers-section'
import { ShopSection } from './shop-section'

export function RewardsOffers() {
  const [enrolled, setEnrolled] = useState<string[]>([])
  const toggleOffer = (id: string) => setEnrolled((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  return (
    <div className="flex flex-col gap-6">
      <UnifiedRewards enrolled={enrolled} />
      <RecentEarnings enrolled={enrolled} />
      <TdForYou />
      <OffersSection enrolled={enrolled} onToggle={toggleOffer} />
      <ShopSection />
    </div>
  )
}
