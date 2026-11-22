'use client'

import { Gem, PiggyBank, TrendingUp, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductId } from '@/lib/offers'
import { useBank } from '../bank-provider'

type Featured = { id: ProductId; icon: LucideIcon; title: string; body: string; accountId: string }

const featuredProducts: Record<'complete' | 'auto-invest' | 'growth-savings', Featured> = {
  complete: { id: 'complete', icon: Gem, title: 'Complete', body: '5.10% sweep, a banker', accountId: 'complete' },
  'auto-invest': { id: 'auto-invest', icon: TrendingUp, title: 'Auto Invest', body: 'A portfolio from $5', accountId: 'auto-invest' },
  'growth-savings': { id: 'growth-savings', icon: PiggyBank, title: 'Growth Savings', body: '4.60% interest, with Vaults', accountId: 'sav-new' },
}

/** The two products worth a look first. Maya sees Complete and Auto Invest, a new customer sees Growth Savings and Complete. */
export function featuredFor(customerType: 'existing' | 'new'): [Featured, Featured] {
  return customerType === 'new'
    ? [featuredProducts['growth-savings'], featuredProducts.complete]
    : [featuredProducts.complete, featuredProducts['auto-invest']]
}

export function ExploreAccountsCard() {
  const { customerType, owned, dispatch } = useBank()
  const tiles = featuredFor(customerType)

  return (
    <section aria-labelledby="explore-h" className="flex flex-col gap-3">
      <h2 id="explore-h" className="text-lg font-semibold">
        An account for every chapter
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t, i) => {
          const Icon = t.icon
          const left = i === 0
          return (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                owned.includes(t.id) ? dispatch({ type: 'openAccount', id: t.accountId }) : dispatch({ type: 'startOnboarding', productId: t.id })
              }
              className={cn(
                'flex min-h-18 items-center gap-3 rounded-2xl p-3 text-left',
                left ? 'bg-lime text-lime-foreground' : 'bg-forest text-forest-foreground',
              )}
            >
              <Icon className={cn('size-6 shrink-0', !left && 'text-lime')} aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{t.title}</span>
                <span className={cn('mt-0.5 block text-xs leading-snug', left ? 'opacity-80' : 'text-forest-foreground/75')}>{t.body}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
