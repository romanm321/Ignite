'use client'

import { useState, type ReactNode } from 'react'
import Image from 'next/image'
import { ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react'
import { InternalTxnIcon } from '../transactions/internal-txn-icon'
import { MerchantLogo } from '../transactions/merchant-logo'
import type { StoryArtName } from '../onboarding/story-art'
import { formatMoney } from '@/lib/bank-data'
import { cn } from '@/lib/utils'
import { STREET_SAFE_CAP, useBank } from '../bank-provider'
import { ScreenHeader, SectionHeader } from '../primitives'
import { HeaderActions } from '../nav'
import { TransactionRow } from '../transactions/transaction-row'

const COLLAPSED_COUNT = 2

type Action = { label: string; icon: ReactNode; run: () => void; highlight?: boolean }

const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

function ZelleMark() {
  return (
    <span className="flex size-9 items-center justify-center rounded-xl bg-white">
      <Image src="/images/zelle.svg" alt="" width={20} height={20} />
    </span>
  )
}

function ActionTile({ action, span }: { action: Action; span: string }) {
  const { label, icon, run, highlight } = action
  return (
    <li className={span}>
      <button
        type="button"
        onClick={run}
        className={cn(
          'flex h-24 w-full flex-col justify-between gap-2 rounded-3xl p-3 text-left',
          highlight ? 'bg-[#41b232] text-[#10261a]' : 'bg-card',
        )}
      >
        {icon}
        <span className="block text-sm font-semibold leading-tight">{label}</span>
      </button>
    </li>
  )
}

/** The TD illustration for an action, on its white tile. */
function artTile(name: StoryArtName) {
  return <InternalTxnIcon art={name} zoom className="size-9" />
}

function ExpandToggle({ expanded, total, onToggle }: { expanded: boolean; total: number; onToggle: () => void }) {
  if (total <= COLLAPSED_COUNT) return null
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="flex min-h-11 items-center justify-center gap-1 rounded-2xl bg-card text-sm font-semibold text-primary"
    >
      {expanded ? 'Show less' : `Show ${total - COLLAPSED_COUNT} more`}
      <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} aria-hidden />
    </button>
  )
}

