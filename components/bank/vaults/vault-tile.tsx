'use client'

import type { ReactNode } from 'react'
import { ChevronRight, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney, type Vault } from '@/lib/bank-data'
import { useBank } from '../bank-provider'
import { vaultTone } from './vault-detail'
import { VaultImage } from './vault-picture'

/** A Vault as a tile in its own colour, with a slim picture across the top, its balance and a progress bar. */
export function VaultTile({
  vault,
  subtitle,
  action,
  compact,
}: {
  vault: Vault
  subtitle: string
  /** A small button that sits beside the progress bar. */
  action?: ReactNode
  /** A shorter tile, for lists where Vaults are scanned rather than studied. */
  compact?: boolean
}) {
  const { streetSafe, dispatch } = useBank()
  const tone = vaultTone[vault.tone]
  const pct = vault.goal ? Math.min(100, (vault.balance / vault.goal) * 100) : 0
  const reached = pct >= 100

  return (
    <li className={cn('overflow-hidden rounded-3xl', tone.card)}>
      <button type="button" onClick={() => dispatch({ type: 'openVault', id: vault.id })} className="flex w-full flex-col text-left">
        <VaultImage photo={vault.photo} kind={vault.kind ?? 'savings'} strip className={cn('w-full', compact ? 'h-10' : 'h-14')} />
        <span className={cn('flex flex-col', compact ? 'p-3 pb-2' : 'gap-3 p-4')}>
          <span className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
                <span className="truncate">{vault.name}</span>
                <span className="shrink-0 rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-semibold">
                  {vault.kind === 'regular' ? 'Regular' : 'Savings'}
                </span>
                {vault.lockedUntil && <Lock className="size-3.5 shrink-0" aria-label="Locked" />}
                {reached && <span className="shrink-0 rounded-full bg-black/80 px-2 py-0.5 text-[11px] font-semibold text-white">Goal reached</span>}
              </span>
              <span className="mt-0.5 block text-xs opacity-80">{subtitle}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <span className="tabular font-mono font-semibold">{streetSafe ? '••••' : formatMoney(vault.balance)}</span>
              <ChevronRight className="size-4 opacity-70" aria-hidden />
            </span>
          </span>
          {!compact && <Bar pct={pct} bar={tone.bar} />}
        </span>
      </button>
      {compact && (
        <div className="flex items-center gap-3 px-3 pb-3">
          <Bar pct={pct} bar={tone.bar} className="flex-1" />
          {action}
        </div>
      )}
    </li>
  )
}

function Bar({ pct, bar, className }: { pct: number; bar: string; className?: string }) {
  return (
    <span role="img" aria-label={`${Math.round(pct)} percent of the goal`} className={cn('block h-2 overflow-hidden rounded-full bg-black/10', className)}>
      <span className={cn('block h-full rounded-full transition-all', bar)} style={{ width: `${pct}%` }} />
    </span>
  )
}
