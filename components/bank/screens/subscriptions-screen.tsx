'use client'

import { useState } from 'react'
import { ChevronRight, Lock, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/bank-data'
import { enrich, type Enrichment } from '@/lib/enrichment'
import { useBank } from '../bank-provider'
import { OverlayFrame } from '../overlay'
import { Pill } from '../primitives'
import { MerchantLogo } from '../transactions/merchant-logo'
import { ManageSubscriptionSheet } from '../transactions/manage-subscription-sheet'

export function SubscriptionsScreen() {
  const { transactions, subs, dispatch } = useBank()
  const [managing, setManaging] = useState<{ e: Enrichment; amount: number } | null>(null)

  const items = transactions
    .map((t) => ({ t, e: enrich(t) }))
    .filter(({ e }) => e.subscription)
    .map(({ t, e }) => ({ t, e, state: subs[e.subscription!.id], amount: Math.abs(t.amount) }))

  const active = items.filter((i) => i.state.status === 'active')
  const monthly = active.reduce((s, i) => s + i.amount, 0)
  const flagged = active.filter((i) => i.e.subscription?.insight)
  const saved = items.filter((i) => i.state.status !== 'active').reduce((s, i) => s + i.amount * 12, 0)

  return (
    <OverlayFrame title="Subscriptions" onBack={() => dispatch({ type: 'overlay', overlay: null })}>
      <div className="flex flex-col gap-4 px-4">
        <section className="rounded-3xl bg-forest p-5 text-forest-foreground">
          <p className="text-sm opacity-70">You pay each month</p>
          <p className="tabular mt-1 font-mono text-4xl font-semibold tracking-tight">{formatMoney(monthly)}</p>
          <p className="mt-1 text-sm opacity-80">
            {active.length} active · {formatMoney(monthly * 12)} a year
          </p>
          {saved > 0 && (
            <p className="mt-3 inline-flex rounded-full bg-lime px-3 py-1 text-sm font-semibold text-lime-foreground">
              Saving {formatMoney(saved)}/yr from changes
            </p>
          )}
        </section>

        {flagged.length > 0 && (
          <section aria-labelledby="flag-h" className="flex flex-col gap-2">
            <h2 id="flag-h" className="px-1 text-sm font-semibold">
              Worth a look
            </h2>
            {flagged.map(({ e, amount }) => (
              <button
                key={e.name}
                type="button"
                onClick={() => setManaging({ e, amount })}
                className="flex items-start gap-3 rounded-2xl border border-lime bg-lime/25 p-4 text-left"
              >
                <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                <span className="flex-1 text-sm">
                  <span className="block font-semibold">{e.name}</span>
                  <span className="block text-muted-foreground">{e.subscription!.insight!.text}</span>
                </span>
                <span className="self-center text-sm font-semibold text-primary">Review</span>
              </button>
            ))}
          </section>
        )}

        <section aria-labelledby="all-h">
          <h2 id="all-h" className="mb-2 px-1 text-sm font-semibold">
            All subscriptions
          </h2>
          <ul className="divide-y overflow-hidden rounded-3xl bg-card">
            {items.map(({ t, e, state, amount }) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setManaging({ e, amount })}
                  className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <MerchantLogo enrichment={e} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{e.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {state.status === 'active' ? `Next ${e.subscription!.nextDate} · ${state.card.split(' ').pop()}` : `${e.subscription!.plan}`}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <span className={cn('tabular font-mono text-sm font-semibold', state.status !== 'active' && 'text-muted-foreground line-through')}>
                      {formatMoney(amount)}
                    </span>
                    {state.status !== 'active' && (
                      <Pill className="bg-muted text-muted-foreground">{state.status === 'paused' ? 'Paused' : 'Canceled'}</Pill>
                    )}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <p className="flex items-start gap-2 px-1 pb-4 text-xs leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          We spot subscriptions from your transactions. Cancel, pause, or switch cards right here, connected securely through
          Atomic. Demo simulation.
        </p>
      </div>

      {managing && (
        <ManageSubscriptionSheet enrichment={managing.e} amount={managing.amount} onClose={() => setManaging(null)} />
      )}
    </OverlayFrame>
  )
}
