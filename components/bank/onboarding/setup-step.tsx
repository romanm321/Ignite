'use client'

import { createContext, useContext, useState } from 'react'
import { ArrowRight, Delete } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney, type Account } from '@/lib/bank-data'
import { cardDesigns, cdTerms, riskProfiles, type Product } from '@/lib/offers'
import { boostCategories, studentPerkChoices, sweepTargets } from '@/lib/segments'
import { useBank } from '../bank-provider'
import { BottomSheet, inputClass, PrimaryButton } from '../overlay'
import { Switch, TdGlyph } from '../primitives'
import { StepBody } from './identity-steps'

export type SetupValues = {
  vaultName: string
  vaultGoal: string
  vaultAccess: 'instant' | 'select'
  vaultPhoto?: string
  /** Which of the customer's accounts the opening deposit comes from. */
  fromId: string
  design: (typeof cardDesigns)[number]['id']
  wallet: boolean
  autopay: boolean
  months: number
  amount: string
  risk: (typeof riskProfiles)[number]['id']
  roundUps: boolean
  school: string
  earlyPay: boolean
  creditBuilder: boolean
  studentPerk: (typeof studentPerkChoices)[number]['id']
  boost: (typeof boostCategories)[number]['id']
  sweep: boolean
  sweepTarget: number
}

const defaultAmount = (p: Product) =>
  p.id === 'student' ? '25' : p.id === 'complete' ? '2500' : p.id === 'growth-savings' ? '0' : p.setup === 'invest' ? '100' : '5000'

export const accountMinimum = (p: Product) => (p.id === 'student' || p.id === 'growth-savings' ? 0 : p.id === 'complete' ? 100 : 250)

export const defaultSetup = (p: Product): SetupValues => ({
  vaultName: '',
  vaultGoal: '5000',
  vaultAccess: 'instant',
  fromId: 'chk',
  design: 'forest',
  wallet: true,
  autopay: true,
  months: 12,
  amount: defaultAmount(p),
  risk: 'balanced',
  roundUps: true,
  school: '',
  earlyPay: true,
  creditBuilder: true,
  studentPerk: 'spotify',
  boost: 'dining',
  sweep: true,
  sweepTarget: 10000,
})

export const parseAmount = (s: string) => Number(s.replace(/[^\d.]/g, '')) || 0

export function cdEarnings(amount: number, months: number) {
  const apy = cdTerms.find((t) => t.months === months)?.apy ?? 0
  return amount * (Math.pow(1 + apy / 100, months / 12) - 1)
}

export function CardArt({ design, mask, className, label = 'Double Up' }: { design: SetupValues['design']; mask: string; className?: string; label?: string }) {
  const d = cardDesigns.find((c) => c.id === design) ?? cardDesigns[0]
  return (
    <div className={cn('relative flex aspect-[1.586] w-full flex-col justify-between overflow-hidden rounded-3xl p-5 shadow-lg', d.className, className)}>
      <span aria-hidden className="absolute -right-10 -top-10 size-40 rounded-full bg-current opacity-[0.06]" />
      <div className="flex items-center justify-between">
        <TdGlyph className="h-5" label="TD" />
        <span className="text-xs font-semibold uppercase tracking-widest opacity-70">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="tabular font-mono text-sm tracking-widest opacity-80">•••• {mask}</span>
        <span className="text-sm font-bold italic">VISA</span>
      </div>
    </div>
  )
}

function Chips({ options, value, onChange, label }: { options: number[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(String(o))}
          aria-pressed={parseAmount(value) === o}
          className={cn(
            'h-11 flex-1 rounded-xl border text-sm font-semibold',
            parseAmount(value) === o ? 'border-shield bg-shield-50 text-shield-700' : 'bg-card',
          )}
        >
          ${o.toLocaleString()}
        </button>
      ))}
    </div>
  )
}

type SetupProps = {
  product: Product
  values: SetupValues
  set: (patch: Partial<SetupValues>) => void
  onNext: () => void
}

const FundingContext = createContext<{ sources: Account[]; source: Account | undefined; setFrom: (id: string) => void } | null>(null)

/** Accounts the opening deposit can come from: checking and open savings, but not locked CDs or the account being opened. */
export function fundingSources(accounts: Account[], product: Product) {
  if (product.setup === 'card') return []
  const opening = product.id === 'growth-savings' ? 'sav-new' : product.id
  return accounts.filter((a) => (a.kind === 'checking' || a.kind === 'savings') && a.id !== opening && a.id !== 'cd' && a.id !== 'step-cd')
}

