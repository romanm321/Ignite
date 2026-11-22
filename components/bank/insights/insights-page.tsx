'use client'

import { ChartColumn, Plus, Spline } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney, type Vault } from '@/lib/bank-data'
import { spendingByCategory } from '@/lib/insights-view'
import { useBank, type InsightsView } from '../bank-provider'
import { SectionHeader } from '../primitives'
import { AccountBreakdown } from './account-breakdown'
import { BalanceCard, SpendingCard } from './insight-charts'
import { useInsightsView } from './use-insights-view'
import { VaultTotals } from './vault-totals'

const views: { id: InsightsView; label: string; icon: typeof Spline }[] = [
  { id: 'balance', label: 'Balance', icon: Spline },
  { id: 'spending', label: 'Spending', icon: ChartColumn },
  { id: 'vaults', label: 'Vaults', icon: Plus },
]

function ViewTabs() {
  const { insights, dispatch } = useBank()
  return (
    <div role="tablist" aria-label="Insights views" className="flex gap-1">
      {views.map(({ id, label, icon: Icon }) => {
        const active = insights.tab === id
        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={`insights-view-${id}`}
            aria-selected={active}
            aria-controls="insights-view-panel"
            onClick={() => dispatch({ type: 'insightsPatch', patch: { tab: id } })}
            className={cn(
              'flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors',
              active ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}

function SpendingBreakdown() {
  const { txns } = useInsightsView()
  const { streetSafe } = useBank()
  const rows = spendingByCategory(txns)
  const max = rows[0]?.total || 1
  return (
    <section aria-labelledby="spend-breakdown-h" className="flex flex-col gap-3">
      <SectionHeader id="spend-breakdown-h" title="Where it went" />
      {rows.length === 0 ? (
        <p className="rounded-3xl bg-card p-4 text-sm text-muted-foreground">No spending yet this month for these accounts.</p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-3xl bg-card">
          {rows.slice(0, 6).map((r) => (
            <li key={r.category} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{r.category}</span>
                <span className="tabular font-mono font-semibold">{streetSafe ? '••••' : formatMoney(r.total)}</span>
              </div>
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${(r.total / max) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Vaults belong to the account they live in: Regular Vaults to checking, Savings Vaults to savings. */
function vaultsFor(vaults: Vault[], ids: string[], savingsIds: string[]) {
  const hasChecking = ids.includes('chk')
  const hasSavings = ids.some((id) => savingsIds.includes(id))
  return vaults.filter((v) => (v.kind === 'regular' ? hasChecking : hasSavings))
}

export function InsightsPage() {
  const { insights, vaults, accounts } = useBank()
  const view = useInsightsView()
  const savingsIds = accounts.filter((a) => a.id === 'sav' || a.id === 'sav-new').map((a) => a.id)

  return (
    <div className="flex flex-col gap-6">
      <ViewTabs />

      <div id="insights-view-panel" role="tabpanel" aria-labelledby={`insights-view-${insights.tab}`} className="flex flex-col gap-6">
        {insights.tab === 'balance' && <BalanceCard balance={view.balance} txns={view.txns} />}
        {insights.tab === 'spending' && (
          <>
            <SpendingCard txns={view.txns} />
            <SpendingBreakdown />
          </>
        )}
        {insights.tab === 'vaults' && <VaultTotals vaults={vaultsFor(vaults, view.ids, savingsIds)} />}
        <AccountBreakdown />
      </div>
    </div>
  )
}
