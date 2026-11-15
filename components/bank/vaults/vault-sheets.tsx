'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney, type Vault } from '@/lib/bank-data'
import { SELECT_WITHDRAWALS_PER_YEAR, accessTypes, lockOptions, tierFor, vaultTotal } from '@/lib/vaults'
import { useBank } from '../bank-provider'
import { BottomSheet, Field, PrimaryButton, inputClass } from '../overlay'

function parseAmount(v: string) {
  const n = Number(v.replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}

export function ChoiceChips<T extends string | number>({
  options,
  value,
  onChange,
  label,
  format = (v) => String(v),
}: {
  options: readonly T[]
  value: T | null
  onChange: (v: T) => void
  label: string
  format?: (v: T) => string
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-2">
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={cn(
            'h-11 flex-1 rounded-xl border text-sm font-semibold',
            value === o ? 'border-shield bg-shield-50 text-shield-700' : 'bg-card',
          )}
        >
          {format(o)}
        </button>
      ))}
    </div>
  )
}

function AmountField({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <Field label={label}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, 'tabular pl-7 font-mono')}
        />
      </div>
    </Field>
  )
}

const quickAmounts = [25, 50, 100, 250] as const

export function AddMoneySheet({ vault, onClose }: { vault: Vault; onClose: () => void }) {
  const { accounts, dispatch, notify } = useBank()
  const [value, setValue] = useState('100')
  const amount = parseAmount(value)
  const checking = accounts.find((a) => a.id === 'chk')
  const tooMuch = amount > (checking?.balance ?? 0)
  const preset = quickAmounts.find((n) => n === amount) ?? null
  return (
    <BottomSheet
      title={`Add to ${vault.name}`}
      description={`From ${checking?.name ?? 'checking'} · ${formatMoney(checking?.balance ?? 0)} available`}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <ChoiceChips label="Quick amounts" options={quickAmounts} value={preset} onChange={(n) => setValue(String(n))} format={(n) => `$${n}`} />
        <AmountField label="Amount" value={value} onChange={setValue} />
        {tooMuch && <p className="text-sm text-destructive">That&apos;s more than your checking balance.</p>}
        <PrimaryButton
          disabled={amount <= 0 || tooMuch}
          onClick={() => {
            dispatch({ type: 'vaultTransfer', vaultId: vault.id, amount })
            notify(`${formatMoney(amount)} added to ${vault.name}`)
            onClose()
          }}
        >
          Add {formatMoney(amount)}
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}

export function WithdrawSheet({ vault, onClose }: { vault: Vault; onClose: () => void }) {
  const { dispatch, notify } = useBank()
  const [value, setValue] = useState(String(Math.min(200, vault.balance)))
  const amount = parseAmount(value)
  const left = SELECT_WITHDRAWALS_PER_YEAR - vault.withdrawalsUsed
  return (
    <BottomSheet
      title={`Withdraw from ${vault.name}`}
      description={`${formatMoney(vault.balance)} in this vault · lands in checking instantly`}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <AmountField label="Amount" value={value} onChange={setValue} />
        <button type="button" onClick={() => setValue(String(vault.balance))} className="-mt-2 self-start text-sm font-medium text-primary">
          Withdraw everything
        </button>
        {vault.access === 'select' && (
          <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
            {left === 1
              ? 'This is your last Select Access withdrawal from this vault this year.'
              : `Select Access vault: this uses 1 of your ${left} withdrawals left this year.`}
          </p>
        )}
        <PrimaryButton
          disabled={amount <= 0 || amount > vault.balance}
          onClick={() => {
            dispatch({ type: 'vaultWithdraw', vaultId: vault.id, amount })
            notify(`${formatMoney(amount)} moved to checking`)
            onClose()
          }}
        >
          Withdraw {formatMoney(amount)}
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}

export function LockSheet({ vault, onClose }: { vault: Vault; onClose: () => void }) {
  const { dispatch, notify } = useBank()
  const [choice, setChoice] = useState<(typeof lockOptions)[number]['id']>('3m')

  if (vault.lockedUntil) {
    return (
      <BottomSheet
        title="Unlock this vault early?"
        description={`Locked until ${vault.lockedUntil}. Unlocking lets you withdraw and close it again.`}
        onClose={onClose}
      >
        <div className="flex flex-col gap-2">
          <PrimaryButton
            onClick={() => {
              dispatch({ type: 'vaultPatch', vaultId: vault.id, patch: { lockedUntil: null } })
              notify(`${vault.name} unlocked`)
              onClose()
            }}
          >
            Unlock now
          </PrimaryButton>
          <button type="button" onClick={onClose} className="h-12 rounded-xl font-medium">
            Keep it locked
          </button>
        </div>
      </BottomSheet>
    )
  }

  const until = lockOptions.find((o) => o.id === choice)?.until ?? ''
  return (
    <BottomSheet
      title={`Lock ${vault.name}`}
      description="You can still add money. Withdrawals and closing are paused until the date you pick."
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="sr-only">Lock for</legend>
          {lockOptions.map((o) => (
            <label
              key={o.id}
              className={cn(
                'flex min-h-16 cursor-pointer flex-col justify-center rounded-2xl border bg-card px-4 py-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
                choice === o.id && 'border-shield bg-shield-50',
              )}
            >
              <input type="radio" name="lock-for" className="sr-only" checked={choice === o.id} onChange={() => setChoice(o.id)} />
              <span className="font-semibold">{o.label}</span>
              <span className="text-xs text-muted-foreground">Until {o.until}</span>
            </label>
          ))}
        </fieldset>
        <PrimaryButton
          onClick={() => {
            dispatch({ type: 'vaultPatch', vaultId: vault.id, patch: { lockedUntil: until } })
            notify(`${vault.name} locked until ${until}`)
            onClose()
          }}
        >
          <Lock className="size-4" aria-hidden /> Lock until {until}
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}

export function EditVaultSheet({ vault, field, onClose }: { vault: Vault; field: 'name' | 'goal'; onClose: () => void }) {
  const { dispatch, notify } = useBank()
  const [value, setValue] = useState(field === 'name' ? vault.name : String(vault.goal))
  const valid = field === 'name' ? value.trim().length > 0 : parseAmount(value) > 0
  const save = () => {
    if (!valid) return
    dispatch({
      type: 'vaultPatch',
      vaultId: vault.id,
      patch: field === 'name' ? { name: value.trim().slice(0, 28) } : { goal: parseAmount(value) },
    })
    notify(field === 'name' ? 'Vault renamed' : 'Goal updated')
    onClose()
  }
  return (
    <BottomSheet title={field === 'name' ? 'Rename vault' : 'Change goal'} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {field === 'name' ? (
          <Field label="Vault name">
            <input
              value={value}
              maxLength={28}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) save()
              }}
              className={inputClass}
            />
          </Field>
        ) : (
          <AmountField label="Goal" value={value} onChange={setValue} />
        )}
        <PrimaryButton disabled={!valid} onClick={save}>
          Save
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}

export function CloseVaultSheet({ vault, onClose }: { vault: Vault; onClose: () => void }) {
  const { dispatch, notify } = useBank()
  return (
    <BottomSheet
      title={`Close ${vault.name}?`}
      description={`${formatMoney(vault.balance)} moves to checking. Round-ups, Salary Sorter and bills linked to this vault stop.`}
      onClose={onClose}
    >
      <div className="flex flex-col gap-2">
        <PrimaryButton
          className="bg-destructive text-white"
          onClick={() => {
            dispatch({ type: 'vaultClose', vaultId: vault.id })
            notify(`${vault.name} closed`)
          }}
        >
          Close vault
        </PrimaryButton>
        <button type="button" onClick={onClose} className="h-12 rounded-xl font-medium">
          Keep it
        </button>
      </div>
    </BottomSheet>
  )
}

const tones: Vault['tone'][] = ['lime', 'green', 'sky', 'ink']

export function CreateVaultSheet({ onClose }: { onClose: () => void }) {
  const { vaults, dispatch, notify } = useBank()
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('5000')
  const [access, setAccess] = useState<Vault['access']>('instant')
  const { tier } = tierFor(vaultTotal(vaults))
  const valid = name.trim().length > 0 && parseAmount(goal) > 0

  const create = () => {
    if (!valid) return
    dispatch({
      type: 'vaultCreate',
      vault: {
        id: `v-${Date.now()}`,
        name: name.trim().slice(0, 28),
        balance: 0,
        goal: parseAmount(goal),
        apy: 0,
        tone: tones[vaults.length % tones.length],
        access,
        withdrawalsUsed: 0,
        lockedUntil: null,
        salarySort: 0,
        billPayeeIds: [],
      },
    })
    notify(`${name.trim()} vault created`)
    onClose()
  }

  return (
    <BottomSheet title="New vault" description="Give it a name and a goal. You can change both later." onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Name">
          <input
            value={name}
            maxLength={28}
            placeholder="New car, wedding, laptop…"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) create()
            }}
            className={inputClass}
          />
        </Field>
        <AmountField label="Goal" value={goal} onChange={setGoal} />
        <AccessPicker value={access} onChange={setAccess} bonus={tier.bonus} />
        <PrimaryButton disabled={!valid} onClick={create}>
          Create vault
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}

export function AccessPicker({
  value,
  onChange,
  bonus,
  disabled,
}: {
  value: Vault['access']
  onChange: (v: Vault['access']) => void
  bonus: number
  disabled?: boolean
}) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="mb-2 text-sm font-medium">Access type</legend>
      {(['instant', 'select'] as const).map((id) => {
        const a = accessTypes[id]
        return (
          <label
            key={id}
            className={cn(
              'flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border bg-card px-4 py-3 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
              value === id && 'border-shield bg-shield-50',
            )}
          >
            <input
              type="radio"
              name="vault-access"
              checked={value === id}
              onChange={() => onChange(id)}
              className="size-5 accent-[var(--primary)]"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{a.label}</span>
              <span className="block text-xs text-muted-foreground">{a.detail}</span>
            </span>
            <span className="tabular font-mono font-semibold">{(a.rate + bonus).toFixed(2)}%</span>
          </label>
        )
      })}
    </fieldset>
  )
}
