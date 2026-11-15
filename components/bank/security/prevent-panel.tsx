'use client'

import { useState } from 'react'
import {
  BookOpen,
  Check,
  ChevronRight,
  Fingerprint,
  KeyRound,
  Lock,
  LockOpen,
  PhoneCall,
  PhoneOff,
  Play,
  UserPlus,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { lessons } from '@/lib/trust-data'
import { useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { Pill, SectionHeader, Switch } from '../primitives'
import { BottomSheet, Field, inputClass, PrimaryButton } from '../overlay'

export function PreventPanel() {
  const { cardFrozen, dispatch: bankDispatch, notify } = useBank()
  const { passkey, biometrics, profile, contactReviewed, completedLessons, dispatch } = useTrust()
  const [sheet, setSheet] = useState<null | 'call' | 'trusted' | 'lesson'>(null)
  const [lessonId, setLessonId] = useState<string | null>(null)
  const lesson = lessons.find((l) => l.id === lessonId)

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="lock-h" className="flex flex-col gap-3">
        <SectionHeader id="lock-h" title="Card lock" />
        <div
          className={cn(
            'flex items-center gap-4 rounded-3xl border-2 p-4 transition-colors',
            cardFrozen ? 'border-sky-300 bg-sky-50' : 'border-primary/30 bg-card',
          )}
        >
          <span
            className={cn(
              'flex size-12 shrink-0 items-center justify-center rounded-2xl',
              cardFrozen ? 'bg-sky-600 text-white' : 'bg-primary text-primary-foreground',
            )}
          >
            {cardFrozen ? <Lock className="size-6" aria-hidden /> : <LockOpen className="size-6" aria-hidden />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold leading-tight">
              {cardFrozen ? 'Locked' : 'On'}
              <span className="sr-only"> — TD Clear Card</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {cardFrozen ? 'All new purchases are blocked' : 'TD Clear Card •••• 7742 is accepting purchases'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              bankDispatch({ type: 'freeze', frozen: !cardFrozen })
              notify(cardFrozen ? 'Card unlocked' : 'Card locked instantly')
            }}
            className={cn(
              'h-11 shrink-0 rounded-xl px-4 text-sm font-semibold',
              cardFrozen ? 'bg-sky-600 text-white' : 'bg-forest text-forest-foreground',
            )}
          >
            {cardFrozen ? 'Unlock' : 'Lock'}
          </button>
        </div>
        <button
          type="button"
          onClick={() => bankDispatch({ type: 'navigate', tab: 'cards' })}
          className="flex h-11 items-center justify-between rounded-2xl bg-card px-4 text-sm font-medium"
        >
          Merchant, ATM & international controls
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </button>
      </section>

      <section aria-labelledby="signin-h" className="flex flex-col gap-3">
        <SectionHeader id="signin-h" title="Sign-in protection" />
        <ul className="divide-y overflow-hidden rounded-3xl bg-card">
          <li className="flex min-h-16 items-center gap-3 px-4 py-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-lime">
              <KeyRound className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-medium">
                Passkey {!passkey && <Pill className="bg-lime text-lime-foreground">Recommended</Pill>}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">Phishing-proof. Replaces passwords and texted codes.</p>
            </div>
            <Switch
              checked={passkey}
              label="Passkey"
              onChange={(on) => {
                dispatch({ type: 'passkey', on })
                notify(on ? 'Passkey saved to iCloud Keychain' : 'Passkey removed')
              }}
            />
          </li>
          <li className="flex min-h-16 items-center gap-3 px-4 py-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-lime">
              <Fingerprint className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">Face ID</p>
              <p className="text-xs text-muted-foreground">Required for transfers over $500</p>
            </div>
            <Switch checked={biometrics} label="Face ID" onChange={(on) => dispatch({ type: 'biometrics', on })} />
          </li>
        </ul>
      </section>

      <section aria-labelledby="scam-h" className="flex flex-col gap-3">
        <SectionHeader id="scam-h" title="Scam shield" />
        <button
          type="button"
          onClick={() => setSheet('call')}
          className="flex items-center gap-3 rounded-3xl bg-forest p-4 text-left text-forest-foreground"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-lime text-lime-foreground">
            <PhoneCall className="size-5" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">Verify a TD call</span>
            <span className="block text-sm text-forest-foreground/70">
              Someone says they&apos;re from TD? Check in one tap.
            </span>
          </span>
          <ChevronRight className="size-5" aria-hidden />
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSheet('trusted')}
            className="flex flex-col items-start gap-2 rounded-3xl bg-card p-4 text-left"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-lime">
              {profile.trustedContact ? <Users className="size-[18px]" aria-hidden /> : <UserPlus className="size-[18px]" aria-hidden />}
            </span>
            <span className="text-sm font-semibold leading-snug">Trusted contact</span>
            <span className="text-xs text-muted-foreground">
              {profile.trustedContact ? `${profile.trustedContact.name} · ${profile.trustedContact.relation}` : 'Not set up'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'contactReviewed' })
              notify('Contact info confirmed')
            }}
            disabled={contactReviewed}
            className="flex flex-col items-start gap-2 rounded-3xl bg-card p-4 text-left disabled:opacity-80"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-lime">
              <Check className="size-[18px]" aria-hidden />
            </span>
            <span className="text-sm font-semibold leading-snug">
              {contactReviewed ? 'Contact info confirmed' : 'Confirm contact info'}
            </span>
            <span className="truncate text-xs text-muted-foreground">{profile.phone}</span>
          </button>
        </div>
      </section>

      <section aria-labelledby="learn-h" className="flex flex-col gap-3">
        <SectionHeader
          id="learn-h"
          title="60-second lessons"
          action={
            <span className="text-xs text-muted-foreground">
              {completedLessons.length}/{lessons.length} done
            </span>
          }
        />
        <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4">
          {lessons.map((l) => {
            const done = completedLessons.includes(l.id)
            return (
              <li key={l.id} className="w-[70%] shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => {
                    setLessonId(l.id)
                    setSheet('lesson')
                  }}
                  className="flex h-full w-full flex-col gap-3 rounded-3xl border bg-card p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <Pill className="bg-accent text-accent-foreground">{l.tag}</Pill>
                    <span
                      className={cn(
                        'flex size-9 items-center justify-center rounded-full',
                        done ? 'bg-primary text-primary-foreground' : 'bg-forest text-lime',
                      )}
                    >
                      {done ? <Check className="size-4" aria-hidden /> : <Play className="size-4 fill-current" aria-hidden />}
                    </span>
                  </div>
                  <p className="font-semibold leading-snug">{l.title}</p>
                  <p className="mt-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <BookOpen className="size-3.5" aria-hidden /> {l.minutes} min · in-app
                  </p>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {sheet === 'call' && <VerifyCallSheet onClose={() => setSheet(null)} />}
      {sheet === 'trusted' && <TrustedContactSheet onClose={() => setSheet(null)} />}
      {sheet === 'lesson' && lesson && (
        <BottomSheet title={lesson.title} description={`${lesson.minutes}-minute lesson`} onClose={() => setSheet(null)}>
          <ol className="flex flex-col gap-3">
            {lesson.steps.map((s, i) => (
              <li key={s} className="flex gap-3 rounded-2xl bg-card p-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lime text-sm font-bold text-lime-foreground">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed">{s}</p>
              </li>
            ))}
          </ol>
          <PrimaryButton
            className="mt-5"
            onClick={() => {
              dispatch({ type: 'lesson', id: lesson.id })
              setSheet(null)
              notify('Lesson complete')
            }}
          >
            Got it
          </PrimaryButton>
        </BottomSheet>
      )}
    </div>
  )
}

