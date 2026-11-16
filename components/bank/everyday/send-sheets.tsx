'use client'

import { useState } from 'react'
import { AlertTriangle, Building2, Check, Globe2, Zap } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import {
  WIRE_FEES,
  WIRE_LIMITS,
  ZELLE_DAILY_LIMIT,
  recommendRail,
  wireCurrencies,
  type Contact,
  type P2PNetwork,
  type WireScope,
} from '@/lib/everyday-data'
import { cn } from '@/lib/utils'
import { BottomSheet, Field, PrimaryButton, inputClass } from '../overlay'

const scamChecks = [
  'No one is pressuring me to pay to fix a problem or avoid trouble',
  'I’ve received, or can verify, what I’m paying for',
  'These payment details didn’t come from an unexpected email or text',
]

export function rateFor(currency: string) {
  return wireCurrencies.find((c) => c.code === currency)?.rate ?? 1
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn('min-h-11 rounded-xl text-sm font-semibold', value === o.id ? 'bg-card shadow-sm' : 'text-muted-foreground')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SendGuideSheet({
  initialAmount,
  zelleRemaining,
  wireFeeWaived,
  onClose,
  onChoose,
}: {
  initialAmount: string
  zelleRemaining: number
  wireFeeWaived: boolean
  onClose: () => void
  onChoose: (network: P2PNetwork, scope: WireScope, amount: string) => void
}) {
  const [amount, setAmount] = useState(initialAmount)
  const [destination, setDestination] = useState<WireScope>('domestic')
  const value = Number(amount)
  const hasAmount = Number.isFinite(value) && value > 0
  const pick = hasAmount ? recommendRail(value, destination, zelleRemaining) : null

  const rails: {
    key: string
    network: P2PNetwork
    scope: WireScope
    icon: typeof Zap
    title: string
    fee: string
    speed: string
    limit: string
    possible: boolean
    why?: string
  }[] = [
    {
      key: 'zelle',
      network: 'zelle',
      scope: 'domestic',
      icon: Zap,
      title: 'Zelle®',
      fee: 'Free',
      speed: 'Minutes',
      limit: `$1 – ${formatMoney(ZELLE_DAILY_LIMIT).replace('.00', '')} / day`,
      possible: destination === 'domestic' && (!hasAmount || (value >= 1 && value <= zelleRemaining)),
      why: destination === 'international' ? 'US banks only' : hasAmount && value > zelleRemaining ? 'Over your limit' : undefined,
    },
    {
      key: 'domestic',
      network: 'wire',
      scope: 'domestic',
      icon: Building2,
      title: 'Domestic wire',
      fee: wireFeeWaived ? 'Free with Complete' : formatMoney(WIRE_FEES.domestic),
      speed: 'Same day',
      limit: `Up to ${formatMoney(WIRE_LIMITS.domestic).replace('.00', '')}`,
      possible: destination === 'domestic' && (!hasAmount || value <= WIRE_LIMITS.domestic),
      why: destination === 'international' ? 'US banks only' : undefined,
    },
    {
      key: 'international',
      network: 'wire',
      scope: 'international',
      icon: Globe2,
      title: 'International wire',
      fee: wireFeeWaived ? 'Free with Complete' : formatMoney(WIRE_FEES.international),
      speed: '1–2 business days',
      limit: `200+ countries · up to ${formatMoney(WIRE_LIMITS.international).replace('.00', '')}`,
      possible: destination === 'international' && (!hasAmount || value <= WIRE_LIMITS.international),
      why: destination === 'domestic' ? 'For banks outside the US' : undefined,
    },
  ]

  const recommendedKey = pick ? (pick.network === 'zelle' ? 'zelle' : pick.scope) : null

  return (
    <BottomSheet title="Let’s find the best way to send" description="Two quick questions and we’ll point you to the right option." onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="How much are you sending?">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={inputClass}
            aria-label="Amount to send in US dollars"
          />
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Where do they bank?</span>
          <Segmented
            label="Recipient bank location"
            value={destination}
            onChange={setDestination}
            options={[
              { id: 'domestic', label: 'In the US' },
              { id: 'international', label: 'Outside the US' },
            ]}
          />
        </div>

        {pick && (
          <div role="status" className="rounded-2xl bg-forest p-4 text-forest-foreground">
            <p className="text-xs font-semibold uppercase tracking-wide text-lime">Our pick</p>
            <p className="mt-1 text-lg font-semibold">{pick.title}</p>
            <p className="mt-1 text-pretty text-sm leading-relaxed text-forest-foreground/80">{pick.reason}</p>
          </div>
        )}

        <ul className="flex flex-col gap-2" aria-label="Ways to send">
          {rails.map((r) => {
            const Icon = r.icon
            const recommended = r.key === recommendedKey
            return (
              <li
                key={r.key}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-3',
                  recommended && 'border-primary bg-accent/50',
                  !r.possible && 'opacity-50',
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {r.title}
                    {recommended && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">Best fit</span>
                    )}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {r.fee} · {r.speed}
                  </span>
                  <span className="block text-xs text-muted-foreground">{r.why ?? r.limit}</span>
                </span>
              </li>
            )
          })}
        </ul>

        <PrimaryButton disabled={!pick} onClick={() => pick && onChoose(pick.network, pick.scope ?? 'domestic', amount)}>
          {pick ? `Continue with ${pick.title}` : 'Enter an amount'}
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}

export function WireReviewSheet({
  contact,
  amount,
  fee,
  feeWaived,
  purpose,
  memo,
  onClose,
  onConfirm,
}: {
  contact: Contact
  amount: number
  fee: number
  feeWaived: boolean
  purpose: string
  memo: string
  onClose: () => void
  onConfirm: () => void
}) {
  const wire = contact.wire!
  const intl = wire.scope === 'international'
  const rate = rateFor(wire.currency)
  const rows: { label: string; value: string }[] = [
    { label: 'To', value: contact.name },
    { label: 'Bank', value: `${wire.bank} ••${wire.mask}` },
    ...(intl ? [{ label: 'Country', value: `${wire.country}${wire.swift ? ` · ${wire.swift}` : ''}` }] : []),
    { label: 'You send', value: formatMoney(amount) },
    { label: 'Wire fee', value: feeWaived ? 'Waived with TD Complete' : formatMoney(fee) },
    ...(intl && wire.currency !== 'USD'
      ? [
          { label: 'Exchange rate', value: `1 USD = ${rate} ${wire.currency}` },
          { label: `${contact.name.split(' ')[0]} gets`, value: formatMoney(amount * rate, wire.currency) },
        ]
      : []),
    ...(intl ? [{ label: 'Purpose', value: purpose }] : []),
    ...(memo ? [{ label: 'Note', value: memo }] : []),
    { label: 'Arrives', value: intl ? '1–2 business days' : 'Today, if sent before 5 PM ET' },
  ]

  return (
    <BottomSheet title="Review your wire" description="Give it one last look. Wires move fast and are hard to reverse." onClose={onClose}>
      <div className="flex flex-col gap-4">
        <dl className="divide-y rounded-2xl border">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="text-right font-medium">{r.value}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm font-semibold">Total from checking</dt>
            <dd className="tabular font-mono font-semibold">{formatMoney(amount + fee)}</dd>
          </div>
        </dl>
        <p className="flex gap-2 rounded-2xl bg-accent/60 p-3 text-sm leading-relaxed text-accent-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          Got these details by email? Call {contact.name.split(' ')[0]} on a number you already know to confirm. Fake wire
          instructions are a common scam.
        </p>
        <PrimaryButton onClick={onConfirm}>Send wire</PrimaryButton>
      </div>
    </BottomSheet>
  )
}

export function AddContactSheet({
  network,
  scope,
  onClose,
  onAdded,
}: {
  network: P2PNetwork
  scope: WireScope
  onClose: () => void
  onAdded: (c: Contact) => void
}) {
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [bank, setBank] = useState('')
  const [routing, setRouting] = useState('')
  const [account, setAccount] = useState('')
  const [swift, setSwift] = useState('')
  const [currency, setCurrency] = useState('CAD')
  const intl = scope === 'international'
  const digits = account.replace(/\s/g, '')

  const zelleValid = /^\S+@\S+\.\S+$/.test(handle) || handle.replace(/\D/g, '').length >= 10
  const wireValid =
    bank.trim().length > 1 &&
    (intl
      ? /^[A-Za-z0-9]{8}([A-Za-z0-9]{3})?$/.test(swift.trim()) && /^[A-Za-z0-9]{6,34}$/.test(digits)
      : /^\d{9}$/.test(routing) && /^\d{4,17}$/.test(digits))
  const valid = name.trim().length > 1 && (network === 'zelle' ? zelleValid : wireValid)

  const save = () => {
    const base = { id: `c-${Date.now()}`, name: name.trim(), known: false }
    if (network === 'zelle') return onAdded({ ...base, handle: handle.trim() })
    const country = intl ? (wireCurrencies.find((c) => c.code === currency)?.country ?? '') : 'United States'
    onAdded({
      ...base,
      wire: {
        scope,
        bank: bank.trim(),
        mask: digits.slice(-4),
        country,
        currency: intl ? currency : 'USD',
        swift: intl ? swift.trim().toUpperCase() : undefined,
      },
    })
  }

  return (
    <BottomSheet
      title={network === 'zelle' ? 'Add someone new' : intl ? 'Add an international recipient' : 'Add a wire recipient'}
      description={
        network === 'zelle'
          ? 'Use the email or mobile number they’ve enrolled with Zelle.'
          : 'Ask them for these details directly. Double-check every digit.'
      }
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <Field label="Their name (as it appears on their account)">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoComplete="off" />
        </Field>
        {network === 'zelle' ? (
          <Field label="Email or mobile number">
            <input value={handle} onChange={(e) => setHandle(e.target.value)} className={inputClass} autoComplete="off" />
          </Field>
        ) : (
          <>
            {intl && (
              <Field label="Country & currency">
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                  {wireCurrencies
                    .filter((c) => c.code !== 'USD')
                    .map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.country} · {c.code}
                      </option>
                    ))}
                </select>
              </Field>
            )}
            <Field label="Bank name">
              <input value={bank} onChange={(e) => setBank(e.target.value)} className={inputClass} autoComplete="off" />
            </Field>
            {intl ? (
              <Field label="SWIFT / BIC code" hint="8 or 11 characters">
                <input
                  value={swift}
                  onChange={(e) => setSwift(e.target.value)}
                  className={cn(inputClass, 'uppercase')}
                  autoComplete="off"
                  maxLength={11}
                />
              </Field>
            ) : (
              <Field label="Routing number" hint="9 digits">
                <input
                  inputMode="numeric"
                  value={routing}
                  onChange={(e) => setRouting(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  className={inputClass}
                  autoComplete="off"
                />
              </Field>
            )}
            <Field label={intl ? 'IBAN or account number' : 'Account number'}>
              <input value={account} onChange={(e) => setAccount(e.target.value)} className={inputClass} autoComplete="off" />
            </Field>
          </>
        )}
        <PrimaryButton disabled={!valid} onClick={save}>
          Add recipient
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}

export function ScamCheckSheet({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => void }) {
  const [confirmed, setConfirmed] = useState<number[]>([])
  const [attempted, setAttempted] = useState(false)
  const allConfirmed = confirmed.length === scamChecks.length
  const pausing = attempted && !allConfirmed

  return (
    <BottomSheet title={`Quick check before you pay ${name}`} description="First time sending to them, so we ask. Takes 5 seconds." onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">Check each one that&apos;s true for this payment.</p>
        {scamChecks.map((c, i) => (
          <label key={c} className="flex min-h-12 items-center gap-3 rounded-2xl border p-3 text-sm">
            <input
              type="checkbox"
              className="size-5 shrink-0 accent-primary"
              checked={confirmed.includes(i)}
              onChange={(e) => setConfirmed((prev) => (e.target.checked ? [...prev, i] : prev.filter((x) => x !== i)))}
            />
            {c}
          </label>
        ))}
        {pausing ? (
          <div role="alert" className="flex flex-col gap-3 rounded-2xl bg-destructive/10 p-4">
            <p className="flex gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              Let&apos;s pause here
            </p>
            <p className="text-sm leading-relaxed">
              If you can&apos;t check all of these, it may be a scam. TD will never ask you to move money to protect it. Talk to us
              first, we&apos;re here 24/7 and happy to help.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <PrimaryButton onClick={onClose}>Don&apos;t send</PrimaryButton>
              <button type="button" onClick={onConfirm} className="min-h-12 rounded-xl border bg-card px-3 text-sm font-semibold">
                Send anyways
              </button>
            </div>
          </div>
        ) : allConfirmed ? (
          <PrimaryButton onClick={onConfirm}>
            <Check className="size-4" aria-hidden />
            All good. Send it.
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => setAttempted(true)}>Continue</PrimaryButton>
        )}
      </div>
    </BottomSheet>
  )
}
