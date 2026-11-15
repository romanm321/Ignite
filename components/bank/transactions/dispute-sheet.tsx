'use client'

import { useState } from 'react'
import { Check, CircleCheck, Lightbulb, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney, type Transaction } from '@/lib/bank-data'
import { disputeReasons, type DisputeReason, type Enrichment } from '@/lib/enrichment'
import { useBank } from '../bank-provider'
import { BottomSheet, Field, PrimaryButton, inputClass } from '../overlay'
import { Switch } from '../primitives'

export function DisputeSheet({
  txn,
  enrichment,
  onClose,
  onManageSub,
}: {
  txn: Transaction
  enrichment: Enrichment
  onClose: () => void
  onManageSub?: () => void
}) {
  const { dispatch, notify } = useBank()
  const [step, setStep] = useState<'reason' | 'details' | 'done'>('reason')
  const [reason, setReason] = useState<DisputeReason | null>(null)
  const [note, setNote] = useState('')
  const [lockCard, setLockCard] = useState(true)
  const [expected, setExpected] = useState('')
  const [caseId] = useState(() => `TD-${Math.floor(400000 + Math.random() * 500000)}`)

  const amount = Math.abs(txn.amount)
  const creditAmount =
    reason === 'amount' && expected && Number(expected) < amount ? amount - Number(expected) : amount
  const chosen = disputeReasons.find((r) => r.id === reason)

  const submit = () => {
    if (!chosen) return
    dispatch({
      type: 'dispute',
      txnId: txn.id,
      reason: chosen.label,
      amount: Number(creditAmount.toFixed(2)),
      merchant: enrichment.name,
      caseId,
    })
    if (reason === 'unauthorized' && lockCard) {
      dispatch({ type: 'freeze', frozen: true })
    }
    setStep('done')
    notify(`Dispute filed. ${formatMoney(creditAmount)} credited.`)
  }

  if (step === 'done') {
    return (
      <BottomSheet title="Dispute filed" onClose={onClose}>
        <div className="flex flex-col items-center gap-3 pb-2 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-muted text-lime">
            <CircleCheck className="size-8" aria-hidden />
          </span>
          <p className="text-2xl font-semibold tracking-tight">{formatMoney(creditAmount)} is back in checking</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We applied a provisional credit right away while we work with {enrichment.name}. Most cases close within 10
            business days.
          </p>
        </div>
        <ol className="mt-5 flex flex-col gap-3 rounded-2xl bg-muted p-4 text-sm">
          {[
            { label: 'Case opened', detail: `Case ${caseId}`, done: true },
            { label: 'Provisional credit applied', detail: formatMoney(creditAmount), done: true },
            ...(reason === 'unauthorized' && lockCard
              ? [{ label: 'Card locked', detail: 'A new card number is on its way', done: true }]
              : []),
            { label: 'Merchant response', detail: 'Expected by Nov 9', done: false },
            { label: 'Final decision', detail: "We'll notify you in the app", done: false },
          ].map((s) => (
            <li key={s.label} className="flex items-start gap-3">
              <span
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
                  s.done ? 'bg-primary text-primary-foreground' : 'border-2 border-muted-foreground/30',
                )}
              >
                {s.done && <Check className="size-3" aria-hidden />}
              </span>
              <span>
                <span className="block font-medium">{s.label}</span>
                <span className="block text-muted-foreground">{s.detail}</span>
              </span>
            </li>
          ))}
        </ol>
        <PrimaryButton className="mt-5" onClick={onClose}>
          Done
        </PrimaryButton>
      </BottomSheet>
    )
  }

  if (step === 'details' && chosen) {
    const suggestCancel = reason === 'canceled' && enrichment.subscription && onManageSub
    return (
      <BottomSheet title="A few details" description={chosen.label} onClose={onClose}>
        <div className="flex flex-col gap-4">
          {suggestCancel && (
            <div className="flex gap-3 rounded-2xl bg-lime/40 p-4 text-sm">
              <Repeat className="mt-0.5 size-5 shrink-0" aria-hidden />
              <div className="flex-1">
                <p className="font-medium">Stop future charges too</p>
                <p className="mt-0.5 text-muted-foreground">
                  Disputing refunds this charge, but {enrichment.name} will keep billing you. Cancel it from here.
                </p>
                <button type="button" onClick={onManageSub} className="mt-2 min-h-11 font-semibold text-primary">
                  Cancel {enrichment.name} subscription
                </button>
              </div>
            </div>
          )}
          {reason === 'amount' && (
            <Field label="What did you expect to pay?" hint={`You were charged ${formatMoney(amount)}`}>
              <input
                inputMode="decimal"
                value={expected}
                onChange={(e) => setExpected(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                className={inputClass}
              />
            </Field>
          )}
          {reason === 'unauthorized' && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border p-4">
              <div>
                <p className="font-medium">Lock this card now</p>
                <p className="text-sm text-muted-foreground">We&apos;ll send a new number to your wallet instantly.</p>
              </div>
              <Switch checked={lockCard} onChange={setLockCard} label="Lock this card now" />
            </div>
          )}
          <Field label="Anything else we should know?" hint="Optional">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className={cn(inputClass, 'h-auto py-3')}
              placeholder="e.g. I returned it in store on Oct 24"
            />
          </Field>
          <div className="rounded-2xl bg-muted p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provisional credit today</span>
              <span className="tabular font-mono font-semibold">{formatMoney(creditAmount)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">Merchant</span>
              <span className="font-medium">{enrichment.legalName}</span>
            </div>
          </div>
          <PrimaryButton
            onClick={submit}
            disabled={reason === 'amount' && (!expected || Number(expected) >= amount)}
          >
            Submit dispute
          </PrimaryButton>
          <button type="button" onClick={() => setStep('reason')} className="min-h-11 text-sm font-medium text-muted-foreground">
            Back
          </button>
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet
      title={`Dispute ${formatMoney(amount)}`}
      description={`${enrichment.name} · ${enrichment.time}`}
      onClose={onClose}
    >
      <div className="mb-4 flex gap-3 rounded-2xl bg-muted p-4 text-sm">
        <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <p className="leading-relaxed">
          On your statement this appears as{' '}
          <span className="font-mono text-xs font-semibold">{enrichment.descriptor}</span>. Still don&apos;t recognize it?
        </p>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">What happened?</legend>
        <div className="flex flex-col gap-2">
          {disputeReasons.map((r) => (
            <label
              key={r.id}
              className={cn(
                'flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition-colors',
                reason === r.id && 'border-primary bg-accent',
              )}
            >
              <input
                type="radio"
                name="dispute-reason"
                value={r.id}
                checked={reason === r.id}
                onChange={() => setReason(r.id)}
                className="size-5 accent-[var(--primary)]"
              />
              <span>
                <span className="block font-medium">{r.label}</span>
                <span className="block text-xs text-muted-foreground">{r.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <PrimaryButton className="mt-5" disabled={!reason} onClick={() => setStep('details')}>
        Continue
      </PrimaryButton>
    </BottomSheet>
  )
}
