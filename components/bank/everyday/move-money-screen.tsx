'use client'

import { useState } from 'react'
import { ArrowRight, ArrowUpDown, CheckCircle2, ShieldCheck } from 'lucide-react'
import { formatMoney, type Account } from '@/lib/bank-data'
import { cn } from '@/lib/utils'
import { STREET_SAFE_CAP, useBank } from '../bank-provider'
import { Confetti } from '../celebrate'
import { Field, OverlayFrame, PrimaryButton, inputClass } from '../overlay'

const quickAmounts = [50, 100, 250]

const spendable = (a: Account) => (a.kind === 'credit' ? (a.limit ?? 0) + a.balance : a.balance)

export function MoveMoneyScreen() {
  const { accounts, streetSafe, dispatch, notify } = useBank()
  const sources = accounts.filter((a) => a.kind !== 'credit')
  const defaultFromId = sources.find((a) => a.kind === 'checking')?.id ?? sources[0]?.id ?? ''
  const [fromId, setFromId] = useState(defaultFromId)
  const [toId, setToId] = useState(
    accounts.find((a) => a.id !== defaultFromId && a.kind === 'savings')?.id ?? accounts.find((a) => a.id !== defaultFromId)?.id ?? '',
  )
  const [amount, setAmount] = useState('')
  const [done, setDone] = useState<{ amount: number; fromId: string; toId: string } | null>(null)

  const close = () => dispatch({ type: 'overlay', overlay: null })
  const from = accounts.find((a) => a.id === fromId)
  const to = accounts.find((a) => a.id === toId)
  const targets = accounts.filter((a) => a.id !== fromId)
  const available = from ? spendable(from) : 0
  const value = Number(amount)
  const hasValue = Number.isFinite(value) && value > 0
  const overCap = streetSafe && hasValue && value > STREET_SAFE_CAP
  const overBalance = hasValue && value > available
  const valid = hasValue && !!from && !!to && !overCap && !overBalance
  const canSwap = !!to && to.kind !== 'credit'

  const pickFrom = (id: string) => {
    setFromId(id)
    if (id === toId) setToId(accounts.find((a) => a.id !== id)?.id ?? '')
  }
  const swap = () => {
    if (!canSwap) return
    setFromId(toId)
    setToId(fromId)
  }

  const submit = () => {
    if (!valid || !from || !to) return
    const rounded = Math.round(value * 100) / 100
    dispatch({ type: 'transfer', from: from.id, to: to.id, amount: rounded })
    notify(`${formatMoney(rounded)} moved to ${to.name}`)
    setDone({ amount: rounded, fromId: from.id, toId: to.id })
  }

  if (done) {
    const doneFrom = accounts.find((a) => a.id === done.fromId)
    const doneTo = accounts.find((a) => a.id === done.toId)
    return (
      <OverlayFrame title="Move money" onBack={close}>
        <Confetti count={40} />
        <div className="flex flex-col items-center gap-4 px-6 pt-14 text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-muted text-lime">
            <CheckCircle2 className="size-10" aria-hidden />
          </span>
          <h2 className="text-balance text-[28px] font-semibold leading-tight tracking-tight">
            {formatMoney(done.amount)} moved to {doneTo?.name}
          </h2>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">It&apos;s there now. No waiting, no fees.</p>
          <dl className="w-full divide-y overflow-hidden rounded-2xl bg-card text-left text-sm">
            {[doneFrom, doneTo].map((a) =>
              a ? (
                <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <dt className="text-muted-foreground">
                    {a.name} ••{a.mask}
                  </dt>
                  <dd className="tabular font-mono font-semibold">{streetSafe ? '••••' : formatMoney(a.balance)}</dd>
                </div>
              ) : null,
            )}
          </dl>
          <div className="mt-2 flex w-full flex-col gap-2">
            <PrimaryButton onClick={close}>Done</PrimaryButton>
            <button
              type="button"
              onClick={() => {
                setDone(null)
                setAmount('')
              }}
              className="h-12 rounded-xl font-semibold text-primary"
            >
              Move more
            </button>
          </div>
        </div>
      </OverlayFrame>
    )
  }

  return (
    <OverlayFrame title="Move money" onBack={close}>
      <div className="flex flex-col gap-5 px-5">
        <h2 className="text-balance text-2xl font-semibold tracking-tight">Move money between your accounts.</h2>

        <div className="flex flex-col gap-2">
          <Field label="From" hint={from ? `Available: ${streetSafe ? '••••' : formatMoney(available)}` : undefined}>
            <select value={fromId} onChange={(e) => pickFrom(e.target.value)} className={inputClass}>
              {sources.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ••{a.mask} · {streetSafe ? '••••' : formatMoney(a.balance)}
                </option>
              ))}
            </select>
          </Field>

          <button
            type="button"
            onClick={swap}
            disabled={!canSwap}
            aria-label="Swap accounts"
            className="mx-auto flex size-11 items-center justify-center rounded-full border bg-card text-primary disabled:opacity-40"
          >
            <ArrowUpDown className="size-5" aria-hidden />
          </button>

          <Field label="To">
            <select value={toId} onChange={(e) => setToId(e.target.value)} className={inputClass}>
              {targets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ••{a.mask} · {streetSafe ? '••••' : formatMoney(a.kind === 'credit' ? Math.abs(a.balance) : a.balance)}
                  {a.kind === 'credit' ? ' owed' : ''}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Amount">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            placeholder="0.00"
            aria-invalid={hasValue && !valid}
            className={cn(inputClass, 'tabular font-mono text-2xl')}
          />
        </Field>
        <div role="group" aria-label="Quick amounts" className="-mt-2 grid grid-cols-4 gap-2">
          {quickAmounts.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAmount(String(n))}
              disabled={n > available}
              className="min-h-11 rounded-xl border bg-card text-sm font-semibold disabled:opacity-40"
            >
              ${n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAmount(available > 0 ? available.toFixed(2) : '')}
            disabled={available <= 0}
            className="min-h-11 rounded-xl border bg-card text-sm font-semibold disabled:opacity-40"
          >
            All
          </button>
        </div>

        {overCap && (
          <p role="alert" className="flex gap-2 rounded-2xl bg-accent/60 p-3 text-sm text-accent-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            Street Safe is on, so transfers are capped at {formatMoney(STREET_SAFE_CAP)}.
          </p>
        )}
        {overBalance && !overCap && (
          <p role="alert" className="text-sm text-destructive">
            That&apos;s more than the {formatMoney(available)} available.
          </p>
        )}

        <dl className="divide-y overflow-hidden rounded-2xl bg-card text-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <dt className="text-muted-foreground">Arrives</dt>
            <dd className="font-medium">Instantly</dd>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <dt className="text-muted-foreground">Fee</dt>
            <dd className="font-medium">$0.00</dd>
          </div>
        </dl>

        <PrimaryButton onClick={submit} disabled={!valid} className="flex items-center justify-center gap-2">
          {hasValue ? `Move ${formatMoney(value)}` : 'Move money'} <ArrowRight className="size-4" aria-hidden />
        </PrimaryButton>
      </div>
    </OverlayFrame>
  )
}
