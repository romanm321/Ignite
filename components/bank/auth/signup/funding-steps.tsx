'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Banknote, Briefcase, Check, Landmark, Lock, ScanFace, Search, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/bank-data'
import { inputClass } from '../../overlay'
import { Cta, CopyRow, DetailRows, Field, Heading, Note, SuccessMark } from './shell'
import { ACCOUNT, digitsOnly, type FundingMethod, type FundingResult } from './types'

const money = (n: number) => formatMoney(n)

export function FundingChoose({
  value,
  onChange,
  onContinue,
  onSkip,
}: {
  value: FundingMethod | null
  onChange: (m: FundingMethod) => void
  onContinue: () => void
  onSkip: () => void
}) {
  const options: { id: FundingMethod; icon: typeof Wallet; title: string; body: string; badge: string }[] = [
    { id: 'direct-deposit', icon: Briefcase, title: 'Set up direct deposit', body: 'Get paid into your new account. Unlocks your $250 bonus.', badge: 'Recommended' },
    { id: 'ach', icon: Landmark, title: 'Transfer from another bank', body: 'One-time transfer. First $250 is available right away.', badge: '1–2 days' },
    { id: 'wallet', icon: Wallet, title: 'Apple Pay or Google Pay', body: 'Add money instantly from a debit card in your wallet.', badge: 'Instant' },
  ]
  return (
    <>
      <Heading eyebrow="Your account is approved" title="Add money to get started." body="Pick the way that suits you. You can always do the others later." />
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Funding method">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={cn('flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors', value === o.id ? 'border-primary bg-accent' : 'bg-card')}
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
              <o.icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{o.title}</span>
              <span className="block text-xs leading-relaxed text-muted-foreground">{o.body}</span>
            </span>
            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', o.id === 'direct-deposit' ? 'bg-lime text-lime-foreground' : 'bg-muted text-muted-foreground')}>{o.badge}</span>
          </button>
        ))}
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <Cta onClick={onContinue} disabled={!value}>
          Continue <ArrowRight className="size-4" aria-hidden />
        </Cta>
        <Cta variant="secondary" onClick={onSkip}>
          I’ll add money later
        </Cta>
      </div>
    </>
  )
}

/* ---------- Direct deposit ---------- */

const employers = ['Northwind Labs', 'Harbor Logistics', 'Meridian Health', 'Brightside Schools', 'Gig & freelance income']
const allocations = [
  { id: 'all', label: 'My entire paycheck', hint: 'Best for the bonus and no monthly fee', amount: null },
  { id: '1000', label: '$1,000 each paycheck', hint: 'The rest stays at your current bank', amount: 1000 },
  { id: '500', label: '$500 each paycheck', hint: 'Just enough to qualify for the bonus', amount: 500 },
] as const

