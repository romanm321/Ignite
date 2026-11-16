'use client'

import { ChevronRight } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { enrich } from '@/lib/enrichment'
import { useBank } from '../bank-provider'
import { SectionHeader } from '../primitives'
import { MerchantLogo } from '../transactions/merchant-logo'
import { useEarnings, type EarningEvent } from './use-earnings'

export function EarningRow({ event, masked }: { event: EarningEvent; masked: boolean }) {
  const { dispatch } = useBank()
  const e = enrich(event.txn)
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'openTxn', id: event.txn.id })}
      className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left active:bg-muted/60"
    >
      <MerchantLogo enrichment={e} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{e.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {event.detail} · {event.txn.when}
        </span>
      </span>
      <span className="tabular shrink-0 font-mono text-sm font-semibold text-primary">
        {masked ? '••••' : `+${formatMoney(event.amount)}`}
      </span>
    </button>
  )
}

/** The latest purchases that earned cash back, newest first. */
export function RecentEarnings({ enrolled, limit = 5 }: { enrolled: string[]; limit?: number }) {
  const { accounts, streetSafe, dispatch } = useBank()
  const { events } = useEarnings(enrolled)
  const card = accounts.find((a) => a.kind === 'credit')
  if (events.length === 0) return null

  return (
    <section aria-labelledby="earnings-h" className="flex flex-col gap-3">
      <SectionHeader
        id="earnings-h"
        title="Recent earnings"
        action={
          card ? (
            <button
              type="button"
              onClick={() => dispatch({ type: 'openRewards', id: card.id })}
              className="flex h-9 items-center gap-0.5 text-sm font-medium text-primary"
            >
              See all <ChevronRight className="size-4" aria-hidden />
            </button>
          ) : undefined
        }
      />
      <ul className="divide-y overflow-hidden rounded-3xl bg-card">
        {events.slice(0, limit).map((event) => (
          <li key={event.txn.id}>
            <EarningRow event={event} masked={streetSafe} />
          </li>
        ))}
      </ul>
    </section>
  )
}
