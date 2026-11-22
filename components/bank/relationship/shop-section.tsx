'use client'

import { useState } from 'react'
import { Check, Puzzle, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { shopStores } from '@/lib/relationship'
import { SectionHeader } from '../primitives'
import { useBank } from '../bank-provider'

export function ShopSection() {
  const { notify } = useBank()
  const [installed, setInstalled] = useState(false)

  return (
    <section aria-labelledby="shop-h" className="flex flex-col gap-3">
      <SectionHeader id="shop-h" title="Earn while you shop online" />
      <div className="rounded-3xl bg-card p-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-forest text-lime">
            <ShoppingBag className="size-[18px]" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium leading-tight">Up to 10% back at 2,000+ stores</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Your TD relationship follows you to checkout, in the app and in your browser.</p>
          </div>
        </div>

        <ul className="no-scrollbar -mx-3 mt-2.5 flex gap-1.5 overflow-x-auto px-3" aria-label="Featured stores">
          {shopStores.map((s) => (
            <li key={s.name} className="shrink-0">
              <button
                type="button"
                onClick={() => notify(`Opening ${s.name}. ${s.rate}% cash back is tracked for you.`)}
                className="flex min-h-11 flex-col items-start justify-center rounded-lg bg-muted px-3 text-left"
              >
                <span className="text-xs font-semibold">{s.name}</span>
                <span className="text-xs font-semibold text-primary">{s.rate}% back</span>
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          aria-pressed={installed}
          onClick={() => {
            setInstalled((v) => !v)
            notify(installed ? 'TD Rewards removed from your browser' : 'TD Rewards added. Cash back now applies at checkout.')
          }}
          className={cn(
            'mt-2.5 flex h-9 w-full items-center justify-center gap-2 rounded-lg text-xs font-semibold',
            installed ? 'bg-lime text-lime-foreground' : 'bg-primary text-primary-foreground',
          )}
        >
          {installed ? (
            <>
              <Check className="size-4" aria-hidden /> Browser extension on
            </>
          ) : (
            <>
              <Puzzle className="size-4" aria-hidden /> Add TD Rewards to your browser
            </>
          )}
        </button>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          {installed ? 'We find coupons and apply your cash back at checkout.' : 'Finds coupons and applies cash back at checkout. Free.'}
        </p>
      </div>
    </section>
  )
}
