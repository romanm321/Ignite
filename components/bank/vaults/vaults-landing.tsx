'use client'

import { useBank } from '../bank-provider'
import { OverlayFrame } from '../overlay'
import { VaultTypePicker } from './vault-type-picker'
import { VaultsSection, VaultsSummary } from './vaults-section'

/** Where a customer sets up a Regular or Savings Vault, and sees the ones they already have. */
export function VaultsLanding() {
  const { dispatch } = useBank()
  return (
    <OverlayFrame title="Vaults" onBack={() => dispatch({ type: 'overlay', overlay: null })}>
      <div className="flex flex-col gap-6 px-4 pt-2">
        <VaultTypePicker />
        <VaultsSummary />
        <VaultsSection />
      </div>
    </OverlayFrame>
  )
}