export function SetupStep(props: SetupProps) {
  const { accounts } = useBank()
  const sources = fundingSources(accounts, props.product)
  const source = sources.find((a) => a.id === props.values.fromId) ?? sources.find((a) => a.id === 'chk') ?? sources[0]
  return (
    <FundingContext.Provider value={{ sources, source, setFrom: (fromId) => props.set({ fromId }) }}>
      <SetupStepInner {...props} />
    </FundingContext.Provider>
  )
}

function SetupStepInner({ product, values, set, onNext }: SetupProps) {
  const funding = useContext(FundingContext)
  const checking = funding?.source?.balance ?? 0
  const amount = parseAmount(values.amount)

  if (product.setup === 'card') {
    return (
      <StepBody title="Make it yours" body="Pick a look. Your virtual card works the moment you’re approved.">
        <CardArt design={values.design} mask={product.mask} />
        <div role="radiogroup" aria-label="Card design" className="flex justify-center gap-4">
          {cardDesigns.map((d) => (
            <button
              key={d.id}
              type="button"
              role="radio"
              aria-checked={values.design === d.id}
              onClick={() => set({ design: d.id })}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  'flex size-12 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-background',
                  values.design === d.id ? 'ring-primary' : 'ring-transparent',
                )}
              >
                <span className={cn('size-10 rounded-full', d.className)} />
              </span>
              <span className="text-xs font-medium">{d.label}</span>
            </button>
          ))}
        </div>
        <ul className="divide-y rounded-3xl border bg-card">
          <li className="flex items-center gap-3 py-2 pl-4 pr-3">
            <span className="flex-1">
              <span className="block text-sm font-semibold">Add to Apple Pay & Google Pay</span>
              <span className="block text-xs text-muted-foreground">Tap to pay before the card arrives</span>
            </span>
            <Switch label="Add to digital wallets" checked={values.wallet} onChange={(wallet) => set({ wallet })} />
          </li>
          <li className="flex items-center gap-3 py-2 pl-4 pr-3">
            <span className="flex-1">
              <span className="block text-sm font-semibold">AutoPay full balance</span>
              <span className="block text-xs text-muted-foreground">From Everyday Checking, never pay interest</span>
            </span>
            <Switch label="AutoPay" checked={values.autopay} onChange={(autopay) => set({ autopay })} />
          </li>
        </ul>
        <div className="mt-auto">
          <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
        </div>
      </StepBody>
    )
  }

  if (product.setup === 'deposit') {
    const valid = amount >= 250 && amount <= checking
    return (
      <StepBody title="Choose your term and deposit" body="Your rate is locked the moment you open.">
        <div role="radiogroup" aria-label="CD term" className="grid grid-cols-3 gap-2">
          {cdTerms.map((t) => (
            <button
              key={t.months}
              type="button"
              role="radio"
              aria-checked={values.months === t.months}
              onClick={() => set({ months: t.months })}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-2xl border p-3',
                values.months === t.months ? 'border-primary bg-accent text-accent-foreground' : 'bg-card',
              )}
            >
              <span className="text-xs font-medium">{t.months} months</span>
              <span className="tabular font-mono text-lg font-semibold">{t.apy.toFixed(2)}%</span>
              <span className="text-xs uppercase tracking-wider opacity-70">interest</span>
            </button>
          ))}
        </div>
        <AmountField value={values.amount} onChange={(amount) => set({ amount })} checking={checking} min={250} />
        <Chips label="Quick amounts" options={[1000, 2500, 5000]} value={values.amount} onChange={(amount) => set({ amount })} />
        <div className="rounded-3xl bg-forest p-4 text-forest-foreground">
          <p className="text-sm text-forest-foreground/70">You&apos;ll earn about</p>
          <p className="tabular font-mono text-3xl font-semibold text-lime">
            {formatMoney(valid ? cdEarnings(amount, values.months) : 0)}
          </p>
          <p className="mt-1 text-xs text-forest-foreground/70">Guaranteed over {values.months} months, FDIC insured</p>
        </div>
        <div className="mt-auto">
          <PrimaryButton onClick={onNext} disabled={!valid}>
            Continue
          </PrimaryButton>
        </div>
      </StepBody>
    )
  }

  if (product.setup === 'account') {
    return <AccountSetup product={product} values={values} set={set} onNext={onNext} checking={checking} />
  }

  const risk = riskProfiles.find((r) => r.id === values.risk) ?? riskProfiles[1]
  const valid = amount >= 5 && amount <= checking
  return (
    <StepBody title="How do you want to invest?" body="You can change this anytime. We rebalance for you.">
      <div role="radiogroup" aria-label="Risk level" className="flex flex-col gap-2">
        {riskProfiles.map((r) => (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={values.risk === r.id}
            onClick={() => set({ risk: r.id })}
            className={cn(
              'flex items-center gap-3 rounded-2xl border p-3 text-left',
              values.risk === r.id ? 'border-primary bg-accent text-accent-foreground' : 'bg-card',
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{r.label}</span>
              <span className="block text-xs opacity-70">{r.blurb}</span>
            </span>
            <span className="tabular font-mono text-sm font-semibold">~{r.ret}%/yr</span>
          </button>
        ))}
      </div>
      <div>
        <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
          <span className="bg-primary transition-all" style={{ width: `${risk.stocks}%` }} />
          <span className="flex-1 bg-lime" />
        </div>
        <p className="mt-1.5 flex justify-between text-xs text-muted-foreground">
          <span>{risk.stocks}% stocks</span>
          <span>{100 - risk.stocks}% bonds</span>
        </p>
      </div>
      <AmountField value={values.amount} onChange={(amount) => set({ amount })} checking={checking} min={5} />
      <Chips label="Quick amounts" options={[5, 100, 500]} value={values.amount} onChange={(amount) => set({ amount })} />
      <div className="flex items-center gap-3 rounded-3xl border bg-card py-2 pl-4 pr-3">
        <span className="flex-1">
          <span className="block text-sm font-semibold">Invest my round-ups</span>
          <span className="block text-xs text-muted-foreground">Spare change from card purchases, about $38/mo</span>
        </span>
        <Switch label="Invest round-ups" checked={values.roundUps} onChange={(roundUps) => set({ roundUps })} />
      </div>
      <div className="mt-auto">
        <PrimaryButton onClick={onNext} disabled={!valid}>
          Continue
        </PrimaryButton>
      </div>
    </StepBody>
  )
}

function ChoiceList<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { id: T; label: string; detail: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-2.5 text-left',
            value === o.id ? 'border-primary bg-accent text-accent-foreground' : 'bg-card',
          )}
        >
          <span
            aria-hidden
            className={cn(
              'flex size-5 shrink-0 items-center justify-center rounded-full border-2',
              value === o.id ? 'border-primary' : 'border-muted-foreground/40',
            )}
          >
            {value === o.id && <span className="size-2.5 rounded-full bg-primary" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{o.label}</span>
            <span className="block text-xs opacity-70">{o.detail}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

function ToggleRow({ title, detail, checked, onChange }: { title: string; detail: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <li className="flex items-center gap-3 py-2 pl-4 pr-3">
      <span className="flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{detail}</span>
      </span>
      <Switch label={title} checked={checked} onChange={onChange} />
    </li>
  )
}

function AccountSetup({
  product,
  values,
  set,
  onNext,
  checking,
}: {
  product: Product
  values: SetupValues
  set: (patch: Partial<SetupValues>) => void
  onNext: () => void
  checking: number
}) {
  const amount = parseAmount(values.amount)
  const min = accountMinimum(product)
  const fundingValid = amount >= min && amount <= checking

  if (product.id === 'student') {
    const schoolValid = values.school.trim().length >= 2
    return (
      <StepBody title="Let’s set you up for campus life" body="Tell us where you study and pick your free perk. You can change all of this later.">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">School</span>
          <input
            value={values.school}
            onChange={(e) => set({ school: e.target.value })}
            placeholder="e.g. NYU, Columbia, CUNY Hunter"
            autoComplete="organization"
            className={inputClass}
          />
          <span className="text-xs text-muted-foreground">We confirm enrollment instantly through the National Student Clearinghouse.</span>
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Your free Perks Pass pick</span>
          <ChoiceList label="Student perk" options={studentPerkChoices} value={values.studentPerk} onChange={(studentPerk) => set({ studentPerk })} />
        </div>

        <ul className="divide-y rounded-3xl border bg-card">
          <ToggleRow
            title="Get paid up to 2 days early"
            detail="Campus job and refund deposits, the moment we get them"
            checked={values.earlyPay}
            onChange={(earlyPay) => set({ earlyPay })}
          />
          <ToggleRow
            title="Turn on Credit Builder"
            detail="Report rent & subscriptions to build your score"
            checked={values.creditBuilder}
            onChange={(creditBuilder) => set({ creditBuilder })}
          />
        </ul>

        <AmountField value={values.amount} onChange={(v) => set({ amount: v })} checking={checking} min={min} label="Optional first deposit" />
        <div className="mt-auto">
          <PrimaryButton onClick={onNext} disabled={!schoolValid || !fundingValid}>
            Continue
          </PrimaryButton>
        </div>
      </StepBody>
    )
  }

  if (product.id === 'growth-savings') {
    return <KeypadFunding product={product} values={values} set={set} onNext={onNext} balance={checking} />
  }

  return (
    <StepBody title="Make Complete work harder for you" body="Choose your rewards boost and how much cash to keep on hand. Change it anytime.">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Your 5% boost category this quarter</span>
        <ChoiceList label="Boost category" options={boostCategories} value={values.boost} onChange={(boost) => set({ boost })} />
      </div>

      <div className="flex flex-col gap-3 rounded-3xl bg-forest p-4 text-forest-foreground">
        <div className="flex items-center gap-3">
          <span className="flex-1">
            <span className="block text-sm font-semibold">Smart Sweep</span>
            <span className="block text-xs text-forest-foreground/70">Cash above your target earns 5.10% overnight</span>
          </span>
          <Switch label="Smart Sweep" checked={values.sweep} onChange={(sweep) => set({ sweep })} />
        </div>
        {values.sweep && (
          <div role="radiogroup" aria-label="Checking target" className="grid grid-cols-3 gap-2">
            {sweepTargets.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={values.sweepTarget === t}
                onClick={() => set({ sweepTarget: t })}
                className={cn(
                  'h-11 rounded-xl text-sm font-semibold',
                  values.sweepTarget === t ? 'bg-shield text-shield-foreground' : 'bg-white/10',
                )}
              >
                Keep {formatMoney(t).replace('.00', '')}
              </button>
            ))}
          </div>
        )}
      </div>

      <AmountField value={values.amount} onChange={(v) => set({ amount: v })} checking={checking} min={min} />
      <Chips label="Quick amounts" options={[1000, 2500, 5000]} value={values.amount} onChange={(v) => set({ amount: v })} />
      <p className="rounded-2xl bg-accent p-3 text-sm leading-relaxed text-accent-foreground">
        Bring $10,000 in new money within 60 days for your $750 welcome bonus. Moving TD money counts toward your balance, not the bonus.
      </p>
      <div className="mt-auto">
        <PrimaryButton onClick={onNext} disabled={!fundingValid}>
          Continue
        </PrimaryButton>
      </div>
    </StepBody>
  )
}

