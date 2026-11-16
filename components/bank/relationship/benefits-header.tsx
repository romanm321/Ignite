'use client'

import { ScreenHeader } from '../primitives'
import { HeaderActions } from '../nav'

export function BenefitsHeader() {
  return <ScreenHeader title="Relationship & benefits" titleClassName="whitespace-nowrap text-[22px]" subtitle="Perks for banking with TD" right={<HeaderActions />} />
}
