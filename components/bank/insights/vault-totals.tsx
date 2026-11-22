'use client'

import { formatMoney, type Vault } from '@/lib/bank-data'
import { vaultProgress } from '@/lib/insights-view'
import { VaultTile } from '../vaults/vault-tile'
import { useBank } from '../bank-provider'
import { BigAmount } from '../big-amount'

/** The total across the Vaults in the chosen accounts, then each Vault as a tile in its own colour with a slim picture across the top. */
export function VaultTotals({ vaults }: { vaults: Vault[] }) {
  const { streetSafe } = useBank()
  const rows = vaultProgress(vaults)
  const money = (n: number) => (streetSafe ? '••••' : formatMoney(n))
  const saved = vaults.reduce((s, v) => s + v.balance, 0)
  const goals = vaults.reduce((s, v) => s + v.goal, 0)

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="vault-total-h" className="rounded-3xl bg-card p-5">
        <p id="vault-total-h" className="text-muted-foreground">
          Saved in your Vaults
        </p>
        <BigAmount value={money(saved)} className="mt-2 block text-5xl" />
        <p className="mt-3 text-sm text-muted-foreground">
          {rows.length === 0
            ? 'No Vaults in the accounts you have switched on.'
            : `Across ${rows.length} ${rows.length === 1 ? 'Vault' : 'Vaults'}, toward ${money(goals)} in goals.`}
        </p>
      </section>

      {rows.length > 0 && (
        <ul className="flex flex-col gap-3" aria-label="Your Vaults">
          {rows.map(({ vault, pct, monthly, monthsLeft }) => (
            <VaultTile
              key={vault.id}
              vault={vault}
              subtitle={
                pct >= 100
                  ? 'Goal reached'
                  : monthsLeft === null
                    ? 'Add money to get a finish date'
                    : `About ${monthsLeft} ${monthsLeft === 1 ? 'month' : 'months'} to go at ${money(monthly)} a month`
              }
            />
          ))}
        </ul>
      )}
    </div>
  )
}
