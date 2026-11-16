'use client'

import { ChevronRight, Crown } from 'lucide-react'
import { useBank } from '../bank-provider'
import { useRelationship } from './use-relationship'

export function TierBanner() {
  const { tier } = useRelationship()
  const { dispatch } = useBank()

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'navigate', tab: 'rewards' })}
      className="relative flex min-h-12 w-full items-center gap-2 overflow-hidden rounded-2xl bg-forest py-2 pl-2.5 pr-3 text-left text-forest-foreground"
    >
      <span aria-hidden className="absolute -right-8 -top-8 size-24 rounded-full bg-lime/15" />
      <span className="relative inline-flex items-center gap-1.5 rounded-full bg-lime px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-lime-foreground">
        <Crown className="size-3.5" aria-hidden /> {tier.name}
      </span>
      <span className="relative flex-1 text-xs text-forest-foreground/70">Your status</span>
      <ChevronRight className="relative size-4 shrink-0 text-forest-foreground/70" aria-hidden />
    </button>
  )
}
