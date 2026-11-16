'use client'

import { useState, useSyncExternalStore, type ReactNode } from 'react'
import Image from 'next/image'
import { Bell, Gauge, Lightbulb, Receipt, ShieldCheck, SlidersHorizontal, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { customer, formatMoney } from '@/lib/bank-data'
import { parentProfile } from '@/lib/family-data'
import { STREET_SAFE_CAP, useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { SectionHeader } from '../primitives'
import { CustomizeHomeSheet } from '../home/customize-home'
import type { HomeTileId } from '../home/home-tiles'
import { AccountRow } from '../accounts/account-row'
import { groupAccounts } from '../accounts/account-groups'
import { useSavingsHome } from '../vaults/use-savings-home'
import { useInvestAccount } from '../invest/use-invest-account'
import { FamilyAccountRow } from '../family/family-account-row'
import { FraudBanner } from '../security/fraud-banner'
import { AccountSetup } from '../setup/account-setup'
import { useNotifications } from '../inbox/use-notifications'
import { SafeToSpend } from '../home/money-position'
import { FinancialHealth } from '../home/financial-health'
import { TediWidget } from '../home/tedi-widget'
import { QuickActions } from '../home/quick-actions'
import { RecentActivity } from '../home/recent-activity'
import { HelpCard } from '../home/help-card'

const noopSubscribe = () => () => {}

// The server renders in UTC, so the time-of-day greeting is only computed in the browser.
function localGreeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

type SkyPhase = 'night' | 'sunrise' | 'day' | 'sunset'

function localSkyPhase(): SkyPhase {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 9) return 'sunrise'
  if (hour >= 9 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'sunset'
  return 'night'
}

const skyline: Record<SkyPhase, { src: string; tint: string; bright: boolean }> = {
  night: { src: '/images/geo/nyc-skyline.png', tint: 'from-forest/85 via-forest/45 to-forest/20', bright: false },
  sunrise: { src: '/images/geo/nyc-skyline-sunrise.png', tint: 'from-black/70 via-black/55 to-black/25', bright: true },
  day: { src: '/images/geo/nyc-skyline-day.png', tint: 'from-black/70 via-black/55 to-black/25', bright: true },
  sunset: { src: '/images/geo/nyc-skyline-sunset.png', tint: 'from-black/65 via-black/50 to-black/20', bright: false },
}

type EditState = { focus: HomeTileId | null } | null

export function HomeScreen() {
  const { accounts, vaults, streetSafe, dispatch, notify, payees, a11y, customerType, homeOrder, homeHidden, setupDismissed } = useBank()
  const [editing, setEditing] = useState<EditState>(null)
  const isNewCustomer = customerType === 'new'
  const simple = a11y.simpleHome
  const nextBill = payees.filter((p) => !p.paid).sort((a, b) => a.dueIn - b.dueIn)[0]
  const greeting = useSyncExternalStore(noopSubscribe, localGreeting, () => 'Welcome back')
  const sky = skyline[useSyncExternalStore(noopSubscribe, localSkyPhase, (): SkyPhase => 'night')]
  const { profile } = useTrust()
  const [doneSuggestions, setDoneSuggestions] = useState<string[]>([])
  const masked = streetSafe

  const investAccount = useInvestAccount()
  const { unreadActions } = useNotifications()
  const savingsHome = useSavingsHome()
  const total =
    accounts.filter((a) => a.kind !== 'credit').reduce((s, a) => s + a.balance, 0) + savingsHome.inVaults + (investAccount?.value ?? 0)
  const owed = accounts.filter((a) => a.kind === 'credit').reduce((s, a) => s + a.balance, 0)
  const netWorth = total + owed
  const listedAccounts = investAccount
    ? [...accounts.filter((a) => a.kind !== 'credit'), investAccount.account, ...accounts.filter((a) => a.kind === 'credit')]
    : accounts
  const show = (n: number) => (masked ? '••••' : formatMoney(n))

  const tokyo = vaults.find((v) => v.id === 'japan')
  const suggestions = [
    {
      id: 'dining',
      icon: Lightbulb,
      title: 'You ate out less this month',
      body: tokyo ? `Nice! Want to put the $150 you saved toward ${tokyo.name}?` : 'Nice! Want to put the $150 you saved somewhere useful?',
      cta: 'Yes, move $150',
      goal: tokyo,
      run: () => {
        if (!tokyo) return
        dispatch({ type: 'vaultTransfer', vaultId: tokyo.id, amount: 150 })
        notify(`Done. $150 is on its way to ${tokyo.name}.`)
      },
    },
    {
      id: 'netflix',
      icon: Zap,
      title: 'Netflix costs more now',
      body: 'It went from $15.99 to $17.99 a month. Want us to help?',
      cta: 'Show me',
      goal: undefined,
      run: () => dispatch({ type: 'overlay', overlay: 'subscriptions' }),
    },
  ].filter((s) => !doneSuggestions.includes(s.id) && (s.id !== 'dining' || s.goal))

  const accountsList = (
    <div>
      <p className="flex items-baseline justify-between px-4 pb-1 pt-3 text-xs text-muted-foreground">
        <span>Your accounts</span>
        <span>
          Net worth <span className="tabular font-mono font-semibold text-foreground">{show(netWorth)}</span>
        </span>
      </p>
      <ul className="divide-y">
        {groupAccounts(listedAccounts).map((group) => (
          <li key={group.key}>
            <AccountRow
              group={group}
              masked={masked}
              balanceOf={(a) => (savingsHome.account?.id === a.id ? savingsHome.total : a.balance)}
            />
          </li>
        ))}
        <FamilyAccountRow masked={masked} />
      </ul>
    </div>
  )

  const creditAndBills = (
    <section aria-labelledby="bills-credit-h" className="flex flex-col gap-3">
      <SectionHeader id="bills-credit-h" title="Bills and credit score" />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => dispatch({ type: 'overlay', overlay: 'billpay' })}
          className="flex min-h-24 flex-col justify-between gap-2 rounded-3xl bg-card p-4 text-left"
        >
          <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Receipt className="size-4 text-primary" aria-hidden />
            Next bill
          </span>
          {nextBill ? (
            <span>
              <span className="block truncate font-semibold leading-tight">{nextBill.name}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {show(nextBill.amountDue)} ·{' '}
                {nextBill.dueIn <= 1 ? (nextBill.dueIn === 0 ? 'today' : 'tomorrow') : `in ${nextBill.dueIn} days`}
              </span>
            </span>
          ) : (
            <span className="font-semibold leading-tight">All caught up</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'overlay', overlay: 'credit' })}
          className="flex min-h-24 flex-col justify-between gap-2 rounded-3xl bg-card p-4 text-left"
        >
          <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Gauge className="size-4 text-primary" aria-hidden />
            Credit score
          </span>
          {isNewCustomer ? (
            <span>
              <span className="block font-semibold leading-tight">Check yours free</span>
              <span className="mt-1 block text-xs text-muted-foreground">Won’t affect your score</span>
            </span>
          ) : (
            <span>
              <span className="tabular block font-mono text-2xl font-semibold leading-none">{masked ? '•••' : customer.creditScore}</span>
              <span className="mt-1 block whitespace-nowrap text-xs font-medium text-primary">Up 6 this month</span>
            </span>
          )}
        </button>
      </div>
    </section>
  )

  const insightsTile =
    !simple && !isNewCustomer && suggestions.length > 0 ? (
      <section aria-labelledby="for-you" className="flex flex-col gap-3">
        <SectionHeader id="for-you" title="Insights" />
        <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4">
          {suggestions.map((s) => (
            <li key={s.id} className="flex w-[78%] shrink-0 snap-start flex-col gap-3 rounded-3xl border bg-card p-4">
              <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-lime">
                <s.icon className="size-[18px]" aria-hidden />
              </span>
              <div>
                <p className="font-semibold leading-snug">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
              {s.goal && <GoalProgress name={s.goal.name} balance={s.goal.balance} goal={s.goal.goal} adding={150} masked={masked} />}
              <div className="mt-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    s.run()
                    setDoneSuggestions((d) => [...d, s.id])
                  }}
                  className="h-11 rounded-xl bg-shield px-4 text-sm font-semibold text-shield-foreground"
                >
                  {s.cta}
                </button>
                <button
                  type="button"
                  onClick={() => setDoneSuggestions((d) => [...d, s.id])}
                  className="h-11 rounded-xl px-4 text-sm font-medium text-muted-foreground"
                >
                  Not now
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    ) : null

  const tiles: { id: HomeTileId; node: ReactNode }[] = [
    { id: 'setup', node: isNewCustomer && !setupDismissed ? <AccountSetup /> : null },
    { id: 'activity', node: <RecentActivity masked={masked} /> },
    { id: 'credit', node: creditAndBills },
    { id: 'insights', node: insightsTile },
    { id: 'help', node: <HelpCard /> },
  ]
  const availableTiles = homeOrder
    .map((id) => tiles.find((t) => t.id === id))
    .filter((t): t is { id: HomeTileId; node: ReactNode } => !!t?.node)
  const shownTiles = availableTiles.filter((t) => !homeHidden.includes(t.id))

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-8">
      <div className="relative isolate overflow-hidden bg-forest pb-16 text-forest-foreground">
        <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[300px]">
          <Image
            key={sky.src}
            src={sky.src}
            alt=""
            fill
            priority
            sizes="(max-width: 480px) 100vw, 480px"
            className="object-cover object-[50%_100%] animate-in fade-in duration-700"
          />
          <div className={cn('absolute inset-0 bg-gradient-to-b', sky.tint)} />
          {sky.bright && <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-transparent" />}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-forest" />
        </div>
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-14 bg-gradient-to-b from-transparent to-background" />

        <header className="flex items-center justify-between gap-2 px-4 pt-4">
          <button
            type="button"
            onClick={() => dispatch({ type: 'navigate', tab: 'more' })}
            aria-label="Profile and settings"
            className="flex size-11 shrink-0 items-center justify-center rounded-full"
          >
            <Image src={parentProfile.photo} alt="" width={40} height={40} className="size-10 rounded-full object-cover ring-2 ring-white/25" />
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'overlay', overlay: 'inbox' })}
            aria-label={unreadActions > 0 ? `Notifications, ${unreadActions} need${unreadActions === 1 ? 's' : ''} review` : 'Notifications'}
            className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
          >
            <Bell className="size-5" aria-hidden />
            {unreadActions > 0 && (
              <span
                aria-hidden
                className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold leading-none text-white ring-2 ring-forest"
              >
                {unreadActions > 9 ? '9+' : unreadActions}
              </span>
            )}
          </button>
        </header>

        <h1 className="px-5 pt-2 [text-shadow:0_2px_16px_rgb(0_0_0/0.75)]">
          <span className="block text-xl font-medium text-forest-foreground/90">{greeting},</span>
          <span className="block truncate text-5xl font-bold leading-tight tracking-tight">{profile.preferredName}</span>
        </h1>

        <div className="flex flex-col gap-3 px-4 pt-[88px]">
          {isNewCustomer && total === 0 && (
            <p className="rounded-2xl bg-black/45 px-4 py-3 text-sm text-lime ring-1 ring-white/15 backdrop-blur-md">
              You’re in. Add money to get going.
            </p>
          )}
          <QuickActions />
          <SafeToSpend masked={masked} />
        </div>
      </div>

      <div className="relative -mt-8 flex flex-col gap-6 px-4">
        <FraudBanner />
        {streetSafe && (
          <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-accent p-4 text-sm text-accent-foreground">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p className="leading-relaxed">
              <span className="font-semibold">Street Safe is on.</span> We&apos;ve hidden your balances and capped transfers at $
              {STREET_SAFE_CAP} until you&apos;re home.{' '}
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'streetSafe', on: false })
                  notify('Street Safe is off. Welcome back.')
                }}
                className="font-semibold underline underline-offset-2"
              >
                Turn off
              </button>
            </p>
          </div>
        )}
        <FinancialHealth masked={masked} accountsList={accountsList} />
        <TediWidget masked={masked} showInsight={!simple && !isNewCustomer} />

        {shownTiles.map((tile) => (
          <div key={tile.id}>{tile.node}</div>
        ))}

        <button
          type="button"
          onClick={() => setEditing({ focus: null })}
          className="mx-auto flex h-11 items-center gap-2 rounded-full border bg-card px-5 text-sm font-semibold"
        >
          <SlidersHorizontal className="size-4 text-primary" aria-hidden />
          Edit Home
        </button>
      </div>

      {editing && (
        <CustomizeHomeSheet visible={availableTiles.map((t) => t.id)} focusId={editing.focus} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function GoalProgress({ name, balance, goal, adding, masked }: { name: string; balance: number; goal: number; adding: number; masked: boolean }) {
  const now = Math.min(100, (balance / goal) * 100)
  const after = Math.min(100, ((balance + adding) / goal) * 100)
  const money = (n: number) => (masked ? '••••' : `$${Math.round(n).toLocaleString('en-US')}`)
  return (
    <div className="rounded-2xl bg-muted/60 p-3">
      <p className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{name}</span>
        <span className="tabular font-mono text-xs text-muted-foreground">
          {money(balance)} of {money(goal)}
        </span>
      </p>
      <div
        role="img"
        aria-label={`${name}: ${Math.round(now)}% of goal now, ${Math.round(after)}% after this move`}
        className="relative mt-2 h-2 overflow-hidden rounded-full bg-border"
      >
        <span className="absolute inset-y-0 left-0 rounded-full bg-lime/50" style={{ width: `${after}%` }} />
        <span className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${now}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        This gets you to <span className="font-semibold text-foreground">{Math.round(after)}%</span>
      </p>
    </div>
  )
}
