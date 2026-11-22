'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, BadgeCheck, Camera, Check, IdCard, Loader2, Pencil, ScanFace } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IdentityStep } from '../../onboarding/identity-steps'
import { inputClass } from '../../overlay'
import { Cta, Field, Heading, Note } from './shell'
import { digitsOnly, formatDob, formatSsn, type Fields } from './types'

/** Carrier check that starts as soon as the customer opts in: no intro screen, and it moves on by itself when done. */
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
  const valid =
    fields.name.trim().length > 1 &&
    fields.email.includes('@') &&
    digitsOnly(fields.ssn).length === 9 &&
    digitsOnly(fields.dob).length === 8 &&
    fields.address.trim().length > 5

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
        title={proveUsed ? 'Check your details' : 'Your details'}
        body={proveUsed ? 'Pulled from your carrier. Tap the pencil to change anything.' : 'We use these to confirm it’s you.'}
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
          <Field label="Legal name" autoComplete="name" placeholder="First and last name" value={fields.name} onChange={(e) => set({ name: e.target.value })} />
          <Field label="Date of birth" inputMode="numeric" placeholder="MM/DD/YYYY" value={fields.dob} onChange={(e) => set({ dob: formatDob(e.target.value) })} />
          <Field label="Home address" autoComplete="street-address" placeholder="Street, city, state, ZIP" value={fields.address} onChange={(e) => set({ address: e.target.value })} />
          <Field label="Social Security number" inputMode="numeric" autoComplete="off" placeholder="•••-••-••••" value={fields.ssn} onChange={(e) => set({ ssn: formatSsn(e.target.value) })} hint="Encrypted. Only used to verify it’s you." />
          <Field label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={fields.email} onChange={(e) => set({ email: e.target.value })} />
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
