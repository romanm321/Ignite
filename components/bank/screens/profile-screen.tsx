'use client'

import { useState } from 'react'
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  FileText,
  Globe,
  Home,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  Type,
  User,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/trust-data'
import { STREET_SAFE_CAP, useBank } from '../bank-provider'
import { AccessibilitySettings } from '../everyday/accessibility-screen'
import { useTrust } from '../trust-provider'
import { BottomSheet, Field, inputClass, OverlayFrame, PrimaryButton } from '../overlay'
import { Pill, SectionHeader, Switch } from '../primitives'
import { ScoreRing, scoreLabel } from './security-screen'

type EditKey = 'preferredName' | 'email' | 'phone' | 'address'

const editMeta: Record<EditKey, { label: string; type: string; sensitive: boolean; autoComplete: string }> = {
  preferredName: { label: 'Preferred name', type: 'text', sensitive: false, autoComplete: 'given-name' },
  email: { label: 'Email', type: 'email', sensitive: true, autoComplete: 'email' },
  phone: { label: 'Mobile number', type: 'tel', sensitive: true, autoComplete: 'tel' },
  address: { label: 'Home address', type: 'text', sensitive: true, autoComplete: 'street-address' },
}

const languages: Profile['language'][] = ['English', 'Español', 'Français', '中文']

