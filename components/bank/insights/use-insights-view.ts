'use client'

import { useMemo } from 'react'
import type { Transaction } from '@/lib/bank-data'
import { institutions } from '@/lib/external-accounts'
import { accountOf, useBank } from '../bank-provider'
import { useSavingsHome } from '../vaults/use-savings-home'
import { useInvestAccount } from '../invest/use-invest-account'

export type ViewAccount = {
  id: string
  name: string
  subtitle: string
  balance: number
  kind: 'checking' | 'savings' | 'credit' | 'cd' | 'investment' | 'external'
  /** Colour classes for an external bank's mark. */
  mark?: string
}

/** The accounts the Insights charts can add together, and the ones currently chosen. */
export function useInsightsView() {
  const { accounts, transactions, externalAccounts, externalTxns, insights, dispatch } = useBank()
  const savings = useSavingsHome()
  const portfolio = useInvestAccount()

  return useMemo(() => {
    const isCd = (id: string) => id === 'cd' || id === 'step-cd'
    const own: ViewAccount[] = accounts.map((a) => {
      const kind: ViewAccount['kind'] =
        a.kind === 'credit' ? 'credit' : a.kind === 'checking' ? 'checking' : a.kind === 'investment' ? 'investment' : isCd(a.id) ? 'cd' : 'savings'
      const subtitle = { credit: 'Credit card', checking: 'Checking', investment: 'Investing', cd: 'CD', savings: 'Savings', external: '' }[kind]
      return { id: a.id, name: a.name, subtitle, balance: savings.account?.id === a.id ? savings.total : a.balance, kind }
    })
    // Direct Investing is worked out from the portfolio rather than kept with the other accounts, so it is added here.
    if (portfolio) own.push({ id: portfolio.account.id, name: portfolio.account.name, subtitle: 'Investing', balance: portfolio.value, kind: 'investment' })
    const external: ViewAccount[] = externalAccounts.map((a) => ({
      id: a.id,
      name: a.institution,
      subtitle: `${a.name} ••${a.mask}`,
      balance: a.balance,
      kind: 'external',
      mark: institutions.find((i) => i.id === a.institutionId)?.color,
    }))
    const all = [...own, ...external]

    const wanted = insights.accountIds ?? all.map((a) => a.id)
    const picked = all.filter((a) => wanted.includes(a.id))
    // An empty list is a choice (everything switched off); only a stale selection falls back to the first account.
    const selected = insights.accountIds?.length === 0 ? [] : picked.length > 0 ? picked : all.slice(0, 1)
    const ids = selected.map((a) => a.id)

    const txns: Transaction[] = [...transactions, ...externalTxns].filter((t) => ids.includes(accountOf(t)))
    const balance = selected.reduce((s, a) => s + a.balance, 0)

    const setSelected = (next: string[]) => dispatch({ type: 'insightsPatch', patch: { accountIds: next } })

    return { all, selected, ids, txns, balance, setSelected, tab: insights.tab }
  }, [accounts, transactions, externalAccounts, externalTxns, insights, savings, portfolio, dispatch])
}
