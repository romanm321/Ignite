'use client'

import { ChevronRight } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { useBank } from '../bank-provider'
import { useFeaturedOffers } from '../marketing/placements'
import { EarningRow } from './recent-earnings'
import { useEarnings } from './use-earnings'

/** Cash back, the latest earnings and a pointer to fresh offers, right at the top of Benefits. */
export function CashBackSnapshot() {
  const { accounts, streetSafe, dispatch } = useBank()
  const card = accounts.find((a) => a.kind === 'credit')
  const { ready, events } = useEarnings()
  const offers = useFeaturedOffers()
  const show = (n: number) => (streetSafe ? '••••' : formatMoney(n))

  return (
    <section aria-labelledby="snapshot-h" className="overflow-hidden rounded-3xl bg-forest text-forest-foreground">
      <div className="flex items-end justify-between gap-3 p-5">
        <div>
          <h2 id="snapshot-h" className="text-sm font-medium text-forest-foreground/75">
            Cash back ready to use
          </h2>
          <p className="tabular mt-1 font-mono text-4xl font-semibold leading-none text-lime">{show(ready)}</p>
        </div>
        <button
          type="button"
          onClick={() => (card ? dispatch({ type: 'openRewards', id: card.id }) : dispatch({ type: 'navigate', tab: 'cards' }))}
          className="flex h-11 shrink-0 items-center gap-1 rounded-full bg-lime px-4 text-sm font-semibold text-lime-foreground active:opacity-90"
        >
          Redeem <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      {events.length > 0 && (
        <div className="bg-card text-card-foreground">
          <p className="px-4 pt-3 text-xs font-medium text-muted-foreground">Recent earnings</p>
          <ul className="divide-y">
            {events.slice(0, 3).map((event) => (
              <li key={event.txn.id}>
                <EarningRow event={event} masked={streetSafe} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => dispatch({ type: 'navigate', tab: 'cards' })}
        className="flex min-h-12 w-full items-center justify-between gap-2 bg-accent px-4 text-left text-sm font-semibold text-accent-foreground active:opacity-90"
      >
        <span>{offers.length > 0 ? `${offers.length} offers picked for you` : 'See rewards and offers'}</span>
        <ChevronRight className="size-4 shrink-0" aria-hidden />
      </button>
    </section>
  )
}
