'use client'

import { useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import {
  MapPin,
  Accessibility,
  BellRing,
  Bell,
  Camera,
  ChevronRight,
  Eye,
  EyeOff,
  Gauge,
  Gift,
  Lightbulb,
  Receipt,
  Repeat,
  Send,
  ShieldCheck,
  Snowflake,
  Volume2,
  Wifi,
  Zap,
} from 'lucide-react'
import { creditBand } from '@/lib/everyday-data'
import { useReadAloud } from '../everyday/accessibility-screen'
import { cn } from '@/lib/utils'
import { customer, formatMoney } from '@/lib/bank-data'
import { POINTS_PER_DOLLAR } from '@/lib/rewards'
import { STREET_SAFE_CAP, useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { Pill, SectionHeader, TdMark } from '../primitives'
import { InlineOffer, TdForYou } from '../marketing/placements'
import { TransactionRow } from '../transactions/transaction-row'
import { AccountRow } from '../accounts/account-row'
import { enrichments } from '@/lib/enrichment'
import { TediButton } from '../nav'

const noopSubscribe = () => () => {}

// The server renders in UTC, so the time-of-day greeting is only computed in the browser.
function localGreeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

export function HomeScreen() {
  const { accounts, transactions, wallets, streetSafe, cardFrozen, dispatch, notify, subs, payees, a11y, rewardsBalance } =
    useBank()
  const rewardsCardId = accounts.find((a) => a.kind === 'credit')?.id ?? null
  const readAloud = useReadAloud()
  const simple = a11y.simpleHome
  const nextBill = payees.filter((p) => !p.paid).sort((a, b) => a.dueIn - b.dueIn)[0]
  const band = creditBand(customer.creditScore)
  const greeting = useSyncExternalStore(noopSubscribe, localGreeting, () => 'Welcome back')
  const subTxns = transactions.filter((t) => {
    const id = enrichments[t.merchant]?.subscription?.id
    return id && subs[id]?.status === 'active'
  })
  const activeSubs = subTxns.length
  const subsMonthly = subTxns.reduce((s, t) => s + Math.abs(t.amount), 0)
  const flaggedSubs = subTxns.filter((t) => enrichments[t.merchant]?.subscription?.insight).length
  const trust = useTrust()
  const { profile } = trust
  const [hidden, setHidden] = useState(false)
  const [doneSuggestions, setDoneSuggestions] = useState<string[]>([])
  const masked = hidden || streetSafe

  const total = accounts.filter((a) => a.kind !== 'credit').reduce((s, a) => s + a.balance, 0)
  const show = (n: number, currency = 'USD') => (masked ? '••••' : formatMoney(n, currency))

  const suggestions = [
    {
      id: 'dining',
      icon: Lightbulb,
      title: 'You spent 32% less eating out',
      body: 'Look at you go. Want to move the $150 you saved into your Tokyo trip vault?',
      cta: 'Move $150',
      run: () => {
        dispatch({ type: 'vaultTransfer', vaultId: 'japan', amount: 150 })
        notify('Done! $150 is now working toward Tokyo.')
      },
    },
    {
      id: 'netflix',
      icon: Zap,
      title: 'Heads up: Netflix went up',
      body: 'Your plan jumped from $15.99 to $17.99. Want to switch plans or cancel? We can handle it for you.',
      cta: 'Take a look',
      run: () => dispatch({ type: 'overlay', overlay: 'subscriptions' }),
    },
    {
      id: 'esim',
      icon: Wifi,
      title: 'Tokyo in 18 days. Exciting!',
      body: 'Grab a Japan eSIM now and skip the roaming fees when you land.',
      cta: 'Get eSIM',
      run: () => dispatch({ type: 'overlay', overlay: 'global' }),
    },
  ].filter((s) => !doneSuggestions.includes(s.id))

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-8">
      <div className="relative isolate overflow-hidden bg-forest pb-24 text-forest-foreground">
        <Image
          src="/images/geo/nyc-skyline.png"
          alt=""
          fill
          priority
          sizes="(max-width: 480px) 100vw, 480px"
          className="-z-10 object-cover object-[50%_62%]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-forest/85 via-forest/35 to-forest/10" />
        <header className="flex items-center justify-between px-5 pb-2 pt-5">
          <button
            type="button"
            onClick={() => dispatch({ type: 'overlay', overlay: 'profile' })}
            aria-label="Open profile"
            className="-ml-1 flex min-h-11 items-center gap-3 rounded-2xl pr-2 text-left"
          >
            <TdMark />
            <span className="leading-tight">
              <span className="block text-xs text-forest-foreground/70">{greeting},</span>
              <span className="flex items-center gap-0.5 font-semibold">
                {profile.preferredName}
                <ChevronRight className="size-4 opacity-60" aria-hidden />
              </span>
            </span>
          </button>
          <div className="flex items-center gap-1">
            <TediButton tone="dark" />
            <button
              type="button"
              onClick={() => {
                trust.dispatch({ type: 'securityTab', tab: 'detect' })
                dispatch({ type: 'overlay', overlay: 'security' })
              }}
              aria-label="Security alerts, 1 needs review"
              className="relative flex size-11 items-center justify-center rounded-full bg-white/10"
            >
              <Bell className="size-5" aria-hidden />
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-lime" />
            </button>
          </div>
        </header>

        <section className="px-5 pt-4 [text-shadow:0_1px_12px_rgb(0_0_0/0.7)]" aria-labelledby="total-label">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-black/45 py-1 pl-2 pr-3 text-xs font-medium backdrop-blur-sm ring-1 ring-white/15">
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-lime" />
            </span>
            <MapPin className="size-3.5 text-lime" aria-hidden />
            <span>
              <span className="sr-only">Your location: </span>New York, NY
            </span>
            <span className="text-forest-foreground/60" aria-hidden>
              ·
            </span>
            <span className="text-forest-foreground/75">Local view</span>
          </p>
          <div className="mt-2 flex items-center gap-2">
            <p id="total-label" className="text-sm text-forest-foreground/70">
              All your money
            </p>
            <button
              type="button"
              onClick={() => setHidden((h) => !h)}
              aria-label={masked ? 'Show balances' : 'Hide balances'}
              disabled={streetSafe}
              className="flex size-11 items-center justify-center rounded-full text-forest-foreground/70 disabled:opacity-40"
            >
              {masked ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
            <button
              type="button"
              onClick={readAloud}
              aria-label="Read my balances out loud"
              className="flex size-11 items-center justify-center rounded-full text-forest-foreground/70"
            >
              <Volume2 className="size-4" aria-hidden />
            </button>
          </div>
          <p className="tabular font-mono text-[40px] font-semibold leading-none tracking-tight">{show(total)}</p>
          <p className="mt-2 text-sm text-lime">Up $1,240.18 from last month. Nice!</p>
        </section>
      </div>

      <div className="relative -mt-16 flex flex-col gap-6 px-4">
        <div className="grid grid-cols-4 gap-2 rounded-3xl bg-card p-3 shadow-sm">
          {[
            { label: 'Send', icon: Send, onClick: () => dispatch({ type: 'overlay', overlay: 'send' }) },
            { label: 'Pay bills', icon: Receipt, onClick: () => dispatch({ type: 'overlay', overlay: 'billpay' }) },
            { label: 'Deposit', icon: Camera, onClick: () => dispatch({ type: 'overlay', overlay: 'deposit' }) },
            {
              label: cardFrozen ? 'Unfreeze' : 'Freeze',
              icon: Snowflake,
              onClick: () => {
                dispatch({ type: 'freeze', frozen: !cardFrozen })
                notify(cardFrozen ? 'Card’s back in action' : 'Card frozen. Nobody’s using it but you.')
              },
            },
          ].map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className="flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-2xl text-xs font-medium active:bg-muted"
            >
              <span
                className={cn(
                  'flex size-10 items-center justify-center rounded-full',
                  label === 'Unfreeze' ? 'bg-sky-100 text-sky-700' : 'bg-muted text-lime',
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => dispatch({ type: 'overlay', overlay: 'security' })}
          className="flex items-center gap-3 rounded-3xl bg-card p-3 pr-4 text-left"
        >
          <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-forest text-lime">
            <ShieldCheck className="size-5" aria-hidden />
            {trust.checklist.some((c) => !c.done) && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {trust.checklist.filter((c) => !c.done).length}
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">
              {trust.score >= 100 ? (
                <>
                  Security: <span className="text-primary">Legendary</span>
                </>
              ) : (
                <>
                  Security score <span className="tabular font-mono">{trust.score}</span>
                </>
              )}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {trust.score >= 100
                ? 'Every lock locked. We’ve got your back.'
                : `${trust.checklist.filter((c) => !c.done).length} quick wins away from Legendary`}
            </span>
          </span>
          <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: 'overlay', overlay: 'credit' })}
            className="flex min-h-24 flex-col justify-between gap-2 rounded-3xl bg-card p-4 text-left"
          >
            <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Gauge className="size-4 text-primary" aria-hidden />
              Credit score
            </span>
            <span>
              <span className="tabular block font-mono text-2xl font-semibold leading-none">{masked ? '•••' : customer.creditScore}</span>
              <span className="mt-1 block whitespace-nowrap text-xs font-medium text-primary">{band.label} · +6 this month</span>
            </span>
          </button>
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
                  {masked ? '••••' : formatMoney(nextBill.amountDue)} ·{' '}
                  {nextBill.dueIn <= 1 ? (nextBill.dueIn === 0 ? 'today' : 'tomorrow') : `in ${nextBill.dueIn} days`}
                </span>
              </span>
            ) : (
              <span className="font-semibold leading-tight">All caught up</span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => dispatch({ type: 'overlay', overlay: 'alerts' })}
          className="flex min-h-14 items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left"
        >
          <BellRing className="size-5 shrink-0 text-primary" aria-hidden />
          <span className="flex-1 text-sm">
            <span className="block font-medium">Alerts, your way</span>
            <span className="block text-xs text-muted-foreground">Low balance, big purchases, bills and more</span>
          </span>
          <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
        </button>


        {streetSafe && (
          <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-accent p-4 text-sm text-accent-foreground">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p className="leading-relaxed">
              <span className="font-semibold">Street Safe is on.</span> Balances are hidden and transfers are capped at $
              {STREET_SAFE_CAP} until you&apos;re back on trusted Wi-Fi at home.{' '}
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

        {!simple && suggestions.length > 0 && (
          <section aria-labelledby="for-you" className="flex flex-col gap-3">
            <SectionHeader id="for-you" title="Accounts insights" action={<Pill className="bg-lime text-lime-foreground">Smart</Pill>} />
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
        )}

        {!simple && <TdForYou />}

        <section aria-labelledby="accounts-h" className="flex flex-col gap-3">
          <SectionHeader id="accounts-h" title="Your accounts" />
          <ul className="divide-y overflow-hidden rounded-3xl bg-card">
            {accounts.map((a) => (
              <li key={a.id}>
                <AccountRow account={a} masked={masked} />
              </li>
            ))}
          </ul>
          {!simple && (
            <InlineOffer offerId="inline-cd-home" productId="step-cd" cta="Lock 4.25%" className="px-1">
              Your checking is doing great. Put $5,000 in a 12-month CD and it could earn you about $212.
            </InlineOffer>
          )}
        </section>

        <section aria-labelledby="wallets-h" className="flex flex-col gap-3">
          <SectionHeader
            id="wallets-h"
            title="Global wallets"
            action={
              <button
                type="button"
                onClick={() => dispatch({ type: 'overlay', overlay: 'global' })}
                className="flex h-9 items-center gap-0.5 text-sm font-medium text-primary"
              >
                Exchange <ChevronRight className="size-4" aria-hidden />
              </button>
            }
          />
          <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {wallets
              .filter((w) => w.balance > 0)
              .map((w) => (
                <li key={w.code}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'overlay', overlay: 'global' })}
                    className="flex min-w-32 flex-col items-start rounded-2xl bg-card px-4 py-3 text-left"
                  >
                    <span className="text-xs font-semibold text-muted-foreground">{w.code}</span>
                    <span className="tabular font-mono font-semibold">{show(w.balance, w.code)}</span>
                  </button>
                </li>
              ))}
          </ul>
        </section>

        <button
          type="button"
          onClick={() => dispatch({ type: 'openRewards', id: rewardsCardId })}
          className="flex items-center gap-3 rounded-3xl bg-lime p-4 text-left text-lime-foreground"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-forest text-lime">
            <Gift className="size-5" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">
              {masked ? '••••' : Math.round(rewardsBalance * POINTS_PER_DOLLAR).toLocaleString()} TD Points
            </span>
            <span className="block text-sm opacity-80">Worth {show(rewardsBalance)} cash back · open Rewards Hub</span>
          </span>
          <ChevronRight className="size-5" aria-hidden />
        </button>

        <section aria-labelledby="activity-h" className="flex flex-col gap-3">
          <SectionHeader id="activity-h" title="Recent activity" action={<Pill className="bg-accent text-accent-foreground">Live</Pill>} />
          <button
            type="button"
            onClick={() => dispatch({ type: 'overlay', overlay: 'subscriptions' })}
            className="flex min-h-14 items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-lime text-lime-foreground">
              <Repeat className="size-[18px]" aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block font-medium">Subscriptions</span>
              <span className="block text-xs text-muted-foreground">
                {activeSubs} active · {masked ? '••••' : formatMoney(subsMonthly)}/mo{flaggedSubs > 0 ? ` · ${flaggedSubs} worth a look` : ''}
              </span>
            </span>
            <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
          </button>
          <ul className="divide-y overflow-hidden rounded-3xl bg-card">
            {transactions.slice(0, 8).map((t) => (
              <li key={t.id}>
                <TransactionRow txn={t} masked={masked} />
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => {
                  trust.dispatch({ type: 'securityTab', tab: 'resolve' })
                  dispatch({ type: 'overlay', overlay: 'security' })
                }}
                className="flex min-h-12 w-full items-center justify-center gap-1.5 text-sm font-medium text-primary"
              >
                <ShieldCheck className="size-4" aria-hidden />
                Something look off? We&apos;ll sort it out.
              </button>
            </li>
          </ul>
          {!simple && (
            <InlineOffer offerId="inline-double-activity" productId="double-up" cta="See my offer" className="px-1">
              You spent $412 eating out this month (no judgment). TD Double Up would have given you $8.24 back.
            </InlineOffer>
          )}
        </section>
      </div>
    </div>
  )
}
