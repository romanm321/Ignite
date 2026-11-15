'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  CalendarClock,
  ChevronRight,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Gift,
  Leaf,
  Pencil,
  PiggyBank,
  Repeat,
  Search,
  ShieldCheck,
  Snowflake,
  Sparkles,
  TriangleAlert,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { accountDetails, formatMoney, type Account } from '@/lib/bank-data'
import { enrich } from '@/lib/enrichment'
import { rewardFor } from '@/lib/rewards'
import { accountOf, defaultAccountSettings, useBank, type AccountSettings } from '../bank-provider'
import { BottomSheet, Field, OverlayFrame, PrimaryButton, inputClass } from '../overlay'
import { Pill, SectionHeader, Switch } from '../primitives'
import { TransactionRow } from '../transactions/transaction-row'
import { accountApy } from './account-row'
import { TransferSheet } from './transfer-sheet'
import { SegmentPanel, isSegmentAccount } from '../products/segment-panel'

type Filter = 'all' | 'in' | 'out' | 'recurring'
type Sheet = null | 'in' | 'out' | 'pay' | 'rename' | 'close'

const kindLabel: Record<Account['kind'], string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit: 'Credit card',
}

export function AccountDetail() {
  const { accountId, accounts, transactions, streetSafe, cardFrozen, accountSettings, rewardsBalance, dispatch, notify } =
    useBank()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [sheet, setSheet] = useState<Sheet>(null)
  const [reveal, setReveal] = useState(false)

  const account = accounts.find((a) => a.id === accountId)
  const txns = useMemo(() => transactions.filter((t) => accountOf(t) === accountId), [transactions, accountId])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return txns.filter((t) => {
      if (filter === 'in' && t.amount <= 0) return false
      if (filter === 'out' && t.amount >= 0) return false
      if (filter === 'recurring' && !enrich(t).subscription) return false
      if (!q) return true
      const e = enrich(t)
      return `${e.name} ${e.detailed} ${t.merchant}`.toLowerCase().includes(q)
    })
  }, [txns, filter, query])

  if (!account) return null

  const details = accountDetails[account.id] ?? { number: `•••• •••• ${account.mask}`, opened: 'Today' }
  const settings: AccountSettings = { ...defaultAccountSettings, ...accountSettings[account.id] }
  const masked = streetSafe
  const show = (n: number) => (masked ? '••••' : formatMoney(n))
  const close = () => dispatch({ type: 'openAccount', id: null })
  const setSetting = (key: keyof AccountSettings, value: boolean) => {
    dispatch({ type: 'accountSetting', id: account.id, key, value })
  }

  const moneyIn = txns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const moneyOut = txns.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const recurring = txns.filter((t) => enrich(t).subscription)
  const apy = accountApy(account)

  const isCredit = account.kind === 'credit'
  const pendingRewards = isCredit ? txns.reduce((s, t) => s + (rewardFor(t, account.id)?.amount ?? 0), 0) : 0
  const limit = account.limit ?? 0
  const owed = Math.abs(Math.min(account.balance, 0))
  const utilization = limit ? Math.min(100, (owed / limit) * 100) : 0
  const minimum = Math.min(owed, Math.max(35, Math.round(owed * 0.02)))

  const actions = isCredit
    ? [
        { label: 'Pay', icon: ArrowDownLeft, run: () => setSheet('pay'), primary: true },
        {
          label: cardFrozen ? 'Unfreeze' : 'Freeze',
          icon: Snowflake,
          run: () => {
            dispatch({ type: 'freeze', frozen: !cardFrozen })
            notify(cardFrozen ? 'Card unfrozen' : 'Card frozen instantly')
          },
        },
        { label: 'Card controls', icon: CreditCard, run: () => dispatch({ type: 'navigate', tab: 'cards' }) },
      ]
    : [
        { label: 'Move in', icon: ArrowDownLeft, run: () => setSheet('in'), primary: true },
        { label: 'Move out', icon: ArrowUpRight, run: () => setSheet('out') },
        {
          label: 'Ask Tedi',
          icon: Sparkles,
          run: () => {
            close()
            dispatch({ type: 'navigate', tab: 'sage' })
          },
        },
      ]

  const settingRows: { key: keyof AccountSettings; label: string; detail: string; icon: typeof Bell; show: boolean }[] = [
    { key: 'autopay', label: 'Autopay', detail: 'Pay the statement balance from checking on the due date', icon: CalendarClock, show: isCredit },
    {
      key: 'overdraftProtection',
      label: 'Overdraft protection',
      detail: 'Pull from TD Growth Savings instead of declining',
      icon: ShieldCheck,
      show: account.kind === 'checking',
    },
    { key: 'roundUps', label: 'Round-ups', detail: 'Save the spare change from card purchases', icon: PiggyBank, show: account.kind === 'savings' },
    { key: 'lowBalanceAlert', label: 'Low balance alert', detail: 'Notify me under $250', icon: Bell, show: !isCredit },
    { key: 'largePurchaseAlert', label: 'Large purchase alert', detail: 'Notify me over $200', icon: TriangleAlert, show: true },
    { key: 'paperless', label: 'Paperless statements', detail: 'Get statements in the app only', icon: Leaf, show: true },
  ]

  return (
    <>
      <OverlayFrame title={account.name} onBack={close}>
        <div className="flex flex-col gap-5 px-4">
          <section
            aria-labelledby="acct-balance"
            className={cn(
              'relative overflow-hidden rounded-3xl p-5',
              account.kind === 'checking' && 'bg-primary text-primary-foreground',
              account.kind === 'savings' && 'bg-lime text-lime-foreground',
              isCredit && 'bg-forest text-forest-foreground',
            )}
          >
            <div aria-hidden className="absolute -right-12 -top-12 size-40 rounded-full bg-white/10" />
            <div className="relative flex items-center justify-between text-sm">
              <span className="opacity-80">
                {kindLabel[account.kind]} •••• {account.mask}
              </span>
              {apy && <Pill className="bg-white/20">{apy.toFixed(2)}% APY</Pill>}
              {isCredit && cardFrozen && (
                <Pill className="bg-sky-100 text-sky-800">
                  <Snowflake className="size-3" aria-hidden /> Frozen
                </Pill>
              )}
            </div>
            <p id="acct-balance" className="relative mt-4 text-sm opacity-80">
              {isCredit ? 'Current balance' : 'Available balance'}
            </p>
            <p className="tabular relative font-mono text-4xl font-semibold tracking-tight">{show(isCredit ? owed : account.balance)}</p>

            {isCredit ? (
              <div className="relative mt-4">
                <div className="h-2 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-lime" style={{ width: `${utilization}%` }} />
                </div>
                <p className="mt-2 text-sm opacity-80">
                  {show(limit - owed)} available of {show(limit)} · {Math.round(utilization)}% used
                </p>
              </div>
            ) : (
              <p className="relative mt-2 text-sm opacity-80">
                {show(moneyIn)} in · {show(moneyOut)} out this period
              </p>
            )}
          </section>

          <div className="grid grid-cols-3 gap-2">
            {actions.map(({ label, icon: Icon, run, primary }) => (
              <button
                key={label}
                type="button"
                onClick={run}
                className={cn(
                  'flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl text-sm font-medium',
                  primary ? 'bg-primary text-primary-foreground' : 'bg-card',
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </button>
            ))}
          </div>

          {isSegmentAccount(account.id) && <SegmentPanel id={account.id} />}

          {isCredit && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'openRewards', id: account.id })}
              className="flex min-h-16 items-center gap-3 rounded-3xl bg-lime p-4 text-left text-lime-foreground"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-forest text-lime">
                <Gift className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Rewards Hub</span>
                <span className="tabular block text-sm opacity-80">
                  {show(rewardsBalance)} available · +{show(pendingRewards)} this statement
                </span>
              </span>
              <ChevronRight className="size-5" aria-hidden />
            </button>
          )}

          {isCredit && (
            <section aria-labelledby="statement-h" className="rounded-3xl bg-card p-4">
              <div className="flex items-center justify-between">
                <h2 id="statement-h" className="font-semibold">
                  Statement
                </h2>
                <Pill className={settings.autopay ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}>
                  {settings.autopay ? 'Autopay on' : 'Autopay off'}
                </Pill>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <Stat label="Statement" value={show(owed)} />
                <Stat label="Minimum due" value={show(minimum)} />
                <Stat label="Due" value="Nov 28" />
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                Purchase APR {accountDetails[account.id]?.apr ?? 21.24}% · Pay the statement balance to avoid interest.
              </p>
            </section>
          )}

          {account.kind === 'savings' && (
            <section aria-labelledby="interest-h" className="rounded-3xl bg-card p-4">
              <h2 id="interest-h" className="font-semibold">
                Interest
              </h2>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <Stat label="This month" value={show(((account.balance * (apy ?? 0)) / 100 / 12) * 0.85)} />
                <Stat label="Year to date" value={show(txns.filter((t) => t.merchant.startsWith('Interest')).reduce((s, t) => s + t.amount, 0) * 5)} />
                <Stat label="Projected / yr" value={show((account.balance * (apy ?? 0)) / 100)} />
              </dl>
            </section>
          )}

          {recurring.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'overlay', overlay: 'subscriptions' })}
              className="flex min-h-14 items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-lime text-lime-foreground">
                <Repeat className="size-[18px]" aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block font-medium">{recurring.length} {recurring.length === 1 ? 'subscription' : 'subscriptions'} on this account</span>
                <span className="block text-xs text-muted-foreground">
                  {show(recurring.reduce((s, t) => s + Math.abs(t.amount), 0))}/mo · tap to manage
                </span>
              </span>
            </button>
          )}

          <section aria-labelledby="acct-txns" className="flex flex-col gap-3">
            <SectionHeader id="acct-txns" title="Transactions" action={<span className="text-xs text-muted-foreground">{txns.length} total</span>} />
            <label className="relative">
              <span className="sr-only">Search transactions</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search merchants or categories"
                className={cn(inputClass, 'rounded-full pl-10')}
              />
            </label>
            <div role="group" aria-label="Filter transactions" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              {(
                [
                  ['all', 'All'],
                  ['in', 'Money in'],
                  ['out', 'Money out'],
                  ['recurring', 'Recurring'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={filter === id}
                  onClick={() => setFilter(id)}
                  className={cn(
                    'h-10 shrink-0 rounded-xl px-4 text-sm font-medium',
                    filter === id ? 'bg-forest text-forest-foreground' : 'bg-card text-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <ul className="divide-y overflow-hidden rounded-3xl bg-card">
              {visible.map((t) => (
                <li key={t.id}>
                  <TransactionRow txn={t} masked={masked} reward={isCredit ? rewardFor(t, account.id) : null} />
                </li>
              ))}
              {visible.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">No matching transactions</li>}
            </ul>
          </section>

          <section aria-labelledby="acct-info" className="flex flex-col gap-3">
            <SectionHeader id="acct-info" title="Account details" />
            <div className="overflow-hidden rounded-3xl bg-card">
              <div className="flex min-h-16 items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{isCredit ? 'Card number' : 'Account number'}</p>
                  <p className="tabular font-mono font-medium">
                    {reveal && !masked ? details.number : `•••• ${account.mask}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReveal((r) => !r)}
                  disabled={masked}
                  aria-label={reveal ? 'Hide number' : 'Show number'}
                  className="flex size-11 items-center justify-center rounded-full text-muted-foreground disabled:opacity-40"
                >
                  {reveal ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(details.number.replace(/\s/g, '')).catch(() => {})
                    notify('Number copied')
                  }}
                  aria-label="Copy number"
                  className="flex size-11 items-center justify-center rounded-full text-muted-foreground"
                >
                  <Copy className="size-4" aria-hidden />
                </button>
              </div>
              {details.routing && (
                <div className="flex min-h-16 items-center gap-3 border-t px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Routing number (ACH & wire)</p>
                    <p className="tabular font-mono font-medium">{details.routing}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(details.routing ?? '').catch(() => {})
                      notify('Routing number copied')
                    }}
                    aria-label="Copy routing number"
                    className="flex size-11 items-center justify-center rounded-full text-muted-foreground"
                  >
                    <Copy className="size-4" aria-hidden />
                  </button>
                </div>
              )}
              <p className="border-t px-4 py-3 text-xs text-muted-foreground">Opened {details.opened} · FDIC insured up to $250,000</p>
            </div>
          </section>

          <section aria-labelledby="acct-manage" className="flex flex-col gap-3">
            <SectionHeader id="acct-manage" title="Manage" />
            <ul className="divide-y overflow-hidden rounded-3xl bg-card">
              {settingRows
                .filter((r) => r.show)
                .map(({ key, label, detail, icon: Icon }) => (
                  <li key={key} className="flex items-center gap-3 px-4 py-2">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="size-[18px]" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{detail}</p>
                    </div>
                    <Switch
                      label={label}
                      checked={settings[key]}
                      onChange={(v) => {
                        setSetting(key, v)
                        notify(`${label} ${v ? 'on' : 'off'}`)
                      }}
                    />
                  </li>
                ))}
            </ul>
            <ul className="divide-y overflow-hidden rounded-3xl bg-card">
              <ManageLink icon={Pencil} label="Rename account" onClick={() => setSheet('rename')} />
              <ManageLink icon={FileText} label="Statements & tax documents" onClick={() => notify('October statement is ready to download')} />
              <ManageLink icon={XCircle} label={isCredit ? 'Close card' : 'Close account'} destructive onClick={() => setSheet('close')} />
            </ul>
          </section>
        </div>
      </OverlayFrame>

      {(sheet === 'in' || sheet === 'out' || sheet === 'pay') && (
        <TransferSheet account={account} mode={sheet} onClose={() => setSheet(null)} />
      )}
      {sheet === 'rename' && <RenameSheet account={account} onClose={() => setSheet(null)} />}
      {sheet === 'close' && (
        <BottomSheet
          title={isCredit ? 'Close this card?' : 'Close this account?'}
          description="A banker will confirm by phone before anything changes. Closing can affect your credit history and linked payments."
          onClose={() => setSheet(null)}
        >
          <div className="flex flex-col gap-2">
            <PrimaryButton
              onClick={() => {
                setSheet(null)
                notify('Request sent · a banker will call within 1 business day')
              }}
              className="bg-destructive text-white"
            >
              Request closure
            </PrimaryButton>
            <button type="button" onClick={() => setSheet(null)} className="h-12 rounded-xl font-medium">
              Keep it open
            </button>
          </div>
        </BottomSheet>
      )}
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="tabular truncate font-mono font-semibold">{value}</dd>
    </div>
  )
}

function ManageLink({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: typeof Pencil
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn('flex min-h-14 w-full items-center gap-3 px-4 text-left font-medium', destructive && 'text-destructive')}
      >
        <Icon className="size-5" aria-hidden />
        {label}
      </button>
    </li>
  )
}

function RenameSheet({ account, onClose }: { account: Account; onClose: () => void }) {
  const { dispatch, notify } = useBank()
  const [name, setName] = useState(account.name)
  const trimmed = name.trim()
  const save = () => {
    if (!trimmed) return
    dispatch({ type: 'renameAccount', id: account.id, name: trimmed.slice(0, 32) })
    notify('Account renamed')
    onClose()
  }
  return (
    <BottomSheet title="Rename account" description="Only you see this nickname." onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Nickname">
          <input
            value={name}
            maxLength={32}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) save()
            }}
            className={inputClass}
          />
        </Field>
        <PrimaryButton onClick={save} disabled={!trimmed}>
          Save
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}
