'use client'

import { useState } from 'react'
import { ChevronRight, Coins, Landmark, Lock, Plus, Receipt, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/bank-data'
import { blendedApy, roundUpsThisMonth, tierFor, tiers, vaultTotal } from '@/lib/vaults'
import { useBank } from '../bank-provider'
import { Pill, SectionHeader } from '../primitives'
import { vaultTone } from './vault-detail'
import { CreateVaultSheet } from './vault-sheets'
import { useSavingsHome } from './use-savings-home'

export function VaultsSummary() {
  const { vaults, streetSafe, dispatch } = useBank()
  const savings = useSavingsHome()
  const total = vaultTotal(vaults)
  const apy = blendedApy(vaults)
  const { tier, next } = tierFor(total)
  const show = (n: number) => (streetSafe ? '••••' : formatMoney(n))
  const progress = next ? Math.min(100, ((total - tier.min) / (next.min - tier.min)) * 100) : 100

  return (
    <section className="rounded-3xl bg-forest p-5 text-forest-foreground" aria-labelledby="vault-total">
      <div className="flex items-center justify-between gap-2">
        <p id="vault-total" className="text-sm text-forest-foreground/70">
          In vaults · {apy.toFixed(2)}% interest
        </p>
        <Pill className="bg-lime text-lime-foreground">{tier.name}</Pill>
      </div>
      <p className="tabular font-mono text-3xl font-semibold">{show(total)}</p>
      <p className="mt-1 text-sm text-lime">Earning about {show((total * apy) / 100 / 12)} a month</p>

      <div className="mt-4 border-t border-white/15 pt-4">
        <ol className="grid grid-cols-3 gap-2 text-xs" aria-label="Savings tiers">
          {tiers.map((t) => (
            <li
              key={t.id}
              aria-current={t.id === tier.id ? 'step' : undefined}
              className={cn('rounded-xl px-2.5 py-2', t.id === tier.id ? 'bg-white/15' : 'opacity-60')}
            >
              <span className="block font-semibold">{t.name}</span>
              <span className="block opacity-80">{t.bonus ? `+${t.bonus.toFixed(2)}%` : 'Base rate'}</span>
            </li>
          ))}
        </ol>
        {next ? (
          <>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-lime" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-forest-foreground/70">
              Save {show(next.min - total)} more to reach {next.name} and earn +{(next.bonus - tier.bonus).toFixed(2)}% extra.
            </p>
          </>
        ) : (
          <p className="mt-3 text-xs text-forest-foreground/70">You&apos;re earning our best rate.</p>
        )}
      </div>

      {savings.account && (
        <button
          type="button"
          onClick={() => dispatch({ type: 'openAccount', id: savings.account?.id ?? null })}
          className="mt-4 flex min-h-12 w-full items-center gap-3 rounded-2xl bg-white/10 px-3 py-2 text-left"
        >
          <Landmark className="size-5 shrink-0 text-lime" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">
              Held in {savings.account.name} ••{savings.account.mask}
            </span>
            <span className="block text-xs text-forest-foreground/70">
              {show(savings.available)} is outside your Vaults
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-forest-foreground/70" aria-hidden />
        </button>
      )}
    </section>
  )
}

export function VaultsSection() {
  const { vaults, roundUpsVaultId, transactions, payees, streetSafe, dispatch, notify } = useBank()
  const [creating, setCreating] = useState(false)
  const show = (n: number) => (streetSafe ? '••••' : formatMoney(n))
  const roundUpsVault = vaults.find((v) => v.id === roundUpsVaultId)
  const sorted = vaults.reduce((s, v) => s + v.salarySort, 0)
  const billVault = vaults.find((v) => v.billPayeeIds.length > 0)
  const billCount = vaults.reduce((s, v) => s + v.billPayeeIds.filter((id) => payees.some((p) => p.id === id)).length, 0)

  const habits = [
    {
      icon: Coins,
      title: 'Round-ups',
      detail: roundUpsVault ? `${show(roundUpsThisMonth(transactions))} this month into ${roundUpsVault.name}` : 'Off',
      vaultId: roundUpsVault?.id ?? vaults[0]?.id,
    },
    {
      icon: Wallet,
      title: 'Salary Sorter',
      detail: sorted ? `${show(sorted)} every payday` : 'Off',
      vaultId: vaults.find((v) => v.salarySort > 0)?.id ?? vaults[0]?.id,
    },
    {
      icon: Receipt,
      title: 'Bills from vaults',
      detail: billCount ? `${billCount} bill${billCount === 1 ? '' : 's'} paid from ${billVault?.name ?? 'a vault'}` : 'Pay bills straight from a vault',
      vaultId: billVault?.id ?? vaults[0]?.id,
    },
  ]

  return (
    <section aria-labelledby="vaults-h" className="flex flex-col gap-3">
      <SectionHeader
        id="vaults-h"
        title="Vaults"
        action={
          <button type="button" onClick={() => setCreating(true)} className="flex h-11 items-center gap-1 text-sm font-medium text-primary">
            <Plus className="size-4" aria-hidden /> New vault
          </button>
        }
      />

      {vaults.length === 0 && (
        <div className="rounded-3xl bg-card p-5 text-center">
          <p className="font-semibold">Save for what matters</p>
          <p className="mt-1 text-sm text-muted-foreground">Pick a goal, then save a little at a time.</p>
        </div>
      )}
      <ul className="flex flex-col gap-2 empty:hidden">
        {vaults.map((v) => {
          const pct = v.goal ? Math.min(100, (v.balance / v.goal) * 100) : 0
          return (
            <li key={v.id} className="overflow-hidden rounded-3xl bg-card">
              <button type="button" onClick={() => dispatch({ type: 'openVault', id: v.id })} className="flex w-full flex-col gap-3 p-4 pb-2 text-left">
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 font-semibold">
                      {v.name}
                      {v.lockedUntil && <Lock className="size-3.5 text-muted-foreground" aria-label="Locked" />}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {[
                        `${v.apy.toFixed(2)}% interest`,
                        roundUpsVaultId === v.id && 'Round-ups on',
                        v.billPayeeIds.length > 0 && 'Pays bills',
                      ]
                        .filter(Boolean)
                        .slice(0, 2)
                        .join(' · ')}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="tabular font-mono font-semibold">{show(v.balance)}</span>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </span>
                </span>
                <span className="block h-2 overflow-hidden rounded-full bg-muted">
                  <span className={cn('block h-full rounded-full transition-all', vaultTone[v.tone].listBar)} style={{ width: `${pct}%` }} />
                </span>
              </button>
              <div className="flex items-center justify-between px-4 pb-3 text-sm text-muted-foreground">
                <span>
                  {Math.round(pct)}% of {formatMoney(v.goal)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'vaultTransfer', vaultId: v.id, amount: 50 })
                    notify(`$50.00 added to ${v.name}`)
                  }}
                  aria-label={`Add $50 to ${v.name}`}
                  className="h-11 rounded-xl bg-shield-50 px-4 text-sm font-semibold text-shield-700"
                >
                  + $50
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <ul className="divide-y overflow-hidden rounded-3xl bg-card" aria-label="Saving habits">
        {habits.map(({ icon: Icon, title, detail, vaultId }) => (
          <li key={title}>
            <button
              type="button"
              disabled={!vaultId}
              onClick={() => vaultId && dispatch({ type: 'openVault', id: vaultId })}
              className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Icon className="size-[18px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{title}</span>
                <span className="block text-xs text-muted-foreground">{detail}</span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      {creating && <CreateVaultSheet onClose={() => setCreating(false)} />}
    </section>
  )
}
