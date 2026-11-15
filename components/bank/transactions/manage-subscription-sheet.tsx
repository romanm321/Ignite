'use client'

import { useEffect, useState } from 'react'
import { Ban, Check, CreditCard, Loader2, Lock, Pause, Play, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/bank-data'
import { paymentCards, type Enrichment } from '@/lib/enrichment'
import { useBank, type SubStatus } from '../bank-provider'
import { BottomSheet, Field, PrimaryButton, inputClass } from '../overlay'
import { MerchantLogo } from './merchant-logo'
import { TdMark } from '../primitives'

type Action = 'cancel' | 'pause' | 'resume' | 'switch'
type Step = 'choose' | 'connect' | 'working' | 'done'

const actionCopy: Record<Action, { title: string; verb: string; icon: typeof Ban }> = {
  cancel: { title: 'Cancel subscription', verb: 'Canceling', icon: Ban },
  pause: { title: 'Pause for 1 month', verb: 'Pausing', icon: Pause },
  resume: { title: 'Resume subscription', verb: 'Resuming', icon: Play },
  switch: { title: 'Switch payment card', verb: 'Updating card', icon: CreditCard },
}

export function ManageSubscriptionSheet({
  enrichment,
  amount,
  onClose,
}: {
  enrichment: Enrichment
  amount: number
  onClose: () => void
}) {
  const sub = enrichment.subscription!
  const { subs, dispatch, notify } = useBank()
  const current = subs[sub.id]
  const [step, setStep] = useState<Step>('choose')
  const [action, setAction] = useState<Action | null>(null)
  const [card, setCard] = useState<string>(paymentCards.find((c) => c.label !== current.card)?.label ?? '')
  const [usePassword, setUsePassword] = useState(false)
  const [progress, setProgress] = useState(0)

  const tasks = [
    `Securely signing in to ${enrichment.name}`,
    'Finding your subscription',
    action ? `${actionCopy[action].verb}` : 'Applying change',
    `Confirming with ${enrichment.name}`,
  ]

  useEffect(() => {
    if (step !== 'working') return
    if (progress >= tasks.length) {
      const nextStatus: Partial<Record<Action, SubStatus>> = { cancel: 'canceled', pause: 'paused', resume: 'active' }
      if (action === 'switch') dispatch({ type: 'updateSub', id: sub.id, patch: { card } })
      else if (action) dispatch({ type: 'updateSub', id: sub.id, patch: { status: nextStatus[action] } })
      setStep('done')
      notify(action === 'cancel' ? `${enrichment.name} canceled` : `${enrichment.name} updated`)
      return
    }
    const t = window.setTimeout(() => setProgress((p) => p + 1), 900)
    return () => window.clearTimeout(t)
  }, [step, progress, tasks.length, action, card, dispatch, notify, sub.id, enrichment.name])

  const available: Action[] =
    current.status === 'canceled'
      ? []
      : current.status === 'paused'
        ? ['resume', 'cancel']
        : (['cancel', ...(sub.canPause ? (['pause'] as const) : []), 'switch'] as Action[])

  if (step === 'done' && action) {
    const savedYear = amount * 12
    return (
      <BottomSheet title="All set" onClose={onClose}>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative">
            <MerchantLogo enrichment={enrichment} size="lg" />
            <span className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-background">
              <Check className="size-4" aria-hidden />
            </span>
          </div>
          <p className="text-xl font-semibold tracking-tight">
            {action === 'cancel' && `${enrichment.name} is canceled`}
            {action === 'pause' && `${enrichment.name} is paused until Dec 15`}
            {action === 'resume' && `${enrichment.name} is active again`}
            {action === 'switch' && `${enrichment.name} now bills ${card}`}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {action === 'cancel' &&
              `No more charges. You keep access until ${sub.nextDate}. That's ${formatMoney(savedYear)} saved a year.`}
            {action === 'pause' && `No charge on ${sub.nextDate}. Billing restarts automatically.`}
            {action === 'resume' && `Your next charge of ${formatMoney(amount)} is on ${sub.nextDate}.`}
            {action === 'switch' && `Updated directly with ${enrichment.name}. Nothing for you to change on their site.`}
          </p>
          <p className="rounded-full bg-muted px-3 py-1 font-mono text-xs">
            Confirmation {sub.id.toUpperCase()}-{Math.abs(amount * 1000).toFixed(0)}
          </p>
        </div>
        <PrimaryButton className="mt-6" onClick={onClose}>
          Done
        </PrimaryButton>
      </BottomSheet>
    )
  }

  if (step === 'working') {
    return (
      <BottomSheet title={`${action ? actionCopy[action].verb : 'Working'}…`} description="This usually takes a few seconds." onClose={onClose}>
        <ol className="flex flex-col gap-4 py-2" aria-live="polite">
          {tasks.map((t, i) => {
            const done = i < progress
            const active = i === progress
            return (
              <li key={t} className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full transition-colors',
                    done ? 'bg-primary text-primary-foreground' : active ? 'bg-accent text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden /> : active ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <span className="size-1.5 rounded-full bg-current" />}
                </span>
                <span className={cn('text-sm', done || active ? 'font-medium' : 'text-muted-foreground')}>{t}</span>
              </li>
            )
          })}
        </ol>
        <AtomicFooter />
      </BottomSheet>
    )
  }

  if (step === 'connect') {
    return (
      <BottomSheet title={`Connect to ${enrichment.name}`} onClose={onClose}>
        <div className="flex items-center justify-center gap-3 py-2">
          <TdMark className="size-14 rounded-2xl" />
          <span className="flex gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-1.5 animate-pulse rounded-full bg-muted-foreground/40" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </span>
          <MerchantLogo enrichment={enrichment} size="md" className="size-14" />
        </div>
        <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
          TD uses Atomic to make this change with {enrichment.name} for you. Your sign-in is encrypted and never stored or
          seen by TD.
        </p>

        {usePassword ? (
          <form
            className="mt-5 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              setStep('working')
            }}
          >
            <Field label={`${enrichment.name} email`}>
              <input type="email" defaultValue="maya.chen@hey.com" className={inputClass} autoComplete="username" />
            </Field>
            <Field label="Password">
              <input type="password" defaultValue="demo-password" className={inputClass} autoComplete="current-password" />
            </Field>
            <PrimaryButton type="submit">Sign in and continue</PrimaryButton>
          </form>
        ) : (
          <div className="mt-5 flex flex-col gap-2">
            <PrimaryButton onClick={() => setStep('working')}>
              <ShieldCheck className="size-5" aria-hidden />
              Continue with your {enrichment.name} session
            </PrimaryButton>
            <p className="text-center text-xs text-muted-foreground">
              Uses the sign-in already saved on this device. No password needed.
            </p>
            <button type="button" onClick={() => setUsePassword(true)} className="min-h-11 text-sm font-medium text-primary">
              Use email and password instead
            </button>
          </div>
        )}
        <AtomicFooter />
      </BottomSheet>
    )
  }

  return (
    <BottomSheet
      title={`Manage ${enrichment.name}`}
      description={`${sub.plan} · ${formatMoney(amount)}/${sub.cadence === 'Monthly' ? 'mo' : 'yr'} · ${current.status === 'active' ? `next charge ${sub.nextDate}` : current.status}`}
      onClose={onClose}
    >
      {available.length === 0 ? (
        <p className="rounded-2xl bg-muted p-4 text-sm">
          This subscription is canceled. You won&apos;t be charged again.
        </p>
      ) : (
        <fieldset>
          <legend className="sr-only">Choose an action</legend>
          <div className="flex flex-col gap-2">
            {available.map((a) => {
              const Icon = actionCopy[a].icon
              return (
                <label
                  key={a}
                  className={cn(
                    'flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border p-3.5',
                    action === a && 'border-primary bg-accent',
                  )}
                >
                  <input type="radio" name="sub-action" className="sr-only" checked={action === a} onChange={() => setAction(a)} />
                  <span className={cn('flex size-10 items-center justify-center rounded-xl', a === 'cancel' ? 'bg-destructive/10 text-destructive' : 'bg-muted')}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium">{actionCopy[a].title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {a === 'cancel' && `Save ${formatMoney(amount * 12)} a year. Done right from here.`}
                      {a === 'pause' && `Skip the ${sub.nextDate} charge, keep your history.`}
                      {a === 'resume' && 'Pick up where you left off.'}
                      {a === 'switch' && `Currently ${current.card}`}
                    </span>
                  </span>
                  {action === a && <Check className="size-5 text-primary" aria-hidden />}
                </label>
              )
            })}
          </div>
        </fieldset>
      )}

      {action === 'switch' && (
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-medium">Bill this card instead</legend>
          <div className="flex flex-col gap-2">
            {paymentCards
              .filter((c) => c.label !== current.card)
              .map((c) => (
                <label
                  key={c.id}
                  className={cn('flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5', card === c.label && 'border-primary')}
                >
                  <input type="radio" name="sub-card" checked={card === c.label} onChange={() => setCard(c.label)} className="size-5 accent-[var(--primary)]" />
                  <span>
                    <span className="block text-sm font-medium">{c.label}</span>
                    <span className="block text-xs text-muted-foreground">{c.detail}</span>
                  </span>
                </label>
              ))}
          </div>
        </fieldset>
      )}

      {available.length > 0 && (
        <PrimaryButton className="mt-5" disabled={!action} onClick={() => setStep('connect')}>
          Continue
        </PrimaryButton>
      )}
      <AtomicFooter />
    </BottomSheet>
  )
}

function AtomicFooter() {
  return (
    <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
      <Lock className="size-3" aria-hidden />
      Secured by <span className="font-semibold text-foreground">Atomic</span> · demo simulation
    </p>
  )
}
