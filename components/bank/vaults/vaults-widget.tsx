'use client'

import { ChevronRight, Lock, PiggyBank } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/bank-data'
import { blendedApy, vaultTotal } from '@/lib/vaults'
import { useBank } from '../bank-provider'
import { vaultTone } from './vault-detail'
import { openVaultsSection } from './open-vaults'

const TOP_COUNT = 3

export function VaultsWidget() {
  const { vaults, streetSafe, dispatch } = useBank()
  const show = (n: number) => (streetSafe ? '••••' : formatMoney(n))
  const top = [...vaults].sort((a, b) => b.balance - a.balance).slice(0, TOP_COUNT)

  return (
    <button
      type="button"
      onClick={() => openVaultsSection(dispatch)}
      aria-label={vaults.length ? `Vaults, ${vaults.length} total. Open all vaults` : 'Vaults. Create your first vault'}
      className="flex w-full flex-col gap-3 rounded-3xl bg-card p-4 text-left"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <PiggyBank className="size-4 text-primary" aria-hidden />
          Vaults
          {vaults.length > 0 && (
            <span className="tabular font-mono text-foreground">
              {show(vaultTotal(vaults))} · {blendedApy(vaults).toFixed(2)}% interest
            </span>
          )}
        </span>
        <span className="flex items-center gap-0.5 text-sm font-medium text-primary">
          {vaults.length ? 'See all' : 'Create'}
          <ChevronRight className="size-4" aria-hidden />
        </span>
      </span>

      {top.length === 0 ? (
        <span>
          <span className="block font-semibold leading-tight">Save for what matters</span>
          <span className="mt-1 block text-xs text-muted-foreground">Save for something you care about.</span>
        </span>
      ) : (
        <span className="flex flex-col gap-3">
          {top.map((v) => {
            const pct = v.goal ? Math.min(100, (v.balance / v.goal) * 100) : 0
            return (
              <span key={v.id} className="flex flex-col gap-1.5">
                <span className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
                    <span className="truncate">{v.name}</span>
                    {v.lockedUntil && <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-label="Locked" />}
                  </span>
                  <span className="tabular shrink-0 font-mono text-sm font-semibold">{show(v.balance)}</span>
                </span>
                <span className="block h-1.5 overflow-hidden rounded-full bg-muted">
                  <span className={cn('block h-full rounded-full', vaultTone[v.tone].listBar)} style={{ width: `${pct}%` }} />
                </span>
              </span>
            )
          })}
        </span>
      )}
    </button>
  )
}