function AmountField({
  value,
  onChange,
  checking,
  min,
  label,
}: {
  value: string
  onChange: (v: string) => void
  checking: number
  min: number
  label?: string
}) {
  const funding = useContext(FundingContext)
  const sourceName = funding?.source?.name ?? 'Everyday Checking'
  const n = parseAmount(value)
  const error = n < min ? `Minimum is ${formatMoney(min)}` : n > checking ? `More than the balance in ${sourceName}` : null
  return (
    <div className="flex flex-col gap-4">
      {funding && funding.sources.length > 1 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Move money from</legend>
          {funding.sources.map((a) => (
            <label
              key={a.id}
              className={cn(
                'flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border bg-card px-4 py-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
                funding.source?.id === a.id && 'border-primary bg-accent',
              )}
            >
              <input
                type="radio"
                name="fund-from"
                checked={funding.source?.id === a.id}
                onChange={() => funding.setFrom(a.id)}
                className="size-5 accent-[var(--primary)]"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{a.name}</span>
                <span className="block text-xs text-muted-foreground">•••• {a.mask}</span>
              </span>
              <span className="tabular font-mono text-sm font-semibold">{formatMoney(a.balance)}</span>
            </label>
          ))}
        </fieldset>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{label ?? `Deposit from ${sourceName}`}</span>
        <span className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <input
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={!!error}
            className={cn(inputClass, 'tabular pl-7 font-mono', error && 'border-destructive')}
          />
        </span>
        <span className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
          {error ?? `${formatMoney(checking)} available`}
        </span>
      </label>
    </div>
  )
}

const quickAmounts = [50, 100, 250, 500]
const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'] as const

/** Amount first: a large figure, where the money moves from and to, and a keypad. */
function KeypadFunding({ product, values, set, onNext, balance }: SetupProps & { balance: number }) {
  const funding = useContext(FundingContext)
  const [picking, setPicking] = useState(false)
  const amount = parseAmount(values.amount)
  const over = amount > balance
  const valid = amount > 0 && !over
  const source = funding?.source
  const canChoose = (funding?.sources.length ?? 0) > 1

  const press = (key: string) => {
    const current = values.amount === '0' ? '' : values.amount
    if (key === 'back') return set({ amount: current.slice(0, -1) || '0' })
    if (key === '.') return current.includes('.') ? undefined : set({ amount: (current || '0') + '.' })
    const decimals = current.split('.')[1]
    if (decimals !== undefined && decimals.length >= 2) return
    if (current.replace('.', '').length >= 8) return
    set({ amount: current + key })
  }

  const [whole, decimals] = (values.amount || '0').split('.')
  const shown = Number(whole || 0).toLocaleString('en-US') + (values.amount.includes('.') ? '.' + (decimals ?? '') : '')

  return (
    <div
      className="flex min-h-full flex-col px-5 pb-6"
      onKeyDown={(e) => {
        if (picking) return
        if (/^[0-9.]$/.test(e.key)) press(e.key)
        else if (e.key === 'Backspace') press('back')
        else if (e.key === 'Enter' && valid) onNext()
      }}
    >
      <div className="flex flex-col items-center pb-5 pt-4 text-center">
        <p aria-live="polite" aria-label={`Amount, ${formatMoney(amount)}`} className="flex items-start font-heading font-bold leading-none">
          <span className="mt-2 text-4xl">$</span>
          <span className="tabular text-7xl tracking-tight">{shown}</span>
        </p>
        <p className={cn('mt-2 text-sm', over ? 'font-medium text-destructive' : 'text-muted-foreground')} role={over ? 'alert' : undefined}>
          {over ? `More than the balance in ${source?.name ?? 'that account'}` : 'First deposit'}
        </p>
      </div>

      <button
        type="button"
        onClick={() => canChoose && setPicking(true)}
        disabled={!canChoose}
        aria-label={canChoose ? `Moving from ${source?.name}. Change account` : undefined}
        className="flex items-center justify-between gap-3 rounded-3xl bg-forest px-5 py-4 text-forest-foreground disabled:opacity-100"
      >
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-xs uppercase tracking-wider text-forest-foreground/70">From</span>
          <span className="mt-0.5 block font-semibold leading-tight text-lime">{source?.name ?? 'Everyday Checking'}</span>
          <span className="tabular block text-sm text-forest-foreground/80">{formatMoney(source?.balance ?? 0)}</span>
        </span>
        <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15">
          <ArrowRight className="size-4" />
        </span>
        <span className="min-w-0 flex-1 text-right">
          <span className="block text-xs uppercase tracking-wider text-forest-foreground/70">To</span>
          <span className="mt-0.5 block font-semibold leading-tight text-lime">{product.name}</span>
          <span className="tabular block text-sm text-forest-foreground/80">{formatMoney(amount)}</span>
        </span>
      </button>
      {canChoose && <p className="mt-1.5 text-center text-xs text-muted-foreground">Tap From to choose a different account</p>}

      <ul className="mt-4 flex justify-center gap-2" aria-label="Quick amounts">
        {quickAmounts.map((n) => (
          <li key={n}>
            <button
              type="button"
              onClick={() => set({ amount: String(n) })}
              className={cn('h-10 rounded-full border px-4 text-sm font-semibold', amount === n ? 'border-primary bg-accent text-accent-foreground' : 'bg-card')}
            >
              {'$' + n}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 grid grid-cols-3 gap-y-1" role="group" aria-label="Keypad">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            aria-label={k === 'back' ? 'Delete' : k === '.' ? 'Decimal point' : k}
            className="flex h-12 items-center justify-center rounded-2xl text-2xl font-medium active:bg-muted"
          >
            {k === 'back' ? <Delete className="size-6" aria-hidden /> : k}
          </button>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-1 pt-3">
        <PrimaryButton onClick={onNext} disabled={!valid}>
          Continue
        </PrimaryButton>
        <button
          type="button"
          onClick={() => {
            set({ amount: '0' })
            onNext()
          }}
          className="h-12 w-full rounded-xl font-semibold text-primary"
        >
          Add money later
        </button>
      </div>

      {picking && funding && (
        <BottomSheet title="Move money from" description="Choose the account to fund your savings." onClose={() => setPicking(false)}>
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Move money from</legend>
            {funding.sources.map((a) => (
              <label
                key={a.id}
                className={cn(
                  'flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border bg-card px-4 py-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
                  source?.id === a.id && 'border-primary bg-accent',
                )}
              >
                <input
                  type="radio"
                  name="fund-from-keypad"
                  checked={source?.id === a.id}
                  onChange={() => {
                    funding.setFrom(a.id)
                    setPicking(false)
                  }}
                  className="size-5 accent-[var(--primary)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{a.name}</span>
                  <span className="block text-xs text-muted-foreground">•••• {a.mask}</span>
                </span>
                <span className="tabular font-mono text-sm font-semibold">{formatMoney(a.balance)}</span>
              </label>
            ))}
          </fieldset>
        </BottomSheet>
      )}
    </div>
  )
}
