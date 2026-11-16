'use client'

import { useEffect, useState } from 'react'
import { ArrowRightLeft, CheckCircle2, Globe2, QrCode, ScanLine, ShieldCheck, UserPlus, Zap } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import {
  WIRE_FEES,
  WIRE_LIMITS,
  ZELLE_DAILY_LIMIT,
  ZELLE_MIN,
  wirePurposes,
  type Contact,
  type P2PNetwork,
  type WireScope,
} from '@/lib/everyday-data'
import { cn } from '@/lib/utils'
import { STREET_SAFE_CAP, useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { Field, OverlayFrame, PrimaryButton, inputClass } from '../overlay'
import { SectionHeader } from '../primitives'
import { Confetti } from '../celebrate'
import { AddContactSheet, ScamCheckSheet, WireReviewSheet, rateFor } from './send-sheets'
import { ScanQrSheet, SendQrSheet } from './qr-sheets'

const usd = (n: number) => formatMoney(n).replace('.00', '')

const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

type Sent = { name: string; amount: number; network: P2PNetwork; scope: WireScope; received?: string }

export function SendMoneyScreen({ rail }: { rail: P2PNetwork }) {
  const { contacts, wallets, transactions, owned, streetSafe, sendPreset, dispatch, notify } = useBank()
  const { profile } = useTrust()
  const network = rail
  const [scope, setScope] = useState<WireScope>(sendPreset?.scope ?? 'domestic')
  const [mode, setMode] = useState<'send' | 'request'>('send')
  const [contactId, setContactId] = useState<string | null>(null)
  const [amount, setAmount] = useState(sendPreset?.amount ?? '')
  const [memo, setMemo] = useState('')
  const [purpose, setPurpose] = useState('')
  const [sheet, setSheet] = useState<null | 'add' | 'review' | 'scam' | 'qr-send' | 'qr-scan'>(null)
  const [sent, setSent] = useState<Sent | null>(null)

  useEffect(() => {
    if (sendPreset) dispatch({ type: 'sendPreset', preset: null })
    // The preset is a one-shot hand-off, read once when this screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isWire = network === 'wire'
  const effectiveMode = isWire ? 'send' : mode
  const feeWaived = owned.includes('complete')
  const fee = isWire && !feeWaived ? WIRE_FEES[scope] : 0

  const zelleSentToday = transactions.filter((t) => t.id.startsWith('zl-')).reduce((s, t) => s + Math.abs(t.amount), 0)
  const zelleRemaining = Math.max(0, ZELLE_DAILY_LIMIT - zelleSentToday)

  const list = contacts.filter((c) => (isWire ? c.wire?.scope === scope : !!c.handle))
  const contact = list.find((c) => c.id === contactId) ?? null
  const value = Number(amount)
  const hasValue = Number.isFinite(value) && value > 0
  const available = wallets.find((w) => w.code === 'USD')?.balance ?? 0

  const belowMin = hasValue && value < ZELLE_MIN
  const overZelle = !isWire && effectiveMode === 'send' && hasValue && value > zelleRemaining
  const overWire = isWire && hasValue && value > WIRE_LIMITS[scope]
  const overCap = effectiveMode === 'send' && streetSafe && value > STREET_SAFE_CAP
  const overBalance = effectiveMode === 'send' && value + fee > available
  const needsPurpose = isWire && scope === 'international' && !purpose
  const valid =
    !!contact && hasValue && !belowMin && !overZelle && !overWire && !overCap && !overBalance && !needsPurpose

  const zelleFits = hasValue && value >= ZELLE_MIN && value <= zelleRemaining
  const contactOnZelle = !contact || !!contact.handle
  const suggestZelle = isWire && scope === 'domestic' && zelleFits && contactOnZelle
  const suggestWire = overZelle

  const chooseScope = (next: WireScope) => {
    setScope(next)
    if (contact && contact.wire?.scope !== next) setContactId(null)
  }

  const switchRail = (next: P2PNetwork) => {
    dispatch({ type: 'sendPreset', preset: { amount, scope: 'domestic' } })
    dispatch({ type: 'overlay', overlay: next === 'wire' ? 'wire' : 'send' })
  }

  const reset = () => {
    setSent(null)
    setAmount('')
    setMemo('')
    setPurpose('')
    setContactId(null)
  }

  const complete = () => {
    if (!contact) return
    const first = contact.name.split(' ')[0]
    if (effectiveMode === 'request') {
      notify(`Request sent. We’ll ping you when ${first} pays up.`)
      setAmount('')
      setMemo('')
      return
    }
    const rounded = Math.round(value * 100) / 100
    dispatch({ type: 'p2p', network, contactId: contact.id, amount: rounded, memo, fee })
    const wire = contact.wire
    setSent({
      name: first,
      amount: rounded,
      network,
      scope,
      received:
        isWire && wire && wire.currency !== 'USD' ? formatMoney(rounded * rateFor(wire.currency), wire.currency) : undefined,
    })
  }

  const submit = () => {
    if (!valid || !contact) return
    if (isWire) return setSheet('review')
    if (effectiveMode === 'send' && !contact.known) return setSheet('scam')
    complete()
  }

  if (sent) {
    const intl = sent.network === 'wire' && sent.scope === 'international'
    return (
      <OverlayFrame title="Sent" onBack={() => dispatch({ type: 'overlay', overlay: null })}>
        <Confetti count={40} />
        <div className="flex flex-col items-center gap-4 px-6 pt-16 text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-muted text-lime">
            <CheckCircle2 className="size-10" aria-hidden />
          </span>
          <h2 className="text-balance text-[28px] font-semibold leading-tight tracking-tight">
            {formatMoney(sent.amount)} is on its way to {sent.name}
          </h2>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {sent.network === 'zelle'
              ? `${sent.name} usually gets it in minutes. We’ll let you know when it lands.`
              : intl
                ? `${sent.received ? `${sent.name} will receive ${sent.received}. ` : ''}International wires usually arrive in 1–2 business days. We’ll send you tracking updates.`
                : `Your wire is out the door and should land today. We’ll confirm the moment ${sent.name}’s bank receives it.`}
          </p>
          <div className="mt-4 flex w-full flex-col gap-2">
            <PrimaryButton onClick={() => dispatch({ type: 'overlay', overlay: null })}>Done</PrimaryButton>
            <button type="button" onClick={reset} className="h-12 rounded-xl font-semibold text-primary">
              Send another
            </button>
          </div>
        </div>
      </OverlayFrame>
    )
  }

  return (
    <OverlayFrame title={isWire ? 'Wire transfer' : 'Send & request'} onBack={() => dispatch({ type: 'overlay', overlay: null })}>
      <div className="flex flex-col gap-6 px-5">
        <div className="flex flex-col gap-3">
          {isWire && (
            <div role="radiogroup" aria-label="Wire destination" className="flex gap-2">
              {(['domestic', 'international'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={scope === s}
                  onClick={() => chooseScope(s)}
                  className={cn(
                    'flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold',
                    scope === s ? 'border-shield bg-shield-50 text-shield-700' : 'bg-card',
                  )}
                >
                  {s === 'international' && <Globe2 className="size-4" aria-hidden />}
                  {s === 'domestic' ? 'Within the US' : 'International'}
                </button>
              ))}
            </div>
          )}

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            {isWire
              ? scope === 'domestic'
                ? `Same day · up to ${usd(WIRE_LIMITS.domestic)}/day · ${feeWaived ? 'free with Complete' : `${usd(WIRE_FEES.domestic)} fee`}`
                : `200+ countries, 8 currencies · up to ${usd(WIRE_LIMITS.international)}/day · ${feeWaived ? 'free with Complete' : `${usd(WIRE_FEES.international)} fee`}`
              : `Free, in minutes · $1–${usd(ZELLE_DAILY_LIMIT)} per day · ${usd(zelleRemaining)} left today`}
          </p>
        </div>

        <section aria-labelledby="who">
          <SectionHeader id="who" title={effectiveMode === 'send' ? 'Who are we paying?' : 'Who owes you?'} />
          <ul className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            <li>
              <button type="button" onClick={() => setSheet('add')} className="flex w-[72px] flex-col items-center gap-1.5">
                <span className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-primary/40 text-primary">
                  <UserPlus className="size-5" aria-hidden />
                </span>
                <span className="text-xs font-medium">New</span>
              </button>
            </li>
            {list.map((c) => (
              <li key={c.id}>
                <ContactChip contact={c} selected={contactId === c.id} showCountry={isWire && scope === 'international'} onSelect={() => setContactId(c.id)} />
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-4">
          {!isWire && (
            <div role="radiogroup" aria-label="Send or request" className="flex gap-2">
              {(['send', 'request'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'min-h-11 flex-1 rounded-xl border text-sm font-semibold capitalize',
                    mode === m ? 'border-shield bg-shield text-shield-foreground' : 'bg-card',
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {!isWire && (
            <button
              type="button"
              onClick={() => setSheet(mode === 'send' ? 'qr-send' : 'qr-scan')}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-card text-sm font-semibold text-primary"
            >
              {mode === 'send' ? <QrCode className="size-5" aria-hidden /> : <ScanLine className="size-5" aria-hidden />}
              {mode === 'send' ? 'Send a QR code' : 'Scan a QR code'}
            </button>
          )}

          <Field label="Amount (USD)" hint={contactHint(contact, effectiveMode, isWire)}>
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={inputClass} />
          </Field>

          {isWire && scope === 'international' && contact?.wire && contact.wire.currency !== 'USD' && hasValue && (
            <p className="-mt-2 text-sm text-muted-foreground">
              {contact.name.split(' ')[0]} gets about{' '}
              <span className="font-semibold text-foreground">
                {formatMoney(value * rateFor(contact.wire.currency), contact.wire.currency)}
              </span>{' '}
              at 1 USD = {rateFor(contact.wire.currency)} {contact.wire.currency}
            </p>
          )}

          {suggestZelle && (
            <RailSuggestion
              icon={Zap}
              title="This fits under your Zelle limit"
              body={`Send it with Zelle instead: free and there in minutes${fee ? `, and you skip the ${usd(fee)} wire fee` : ''}.`}
              cta="Switch to Zelle"
              onClick={() => switchRail('zelle')}
            />
          )}
          {isWire && scope === 'domestic' && zelleFits && contact && !contact.handle && (
            <p className="rounded-2xl bg-secondary p-3 text-sm text-muted-foreground">
              {contact.name} isn&apos;t on Zelle, so a wire is the right call here.
            </p>
          )}
          {suggestWire && (
            <RailSuggestion
              icon={ArrowRightLeft}
              title={value > ZELLE_DAILY_LIMIT ? 'That’s over Zelle’s $10,000 daily limit' : `You have ${usd(zelleRemaining)} left on Zelle today`}
              body="No problem. A domestic wire can move up to $250,000 and still lands today."
              cta="Switch to wire"
              onClick={() => switchRail('wire')}
            />
          )}

          {isWire && scope === 'international' && (
            <Field label="Reason for the transfer" hint="Required for international wires">
              <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className={inputClass}>
                <option value="">Choose one</option>
                {wirePurposes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label={isWire ? 'Note for the recipient (optional)' : "What's it for? (optional)"}>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              maxLength={60}
              placeholder={isWire ? 'Invoice #, closing reference…' : 'Tacos, obviously'}
              className={inputClass}
            />
          </Field>

          {belowMin && (
            <p role="alert" className="text-sm text-destructive">
              The minimum you can send is $1.00.
            </p>
          )}
          {overWire && (
            <p role="alert" className="text-sm text-destructive">
              {scope === 'domestic' ? 'Domestic' : 'International'} wires are capped at {usd(WIRE_LIMITS[scope])} a day in the
              app. For bigger moves, your banker can help.
            </p>
          )}
          {overCap && (
            <p role="alert" className="flex gap-2 rounded-2xl bg-accent/60 p-3 text-sm text-accent-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
              Street Safe is on, so we&apos;re keeping sends under ${STREET_SAFE_CAP}. Turn it off from Home when you&apos;re somewhere safe.
            </p>
          )}
          {overBalance && !overCap && !overWire && !overZelle && (
            <p role="alert" className="text-sm text-destructive">
              That&apos;s a bit more than the {formatMoney(available)} you have available{fee ? ' (including the wire fee)' : ''}.
            </p>
          )}

          <PrimaryButton onClick={submit} disabled={!valid}>
            {effectiveMode === 'request'
              ? `Request ${valid ? formatMoney(value) : ''}`
              : isWire
                ? `Review wire${valid ? ` · ${formatMoney(value + fee)}` : ''}`
                : `Send ${valid ? formatMoney(value) : ''}`}
          </PrimaryButton>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Only send to people you know and trust. Once it&apos;s sent, it&apos;s like handing over cash.
          </p>
        </div>
      </div>

      {sheet === 'add' && (
        <AddContactSheet
          network={network}
          scope={scope}
          onClose={() => setSheet(null)}
          onAdded={(c) => {
            dispatch({ type: 'addContact', contact: c })
            setContactId(c.id)
            setSheet(null)
          }}
        />
      )}
      {sheet === 'qr-send' && (
        <SendQrSheet
          name={profile.legalName}
          amount={hasValue ? Math.round(value * 100) / 100 : null}
          onClose={() => setSheet(null)}
          onShare={async (link) => {
            try {
              if (navigator.share) await navigator.share({ title: 'Zelle QR code', url: link })
              else await navigator.clipboard.writeText(link)
              notify('QR code ready to share')
            } catch {
              notify('Sharing was cancelled')
            }
          }}
        />
      )}
      {sheet === 'qr-scan' && (
        <ScanQrSheet
          onClose={() => setSheet(null)}
          onManual={() => setSheet('add')}
          onScanned={() => {
            const scanned = list[0]
            if (scanned) {
              setContactId(scanned.id)
              notify(`Scanned. ${scanned.name.split(' ')[0]} is ready to pay you.`)
            }
            setSheet(null)
          }}
        />
      )}
      {sheet === 'review' && contact && (
        <WireReviewSheet
          contact={contact}
          amount={value}
          fee={fee}
          feeWaived={feeWaived}
          purpose={purpose}
          memo={memo}
          onClose={() => setSheet(null)}
          onConfirm={() => {
            if (!contact.known) return setSheet('scam')
            setSheet(null)
            complete()
          }}
        />
      )}
      {sheet === 'scam' && contact && (
        <ScamCheckSheet
          name={contact.name.split(' ')[0]}
          onClose={() => setSheet(null)}
          onConfirm={() => {
            setSheet(null)
            complete()
          }}
        />
      )}
    </OverlayFrame>
  )
}

function contactHint(contact: Contact | null, mode: 'send' | 'request', isWire: boolean) {
  if (!contact) return 'Pick someone above'
  const dir = mode === 'send' ? 'To' : 'From'
  if (isWire && contact.wire) return `${dir} ${contact.name} · ${contact.wire.bank} ••${contact.wire.mask}`
  return `${dir} ${contact.name} · ${contact.handle}`
}

function ContactChip({
  contact,
  selected,
  showCountry,
  onSelect,
}: {
  contact: Contact
  selected: boolean
  showCountry: boolean
  onSelect: () => void
}) {
  return (
    <button type="button" aria-pressed={selected} onClick={onSelect} className="flex w-[72px] flex-col items-center gap-1.5">
      <span
        className={cn(
          'flex size-14 items-center justify-center rounded-full bg-accent text-base font-semibold text-accent-foreground ring-offset-2 ring-offset-background',
          selected && 'ring-2 ring-primary',
        )}
      >
        {initials(contact.name)}
      </span>
      <span className="w-full truncate text-center text-xs font-medium">{contact.name.split(' ')[0]}</span>
      {showCountry && contact.wire && (
        <span className="-mt-1 w-full truncate text-center text-xs text-muted-foreground">{contact.wire.currency}</span>
      )}
    </button>
  )
}

function RailSuggestion({
  icon: Icon,
  title,
  body,
  cta,
  onClick,
}: {
  icon: typeof Zap
  title: string
  body: string
  cta: string
  onClick: () => void
}) {
  return (
    <div role="status" className="flex flex-col gap-3 rounded-2xl bg-forest p-4 text-forest-foreground">
      <p className="flex items-start gap-2 text-sm font-semibold">
        <Icon className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden />
        {title}
      </p>
      <p className="text-pretty text-sm leading-relaxed text-forest-foreground/80">{body}</p>
      <button type="button" onClick={onClick} className="min-h-11 self-start rounded-xl bg-shield px-4 text-sm font-semibold text-shield-foreground">
        {cta}
      </button>
    </div>
  )
}
