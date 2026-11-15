'use client'

import { useState } from 'react'
import { Copy, Eye, EyeOff, Flame, Globe, Landmark, Plus, ShoppingCart, Snowflake, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'
import { customer, formatMoney } from '@/lib/bank-data'
import { useBank, type CardControls } from '../bank-provider'
import { Pill, ScreenHeader, SectionHeader, Switch, TdMark } from '../primitives'
import { SubNav, TediButton, accountsSubNav } from '../nav'
import { InlineOffer } from '../marketing/placements'
import { AccountRow } from '../accounts/account-row'

const controlRows: { key: keyof CardControls; label: string; detail: string; icon: typeof Globe }[] = [
  { key: 'online', label: 'Online purchases', detail: 'Web and in-app payments', icon: ShoppingCart },
  { key: 'contactless', label: 'Contactless', detail: 'Tap to pay in stores', icon: Wifi },
  { key: 'atm', label: 'ATM withdrawals', detail: 'Cash at any ATM', icon: Landmark },
  { key: 'international', label: 'International', detail: 'Purchases outside the US', icon: Globe },
]

export function CardsScreen() {
  const { cardFrozen, monthlyLimit, controls, virtualCards, accounts, streetSafe, dispatch, notify } = useBank()
  const cardAccounts = [...accounts.filter((a) => a.kind === 'credit'), ...accounts.filter((a) => a.kind === 'checking')]
  const [reveal, setReveal] = useState(false)
  const spent = 1284.56
  const pct = Math.min(100, (spent / monthlyLimit) * 100)

  function createSingleUse() {
    const last4 = String(Math.floor(1000 + Math.random() * 9000))
    dispatch({
      type: 'virtualCard',
      card: { id: `vc-${Date.now()}`, label: 'Single-use', last4, singleUse: true, used: false },
    })
    notify(`Single-use card •••• ${last4} ready`)
  }

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-8">
      <ScreenHeader title="Cards" subtitle="TD Clear Card" right={<TediButton />} />
      <SubNav label="Accounts sections" items={accountsSubNav} />

      <div className="flex flex-col gap-6 px-4 pt-2">
        <div
          className={cn(
            'relative aspect-[1.586] overflow-hidden rounded-3xl bg-forest p-5 text-forest-foreground shadow-xl transition-all',
            cardFrozen && 'saturate-0',
          )}
        >
          <div aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full bg-primary/40" />
          <div aria-hidden className="absolute -bottom-20 right-10 size-44 rounded-full bg-lime/20" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <TdMark />
              <span className="text-sm font-semibold tracking-wide text-lime">Clear</span>
            </div>
            <div>
              <p className="tabular font-mono text-lg tracking-widest">
                {reveal ? '4520 1984 3307 7742' : '•••• •••• •••• 7742'}
              </p>
              <div className="mt-2 flex items-end justify-between text-xs">
                <span className="uppercase tracking-wide text-forest-foreground/80">
                  {customer.firstName} {customer.lastName}
                </span>
                <span className="font-mono text-forest-foreground/80">
                  {reveal ? '09/30 · CVV 418' : '••/•• · CVV •••'}
                </span>
                <span className="text-base font-bold italic tracking-tight">VISA</span>
              </div>
            </div>
          </div>
          {cardFrozen && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-sky-200/50 text-forest backdrop-blur-[2px]">
              <Snowflake className="size-10" aria-hidden />
              <span className="font-semibold">Card frozen</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'freeze', frozen: !cardFrozen })
              notify(cardFrozen ? 'Card unfrozen — you’re good to go' : 'Card frozen. No new charges will go through.')
            }}
            className={cn(
              'flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl text-sm font-medium',
              cardFrozen ? 'bg-sky-100 text-sky-800' : 'bg-card',
            )}
            aria-pressed={cardFrozen}
          >
            <Snowflake className="size-5" aria-hidden />
            {cardFrozen ? 'Unfreeze' : 'Freeze'}
          </button>
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl bg-card text-sm font-medium"
          >
            {reveal ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
            {reveal ? 'Hide' : 'Details'}
          </button>
          <button
            type="button"
            onClick={createSingleUse}
            className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl bg-lime text-sm font-semibold text-lime-foreground"
          >
            <Flame className="size-5" aria-hidden />
            Single-use
          </button>
        </div>

        <section aria-labelledby="card-accounts-h" className="flex flex-col gap-3">
          <SectionHeader id="card-accounts-h" title="Your cards" />
          <ul className="divide-y overflow-hidden rounded-3xl bg-card">
            {cardAccounts.map((a) => (
              <li key={a.id}>
                <AccountRow
                  account={a}
                  masked={streetSafe}
                  detail={
                    a.kind === 'checking'
                      ? `Debit card •••• ${a.mask} · linked to checking`
                      : `${streetSafe ? '••••' : formatMoney((a.limit ?? 0) + a.balance)} available · due Nov 28`
                  }
                />
              </li>
            ))}
          </ul>
        </section>

        <InlineOffer offerId="inline-double-cards" productId="double-up" cta="Accept in 60 sec" className="-my-2 px-1">
          Pre-approved: TD Double Up, 2% back on everything, $8,000 limit. No impact to your credit score.
        </InlineOffer>

        <section aria-labelledby="limit-h" className="flex flex-col gap-3 rounded-3xl bg-card p-4">
          <div className="flex items-baseline justify-between">
            <h2 id="limit-h" className="font-semibold">
              Monthly spending limit
            </h2>
            <span className="tabular font-mono font-semibold">{formatMoney(monthlyLimit)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatMoney(spent)} spent · {formatMoney(Math.max(0, monthlyLimit - spent))} left this month
          </p>
          <label className="sr-only" htmlFor="limit-range">
            Adjust monthly limit
          </label>
          <input
            id="limit-range"
            type="range"
            min={500}
            max={10000}
            step={250}
            value={monthlyLimit}
            onChange={(e) => dispatch({ type: 'limit', amount: Number(e.target.value) })}
            className="h-11 w-full accent-[var(--primary)]"
          />
        </section>

        <section aria-labelledby="controls-h" className="flex flex-col gap-3">
          <SectionHeader id="controls-h" title="Controls" />
          <ul className="divide-y overflow-hidden rounded-3xl bg-card">
            {controlRows.map(({ key, label, detail, icon: Icon }) => (
              <li key={key} className="flex items-center gap-3 px-4 py-2">
                <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <div className="flex-1">
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{detail}</p>
                </div>
                <Switch
                  label={label}
                  checked={controls[key]}
                  onChange={(v) => dispatch({ type: 'control', key, value: v })}
                />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="virtual-h" className="flex flex-col gap-3">
          <SectionHeader
            id="virtual-h"
            title="Virtual cards"
            action={
              <button
                type="button"
                onClick={createSingleUse}
                className="flex h-9 items-center gap-1 text-sm font-medium text-primary"
              >
                <Plus className="size-4" aria-hidden /> New
              </button>
            }
          />
          <ul className="flex flex-col gap-2">
            {virtualCards.map((vc) => (
              <li key={vc.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
                <span
                  className={cn(
                    'flex h-10 w-14 items-end rounded-lg p-1.5 font-mono text-[10px] font-semibold',
                    vc.singleUse ? 'bg-lime text-lime-foreground' : 'bg-primary text-primary-foreground',
                  )}
                  aria-hidden
                >
                  {vc.last4}
                </span>
                <div className="flex-1">
                  <p className="font-medium">
                    {vc.label} •••• {vc.last4}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {vc.singleUse ? 'New number after every purchase' : 'Netflix, Spotify, iCloud'}
                  </p>
                </div>
                {vc.singleUse && <Pill className="bg-accent text-accent-foreground">One-time</Pill>}
                <button
                  type="button"
                  aria-label={`Copy card ending ${vc.last4}`}
                  onClick={() => {
                    navigator.clipboard?.writeText(`4520 0000 0000 ${vc.last4}`).catch(() => {})
                    notify('Card number copied')
                  }}
                  className="flex size-11 items-center justify-center rounded-full text-muted-foreground"
                >
                  <Copy className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
