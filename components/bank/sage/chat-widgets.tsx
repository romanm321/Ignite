'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronRight,
  CreditCard,
  Gauge,
  Globe,
  PiggyBank,
  Phone,
  Send,
  ShieldCheck,
  Snowflake,
  Star,
  Video,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  appointmentReasons,
  bankers,
  branches,
  customer,
  formatMoney,
  upcomingDays,
  type AppointmentMode,
} from '@/lib/bank-data'
import { payees, type ConfirmStatus } from '@/lib/sage-engine'
import { STREET_SAFE_CAP, useBank, type CardControls } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { Switch, TdGlyph } from '../primitives'

export type WidgetUpdate = { status: ConfirmStatus; result?: string }

function Shell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border bg-card p-4', className)}>{children}</div>
}

function IconBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', className)} aria-hidden>
      {children}
    </span>
  )
}

export function ResultNote({ status, result }: { status: ConfirmStatus; result?: string }) {
  if (status === 'pending' || !result) return null
  return (
    <p
      role="status"
      className={cn(
        'mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium',
        status === 'confirmed' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground',
      )}
    >
      {status === 'confirmed' && <Check className="size-4 shrink-0" aria-hidden />}
      {result}
    </p>
  )
}

function ConfirmButtons({
  onConfirm,
  onDecline,
  confirmLabel = 'Confirm',
  disabled,
}: {
  onConfirm: () => void
  onDecline: () => void
  confirmLabel?: string
  disabled?: boolean
}) {
  return (
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        className="h-11 flex-1 rounded-xl bg-shield text-sm font-semibold text-shield-foreground disabled:opacity-40"
      >
        {confirmLabel}
      </button>
      <button type="button" onClick={onDecline} className="h-11 flex-1 rounded-xl bg-shield-50 text-sm font-medium text-shield-700">
        Cancel
      </button>
    </div>
  )
}

const capabilityGroups = [
  { icon: Snowflake, title: 'Card help', prompt: 'I lost my wallet, freeze my card' },
  { icon: Gauge, title: 'Spending', prompt: 'How much did I spend this month?' },
  { icon: PiggyBank, title: 'Save', prompt: 'Move $200 to my Tokyo trip' },
  { icon: Send, title: 'Send money', prompt: 'Send $40 to Alex' },
  { icon: ShieldCheck, title: 'Security', prompt: 'How secure is my account?' },
  { icon: AlertTriangle, title: 'Scam check', prompt: 'I got a weird text about my account' },
  { icon: Building2, title: 'Branches', prompt: 'Find a Spanish-speaking mortgage banker' },
]

