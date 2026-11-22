'use client'

import { useState } from 'react'
import { Check, CircleCheckBig, CreditCard, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/bank-data'
import { useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { BottomSheet, PrimaryButton } from '../overlay'
import { Switch } from '../primitives'

const reasons = [
  { id: 'unauthorized', label: "I didn't make these purchases" },
  { id: 'scam', label: 'I was tricked into paying' },
  { id: 'lost', label: 'My card was lost or stolen' },
  { id: 'takeover', label: 'Someone got into my account' },
]

export function ReportFraudSheet({ onClose, preselect }: { onClose: () => void; preselect?: string }) {
  const { transactions, customerType, dispatch: bankDispatch, notify } = useBank()
  const { dispatch } = useTrust()
  const debits = transactions.filter((t) => t.amount < 0 && (customerType === 'new' || t.category !== 'Transfer')).slice(0, 8)
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<string[]>(preselect ? [preselect] : [])
  const [reason, setReason] = useState<string | null>(null)
  const [lock, setLock] = useState(true)
  const [signOut, setSignOut] = useState(true)
  const [caseId, setCaseId] = useState<string | null>(null)
  const [newCard, setNewCard] = useState<string | null>(null)
  const [declinedCard, setDeclinedCard] = useState(false)

  const total = debits.filter((t) => selected.includes(t.id)).reduce((s, t) => s + Math.abs(t.amount), 0)
  const steps = ['Transactions', 'What happened', 'Protect', 'Review']

  function submit() {
    const id = `TD-${Math.floor(100000 + Math.random() * 899999)}`
    if (lock) bankDispatch({ type: 'freeze', frozen: true })
    if (signOut) dispatch({ type: 'removeDevice', id: 'd3' })
    dispatch({
      type: 'openCase',
      fraudCase: {
        id,
        transactionIds: selected,
        reason: reasons.find((r) => r.id === reason)?.label ?? 'Fraud',
        amount: total,
        stage: 1,
        openedAt: 'just now',
      },
    })
    notify(`Case ${id} opened · ${formatMoney(total)} credited back`)
    setCaseId(id)
  }

  function reissueCard() {
    const last4 = String(Math.floor(1000 + Math.random() * 9000))
    bankDispatch({ type: 'reissueCard', last4 })
    setNewCard(last4)
    notify(`New card •••• ${last4} added to Apple Wallet`)
  }

  if (caseId) {
    return (
      <BottomSheet title="You're protected" onClose={onClose}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <CircleCheckBig className="size-14 text-primary" aria-hidden />
          <p className="text-lg font-semibold">Case {caseId}</p>
          <ul className="flex w-full flex-col gap-2 text-left text-sm">
            {[
              lock && !newCard && 'Card locked',
              newCard && `New card •••• ${newCard} issued and added to Apple Wallet. Plastic arrives in 2 days`,
              newCard && 'Your old card number stays locked for good',
              signOut && 'Unrecognized devices signed out',
              `${formatMoney(total)} temporary credit posted`,
            ]
              .filter(Boolean)
              .map((line) => (
                <li key={String(line)} className="flex gap-2 rounded-2xl bg-card p-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {line}
                </li>
              ))}
          </ul>
        </div>
        {lock && !newCard && !declinedCard && (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-primary/35 bg-accent p-4 text-accent-foreground">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <CreditCard className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold leading-tight">Get a new card right now</p>
                <p className="mt-0.5 text-sm text-accent-foreground/80">
                  Your card is locked, so you’re protected. We can issue a new one right now and add it to your wallet so you can keep paying.
                </p>
              </div>
            </div>
            <PrimaryButton onClick={reissueCard} className="flex items-center justify-center gap-2">
              <Smartphone className="size-4" aria-hidden /> Issue &amp; add to Apple Wallet
            </PrimaryButton>
            <button type="button" onClick={() => setDeclinedCard(true)} className="min-h-11 text-sm font-semibold">
              Not now
            </button>
          </div>
        )}
        <PrimaryButton className="mt-5" onClick={onClose}>
          Track my case
        </PrimaryButton>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet title="Report fraud" description={`Step ${step + 1} of 4 · ${steps[step]}`} onClose={onClose}>
      <div className="mb-4 grid grid-cols-4 gap-1" aria-hidden>
        {steps.map((s, i) => (
          <span key={s} className={cn('h-1 rounded-full', i <= step ? 'bg-primary' : 'bg-muted')} />
        ))}
      </div>

      {step === 0 && (
        <fieldset>
          <legend className="mb-2 text-sm text-muted-foreground">Select every charge you don&apos;t recognize.</legend>
          <ul className="divide-y overflow-hidden rounded-2xl bg-card">
            {debits.map((t) => {
              const on = selected.includes(t.id)
              return (
                <li key={t.id}>
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2">
                    <input
                      type="checkbox"
                      className="size-5 accent-[var(--primary)]"
                      checked={on}
                      onChange={() => setSelected((s) => (on ? s.filter((x) => x !== t.id) : [...s, t.id]))}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{t.merchant}</span>
                      <span className="block text-xs text-muted-foreground">{t.when}</span>
                    </span>
                    <span className="tabular font-mono text-sm font-semibold">{formatMoney(t.amount)}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </fieldset>
      )}

      {step === 1 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">What happened</legend>
          {reasons.map((r) => (
            <label
              key={r.id}
              className={cn(
                'flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4',
                reason === r.id ? 'border-primary bg-accent' : 'border-transparent bg-card',
              )}
            >
              <input
                type="radio"
                name="reason"
                className="size-5 accent-[var(--primary)]"
                checked={reason === r.id}
                onChange={() => setReason(r.id)}
              />
              <span className="font-medium">{r.label}</span>
            </label>
          ))}
        </fieldset>
      )}

      {step === 2 && (
        <ul className="divide-y overflow-hidden rounded-2xl bg-card">
          {[
            { label: 'Lock my card now', body: 'Stops new purchases instantly', value: lock, set: setLock },
            { label: 'Sign out unrecognized devices', body: 'Windows PC · Newark, NJ', value: signOut, set: setSignOut },
          ].map((o) => (
            <li key={o.label} className="flex min-h-16 items-center gap-3 px-4 py-2">
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{o.label}</span>
                <span className="block text-xs text-muted-foreground">{o.body}</span>
              </span>
              <Switch checked={o.value} label={o.label} onChange={o.set} />
            </li>
          ))}
        </ul>
      )}

      {step === 3 && (
        <dl className="flex flex-col gap-3 rounded-2xl bg-card p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Disputed</dt>
            <dd className="font-medium">
              {selected.length} charge{selected.length === 1 ? '' : 's'} · {formatMoney(total)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Reason</dt>
            <dd className="text-right font-medium">{reasons.find((r) => r.id === reason)?.label}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Temporary credit</dt>
            <dd className="font-medium text-primary">Today</dd>
          </div>
          <p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
            By submitting, you confirm these charges weren&apos;t made by you or someone you authorized. You&apos;re covered by TD&apos;s $0 liability guarantee.
          </p>
        </dl>
      )}

      <div className="mt-5 flex gap-2">
        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="h-12 rounded-xl px-5 font-semibold">
            Back
          </button>
        )}
        <PrimaryButton
          disabled={(step === 0 && selected.length === 0) || (step === 1 && !reason)}
          onClick={() => (step < 3 ? setStep((s) => s + 1) : submit())}
        >
          {step < 3 ? 'Continue' : 'Submit report'}
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}
