'use client'

import { useState } from 'react'
import { BenefitsValue } from './benefits-value'
import { OffersSection } from './offers-section'
import { ShopSection } from './shop-section'

export function RewardsOffers() {
  const [enrolled, setEnrolled] = useState<string[]>([])
  const toggleOffer = (id: string) => setEnrolled((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  return (
    <div className="flex flex-col gap-6">
      <BenefitsValue enrolled={enrolled} />
      <OffersSection enrolled={enrolled} onToggle={toggleOffer} />
      <ShopSection />
    </div>
  )
}
