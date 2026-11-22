'use client'

import { useBank } from '../bank-provider'
import { NewVaultPage } from './new-vault-page'

/** Shows the New Vault page wherever a Vault is started from, once the first-time reel (if any) is done. */
export function CreateVaultHost() {
  const { vaultCompose, dispatch } = useBank()
  if (!vaultCompose) return null
  return <NewVaultPage key={vaultCompose} kind={vaultCompose} onClose={() => dispatch({ type: 'vaultComposeClose' })} />
}
