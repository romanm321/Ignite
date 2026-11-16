'use client'

import { useMemo } from 'react'
import { formatMoney } from '@/lib/bank-data'
import { activeSubscriptions, buildBudgetRows, buildCycle, buildMonth, buildProducts, buildTrends } from '@/lib/insights'
import { useBank } from '../bank-provider'

export function useInsights() {
  const { transactions, payees, vaults, subs, accounts, budgets, categoryOverrides, customerType, roundUpsVaultId, streetSafe } = useBank()

  const model = useMemo(() => {
    const isNew = customerType === 'new'
    const cycle = buildCycle({ transactions, payees, vaults, subs, overrides: categoryOverrides })
    const month = buildMonth({ transactions, payees, overrides: categoryOverrides, useAggregates: !isNew })
    const subsActive = activeSubscriptions(transactions, subs)
    const budgetRows = buildBudgetRows(cycle, budgets, month)
    const products = buildProducts({ accounts, transactions, vaults })
    const trends = buildTrends({ isNew, cycle, month, vaults, transactions, subs: subsActive, budgets, roundUpsVaultId, overrides: categoryOverrides })
    return { isNew, cycle, month, subsActive, budgetRows, products, trends }
  }, [transactions, payees, vaults, subs, accounts, budgets, categoryOverrides, customerType, roundUpsVaultId])

  const show = (n: number) => (streetSafe ? '••••' : formatMoney(n))
  const showWhole = (n: number) => (streetSafe ? '••••' : `$${Math.round(n).toLocaleString('en-US')}`)

  return { ...model, show, showWhole }
}
