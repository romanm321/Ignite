'use client'

import { useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { Bell, Lightbulb, ShieldCheck, UserRound, Zap } from 'lucide-react'
import { type Account } from '@/lib/bank-data'
import { parentProfile } from '@/lib/family-data'
import { STREET_SAFE_CAP, useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { SectionHeader } from '../primitives'
import { TediColorMark } from '../tedi-icon'
import { BranchRepCard } from '../home/branch-rep-card'
import { AccountStack } from '../home/account-stack'
import { groupAccounts, type AccountGroup } from '../accounts/account-groups'
import { useSavingsHome } from '../vaults/use-savings-home'
import { useInvestAccount } from '../invest/use-invest-account'
import { useFamily } from '../family/family-provider'
import { AccountSetup } from '../setup/account-setup'
import { useNotifications } from '../inbox/use-notifications'
import { RecentActivity } from '../home/recent-activity'
import { VaultsCarousel } from '../home/vaults-carousel'

const noopSubscribe = () => () => {}

// The server renders in UTC, so the time-of-day greeting is only computed in the browser.
function localGreeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

export function HomeScreen() {
  const { accounts, vaults, streetSafe, dispatch, notify, a11y, customerType, setupDismissed } = useBank()
  const isNewCustomer = customerType === 'new'
  const simple = a11y.simpleHome
  const greeting = useSyncExternalStore(noopSubscribe, localGreeting, () => 'Welcome back')
  const [activeKey, setActiveKey] = useState('checking')
  const { kids } = useFamily()
  const { profile } = useTrust()
  const [doneSuggestions, setDoneSuggestions] = useState<string[]>([])
  const masked = streetSafe

  const investAccount = useInvestAccount()
  const { unreadActions } = useNotifications()
  const savingsHome = useSavingsHome()
  const total =
    accounts.filter((a) => a.kind !== 'credit').reduce((s, a) => s + a.balance, 0) + savingsHome.inVaults + (investAccount?.value ?? 0)
  const listedAccounts = investAccount
    ? [...accounts.filter((a) => a.kind !== 'credit'), investAccount.account, ...accounts.filter((a) => a.kind === 'credit')]
    : accounts
  const groups: AccountGroup[] = groupAccounts(listedAccounts)
  if (!isNewCustomer && kids.length > 0) {
    const familyAccount: Account = {
      id: 'family',
      name: 'TD Family',
      kind: 'checking',
      balance: kids.reduce((sum, k) => sum + k.balance, 0),
      mask: kids.map((k) => k.name).join(' & '),
    }
    groups.push({ key: 'family', label: 'TD Family', accounts: [familyAccount] })
  }
  const activeGroup = groups.find((g) => g.key === activeKey) ?? groups[0]

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

  const insightsTile =
    !simple && !isNewCustomer && suggestions.length > 0 ? (
      <section aria-labelledby="for-you" className="flex flex-col gap-3">
        <SectionHeader id="for-you" title="Insights" />
        <ul className="no-scrollbar -mx-4 flex scroll-pl-4 snap-x gap-3 overflow-x-auto px-4">
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

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto bg-[#f9f9f9] pb-8">
      <div className="relative isolate pb-6 text-foreground">
        <header className="flex items-center gap-2 px-4 pt-[calc(var(--safe-top)+0.75rem)]">
          <button
            type="button"
            onClick={() => dispatch({ type: 'overlay', overlay: 'profile' })}
            aria-label="Profile and settings"
            className="flex size-11 shrink-0 items-center justify-center rounded-full"
          >
            {isNewCustomer ? (
              <span className="flex size-10 items-center justify-center rounded-full bg-white text-muted-foreground ring-2 ring-white">
                <UserRound className="size-5" aria-hidden />
              </span>
            ) : (
              <Image src={parentProfile.photo} alt="" width={40} height={40} className="size-10 rounded-full object-cover ring-2 ring-white" />
            )}
          </button>
          <div className="ml-auto flex items-center rounded-full bg-white shadow-card">
            <button
              type="button"
              onClick={() => dispatch({ type: 'navigate', tab: 'sage' })}
              aria-label="Ask Tedi, your AI banker"
              className="flex h-11 items-center gap-1.5 rounded-full pl-3.5 pr-3 text-sm font-semibold text-black active:bg-muted"
            >
              <TediColorMark className="h-5 w-auto" />
              Tedi
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'overlay', overlay: 'inbox' })}
              aria-label={unreadActions > 0 ? `Notifications, ${unreadActions} need${unreadActions === 1 ? 's' : ''} review` : 'Notifications'}
              className="relative flex size-11 items-center justify-center rounded-full active:bg-muted"
            >
              <Bell className="size-5" aria-hidden />
              {unreadActions > 0 && (
                <span
                  aria-hidden
                  className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold leading-none text-white ring-2 ring-[#f9f9f9]"
                >
                  {unreadActions > 9 ? '9+' : unreadActions}
                </span>
              )}
            </button>
          </div>
        </header>

        <h1 className="px-5 pb-3 pt-3 font-heading text-2xl font-bold leading-tight">
          {greeting}, {profile.preferredName}
        </h1>

        <div className="flex flex-col gap-3 px-4">
          {streetSafe && (
            <div className="flex items-start gap-3 rounded-3xl bg-surface p-4 text-sm text-foreground shadow-card">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <p className="leading-relaxed">
                <span className="font-semibold">Street Safe is on.</span> We&apos;ve hidden your balances and capped transfers at $
                {STREET_SAFE_CAP} until you&apos;re home.{' '}
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'streetSafe', on: false })
                    notify('Street Safe is off. Welcome back.')
                  }}
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  Turn off
                </button>
              </p>
            </div>
          )}
          {isNewCustomer && total === 0 && (
            <p className="rounded-3xl bg-surface px-4 py-3 text-sm text-foreground shadow-card">You’re in. Add money to get going.</p>
          )}
          <AccountStack
            groups={groups}
            activeKey={activeGroup.key}
            onSelect={setActiveKey}
            masked={masked}
            balanceOf={(a) => (savingsHome.account?.id === a.id ? savingsHome.total : a.balance)}
          />
        </div>
      </div>

      <div className="relative flex flex-col gap-6 px-4">
        {isNewCustomer && !setupDismissed && activeGroup.key === 'checking' && <AccountSetup />}
        <RecentActivity
          masked={masked}
          accountIds={activeGroup.accounts.map((a) => a.id)}
          accountName={activeGroup.accounts.length > 1 ? activeGroup.label : activeGroup.accounts[0].name}
          emptyText={activeGroup.key === 'family' ? 'Open TD Family to see what your kids have been up to.' : undefined}
        />

        {(activeGroup.key === 'checking' || activeGroup.key === 'savings') && (
          <VaultsCarousel
            kind={activeGroup.key === 'checking' ? 'regular' : 'savings'}
            accountName={activeGroup.accounts[0].name}
            masked={masked}
          />
        )}

        <BranchRepCard />
        {insightsTile}
      </div>
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
