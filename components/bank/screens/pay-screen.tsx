'use client'

import { useState } from 'react'
import { ArrowLeftRight, Camera, ChevronRight, CreditCard, Globe, Receipt, Send, ShieldCheck } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { cn } from '@/lib/utils'
import { STREET_SAFE_CAP, useBank } from '../bank-provider'
import { ScreenHeader, SectionHeader } from '../primitives'
import { TediButton } from '../nav'
import { TransferSheet } from '../accounts/transfer-sheet'
import { TransactionRow } from '../transactions/transaction-row'

export function PayScreen() {
  const { accounts, payees, transactions, streetSafe, dispatch } = useBank()
  const [sheet, setSheet] = useState<'move' | 'card' | null>(null)
  const checking = accounts.find((a) => a.kind === 'checking') ?? accounts[0]
  const card = accounts.find((a) => a.kind === 'credit')
  const upcoming = payees.filter((p) => !p.paid).sort((a, b) => a.dueIn - b.dueIn).slice(0, 3)
  const recent = transactions.filter((t) => t.category === 'Transfer').slice(0, 4)

  const actions = [
    { label: 'Send money', body: 'Zelle & wires', icon: Send, run: () => dispatch({ type: 'overlay', overlay: 'send' }) },
    { label: 'Pay bills', body: 'Payees & autopay', icon: Receipt, run: () => dispatch({ type: 'overlay', overlay: 'billpay' }) },
    { label: 'Deposit a check', body: 'Snap a photo', icon: Camera, run: () => dispatch({ type: 'overlay', overlay: 'deposit' }) },
    { label: 'Move money', body: 'Between your accounts', icon: ArrowLeftRight, run: () => setSheet('move') },
    ...(card ? [{ label: 'Pay my card', body: card.name, icon: CreditCard, run: () => setSheet('card') }] : []),
    { label: 'Exchange', body: 'Currencies & wallets', icon: Globe, run: () => dispatch({ type: 'overlay', overlay: 'global' }) },
  ]

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-8">
      <ScreenHeader title="Pay & Transfer" subtitle="Move money your way" right={<TediButton />} />

      <div className="flex flex-col gap-6 px-4 pt-2">
        {streetSafe && (
          <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-accent p-4 text-sm text-accent-foreground">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p className="leading-relaxed">
              <span className="font-semibold">Street Safe is on.</span> Sends and transfers are capped at ${STREET_SAFE_CAP}.
            </p>
          </div>
        )}

        <ul className="grid grid-cols-2 gap-2">
          {actions.map(({ label, body, icon: Icon, run }, i) => (
            <li key={label}>
              <button
                type="button"
                onClick={run}
                className={cn(
                  'flex min-h-28 w-full flex-col justify-between gap-3 rounded-3xl p-4 text-left',
                  i === 0 ? 'bg-forest text-forest-foreground' : 'bg-card',
                )}
              >
                <span
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl',
                    i === 0 ? 'bg-lime text-lime-foreground' : 'bg-muted text-lime',
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold leading-tight">{label}</span>
                  <span className={cn('block truncate text-xs', i === 0 ? 'text-forest-foreground/70' : 'text-muted-foreground')}>
                    {body}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

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

      {sheet === 'move' && checking && <TransferSheet account={checking} mode="out" onClose={() => setSheet(null)} />}
      {sheet === 'card' && card && <TransferSheet account={card} mode="pay" onClose={() => setSheet(null)} />}
    </div>
  )
}
