'use client'

import { useState } from 'react'
import { formatMoney, type Account } from '@/lib/bank-data'
import { STREET_SAFE_CAP, useBank } from '../bank-provider'
import { BottomSheet, Field, PrimaryButton, inputClass } from '../overlay'

export function TransferSheet({
  account,
  mode,
  onClose,
}: {
  account: Account
  mode: 'in' | 'out' | 'pay'
  onClose: () => void
}) {
  const { accounts, streetSafe, dispatch, notify } = useBank()
  const others = accounts.filter((a) => a.id !== account.id && (mode === 'in' ? a.kind !== 'credit' : true))
  const [otherId, setOtherId] = useState(others.find((a) => a.kind === 'checking')?.id ?? others[0]?.id ?? '')
  const statement = account.kind === 'credit' ? Math.abs(account.balance) : 0
  const minimum = Math.min(statement, Math.max(35, Math.round(statement * 0.02)))
  const [amount, setAmount] = useState(mode === 'pay' ? statement.toFixed(2) : '')

  const value = Number(amount)
  const source = mode === 'out' ? account : accounts.find((a) => a.id === otherId)
  const target = mode === 'out' ? accounts.find((a) => a.id === otherId) : account
  const available = source ? (source.kind === 'credit' ? (source.limit ?? 0) + source.balance : source.balance) : 0
  const overCap = streetSafe && value > STREET_SAFE_CAP
  const valid = value > 0 && value <= available && !!source && !!target && !overCap

  const title = mode === 'pay' ? 'Pay card' : mode === 'in' ? `Move money into ${account.name}` : `Move money out`

  function submit() {
    if (!valid || !source || !target) return
    dispatch({ type: 'transfer', from: source.id, to: target.id, amount: Math.round(value * 100) / 100 })
    notify(mode === 'pay' ? `${formatMoney(value)} payment scheduled` : `${formatMoney(value)} moved to ${target.name}`)
    onClose()
  }

  return (
    <BottomSheet title={title} description="Transfers between your TD accounts are instant and free." onClose={onClose}>
      <div className="flex flex-col gap-4">
        {mode === 'pay' && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Statement', v: statement },
              { label: 'Minimum', v: minimum },
              { label: 'Custom', v: null },
            ].map((o) => {
              const active = o.v === null ? ![statement, minimum].map((n) => n.toFixed(2)).includes(amount) : amount === o.v.toFixed(2)
              return (
                <button
                  key={o.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setAmount(o.v === null ? '' : o.v.toFixed(2))}
                  className={`flex min-h-16 flex-col items-start justify-center rounded-2xl border px-3 text-left ${active ? 'border-primary bg-accent' : 'bg-card'}`}
                >
                  <span className="text-xs text-muted-foreground">{o.label}</span>
                  <span className="tabular font-mono text-sm font-semibold">{o.v === null ? 'Other' : formatMoney(o.v)}</span>
                </button>
              )
            })}
          </div>
        )}

        <Field label={mode === 'out' ? 'To' : 'From'}>
          <select value={otherId} onChange={(e) => setOtherId(e.target.value)} className={inputClass}>
            {others.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ••{a.mask} · {formatMoney(a.kind === 'credit' ? (a.limit ?? 0) + a.balance : a.balance)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Amount" hint={`Available: ${formatMoney(available)}${streetSafe ? ` · Street Safe cap ${formatMoney(STREET_SAFE_CAP)}` : ''}`}>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            placeholder="0.00"
            className={`${inputClass} tabular font-mono`}
            aria-invalid={value > 0 && !valid}
          />
        </Field>
        {overCap && <p className="-mt-2 text-sm text-destructive">Street Safe limits transfers to {formatMoney(STREET_SAFE_CAP)}.</p>}
        {value > available && <p className="-mt-2 text-sm text-destructive">That&apos;s more than is available.</p>}

        <PrimaryButton onClick={submit} disabled={!valid}>
          {mode === 'pay' ? `Pay ${value > 0 ? formatMoney(value) : ''}` : `Move ${value > 0 ? formatMoney(value) : ''}`}
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}
