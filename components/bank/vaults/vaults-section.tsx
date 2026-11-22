'use client'

import { useState } from 'react'
import { ChevronRight, Coins, Landmark, Lock, Plus, Receipt, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/bank-data'
import { blendedApy, monthlyDeposit, roundUpsThisMonth, tierFor, tiers, vaultTotal } from '@/lib/vaults'
import { useBank } from '../bank-provider'
import { BigAmount } from '../big-amount'
import { Pill, SectionHeader } from '../primitives'
import { VaultTile } from './vault-tile'
import { useSavingsHome } from './use-savings-home'

export function VaultsSummary() {
  const { vaults, streetSafe, dispatch } = useBank()
  const savings = useSavingsHome()
  if (!savings.account) return null
  const total = vaultTotal(vaults)
  const apy = blendedApy(vaults)
  const { tier, next } = tierFor(total)
  const show = (n: number) => (streetSafe ? '••••' : formatMoney(n))
  const progress = next ? Math.min(100, ((total - tier.min) / (next.min - tier.min)) * 100) : 100

  return (
    <section className="rounded-3xl bg-card p-5 text-foreground" aria-labelledby="vault-total">
      <div className="flex items-center justify-between gap-2">
        <p id="vault-total" className="text-muted-foreground">
          In vaults · {apy.toFixed(2)}% interest
        </p>
        <Pill className="bg-lime text-lime-foreground">{tier.name}</Pill>
      </div>
      <BigAmount value={show(total)} className="mt-2 block text-5xl" />
      <p className="mt-3 text-sm font-medium text-primary">Earning about {show((total * apy) / 100 / 12)} a month</p>

      <div className="mt-5">
        <ol className="grid grid-cols-3 gap-2 text-xs" aria-label="Savings tiers">
          {tiers.map((t) => (
            <li
              key={t.id}
              aria-current={t.id === tier.id ? 'step' : undefined}
              className={cn('rounded-xl px-2.5 py-2', t.id === tier.id ? 'bg-muted' : 'opacity-60')}
            >
              <span className="block font-semibold">{t.name}</span>
              <span className="block text-muted-foreground">{t.bonus ? `+${t.bonus.toFixed(2)}%` : 'Base rate'}</span>
            </li>
          ))}
        </ol>
        {next ? (
          <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Save {show(next.min - total)} more to reach {next.name} and earn +{(next.bonus - tier.bonus).toFixed(2)}% extra.
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">You&apos;re earning our best rate.</p>
        )}
      </div>

      {savings.account && (
        <button
          type="button"
          onClick={() => dispatch({ type: 'openAccount', id: savings.account?.id ?? null })}
          className="mt-5 flex min-h-16 w-full items-center gap-3 rounded-2xl bg-muted/60 p-3 text-left active:bg-muted"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-forest text-lime">
            <Landmark className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">
              Held in {savings.account.name} ••{savings.account.mask}
            </span>
            <span className="block text-sm text-muted-foreground">{show(savings.available)} is outside your Vaults</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      )}
    </section>
  )
}

export function VaultsSection() {
  const { vaults, roundUpsVaultId, transactions, payees, streetSafe, dispatch, notify } = useBank()
  const show = (n: number) => (streetSafe ? '••••' : formatMoney(n))
  if (vaults.length === 0) return null
  const roundUpsVault = vaults.find((v) => v.id === roundUpsVaultId)
  const scheduledMonthly = vaults.reduce((s, v) => s + monthlyDeposit(v), 0)
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
      title: 'Scheduled deposits',
      detail: scheduledMonthly ? `About ${show(scheduledMonthly)} a month` : 'Off',
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
      <SectionHeader id="vaults-h" title="Your Vaults" />
      <ul className="flex flex-col gap-3 empty:hidden" aria-label="Your Vaults">
        {vaults.map((v) => (
          <VaultTile
            key={v.id}
            vault={v}
            subtitle={[
              v.kind === 'regular' ? 'Regular · Everyday Checking' : `${v.apy.toFixed(2)}% interest`,
              roundUpsVaultId === v.id && 'Round-ups on',
              v.billPayeeIds.length > 0 && 'Pays bills',
            ]
              .filter(Boolean)
              .slice(0, 2)
              .join(' · ')}
            compact
            action={
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'vaultTransfer', vaultId: v.id, amount: 50 })
                  notify(`$50.00 added to ${v.name}`)
                }}
                aria-label={`Add $50 to ${v.name}`}
                className="relative h-8 shrink-0 rounded-lg bg-black/10 px-3 text-xs font-semibold before:absolute before:-inset-x-1 before:-inset-y-1.5 before:content-[''] active:bg-black/20"
              >
                + $50
              </button>
            }
          />
        ))}
      </ul>

      {vaults.length > 0 && (
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
      )}
    </section>
  )
}
