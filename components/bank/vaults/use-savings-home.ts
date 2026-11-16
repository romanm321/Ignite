'use client'

import { useMemo } from 'react'
import { vaultTotal } from '@/lib/vaults'
import { useBank } from '../bank-provider'

/** The savings accounts that hold the customer's vaults. */
export const isSavingsHome = (id: string) => id === 'sav' || id === 'sav-new'

/**
 * Vaults live inside the customer's TD Growth Savings account. The account's shown total is the cash that is
 * available in savings plus everything held in vaults, while the state balance stays the spendable, outside-vault amount.
 */
export function useSavingsHome() {
  const { accounts, vaults } = useBank()

  return useMemo(() => {
    const account = accounts.find((a) => isSavingsHome(a.id)) ?? null
    const inVaults = vaultTotal(vaults)
    return {
      account,
      available: account?.balance ?? 0,
      inVaults,
      vaultCount: vaults.length,
      total: (account?.balance ?? 0) + inVaults,
    }
  }, [accounts, vaults])
}
