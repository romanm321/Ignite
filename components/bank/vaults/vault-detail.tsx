'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Lock, LockOpen, Pencil, Target, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney, type Vault } from '@/lib/bank-data'
import { SELECT_WITHDRAWALS_PER_YEAR, accessTypes, tierFor, vaultTotal, withdrawBlock } from '@/lib/vaults'
import { useBank } from '../bank-provider'
import { OverlayFrame } from '../overlay'
import { Pill, SectionHeader } from '../primitives'
import { VaultBills, VaultHabits } from './vault-habits'
import { AccessPicker, AddMoneySheet, CloseVaultSheet, EditVaultSheet, LockSheet, WithdrawSheet } from './vault-sheets'

type Sheet = null | 'add' | 'withdraw' | 'lock' | 'name' | 'goal' | 'close'

export const vaultTone: Record<Vault['tone'], { card: string; bar: string; listBar: string }> = {
  lime: { card: 'bg-lime text-lime-foreground', bar: 'bg-forest', listBar: 'bg-forest' },
  green: { card: 'bg-primary text-primary-foreground', bar: 'bg-lime', listBar: 'bg-primary' },
  ink: { card: 'bg-forest text-forest-foreground', bar: 'bg-lime', listBar: 'bg-primary' },
  sky: { card: 'bg-sky-200 text-sky-950', bar: 'bg-sky-700', listBar: 'bg-sky-700' },
}

