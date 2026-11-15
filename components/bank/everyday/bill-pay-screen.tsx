'use client'

import { useState } from 'react'
import { CalendarClock, Check, Plus, Repeat, Zap } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import type { Payee } from '@/lib/everyday-data'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { BottomSheet, Field, OverlayFrame, PrimaryButton, inputClass } from '../overlay'
import { SectionHeader, Switch } from '../primitives'
import { MerchantLogo } from '../transactions/merchant-logo'

function dueLabel(days: number) {
  if (days <= 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days} days`
}

function dateIn(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function BillPayScreen() {
  const { payees, scheduledBills, accounts, dispatch, notify } = useBank()
  const [paying, setPaying] = useState<Payee | null>(null)
  const [adding, setAdding] = useState(false)
  const checking = accounts.find((a) => a.id === 'chk')
  const unpaid = payees.filter((p) => !p.paid).sort((a, b) => a.dueIn - b.dueIn)
  const dueThisWeek = unpaid.filter((p) => p.dueIn <= 7).reduce((s, p) => s + p.amountDue, 0)

  return (
    <OverlayFrame title="Pay bills" onBack={() => dispatch({ type: 'overlay', overlay: null })}>
      <div className="flex flex-col gap-6 px-5">
        <section className="rounded-[14px] bg-forest p-5 text-forest-foreground">
          <p className="text-sm text-forest-foreground/75">Due in the next 7 days</p>
          <p className="mt-1 text-[34px] font-semibold leading-none tracking-tight tabular-nums">{formatMoney(dueThisWeek)}</p>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-forest-foreground/85">
            {unpaid.length === 0
              ? 'All caught up. Go treat yourself (responsibly).'
              : `You've got ${formatMoney(checking?.balance ?? 0)} in Everyday Checking, so you're comfortably covered.`}
          </p>
        </section>

        <section aria-labelledby="upcoming">
          <SectionHeader
            id="upcoming"
            title="Coming up"
            action={
              <button type="button" onClick={() => setAdding(true)} className="flex min-h-11 items-center gap-1 text-sm font-semibold text-primary">
                <Plus className="size-4" aria-hidden />
                Add payee
              </button>
            }
          />
          {unpaid.length === 0 ? (
            <p className="rounded-2xl bg-card p-5 text-center text-sm text-muted-foreground">Nothing due. Enjoy the quiet.</p>
          ) : (
            <ul className="flex flex-col divide-y overflow-hidden rounded-2xl bg-card">
              {unpaid.map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-4">
                  <MerchantLogo enrichment={{ name: p.name, domain: p.domain, brandColor: '#1a5336' }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className={cn('text-sm', p.dueIn <= 3 ? 'font-medium text-destructive' : 'text-muted-foreground')}>
                      {dueLabel(p.dueIn)} · {formatMoney(p.amountDue)}
                    </p>
                  </div>
                  {p.autopay ? (
                    <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                      <Repeat className="size-3" aria-hidden />
                      Autopay
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPaying(p)}
                      className="min-h-11 rounded-xl bg-shield px-4 text-sm font-semibold text-shield-foreground"
                    >
                      Pay
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {scheduledBills.length > 0 && (
          <section aria-labelledby="scheduled">
            <SectionHeader id="scheduled" title="Scheduled" />
            <ul className="flex flex-col divide-y overflow-hidden rounded-2xl bg-card">
              {scheduledBills.map((b) => {
                const payee = payees.find((p) => p.id === b.payeeId)
                return (
                  <li key={b.id} className="flex items-center gap-3 p-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-lime">
                      <CalendarClock className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{payee?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatMoney(b.amount)} on {b.date}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'cancelBill', id: b.id })
                        notify('Payment canceled. No harm, no fee.')
                      }}
                      className="min-h-11 px-2 text-sm font-semibold text-primary"
                    >
                      Cancel
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section aria-labelledby="autopay">
          <SectionHeader id="autopay" title="Autopay" />
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
            Set it once and we&apos;ll pay on the due date. We&apos;ll always give you a heads-up 3 days before.
          </p>
          <ul className="flex flex-col divide-y overflow-hidden rounded-2xl bg-card">
            {payees.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.category} · •••• {p.mask}
                  </p>
                </div>
                <Switch
                  checked={p.autopay}
                  label={`Autopay for ${p.name}`}
                  onChange={(on) => {
                    dispatch({ type: 'payeeAutopay', id: p.id, on })
                    notify(on ? `Autopay on for ${p.name}. One less thing to remember.` : `Autopay off for ${p.name}`)
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {paying && <PaySheet payee={paying} onClose={() => setPaying(null)} />}
      {adding && <AddPayeeSheet onClose={() => setAdding(false)} />}
    </OverlayFrame>
  )
}

function PaySheet({ payee, onClose }: { payee: Payee; onClose: () => void }) {
  const { dispatch, notify } = useBank()
  const [amount, setAmount] = useState(payee.amountDue.toFixed(2))
  const [when, setWhen] = useState<'now' | 'due'>('now')
  const value = Number(amount)
  const valid = Number.isFinite(value) && value > 0 && value <= 25000

  const pay = () => {
    if (!valid) return
    const date = when === 'due' ? dateIn(payee.dueIn) : null
    dispatch({ type: 'billPay', payeeId: payee.id, amount: Math.round(value * 100) / 100, date })
    notify(date ? `All set. We'll pay ${payee.name} on ${date}.` : `Paid! ${payee.name} gets it within 1 business day.`)
    onClose()
  }

  return (
    <BottomSheet title={`Pay ${payee.name}`} description={`Account •••• ${payee.mask}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Amount">
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-medium">When</legend>
          {(
            [
              { id: 'now', label: 'Today', note: 'Arrives in 1 business day', icon: Zap },
              { id: 'due', label: `On the due date · ${dateIn(payee.dueIn)}`, note: 'Keep your cash a little longer', icon: CalendarClock },
            ] as const
          ).map((o) => (
            <label
              key={o.id}
              className={cn(
                'flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border p-3',
                when === o.id && 'border-primary bg-accent/40',
              )}
            >
              <input type="radio" name="when" className="sr-only" checked={when === o.id} onChange={() => setWhen(o.id)} />
              <o.icon className="size-5 text-primary" aria-hidden />
              <span className="flex-1">
                <span className="block text-sm font-medium">{o.label}</span>
                <span className="block text-xs text-muted-foreground">{o.note}</span>
              </span>
              {when === o.id && <Check className="size-5 text-primary" aria-hidden />}
            </label>
          ))}
        </fieldset>
        <p className="text-xs text-muted-foreground">From TD Everyday Checking</p>
        <PrimaryButton onClick={pay} disabled={!valid}>
          {when === 'now' ? `Pay ${valid ? formatMoney(value) : ''}` : 'Schedule it'}
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}

function AddPayeeSheet({ onClose }: { onClose: () => void }) {
  const { dispatch, notify } = useBank()
  const [name, setName] = useState('')
  const [account, setAccount] = useState('')
  const [category, setCategory] = useState<Payee['category']>('Utilities')
  const valid = name.trim().length > 1 && /^\d{4,17}$/.test(account)

  const save = () => {
    if (!valid) return
    dispatch({
      type: 'addPayee',
      payee: {
        id: `p-${Date.now()}`,
        name: name.trim(),
        category,
        mask: account.slice(-4),
        amountDue: 0,
        dueIn: 30,
        autopay: false,
        paid: true,
      },
    })
    notify(`${name.trim()} added. Pay them anytime.`)
    onClose()
  }

  return (
    <BottomSheet title="Add a payee" description="Anyone who sends you a bill. Find the account number on your statement." onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Company name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Spectrum" />
        </Field>
        <Field label="Account number" hint="Numbers only">
          <input
            inputMode="numeric"
            value={account}
            onChange={(e) => setAccount(e.target.value.replace(/\D/g, ''))}
            className={inputClass}
          />
        </Field>
        <Field label="Type">
          <select value={category} onChange={(e) => setCategory(e.target.value as Payee['category'])} className={inputClass}>
            {(['Utilities', 'Phone & internet', 'Housing', 'Insurance', 'Other'] as const).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <PrimaryButton onClick={save} disabled={!valid}>
          Add payee
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}
