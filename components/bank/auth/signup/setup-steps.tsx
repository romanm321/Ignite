'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Check, ChevronRight, Loader2, Mail, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cardDesigns } from '@/lib/offers'
import { CardArt } from '../../onboarding/setup-step'
import { TdMark } from '../../primitives'
import { Cta, Dots, Heading, Keypad, Note, SuccessMark } from './shell'
import { ACCOUNT, CARD } from './types'

/* ---------- Checklist ---------- */

type ChecklistKey = 'wallet' | 'zelle'

const checklist: { key: ChecklistKey; title: string; body: string; time: string }[] = [
  { key: 'wallet', title: 'Add to wallet', body: 'Tap to pay before the plastic card arrives.', time: 'About 1 minute' },
  { key: 'zelle', title: 'Turn on Zelle', body: 'Send money with just a phone number or email.', time: 'About 30 seconds' },
]

export function SetupChecklist({
  done,
  onStart,
  onFinish,
}: {
  done: Record<ChecklistKey, boolean>
  onStart: (key: ChecklistKey) => void
  onFinish: () => void
}) {
  const count = checklist.filter((i) => done[i.key]).length
  const all = count === checklist.length
  return (
    <>
      <Heading title="Make it feel like yours." body="Two quick things. Do them now, or skip for later." />

      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Your checklist</span>
          <span className="text-muted-foreground">
            {count} of {checklist.length} done
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Checklist progress"
          aria-valuemin={0}
          aria-valuemax={checklist.length}
          aria-valuenow={count}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(count / checklist.length) * 100}%` }} />
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {checklist.map((item) => {
          const isDone = done[item.key]
          return (
            <li key={item.key}>
              <button
                type="button"
                disabled={isDone}
                onClick={() => onStart(item.key)}
                className={cn('flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors', isDone ? 'border-primary/40 bg-accent' : 'bg-card')}
              >
                <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full border-2', isDone ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>
                  {isDone && <Check className="size-4" aria-hidden />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{item.title}</span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">{item.body}</span>
                  {!isDone && <span className="mt-1 block text-xs font-medium text-primary">{item.time}</span>}
                </span>
                {isDone ? <span className="text-sm font-semibold text-primary">Done</span> : <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto">
        <Cta variant={all ? 'primary' : 'secondary'} onClick={onFinish}>
          {all ? 'Go to my dashboard' : 'Skip to dashboard'} {all && <ArrowRight className="size-4" aria-hidden />}
        </Cta>
      </div>
    </>
  )
}

/* ---------- Add to wallet: instant card issuance ---------- */

export function DebitCardArt({ name, reveal }: { name: string; reveal: boolean }) {
  return (
    <div className="relative flex aspect-[1.586] w-full flex-col justify-between overflow-hidden rounded-3xl bg-forest p-5 text-forest-foreground shadow-lg">
      <span aria-hidden className="absolute -right-10 -top-10 size-44 rounded-full bg-lime/15" />
      <div className="relative flex items-center justify-between">
        <TdMark className="size-8" />
        <span className="text-xs font-semibold uppercase tracking-widest opacity-70">Everyday Debit</span>
      </div>
      <div className="relative">
        <p className="tabular font-mono text-lg tracking-widest">{reveal ? CARD.number : `•••• •••• •••• ${CARD.last4}`}</p>
        <div className="mt-2 flex items-end justify-between text-xs">
          <span className="font-medium uppercase tracking-wider">{name}</span>
          <span className="tabular font-mono opacity-80">{reveal ? `${CARD.exp} · CVV ${CARD.cvv}` : `Exp ${CARD.exp}`}</span>
          <span className="text-sm font-bold italic">VISA</span>
        </div>
      </div>
    </div>
  )
}

/** Same pattern as the product onboarding: pick a look, issue the virtual card instantly, then add it to a wallet. */
export function WalletIssuanceFlow({ onDone }: { onDone: (r: { card: true; wallet: boolean }) => void }) {
  const [sub, setSub] = useState<'look' | 'issuing' | 'ready'>('look')
  const [design, setDesign] = useState<(typeof cardDesigns)[number]['id']>('forest')
  const [wallet, setWallet] = useState<'idle' | 'adding' | 'added'>('idle')

  useEffect(() => {
    if (sub !== 'issuing') return
    const t = window.setTimeout(() => setSub('ready'), 1500)
    return () => window.clearTimeout(t)
  }, [sub])

  useEffect(() => {
    if (wallet !== 'adding') return
    const t = window.setTimeout(() => setWallet('added'), 1200)
    return () => window.clearTimeout(t)
  }, [wallet])

  if (sub === 'look')
    return (
      <>
        <Heading title="Make it yours." body="Pick a look. Your virtual card works the moment it’s issued." />
        <CardArt design={design} mask={CARD.last4} label="Everyday Debit" />
        <div role="radiogroup" aria-label="Card design" className="flex justify-center gap-4">
          {cardDesigns.map((d) => (
            <button key={d.id} type="button" role="radio" aria-checked={design === d.id} onClick={() => setDesign(d.id)} className="flex flex-col items-center gap-1.5">
              <span className={cn('flex size-12 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-background', design === d.id ? 'ring-primary' : 'ring-transparent')}>
                <span className={cn('size-10 rounded-full', d.className)} />
              </span>
              <span className="text-xs font-medium">{d.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-auto">
          <Cta onClick={() => setSub('issuing')}>
            Issue my card instantly <ArrowRight className="size-4" aria-hidden />
          </Cta>
        </div>
      </>
    )

  if (sub === 'issuing')
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center" role="status">
        <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">Issuing your card…</h1>
          <p className="mt-1 text-muted-foreground">This only takes a few seconds.</p>
        </div>
      </div>
    )

  return (
    <>
      <Heading title="Your card is ready." body="Use it right now. Your physical card arrives in 5–7 days." />
      <CardArt design={design} mask={CARD.last4} label="Everyday Debit" className="animate-in zoom-in-95" />
      {wallet === 'added' && <Note>Added to Apple Wallet. Hold your phone near any reader to pay.</Note>}
      <div className="mt-auto flex flex-col gap-2">
        {wallet !== 'added' && (
          <button
            type="button"
            onClick={() => setWallet('adding')}
            disabled={wallet === 'adding'}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-primary font-semibold text-primary active:bg-white/10 disabled:opacity-60"
          >
            {wallet === 'adding' && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {wallet === 'adding' ? 'Adding…' : 'Add to Apple Wallet'}
          </button>
        )}
        <Cta onClick={() => onDone({ card: true, wallet: wallet === 'added' })}>Done</Cta>
      </div>
    </>
  )
}

/* ---------- Zelle ---------- */

export function ZelleFlow({ phone, email, onDone }: { phone: string; email: string; onDone: () => void }) {
  const [sub, setSub] = useState<'intro' | 'verify' | 'done'>('intro')
  const [usePhone, setUsePhone] = useState(true)
  const [useEmail, setUseEmail] = useState(true)
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (code.length !== 6) return
    setChecking(true)
    const t = window.setTimeout(() => {
      setChecking(false)
      setSub('done')
    }, 900)
    return () => window.clearTimeout(t)
  }, [code])

  if (sub === 'intro')
    return (
      <>
        <Heading eyebrow="Zelle" title="Choose how people find you." body="Friends can send you money with any contact you add. It usually arrives in minutes." />
        <div className="flex flex-col gap-3">
          {[
            { key: 'phone', icon: Smartphone, label: 'Mobile number', value: phone, on: usePhone, toggle: () => setUsePhone((v) => !v) },
            { key: 'email', icon: Mail, label: 'Email', value: email, on: useEmail, toggle: () => setUseEmail((v) => !v) },
          ].map((c) => (
            <button key={c.key} type="button" aria-pressed={c.on} onClick={c.toggle} className={cn('flex items-center gap-3 rounded-2xl border p-4 text-left', c.on ? 'border-primary bg-accent' : 'bg-card')}>
              <c.icon className="size-5 text-primary" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted-foreground">{c.label}</span>
                <span className="block truncate font-medium">{c.value}</span>
              </span>
              <Check className={cn('size-5', c.on ? 'text-primary' : 'text-transparent')} aria-hidden />
            </button>
          ))}
        </div>
        <Note>Deposits go straight to TD Everyday Checking ••{ACCOUNT.mask}. We’ll text a code to confirm it’s you.</Note>
        <div className="mt-auto">
          <Cta onClick={() => setSub('verify')} disabled={!usePhone && !useEmail}>
            Send code
          </Cta>
        </div>
      </>
    )

  if (sub === 'verify')
    return (
      <>
        <Heading eyebrow="Zelle" title="Enter the 6-digit code." body={`We texted a code to ${phone.replace(/\d{3}-(\d{4})$/, '•••-$1')}.`} />
        <div className="flex flex-col gap-5">
          <Dots value={code} length={6} reveal />
          <p className="h-5 text-center text-sm text-muted-foreground" aria-live="polite">
            {checking ? 'Checking…' : ''}
          </p>
          <Keypad value={code} length={6} onChange={setCode} />
        </div>
        <div className="mt-auto flex flex-col gap-1">
          <Cta variant="secondary" onClick={() => setCode('482913')} disabled={checking}>
            Autofill code from Messages
          </Cta>
          <Cta variant="ghost" onClick={() => setCode('')}>
            Resend code
          </Cta>
        </div>
      </>
    )

  return (
    <>
      <SuccessMark title="Zelle is on." body="You can send and receive money with anyone who has a U.S. bank account." />
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Registered with Zelle</p>
        {usePhone && <p className="mt-1 font-medium">{phone}</p>}
        {useEmail && <p className="mt-1 font-medium">{email}</p>}
      </div>
      <div className="mt-auto">
        <Cta onClick={onDone}>
          Back to checklist <ArrowRight className="size-4" aria-hidden />
        </Cta>
      </div>
    </>
  )
}
