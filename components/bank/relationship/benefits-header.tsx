'use client'

import { ScreenHeader } from '../primitives'
import { HeaderActions } from '../nav'

export function BenefitsHeader() {
  return <ScreenHeader title="Benefits & rewards" subtitle="Cash back, deals and perks" right={<HeaderActions />} />
}