export function DirectDepositFlow({ employerName, onDone }: { employerName: string; onDone: (r: FundingResult) => void }) {
  const [sub, setSub] = useState<'employer' | 'connect' | 'allocate' | 'done'>('employer')
  const [query, setQuery] = useState('')
  const [employer, setEmployer] = useState(employerName)
  const [connecting, setConnecting] = useState(false)
  const [alloc, setAlloc] = useState<(typeof allocations)[number]['id']>('all')
  const [viaForm, setViaForm] = useState(false)

  useEffect(() => {
    if (!connecting) return
    const t = window.setTimeout(() => {
      setConnecting(false)
      setSub('allocate')
    }, 1500)
    return () => window.clearTimeout(t)
  }, [connecting])

  const shown = employers.filter((e) => e.toLowerCase().includes(query.trim().toLowerCase()))
  const allocation = allocations.find((a) => a.id === alloc)!

  if (sub === 'employer')
    return (
      <>
        <Heading eyebrow="Direct deposit" title="Who pays you?" body="Connect your payroll and we’ll switch it for you. No forms, no HR emails." />
        <label className="relative">
          <span className="sr-only">Search employers</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your employer or payroll provider" className={cn(inputClass, 'rounded-full pl-10')} />
        </label>
        <ul className="divide-y overflow-hidden rounded-3xl border bg-card">
          {shown.map((e) => (
            <li key={e}>
              <button
                type="button"
                onClick={() => {
                  setEmployer(e)
                  setSub('connect')
                }}
                className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-xs font-bold text-primary">{e.slice(0, 2).toUpperCase()}</span>
                <span className="flex-1 font-medium">{e}</span>
                {e === employerName && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">From your application</span>}
              </button>
            </li>
          ))}
          {shown.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">No match. Try a form instead.</li>}
        </ul>
        <div className="mt-auto">
          <Cta
            variant="secondary"
            onClick={() => {
              setViaForm(true)
              setSub('done')
            }}
          >
            Give my employer a form instead
          </Cta>
        </div>
      </>
    )

  if (sub === 'connect')
    return (
      <>
        <Heading eyebrow="Direct deposit" title={`Sign in to ${employer} payroll.`} body="We securely read your pay details and update your deposit. We never see or store your password." />
        <div className="flex flex-col gap-4 rounded-3xl bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Lock className="size-4" aria-hidden /> Encrypted connection
          </div>
          <Field label="Payroll username" defaultValue="ava.morgan" autoComplete="username" />
          <Field label="Password" type="password" defaultValue="password123" autoComplete="current-password" />
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <Cta onClick={() => setConnecting(true)} busy={connecting}>
            {connecting ? 'Connecting securely…' : 'Connect payroll'}
          </Cta>
          <Cta
            variant="ghost"
            onClick={() => {
              setViaForm(true)
              setSub('done')
            }}
          >
            Use a pre-filled form instead
          </Cta>
        </div>
      </>
    )

  if (sub === 'allocate')
    return (
      <>
        <Heading eyebrow="Direct deposit" title="How much should come to TD?" body={`We found your ${employer} pay schedule: every other Friday.`} />
        <div className="flex flex-col gap-3" role="radiogroup" aria-label="Deposit amount">
          {allocations.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={alloc === a.id}
              onClick={() => setAlloc(a.id)}
              className={cn('flex items-center gap-3 rounded-2xl border p-4 text-left', alloc === a.id ? 'border-primary bg-accent' : 'bg-card')}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{a.label}</span>
                <span className="block text-xs text-muted-foreground">{a.hint}</span>
              </span>
              <Check className={cn('size-5', alloc === a.id ? 'text-primary' : 'text-transparent')} aria-hidden />
            </button>
          ))}
        </div>
        <Note>Direct deposits of $500 or more within 90 days earn your $250 bonus.</Note>
        <div className="mt-auto">
          <Cta onClick={() => setSub('done')}>Set up direct deposit</Cta>
        </div>
      </>
    )

  const allocationLabel = viaForm ? 'Entire paycheck (form)' : allocation.label
  return (
    <>
      <SuccessMark
        title={viaForm ? 'Your form is ready.' : 'Direct deposit is set up.'}
        body={viaForm ? 'Share these details with your employer’s payroll team. Most updates take one pay cycle.' : `${employer} will switch to your new account on the next pay cycle.`}
      />
      <DetailRows
        rows={[
          { label: 'Employer', value: employer || 'Your employer' },
          { label: 'Amount', value: allocationLabel },
          { label: 'First deposit expected', value: 'Fri, Nov 20' },
          { label: 'Bonus progress', value: `$0 of $500` },
        ]}
      />
      <div className="divide-y overflow-hidden rounded-3xl border bg-card">
        <CopyRow label="Routing number" value={ACCOUNT.routing} />
        <CopyRow label="Account number" value={ACCOUNT.number} />
      </div>
      <div className="mt-auto">
        <Cta onClick={() => onDone({ method: 'direct-deposit', label: 'Direct deposit', posted: 0, summary: `${employer || 'Employer'} · ${allocationLabel}` })}>
          Continue <ArrowRight className="size-4" aria-hidden />
        </Cta>
      </div>
    </>
  )
}

/* ---------- One-time ACH ---------- */

const banks = [
  { id: 'chase', name: 'Chase' },
  { id: 'bofa', name: 'Bank of America' },
  { id: 'wells', name: 'Wells Fargo' },
  { id: 'citi', name: 'Citi' },
  { id: 'capone', name: 'Capital One' },
  { id: 'other', name: 'My bank isn’t listed' },
]
const externalAccounts = [
  { id: 'chk', label: 'Checking', mask: '6021', balance: 4210.55 },
  { id: 'sav', label: 'Savings', mask: '8834', balance: 12980.02 },
]