export function ProfileScreen() {
  const { dispatch: bankDispatch, notify, streetSafe } = useBank()
  const { profile, score, dispatch } = useTrust()
  const toggleStreetSafe = (on: boolean) => {
    bankDispatch({ type: 'streetSafe', on })
    notify(on ? `Street Safe on. Balances hidden, sends capped at $${STREET_SAFE_CAP}.` : 'Street Safe is off. Welcome back.')
  }
  const [editing, setEditing] = useState<EditKey | null>(null)
  const [langOpen, setLangOpen] = useState(false)
  const initials = profile.legalName
    .split(' ')
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .map((p) => p[0])
    .join('')

  const openSecurity = () => bankDispatch({ type: 'overlay', overlay: 'security' })

  return (
    <OverlayFrame title="Profile & settings" onBack={() => bankDispatch({ type: 'overlay', overlay: null })}>
      <div className="flex flex-col gap-6 px-4">
        <section className="flex flex-col items-center gap-3 pt-2 text-center">
          <span className="relative flex size-20 items-center justify-center rounded-[14px] bg-forest text-2xl font-semibold text-lime">
            {initials}
            <BadgeCheck className="absolute -bottom-1 -right-1 size-7 fill-primary text-white" aria-label="Identity verified" />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{profile.legalName}</h2>
            <p className="text-sm text-muted-foreground">Customer since {profile.memberSince} · Verified with ID</p>
          </div>
        </section>

        <button
          type="button"
          onClick={openSecurity}
          className="flex items-center gap-4 rounded-3xl bg-forest p-4 text-left text-forest-foreground"
        >
          <ScoreRing score={score} size={64} />
          <span className="flex-1">
            <span className="block text-xs font-medium uppercase tracking-wider text-lime">Security · {scoreLabel(score)}</span>
            <span className="block font-semibold">Open Security hub</span>
            <span className="block text-sm text-forest-foreground/70">Devices, alerts, fraud & data sharing</span>
          </span>
          <ChevronRight className="size-5" aria-hidden />
        </button>

        <section aria-labelledby="personal-h" className="flex flex-col gap-3">
          <SectionHeader id="personal-h" title="Personal details" />
          <ul className="divide-y overflow-hidden rounded-3xl bg-card">
            <Row icon={User} label="Legal name" value={profile.legalName} note="Change with ID verification" onClick={() => notify('Scan your ID and a selfie to update your legal name')} />
            <Row icon={User} label="Preferred name" value={profile.preferredName} onClick={() => setEditing('preferredName')} />
            <Row icon={FileText} label="Date of birth" value={profile.dob} />
          </ul>
        </section>

        <section aria-labelledby="contact-h" className="flex flex-col gap-3">
          <SectionHeader id="contact-h" title="Contact info" action={<Pill className="bg-accent text-accent-foreground">Verified</Pill>} />
          <ul className="divide-y overflow-hidden rounded-3xl bg-card">
            <Row icon={Mail} label="Email" value={profile.email} onClick={() => setEditing('email')} />
            <Row icon={Phone} label="Mobile" value={profile.phone} onClick={() => setEditing('phone')} />
            <Row icon={Home} label="Home address" value={profile.address} onClick={() => setEditing('address')} />
          </ul>
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            For your safety, changes to email, phone or address need a quick Face ID or code check, and we notify your old contact too.
          </p>
        </section>

        <section aria-labelledby="trusted-h" className="flex flex-col gap-3">
          <SectionHeader id="trusted-h" title="Trusted contact" />
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'securityTab', tab: 'prevent' })
              openSecurity()
            }}
            className="flex min-h-16 items-center gap-3 rounded-3xl bg-card px-4 py-3 text-left"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-lime">
              <Users className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">
                {profile.trustedContact ? profile.trustedContact.name : 'Add someone you trust'}
              </span>
              <span className="block text-xs text-muted-foreground">
                {profile.trustedContact
                  ? `${profile.trustedContact.relation} · ${profile.trustedContact.phone}`
                  : 'We call them only if we suspect a scam'}
              </span>
            </span>
            <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
          </button>
        </section>

        <section aria-labelledby="prefs-h" className="flex flex-col gap-3">
          <SectionHeader id="prefs-h" title="Preferences" />
          <ul className="divide-y overflow-hidden rounded-3xl bg-card">
            <Row icon={Globe} label="Language" value={profile.language} onClick={() => setLangOpen(true)} />
            <ToggleRow
              icon={FileText}
              label="Paperless statements"
              body="Statements & tax slips in-app"
              checked={profile.paperless}
              onChange={(paperless) => dispatch({ type: 'profile', patch: { paperless } })}
            />
          </ul>
        </section>

        <section aria-labelledby="street-safe-h" className="flex flex-col gap-3">
          <SectionHeader id="street-safe-h" title="Street Safe" />
          <div className="flex flex-col gap-3 rounded-3xl bg-card p-4">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl',
                  streetSafe ? 'bg-lime text-lime-foreground' : 'bg-accent text-accent-foreground',
                )}
              >
                <ShieldCheck className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{streetSafe ? 'Street Safe is on' : 'Street Safe'}</span>
                <span className="block text-xs text-muted-foreground">For banking in public places</span>
              </span>
              <Switch checked={streetSafe} label="Street Safe" onChange={toggleStreetSafe} />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Hides every balance from over-the-shoulder eyes and caps sends and transfers at ${STREET_SAFE_CAP} until you
              turn it off.
            </p>
          </div>
        </section>

        <section aria-labelledby="a11y-h" className="flex flex-col gap-3">
          <SectionHeader id="a11y-h" title="Accessibility" />
          <p className="-mt-1 px-1 text-sm leading-relaxed text-muted-foreground">
            Changes apply across the whole app, instantly.
          </p>
          <AccessibilitySettings />
        </section>

        <section aria-labelledby="notif-h" className="flex flex-col gap-3">
          <SectionHeader id="notif-h" title="How we reach you" />
          <ul className="divide-y overflow-hidden rounded-3xl bg-card">
            {(['push', 'email', 'sms'] as const).map((ch) => (
              <ToggleRow
                key={ch}
                icon={ch === 'push' ? Bell : ch === 'email' ? Mail : Phone}
                label={ch === 'push' ? 'Push notifications' : ch === 'email' ? 'Email' : 'Text messages'}
                body={ch === 'push' ? 'Fastest for fraud alerts' : ch === 'email' ? 'Statements & receipts' : 'Backup for security codes'}
                checked={profile.channels[ch]}
                onChange={(on) => dispatch({ type: 'profile', patch: { channels: { ...profile.channels, [ch]: on } } })}
              />
            ))}
            <ToggleRow
              icon={ShieldCheck}
              label="Offers & marketing"
              body="We never sell your data"
              checked={profile.marketing}
              onChange={(marketing) => dispatch({ type: 'profile', patch: { marketing } })}
            />
          </ul>
        </section>

        <button
          type="button"
          onClick={() => notify('Signed out of all sessions on this device')}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold text-destructive"
        >
          <LogOut className="size-4" aria-hidden /> Sign out
        </button>
      </div>

      {editing && <EditSheet field={editing} onClose={() => setEditing(null)} />}
      {langOpen && (
        <BottomSheet title="Language" onClose={() => setLangOpen(false)}>
          <ul className="flex flex-col gap-2">
            {languages.map((l) => (
              <li key={l}>
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'profile', patch: { language: l } })
                    setLangOpen(false)
                  }}
                  className={cn(
                    'flex h-14 w-full items-center rounded-2xl border-2 px-4 text-left font-medium',
                    profile.language === l ? 'border-primary bg-accent' : 'border-transparent bg-card',
                  )}
                  lang={l === 'Español' ? 'es' : l === 'Français' ? 'fr' : l === '中文' ? 'zh' : 'en'}
                >
                  {l}
                </button>
              </li>
            ))}
          </ul>
        </BottomSheet>
      )}
    </OverlayFrame>
  )
}

