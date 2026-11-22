'use client'

import { ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/bank-data'
import { useBank } from '../bank-provider'
import { SectionHeader } from '../primitives'
import { vaultTone } from '../vaults/vault-detail'
import { openVaultsLanding } from '../vaults/open-vaults'

/** The Vaults that belong to the account in front: Regular Vaults under Checking, Savings Vaults under Savings. */
export function VaultsCarousel({ kind, accountName, masked }: { kind: 'regular' | 'savings'; accountName: string; masked: boolean }) {
  const { vaults, dispatch } = useBank()
  const mine = vaults.filter((v) => (v.kind === 'regular' ? 'regular' : 'savings') === kind)
  const show = (n: number) => (masked ? '••••' : formatMoney(n))

  return (
    <section aria-labelledby="home-vaults-h" className="flex flex-col gap-3">
      <SectionHeader
        id="home-vaults-h"
        title="Vaults"
        action={
          <button type="button" onClick={() => openVaultsLanding(dispatch)} className="flex h-11 items-center gap-0.5 text-sm font-semibold text-primary">
            See all <ChevronRight className="size-4" aria-hidden />
          </button>
        }
      />
      <ul className="no-scrollbar -mx-4 flex scroll-pl-4 snap-x gap-3 overflow-x-auto px-4 pb-1" aria-label={`Vaults in ${accountName}`}>
        {mine.map((v) => {
          const pct = v.goal ? Math.min(100, (v.balance / v.goal) * 100) : 0
          const tone = vaultTone[v.tone]
          return (
            <li key={v.id} className="w-40 shrink-0 snap-start">
              <button
                type="button"
                onClick={() => dispatch({ type: 'openVault', id: v.id })}
                aria-label={`${v.name}, ${show(v.balance)}, ${Math.round(pct)}% of goal`}
                className={cn(
                  'relative flex h-32 w-full flex-col justify-between overflow-hidden rounded-3xl p-3 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary',
                  v.photo ? 'bg-forest text-white' : tone.card,
                )}
              >
                {v.photo && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.photo} alt="" className="absolute inset-0 size-full object-cover" />
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />
                  </>
                )}
                <span className="relative flex items-start justify-between gap-2">
                  <span className="line-clamp-1 font-heading text-base font-bold leading-tight">{v.name}</span>
                  {pct >= 100 && <span className="shrink-0 rounded-full bg-lime px-2 py-0.5 text-[11px] font-semibold text-lime-foreground">Done</span>}
                </span>
                <span className="relative">
                  <span className="tabular block font-mono text-lg font-bold leading-tight">{show(v.balance)}</span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-black/20">
                    <span className={cn('block h-full rounded-full', v.photo ? 'bg-lime' : tone.bar)} style={{ width: `${pct}%` }} />
                  </span>
                  <span className="mt-1 block text-xs leading-none opacity-85">
                    {Math.round(pct)}% of {show(v.goal)}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
        <li className="w-40 shrink-0 snap-start">
          <button
            type="button"
            onClick={() => dispatch({ type: 'startVaultFlow', kind })}
            className="flex h-32 w-full flex-col items-center justify-center gap-1.5 rounded-3xl border-2 border-dashed border-primary/40 p-3 text-center text-primary outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-accent">
              <Plus className="size-5" aria-hidden />
            </span>
            <span className="text-sm font-semibold leading-tight">New {kind === 'regular' ? 'Regular' : 'Savings'} Vault</span>
          </button>
        </li>
      </ul>
    </section>
  )
}
