'use client'

import { useEffect, useState } from 'react'
import { BadgeCheck, Check, Fingerprint, Loader2, MessageSquareText, Pencil, Radio, ShieldCheck, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTrust } from '../trust-provider'
import { inputClass, PrimaryButton } from '../overlay'

const signals = [
  { id: 'possession', label: 'Possession', detail: 'This phone is in your hand', icon: Smartphone },
  { id: 'reputation', label: 'Reputation', detail: 'No SIM swap or port-out in 90 days', icon: Radio },
  { id: 'ownership', label: 'Ownership', detail: 'Carrier record matches your TD profile', icon: BadgeCheck },
  { id: 'device', label: 'Device trust', detail: 'Known device, normal behavior', icon: Fingerprint },
]

export function ProveBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium text-muted-foreground', className)}>
      <ShieldCheck className="size-3.5" aria-hidden />
      Identity by <span className="font-bold tracking-tight text-foreground">Prove</span>
    </span>
  )
}

const maskPhone = (phone: string) => phone.replace(/\d{3}-(\d{4})$/, '•••-$1')

export function IdentityStep({
  onVerified,
  phone: phoneOverride,
  startPhase = 'ready',
  autoContinue = false,
  carrierDetail,
  onCancel,
}: {
  onVerified: () => void
  phone?: string
  startPhase?: 'ready' | 'link' | 'running'
  /** Moves on by itself one second after verification completes, with no button. */
  autoContinue?: boolean
  carrierDetail?: string
  onCancel?: () => void
}) {
  const { profile } = useTrust()
  const [phase, setPhase] = useState<'ready' | 'link' | 'running' | 'verified'>(startPhase)
  const [done, setDone] = useState(0)

  useEffect(() => {
    if (phase !== 'running') return
    if (done >= signals.length) {
      const t = window.setTimeout(() => setPhase('verified'), 350)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setDone((d) => d + 1), 550)
    return () => window.clearTimeout(t)
  }, [phase, done])

  useEffect(() => {
    if (!autoContinue || phase !== 'verified') return
    const t = window.setTimeout(onVerified, 1000)
    return () => window.clearTimeout(t)
  }, [autoContinue, phase, onVerified])

  const phone = maskPhone(phoneOverride ?? profile.phone)
  const items = signals.map((s) => (s.id === 'ownership' && carrierDetail ? { ...s, detail: carrierDetail } : s))

  if (phase === 'link') {
    return (
      <StepBody
        title="Tap the link we texted you"
        body={`We sent a one-time link to ${phone}. Open it on this phone — there’s no code to type.`}
      >
        <div className="flex flex-col gap-2 rounded-3xl bg-muted p-4">
          <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <MessageSquareText className="size-4" aria-hidden /> Messages · now
          </span>
          <p className="max-w-[85%] rounded-2xl rounded-tl-md bg-card p-3 text-sm leading-relaxed">
            TD Bank: Tap to confirm it&apos;s you. Link expires in 5 min.{' '}
            <span className="font-medium text-primary underline">td.link/v/8K2Q</span>
          </p>
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <PrimaryButton onClick={() => setPhase('running')}>I tapped the link</PrimaryButton>
          <button type="button" onClick={() => (onCancel ? onCancel() : setPhase('ready'))} className="h-11 text-sm font-medium text-muted-foreground">
            {onCancel ? 'Back' : 'Back to instant verify'}
          </button>
        </div>
      </StepBody>
    )
  }

  if (phase === 'running' || phase === 'verified') {
    const verified = phase === 'verified'
    return (
      <StepBody
        title={verified ? 'You’re verified' : 'Verifying with your carrier'}
        body={
          verified
            ? 'Your identity is confirmed. We’ll use it to fill out the rest for you.'
            : 'This takes a few seconds. You don’t need to do anything.'
        }
      >
        <ul className="flex flex-col gap-2" aria-live="polite">
          {items.map((s, i) => {
            const ok = i < done
            const active = i === done && !verified
            return (
              <li
                key={s.id}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border bg-card p-3 transition-opacity',
                  !ok && !active && 'opacity-50',
                )}
              >
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl',
                    ok ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {ok ? (
                    <Check className="size-5" aria-hidden />
                  ) : active ? (
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                  ) : (
                    <s.icon className="size-5" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{s.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{s.detail}</span>
                </span>
                {ok && <span className="sr-only">passed</span>}
              </li>
            )
          })}
        </ul>
        {verified && (
          <div className="flex items-center gap-3 rounded-2xl bg-accent p-3 text-sm text-accent-foreground animate-in fade-in">
            <ShieldCheck className="size-5 shrink-0" aria-hidden />
            <span>
              Trust level: <span className="font-semibold">High</span> · no extra documents needed
            </span>
          </div>
        )}
        <div className="mt-auto flex flex-col items-center gap-3">
          {!autoContinue && (
            <PrimaryButton onClick={onVerified} disabled={!verified}>
              {verified ? 'Continue' : 'Verifying…'}
            </PrimaryButton>
          )}
          <ProveBadge />
        </div>
      </StepBody>
    )
  }

  return (
    <StepBody
      title="Verify it’s you in one tap"
      body="We’ll confirm your identity with your mobile carrier instead of asking for documents or codes."
    >
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-forest p-6 text-center text-forest-foreground">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-lime text-lime-foreground">
          <Smartphone className="size-8" aria-hidden />
        </span>
        <span>
          <span className="block text-xs text-forest-foreground/70">Phone on file</span>
          <span className="tabular block font-mono text-xl font-semibold">{phone}</span>
        </span>
      </div>
      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        <li className="flex gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          Your carrier only confirms a match. We never see your calls or messages.
        </li>
        <li className="flex gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          Checks for SIM swaps so no one else can open accounts in your name.
        </li>
      </ul>
      <div className="mt-auto flex flex-col items-center gap-2">
        <PrimaryButton onClick={() => setPhase('running')}>Verify instantly</PrimaryButton>
        <button type="button" onClick={() => setPhase('link')} className="h-11 text-sm font-medium text-primary">
          Not on cellular? Text me a link
        </button>
        <ProveBadge />
      </div>
    </StepBody>
  )
}

export function ConfirmStep({
  needsIncome,
  income,
  setIncome,
  onNext,
}: {
  needsIncome: boolean
  income: string
  setIncome: (v: string) => void
  onNext: () => void
}) {
  const { profile } = useTrust()
  const [editing, setEditing] = useState(false)
  const rows = [
    { label: 'Legal name', value: profile.legalName, source: 'Prove' },
    { label: 'Date of birth', value: profile.dob, source: 'Prove' },
    { label: 'SSN', value: '•••-••-4417', source: 'Prove' },
    { label: 'Home address', value: profile.address, source: 'Prove' },
    { label: 'Email', value: profile.email, source: 'TD profile' },
  ]
  const incomeNum = Number(income.replace(/[^\d]/g, ''))
  const valid = !needsIncome || incomeNum >= 1000

  return (
    <StepBody title="We filled this in for you" body="Verified details are pre-filled. Just check they’re right.">
      <ul className="divide-y overflow-hidden rounded-3xl border bg-card">
        {rows.map((r) => (
          <li key={r.label} className="flex items-start gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground">{r.label}</span>
              <span className="block text-sm font-medium">{r.value}</span>
            </span>
            <span
              className={cn(
                'mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                r.source === 'Prove' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              {r.source === 'Prove' && <BadgeCheck className="size-3" aria-hidden />}
              {r.source}
            </span>
          </li>
        ))}
        {needsIncome && (
          <li className="px-4 py-3">
            {editing ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">Annual income before taxes</span>
                <input
                  autoFocus
                  inputMode="numeric"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  onBlur={() => setEditing(false)}
                  className={inputClass}
                />
              </label>
            ) : (
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted-foreground">Annual income · from your direct deposits</span>
                  <span className="tabular block font-mono text-sm font-semibold">
                    ${incomeNum.toLocaleString('en-US')}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  aria-label="Edit annual income"
                  className="-mr-2 flex size-11 items-center justify-center rounded-full text-primary"
                >
                  <Pencil className="size-4" aria-hidden />
                </button>
              </div>
            )}
          </li>
        )}
      </ul>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Something wrong? Update it in Profile — changes to verified details need a quick ID check.
      </p>
      <div className="mt-auto">
        <PrimaryButton onClick={onNext} disabled={!valid}>
          Looks right
        </PrimaryButton>
      </div>
    </StepBody>
  )
}

export function StepBody({ title, body, children }: { title: string; body?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col gap-5 px-5 pb-6 pt-2 animate-in fade-in slide-in-from-right-4">
      <div>
        <h2 className="text-balance text-[26px] font-semibold leading-tight tracking-tight">{title}</h2>
        {body && <p className="mt-1.5 text-pretty leading-relaxed text-muted-foreground">{body}</p>}
      </div>
      {children}
    </div>
  )
}