export function PayScreen() {
  const { payees, transactions, contacts, streetSafe, dispatch } = useBank()
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)
  const [showAllRecent, setShowAllRecent] = useState(false)

  const upcoming = payees.filter((p) => !p.paid).sort((a, b) => a.dueIn - b.dueIn)
  const recent = transactions.filter((t) => t.category === 'Transfer').slice(0, 8)
  const visibleUpcoming = showAllUpcoming ? upcoming : upcoming.slice(0, COLLAPSED_COUNT)
  const visibleRecent = showAllRecent ? recent : recent.slice(0, COLLAPSED_COUNT)

  // Most recently paid first, then everyone else in the order they were added.
  const paidOrder = transactions
    .filter((t) => t.id.startsWith('zl-'))
    .map((t) => t.merchant.replace(/^Zelle®? to /, '').split(' · ')[0])
  const rank = (name: string) => {
    const i = paidOrder.indexOf(name)
    return i === -1 ? Number.MAX_SAFE_INTEGER : i
  }
  const payAgain = contacts
    .filter((c) => !!c.handle)
    .map((c, i) => ({ c, i }))
    .sort((a, b) => rank(a.c.name) - rank(b.c.name) || a.i - b.i)
    .slice(0, 3)
    .map(({ c }) => c)

  const topRow: Action[] = [
    { label: 'Zelle', icon: <ZelleMark />, run: () => dispatch({ type: 'overlay', overlay: 'send' }), highlight: true },
    { label: 'Transfer', icon: artTile('cash'), run: () => dispatch({ type: 'overlay', overlay: 'move' }) },
    { label: 'Deposit', icon: artTile('devices'), run: () => dispatch({ type: 'overlay', overlay: 'deposit' }) },
  ]
  const bottomRow: Action[] = [
    { label: 'Pay bills', icon: artTile('calendar'), run: () => dispatch({ type: 'overlay', overlay: 'billpay' }) },
    { label: 'Wire transfer', icon: artTile('global'), run: () => dispatch({ type: 'overlay', overlay: 'wire' }) },
  ]

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-8">
      <ScreenHeader title="Pay & Transfer" subtitle="Send, pay and move money" right={<HeaderActions />} />

      <div className="flex flex-col gap-6 px-4 pt-2">
        {streetSafe && (
          <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-accent p-4 text-sm text-accent-foreground">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p className="leading-relaxed">
              <span className="font-semibold">Street Safe is on.</span> Sends and transfers are capped at ${STREET_SAFE_CAP}.
            </p>
          </div>
        )}

        <ul className="grid grid-cols-6 gap-2">
          {topRow.map((a) => (
            <ActionTile key={a.label} action={a} span="col-span-2" />
          ))}
          {bottomRow.map((a) => (
            <ActionTile key={a.label} action={a} span="col-span-2" />
          ))}
        </ul>

        {payAgain.length > 0 && (
          <section aria-labelledby="pay-again-h" className="flex flex-col gap-3">
            <SectionHeader id="pay-again-h" title="Pay again" />
            <ul className="divide-y overflow-hidden rounded-3xl bg-card">
              {payAgain.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: 'sendPreset', preset: { amount: '', scope: 'domestic', contactId: c.id } })
                      dispatch({ type: 'overlay', overlay: 'send' })
                    }}
                    aria-label={`Pay ${c.name} with Zelle`}
                    className="flex min-h-16 w-full items-center gap-3 px-4 py-2 text-left"
                  >
                    <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                      {c.photo ? <Image src={c.photo} alt="" fill sizes="44px" className="object-cover" /> : initials(c.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{c.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{c.handle}</span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="upcoming-h" className="flex flex-col gap-3">
          <SectionHeader
            id="upcoming-h"
            title="Coming up"
            action={
              <button
                type="button"
                onClick={() => dispatch({ type: 'overlay', overlay: 'billpay' })}
                className="flex h-9 items-center gap-0.5 text-sm font-medium text-primary"
              >
                All bills <ChevronRight className="size-4" aria-hidden />
              </button>
            }
          />
          {upcoming.length ? (
            <>
              <ul className="divide-y overflow-hidden rounded-3xl bg-card">
                {visibleUpcoming.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'overlay', overlay: 'billpay' })}
                      className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left"
                    >
                      <MerchantLogo enrichment={{ name: p.name, domain: p.domain, logo: p.logo, brandColor: '#1a5336' }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{p.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {p.dueIn === 0 ? 'Due today' : p.dueIn === 1 ? 'Due tomorrow' : `Due in ${p.dueIn} days`}
                        </span>
                      </span>
                      <span className="tabular font-mono font-semibold">{streetSafe ? '••••' : formatMoney(p.amountDue)}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <ExpandToggle expanded={showAllUpcoming} total={upcoming.length} onToggle={() => setShowAllUpcoming((v) => !v)} />
            </>
          ) : (
            <p className="rounded-3xl bg-card p-4 text-sm text-muted-foreground">All caught up. Nothing due soon.</p>
          )}
        </section>

        {recent.length > 0 && (
          <section aria-labelledby="recent-transfers-h" className="flex flex-col gap-3">
            <SectionHeader id="recent-transfers-h" title="Recent transfers" />
            <ul className="divide-y overflow-hidden rounded-3xl bg-card">
              {visibleRecent.map((t) => (
                <li key={t.id}>
                  <TransactionRow txn={t} masked={streetSafe} />
                </li>
              ))}
            </ul>
            <ExpandToggle expanded={showAllRecent} total={recent.length} onToggle={() => setShowAllRecent((v) => !v)} />
          </section>
        )}
      </div>
    </div>
  )
}
