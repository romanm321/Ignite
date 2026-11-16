'use client'

import { useState } from 'react'
import { ArrowLeftRight, Camera, ChevronRight, Compass, Landmark, Receipt, Send, ShieldCheck } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { ZELLE_DAILY_LIMIT } from '@/lib/everyday-data'
import { cn } from '@/lib/utils'
import { STREET_SAFE_CAP, useBank } from '../bank-provider'
import { ScreenHeader, SectionHeader } from '../primitives'
import { HeaderActions } from '../nav'
import { SendGuideSheet } from '../everyday/send-sheets'
import { TransactionRow } from '../transactions/transaction-row'

type Action = { label: string; body: string; icon: typeof Send; run: () => void }

function ActionTile({ action, highlight }: { action: Action; highlight?: boolean }) {
  const { label, body, icon: Icon, run } = action
  return (
    <li>
      <button
        type="button"
        onClick={run}
        className={cn(
          'flex min-h-28 w-full flex-col justify-between gap-3 rounded-3xl p-4 text-left',
          highlight ? 'bg-forest text-forest-foreground' : 'bg-card',
        )}
      >
        <span className={cn('flex size-10 items-center justify-center rounded-xl', highlight ? 'bg-lime text-lime-foreground' : 'bg-muted text-lime')}>
          <Icon className="size-5" aria-hidden />
        </span>
        <span>
          <span className="block font-semibold leading-tight">{label}</span>
          <span className={cn('block truncate text-xs', highlight ? 'text-forest-foreground/70' : 'text-muted-foreground')}>{body}</span>
        </span>
      </button>
    </li>
  )
}

export function PayScreen() {
  const { payees, transactions, owned, streetSafe, dispatch, notify } = useBank()
  const [sheet, setSheet] = useState<'guide' | null>(null)
  const upcoming = payees.filter((p) => !p.paid).sort((a, b) => a.dueIn - b.dueIn).slice(0, 3)
  const recent = transactions.filter((t) => t.category === 'Transfer').slice(0, 4)
  const zelleSentToday = transactions.filter((t) => t.id.startsWith('zl-')).reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const primaryActions: Action[] = [
    { label: 'Send & request', body: 'Friends and family', icon: Send, run: () => dispatch({ type: 'overlay', overlay: 'send' }) },
    { label: 'Wire transfer', body: 'Big or overseas payments', icon: Landmark, run: () => dispatch({ type: 'overlay', overlay: 'wire' }) },
  ]
  const moreActions: Action[] = [
    { label: 'Deposit a check', body: 'Snap a photo', icon: Camera, run: () => dispatch({ type: 'overlay', overlay: 'deposit' }) },
    { label: 'Move money', body: 'Between your accounts', icon: ArrowLeftRight, run: () => dispatch({ type: 'overlay', overlay: 'move' }) },
    { label: 'Pay bills', body: 'Pay and schedule', icon: Receipt, run: () => dispatch({ type: 'overlay', overlay: 'billpay' }) },
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

        <div className="flex flex-col gap-2">
          <ul className="grid grid-cols-2 gap-2">
            {primaryActions.map((a, i) => (
              <ActionTile key={a.label} action={a} highlight={i === 0} />
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setSheet('guide')}
            className="flex min-h-12 items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-card px-4 text-left"
          >
            <Compass className="size-5 shrink-0 text-primary" aria-hidden />
            <span className="flex-1 text-sm">
              <span className="block font-semibold">Not sure which to use?</span>
              <span className="block text-xs text-muted-foreground">We&apos;ll find the best way.</span>
            </span>
          </button>

          <ul className="grid grid-cols-2 gap-2">
            {moreActions.map((a) => (
              <ActionTile key={a.label} action={a} />
            ))}
          </ul>
        </div>

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
            <ul className="divide-y overflow-hidden rounded-3xl bg-card">
              {upcoming.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'overlay', overlay: 'billpay' })}
                    className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-lime">
                      <Receipt className="size-5" aria-hidden />
                    </span>
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
          ) : (
            <p className="rounded-3xl bg-card p-4 text-sm text-muted-foreground">All caught up. Nothing due soon.</p>
          )}
        </section>

        {recent.length > 0 && (
          <section aria-labelledby="recent-transfers-h" className="flex flex-col gap-3">
            <SectionHeader id="recent-transfers-h" title="Recent transfers" />
            <ul className="divide-y overflow-hidden rounded-3xl bg-card">
              {recent.map((t) => (
                <li key={t.id}>
                  <TransactionRow txn={t} masked={streetSafe} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {sheet === 'guide' && (
        <SendGuideSheet
          initialAmount=""
          zelleRemaining={Math.max(0, ZELLE_DAILY_LIMIT - zelleSentToday)}
          wireFeeWaived={owned.includes('complete')}
          onClose={() => setSheet(null)}
          onChoose={(network, scope, amount) => {
            setSheet(null)
            dispatch({ type: 'sendPreset', preset: { amount, scope } })
            dispatch({ type: 'overlay', overlay: network === 'wire' ? 'wire' : 'send' })
            notify(
              network === 'zelle'
                ? 'Zelle it is. Pick who you’re paying.'
                : `${scope === 'international' ? 'International' : 'Domestic'} wire it is. Pick who you’re paying.`,
            )
          }}
        />
      )}
    </div>
  )
}