function VerifyCallSheet({ onClose }: { onClose: () => void }) {
  const { notify } = useBank()
  return (
    <BottomSheet title="Verify a TD call" onClose={onClose}>
      <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-5 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-destructive text-white">
          <PhoneOff className="size-6" aria-hidden />
        </span>
        <p className="text-lg font-semibold">No TD agent is calling you</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          When TD really calls, the agent&apos;s name and photo appear right here. If you&apos;re on a call now, hang up. It&apos;s likely a scam.
        </p>
      </div>
      <ul className="mt-4 flex flex-col gap-2 text-sm leading-relaxed">
        <li>TD will never ask for your one-time code, PIN or password.</li>
        <li>TD will never ask you to move money to a &quot;safe account.&quot;</li>
      </ul>
      <PrimaryButton
        className="mt-5"
        onClick={() => {
          notify('Caller reported · our fraud team is reviewing')
          onClose()
        }}
      >
        Report this caller
      </PrimaryButton>
    </BottomSheet>
  )
}

function TrustedContactSheet({ onClose }: { onClose: () => void }) {
  const { notify } = useBank()
  const { profile, dispatch } = useTrust()
  const [name, setName] = useState(profile.trustedContact?.name ?? '')
  const [relation, setRelation] = useState(profile.trustedContact?.relation ?? 'Sibling')
  const [phone, setPhone] = useState(profile.trustedContact?.phone ?? '')
  const valid = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 10

  return (
    <BottomSheet
      title="Trusted contact"
      description="We'll only reach out if we suspect fraud, a scam or financial exploitation. They can't see or access your accounts."
      onClose={onClose}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!valid) return
          dispatch({ type: 'profile', patch: { trustedContact: { name: name.trim(), relation, phone } } })
          notify(`${name.trim()} added as your trusted contact`)
          onClose()
        }}
      >
        <Field label="Full name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Relationship">
          <select className={inputClass} value={relation} onChange={(e) => setRelation(e.target.value)}>
            {['Sibling', 'Parent', 'Partner', 'Child', 'Friend', 'Advisor'].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Mobile number">
          <input
            className={inputClass}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(212) 555-0199"
          />
        </Field>
        <PrimaryButton type="submit" disabled={!valid}>
          Save trusted contact
        </PrimaryButton>
      </form>
    </BottomSheet>
  )
}