export function AchFlow({ onDone }: { onDone: (r: FundingResult) => void }) {
  const [sub, setSub] = useState<'bank' | 'login' | 'account' | 'amount' | 'review' | 'done'>('bank')
  const [bank, setBank] = useState(banks[0])
  const [account, setAccount] = useState(externalAccounts[0])
  const [amount, setAmount] = useState('500')
  const [busy, setBusy] = useState<'connect' | 'confirm' | null>(null)

  useEffect(() => {
    if (!busy) return
    const t = window.setTimeout(() => {
      setSub(busy === 'connect' ? 'account' : 'done')
      setBusy(null)
    }, busy === 'connect' ? 1400 : 1300)
    return () => window.clearTimeout(t)
  }, [busy])

  const value = Number(digitsOnly(amount) || 0)
  const instant = Math.min(value, 250)
  const valid = value >= 1 && value <= Math.min(5000, account.balance)

  if (sub === 'bank')
    return (
      <>
        <Heading eyebrow="Transfer money in" title="Which bank are you moving money from?" body="We’ll link it securely to confirm it’s yours. No waiting for tiny test deposits." />
        <ul className="grid grid-cols-2 gap-2">
          {banks.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => {
                  setBank(b)
                  setSub('login')
                }}
                className="flex min-h-16 w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-[11px] font-bold text-primary">{b.name.slice(0, 2).toUpperCase()}</span>
                <span className="text-sm font-medium leading-tight">{b.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </>
    )

  if (sub === 'login')
    return (
      <>
        <Heading eyebrow={bank.name} title={`Sign in to ${bank.name}.`} body="Your login goes straight to your bank. TD never sees or stores it." />
        <div className="flex flex-col gap-4 rounded-3xl bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Lock className="size-4" aria-hidden /> Secure bank connection
          </div>
          <Field label="Username" defaultValue="ava.morgan" autoComplete="username" />
          <Field label="Password" type="password" defaultValue="password123" autoComplete="current-password" />
        </div>
        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
          {['Verify you own the account', 'See the account name and balance'].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> {t}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-col gap-2">
          <Cta onClick={() => setBusy('connect')} busy={busy === 'connect'}>
            {busy === 'connect' ? 'Connecting…' : 'Allow and continue'}
          </Cta>
          <Cta variant="ghost" onClick={() => setSub('bank')}>
            Choose a different bank
          </Cta>
        </div>
      </>
    )

  if (sub === 'account')
    return (
      <>
        <Heading eyebrow={bank.name} title="Choose the account to pull from." />
        <div className="flex flex-col gap-3" role="radiogroup" aria-label="Account">
          {externalAccounts.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={account.id === a.id}
              onClick={() => setAccount(a)}
              className={cn('flex items-center gap-3 rounded-2xl border p-4 text-left', account.id === a.id ? 'border-primary bg-accent' : 'bg-card')}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  {bank.name} {a.label} ••{a.mask}
                </span>
                <span className="tabular block text-xs text-muted-foreground">{money(a.balance)} available</span>
              </span>
              <Check className={cn('size-5', account.id === a.id ? 'text-primary' : 'text-transparent')} aria-hidden />
            </button>
          ))}
        </div>
        <div className="mt-auto">
          <Cta onClick={() => setSub('amount')}>Continue</Cta>
        </div>
      </>
    )

  if (sub === 'amount')
    return (
      <>
        <Heading eyebrow="Transfer money in" title="How much would you like to add?" body="Up to $5,000 per transfer." />
        <div className="flex gap-2" role="group" aria-label="Quick amounts">
          {[100, 250, 500, 1000].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={value === n}
              onClick={() => setAmount(String(n))}
              className={cn('h-12 flex-1 rounded-xl border text-sm font-semibold', value === n ? 'border-primary bg-accent text-primary' : 'bg-card')}
            >
              ${n.toLocaleString()}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Amount
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <input inputMode="numeric" value={amount} onChange={(e) => setAmount(digitsOnly(e.target.value))} className={cn(inputClass, 'tabular pl-7 font-mono')} />
          </div>
        </label>
        {valid && <Note>{money(instant)} is available right away. {value > instant ? `The other ${money(value - instant)} arrives by Thu, Nov 12.` : 'Everything is available now.'}</Note>}
        {!valid && value > 0 && <Note tone="warn">Enter an amount between $1 and {money(Math.min(5000, account.balance))}.</Note>}
        <div className="mt-auto">
          <Cta onClick={() => setSub('review')} disabled={!valid}>
            Review transfer
          </Cta>
        </div>
      </>
    )

  if (sub === 'review')
    return (
      <>
        <Heading eyebrow="Almost done" title="Review your transfer." />
        <DetailRows
          rows={[
            { label: 'From', value: `${bank.name} ${account.label} ••${account.mask}` },
            { label: 'To', value: `TD Everyday Checking ••${ACCOUNT.mask}` },
            { label: 'Amount', value: money(value) },
            { label: 'Fee', value: '$0.00' },
            { label: 'Available', value: `${money(instant)} now${value > instant ? `, rest by Nov 12` : ''}` },
          ]}
        />
        <p className="text-xs leading-relaxed text-muted-foreground">By confirming, you authorize TD to debit this account once for the amount shown.</p>
        <div className="mt-auto flex flex-col gap-2">
          <Cta onClick={() => setBusy('confirm')} busy={busy === 'confirm'}>
            <ScanFace className="size-5" aria-hidden /> {busy === 'confirm' ? 'Confirming…' : 'Confirm with Face ID'}
          </Cta>
          <Cta variant="ghost" onClick={() => setSub('amount')}>
            Change amount
          </Cta>
        </div>
      </>
    )

  return (
    <>
      <SuccessMark title={`${money(value)} is on its way.`} body={`${money(instant)} is in your account now. ${value > instant ? `The rest lands by Thu, Nov 12.` : ''}`} />
      <DetailRows
        rows={[
          { label: 'Reference', value: 'TD-ACH-48213' },
          { label: 'From', value: `${bank.name} ••${account.mask}` },
          { label: 'Available now', value: money(instant) },
          { label: 'Arriving Nov 12', value: money(Math.max(value - instant, 0)) },
        ]}
      />
      <div className="mt-auto">
        <Cta onClick={() => onDone({ method: 'ach', label: `Transfer from ${bank.name} ••${account.mask}`, posted: instant, summary: `${money(value)} from ${bank.name} ••${account.mask}` })}>
          Continue <ArrowRight className="size-4" aria-hidden />
        </Cta>
      </div>
    </>
  )
}

/* ---------- Apple Pay / Google Pay ---------- */

export function WalletFundingFlow({ onDone }: { onDone: (r: FundingResult) => void }) {
  const [sub, setSub] = useState<'amount' | 'sheet' | 'done'>('amount')
  const [wallet, setWallet] = useState<'Apple Pay' | 'Google Pay'>('Apple Pay')
  const [amount, setAmount] = useState(250)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (!paying) return
    const t = window.setTimeout(() => {
      setPaying(false)
      setSub('done')
    }, 1500)
    return () => window.clearTimeout(t)
  }, [paying])

  if (sub === 'amount')
    return (
      <>
        <Heading eyebrow="Instant funding" title="Add money with your wallet." body="Use a debit card you already have in your wallet. No bank login needed." />
        <div className="flex gap-1 rounded-2xl bg-muted p-1" role="group" aria-label="Wallet">
          {(['Apple Pay', 'Google Pay'] as const).map((w) => (
            <button key={w} type="button" aria-pressed={wallet === w} onClick={() => setWallet(w)} className={cn('h-11 flex-1 rounded-xl text-sm font-semibold', wallet === w ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
              {w}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2" role="group" aria-label="Amount">
          {[50, 100, 250, 500].map((n) => (
            <button key={n} type="button" aria-pressed={amount === n} onClick={() => setAmount(n)} className={cn('h-12 rounded-xl border text-sm font-semibold', amount === n ? 'border-primary bg-accent text-primary' : 'bg-card')}>
              ${n}
            </button>
          ))}
        </div>
        <Note>Instant and free. Up to $2,500 a day while your account is new.</Note>
        <div className="mt-auto">
          <Cta onClick={() => setSub('sheet')}>
            Add {money(amount)} with {wallet}
          </Cta>
        </div>
      </>
    )

  if (sub === 'sheet')
    return (
      <>
        <Heading title={wallet} />
        <div className="overflow-hidden rounded-3xl border bg-card">
          <div className="flex items-center gap-3 border-b px-5 py-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-forest text-lime">
              <Banknote className="size-5" aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold">TD Bank</span>
              <span className="block text-xs text-muted-foreground">Deposit to Everyday Checking ••{ACCOUNT.mask}</span>
            </span>
          </div>
          <dl className="divide-y text-sm">
            <div className="flex justify-between px-5 py-3"><dt className="text-muted-foreground">Card</dt><dd className="font-medium">Visa Debit ••8820</dd></div>
            <div className="flex justify-between px-5 py-3"><dt className="text-muted-foreground">Fee</dt><dd className="font-medium">$0.00</dd></div>
            <div className="flex justify-between px-5 py-4 text-base"><dt className="font-semibold">Total</dt><dd className="tabular font-mono font-semibold">{money(amount)}</dd></div>
          </dl>
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setPaying(true)}
            disabled={paying}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-foreground font-semibold text-background disabled:opacity-60"
          >
            <ScanFace className="size-5" aria-hidden /> {paying ? 'Processing…' : wallet === 'Apple Pay' ? 'Pay with Face ID' : 'Pay'}
          </button>
          <Cta variant="ghost" onClick={() => setSub('amount')}>
            Cancel
          </Cta>
        </div>
      </>
    )

  return (
    <>
      <SuccessMark title={`${money(amount)} added instantly.`} body="It’s in your account now and ready to spend." />
      <DetailRows
        rows={[
          { label: 'Paid with', value: `${wallet} · Visa Debit ••8820` },
          { label: 'To', value: `TD Everyday Checking ••${ACCOUNT.mask}` },
          { label: 'Available', value: 'Right now' },
        ]}
      />
      <div className="mt-auto">
        <Cta onClick={() => onDone({ method: 'wallet', label: `${wallet} deposit`, posted: amount, summary: `${money(amount)} via ${wallet}` })}>
          Continue <ArrowRight className="size-4" aria-hidden />
        </Cta>
      </div>
    </>
  )
}
