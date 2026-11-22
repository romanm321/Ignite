'use client'

import { useState } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { BigAmount } from '../big-amount'
import { EarningRow } from './recent-earnings'
import { useEarnings } from './use-earnings'

const COLLAPSED_COUNT = 3

/** Credit card cash back: a slim header with Redeem, then the latest earnings, expandable. */
export function CreditCashBack({ enrolled }: { enrolled: string[] }) {
  const { accounts, streetSafe, dispatch } = useBank()
  const { ready, events } = useEarnings(enrolled)
  const [expanded, setExpanded] = useState(false)
  const card = accounts.find((a) => a.kind === 'credit')
  const show = (n: number) => (streetSafe ? '••••' : formatMoney(n))
  const visible = expanded ? events : events.slice(0, COLLAPSED_COUNT)

  return (
    <section aria-labelledby="cashback-h" className="flex flex-col gap-3">
      <h2 id="cashback-h" className="px-1 text-lg text-muted-foreground">
        Credit card cash back
      </h2>
      <div className="overflow-hidden rounded-3xl bg-card text-foreground">
        <div className="flex items-center justify-between gap-3 bg-forest px-4 py-3 text-white">
          <div className="min-w-0">
            <p className="text-xs text-white/80">Ready to use</p>
            <BigAmount value={show(ready)} className="block text-3xl" />
          </div>
          {card && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'openRewards', id: card.id })}
              className="flex h-10 shrink-0 items-center gap-2 rounded-xl border-2 border-white px-4 text-sm font-semibold text-white outline-offset-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white active:bg-white/20"
            >
              <ArrowRight className="size-4" aria-hidden /> Redeem
            </button>
          )}
        </div>

        {events.length > 0 && (
          <div>
            <p className="px-4 pt-3 text-xs font-medium text-muted-foreground">Recent earnings</p>
            <ul className="divide-y">
              {visible.map((event) => (
                <li key={event.txn.id}>
                  <EarningRow event={event} masked={streetSafe} />
                </li>
              ))}
            </ul>
            {events.length > COLLAPSED_COUNT && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="flex min-h-11 w-full items-center justify-center gap-1 border-t text-sm font-semibold text-primary"
              >
                {expanded ? 'Show less' : `Show ${events.length - COLLAPSED_COUNT} more`}
                <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} aria-hidden />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
