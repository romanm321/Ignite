'use client'

import { useMemo } from 'react'
import { securityBySymbol } from '@/lib/invest-data'
import { computeRelationship } from '@/lib/relationship'
import { useBank } from '../bank-provider'

export function useRelationship() {
  const { accounts, transactions, invest } = useBank()
  return useMemo(() => {
    const invested = Object.entries(invest.holdings).reduce(
      (sum, [symbol, h]) => sum + h.shares * (securityBySymbol[symbol]?.price ?? 0),
      0,
    )
    return computeRelationship({ accounts, transactions, invested, investOpened: invest.opened })
  }, [accounts, transactions, invest])
}