export function CapabilitiesWidget({ ask }: { ask: (text: string) => void }) {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {capabilityGroups.map(({ icon: Icon, title, prompt }) => (
        <li key={title}>
          <button
            type="button"
            onClick={() => ask(prompt)}
            className="flex min-h-11 w-full flex-col items-start gap-2 rounded-2xl border bg-card p-3 text-left transition-colors hover:bg-muted"
          >
            <Icon className="size-5 text-primary" aria-hidden />
            <span className="text-sm font-semibold">{title}</span>
            <span className="text-xs leading-snug text-muted-foreground">{prompt}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function BalancesWidget() {
  const { accounts, vaults, streetSafe } = useBank()
  const cash = accounts.filter((a) => a.kind !== 'credit').reduce((s, a) => s + a.balance, 0)
  const vaultTotal = vaults.reduce((s, v) => s + v.balance, 0)
  const hide = (v: string) => (streetSafe ? '••••' : v)
  return (
    <Shell>
      <p className="text-xs text-muted-foreground">Total available</p>
      <p className="tabular font-mono text-2xl font-semibold">{hide(formatMoney(cash + vaultTotal))}</p>
      <ul className="mt-3 flex flex-col divide-y">
        {accounts.map((a) => (
          <li key={a.id} className="flex items-center justify-between py-2 text-sm">
            <span>
              {a.name} <span className="text-muted-foreground">•{a.mask}</span>
            </span>
            <span className={cn('tabular font-mono', a.balance < 0 && 'text-destructive')}>{hide(formatMoney(a.balance))}</span>
          </li>
        ))}
        <li className="flex items-center justify-between py-2 text-sm">
          <span>Savings vaults ({vaults.length})</span>
          <span className="tabular font-mono">{hide(formatMoney(vaultTotal))}</span>
        </li>
      </ul>
      {streetSafe && <p className="mt-2 text-xs text-muted-foreground">Hidden while Street Safe is on.</p>}
    </Shell>
  )
}

export function CreditWidget() {
  const pct = ((customer.creditScore - 300) / 550) * 100
  const factors = [
    { label: 'On-time payments', value: '100%', good: true },
    { label: 'Card utilization', value: '11%', good: true },
    { label: 'Credit age', value: '6 yrs', good: true },
    { label: 'Hard inquiries', value: '2', good: false },
  ]
  return (
    <Shell>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground">VantageScore 4.0 · updated today</p>
          <p className="tabular font-mono text-3xl font-semibold">{customer.creditScore}</p>
        </div>
        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">+18 pts</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {factors.map((f) => (
          <li key={f.label} className="rounded-xl bg-muted/60 p-2">
            <p className="text-xs text-muted-foreground">{f.label}</p>
            <p className={cn('text-sm font-semibold', !f.good && 'text-amber-700')}>{f.value}</p>
          </li>
        ))}
      </ul>
    </Shell>
  )
}

const controlRows: { key: keyof CardControls; label: string; icon: typeof Globe }[] = [
  { key: 'online', label: 'Online purchases', icon: CreditCard },
  { key: 'contactless', label: 'Tap to pay', icon: CreditCard },
  { key: 'atm', label: 'ATM withdrawals', icon: Building2 },
  { key: 'international', label: 'International use', icon: Globe },
]

export function ControlsWidget() {
  const { controls, cardFrozen, dispatch, notify } = useBank()
  return (
    <Shell className="py-2">
      <div className="flex items-center justify-between border-b py-1">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Snowflake className="size-4 text-sky-600" aria-hidden /> Freeze card
        </span>
        <Switch
          checked={cardFrozen}
          label="Freeze card"
          onChange={(v) => {
            dispatch({ type: 'freeze', frozen: v })
            notify(v ? 'Card frozen' : 'Card unfrozen')
          }}
        />
      </div>
      <ul>
        {controlRows.map(({ key, label, icon: Icon }) => (
          <li key={key} className="flex items-center justify-between py-1">
            <span className="flex items-center gap-2 text-sm">
              <Icon className="size-4 text-muted-foreground" aria-hidden /> {label}
            </span>
            <Switch
              checked={controls[key]}
              label={label}
              onChange={(v) => {
                dispatch({ type: 'control', key, value: v })
                notify(`${label} ${v ? 'on' : 'off'}`)
              }}
            />
          </li>
        ))}
      </ul>
    </Shell>
  )
}

export function VirtualCardWidget({ last4 }: { last4: string }) {
  return (
    <div className="flex aspect-[1.6] w-full flex-col justify-between rounded-2xl bg-lime p-4 text-lime-foreground">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
        <span>Single-use</span>
        <TdGlyph className="h-3.5" label="TD" />
      </div>
      <div>
        <p className="tabular font-mono text-lg font-semibold tracking-widest">4532 •••• •••• {last4}</p>
        <p className="mt-1 text-xs opacity-80">Expires after 1 purchase · CVV in Cards tab</p>
      </div>
    </div>
  )
}

export function SecurityWidget() {
  const { score, checklist, dispatch } = useTrust()
  const bank = useBank()
  const open = checklist.filter((c) => !c.done).slice(0, 3)
  function go(tab: (typeof checklist)[number]['tab']) {
    dispatch({ type: 'securityTab', tab })
    bank.dispatch({ type: 'overlay', overlay: 'security' })
  }
  return (
    <Shell>
      <div className="flex items-center gap-3">
        <div
          className="relative flex size-14 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(var(--primary) ${score * 3.6}deg, var(--muted) 0deg)` }}
          aria-hidden
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-card font-mono text-base font-semibold">
            {score}
          </span>
        </div>
        <div>
          <p className="font-semibold">Security score</p>
          <p className="text-xs text-muted-foreground">
            {open.length ? `${checklist.filter((c) => !c.done).length} recommendations left` : 'All recommendations done'}
          </p>
        </div>
      </div>
      {open.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {open.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => go(item.tab)}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-muted/60 px-3 py-2 text-left"
              >
                <span className="flex-1">
                  <span className="block text-sm font-medium">{item.title}</span>
                  <span className="block text-xs text-muted-foreground">{item.why}</span>
                </span>
                <span className="text-xs font-semibold text-primary">+{item.points}</span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  )
}

export function ScamWidget({ ask }: { ask: (text: string) => void }) {
  const bank = useBank()
  const { dispatch } = useTrust()
  const flags = [
    'Urgent language like "account suspended" or "act within 1 hour"',
    'A link that isn\u2019t td.com, or a shortened link',
    'Asking for your password, PIN or a one-time code',
    'Pressure to move money to a "safe account"',
  ]
  return (
    <Shell className="border-amber-300 bg-amber-50">
      <div className="flex items-center gap-3">
        <IconBadge className="bg-amber-200 text-amber-900">
          <AlertTriangle className="size-5" />
        </IconBadge>
        <div>
          <p className="font-semibold text-amber-950">Likely a scam if you see…</p>
          <p className="text-xs text-amber-900/80">TD will never text you a link to sign in.</p>
        </div>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {flags.map((f) => (
          <li key={f} className="flex gap-2 text-sm text-amber-950">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-700" aria-hidden />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'securityTab', tab: 'prevent' })
            bank.dispatch({ type: 'overlay', overlay: 'security' })
          }}
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-card text-sm font-semibold"
        >
          <Phone className="size-4" aria-hidden /> Verify a TD call
        </button>
        <button
          type="button"
          onClick={() => ask('I clicked the link')}
          className="h-11 rounded-xl bg-shield-950 text-sm font-semibold text-white"
        >
          I clicked it
        </button>
      </div>
    </Shell>
  )
}

export function DisputeWidget({
  status,
  result,
  onResolve,
}: {
  status: ConfirmStatus
  result?: string
  onResolve: (u: WidgetUpdate) => void
}) {
  const { transactions, dispatch: bankDispatch, notify } = useBank()
  const { dispatch } = useTrust()
  const [selected, setSelected] = useState<string[]>([])
  const charges = transactions.filter((t) => t.amount < 0 && t.category !== 'Transfer').slice(0, 6)
  const total = charges.filter((c) => selected.includes(c.id)).reduce((s, c) => s - c.amount, 0)

  function submit() {
    const id = `TD-${Math.floor(100000 + Math.random() * 900000)}`
    bankDispatch({ type: 'freeze', frozen: true })
    dispatch({
      type: 'openCase',
      fraudCase: { id, transactionIds: selected, reason: 'Reported via Tedi', amount: total, stage: 2, openedAt: 'just now' },
    })
    notify(`Case ${id} opened`)
    onResolve({
      status: 'confirmed',
      result: `Case ${id} opened. ${formatMoney(total)} credited back today, card locked, new card arrives in 2 days.`,
    })
  }

  return (
    <Shell>
      <p className="text-sm font-semibold">Recent card charges</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {charges.map((c) => {
          const on = selected.includes(c.id)
          return (
            <li key={c.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={status !== 'pending'}
                onClick={() => setSelected((s) => (on ? s.filter((x) => x !== c.id) : [...s, c.id]))}
                className={cn(
                  'flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors disabled:opacity-60',
                  on ? 'border-primary bg-accent' : 'bg-card',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-md border',
                    on ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40',
                  )}
                  aria-hidden
                >
                  {on && <Check className="size-3.5" />}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{c.merchant}</span>
                  <span className="block text-xs text-muted-foreground">{c.when}</span>
                </span>
                <span className="tabular font-mono text-sm">{formatMoney(c.amount)}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {status === 'pending' ? (
        <ConfirmButtons
          disabled={selected.length === 0}
          confirmLabel={selected.length ? `Dispute ${formatMoney(total)}` : 'Select charges'}
          onConfirm={submit}
          onDecline={() => onResolve({ status: 'declined', result: 'No problem, nothing was disputed.' })}
        />
      ) : (
        <ResultNote status={status} result={result} />
      )}
    </Shell>
  )
}

export function SendWidget({
  payee: initialPayee,
  amount,
  status,
  result,
  onResolve,
}: {
  payee: string | null
  amount: number
  status: ConfirmStatus
  result?: string
  onResolve: (u: WidgetUpdate) => void
}) {
  const { accounts, streetSafe, dispatch, notify } = useBank()
  const [payeeId, setPayeeId] = useState(initialPayee)
  const payee = payees.find((p) => p.id === payeeId)
  const checking = accounts.find((a) => a.id === 'chk')!

  function confirm() {
    if (!payee) return
    if (streetSafe && amount > STREET_SAFE_CAP) {
      return onResolve({ status: 'blocked', result: `Street Safe is on, so transfers are capped at ${formatMoney(STREET_SAFE_CAP)}. Turn it off to send more.` })
    }
    if (amount > checking.balance) return onResolve({ status: 'blocked', result: 'There isn’t enough in checking for that yet.' })
    dispatch({ type: 'payment', payee: payee.name, amount })
    notify(`${formatMoney(amount)} sent to ${payee.name.split(' ')[0]}`)
    onResolve({ status: 'confirmed', result: `Sent ${formatMoney(amount)} to ${payee.name}. It's already in their account.` })
  }

  return (
    <Shell>
      <div className="flex items-center gap-3">
        <IconBadge className="bg-muted text-lime">
          <Send className="size-5" />
        </IconBadge>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Send instantly · from checking •{checking.mask}</p>
          <p className="font-semibold">{payee ? payee.name : 'Choose a contact'}</p>
        </div>
        <p className="tabular font-mono text-lg font-semibold">{formatMoney(amount)}</p>
      </div>
      <ul className="mt-3 flex gap-2" aria-label="Contacts">
        {payees.map((p) => (
          <li key={p.id} className="flex-1">
            <button
              type="button"
              disabled={status !== 'pending'}
              aria-pressed={payeeId === p.id}
              onClick={() => setPayeeId(p.id)}
              className={cn(
                'flex min-h-11 w-full flex-col items-center gap-1 rounded-xl border px-2 py-2 disabled:opacity-60',
                payeeId === p.id ? 'border-primary bg-accent' : 'bg-card',
              )}
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-forest text-xs font-semibold text-lime">
                {p.initials}
              </span>
              <span className="text-xs font-medium">{p.handle}</span>
            </button>
          </li>
        ))}
      </ul>
      {status === 'pending' ? (
        <ConfirmButtons
          disabled={!payee}
          confirmLabel={payee ? `Send to ${payee.name.split(' ')[0]}` : 'Pick a contact'}
          onConfirm={confirm}
          onDecline={() => onResolve({ status: 'declined', result: 'No problem. No money moved.' })}
        />
      ) : (
        <ResultNote status={status} result={result} />
      )}
    </Shell>
  )
}

const modes: { id: AppointmentMode; label: string; icon: typeof Video }[] = [
  { id: 'in-branch', label: 'In branch', icon: Building2 },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'phone', label: 'Phone', icon: Phone },
]

export function BookWidget({
  reasonId,
  status,
  result,
  onResolve,
}: {
  reasonId: string
  status: ConfirmStatus
  result?: string
  onResolve: (u: WidgetUpdate) => void
}) {
  const { dispatch, notify } = useBank()
  const reason = appointmentReasons.find((r) => r.id === reasonId) ?? appointmentReasons[1]
  const banker = bankers.find((b) => b.specialties.includes(reason.specialty)) ?? bankers[0]
  const branch = branches.find((b) => b.bankerIds.includes(banker.id)) ?? branches[0]
  const days = upcomingDays(3)
  const slots = [
    { day: 0, time: '2:30 PM' },
    { day: 1, time: '9:30 AM' },
    { day: 1, time: '4:30 PM' },
    { day: 2, time: '11:00 AM' },
  ]
  const [slot, setSlot] = useState(0)
  const [mode, setMode] = useState<AppointmentMode>('in-branch')
  const dayLabel = (i: number) =>
    i === 0 ? 'Today' : days[i].toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  function book() {
    const s = slots[slot]
    dispatch({
      type: 'book',
      appointment: {
        id: `apt-${Date.now()}`,
        branchId: branch.id,
        bankerId: banker.id,
        reason: reason.label,
        mode,
        dateISO: days[s.day].toISOString(),
        time: s.time,
        notes: 'Booked via Tedi',
      },
    })
    notify('Appointment booked')
    const where = mode === 'in-branch' ? `at ${branch.name}` : mode === 'video' ? 'by video' : 'by phone'
    onResolve({
      status: 'confirmed',
      result: `Booked with ${banker.name.split(' ')[0]} ${where}, ${dayLabel(s.day)} at ${s.time}. Bring: ${reason.checklist.slice(0, 2).join(', ')}.`,
    })
  }

  return (
    <Shell>
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-full bg-forest text-sm font-semibold text-lime" aria-hidden>
          {banker.initials}
        </span>
        <div className="flex-1">
          <p className="font-semibold">{banker.name}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {reason.specialty} · {banker.languages.join(', ')} ·
            <Star className="size-3 fill-current text-amber-500" aria-hidden /> {banker.rating}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {branch.name} · {branch.distanceMi} mi
      </p>
      <fieldset disabled={status !== 'pending'} className="mt-3 disabled:opacity-60">
        <legend className="sr-only">Meeting type</legend>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
          {modes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
              className={cn(
                'flex h-9 items-center justify-center gap-1 rounded-xl text-xs font-semibold',
                mode === id ? 'bg-card shadow-sm' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-3.5" aria-hidden /> {label}
            </button>
          ))}
        </div>
        <legend className="sr-only">Time</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {slots.map((s, i) => (
            <button
              key={`${s.day}-${s.time}`}
              type="button"
              aria-pressed={slot === i}
              onClick={() => setSlot(i)}
              className={cn(
                'min-h-11 rounded-xl border px-2 py-1.5 text-left',
                slot === i ? 'border-primary bg-accent' : 'bg-card',
              )}
            >
              <span className="block text-xs text-muted-foreground">{dayLabel(s.day)}</span>
              <span className="block text-sm font-semibold">{s.time}</span>
            </button>
          ))}
        </div>
      </fieldset>
      {status === 'pending' ? (
        <ConfirmButtons
          confirmLabel="Book it"
          onConfirm={book}
          onDecline={() => onResolve({ status: 'declined', result: 'No appointment booked.' })}
        />
      ) : (
        <ResultNote status={status} result={result} />
      )}
    </Shell>
  )
}

export function ActionDoneCard({ action, text }: { action: string; text: string }) {
  const Icon = action === 'freeze' || action === 'unfreeze' ? Snowflake : action === 'passkey' ? ShieldCheck : ShieldCheck
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3">
      <IconBadge className={action === 'freeze' ? 'bg-sky-100 text-sky-700' : 'bg-muted text-lime'}>
        <Icon className="size-5" />
      </IconBadge>
      <p className="flex-1 text-sm font-medium">{text}</p>
      <Check className="size-4 text-primary" aria-label="Done" />
    </div>
  )
}
