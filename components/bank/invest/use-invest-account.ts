'use client'

import { useMemo } from 'react'
import type { Account, Transaction } from '@/lib/bank-data'
import { securityBySymbol } from '@/lib/invest-data'
import { useBank } from '../bank-provider'

export const INVEST_ACCOUNT_ID = 'inv'

export type InvestHolding = { symbol: string; name: string; shares: number; value: number; cost: number; gain: number }

/** The TD Direct Investing account, derived from the portfolio. It exists once the customer opens investing. */
export function useInvestAccount() {
  const { invest, transactions } = useBank()

  return useMemo(() => {
    if (!invest.opened) return null
    const holdings: InvestHolding[] = Object.entries(invest.holdings)
      .filter(([symbol]) => securityBySymbol[symbol])
      .map(([symbol, h]) => {
        const sec = securityBySymbol[symbol]
        const value = h.shares * sec.price
        return { symbol, name: sec.name, shares: h.shares, value, cost: h.cost, gain: value - h.cost }
      })
      .sort((a, b) => b.value - a.value)
    const value = Math.round(holdings.reduce((s, h) => s + h.value, 0) * 100) / 100
    const cost = holdings.reduce((s, h) => s + h.cost, 0)
    const account: Account = { id: INVEST_ACCOUNT_ID, name: 'TD Direct Investing', kind: 'investment', balance: value, mask: '3380' }
    // Trades are stored against the cash account they were paid from, so flip them to show money moving into the portfolio.
    const txns: Transaction[] = transactions
      .filter((t) => t.id.startsWith('iv-'))
      .map((t) => ({ ...t, accountId: INVEST_ACCOUNT_ID, amount: -t.amount, merchant: t.merchant.replace(' · TD Direct Investing', '') }))
    return { account, holdings, value, cost, gain: value - cost, txns }
  }, [invest, transactions])
}