export function VaultDetail() {
  const { vaultId, vaults, streetSafe, dispatch, notify } = useBank()
  const [sheet, setSheet] = useState<Sheet>(null)
  const vault = vaults.find((v) => v.id === vaultId)
  if (!vault) return null

  const show = (n: number) => (streetSafe ? '••••' : formatMoney(n))
  const pct = vault.goal ? Math.min(100, (vault.balance / vault.goal) * 100) : 0
  const blocked = withdrawBlock(vault)
  const { tier } = tierFor(vaultTotal(vaults))
  const tone = vaultTone[vault.tone]
  const withdrawalsLeft = SELECT_WITHDRAWALS_PER_YEAR - vault.withdrawalsUsed

  const actions = [
    { label: 'Add money', icon: ArrowDownLeft, run: () => setSheet('add'), primary: true, disabled: false },
    { label: 'Withdraw', icon: ArrowUpRight, run: () => setSheet('withdraw'), disabled: Boolean(blocked) || vault.balance <= 0 },
    { label: vault.lockedUntil ? 'Unlock' : 'Lock', icon: vault.lockedUntil ? LockOpen : Lock, run: () => setSheet('lock'), disabled: false },
  ]

  return (
    <>
      <OverlayFrame title={vault.name} onBack={() => dispatch({ type: 'openVault', id: null })}>
        <div className="flex flex-col gap-5 px-4">
          <section aria-labelledby="vault-balance" className={cn('relative overflow-hidden rounded-3xl p-5', tone.card)}>
            <div aria-hidden className="absolute -right-12 -top-12 size-40 rounded-full bg-white/15" />
            <div className="relative flex flex-wrap items-center gap-2 text-sm">
              <Pill className="bg-black/10">{accessTypes[vault.access].label}</Pill>
              <Pill className="bg-black/10">{vault.apy.toFixed(2)}% interest</Pill>
              {vault.lockedUntil && (
                <Pill className="bg-black/80 text-white">
                  <Lock className="size-3" aria-hidden /> Locked
                </Pill>
              )}
            </div>
            <p id="vault-balance" className="relative mt-4 text-sm opacity-80">
              Saved so far
            </p>
            <p className="tabular relative font-mono text-4xl font-semibold tracking-tight">{show(vault.balance)}</p>
            <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-black/10">
              <div className={cn('h-full rounded-full transition-all', tone.bar)} style={{ width: `${pct}%` }} />
            </div>
            <p className="relative mt-2 text-sm opacity-80">
              {Math.round(pct)}% of {show(vault.goal)} · earning ~{show((vault.balance * vault.apy) / 100)} a year
            </p>
          </section>

          <div className="grid grid-cols-3 gap-2">
            {actions.map(({ label, icon: Icon, run, primary, disabled }) => (
              <button
                key={label}
                type="button"
                onClick={run}
                disabled={disabled}
                className={cn(
                  'flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl text-sm font-medium disabled:opacity-40',
                  primary ? 'bg-primary text-primary-foreground' : 'bg-card',
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </button>
            ))}
          </div>

          {(blocked || vault.access === 'select') && (
            <p role="status" className="-mt-2 flex items-start gap-2 rounded-2xl bg-card p-4 text-sm">
              {vault.lockedUntil ? <Lock className="mt-0.5 size-4 shrink-0" aria-hidden /> : <Target className="mt-0.5 size-4 shrink-0" aria-hidden />}
              <span>
                {vault.lockedUntil
                  ? `Locked until ${vault.lockedUntil}. You can still add money.`
                  : blocked
                    ? `${blocked}. Withdrawals reset on Jan 1.`
                    : `${withdrawalsLeft} of ${SELECT_WITHDRAWALS_PER_YEAR} withdrawals left this year.`}
              </span>
            </p>
          )}

          <section aria-labelledby="access-h" className="flex flex-col gap-3">
            <SectionHeader
              id="access-h"
              title="Access & rate"
              action={<Pill className="bg-accent text-accent-foreground">{tier.name} tier +{tier.bonus.toFixed(2)}%</Pill>}
            />
            <div className="rounded-3xl bg-card p-4">
              <AccessPicker
                value={vault.access}
                bonus={tier.bonus}
                disabled={Boolean(vault.lockedUntil)}
                onChange={(access) => {
                  dispatch({ type: 'vaultPatch', vaultId: vault.id, patch: { access } })
                  notify(`${vault.name} is now ${accessTypes[access].label}`)
                }}
              />
              {vault.lockedUntil && <p className="mt-3 text-xs text-muted-foreground">Unlock it to change how you access your money.</p>}
            </div>
          </section>

          <VaultHabits vault={vault} />
          <VaultBills vault={vault} />

          <section aria-labelledby="vault-manage-h" className="flex flex-col gap-3">
            <SectionHeader id="vault-manage-h" title="Manage" />
            <ul className="divide-y overflow-hidden rounded-3xl bg-card">
              <ManageLink icon={Pencil} label="Rename vault" onClick={() => setSheet('name')} />
              <ManageLink icon={Target} label={`Change goal · ${show(vault.goal)}`} onClick={() => setSheet('goal')} />
              <ManageLink
                icon={XCircle}
                label={vault.lockedUntil ? 'Close vault · unlock first' : 'Close vault'}
                destructive
                disabled={Boolean(vault.lockedUntil)}
                onClick={() => setSheet('close')}
              />
            </ul>
          </section>
        </div>
      </OverlayFrame>

      {sheet === 'add' && <AddMoneySheet vault={vault} onClose={() => setSheet(null)} />}
      {sheet === 'withdraw' && <WithdrawSheet vault={vault} onClose={() => setSheet(null)} />}
      {sheet === 'lock' && <LockSheet vault={vault} onClose={() => setSheet(null)} />}
      {(sheet === 'name' || sheet === 'goal') && <EditVaultSheet vault={vault} field={sheet} onClose={() => setSheet(null)} />}
      {sheet === 'close' && <CloseVaultSheet vault={vault} onClose={() => setSheet(null)} />}
    </>
  )
}

function ManageLink({
  icon: Icon,
  label,
  onClick,
  destructive,
  disabled,
}: {
  icon: typeof Pencil
  label: string
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn('flex min-h-14 w-full items-center gap-3 px-4 text-left font-medium disabled:opacity-40', destructive && 'text-destructive')}
      >
        <Icon className="size-5" aria-hidden />
        {label}
      </button>
    </li>
  )
}
