'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, BadgeCheck, Camera, Check, IdCard, Loader2, Pencil, ScanFace, ShieldCheck, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IdentityStep, ProveBadge } from '../../onboarding/identity-steps'
import { inputClass } from '../../overlay'
import { Cta, Field, Heading, Note } from './shell'
import { digitsOnly, formatDob, formatIncome, formatPhone, formatSsn, jobCategories, type Fields } from './types'

export function OfferStep({ onContinue }: { onContinue: () => void }) {
  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-forest p-6 text-forest-foreground">
        <div aria-hidden className="absolute -right-10 -top-10 size-40 rounded-full bg-lime/15" />
        <span className="relative inline-flex rounded-full bg-lime px-3 py-1 text-xs font-semibold text-lime-foreground">Offer applied</span>
        <h1 className="relative mt-5 text-balance text-[32px] font-semibold leading-tight tracking-tight">Get $250 when you open checking.</h1>
        <p className="relative mt-3 text-pretty leading-relaxed text-forest-foreground/75">
          You tapped this offer before downloading the app, so we saved it for you. Set up $500 or more in direct deposits within 90 days to earn it.
        </p>
        <ul className="relative mt-5 flex flex-col gap-2 text-sm">
          {['No monthly fee with direct deposit', 'Instant virtual debit card', 'Open in about 3 minutes'].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Check className="size-4 text-lime" aria-hidden /> {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <Cta onClick={onContinue}>
          Start application <ArrowRight className="size-4" aria-hidden />
        </Cta>
        <p className="text-center text-xs text-muted-foreground">Offer terms apply. Checking is FDIC insured.</p>
      </div>
    </>
  )
}

export function PhoneStep({
  phone,
  setPhone,
  onProve,
  onManual,
}: {
  phone: string
  setPhone: (v: string) => void
  onProve: (mode: 'instant' | 'link') => void
  onManual: () => void
}) {
  const valid = digitsOnly(phone).length === 10
  return (
    <>
      <Heading eyebrow="Step 1 of 3" title="Skip the typing." body="Share your mobile number and we’ll fill in most of the application for you." />
      <Field label="Mobile number" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
      <ul className="flex flex-col gap-2 rounded-3xl bg-muted p-4 text-sm">
        {[
          [Zap, 'About 10 seconds. No documents or codes.'],
          [BadgeCheck, 'Fills in your name, birthday and address.'],
          [ShieldCheck, 'Checks for SIM swaps to block identity theft.'],
        ].map(([Icon, text]) => {
          const I = Icon as typeof Zap
          return (
            <li key={text as string} className="flex items-start gap-2.5">
              <I className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {text as string}
            </li>
          )
        })}
      </ul>
      <div className="mt-auto flex flex-col gap-2">
        <Cta onClick={() => onProve('instant')} disabled={!valid}>
          Verify instantly <ArrowRight className="size-4" aria-hidden />
        </Cta>
        <Cta variant="secondary" onClick={() => onProve('link')} disabled={!valid}>
          Not on cellular? Text me a link
        </Cta>
        <Cta variant="ghost" onClick={onManual}>
          Skip for now
        </Cta>
        <div className="flex justify-center pt-1">
          <ProveBadge />
        </div>
      </div>
    </>
  )
}

/** Carrier check that starts straight from the phone step: no intro screen, and it moves on by itself when done. */
export function ProveStep({
  phone,
  mode,
  onVerified,
  onCancel,
}: {
  phone: string
  mode: 'instant' | 'link'
  onVerified: () => void
  onCancel: () => void
}) {
  return (
    <div className="-mx-5 -mt-2 flex flex-1 flex-col">
      <IdentityStep
        phone={phone}
        startPhase={mode === 'link' ? 'link' : 'running'}
        autoContinue
        carrierDetail="Carrier record matches"
        onVerified={onVerified}
        onCancel={onCancel}
      />
    </div>
  )
}

type Prefilled = 'name' | 'email' | 'dob' | 'ssn' | 'address'

export function DetailsStep({
  fields,
  setFields,
  proveUsed,
  changedFromProve,
  onContinue,
}: {
  fields: Fields
  setFields: (f: Fields) => void
  proveUsed: boolean
  changedFromProve: boolean
  onContinue: () => void
}) {
  const [editing, setEditing] = useState<Prefilled | null>(null)
  const set = (patch: Partial<Fields>) => setFields({ ...fields, ...patch })
  const valid = digitsOnly(fields.ssn).length === 9 && digitsOnly(fields.dob).length === 8 && fields.address.trim().length > 5

  const verifiedRows: { key: Prefilled; label: string; shown: string; raw: string }[] = [
    { key: 'name', label: 'Legal name', shown: fields.name, raw: fields.name },
    { key: 'email', label: 'Email', shown: fields.email, raw: fields.email },
    { key: 'dob', label: 'Date of birth', shown: fields.dob, raw: fields.dob },
    { key: 'ssn', label: 'Social Security number', shown: `•••-••-${digitsOnly(fields.ssn).slice(-4)}`, raw: fields.ssn },
    { key: 'address', label: 'Home address', shown: fields.address, raw: fields.address },
  ]

  const format = (key: Prefilled, v: string) => (key === 'dob' ? formatDob(v) : key === 'ssn' ? formatSsn(v) : v)

  return (
    <>
      <Heading
        eyebrow="Step 2 of 3"
        title={proveUsed ? 'We filled this in for you.' : 'Tell us about you.'}
        body={proveUsed ? 'We filled this in for you. Tap the pencil to fix anything.' : 'We need these to confirm it’s you.'}
      />

      {proveUsed ? (
        <ul className="divide-y overflow-hidden rounded-3xl border bg-card">
          {verifiedRows.map((r) => (
            <li key={r.key} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{r.label}</p>
                {editing === r.key ? (
                  <input
                    autoFocus
                    value={r.raw}
                    inputMode={r.key === 'dob' || r.key === 'ssn' ? 'numeric' : undefined}
                    onChange={(e) => set({ [r.key]: format(r.key, e.target.value) })}
                    onBlur={() => setEditing(null)}
                    className={cn(inputClass, 'mt-1')}
                  />
                ) : (
                  <p className="text-sm font-medium">{r.shown}</p>
                )}
              </div>
              {editing !== r.key && (
                <>
                  <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                    <BadgeCheck className="size-3" aria-hidden /> Prove
                  </span>
                  <button type="button" onClick={() => setEditing(r.key)} aria-label={`Edit ${r.label}`} className="-mr-2 flex size-11 items-center justify-center rounded-full text-primary">
                    <Pencil className="size-4" aria-hidden />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-4">
          <Field label="Date of birth" inputMode="numeric" placeholder="MM/DD/YYYY" value={fields.dob} onChange={(e) => set({ dob: formatDob(e.target.value) })} />
          <Field label="Social Security number" inputMode="numeric" autoComplete="off" placeholder="•��•-••-••••" value={fields.ssn} onChange={(e) => set({ ssn: formatSsn(e.target.value) })} hint="Encrypted. Used only to verify your identity." />
          <Field label="Home address" autoComplete="street-address" placeholder="Street, city, state, ZIP" value={fields.address} onChange={(e) => set({ address: e.target.value })} />
        </div>
      )}

      {changedFromProve && <Note tone="warn">You changed a verified detail, so we’ll need a quick ID check.</Note>}

      <div className="mt-auto pt-2">
        <Cta onClick={onContinue} disabled={!valid}>
          Continue <ArrowRight className="size-4" aria-hidden />
        </Cta>
      </div>
    </>
  )
}

export function KycStep({
  fields,
  setFields,
  changedFromProve,
  onContinue,
}: {
  fields: Fields
  setFields: (f: Fields) => void
  changedFromProve: boolean
  onContinue: () => void
}) {
  const set = (patch: Partial<Fields>) => setFields({ ...fields, ...patch })
  const needsEmployer = fields.job !== 'Student' && fields.job !== 'Retired'
  const valid = fields.job !== '' && digitsOnly(fields.income).length > 0 && (!needsEmployer || fields.employer.trim().length > 1)
  return (
    <>
      <Heading
        eyebrow="Step 3 of 3"
        title="A little about your work."
        body="Banks have to ask about your work. It helps us keep your account safe."
      />
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Job category
          <select value={fields.job} onChange={(e) => set({ job: e.target.value })} className={cn(inputClass, 'font-normal')}>
            <option value="" disabled>
              Select one
            </option>
            {jobCategories.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </label>
        <Field label="Annual income" inputMode="numeric" placeholder="$85,000" value={fields.income} onChange={(e) => set({ income: formatIncome(e.target.value) })} />
        {needsEmployer && <Field label="Employer name" autoComplete="organization" placeholder="Where you work" value={fields.employer} onChange={(e) => set({ employer: e.target.value })} />}
      </div>
      <div className="mt-auto pt-2">
        <Cta onClick={onContinue} disabled={!valid}>
          {changedFromProve ? 'Continue to ID check' : 'Continue'} <ArrowRight className="size-4" aria-hidden />
        </Cta>
      </div>
    </>
  )
}

const idSteps = [
  { id: 'front', label: 'Front of your ID', hint: 'Driver’s license or passport photo page', icon: IdCard, action: 'Capture front' },
  { id: 'back', label: 'Back of your ID', hint: 'Make sure the barcode is visible', icon: IdCard, action: 'Capture back' },
  { id: 'selfie', label: 'Quick selfie', hint: 'Look at the camera and hold still', icon: ScanFace, action: 'Take selfie' },
] as const

export function IdCheckStep({ onVerified }: { onVerified: () => void }) {
  const [done, setDone] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [checking, setChecking] = useState(false)
  const [passed, setPassed] = useState(false)

  useEffect(() => {
    if (!scanning) return
    const t = window.setTimeout(() => {
      setScanning(false)
      setDone(done + 1)
      if (done + 1 === idSteps.length) setChecking(true)
    }, 900)
    return () => window.clearTimeout(t)
  }, [scanning, done])

  useEffect(() => {
    if (!checking) return
    const t = window.setTimeout(() => {
      setChecking(false)
      setPassed(true)
    }, 1800)
    return () => window.clearTimeout(t)
  }, [checking])

  const current = idSteps[done]

  return (
    <>
      <Heading eyebrow="One extra step" title="Let’s confirm it’s you." body="You changed a verified detail, so we need to see a photo ID. It takes about a minute." />

      <div className="relative flex aspect-[1.6] items-center justify-center overflow-hidden rounded-3xl bg-forest text-forest-foreground" aria-hidden>
        <span className="absolute inset-4 rounded-2xl border-2 border-dashed border-lime/70" />
        {scanning || checking ? <Loader2 className="size-9 animate-spin text-lime" /> : passed ? <Check className="size-12 text-lime" /> : current ? <current.icon className="size-12 text-lime/80" /> : null}
      </div>

      <ul className="flex flex-col gap-2" aria-live="polite">
        {idSteps.map((s, i) => (
          <li key={s.id} className={cn('flex items-center gap-3 rounded-2xl border bg-card p-3', i > done && 'opacity-50')}>
            <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', i < done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
              {i < done ? <Check className="size-4" aria-hidden /> : <Camera className="size-4" aria-hidden />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{s.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{s.hint}</span>
            </span>
          </li>
        ))}
      </ul>

      {checking && <Note>Matching your photo to your ID and checking it’s a live person…</Note>}
      {passed && <Note>ID verified. Thanks, Ava. That’s everything we needed.</Note>}

      <div className="mt-auto">
        {passed ? (
          <Cta onClick={onVerified}>
            Continue <ArrowRight className="size-4" aria-hidden />
          </Cta>
        ) : (
          <Cta onClick={() => setScanning(true)} busy={scanning || checking} disabled={done >= idSteps.length}>
            {checking ? 'Verifying…' : scanning ? 'Scanning…' : current?.action}
          </Cta>
        )}
      </div>
    </>
  )
}
