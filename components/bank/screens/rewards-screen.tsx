'use client'

import { SubNav, accountsSubNav } from '../nav'
import { BenefitsHeader } from '../relationship/benefits-header'
import { CashBackSnapshot } from '../relationship/cash-back-snapshot'
import { StatusCard } from '../relationship/status-card'
import { RelationshipSummary } from '../relationship/relationship-summary'
import { ValueSummary } from '../relationship/value-summary'
import { NextBestProducts } from '../relationship/next-best'
import { TierLadder } from '../relationship/tier-ladder'

export function RewardsScreen() {
  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-8">
      <BenefitsHeader />
      <SubNav label="Benefits sections" items={accountsSubNav} />

      <div className="flex flex-col gap-6 px-4 pt-2">
        <StatusCard />
        <CashBackSnapshot />
        <RelationshipSummary />
        <ValueSummary />
        <NextBestProducts />
        <TierLadder />
      </div>
    </div>
  )
}