function Row({
  icon: Icon,
  label,
  value,
  note,
  onClick,
}: {
  icon: typeof User
  label: string
  value: string
  note?: string
  onClick?: () => void
}) {
  const content = (
    <>
      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block truncate font-medium">{value}</span>
        {note && <span className="block text-xs text-muted-foreground">{note}</span>}
      </span>
      {onClick && <span className="text-sm font-medium text-primary">Edit</span>}
    </>
  )
  return (
    <li>
      {onClick ? (
        <button type="button" onClick={onClick} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left">
          {content}
          <span className="sr-only">{label}</span>
        </button>
      ) : (
        <div className="flex min-h-16 items-center gap-3 px-4 py-3">{content}</div>
      )}
    </li>
  )
}

function ToggleRow({
  icon: Icon,
  label,
  body,
  checked,
  onChange,
}: {
  icon: typeof User
  label: string
  body: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <li className="flex min-h-16 items-center gap-3 px-4 py-2">
      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{body}</span>
      </span>
      <Switch checked={checked} label={label} onChange={onChange} />
    </li>
  )
}

function EditSheet({ field, onClose }: { field: EditKey; onClose: () => void }) {
  const { notify } = useBank()
  const { profile, dispatch } = useTrust()
  const meta = editMeta[field]
  const [value, setValue] = useState(profile[field])
  const [stage, setStage] = useState<'edit' | 'verify'>('edit')
  const [code, setCode] = useState('')
  const changed = value.trim() !== profile[field] && value.trim().length > 1

  function save() {
    dispatch({ type: 'profile', patch: { [field]: value.trim() } })
    notify(meta.sensitive ? `${meta.label} updated · confirmation sent to your previous contact` : `${meta.label} updated`)
    onClose()
  }

  if (stage === 'verify') {
    return (
      <BottomSheet
        title="Confirm it's you"
        description={`Enter the 6-digit code we sent to ${field === 'phone' ? profile.email : profile.phone}.`}
        onClose={onClose}
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (code.length === 6) save()
          }}
        >
          <Field label="Security code" hint="Demo: any 6 digits">
            <input
              className={cn(inputClass, 'tabular text-center font-mono text-xl tracking-[0.5em]')}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
          </Field>
          <PrimaryButton type="submit" disabled={code.length !== 6}>
            Verify & save
          </PrimaryButton>
          <p className="text-center text-xs text-muted-foreground">TD will never call or text to ask for this code.</p>
        </form>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet title={`Edit ${meta.label.toLowerCase()}`} onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!changed) return
          if (meta.sensitive) setStage('verify')
          else save()
        }}
      >
        <Field label={meta.label}>
          <input
            className={inputClass}
            type={meta.type}
            autoComplete={meta.autoComplete}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
        </Field>
        <PrimaryButton type="submit" disabled={!changed}>
          {meta.sensitive ? 'Continue' : 'Save'}
        </PrimaryButton>
      </form>
    </BottomSheet>
  )
}
