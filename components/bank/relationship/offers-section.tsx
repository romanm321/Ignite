'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/bank-data'
import { dealOffers, offerSpend, type OfferCategory } from '@/lib/relationship'
import { SectionHeader } from '../primitives'
import { useBank } from '../bank-provider'

const filters: ('All' | OfferCategory)[] = ['All', 'Dining', 'Shopping', 'Local']

/** Made-up logos for the demo merchants, in public/images/merchants. */
const merchantLogo: Record<string, string> = {
  lucali: '/images/merchants/lucali.png',
  'blue-bottle': '/images/merchants/blue-bottle.png',
  sweetgreen: '/images/merchants/sweetgreen.png',
  uniqlo: '/images/merchants/uniqlo.png',
  sephora: '/images/merchants/sephora.png',
  cleaners: '/images/merchants/mercer-street.png',
  bikes: '/images/merchants/kings-county.png',
}

export function OffersSection({ enrolled, onToggle }: { enrolled: string[]; onToggle: (id: string) => void }) {
  const { transactions, customerType, notify } = useBank()
  const [filter, setFilter] = useState<'All' | OfferCategory>('All')
  const [showAll, setShowAll] = useState(false)

  const matches = dealOffers.filter((o) => filter === 'All' || o.category === filter)
  const visible = showAll ? matches : matches.slice(0, 4)

  return (
    <section aria-labelledby="deals-h" className="flex flex-col gap-3">
      <SectionHeader id="deals-h" title="Deals picked for you" />
      <div role="group" aria-label="Offer categories" className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => {
              setFilter(f)
              setShowAll(false)
            }}
            className={cn(
              'h-9 shrink-0 rounded-lg px-3 text-xs font-semibold',
              filter === f ? 'bg-forest text-forest-foreground' : 'bg-card',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="divide-y overflow-hidden rounded-3xl bg-card">
        {visible.map((o) => {
          const on = !o.needsActivation || enrolled.includes(o.id)
          const spend = offerSpend(o, transactions)
          const reason = spend > 0 ? `You spent ${formatMoney(spend)} here recently` : customerType === 'new' ? 'Picked for new members' : 'Popular near you'
          return (
            <li key={o.id} className="flex min-h-14 items-center gap-3 px-4 py-2">
              <span aria-hidden className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white text-base font-semibold text-accent-foreground">
                {merchantLogo[o.id] ? (
                  <Image src={merchantLogo[o.id]} alt="" fill sizes="36px" className="object-cover" />
                ) : (
                  o.merchant[0]
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{o.merchant}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  <span className="font-semibold text-primary">{o.rate}% back</span> · {o.area}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{reason}</span>
              </span>
              {o.needsActivation ? (
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    onToggle(o.id)
                    notify(on ? `${o.merchant} offer turned off` : `${o.merchant} activated. Pay with your TD card to earn ${o.rate}%.`)
                  }}
                  className={cn(
                    'flex h-9 min-w-[76px] shrink-0 items-center justify-center gap-1 rounded-lg px-3 text-xs font-semibold',
                    on ? 'bg-lime text-lime-foreground' : 'border-2 border-primary text-primary',
                  )}
                >
                  {on ? (
                    <>
                      <Check className="size-4" aria-hidden /> On
                    </>
                  ) : (
                    'Activate'
                  )}
                </button>
              ) : (
                <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">Auto-on</span>
              )}
            </li>
          )
        })}
      </ul>

      {matches.length > 4 && (
        <button type="button" onClick={() => setShowAll((s) => !s)} className="h-11 rounded-xl text-sm font-semibold text-primary">
          {showAll ? 'Show fewer offers' : `See all ${matches.length} offers`}
        </button>
      )}
    </section>
  )
}
