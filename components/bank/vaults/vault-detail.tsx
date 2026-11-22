'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Lock, LockOpen, Pencil, Target, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney, type Vault } from '@/lib/bank-data'
import { SELECT_WITHDRAWALS_PER_YEAR, accessTypes, tierFor, vaultTotal, withdrawBlock } from '@/lib/vaults'
import { useBank } from '../bank-provider'
import { BottomSheet, OverlayFrame } from '../overlay'
import { Pill, SectionHeader } from '../primitives'
import { VaultBills, VaultHabits } from './vault-habits'
import { EditableVaultPicture } from './vault-picture'
import { AccessPicker, AddMoneySheet, CloseVaultSheet, EditVaultSheet, LockSheet, WithdrawSheet } from './vault-sheets'

type Sheet = null | 'add' | 'withdraw' | 'manage' | 'lock' | 'name' | 'goal' | 'close'

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
  const regular = vault.kind === 'regular'
  const withdrawalsLeft = SELECT_WITHDRAWALS_PER_YEAR - vault.withdrawalsUsed

  const actions = [
    { label: 'Add money', icon: ArrowDownLeft, run: () => setSheet('add'), primary: true, disabled: false },
    { label: 'Withdraw', icon: ArrowUpRight, run: () => setSheet('withdraw'), disabled: Boolean(blocked) || vault.balance <= 0 },
    { label: 'Edit', icon: Pencil, run: () => setSheet('manage'), disabled: false },
  ]

  return (
    <>
      <OverlayFrame title={vault.name} onBack={() => dispatch({ type: 'openVault', id: null })}>
        <div className="flex flex-col gap-5 px-4">
          <section aria-labelledby="vault-balance" className={cn('relative overflow-hidden rounded-3xl p-5', tone.card)}>
            <EditableVaultPicture
              photo={vault.photo}
              kind={vault.kind ?? 'savings'}
              alt={vault.photo ? `Picture for ${vault.name}` : vault.kind === 'regular' ? 'A card and coins' : 'A family'}
              onChange={(photo) => {
                dispatch({ type: 'vaultPatch', vaultId: vault.id, patch: { photo } })
                notify('Picture updated')
              }}
              className="-mx-5 -mt-5 mb-4"
              frameClassName="h-44"
            />
            <div className="relative flex flex-wrap items-center gap-2 text-sm">
              {regular ? (
                <Pill className="bg-black/10">Regular Vault · Everyday Checking</Pill>
              ) : (
                <>
                  <Pill className="bg-black/10">{accessTypes[vault.access].label}</Pill>
                  <Pill className="bg-black/10">{vault.apy.toFixed(2)}% interest</Pill>
                </>
              )}
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
              {Math.round(pct)}% of {show(vault.goal)}
              {regular ? ' · set aside from Everyday Checking' : ` · earning ~${show((vault.balance * vault.apy) / 100)} a year`}
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

          <VaultHabits vault={vault} />

          {!regular && (
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
          )}

          <VaultBills vault={vault} />
        </div>
      </OverlayFrame>

      {sheet === 'add' && <AddMoneySheet vault={vault} onClose={() => setSheet(null)} />}
      {sheet === 'withdraw' && <WithdrawSheet vault={vault} onClose={() => setSheet(null)} />}
      {sheet === 'manage' && (
        <ManageSheet
          vault={vault}
          onClose={() => setSheet(null)}
          onPick={(next) => setSheet(next)}
          goalLabel={show(vault.goal)}
        />
      )}
      {sheet === 'lock' && <LockSheet vault={vault} onClose={() => setSheet(null)} />}
      {(sheet === 'name' || sheet === 'goal') && <EditVaultSheet vault={vault} field={sheet} onClose={() => setSheet(null)} />}
      {sheet === 'close' && <CloseVaultSheet vault={vault} onClose={() => setSheet(null)} />}
    </>
  )
}

function ManageSheet({
  vault,
  goalLabel,
  onPick,
  onClose,
}: {
  vault: Vault
  goalLabel: string
  onPick: (next: 'lock' | 'name' | 'goal' | 'close') => void
  onClose: () => void
}) {
  return (
    <BottomSheet title={`Manage ${vault.name}`} onClose={onClose}>
      <ul className="divide-y overflow-hidden rounded-2xl bg-card">
        <ManageLink
          icon={vault.lockedUntil ? LockOpen : Lock}
          label={vault.lockedUntil ? 'Unlock vault' : 'Lock vault'}
          detail={vault.lockedUntil ? `Locked until ${vault.lockedUntil}` : 'Keep money in until a date you choose'}
          onClick={() => onPick('lock')}
        />
        <ManageLink icon={Pencil} label="Rename vault" detail={vault.name} onClick={() => onPick('name')} />
        <ManageLink icon={Target} label="Change goal" detail={goalLabel} onClick={() => onPick('goal')} />
        <ManageLink
          icon={XCircle}
          label="Close vault"
          detail={vault.lockedUntil ? 'Unlock it first' : 'Move the money back to checking'}
          destructive
          disabled={Boolean(vault.lockedUntil)}
          onClick={() => onPick('close')}
        />
      </ul>
    </BottomSheet>
  )
}

function ManageLink({
  icon: Icon,
  label,
  detail,
  onClick,
  destructive,
  disabled,
}: {
  icon: typeof Pencil
  label: string
  detail?: string
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
        className={cn('flex min-h-16 w-full items-center gap-3 px-4 py-2 text-left disabled:opacity-40', destructive && 'text-destructive')}
      >
        <Icon className="size-5 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{label}</span>
          {detail && <span className={cn('block truncate text-xs', destructive ? 'text-destructive/80' : 'text-muted-foreground')}>{detail}</span>}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
    </li>
  )
}
